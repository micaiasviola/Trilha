"use client";

import { useRef, type ElementType } from "react";
import { gsap, useGSAP, EASE } from "@/lib/anim/gsap";
import { prefersReducedMotion } from "@/lib/anim/signal";

/** Renderiza palavras em máscaras (.w/.wi) para o word-mask reveal. */
export function Words({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, i) => (
        <span className="w" key={`${word}-${i}`}>
          <span className="wi" data-wi>
            {word}
          </span>
          {i < words.length - 1 ? <span className="ws"> </span> : null}
        </span>
      ))}
    </>
  );
}

type SplitWordsProps = {
  text: string;
  as?: ElementType;
  className?: string;
  start?: string;
};

/**
 * Word-mask reveal disparado por scroll (TREINO-ANIMACOES §4.1).
 * Para o hero coordenado, use <Words> diretamente e controle pelo timeline.
 */
export function SplitWords({
  text,
  as,
  className,
  start = "top 86%",
}: SplitWordsProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "h2") as ElementType;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const inners = el.querySelectorAll("[data-wi]");

      if (prefersReducedMotion()) {
        gsap.set(inners, { yPercent: 0 });
        return;
      }

      gsap.fromTo(
        inners,
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: 1.15,
          ease: EASE.in,
          stagger: 0.06,
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      <Words text={text} />
    </Tag>
  );
}
