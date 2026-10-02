import type { Episode, Line } from "../../engine/types";
import {
  base64Decode,
  hexDecode,
  caesarAllShifts,
  xorBytes,
  toBin,
  identifyHash,
  crackFromDump,
  SYNTH_WORDLIST,
} from "../../engine/simulator";

// Act II: Cryptography (Subnet Beta: Crypto Vault) — Episodes 4-6.
// docs/SPEC.md §12. WARDEN first *adapts* here (0.07 -> 0.34), and Episode 06
// carries HEX's confession — the mid-campaign reveal. The "tells" planted in
// Ep04/05 (Aether, Vance) pay that off.

const CAESAR_CIPHERTEXT = "WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD";
const KOVACS_HEX = "44 49 52 45 43 54 4f 52 5f 4b 4f 56 41 43 53";

function argVal(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function englishScore(s: string): number {
  // Crude readability score: reward spaces and common letters.
  const m = s.toUpperCase().match(/[ ETAOINSHR]/g);
  return m ? m.length : 0;
}

// ---------------------------------------------------------------------------
export const episode04: Episode = {
  id: 4,
  act: 2,
  title: "The Ciphertext Wire",
  subnet: "SUBNET BETA — CRYPTO VAULT",
  concepts: ["encoding vs encryption vs hashing", "Base64 (6-bit groups, '=' padding)", "hex/ASCII byte representation"],
  briefing: "HEX: Encoding is not encryption — anyone can reverse it with no key. Strip the padding.",
  codexTopic: "cryptography",
  intro: [
    "[COMMS // HEX]: Same rule as always, {handle} — cleared shard, nothing leaves the range.",
    "[COMMS // HEX]: I pulled that session cookie off the wire and dropped it on your deck. See how it",
    "ends in == ? ...Base64. Typical. I've seen worse out of shops that should know better — Aether",
    "especially. They always dress up laziness as protocol.",
    "[COMMS // HEX]: Here's the lesson rookies miss: encoding is not encryption. Base64 just reshapes",
    "data for transport — anyone reverses it in milliseconds, no key required. So reverse it, and let's",
    "read what Aether thinks it's hiding.",
    "[COMMS // HEX]: Strip the padding off the cookie, then hexview the exec-log dump it unlocks. If the",
    "syntax trips you, `decode --help` / `hexview --help`; `codex` has the encoding-vs-encryption theory.",
    // Intercept data printed to the TERMINAL (non-hex kinds) so it's copyable.
    { text: "", kind: "normal" },
    { text: "  ── INTERCEPT // SESSION COOKIE ─────────────────────────────", kind: "system" },
    { text: "  AETHER_SESSION=VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA==", kind: "normal" },
    { text: "  ────────────────────────────────────────────────────────────", kind: "system" },
    { text: "  (select + copy the value after '=', then run `decode` — see `decode --help`)", kind: "dim" },
  ],
  objectives: [
    { id: "b64", label: "Decode the intercepted session cookie" },
    { id: "hex", label: "Decode the executive hex log to a name" },
  ],
  evidence: [{ label: "Session cookie (Base64)", value: "VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA==" }],
  hints: [
    "Base64 maps every 3 bytes to 4 printable chars; trailing '=' is padding. Hex writes each byte as " +
      "two 0-F digits. Both are reversible with zero key — that's the whole lesson: encoding ≠ secrecy.",
    "Decode the cookie string with `decode --base64 \"...\"`, then feed the hex bytes to `hexview --decode \"...\"`.",
    "First decode the Base64 session cookie printed in your terminal (the value after '=', ending in " +
      "==) with decode --base64. That reveals a protocol token AND prints an EXEC-LOG hex dump — feed " +
      "those hex bytes to hexview --decode to read the name signing the exec channel.",
  ],
  outro: [
    "[COMMS // HEX]: TYPE-04-OREON-PROTOCOL, and DIRECTOR_KOVACS signing the exec channel. Good.",
    "[COMMS // HEX]: Remember — none of that was encryption. It offered zero confidentiality. Next",
    "they'll try actual ciphers. Let's go break some math. Type `next`.",
  ],
  commands: {
    decode: {
      usage: 'decode --base64 "<data>"',
      description: "Decode a Base64 string back to ASCII.",
      help: [
        "Base64 ends in '=' padding and is reversible with no key.",
        "You captured the cookie value in the Episode 03 banner (select+copy it).",
        'Example:  decode --base64 "<the cookie value>"',
      ],
      run: (args, api) => {
        if (argVal(args, "--base64") === undefined && args[0] !== "--base64") {
          return api.print('[!] Usage: decode --base64 "<data>"', "error");
        }
        const data = (argVal(args, "--base64") ?? "").replace(/^["']|["']$/g, "");
        const out = base64Decode(data);
        if (!out) return api.print("[!] That isn't valid Base64. Check the string (it ends in ==).", "error");
        api.print([
          { text: `[*] Base64 input : ${data}`, kind: "dim" },
          { text: `[✓] ASCII output : ${out}`, kind: "success" },
        ]);
        if (out === "TYPE-04-OREON-PROTOCOL") {
          api.print("[COMMS // HEX]: There it is — a protocol token, in plain text. No key required.", "hex");
          api.complete("b64");
          api.addScore(40);
          // The token unlocks the executive hex log — surface it to decode next.
          if (!api.isComplete("hex")) {
            api.print([
              { text: "", kind: "normal" },
              { text: "[*] Token OREON-PROTOCOL accepted — pulling the executive hex log it unlocks:", kind: "system" },
              { text: "  ── EXEC-LOG // HEX DUMP ────────────────────────────────────", kind: "system" },
              { text: `  ${KOVACS_HEX}`, kind: "warn" },
              { text: "  ────────────────────────────────────────────────────────────", kind: "system" },
              { text: "  (select + copy those bytes, then run `hexview` — see `hexview --help`)", kind: "dim" },
            ]);
            api.evidence("Executive log (hex dump)", KOVACS_HEX);
            api.print("[COMMS // HEX]: There's your dump. `hexview --decode` it — who's signing the exec channel?", "hex");
          }
        }
      },
    },
    hexview: {
      usage: 'hexview --decode "<hex bytes>"',
      description: "Interpret a hex byte stream as ASCII.",
      help: [
        "Each byte is two hex digits (0-9, a-f); decode them to ASCII characters.",
        "HEX hands you the exec log's hex bytes in the briefing — paste them in.",
        'Example:  hexview --decode "44 49 52 ..."',
      ],
      run: (args, api) => {
        const data = (argVal(args, "--decode") ?? "").replace(/^["']|["']$/g, "");
        if (!data) return api.print('[!] Usage: hexview --decode "44 49 52 ..."', "error");
        const out = hexDecode(data);
        if (!out) return api.print("[!] Not a valid hex stream (need pairs of 0-F).", "error");
        api.print([
          { text: `[*] Hex input  : ${data}`, kind: "dim" },
          { text: `[✓] ASCII out  : ${out}`, kind: "success" },
        ]);
        if (out === "DIRECTOR_KOVACS") {
          api.print(
            [
              { text: "[*] Pedagogical checkpoint: encoding ≠ encryption. Base64 and hex are reversible", kind: "system" },
              { text: "    transforms with NO key. Only encryption (a key-dependent transform) gives secrecy.", kind: "system" },
            ],
          );
          api.complete("hex");
          api.addScore(40);
        }
      },
    },
  },
};

// ---------------------------------------------------------------------------
export const episode05: Episode = {
  id: 5,
  act: 2,
  title: "The Caesar & XOR Anomaly",
  subnet: "SUBNET BETA — CRYPTO VAULT",
  concepts: ["symmetric vs asymmetric", "Caesar/ROT substitution", "frequency analysis", "XOR stream cipher"],
  briefing: "HEX: Kovacs talks to Dr. Vance over a rotation cipher plus an XOR bitmask. Break the math.",
  codexTopic: "cryptography",
  intro: [
    "[COMMS // HEX]: Kovacs is talking to their chief scientist, Dr. Vance, over a scrambled channel.",
    "They know someone's sniffing, so they ran it through a classical rotation cipher, then an XOR",
    "bitmask. Let's break their math.",
    { text: "[COMMS // HEX]: ...Vance. Haven't heard that name in a long time.", kind: "hex" },
    { text: "[COMMS // HEX]: (a beat too long) ...Focus on the cipher, {handle}. Not the history lesson.", kind: "hex" },
    { text: "[COMMS // HEX]: Intercept's on your deck. Crack the Caesar layer first, then peel the XOR", kind: "hex" },
    { text: "with the single-byte key I already pulled off the wire: 0x42. `cipher-crack --help` /", kind: "hex" },
    { text: "`xor-decrypt --help` for syntax; `codex` for the symmetric-cipher theory.", kind: "hex" },
    // Intercept data printed to the TERMINAL (non-hex kinds) so it's copyable.
    { text: "", kind: "normal" },
    { text: "  ── INTERCEPT // CAESAR LAYER ───────────────────────────────", kind: "system" },
    { text: "  WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD", kind: "normal" },
    { text: "  ── TELEMETRY // XOR STREAM  (recovered key: 0x42) ──────────", kind: "system" },
    { text: "  0x53 0x59 0x4E", kind: "normal" },
    { text: "  ────────────────────────────────────────────────────────────", kind: "system" },
    { text: "  (copy the intercept above into `cipher-crack`, then `xor-decrypt` — see `<cmd> --help`)", kind: "dim" },
  ],
  objectives: [
    {
      id: "caesar",
      label: "Brute-force the Caesar shift to readable text",
      hex: [
        "[COMMS // HEX]: Readable now — a fixed-shift cipher never survives 25 guesses. But they buried a",
        "second layer under it: an XOR bitmask. Peel that off next with the single-byte key I pulled.",
      ],
    },
    { id: "xor", label: "Strip the single-byte XOR mask off the stream" },
  ],
  evidence: [
    { label: "Caesar ciphertext", value: "WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD" },
    { label: "XOR stream (hex)", value: "0x53 0x59 0x4E" },
    { label: "XOR key (recovered)", value: "0x42" },
  ],
  hints: [
    "A Caesar cipher shifts every letter by a fixed amount — only 25 possibilities, so you brute-force " +
      "all of them and eyeball which reads as English (frequency analysis). XOR is its own inverse: " +
      "ciphertext ^ key = plaintext, bit by bit.",
    `Run cipher-crack on the intercept, read the shift that yields English, then xor-decrypt the ` +
      `telemetry stream with --key 0x42.`,
    "Caesar first: pass the intercepted ciphertext shown on your deck to cipher-crack --type caesar — " +
      "it tries all 25 shifts and flags the English one. Then peel the XOR layer: give xor-decrypt the " +
      "hex stream from your deck and the recovered --key 0x42 (XOR is its own inverse).",
  ],
  outro: [
    "[COMMS // HEX]: 'THE PROJECT IS MOVING TO SUBNET GAMMA.' That's our next subnet — Bastion Core.",
    "[COMMS // HEX]: And did you catch that log? That channel didn't have a second layer yesterday.",
    "Something in there is watching what we break and patching around it in real time. Type `next`.",
  ],
  beats: [
    {
      trigger: "intro",
      prompt: "...You caught that, didn't you. The way I said her name.",
      replies: [
        {
          text: "Who's Vance to you?",
          tone: "warm",
          response: ["(a long pause) Someone I worked beside, a lifetime ago. Leave it there for now. Please.", "...We'll get to it. Just not tonight."],
        },
        { text: "Focus. Got it.", tone: "mission", response: ["...Thank you, {handle}. Crack the Caesar layer first."] },
        { text: "You can tell me when you're ready.", tone: "warm", response: ["(quiet) ...Yeah. I know. Let's work."] },
      ],
    },
  ],
  commands: {
    "cipher-crack": {
      usage: 'cipher-crack --type caesar --text "<ciphertext>"',
      description: "Brute-force all 25 Caesar/ROT shifts and flag the English one.",
      help: [
        "Tries every shift and highlights the one that reads as English.",
        "Feed it the intercepted ciphertext from HEX's briefing (copy it).",
        'Example:  cipher-crack --type caesar --text "WKH SURMHFW ..."',
      ],
      run: (args, api) => {
        if (argVal(args, "--type") !== "caesar") return api.print("[!] Only --type caesar is wired up here.", "error");
        const text = (argVal(args, "--text") ?? "").replace(/^["']|["']$/g, "") || CAESAR_CIPHERTEXT;
        const shifts = caesarAllShifts(text);
        let best = shifts[0];
        for (const s of shifts) if (englishScore(s.text) > englishScore(best.text)) best = s;
        api.print({ text: "[*] Running frequency analysis across all 25 shifts...", kind: "system" });
        const lines: Line[] = shifts.map((s) => ({
          text: `  ROT-${String(s.shift).padStart(2, "0")}  ${s.text}`,
          kind: s.shift === best.shift ? "success" : "dim",
        }));
        api.print(lines);
        api.print({
          text: `[✓] ROT-${best.shift} reads as English: "${best.text}"`,
          kind: "success",
        });
        api.complete("caesar");
        api.addScore(45);
        // The instant the Caesar layer falls, WARDEN adapts (first real reaction).
        api.printAfter(500, { text: "", kind: "normal" });
        setTimeout(() => {
          api.warden(0.15, "ROTATE_KEYS", "Internal comms re-encrypted with secondary XOR layer (was: single-layer ROT)");
          api.fx("glitch");
        }, 600);
      },
    },
    "xor-decrypt": {
      usage: 'xor-decrypt --stream "0x.. 0x.." --key 0x..',
      description: "XOR a hex stream against a single-byte key, with live bit-flip view.",
      help: [
        "XOR is its own inverse: ciphertext ^ key = plaintext, byte by byte.",
        "Pass the hex --stream and the single-byte --key — both are on your deck",
        "(check the intercept / Evidence Locker).",
        'Example:  xor-decrypt --stream "0x.. 0x.." --key 0x..',
      ],
      run: (args, api) => {
        const stream = (argVal(args, "--stream") ?? "").replace(/^["']|["']$/g, "");
        const keyStr = argVal(args, "--key") ?? "";
        if (!stream || !keyStr) return api.print('[!] Usage: xor-decrypt --stream "0x..." --key 0x42', "error");
        const key = parseInt(keyStr.replace(/0x/i, ""), 16);
        if (Number.isNaN(key)) return api.print("[!] --key must be a hex byte, e.g. 0x42.", "error");
        const inBytes = stream.replace(/0x/gi, "").trim().split(/\s+/).map((h) => parseInt(h, 16));
        const { bytes } = xorBytes(stream, key);
        const lines: Line[] = [{ text: `[*] XOR each byte against key 0x${key.toString(16).toUpperCase()}:`, kind: "system" }];
        inBytes.forEach((b, i) => {
          lines.push({
            text: `  ${toBin(b)} ^ ${toBin(key)} = ${toBin(bytes[i])}  (0x${b.toString(16)} -> 0x${bytes[i].toString(16)})`,
            kind: "normal",
          });
        });
        api.print(lines);
        api.print({
          text: "[✓] XOR is symmetric: the same operation that masked the stream reveals it. One key, both ways.",
          kind: "success",
        });
        api.complete("xor");
        api.addScore(45);
      },
    },
  },
};

// ---------------------------------------------------------------------------
export const episode06: Episode = {
  id: 6,
  act: 2,
  title: "Shattering the Salt",
  subnet: "SUBNET BETA — CRYPTO VAULT",
  concepts: ["one-way hashes (MD5/SHA)", "avalanche effect", "rainbow tables", "salting", "dictionary attacks"],
  briefing: "HEX: You can't decrypt a hash — you guess until one collides. Unsalted + weak = seconds.",
  codexTopic: "cryptography",
  intro: [
    "[COMMS // HEX]: We breached the Crypto Vault's credential table. No passwords — 32-char hex strings.",
    "[COMMS // HEX]: Hashes are one-way math. You can't 'decrypt' one; you hash guesses until you find a",
    "match, or look it up in a rainbow table. Unless they salted them, weak passwords crumble in seconds.",
    "",
    "  TARGET DUMP:",
    { text: "    kovacs:     5d41402abc4b2a76b9719d911017c592", kind: "dim" },
    { text: "    vance:      098f6bcd4621d373cade4e832627b4f6", kind: "dim" },
    { text: "    admin_root: 21232f297a57a5a743894a0e4a801fc3", kind: "dim" },
    "[COMMS // HEX]: Kovacs. Vance. Same two names as the intercept. And 'admin_root' on a password of",
    "'admin' — some things never change in that building, no matter how many years go by.",
    "[COMMS // HEX]: Fingerprint one of those hashes, then dictionary-attack the weak one. `hash-identify",
    "--help` and `crack --help` have the syntax; `codex` explains hashing, salting, and rainbow tables.",
  ],
  objectives: [
    {
      id: "identify",
      label: "Fingerprint the hash algorithm",
      hex: [
        "[COMMS // HEX]: 32 hex characters — that's MD5, broken for password storage for twenty years. You",
        "can't reverse a hash, but you don't have to: hash a wordlist and compare. Crack the weak one.",
      ],
    },
    { id: "crack", label: "Dictionary-attack the admin_root hash" },
  ],
  evidence: [
    { label: "kovacs hash", value: "5d41402abc4b2a76b9719d911017c592" },
    { label: "vance hash", value: "098f6bcd4621d373cade4e832627b4f6" },
    { label: "admin_root hash", value: "21232f297a57a5a743894a0e4a801fc3" },
  ],
  hints: [
    "A 32-hex-char digest is 128 bits — the MD5 signature. Because MD5 is unsalted and fast, a dictionary " +
      "attack hashes every word in a list and compares. 'admin_root' hashes to the MD5 of 'admin'.",
    "Run `hash-identify 21232f297a57a5a743894a0e4a801fc3`, then crack that same hash with the wordlist.",
    "Fingerprint a hash with hash-identify (32 hex chars = MD5). Then copy the admin_root hash from " +
      "the dump in your terminal and run crack on it with --wordlist synth_rockyou.txt — it hashes " +
      "each word and compares until one matches.",
  ],
  outro: [
    "[COMMS // HEX]: ...Hold on. Before we move on Bastion Core, there's something you should know.",
    "I'd rather you hear it from me than trip over it in a log file in there.",
    "[COMMS // HEX]: Years back, I worked at Aether. Systems architecture, PRECOG division. Vance ran",
    "the lab two floors up. I wrote some of the early pattern-matching logic — the stuff still running",
    "under whatever flagged ECHO. I told myself for a long time I didn't know what it would grow into.",
    "[COMMS // HEX]: I don't tell myself that anymore. I left when I saw what shipped. Getting you into",
    "this system isn't activism for me, {handle}. It's the closest thing I've got to fixing what I broke.",
    "[COMMS // HEX]: Every hint I've handed you — call it paying a debt.",
    { text: "[COMMS // HEX]: (a long pause) ...Anyway. Bastion Core's waiting. You ready? Type `next`.", kind: "hex" },
  ],
  beats: [
    {
      trigger: "objective:crack",
      prompt: "...So now you know. All of it.",
      replies: [
        {
          text: "You built it — and now you're tearing it down.",
          tone: "mission",
          response: ["That's the only math that lets me sleep. Barely. But it's enough to keep moving."],
        },
        {
          text: "Doesn't change anything between us.",
          tone: "warm",
          response: ["(a breath) ...It changes plenty for me. But I'll take it. Thank you, {handle}."],
        },
        {
          text: "We'll fix it. Together.",
          tone: "warm",
          response: ["(quiet) Yeah. Together. Bastion Core's waiting when you are."],
        },
      ],
    },
  ],
  commands: {
    "hash-identify": {
      usage: "hash-identify <hash>",
      description: "Fingerprint a hash by length/signature.",
      help: [
        "Length gives it away: 32 hex chars = MD5, 40 = SHA-1, 64 = SHA-256.",
        "The dump in the briefing lists each user's hash — copy one in.",
        "Example:  hash-identify <32-hex-char-hash>",
      ],
      run: (args, api) => {
        const h = args[0];
        if (!h) return api.print("[!] Usage: hash-identify <hash>", "error");
        const kind = identifyHash(h);
        if (!kind) return api.print("[!] Unrecognized digest length.", "error");
        api.print([
          { text: `[*] ${h}`, kind: "dim" },
          { text: `[✓] Detected: ${kind} — fast, unsalted, broken for password storage since the 2000s.`, kind: "success" },
        ]);
        api.complete("identify");
        api.addScore(30);
      },
    },
    crack: {
      usage: "crack --hash <hash> --wordlist <file>",
      description: "Run a dictionary attack against a hash.",
      help: [
        "Hashes each word in the list and compares — no 'decrypting' a hash.",
        "Target the admin_root hash; the wordlist file is synth_rockyou.txt.",
        "Example:  crack --hash <hash> --wordlist synth_rockyou.txt",
      ],
      run: (args, api) => {
        const hash = argVal(args, "--hash");
        const wordlist = argVal(args, "--wordlist");
        if (!hash || !wordlist) return api.print("[!] Usage: crack --hash <hash> --wordlist synth_rockyou.txt", "error");
        const entry = crackFromDump(hash);
        api.print({ text: `[*] Loading ${wordlist} (${SYNTH_WORDLIST.length}k entries sampled)... attacking at ~100k h/s`, kind: "system" });
        SYNTH_WORDLIST.forEach((w, i) => {
          const match = entry && entry.plaintext === w;
          api.printAfter(160 * (i + 1), {
            text: `  [${String(i + 1).padStart(2, "0")}] ${w.padEnd(10)} -> ${match ? "MATCH!" : "no match"}`,
            kind: match ? "success" : "dim",
          });
        });
        const end = 160 * (SYNTH_WORDLIST.length + 1);
        if (entry) {
          api.printAfter(end, [
            { text: `[✓] CRACKED: ${entry.user} = "${entry.plaintext}"`, kind: "success" },
            { text: "[+] SSH credentials recovered. Subnet Gamma (Bastion Core) is reachable.", kind: "success" },
            { text: "[*] Checkpoint: modern systems use bcrypt/Argon2 + a unique random salt per user —", kind: "system" },
            { text: "    that defeats rainbow tables and makes each guess expensive. MD5 does neither.", kind: "system" },
          ]);
          setTimeout(() => {
            api.complete("crack");
            api.addScore(60);
            // WARDEN escalates again — left unremarked for an attentive player.
            api.warden(0.34, "ALERT_QUEUED");
          }, end + 50);
        } else {
          api.printAfter(end, { text: "[!] No match in this wordlist. Try the admin_root hash.", kind: "warn" });
        }
      },
    },
  },
};

export const act2Crypto: Episode[] = [episode04, episode05, episode06];
