import type { Chapter } from "../baseChapter";

// Prologue: "First Boot" — see docs/SPEC.md §11 for the full scripted
// onboarding sequence (handle selection, the PRECOG vignette, the shell
// basics drill, and the Operating Code ethics briefing). This entry is
// the reference implementation other chapters should follow as their
// dialogue trees get ported over from the spec.
export const episode00: Chapter = {
  id: 0,
  act: 0,
  title: "First Boot",
  concepts: [
    "What a shell/terminal is",
    "Command anatomy (command --flag value)",
    "Command history & tab-completion",
    "help / intel / codex",
    "The Null Pointer Collective's Operating Code (ethics & scope)",
  ],
  briefing:
    "[COMMS // HEX]: Signal's clean. You're jacked in. First things first — before I hand you a single " +
    "target, I need to know you can drive this rig. Type `help` and let's see what you've got.",
  hints: [
    "Every command in this shell follows the same shape: a command name, then optional --flags. " +
      "Nothing here can break anything real — this whole range is simulated and air-gapped.",
    "Try typing `help` to see every available command, or `help <command>` for details on one.",
    "Type `help`, then `accept-code` once you've read the Operating Code, then `codex` to open the reference library.",
  ],
  implemented: true,
};
