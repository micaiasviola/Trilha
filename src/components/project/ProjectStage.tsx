"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { gsap, useGSAP, EASE } from "@/lib/anim/gsap";
import { onIntroReady, prefersReducedMotion } from "@/lib/anim/signal";
import { Words } from "@/components/anim/SplitWords";
import { Magnetic } from "@/components/anim/Magnetic";
import { Odometer } from "@/components/anim/Odometer";
import { GenerativeCanvas } from "@/components/anim/GenerativeCanvas";
import { PosterGridFx } from "@/components/anim/PosterGridFx";
import { StatusBadge, TechBadge } from "@/components/Badge";
import { STATUS_LABEL, formatLong } from "@/lib/format";
import type { Project } from "@/lib/types";

export interface StageStats {
  deliveries: number;
  decisions: number;
  challenges: number;
  technologies: number;
}

export function ProjectStage({
  project,
  index,
  stats,
}: {
  project: Project;
  index: number;
  stats: StageStats;
}) {
  const root = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const towerRef = useRef<HTMLDivElement>(null);

  // "trilha": o fundo é o efeito grid-displacement sobre o pôster (escuro, foco
  // na descrição) — sem holofote/torre. ECQUA-360 mantém pôster + holofote + torre.
  const gridFx = Boolean(project.posterBg) && project.slug === "trilha";

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

  // Torre (canvas) sobre o pôster, ambos escondendo/revelando sob o cursor:
  // buraco na torre + SVG revelado no mesmo ponto. O pôster scrolla e a torre é
  // sticky, então os vars de máscara são recalculados por elemento a cada frame.
  useEffect(() => {
    const poster = posterRef.current;
    const tower = towerRef.current;
    const stage = root.current;
    if (!tower || !stage) return;

    // trilha usa o efeito grid-displacement (sem holofote) → nada a animar aqui.
    if (gridFx) return;

    // Sem hover (touch) ou movimento reduzido: torre cobre, SVG escondido.
    if (!window.matchMedia("(hover: hover)").matches || prefersReducedMotion()) {
      tower.style.setProperty("--r", "0px");
      poster?.style.setProperty("--r", "0px");
      return;
    }

    const REVEAL = 230;
    const cur = { x: 0, y: 0, r: 0 }; // cursor suavizado (viewport) + raio
    const tgt = { x: 0, y: 0, r: 0 }; // cursor alvo (viewport) + raio
    let raf = 0;
    let primed = false;

    // Posiciona a máscara no espaço local do elemento (lida com scroll/sticky).
    const apply = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(cur.x - rect.left).toFixed(1)}px`);
      el.style.setProperty("--my", `${(cur.y - rect.top).toFixed(1)}px`);
      el.style.setProperty("--r", `${cur.r.toFixed(1)}px`);
    };

    const render = () => {
      cur.x += (tgt.x - cur.x) * 0.16;
      cur.y += (tgt.y - cur.y) * 0.16;
      cur.r += (tgt.r - cur.r) * 0.1;
      apply(tower);
      if (poster) apply(poster);
      const done =
        Math.abs(tgt.x - cur.x) < 0.5 &&
        Math.abs(tgt.y - cur.y) < 0.5 &&
        Math.abs(tgt.r - cur.r) < 0.5;
      raf = done ? 0 : requestAnimationFrame(render);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      tgt.x = e.clientX;
      tgt.y = e.clientY;
      tgt.r = REVEAL;
      if (!primed) {
        cur.x = tgt.x; // snap inicial: evita varredura a partir do canto
        cur.y = tgt.y;
        primed = true;
      }
      wake();
    };
    const onLeave = () => {
      tgt.r = 0;
      wake();
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [project.posterBg, gridFx]);

  const number = String(index + 1).padStart(2, "0");

  return (
    <div ref={root} className="relative">
      {/* Fundo da atração */}
      {project.posterBg ? (
        gridFx ? (
          /* TRILHA — efeito grid-displacement sobre o pôster (fundo escuro) */
          <>
            <PosterGridFx src={project.posterBg} opacity={0.45} />
            {/* fade reforçado: prioriza a leitura da descrição à esquerda */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] bg-gradient-to-r from-bg via-bg/60 to-transparent lg:block"
            />
          </>
        ) : (
          /* ECQUA-360 — pôster repetido + holofote + torre wireframe */
          <>
            {/* Camada 1 — pôster repetido até o fim da página */}
            <div
              ref={posterRef}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] opacity-90 lg:block"
              style={
                {
                  backgroundImage: `url(${project.posterBg})`,
                  backgroundRepeat: "repeat-y",
                  backgroundSize: "100% auto",
                  "--mx": "50%",
                  "--my": "50%",
                  "--r": "0px",
                  WebkitMaskImage:
                    "radial-gradient(circle var(--r) at var(--mx) var(--my), #000 0%, #000 30%, transparent 70%)",
                  maskImage:
                    "radial-gradient(circle var(--r) at var(--mx) var(--my), #000 0%, #000 30%, transparent 70%)",
                } as CSSProperties
              }
            />
            {/* Camada 2 — fade de legibilidade sobre o texto */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] bg-gradient-to-r from-bg via-bg/40 to-transparent lg:block"
            />
            {/* Camada 3 — torre wireframe (sticky); o cursor abre um buraco que revela o SVG */}
            <div
              aria-hidden
              className="pointer-events-none sticky top-0 hidden h-[calc(100svh-4rem)] lg:block"
              style={{ marginBottom: "calc(-1 * (100svh - 4rem))" }}
            >
              <div
                ref={towerRef}
                className="absolute right-0 top-0 h-full w-[54%]"
                style={
                  {
                    "--mx": "50%",
                    "--my": "50%",
                    "--r": "0px",
                    WebkitMaskImage:
                      "radial-gradient(circle var(--r) at var(--mx) var(--my), transparent 0%, transparent 30%, #000 70%)",
                    maskImage:
                      "radial-gradient(circle var(--r) at var(--mx) var(--my), transparent 0%, transparent 30%, #000 70%)",
                  } as CSSProperties
                }
              >
                <GenerativeCanvas seed={project.slug} className="h-full w-full" />
              </div>
            </div>
          </>
        )
      ) : (
        /* Canvas generativo sticky — permanece visível enquanto o conteúdo rola */
        <div
          aria-hidden
          className="pointer-events-none sticky top-0 hidden h-[calc(100svh-4rem)] lg:block"
          style={{ marginBottom: "calc(-1 * (100svh - 4rem))" }}
        >
          <GenerativeCanvas
            seed={project.slug}
            className="absolute right-0 top-0 h-full w-[54%]"
          />
          <div className="absolute inset-y-0 right-0 w-[54%] bg-gradient-to-r from-bg via-bg/30 to-transparent" />
        </div>
      )}

      {/* z-10 garante renderização acima do canvas */}
      <div className="relative z-10 px-6 py-10 sm:px-10 lg:py-14">
      <div className="relative max-w-2xl">
        <div data-stage-fade className="flex items-center justify-between">
          <Magnetic strength={0.25}>
            <Link
              href={`/?projeto=${project.slug}`}
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

        <p data-stage-fade className="mt-5 text-xl text-accent sm:text-2xl">
          {project.tagline}
        </p>

        <p data-stage-fade className="mt-6 text-ink-muted">
          {project.description}
        </p>

        <dl data-stage-fade className="mt-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-ink-faint">Papel</dt>
            <dd className="mt-0.5 text-ink">{project.role}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Início</dt>
            <dd className="mt-0.5 text-ink">{formatLong(project.startDate)}</dd>
          </div>
          {project.endDate && (
            <div>
              <dt className="text-ink-faint">Conclusão</dt>
              <dd className="mt-0.5 text-ink">{formatLong(project.endDate)}</dd>
            </div>
          )}
        </dl>

        <div data-stage-fade className="mt-6 flex flex-wrap gap-1.5">
          {project.technologies.map((t) => (
            <TechBadge key={t} name={t} />
          ))}
        </div>

        {/* métricas da atração */}
        <div data-stage-fade className="mt-10 grid grid-cols-4 gap-3">
          <StageStat value={stats.deliveries} label="Entregas" />
          <StageStat value={stats.decisions} label="Decisões" />
          <StageStat value={stats.challenges} label="Desafios" />
          <StageStat value={stats.technologies} label="Techs" />
        </div>

        {project.highlights.length > 0 && (
          <div data-stage-fade className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Destaques
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

        {/* História do projeto */}
        {project.story && (
          <>
            {project.story.decisions.length > 0 && (
              <div data-stage-fade className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
                  Decisões
                </h2>
                <div className="mt-4 space-y-3">
                  {project.story.decisions.map((d, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-line bg-bg-card p-4"
                    >
                      <h3 className="font-semibold text-ink">{d.title}</h3>
                      <p className="mt-1.5 text-sm text-ink-muted">
                        {d.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.story.challenges.length > 0 && (
              <div data-stage-fade className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
                  Desafios
                </h2>
                <div className="mt-4 space-y-3">
                  {project.story.challenges.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-line bg-bg-card p-4"
                    >
                      <h3 className="font-semibold text-ink">{c.title}</h3>
                      <p className="mt-1.5 text-sm text-ink-muted">
                        {c.howSolved}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.story.deliveries.length > 0 && (
              <div data-stage-fade className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
                  Entregas
                </h2>
                <ul className="mt-4 space-y-2">
                  {project.story.deliveries.map((d, i) => (
                    <li key={i} className="flex gap-2 text-ink-muted">
                      <span className="text-accent">▸</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {project.story.learning && (
              <div data-stage-fade className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
                  Aprendizado
                </h2>
                <blockquote className="mt-4 border-l-2 border-accent pl-4 text-lg italic text-ink">
                  {project.story.learning}
                </blockquote>
              </div>
            )}
          </>
        )}

        {/* Marcos do projeto */}
        {project.milestones && project.milestones.length > 0 && (
          <div data-stage-fade className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Marcos
            </h2>
            <ol className="mt-4 space-y-3">
              {project.milestones.map((m, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-accent-cyan">
                    {formatLong(m.date)}
                  </span>
                  <div>
                    <span className="text-ink">{m.title}</span>
                    {m.note && (
                      <p className="mt-0.5 text-ink-muted">{m.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
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
