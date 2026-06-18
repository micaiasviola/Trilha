"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP, EASE } from "@/lib/anim/gsap";
import { markIntroReady, prefersReducedMotion } from "@/lib/anim/signal";
import { getLenis } from "./SmoothScroll";

const ATTRACTIONS = ["entradas", "atrações", "trilha", "decisões", "pronto"];
const SESSION_KEY = "trilhado:preloaded";

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

      // Intro só uma vez por sessão da aba — recarregar não repete os ~3s.
      let seenThisSession = false;
      try {
        seenThisSession = sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {}
      if (seenThisSession) {
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

      // Encerra a intro uma única vez — no fim natural ou quando o usuário pula.
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}
        lenis?.start();
        ScrollTrigger.refresh();
        markIntroReady();
        setGone(true);
      };

      const tl = gsap.timeline({ onComplete: finish });

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

      // O overlay cobre a tela inteira por ~3s; sem isto ele engole todos os
      // clicks até terminar. Qualquer interação adianta a intro na hora.
      const skipEvents = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
      const skip = () => {
        skipEvents.forEach((ev) => window.removeEventListener(ev, skip));
        tl.pause();
        gsap.to(tl, {
          progress: 1,
          duration: 0.35,
          ease: "power2.in",
          onComplete: finish,
        });
      };
      skipEvents.forEach((ev) =>
        window.addEventListener(ev, skip, { passive: true }),
      );

      return () => {
        skipEvents.forEach((ev) => window.removeEventListener(ev, skip));
      };
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
