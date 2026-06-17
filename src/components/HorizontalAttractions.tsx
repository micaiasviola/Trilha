"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/anim/gsap";
import type { Project } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/format";
import { StatusBadge, TechBadge } from "@/components/Badge";

export function HorizontalAttractions({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const pct = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const trackEl = track.current;
      if (!section || !trackEl) return;

      const setFill = fill.current
        ? gsap.quickSetter(fill.current, "scaleX")
        : null;

      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const distance = () => trackEl.scrollWidth - window.innerWidth;
          if (distance() <= 0) return;

          section.dataset.mode = "pinned";

          // Núcleo: traduz a trilha horizontalmente enquanto a seção fica presa.
          const tween = gsap.to(trackEl, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => "+=" + distance(),
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                setFill?.(self.progress);
                if (pct.current) {
                  pct.current.textContent =
                    String(Math.round(self.progress * 100)).padStart(3, "0") +
                    "%";
                }
              },
            },
          });

          // Parallax interno: o número-fantasma de cada atração desliza ao
          // cruzar a viewport (containerAnimation — TREINO-ANIMACOES §6.3).
          const panels = gsap.utils.toArray<HTMLElement>(
            "[data-panel]",
            trackEl,
          );
          panels.forEach((panel) => {
            const ghost = panel.querySelector<HTMLElement>("[data-ghost]");
            if (!ghost) return;
            gsap.fromTo(
              ghost,
              { xPercent: 28 },
              {
                xPercent: -28,
                ease: "none",
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: tween,
                  start: "left right",
                  end: "right left",
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              },
            );
          });

          return () => {
            delete section.dataset.mode;
          };
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-attractions
      aria-label="Atrações — projetos"
      className="relative my-10"
    >
      <div ref={track} className="at-track gap-5 px-4 py-10 md:gap-6 md:px-[8vw] md:py-0">
        {/* Painel de entrada */}
        <div
          data-panel
          className="relative flex h-[68vh] w-[80vw] shrink-0 snap-center flex-col justify-center md:h-[78vh] md:w-[42vw]"
        >
          <p className="font-mono text-sm text-accent">// as atrações</p>
          <h2 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Escolha sua
            <br />
            <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent">
              próxima atração
            </span>
          </h2>
          <p className="mt-5 max-w-sm text-ink-muted">
            Cada projeto da ECQUA é uma atração do parque. Role para andar pela
            trilha e embarcar.
          </p>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-ink-faint">
            role →
          </p>
        </div>

        {/* Painéis de atração (um por projeto) */}
        {projects.map((project, i) => (
          <Link
            key={project.slug}
            href={`/projetos/${project.slug}`}
            data-panel
            className="group relative flex h-[68vh] w-[82vw] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-3xl border border-line bg-bg-card p-7 transition-colors hover:border-accent/40 md:h-[78vh] md:w-[58vw] md:p-10"
          >
            {/* número-fantasma em parallax */}
            <span
              data-ghost
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-[6vh] right-[-2vw] select-none font-mono text-[34vh] font-black leading-none text-line/50"
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <div className="relative flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink-faint">
                atração {String(i + 1).padStart(2, "0")}
              </span>
              <StatusBadge
                status={project.status}
                label={STATUS_LABEL[project.status] ?? project.status}
              />
            </div>

            <div className="relative">
              <h3 className="text-4xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent sm:text-6xl">
                {project.name}
              </h3>
              <p className="mt-4 max-w-md text-lg text-ink-muted">
                {project.tagline}
              </p>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {project.technologies.slice(0, 5).map((t) => (
                  <TechBadge key={t} name={t} />
                ))}
              </div>
              <span className="mt-8 inline-flex items-center gap-2 font-medium text-accent">
                Entrar na atração
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>
          </Link>
        ))}

        {/* Painel de saída */}
        <div
          data-panel
          className="relative flex h-[68vh] w-[80vw] shrink-0 snap-center flex-col justify-center md:h-[78vh] md:w-[40vw]"
        >
          <p className="font-mono text-sm text-accent">// fim da fila</p>
          <h2 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Isso é só o<br />começo do parque.
          </h2>
          <p className="mt-5 max-w-sm text-ink-muted">
            Novas atrações entram a cada semana de desenvolvimento.
          </p>
          <Link
            href="/projetos"
            className="mt-8 inline-block w-fit rounded-lg bg-gradient-to-r from-accent to-accent-cyan px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90"
          >
            Ver todas as atrações →
          </Link>
        </div>
      </div>

      {/* Trilha (rail) — só visível no modo pinned */}
      <div className="at-rail pointer-events-none absolute inset-x-0 bottom-8 z-10 mx-auto flex max-w-5xl items-center gap-4 px-6">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink-faint">
          trilha
        </span>
        <span className="relative h-px flex-1 overflow-hidden bg-line">
          <span
            ref={fill}
            className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-accent to-accent-cyan"
          />
        </span>
        <span
          ref={pct}
          className="font-mono text-xs tabular-nums text-accent-cyan"
        >
          000%
        </span>
      </div>
    </section>
  );
}
