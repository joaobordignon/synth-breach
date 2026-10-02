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

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...(JSON.parse(raw) as Partial<PlayerProfile>) };
  } catch {
    // Corrupt or inaccessible storage (private window, quota, etc.) — fall
    // back to a fresh profile rather than crashing the app.
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
