# SYNTH // BREACH — Solution / QA Walkthrough

> **Spoiler warning.** This is the answer key for testing the game end-to-end.
> It lists every command, in order, that clears each episode. Type them into the
> terminal exactly as shown (quotes included). After an episode's objectives are
> all green, type **`next`** to advance to the following episode.
>
> Source of truth: `src/engine/solutions.ts` + `scripts/playtest.ts`. If the game
> ever disagrees with this file, the game wins — tell me and I'll re-sync it.

---

## How to drive the rig

| Action | What to type |
| --- | --- |
| Advance to the next episode (after all objectives clear) | `next` |
| List commands available right now | `help` (or `help <cmd>`) |
| Per-command manual (hint, not the answer) | `<cmd> --help` — e.g. `netmap --help` |
| Open the reference library | `codex` (or `codex <topic>` / `codex <command>`) |
| Tiered hint (1 = theory, 2 = syntax, 3 = deep walkthrough) | `intel` (run again for the next tier) |
| Jump to an unlocked episode | `goto <id>` |
| See current objectives | `objectives` |
| Explore the host you're on (recon) | `ls` then `cat <path>` |
| Reprint the Evidence Locker (survives `clear`) | `recall` |
| Save your run to a file | `save` |
| Load a run (or use **LOAD GAME** on the boot screen) | `load` |
| Full reset | `reset --confirm` |

**Give-up escape hatch:** after you've read `intel 3` for an episode, the game
unlocks `stuck`. Running `stuck --<flag>` drops the next exact command straight
into your prompt. Valid flags (pick any, they're jokes):
`--terminatorgotme`, `--imgoingtobedafterthisone`, `--skynetwins`,
`--hexcarryme`, `--iamjustahuman`, `--bluepillplease`.

---

## Episode answer key

### Prologue — EP00 · First Boot
```
help
codex
accept-code
```
Then `next`.

---

### Act I — Network (Subnet Alpha)

**EP01 · The Gateway Knock**
```
netmap 10.42.0.0/24
ping 10.42.0.1
save
```
> `save` is the onboarding task — it downloads a `.synthsave` file. Test it, then
> confirm **LOAD GAME** on the boot screen (or the `load` command) restores it.
Then `next`.

**EP02 · The Three-Way Handshake**
```
portscan --inspect 10.42.0.1
answer 8088
```
Then `next`.

**EP03 · The Ghost Service**
```
banner-grab --target 10.42.0.1 --port 80
inspect --protocol http
```
Then `next`.

---

### Act II — Cryptography (Subnet Beta)

**EP04 · The Ciphertext Wire**
```
decode --base64 "VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA=="
hexview --decode "44 49 52 45 43 54 4f 52 5f 4b 4f 56 41 43 53"
```
> The Base64 decodes to `TYPE-04-OREON-PROTOCOL`; the hex decodes to
> `DIRECTOR_KOVACS`.
Then `next`.

**EP05 · The Caesar & XOR Anomaly**
```
cipher-crack --type caesar --text "WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD"
xor-decrypt --stream "0x53 0x59 0x4E" --key 0x42
```
> Caesar resolves to `THE PROJECT IS MOVING TO SUBNET GAMMA`.
Then `next`.

**EP06 · Shattering the Salt**
```
hash-identify 21232f297a57a5a743894a0e4a801fc3
crack --hash 21232f297a57a5a743894a0e4a801fc3 --wordlist synth_rockyou.txt
```
> That hash is MD5 of `admin` (the `admin_root` user). Carries HEX's confession.
Then `next`.

---

### Act III — Penetration Testing (Subnet Gamma)

**EP07 · The Perimeter Scan**
```
trace --pattern caught-cell-01 --compare hex-contact-log
ls
cat gamma-recon.cap
vulnscan --host 10.42.20.10
searchsploit "ProFTPD 1.3.3c"
```
> `cat gamma-recon.cap` is the recon step — it reveals the Bastion host
> (`10.42.20.10`) and drops it in the Evidence Locker. `vulnscan` is gated on it.
Then `next`.

**EP08 · The Default Bastion**
```
use exploit/unix/ftp/proftpd_backdoor
set RHOST 10.42.20.10
set PAYLOAD cmd/unix/reverse
exploit
```
> The prompt changes as you load the module and catch the shell.
Then `next`.

**EP09 · Ring-0 Escalation**
```
enumerate
find / -perm -u=s -type f
strings /opt/aether/bin/system-backup
priv-esc --vector path-hijack
```
> Do **not** touch the world-writable `admin-console` — it's the honeypot.
> Awards the `RING-0` badge.
Then `next`.

---

### Act IV — Bug Hunting & Web Exploits (Subnet Omega)

**EP10 · The Broken Gate**
```
ls
cat /etc/aether/services.conf
proxy-intercept --target cloud.aetherdyn.internal
inject-sql --payload "admin' OR '1'='1' --"
```
> `cat /etc/aether/services.conf` is the recon step — Bastion's own config names
> the cloud host (`cloud.aetherdyn.internal`). `proxy-intercept` is gated on it.
Then `next`.

**EP11 · The Phantom Parameter**
```
api-probe --endpoint /user/profile
tamper --param user_id=0001
```
> Your own id is `1042`; the exec record sits at `0001`.
Then `next`.

**EP12 · Zero-Day Protocol (FINALE)**
```
fetch-file --path ../../../../etc/aether/master_key.pem
verify-key A
bounty-report --compile
```
> A 60-second WARDEN trace starts the moment the traversal lands. Candidate **A**
> is the real key (checksum starts `e3b0`); **B** is the decoy. If the trace
> times out it soft-resets — re-run `fetch-file` and go again (never a hard fail).
>
> **Then choose the ending (this is the one real branch):**
> | Ending | Command | Result |
> | --- | --- | --- |
> | **Whitehat** (coordinated disclosure) | `bounty-report --submit --responsible` | Clears ECHO cleanly · +150 · badges `WHITEHAT OPERATOR` + `MASTER OPERATOR` |
> | **Vigilante** (full public leak) | `broadcast-leak --mode=public` | Aether collapses fast, ECHO's data spills · +100 · badges `VIGILANTE OPERATOR` + `MASTER OPERATOR` |

---

## Testing the story systems (optional)

- **Bond / HEX farewell readback.** At dialogue beats the comms panel offers
  clickable replies. The *warm/personal* ones (e.g. "Why me?", "Who's Vance to
  you?", "Are you okay, HEX?") raise a hidden bond score. To test all three
  farewells, play through picking:
  - **4+ warm replies** → the close/personal sign-off,
  - **1–3 warm** → the "we made a decent team" sign-off,
  - **0 warm** (always pick the mission-first option) → the all-business sign-off.
  The farewell prints right after the ending epilogue.
- **Fluid comms.** Watch the `HEX>` panel on any intro — each utterance should
  arrive as one continuous bubble, never split mid-sentence across two `HEX>`
  lines.
- **Save/Load round-trip.** `save` in EP01, refresh the page (or open in a new
  browser), then use **LOAD GAME** on the boot screen with the downloaded
  `.synthsave` file — it should resume at your furthest episode.

---

## Quick full-run smoke (copy-paste blocks)

Prologue → Act I:
```
help
codex
accept-code
next
netmap 10.42.0.0/24
ping 10.42.0.1
save
next
portscan --inspect 10.42.0.1
answer 8088
next
banner-grab --target 10.42.0.1 --port 80
inspect --protocol http
next
```
Act II:
```
decode --base64 "VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA=="
hexview --decode "44 49 52 45 43 54 4f 52 5f 4b 4f 56 41 43 53"
next
cipher-crack --type caesar --text "WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD"
xor-decrypt --stream "0x53 0x59 0x4E" --key 0x42
next
hash-identify 21232f297a57a5a743894a0e4a801fc3
crack --hash 21232f297a57a5a743894a0e4a801fc3 --wordlist synth_rockyou.txt
next
```
Act III:
```
trace --pattern caught-cell-01 --compare hex-contact-log
cat gamma-recon.cap
vulnscan --host 10.42.20.10
searchsploit "ProFTPD 1.3.3c"
next
use exploit/unix/ftp/proftpd_backdoor
set RHOST 10.42.20.10
set PAYLOAD cmd/unix/reverse
exploit
next
enumerate
find / -perm -u=s -type f
strings /opt/aether/bin/system-backup
priv-esc --vector path-hijack
next
```
Act IV → ending:
```
cat /etc/aether/services.conf
proxy-intercept --target cloud.aetherdyn.internal
inject-sql --payload "admin' OR '1'='1' --"
next
api-probe --endpoint /user/profile
tamper --param user_id=0001
next
fetch-file --path ../../../../etc/aether/master_key.pem
verify-key A
bounty-report --compile
bounty-report --submit --responsible
```
(Swap the last line for `broadcast-leak --mode=public` to test the Vigilante ending.)
