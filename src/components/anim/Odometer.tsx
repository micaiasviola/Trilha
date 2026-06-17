"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/anim/gsap";
import { onIntroReady, prefersReducedMotion } from "@/lib/anim/signal";

const DIGITS = Array.from({ length: 20 }, (_, i) => i % 10); // 0–9 duplicado

/**
 * Contador rolante (TREINO-SECOES §3): pilha dupla de 0–9 numa janela de 1em;
 * cada dígito sobe até `-(10 + dígito)em` garantindo uma volta completa.
 * SSR mostra o valor final (transform inline) → degrada sem JS / reduced-motion.
 */
export function Odometer({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const chars = value.toLocaleString("pt-BR").split("");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return; // mantém o estado final do SSR

      const stacks = gsap.utils.toArray<HTMLElement>("[data-od-stack]", el);
      const run = () => {
        stacks.forEach((stack, i) => {
          const digit = Number(stack.dataset.digit);
          gsap.fromTo(
            stack,
            { y: "0em" },
            {
              y: `-${10 + digit}em`,
              duration: 1.3 + i * 0.22,
              delay: i * 0.05,
              ease: "power4.out",
            },
          );
        });
      };
      const unsub = onIntroReady(run);
      return () => unsub();
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={`od ${className ?? ""}`}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={i} className="od-sep">
              {ch}
            </span>
          );
        }
        const digit = Number(ch);
        return (
          <span key={i} className="od-col">
            <span
              data-od-stack
              data-digit={digit}
              className="od-stack"
              // SSR/no-JS/reduced: já mostra o dígito final
              style={{ transform: `translateY(-${10 + digit}em)` }}
            >
              {DIGITS.map((d, j) => (
                <b key={j}>{d}</b>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
