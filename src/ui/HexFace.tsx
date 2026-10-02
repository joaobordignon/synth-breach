import { useEffect, useRef } from "react";
import { PALETTE } from "../config";

// HEX's "Face in Code" visualizer: a stylized Guy Fawkes / Anonymous mask
// rendered as neon line-art over a Matrix-style code-rain canvas. It intensifies
// and the mouth animates while HEX is transmitting or the voice is speaking.
// (A generic protest-movement symbol, not a depiction of any real person.)

interface HexFaceProps {
  active: boolean;
}

const GLYPHS = "01<>/\\[]{}#$%&*+=ABCDEF8902アカサ".split("");

export function HexFace({ active }: HexFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const context = el.getContext("2d");
    if (!context) return;
    // Explicit non-null bindings so TS keeps the narrowing inside the closures.
    const cv: HTMLCanvasElement = el;
    const cx: CanvasRenderingContext2D = context;

    let raf = 0;
    let cols = 0;
    let drops: number[] = [];
    const fontSize = 12;

    function resize() {
      const rect = cv.getBoundingClientRect();
      cv.width = Math.max(1, Math.floor(rect.width));
      cv.height = Math.max(1, Math.floor(rect.height));
      cols = Math.floor(cv.width / fontSize);
      drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -20));
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    let last = 0;
    function frame(t: number) {
      const interval = activeRef.current ? 55 : 110;
      if (t - last >= interval) {
        last = t;
        cx.fillStyle = "rgba(13,2,33,0.35)";
        cx.fillRect(0, 0, cv.width, cv.height);
        cx.font = `${fontSize}px monospace`;
        for (let i = 0; i < cols; i++) {
          const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;
          cx.fillStyle = activeRef.current ? PALETTE.neonGreen : "rgba(5,255,161,0.45)";
          cx.fillText(ch, x, y);
          if (y > cv.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={`hex-face ${active ? "active" : ""}`}>
      <canvas ref={canvasRef} className="hex-face-rain" />
      <svg className="hex-face-mask" viewBox="0 0 200 240" aria-label="HEX — Anonymous">
        {/* face outline */}
        <path
          className="mask-line mask-fill"
          d="M100 18 C140 22 168 48 170 84 C172 118 158 138 150 158 C142 180 122 210 100 224 C78 210 58 180 50 158 C42 138 28 118 30 84 C32 48 60 22 100 18 Z"
        />
        {/* eyebrows (arched, severe) */}
        <path className="mask-line" d="M52 86 C64 74 82 74 92 82" />
        <path className="mask-line" d="M148 86 C136 74 118 74 108 82" />
        {/* eyes */}
        <path className="mask-line" d="M60 98 C70 90 86 92 92 100 C84 108 68 108 60 98 Z" />
        <path className="mask-line" d="M140 98 C130 90 114 92 108 100 C116 108 132 108 140 98 Z" />
        {/* nose */}
        <path className="mask-line" d="M100 104 L94 136 C96 140 104 140 106 136 Z" />
        {/* cheek swirls (classic mask flush) */}
        <path className="mask-line thin" d="M58 132 C64 126 72 128 74 136" />
        <path className="mask-line thin" d="M142 132 C136 126 128 128 126 136" />
        {/* handlebar mustache */}
        <path className="mask-line" d="M100 150 C88 150 78 146 66 136 C74 150 86 158 100 156" />
        <path className="mask-line" d="M100 150 C112 150 122 146 134 136 C126 150 114 158 100 156" />
        {/* mouth — animates while speaking */}
        <path className="mask-mouth" d="M84 160 C92 166 108 166 116 160" />
        {/* soul patch / pointed goatee */}
        <path className="mask-line" d="M94 172 L106 172 L100 200 Z" />
      </svg>
      <div className="hex-face-label">{active ? "▶ TRANSMITTING" : "◻ STANDBY"}</div>
    </div>
  );
}
