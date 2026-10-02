// HEX voice narration via the browser's built-in SpeechSynthesis (Web Speech
// API) — no backend, no audio assets. Speaks each HEX comms transmission with
// a measured, slightly-lowered mentor tone and exposes a speaking signal the
// face visualizer uses to animate the mask's mouth.

let enabled = false;
let chosenVoice: SpeechSynthesisVoice | null = null;
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
  // Prefer a deeper/neutral English voice for HEX; fall back to any English.
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

export function speak(text: string): void {
  const s = synth();
  if (!enabled || !s) return;
  const spoken = clean(text);
  if (!spoken) return;
  try {
    const u = new SpeechSynthesisUtterance(spoken);
    if (chosenVoice) u.voice = chosenVoice;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 0.9;
    s.speak(u);
  } catch {
    // Speech can throw if the engine is unavailable mid-session; ignore.
  }
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
