import type { User } from "@supabase/supabase-js";
import type { CloudProvider, CloudUser } from "./types";
import type { SupabaseConfig } from "./config";
import type { PlayerProfile } from "../state/profile";

// Supabase adapter: Google OAuth (redirect flow) + email are handled by Supabase
// Auth; saves live in a `saves` table (user_id uuid PK, data jsonb, updated_at).
// See docs/CLOUD_SAVE.md for the one-time SQL to create the table + RLS policy.
// The SDK is dynamically imported so it only loads when Supabase is configured.

export async function createSupabaseProvider(cfg: SupabaseConfig): Promise<CloudProvider> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  function mapUser(u: User | null): CloudUser | null {
    if (!u) return null;
    const name = (u.user_metadata?.full_name as string | undefined) ?? (u.user_metadata?.name as string | undefined) ?? null;
    return { id: u.id, name, email: u.email ?? null, anonymous: u.is_anonymous ?? false };
  }

  return {
    async init() {
      // createClient already restores any persisted/redirected session.
    },
    onAuthChanged(cb) {
      // Fire once with the current session, then on every change.
      void supabase.auth.getUser().then(({ data }) => cb(mapUser(data.user)));
      const { data } = supabase.auth.onAuthStateChange((_evt, session) => cb(mapUser(session?.user ?? null)));
      return () => data.subscription.unsubscribe();
    },
    async signInWithGoogle() {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href.split("#")[0] },
      });
    },
    async signInAnonymously() {
      await supabase.auth.signInAnonymously();
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async load(uid) {
      const { data, error } = await supabase.from("saves").select("data").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      return (data?.data as PlayerProfile | undefined) ?? null;
    },
    async save(uid, profile) {
      const { error } = await supabase
        .from("saves")
        .upsert({ user_id: uid, data: profile, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
  };
}
