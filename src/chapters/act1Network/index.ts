import type { Chapter } from "../baseChapter";

// Act I: Network 101 (Subnet Alpha: Edge Perimeter) — Episodes 1-3.
// Metadata below is summarized from docs/SPEC.md §11; full HEX dialogue,
// WARDEN log-line beats, and step-by-step command flow still need to be
// ported over from the spec into each chapter's `hints`/briefing before
// `implemented` flips to true.

export const episode01: Chapter = {
  id: 1,
  act: 1,
  title: "The Gateway Knock",
  concepts: ["IPv4 addressing", "CIDR notation (/24)", "ICMP protocol", "Ping (echo request/reply)"],
  briefing: "HEX: Same rule as always, Decker — this shard's ours to test, cleared and air-gapped. Now, find the gateway.",
  hints: ["", "", ""],
  implemented: false,
};

export const episode02: Chapter = {
  id: 2,
  act: 1,
  title: "The Three-Way Handshake",
  concepts: ["TCP vs UDP", "3-way handshake (SYN/SYN-ACK/ACK)", "TCP control flags", "well-known ports"],
  briefing: "HEX: Every networked service listens on a port. A server reveals its soul in the handshake.",
  hints: ["", "", ""],
  implemented: false,
};

export const episode03: Chapter = {
  id: 3,
  act: 1,
  title: "The Ghost Service",
  concepts: ["OSI Layer 7 vs Layer 4", "service banners", "cleartext vs encrypted protocols"],
  briefing: "HEX: Legacy servers love talking too much. Grab the banner and see what they hand us for free.",
  hints: ["", "", ""],
  implemented: false,
};

export const act1Network: Chapter[] = [episode01, episode02, episode03];
