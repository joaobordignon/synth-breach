# SYNTH // BREACH

A cyberpunk synthwave TUI-style web game teaching cybersecurity fundamentals — networking, cryptography, penetration testing, and web bug hunting — through a 13-episode narrative campaign (Prologue + 12 episodes across 4 acts).

## Status

Currently in the design phase. No application code has been written yet.

- **[docs/SPEC.md](docs/SPEC.md)** — the full technical specification and game design document: tech stack, narrative bible, episode-by-episode script, curriculum mapping, and visual/audio design.
- **`src/codex/`** — reference-library content (networking, cryptography, pentesting, web security), structured as JSON, meant to back the in-game `codex` command and F1 reference modal once the app exists.

## Planned Stack

Browser-based web app (TypeScript + Vite + React) with an [xterm.js](https://xtermjs.org/) instance for the command console, giving a real-terminal feel without ever executing real shell commands — every command in the game is fully simulated. See §2 of the spec for the full rationale.

## License

TBD.
