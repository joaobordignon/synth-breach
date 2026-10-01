import type { Line, LineKind } from "../engine/types";
import { PALETTE } from "../config";

// Map each LineKind to a palette color, then emit a 24-bit ANSI escape so
// xterm.js renders terminal output in the §4 neon hues. Keeping this in one
// place means the command layer only ever thinks in semantic kinds.

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const KIND_COLOR: Record<LineKind, string> = {
  normal: PALETTE.neonCyan,
  hex: PALETTE.neonPink,
  warden: PALETTE.alertRed,
  success: PALETTE.neonGreen,
  error: PALETTE.alertRed,
  warn: PALETTE.sunsetAmber,
  system: PALETTE.mutedLavender,
  banner: PALETTE.neonPink,
  dim: PALETTE.mutedLavender,
};

const RESET = "\x1b[0m";

export function colorize(line: Line): string {
  const kind = line.kind ?? "normal";
  const [r, g, b] = rgb(KIND_COLOR[kind]);
  const bold = kind === "banner" ? "\x1b[1m" : "";
  return `${bold}\x1b[38;2;${r};${g};${b}m${line.text}${RESET}`;
}
