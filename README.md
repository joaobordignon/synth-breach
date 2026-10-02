# SYNTH // BREACH

A cyberpunk synthwave TUI-style web game teaching cybersecurity fundamentals — networking, cryptography, penetration testing, and web bug hunting — through a 13-episode narrative campaign (Prologue + 12 episodes across 4 acts).

## Status

**Playable end-to-end.** All 13 episodes (Prologue + Acts I–IV) run start-to-finish with the full command engine, the Netrunner Deck, neon/CRT visual FX, synthesized audio, the WARDEN anomaly escalation (0.02 → 10.0-CVSS finale), HEX's mid-campaign confession, the Act III honeypot near-miss, the real-time finale countdown, and both branching endings.

Also included:
- **HEX comms sidebar** — an old-BBS-style transmission feed with a Guy Fawkes / Anonymous **"Face in Code" visualizer**: the mask image (`public/hex-mask.png`) is sampled into a grid of green code glyphs that resolve only while HEX is transmitting or the voice is speaking. HEX dialogue is routed here instead of the terminal, revealed with a **typewriter effect** (click the feed to skip).
- **Prologue briefing box** — the Prologue opens as a Codex-style modal with the mission briefing; HEX's transmission is held until you dismiss it. (Any episode can gate its intro this way via `modal` + `gateIntro`.)
- **Voice narration** — HEX's lines are read aloud via the browser's built-in SpeechSynthesis as they type (toggle in the comms panel or `voice`; the toggle primes audio within the click so it works on first use).
- **Background music** — a **cycling, shuffled playlist** of royalty-free tracks dropped into `public/music/` (auto-listed at build time; ⏭ skips), with a live **generative synthwave** engine as the fallback when no files are present. See [public/music/README.md](public/music/README.md).
- **Save file export / import** — `save` (or the ⇩ SAVE button) downloads a `.synthsave` file; `load` (⇧ LOAD) imports one to continue on any device. No account, fully offline.

- **[docs/SPEC.md](docs/SPEC.md)** — full technical spec and game design document.
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — build tracker (now mostly checked off).

## Running it

```bash
npm install
npm run dev        # Vite dev server
npm run build      # static production bundle in dist/
npm run preview    # serve the production build
```

Then open the printed URL and type `help` in the console.

### Controls

- Type commands in the console (`help`, `objectives`, `intel`, `codex`, `status`, `missions`).
- `↑ / ↓` recall command history · `Tab` completes command names.
- `F1` toggles the Codex reference library · `Esc` closes it.
- `Alt+M` (or `mute`) toggles sound effects · `music` toggles background music · `voice` toggles HEX narration (buttons for these two live in the comms panel).
- `save` / `load` (or the header ⇩ SAVE / ⇧ LOAD buttons) export and import a `.synthsave` file to continue elsewhere.
- `next` advances to the next episode once its objectives are complete; `goto <id>` replays any unlocked episode; `reset --confirm` wipes the save.

## Tests

```bash
npm run typecheck   # tsc --noEmit
npm run playtest    # headless end-to-end run of all 13 episodes + both endings
```

`scripts/smoke.mjs` additionally drives the real UI in Chromium (needs `playwright-core` and a local Chromium) and screenshots the deck.

## Stack

Browser-only, no backend: **TypeScript + Vite + React**, with an [xterm.js](https://xtermjs.org/) console wired to a fully **simulated** command engine — every in-game command (`scan`, `decode`, `exploit`, …) is deterministic in-memory logic that never touches a real shell, socket, or filesystem. Visual FX are plain CSS (neon glow, CRT scanlines, glitch) plus a `<canvas>` for the victory fireworks; audio is the Web Audio API; saves live in `localStorage`. See §2 of the spec for the full rationale.

## Architecture

```
src/
  engine/        gameStore (state + output stream + EngineApi), globalCommands,
                 simulator (pure crypto/network/hash primitives), types
  chapters/      one Episode per chapter — intro/objectives/commands/hints/outro
  ui/            Header · IntelPane · TelemetryPane · TerminalPane · CommsPane ·
                 HexFace · SaveBar · CodexModal · FxLayer
  state/         profile (localStorage) · saveFile (export/import) · useGame hook
  codex/         reference-library content (JSON)
  music.ts       generative synthwave score · voice.ts  HEX narration (SpeechSynthesis)
scripts/         playtest (headless logic) · smoke (browser)
```

Episodes declare *what* commands exist and *which* objectives win the chapter; the store enforces progression, tracks the WARDEN gauge and score, and streams colored output to the terminal.

## License

TBD.
