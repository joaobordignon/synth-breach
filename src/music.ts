// Generative synthwave / lo-fi background score. No audio files — an evolving
// loop (warm pad + sub bass + filtered arpeggio) is synthesized live with Web
// Audio using a lookahead scheduler. Licensing-free, tiny, and on-theme. A
// real track can be dropped in later behind the same play/stop/volume API.

import { getAudioContext } from "./audio";

// A minor synthwave progression: i – VI – III – VII (Am – F – C – G).
// Each entry: chord root MIDI + the chord's scale tones used for pad/arp.
const PROGRESSION: Array<{ bass: number; chord: number[] }> = [
  { bass: 45, chord: [57, 60, 64] }, // Am
  { bass: 41, chord: [53, 57, 60] }, // F
  { bass: 48, chord: [60, 64, 67] }, // C
  { bass: 43, chord: [55, 59, 62] }, // G
];

const BPM = 82;
const SECONDS_PER_BEAT = 60 / BPM;
const LOOKAHEAD_MS = 100;
const SCHEDULE_AHEAD = 0.25; // seconds

let playing = false;
let volume = 0.35;
let masterGain: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let nextNoteTime = 0;
let step = 0; // eighth-note counter

function midiToFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function ensureGraph(ctx: AudioContext) {
  if (masterGain) return;
  masterGain = ctx.createGain();
  masterGain.gain.value = volume;
  filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1600;
  filter.Q.value = 0.6;
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);
}

function voice(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  detune = 0,
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  // Soft attack / release so nothing clicks.
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function scheduleStep(ctx: AudioContext, when: number) {
  const barsPerChord = 2;
  const chordIndex = Math.floor(step / (8 * barsPerChord)) % PROGRESSION.length;
  const { bass, chord } = PROGRESSION[chordIndex];
  const beatInBar = step % 8;
  const target = filter!;

  // Pad: sustain the full chord at the top of each chord change (every 2 bars).
  if (step % (8 * barsPerChord) === 0) {
    const padDur = SECONDS_PER_BEAT * 4 * barsPerChord;
    for (const n of chord) {
      voice(ctx, target, midiToFreq(n), when, padDur, "triangle", 0.09, -6);
      voice(ctx, target, midiToFreq(n), when, padDur, "sine", 0.06, +6);
    }
  }

  // Sub bass: root on beats 1 and 3 (steps 0 and 4 within the bar).
  if (beatInBar === 0 || beatInBar === 4) {
    voice(ctx, masterGain!, midiToFreq(bass - 12), when, SECONDS_PER_BEAT * 1.5, "sawtooth", 0.12);
  }

  // Arp: eighth notes walking the chord tones, one octave up.
  const arpNote = chord[(step % chord.length)] + 12;
  voice(ctx, target, midiToFreq(arpNote), when, SECONDS_PER_BEAT * 0.45, "square", 0.045, 4);

  step += 1;
}

function loop() {
  const ctx = getAudioContext();
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(ctx, nextNoteTime);
    nextNoteTime += SECONDS_PER_BEAT / 2; // eighth notes
  }
}

export function startMusic(): void {
  if (playing) return;
  const ctx = getAudioContext();
  ensureGraph(ctx);
  masterGain!.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
  playing = true;
  step = 0;
  nextNoteTime = ctx.currentTime + 0.1;
  loop();
  timer = setInterval(loop, LOOKAHEAD_MS);
}

export function stopMusic(): void {
  if (!playing) return;
  playing = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const ctx = getAudioContext();
  if (masterGain) masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
}

export function toggleMusic(): boolean {
  if (playing) stopMusic();
  else startMusic();
  return playing;
}

export function isMusicPlaying(): boolean {
  return playing;
}

export function setMusicVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) {
    const ctx = getAudioContext();
    masterGain.gain.setTargetAtTime(playing ? volume : 0.0001, ctx.currentTime, 0.2);
  }
}

export function getMusicVolume(): number {
  return volume;
}
