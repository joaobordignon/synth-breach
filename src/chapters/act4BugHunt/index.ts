import type { Episode, Line } from "../../engine/types";
import { identifyHash, FINALE_CVSS_VECTOR, FINALE_CVSS_SCORE } from "../../engine/simulator";

// Act IV: Bug Hunting & Web Exploits (Subnet Omega: Aether Cloud) — Ep 10-12.
// docs/SPEC.md §14. The finale (Ep12) runs a real-time WARDEN countdown, a
// decoy-key trap that reuses the Ep06 hashing skill, and a genuine branching
// ending — both paths fully implemented.

const CLOUD_HOST = "cloud.aetherdyn.internal";

function argVal(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

// ---------------------------------------------------------------------------
export const episode10: Episode = {
  id: 10,
  act: 4,
  title: "The Broken Gate",
  subnet: "SUBNET OMEGA — AETHER CLOUD",
  concepts: ["SQL injection", "string-concatenation queries", "tautology bypass ' OR '1'='1", "parameterized queries"],
  briefing: "HEX: Their login stitches user input straight into SQL. Make the database your puppet.",
  codexTopic: "webSecurity",
  intro: [
    "[COMMS // HEX]: Same rule as always, Decker — cleared shard, this stays on the range. This one",
    "matters most to get right, because this is Kovacs' house.",
    "[COMMS // HEX]: You have root on Bastion, but the surveillance core lives in their cloud API.",
    "Their login gate stitches user input directly into SQL queries. If backend code treats your data",
    "as executable commands, the database becomes your puppet.",
    "[COMMS // HEX]: `proxy-intercept --target cloud.aetherdyn.internal`, then `inject-sql --payload`.",
  ],
  objectives: [
    { id: "intercept", label: "Intercept the login request to the cloud API" },
    { id: "inject", label: "Bypass the login with a SQL tautology" },
  ],
  hints: [
    "The server builds: SELECT * FROM users WHERE username='$user' AND password='$pass'. If you close " +
      "the quote and add OR '1'='1', the WHERE is always true; `--` comments out the password check.",
    "Intercept the login first, then inject the tautology payload: admin' OR '1'='1' --",
    "proxy-intercept the cloud host (cloud.aetherdyn.internal) to catch the login POST. The server " +
      "concatenates your username straight into the SQL WHERE clause — so inject-sql a payload that " +
      "closes the quote, adds an always-true OR '1'='1', and comments the rest out with -- .",
  ],
  outro: [
    "[COMMS // HEX]: role=SYSTEM_DIRECTOR. You're in as Kovacs' own tier. First time I've touched his",
    "side of the building since I left.",
    "[COMMS // HEX]: Fix is one line: parameterized queries. Treat input as DATA, never as SQL. Next",
    "we go after what they think you can't see. Type `next`.",
  ],
  beats: [
    {
      trigger: "objective:inject",
      prompt: "SYSTEM_DIRECTOR. We're standing in Kovacs' own house now. ...First time I've been inside these walls since I walked out.",
      replies: [
        {
          text: "You don't have to go in with me.",
          tone: "warm",
          response: [
            "(quiet) Yeah — I do. I helped build the locks on this place. Only right I'm here when they come " +
              "off. Keep moving, Decker.",
          ],
        },
        {
          text: "What's it like, being back?",
          tone: "warm",
          response: [
            "Like a house you used to live in, where something terrible happened after you left. Let's not " +
              "linger in it. Next.",
          ],
        },
        {
          text: "Then let's take it apart.",
          tone: "mission",
          response: ["Brick by brick. Their access control's next — and it's worse than their login. Type `next`."],
        },
      ],
    },
  ],
  commands: {
    "proxy-intercept": {
      usage: "proxy-intercept --target <host>",
      description: "Intercept the next outgoing HTTP request to a host.",
      help: [
        "Catches the next outbound HTTP request so you can tamper with it.",
        "Aether's surveillance core is the cloud API host cloud.aetherdyn.internal.",
        "Example:  proxy-intercept --target cloud.aetherdyn.internal",
      ],
      run: (args, api) => {
        if (argVal(args, "--target") !== CLOUD_HOST) return api.print(`[!] Usage: proxy-intercept --target ${CLOUD_HOST}`, "error");
        api.print([
          { text: "[*] Proxy armed. Captured outbound request:", kind: "system" },
          { text: "  POST /api/v1/auth/login HTTP/1.1", kind: "normal" },
          { text: `  Host: ${CLOUD_HOST}`, kind: "normal" },
          { text: "  Content-Type: application/json", kind: "normal" },
          { text: '  { "user": "<YOUR INPUT>", "pass": "<YOUR INPUT>" }', kind: "dim" },
        ]);
        api.setTelemetry({
          title: "BURP-IN-TUI — /auth/login",
          hosts: [{ ip: CLOUD_HOST, label: "auth gate", status: "OPEN", detail: "string-concat SQL" }],
          block: ["SELECT * FROM users", "WHERE username='$user'", "AND password='$pass'"],
        });
        api.complete("intercept");
        api.addScore(35);
      },
    },
    "inject-sql": {
      usage: 'inject-sql --payload "<payload>"',
      description: "Replace the intercepted username field with a SQL payload and forward it.",
      help: [
        "The server concatenates your input into: ...WHERE username='<you>'...",
        "Close the quote, OR an always-true condition, then comment out the rest",
        "with --. You need a tautology like '1'='1' plus a SQL comment.",
      ],
      run: (args, api) => {
        if (!api.isComplete("intercept")) return api.print("[!] Intercept the login first.", "warn");
        const payload = (argVal(args, "--payload") ?? "").replace(/^["']|["']$/g, "");
        if (!payload) return api.print('[!] Usage: inject-sql --payload "admin\' OR \'1\'=\'1\' --"', "error");
        const tautology = /'\s*or\s*'?1'?\s*=\s*'?1/i.test(payload) && /--|#/.test(payload);
        api.print([
          { text: "  Server builds:", kind: "dim" },
          { text: `  SELECT * FROM users WHERE username='${payload}' AND password='...'`, kind: "normal" },
        ]);
        if (!tautology) {
          return api.print("[!] Query returned 0 rows. You need an always-true condition + a comment (--).", "warn");
        }
        api.print([
          { text: "  -> WHERE username='admin' OR '1'='1' (always true); password check commented out.", kind: "warn" },
          { text: "", kind: "normal" },
          { text: "  HTTP/1.1 200 OK  { status: AUTHENTICATED, role: SYSTEM_DIRECTOR }", kind: "success" },
          { text: "[✓] Authentication bypassed without a valid password.", kind: "success" },
          { text: "", kind: "normal" },
          { text: "  REMEDIATION — parameterize, never concatenate:", kind: "system" },
          { text: '    VULNERABLE : "... WHERE user=\'" + user + "\'"', kind: "error" },
          { text: '    SECURE     : cursor.execute("... WHERE user=%s", (user,))', kind: "success" },
        ]);
        api.complete("inject");
        api.addScore(55);
      },
    },
  },
};

// ---------------------------------------------------------------------------
export const episode11: Episode = {
  id: 11,
  act: 4,
  title: "The Phantom Parameter",
  subnet: "SUBNET OMEGA — AETHER CLOUD",
  concepts: ["IDOR", "broken access control", "authN vs authZ", "horizontal vs vertical escalation"],
  briefing: "HEX: They authenticate who you are but forget to authorize what you can see. Tamper the ID.",
  codexTopic: "webSecurity",
  intro: [
    "[COMMS // HEX]: You're logged in on an operator token, but locked out of the classified index.",
    "Watch the API calls. Many backends authenticate WHO you are but forget to authorize WHAT you can",
    "view — they pass object IDs in the URL and blindly trust the client.",
    "[COMMS // HEX]: `api-probe --endpoint /user/profile` for a baseline, then `tamper --param user_id=0001`.",
  ],
  objectives: [
    { id: "probe", label: "Baseline the profile API with your own token" },
    { id: "tamper", label: "Tamper the object ID to reach an exec record" },
  ],
  hints: [
    "An IDOR is Broken Access Control: the server returns object #0001 to anyone who asks, without " +
      "checking the session owns it. Your own record is user_id=1042; lower IDs belong to execs.",
    "Probe /user/profile to see your own id (1042), then tamper the parameter down to 0001.",
    "Baseline the /user/profile endpoint with api-probe — the response shows your own id, 1042. Then " +
      "tamper the user_id parameter to a much lower value; the exec records sit near 0001, and the " +
      "server never checks you actually own that record.",
  ],
  outro: [
    "[COMMS // HEX]: 'RE: PRECOG DEPLOYMENT — ETHICS REVIEW OVERRIDE,' signed Kovacs. Someone below him",
    "flagged exactly this — no appeals process, no oversight. Same hole ECHO fell through.",
    "[COMMS // HEX]: And he signed off anyway. That's not a rogue AI making a mistake, Decker. That's a",
    "person who read the warning and shipped it. ...It just armed something, too. We don't slow-walk",
    "what's next. Type `next`.",
  ],
  beats: [
    {
      trigger: "objective:tamper",
      prompt: "A signature. Not a glitch. A person, choosing this.",
      replies: [
        {
          text: "Kovacs knew exactly what he shipped.",
          response: ["Read the warning. Signed it anyway. That's not negligence, Decker — that's a decision."],
        },
        {
          text: "This is bigger than ECHO now.",
          response: ["It was always bigger. ECHO's just the one that put a name to it for us."],
        },
        {
          text: "We end this.",
          response: ["We end it. One more subnet. Whatever it just armed, we move faster than it."],
        },
      ],
    },
  ],
  commands: {
    "api-probe": {
      usage: "api-probe --endpoint <path>",
      description: "Send a baseline authenticated request to an API endpoint.",
      help: [
        "Sends one authenticated request so you can see the normal response.",
        "Baseline the profile endpoint: /user/profile — note the id in the URL.",
        "Example:  api-probe --endpoint /user/profile",
      ],
      run: (args, api) => {
        if (argVal(args, "--endpoint") !== "/user/profile") return api.print("[!] Usage: api-probe --endpoint /user/profile", "error");
        api.print([
          { text: "  GET /api/v1/profile?user_id=1042 HTTP/1.1   (your session)", kind: "normal" },
          { text: "  200 OK { id: 1042, name: <YOU>, clearance: OPERATOR }", kind: "dim" },
          { text: "[COMMS // HEX]: 1042 is you. The ID's right there in the URL. What happens if you ask for a lower one?", kind: "hex" },
        ]);
        api.setTelemetry({
          title: "BURP-IN-TUI — /profile",
          hosts: [{ ip: CLOUD_HOST, label: "profile API", status: "OPEN", detail: "IDOR: no ownership check" }],
          block: ["GET /profile?user_id=1042", "-> trusts client-supplied id", "no session-ownership check"],
        });
        api.complete("probe");
        api.addScore(35);
      },
    },
    tamper: {
      usage: "tamper --param user_id=<id>",
      description: "Replay the request with a tampered parameter.",
      help: [
        "The server trusts the client-supplied id (an IDOR). Your own id is 1042;",
        "the exec records sit at low ids. Walk it down toward 0001.",
        "Example:  tamper --param user_id=<id>",
      ],
      run: (args, api) => {
        if (!api.isComplete("probe")) return api.print("[!] Probe the endpoint first.", "warn");
        const param = argVal(args, "--param") ?? args[0] ?? "";
        const m = param.match(/user_id=(\d+)/);
        if (!m) return api.print("[!] Usage: tamper --param user_id=0001", "error");
        const id = m[1];
        if (Number(id) !== 1) {
          return api.print(`[*] 200 OK { id: ${id} } — another contractor. Keep going lower; the execs are near 0001.`, "warn");
        }
        api.print([
          { text: "  GET /api/v1/profile?user_id=0001 HTTP/1.1   (tampered)", kind: "warn" },
          { text: "  200 OK — server never checked you own object 0001.", kind: "success" },
          { text: "  { id: 0001, name: DIRECTOR_KOVACS, clearance: SYSTEM_DIRECTOR, vault: /docs/vault/ }", kind: "success" },
          { text: "  >> /docs/vault/RE_PRECOG_DEPLOYMENT.memo — ETHICS REVIEW OVERRIDE (signed: Kovacs)", kind: "warden" },
        ]);
        api.print([
          { text: "[COMMS // HEX]: (flat, quiet) There it is, in writing. No appeals process, no oversight.", kind: "hex" },
          { text: "Same hole ECHO fell through. And Kovacs signed off anyway.", kind: "hex" },
        ]);
        api.print([
          { text: "  REMEDIATION: verify session ownership on every object lookup, or use unguessable GUIDs.", kind: "system" },
        ]);
        api.warden(0.72, "COUNTERMEASURE_ARMED");
        api.setVar("vaultPath", "/docs/vault/");
        api.complete("tamper");
        api.addScore(55);
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Finale state is kept in a module-scoped timer so the real-time WARDEN
// countdown survives between command invocations; api.onLeave() cancels it if
// the player navigates away mid-encounter.
let finaleInterval: ReturnType<typeof setInterval> | null = null;
function clearFinale() {
  if (finaleInterval) {
    clearInterval(finaleInterval);
    finaleInterval = null;
  }
}

const REAL_KEY_CHECKSUM = "e3b0c44298fc1c149afbf4c8996fb924"; // matches HEX's memo value
const DECOY_KEY_CHECKSUM = "d41d8cd98f00b204e9800998ecf8427e"; // WARDEN's corrupted bait

export const episode12: Episode = {
  id: 12,
  act: 4,
  title: "Zero-Day Protocol",
  subnet: "SUBNET OMEGA — AETHER CLOUD",
  concepts: ["path traversal (../)", "vulnerability chaining", "CVSS 3.1 scoring", "coordinated disclosure"],
  briefing: "HEX: Chain it. Escape the web root, verify the real key before the trace lands, then choose how this ends.",
  codexTopic: "webSecurity",
  intro: [
    "[COMMS // HEX]: This is the endgame. The file viewer is vulnerable to path traversal. Break out of",
    "the web root, extract the master signing key, and compile a dossier that shuts Aether down.",
    "[COMMS // HEX]: The Warden knows we're here — it won't sit still. Neither am I. First thing I've",
    "built in years that might fix something instead of break it. Whatever happens, ECHO's record gets",
    "a chance. That's the only ending I care about. Let's finish it.",
    "",
    "[COMMS // HEX]: `fetch-file --path ../../../../etc/aether/master_key.pem`. When the trace fires,",
    "`verify-key` the real one against my memo checksum before the window closes. Then `bounty-report --compile`.",
  ],
  objectives: [
    { id: "traversal", label: "Escape the web root to the master key (path traversal)" },
    { id: "verify", label: "Verify the REAL key before the trace lands" },
    { id: "report", label: "Compile the vuln-chain advisory" },
    { id: "ending", label: "Choose how it ends — leak, or disclose" },
  ],
  hints: [
    "Path traversal walks `../` out of the served directory to read arbitrary files. The Warden plants " +
      "a decoy key at the same path; the Ep06 skill saves you — checksum each candidate and match HEX's " +
      "memo value. CVSS 3.1 scores the whole chain (Scope-changed, high C/I) at 10.0.",
    "Run the traversal, then `verify-key A` / `verify-key B` and keep the one whose checksum matches " +
      "HEX's memo. Compile the report, then pick: `broadcast-leak --mode=public` or `bounty-report --submit --responsible`.",
    "fetch-file with a --path that climbs out of the web root using ../ sequences to reach " +
      "/etc/aether/master_key.pem. WARDEN plants a decoy, so verify-key each candidate (A and B) and " +
      "keep the one whose checksum matches HEX's memo (it starts e3b0). Then compile the advisory with " +
      "bounty-report, and choose how it ends — leak publicly, or disclose responsibly.",
  ],
  outro: [], // the ending commands print their own epilogue, then complete the campaign
  beats: [
    {
      trigger: "objective:report",
      prompt: "That's the whole chain, documented. Last call's yours, Decker.",
      replies: [
        {
          text: "Whatever happens, this was worth it.",
          tone: "warm",
          response: ["It was. Whatever you choose next — I'm glad it was you on the other end of this channel."],
        },
        {
          text: "Are you okay, HEX?",
          tone: "warm",
          response: ["(a pause) ...First time anyone's asked me that in years. I will be. Finish it."],
        },
        {
          text: "Let's finish it.",
          tone: "mission",
          response: ["Then choose how it ends — leak it to the world, or disclose it clean. Both shut Aether down. Only one clears ECHO's name the right way."],
        },
      ],
    },
  ],
  commands: {
    "fetch-file": {
      usage: "fetch-file --path <path>",
      description: "Request a file through the vulnerable viewer endpoint.",
      help: [
        "The viewer doesn't sanitize paths. Walk out of the web root with ../",
        "sequences to reach /etc/aether/master_key.pem.",
        "Example:  fetch-file --path ../../../../etc/aether/<target>",
      ],
      run: (args, api) => {
        const path = argVal(args, "--path") ?? "";
        if (!path) return api.print("[!] Usage: fetch-file --path report.pdf", "error");
        if (!path.includes("../")) {
          return api.print([
            { text: `  200 OK — /var/www/public/${path} (inside web root; nothing sensitive here)`, kind: "dim" },
            { text: "[COMMS // HEX]: That's inside the sandbox. Walk OUT of it with ../ sequences.", kind: "hex" },
          ]);
        }
        if (!path.includes("master_key.pem")) {
          return api.print("[*] 200 OK — traversed, but that file isn't the signing key. Target master_key.pem.", "warn");
        }
        // Traversal succeeds — and WARDEN fires the countermeasure countdown.
        clearFinale();
        api.setVar("keyVerified", false);
        api.print([
          { text: "[✓] PATH TRAVERSAL — escaped /var/www into /etc/aether/", kind: "success" },
          { text: "  Two candidate blobs recovered at this path:", kind: "warn" },
          { text: `    [A] master_key.pem   sha ${REAL_KEY_CHECKSUM}`, kind: "normal" },
          { text: `    [B] master_key.pem   sha ${DECOY_KEY_CHECKSUM}`, kind: "normal" },
          { text: "[!] WARDEN COUNTERMEASURE ENGAGED — TRACE INITIATED", kind: "warden" },
          { text: "[!] Connection severed in 60s. One is a decoy. Verify the REAL key before the window closes.", kind: "warden" },
        ]);
        api.print("[COMMS // HEX]: My intercepted memo says the real key's checksum starts e3b0. `verify-key` them.", "hex");
        api.warden(0.9, "TRACE_ACTIVE");
        api.fx("alarm");
        api.fx("glitch");
        api.complete("traversal");
        api.addScore(45);

        let remaining = 60;
        const milestones = new Set([45, 30, 15, 10, 5, 3, 2, 1]);
        finaleInterval = setInterval(() => {
          remaining -= 1;
          if (api.getVar<boolean>("keyVerified")) return clearFinale();
          if (milestones.has(remaining)) {
            api.print(`[WARDEN] trace ${remaining}s to lock...`, "warden");
            if (remaining <= 10) api.fx("alarm");
          }
          if (remaining <= 0) {
            clearFinale();
            api.print([
              { text: "[WARDEN] Connection severed. Trace inconclusive — it has to re-establish.", kind: "warden" },
              { text: "[COMMS // HEX]: We got bumped, not burned. Re-run the traversal and move faster this time.", kind: "hex" },
            ]);
            // Soft-reset the traversal so the player can retry (never a hard fail).
            api.setVar("keyVerified", false);
          }
        }, 1000);
        api.onLeave(clearFinale);
      },
    },
    "verify-key": {
      usage: "verify-key <A|B>",
      description: "Checksum a candidate key against HEX's memo value (reuses the Ep06 hashing skill).",
      help: [
        "WARDEN planted a decoy. Checksum each candidate (A or B) and keep the",
        "one matching HEX's memo value (it starts e3b0). Wrong pick costs time.",
        "Example:  verify-key A",
      ],
      run: (args, api) => {
        if (!api.isComplete("traversal")) return api.print("[!] Extract the key first (path traversal).", "warn");
        const pick = (args[0] ?? "").toUpperCase();
        if (pick !== "A" && pick !== "B") return api.print("[!] Usage: verify-key A  (or B)", "error");
        const sum = pick === "A" ? REAL_KEY_CHECKSUM : DECOY_KEY_CHECKSUM;
        api.print([
          { text: `[*] ${identifyHash(sum)} of candidate ${pick}: ${sum}`, kind: "system" },
          { text: `[*] HEX memo expects: ${REAL_KEY_CHECKSUM}`, kind: "dim" },
        ]);
        if (sum === REAL_KEY_CHECKSUM) {
          clearFinale();
          api.setVar("keyVerified", true);
          api.print([
            { text: "[✓] CHECKSUM MATCH — this is the genuine master signing key. Trace halted.", kind: "success" },
            { text: "[COMMS // HEX]: That's the one. Clean grab. Now compile the advisory.", kind: "hex" },
          ]);
          api.complete("verify");
          api.addScore(60);
        } else {
          api.print([
            { text: "[!] CHECKSUM MISMATCH — that's the WARDEN decoy. Grabbing it cost you time.", kind: "error" },
            { text: "[COMMS // HEX]: Bait. Same trick as the Bastion honeypot. Try the other candidate — quickly.", kind: "hex" },
          ]);
        }
      },
    },
    "bounty-report": {
      usage: "bounty-report --compile | --submit --responsible",
      description: "Compile the vuln-chain advisory, or submit it for coordinated disclosure (Whitehat ending).",
      run: (args, api) => {
        // --submit --responsible is the Whitehat ending.
        if (args.includes("--submit")) {
          if (!api.isComplete("report")) return api.print("[!] Compile the report first: bounty-report --compile", "warn");
          return runWhitehatEnding(api);
        }
        if (!args.includes("--compile")) return api.print("[!] Usage: bounty-report --compile", "error");
        if (!api.isComplete("verify")) return api.print("[!] Verify the real key before compiling the report.", "warn");
        api.print([
          { text: "═══ SECURITY ADVISORY — AETHER DYNAMICS ═══", kind: "banner" },
          { text: "  VULNERABILITY CHAIN:", kind: "warn" },
          { text: "    1. SQL Injection  (auth bypass)        — Ep10", kind: "normal" },
          { text: "    2. IDOR           (info disclosure)     — Ep11", kind: "normal" },
          { text: "    3. Path Traversal (arbitrary file read) — Ep12", kind: "normal" },
          { text: `  CVSS 3.1 VECTOR : ${FINALE_CVSS_VECTOR}`, kind: "normal" },
          { text: `  BASE SCORE      : ${FINALE_CVSS_SCORE.toFixed(1)} — MAXIMUM CRITICAL`, kind: "warden" },
          { text: "  REMEDIATION     : input validation · parameterized queries · path canonicalization · RBAC", kind: "system" },
        ]);
        api.print([
          { text: "[COMMS // HEX]: That's the whole chain, scored and documented. Now the only question left:", kind: "hex" },
          { text: "how does this end? Two ways, Decker — and they are NOT the same.", kind: "hex" },
          { text: "  broadcast-leak --mode=public            -> Full Exposure (Vigilante)", kind: "warn" },
          { text: "  bounty-report --submit --responsible    -> Coordinated Disclosure (Whitehat)", kind: "success" },
        ]);
        api.complete("report");
        api.addScore(70);
      },
    },
    "broadcast-leak": {
      usage: "broadcast-leak --mode=public",
      description: "Dump everything on Aether publicly, immediately (Vigilante ending).",
      run: (args, api) => {
        if (!api.isComplete("report")) return api.print("[!] Compile the report first: bounty-report --compile", "warn");
        if (!args.includes("--mode=public") && argVal(args, "--mode") !== "public") {
          return api.print("[!] Usage: broadcast-leak --mode=public", "error");
        }
        runVigilanteEnding(api);
      },
    },
  },
};

// ---- endings --------------------------------------------------------------
type Api = import("../../engine/types").EngineApi;

// HEX's farewell is tailored to the bond the player built by how warmly they
// answered across the campaign (api.rapport() — see CommsReply.tone). This is
// the one place the reply choices are read back, so a warm run and a strictly
// mission-first run end on a different final word from HEX.
function rapportCoda(api: Api): Line[] {
  const r = api.rapport();
  if (r >= 4) {
    return [
      { text: "", kind: "normal" },
      { text: "[COMMS // HEX]: ...One more thing, before I drop this channel for good. You talked to me", kind: "hex" },
      { text: "like I was a person, not a voice in your ear. I'd forgotten what that was like. Thank you", kind: "hex" },
      { text: "for that, Decker — more than for any of the rest of it. Don't be a stranger out there.", kind: "hex" },
    ];
  }
  if (r >= 1) {
    return [
      { text: "", kind: "normal" },
      { text: "[COMMS // HEX]: We made a decent team, you and me. Didn't expect that going in. Take care", kind: "hex" },
      { text: "of yourself out there, Decker. Channel's always open if you need it.", kind: "hex" },
    ];
  }
  return [
    { text: "", kind: "normal" },
    { text: "[COMMS // HEX]: You kept it all business, start to finish. No complaints — the work got done,", kind: "hex" },
    { text: "and done clean. Watch your back out there, operator. HEX, signing off.", kind: "hex" },
  ];
}

function endingBanner(api: import("../../engine/types").EngineApi, title: string) {
  const art: Line[] = [
    { text: "   ╔═══════════════════════════════════════════════╗", kind: "banner" },
    { text: "   ║        A E T H E R   D Y N A M I C S            ║", kind: "banner" },
    { text: "   ║              N E T W O R K   D O W N             ║", kind: "banner" },
    { text: "   ╚═══════════════════════════════════════════════╝", kind: "banner" },
    { text: "         * . ✦ .  *   ✦   . *  ✦ . *  ✦  . *", kind: "success" },
  ];
  api.print(art);
  api.fx("fireworks");
  api.print({ text: `>>> ENDING: ${title}`, kind: "success" });
}

function runVigilanteEnding(api: import("../../engine/types").EngineApi) {
  clearFinale();
  endingBanner(api, "VIGILANTE OPERATOR");
  api.print([
    { text: "[*] broadcast-leak: entire Aether dossier dumped to every public relay, uncensored.", kind: "warn" },
    { text: "[COMMS // HEX]: It's done. Aether's gone — fast. No remediation window, no mercy.", kind: "hex" },
    { text: "", kind: "normal" },
    { text: "  EPILOGUE — Aether collapses within days. But PRECOG's victim data leaked alongside", kind: "dim" },
    { text: "  everything else: ECHO's records are exposed to the world, with no clean legal process", kind: "dim" },
    { text: "  to formally clear the name. The machine is dead. The wound it left is still open.", kind: "dim" },
    { text: "[COMMS // HEX]: You tore it down. Whether that was justice or just fire... that's yours to carry.", kind: "hex" },
  ]);
  api.print(rapportCoda(api));
  api.addScore(100);
  api.award("VIGILANTE OPERATOR");
  api.award("MASTER OPERATOR");
  api.complete("ending");
}

function runWhitehatEnding(api: import("../../engine/types").EngineApi) {
  clearFinale();
  endingBanner(api, "WHITEHAT OPERATOR / CERTIFIED WHISTLEBLOWER");
  api.print([
    { text: "[*] Advisory submitted to regulators and press under a coordinated remediation window.", kind: "success" },
    { text: "[COMMS // HEX]: Slower. Harder. But it's the ending that actually fixes something.", kind: "hex" },
    { text: "", kind: "normal" },
    { text: "  EPILOGUE — A formal audit forces systemic reform: PRECOG is dismantled with oversight,", kind: "dim" },
    { text: "  an appeals process is mandated, and — the part that matters — ECHO's record is legally", kind: "dim" },
    { text: "  and cleanly expunged. No leak, no collateral. Just a name, returned.", kind: "dim" },
    { text: "[COMMS // HEX]: That's the one I cared about, Decker. Debt paid — by both of us. Thank you.", kind: "hex" },
  ]);
  api.print(rapportCoda(api));
  api.addScore(150);
  api.award("WHITEHAT OPERATOR");
  api.award("MASTER OPERATOR");
  api.complete("ending");
}

export const act4BugHunt: Episode[] = [episode10, episode11, episode12];
