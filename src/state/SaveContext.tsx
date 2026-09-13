import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type PlayerProfile, loadProfile, saveProfile } from "./profile";
import { setMuted } from "../audio";

interface SaveContextValue {
  profile: PlayerProfile;
  updateProfile: (patch: Partial<PlayerProfile>) => void;
  unlockEpisode: (episode: number) => void;
  addScore: (points: number) => void;
}

const SaveContext = createContext<SaveContextValue | null>(null);

export function SaveProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());

  useEffect(() => {
    saveProfile(profile);
    setMuted(profile.audioMuted);
  }, [profile]);

  function updateProfile(patch: Partial<PlayerProfile>) {
    setProfile((prev) => ({ ...prev, ...patch }));
  }

  function unlockEpisode(episode: number) {
    setProfile((prev) =>
      prev.unlockedEpisodes.includes(episode)
        ? prev
        : { ...prev, unlockedEpisodes: [...prev.unlockedEpisodes, episode].sort((a, b) => a - b) },
    );
  }

  function addScore(points: number) {
    setProfile((prev) => ({ ...prev, score: prev.score + points }));
  }

  return (
    <SaveContext.Provider value={{ profile, updateProfile, unlockEpisode, addScore }}>
      {children}
    </SaveContext.Provider>
  );
}

export function useSave(): SaveContextValue {
  const ctx = useContext(SaveContext);
  if (!ctx) throw new Error("useSave() must be called within a <SaveProvider>");
  return ctx;
}
