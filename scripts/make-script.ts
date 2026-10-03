// Generate docs/GAME_SCRIPT.md — a readable "screenplay" of the whole campaign:
// per episode, HEX's real dialogue (intro, per-objective tutor lines, reactions,
// outro), the command the player is expected to run next, that command's in-game
// help, and the episode's tiered intel. Built by actually driving the real store
// headlessly and capturing what HEX says — so the script can never drift from
// the game. Bundled with esbuild + stubs and run under node (see package.json).

import { store, GLOBAL_COMMANDS } from "../src/engine/gameStore";
import "../src/engine/globalCommands";
import { ORDER, EPISODES } from "../src/chapters";
import { SOLUTIONS, GIVE_UP_FLAGS } from "../src/engine/solutions";
import type { CommsEntry, Episode } from "../src/engine/types";
import { writeFileSync } from "node:fs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The full solve path per episode (mirrors the playtest, incl. save + recon).
const PATH: Record<number, string[]> = {
  0: ["help", "codex", "accept-code"],
  1: ["netmap 10.42.0.0/24", "ping 10.42.0.1", "save"],
  2: ["portscan --inspect 10.42.0.1", "answer 8088"],
  3: ["banner-grab --target 10.42.0.1 --port 80", "inspect --protocol http"],
  4: ['decode --base64 "VFlQRS0wNC1PUkVPTi1QUk9UT0NPTA=="', 'hexview --decode "44 49 52 45 43 54 4f 52 5f 4b 4f 56 41 43 53"'],
  5: ['cipher-crack --type caesar --text "WKH SURMHFW LV PRYLQJ WR VXEQHW JDPPD"', 'xor-decrypt --stream "0x12 0x10 0x07 0x01 0x0D 0x05" --key 0x42'],
  6: ["hash-identify 21232f297a57a5a743894a0e4a801fc3", "crack --hash 21232f297a57a5a743894a0e4a801fc3 --wordlist synth_rockyou.txt"],
  7: ["trace --pattern caught-cell-01 --compare hex-contact-log", "cat gamma-recon.cap", "vulnscan --host 10.42.20.10", 'searchsploit "ProFTPD 1.3.3c"'],
  8: ["use exploit/unix/ftp/proftpd_133c_backdoor", "set RHOST 10.42.20.10", "set PAYLOAD cmd/unix/reverse", "exploit"],
  9: ["enumerate", "find / -perm -u=s -type f", "strings /opt/aether/bin/system-backup", "priv-esc --vector path-hijack"],
  10: ["cat /etc/aether/services.conf", "proxy-intercept --target cloud.aetherdyn.internal", `inject-sql --payload "admin' OR '1'='1' --"`],
  11: ["api-probe --endpoint /user/profile", "tamper --param user_id=0001"],
  12: ["fetch-file --path ../../../../etc/aether/master_key.pem", "verify-key A", "bounty-report --compile", "bounty-report --submit --responsible"],
};

// ---- capture --------------------------------------------------------------
let hexBuf: string[] = [];
store.onComms((e: CommsEntry) => {
  if (e.speaker === "you") hexBuf.push(`    YOU> ${e.text}`);
  else hexBuf.push(`    HEX> ${e.text}`);
});
function takeHex(): string[] {
  const out = hexBuf;
  hexBuf = [];
  return out;
}

const ACT = ["Prologue", "Act I — Network", "Act II — Cryptography", "Act III — Penetration Testing", "Act IV — Bug Hunting"];

function cmdName(line: string): string {
  return line.trim().split(/\s+/)[0];
}

function helpBlock(ep: Episode, name: string): string[] {
  const cmd = ep.commands[name] ?? GLOBAL_COMMANDS[name];
  if (!cmd) return [`    (no help on record for \`${name}\`)`];
  const out: string[] = [`    USAGE   ${cmd.usage}`, `            ${cmd.description}`];
  for (const h of cmd.help ?? []) out.push(`            ${h}`);
  return out;
}

function beatsSection(ep: Episode): string[] {
  if (!ep.beats?.length) return [];
  const out: string[] = ["### Dialogue choices (player reply chips)", "```"];
  for (const b of ep.beats) {
    out.push(`  ▸ beat fires on: ${b.trigger}`);
    if (b.prompt) out.push(`  HEX> ${b.prompt}`);
    for (const r of b.replies) {
      out.push(`    • YOU> ${r.text}${r.tone ? `   [${r.tone}]` : ""}`);
      for (const resp of r.response) {
        const t = typeof resp === "string" ? resp : resp.text;
        out.push(`         HEX> ${t}`);
      }
    }
    out.push("");
  }
  out.push("```");
  return out;
}

async function main() {
  const lines: string[] = [];
  const P = (s = "") => lines.push(s);

  P("# SYNTH // BREACH — Game Script");
  P("");
  P("> **Spoiler warning — this is the full campaign screenplay.** It is generated");
  P("> directly from the game (`npm run script`), so HEX's dialogue, the expected");
  P("> commands, their in-game help, and the tiered intel always match what ships.");
  P("> `{handle}` is the player's chosen callsign (default shown).");
  P("");
  P("Legend: **HEX>** HEX speaking · **YOU>** player reply chips · **▶ COMMAND** what");
  P("to type · **HELP** the `<cmd> --help` man page · **INTEL** the tiered hints.");
  P("");
  P("---");
  P("");

  let lastAct = -1;
  for (const id of ORDER) {
    const ep = EPISODES[id];
    if (ep.act !== lastAct) {
      P(`# ${ACT[ep.act]}`);
      P("");
      lastAct = ep.act;
    }
    // Unlock + start.
    if (!store.isUnlocked(id)) store.profile.unlockedEpisodes.push(id);
    store.startEpisode(id);
    if (store.introHeld) store.releaseIntro();
    await sleep(1500);

    P(`## EP${String(id).padStart(2, "0")} — ${ep.title}`);
    if (ep.subnet) P(`*${ep.subnet}*`);
    P("");
    P(`**Concepts:** ${ep.concepts.join(" · ")}`);
    P("");
    P(`**Mission board:** ${ep.briefing}`);
    P("");

    // Intro dialogue (the intro beat's prompt streams through comms already).
    P("### Opening");
    P("```");
    for (const l of takeHex()) P(l);
    P("```");
    P("");

    // Surfaced puzzle inputs.
    if (ep.evidence?.length) {
      P("**On your deck / Evidence Locker:**");
      for (const e of ep.evidence) P(`- ${e.label}: \`${e.value}\``);
      P("");
    }

    // Walk the solve path.
    P("### Walkthrough");
    const path = PATH[id] ?? SOLUTIONS[id] ?? [];
    for (const full of path) {
      const name = cmdName(full);
      P(`**▶ COMMAND:** \`${full}\``);
      P("");
      P("```");
      for (const l of helpBlock(ep, name)) P(l);
      P("```");
      store.submit(full);
      await sleep(2200); // let streamed output + delayed HEX settle
      const said = takeHex();
      if (said.length) {
        P("HEX responds:");
        P("```");
        for (const l of said) P(l);
        P("```");
      }
      P("");
    }

    // Closing (outro may already be captured above; grab any trailing HEX).
    const trailing = takeHex();
    if (trailing.length) {
      P("### Closing");
      P("```");
      for (const l of trailing) P(l);
      P("```");
      P("");
    }

    // Full dialogue-choice trees (player reply chips + HEX's responses).
    for (const l of beatsSection(ep)) P(l);
    if (ep.beats?.length) P("");

    // Tiered intel.
    P("### Intel (tiered hints)");
    P("```");
    P(`  intel    (tier 1 · theory) : ${ep.hints[0]}`);
    P(`  intel 2  (tier 2 · syntax) : ${ep.hints[1]}`);
    P(`  intel 3  (tier 3 · deep)   : ${ep.hints[2]}`);
    P("```");
    P("");
    P("---");
    P("");
  }

  P("## Endings (EP12 branch)");
  P("");
  P("- **Whitehat** — `bounty-report --submit --responsible` → coordinated disclosure; ECHO cleared cleanly.");
  P("- **Vigilante** — `broadcast-leak --mode=public` → full public leak; Aether falls fast, collateral.");
  P("");
  P("## The give-up escape hatch");
  P("");
  P("After reading `intel 3` for an episode, `stuck --<flag>` drops the exact next command into your prompt. Flags:");
  P("");
  for (const f of GIVE_UP_FLAGS) P(`- \`stuck ${f}\``);
  P("");

  writeFileSync("docs/GAME_SCRIPT.md", lines.join("\n"));
  console.log(`Wrote docs/GAME_SCRIPT.md (${lines.length} lines).`);
  process.exit(0);
}

main();
