// Headless end-to-end playtest of the game LOGIC (no UI). Stubs the few
// browser globals the engine touches, drives the real store through every
// episode with the intended solution commands, and asserts that each episode
// completes and the campaign reaches an ending. Bundled with esbuild and run
// under node — see `npm run playtest`.

import { store } from "../src/engine/gameStore";
import "../src/engine/globalCommands";
import { ORDER, EPISODES } from "../src/chapters";
import type { Line } from "../src/engine/types";

let captured: Line[] = [];
store.onOutput((lines) => captured.push(...lines));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run(cmd: string) {
  store.submit(cmd);
  await sleep(40); // let synchronous handlers settle
}

/** Wait until a predicate holds (for commands that complete on a timer). */
async function waitFor(pred: () => boolean, timeoutMs = 4000) {
  const start = Date.now();
  while (!pred()) {
    if (Date.now() - start > timeoutMs) return false;
    await sleep(50);
  }
  return true;
}

// Exact solution scripts per episode id.
const SCRIPTS: Record<number, string[]> = {
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

async function main() {
  let failures = 0;
  for (const id of ORDER) {
    const ep = EPISODES[id];
    // Unlock + start (goto requires unlock; force unlock for the test).
    if (!store.isUnlocked(id)) store.profile.unlockedEpisodes.push(id);
    store.startEpisode(id);
    captured = [];
    for (const cmd of SCRIPTS[id]) {
      await run(cmd);
    }
    const ok = await waitFor(() => store.episodeCleared);
    const objs = store.objectiveStatus();
    const doneCount = objs.filter((o) => o.done).length;
    const label = `EP${String(id).padStart(2, "0")} ${ep.title}`;
    if (ok && doneCount === objs.length) {
      console.log(`  ✓ ${label}  (${doneCount}/${objs.length} objectives, warden=${store.wardenScore.toFixed(2)})`);
    } else {
      failures++;
      console.log(`  ✗ ${label}  cleared=${ok} objectives ${doneCount}/${objs.length}`);
      for (const o of objs) if (!o.done) console.log(`      unmet: ${o.label}`);
    }
  }

  const badges = store.profile.achievements;
  console.log(`\nFinal score: ${store.profile.score} REP · badges: ${badges.join(", ") || "none"}`);
  if (!badges.includes("MASTER OPERATOR") || !badges.includes("WHITEHAT OPERATOR")) {
    failures++;
    console.log("  ✗ Whitehat ending did not resolve");
  }

  // Replay the finale down the Vigilante branch to confirm it's fully wired.
  store.startEpisode(12);
  for (const cmd of ["fetch-file --path ../../../../etc/aether/master_key.pem", "verify-key A", "bounty-report --compile", "broadcast-leak --mode=public"]) {
    await run(cmd);
  }
  const vigilanteOk = (await waitFor(() => store.episodeCleared)) && store.profile.achievements.includes("VIGILANTE OPERATOR");
  console.log(vigilanteOk ? "  ✓ EP12 Vigilante ending path resolves" : "  ✗ EP12 Vigilante ending path broken");
  if (!vigilanteOk) failures++;

  if (failures > 0) {
    console.error(`\nPLAYTEST FAILED: ${failures} problem(s).`);
    process.exit(1);
  }
  console.log("\nPLAYTEST PASSED: all 13 episodes playable start-to-finish.");
  process.exit(0);
}

main();
