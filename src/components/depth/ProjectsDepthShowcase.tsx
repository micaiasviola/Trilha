'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDepthScroll } from '@/lib/depth/useDepthScroll'
import { StatusBadge, TechBadge } from '@/components/Badge'
import { STATUS_LABEL, formatLong } from '@/lib/format'
import type { Project } from '@/lib/types'
import './depthScrollStage.css'

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

export function ProjectsDepthShowcase({ projects }: { projects: ShowcaseProject[] }) {
  const [active, setActive] = useState(0)
  const { ref, engine } = useDepthScroll({
    source: 'capture',
    captureMode: 'always',
    snap: true,
    snapDelay: 130,
    keyboard: true,
    smoothing: 0.1, // a bit snappier than the 0.08 default
    wheelSpeed: 1.3, // more travel per notch — less "wading"
    touchSpeed: 2,
    length: projects.length * 700, // shorter depth per layer = more responsive
    layerCount: projects.length,
    onLayerChange: setActive,
  })

  // Read ?projeto=<slug> on mount and navigate to that project
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const slug = params.get('projeto')
    if (!slug) return
    const idx = projects.findIndex((p) => p.slug === slug)
    if (idx > 0) engine.current?.goTo(idx)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL on layer change (no history spam)
  useEffect(() => {
    const slug = projects[active]?.slug
    if (!slug) return
    const url = new URL(window.location.href)
    url.searchParams.set('projeto', slug)
    history.replaceState(null, '', url.toString())
  }, [active, projects])

  const current = projects[active]

  return (
    <>
      {/* Depth stage — wheel/touch captured, keyboard navigable */}
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="depth-stage"
        data-lenis-prevent
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

            {/* Main content — left-aligned, clear of the right nav */}
            <div className="relative z-10 w-full max-w-xl px-8 lg:px-16">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/25">
                {String(i + 1).padStart(2, '0')}&nbsp;/&nbsp;
                {String(projects.length).padStart(2, '0')}
              </p>

              <h2 className="mt-4 break-words text-5xl font-bold leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
                {project.name}
              </h2>

              <p className="mt-4 max-w-sm text-base text-white/50 sm:text-lg">
                {project.tagline}
              </p>

              <div className="mt-5">
                <StatusBadge
                  status={project.status}
                  label={STATUS_LABEL[project.status] ?? project.status}
                />
              </div>

              <Link
                href={`/projetos/${project.slug}`}
                tabIndex={i === active ? 0 : -1}
                className="mt-7 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white/85 backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
              >
                Ver história completa →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed nav overlay — position: fixed in CSS */}
      {current && (
        <nav className="depth-nav" aria-label="Timeline de projetos">
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
                    onClick={() => engine.current?.goTo(i)}
                    aria-current={i === active ? 'true' : undefined}
                    className="group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5"
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

          {/* Active project specs */}
          <div className="depth-nav-specs">
            <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-widest text-white/25">
              Specs
            </p>
            <dl className="space-y-2.5">
              <div>
                <dt className="text-[0.65rem] text-white/25">Papel</dt>
                <dd className="mt-0.5 text-xs text-white/65">{current.role}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] text-white/25">Período</dt>
                <dd className="mt-0.5 text-xs text-white/65">
                  {formatLong(current.startDate)}
                  {current.endDate
                    ? ` → ${formatLong(current.endDate)}`
                    : ' → presente'}
                </dd>
              </div>
            </dl>

            {current.technologies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {current.technologies.slice(0, 5).map((t) => (
                  <TechBadge key={t} name={t} />
                ))}
                {current.technologies.length > 5 && (
                  <span className="self-center text-[0.65rem] text-white/25">
                    +{current.technologies.length - 5}
                  </span>
                )}
              </div>
            )}

            {current.highlights.length > 0 && (
              <ul className="mt-3 space-y-2">
                {current.highlights.slice(0, 2).map((h, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-white/35">
                    <span className="mt-px shrink-0 text-white/40">▸</span>
                    <span className="line-clamp-2">{h}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={`/projetos/${current.slug}`}
              className="mt-4 block text-xs text-white/35 transition-colors hover:text-white/65"
            >
              ver detalhe →
            </Link>
          </div>
        </nav>
      )}
    </>
  )
}
