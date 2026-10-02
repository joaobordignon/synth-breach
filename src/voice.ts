// HEX voice narration via the browser's built-in SpeechSynthesis (Web Speech
// API) — no backend, no audio assets. Speaks each HEX comms transmission with
// a measured, slightly-lowered mentor tone and exposes a speaking signal the
// face visualizer uses to animate the mask's mouth.

let enabled = false;
let chosenVoice: SpeechSynthesisVoice | null = null;
let desiredName: string | null = null; // persisted voice preference, by name
let rate = 0.98;
let pitch = 0.85;

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

export function voiceSupported(): boolean {
  return synth() !== null;
}

function pickVoice() {
  const s = synth();
  if (!s) return;
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

/** Strip stage directions and shell syntax noise so narration sounds natural. */
function clean(text: string): string {
  return text
    .replace(/\([^)]*\)/g, "") // (a long pause) etc.
    .replace(/`[^`]*`/g, "") // inline command snippets
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
  const s = synth();
  if (!enabled || !s) return;
  const spoken = clean(text);
  if (!spoken) return;
  try {
    // Some engines get wedged in a paused state; nudge them first.
    s.resume();
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
}

export function isSpeaking(): boolean {
  const s = synth();
  return s ? s.speaking : false;
}

export function setVoiceTuning(nextRate: number, nextPitch: number): void {
  rate = nextRate;
  pitch = nextPitch;
}
