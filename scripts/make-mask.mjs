// Rasterize the original mask artwork (assets/hex-mask.svg) to the grayscale
// PNG the in-game "Face in Code" sampler reads (public/hex-mask.png). Renders
// with the preinstalled Chromium so the output is deterministic. Run manually
// after editing the SVG:  node scripts/make-mask.mjs
import { chromium } from "playwright-core";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const svg = await readFile(join(process.cwd(), "assets", "hex-mask.svg"), "utf8");
const W = 300;
const H = 320;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(
  `<!doctype html><html><body style="margin:0;background:#000">${svg}</body></html>`,
  { waitUntil: "networkidle" },
);
const png = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();

const out = join(process.cwd(), "public", "hex-mask.png");
await writeFile(out, png);
console.log(`Wrote ${out} (${png.length} bytes). Tip: optionally run \`convert public/hex-mask.png -colorspace Gray -strip public/hex-mask.png\`.`);
