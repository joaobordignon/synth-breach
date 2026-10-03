import { SAVE_KEY } from "../config";

// Player progress, score, and settings — save/load via localStorage.
// Same shape the original design kept at ~/.config/synth-breach/profile.json.
export interface PlayerProfile {
  handle: string;
  unlockedEpisodes: number[]; // 0 = Prologue, 1-12 = Episodes
  score: number;
  achievements: string[];
  audioMuted: boolean;
  musicEnabled: boolean;
  musicVolume: number; // 0..1
  voiceEnabled: boolean;
  /** Chosen SpeechSynthesis voice name, or null for the auto default. */
  voiceName?: string | null;
  /** How warmly the player has answered HEX across the campaign (sum of warm
   *  reply choices). Read back once at the ending to tailor HEX's farewell. */
  bond?: number;
  /** Last local write time (ms). */
  updatedAt?: number;
}

export function defaultProfile(): PlayerProfile {
  return {
    handle: "CYBER//ZERO",
    unlockedEpisodes: [0],
    score: 0,
    achievements: [],
    audioMuted: false,
    musicEnabled: false,
    musicVolume: 0.35,
    voiceEnabled: false,
    voiceName: null,
    bond: 0,
    updatedAt: 0,
  };
}

// Only these fields are restored from localStorage on boot. Campaign PROGRESS
// (unlockedEpisodes, score, achievements, bond) is deliberately NOT restored —
// the game never silently resumes an old run from browser storage. Progress
// lives only in the downloadable .synthsave file; `load` / LOAD GAME continues.
const SETTING_KEYS: (keyof PlayerProfile)[] = [
  "handle",
  "audioMuted",
  "musicEnabled",
  "musicVolume",
  "voiceEnabled",
  "voiceName",
];

/**
 * Boot profile: a fresh campaign (Prologue, score 0, no badges) carrying only
 * the player's persisted *settings* forward. Continuation across sessions is
 * the save file, not localStorage.
 */
export function loadSettings(): PlayerProfile {
  const base = defaultProfile();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const stored = JSON.parse(raw) as Partial<PlayerProfile>;
    for (const k of SETTING_KEYS) {
      if (stored[k] !== undefined) (base[k] as unknown) = stored[k];
    }
  } catch {
    // Corrupt or inaccessible storage (private window, quota, etc.) — ignore.
  }
  return base;
}

/** Full read of the stored profile (progress included). Used only where an
 *  explicit, complete restore is intended — not on normal boot. */
export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...(JSON.parse(raw) as Partial<PlayerProfile>) };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
  } catch {
    // Best-effort persistence only; nothing to recover here.
  }
}
