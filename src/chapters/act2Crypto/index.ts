import type { Chapter } from "../baseChapter";

// Act II: Cryptography (Subnet Beta: Crypto Vault) — Episodes 4-6.
// See docs/SPEC.md §12 for the full script, including the HEX "tells"
// planted in Episodes 04-05 that pay off in Episode 06's confession.

export const episode04: Chapter = {
  id: 4,
  act: 2,
  title: "The Ciphertext Wire",
  concepts: ["encoding vs encryption vs hashing", "Base64 mechanics", "hexadecimal string formats"],
  briefing: "HEX: Same rule as always, Decker — cleared shard, nothing leaves the range. Strip that padding.",
  hints: ["", "", ""],
  implemented: false,
};

export const episode05: Chapter = {
  id: 5,
  act: 2,
  title: "The Caesar & XOR Anomaly",
  concepts: ["symmetric vs asymmetric ciphers", "Caesar/ROT substitution", "frequency analysis", "XOR encryption"],
  briefing: "HEX: They ran their messages through a rotation cipher, then an XOR bitmask. Let's break their math.",
  hints: ["", "", ""],
  implemented: false,
};

export const episode06: Chapter = {
  id: 6,
  act: 2,
  title: "Shattering the Salt",
  concepts: ["one-way hash functions", "the avalanche effect", "rainbow tables", "salting", "dictionary attacks"],
  briefing: "HEX: We have hexadecimal strings, not passwords. You hash guesses until you find a match.",
  hints: ["", "", ""],
  implemented: false,
};

export const act2Crypto: Chapter[] = [episode04, episode05, episode06];
