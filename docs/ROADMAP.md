# SYNTH // BREACH — Build Roadmap & Checklist

Living project tracker. Check items off as they land. Keep this file in sync with reality — if scope changes, edit the checklist, don't just remember it.

**Status legend:** `[ ]` not started · `[~]` in progress · `[x]` done

**Baseline (as of this file's creation):** repo has a metadata-only scaffold — `episode00` hint text is filled in as a reference pattern, `act1Network` → `act4BugHunt` are empty stubs (`hints: ["","",""]`, `implemented: false`). No command engine, chapter logic, UI polish, FX, or audio exist yet. Full spec lives in [SPEC.md](SPEC.md).

---

## Current Phase
> _Update this line each session: which Day/Milestone is active._

**→ Day 1–2: Core engine**

---

## Day 1–2 — Core Engine
*Serial — everything downstream depends on this contract.*

- [ ] `engine/parser.ts`: command parsing (`command --flag value` shape), tab-completion, `Up`/`Down` history recall, syntax-error highlighting
- [ ] `engine/simulator.ts`: virtual network (hosts, ports, services), virtual filesystem (for SUID/path-traversal episodes), fully client-side, never touches a real shell
- [ ] `engine/hintSystem.ts`: 3-tier Decker Intel lookup (Theory / Syntax Nudge / Full Solution), zero score penalty on Tier 1 / codex reads
- [ ] `chapters/baseChapter.ts`: confirm `Chapter` interface covers what UI needs (WARDEN log-line beats, scripted narrative branches, command whitelist per episode) — extend if Act III/IV need more (e.g. REPL sub-modes for `use/set/exploit`)
- [ ] Chapter loader / unlock gating (profile tracks which episode is unlocked, chapters register their own command sets)

**Exit criteria:** a chapter can declare "these commands exist, in this order, with these hints" and the engine enforces it.

---

## Day 3 — Deck Shell
- [ ] Grid/Flexbox layout wiring: Header + IntelPane + TelemetryPane + TerminalPane per §3 blueprint
- [ ] `xterm.js` instance wired to the command engine in `TerminalPane.tsx`
- [ ] Palette tokens from §4 as CSS custom properties (`SYNTH_BG`, `NEON_CYAN`, `NEON_PINK`, `SUNSET_AMBER`, `NEON_GREEN`, `ALERT_RED`, `MUTED_LAVENDER`)
- [ ] CRT scanline overlay (`repeating-linear-gradient`) + neon glow (`box-shadow`/`filter: drop-shadow()`)
- [ ] Save/load via `localStorage` (`state/profile.ts` + `SaveContext.tsx`) — profile shape: handle, unlocked episodes, score, achievements, mute setting
- [ ] `CodexModal.tsx` opens via `F1` or `codex <topic>`

**Exit criteria:** app boots, shows the 4-panel deck, player can type in the terminal and see output rendered with the neon aesthetic.

---

## Day 4–5 — Episode 00 + Act I (Episodes 1–3)
*Parallelizable once engine contract is stable: one agent on Ep00 onboarding, one on Ep01–03 network sim.*

### Episode 00 — "First Boot" (§11)
- [ ] Handle selection (default `CYBER//ZERO` or custom, persisted to profile)
- [ ] PRECOG vignette (typewriter narrative, non-interactive)
- [ ] Shell basics drill: `help`, `help <command>`, arrow-key history demo, tab-completion demo (`sc<TAB>` → `scan`), `clear`
- [ ] Operating Code ethics briefing + `accept-code` gate (blocks progress until acknowledged)
- [ ] `codex` intro (explicitly free/no-penalty)
- [ ] Completion milestone: unlocks Episode 01 + `10.42.0.0/24` range
- [ ] Ungraded pedagogical checkpoint (command anatomy, help/intel/codex availability, scope boundary)

### Episode 01 — "The Gateway Knock"
- [ ] `netmap --range 10.42.0.0/24` sweep with telemetry dot flicker (dimmed purple → glowing cyan)
- [ ] `ping 10.42.0.1` streaming ICMP output (ttl, RTT) + HEX's TTL/RTT explainer
- [ ] Muted WARDEN log line (`anomaly_score=0.02`, `action=NONE`) — first thread seed, no HEX comment
- [ ] Completion: unlocks Episode 02

### Episode 02 — "The Three-Way Handshake"
- [ ] `portscan --inspect 10.42.0.1` interactive packet table (§13 layout: SOURCE/DEST/PORT/FLAGS/WIN SIZE/INTERPRET)
- [ ] Flag-analysis challenge (which ports are `[SYN,ACK]` vs filtered)
- [ ] Port 8088 oddity flagged by HEX → bridges to Episode 03

### Episode 03 — "The Ghost Service"
- [ ] `banner-grab --target --port` simulated socket probe output (Server header, cleartext cookie)
- [ ] Cleartext-vs-encrypted pedagogical beat
- [ ] WARDEN log line ticks up (`anomaly_score=0.07`, `action=LOG_ONLY`) + HEX's "score's ticking up" line
- [ ] Base64 cookie bridges to Act II (`decode --base64`)

**Exit criteria:** full Act I playable start-to-finish, WARDEN anomaly score visibly climbing 0.02 → 0.07.

---

## Day 6–7 — Act II: Cryptography (Episodes 4–6)
*Parallelizable: one agent on crypto-sim logic, one on narrative/dialogue scripting.*

### Episode 04 — "The Ciphertext Wire"
- [ ] `decode --base64 <data>` → reveals `TYPE-04-OREON-PROTOCOL`
- [ ] `hexview --decode <hex>` → reveals `DIRECTOR_KOVACS`
- [ ] Pedagogical checkpoint: encoding ≠ encryption
- [ ] HEX's "I've seen worse out of shops that should know better" foreshadowing line lands as-written (don't cut — pays off in Ep06)

### Episode 05 — "The Caesar & XOR Anomaly"
- [ ] `cipher-crack --type caesar --text <ciphertext>` — brute-force 25 shifts, ROT-23 reveals plaintext
- [ ] `xor-decrypt --stream <hex> --key <byte>` with live bit-flip visualization
- [ ] HEX's "Vance... haven't heard that name" beat + deflection line
- [ ] WARDEN first adaptation: `anomaly_score=0.15`, `action=ROTATE_KEYS`, re-encryption notice — first real reactive escalation

### Episode 06 — "Shattering the Salt"
- [ ] `hash-identify <hash>` → detects MD5 (128-bit signature)
- [ ] `crack --hash <hash> --wordlist <file>` — animated dictionary attack (~100k h/s)
- [ ] Pedagogical checkpoint: salts, bcrypt/Argon2 vs rainbow tables
- [ ] **HEX's confession scripted beat** (mid-campaign reveal — do not compress/skip, it recontextualizes every hint given so far)
- [ ] WARDEN escalation: `anomaly_score=0.34`, `action=ALERT_QUEUED` (unremarked by HEX — attentive-player easter egg)

**Exit criteria:** Act II playable, WARDEN score 0.15 → 0.34, HEX confession beat lands correctly before Bastion Core unlocks.

---

## Day 8–10 — Act III: Penetration Testing (Episodes 7–9)
*Parallelizable: give the exploit-engine REPL its own agent — it's the meatiest single piece.*

### Episode 07 — "The Perimeter Scan"
- [ ] Trust-twist beat: `trace --pattern caught-cell-01 --compare hex-contact-log` → timestamp comparison clears HEX with player-verified evidence
- [ ] `vulnscan --host <ip>` → discovers `ProFTPD 1.3.3c`
- [ ] `searchsploit "ProFTPD 1.3.3c"` → returns CVE-2010-4221 w/ CVSS 9.8
- [ ] Pedagogical checkpoint: unpatched legacy software as #1 real-world entry point

### Episode 08 — "The Default Bastion"
- [ ] Metasploit-style REPL: `use exploit/...`, `set RHOST/RPORT/PAYLOAD`, `exploit` — stateful sub-prompt mode
- [ ] Reverse shell spawn sequence + prompt change to `daemon@aether-bastion:...$`
- [ ] Pedagogical checkpoint: reverse shells, egress firewall importance

### Episode 09 — "Ring-0 Escalation"
- [ ] Honeypot near-miss: world-writable root binary + fake idle root session bait; HEX intervenes before player touches it (scripted, not a game-over)
- [ ] WARDEN: `anomaly_score=0.51`, `action=HONEYPOT_DEPLOYED`
- [ ] `whoami`/`id`, `find / -perm -u=s -type f` SUID hunt
- [ ] `strings` reveals unqualified `tar` call → `PATH` hijack → root shell
- [ ] Pedagogical checkpoint: least privilege, SUID/path hijacking

**Exit criteria:** Act III playable, honeypot near-miss doesn't hard-fail the player, WARDEN score 0.51 by episode end.

---

## Day 11–13 — Act IV: Bug Hunting (Episodes 10–12)
*Parallelizable: proxy UI is a distinct component from exploit-chain/report logic — split accordingly.*

### Burp-in-TUI shared component
- [ ] Dual-pane intercepted-request / server-response layout (§14 blueprint), reusable across Ep 10–12

### Episode 10 — "The Broken Gate"
- [ ] `proxy-intercept --target cloud.aetherdyn.internal` catches login POST
- [ ] Tautology payload (`admin' OR '1'='1' --`) evaluated against simulated SQL string-concat query
- [ ] Remediation display: vulnerable vs. parameterized-query code side by side

### Episode 11 — "The Phantom Parameter"
- [ ] `api-probe --endpoint /user/profile` baseline request
- [ ] `tamper --param user_id=0001` → IDOR reveals Kovacs dossier + `RE: PRECOG DEPLOYMENT` memo
- [ ] HEX's flat/quiet delivery on the memo reveal (tone matters — don't let this read as a generic success message)
- [ ] WARDEN: `anomaly_score=0.72`, `action=COUNTERMEASURE_ARMED`

### Episode 12 — "Zero-Day Protocol" (Finale)
- [ ] Path traversal payload (`../../../../etc/aether/master_key.pem`) escapes web root
- [ ] WARDEN 60-second countermeasure countdown (real-time reactive encounter)
- [ ] Decoy key trap: reuses Episode 06's `hash-identify`/checksum-verify mechanic; wrong-key selection costs time, one retry allowed within window
- [ ] `bounty-report --compile`: vuln chaining summary, CVSS 3.1 vector calculator (`AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N` → 10.0)
- [ ] **Branching ending choice**: `broadcast-leak --mode=public` (Vigilante) vs `bounty-report --submit --responsible` (Whitehat) — both must be fully implemented, not one-default
- [ ] Victory splash: animated particle/confetti fireworks over ASCII banner
- [ ] Epilogue text diverges correctly per ending choice (family member's record: exposed-but-unresolved vs. legally expunged)

**Exit criteria:** both endings playable and produce distinct epilogue text + ending title; WARDEN countdown is a real timer, not a fake progress bar.

---

## Day 14 — Victory & FX Pass
- [ ] Fireworks/particle victory splash (Episode 12 payoff)
- [ ] Glitch/matrix text-scramble utility (hex stream corruption during intercept/decrypt beats)
- [ ] `clip-path`/transform jitter for high-drama beats (Ep06 confession, Ep12 countermeasure)
- [ ] Typewriter narrative log polish (consistent pacing across all episodes)

---

## Day 15 — Audio
- [ ] Web Audio SFX controller (`audio.ts`)
- [ ] `typing_fx` — key-click on input
- [ ] `success_chime` — flag capture / chapter completion
- [ ] `alarm_buzzer` — countermeasure/alert trigger (Ep12 countdown)
- [ ] Mute toggle (`M` hotkey), persisted in save profile

---

## Day 16–17 — Codex Content
*Writing, not coding — worth a human review pass even if AI-drafted.*

- [ ] `codex/networking.json`: port directory (21/22/23/25/53/80/443/3306/8080+), OSI 7-layer vs TCP/IP 4-layer table, subnet mask tables
- [ ] `codex/cryptography.json`: encoding vs encryption vs hashing distinctions, hash collision basics, ASCII/hex conversion tables
- [ ] `codex/pentesting.json`: 5-stage recon lifecycle cheat sheet
- [ ] `codex/webSecurity.json`: OWASP Top 10 in plain English, vulnerable-vs-secured code snippets per vuln class

---

## Day 18 — QA, Balance, Deploy
- [ ] Full playthrough, Ending A (Vigilante)
- [ ] Full playthrough, Ending B (Whitehat)
- [ ] Save/load edge cases (mid-episode reload, corrupted/missing localStorage, handle rename)
- [ ] Responsive layout check (panel collapse at narrow widths)
- [ ] WARDEN anomaly-score continuity check across all 12 episodes (0.02 → 10.0 CVSS finale, no discontinuities)
- [ ] Vite production build (`dist/`) sanity check
- [ ] Deploy to static host (GitHub Pages / Netlify / Vercel)

---

## Parked / Nice-to-have (post-MVP)
- [ ] `IndexedDB` or backend save sync (explicitly deferred in §2 — not needed for MVP)
- [ ] Additional CVEs / alternate exploit paths per episode for replayability
- [ ] Accessibility pass (screen-reader fallback for ASCII art, reduced-motion mode for glitch FX)

---

## Notes / Deviations Log
> _Record here when implementation diverges from SPEC.md, and why — keeps the spec and the checklist from silently drifting apart._

- _(none yet)_
