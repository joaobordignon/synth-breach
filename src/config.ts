// Neon color tokens, settings, and hotkeys. Single source of truth for the
// palette defined in docs/SPEC.md §4 — applied to CSS custom properties at
// startup (see main.tsx) so ui/styles.css never hardcodes a hex value.

export const PALETTE = {
  synthBg: "#0d0221",
  synthPanelBg: "#150834",
  neonCyan: "#01cdfe",
  neonPink: "#ff71ce",
  sunsetAmber: "#ffb900",
  neonGreen: "#05ffa1",
  alertRed: "#ff2a6d",
  mutedLavender: "#8a79a5",
} as const;

export const HOTKEYS = {
  openCodex: "F1",
  toggleMute: "m",
} as const;

export const SAVE_KEY = "synth-breach-profile";
