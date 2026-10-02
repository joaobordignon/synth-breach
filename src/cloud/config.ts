// Cloud-save configuration. Resolved at runtime from `window.__SYNTH_CLOUD__`
// (set by public/cloud-config.js — editable without a rebuild) and, as a
// fallback, from Vite build-time env (VITE_FIREBASE_* / VITE_SUPABASE_*).
// All of these are *public* client keys, safe to commit/ship. When nothing is
// configured the game runs exactly as before: local-only saves, no login UI.

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export type CloudConfig =
  | { provider: "firebase"; firebase: FirebaseConfig }
  | { provider: "supabase"; supabase: SupabaseConfig }
  | { provider: "none" };

interface RuntimeCloud {
  provider?: "firebase" | "supabase";
  firebase?: Partial<FirebaseConfig>;
  supabase?: Partial<SupabaseConfig>;
}

declare global {
  interface Window {
    __SYNTH_CLOUD__?: RuntimeCloud;
  }
}

function fromRuntime(): RuntimeCloud | null {
  if (typeof window === "undefined") return null;
  const r = window.__SYNTH_CLOUD__;
  return r && typeof r === "object" ? r : null;
}

function env(key: string): string | undefined {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return v && v.length > 0 ? v : undefined;
}

function firebaseFromEnv(): FirebaseConfig | null {
  const apiKey = env("VITE_FIREBASE_API_KEY");
  const projectId = env("VITE_FIREBASE_PROJECT_ID");
  const appId = env("VITE_FIREBASE_APP_ID");
  const authDomain = env("VITE_FIREBASE_AUTH_DOMAIN") ?? (projectId ? `${projectId}.firebaseapp.com` : undefined);
  if (apiKey && projectId && appId && authDomain) {
    return { apiKey, projectId, appId, authDomain, storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET") };
  }
  return null;
}

function supabaseFromEnv(): SupabaseConfig | null {
  const url = env("VITE_SUPABASE_URL");
  const anonKey = env("VITE_SUPABASE_ANON_KEY");
  return url && anonKey ? { url, anonKey } : null;
}

function completeFirebase(f: Partial<FirebaseConfig> | undefined): FirebaseConfig | null {
  if (!f) return null;
  const authDomain = f.authDomain ?? (f.projectId ? `${f.projectId}.firebaseapp.com` : undefined);
  if (f.apiKey && f.projectId && f.appId && authDomain) {
    return { apiKey: f.apiKey, projectId: f.projectId, appId: f.appId, authDomain, storageBucket: f.storageBucket };
  }
  return null;
}

function completeSupabase(s: Partial<SupabaseConfig> | undefined): SupabaseConfig | null {
  return s && s.url && s.anonKey ? { url: s.url, anonKey: s.anonKey } : null;
}

export function getCloudConfig(): CloudConfig {
  const runtime = fromRuntime();
  const rtFirebase = completeFirebase(runtime?.firebase);
  const rtSupabase = completeSupabase(runtime?.supabase);
  const envFirebase = firebaseFromEnv();
  const envSupabase = supabaseFromEnv();

  const firebase = rtFirebase ?? envFirebase;
  const supabase = rtSupabase ?? envSupabase;

  // Explicit provider preference wins when set and available.
  const prefer = runtime?.provider;
  if (prefer === "firebase" && firebase) return { provider: "firebase", firebase };
  if (prefer === "supabase" && supabase) return { provider: "supabase", supabase };

  // Otherwise auto-detect: Firebase first, then Supabase.
  if (firebase) return { provider: "firebase", firebase };
  if (supabase) return { provider: "supabase", supabase };
  return { provider: "none" };
}
