"use client";

import { useRef, type ElementType } from "react";
import { gsap, useGSAP, EASE } from "@/lib/anim/gsap";
import { prefersReducedMotion } from "@/lib/anim/signal";

type MagneticProps = {
  children: React.ReactNode;
  as?: ElementType;
  className?: string;
  strength?: number;
};

/** Elemento que segue o cursor com física elástica (TREINO-ANIMACOES §7.1). */
export function Magnetic({
  children,
  as,
  className,
  strength = 0.3,
}: MagneticProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "div") as ElementType;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      const xTo = gsap.quickTo(el, "x", {
        duration: 0.9,
        ease: EASE.magnetic,
      });
      const yTo = gsap.quickTo(el, "y", {
        duration: 0.9,
        ease: EASE.magnetic,
      });

      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * strength);
        yTo((e.clientY - r.top - r.height / 2) * strength);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </Tag>
  );
}
