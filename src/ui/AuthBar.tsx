import { useEffect, useState } from "react";
import { cloudEnabled, getCloudUser, onCloudChange, signInWithGoogle, signOutCloud } from "../cloud";
import type { CloudUser } from "../cloud/types";

// Sign-in / account chip shown in the header. Renders nothing unless a cloud
// provider (Firebase or Supabase) is configured, so the game is unchanged for
// anyone running it local-only.

export function AuthBar() {
  const [user, setUser] = useState<CloudUser | null>(getCloudUser());
  useEffect(() => onCloudChange(setUser), []);

  if (!cloudEnabled()) return null;

  if (user) {
    return (
      <span className="auth-bar">
        <span className="auth-user" title={user.email ?? undefined}>
          ☁ {user.anonymous ? "GUEST" : user.name ?? user.email ?? "OPERATOR"}
        </span>
        <button className="auth-btn" onClick={() => void signOutCloud()}>
          sign out
        </button>
      </span>
    );
  }

  return (
    <span className="auth-bar">
      <button className="auth-btn primary" onClick={() => void signInWithGoogle()}>
        ☁ Sign in to save
      </button>
    </span>
  );
}
