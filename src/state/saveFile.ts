import { store } from "../engine/gameStore";
import { defaultProfile, type PlayerProfile } from "./profile";

// Offline save transfer: download the current profile as a .synthsave file and
// import one back to continue on another device/browser. No account, no
// backend — the player carries their own save.

const MAGIC = "SYNTH-BREACH-SAVE";
const FORMAT_VERSION = 1;

interface SaveFile {
  magic: string;
  version: number;
  exportedAt: string;
  profile: PlayerProfile;
}

function slug(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "operator";
}

/** Trigger a download of the current save as a JSON .synthsave file. */
export function exportSave(): void {
  const payload: SaveFile = {
    magic: MAGIC,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: store.profile,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `synth-breach-${slug(store.profile.handle)}-${date}.synthsave`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parse + validate a save file's text and load it into the game. */
export function importSaveFromText(text: string): { ok: true } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "File isn't valid JSON." };
  }
  const data = parsed as Partial<SaveFile>;
  if (!data || data.magic !== MAGIC || typeof data.profile !== "object" || data.profile === null) {
    return { ok: false, error: "Not a SYNTH // BREACH save file." };
  }
  const incoming = data.profile as Partial<PlayerProfile>;
  if (!Array.isArray(incoming.unlockedEpisodes)) {
    return { ok: false, error: "Save file is missing progress data." };
  }
  // Merge over defaults so older/newer files always yield a complete profile.
  const profile: PlayerProfile = { ...defaultProfile(), ...incoming, updatedAt: Date.now() };
  store.replaceProfile(profile);
  return { ok: true };
}

/** Open the OS file picker and import the chosen .synthsave file. */
export function importSaveViaPicker(onResult?: (msg: string, ok: boolean) => void): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".synthsave,.json,application/json";
  input.style.display = "none";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    input.remove();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importSaveFromText(String(reader.result ?? ""));
      if (result.ok) onResult?.(`Save loaded — resuming as ${store.profile.handle}.`, true);
      else onResult?.(result.error, false);
    };
    reader.onerror = () => onResult?.("Couldn't read that file.", false);
    reader.readAsText(file);
  });
  document.body.appendChild(input);
  input.click();
}
