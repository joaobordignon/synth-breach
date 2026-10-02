# Credits & Acknowledgments

**SYNTH // BREACH** is a free, open-source, educational game. The original
source code is released under the [MIT License](LICENSE). This file credits the
sources the project draws on and lists the licenses of the third-party code and
assets it bundles.

SYNTH // BREACH is a fan / educational project. It is **not affiliated with,
sponsored by, or endorsed by** any of the organizations or creators listed
below. All trademarks belong to their respective owners.

---

## Curriculum & learning content

- **freeCodeCamp** — <https://www.freecodecamp.org/> · <https://github.com/freeCodeCamp/freeCodeCamp>
  The curriculum structure and the concepts taught across the four acts
  (networking, cryptography, penetration testing, web security) are **inspired
  by freeCodeCamp's Cybersecurity and Networking curricula**. All in-game Codex
  reference text and mission content was written originally for this project;
  no freeCodeCamp text is reproduced verbatim. freeCodeCamp is a registered
  501(c)(3) nonprofit — if this project was useful to you, consider supporting
  them.

## Design & concept inspiration

- **cliamp** by [bjarneo](https://github.com/bjarneo) — <https://github.com/bjarneo/cliamp>
  Inspired the idea of an in-terminal music player / background audio control.
- **ai-visualizer** by [jaredrhod](https://github.com/jaredrhod) — <https://github.com/jaredrhod/ai-visualizer>
  Inspired HEX's "Face in Code" visualizer (an image sampled into a grid of
  animated code glyphs).

## Software libraries (bundled)

| Library | Author | License |
| :--- | :--- | :--- |
| [xterm.js](https://xtermjs.org/) (`@xterm/xterm`, `@xterm/addon-fit`) | The xterm.js contributors | MIT |
| [React / React DOM](https://react.dev/) | Meta & contributors | MIT |
| [Vite](https://vitejs.dev/) | Evan You & Vite contributors | MIT |
| [sam-js](https://github.com/discordier/sam) | Christian Schiffler (port) | ⚠️ see note below |

> **sam-js / SAM (Software Automatic Mouth)** — the built-in retro robotic
> voice. SAM is a reverse-engineered version of 1982 commercial software whose
> original copyright holder (SoftVoice, Inc.) is long defunct; the port's author
> states it cannot be placed under a formal open-source license and is best
> described as **abandonware — "use at your own risk."** It is included here for
> its on-theme 8-bit voice and because modern browsers often expose no speech
> voices. If you need a strictly, unambiguously licensed build, you can remove
> `sam-js` — the game falls back to the browser's built-in SpeechSynthesis
> voices (where available) with no loss of other functionality.

## Audio — background music

Royalty-free synthwave tracks from **[Pixabay](https://pixabay.com/music/)**,
used under the [Pixabay Content License](https://pixabay.com/service/license-summary/)
(free for commercial use, no attribution required — credited here anyway).
Artists: **delosound, nickpanek, lofidreams, hitslab, turtlebeats, lnplusmusic,
arpmedia, alex-morgan, zephiramusic.** (See [`public/music/README.md`](public/music/README.md).)

> When no track files are present, the game synthesizes its own generative
> synthwave score with the Web Audio API (original to this project, MIT).

## Imagery

- **Guy Fawkes / Anonymous mask** (`public/hex-mask.png`) — a generic symbol
  associated with the Anonymous movement, provided by the project owner and
  downscaled to grayscale for the "Face in Code" sampler. If you redistribute
  this project, please ensure the mask image you ship is one you have the rights
  to use (e.g. a CC0 / public-domain source), or swap in your own.

## Fonts

The UI references **Cascadia Code** and **Fira Code** by `font-family` name
(both open-licensed — SIL OFL / MIT) but does **not** bundle them; they are used
only if present on the player's system, otherwise a generic monospace font is
used.

---

*Something miscredited or missing? Open an issue or PR — credit should be
correct.*
