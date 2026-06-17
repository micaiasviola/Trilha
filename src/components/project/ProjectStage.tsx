"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP, EASE } from "@/lib/anim/gsap";
import { onIntroReady, prefersReducedMotion } from "@/lib/anim/signal";
import { Words } from "@/components/anim/SplitWords";
import { Magnetic } from "@/components/anim/Magnetic";
import { Odometer } from "@/components/anim/Odometer";
import { GenerativeCanvas } from "@/components/anim/GenerativeCanvas";
import { StatusBadge, TechBadge } from "@/components/Badge";
import { STATUS_LABEL, formatLong } from "@/lib/format";
import type { Project } from "@/lib/types";

export interface StageStats {
  weeks: number;
  deliveries: number;
  decisions: number;
  technologies: number;
}

export interface StageWeek {
  slug: string;
  weekNumber: number;
  title: string;
}

export function ProjectStage({
  project,
  index,
  stats,
  weeks,
}: {
  project: Project;
  index: number;
  stats: StageStats;
  weeks: StageWeek[];
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const words = el.querySelectorAll("[data-stage-title] [data-wi]");
      const fades = gsap.utils.toArray<HTMLElement>("[data-stage-fade]", el);

      if (prefersReducedMotion()) {
        gsap.set(words, { yPercent: 0 });
        gsap.set(fades, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.set(words, { yPercent: 115 });
      gsap.set(fades, { autoAlpha: 0, y: 22 });

      const run = () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.in } });
        tl.to(words, { yPercent: 0, duration: 1.1, stagger: 0.06 }).to(
          fades,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.07,
            clearProps: "transform",
          },
          "-=0.7",
        );
      };

      const unsub = onIntroReady(run);
      return () => unsub();
    },
    { scope: root },
  );

  const number = String(index + 1).padStart(2, "0");

  return (
    <div ref={root} className="relative px-6 py-10 sm:px-10 lg:py-14">
      {/* monumento generativo da atração (canvas 3D) */}
      <GenerativeCanvas
        seed={project.slug}
        className="pointer-events-none absolute right-0 top-0 hidden h-full w-[54%] lg:block"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] bg-gradient-to-r from-bg via-bg/30 to-transparent lg:block" />

      <div className="relative max-w-2xl">
        <div data-stage-fade className="flex items-center justify-between">
          <Magnetic strength={0.25}>
            <Link
              href="/projetos"
              className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              ← todas as atrações
            </Link>
          </Magnetic>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink-faint">
            atração {number}
          </span>
        </div>

        <div data-stage-fade className="mt-10">
          <StatusBadge
            status={project.status}
            label={STATUS_LABEL[project.status] ?? project.status}
          />
        </div>

        <h1
          data-stage-title
          className="mt-4 text-5xl font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl"
        >
          <Words text={project.name} />
        </h1>

        <p
          data-stage-fade
          className="mt-5 text-xl text-accent sm:text-2xl"
        >
          {project.tagline}
        </p>

        <p data-stage-fade className="mt-6 text-ink-muted">
          {project.description}
        </p>

        <dl
          data-stage-fade
          className="mt-8 grid grid-cols-2 gap-4 text-sm"
        >
          <div>
            <dt className="text-ink-faint">Papel</dt>
            <dd className="mt-0.5 text-ink">{project.role}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Início</dt>
            <dd className="mt-0.5 text-ink">{formatLong(project.startDate)}</dd>
          </div>
        </dl>

        <div data-stage-fade className="mt-6 flex flex-wrap gap-1.5">
          {project.technologies.map((t) => (
            <TechBadge key={t} name={t} />
          ))}
        </div>

        {/* métricas da atração */}
        <div
          data-stage-fade
          className="mt-10 grid grid-cols-4 gap-3"
        >
          <StageStat value={stats.weeks} label="Semanas" />
          <StageStat value={stats.deliveries} label="Entregas" />
          <StageStat value={stats.decisions} label="Decisões" />
          <StageStat value={stats.technologies} label="Techs" />
        </div>

        {project.highlights.length > 0 && (
          <div data-stage-fade className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
              ✨ Destaques
            </h2>
            <ul className="mt-4 space-y-2">
              {project.highlights.map((h, i) => (
                <li key={i} className="flex gap-2 text-ink-muted">
                  <span className="text-accent">▸</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {weeks.length > 0 && (
          <div data-stage-fade className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
              🗓️ Semanas nesta atração
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {weeks.map((w) => (
                <Link
                  key={w.slug}
                  href={`/semanas/${w.slug}`}
                  className="rounded-lg border border-line bg-bg-card px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent/40"
                >
                  <span className="font-mono text-xs text-accent-cyan">
                    S{w.weekNumber}
                  </span>{" "}
                  {w.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StageStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-card p-3 text-center">
      <Odometer value={value} className="text-2xl font-bold text-accent" />
      <div className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-ink-faint">
        {label}
      </div>
    </div>
  );
}
