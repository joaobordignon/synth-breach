# SYNTH // BREACH — Educational & Technical Evaluation

*An evaluation of `docs/GAME_SCRIPT.md` on two axes: (A) pedagogy / fitness for a
10–12 audience, and (B) technical accuracy of the cybersecurity content. The
pedagogy review is a structured expert assessment; the technical pass
spot-verifies the non-obvious claims against primary sources (cited).*

---

## A. Pedagogy review (ages ~10–12)

### Rubric (each /5)

| Dimension | Score | Notes |
| --- | --- | --- |
| Clear learning objectives | 5 | Every episode declares `concepts[]` and a single verb to perform. |
| Scaffolding / progression (ZPD) | 5 | Networking → crypto → pentest → web; artifacts carry forward (ep3 cookie → ep4 decode; ep5 "Subnet Gamma" → ep7 recon; ep9 root → ep10 cloud config). |
| Active / experiential learning | 5 | Every concept is taught by *doing* it (run the command), not just reading — strongly constructivist. |
| Feedback & hints (scaffolded) | 5 | Tiered `intel` (theory → syntax → walkthrough → `stuck`), per-objective HEX tutoring, `<cmd> --help`, `codex`, Evidence Locker. Excellent graduated support. |
| Cognitive-load management | 4 | One objective revealed at a time; staggered reveals; Evidence Locker offloads memory. Risk: dense jargon per screen. |
| Age-appropriate reading level | 3 | HEX's vocabulary ("stealth-filtered", "tautology", "avalanche effect", "privilege escalation") sits above a grade-5–7 reading level. The game *teaches* the terms, but density challenges the younger end. |
| Technical accuracy | 4 | Two fixable factual issues (see Part B); everything else correct. |
| Misconception handling | 4 | Explicitly corrects "encoding = encryption" (ep4) and "hacking is just chaos" (ethics). One embedded error to fix (ProFTPD CVE). |
| Checks for understanding | 3 | Light: the `answer <port>` quiz + HEX "checkpoint" lines. Could add a "why does this matter?" beat per act. |
| Real-world transfer & ethics | 5 | Remediation tips (parameterized queries, bcrypt/Argon2 + salt, RBAC, least privilege, `$PATH` hygiene) teach *defense*, not just offense; the Operating Code frames ethics well. |
| Engagement / motivation | 5 | Narrative stakes (ECHO), HEX relationship, branching ending, voice/face/music. Strong intrinsic pull. |

**Bloom's progression:** Remember/Understand (EP00–04) → Apply (EP05–09) → Analyze/Evaluate (EP10–12: chaining vulns, then *choosing* a disclosure path). A deliberate climb in cognitive demand — well designed.

### Strengths
- **Learning-by-doing with a safety net.** The four-tier help economy (`--help` → `codex` → `intel 1/2/3` → `stuck`) is textbook ZPD scaffolding: support fades as competence grows, and a learner is never hard-stuck.
- **Defense is taught alongside offense.** Each exploit ends with the fix. This is the single most important choice for a *responsible* cyber-ed game, and it's consistent across all 13 episodes.
- **Ethics is mechanical, not preachy.** The Operating Code gate, the "cleared shard" refrain, and the Whitehat-vs-Vigilante ending (where the clean path scores higher and clears ECHO properly) make ethics a *decision*, not a lecture.
- **Misconception correction is explicit.** "Encoding ≠ encryption" (EP04) and "unsalted MD5 is broken" (EP06) directly target two of the most common beginner misconceptions.

### Recommendations (pedagogy)
1. **Reading level / glossary surfacing (highest impact for age fit).** Keep the vocabulary (it's the point), but make the `codex` definition one tap away *at the moment a hard word first appears* — e.g., HEX's first use of "tautology" or "SUID" could auto-suggest `codex <term>`. Consider a kid-mode toggle that expands jargon on first use.
2. **Add a lightweight "why it matters" check per act.** A single reflective reply-chip beat ("So why is cleartext dangerous?" → pick the right reason) turns passive reading into a comprehension check and reinforces transfer. You already have the reply-chip system — this is low-cost.
3. **Typing load.** Long hex/Base64 strings are a real motor barrier for 10–12. Copy/paste, tool chips and the Evidence Locker already help; consider a one-click "insert from Evidence Locker" for the exact string a command needs.
4. **Narrative maturity.** Surveillance-state detainment, "felony", HEX's guilt, and moral ambiguity place the *story* at the **older** edge of 10–12 (good for 11–13). That's fine — just worth stating for parents/teachers in any store/classroom blurb.
5. **Fix the two technical errors below** — an educational game should never teach a wrong fact.

---

## B. Technical-accuracy pass

Verdict: **accurate overall, with two fixable errors and one content-quality note.** Standard, well-established facts were confirmed from expertise; the two non-obvious / version-specific claims were verified against sources.

### ✅ Confirmed accurate (from established fact)
- **TTL defaults** — Linux/Unix initial TTL **64**, Windows **128**. ✔
- **TCP 3-way handshake** (SYN / SYN-ACK / ACK), flag semantics, open vs closed vs **filtered** (silent drop). ✔
- **Encoding ≠ encryption** — Base64 (6-bit groups, `=` padding) and hex are reversible with no key. ✔
- **Caesar/ROT** brute-force over 25 shifts + frequency analysis; **XOR is its own inverse**. ✔ (`WKH SURMHFW…` → `THE PROJECT IS MOVING TO SUBNET GAMMA`, a shift of 3 — the literal "Caesar" cipher.)
- **Hashing** — MD5 is 128-bit, fast, unsalted-by-default, broken for password storage; dictionary attack; **salting defeats rainbow tables**; bcrypt/Argon2 as the modern fix. ✔ The dump hashes are genuine: `md5("admin")=21232f29…`, `md5("hello")=5d414…`, `md5("test")=098f6…`. ✔
- **SUID** bit (`-rwsr-xr-x`) runs as owner; `find / -perm -u=s -type f` is the canonical sweep; **PATH hijack** via an unqualified binary call; least privilege as the fix. ✔
- **Reverse vs bind shell**; why **egress firewalls** matter. ✔
- **SQL injection** tautology `' OR '1'='1' --`; parameterized queries as the fix. ✔
- **IDOR / broken access control**; authN vs authZ. ✔
- **Path traversal** (`../`); canonicalization + RBAC as the fix. ✔
- **CVSS** 0.0–10.0, 9.0+ = Critical; coordinated/responsible disclosure vs full disclosure. ✔

### ❗ Finding 1 — ProFTPD: the CVE and the "backdoor" are two different things (EP07/EP08)  —  ✅ FIXED
*Resolution: kept the supply-chain backdoor story; module is now the real `exploit/unix/ftp/proftpd_133c_backdoor`; the `CVE-2010-4221` label was removed (the backdoor has no CVE) and the codex CVE example now uses Log4Shell (CVE-2021-44228).*

The game labels the target *"ProFTPD 1.3.3c … CVE-2010-4221 … Remote **Backdoor** Command Execution … module `exploit/unix/ftp/proftpd_backdoor`"*. That conflates two separate real-world ProFTPD 1.3.3-era events:

- **CVE-2010-4221** is the ProFTPD **Telnet IAC stack buffer overflow** (remote, pre-auth RCE). It affects **1.3.2rc3 – 1.3.3b** and was **fixed in 1.3.3c**. It is *not* a backdoor. ([NVD](https://nvd.nist.gov/vuln/detail/CVE-2010-4221), [xorl writeup](https://xorl.wordpress.com/2010/11/15/cve-2010-4221-proftpd-telnet_iac-remote-stack-overflow/))
- The **ProFTPD 1.3.3c backdoor** is a **supply-chain compromise**: the distribution server was hacked and a trojaned `proftpd-1.3.3c.tar` served Nov 28 – Dec 2, 2010, giving unauth remote **root**. Its Metasploit module is **`exploit/unix/ftp/proftpd_133c_backdoor`** — it has no clean CVE (it's the compromised-distribution incident). ([Metasploit module](https://github.com/rapid7/metasploit-framework/blob/master/modules/exploits/unix/ftp/proftpd_133c_backdoor.rb), [Slashdot](https://news.slashdot.org/story/10/12/02/131214/proftpdorg-compromised-backdoor-distributed))

So "1.3.3c" + "CVE-2010-4221" + "backdoor" is internally contradictory (that CVE was patched in 1.3.3c). The game's EP08 narration explicitly wants the **backdoor** ("an infamous supply-chain backdoor").

**Recommended fix (keeps the backdoor story, makes it real):** keep version **1.3.3c**; use module **`exploit/unix/ftp/proftpd_133c_backdoor`** (add the `133c`); and **drop the `CVE-2010-4221` label** (replace with "supply-chain backdoor, Nov 2010" — it genuinely has no distinct CVE). Keep "9.8 critical / RCE" as flavor if you like. This is a 3-line data edit in `act3Pentest` + `searchsploit` output and actually makes the episode *more* authentic (it's a famous real incident).

### ❗ Finding 2 — Finale CVSS score is 9.9, not 10.0 (EP12)  —  ✅ FIXED
*Resolution: changed the vector's `A:N` → `A:H`, so the printed 10.0 now matches the canonical CVSS 3.1 maximum vector.*

`FINALE_CVSS_VECTOR = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N"` but `FINALE_CVSS_SCORE = 10.0` and the advisory prints "**BASE SCORE 10.0 — MAXIMUM CRITICAL**". For that exact vector (Availability = **None**), the CVSS 3.1 base score is **9.9**, not 10.0. A true **10.0** requires **A:H** (the canonical 10.0 vector `…S:C/C:H/I:H/A:H`, e.g. the XZ-Utils backdoor CVE-2024-3094). ([CVSS scoring reference](https://secportal.io/blog/cvss-scoring-explained), [XZ backdoor 10.0 vector](https://en.wikipedia.org/wiki/XZ_Utils_backdoor))

**Two clean fixes — pick one:**
- **Most accurate:** keep `A:N` and set the score/copy to **9.9 (Critical)**. The vuln chain (auth bypass → IDOR → file read) impacts Confidentiality/Integrity, not Availability, so A:N is the honest rating.
- **Keep the dramatic 10.0:** change the vector's `A:N` → **`A:H`** (justifiable — rooting the surveillance core could take it down) so the printed 10.0 matches a real maximum vector.

Either is a one-constant edit in `src/engine/simulator.ts`.

### ⚠️ Content-quality note — the XOR demo decrypts to non-printable bytes (EP05)
The XOR stream `0x53 0x59 0x4E` is literally the ASCII `"SYN"`, and `^ 0x42` yields control characters (0x11, 0x1B, 0x0C), not readable text. The episode only demonstrates "XOR is its own inverse" (which is correct and fine), but the payoff lands harder for a learner if the XOR *result* spells something. Optional polish: choose a stream + key whose output is a readable word.

---

## Summary

- **Pedagogy:** strong, modern, responsible cyber-ed design — experiential, well-scaffolded, defense-aware, ethically framed. Main age-fit lever is **reading-level/jargon support**; add a light **comprehension check** per act. Narrative sits at the older edge of 10–12.
- **Technical accuracy:** solid, with **two fixable errors** (ProFTPD CVE/backdoor conflation; finale CVSS 9.9 vs 10.0) and one optional **XOR-demo polish**. Fixing them makes the game *more* authentic, and is a handful of data-line edits.

*Sources: [NVD CVE-2010-4221](https://nvd.nist.gov/vuln/detail/CVE-2010-4221) · [ProFTPD Telnet IAC writeup](https://xorl.wordpress.com/2010/11/15/cve-2010-4221-proftpd-telnet_iac-remote-stack-overflow/) · [Metasploit proftpd_133c_backdoor](https://github.com/rapid7/metasploit-framework/blob/master/modules/exploits/unix/ftp/proftpd_133c_backdoor.rb) · [ProFTPD backdoor incident (Slashdot)](https://news.slashdot.org/story/10/12/02/131214/proftpdorg-compromised-backdoor-distributed) · [CVSS 3.1 scoring](https://secportal.io/blog/cvss-scoring-explained) · [XZ Utils backdoor (10.0 vector)](https://en.wikipedia.org/wiki/XZ_Utils_backdoor).*
