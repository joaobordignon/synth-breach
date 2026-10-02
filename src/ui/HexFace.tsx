import { useEffect, useRef } from "react";

// HEX's "Face in Code" visualizer — the jaredrhod/ai-visualizer approach:
// an original stylized "anonymous netrunner" mask (public/hex-mask.png, drawn
// from assets/hex-mask.svg — MIT, not the trademarked V-mask) is sampled into a
// grid and re-rendered as green ASCII/code glyphs whose density follows the
// image's brightness. The
// face only resolves while HEX is transmitting or the voice is speaking; when
// idle it fades to black ("awaiting signal"). A generic Anonymous symbol, not
// a depiction of any real person.

interface HexFaceProps {
  active: boolean;
}

// Dark -> bright glyph ramp (the brighter the pixel, the denser the glyph).
const RAMP = " .,:;i1tfLCG08@#MW&%".split("");
const CODE = "01<>/\\[]{}#$%&*+=XKНΔΣ".split("");
const CELL_W = 7;
const CELL_H = 9;
const FONT = 9;
const THRESHOLD = 0.2; // below this brightness, draw nothing (background/eyes)

export function HexFace({ active }: HexFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const context = el.getContext("2d");
    if (!context) return;
    const cv: HTMLCanvasElement = el;
    const cx: CanvasRenderingContext2D = context;

    let cols = 0;
    let rows = 0;
    let bright: number[] = []; // brightness per cell, 0..1
    let img: HTMLImageElement | null = null;
    let fade = 0; // eased 0..1 reveal
    let raf = 0;
    let last = 0;

    // Sample the mask image into a cols x rows brightness grid, "contain"-fit
    // and centered so the mask keeps its proportions.
    function resample() {
      const rect = cv.getBoundingClientRect();
      cv.width = Math.max(1, Math.floor(rect.width));
      cv.height = Math.max(1, Math.floor(rect.height));
      cols = Math.max(1, Math.floor(cv.width / CELL_W));
      rows = Math.max(1, Math.floor(cv.height / CELL_H));
      bright = new Array(cols * rows).fill(0);
      if (!img) return;

      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.fillStyle = "#000";
      octx.fillRect(0, 0, cols, rows);
      // contain fit
      const scale = Math.min(cols / img.width, rows / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      octx.drawImage(img, (cols - w) / 2, (rows - h) / 2, w, h);
      const data = octx.getImageData(0, 0, cols, rows).data;
      for (let i = 0; i < cols * rows; i++) {
        // grayscale source: any channel is the luma
        bright[i] = data[i * 4] / 255;
      }
    }

    const image = new Image();
    image.onload = () => {
      img = image;
      resample();
    };
    image.src = `${import.meta.env.BASE_URL}hex-mask.png`;

    const ro = new ResizeObserver(resample);
    ro.observe(cv);

    function frame(t: number) {
      raf = requestAnimationFrame(frame);
      const on = activeRef.current;
      // Ease the reveal in/out.
      fade += ((on ? 1 : 0) - fade) * 0.12;
      if (fade < 0.01 && !on) {
        cx.clearRect(0, 0, cv.width, cv.height);
        return;
      }
      if (t - last < (on ? 45 : 90)) return;
      last = t;

      cx.clearRect(0, 0, cv.width, cv.height);
      cx.font = `${FONT}px "Cascadia Code", monospace`;
      cx.textBaseline = "top";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const b = bright[y * cols + x];
          if (b < THRESHOLD) continue;
          // Occasional scramble for the "live code" shimmer; shape stays legible.
          const scramble = on && Math.random() < 0.18;
          const glyph = scramble
            ? CODE[(Math.random() * CODE.length) | 0]
            : RAMP[Math.min(RAMP.length - 1, Math.floor(b * RAMP.length))];
          const alpha = fade * (0.3 + 0.7 * b);
          if (b > 0.75) {
            cx.shadowColor = "rgba(5,255,161,0.9)";
            cx.shadowBlur = 6;
          } else {
            cx.shadowBlur = 0;
          }
          cx.fillStyle = `rgba(5,255,161,${alpha.toFixed(3)})`;
          cx.fillText(glyph, x * CELL_W, y * CELL_H);
        }
      }
      cx.shadowBlur = 0;
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={`hex-face ${active ? "active" : ""}`}>
      <canvas ref={canvasRef} className="hex-face-canvas" />
      {!active && <div className="hex-face-standby">◻ AWAITING SIGNAL</div>}
      <div className="hex-face-label">{active ? "▶ TRANSMITTING" : "HEX // OFFLINE"}</div>
    </div>
  );
}
