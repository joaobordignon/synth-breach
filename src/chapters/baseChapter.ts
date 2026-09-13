// Shared shape for every campaign chapter (Prologue + Episodes 1-12).
// Full narrative/dialogue content lives in docs/SPEC.md; this interface
// carries only what the UI and hint system need at runtime. As chapters
// are implemented, their scripted beats (HEX dialogue, WARDEN log lines,
// player-facing objectives) should be fleshed out here or in per-chapter
// data files — the act1Network/…act4BugHunt stubs currently hold summary
// metadata only, ported from the spec's "Core Concepts" per episode.

export type HintTier = 1 | 2 | 3;

export interface Chapter {
  /** 0 = Prologue, 1-12 = Episodes, matching docs/SPEC.md numbering. */
  id: number;
  act: 0 | 1 | 2 | 3 | 4;
  title: string;
  concepts: string[];
  briefing: string;
  /** Tier 1 (theory), Tier 2 (syntax nudge), Tier 3 (full solution). */
  hints: [string, string, string];
  implemented: boolean;
}
