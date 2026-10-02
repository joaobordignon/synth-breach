import type { Episode, Line } from "../../engine/types";
import { SUBNET_ALPHA, GATEWAY_IP, GATEWAY_PORTS } from "../../engine/simulator";

// Act I: Network 101 (Subnet Alpha: Edge Perimeter) — Episodes 1-3.
// docs/SPEC.md §11. WARDEN anomaly climbs 0.02 -> 0.07 across the Act,
// barely noticing the player (the through-line that pays off in Act III).

const COOKIE_B64 = "VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA==";

// ---------------------------------------------------------------------------
export const episode01: Episode = {
  id: 1,
  act: 1,
  title: "The Gateway Knock",
  subnet: "SUBNET ALPHA — EDGE PERIMETER",
  concepts: ["IPv4 addressing (32 bits, 4 octets)", "CIDR /24 masks", "ICMP echo request/reply", "TTL & RTT"],
  briefing: "HEX: Hardware can't hide from an ICMP pulse. Sweep the subnet, then ping the gateway.",
  codexTopic: "networking",
  intro: [
    "[COMMS // HEX]: Channel's live. Same rule as always, Decker — this shard's ours to test,",
    "cleared and air-gapped. Nothing you learn here gets pointed at something you don't own. Clear?",
    "[COMMS // HEX]: Good. Aether severed standard DNS, thinks their perimeter's invisible. Cute.",
    "[COMMS // HEX]: Your subnet is 10.42.0.0/24. The /24 means the first 3 octets — 24 bits —",
    "belong to Aether. The last 8 bits are 254 possible hosts behind one gateway.",
    "[COMMS // HEX]: Send a pulse across the wire. `netmap 10.42.0.0/24`, then `ping` the gateway.",
  ],
  objectives: [
    { id: "sweep", label: "Map your /24 subnet and spot the live gateway" },
    { id: "ping", label: "Measure latency to the gateway with ICMP" },
    { id: "save", label: "Bank your progress with `save` — carry the run anywhere" },
  ],
  hints: [
    "A /24 CIDR sweep probes every host in 10.42.0.0 – 10.42.0.255 with ICMP/ARP. Active hosts " +
      "answer; filtered ones stay silent. `ping` then measures round-trip time and reads the TTL. " +
      "And `save` writes your whole run to a file you keep.",
    "Run `netmap 10.42.0.0/24` to map the subnet, `ping 10.42.0.1` to knock on the gateway, then " +
      "`save` to bank your progress.",
    "Three steps: sweep your assigned subnet with netmap (CIDR form — the 10.42.0.0 network, /24 " +
      "prefix). The sweep marks the active ROUTER GATEWAY; ping that exact host to read its TTL and " +
      "RTT. Then run `save` — it downloads a .synthsave file of your run that you can `load` (or " +
      "LOAD GAME on the boot screen) to continue later, anywhere.",
  ],
  outro: [
    "[COMMS // HEX]: Gateway's real, and it's breathing — and your run's banked. That's your first",
    "foothold, and a save you can walk away from.",
    "[COMMS // HEX]: Get some rest, Decker — tomorrow we go looking for a door. Type `next`.",
  ],
  beats: [
    {
      trigger: "objective:ping",
      prompt: "Gateway's logged. Before we push on — one habit that keeps a run alive: bank it.",
      replies: [
        {
          text: "How do I save?",
          tone: "warm",
          response: [
            "Type `save`. It drops a .synthsave file on your machine — your whole run, portable. Next time, " +
              "`load` it in-shell or hit LOAD GAME on the boot screen and you pick up right here. Do it now.",
          ],
        },
        {
          text: "Already on it.",
          tone: "mission",
          response: [
            "Good instinct. `save` drops a .synthsave file — your run, portable. `load` or LOAD GAME brings it " +
              "back. Bank it before we move on.",
          ],
        },
      ],
    },
  ],
  commands: {
    netmap: {
      usage: "netmap <cidr>",
      description: "Sweep a subnet for active hosts (ARP/ICMP).",
      help: [
        "Give it a subnet in CIDR form: <network-address>/<prefix>.",
        "Your assigned /24 covers 10.42.0.0 through 10.42.0.255.",
        "Example:  netmap <network>/<prefix>",
      ],
      run: (args, api) => {
        const cidr = args[0];
        if (!cidr) return api.print("[!] Usage: netmap <cidr>, e.g. netmap 10.42.0.0/24", "error");
        if (cidr !== "10.42.0.0/24") return api.print(`[!] No known range matches ${cidr} in this shard.`, "error");
        api.print(`[*] Sweeping ${cidr} — sending ARP/ICMP probes to 254 hosts...`, "system");
        SUBNET_ALPHA.forEach((h, i) => {
          api.printAfter(
            350 * (i + 1),
            {
              text: `  ${h.ip.padEnd(12)} [${h.label} — ${h.detail ?? h.status}]`,
              kind: h.status === "ACTIVE" ? "success" : "warn",
            },
          );
        });
        api.printAfter(350 * (SUBNET_ALPHA.length + 1), [
          { text: "[✓] Sweep complete — 2 active, 1 filtered.", kind: "success" },
        ]);
        api.setTelemetry({ title: "SUBNET ALPHA MAP", hosts: SUBNET_ALPHA });
        // WARDEN barely notices (Act I): a single muted log line, no HEX comment.
        api.printAfter(350 * (SUBNET_ALPHA.length + 2), {
          text: "[SYS-LOG // AETHER-EDGE] anomaly_score=0.02 source=10.42.0.99 action=NONE",
          kind: "dim",
        });
        api.setVar("wardenBaseline", 0.02);
        api.complete("sweep");
        api.addScore(25);
      },
    },
    ping: {
      usage: "ping <ip>",
      description: "Send ICMP echo requests to a host.",
      help: [
        "Reports TTL (OS/hop hint) and round-trip time for one host.",
        "Point it at the active gateway you just found on the map.",
        "Example:  ping <ip-address>",
      ],
      run: (args, api) => {
        const ip = args[0];
        if (!ip) return api.print("[!] Usage: ping <ip>", "error");
        const host = SUBNET_ALPHA.find((h) => h.ip === ip);
        if (!host || host.status !== "ACTIVE") {
          api.print([`Request timeout for icmp_seq 1`, `(no reply from ${ip})`], "warn");
          return;
        }
        const times = [3.82, 4.11, 3.77, 4.02];
        times.forEach((t, i) =>
          api.printAfter(300 * (i + 1), `64 bytes from ${ip}: icmp_seq=${i + 1} ttl=64 time=${t.toFixed(2)} ms`),
        );
        api.printAfter(300 * (times.length + 1), [
          { text: `--- ${ip} ping statistics ---`, kind: "dim" },
          { text: `4 packets transmitted, 4 received, 0% loss, rtt avg ≈ 3.93 ms`, kind: "normal" },
        ]);
        if (ip === GATEWAY_IP) {
          api.printAfter(300 * (times.length + 2), [
            {
              text: "[COMMS // HEX]: ttl=64 — that's a Linux-family stack answering (Windows starts at 128).",
              kind: "hex",
            },
            {
              text: "[COMMS // HEX]: Sub-4ms RTT means it's one hop away. That's your gateway. Door's next.",
              kind: "hex",
            },
          ]);
          api.complete("ping");
          api.addScore(25);
        }
      },
    },
  },
};

// ---------------------------------------------------------------------------
export const episode02: Episode = {
  id: 2,
  act: 1,
  title: "The Three-Way Handshake",
  subnet: "SUBNET ALPHA — EDGE PERIMETER",
  concepts: ["TCP vs UDP", "3-way handshake (SYN/SYN-ACK/ACK)", "flags: SYN/ACK/RST/FIN", "open vs closed vs filtered"],
  briefing: "HEX: Every service answers one of three ways — open, slammed shut, or silently dropped. Scan and watch the flags.",
  codexTopic: "networking",
  intro: [
    "[COMMS // HEX]: Good work on the gateway. Now we need an entry point.",
    "[COMMS // HEX]: Every service listens on a TCP/UDP port with three possible answers: wide open,",
    "slammed shut, or silently dropped like it never heard you. Firewalls love that last one.",
    "[COMMS // HEX]: Run a packet capture while you scan. A server reveals its soul in the handshake —",
    "SYN, SYN-ACK, ACK, every time, unless something's actively lying to you.",
    "[COMMS // HEX]: `portscan --inspect 10.42.0.1`. Then tell me which port is hiding: `answer <port>`.",
  ],
  objectives: [
    { id: "scan", label: "Capture the TCP handshake against the gateway" },
    { id: "answer", label: "Identify which port is stealth-filtered" },
  ],
  hints: [
    "A port replying [SYN, ACK] completed two of three handshake steps — it's OPEN. [RST, ACK] means " +
      "CLOSED. No response at all is FILTERED: a firewall silently dropped the packet.",
    "Run `portscan --inspect 10.42.0.1` and read the FLAGS column. Then `answer` with the port that " +
      "returned NO RESPONSE.",
    "Capture the handshake with portscan's --inspect flag against the gateway (10.42.0.1). Read the " +
      "FLAGS column: 22 and 80 reply [SYN,ACK] (open); one port returns NO RESPONSE — that's the " +
      "stealth-filtered one. `answer` with that port's number.",
  ],
  outro: [
    "[COMMS // HEX]: 8088 didn't even bother with a RST — it just went dark. That's not a closed port,",
    "Decker, that's a port that only talks to people who already know the secret handshake.",
    "[COMMS // HEX]: Corporate infrastructure doesn't hide what it isn't ashamed of. Type `next`.",
  ],
  commands: {
    portscan: {
      usage: "portscan --inspect <ip>",
      description: "SYN-scan a host and render the captured packet handshake table.",
      help: [
        "Pass --inspect <ip> to render the captured packet table.",
        "Read the FLAGS column: [SYN,ACK] = open, [RST,ACK] = closed,",
        "NO RESPONSE = silently filtered (a firewall dropped it).",
        "Example:  portscan --inspect <ip>",
      ],
      run: (args, api) => {
        if (!args.includes("--inspect") || !args.includes(GATEWAY_IP)) {
          return api.print(`[!] Usage: portscan --inspect ${GATEWAY_IP}`, "error");
        }
        api.print("[*] Sending SYN probes to 10.42.0.1, capturing responses...", "system");
        const header =
          "┌────┬──────┬─────────┬─────────────────┬──────────┬──────────────────┐";
        const cols = "│ #  │ PORT │ SERVICE │ FLAGS           │ WIN SIZE │ INTERPRET        │";
        const sep = "├────┼──────┼─────────┼─────────────────┼──────────┼──────────────────┤";
        const footer = "└────┴──────┴─────────┴─────────────────┴──────────┴──────────────────┘";
        const rows: Line[] = GATEWAY_PORTS.map((p, i) => ({
          text:
            `│ ${String(i + 1).padStart(2, "0")} │ ${String(p.port).padEnd(4)} │ ${p.service.padEnd(7)} │ ` +
            `${p.flags.padEnd(15)} │ ${p.win.padEnd(8)} │ ${p.interpret.padEnd(16)} │`,
          kind: p.interpret.includes("OPEN")
            ? "success"
            : p.interpret.includes("FILTERED")
              ? "warden"
              : "dim",
        }));
        api.print([
          { text: header, kind: "normal" },
          { text: cols, kind: "banner" },
          { text: sep, kind: "normal" },
          ...rows,
          { text: footer, kind: "normal" },
        ]);
        api.setTelemetry({
          title: "PACKET CAPTURE — 10.42.0.1",
          hosts: [{ ip: GATEWAY_IP, label: "GATEWAY", status: "OPEN", detail: "22,80 open · 8088 stealth" }],
          block: GATEWAY_PORTS.map((p) => `${p.port}/${p.service}  ${p.interpret}`),
        });
        api.print("[COMMS // HEX]: 22 and 80, standard. But look at 8088. Which one's hiding?", "hex");
        api.complete("scan");
        api.addScore(30);
      },
    },
    answer: {
      usage: "answer <port>",
      description: "Answer HEX's field question (which port is filtered).",
      help: ["Submit the port number you judge to be stealth-filtered.  Example:  answer <port>"],
      run: (args, api) => {
        if (!api.isComplete("scan")) return api.print("[!] Run the portscan first.", "warn");
        if (args[0] === "8088") {
          api.print("[✓] Correct — 8088 is stealth-filtered, deliberately hidden behind a packet rule.", "success");
          api.complete("answer");
          api.addScore(30);
        } else {
          api.print(`[!] ${args[0] || "(nothing)"} isn't it. Re-read the FLAGS column — look for NO RESPONSE.`, "error");
        }
      },
    },
  },
};

// ---------------------------------------------------------------------------
export const episode03: Episode = {
  id: 3,
  act: 1,
  title: "The Ghost Service",
  subnet: "SUBNET ALPHA — EDGE PERIMETER",
  concepts: ["OSI L7 vs L4", "service banners / version disclosure", "cleartext (HTTP/Telnet) vs encrypted (TLS/SSH)"],
  briefing: "HEX: Legacy servers blab their versions and send secrets in cleartext. Grab the banner.",
  codexTopic: "networking",
  intro: [
    "[COMMS // HEX]: We know port 80 is listening. Look past the door — at what's leaking through.",
    "[COMMS // HEX]: Legacy servers from the 80s love talking too much. They blab exact versions in",
    "every header and broadcast their payload in clear, unencrypted ASCII. No lock, no envelope —",
    "just a postcard anyone can read in transit.",
    "[COMMS // HEX]: `banner-grab --target 10.42.0.1 --port 80`. Then `inspect --protocol http`.",
  ],
  objectives: [
    { id: "banner", label: "Grab the service banner on the web port" },
    { id: "inspect", label: "Classify the transport as cleartext or encrypted" },
  ],
  hints: [
    "A Server: header hands an attacker the exact daemon + version to look up CVEs against. And a " +
      "Set-Cookie flying over plain HTTP (not HTTPS/TLS) is readable by anyone sniffing the wire.",
    "Run `banner-grab --target 10.42.0.1 --port 80`, then `inspect --protocol http` to classify it.",
    "Grab the banner on the gateway's web port (the well-known HTTP port, 80) with banner-grab's " +
      "--target and --port flags. Then classify the transport with inspect (its --protocol is http) — " +
      "note the cleartext X-Transmission-Mode header and the session cookie (ends in ==) leaking with no TLS.",
  ],
  outro: [
    "[COMMS // HEX]: Score's ticking up — still background noise to whatever's watching, but it's",
    "counting. Keep that in the back of your head.",
    "[COMMS // HEX]: That cookie value ending in `==`? That's not encryption — it's Base64, dressed",
    "up to look important. Decode it and we're past the edge. Subnet Beta's next: the Crypto Vault.",
    "[COMMS // HEX]: That's where they actually try to hide things properly. Type `next`.",
  ],
  beats: [
    {
      trigger: "objective:inspect",
      prompt: "Edge perimeter's wide open and barely noticed us. Easy, so far. ...It won't stay easy.",
      replies: [
        {
          text: "What's actually behind all this, HEX?",
          tone: "warm",
          response: [
            "A machine that decided ECHO was a threat, and a company that called that a feature. We're going " +
              "to read it its own rights — one subnet at a time.",
          ],
        },
        {
          text: "Bring on the Crypto Vault.",
          tone: "mission",
          response: ["That's the spirit. Real ciphers in there, not Base64 in a trenchcoat. Type `next`."],
        },
      ],
    },
  ],
  commands: {
    "banner-grab": {
      usage: "banner-grab --target <ip> --port <port>",
      description: "Probe a socket and dump the service's response banner.",
      help: [
        "Opens a socket and prints the service's response headers.",
        "Target the gateway's open web port (the well-known HTTP port is 80).",
        "Example:  banner-grab --target <ip> --port <port>",
      ],
      run: (args, api) => {
        const target = argVal(args, "--target");
        const port = argVal(args, "--port");
        if (target !== GATEWAY_IP || port !== "80") {
          return api.print("[!] Usage: banner-grab --target 10.42.0.1 --port 80", "error");
        }
        api.print(
          [
            { text: "[CONNECT] 10.42.0.1:80 (TCP) ... ESTABLISHED", kind: "system" },
            { text: "<<< HTTP/1.0 200 OK", kind: "normal" },
            { text: "<<< Server: Aether-HyperLink/1.8.4 (OS: SynthOS-x86)", kind: "warn" },
            { text: "<<< X-Transmission-Mode: CLEARTEXT_LEGACY", kind: "warn" },
            { text: `<<< Set-Cookie: AETHER_SESSION=${COOKIE_B64}`, kind: "success" },
          ],
        );
        api.setTelemetry({
          title: "BANNER — 10.42.0.1:80",
          hosts: [{ ip: GATEWAY_IP, label: "Aether-HyperLink/1.8.4", status: "OPEN", detail: "cleartext legacy" }],
          block: ["Server leaks version → CVE targeting", "Session cookie sent in cleartext", `cookie: ${COOKIE_B64}`],
        });
        // WARDEN ticks up, and this time HEX notices.
        api.warden(0.07, "LOG_ONLY");
        api.setVar("sessionCookie", COOKIE_B64);
        api.complete("banner");
        api.addScore(30);
      },
    },
    inspect: {
      usage: "inspect --protocol http",
      description: "Classify a transport as cleartext or encrypted.",
      run: (args, api) => {
        if (argVal(args, "--protocol") !== "http") {
          return api.print("[!] Usage: inspect --protocol http", "error");
        }
        if (!api.isComplete("banner")) return api.print("[!] Grab the banner first.", "warn");
        api.print([
          { text: "[*] Protocol: HTTP/1.0 — Application layer (OSI L7) over TCP (L4).", kind: "system" },
          { text: "[!] CLEARTEXT: no TLS. Headers, cookies, and bodies travel readable on the wire.", kind: "warn" },
          { text: "    Compare: HTTPS/SSH/TLS wrap the same payload in encryption. This doesn't.", kind: "dim" },
        ]);
        api.complete("inspect");
        api.addScore(20);
      },
    },
  },
};

function argVal(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

export const act1Network: Episode[] = [episode01, episode02, episode03];
