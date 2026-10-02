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

function startGenerative(): void {
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

function stopGenerative(): void {
  if (!playing) return;
  playing = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const ctx = getAudioContext();
  if (masterGain) masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
}

// ---------------------------------------------------------------------------
// Public API: cycle through a playlist of bundled royalty-free tracks
// (public/music/*.mp3, auto-listed in playlist.json by scripts/gen-playlist.mjs
// — e.g. Pixabay synthwave, free for commercial use). The set is shuffled, each
// track advances to the next when it ends, and the playlist loops. If no tracks
// are present (or the browser can't play them), fall back to the generative
// synthwave engine above so music always works.
// ---------------------------------------------------------------------------
let audioEl: HTMLAudioElement | null = null;
let mode: "file" | "gen" | null = null;
let playlist: string[] = [];
let trackIndex = 0;
let failures = 0;

function base(): string {
  return (import.meta.env.BASE_URL as string | undefined) ?? "./";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadPlaylist(): Promise<string[]> {
  try {
    const res = await fetch(`${base()}music/playlist.json`, { cache: "no-cache" });
    if (!res.ok) return [];
    const list = (await res.json()) as unknown;
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function fallbackToGenerative() {
  if (audioEl) {
    audioEl.pause();
    audioEl = null;
  }
  startGenerative();
  mode = "gen";
}

function onEnded() {
  playTrack(trackIndex + 1); // cycle to next
}
function onError() {
  if (mode !== "file") return; // ignore errors fired while stopping
  failures += 1;
  if (failures >= playlist.length) fallbackToGenerative(); // none playable
  else playTrack(trackIndex + 1);
}
function onPlaying() {
  failures = 0;
}

function playTrack(i: number) {
  if (mode !== "file" || playlist.length === 0) return; // not playing a file playlist
  trackIndex = ((i % playlist.length) + playlist.length) % playlist.length;
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.addEventListener("ended", onEnded);
    audioEl.addEventListener("error", onError);
    audioEl.addEventListener("playing", onPlaying);
  }
  audioEl.src = `${base()}music/${playlist[trackIndex]}`;
  audioEl.loop = false;
  audioEl.volume = volume;
  audioEl.play().catch(() => {
    // Autoplay blocked before any gesture; leave it — App retries on gesture.
  });
}

export function startMusic(): void {
  if (mode) {
    setMusicVolume(volume);
    return;
  }
  mode = "file"; // optimistic; may flip to "gen" on fallback
  failures = 0;
  void loadPlaylist().then((list) => {
    if (mode !== "file") return; // stopped meanwhile
    if (list.length === 0) {
      fallbackToGenerative();
      return;
    }
    playlist = shuffle(list);
    playTrack(0);
  });
}

export function stopMusic(): void {
  mode = null; // set first so pending handlers/callbacks no-op
  if (audioEl) {
    audioEl.removeEventListener("ended", onEnded);
    audioEl.removeEventListener("error", onError);
    audioEl.removeEventListener("playing", onPlaying);
    audioEl.pause();
    audioEl = null;
  }
  stopGenerative();
}

/** Skip to the next track in the playlist (no-op in generative mode). */
export function nextTrack(): void {
  if (mode === "file" && playlist.length > 0) playTrack(trackIndex + 1);
}

export function toggleMusic(): boolean {
  if (mode) stopMusic();
  else startMusic();
  return mode !== null;
}

export function isMusicPlaying(): boolean {
  return mode !== null;
}

export function setMusicVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  if (audioEl) audioEl.volume = volume;
  if (masterGain) {
    const ctx = getAudioContext();
    masterGain.gain.setTargetAtTime(playing ? volume : 0.0001, ctx.currentTime, 0.2);
  }
}

export function getMusicVolume(): number {
  return volume;
}
