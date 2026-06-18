'use client'

import { useEffect, useRef, useState } from 'react'
import type { CommitType } from '@/lib/commits'
import './gitStrip.css'

export interface GitStripCommit {
  type: CommitType
  message: string
  date: string
}

// Commit-type → dot color (matches the TYPE palette used elsewhere).
const DOT_COLOR: Record<CommitType, string> = {
  feat: '#34d399',
  fix: '#fbbf24',
  refactor: '#22d3ee',
}

// Cap dots so a long history stays legible on a narrow panel.
const MAX_DOTS = 22

// Nearest scrollable ancestor (the commits <aside> on desktop). null → window.
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let p = el?.parentElement ?? null
  while (p) {
    const oy = getComputedStyle(p).overflowY
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p
    p = p.parentElement
  }
  return null
}

/**
 * Horizontal git strip, synced to the commits panel scroll.
 *
 * A single trunk runs left→right; each commit is a dot colored by type and a
 * HEAD marker travels along it. As you scroll the commits feed the strip
 * "draws itself" — driven entirely by the CSS var `--p` (0→1) written once per
 * rAF tick. No per-frame React render: layout is computed once per size change
 * and every animated property is pure CSS (transform / opacity / dashoffset).
 *
 * Desktop-only (`hidden lg:block`): on lg+ the commits <aside> is its own
 * scroll container, so the strip can pin below the panel header and animate
 * cleanly against that scroll.
 */
export function ProjectGitStrip({
  commits,
  accent = '#3c72c6',
  total = 0,
  branches = 0,
}: {
  commits: GitStripCommit[]
  accent?: string
  total?: number
  branches?: number
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  // Re-detect the scroll container when crossing the lg breakpoint.
  const [wide, setWide] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Measure the SVG holder (1:1 with the viewBox).
  useEffect(() => {
    const el = holderRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Scroll → single `--p` (0→1). rAF-throttled, one CSS var write per tick.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const scroller = getScrollParent(el)
    let raf = 0
    const measure = () => {
      raf = 0
      let p = 1 // nothing to scroll → reveal fully
      if (scroller) {
        const max = scroller.scrollHeight - scroller.clientHeight
        if (max > 1) p = scroller.scrollTop / max
      } else {
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        if (max > 1) p = window.scrollY / max
      }
      el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    const target: HTMLElement | Window = scroller ?? window
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    measure()
    return () => {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [wide, commits.length])

  const { w, h } = size
  const ready = w > 8 && h > 8 && commits.length > 0

  // ── Layout (px space; viewBox matches the holder 1:1) ────────
  const padX = 18
  const x0 = padX
  const x1 = Math.max(x0 + 1, w - padX)
  const y = Math.round(h * 0.5)
  const span = x1 - x0

  // Feed order is newest→oldest, so left = newest (top of the feed), right =
  // oldest. The playhead starts left at p=0 and moves right as you scroll down.
  const dots = commits.slice(0, MAX_DOTS)
  const N = dots.length
  const xOf = (i: number) => (N > 1 ? x0 + (span * i) / (N - 1) : x0)
  const tOf = (i: number) => (N > 1 ? i / (N - 1) : 0)

  return (
    <div
      ref={rootRef}
      className="git-strip hidden border-b border-line bg-bg lg:block"
      style={{ '--accent': accent } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 px-5 pb-1 pt-3">
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-faint">
          Git Tree
        </span>
        <span className="ml-auto font-mono text-[0.6rem] text-ink-faint">
          {total > 0 ? `${total} commits` : `${commits.length} commits`}
          {branches > 0 ? ` · ${branches} ${branches === 1 ? 'branch' : 'branches'}` : ''}
        </span>
      </div>

      <div
        ref={holderRef}
        className="relative h-12"
        style={{ '--head0': `${x0}px`, '--headK': `${span}px` } as React.CSSProperties}
      >
        {ready && (
          <svg
            className="git-strip-svg"
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            aria-hidden="true"
          >
            {/* Trunk — dim base + bright "live" copy drawn by --p */}
            <line className="strip-trunk-base" x1={x0} y1={y} x2={x1} y2={y} />
            <line
              className="strip-trunk-live"
              x1={x0}
              y1={y}
              x2={x1}
              y2={y}
              pathLength={1}
            />

            {dots.map((c, i) => (
              <circle
                key={i}
                className="strip-dot"
                cx={xOf(i)}
                cy={y}
                r={3.6}
                style={{ fill: DOT_COLOR[c.type], '--t': tOf(i) } as React.CSSProperties}
              >
                <title>{`${c.type}: ${c.message} (${c.date})`}</title>
              </circle>
            ))}

            {/* Playhead — travels along the trunk with --p */}
            <g className="git-strip-head">
              <line className="git-strip-head-tick" x1={0} y1={y - 10} x2={0} y2={y + 10} />
              <circle className="git-strip-head-ring" cx={0} cy={y} r={7} />
              <circle className="git-strip-head-core" cx={0} cy={y} r={2.4} />
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}
