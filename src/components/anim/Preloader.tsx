"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP, EASE } from "@/lib/anim/gsap";
import { markIntroReady, prefersReducedMotion } from "@/lib/anim/signal";
import { getLenis } from "./SmoothScroll";

const ATTRACTIONS = ["entradas", "atrações", "trilha", "decisões", "pronto"];

export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      // Reduced motion: nada de preloader, libera a entrada na hora.
      if (prefersReducedMotion()) {
        markIntroReady();
        setGone(true);
        return;
      }

      const el = root.current;
      if (!el) return;

      const lenis = getLenis();
      lenis?.stop();

      const count = el.querySelector<HTMLElement>("[data-count]");
      const label = el.querySelector<HTMLElement>("[data-label]");
      const state = { v: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          lenis?.start();
          ScrollTrigger.refresh();
          markIntroReady();
          setGone(true);
        },
      });

      tl.to(state, {
        v: 100,
        duration: 1.7,
        ease: "power2.inOut",
        onUpdate: () => {
          if (!count) return;
          count.textContent = String(Math.round(state.v)).padStart(3, "0");
          if (label) {
            const idx = Math.min(
              ATTRACTIONS.length - 1,
              Math.floor((state.v / 100) * ATTRACTIONS.length),
            );
            label.textContent = ATTRACTIONS[idx];
          }
        },
      })
        .to("[data-fill]", { scaleX: 1, duration: 1.7, ease: "power2.inOut" }, 0)
        .to(
          "[data-pre-inner]",
          { yPercent: -28, autoAlpha: 0, duration: 0.55, ease: EASE.out },
          "+=0.15",
        )
        .to(
          el,
          { clipPath: "inset(0 0 100% 0)", duration: 0.85, ease: EASE.wipe },
          "-=0.3",
        );
    },
    { scope: root },
  );

  if (gone) return null;

  return (
    <div
      ref={root}
      data-preloader
      aria-hidden="true"
      className="fixed inset-0 z-[500] flex items-end bg-bg text-ink"
      style={{ clipPath: "inset(0 0 0 0)" }}
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <div
        data-pre-inner
        className="relative flex w-full items-end justify-between gap-8 px-6 pb-10 sm:px-10"
      >
        <div>
          <span className="block bg-gradient-to-r from-accent to-accent-cyan bg-clip-text font-mono text-4xl font-bold leading-none tracking-tight text-transparent sm:text-6xl">
            TRILHADO<sup className="text-base text-accent">®</sup>
          </span>
          <span className="mt-3 block font-mono text-[0.7rem] uppercase tracking-[0.32em] text-ink-faint">
            montando o parque · <span data-label>entradas</span>
          </span>
        </div>
        <div className="min-w-[8rem] text-right">
          <span
            data-count
            className="block font-mono text-2xl tabular-nums text-accent-cyan sm:text-3xl"
          >
            000
          </span>
          <span className="mt-2 block h-px w-full overflow-hidden bg-line">
            <span
              data-fill
              className="block h-full w-full origin-left scale-x-0 bg-gradient-to-r from-accent to-accent-cyan"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
