// Shared engine types. The whole game is driven by these: episodes declare
// objectives and command handlers, handlers talk to the world through
// EngineApi, and everything the player sees on screen is a stream of Line
// objects tagged with a LineKind the terminal renders in a specific neon hue.

/** How a printed line should be colored in the terminal (see ui/styles.css). */
export type LineKind =
  | "normal" // default cyan body text
  | "hex" // [COMMS // HEX] mentor dialogue (pink)
  | "warden" // WARDEN / SYS-LOG anomaly lines (alert red)
  | "success" // flag captured / objective cleared (green)
  | "error" // bad command / wrong input (red)
  | "warn" // cautions, pending states (amber)
  | "system" // engine/system notices (lavender)
  | "banner" // ASCII art / headers (pink glow)
  | "dim"; // de-emphasized background flavor (lavender)

export interface Line {
  text: string;
  kind?: LineKind;
}

/** A single win-condition step inside an episode, rendered as a checklist. */
export interface Objective {
  id: string;
  label: string;
}

/** A single line in the BBS comms side panel (from HEX, or the player). */
export interface CommsEntry {
  id: number;
  /** Display text with the "[COMMS // HEX]:" prefix already stripped. */
  text: string;
  /** Episode id this transmission belongs to. */
  episode: number;
  /** Who sent it — "hex" (default, voiced) or "you" (player reply). */
  speaker?: "hex" | "you";
}

/** A pre-written player reply to HEX, and HEX's follow-up to it. */
export interface CommsReply {
  /** The clickable chip text (also posted into the feed as YOU>). */
  text: string;
  /** HEX's response line(s) to this reply. */
  response: Array<string | Line>;
  /** Optional emotional tenor. A "warm" (personal, trusting, open) reply nudges
   *  the player's bond with HEX upward; that bond is read back once at the
   *  ending to tailor HEX's farewell. "mission"/"guarded" stay neutral. */
  tone?: "warm" | "mission" | "guarded";
}

/** A dialogue beat: HEX poses something, the player picks a reply. */
export interface ReplyBeat {
  /** When to offer it: "intro" (after the episode's HEX intro) or
   *  "objective:<id>" (after that objective completes). */
  trigger: string;
  /** Optional extra HEX line that poses the question. */
  prompt?: string;
  replies: CommsReply[];
}

export interface TelemetryHost {
  ip: string;
  label: string;
  status: "ACTIVE" | "SILENT" | "FILTERED" | "OPEN" | "COMPROMISED" | "TRAP";
  detail?: string;
}

export interface TelemetryState {
  /** Freeform title for the telemetry pane (e.g. "SUBNET ALPHA MAP"). */
  title: string;
  hosts: TelemetryHost[];
  /** Optional monospace block (packet tables, proxy panes, etc.). */
  block?: string[];
}

/** A recovered reference string kept in the Evidence Locker — the persistent
 *  record of a puzzle's inputs (cookies, hex dumps, ciphertexts, hashes,
 *  checksums, ids) so an accidental `clear` never loses them. */
export interface EvidenceItem {
  label: string;
  value: string;
}

/** A readable artifact in an episode's virtual filesystem (`ls` / `cat`).
 *  Reading one can pay off a recon objective: surface evidence, complete an
 *  objective, and fire a HEX reaction — so targets are DISCOVERED in-world
 *  instead of appearing from nowhere. */
export interface ReconFile {
  /** Lines printed by `cat <path>`. */
  lines: string[];
  /** Optional payoff the first time this file is read. */
  reveal?: {
    evidence?: EvidenceItem;
    /** Objective id completed when this file is read. */
    completes?: string;
    /** HEX reaction lines (routed to the comms panel). */
    hex?: string[];
    score?: number;
  };
}

/** The surface area a command handler is allowed to touch. */
export interface EngineApi {
  /** Print immediately (string = normal line, or tagged Line objects). */
  print(content: string | Line | Array<string | Line>, kind?: LineKind): void;
  /** Print after a delay (ms) — used for streaming output, WARDEN logs, FX. */
  printAfter(ms: number, content: string | Line | Array<string | Line>, kind?: LineKind): void;
  /** Convenience: a HEX comms line (auto-prefixed, pink). */
  hex(text: string): void;
  /** Convenience: a WARDEN SYS-LOG line (alert red), also bumps the gauge. */
  warden(score: number, action: string, note?: string): void;
  /** Mark an objective complete; triggers episode-completion check. */
  complete(objectiveId: string): void;
  isComplete(objectiveId: string): boolean;
  /** Arbitrary per-run key/value scratch space (shared across episodes). */
  getVar<T = unknown>(key: string): T | undefined;
  setVar(key: string, value: unknown): void;
  addScore(points: number): void;
  openCodex(query?: string): void;
  setTelemetry(state: TelemetryState | null): void;
  /** Record a key reference into the persistent Evidence Locker (telemetry
   *  pane) so it survives a terminal `clear`. Deduped by label+value. */
  evidence(label: string, value: string): void;
  /** Player's chosen handle. */
  handle(): string;
  /** The flagged family member's name used in HEX's dialogue. */
  sibling(): string;
  /** How warmly the player has answered HEX across the campaign (0+). Used by
   *  the finale to tailor HEX's farewell to the relationship actually built. */
  rapport(): number;
  /** Award an achievement badge (deduped). */
  award(badge: string): void;
  /** Trigger a full-screen visual effect by name (see ui/FxLayer). */
  fx(effect: "glitch" | "fireworks" | "alarm"): void;
  /** Register a callback run when the player leaves the current episode
   *  (advance, goto, or reset) — use it to cancel timers/intervals. */
  onLeave(cb: () => void): void;
}

export interface EpisodeCommand {
  usage: string;
  description: string;
  /** Hidden from `help` listing (still runnable) when true. */
  hidden?: boolean;
  /** Extra man-page lines shown by `<command> --help` (what it does, flags,
   *  an example with placeholders — guidance, not the literal answer). */
  help?: string[];
  run: (args: string[], api: EngineApi) => void;
}

/** A full-screen briefing box (Codex-style) shown before an episode's intro. */
export interface EpisodeModal {
  title: string;
  /** Short lead paragraph under the title. */
  lead?: string;
  sections: Array<{ heading?: string; lines: string[] }>;
  /** Label for the dismiss button (default "BEGIN ▸"). */
  dismissLabel?: string;
}

export interface Episode {
  /** 0 = Prologue, 1-12 = Episodes. */
  id: number;
  act: 0 | 1 | 2 | 3 | 4;
  title: string;
  subnet?: string;
  concepts: string[];
  /** One-line hook shown in the intel pane. */
  briefing: string;
  /** Optional briefing box shown first; HEX's intro is held until it closes. */
  modal?: EpisodeModal;
  /** When true, hold the HEX intro until the modal is dismissed. */
  gateIntro?: boolean;
  /** HEX comms / scene-setting printed when the episode starts. */
  intro: Array<string | Line>;
  objectives: Objective[];
  /** When true, objectives are revealed one at a time — the checklist shows the
   *  completed steps plus the single next one, not the whole list. Used by the
   *  Prologue to guide a first-time player through help → codex → accept-code. */
  progressiveObjectives?: boolean;
  /** Episode-specific commands, merged over the global command set. */
  commands: Record<string, EpisodeCommand>;
  /** Tier 1 theory, Tier 2 syntax nudge, Tier 3 full solution. */
  hints: [string, string, string];
  /** Closing comms printed once every objective is complete. */
  outro: Array<string | Line>;
  /** Codex topic auto-suggested for this episode. */
  codexTopic?: string;
  /** Optional player-reply dialogue beats (see ReplyBeat). */
  beats?: ReplyBeat[];
  /** Key reference strings surfaced at episode start (intercept data, cipher
   *  text, etc.) — seeded into the Evidence Locker so `clear` never loses them. */
  evidence?: EvidenceItem[];
  /** Virtual filesystem for this episode, keyed by path, explorable with the
   *  global `ls` / `cat` commands — the recon layer that lets the player find
   *  their next target (an IP, a host) by reading the world. */
  files?: Record<string, ReconFile>;
}
