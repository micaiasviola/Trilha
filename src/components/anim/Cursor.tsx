"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/anim/gsap";
import { prefersReducedMotion } from "@/lib/anim/signal";

// Lista de interativos que ativam o anel (event delegation via closest).
const HOT = "a, button, input, textarea, select, [data-cursor-hot]";

/**
 * Cursor personalizado (TREINO-CURSOR): input e render desacoplados,
 * lerp no gsap.ticker único, estados por classe, mix-blend-mode difference.
 * Failsafe: só liga em ponteiro fino + movimento permitido; senão o nativo fica.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine || prefersReducedMotion()) return; // mantém o cursor nativo

    const root = document.documentElement;
    root.classList.add("has-fine-pointer");

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { x: pos.x, y: pos.y };

    // INPUT — barato: só anota o alvo.
    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // RENDER — no ticker único: persegue o alvo com lerp.
    const tick = () => {
      pos.x = lerp(pos.x, target.x, 0.18);
      pos.y = lerp(pos.y, target.y, 0.18);
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    };
    gsap.ticker.add(tick);

    // ESTADOS — delegação no document.
    const over = (e: Event) => {
      if ((e.target as Element)?.closest?.(HOT)) el.classList.add("is-active");
    };
    const out = (e: Event) => {
      if ((e.target as Element)?.closest?.(HOT)) el.classList.remove("is-active");
    };
    const down = () => el.classList.add("is-pressed");
    const up = () => el.classList.remove("is-pressed");
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      root.classList.remove("has-fine-pointer");
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <div className="cursor-dot" />
      <div className="cursor-ring" />
    </div>
  );
}
