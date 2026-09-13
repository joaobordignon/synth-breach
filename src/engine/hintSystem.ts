import type { Chapter, HintTier } from "../chapters/baseChapter";

// The 3-tier Decker Intel system (docs/SPEC.md §7). Reading a hint is
// always free — Tier 1/2 never cost anything. Tier 3 (the full solution)
// is tracked per chapter so the scoring layer can reward players who
// solved a challenge without needing it.

const highestTierUsed = new Map<number, HintTier>();

export function getHint(chapter: Chapter, tier: HintTier): string {
  const current = highestTierUsed.get(chapter.id);
  if (!current || tier > current) {
    highestTierUsed.set(chapter.id, tier);
  }
  return chapter.hints[tier - 1] ?? "No hint available for this tier yet.";
}

export function usedFullSolution(chapterId: number): boolean {
  return highestTierUsed.get(chapterId) === 3;
}

export function resetHintTracking(chapterId: number): void {
  highestTierUsed.delete(chapterId);
}
