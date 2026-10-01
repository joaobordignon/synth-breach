import type { Episode } from "../engine/types";
import { episode00 } from "./episode00";
import { act1Network } from "./act1Network";
import { act2Crypto } from "./act2Crypto";
import { act3Pentest } from "./act3Pentest";
import { act4BugHunt } from "./act4BugHunt";

// The canonical, ordered campaign. EPISODES is keyed by id (0 = Prologue,
// 1-12 = Episodes) so the store can look an episode up in O(1), and
// ORDER preserves play sequence for unlock gating.
const ALL: Episode[] = [episode00, ...act1Network, ...act2Crypto, ...act3Pentest, ...act4BugHunt];

export const ORDER: number[] = ALL.map((e) => e.id);

export const EPISODES: Record<number, Episode> = Object.fromEntries(
  ALL.map((e) => [e.id, e]),
);

export function firstEpisodeId(): number {
  return ORDER[0];
}

export function nextEpisodeId(current: number): number | null {
  const idx = ORDER.indexOf(current);
  if (idx < 0 || idx + 1 >= ORDER.length) return null;
  return ORDER[idx + 1];
}

export { episode00, act1Network, act2Crypto, act3Pentest, act4BugHunt };
