import { SAVE_KEY } from "../config";

// Player progress, score, and settings — save/load via localStorage.
// Same shape the original design kept at ~/.config/synth-breach/profile.json.
export interface PlayerProfile {
  handle: string;
  unlockedEpisodes: number[]; // 0 = Prologue, 1-12 = Episodes
  score: number;
  achievements: string[];
  audioMuted: boolean;
}

export function defaultProfile(): PlayerProfile {
  return {
    handle: "CYBER//ZERO",
    unlockedEpisodes: [0],
    score: 0,
    achievements: [],
    audioMuted: false,
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
