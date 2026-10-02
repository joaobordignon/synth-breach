import type { CommsEntry, Episode, EngineApi, Line, LineKind, TelemetryState } from "./types";
import { EPISODES, firstEpisodeId, nextEpisodeId } from "../chapters";
import {
  type PlayerProfile,
  loadProfile,
  saveProfile,
  defaultProfile,
} from "../state/profile";
import { playSuccessChime, playAlarmBuzzer, setMuted } from "../audio";
import { startMusic, stopMusic, setMusicVolume } from "../music";
import { setVoiceEnabled, cancelVoice } from "../voice";

// ---------------------------------------------------------------------------
// The game store is the single mutable heart of the engine. xterm (imperative)
// and React (declarative) both talk to it: command handlers mutate it through
// the EngineApi, the terminal subscribes to an output stream, and the side
// panels subscribe to a state-change signal. Keeping it outside React means
// the xterm onData closures never go stale.
// ---------------------------------------------------------------------------

type OutputListener = (lines: Line[]) => void;
type StateListener = () => void;
type FxListener = (effect: "glitch" | "fireworks" | "alarm") => void;
type CommsListener = (entry: CommsEntry) => void;

/** Strip the "[COMMS // HEX]:" prefix so the comms panel can render it cleanly. */
function stripHexPrefix(text: string): string {
  return text.replace(/^\[COMMS\s*\/\/\s*HEX\]:?\s*/i, "").trim();
}

function toLines(content: string | Line | Array<string | Line>, kind?: LineKind): Line[] {
  const arr = Array.isArray(content) ? content : [content];
  return arr.map((item) => (typeof item === "string" ? { text: item, kind } : item));
}

class GameStore {
  profile: PlayerProfile = loadProfile();
  currentEpisodeId: number = this.profile.unlockedEpisodes.slice(-1)[0] ?? firstEpisodeId();

  /** anomaly_score currently shown on the WARDEN gauge (0.0 – 1.0+). */
  wardenScore = 0;
  wardenAction = "NONE";

  /** Objective ids completed in the *current* episode run. */
  private completed = new Set<string>();
  /** Scratch vars shared across the session (ending choice, flags, etc). */
  private vars = new Map<string, unknown>();
  /** Whether the current episode has emitted its outro / is ready to advance. */
  episodeCleared = false;

  private telemetry: TelemetryState | null = null;
  private leaveCallbacks: Array<() => void> = [];
  private outputListeners = new Set<OutputListener>();
  private stateListeners = new Set<StateListener>();
  private fxListeners = new Set<FxListener>();
  private commsListeners = new Set<CommsListener>();
  private timers = new Set<ReturnType<typeof setTimeout>>();

  /** Rolling BBS comms history (HEX transmissions), capped. */
  private commsLog: CommsEntry[] = [];
  private commsSeq = 0;

  // ---- subscriptions ------------------------------------------------------
  onOutput(cb: OutputListener): () => void {
    this.outputListeners.add(cb);
    return () => this.outputListeners.delete(cb);
  }
  onStateChange(cb: StateListener): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }
  onFx(cb: FxListener): () => void {
    this.fxListeners.add(cb);
    return () => this.fxListeners.delete(cb);
  }
  onComms(cb: CommsListener): () => void {
    this.commsListeners.add(cb);
    return () => this.commsListeners.delete(cb);
  }
  getComms(): CommsEntry[] {
    return this.commsLog;
  }

  // HEX dialogue (kind "hex") is routed to the BBS comms side panel instead of
  // the terminal; everything else prints to the terminal. A mixed batch is
  // split so each stream keeps its own order.
  private emitOutput(lines: Line[]) {
    if (lines.length === 0) return;
    const terminalLines: Line[] = [];
    for (const line of lines) {
      if (line.kind === "hex") {
        const text = stripHexPrefix(line.text);
        if (!text) continue; // drop blank spacer lines in the comms feed
        const entry: CommsEntry = { id: this.commsSeq++, text, episode: this.currentEpisodeId };
        this.commsLog.push(entry);
        if (this.commsLog.length > 300) this.commsLog.shift();
        for (const cb of this.commsListeners) cb(entry);
      } else {
        terminalLines.push(line);
      }
    }
    if (terminalLines.length === 0) return;
    for (const cb of this.outputListeners) cb(terminalLines);
  }
  private emitState() {
    for (const cb of this.stateListeners) cb();
  }

  // ---- accessors for the UI ----------------------------------------------
  get episode(): Episode {
    return EPISODES[this.currentEpisodeId];
  }
  getTelemetry(): TelemetryState | null {
    return this.telemetry;
  }
  /** The shell prompt string; episodes can change it (REPL / shell escalation). */
  getPrompt(): string {
    return (this.vars.get("prompt") as string | undefined) ?? "operator@synth:~$ ";
  }
  objectiveStatus(): Array<{ label: string; done: boolean }> {
    return this.episode.objectives.map((o) => ({
      label: o.label,
      done: this.completed.has(o.id),
    }));
  }
  isUnlocked(id: number): boolean {
    return this.profile.unlockedEpisodes.includes(id);
  }
  /** All command names valid right now (globals + current episode). */
  commandNames(): string[] {
    return [...new Set([...Object.keys(GLOBAL_COMMANDS), ...Object.keys(this.episode.commands)])].sort();
  }

  // ---- persistence --------------------------------------------------------
  private persist() {
    saveProfile(this.profile);
  }
  private patchProfile(patch: Partial<PlayerProfile>) {
    this.profile = { ...this.profile, ...patch, updatedAt: Date.now() };
    this.persist();
    this.emitState();
  }

  /** Replace the whole profile (used when a save file is imported). */
  replaceProfile(next: PlayerProfile) {
    this.profile = next;
    this.persist();
    // Re-apply audio/voice settings the new profile carries.
    setMuted(next.audioMuted);
    setVoiceEnabled(next.voiceEnabled);
    if (next.musicEnabled) startMusic();
    else stopMusic();
    setMusicVolume(next.musicVolume);
    // Resume at the furthest unlocked episode.
    const resume = next.unlockedEpisodes.slice(-1)[0] ?? firstEpisodeId();
    this.startEpisode(resume);
    this.emitState();
  }

  setMuted(muted: boolean) {
    this.patchProfile({ audioMuted: muted });
    setMuted(muted);
  }
  setHandle(handle: string) {
    this.patchProfile({ handle });
  }
  setMusicEnabled(on: boolean) {
    this.patchProfile({ musicEnabled: on });
    if (on) startMusic();
    else stopMusic();
  }
  setMusicVolume(v: number) {
    this.patchProfile({ musicVolume: v });
    setMusicVolume(v);
  }
  setVoiceEnabled(on: boolean) {
    this.patchProfile({ voiceEnabled: on });
    setVoiceEnabled(on);
    if (!on) cancelVoice();
  }

  resetGame() {
    this.clearTimers();
    this.profile = defaultProfile();
    this.persist();
    this.completed.clear();
    this.vars.clear();
    this.commsLog = [];
    this.wardenScore = 0;
    this.wardenAction = "NONE";
    this.telemetry = null;
    this.currentEpisodeId = firstEpisodeId();
    this.episodeCleared = false;
    this.emitState();
  }

  // ---- episode lifecycle --------------------------------------------------
  private clearTimers() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    for (const cb of this.leaveCallbacks.splice(0)) {
      try {
        cb();
      } catch {
        /* a leave hook must never block episode transition */
      }
    }
  }

  /** Print the active episode's intro and prime its objectives/telemetry. */
  startEpisode(id: number) {
    if (!this.isUnlocked(id)) {
      this.emitOutput([{ text: `[!] Episode ${pad(id)} is still locked.`, kind: "error" }]);
      return;
    }
    this.clearTimers();
    this.currentEpisodeId = id;
    this.completed.clear();
    this.episodeCleared = false;
    this.telemetry = null;
    this.vars.delete("prompt"); // reset any REPL/shell prompt from a prior episode
    this.emitState();

    const ep = this.episode;
    const header: Line[] = [
      { text: "", kind: "normal" },
      { text: episodeBanner(ep), kind: "banner" },
      { text: "", kind: "normal" },
    ];
    this.emitOutput(header);
    this.emitOutput(toLines(ep.intro, "hex").map(normalizeHex));
  }

  /** Dispatch a line of player input. Returns false for empty input. */
  submit(input: string): boolean {
    const trimmed = input.trim();
    if (!trimmed) return false;
    const [name, ...args] = tokenize(trimmed);
    if (!name) return false;
    const ep = this.episode;
    const cmd = ep.commands[name] ?? GLOBAL_COMMANDS[name];
    if (!cmd) {
      this.emitOutput([
        { text: `[!] Unknown command: ${name}. Type 'help' for the command list.`, kind: "error" },
      ]);
      return true;
    }
    try {
      cmd.run(args, this.api);
    } catch (err) {
      this.emitOutput([{ text: `[!] Command error: ${(err as Error).message}`, kind: "error" }]);
    }
    return true;
  }

  private checkEpisodeComplete() {
    if (this.episodeCleared) return;
    const ep = this.episode;
    if (ep.objectives.length === 0) return;
    const allDone = ep.objectives.every((o) => this.completed.has(o.id));
    if (!allDone) return;

    this.episodeCleared = true;
    playSuccessChime();
    // Closing comms, then the unlock notice.
    this.emitOutput([{ text: "", kind: "normal" }]);
    this.emitOutput(toLines(ep.outro, "hex").map(normalizeHex));

    const next = nextEpisodeId(ep.id);
    if (next === null) {
      this.emitOutput([
        { text: "", kind: "normal" },
        { text: "[✓] CAMPAIGN COMPLETE — MASTER OPERATOR CERTIFIED.", kind: "success" },
      ]);
    } else {
      if (!this.profile.unlockedEpisodes.includes(next)) {
        this.patchProfile({
          unlockedEpisodes: [...this.profile.unlockedEpisodes, next].sort((a, b) => a - b),
        });
      }
      const label = EPISODES[next].id === 0 ? "Prologue" : `Episode ${pad(EPISODES[next].id)}`;
      this.emitOutput([
        { text: "", kind: "normal" },
        {
          text: `[✓] ${label} unlocked: "${EPISODES[next].title}". Type 'next' to continue.`,
          kind: "success",
        },
      ]);
    }
    this.emitState();
  }

  advanceToNext() {
    const next = nextEpisodeId(this.episode.id);
    if (next === null) {
      this.emitOutput([{ text: "[*] No further episodes — the campaign is complete.", kind: "system" }]);
      return;
    }
    if (!this.episodeCleared) {
      this.emitOutput([
        { text: "[!] Current episode's objectives aren't complete yet. Type 'objectives'.", kind: "warn" },
      ]);
      return;
    }
    this.startEpisode(next);
  }

  // ---- the EngineApi handed to command handlers ---------------------------
  readonly api: EngineApi = {
    print: (content, kind) => this.emitOutput(toLines(content, kind)),
    printAfter: (ms, content, kind) => {
      const t = setTimeout(() => {
        this.timers.delete(t);
        this.emitOutput(toLines(content, kind));
      }, ms);
      this.timers.add(t);
    },
    hex: (text) => this.emitOutput([normalizeHex({ text, kind: "hex" })]),
    warden: (score, action, note) => {
      this.wardenScore = score;
      this.wardenAction = action;
      this.emitState();
      const lines: Line[] = [
        {
          text: `[SYS-LOG // AETHER-EDGE] anomaly_score=${score.toFixed(2)} source=10.42.0.99 action=${action}`,
          kind: "warden",
        },
      ];
      if (note) lines.push({ text: `[NOTICE] ${note}`, kind: "warden" });
      this.emitOutput(lines);
    },
    complete: (id) => {
      if (this.completed.has(id)) return;
      this.completed.add(id);
      this.emitState();
      this.checkEpisodeComplete();
    },
    isComplete: (id) => this.completed.has(id),
    getVar: <T>(key: string) => this.vars.get(key) as T | undefined,
    setVar: (key, value) => this.vars.set(key, value),
    addScore: (points) => {
      this.patchProfile({ score: Math.max(0, this.profile.score + points) });
    },
    openCodex: () => this.openCodexFn?.(),
    setTelemetry: (state) => {
      this.telemetry = state;
      this.emitState();
    },
    handle: () => this.profile.handle,
    sibling: () => (this.getVarPublic<string>("sibling") ?? "ECHO"),
    award: (badge) => {
      if (this.profile.achievements.includes(badge)) return;
      this.patchProfile({ achievements: [...this.profile.achievements, badge] });
      this.emitOutput([{ text: `[★] Achievement unlocked: ${badge}`, kind: "warn" }]);
    },
    fx: (effect) => {
      if (effect === "alarm") playAlarmBuzzer();
      for (const cb of this.fxListeners) cb(effect);
    },
    onLeave: (cb) => this.leaveCallbacks.push(cb),
  };

  private getVarPublic<T>(key: string): T | undefined {
    return this.vars.get(key) as T | undefined;
  }

  // CodexModal open handler, injected by the React layer.
  openCodexFn: (() => void) | null = null;
}

/** Split a command line into tokens, honoring single/double quotes so that
 *  arguments with spaces (hex streams, SQL payloads, cipher text) stay whole. */
export function tokenize(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;
  let hasToken = false;
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      hasToken = true;
    } else if (/\s/.test(ch)) {
      if (cur || hasToken) out.push(cur);
      cur = "";
      hasToken = false;
    } else {
      cur += ch;
      hasToken = true;
    }
  }
  if (cur || hasToken) out.push(cur);
  return out;
}

function normalizeHex(line: Line): Line {
  // HEX dialogue is colored pink; we keep whatever prefix the script wrote.
  return { ...line, kind: line.kind ?? "hex" };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function episodeBanner(ep: Episode): string {
  const tag = ep.act === 0 ? "PROLOGUE" : `ACT ${["", "I", "II", "III", "IV"][ep.act]}`;
  return `>>> ${tag} — EPISODE ${pad(ep.id)}: ${ep.title.toUpperCase()}`;
}

// Global commands are defined in a separate module to avoid a circular import
// at construction time; they're injected here after the store is built.
export let GLOBAL_COMMANDS: Record<string, import("./types").EpisodeCommand> = {};
export function registerGlobalCommands(cmds: Record<string, import("./types").EpisodeCommand>) {
  GLOBAL_COMMANDS = cmds;
}

export const store = new GameStore();
// Honor persisted audio/voice settings as soon as the store comes up. Music
// can't autostart (browser autoplay policy) — App resumes it on first gesture.
setMuted(store.profile.audioMuted);
setVoiceEnabled(store.profile.voiceEnabled);
setMusicVolume(store.profile.musicVolume);
