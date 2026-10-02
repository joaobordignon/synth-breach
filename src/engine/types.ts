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

/** A single HEX transmission routed to the BBS comms side panel. */
export interface CommsEntry {
  id: number;
  /** Display text with the "[COMMS // HEX]:" prefix already stripped. */
  text: string;
  /** Episode id this transmission belongs to. */
  episode: number;
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
  /** Player's chosen handle. */
  handle(): string;
  /** The flagged family member's name used in HEX's dialogue. */
  sibling(): string;
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
  /** Episode-specific commands, merged over the global command set. */
  commands: Record<string, EpisodeCommand>;
  /** Tier 1 theory, Tier 2 syntax nudge, Tier 3 full solution. */
  hints: [string, string, string];
  /** Closing comms printed once every objective is complete. */
  outro: Array<string | Line>;
  /** Codex topic auto-suggested for this episode. */
  codexTopic?: string;
}
