import type { Episode, Line } from "../../engine/types";

// The Null Pointer Collective's Operating Code — surfaced in the terminal when
// the operator opens the `codex`, so it's read BEFORE `accept-code` signs it.
const OPERATING_CODE: Line[] = [
  { text: "═══ THE NULL POINTER COLLECTIVE — OPERATING CODE ═══", kind: "banner" },
  { text: "  1. We breach only what we're cleared to breach.", kind: "normal" },
  { text: "  2. This entire rig is a simulated, air-gapped training shard.", kind: "normal" },
  { text: "  3. This knowledge used against a system you don't own is a felony, not heroism.", kind: "normal" },
  { text: "  4. You're learning to be dangerous — responsibly.", kind: "normal" },
];

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
  gateIntro: true,
  modal: {
    title: "FIRST BOOT // MISSION BRIEFING",
    lead: "The year is 1989. Aether Dynamics runs PRECOG — a secret AI that scores ordinary citizens as \"threats,\" with no appeal and no oversight. You are a rogue Netrunner of the Null Pointer Collective. This is your induction.",
    sections: [
      {
        heading: "WHY YOU'RE JACKED IN",
        lines: [
          "Months ago, PRECOG flagged someone close to you — ECHO — as a \"threat pattern.\"",
          "Detained. Blacklisted from housing, banking, and work on a score nobody could see,",
          "appeal, or explain. Every subnet you breach is a step toward tearing that machine apart",
          "and clearing their record. Not for the thrill. For ECHO.",
        ],
      },
      {
        heading: "THE RIG",
        lines: [
          "This isn't a joystick — it's a shell. You type what you mean, it does exactly that.",
          "Every command is fully simulated and air-gapped: nothing here touches a real system.",
          "• help — list commands · help <cmd> for one   • codex (F1) — free reference library",
          "• intel — a tiered hint   • objectives — your checklist   • ↑/↓ history · Tab completes",
        ],
      },
      {
        heading: "THE OPERATING CODE",
        lines: [
          "We breach only what we're cleared to breach. This whole range is a training shard.",
          "The same knowledge used against a system you don't own is a felony, not heroism.",
          "When you close this briefing, HEX comes online. Your first task: help, codex, accept-code.",
        ],
      },
    ],
    dismissLabel: "JACK IN ▸",
  },
  intro: [
    "[COMMS // HEX]: Signal's clean. You're jacked in, {handle}. I read you five-by-five.",
    "[COMMS // HEX]: You read the Code. Good. Now prove you can drive this rig — type `help` and",
    "let's see what you've got.",
    "[COMMS // HEX]: Then read the Operating Code in-shell and `accept-code`. Check the `codex`",
    "anytime — it's free, always, no judgment. You're on the deck as {handle} — change that tag",
    "whenever you want with `handle <name>`, I'll keep up.",
    "[COMMS // HEX]: When you're squared away, I'll hand you your first live target.",
  ],
  objectives: [
    { id: "help", label: "Run `help` to see your toolkit" },
    { id: "codex", label: "Open the `codex` reference library (it's free)" },
    { id: "accept-code", label: "Read & `accept-code` — the Operating Code" },
  ],
  // Reveal the three onboarding steps one at a time, in order.
  progressiveObjectives: true,
  hints: [
    "Every command follows one shape: a name, then optional --flags and values. Nothing here can " +
      "break anything real — the whole range is simulated and air-gapped.",
    "Type `help` to list commands, `codex` to open the library, then read the code and `accept-code`.",
    "Three steps clear the Prologue, in order: list your toolkit, open the reference library (it's " +
      "free), then acknowledge the Operating Code to sign in. Each is a single word.",
  ],
  outro: [
    "[COMMS // HEX]: Good. You can drive, and you know the rule. Welcome to the active roster,",
    "{handle}. I'm unlocking the first live target range: 10.42.0.0/24, Aether's outer perimeter.",
    "[COMMS // HEX]: Somewhere past that router is the machine that scored ECHO. We start there.",
  ],
  beats: [
    {
      trigger: "intro",
      prompt: "You still with me, {handle}? First run's always the one that sticks.",
      replies: [
        { text: "Ready. Point me at it.", response: ["Good. No hesitation — that's the right kind of scared. Start with `help`."] },
        {
          text: "...This is really all simulated?",
          response: ["Every byte. Air-gapped shard. Out there it's a felony; in here it's a classroom. Breathe — then `help`."],
        },
        {
          text: "Why me?",
          tone: "warm",
          response: ["Because you've got a reason. People with reasons don't quit at the first locked door. Now — `help`."],
        },
      ],
    },
  ],
  commands: {
    // Prologue-local override of the global `codex`: same reference library, but
    // it also prints the Operating Code to the terminal so the operator reads it
    // before signing with `accept-code`.
    codex: {
      usage: "codex [topic|command]",
      description: "Open the reference library. `codex <command>` jumps to the matching concept.",
      help: [
        "No argument opens this episode's topic.",
        "codex <topic>    networking · cryptography · pentesting · webSecurity",
        "codex <command>  jumps to the concept behind a tool, e.g. `codex netmap`.",
      ],
      run: (args, api) => {
        // One step at a time: `help` comes first so the toolkit is in view.
        if (!api.isComplete("help")) {
          return api.print("[COMMS // HEX]: Hold up — run `help` first, so you can see the kit you're working with. Then open the `codex`.", "hex");
        }
        const query = args.join(" ").trim();
        api.print(`[*] Opening CODEX reference library${query ? ` → ${query}` : ""}... (free, no penalty)`, "system");
        api.openCodex(query || undefined);
        api.complete("codex");
        api.print([
          { text: "", kind: "normal" },
          ...OPERATING_CODE,
          { text: "", kind: "normal" },
          { text: "[*] That's the Operating Code. Read it, then `accept-code` to sign in.", kind: "system" },
        ]);
        api.print("[COMMS // HEX]: Last step — read the Operating Code I just printed, then `accept-code`.", "hex");
      },
    },
    "accept-code": {
      usage: "accept-code",
      description: "Formally acknowledge the Null Pointer Collective's Operating Code.",
      run: (_args, api) => {
        // Enforce the order: you can't sign the Code before you've opened it.
        if (!api.isComplete("codex")) {
          return api.print("[COMMS // HEX]: Not yet — open the `codex` first and read the Operating Code. Then you can sign it.", "hex");
        }
        // Always reprint the Code at the moment of signing — so it's on screen
        // right here, never scrolled away by the help listing.
        api.print([...OPERATING_CODE, { text: "", kind: "normal" }, { text: "[✓] Operating Code acknowledged. Signed in.", kind: "success" }]);
        api.addScore(50);
        api.complete("accept-code");
      },
    },
  },
};
