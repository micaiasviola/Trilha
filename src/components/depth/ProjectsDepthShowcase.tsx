'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useDepthScroll } from '@/lib/depth/useDepthScroll'
import { prefersReducedMotion } from '@/lib/anim/signal'
import { STATUS_LABEL, formatLong } from '@/lib/format'
import type { Project } from '@/lib/types'
import { GitTreeVertical } from '@/components/depth/GitTreeVertical'
import type { RepoGraph } from '@/lib/commits'
import { ProjectStack } from '@/components/ProjectStack'
import { ScrollCue } from '@/components/ScrollCue'
import './depthScrollStage.css'

// Auto-advance (attract loop) — cadência do ping-pong e janela de ociosidade
// antes de retomar após o usuário pausar (mover o mouse / rolar / tocar).
const AUTO_INTERVAL_MS = 5000
const AUTO_IDLE_MS = 5000

type ShowcaseProject = Pick<
  Project,
  | 'slug'
  | 'name'
  | 'tagline'
  | 'status'
  | 'role'
  | 'startDate'
  | 'endDate'
  | 'technologies'
  | 'highlights'
  | 'accentColor'
  | 'order'
>

export function ProjectsDepthShowcase({
  projects,
  repoGraphs,
}: {
  projects: ShowcaseProject[]
  repoGraphs?: (RepoGraph | null)[]
}) {
  const [active, setActive] = useState(0)
  // Fixed right-hand nav — receives the live scroll progress as `--p` so the
  // git graph (a descendant) can animate in pure CSS, no per-frame re-render.
  const navRef = useRef<HTMLElement>(null)
  const { ref, engine } = useDepthScroll({
    source: 'capture',
    captureMode: 'always',
    snap: true,
    snapDelay: 120,
    keyboard: true,
    smoothing: 0.16, // settle crisply onto each card (discrete feel)
    wheelStep: true, // 1 gesto de roda = 1 card (não pula direto pro próximo)
    stepGap: 240, // pausa > 240ms entre eventos = novo gesto → próximo card
    stepThreshold: 20, // ignora micro-jitter da roda/trackpad
    wheelSpeed: 1.8, // (fallback contínuo, se wheelStep desligar)
    touchSpeed: 2.4,
    length: projects.length * 520,
    layerCount: projects.length,
    onLayerChange: setActive,
    onUpdate: (s) => {
      navRef.current?.style.setProperty('--p', s.progress.toFixed(4))
    },
  })

  // Auto-scroll = attract loop (cede ao usuário). Dois níveis:
  //  • pauseAuto: mover o mouse / rolar / tocar / teclado ADIAM o avanço; ele
  //    retoma só após AUTO_IDLE_MS sem interação.
  //  • stopAuto: SELECIONAR um projeto (card / timeline / deep-link) PARA de vez.
  const lastInteractRef = useRef(0)
  const autoStoppedRef = useRef(false)
  const dirRef = useRef(1)
  const pauseAuto = () => {
    lastInteractRef.current = performance.now()
  }
  const stopAuto = () => {
    autoStoppedRef.current = true
  }

  // Memória de navegação (Nielsen #6: reconhecer, não lembrar): restaura o
  // projeto ativo a partir de ?projeto=<slug> ao voltar pra Home e PARA o
  // auto-advance (o usuário chegou num projeto específico de propósito).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const slug = params.get('projeto')
    if (!slug) return
    const idx = projects.findIndex((p) => p.slug === slug)
    if (idx > 0) {
      engine.current?.goTo(idx)
      stopAuto()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL on layer change (no history spam)
  useEffect(() => {
    const slug = projects[active]?.slug
    if (!slug) return
    const url = new URL(window.location.href)
    url.searchParams.set('projeto', slug)
    history.replaceState(null, '', url.toString())
  }, [active, projects])

  // Navegação por teclado (setas/espaço/page) = usuário dirigindo → pausa o avanço.
  useEffect(() => {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', ' ', 'Spacebar']
    const onKey = (e: KeyboardEvent) => {
      if (keys.includes(e.key)) lastInteractRef.current = performance.now()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Auto-advance through projects until the user interacts — ping-pong, RM-safe.
  useEffect(() => {
    const count = projects.length
    if (count < 2 || prefersReducedMotion()) return
    const id = setInterval(() => {
      if (autoStoppedRef.current) return // selecionou um projeto → parado de vez
      if (performance.now() - lastInteractRef.current < AUTO_IDLE_MS) return // presente
      const e = engine.current
      if (!e) return
      const cur = e.activeLayer < 0 ? 0 : e.activeLayer
      if (cur >= count - 1) dirRef.current = -1
      else if (cur <= 0) dirRef.current = 1
      e.goTo(cur + dirRef.current)
    }, AUTO_INTERVAL_MS)
    return () => clearInterval(id)
  }, [projects.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = projects[active]

  return (
    <>
      {/* Dica de scroll vertical (SCROLL ↓), ao lado dos cards — desktop */}
      <ScrollCue className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block" />

      {/* Depth stage — wheel/touch captured, keyboard navigable */}
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="depth-stage"
        data-lenis-prevent
        onPointerMove={pauseAuto}
        onWheel={pauseAuto}
        onTouchStart={pauseAuto}
        onPointerDown={pauseAuto}
        style={
          {
            '--count': projects.length,
            height: 'calc(100svh - 4rem)',
          } as React.CSSProperties
        }
        aria-label={`Showcase de projetos — use as setas do teclado para navegar`}
        role="region"
      >
        {projects.map((project, i) => (
          <div
            key={project.slug}
            className="depth-layer"
            style={{ '--i': i } as React.CSSProperties}
            data-active={i === active ? 'true' : undefined}
            aria-hidden={i !== active ? true : undefined}
          >
            {/* Per-project accent atmosphere */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse 90% 80% at 55% 50%, ${
                  project.accentColor ?? '#3c72c6'
                }28, transparent 68%)`,
              }}
            />

            {/* Main content — brutalist info card, nudged toward center */}
            <div className="relative z-10 w-full pl-6 pr-6 sm:pl-10 md:pr-[21rem] lg:pl-[9vw] xl:pl-[13vw]">
              <article
                className="depth-card group relative w-full max-w-md border-2 bg-[#0b0b12] p-6 sm:p-7"
                style={
                  {
                    '--accent': project.accentColor ?? '#3c72c6',
                  } as React.CSSProperties
                }
              >
                {/* Constelação das stacks — salta do centro do card no hover */}
                <ProjectStack technologies={project.technologies} size="hero" />

                {/* header strip */}
                <div className="flex items-center justify-between gap-3">
                  <span className="bg-white px-2 py-0.5 font-mono text-xs font-bold tracking-[0.2em] text-black">
                    {String(i + 1).padStart(2, '0')}/{String(projects.length).padStart(2, '0')}
                  </span>
                  <BrutalStatus
                    status={project.status}
                    label={STATUS_LABEL[project.status] ?? project.status}
                  />
                </div>

                {/* name */}
                <h2 className="mt-5 break-words text-4xl font-extrabold uppercase leading-[0.92] tracking-tight text-white sm:text-5xl">
                  {project.name}
                </h2>

                {/* tagline */}
                <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-base">
                  {project.tagline}
                </p>

                {/* meta */}
                <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t-2 border-white/15 pt-4 font-mono text-[0.7rem]">
                  <div>
                    <dt className="uppercase tracking-wider text-white/35">Papel</dt>
                    <dd className="mt-1 text-white/80">{project.role}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wider text-white/35">Período</dt>
                    <dd className="mt-1 text-white/80">
                      {formatLong(project.startDate)}
                      {project.endDate
                        ? ` → ${formatLong(project.endDate)}`
                        : ' → presente'}
                    </dd>
                  </div>
                </dl>

                {/* tech chips */}
                {project.technologies.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.technologies.slice(0, 5).map((t) => (
                      <span
                        key={t}
                        className="border border-white/25 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide text-white/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA — stretched ::after makes the whole card clickable */}
                <Link
                  href={`/projetos/${project.slug}`}
                  tabIndex={i === active ? 0 : -1}
                  onFocus={stopAuto}
                  className="mt-7 inline-block border-2 border-white bg-white px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black transition-colors duration-150 hover:bg-transparent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white after:absolute after:inset-0 after:content-['']"
                >
                  Ver história →
                </Link>
              </article>
            </div>
          </div>
        ))}
      </div>

      {/* Right panel — project list stacked above the git graph */}
      {current && (
        <div className="depth-right" onPointerMove={pauseAuto}>
        <nav
          ref={navRef}
          className="depth-nav"
          aria-label="Timeline de projetos"
          style={{ '--p': 0 } as React.CSSProperties}
        >
          {/* Timeline list */}
          <div className="depth-nav-timeline">
            <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-widest text-white/25">
              Timeline
            </p>
            <ol className="space-y-0.5">
              {projects.map((p, i) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      stopAuto()
                      engine.current?.goTo(i)
                    }}
                    aria-current={i === active ? 'true' : undefined}
                    className="group flex w-full items-center gap-2.5 px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                        i === active ? 'bg-white/70' : 'bg-white/15 group-hover:bg-white/35'
                      }`}
                    />
                    <span
                      className={`truncate text-xs transition-colors ${
                        i === active
                          ? 'font-medium text-white/90'
                          : 'text-white/30 group-hover:text-white/60'
                      }`}
                    >
                      {p.name}
                    </span>
                    <span
                      className={`ml-auto shrink-0 font-mono text-[0.6rem] transition-colors ${
                        i === active ? 'text-white/45' : 'text-white/15'
                      }`}
                    >
                      {p.startDate.slice(0, 4)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* Compact footer — jump to the active project's full story */}
          <div className="depth-nav-foot">
            <Link
              href={`/projetos/${current.slug}`}
              className="block text-xs text-white/35 transition-colors hover:text-white/65"
            >
              ver detalhe de {current.name} →
            </Link>
          </div>
        </nav>

        {/* Git graph of the active project — below the list */}
        <aside className="depth-vtree" aria-label={`Git tree de ${current.name}`}>
          <GitTreeVertical
            graph={repoGraphs?.[active] ?? null}
            name={current.name}
            accent={current.accentColor ?? '#3c72c6'}
          />
        </aside>
        </div>
      )}
    </>
  )
}

// Brutalist status tag — square dot, hard border, mono uppercase.
function BrutalStatus({ status, label }: { status: string; label: string }) {
  const color =
    status === 'in-progress'
      ? '#22d3ee'
      : status === 'shipped'
        ? '#34d399'
        : '#94a3b8'
  return (
    <span
      className="inline-flex items-center gap-1.5 border-2 px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ borderColor: color, color }}
    >
      <span className="h-1.5 w-1.5" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  )
}
