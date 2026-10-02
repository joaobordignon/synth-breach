import type { EpisodeCommand, Line } from "./types";
import { store, GLOBAL_COMMANDS, registerGlobalCommands } from "./gameStore";
import { EPISODES } from "../chapters";
import { exportSave, importSaveViaPicker } from "../state/saveFile";
import { SOLUTIONS, GIVE_UP_FLAGS } from "./solutions";

// Commands available in every episode. Episode-specific commands are merged
// *over* these (an episode may override e.g. `whoami`). Reading hints or the
// codex never costs points (docs/SPEC.md §7); only Tier 3 marks the run as
// "assisted" so an episode can withhold its clean-solve bonus.

const highestTier = new Map<number, 1 | 2 | 3>();

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function usedFullSolution(episodeId: number): boolean {
  return highestTier.get(episodeId) === 3;
}

const commands: Record<string, EpisodeCommand> = {
  help: {
    usage: "help [command]",
    description: "List available commands, or show detailed usage for one.",
    run: (args, api) => {
      const all = { ...GLOBAL_COMMANDS, ...store.episode.commands };
      if (args[0]) {
        const def = all[args[0]];
        if (!def) return api.print(`[!] No such command: ${args[0]}`, "error");
        api.print([
          { text: def.usage, kind: "success" },
          { text: `  ${def.description}`, kind: "normal" },
        ]);
        return;
      }
      const lines: Line[] = [{ text: "AVAILABLE COMMANDS", kind: "banner" }];
      for (const [name, def] of Object.entries(all)) {
        if (def.hidden) continue;
        lines.push({ text: `  ${name.padEnd(16)} ${def.description}`, kind: "normal" });
      }
      lines.push({
        text: "  Tip: `intel` for a hint, `codex` for the reference library, `objectives` for your checklist.",
        kind: "dim",
      });
      api.print(lines);
      // The Prologue's first objective is simply learning that `help` exists.
      api.complete("help");
    },
  },

  handle: {
    usage: "handle <name>",
    description: "Set your operator handle.",
    run: (args, api) => {
      const name = args.join(" ").trim();
      if (!name) return api.print(`[*] Current handle: ${api.handle()}`, "system");
      store.setHandle(name);
      api.print(`[✓] Handle set to ${name}.`, "success");
    },
  },

  clear: {
    usage: "clear",
    description: "Clear the terminal screen (your Evidence Locker is kept — see `recall`).",
    // Intercepted by TerminalPane before dispatch; this entry is for `help`.
    run: () => {},
  },

  recall: {
    usage: "recall",
    description: "Reprint the Evidence Locker — recovered strings for this episode (survives `clear`).",
    help: [
      "The Evidence Locker holds this episode's key reference strings (cookies,",
      "hex dumps, ciphertexts, hashes, checksums). It lives in the TELEMETRY pane",
      "and is never wiped by `clear`. `recall` reprints it back into the terminal.",
    ],
    run: (_args, api) => {
      const items = store.getEvidence();
      if (items.length === 0) {
        return api.print("[*] Evidence Locker is empty — nothing recovered yet this episode.", "system");
      }
      const lines: Line[] = [{ text: "═══ EVIDENCE LOCKER — RECOVERED DATA ═══", kind: "banner" }];
      for (const it of items) {
        lines.push({ text: `  ${it.label}:`, kind: "dim" });
        lines.push({ text: `    ${it.value}`, kind: "normal" });
      }
      lines.push({ text: "[*] Also pinned in the TELEMETRY pane — it survives `clear`.", kind: "dim" });
      api.print(lines);
    },
  },

  intel: {
    usage: "intel [1|2|3]",
    description: "Operator intel hint — Tier 1 theory (default), 2 syntax nudge, 3 deep walkthrough.",
    run: (args, api) => {
      const tier = (Number(args[0]) || 1) as 1 | 2 | 3;
      if (tier < 1 || tier > 3) return api.print("[!] Tier must be 1, 2, or 3.", "error");
      const ep = store.episode;
      const prev = highestTier.get(ep.id) ?? 1;
      if (tier > prev) highestTier.set(ep.id, tier);
      const labels = ["THEORY PRIMER", "SYNTAX NUDGE", "DEEP WALKTHROUGH"];
      api.print([
        { text: `[DECKER INTEL // TIER ${tier} — ${labels[tier - 1]}]`, kind: "warn" },
        { text: ep.hints[tier - 1] || "No hint available for this tier.", kind: "normal" },
      ]);
      if (tier === 3) {
        api.print([
          { text: "  (Deepest hint viewed — clean-solve bonus forfeited. The exact command is not shown.)", kind: "dim" },
          {
            text: `  Still stuck and want it typed for you? Admit defeat: \`stuck ${GIVE_UP_FLAGS[0]}\` drops the exact command in your prompt.`,
            kind: "dim",
          },
        ]);
      }
    },
  },

  stuck: {
    usage: "stuck --<give-up-flag>",
    description: "Last resort (unlocks after `intel 3`): drops the exact next command into your prompt.",
    hidden: true, // revealed by the intel 3 output, not the help list
    help: [
      "Only works once you've read the full solution (`intel 3`).",
      "Append one of the (deliberately ridiculous) surrender flags, e.g.:",
      `  stuck ${GIVE_UP_FLAGS[0]}`,
      "Each use drops the next command of the solution into your prompt; press Enter to run it.",
    ],
    run: (args, api) => {
      const epId = store.episode.id;
      if (!usedFullSolution(epId)) {
        return api.print(
          "[!] `stuck` is locked. Work it — `intel` (theory), `intel 2` (syntax), then `intel 3`. It unlocks after you've read the full solution.",
          "warn",
        );
      }
      const flag = args.find((a) => a.startsWith("--"))?.toLowerCase();
      if (!flag || !GIVE_UP_FLAGS.includes(flag)) {
        return api.print([
          { text: "[*] To formally admit defeat, append one of these:", kind: "warn" },
          ...GIVE_UP_FLAGS.map((f) => ({ text: `    stuck ${f}`, kind: "dim" as const })),
        ]);
      }
      const sol = SOLUTIONS[epId] ?? [];
      if (sol.length === 0) {
        return api.print("[*] No canned solution for this one — you're on your own, {handle}.", "dim");
      }
      const idx = Math.min(sol.length - 1, store.getStuckIndex());
      const cmd = sol[idx];
      store.bumpStuckIndex();
      api.print([
        { text: `[*] ${flag.replace(/^--/, "")}. Fine. Here — just run this:`, kind: "warn" },
        { text: `  ${cmd}`, kind: "success" },
      ]);
      store.fillInput(cmd);
    },
  },

  codex: {
    usage: "codex [topic|command]",
    description: "Open the reference library. `codex <command>` jumps to the matching concept.",
    help: [
      "No argument opens this episode's topic.",
      "codex <topic>    networking · cryptography · pentesting · webSecurity",
      "codex <command>  jumps to the concept behind a tool, e.g. `codex netmap`.",
    ],
    run: (args, api) => {
      const query = args.join(" ").trim();
      api.print(`[*] Opening CODEX reference library${query ? ` → ${query}` : ""}... (free, no penalty)`, "system");
      api.openCodex(query || undefined);
      api.complete("codex");
    },
  },

  objectives: {
    usage: "objectives",
    description: "Show the current episode's objective checklist.",
    run: (_args, api) => {
      const lines: Line[] = [{ text: `OBJECTIVES — ${store.episode.title}`, kind: "banner" }];
      for (const o of store.objectiveStatus()) {
        lines.push({
          text: `  [${o.done ? "✓" : " "}] ${o.label}`,
          kind: o.done ? "success" : "normal",
        });
      }
      api.print(lines);
    },
  },

  status: {
    usage: "status",
    description: "Show operator profile: handle, score, WARDEN anomaly level, badges.",
    run: (_args, api) => {
      const p = store.profile;
      api.print([
        { text: "OPERATOR STATUS", kind: "banner" },
        { text: `  Handle          ${p.handle}`, kind: "normal" },
        { text: `  Episode         ${pad(store.episode.id)} — ${store.episode.title}`, kind: "normal" },
        { text: `  Bounty score    ${p.score} REP`, kind: "success" },
        {
          text: `  WARDEN anomaly  ${store.wardenScore.toFixed(2)} (action=${store.wardenAction})`,
          kind: store.wardenScore >= 0.5 ? "warden" : "warn",
        },
        { text: `  Episodes cleared ${p.unlockedEpisodes.length - 1}/12`, kind: "normal" },
        {
          text: `  Badges          ${p.achievements.length ? p.achievements.join(", ") : "(none yet)"}`,
          kind: "dim",
        },
      ]);
    },
  },

  next: {
    usage: "next",
    description: "Advance to the next unlocked episode once objectives are complete.",
    run: (_args) => store.advanceToNext(),
  },

  missions: {
    usage: "missions",
    description: "List unlocked episodes; use `goto <id>` to replay one.",
    run: (_args, api) => {
      const lines: Line[] = [{ text: "CAMPAIGN MAP", kind: "banner" }];
      for (const ep of Object.values(EPISODES)) {
        const unlocked = store.isUnlocked(ep.id);
        const mark = ep.id === store.episode.id ? "►" : unlocked ? "·" : "🔒";
        lines.push({
          text: `  ${mark} ${pad(ep.id)}  ${ep.title}`,
          kind: ep.id === store.episode.id ? "success" : unlocked ? "normal" : "dim",
        });
      }
      lines.push({ text: "  goto <id> to jump to any unlocked episode.", kind: "dim" });
      api.print(lines);
    },
  },

  goto: {
    usage: "goto <id>",
    description: "Jump to an unlocked episode (0-12).",
    run: (args, api) => {
      const id = Number(args[0]);
      if (!Number.isInteger(id) || !(id in EPISODES)) return api.print("[!] Usage: goto <0-12>", "error");
      if (!store.isUnlocked(id)) return api.print(`[!] Episode ${pad(id)} is still locked.`, "error");
      store.startEpisode(id);
    },
  },

  credits: {
    usage: "credits",
    description: "Show credits, acknowledgments, and license.",
    run: (_args, api) => {
      api.print([
        { text: "SYNTH // BREACH — free & open source (MIT). See LICENSE + CREDITS.md.", kind: "banner" },
        { text: "  Curriculum inspired by freeCodeCamp — freecodecamp.org (not affiliated).", kind: "normal" },
        { text: "  Concept nods: cliamp (github.com/bjarneo/cliamp) · ai-visualizer (github.com/jaredrhod/ai-visualizer).", kind: "normal" },
        { text: "  Built with xterm.js · React · Vite (MIT). Retro voice: SAM / sam-js (abandonware — see CREDITS).", kind: "dim" },
        { text: "  Music: royalty-free synthwave from Pixabay (delosound, nickpanek, lofidreams, hitslab,", kind: "dim" },
        { text: "         turtlebeats, lnplusmusic, arpmedia, alex-morgan, zephiramusic).", kind: "dim" },
        { text: "  An educational project. Not affiliated with any organization listed. Trademarks belong to their owners.", kind: "system" },
      ]);
    },
  },

  mute: {
    usage: "mute",
    description: "Toggle sound effects on/off (also Alt+M).",
    run: (_args, api) => {
      const next = !store.profile.audioMuted;
      store.setMuted(next);
      api.print(`[*] Sound effects ${next ? "muted" : "unmuted"}.`, "system");
    },
  },

  music: {
    usage: "music",
    description: "Toggle the synthwave background music.",
    run: (_args, api) => {
      const next = !store.profile.musicEnabled;
      store.setMusicEnabled(next);
      api.print(`[*] Background music ${next ? "on" : "off"}.`, "system");
    },
  },

  voice: {
    usage: "voice",
    description: "Toggle HEX voice narration (reads comms aloud).",
    run: (_args, api) => {
      const next = !store.profile.voiceEnabled;
      store.setVoiceEnabled(next);
      api.print(`[*] HEX voice narration ${next ? "on" : "off"}.`, "system");
    },
  },

  save: {
    usage: "save",
    description: "Download your progress as a .synthsave file (to continue elsewhere).",
    run: (_args, api) => {
      exportSave();
      api.print("[✓] Save file downloaded. Keep it — `load` it on any device, or hit LOAD GAME on the boot screen, to continue.", "success");
      // Ticks the Episode 01 onboarding objective (harmless no-op elsewhere).
      api.complete("save");
    },
  },

  load: {
    usage: "load",
    description: "Import a .synthsave file to continue a saved game.",
    run: (_args, api) => {
      api.print("[*] Choose a .synthsave file to import...", "system");
      importSaveViaPicker((msg, ok) => api.print(`[${ok ? "✓" : "!"}] ${msg}`, ok ? "success" : "error"));
    },
  },

  reset: {
    usage: "reset --confirm",
    description: "Wipe all save data and restart the campaign from the Prologue.",
    run: (args, api) => {
      if (args[0] !== "--confirm") {
        return api.print("[!] This erases your save. Re-run as `reset --confirm` to proceed.", "warn");
      }
      store.resetGame();
      api.print("[*] Save wiped. Rebooting...", "system");
      store.startEpisode(store.currentEpisodeId);
    },
  },
};

registerGlobalCommands(commands);
