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

// The xterm textarea receives keystrokes.
async function type(cmd) {
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.type(cmd);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
}

await type("help");
await type("codex");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const codexClosed = (await page.locator(".codex-modal").count()) === 0;
await type("accept-code");
await page.waitForTimeout(500);

const terminalText = await page.locator(".xterm-rows").innerText();
const headerText = await page.locator(".header").innerText();

// Play into Act I so the telemetry pane and a streamed scan are visible.
await type("next");
await type("netmap 10.42.0.0/24");
await page.waitForTimeout(2000);
await type("ping 10.42.0.1");
await page.waitForTimeout(2200);
const telemetryText = await page.locator(".telemetry-pane").innerText();
await page.screenshot({ path: "scripts/smoke-screenshot.png", fullPage: false });

await browser.close();
server.close();

const checks = [
  ["terminal shows HEX comms", /HEX/.test(terminalText)],
  ["accept-code acknowledged", /acknowledged|roster|unlocked/i.test(terminalText)],
  ["header shows score", /SCORE/.test(headerText)],
  ["Escape closes Codex modal", codexClosed],
  ["telemetry pane populated by netmap", /10\.42\.0\.1/.test(telemetryText)],
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
