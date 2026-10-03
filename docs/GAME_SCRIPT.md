# SYNTH // BREACH — Game Script

> **Spoiler warning — this is the full campaign screenplay.** It is generated
> directly from the game (`npm run script`), so HEX's dialogue, the expected
> commands, their in-game help, and the tiered intel always match what ships.
> `{handle}` is the player's chosen callsign (default shown).

Legend: **HEX>** HEX speaking · **YOU>** player reply chips · **▶ COMMAND** what
to type · **HELP** the `<cmd> --help` man page · **INTEL** the tiered hints.

---

# Prologue

## EP00 — First Boot

**Concepts:** What a shell/terminal is · Command anatomy: command --flag value · Command history (↑/↓) & tab-completion · help / intel / codex are always free · The Operating Code (ethics & scope)

**Mission board:** HEX: Before I hand you a target, prove you can drive this rig. Type `help`.

### Opening
```
    HEX> Signal's clean. You're jacked in, CYBER//ZERO. I read you five by five.
    HEX> Let's see if you can drive this rig. Type `help` and I'll show you what you're working with.
    HEX> You still with me, CYBER//ZERO? First run's always the one that sticks.
```

### Walkthrough
**▶ COMMAND:** `help`

```
    USAGE   help [command]
            List available commands, or show detailed usage for one.
```
HEX responds:
```
    HEX> Nice. That's your whole toolkit. Every line there is a command you can run.
    HEX> Want to know more about any of it? That's what the `codex` is for. Our reference library, and it's always free. Go on, open it up.
```

**▶ COMMAND:** `codex`

```
    USAGE   codex [topic|command]
            Open the reference library. `codex <command>` jumps to the matching concept.
            No argument opens this episode's topic.
            codex <topic>    networking · cryptography · pentesting · webSecurity
            codex <command>  jumps to the concept behind a tool, e.g. `codex netmap`.
```
HEX responds:
```
    HEX> Good. The codex is your friend. Pop it open any time you're stuck.
    HEX> Now the one thing that matters more than any command: our code of conduct. We only break into what we're cleared to break into, and this whole range is practice, nothing real. Here it is:
    HEX> Read it over. When you're ready to sign on with us, type `accept-code`.
```

**▶ COMMAND:** `accept-code`

```
    USAGE   accept-code
            Formally acknowledge the Null Pointer Collective's Operating Code.
```
HEX responds:
```
    HEX> Good. You can drive, and you know the rule. Welcome to the active roster, CYBER//ZERO. I'm unlocking the first live target range: 10.42.0.0/24, Aether's outer perimeter.
    HEX> Somewhere past that router is the machine that scored ECHO. We start there.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: intro
  HEX> You still with me, {handle}? First run's always the one that sticks.
    • YOU> Ready. Point me at it.
         HEX> Good. A little scared is the right kind of scared. Start with `help`.
    • YOU> ...This is really all simulated?
         HEX> Every byte. It's an air-gapped shard. Out there this is a felony. In here it's a classroom. Breathe, then `help`.
    • YOU> Why me?   [warm]
         HEX> Because you've got a reason. People with reasons don't quit at the first locked door. Now go on, `help`.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : Every command follows one shape: a name, then optional --flags and values. Nothing here can break anything real — the whole range is simulated and air-gapped.
  intel 2  (tier 2 · syntax) : Type `help` to list commands, `codex` to open the library, then read the code and `accept-code`.
  intel 3  (tier 3 · deep)   : Three steps clear the Prologue, in order: list your toolkit, open the reference library (it's free), then acknowledge the Operating Code to sign in. Each is a single word.
```

---

# Act I — Network

## EP01 — The Gateway Knock
*SUBNET ALPHA — EDGE PERIMETER*

**Concepts:** IPv4 addressing (32 bits, 4 octets) · CIDR /24 masks · ICMP echo request/reply · TTL & RTT

**Mission board:** HEX: Hardware can't hide from an ICMP pulse. Sweep the subnet, then ping the gateway.

### Opening
```
    HEX> Channel's live. Same rule as always, CYBER//ZERO: this shard's ours to test, cleared and air-gapped. Nothing you learn here gets pointed at something you don't own. Clear?
    HEX> Good. Aether severed standard DNS, figuring that hides their perimeter. All it does is make them predictable.
    HEX> Your subnet is 10.42.0.0/24. The /24 means the first 3 octets, 24 bits, belong to Aether. The last 8 bits leave 254 possible hosts behind one gateway.
    HEX> Start with a sweep. Map your subnet and see what's actually alive on it. If the syntax trips you, run `netmap --help`; the theory's always in the `codex`. Show me what's out there.
```

### Walkthrough
**▶ COMMAND:** `netmap 10.42.0.0/24`

```
    USAGE   netmap <cidr>
            Sweep a subnet for active hosts (ARP/ICMP).
            Give it a subnet in CIDR form: <network-address>/<prefix>.
            Your assigned /24 covers 10.42.0.0 through 10.42.0.255.
            Example:  netmap <network>/<prefix>
```
HEX responds:
```
    HEX> Two live out of 254. The rest are dark. The one marked GATEWAY is your way in and out of this whole subnet. Now measure the path to it: ping it and read what comes back.
```

**▶ COMMAND:** `ping 10.42.0.1`

```
    USAGE   ping <ip>
            Send ICMP echo requests to a host.
            Reports TTL (OS/hop hint) and round-trip time for one host.
            Point it at the active gateway you just found on the map.
            Example:  ping <ip-address>
```
HEX responds:
```
    HEX> Gateway's logged.
    HEX> ttl=64 tells you a Linux-family stack is answering (Windows starts at 128).
    HEX> Sub-4ms RTT means it's one hop away. That's your gateway, our way into this subnet.
    HEX> Before we push on, one habit that keeps a run alive: bank it. `save` it now!
```

**▶ COMMAND:** `save`

```
    USAGE   save
            Download your progress as a .synthsave file (to continue elsewhere).
```
HEX responds:
```
    HEX> Gateway's real, it's breathing, and your run's banked. That's your first foothold, and a save you can walk away from.
    HEX> Get some rest, CYBER//ZERO. When you're ready, type `next`.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: objective:ping
  HEX> Before we push on, one habit that keeps a run alive: bank it. `save` it now!
    • YOU> How do I save?   [warm]
         HEX> Type `save`. It drops a .synthsave file on your machine, your whole run made portable. Next time, `load` it in-shell or hit LOAD GAME on the boot screen and you pick up right here. Do it now.
    • YOU> Already on it.   [mission]
         HEX> Good instinct. `save` drops a .synthsave file, your run made portable. `load` or LOAD GAME brings it back. Bank it before we move on.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : A /24 CIDR sweep probes every host in 10.42.0.0 – 10.42.0.255 with ICMP/ARP. Active hosts answer; filtered ones stay silent. `ping` then measures round-trip time and reads the TTL. And `save` writes your whole run to a file you keep.
  intel 2  (tier 2 · syntax) : Run `netmap 10.42.0.0/24` to map the subnet, `ping 10.42.0.1` to knock on the gateway, then `save` to bank your progress.
  intel 3  (tier 3 · deep)   : Three steps: sweep your assigned subnet with netmap (CIDR form — the 10.42.0.0 network, /24 prefix). The sweep marks the active ROUTER GATEWAY; ping that exact host to read its TTL and RTT. Then run `save` — it downloads a .synthsave file of your run that you can `load` (or LOAD GAME on the boot screen) to continue later, anywhere.
```

---

## EP02 — The Three-Way Handshake
*SUBNET ALPHA — EDGE PERIMETER*

**Concepts:** TCP vs UDP · 3-way handshake (SYN/SYN-ACK/ACK) · flags: SYN/ACK/RST/FIN · open vs closed vs filtered

**Mission board:** HEX: Every service answers one of three ways — open, slammed shut, or silently dropped. Scan and watch the flags.

### Opening
```
    HEX> Good work on the gateway. Now we need an entry point: a port left listening.
    HEX> Every service answers one of three ways: wide open, slammed shut, or silently dropped like it never heard you. Firewalls love that last one. A server shows its hand in the handshake, SYN, SYN-ACK, ACK, unless something's actively lying to you.
    HEX> You've got a tool on your deck that maps a host's ports and captures how each one answers. Dig through your kit: `help` lists it, `<tool> --help` tells you what it does. Then point it somewhere worth your time. The gateway's the only door into this subnet; everything else is noise.
    HEX> Read the flags it brings back, then `answer` me which port is hiding.
```

### Walkthrough
**▶ COMMAND:** `portscan --inspect 10.42.0.1`

```
    USAGE   portscan --inspect <ip>
            SYN-scan a host and render the captured packet handshake table.
            Pass --inspect <ip> to render the captured packet table.
            Read the FLAGS column: [SYN,ACK] = open, [RST,ACK] = closed,
            NO RESPONSE = silently filtered (a firewall dropped it).
            Example:  portscan --inspect <ip>
```
HEX responds:
```
    HEX> 22 and 80 answered clean. One of those three never replied at all. A firewall ate the packet and hoped you'd move on. Read the FLAGS column and `answer` me which port's hiding.
```

**▶ COMMAND:** `answer 8088`

```
    USAGE   answer <port>
            Answer HEX's field question (which port is filtered).
            Submit the port number you judge to be stealth-filtered.  Example:  answer <port>
```
HEX responds:
```
    HEX> 8088 didn't even bother with a RST. It just went dark. A closed port says no; this one, CYBER//ZERO, only talks to people who already know the secret handshake.
    HEX> Corporate infrastructure doesn't hide what it isn't ashamed of. Type `next`.
```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : A port replying [SYN, ACK] completed two of three handshake steps — it's OPEN. [RST, ACK] means CLOSED. No response at all is FILTERED: a firewall silently dropped the packet.
  intel 2  (tier 2 · syntax) : Run `portscan --inspect 10.42.0.1` and read the FLAGS column. Then `answer` with the port that returned NO RESPONSE.
  intel 3  (tier 3 · deep)   : Capture the handshake with portscan's --inspect flag against the gateway (10.42.0.1). Read the FLAGS column: 22 and 80 reply [SYN,ACK] (open); one port returns NO RESPONSE — that's the stealth-filtered one. `answer` with that port's number.
```

---

## EP03 — The Ghost Service
*SUBNET ALPHA — EDGE PERIMETER*

**Concepts:** OSI L7 vs L4 · service banners / version disclosure · cleartext (HTTP/Telnet) vs encrypted (TLS/SSH)

**Mission board:** HEX: Legacy servers blab their versions and send secrets in cleartext. Grab the banner.

### Opening
```
    HEX> We know port 80 is listening. We need more off that gateway, the stuff it leaks just by answering. Legacy servers from the 80s love talking too much: they blab exact versions in every header and broadcast in clear, unencrypted ASCII. A postcard anyone can read in transit.
    HEX> Look at your tools and the mission board, CYBER//ZERO. I'm sure you can pull it. If only there were a way to... grab... something off that web port. Check `help`, and `<tool> --help` if a tool's new to you. The `codex` has the theory if you want to read ahead.
```

### Walkthrough
**▶ COMMAND:** `banner-grab --target 10.42.0.1 --port 80`

```
    USAGE   banner-grab --target <ip> --port <port>
            Probe a socket and dump the service's response banner.
            Opens a socket and prints the service's response headers.
            Target the gateway's open web port (the well-known HTTP port is 80).
            Example:  banner-grab --target <ip> --port <port>
```
HEX responds:
```
    HEX> There it is: a version string AND a Set-Cookie, in the clear. Why did the HTTP packet blush? Because it saw the TLS get undressed. ...I'm here all week.
    HEX> Jokes aside, nothing here is wearing a lock. Prove it. There's a tool that classifies a transport as cleartext or encrypted. Find it in your kit and run it against this protocol. The `codex` has the TLS theory if you want to know WHY it matters.
```

**▶ COMMAND:** `inspect --protocol http`

```
    USAGE   inspect --protocol http
            Classify a transport as cleartext or encrypted.
```
HEX responds:
```
    HEX> Score's ticking up. Still background noise to whatever's watching, but it's counting. Keep that in the back of your head.
    HEX> That cookie value ending in `==`? It's dressed up to look important, but it's just Base64. No encryption at all. Decode it and we're past the edge. Subnet Beta's next: the Crypto Vault.
    HEX> That's where they actually try to hide things properly. Type `next`.
    HEX> Edge perimeter's wide open and barely noticed us. Easy so far. It won't stay that way.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: objective:inspect
  HEX> Edge perimeter's wide open and barely noticed us. Easy so far. It won't stay that way.
    • YOU> What's actually behind all this, HEX?   [warm]
         HEX> A machine that decided ECHO was a threat, and a company that called that a feature. We're going to read it its own rights, one subnet at a time.
    • YOU> Bring on the Crypto Vault.   [mission]
         HEX> That's the spirit. Real ciphers in there, not Base64 in a trenchcoat. Type `next`.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : A Server: header hands an attacker the exact daemon + version to look up CVEs against. And a Set-Cookie flying over plain HTTP (not HTTPS/TLS) is readable by anyone sniffing the wire.
  intel 2  (tier 2 · syntax) : Run `banner-grab --target 10.42.0.1 --port 80`, then `inspect --protocol http` to classify it.
  intel 3  (tier 3 · deep)   : Grab the banner on the gateway's web port (the well-known HTTP port, 80) with banner-grab's --target and --port flags. Then classify the transport with inspect (its --protocol is http) — note the cleartext X-Transmission-Mode header and the session cookie (ends in ==) leaking with no TLS.
```

---

# Act II — Cryptography

## EP04 — The Ciphertext Wire
*SUBNET BETA — CRYPTO VAULT*

**Concepts:** encoding vs encryption vs hashing · Base64 (6-bit groups, '=' padding) · hex/ASCII byte representation

**Mission board:** HEX: Encoding is not encryption — anyone can reverse it with no key. Strip the padding.

### Opening
```
    HEX> Same rule as always, CYBER//ZERO: cleared shard, nothing leaves the range.
    HEX> I pulled that session cookie off the wire and dropped it on your deck. See how it ends in == ? ...Base64. Typical. I've seen worse out of shops that should know better, Aether especially. They always dress up laziness as protocol.
    HEX> This is the part rookies miss: encoding is not encryption. Base64 just reshapes data for transport, and anyone reverses it in milliseconds with no key. So reverse it, and let's read what Aether thinks it's hiding.
    HEX> Start by stripping the padding off that cookie. Reverse the Base64 and see what falls out. Run `decode --help` if you need the syntax; `codex` has the encoding-vs-encryption theory.
```

**On your deck / Evidence Locker:**
- Session cookie (Base64): `VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA==`

### Walkthrough
**▶ COMMAND:** `decode --base64 "VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA=="`

```
    USAGE   decode --base64 "<data>"
            Decode a Base64 string back to ASCII.
            Base64 ends in '=' padding and is reversible with no key.
            You captured the cookie value in the Episode 03 banner (select+copy it).
            Example:  decode --base64 "<the cookie value>"
```
HEX responds:
```
    HEX> There it is: a protocol token, in plain text. No key required.
    HEX> There's your dump. `hexview --decode` it. Who's signing the exec channel?
```

**▶ COMMAND:** `hexview --decode "44 49 52 45 43 54 4f 52 5f 4b 4f 56 41 43 53"`

```
    USAGE   hexview --decode "<hex bytes>"
            Interpret a hex byte stream as ASCII.
            Each byte is two hex digits (0-9, a-f); decode them to ASCII characters.
            HEX hands you the exec log's hex bytes in the briefing — paste them in.
            Example:  hexview --decode "44 49 52 ..."
```
HEX responds:
```
    HEX> TYPE-04-OREON-PROTOCOL, and DIRECTOR_KOVACS signing the exec channel. Good.
    HEX> Remember, none of that was encryption. It offered zero confidentiality. Next they'll try actual ciphers. Let's go break some math. Type `next`.
```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : Base64 maps every 3 bytes to 4 printable chars; trailing '=' is padding. Hex writes each byte as two 0-F digits. Both are reversible with zero key — that's the whole lesson: encoding ≠ secrecy.
  intel 2  (tier 2 · syntax) : Decode the cookie string with `decode --base64 "..."`, then feed the hex bytes to `hexview --decode "..."`.
  intel 3  (tier 3 · deep)   : First decode the Base64 session cookie printed in your terminal (the value after '=', ending in ==) with decode --base64. That reveals a protocol token AND prints an EXEC-LOG hex dump — feed those hex bytes to hexview --decode to read the name signing the exec channel.
```

---

## EP05 — The Caesar & XOR Anomaly
*SUBNET BETA — CRYPTO VAULT*

**Concepts:** symmetric vs asymmetric · Caesar/ROT substitution · frequency analysis · XOR stream cipher

**Mission board:** HEX: Kovacs talks to Dr. Vance over a rotation cipher plus an XOR bitmask. Break the math.

### Opening
```
    HEX> Kovacs is talking to their chief scientist, Dr. Vance, over a scrambled channel. They know someone's sniffing, so they ran it through a classical rotation cipher, then an XOR bitmask. Let's break their math.
    HEX> ...Vance. Haven't heard that name in a long time.
    HEX> (a beat too long) ...Focus on the cipher, CYBER//ZERO. Not the history lesson.
    HEX> Intercept's on your deck. Start with the outer layer. It's a classic rotation cipher, the oldest trick there is. Crack that first and let's see if it reads. `cipher-crack --help` for syntax; `codex` for the cipher theory.
    HEX> ...You caught that, didn't you. The way I said her name.
```

**On your deck / Evidence Locker:**
- Caesar ciphertext: `WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD`

### Walkthrough
**▶ COMMAND:** `cipher-crack --type caesar --text "WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD"`

```
    USAGE   cipher-crack --type caesar --text "<ciphertext>"
            Brute-force all 25 Caesar/ROT shifts and flag the English one.
            Tries every shift and highlights the one that reads as English.
            Feed it the intercepted ciphertext from HEX's briefing (copy it).
            Example:  cipher-crack --type caesar --text "WKH SURMHFW ..."
```
HEX responds:
```
    HEX> Readable now. A fixed-shift cipher never survives 25 guesses. But look: there's a second layer buried under it, an XOR bitmask. I just pulled the stream and the key onto your deck (they're in your Evidence Locker too). Peel that layer off next.
```

**▶ COMMAND:** `xor-decrypt --stream "0x12 0x10 0x07 0x01 0x0D 0x05" --key 0x42`

```
    USAGE   xor-decrypt --stream "0x.. 0x.." --key 0x..
            XOR a hex stream against a single-byte key, with live bit-flip view.
            XOR is its own inverse: ciphertext ^ key = plaintext, byte by byte.
            Pass the hex --stream and the single-byte --key — both are on your deck
            (check the intercept / Evidence Locker).
            Example:  xor-decrypt --stream "0x.. 0x.." --key 0x..
```
HEX responds:
```
    HEX> PRECOG. ...So that's what they named it. The machine that scored ECHO. The project moving to Subnet Gamma IS PRECOG. Now we know exactly what we're hunting.
    HEX> 'THE PROJECT IS MOVING TO SUBNET GAMMA.' That's our next subnet: Bastion Core.
    HEX> And did you catch that log? That channel didn't have a second layer yesterday. Something in there is watching what we break and patching around it in real time. Type `next`.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: intro
  HEX> ...You caught that, didn't you. The way I said her name.
    • YOU> Who's Vance to you?   [warm]
         HEX> (a long pause) Someone I worked beside, a lifetime ago. Leave it there for now. Please.
         HEX> ...We'll get to it. Just not tonight.
    • YOU> Focus. Got it.   [mission]
         HEX> ...Thank you, {handle}. Crack the Caesar layer first.
    • YOU> You can tell me when you're ready.   [warm]
         HEX> (quiet) ...Yeah. I know. Let's work.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : A Caesar cipher shifts every letter by a fixed amount — only 25 possibilities, so you brute-force all of them and eyeball which reads as English (frequency analysis). XOR is its own inverse: ciphertext ^ key = plaintext, bit by bit.
  intel 2  (tier 2 · syntax) : Run cipher-crack on the intercept, read the shift that yields English, then xor-decrypt the telemetry stream with --key 0x42.
  intel 3  (tier 3 · deep)   : Caesar first: pass the intercepted ciphertext shown on your deck to cipher-crack --type caesar — it tries all 25 shifts and flags the English one. Then peel the XOR layer: give xor-decrypt the hex stream from your deck and the recovered --key 0x42 (XOR is its own inverse).
```

---

## EP06 — Shattering the Salt
*SUBNET BETA — CRYPTO VAULT*

**Concepts:** one-way hashes (MD5/SHA) · avalanche effect · rainbow tables · salting · dictionary attacks

**Mission board:** HEX: You can't decrypt a hash — you guess until one collides. Unsalted + weak = seconds.

### Opening
```
    HEX> We breached the Crypto Vault's credential table. No passwords, just 32-char hex strings.
    HEX> Hashes are one-way math. You can't 'decrypt' one; you hash guesses until you find a match, or look it up in a rainbow table. Unless they salted them, weak passwords crumble in seconds.
    HEX> TARGET DUMP:
    HEX> Kovacs. Vance. Same two names from the intercept, plus an 'admin_root' account that should've been locked down years ago. Some things never change in that building.
    HEX> Start by fingerprinting one of those hashes. What are we even dealing with? Run `hash-identify --help` for syntax; `codex` explains hashing, salting, and rainbow tables.
```

**On your deck / Evidence Locker:**
- kovacs hash: `5d41402abc4b2a76b9719d911017c592`
- vance hash: `098f6bcd4621d373cade4e832627b4f6`
- admin_root hash: `21232f297a57a5a743894a0e4a801fc3`

### Walkthrough
**▶ COMMAND:** `hash-identify 21232f297a57a5a743894a0e4a801fc3`

```
    USAGE   hash-identify <hash>
            Fingerprint a hash by length/signature.
            Length gives it away: 32 hex chars = MD5, 40 = SHA-1, 64 = SHA-256.
            The dump in the briefing lists each user's hash — copy one in.
            Example:  hash-identify <32-hex-char-hash>
```
HEX responds:
```
    HEX> 32 hex characters. That's MD5, broken for password storage for twenty years. You can't reverse a hash, but you don't have to: hash a wordlist and compare. Crack the weak one.
```

**▶ COMMAND:** `crack --hash 21232f297a57a5a743894a0e4a801fc3 --wordlist synth_rockyou.txt`

```
    USAGE   crack --hash <hash> --wordlist <file>
            Run a dictionary attack against a hash.
            Hashes each word in the list and compares — no 'decrypting' a hash.
            Target the admin_root hash; the wordlist file is synth_rockyou.txt.
            Example:  crack --hash <hash> --wordlist synth_rockyou.txt
```
HEX responds:
```
    HEX> ...Hold on. Before we move on Bastion Core, there's something you should know. I'd rather you hear it from me than trip over it in a log file in there.
    HEX> Years back, I worked at Aether. Systems architecture, PRECOG division. Vance ran the lab two floors up. I wrote some of the early pattern-matching logic, the stuff still running under whatever flagged ECHO. I told myself for a long time I didn't know what it would grow into.
    HEX> I don't tell myself that anymore. I left when I saw what shipped. Getting you into this system isn't activism for me, CYBER//ZERO. It's the closest thing I've got to fixing what I broke.
    HEX> Every hint I've handed you? Call it paying a debt.
    HEX> (a long pause) ...Anyway. Bastion Core's waiting. You ready? Type `next`.
    HEX> ...So now you know. All of it.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: objective:crack
  HEX> ...So now you know. All of it.
    • YOU> You built it, and now you're tearing it down.   [mission]
         HEX> That's the only math that lets me sleep. Barely. But it's enough to keep moving.
    • YOU> Doesn't change anything between us.   [warm]
         HEX> (a breath) ...It changes plenty for me. But I'll take it. Thank you, {handle}.
    • YOU> We'll fix it. Together.   [warm]
         HEX> (quiet) Yeah. Together. Bastion Core's waiting when you are.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : A 32-hex-char digest is 128 bits — the MD5 signature. Because MD5 is unsalted and fast, a dictionary attack hashes every word in a list and compares. 'admin_root' hashes to the MD5 of 'admin'.
  intel 2  (tier 2 · syntax) : Run `hash-identify 21232f297a57a5a743894a0e4a801fc3`, then crack that same hash with the wordlist.
  intel 3  (tier 3 · deep)   : Fingerprint a hash with hash-identify (32 hex chars = MD5). Then copy the admin_root hash from the dump in your terminal and run crack on it with --wordlist synth_rockyou.txt — it hashes each word and compares until one matches.
```

---

# Act III — Penetration Testing

## EP07 — The Perimeter Scan
*SUBNET GAMMA — BASTION CORE*

**Concepts:** 5-phase pentest lifecycle · vuln scanning vs port scanning · CVE databases · CVSS 0.0–10.0

**Mission board:** HEX: Recon, scan, access, maintain, cover — five phases, no shortcuts. Find the unpatched flaw.

### Opening
```
    HEX> CYBER//ZERO, thanks for not making that weird back there. Wanted that said before we're both underwater again.
    HEX> We're inside Subnet Gamma: Bastion Core. Hardened corporate servers now, the kind I used to get paged about at 3 AM. Don't throw random exploits. Work it methodically.
    HEX> First, clear me. Run that trace; I won't take it personally. Then we hunt for one unpatched service on the Bastion box. One step at a time; I'll call the next move when you land the last. `<cmd> --help` for any tool's syntax, `codex` for the five-phase pentest lifecycle.
```

**On your deck / Evidence Locker:**
- caught cell breach pattern: `caught-cell-01`
- your HEX contact log: `hex-contact-log`

### Walkthrough
**▶ COMMAND:** `trace --pattern caught-cell-01 --compare hex-contact-log`

```
    USAGE   trace --pattern <id> --compare <log>
            Compare breach-signature timestamps to test a causal link.
            Compares two event timelines to test cause and effect.
            The Collective alert named both ids: the caught cell's breach pattern
            is `caught-cell-01`; your HEX contact record is `hex-contact-log`.
            Example:  trace --pattern caught-cell-01 --compare hex-contact-log
```
HEX responds:
```
    HEX> I know what that looks like. It isn't a leak. Nobody fed them anything. Every caught operative made contact within hours of a signature the Warden had already seen. That's not a mole. That's the Warden LEARNING, studying your moves, not just logging.
    HEX> Same rule as always, CYBER//ZERO: cleared shard, eyes open from here on.
    HEX> So. You ran the timeline before you'd take my word for it.
    HEX> We're square. Problem: the intercept said Gamma, but we don't know WHICH host yet. I grabbed an ARP capture on the way in; it's sitting on your foothold. `ls` to see what's readable, then `cat` the recon and find us a box worth breaking into.
```

**▶ COMMAND:** `cat gamma-recon.cap`

```
    USAGE   cat <path>
            Read a file's contents (recon).
            Prints a file. `ls` first to see what's readable here.
            A config or capture often names the host/IP you need next.
```
HEX responds:
```
    HEX> There's our box: aether-bastion, 10.42.20.10. Three services listening, and hardened isn't the same as patched. Fingerprint its versions and find the soft one.
```

**▶ COMMAND:** `vulnscan --host 10.42.20.10`

```
    USAGE   vulnscan --host <ip>
            Version-fingerprint services on a host and flag vulnerable ones.
            Goes past port-scanning: fingerprints exact service versions and flags
            the vulnerable one. Point it at the Bastion host you found in the Gamma
            recon (it's in your Evidence Locker — `recall` if you cleared the screen).
            Example:  vulnscan --host <ip>
```
HEX responds:
```
    HEX> ProFTPD 1.3.3c. That version's got a reputation. A fingerprint's only useful if you know what it's vulnerable TO, so look that exact service and version up against the exploit database. There's a tool for searching known exploits; feed it what the scan just flagged.
```

**▶ COMMAND:** `searchsploit "ProFTPD 1.3.3c"`

```
    USAGE   searchsploit "<service version>"
            Search the exploit/CVE database for a service version.
            Quote the exact service + version the vulnscan reported.
            Example:  searchsploit "<Service X.Y.Z>"
```
HEX responds:
```
    HEX> A planted backdoor in the 1.3.3c source itself. The real ProFTPD got trojaned at the distribution server back in 2010. Unauth remote root. Supply-chain compromise is still one of the ugliest ways real systems fall: nobody wrote a bug, someone poisoned the well.
    HEX> Load it up next episode and catch a shell. Type `next`.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: objective:trace
  HEX> So. You ran the timeline before you'd take my word for it.
    • YOU> I never doubted you.
         HEX> Don't lie to a former systems architect, {handle}. You checked. Good. I'd have checked too.
    • YOU> I had to be sure. You get that.
         HEX> I do. Trust-you-verify beats trust-you-assume, every time. We're good.
    • YOU> The Warden learning scares me more.
         HEX> Yeah. It should. It stopped being a wall; it's a hunter now. Eyes open from here.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : Recon before exploitation: you can't scan a host you haven't found. `ls` shows what a foothold exposes; `cat` reads it. Vulnerability scanning then fingerprints the exact service VERSION and cross-references known CVEs. A CVSS base score (0–10) rates severity; 9.0+ is critical.
  intel 2  (tier 2 · syntax) : Run the trace to clear HEX, then `ls` and `cat` the Gamma recon to find the host, then `vulnscan --host <that ip>`, then searchsploit the service + version it reports.
  intel 3  (tier 3 · deep)   : Clear HEX first: trace caught-cell-01 against hex-contact-log — the breach predates contact, so no leak. Then `ls` the foothold and `cat gamma-recon.cap`: it names aether-bastion at 10.42.20.10. vulnscan that host; it flags ProFTPD 1.3.3c. searchsploit that exact service + version.
```

---

## EP08 — The Default Bastion
*SUBNET GAMMA — BASTION CORE*

**Concepts:** exploit weaponization · payloads · reverse vs bind shells · egress firewalls

**Mission board:** HEX: Load the module, set your listener, trigger RCE, catch a reverse shell.

### Opening
```
    HEX> That ProFTPD version has an infamous supply-chain backdoor. The 1.3.3c source was trojaned at the distribution server in 2010, one of the ugliest in the book. Aether's own team flagged the version internally and got told to replace it 'next quarter.' Next quarter never came.
    HEX> Start by loading that backdoor module into your cyberdeck, the one searchsploit named for the CVE (it's in your Evidence Locker). `use --help` if you need the syntax; `codex` covers reverse-vs-bind shells. Get it loaded and I'll walk you through arming it.
```

**On your deck / Evidence Locker:**
- Exploit module (from searchsploit): `exploit/unix/ftp/proftpd_133c_backdoor`
- Target host (Bastion): `10.42.20.10`

### Walkthrough
**▶ COMMAND:** `use exploit/unix/ftp/proftpd_133c_backdoor`

```
    USAGE   use <exploit/module/path>
            Load an exploit module into the cyberdeck (enters module REPL).
            Loads a module and enters its REPL (the prompt changes to the module).
            The module path is whatever `searchsploit` named for the CVE — it's in
            your Evidence Locker. `recall` it if you cleared the screen.
            Example:  use <exploit/module/path>
```
HEX responds:
```
    HEX> Loaded. Your prompt changed to prove it. Now arm it: it needs a target (RHOST) and a payload, a reverse shell, so the box calls back out to you. `set` both.
```

**▶ COMMAND:** `set RHOST 10.42.20.10`

```
    USAGE   set <OPTION> <value>
            Set a module option (RHOST, RPORT, PAYLOAD).
            Configure the loaded module. You need two options:
              set RHOST <target ip>        (the Bastion host)
              set PAYLOAD cmd/unix/reverse (a reverse shell)
```

**▶ COMMAND:** `set PAYLOAD cmd/unix/reverse`

```
    USAGE   set <OPTION> <value>
            Set a module option (RHOST, RPORT, PAYLOAD).
            Configure the loaded module. You need two options:
              set RHOST <target ip>        (the Bastion host)
              set PAYLOAD cmd/unix/reverse (a reverse shell)
```
HEX responds:
```
    HEX> Target and payload locked in. That's everything it needs. Run `exploit`, and catch the shell when it phones home.
```

**▶ COMMAND:** `exploit`

```
    USAGE   exploit
            Fire the loaded, configured exploit module.
```
HEX responds:
```
    HEX> Session's live: daemon@aether-bastion. Low privilege, but you're inside the host.
    HEX> A reverse shell phoned home because nothing stopped it going out. Remember that when you're the one defending. For now, we're boxed into a sandbox. Time to escalate. Type `next`.
```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : A reverse shell makes the TARGET connect back OUT to your listener (vs a bind shell that opens a port on the target). That's why egress firewalls matter: they block the outbound call-home.
  intel 2  (tier 2 · syntax) : `use` the module, `set RHOST 10.42.20.10`, `set PAYLOAD cmd/unix/reverse`, then `exploit`.
  intel 3  (tier 3 · deep)   : Load the ProFTPD backdoor module with use (searchsploit printed its path last episode). In the module prompt, set RHOST to the Bastion host (10.42.20.10) and set PAYLOAD to cmd/unix/reverse, then exploit to trigger RCE and catch the reverse shell.
```

---

## EP09 — Ring-0 Escalation
*SUBNET GAMMA — BASTION CORE*

**Concepts:** Linux permissions (rwx) · UID & the SUID bit · PATH hijacking · least privilege

**Mission board:** HEX: Low-priv shell. Don't touch the bait. Find a SUID binary you can bend, and become root.

### Opening
```
    HEX> You've got a shell, but look at your prompt: daemon@aether-bastion. Unprivileged sandbox: no executive logs, no private keys. We need Ring-0, root.
    HEX> Start by getting the lay of the land. Enumerate the filesystem and see what's actually here. Run `<cmd> --help` for syntax, and once we know what we're looking at, I'll point you at the way up.
```

### Walkthrough
**▶ COMMAND:** `enumerate`

```
    USAGE   enumerate
            Survey the filesystem for interesting files and sessions.
```
HEX responds:
```
    HEX> Don't. A world-writable root binary sitting in the open, with a root session conveniently idling next to it? That's not misconfiguration. That's bait, a canary. Touch that console and it stops logging an anomaly and starts confirming exactly who's in here.
    HEX> Back away from it. There's a real way in, just not the one left on the floor.
    HEX> Here's the standard play every operator runs on a new box: sweep for SUID binaries, programs that run as their OWNER (usually root) instead of you. The canonical search is `find / -perm -u=s -type f`: -perm -u=s matches the setuid bit. One of those, misconfigured, is your ladder to root. Run it. (`codex priv-esc` if you want the theory first.)
    HEX> You felt that pull, didn't you. The easy door, sitting right there in the open.
```

**▶ COMMAND:** `find / -perm -u=s -type f`

```
    USAGE   find / -perm -u=s -type f
            Find SUID binaries on the filesystem.
            SUID binaries (rwsr-xr-x) run as their owner (root), not you.
            The classic search: find / -perm -u=s -type f
```
HEX responds:
```
    HEX> That custom one. Inspect its strings and see what it shells out to.
```

**▶ COMMAND:** `strings /opt/aether/bin/system-backup`

```
    USAGE   strings <binary>
            Dump printable strings from a binary.
```
HEX responds:
```
    HEX> There it is: it calls `tar` by bare name, no absolute path. That's the whole vulnerability. The technique's called a PATH hijack: you drop your own `tar` in a directory that comes earlier in $PATH, so when that root-owned binary runs `tar`, it runs YOURS, as root.
    HEX> That's your way up, a classic PATH hijack. Feed that technique to priv-esc as its vector, and the box is yours. (`codex priv-esc` if you want the full write-up.)
```

**▶ COMMAND:** `priv-esc --vector path-hijack`

```
    USAGE   priv-esc --vector <technique>
            Escalate privileges by hijacking an unqualified binary call.
            `strings` the SUID binary first: if it calls a helper by bare name, the
            technique is a PATH hijack — put your own binary earlier in $PATH.
            `codex priv-esc` explains the vector name to pass.
            Example:  priv-esc --vector <technique>
```
HEX responds:
```
    HEX> root@aether-bastion. Ring-0. You own the box.
    HEX> And you walked past the honeypot to get here. That's the real skill. Least privilege and a clean $PATH would've closed that whole door. Aether ran neither.
    HEX> Bastion's ours. Next is Kovacs' house: the cloud. Type `next`.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: objective:recon
  HEX> You felt that pull, didn't you. The easy door, sitting right there in the open.
    • YOU> I almost took it.   [warm]
         HEX> Everyone almost does. That you stopped is the whole difference between us and the cells Aether already burned. The real way in is harder and quieter. Find the SUID binary.
    • YOU> Bait's obvious once you name it.   [mission]
         HEX> It is now. It wasn't to the operatives who tripped it before you. Stay sharp, and hunt the misconfigured SUID binary instead.
    • YOU> The Warden set that for me?   [warm]
         HEX> For whoever got this far. That's you. It isn't logging an anomaly anymore, {handle}. It's hunting one. Move careful from here.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : The SUID bit (rwsr-xr-x) makes a binary run as its OWNER (root), not the caller. If that root binary calls another program by bare name (e.g. `tar`, not `/bin/tar`), you can put a malicious `tar` earlier in $PATH and it runs as root. That's a PATH hijack.
  intel 2  (tier 2 · syntax) : Run `enumerate` (ignore the world-writable console — it's bait), then `find / -perm -u=s -type f`, then `priv-esc --vector path-hijack`.
  intel 3  (tier 3 · deep)   : enumerate the filesystem (the world-writable console is BAIT — leave it). Hunt SUID binaries with find's -perm -u=s flags; the custom /opt/aether/bin/system-backup stands out. strings it — it calls `tar` by bare name — then priv-esc with the path-hijack vector to run your own tar as root.
```

---

# Act IV — Bug Hunting

## EP10 — The Broken Gate
*SUBNET OMEGA — AETHER CLOUD*

**Concepts:** SQL injection · string-concatenation queries · tautology bypass ' OR '1'='1 · parameterized queries

**Mission board:** HEX: Their login stitches user input straight into SQL. Make the database your puppet.

### Opening
```
    HEX> Same rule as always, CYBER//ZERO: cleared shard, this stays on the range. This one matters most, because this is Kovacs' house. But Bastion isn't the brain. The surveillance core runs somewhere in their cloud, and we don't have the address yet.
    HEX> You still own the Bastion box. A machine that talks to the cloud has to know where the cloud IS, so read its config. `ls` what root can see, `cat` whatever names the backend. Find me that host, then we take its login apart.
```

### Walkthrough
**▶ COMMAND:** `cat /etc/aether/services.conf`

```
    USAGE   cat <path>
            Read a file's contents (recon).
            Prints a file. `ls` first to see what's readable here.
            A config or capture often names the host/IP you need next.
```
HEX responds:
```
    HEX> cloud.aetherdyn.internal. That's it. That's where PRECOG actually lives, and where it scored ECHO. Their login gate stitches user input straight into SQL. Intercept it, then make the database your puppet.
```

**▶ COMMAND:** `proxy-intercept --target cloud.aetherdyn.internal`

```
    USAGE   proxy-intercept --target <host>
            Intercept the next outgoing HTTP request to a host.
            Catches the next outbound HTTP request so you can tamper with it.
            Point it at the cloud API host you found in Bastion's config (it's in
            your Evidence Locker — `recall` if you cleared the screen).
            Example:  proxy-intercept --target <host>
```
HEX responds:
```
    HEX> Frozen mid-flight. See how it drops your username straight into the SQL query? That's the whole flaw. Inject a payload that forces the WHERE clause true and comments out the rest.
```

**▶ COMMAND:** `inject-sql --payload "admin' OR '1'='1' --"`

```
    USAGE   inject-sql --payload "<payload>"
            Replace the intercepted username field with a SQL payload and forward it.
            The server concatenates your input into: ...WHERE username='<you>'...
            Close the quote, OR an always-true condition, then comment out the rest
            with --. You need a tautology like '1'='1' plus a SQL comment.
```
HEX responds:
```
    HEX> role=SYSTEM_DIRECTOR. You're in as Kovacs' own tier. First time I've touched his side of the building since I left.
    HEX> Fix is one line: parameterized queries. Treat input as DATA, never as SQL. Next we go after what they think you can't see. Type `next`.
    HEX> SYSTEM_DIRECTOR. We're standing in Kovacs' own house now. ...First time I've been inside these walls since I walked out.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: objective:inject
  HEX> SYSTEM_DIRECTOR. We're standing in Kovacs' own house now. ...First time I've been inside these walls since I walked out.
    • YOU> You don't have to go in with me.   [warm]
         HEX> (quiet) Yeah, I do. I helped build the locks on this place. Only right I'm here when they come off. Keep moving, {handle}.
    • YOU> What's it like, being back?   [warm]
         HEX> Like a house you used to live in, where something terrible happened after you left. Let's not linger in it. Next.
    • YOU> Then let's take it apart.   [mission]
         HEX> Brick by brick. Their access control's next, and it's worse than their login. Type `next`.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : Recon first: a host that talks to the cloud stores the cloud's address. `ls` the Bastion box and `cat` its service config. Then — the login server builds SELECT * FROM users WHERE username='$user' AND password='$pass'. Close the quote, OR '1'='1' (always true), `--` the rest.
  intel 2  (tier 2 · syntax) : `ls`, then `cat /etc/aether/services.conf` to get the host. Intercept its login, then inject the tautology payload: admin' OR '1'='1' --
  intel 3  (tier 3 · deep)   : Read the Bastion config (`cat /etc/aether/services.conf`) — it names cloud.aetherdyn.internal. proxy-intercept that host to catch the login POST, then inject-sql a payload that closes the quote, adds an always-true OR '1'='1', and comments the rest out with -- .
```

---

## EP11 — The Phantom Parameter
*SUBNET OMEGA — AETHER CLOUD*

**Concepts:** IDOR · broken access control · authN vs authZ · horizontal vs vertical escalation

**Mission board:** HEX: They authenticate who you are but forget to authorize what you can see. Tamper the ID.

### Opening
```
    HEX> You're logged in on an operator token, but locked out of the classified index. Watch the API calls. Many backends authenticate WHO you are but forget to authorize WHAT you can view. They pass object IDs in the URL and blindly trust the client.
    HEX> Start by baselining the profile API with your own token. See what a normal, honest request even looks like, and what it gives back. `api-probe --help` for syntax; `codex` for IDOR and access control. Once we see the shape of it, the hole shows itself.
```

### Walkthrough
**▶ COMMAND:** `api-probe --endpoint /user/profile`

```
    USAGE   api-probe --endpoint <path>
            Send a baseline authenticated request to an API endpoint.
            Sends one authenticated request so you can see the normal response.
            Baseline the profile endpoint: /user/profile — note the id in the URL.
            Example:  api-probe --endpoint /user/profile
```
HEX responds:
```
    HEX> 1042 is you. The ID's right there in the URL. What happens if you ask for a lower one?
```

**▶ COMMAND:** `tamper --param user_id=0001`

```
    USAGE   tamper --param user_id=<id>
            Replay the request with a tampered parameter.
            The server trusts the client-supplied id (an IDOR). Your own id is 1042;
            the exec records sit at low ids. Walk it down toward 0001.
            Example:  tamper --param user_id=<id>
```
HEX responds:
```
    HEX> (flat, quiet) There it is, in writing. No appeals process, no oversight. Same hole ECHO fell through. And Kovacs signed off anyway.
    HEX> 'RE: PRECOG DEPLOYMENT — ETHICS REVIEW OVERRIDE,' signed Kovacs. Someone below him flagged exactly this: no appeals process, no oversight. Same hole ECHO fell through.
    HEX> And he signed off anyway. That's not a rogue AI making a mistake, CYBER//ZERO. That's a person who read the warning and shipped it. ...It just armed something, too. We don't slow-walk what's next. Type `next`.
    HEX> A signature. Not a glitch. A person, choosing this.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: objective:tamper
  HEX> A signature. Not a glitch. A person, choosing this.
    • YOU> Kovacs knew exactly what he shipped.
         HEX> Read the warning. Signed it anyway. That's not negligence, {handle}. That's a decision.
    • YOU> This is bigger than ECHO now.
         HEX> It was always bigger. ECHO's just the one that put a name to it for us.
    • YOU> We end this.
         HEX> We end it. One more subnet. Whatever it just armed, we move faster than it.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : An IDOR is Broken Access Control: the server returns object #0001 to anyone who asks, without checking the session owns it. Your own record is user_id=1042; lower IDs belong to execs.
  intel 2  (tier 2 · syntax) : Probe /user/profile to see your own id (1042), then tamper the parameter down to 0001.
  intel 3  (tier 3 · deep)   : Baseline the /user/profile endpoint with api-probe — the response shows your own id, 1042. Then tamper the user_id parameter to a much lower value; the exec records sit near 0001, and the server never checks you actually own that record.
```

---

## EP12 — Zero-Day Protocol
*SUBNET OMEGA — AETHER CLOUD*

**Concepts:** path traversal (../) · vulnerability chaining · CVSS 3.1 scoring · coordinated disclosure

**Mission board:** HEX: Chain it. Escape the web root, verify the real key before the trace lands, then choose how this ends.

### Opening
```
    HEX> This is the endgame. The file viewer is vulnerable to path traversal. Break out of the web root, extract the master signing key, and compile a dossier that shuts Aether down.
    HEX> The Warden knows we're here, and it won't sit still. Neither am I. First thing I've built in years that might fix something instead of break it. Whatever happens, ECHO's record gets a chance. That's the only ending I care about. Let's finish it.
    HEX> Walk the file viewer out of its web root to the master key. The Warden plants a decoy, so verify the real one against my memo checksum before the trace lands, then compile the advisory. `fetch-file --help` / `verify-key --help` for syntax; `codex` for path traversal.
```

### Walkthrough
**▶ COMMAND:** `fetch-file --path ../../../../etc/aether/master_key.pem`

```
    USAGE   fetch-file --path <path>
            Request a file through the vulnerable viewer endpoint.
            The viewer doesn't sanitize paths. Walk out of the web root with ../
            sequences to reach /etc/aether/master_key.pem.
            Example:  fetch-file --path ../../../../etc/aether/<target>
```
HEX responds:
```
    HEX> My intercepted memo says the real key's checksum starts e3b0. `verify-key` them.
```

**▶ COMMAND:** `verify-key A`

```
    USAGE   verify-key <A|B>
            Checksum a candidate key against HEX's memo value (reuses the Ep06 hashing skill).
            WARDEN planted a decoy. Checksum each candidate (A or B) and keep the
            one matching HEX's memo value (it starts e3b0). Wrong pick costs time.
            Example:  verify-key A
```
HEX responds:
```
    HEX> That's the one. Clean grab. Now compile the advisory.
```

**▶ COMMAND:** `bounty-report --compile`

```
    USAGE   bounty-report --compile | --submit --responsible
            Compile the vuln-chain advisory, or submit it for coordinated disclosure (Whitehat ending).
```
HEX responds:
```
    HEX> That's the whole chain, scored and documented. Now the only question left: how does this end? Two ways, CYBER//ZERO, and they are NOT the same.
    HEX> That's the whole chain, documented. Last call's yours, CYBER//ZERO.
```

**▶ COMMAND:** `bounty-report --submit --responsible`

```
    USAGE   bounty-report --compile | --submit --responsible
            Compile the vuln-chain advisory, or submit it for coordinated disclosure (Whitehat ending).
```
HEX responds:
```
    HEX> Slower. Harder. But it's the ending that actually fixes something.
    HEX> That's the one I cared about, CYBER//ZERO. Debt paid, by both of us. Thank you.
    HEX> You kept it all business, start to finish. No complaints; the work got done, and done clean. Watch your back out there, operator. HEX, signing off.
```

### Dialogue choices (player reply chips)
```
  ▸ beat fires on: objective:report
  HEX> That's the whole chain, documented. Last call's yours, {handle}.
    • YOU> Whatever happens, this was worth it.   [warm]
         HEX> It was. Whatever you choose next, I'm glad it was you on the other end of this channel.
    • YOU> Are you okay, HEX?   [warm]
         HEX> (a pause) ...First time anyone's asked me that in years. I will be. Finish it.
    • YOU> Let's finish it.   [mission]
         HEX> Then choose how it ends: leak it to the world, or disclose it clean. Both shut Aether down. Only one clears ECHO's name the right way.

```

### Intel (tiered hints)
```
  intel    (tier 1 · theory) : Path traversal walks `../` out of the served directory to read arbitrary files. The Warden plants a decoy key at the same path; the Ep06 skill saves you — checksum each candidate and match HEX's memo value. CVSS 3.1 scores the whole chain (Scope-changed, high C/I) at 10.0.
  intel 2  (tier 2 · syntax) : Run the traversal, then `verify-key A` / `verify-key B` and keep the one whose checksum matches HEX's memo. Compile the report, then pick: `broadcast-leak --mode=public` or `bounty-report --submit --responsible`.
  intel 3  (tier 3 · deep)   : fetch-file with a --path that climbs out of the web root using ../ sequences to reach /etc/aether/master_key.pem. WARDEN plants a decoy, so verify-key each candidate (A and B) and keep the one whose checksum matches HEX's memo (it starts e3b0). Then compile the advisory with bounty-report, and choose how it ends — leak publicly, or disclose responsibly.
```

---

## Endings (EP12 branch)

- **Whitehat** — `bounty-report --submit --responsible` → coordinated disclosure; ECHO cleared cleanly.
- **Vigilante** — `broadcast-leak --mode=public` → full public leak; Aether falls fast, collateral.

## The give-up escape hatch

After reading `intel 3` for an episode, `stuck --<flag>` drops the exact next command into your prompt. Flags:

- `stuck --terminatorgotme`
- `stuck --imgoingtobedafterthisone`
- `stuck --skynetwins`
- `stuck --hexcarryme`
- `stuck --iamjustahuman`
- `stuck --bluepillplease`
