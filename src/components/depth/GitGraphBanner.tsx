'use client'

import { useEffect, useRef } from 'react'
import { featureBranchCount, type CommitType } from '@/lib/commits'
import './gitGraphBanner.css'

// Commit-type → dot color (same palette used across the project).
const DOT_COLOR: Record<CommitType, string> = {
  feat: '#34d399',
  fix: '#fbbf24',
  refactor: '#22d3ee',
}

// viewBox space — the SVG scales to its container width (height stays in ratio).
const VB_W = 1200
const VB_H = 360
const MAIN_Y = 180
const X0 = 80
const X1 = 1120
const LANE_TOP = 80
const LANE_BOTTOM = 280
const DRAW_S = 1.2 // trunk draw duration (s) — also the left→right cascade clock

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const xAt = (f: number) => lerp(X0, X1, f)
const fxOf = (x: number) => (x - X0) / (X1 - X0) // x → 0..1 progress fraction
const DEFAULT_TYPES: CommitType[] = ['feat', 'feat', 'fix', 'feat', 'refactor', 'feat']

/** SVG path for a 5-pointed star centered at (cx, cy) with outer radius r. */
function starPath(cx: number, cy: number, r: number): string {
  const inner = r * 0.42
  let d = ''
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner
    const ang = (Math.PI / 5) * i - Math.PI / 2
    d += `${i === 0 ? 'M' : 'L'} ${(cx + Math.cos(ang) * rad).toFixed(2)} ${(
      cy +
      Math.sin(ang) * rad
    ).toFixed(2)} `
  }
  return `${d}Z`
}

/** Nearest scrollable ancestor (the commits <aside> on the project page). */
function getScrollParent(el: Element | null): HTMLElement | null {
  let p = el?.parentElement ?? null
  while (p) {
    const oy = getComputedStyle(p).overflowY
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p
    p = p.parentElement
  }
  return null
}

export interface GitGraphBannerProps {
  /** Total commits in the repo → drives how many feature branches appear. */
  total: number
  /** Accent for the trunk/branches. Defaults to the project blue. */
  accent?: string
  /** Optional real commit types, used to color the dots (cycled if shorter). */
  commitTypes?: CommitType[]
  /**
   * When true, the tree starts fully drawn and DARKENS from right (newest) to
   * left (oldest) as the nearest scrollable ancestor scrolls into older commits
   * (driven by `--p`) — a "rewind through time" tied to the commit feed, instead
   * of playing once on mount.
   */
  scrollSync?: boolean
  className?: string
}

/**
 * Generative git graph drawn as a TREE.
 *
 * The number of feature branches is the repo's "level" by commit total
 * (see {@link featureBranchCount}): 1→5 as the count grows (0 when there is no
 * data). A straight `main` trunk runs left→right; each feature forks off it into
 * an alternating top/bottom lane, carries its commits, and ENDS in a star — it
 * does NOT merge back, so the trunk sprouts branches like a tree.
 *
 * Two reveal modes, both pure CSS (see `gitGraphBanner.css`):
 *  • default — plays once on mount, timed via a per-element `--d` delay;
 *  • `scrollSync` — starts fully drawn; a mask hides it right→left as `--p`
 *    (0→1) grows with scroll into older commits (a time "rewind").
 * Honors `prefers-reduced-motion` (shows the final frame). Layout is fixed
 * viewBox units that scale to the container width — no per-frame React render.
 */
export function GitGraphBanner({
  total,
  accent = '#3c72c6',
  commitTypes,
  scrollSync = false,
  className,
}: GitGraphBannerProps) {
  const rootRef = useRef<SVGSVGElement>(null)

  // Scroll-sync: write a single `--p` (0→1) from the scroll position, one CSS
  // var per rAF tick. All reveal is pure CSS off `--p`. No per-frame React render.
  useEffect(() => {
    if (!scrollSync) return
    const el = rootRef.current
    if (!el) return
    const scroller = getScrollParent(el)
    let raf = 0
    const measure = () => {
      raf = 0
      let p = 0 // nothing to scroll → stay fully drawn (p grows ⇒ darker)
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
  }, [scrollSync, total])

  const featCount = featureBranchCount(total)
  const types = commitTypes && commitTypes.length > 0 ? commitTypes : DEFAULT_TYPES
  const typeAt = (i: number): CommitType => types[i % types.length]

  // Feature branches form a TREE: each forks off the main at a staggered point,
  // rises into an alternating top/bottom lane, carries its commits, and ENDS in
  // a star (no return to main). Spans are staggered so 1–5 branches never touch.
  const fSpan = 0.62 / Math.max(featCount, 1)
  const features = Array.from({ length: featCount }, (_, e) => {
    const forkF = 0.16 + e * fSpan
    const tipF = forkF + fSpan * 0.7
    const laneY = e % 2 === 0 ? LANE_TOP : LANE_BOTTOM
    const forkX = xAt(forkF)
    const tipX = xAt(tipF)

    // fork → rise → flat lane, ending at the tip (no fall back to main).
    const rise = (tipX - forkX) * 0.3
    const aX = forkX + rise // where the branch reaches its lane
    const k = rise * 0.5 // bezier handle length
    const d =
      `M ${forkX} ${MAIN_Y} ` +
      `C ${forkX + k} ${MAIN_Y} ${aX - k} ${laneY} ${aX} ${laneY} ` +
      `L ${tipX} ${laneY}`

    const lineDelay = forkF * DRAW_S
    // Commits along the flat lane, leaving room at the tip for the star. Count
    // fits the available width (min 1, up to 6) so longer branches carry more.
    const dotEnd = Math.max(aX + 1, tipX - 22)
    const nDots = Math.max(1, Math.min(6, Math.floor((dotEnd - aX) / 24) + 1))
    const dots = Array.from({ length: nDots }, (_, di) => {
      const t = nDots > 1 ? di / (nDots - 1) : 0
      const x = lerp(aX, dotEnd, t)
      return {
        x,
        y: laneY,
        type: typeAt(e * 7 + di + 3),
        delay: lineDelay + 0.2 + t * 0.5,
        prog: fxOf(x),
      }
    })

    return {
      d,
      lineDelay,
      bstart: forkF,
      blen: tipF - forkF,
      star: { x: tipX, y: laneY, delay: lineDelay + 0.6, prog: tipF },
      dots,
    }
  })

  // Main commit dots along the trunk — a few more as the repo grows.
  const mainDotCount = 4 + featCount
  const mainDots = Array.from({ length: mainDotCount }, (_, i) => {
    const f = (i + 0.5) / mainDotCount
    return { x: xAt(f), y: MAIN_Y, type: typeAt(i), delay: f * DRAW_S + 0.1, prog: f }
  })

  // Per-element CSS vars: time (`--d`/`--dur`) drives the on-mount animation;
  // progress (`--t`, `--bstart`+`--blen`) drives the scroll-synced reveal.
  const lineStyle = (delay: number, dur: number, bstart: number, blen: number) =>
    ({
      '--d': `${delay.toFixed(3)}s`,
      '--dur': `${dur}s`,
      '--bstart': bstart.toFixed(4),
      '--blen': Math.max(blen, 0.0001).toFixed(4),
    }) as React.CSSProperties
  const popStyle = (delay: number, prog: number) =>
    ({ '--d': `${delay.toFixed(3)}s`, '--t': prog.toFixed(4) }) as React.CSSProperties

  return (
    <svg
      ref={rootRef}
      className={`gg-banner${scrollSync ? ' is-scroll' : ''}${className ? ` ${className}` : ''}`}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Git graph: ${total} commits, ${featCount} ${
        featCount === 1 ? 'ramificação' : 'ramificações'
      }`}
    >
      {/* Trunk (main) */}
      <path
        className="gg-line"
        d={`M ${X0} ${MAIN_Y} H ${X1}`}
        stroke={accent}
        strokeWidth={3}
        pathLength={1}
        style={lineStyle(0, DRAW_S, 0, 1)}
      />

      {/* Feature branches */}
      {features.map((f, e) => (
        <g key={e}>
          <path
            className="gg-line"
            d={f.d}
            stroke={accent}
            strokeWidth={2.5}
            strokeOpacity={0.55}
            pathLength={1}
            style={lineStyle(f.lineDelay, 0.7, f.bstart, f.blen)}
          />
          {f.dots.map((dot, di) => (
            <circle
              key={di}
              className="gg-pop"
              cx={dot.x}
              cy={dot.y}
              r={6.5}
              fill={DOT_COLOR[dot.type]}
              stroke="#0a0e14"
              strokeWidth={2.5}
              style={popStyle(dot.delay, dot.prog)}
            />
          ))}
          {/* branch tip — a star (the branch ends here; it does not merge back) */}
          <path
            className="gg-pop"
            d={starPath(f.star.x, f.star.y, 9)}
            fill="#fbbf24"
            stroke="#0a0e14"
            strokeWidth={1.5}
            strokeLinejoin="round"
            style={popStyle(f.star.delay, f.star.prog)}
          />
        </g>
      ))}

      {/* Main commit dots */}
      {mainDots.map((dot, i) => (
        <circle
          key={i}
          className="gg-pop"
          cx={dot.x}
          cy={dot.y}
          r={6.5}
          fill={DOT_COLOR[dot.type]}
          stroke="#0a0e14"
          strokeWidth={2.5}
          style={popStyle(dot.delay, dot.prog)}
        />
      ))}

      {/* Scroll "rewind": a bg cover that grows from the right (newest) toward
          the left (oldest) as you scroll into older commits. CSS sizes it via --p. */}
      {scrollSync && (
        <>
          <defs>
            <linearGradient id="gg-fade-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0a0e14" stopOpacity="0" />
              <stop offset="0.18" stopColor="#0a0e14" stopOpacity="1" />
              <stop offset="1" stopColor="#0a0e14" stopOpacity="1" />
            </linearGradient>
          </defs>
          <rect
            className="gg-fade"
            x={0}
            y={0}
            width={VB_W}
            height={VB_H}
            fill="url(#gg-fade-grad)"
          />
        </>
      )}
    </svg>
  )
}
