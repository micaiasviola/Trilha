"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, ScrollTrigger, useGSAP, EASE } from "@/lib/anim/gsap";
import { onIntroReady, prefersReducedMotion } from "@/lib/anim/signal";
import { Words } from "@/components/anim/SplitWords";
import { Magnetic } from "@/components/anim/Magnetic";

export function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]", el);
      const wordsByLine = lines.map((l) =>
        gsap.utils.toArray<HTMLElement>("[data-wi]", l),
      );
      const allWords = wordsByLine.flat();
      const fades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]", el);
      const nav =
        typeof document !== "undefined"
          ? document.querySelector<HTMLElement>("[data-site-header]")
          : null;

      const reduced = prefersReducedMotion();

      if (reduced) {
        gsap.set(allWords, { yPercent: 0 });
        gsap.set(fades, { autoAlpha: 1, y: 0 });
        return;
      }

      // Estado inicial — aplicado enquanto o preloader cobre a tela.
      gsap.set(allWords, { yPercent: 115 });
      gsap.set(fades, { autoAlpha: 0, y: 26 });
      if (nav) gsap.set(nav, { yPercent: -110 });

      const heroIntro = () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.in } });
        wordsByLine.forEach((words, i) => {
          tl.to(
            words,
            { yPercent: 0, duration: 1.2, stagger: 0.07 },
            i === 0 ? 0 : "-=0.95",
          );
        });
        if (nav)
          tl.to(nav, { yPercent: 0, duration: 1, ease: "power3.out" }, "-=0.9");
        tl.to(fades[0], { autoAlpha: 1, y: 0, duration: 0.9 }, "-=0.85").to(
          fades.slice(1),
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.1,
            clearProps: "transform",
          },
          "-=0.7",
        );
      };

      const unsub = onIntroReady(heroIntro);

      // Parallax do letreiro de fundo (scrub).
      gsap.to("[data-hero-bg]", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      return () => {
        unsub();
        ScrollTrigger.getAll().forEach((t) => {
          if (t.trigger === el) t.kill();
        });
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-[92vh] items-center overflow-hidden border-b border-line bg-grid"
    >
      {/* Letreiro gigante em parallax */}
      <span
        data-hero-bg
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 bottom-0 select-none font-mono text-[26vw] font-black leading-none text-line/40"
      >
        PARK
      </span>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/50 to-bg" />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-24">
        <p
          data-hero-fade
          className="font-mono text-sm text-accent"
        >
          // bem-vindo ao parque
        </p>

        <h1 className="mt-4 max-w-4xl text-[2.6rem] font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl">
          <span data-hero-line className="block">
            <Words text="O parque de diversões" />
          </span>
          <span data-hero-line className="block">
            <Words text="do meu " />
            <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent">
              <Words text="desenvolvimento." />
            </span>
          </span>
        </h1>

        <p
          data-hero-fade
          className="mt-6 max-w-2xl text-lg text-ink-muted"
        >
          Cada <span className="text-ink">projeto</span> é uma atração e a{" "}
          <span className="text-ink">linha do tempo</span> é a trilha que liga
          tudo. Decisões, tecnologias, desafios e entregas do meu trabalho na
          ECQUA Engenharia — contados como uma jornada.
        </p>

        <div data-hero-fade className="mt-9 flex flex-wrap gap-3">
          <Magnetic strength={0.4}>
            <Link
              href="/linha-do-tempo"
              className="inline-block rounded-lg bg-gradient-to-r from-accent to-accent-cyan px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90"
            >
              Entrar no parque →
            </Link>
          </Magnetic>
          <Magnetic strength={0.25}>
            <Link
              href="/projetos"
              className="inline-block rounded-lg border border-line px-6 py-3 font-medium text-ink transition-colors hover:border-accent/40"
            >
              Ver as atrações
            </Link>
          </Magnetic>
        </div>

        <p
          data-hero-fade
          className="mt-16 font-mono text-xs uppercase tracking-[0.3em] text-ink-faint"
        >
          ↓ role para começar a trilha
        </p>
      </div>
    </section>
  );
}
