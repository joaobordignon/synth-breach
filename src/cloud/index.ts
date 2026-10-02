import { getCloudConfig } from "./config";
import type { CloudProvider, CloudUser } from "./types";
import { store } from "../engine/gameStore";

// Cloud-save façade. Selects the configured provider (Firebase or Supabase),
// wires it to the game store (pull on sign-in, debounced push on change), and
// exposes a tiny auth API for the UI. When nothing is configured it stays
// dormant and the game runs on local saves exactly as before.

let provider: CloudProvider | null = null;
let currentUser: CloudUser | null = null;
let enabled = false;
const changeListeners = new Set<(u: CloudUser | null) => void>();

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushed = -1;

function notify() {
  for (const cb of changeListeners) cb(currentUser);
}

export function cloudEnabled(): boolean {
  return enabled;
}
export function getCloudUser(): CloudUser | null {
  return currentUser;
}
export function onCloudChange(cb: (u: CloudUser | null) => void): () => void {
  changeListeners.add(cb);
  return () => changeListeners.delete(cb);
}

async function onSignedIn(user: CloudUser) {
  if (!provider) return;
  try {
    const cloud = await provider.load(user.id);
    const local = store.profile;
    if (cloud && (cloud.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
      // Cloud is newer — adopt it (and keep it tagged to this account).
      store.replaceProfile({ ...cloud, cloudUserId: user.id });
    } else {
      // First login or local is newer — keep local and push it up.
      store.tagCloudUser(user.id);
      await provider.save(user.id, store.profile);
    }
    lastPushed = store.profile.updatedAt ?? 0;
  } catch (err) {
    console.warn("[cloud] sync on sign-in failed:", err);
  }
}

function schedulePush() {
  if (!provider || !currentUser) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    pushTimer = null;
    const p = store.profile;
    if ((p.updatedAt ?? 0) === lastPushed) return; // nothing new
    try {
      await provider!.save(currentUser!.id, p);
      lastPushed = p.updatedAt ?? 0;
    } catch (err) {
      console.warn("[cloud] push failed:", err);
    }
  }, 1500);
}

/** Initialize the configured provider. Returns true if cloud save is active. */
export async function initCloud(): Promise<boolean> {
  const cfg = getCloudConfig();
  if (cfg.provider === "none") return false;
  try {
    if (cfg.provider === "firebase") {
      const { createFirebaseProvider } = await import("./firebase");
      provider = await createFirebaseProvider(cfg.firebase);
    } else {
      const { createSupabaseProvider } = await import("./supabase");
      provider = await createSupabaseProvider(cfg.supabase);
    }
    await provider.init();
    enabled = true;

    provider.onAuthChanged((user) => {
      const wasSignedOut = currentUser === null;
      currentUser = user;
      if (user && wasSignedOut) void onSignedIn(user);
      if (!user) store.tagCloudUser(null);
      notify();
    });

    // Debounced push whenever the local profile changes while signed in.
    store.onStateChange(schedulePush);
    return true;
  } catch (err) {
    console.warn("[cloud] init failed; falling back to local saves:", err);
    provider = null;
    enabled = false;
    return false;
  }
}

export async function signInWithGoogle(): Promise<void> {
  if (provider) await provider.signInWithGoogle();
}
export async function signInAnonymously(): Promise<void> {
  if (provider) await provider.signInAnonymously();
}
export async function signOutCloud(): Promise<void> {
  if (provider) await provider.signOut();
}
