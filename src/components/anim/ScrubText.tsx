"use client";

import { useRef, type ElementType } from "react";
import { gsap, useGSAP } from "@/lib/anim/gsap";
import { prefersReducedMotion } from "@/lib/anim/signal";

/** Texto que "acende" caractere a caractere conforme o scroll (TREINO-ANIMACOES §6.1). */
export function ScrubText({
  text,
  as,
  className,
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "p") as ElementType;

  // Pré-renderiza os chars (mantém o espaço como nó de texto p/ word-wrap natural).
  const words = text.split(/\s+/).filter(Boolean);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const chars = el.querySelectorAll("[data-ch]");

      if (prefersReducedMotion()) {
        gsap.set(chars, { color: "#e6edf3" });
        return;
      }

      gsap.fromTo(
        chars,
        { color: "#3a4654" },
        {
          color: "#e6edf3",
          ease: "none",
          stagger: 0.4,
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            end: "bottom 55%",
            scrub: 0.5,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, wi) => (
        <span key={`${word}-${wi}`} className="inline-block">
          {[...word].map((ch, ci) => (
            <span data-ch key={ci}>
              {ch}
            </span>
          ))}
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
