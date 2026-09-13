# SYNTH // BREACH — Technical Specification & Game Design Document
**Genre:** Cyberpunk / Synthwave Educational Terminal User Interface (TUI) Game  
**Target Audience:** Beginners to intermediate learners interested in Cybersecurity, Ethical Hacking, and Computer Networking  
**Curriculum Foundation:** Inspired by freeCodeCamp Cybersecurity & Networking Curricula  

---

## 1. Executive Summary & Philosophy
`SYNTH // BREACH` is an interactive TUI-based educational game designed to teach authentic cybersecurity and networking concepts through a gamified, retro-futuristic 1980s synthwave terminal experience. Rather than dry rote-memorization or passive video consumption, learners actively operate tools, analyze packet captures, crack hashes, exploit vulnerabilities, and defend critical infrastructure in simulated environments.

---

## 2. Core Technology Stack & Architecture
**Platform note**: The project pivoted from a real-terminal Python/Textual app to a **browser-based web app with a TUI look and feel**. Every in-game command was always fully simulated — `scan --target X` never touched a real shell, and per the Episode 00 safety framing it never will — so a browser can render the identical simulated command experience with no loss of pedagogical fidelity, while making the visual FX in §9 dramatically easier to achieve and removing all install friction for players (open a link vs. `pip`/`pipx` setup).

| Component | Selected Technology | Rationale |
| :--- | :--- | :--- |
| **Language & Runtime** | **TypeScript**, built with **Vite** | Type safety catches command-parser bugs early; Vite gives an instant dev server and a simple static-site build — no backend process to run or deploy. |
| **UI Framework** | **React** (Vite's `react-ts` template) | Manages the 13-episode state machine (unlocked chapters, hint tier, score) as ordinary component state instead of hand-rolled Textual reactivity; large ecosystem, easy for a solo dev to find answers. |
| **Command Pane / "Fake Terminal"** | **xterm.js** | The same terminal-emulator component VS Code's integrated terminal uses — real cursor behavior, ANSI color codes, scrollback, copy/paste — without ever touching a real shell. It only renders keystrokes and printed output; the actual command logic still lives in a TypeScript parser/simulator layer underneath, same responsibility `parser.py`/`simulator.py` had in the original design. |
| **Styling & Visual FX** | Plain **CSS** (custom properties for the §4 palette tokens) + CSS filters/box-shadow/animations, with an HTML `<canvas>` layer only for glitch/matrix text corruption | 1:1 replacement for Textual's TCSS token system, but a browser renders glow/bloom/blur/scanlines as real visual effects instead of approximating "glow" with bright terminal colors. |
| **Audio** | **Web Audio API** (or plain `<audio>` elements) | Real, mixed, volume-controlled SFX playback — no ANSI-bell workaround, no OS audio permissions or C-library dependencies to fight. |
| **Packaging & Distribution** | Static site (Vite build output) hosted anywhere that serves static files (GitHub Pages, Netlify, Vercel), or opened straight from `index.html` | Zero install for players — "click a link" replaces `pipx run synth-breach`. No server, no backend, no Python environment required on the player's machine. |
| **Data & Save Persistence** | Browser **`localStorage`** (JSON), same schema as the original design (unlocked nodes, scores, achievements) | Drop-in replacement for the `~/.config/synth-breach/profile.json` file — identical shape, different storage API. Upgradeable to `IndexedDB` or a small backend later only if cross-device save sync is ever wanted; not needed for MVP. |

---

## 3. Interaction Model & Deck Layout Architecture
The interface still follows the **Hybrid Netrunner Deck** paradigm — visual feedback panels surrounding a hands-on command console — now laid out with CSS Grid/Flexbox in the browser instead of a Textual container tree. The player-facing experience described below is unchanged by the platform pivot.

### Screen Partitioning Blueprint
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚡ SYNTH // BREACH [LEVEL 01: SUBNET INFILTRATION]            [SCORE: 1337] │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 📜 MISSION INTEL & THEORY (40%)      │ 📡 TELEMETRY & NETWORK MAP (60%)     │
│  - Concept Briefing (freeCodeCamp)   │  - ASCII Topology Map & Target Nodes │
│  - Field Objectives & Hints          │  - Port Status & Vulnerability Flags │
│  - Security Knowledge Notes          │  - Dynamic Status Gauges & Alarms    │
├──────────────────────────────────────┴──────────────────────────────────────┤
│ 💻 NETRUNNER VIRTUAL SHELL (Interactive Command Line Prompt)                │
│  operator@synth:~$ scan --target 10.0.4.15 --ports common                   │
│  [✓] PORT 22 (SSH) - OPEN [OpenSSH 8.2p1]                                   │
│  [✓] PORT 80 (HTTP) - OPEN [Apache 2.4.41]                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Interactive Command Engine**:
  - The command pane is an `xterm.js` instance for rendering (cursor, ANSI colors, scrollback) wired to a custom TypeScript command engine underneath — `xterm.js` has no idea what `scan` means; it only renders keystrokes and printed output. Tab-completion, command history (`Up`/`Down` arrows), and syntax-error highlighting are all implemented in that command-engine layer, same responsibility the original `parser.py` had, just running client-side in the browser.
  - Commands still mirror real security tooling (e.g., `scan`, `decrypt`, `inject`, `inspect`, `crack`, `rules`) — the platform pivot changes nothing about command design.
- **Theory & Tutorial Pane**:
  - Still distills bite-sized principles from freeCodeCamp modules before and during active challenges — now a React component rendering the Codex JSON content instead of a Textual widget.
  - `help <command>` and `intel` behave identically from the player's perspective; only the renderer underneath changed.

---

## 4. Visual Identity & CSS Design Tokens
The aesthetic adheres to **Outrun Neon Synthwave** with high-contrast glowing hues against deep void backdrops.

### Palette Tokens (TrueColor Hex)
| Token Name | Hex Code | Purpose / UI Application |
| :--- | :--- | :--- |
| `SYNTH_BG` | `#0d0221` | Deep void purple — Primary application background |
| `SYNTH_PANEL_BG` | `#150834` | Midnight synth purple — Widget, card, and panel containers |
| `NEON_CYAN` | `#01cdfe` | Primary interactive elements, port scanners, data links, prompt symbol |
| `NEON_PINK` | `#ff71ce` | Headers, critical objectives, highlight accents, high-priority nodes |
| `SUNSET_AMBER` | `#ffb900` | Warning states, unverified packets, pending authorizations, badges |
| `NEON_GREEN` | `#05ffa1` | Success indicators, decrypted payloads, verified tokens, safe status |
| `ALERT_RED` | `#ff2a6d` | Intrusion alerts, failed exploits, locked ports, active countermeasures |
| `MUTED_LAVENDER` | `#8a79a5` | Inactive borders, timestamps, secondary help text |

### Typography & Border Styling
- **Double Borders**: Unicode box-drawing double lines (`╔═╗`, `║ ║`, `╚═╝`) with dynamic CSS border-tinting.
- **ASCII Art Banners**: Stylized 80s slanted/shadowed typography for title screens, victory splashes, and chapter transitions.
- **Visual Effects**: Simulated CRT scanline divider bars (`┈ ┈ ┈`), typewriter output delays for story briefings, and blinking prompt cursors (`█`).

---

## 5. Curriculum Architecture & freeCodeCamp Alignment
The game is structured across 4 progressive acts directly mirroring freeCodeCamp's core cybersecurity tracks:

```text
  [ACT I: NETWORK 101]      ──►  [ACT II: CRYPTOGRAPHY]
  • OSI / TCP/IP Layers          • Encoding vs Encryption
  • Port Scanning & Banners      • Ciphers (Caesar, XOR)
  • Packet Analysis & DNS        • Hashes, Salts & Rainbow Tables
            │                                  │
            ▼                                  ▼
  [ACT III: PENTESTING]     ──►  [ACT IV: BUG HUNTING]
  • Reconnaissance Methodology   • SQL Injection (Auth & Data)
  • Service Enumeration          • Stored & Reflected XSS
  • Exploits & Misconfig         • IDOR & Path Traversal
  • Post-Exploitation Escalation • Bug Bounties & Remediation
```

### Detailed Act Breakdown
1. **Act I: Network 101 (The Digital Highway)**
   - *freeCodeCamp Reference*: "Network Fundamentals Course" & "Computer Networking Tutorial".
   - *Concepts*: IP addressing (IPv4), CIDR masks, TCP 3-way handshake (SYN, SYN-ACK, ACK), UDP vs TCP, essential ports (21, 22, 25, 53, 80, 443, 3306, 8080), DNS resolution.
   - *In-Game Simulated Tools*: `netmap`, `ping`, `traceroute`, `portscan`, `banner-grab`.

2. **Act II: Cryptography (The Cipher Matrix)**
   - *freeCodeCamp Reference*: "Cryptography Course - Cryptographic Protocols" & "CompTIA Security+".
   - *Concepts*: Encoding (Base64, Hex, Binary) vs. Encryption; Classical Ciphers (Caesar, Vigenère, XOR); Modern Hashing (MD5, SHA-256); Dictionary Attacks vs. Rainbow Tables; Public/Private Keys (RSA) and digital signatures.
   - *In-Game Simulated Tools*: `encode/decode`, `cipher-crack`, `hash-check`, `dict-attack`, `keygen`.

3. **Act III: Penetration Testing (Netrunner Infiltration)**
   - *freeCodeCamp Reference*: "Full Ethical Hacking Course - Network Penetration Testing".
   - *Concepts*: 5 Phases of Pentesting (Recon, Scanning, Gaining Access, Maintaining Access, Covering Tracks); CVE vulnerability databases; default credential exploitation; Privilege Escalation (Linux permissions, SUID binaries).
   - *In-Game Simulated Tools*: `vulnscan`, `exploit-db`, `payload-gen`, `priv-esc`, `session-manager`.

4. **Act IV: Bug Hunting & Web Exploits (The Megacorp Bounty)**
   - *freeCodeCamp Reference*: "Web App Penetration Testing" & "Bug Bounty Hunting Tutorial".
   - *Concepts*: OWASP Top 10 vulnerabilities; SQL Injection (tautology bypass `' OR '1'='1`, UNION-based extraction); Cross-Site Scripting (XSS payloads `<script>`); IDOR (manipulating `user_id` in API requests); Path Traversal (`../../etc/passwd`); Responsible disclosure and vulnerability remediation.
   - *In-Game Simulated Tools*: `curl-intercept`, `inject-sql`, `fuzz-param`, `xss-probe`, `bounty-report`.

---

## 6. Narrative Worldbuilding & Campaign Setting

### The Lore
The year is 1989 in an alternate cyberpunk continuum. Global data infrastructure has been monopolized by **Aether Dynamics**, a ruthless defense contractor operating a clandestine predictive-surveillance program codenamed **PRECOG** — an AI risk-scoring system that flags "threat patterns" among ordinary citizens with no appeal, no transparency, and no oversight.

### The Protagonist: Why You're Jacked In
You are **CYBER//ZERO** (handle customizable at game start), a rogue Netrunner operating out of an encrypted neon-lit bunker, backed by the underground resistance group **The Null Pointer Collective**. This isn't abstract activism: months before the campaign begins, PRECOG's risk-scoring algorithm flagged someone close to you — a sibling, in the default framing — as a threat pattern. They were detained and blacklisted from housing, banking, and employment systems on the strength of a score nobody could see, appeal, or explain. Every subnet you breach is a step toward tearing that machine apart and clearing their record.

### Your Mentor: HEX
**HEX**, lead infiltrator for the Null Pointer Collective, guides you via encrypted comms (`[COMMS // HEX]`) from Episode 00 onward. HEX is not just a hint-dispenser — across scripted beats, it's revealed that HEX is a former Aether Dynamics senior systems architect who helped design PRECOG's early scoring logic before defecting in disgust at what it was used for. HEX's technical fluency throughout the game ("I know this because I built it") is diegetically explained, not just narrator convenience.
- **The gut-punch reveal** (mid-Act II, end of Episode 06 / transition into Act III): HEX privately admits that an early build of the very scoring model that flagged your family member was HEX's own code. This recontextualizes every hint HEX has given so far as an act of atonement, not just mentorship.

### The Antagonist: THE WARDEN
Aether's production intrusion-detection and defense AI is **THE WARDEN** — the deployed, hardened descendant of PRECOG's core logic. THE WARDEN is not a passive target; it reacts to the player across the campaign:
- **Act I**: Passive log alerts and generic firewall messages — WARDEN barely notices you.
- **Act II**: After ciphers are cracked, WARDEN begins rotating keys and schemes in response — a visible sign it's adapting.
- **Act III**: WARDEN plants a honeypot administration service that nearly traps the player (a scripted near-miss, not a game-over) — foreshadowing that it can now bait, not just block.
- **Act IV / Finale**: WARDEN directly confronts CYBER//ZERO in Episode 12 in a real-time reactive encounter (see §14).

The human face of Aether Dynamics is **Director Kovacs**, established in Episodes 4, 5, 6, 10 & 11, who oversees the WARDEN/PRECOG program and whose own private dossiers surface in Episode 11.

### The Mid-Campaign Trust Twist (Act II → Act III transition)
Word reaches the Collective that another hacktivist cell was caught, and the intel trail points back to something HEX passed along. For one chapter, the player has reason to question whether HEX's information is safe to act on. The resolution, delivered early in Act III, is technical rather than a betrayal: WARDEN has begun adaptively tracing behavioral patterns across breaches — it's learning from you, not being fed by a mole inside the Collective. This reframes WARDEN from "target" to "active adversary" heading into the finale, and keeps HEX's trustworthiness intact.

### The Ethical Code (introduced in Episode 00, reinforced each Act)
Before the first breach, HEX walks the player through **The Null Pointer Collective's Operating Code**: you only breach systems you're explicitly authorized to test; this campaign is a fully simulated, air-gapped training range built for exactly this purpose; real-world unauthorized access is a crime, not heroism. A short callback line reopens at the start of each Act ("same rule as always, Decker") so the framing is reinforced, not a one-time disclaimer.

### The Finale Choice: Vigilante vs. Whistleblower
At the close of Episode 12, after `bounty-report --compile`, the player is given an explicit choice instead of a single scripted ending:
- **`broadcast-leak --mode=public`** ("Full Exposure"): Immediate, maximum-damage public dump of everything on Aether Dynamics. Aether collapses fast — but the epilogue notes the collateral cost: PRECOG's victim data (including your own family member's records) is exposed alongside everything else, with no clean legal process to formally clear their name. Ending title: **VIGILANTE OPERATOR**.
- **`bounty-report --submit --responsible`** ("Coordinated Disclosure"): The dossier goes to regulators and press with a structured remediation window. Justice is slower, but the epilogue shows systemic reform and a formal audit — and, the direct emotional payoff, your family member's record is legally and cleanly expunged. Ending title: **WHITEHAT OPERATOR / CERTIFIED WHISTLEBLOWER**.

Both endings are "wins," but only one resolves the personal stakes cleanly — the choice itself is the game's final lesson on responsible disclosure, experienced rather than lectured.

### Target Architecture (The 4 Corporate Subnets)
```text
  [SUBNET ALPHA: EDGE-PERIMETER]  (Act I - Network 101)
   └── Public DMZ, perimeter firewalls, exposed DNS records, edge gateways.

  [SUBNET BETA: CRYPTO-VAULT]     (Act II - Cryptography)
   └── Encrypted internal relays, hash storage dumps, proprietary cipher channels.

  [SUBNET GAMMA: BASTION-CORE]    (Act III - Penetration Testing)
   └── High-security servers, vulnerable unpatched services, privilege rings.

  [SUBNET OMEGA: AETHER CLOUD]    (Act IV - Bug Hunting)
   └── Megacorp web APIs, executive portals, database backends, proprietary zero-days.
```

---

## 7. Pedagogical Engine & In-Game Learning Systems

### Tiered Decker Intel System (`intel` command)
To prevent learner frustration while maximizing active problem-solving, each challenge implements a 3-tier progressive hint mechanism:
1. **Tier 1 (Theory Primer)**: Explains the fundamental computer science / security principle behind the objective (citing real RFCs, protocol standards, or freeCodeCamp learning concepts).
2. **Tier 2 (Syntax & Flag Nudge)**: Guides the user toward the appropriate command and parameters without giving away the exact solution (e.g., *"Check what port 3306 is running and inspect its service banner with `--banner`"*).
3. **Tier 3 (Terminal Override / Full Solution)**: Provides the exact command and payload along with a comprehensive breakdown of *why* it works.

### In-Game `codex` Reference Library
The deck includes a dedicated **CODEX modal/tab** accessible anytime (`F1` or `codex <topic>`):
- **Network Reference**: Port directory (21, 22, 23, 25, 53, 80, 443, 3306, etc.), OSI 7-layer vs TCP/IP 4-layer comparison, subnet mask tables.
- **Crypto Reference**: Encoding vs Encryption distinction, Hash collision basics, ASCII / Hex conversion tables.
- **Pentest Methodology**: The 5-stage reconnaissance lifecycle cheat-sheet.
- **OWASP Reference**: Top 10 web vulnerabilities explained in plain English with vulnerable vs secured code examples.

### Scoring & Mastery Progression
- **Zero-Penalty Learning**: Reading the Codex or viewing Tier 1 theory hints never deducts points.
- **Bounty Score (REP / Creds)**: Points awarded for clean command execution, identifying subtle clues, and completing challenges without Tier 3 overrides.

---

## 8. The 12-Chapter Episodic Campaign Roadmap

Each of the 4 Acts comprises 3 tightly scripted, narrative-driven chapters (12 chapters total), preceded by a non-Act **Episode 00 Prologue** that onboards the player and establishes the campaign's personal stakes and ethical framing (see §6 and §11.0).

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│              PROLOGUE (Ep 00) + 12-EPISODE CAMPAIGN MAP                     │
│  Ep 00: First Boot — terminal onboarding, handle select, Collective's Code  │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ ACT I: NETWORK 101                │ ACT II: CRYPTOGRAPHY                    │
│  Ch 1: The Gateway Knock (Ping & Ports) Ch 4: The Ciphertext Wire (Base64/Hex)│
│  Ch 2: The Three-Way Handshake    │  Ch 5: The Caesar & XOR Anomaly         │
│  Ch 3: The Ghost Service (Banners)│  Ch 6: Shattering the Salt (Hashes)     │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ ACT III: PENTESTING               │ ACT IV: BUG HUNTING                     │
│  Ch 7: The Perimeter Scan (CVEs)  │  Ch 10: The Broken Gate (Auth SQLi)     │
│  Ch 8: The Default Bastion (Creds)│  Ch 11: The Phantom Parameter (IDOR)    │
│  Ch 9: Ring-0 Escalation (SUID)   │  Ch 12: Zero-Day Protocol (Disclosure)  │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

### Detailed Chapter Progression

#### ACT I: NETWORK 101 (Subnet Alpha: Edge Perimeter)
- **Episode 01 — "The Gateway Knock"**
  - *Story Hook*: Infiltrating Aether Dynamics' outer perimeter edge router (`10.42.0.1`).
  - *Learnings*: ICMP echo requests (ping), IPv4 subnetting basics, and recognizing active hosts.
  - *Commands*: `ping`, `netmap --range 10.42.0.0/24`.
- **Episode 02 — "The Three-Way Handshake"**
  - *Story Hook*: Identifying open listening entry points through the corporate firewall.
  - *Learnings*: TCP 3-way handshake (SYN, SYN-ACK, ACK), common well-known ports (21 FTP, 22 SSH, 80 HTTP, 443 HTTPS).
  - *Commands*: `portscan --target 10.42.0.1 --mode syn`.
- **Episode 03 — "The Ghost Service"**
  - *Story Hook*: A secret backend administration service is running on an obscure port (8088).
  - *Learnings*: Service banner grabbing, distinguishing service versions, unencrypted cleartext protocols (Telnet/HTTP) vs encrypted (SSH/TLS).
  - *Commands*: `banner-grab --port 8088`, `inspect --protocol http`.

#### ACT II: CRYPTOGRAPHY (Subnet Beta: Crypto Vault)
- **Episode 04 — "The Ciphertext Wire"**
  - *Story Hook*: Intercepting an encoded data packet transmitted between internal relays.
  - *Learnings*: Encoding vs. Encryption; understanding Base64, Hexadecimal, and ASCII byte representations.
  - *Commands*: `decode --base64 <data>`, `hexview <stream>`.
- **Episode 05 — "The Caesar & XOR Anomaly"**
  - *Story Hook*: Legacy telemetry stream encrypted with rotating classical shift and XOR stream ciphers.
  - *Learnings*: Classical ciphers (Caesar shift, frequency analysis), XOR bitwise encryption properties, and symmetric key foundations.
  - *Commands*: `cipher-crack --type caesar`, `xor-decrypt --key <byte>`.
- **Episode 06 — "Shattering the Salt"**
  - *Story Hook*: Extracting the internal authentication database dump containing password hashes.
  - *Learnings*: One-way cryptographic hash functions (MD5, SHA-1, SHA-256), cryptographic salts, rainbow tables, and dictionary attacks.
  - *Commands*: `hash-identify <hash>`, `crack --wordlist rockyou.txt --hash <hash>`.

#### ACT III: PENTESTING (Subnet Gamma: Bastion Core)
- **Episode 07 — "The Perimeter Scan"**
  - *Story Hook*: Mapping out internal high-value targets across the corporate DMZ.
  - *Learnings*: The 5 stages of pentesting, vulnerability scanning, correlating software versions with known Common Vulnerabilities and Exposures (CVEs).
  - *Commands*: `vulnscan --host 10.42.20.10`, `cve-search --service <name>`.
- **Episode 08 — "The Default Bastion"**
  - *Story Hook*: Exploiting misconfigured administration terminals and unpatched services.
  - *Learnings*: Authentication bypass via factory default credentials, anonymous FTP access, and misconfigured permissions.
  - *Commands*: `exploit --target 10.42.20.10 --vuln CVE-1989-XXXX`, `ssh-connect`.
- **Episode 09 — "Ring-0 Escalation"**
  - *Story Hook*: You have low-privilege guest access on the target server; you must escalate to root.
  - *Learnings*: Linux privilege escalation, SUID bit permissions (`chmod u+s`), path hijacking, and root file access.
  - *Commands*: `find-suid`, `priv-esc --vector suid-override`, `whoami`.

#### ACT IV: BUG HUNTING (Subnet Omega: Aether Cloud)
- **Episode 10 — "The Broken Gate"**
  - *Story Hook*: Intercepting the executive login endpoint of Aether's central command portal.
  - *Learnings*: SQL Injection (SQLi) mechanics, string concatenation vulnerabilities, tautology logic bypasses (`' OR 1=1 --`), and parameterized queries defense.
  - *Commands*: `curl-intercept --endpoint /api/login`, `inject-sql --payload "' OR '1'='1"`.
- **Episode 11 — "The Phantom Parameter"**
  - *Story Hook*: Querying executive employee records by manipulating client-side request IDs.
  - *Learnings*: Insecure Direct Object References (IDOR), API parameter tampering, horizontal vs vertical privilege escalation.
  - *Commands*: `api-probe --endpoint /user/profile`, `tamper-id --target 0001`.
- **Episode 12 — "Zero-Day Protocol (The Grand Finale)"**
  - *Story Hook*: Chaining a directory path traversal vulnerability with secret exfiltration to expose Aether Dynamics to the world.
  - *Learnings*: Path traversal (`../../etc/shadow`), vulnerability chaining, structured bug bounty reporting, CVSS severity scoring, and coordinated disclosure.
  - *Commands*: `exploit-chain`, `bounty-report --generate`, `broadcast-leak`.

---

## 9. Audio & Visual FX Architecture
This section is where the web pivot pays off most directly — every effect below is either strictly higher-fidelity than what a real terminal could render, or unlocks entirely new payoff moments (like Episode 12's victory splash) that were previously ASCII-only approximations.

### Visual FX Engine
- **CRT Scanline & Glow Shaders**: A semi-transparent `repeating-linear-gradient` overlay renders real scanlines, and `box-shadow` / `filter: drop-shadow()` renders actual neon bloom on borders and text, pulsed with CSS `@keyframes` — genuine glow, not the bright-color approximation a character-cell terminal was limited to.
- **Glitch & Matrix Text Effects**: Procedural corruption of hex streams during interception and decrypt sequences (`0x9F4C` -> `0x??7A`), implemented as a small text-scramble utility on a timer, optionally paired with a CSS `clip-path`/transform jitter for extra punch during high-drama beats (e.g., HEX's Episode 06 confession, THE WARDEN's Episode 12 countermeasure).
- **Typewriter Narrative Logs**: Identical player-facing effect to the original design — asynchronous char-by-char readout for mission briefs — implemented with `setInterval`/`requestAnimationFrame` instead of a Textual timer.
- **Victory Splash & Fireworks (Episode 12)**: Originally an "ASCII fireworks splash" — in the browser this becomes a real animated particle/confetti effect layered over the ASCII banner, a meaningful upgrade for the single biggest emotional payoff moment in the whole campaign.

### Audio Engine
- **Web Audio API** (or plain `<audio>` elements for simplicity) replaces the ANSI-bell workaround entirely — real, mixed, volume-controlled SFX with no OS audio permissions or C-library dependencies to fight.
- **Audio Profile Configuration** (player-facing behavior unchanged from the original design intent):
  - `typing_fx`: Low-latency key-click sound on command input.
  - `success_chime`: Ascending retro chime upon flag capture and chapter completion.
  - `alarm_buzzer`: Low-frequency warning pulse when intrusion countermeasures trigger (e.g., THE WARDEN's Episode 12 countdown).
  - **Mute Toggle**: Accessible via hotkey `M`, persisted in the same save-profile object described in §2 (instead of a `--no-audio` CLI flag).

---

## 10. Codebase Architecture & File Structure

```text
synth-breach/
├── package.json                 # Dependencies (react, xterm, vite, typescript)
├── vite.config.ts               # Build config — outputs a static site, no backend
├── README.md                    # Quickstart, lore overview, and controls
├── index.html                   # Single entry point — the whole game loads here
├── src/
│   ├── main.tsx                 # App bootstrap & mount
│   ├── App.tsx                  # Root layout — wires the Deck panels together
│   ├── config.ts                # Neon color tokens, settings, hotkeys (was config.py)
│   ├── audio.ts                 # Web Audio SFX controller (was audio.py)
│   ├── state/
│   │   ├── profile.ts           # Player progress, score, save/load via localStorage (was state.py)
│   │   └── SaveContext.tsx      # React context exposing profile state to all panels
│   ├── ui/
│   │   ├── styles.css           # Palette tokens, neon glow, CRT scanline overlay (was styles.tcss)
│   │   ├── Header.tsx           # Retro synthwave banner & status gauges
│   │   ├── IntelPane.tsx        # Mission lore, freeCodeCamp theory notes
│   │   ├── TelemetryPane.tsx    # ASCII network topology & target monitors
│   │   ├── TerminalPane.tsx     # xterm.js instance + command engine wiring
│   │   └── CodexModal.tsx       # In-game reference library modal
│   ├── engine/
│   │   ├── parser.ts            # Command parsing & autocompletion engine
│   │   ├── simulator.ts         # Virtual network, services, & file system (fully simulated — never touches a real shell or network)
│   │   └── hintSystem.ts        # 3-tier Decker Intel system
│   ├── chapters/                 # 13 Episodic Campaign Modules (Prologue + 12)
│   │   ├── baseChapter.ts       # Base chapter interface/type
│   │   ├── episode00/           # Prologue: First Boot
│   │   ├── act1Network/         # Episodes 1, 2, 3
│   │   ├── act2Crypto/          # Episodes 4, 5, 6
│   │   ├── act3Pentest/         # Episodes 7, 8, 9
│   │   └── act4BugHunt/         # Episodes 10, 11, 12
│   └── codex/                    # freeCodeCamp Educational Guides
│       ├── networking.json
│       ├── cryptography.json
│       ├── pentesting.json
│       └── webSecurity.json
```

Build output (`dist/`) is a static bundle — deploy it to any static host, or open `index.html` locally with no server or backend process at all.

---

## 11. Prologue & Act I Concept Deep-Dive & Mission Mechanics

### Episode 00: "First Boot"
**Core Concepts (Onboarding — foundational, not freeCodeCamp-sourced)**: What a shell/terminal is, anatomy of a command (`command --flag value`), reading terminal output, command history (`Up`/`Down`), tab-completion, built-in help (`help`, `intel`, `codex`), and the Null Pointer Collective's Operating Code (ethics & scope of practice).

Episode 00 has no CVSS score, no target IP, and cannot be failed — it exists purely to make sure a first-time player can drive the shell and understands the game's boundaries before anything is at stake.

#### 1. Narrative & Mentor Chatter (First Contact)
> *"[COMMS // HEX]: Signal's clean. You're jacked in. First things first — before I hand you a single target, I need to know you can drive this rig. This isn't a joystick, Decker. It's a shell. You type what you mean, it does exactly that, no more, no less. Type `help` and let's see what you've got."*

#### 2. Interactive Onboarding Workflow
1. **Handle Selection**: The player accepts the default handle `CYBER//ZERO` or enters a custom one, persisted to their profile.
2. **The Vignette** (typewriter narrative, non-interactive): A short flashback establishes the PRECOG incident — your sibling, flagged and detained by an algorithm with no appeal — closing on HEX's line: *"That's why we're doing this. Not for the thrill. For [name]."*
3. **Shell Basics Drill**:
   - `help` → lists available commands with one-line descriptions.
   - `help scan` → shows detailed usage for a single command, establishing the `help <command>` pattern used all campaign.
   - HEX has the player practice arrow-key history recall and a tab-completion demo (`sc<TAB>` → `scan`).
   - `clear` → clears the terminal, framed as a "keep your workspace clean" habit.
4. **The Operating Code (Ethics Briefing)**: HEX presents the Null Pointer Collective's Code as an in-fiction document the player must read and formally acknowledge (`accept-code`) before HEX will proceed:
   > *"Rule one: we breach what we're cleared to breach. This whole rig — Aether Dynamics, the Warden, all of it — is a simulated shard. Real protocols, real logic, air-gapped from the actual net. Out there, this same knowledge used against a system you don't own isn't rebellion, it's a felony. You're learning to be dangerous, responsibly. Sign in, and let's move."*
5. **Codex Introduction**: `codex` opens the reference library for the first time; HEX explicitly states it's free to check anytime, no penalty, no judgment.
6. **Completion Milestone**: HEX formally inducts the player into the Collective's active roster, unlocking Episode 01 and the `10.42.0.0/24` target range.

#### 3. Pedagogical Checkpoint
Before Episode 01 unlocks, a light, ungraded prompt confirms the player understands: (a) the anatomy of a command with flags, (b) that `help`/`intel`/`codex` are always available with zero penalty, and (c) the authorization/scope boundary of the game. Wrong answers just trigger a one-line clarification from HEX — this is orientation, not a test.

---

### Episode 01: "The Gateway Knock"
**Core Concepts (freeCodeCamp)**: IPv4 Addressing (4 octets, 32 bits), CIDR Notation (`/24` subnet masks), ICMP Protocol, and Ping (Echo Request / Echo Reply).

#### 1. Narrative & Mentor Chatter (The Encrypted Comms Channel)
The player is guided by **HEX**, lead infiltrator for *The Null Pointer Collective*, speaking via an encrypted terminal chatter stream (`[COMMS // HEX]`). This is the first live target since Episode 00's induction, so HEX opens with the Act's ethical callback before anything else:

> *"[COMMS // HEX]: Channel's live. Same rule as always, Decker — this shard's ours to test, cleared and air-gapped. Nothing you learn here leaves the training range and gets pointed at something you don't own. We clear?"*
> *"...Good. Now — you're jacked into the local node. Aether Dynamics thinks their perimeter is invisible because they severed standard DNS resolution. Cute. But hardware can't hide from an ICMP pulse."*
> *"Look at your subnet: `10.42.0.0/24`. The `/24` means the first 3 octets — 24 bits — belong to Aether's network. The final 8 bits? That's 254 potential targets sitting behind one gateway. This is the edge of the same infrastructure that scored [name] as a threat pattern. Somewhere past this router is the machine that did that. We start here."*
> *"Send a ping pulse across the wire and let's find the gateway."*

#### 2. Interactive Discovery Workflow
1. **The Subnet Sweep (`netmap 10.42.0.0/24`)**:
   - The player enters the CIDR sweep command.
   - Terminal prints simulated ARP/ICMP sweeps.
   - **Visual Telemetry Map**: Discovered IP dots flicker from dimmed purple to glowing cyan:
     - `10.42.0.1` [ROUTER GATEWAY - ACTIVE - 4ms]
     - `10.42.0.15` [SILENT HOST - ICMP FILTERED]
     - `10.42.0.88` [WORKSTATION - ACTIVE - 18ms]
2. **The Gateway Handshake Ping (`ping 10.42.0.1`)**:
   - Terminal streams real-feeling ICMP packets:
     `64 bytes from 10.42.0.1: icmp_seq=1 ttl=64 time=3.82 ms`
   - **Mentor Insight**: HEX breaks down what `ttl=64` (Time To Live / hop limit) reveals about the OS and how round-trip time (RTT) exposes network distance.
3. **WARDEN Status (background flavor, no player action required)**: A single muted line appears in the telemetry log, easy to miss:
   ```text
   [SYS-LOG // AETHER-EDGE] anomaly_score=0.02 source=10.42.0.99 action=NONE
   ```
   HEX doesn't comment on it yet — per §6, WARDEN barely notices anything in Act I. It's there for a player who's paying attention, and it'll matter later.
4. **Completion Milestone**:
   - Gateway identified, ping latency baseline confirmed. HEX closes the episode:
     > *"Gateway's real, and it's breathing. That's your first foothold. Get some rest, Decker — tomorrow we go looking for a door."*
   - Unlocks the perimeter firewall target for Episode 02.

### Episode 02: "The Three-Way Handshake"
**Core Concepts (freeCodeCamp)**: TCP vs. UDP, 3-Way Handshake (`SYN`, `SYN-ACK`, `ACK`), TCP control flags (`SYN`, `ACK`, `RST`, `FIN`), open vs. closed vs. filtered ports, well-known port numbers (21, 22, 23, 53, 80, 443).

#### 1. Narrative & Mentor Chatter
> *"[COMMS // HEX]: Good work on the gateway. Now we need an entry point. Every networked service listens on a specific TCP or UDP port, and every port has three possible answers: wide open, slammed shut, or silently dropped like it never heard you. Firewalls love that last one — it's designed to make you think there's nothing there at all."*
> *"Run a packet capture while you scan. Watch the flags. A server reveals its soul in the handshake — SYN, SYN-ACK, ACK, three steps, every single time, unless something's actively lying to you."*

#### 2. Interactive Packet Inspector (Wireshark-Style TUI View)
When running `portscan --inspect 10.42.0.1`, an interactive high-contrast synthwave table renders:

```text
┌────┬──────────────┬──────────────┬──────┬─────────────────┬──────────┬──────────────┐
│ #  │ SOURCE       │ DESTINATION  │ PORT │ FLAGS           │ WIN SIZE │ INTERPRET    │
├────┼──────────────┼──────────────┼──────┼─────────────────┼──────────┼──────────────┤
│ 01 │ 10.42.0.99   │ 10.42.0.1    │ 21   │ [SYN]           │ 64240    │ PROBING FTP  │
│ 02 │ 10.42.0.1    │ 10.42.0.99   │ 21   │ [RST, ACK]      │ 0        │ CLOSED       │
│ 03 │ 10.42.0.99   │ 10.42.0.1    │ 22   │ [SYN]           │ 64240    │ PROBING SSH  │
│ 04 │ 10.42.0.1    │ 10.42.0.99   │ 22   │ [SYN, ACK]      │ 65160    │ OPEN!        │
│ 05 │ 10.42.0.99   │ 10.42.0.1    │ 80   │ [SYN]           │ 64240    │ PROBING HTTP │
│ 06 │ 10.42.0.1    │ 10.42.0.99   │ 80   │ [SYN, ACK]      │ 65160    │ OPEN!        │
│ 07 │ 10.42.0.99   │ 10.42.0.1    │ 8088 │ [SYN]           │ 64240    │ CUSTOM PORT  │
│ 08 │ ...          │ ...          │ 8088 │ [NO RESPONSE]   │ ---      │ FILTERED/STEALTH
└────┴──────────────┴──────────────┴──────┴─────────────────┴──────────┴──────────────┘
```

#### 3. Hands-on Flag Analysis Challenge
- The player analyzes the packet capture table to answer HEX's field inquiry:
  - *Which ports responded with `[SYN, ACK]` (open)?* -> Ports 22 & 80.
  - *Which port is completely silent / filtered by packet rules?* -> Port 8088.
- HEX flags the oddity:
  > *"22 and 80, standard stuff. But 8088 didn't even bother with a RST — it just went dark. That's not a closed port, Decker, that's a port that only talks to people who already know the secret handshake. Something's hiding back there on purpose. Corporate infrastructure doesn't hide things it isn't ashamed of."*
- The player discovers that Port 8088 is gated behind a rule that only accepts packets preceded by an authorized gateway session token, leading into Episode 03.

### Episode 03: "The Ghost Service"
**Core Concepts (freeCodeCamp)**: OSI Layer 7 (Application) vs Layer 4 (Transport), Service Banners, Information Disclosure via Headers, Cleartext Protocols (HTTP/Telnet/FTP) vs Encrypted (HTTPS/SSH/TLS), Packet Sniffing.

#### 1. Narrative & Mentor Chatter
> *"[COMMS // HEX]: We know Port 80 is listening, but look past the door, Decker — look at what's leaking through the cracks. Legacy servers from the 80s love talking too much. They blab their exact software versions in every response header, and broadcast whatever they're carrying in clear, unencrypted ASCII across the wire. No lock, no envelope, just a postcard anyone can read in transit."*
> *"Grab the banner. Sniff the socket stream. Let's see what Aether's careless enough to hand us for free."*

#### 2. Banner Grabbing & Transmission Sniffing
1. **Executing Banner Grab (`banner-grab --target 10.42.0.1 --port 80`)**:
   - The terminal initiates a simulated socket probe:
     ```text
     [CONNECT] 10.42.0.1:80 (TCP) ... ESTABLISHED
     <<< HTTP/1.0 200 OK
     <<< Server: Aether-HyperLink/1.8.4 (OS: SynthOS-x86)
     <<< X-Transmission-Mode: CLEARTEXT_LEGACY
     <<< Set-Cookie: AETHER_SESSION=VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA==
     ```
2. **Pedagogical Takeaway**:
   - The student learns how server banners expose exact daemon versions, making targeted exploitation possible.
   - The student observes that sensitive session tokens are flying across the wire in plaintext rather than TLS-encrypted streams.
3. **WARDEN Status (background flavor)**: Another muted log line, slightly less muted this time:
   ```text
   [SYS-LOG // AETHER-EDGE] anomaly_score=0.07 source=10.42.0.99 action=LOG_ONLY
   ```
   HEX notices this one, but doesn't treat it as a threat yet:
   > *"Score's ticking up. Still background noise to whatever's watching this edge — but it's counting. Keep that in the back of your head."*
   This is the first time the player is told, in-fiction, that something is counting their actions — the seed for THE WARDEN's escalation across later Acts.
4. **The Bridge to Act II (Cryptography)**:
   - The cookie value `VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA==` is clearly not plain English, but it ends with `==` — the unmistakable signature padding of Base64.
   - HEX alerts the player:
     > *"That's not encryption — it's just Base64 encoding, dressed up to look important. Decode it, and we're past the edge for good. Subnet Beta's next: The Crypto Vault. That's where they actually try to hide things properly."*

---

## 12. Act II Concept Deep-Dive: Cryptography (Subnet Beta)
**Theme**: *Hybrid Cryptographic Investigation* — Intercepting, analyzing, and cracking encrypted memos and leaked comms between rogue Aether executives.

### Episode 04: "The Ciphertext Wire"
**Core Concepts (freeCodeCamp)**: Encoding vs. Encryption vs. Hashing, Base64 mechanics (6-bit representation, ASCII padding `=`), Hexadecimal string formats (`0x`).

#### 1. Narrative & Intercepted Chatter
First mission inside Subnet Beta, so HEX opens with the Act's ethical callback before anything else:
> *"[COMMS // HEX]: Same rule as always, Decker — cleared shard, nothing leaves the range. Now — look at what we extracted from that session cookie: `VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA==`. Many rookie developers think encoding text is the same as encrypting it. Encoding transforms data so machines can reliably transmit it — anyone can reverse it in milliseconds without a secret key. Strip that padding and reveal what Aether is hiding."*
> *"...Base64. Typical. I've seen worse out of shops that should know better. Aether especially — they always dress up laziness as protocol. Trust me on that one."*

HEX moves on before the player can ask what that last line meant. It's an oddly specific complaint for a Netrunner who's only ever attacked Aether from the outside. Nothing more is said — not yet.

#### 2. Hands-on Decoding Investigation
- Player runs `decode --base64 "VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA=="`
- Decoded output reveals: `TYPE-04-OREON-PROTOCOL`
- Player uses the uncovered protocol token to decrypt an executive Hex log dump:
  - Command: `hexview --decode "44 49 52 45 43 54 4f 52 5f 4b 4f 56 41 43 53"`
  - Output: `DIRECTOR_KOVACS`
- *Pedagogical Checkpoint*: Interactive prompt explaining why Base64 is NOT encryption and offers zero confidentiality.

### Episode 05: "The Caesar & XOR Anomaly"
**Core Concepts (freeCodeCamp)**: Symmetric vs Asymmetric Ciphers, Classical Substitution (Caesar/ROT), Frequency Analysis, Bitwise XOR Encryption (`Plaintext ^ Key = Ciphertext`, `Ciphertext ^ Key = Plaintext`).

#### 1. Narrative & Intercepted Chatter
> *"[COMMS // HEX]: Kovacs is communicating with their chief scientist, Dr. Vance, over a scrambled channel. They know someone is sniffing the wire, so they ran their messages through a classical rotation cipher, followed by an XOR bitmask. Let's break their math."*
> *"...Vance. Haven't heard that name in a long time."*

There's a pause just a beat too long before HEX continues.
> *"Focus on the cipher, Decker. Not the history lesson."*

Nothing more is offered. Filed away for Episode 06.

#### 2. Interactive Cryptanalysis Tools
1. **Caesar / ROT Analysis**:
   - The intercepted payload: `WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD`
   - Player runs `cipher-crack --type caesar --text "WKH SURMHFW..."`
   - The tool runs frequency analysis across all 25 shift possibilities; Shift -3 (ROT-23) displays standard English:
     `THE PROJECT IS MOVING TO SUBNET GAMMA`
2. **XOR Bitwise Decrypt**:
   - Telemetry stream is masked with a single-byte XOR key.
   - Command: `xor-decrypt --stream "0x53 0x59 0x4E" --key 0x42`
   - Visual telemetry displays live bit flipping in the panel (`01010011 ^ 01000010 = 00010001`), teaching the fundamental nature of stream ciphers.

#### 3. WARDEN Status: The First Adaptation
The instant the Caesar layer falls, the terminal flags something new:
```text
[SYS-LOG // AETHER-EDGE] anomaly_score=0.15 source=10.42.0.99 action=ROTATE_KEYS
[NOTICE] Internal comms channel re-encrypted with secondary XOR layer (was: single-layer ROT)
```
HEX catches it immediately:
> *"There it is. That channel didn't have a second layer yesterday — someone just added it. That's not IT policy, Decker, that's a direct response to us cracking the first one. Something in there is watching what we break and patching around it in real time. Keep going — we're already past whatever it just changed."*

This is the first visible sign of THE WARDEN's Act II escalation described in §6 — it stops being background noise and starts reacting to the player's specific actions.

### Episode 06: "Shattering the Salt"
**Core Concepts (freeCodeCamp)**: One-Way Hash Functions (MD5, SHA-1, SHA-256), The Avalanche Effect, Hash Collisions, Rainbow Tables, Password Salting, Dictionary Attacks (`rockyou.txt`).

#### 1. Narrative & Intercepted Chatter
> *"[COMMS // HEX]: We just breached the Crypto Vault's credential table, but we don't have passwords — we have 32-character hexadecimal strings. Hashes are one-way cryptographic mathematical functions. You cannot 'decrypt' a hash; you have to hash guesses until you find a collision or match against a rainbow table. Unless they salted their passwords, their weak passwords will crumble in seconds."*

#### 2. The Credential Cracking Investigation
- **Target Dump**:
  `kovacs: 5d41402abc4b2a76b9719d911017c592` (MD5 of `hello`)
  `vance: 098f6bcd4621d373cade4e832627b4f6` (MD5 of `test`)
  `admin_root: 21232f297a57a5a743894a0e4a801fc3` (MD5 of `admin`)
- HEX reads the names off the dump, quieter than the usual mission-brief cadence:
  > *"Kovacs. Vance. Same two names as the intercept. And 'admin_root' running on a password of 'admin' — some things never change in that building, no matter how many years go by."*
- Player runs `hash-identify 5d41402abc4b2a76b9719d911017c592` -> detects 128-bit MD5 signature.
- Player launches dictionary attack: `crack --hash 21232f297a57a5a743894a0e4a801fc3 --wordlist wordlists/synth_rockyou.txt`.
- Terminal animates hash comparisons at 100k h/s, popping the root credentials and providing SSH access to Subnet Gamma (Bastion Core)!
- *Pedagogical Checkpoint*: Explains why modern systems use Argon2/bcrypt with unique random salts per user to render rainbow tables and dictionary lookups useless.

#### 3. Narrative Beat: HEX's Confession
Root access to Bastion Core is sitting there, ready to open. HEX doesn't open it right away.
> *"[COMMS // HEX]: ...Hold on. Before we move on Bastion Core, there's something you should know. I'd rather you hear it from me than trip over it in a log file in there."*
> *"Years back, I worked at Aether. Systems architecture, PRECOG division. Vance ran the lab two floors up from me. I wrote some of the early pattern-matching logic — the stuff that's still running under the hood of whatever flagged [name]. I told myself for a long time that I didn't know what it would grow into. I don't tell myself that anymore."*
> *"I left when I saw what shipped. Building the Collective, getting you into this system — that's not activism for me, Decker. It's the closest thing I've got to fixing what I helped break. Every hint I've handed you so far wasn't just mentorship. Call it paying a debt."*
> *(a long pause) "...Anyway. Bastion Core's waiting. You ready?"*

This is the mid-campaign reveal referenced in §6 — it recontextualizes every hint HEX has given so far as an act of atonement, not just guidance, and sets up the trust twist at the top of Act III (Episode 07), where the player will briefly wonder whether HEX's history means her intel can still be trusted.

#### 4. WARDEN Status: Escalation Continues
One last log line closes the episode, unremarked by HEX this time — left for an attentive player to catch on their own:
```text
[SYS-LOG // AETHER-EDGE] anomaly_score=0.34 source=10.42.0.99 action=ALERT_QUEUED
```
The climbing score from Episode 01's `0.02` through this episode's `0.34` is the through-line that pays off in Episode 07's twist — nothing here has been random.

---

## 13. Act III Concept Deep-Dive: Penetration Testing (Subnet Gamma)
**Theme**: *Metasploit-Style Cyberdeck & Linux Shell Exploitation* — Reconnaissance, vulnerability discovery, weaponization, remote code execution, and Linux privilege escalation.

### Episode 07: "The Perimeter Scan"
**Core Concepts (freeCodeCamp)**: The 5-Phase Pentest Lifecycle, Vulnerability Scanning vs Port Scanning, Common Vulnerabilities and Exposures (CVEs), CVSS Scoring (Base 0.0 - 10.0).

Before anything else fires this episode, HEX opens the channel just to say one thing, and lets it sit for a beat before moving on:
> *"[COMMS // HEX]: Decker — thanks for not making that weird, back there. Wanted that said before we're both underwater again."*

#### 0. Narrative Beat: The Trust Twist
A Collective channel alert fires: another hacktivist cell was just caught by Aether security, and the breach pattern looks identical to intel HEX has shared. For this episode, the player has reason to wonder if HEX's information is safe to act on. Rather than take her word for it, the player pulls the raw timeline first:
```text
operator@synth:~$ trace --pattern caught-cell-01 --compare hex-contact-log
[MATCH] Caught cell's breach signature timestamp: 03:14:22
[MATCH] First recorded contact with [COMMS // HEX]: 03:41:07
[RESULT] Breach signature predates HEX contact by 26m 45s — no causal link possible
```
The timeline clears her before she ever says a word about it. HEX addresses it directly anyway, filling in what the trace alone can't explain:
> *"[COMMS // HEX]: I know what that looks like. It isn't a leak — nobody fed them anything. Look at the timing: every caught operative made contact within hours of a breach signature Aether's system had already seen. That's not a mole. That's the Warden learning. It's not just logging your moves anymore — it's studying them. Same rule as always, Decker — cleared shard, eyes open from here on."*
This resolves the twist with player-verified evidence instead of HEX's own unverified word, and reframes THE WARDEN from passive target to active adversary heading into the rest of Act III and the Episode 12 finale.

#### 1. Narrative & Mentor Chatter
> *"[COMMS // HEX]: We're inside Subnet Gamma: Bastion Core. This isn't an unencrypted edge router anymore — these are hardened corporate servers, the kind I used to get paged about at 3 AM. Don't throw random exploits at them. Ethical hackers and top netrunners work methodically: recon, scan, gain access, maintain access, cover your tracks. Five phases, every time, no shortcuts."*
> *"Enumerate every service, query the CVE database, and find an unpatched flaw. Let's work."*

#### 2. Hands-on Vulnerability Enumeration
1. **Target Service Scan**:
   - Command: `vulnscan --host 10.42.20.10`
   - Discovers service: `ProFTPD 1.3.3c` running on port 21.
2. **Querying the Exploit Database**:
   - Command: `searchsploit "ProFTPD 1.3.3c"`
   - Returns result:
     `[CVE-2010-4221] ProFTPD 1.3.3c - Remote Backdoor Command Execution`
     `Severity: 9.8 CRITICAL | Vector: Remote | Authentication: None`
3. *Pedagogical Checkpoint*: Explains how vulnerable dependencies and unpatched legacy software remain the #1 entry point for real-world enterprise breaches.

### Episode 08: "The Default Bastion"
**Core Concepts (freeCodeCamp)**: Exploit weaponization, payloads, reverse shells vs bind shells, listening ports, establishing persistent low-privilege sessions.

#### 1. Narrative & Mentor Chatter
> *"[COMMS // HEX]: That ProFTPD version has an infamous supply-chain backdoor — CVE-2010-4221, one of the ugliest in the book. I remember when Aether's own security team flagged this exact service internally and got told to schedule the patch for 'next quarter.' Next quarter never came. Let's load the module into your cyberdeck, Decker, configure your local listening port, and trigger remote execution to catch a reverse shell."*

#### 2. The Cyberdeck Exploit Engine
1. **Configuring the Exploit Module**:
   ```text
   operator@synth:~$ use exploit/unix/ftp/proftpd_backdoor
   [LOADED] exploit/unix/ftp/proftpd_backdoor
   operator@synth(proftpd)> set RHOST 10.42.20.10
   operator@synth(proftpd)> set RPORT 21
   operator@synth(proftpd)> set PAYLOAD cmd/unix/reverse
   operator@synth(proftpd)> exploit
   ```
2. **Spawning the Virtual Low-Privilege Shell**:
   - Terminal displays:
     ```text
     [*] Sending backdoor trigger packet to 10.42.20.10:21...
     [✓] Backdoor response confirmed! Spawning reverse shell...
     [+] Netrunner Session #1 opened (10.42.0.99:4444 -> 10.42.20.10:49152)
     daemon@aether-bastion:/var/ftp$ 
     ```
3. *Pedagogical Checkpoint*: Explains the mechanics of a reverse shell and why egress firewalls are critical to prevent outbound command-and-control beacons.

### Episode 09: "Ring-0 Escalation"
**Core Concepts (freeCodeCamp)**: Linux user permissions (`rwxr-xr-x`), User ID (UID), the SUID bit (`chmod 4755` / `u+s`), path hijacking, and escalating from service user to `root`.

#### 0. Narrative Beat: The Honeypot Near-Miss
While enumerating the filesystem, the player's scan surfaces something that looks too good to be true:
```text
-rwxrwxrwx 1 root root  8192 Nov 12 1989 /opt/aether/bin/admin-console
[NOTICE] Active session detected: root@aether-bastion (idle 00:04:12)
```
A world-writable binary, owned by root, sitting next to what looks like an already-authenticated idle root session. HEX stops the player before they touch it:
> *"[COMMS // HEX]: Don't. Look at it again, Decker — a world-writable root binary just sitting in the open, with a root session conveniently idling right next to it? That's not misconfiguration, that's bait. A canary. The second you touch that console, it's not logging an anomaly score anymore, it's confirming exactly who's in here and how you move. The Warden's gotten good at building traps that look like our kind of luck."*
> *"Back away from it. There's a real way in — it's just not the one somebody left lying on the floor for us."*

The telemetry log ticks up the moment the console goes untouched:
```text
[SYS-LOG // AETHER-EDGE] anomaly_score=0.51 source=10.42.0.99 action=HONEYPOT_DEPLOYED
```
> *"Score jumped the second that thing lit up — it wanted a bite, and we didn't give it one. Still climbing. Whatever it's building toward, it's not done yet."*

This is THE WARDEN's Act III honeypot beat from §6 — a scripted near-miss, not a game-over, that teaches the real-world skill of recognizing a planted decoy before moving on to the genuine SUID escalation path below.

#### 1. Narrative & Mentor Chatter
> *"[COMMS // HEX]: Good instinct back there. You have a shell, but look at your prompt: `daemon@aether-bastion`. You're trapped in an unprivileged sandbox — you can't view executive logs or private keys. We need to escalate to Ring-0, root. Forget the bait — look for binaries with the SUID bit set instead. If a program runs as root and you can manipulate how it runs, you become root."*

#### 2. Hunting SUID Binaries & Escalation
1. **Inspecting User Identity**:
   - Command: `whoami` -> `daemon (uid=1001)`
   - Command: `id` -> `uid=1001(daemon) gid=1001(daemon) groups=1001(daemon)`
2. **Finding Misconfigured SUID Files**:
   - Command: `find / -perm -u=s -type f 2>/dev/null`
   - Terminal lists standard system binaries (`/usr/bin/passwd`, `/usr/bin/sudo`) and one suspicious custom binary:
     `-rwsr-xr-x 1 root root 14320 Nov 12 1989 /opt/aether/bin/system-backup`
3. **Exploiting the Vulnerable SUID Binary**:
   - Inspecting strings: `strings /opt/aether/bin/system-backup` reveals it calls `tar` without an absolute path!
   - Command: `export PATH=/tmp:$PATH` with a malicious `/tmp/tar` script.
   - Running `/opt/aether/bin/system-backup` triggers the script under root privileges:
     ```text
     [#] SUID execution triggered with UID 0 (root)!
     root@aether-bastion:~# 
     ```
4. *Pedagogical Checkpoint*: Explains Principle of Least Privilege and how path traversal/SUID misconfigurations grant full kernel root compromise.

---

## 14. Act IV Concept Deep-Dive: Bug Hunting & Web Exploits (Subnet Omega)
**Theme**: *Interactive HTTP Proxy & Tamper Deck (Burp-in-TUI)* — Dual-pane request/response interception, OWASP Top 10 web vulnerabilities, SQL injection, IDOR, and coordinated disclosure.

### The Burp-in-TUI Interface Layout
```text
┌──────────────────────────────────────┬──────────────────────────────────────┐
│ 📤 INTERCEPTED HTTP REQUEST (PORT 443)│ 📥 SERVER RESPONSE [STATUS: 200 OK]  │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ POST /api/v1/auth/login HTTP/1.1    │ HTTP/1.1 200 OK                      │
│ Host: cloud.aetherdyn.internal      │ Content-Type: application/json       │
│ Content-Type: application/json       │ Set-Cookie: AETHER_SESSION=...;      │
│                                      │                                      │
│ {                                    │ {                                    │
│   "user": "admin' OR '1'='1--",      │   "status": "AUTHENTICATED",         │
│   "pass": "anything"                 │   "role": "SYSTEM_DIRECTOR",         │
│ }                                    │   "token": "eyJhbGciOi..."           │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Episode 10: "The Broken Gate"
**Core Concepts (freeCodeCamp)**: OWASP #3 / #1 Injection, SQL Syntax, Tautology Bypass (`' OR '1'='1`), Comments in SQL (`--` or `#`), Input Sanitization vs. Parameterized Queries / Prepared Statements.

#### 1. Narrative & Mentor Chatter
First mission inside Subnet Omega, so HEX opens with the Act's ethical callback:
> *"[COMMS // HEX]: Same rule as always, Decker — cleared shard, this stays on the range. This is the one that matters most to get right, because this is Kovacs' house."*
> *"You have root on their Bastion host, but Aether's master surveillance core lives in their cloud API: Subnet Omega. Their login gate directly stitches user input into SQL queries. If backend code treats user data as executable database commands, the database becomes your puppet. First time I'm hearing anything out of Kovacs' side of the building directly since I left. Let's not waste it."*

#### 2. Hands-on SQL Injection Challenge
1. **Intercepting the Login POST**:
   - Player triggers `proxy-intercept --target cloud.aetherdyn.internal`.
   - The interactive HTTP proxy catches the outgoing authentication request.
2. **Injecting the Tautology Payload**:
   - The simulated SQL query on the server is:
     `SELECT * FROM users WHERE username = '$user' AND password = '$password'`
   - By entering `admin' OR '1'='1' --`, the query evaluates:
     `SELECT * FROM users WHERE username = 'admin' OR '1'='1' -- ...`
   - Since `'1'='1'` is always true, the database returns the first row (the admin record!), completely bypassing password verification.
3. *Pedagogical Remediation*: HEX displays the vulnerable raw PHP/Python code alongside the secured parameterized version (`cursor.execute("SELECT ... WHERE user = %s", (user,))`), explaining why prepared statements neutralize SQL injection forever.

### Episode 11: "The Phantom Parameter"
**Core Concepts (freeCodeCamp)**: OWASP Broken Access Control, Insecure Direct Object References (IDOR), API endpoint design, Horizontal vs Vertical Privilege Escalation.

#### 1. Narrative & Mentor Chatter
> *"[COMMS // HEX]: You're logged in with an operator token, but restricted from the classified projects index. Watch the API calls in your proxy. Many backend developers authenticate who you are, but completely forget to authorize what you can view. They pass IDs directly in the URL and blindly trust the client. Aether's no different — let's see what they think you can't reach."*

#### 2. Hands-on IDOR Parameter Tampering
1. **Inspecting the Request**:
   - Normal request: `GET /api/v1/profile?user_id=1042 HTTP/1.1`
   - Response returns standard contractor details.
2. **Tampering the Direct Reference**:
   - Player edits the query parameter: `tamper --param user_id=0001`
   - The server fails to verify that the requesting session owns object `0001`!
   - Response reveals Director Kovacs' private dossiers and the secret server path `/docs/vault/`, including a memo titled `RE: PRECOG DEPLOYMENT — ETHICS REVIEW OVERRIDE`, signed by Kovacs, dismissing an internal objection to shipping the scoring model without an appeals process.
   - HEX reads the memo over the channel, flat and quiet:
     > *"There it is, in writing. Someone below him flagged exactly this — could've been Vance, given how close she sat to it, though there's no way to know for sure. No appeals process, no oversight — same hole [name] fell through. And Kovacs signed off anyway. That's not a rogue AI making a mistake, Decker. That's a person who read the warning and shipped it regardless."*
3. **WARDEN Status: Countermeasure Priming**:
   ```text
   [SYS-LOG // AETHER-EDGE] anomaly_score=0.72 source=10.42.0.99 action=COUNTERMEASURE_ARMED
   ```
   HEX catches this one immediately, tighter than her usual cadence:
   > *"That's new. It's not just watching anymore — it just armed something. We're not slow-walking whatever's next."*
4. *Pedagogical Remediation*: Explains why access control checks must validate session ownership on every single object lookup, or use indirect GUIDs / reference maps.

### Episode 12: "Zero-Day Protocol (The Grand Finale)"
**Core Concepts (freeCodeCamp)**: Directory / Path Traversal (`../../`), Vulnerability Chaining, CVSS 3.1 Severity Scoring, Structured Bug Bounty Reporting, Coordinated Vulnerability Disclosure. **Plus a reactive callback to Episode 06's hashing lesson** during the WARDEN encounter below.

#### 1. Narrative & Mentor Chatter
> *"[COMMS // HEX]: This is the endgame. We have access to the file viewer endpoint, but it's vulnerable to path traversal. Chain your access: break out of the web directory, extract the master cryptographic signing key, and publish a dossier that permanently shuts down Aether Dynamics."*
> *"The Warden knows we're here now — it's not going to sit still. Neither am I, for what it's worth. First thing I've built in years that might actually fix something instead of break it. Whatever happens after this, Decker, [name]'s record gets a chance at getting fixed. That's the only ending I actually care about. Let's finish it."*

#### 2. The Final Chain & Bug Bounty Report
1. **Path Traversal Payload**:
   - Normal request: `GET /api/v1/view?file=report.pdf`
   - Payload: `GET /api/v1/view?file=../../../../etc/aether/master_key.pem`
   - Target server resolves dot-dot-slash characters, escaping the web root and dumping the master private key!
2. **THE WARDEN Countermeasure (reactive finale encounter)**:
   - The instant the traversal succeeds, WARDEN detects the anomalous file access and fires a countdown:
     ```text
     [!] WARDEN COUNTERMEASURE ENGAGED — TRACE INITIATED
     [!] Connection will be severed in 60s. Extract and verify before the window closes.
     ```
   - WARDEN plants a decoy key at the same path (`master_key.pem`) that looks identical but is corrupted bait — a callback to Act III's honeypot foreshadowing.
   - The player must reuse the **Episode 06 hashing skill** (`hash-identify` / a checksum-verify command) against the extracted key to confirm it matches the value HEX obtained from an earlier intercepted memo, before the timer expires. Verifying the decoy instead costs time but is not a hard fail — HEX flags the mismatch and the player gets one retry within the window.
   - This reuses an existing mechanic (hash verification) rather than introducing new engineering just for the finale, per design decision in §6.
3. **Generating the Formal Security Bounty Report**:
   - Player runs `bounty-report --compile` in the deck.
   - An interactive security advisory builder guides the player through categorizing their findings:
     - **Vulnerabilities Chained**: SQL Injection (Auth Bypass) + IDOR (Information Disclosure) + Path Traversal (Arbitrary File Read).
     - **CVSS Score Calculation**: Vector string `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N` -> **Score: 10.0 MAXIMUM CRITICAL**.
     - **Remediation Plan**: Input validation, parameterized queries, path canonicalization (`realpath()`), and RBAC enforcement.
4. **The Finale Choice (branching ending)**:
   - With the report compiled and the real key verified, HEX asks how to proceed — this is a genuine player decision, not a scripted default:
     - **`broadcast-leak --mode=public`** ("Full Exposure"): Immediate max-damage public dump. Aether collapses fast, but PRECOG's victim data — including your own family member's — leaks alongside everything else, with no clean legal path to clear their name. Ending title: **VIGILANTE OPERATOR**.
     - **`bounty-report --submit --responsible`** ("Coordinated Disclosure"): The dossier goes to regulators and press with a remediation window. Slower, but the epilogue shows systemic reform and your family member's record formally expunged. Ending title: **WHITEHAT OPERATOR / CERTIFIED WHISTLEBLOWER**.
5. **Victory Splash & Epilogue**:
   - A retro synthwave fireworks ASCII splash triggers regardless of choice; Aether's rogue network collapses, The Null Pointer Collective salutes you, and your Netrunner profile displays the ending title earned above alongside **MASTER OPERATOR CERTIFIED**.













