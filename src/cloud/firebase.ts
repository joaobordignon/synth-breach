import type { CloudProvider, CloudUser } from "./types";
import type { FirebaseConfig } from "./config";
import type { PlayerProfile } from "../state/profile";

// Firebase adapter: Google (and anonymous) sign-in via Firebase Auth, saves in
// a single Firestore document per user (`saves/{uid}`). The SDK is imported
// dynamically so it's only pulled into a separate chunk when Firebase is the
// configured provider.

export async function createFirebaseProvider(cfg: FirebaseConfig): Promise<CloudProvider> {
  const { initializeApp } = await import("firebase/app");
  const auth = await import("firebase/auth");
  const fs = await import("firebase/firestore");

  const app = initializeApp({
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    appId: cfg.appId,
    storageBucket: cfg.storageBucket,
  });
  const firebaseAuth = auth.getAuth(app);
  const db = fs.getFirestore(app);

  function mapUser(u: import("firebase/auth").User | null): CloudUser | null {
    if (!u) return null;
    return { id: u.uid, name: u.displayName, email: u.email, anonymous: u.isAnonymous };
  }

  return {
    async init() {
      // Persist the session so returning players stay signed in.
      await auth.setPersistence(firebaseAuth, auth.browserLocalPersistence).catch(() => {});
    },
    onAuthChanged(cb) {
      return auth.onAuthStateChanged(firebaseAuth, (u) => cb(mapUser(u)));
    },
    async signInWithGoogle() {
      const provider = new auth.GoogleAuthProvider();
      await auth.signInWithPopup(firebaseAuth, provider);
    },
    async signInAnonymously() {
      await auth.signInAnonymously(firebaseAuth);
    },
    async signOut() {
      await auth.signOut(firebaseAuth);
    },
    async load(uid) {
      const snap = await fs.getDoc(fs.doc(db, "saves", uid));
      return snap.exists() ? (snap.data() as PlayerProfile) : null;
    },
    async save(uid, profile) {
      await fs.setDoc(fs.doc(db, "saves", uid), profile as unknown as Record<string, unknown>);
    },
  };
}
