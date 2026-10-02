// Browser smoke test: serve dist/, load the game in real Chromium, drive the
// Prologue through xterm, assert no console errors, and screenshot the deck.
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const DIST = join(process.cwd(), "dist");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/") p = "/index.html";
    const file = join(DIST, p);
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

const PORT = 4317;
await new Promise((r) => server.listen(PORT, r));

const errors = [];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage();
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const t = m.text();
  // The generic "Failed to load resource" line carries no URL; real HTTP
  // failures are caught by the response handler below (which skips favicon).
  if (/favicon\.ico/.test(t) || /Failed to load resource/.test(t)) return;
  errors.push(t);
});
page.on("requestfailed", (r) => {
  if (!/favicon\.ico/.test(r.url())) errors.push("requestfailed: " + r.url());
});
page.on("response", (r) => {
  if (r.status() >= 400 && !/favicon\.ico/.test(r.url())) errors.push(`HTTP ${r.status()} ${r.url()}`);
});
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// The Prologue opens as a briefing box; HEX stays offline until it's dismissed.
const prologueShown = (await page.locator(".prologue-modal").count()) === 1;
const prologueSetup =
  (await page.locator(".prologue-setup .setup-input").count()) === 1 &&
  (await page.locator(".prologue-setup .setup-select").count()) === 1;
// A returning operator can load a save straight from the boot screen.
const prologueLoad = (await page.locator(".prologue-load").count()) === 1;
// Set a distinctive handle so we can prove HEX speaks it back (token interpolation).
await page.locator(".prologue-setup .setup-input").fill("TEST//RUNNER");
await page.locator(".prologue-begin").click();
await page.waitForTimeout(300);
const prologueDismissed = (await page.locator(".prologue-modal").count()) === 0;
// Let HEX's first lines type out in the comms feed before asserting.
await page.waitForTimeout(3200);

// Progressive objectives: the Prologue reveals its steps one at a time, so only
// the first objective is visible before `help` runs.
const objectivesAtStart = await page.locator(".objective-list li").count();

// Player reply chips: a dialogue beat should offer clickable responses to HEX.
const replyChips = await page.locator(".comms-reply").count();
if (replyChips > 0) {
  await page.locator(".comms-reply").first().click();
  await page.waitForTimeout(1000);
}
const youLine = await page.locator(".comms-line.you").count();

// Fluid comms: a HEX utterance authored across several array lines must render as
// ONE bubble, never broken mid-sentence across two HEX> lines. The Ep00 intro
// line "...drive this rig — type help and / let's see what you've got." is two
// source lines; after coalescing they share a single .comms-line element.
const commsLineTexts = await page.locator(".comms-line").allInnerTexts();
const coalesced = commsLineTexts.some((t) => /drive this rig/.test(t) && /working with/.test(t));

// The xterm textarea receives keystrokes.
async function type(cmd) {
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.type(cmd);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
}

await type("help");
await type("codex");
const codexCmds = await page.locator(".codex-cmd").count();
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const codexClosed = (await page.locator(".codex-modal").count()) === 0;
await type("accept-code");
await page.waitForTimeout(500);

const terminalText = await page.locator(".xterm-rows").innerText();
const headerText = await page.locator(".header").innerText();
// HEX dialogue is now routed to the BBS comms side panel, not the terminal.
const commsText = await page.locator(".comms-pane").innerText();
const faceCanvas = await page.locator(".hex-face-canvas").count();

// Play into Act I so the telemetry pane and a streamed scan are visible.
await type("next");
await type("netmap 10.42.0.0/24");
await page.waitForTimeout(2000);
await type("ping 10.42.0.1");
await page.waitForTimeout(2200);
const telemetryText = await page.locator(".telemetry-pane").innerText();

// Evidence Locker: play forward to Ep03, grab the banner (which pins the session
// cookie), then prove it survives a terminal `clear` and that `recall` reprints
// it — so an accidental clear never loses a hex string.
await type("save"); // completes Ep01 (unlocks Ep02)
await type("next");
await type("portscan --inspect 10.42.0.1");
await type("answer 8088"); // completes Ep02 (unlocks Ep03)
await type("next");
await type("banner-grab --target 10.42.0.1 --port 80");
await page.waitForTimeout(400);
const evidenceBefore = await page.locator(".evidence-locker .evidence-item").count();
await type("clear");
await page.waitForTimeout(300);
const evidenceAfterClear = await page.locator(".evidence-locker .evidence-item").count();
await type("recall");
await page.waitForTimeout(300);
const recalledText = await page.locator(".xterm-rows").innerText();
await type("goto 1"); // back to Ep01 so the netmap --help checks below resolve

// Re-enter the episode to trigger a fresh HEX transmission, then capture the
// face while it's actively resolving (the reveal only shows while HEX speaks).
await type("goto 1");
await page.waitForTimeout(700);
const faceActive = (await page.locator(".hex-face.active").count()) === 1;
// Per-command --help (man page).
await type("netmap --help");
const helpText = await page.locator(".xterm-rows").innerText();
// Reverse link: `codex <command>` jumps to the concept and highlights it.
await type("codex netmap");
await page.waitForTimeout(400);
const codexHit = await page.locator(".codex-modal details.codex-hit").count();
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
// Tool chips insert the command NAME (a scaffold), not the full answer.
const toolChips = await page.locator(".tool-chip").count();
if (toolChips > 0) {
  await page.locator(".tool-chip").first().click();
  await page.waitForTimeout(250);
}
const promptText = await page.locator(".xterm-rows").innerText();
await page.screenshot({ path: "scripts/smoke-screenshot.png", fullPage: false });

await browser.close();
server.close();

const checks = [
  ["Prologue briefing box shown then dismissed", prologueShown && prologueDismissed],
  ["Prologue has handle + voice + music setup", prologueSetup],
  ["Prologue has a LOAD GAME button", prologueLoad],
  ["objectives reveal one at a time (Prologue)", objectivesAtStart === 1],
  ["HEX offers clickable player replies", replyChips >= 1],
  ["player reply posts a YOU> line", youLine >= 1],
  ["HEX utterances aren't broken mid-sentence", coalesced],
  ["comms panel shows HEX transmissions", /HEX>/.test(commsText) && /ECHO|Aether|channel|signal/i.test(commsText)],
  ["HEX speaks the chosen handle (no {handle} leak)", /TEST\/\/RUNNER/.test(commsText) && !/\{handle\}/.test(commsText)],
  ["HEX routed OUT of terminal", !/COMMS \/\/ HEX/.test(terminalText)],
  ["face-in-code visualizer present", faceCanvas === 1],
  ["face resolves while HEX transmits", faceActive],
  ["<cmd> --help prints a man page", /USAGE/.test(helpText) && /netmap/.test(helpText)],
  ["--help points back to the codex", /codex netmap/.test(helpText)],
  ["codex <command> jumps + highlights the concept", codexHit >= 1],
  ["Intel pane has tool chips", toolChips >= 1],
  ["tool chip inserts a command scaffold", /\$ netmap/.test(promptText)],
  ["comms panel has voice + music controls", /VOICE|MUSIC/.test(commsText)],
  ["header has save/load controls", /SAVE/.test(headerText) && /LOAD/.test(headerText)],
  ["Operating Code printed in terminal (before accept)", /OPERATING CODE/.test(terminalText) && /cleared to breach/.test(terminalText)],
  ["accept-code acknowledged", /acknowledged|roster|unlocked/i.test(terminalText)],
  ["header shows score", /SCORE/.test(headerText)],
  ["Escape closes Codex modal", codexClosed],
  ["Codex links concepts to terminal commands", codexCmds >= 1],
  ["telemetry pane populated by netmap", /10\.42\.0\.1/.test(telemetryText)],
  ["Evidence Locker captures a key ref", evidenceBefore >= 1],
  ["Evidence Locker survives `clear`", evidenceAfterClear >= 1 && evidenceAfterClear === evidenceBefore],
  ["`recall` reprints the evidence", /EVIDENCE LOCKER/.test(recalledText)],
  ["no console errors", errors.length === 0],
];

let ok = true;
for (const [label, pass] of checks) {
  console.log(`  ${pass ? "✓" : "✗"} ${label}`);
  if (!pass) ok = false;
}
if (errors.length) console.log("  console errors:\n" + errors.map((e) => "    " + e).join("\n"));
console.log(ok ? "\nSMOKE PASSED" : "\nSMOKE FAILED");
process.exit(ok ? 0 : 1);
