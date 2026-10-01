import type { Episode } from "../../engine/types";

// Prologue: "First Boot" (docs/SPEC.md §11.0). Pure onboarding — no CVSS, no
// target, cannot be failed. Teaches the shell, the command anatomy, and the
// Null Pointer Collective's Operating Code before anything is at stake. Its
// three objectives (`help`, `codex`, `accept-code`) are ticked by the global
// commands of the same name plus the episode-local `accept-code` below.

export const episode00: Episode = {
  id: 0,
  act: 0,
  title: "First Boot",
  concepts: [
    "What a shell/terminal is",
    "Command anatomy: command --flag value",
    "Command history (↑/↓) & tab-completion",
    "help / intel / codex are always free",
    "The Operating Code (ethics & scope)",
  ],
  briefing: "HEX: Before I hand you a target, prove you can drive this rig. Type `help`.",
  codexTopic: "networking",
  intro: [
    "[COMMS // HEX]: Signal's clean. You're jacked in.",
    "[COMMS // HEX]: First things first — before I hand you a single target, I need to know you can",
    "drive this rig. This isn't a joystick, Decker. It's a shell. You type what you mean, it does",
    "exactly that — no more, no less.",
    "",
    { text: "  — FLASHBACK // PRECOG INCIDENT ———————————————————————————", kind: "dim" },
    { text: "  Months ago, Aether's PRECOG model flagged someone close to you — ECHO — as a", kind: "dim" },
    { text: "  'threat pattern.' Detained. Blacklisted from housing, banking, work. A score nobody", kind: "dim" },
    { text: "  could see, appeal, or explain. That's why we're doing this. Not for the thrill. For ECHO.", kind: "dim" },
    { text: "  ——————————————————————————————————————————————————————————", kind: "dim" },
    "",
    "[COMMS // HEX]: Type `help` and let's see what you've got. Read the Operating Code and",
    "`accept-code` when you're ready. Check the `codex` too — it's free, always, no judgment.",
    { text: "(Optional: set your handle with `handle <name>`. Default is CYBER//ZERO.)", kind: "dim" },
  ],
  objectives: [
    { id: "help", label: "Run `help` to see your toolkit" },
    { id: "codex", label: "Open the `codex` reference library (it's free)" },
    { id: "accept-code", label: "Read & `accept-code` — the Operating Code" },
  ],
  hints: [
    "Every command follows one shape: a name, then optional --flags and values. Nothing here can " +
      "break anything real — the whole range is simulated and air-gapped.",
    "Type `help` to list commands, `codex` to open the library, then read the code and `accept-code`.",
    "Run these three in order: `help`, `codex`, `accept-code`. That's the whole Prologue.",
  ],
  outro: [
    "[COMMS // HEX]: Good. You can drive, and you know the rule. Welcome to the active roster,",
    "Decker. I'm unlocking the first live target range: 10.42.0.0/24, Aether's outer perimeter.",
    "[COMMS // HEX]: Somewhere past that router is the machine that scored ECHO. We start there.",
  ],
  commands: {
    "accept-code": {
      usage: "accept-code",
      description: "Formally acknowledge the Null Pointer Collective's Operating Code.",
      run: (_args, api) => {
        api.print([
          { text: "═══ THE NULL POINTER COLLECTIVE — OPERATING CODE ═══", kind: "banner" },
          { text: "  1. We breach only what we're cleared to breach.", kind: "normal" },
          { text: "  2. This entire rig is a simulated, air-gapped training shard.", kind: "normal" },
          { text: "  3. This knowledge used against a system you don't own is a felony, not heroism.", kind: "normal" },
          { text: "  4. You're learning to be dangerous — responsibly.", kind: "normal" },
          { text: "", kind: "normal" },
          { text: "[✓] Operating Code acknowledged. Signed in.", kind: "success" },
        ]);
        api.addScore(50);
        api.complete("accept-code");
      },
    },
  },
};
