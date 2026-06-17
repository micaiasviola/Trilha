"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Registro central — feito uma única vez no client.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };

/** Eases canônicos do projeto (espelham o TREINO-ANIMACOES). */
export const EASE = {
  in: "power4.out",
  out: "power2.in",
  wipe: "power4.inOut",
  magnetic: "elastic.out(1, 0.4)",
  liquid: "elastic.out(1.2, 0.18)",
} as const;
