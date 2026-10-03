// Build step: scan public/music/ for audio files and write playlist.json so
// the player can cycle through whatever tracks are present — no manual list to
// maintain. Runs automatically before `dev` and `build` (npm pre* lifecycle).
import { readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "public", "music");
const AUDIO = /\.(mp3|ogg|m4a|wav|flac)$/i;

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const tracks = readdirSync(dir)
  .filter((f) => AUDIO.test(f))
  .sort();

writeFileSync(join(dir, "playlist.json"), JSON.stringify(tracks, null, 2) + "\n");
console.log(`[gen-playlist] ${tracks.length} track(s): ${tracks.join(", ") || "(none — generative fallback)"}`);
