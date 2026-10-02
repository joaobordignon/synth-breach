import type { PlayerProfile } from "../state/profile";

export interface CloudUser {
  id: string;
  name: string | null;
  email: string | null;
  anonymous: boolean;
}

/** A pluggable auth + save backend (Firebase or Supabase implement this). */
export interface CloudProvider {
  init(): Promise<void>;
  onAuthChanged(cb: (user: CloudUser | null) => void): () => void;
  signInWithGoogle(): Promise<void>;
  signInAnonymously(): Promise<void>;
  signOut(): Promise<void>;
  /** Load a saved profile for a user, or null if none stored yet. */
  load(uid: string): Promise<PlayerProfile | null>;
  /** Persist a profile for a user. */
  save(uid: string, profile: PlayerProfile): Promise<void>;
}
