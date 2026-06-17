"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/anim/signal";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function seedFrom(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Torre wireframe 3D gerada no canvas 2D (TREINO-CANVAS-GENERATIVO Parte A):
 * projeção 3D à mão, profundidade modulando cor/tamanho, taper + twist.
 * Engenharia: DPR cap 2, ResizeObserver, IntersectionObserver (pausa fora da
 * tela), reduced-motion = 1 frame estático, RAF próprio (pauseável). Cada
 * atração varia pela `seed`.
 */
export function GenerativeCanvas({
  seed = "trilhado",
  className,
}: {
  seed?: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const rng = mulberry32(seedFrom(seed));
    const FLOORS = 14 + Math.floor(rng() * 5); // 14–18
    const baseTwist = 0.7 + rng() * 0.35;
    const particles = Array.from({ length: 56 }, () => ({
      a: rng() * Math.PI * 2,
      r: 1.1 + rng() * 1.5,
      y: (rng() - 0.5) * 2.6,
      s: 0.0004 + rng() * 0.0011,
      size: 0.6 + rng() * 1.5,
    }));

    let W = 0;
    let H = 0;

    const project = (
      x: number,
      y: number,
      z: number,
      rotY: number,
      rotX: number,
      cx: number,
      cy: number,
      scale: number,
    ) => {
      const px = x * Math.cos(rotY) - z * Math.sin(rotY);
      let pz = x * Math.sin(rotY) + z * Math.cos(rotY);
      const py = y * Math.cos(rotX) - pz * Math.sin(rotX);
      pz = y * Math.sin(rotX) + pz * Math.cos(rotX);
      const f = 3.6 / (3.6 + pz);
      return { x: cx + px * f * scale, y: cy + py * f * scale, d: f };
    };

    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const frame = (t: number) => {
      if (W === 0 || H === 0) return;
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.5;
      const cy = H * 0.52;
      const scale = Math.min(W, H) * 0.36;

      mouse.sx = lerp(mouse.sx, mouse.x, 0.045);
      mouse.sy = lerp(mouse.sy, mouse.y, 0.045);
      const rotY = t * 0.22 + mouse.sx * 0.34;
      const rotX = -0.42 + mouse.sy * 0.14;
      const twist = baseTwist + Math.sin(t * 0.7) * 0.18;

      // anéis de chão
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        const rad = (0.9 + r * 0.5) * scale;
        const ground = project(0, 1.25, 0, rotY * 0.3, rotX, cx, cy, 1);
        ctx.ellipse(ground.x, ground.y, rad, rad * 0.34, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52,211,153,${0.05 - r * 0.012})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // andares
      const pts: { x: number; y: number; d: number }[][] = [];
      for (let i = 0; i <= FLOORS; i++) {
        const yn = i / FLOORS;
        const y = (yn - 0.5) * 2.3;
        const s = 0.66 * (1 - 0.22 * (1 - yn)); // taper
        const a = rotY + twist * (yn - 0.5); // twist
        const corners = [];
        for (let c = 0; c < 4; c++) {
          const ca = a + (Math.PI / 2) * c + Math.PI / 4;
          corners.push(
            project(Math.cos(ca) * s, y, Math.sin(ca) * s, 0, rotX, cx, cy, scale),
          );
        }
        pts.push(corners);
      }

      // placas de piso
      for (let i = 0; i < pts.length; i++) {
        const corners = pts[i];
        const depth = corners.reduce((acc, p) => acc + p.d, 0) / 4;
        ctx.beginPath();
        corners.forEach((p, k) =>
          k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
        );
        ctx.closePath();
        ctx.lineWidth = i === 0 || i === pts.length - 1 ? 1.4 : 1;
        ctx.strokeStyle = `rgba(52,211,153,${0.06 + depth * 0.2})`;
        ctx.stroke();
      }

      // arestas verticais
      for (let i = 0; i < pts.length - 1; i++) {
        for (let c = 0; c < 4; c++) {
          const p1 = pts[i][c];
          const p2 = pts[i + 1][c];
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(34,211,238,${0.05 + ((p1.d + p2.d) / 2) * 0.16})`;
          ctx.stroke();
        }
      }

      // nós de canto (andares pares)
      for (let i = 0; i < pts.length; i++) {
        if (i % 2) continue;
        for (const p of pts[i]) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.3 + p.d * 1.1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(163,184,153,${0.25 + p.d * 0.4})`;
          ctx.fill();
        }
      }

      // partículas
      for (const pt of particles) {
        pt.a += pt.s;
        const p = project(
          Math.cos(pt.a) * pt.r,
          pt.y,
          Math.sin(pt.a) * pt.r,
          rotY * 0.6,
          rotX,
          cx,
          cy,
          scale,
        );
        ctx.beginPath();
        ctx.arc(p.x, p.y, pt.size * p.d, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,211,238,${0.1 + p.d * 0.26})`;
        ctx.fill();
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) frame(2.2); // redesenha o frame estático no resize
    };
    resize();

    let raf = 0;
    let running = false;
    const start = performance.now();
    const loop = () => {
      frame((performance.now() - start) / 1000);
      raf = requestAnimationFrame(loop);
    };

    let io: IntersectionObserver | null = null;
    if (reduced) {
      frame(2.2);
    } else {
      io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      });
      io.observe(wrap);
    }

    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(wrap);
    else window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      io?.disconnect();
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
    };
  }, [seed]);

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
