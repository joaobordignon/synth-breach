import type { Chapter } from "../baseChapter";

// Act IV: Bug Hunting & Web Exploits (Subnet Omega: Aether Cloud) — Episodes
// 10-12. See docs/SPEC.md §14, including Episode 11's Kovacs/Vance memo
// reveal and Episode 12's WARDEN countermeasure + branching ending.

export const episode10: Chapter = {
  id: 10,
  act: 4,
  title: "The Broken Gate",
  concepts: ["SQL injection", "tautology bypass", "parameterized queries"],
  briefing: "HEX: Same rule as always, Decker — cleared shard, this stays on the range. This is Kovacs' house.",
  hints: ["", "", ""],
  implemented: false,
};

export const episode11: Chapter = {
  id: 11,
  act: 4,
  title: "The Phantom Parameter",
  concepts: ["IDOR", "broken access control", "horizontal vs vertical privilege escalation"],
  briefing: "HEX: They authenticate who you are, but forget to authorize what you can view.",
  hints: ["", "", ""],
  implemented: false,
};

export const episode12: Chapter = {
  id: 12,
  act: 4,
  title: "Zero-Day Protocol (The Grand Finale)",
  concepts: ["path traversal", "vulnerability chaining", "CVSS 3.1 scoring", "coordinated disclosure"],
  briefing: "HEX: This is the endgame. Chain your access, and let's finish it.",
  hints: ["", "", ""],
  implemented: false,
};

export const act4BugHunt: Chapter[] = [episode10, episode11, episode12];
