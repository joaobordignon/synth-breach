// Web Audio SFX controller. No external audio assets required — every
// effect is a short synthesized tone, generated on demand via an
// OscillatorNode. See docs/SPEC.md §9 for the intended sound design.

let ctx: AudioContext | null = null;
let muted = false;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

/** Shared AudioContext for the music engine (music.ts); resumes if suspended. */
export function getAudioContext(): AudioContext {
  const c = getContext();
  if (c.state === "suspended") void c.resume();
  return c;
}

function beep(frequency: number, durationMs: number, type: OscillatorType = "sine", gain = 0.05) {
  if (muted) return;
  const audioCtx = getContext();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = gain;

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + durationMs / 1000);
}

export function setMuted(next: boolean): void {
  muted = next;
}

export function isMuted(): boolean {
  return muted;
}

export function playTypingFx(): void {
  beep(1800, 12, "square", 0.02);
}

export function playSuccessChime(): void {
  // Ascending three-note chime.
  [660, 880, 1320].forEach((freq, i) => {
    setTimeout(() => beep(freq, 120, "triangle", 0.06), i * 90);
  });
}

export function playAlarmBuzzer(): void {
  beep(140, 300, "sawtooth", 0.08);
}
