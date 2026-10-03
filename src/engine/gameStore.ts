import type { CommsEntry, CommsReply, Episode, EngineApi, EvidenceItem, Line, LineKind, TelemetryState } from "./types";
import { EPISODES, firstEpisodeId, nextEpisodeId } from "../chapters";
import { hasCodexForCommand } from "../codex";
import {
  type PlayerProfile,
  loadSettings,
  saveProfile,
  defaultProfile,
} from "../state/profile";
import { playSuccessChime, playAlarmBuzzer, setMuted } from "../audio";
import { startMusic, stopMusic, setMusicVolume } from "../music";
import { setVoiceEnabled, cancelVoice, setVoiceByName } from "../voice";

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
type ReplyListener = (replies: CommsReply[]) => void;

/** Matches the "[COMMS // HEX]:" prefix that opens a distinct HEX utterance. */
const HEX_PREFIX = /^\[COMMS\s*\/\/\s*HEX\]/i;

/** Strip the "[COMMS // HEX]:" prefix so the comms panel can render it cleanly. */
function stripHexPrefix(text: string): string {
  return text.replace(/^\[COMMS\s*\/\/\s*HEX\]:?\s*/i, "").trim();
}

function toLines(content: string | Line | Array<string | Line>, kind?: LineKind): Line[] {
  const arr = Array.isArray(content) ? content : [content];
  return arr.map((item) => (typeof item === "string" ? { text: item, kind } : item));
}

class GameStore {
  profile: PlayerProfile = loadSettings();
  // Always boot to the Prologue — progress is never auto-resumed from storage;
  // the player continues an earlier run with `load` / LOAD GAME (a save file).
  currentEpisodeId: number = firstEpisodeId();

  /** anomaly_score currently shown on the WARDEN gauge (0.0 – 1.0+). */
  wardenScore = 0;
  wardenAction = "NONE";

  /** Objective ids completed in the *current* episode run. */
  private completed = new Set<string>();
  /** Scratch vars shared across the session (ending choice, flags, etc). */
  private vars = new Map<string, unknown>();
  /** Evidence Locker: key reference strings for the current episode. Lives in
   *  the telemetry pane so it survives a terminal `clear`; reset per episode. */
  private evidenceLog: EvidenceItem[] = [];
  /** Whether the current episode has emitted its outro / is ready to advance. */
  episodeCleared = false;

  /** When an episode gates its intro behind a briefing box, the held lines. */
  private heldIntro: Array<string | Line> | null = null;
  introHeld = false;
  /** The modal to show while the intro is held (rich briefing or reconnect). */
  gateModal: import("./types").EpisodeModal | null = null;

  private telemetry: TelemetryState | null = null;
  private leaveCallbacks: Array<() => void> = [];
  private outputListeners = new Set<OutputListener>();
  private stateListeners = new Set<StateListener>();
  private fxListeners = new Set<FxListener>();
  private commsListeners = new Set<CommsListener>();
  private replyListeners = new Set<ReplyListener>();
  private inputListeners = new Set<(text: string) => void>();
  private timers = new Set<ReturnType<typeof setTimeout>>();

  /** Rolling BBS comms history (HEX transmissions + player replies), capped. */
  private commsLog: CommsEntry[] = [];
  private commsSeq = 0;
  /** Player-reply chips currently offered, and which dialogue beats have fired. */
  private offeredReplies: CommsReply[] = [];
  private firedBeats = new Set<string>();

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
  onReplies(cb: ReplyListener): () => void {
    this.replyListeners.add(cb);
    return () => this.replyListeners.delete(cb);
  }
  getComms(): CommsEntry[] {
    return this.commsLog;
  }
  getOfferedReplies(): CommsReply[] {
    return this.offeredReplies;
  }

  private offerReplies(replies: CommsReply[]) {
    this.offeredReplies = replies;
    for (const cb of this.replyListeners) cb(replies);
  }
  private clearReplies() {
    if (this.offeredReplies.length === 0) return;
    this.offeredReplies = [];
    for (const cb of this.replyListeners) cb([]);
  }

  /** Post a player reply into the comms feed as YOU>, then HEX responds. */
  chooseReply(index: number) {
    const reply = this.offeredReplies[index];
    if (!reply) return;
    this.clearReplies();
    // A warm reply deepens the player's bond with HEX; the finale reads it back.
    if (reply.tone === "warm") {
      this.patchProfile({ bond: (this.profile.bond ?? 0) + 1 });
    }
    const entry: CommsEntry = { id: this.commsSeq++, text: reply.text, episode: this.currentEpisodeId, speaker: "you" };
    this.commsLog.push(entry);
    if (this.commsLog.length > 300) this.commsLog.shift();
    for (const cb of this.commsListeners) cb(entry);
    // HEX answers after a short beat, so it reads as a back-and-forth.
    const t = setTimeout(() => {
      this.timers.delete(t);
      this.emitOutput(toLines(reply.response, "hex").map(normalizeHex));
    }, 650);
    this.timers.add(t);
  }

  /** Fire any dialogue beats whose trigger matches (once each per episode). */
  private fireBeats(trigger: string) {
    const ep = this.episode;
    if (!ep.beats) return;
    ep.beats.forEach((beat, i) => {
      if (beat.trigger !== trigger) return;
      const key = `${ep.id}:${i}`;
      if (this.firedBeats.has(key)) return;
      this.firedBeats.add(key);
      if (beat.prompt) this.emitOutput([normalizeHex({ text: beat.prompt, kind: "hex" })]);
      this.offerReplies(beat.replies);
    });
  }
  /** The terminal subscribes; UI calls fillInput() to drop text at the prompt. */
  onInputRequest(cb: (text: string) => void): () => void {
    this.inputListeners.add(cb);
    return () => this.inputListeners.delete(cb);
  }
  fillInput(text: string): void {
    for (const cb of this.inputListeners) cb(text);
  }

  // HEX dialogue (kind "hex") is routed to the BBS comms side panel instead of
  // the terminal; everything else prints to the terminal. A mixed batch is
  // split so each stream keeps its own order.
  //
  // HEX lines are authored across several array entries for source readability,
  // but a single spoken utterance must land as ONE comms bubble — never broken
  // mid-sentence across two "HEX>" lines. So consecutive HEX lines are
  // coalesced: a line carrying the "[COMMS // HEX]:" prefix opens a new bubble;
  // an unprefixed HEX line is a continuation and is joined to it with a space;
  // a blank line or any terminal line closes the current bubble.
  private emitOutput(lines: Line[]) {
    if (lines.length === 0) return;
    const terminalLines: Line[] = [];
    let hexBuf: string | null = null;
    const flushHex = () => {
      const text = hexBuf?.trim();
      hexBuf = null;
      if (!text) return;
      const entry: CommsEntry = { id: this.commsSeq++, text, episode: this.currentEpisodeId, speaker: "hex" };
      this.commsLog.push(entry);
      if (this.commsLog.length > 300) this.commsLog.shift();
      for (const cb of this.commsListeners) cb(entry);
    };
    for (const line of lines) {
      if (line.kind === "hex") {
        const opensUtterance = HEX_PREFIX.test(line.text);
        const text = this.interpolate(stripHexPrefix(line.text));
        if (opensUtterance) {
          flushHex(); // a new utterance begins
          hexBuf = text;
        } else if (text === "") {
          flushHex(); // a blank spacer ends the current utterance
        } else {
          hexBuf = hexBuf ? `${hexBuf} ${text}` : text; // continuation
        }
      } else {
        flushHex(); // a terminal line ends any open HEX utterance
        terminalLines.push({ ...line, text: this.interpolate(line.text) });
      }
    }
    flushHex();
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
  /** The Evidence Locker for the current episode (persists across `clear`). */
  getEvidence(): EvidenceItem[] {
    return this.evidenceLog;
  }
  /** The shell prompt string; episodes can change it (REPL / shell escalation). */
  getPrompt(): string {
    return (this.vars.get("prompt") as string | undefined) ?? "operator@synth:~$ ";
  }
  objectiveStatus(): Array<{ label: string; done: boolean }> {
    const objs = this.episode.objectives;
    const all = objs.map((o) => ({ label: o.label, done: this.completed.has(o.id) }));
    // Progressive reveal is the default (opt out with progressiveObjectives:false):
    // show every completed step plus the single next one, so HEX can tutor the
    // player through the mission one objective at a time.
    if (this.episode.progressiveObjectives === false) return all;
    const firstPending = all.findIndex((o) => !o.done);
    if (firstPending === -1) return all; // all done
    return all.filter((o, i) => o.done || i === firstPending);
  }
  isUnlocked(id: number): boolean {
    return this.profile.unlockedEpisodes.includes(id);
  }
  private stuckIndex = 0;
  /** Index of the next solution command the `stuck` escape hatch will drop. */
  getStuckIndex(): number {
    return this.stuckIndex;
  }
  bumpStuckIndex(): void {
    this.stuckIndex += 1;
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
  setVoiceName(name: string | null) {
    this.patchProfile({ voiceName: name });
    setVoiceByName(name);
  }

  resetGame() {
    this.clearTimers();
    this.profile = defaultProfile();
    this.persist();
    this.completed.clear();
    this.vars.clear();
    this.evidenceLog = [];
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

  /**
   * Print the active episode's intro and prime its objectives/telemetry.
   * `bootGate` holds the intro behind a reconnect box on the first load of a
   * session (even for a resumed, non-Prologue episode), so HEX never speaks
   * until the player clicks — which also provides the gesture browsers require
   * to unlock speech audio.
   */
  startEpisode(id: number, opts?: { bootGate?: boolean }) {
    if (!this.isUnlocked(id)) {
      this.emitOutput([{ text: `[!] Episode ${pad(id)} is still locked.`, kind: "error" }]);
      return;
    }
    this.clearTimers();
    this.currentEpisodeId = id;
    this.completed.clear();
    this.episodeCleared = false;
    this.telemetry = null;
    this.heldIntro = null;
    this.introHeld = false;
    this.gateModal = null;
    this.stuckIndex = 0;
    this.firedBeats.clear();
    this.offerReplies([]); // clear any dialogue chips from the prior episode
    this.vars.delete("prompt"); // reset any REPL/shell prompt from a prior episode
    // Reset the Evidence Locker and seed it with this episode's intro-surfaced
    // reference data, so those strings are recoverable even after a `clear`.
    this.evidenceLog = this.episode.evidence ? [...this.episode.evidence] : [];
    this.emitState();

    const ep = this.episode;
    const header: Line[] = [
      { text: "", kind: "normal" },
      { text: episodeBanner(ep), kind: "banner" },
      { text: "", kind: "normal" },
    ];
    this.emitOutput(header);

    const gate = (ep.gateIntro && ep.modal) || opts?.bootGate;
    if (gate) {
      // Hold HEX's transmission until the briefing/reconnect box is dismissed.
      this.heldIntro = ep.intro;
      this.introHeld = true;
      this.gateModal = ep.modal ?? reconnectModal(ep);
      this.emitState();
      return;
    }
    this.emitOutput(toLines(ep.intro, "hex").map(normalizeHex));
    this.fireBeats("intro");
  }

  /** Dismiss the gated briefing box and release the held HEX intro. */
  releaseIntro() {
    if (!this.introHeld) return;
    const lines = this.heldIntro ?? [];
    this.heldIntro = null;
    this.introHeld = false;
    this.gateModal = null;
    this.emitState();
    this.emitOutput(toLines(lines, "hex").map(normalizeHex));
    this.fireBeats("intro");
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
    // `<command> --help` / `-h`: man-page style usage, never auto-run.
    if (args.includes("--help") || args.includes("-h")) {
      const lines: Line[] = [
        { text: `NAME    ${name}`, kind: "banner" },
        { text: `USAGE   ${cmd.usage}`, kind: "success" },
        { text: `        ${cmd.description}`, kind: "normal" },
      ];
      for (const h of cmd.help ?? []) lines.push({ text: `  ${h}`, kind: "normal" });
      if (hasCodexForCommand(name)) {
        lines.push({ text: `  📖 Theory: \`codex ${name}\` opens the concept behind this tool.`, kind: "dim" });
      }
      lines.push({ text: "  Stuck? `intel` → theory · `intel 2` → syntax nudge · `intel 3` → deep walkthrough.", kind: "dim" });
      this.emitOutput(lines);
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
      // Tutor beat: HEX reacts to the step just cleared — unless it's the final
      // objective, where the episode outro does the talking.
      const obj = this.episode.objectives.find((o) => o.id === id);
      const allDone = this.episode.objectives.every((o) => this.completed.has(o.id));
      if (obj?.hex && !allDone) {
        this.emitOutput(toLines(obj.hex, "hex").map(normalizeHex));
      }
      this.checkEpisodeComplete();
      this.fireBeats(`objective:${id}`);
    },
    isComplete: (id) => this.completed.has(id),
    getVar: <T>(key: string) => this.vars.get(key) as T | undefined,
    setVar: (key, value) => this.vars.set(key, value),
    addScore: (points) => {
      this.patchProfile({ score: Math.max(0, this.profile.score + points) });
    },
    openCodex: (query) => this.openCodexFn?.(query),
    setTelemetry: (state) => {
      this.telemetry = state;
      this.emitState();
    },
    evidence: (label, value) => {
      if (this.evidenceLog.some((e) => e.label === label && e.value === value)) return;
      this.evidenceLog.push({ label, value });
      this.emitState();
    },
    handle: () => this.profile.handle,
    sibling: () => (this.getVarPublic<string>("sibling") ?? "ECHO"),
    rapport: () => this.profile.bond ?? 0,
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

  /** Expand story tokens in dialogue so HEX can speak the player's own values:
   *  {handle} → chosen handle, {sibling} → flagged family member's name. */
  private interpolate(text: string): string {
    if (text.indexOf("{") === -1) return text;
    return text
      .replace(/\{handle\}/g, this.profile.handle)
      .replace(/\{sibling\}/g, this.getVarPublic<string>("sibling") ?? "ECHO");
  }

  // CodexModal open handler, injected by the React layer.
  openCodexFn: ((query?: string) => void) | null = null;
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

/** A minimal gate box for resuming a non-Prologue episode on boot. */
function reconnectModal(ep: Episode): import("./types").EpisodeModal {
  const tag = ep.act === 0 ? "PROLOGUE" : `ACT ${["", "I", "II", "III", "IV"][ep.act]}`;
  return {
    title: "SIGNAL REACQUIRED",
    lead: `Welcome back, ${store.profile.handle}. Resuming ${tag} — Episode ${pad(ep.id)}: "${ep.title}". Jack in to bring HEX online.`,
    sections: [],
    dismissLabel: "RECONNECT ▸",
  };
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
setVoiceByName(store.profile.voiceName ?? null);
setMusicVolume(store.profile.musicVolume);
