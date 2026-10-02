// HEX voice narration via the browser's built-in SpeechSynthesis (Web Speech
// API) — no backend, no audio assets. Speaks each HEX comms transmission with
// a measured, slightly-lowered mentor tone and exposes a speaking signal the
// face visualizer uses to animate the mask's mouth.

let enabled = false;
let chosenVoice: SpeechSynthesisVoice | null = null;
let desiredName: string | null = null; // persisted voice preference, by name
let rate = 0.98;
let pitch = 0.85;

// Built-in retro robotic voice (SAM — Software Automatic Mouth, 1982), lazy
// loaded. It needs no OS speech voices, so HEX can always talk — and it fits a
// 1989 netrunner perfectly. Used when explicitly picked, or as the automatic
// fallback when the browser/OS exposes no SpeechSynthesis voices at all.
export const SYNTH_VOICE = "__HEX_SYNTH__";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let samInstance: any = null;
const samQueue: string[] = [];
let samBusy = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let samCurrent: any = null;

async function ensureSam() {
  if (!samInstance) {
    const mod = await import("sam-js");
    // sam-js uses `export =`; the constructor is the default under interop.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SamJs = ((mod as any).default ?? mod) as any;
    samInstance = new SamJs({ speed: 72, pitch: 70, mouth: 128, throat: 160 });
  }
  return samInstance;
}

function sanitizeForSam(text: string): string {
  // SAM speaks ASCII English; drop anything it would choke on.
  return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s{2,}/g, " ").trim();
}

async function processSamQueue() {
  if (samBusy) return;
  samBusy = true;
  try {
    const sam = await ensureSam();
    while (samQueue.length) {
      const part = samQueue.shift()!;
      try {
        samCurrent = sam.speak(part);
        await samCurrent;
      } catch {
        /* aborted or failed — continue */
      }
    }
  } catch {
    /* SAM failed to load; give up quietly */
  }
  samCurrent = null;
  samBusy = false;
}

function speakSam(text: string): void {
  for (const part of chunk(sanitizeForSam(text))) if (part) samQueue.push(part);
  void processSamQueue();
}

function hasOsVoices(): boolean {
  const s = synth();
  return !!s && s.getVoices().length > 0;
}

/** Whether speech should route through the built-in SAM synth. */
function useSynth(): boolean {
  return desiredName === SYNTH_VOICE || !hasOsVoices();
}

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

export function voiceSupported(): boolean {
  // Always true: even with no OS SpeechSynthesis voices, the bundled SAM synth
  // (Web Audio) can speak. Guard only against a total lack of Web Audio.
  return typeof window !== "undefined" && (synth() !== null || typeof AudioContext !== "undefined");
}

function pickVoice() {
  const s = synth();
  if (!s) return;
  if (desiredName === SYNTH_VOICE) {
    chosenVoice = null; // handled by the SAM synth path
    return;
  }
  const voices = s.getVoices();
  if (voices.length === 0) return;
  // An explicit, remembered choice always wins.
  if (desiredName) {
    const match = voices.find((v) => v.name === desiredName);
    if (match) {
      chosenVoice = match;
      return;
    }
  }
  // Otherwise prefer a deeper/neutral English voice for HEX.
  const prefer = [
    /Google UK English Male/i,
    /Daniel/i,
    /Microsoft (Guy|Ryan|David)/i,
    /\ben-GB\b/i,
    /\ben-US\b/i,
    /English/i,
  ];
  for (const re of prefer) {
    const v = voices.find((vo) => re.test(vo.name) || re.test(vo.lang));
    if (v) {
      chosenVoice = v;
      return;
    }
  }
  chosenVoice = voices[0];
}

/** All voices the browser/OS offers (English first, then the rest). */
export function listVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  const voices = s.getVoices();
  return [...voices].sort((a, b) => {
    const ae = /^en/i.test(a.lang) ? 0 : 1;
    const be = /^en/i.test(b.lang) ? 0 : 1;
    return ae - be || a.name.localeCompare(b.name);
  });
}

/** Remember and apply a voice choice by name (persisted via the profile). */
export function setVoiceByName(name: string | null): void {
  desiredName = name && name.length > 0 ? name : null;
  pickVoice();
}

export function getVoiceName(): string | null {
  return chosenVoice?.name ?? null;
}

/** Subscribe to the browser's async voice-list population. */
export function onVoices(cb: () => void): () => void {
  const s = synth();
  if (!s) return () => {};
  const handler = () => cb();
  s.addEventListener("voiceschanged", handler);
  return () => s.removeEventListener("voiceschanged", handler);
}

/** Speak a sample regardless of the on/off toggle — for the "test voice" button. */
export function testSpeak(text: string): void {
  const wasEnabled = enabled;
  enabled = true;
  speak(text);
  enabled = wasEnabled;
}

// Voices load asynchronously in most browsers.
if (voiceSupported()) {
  pickVoice();
  synth()!.onvoiceschanged = pickVoice;
}

/** Strip stage directions and shell syntax noise so narration sounds natural.
 *  Command words in `backticks` are READ — we drop only the backticks, not the
 *  word — so HEX actually says "type help", not "type …". */
function clean(text: string): string {
  return text
    .replace(/\([^)]*\)/g, "") // (a long pause) etc. — stage directions, not spoken
    .replace(/`([^`]*)`/g, "$1") // keep the word inside `backticks`, drop the ticks
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function setVoiceEnabled(next: boolean): void {
  enabled = next;
  if (!next) cancelVoice();
}

export function isVoiceEnabled(): boolean {
  return enabled;
}

// Chrome silently stops utterances longer than ~15s, so split a line into
// sentence-ish chunks and queue them back to back.
function chunk(text: string): string[] {
  const parts = text.match(/[^.!?—]+[.!?—]*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const p of parts) {
    if ((cur + p).length > 160) {
      if (cur.trim()) out.push(cur.trim());
      cur = p;
    } else {
      cur += p;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function speak(text: string): void {
  if (!enabled) return;
  const spoken = clean(text);
  if (!spoken) return;
  // Route through the built-in SAM synth when chosen, or when the OS exposes no
  // speech voices at all (so HEX can always be heard).
  if (useSynth()) {
    speakSam(spoken);
    return;
  }
  const s = synth();
  if (!s) return;
  try {
    s.resume(); // some engines get wedged in a paused state
    if (!chosenVoice) pickVoice();
    for (const part of chunk(spoken)) {
      const u = new SpeechSynthesisUtterance(part);
      if (chosenVoice) u.voice = chosenVoice;
      u.rate = rate;
      u.pitch = pitch;
      u.volume = 1;
      s.speak(u);
    }
  } catch {
    // Speech can throw if the engine is unavailable mid-session; ignore.
  }
}

/** Called from a click handler to unlock audio and confirm it works. */
export function primeVoice(sample?: string): void {
  const s = synth();
  if (!s) return;
  try {
    s.resume();
    if (!chosenVoice) pickVoice();
  } catch {
    /* ignore */
  }
  if (sample) speak(sample);
}

export function cancelVoice(): void {
  const s = synth();
  if (s) {
    try {
      s.cancel();
    } catch {
      /* ignore */
    }
  }
  // Stop the SAM synth too.
  samQueue.length = 0;
  if (samCurrent && typeof samCurrent.abort === "function") {
    try {
      samCurrent.abort("cancelled");
    } catch {
      /* ignore */
    }
  }
}

export function isSpeaking(): boolean {
  if (samBusy) return true;
  const s = synth();
  return s ? s.speaking : false;
}

export function setVoiceTuning(nextRate: number, nextPitch: number): void {
  rate = nextRate;
  pitch = nextPitch;
}
