"use client";

import { useRef, type ElementType } from "react";
import { gsap, useGSAP, EASE } from "@/lib/anim/gsap";
import { prefersReducedMotion } from "@/lib/anim/signal";

type RevealProps = {
  children: React.ReactNode;
  as?: ElementType;
  className?: string;
  /** deslocamento inicial em px (texto ~34, cards ~60) */
  y?: number;
  /** atraso entre filhos diretos; 0 = anima o próprio elemento */
  stagger?: number;
  start?: string;
};

/**
 * Fade + rise on scroll (TREINO-ANIMACOES §4.2 / §4.3).
 * Com stagger > 0, anima os filhos diretos em cascata.
 */
export function Reveal({
  children,
  as,
  className,
  y = 34,
  stagger = 0,
  start = "top 86%",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "div") as ElementType;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        gsap.set(stagger ? el.children : el, { autoAlpha: 1, y: 0 });
        return;
      }

      const targets = stagger ? el.children : el;
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.1,
          ease: EASE.in,
          stagger: stagger || undefined,
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
