import { useEffect, useRef, useState } from "react";
import { store } from "../engine/gameStore";
import { PALETTE } from "../config";

// Full-screen visual FX, triggered by api.fx(). `glitch` adds a brief
// scramble/jitter class; `alarm` flashes an alert-red vignette; `fireworks`
// runs a short canvas particle burst for the Episode 12 victory splash.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const FW_COLORS = [PALETTE.neonPink, PALETTE.neonCyan, PALETTE.neonGreen, PALETTE.sunsetAmber];

export function FxLayer() {
  const [glitch, setGlitch] = useState(false);
  const [alarm, setAlarm] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = store.onFx((effect) => {
      if (effect === "glitch") {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 600);
      } else if (effect === "alarm") {
        setAlarm(true);
        setTimeout(() => setAlarm(false), 500);
      } else if (effect === "fireworks") {
        launchFireworks();
      }
    });
    return unsub;
  }, []);

  function launchFireworks() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const addBurst = () => {
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height * 0.6;
      const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60;
        const speed = 2 + Math.random() * 4;
        particles.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
        });
      }
    };

    const bursts = [0, 400, 800, 1200, 1600].map((d) => setTimeout(addBurst, d));

    const draw = () => {
      ctx.fillStyle = "rgba(13,2,33,0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.life > 0);
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life -= 0.012;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.globalAlpha = 1;
      if (particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRef.current = null;
      }
    };
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(draw);
    // Safety: stop bursts after the show.
    setTimeout(() => bursts.forEach(clearTimeout), 2000);
  }

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <>
      {glitch && <div className="fx-glitch" />}
      {alarm && <div className="fx-alarm" />}
      <canvas ref={canvasRef} className="fx-canvas" />
    </>
  );
}
