'use client'

import { useEffect, useRef, useState } from 'react'
import { featureBranchCount, type CommitType } from '@/lib/commits'

// ── Public shapes ────────────────────────────────────────────
export interface GitGraphCommit {
  type: CommitType
  message: string
  date: string
}

export interface GitGraphNode {
  slug: string
  name: string
  accent: string
  year: string
  total: number // total commits in the repo (0 = unknown / below threshold)
  branches: number // branch count from repo metadata
  branchNames: string[] // real branch names (default first)
  commits: GitGraphCommit[] // capped sample, chronological (oldest → newest)
}

// Commit-type → dot color (matches the project's TYPE palette elsewhere).
const DOT_COLOR: Record<CommitType, string> = {
  feat: '#34d399',
  fix: '#fbbf24',
  refactor: '#22d3ee',
}

const RIB_COMMITS = 4 // commits shown on each project's horizontal branch

type Pt = { x: number; y: number }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Scroll-synced git graph — continuous diagonal main with horizontal branches.
 *
 * One "main" line stays unbroken, flowing diagonally down-right and threading
 * every project node (its angle is locked ~30° off vertical regardless of panel
 * height, so it never collapses into a straight vertical line). From each node
 * the project ramifies a STRAIGHT HORIZONTAL branch carrying its commits, and
 * adds short parallel sub-branches by its commit-count level (see
 * featureBranchCount). The last (in-progress) project trails a dashed tail.
 *
 * Everything draws itself from the inherited CSS var `--p` (0→1) the depth
 * engine writes each tick — no per-frame React render. Layout is computed once
 * per size/active change; all animation is pure CSS (transform / opacity /
 * dashoffset). The main reveals across `[--mst, 1]`; each project's branch
 * across its window `[--ba, --ba + --bs]`; dots/nodes appear at their `--t`.
 */
export function GitGraph({ nodes, active }: { nodes: GitGraphNode[]; active: number }) {
  const holderRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

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

  const N = nodes.length
  const { w, h } = size
  const ready = w > 8 && h > 8 && N > 0

  // ── Layout (px space; viewBox matches the container 1:1) ─────
  const pad = 14
  const top = pad
  const usable = Math.max(1, h - pad * 2)

  // Diagonal main kept toward the left so the horizontal branches have room on
  // the right. The vertical span is capped relative to the horizontal travel
  // (≈1.73×) so the main holds a clear ~30° diagonal on any panel height.
  const mainX0 = 16
  const mainX1 = Math.min(Math.max(w * 0.4, 76), w * 0.46)
  const mainTravel = mainX1 - mainX0

  const spanV = Math.min(usable * 0.9, mainTravel * 1.73)
  // Center the (angle-locked) diagonal band in the available height.
  const yA = top + Math.max(usable * 0.04, (usable - spanV) / 2)
  const yB = yA + spanV
  const step = N > 1 ? 1 / (N - 1) : 1
  const aOf = (i: number) => (N > 1 ? i / (N - 1) : 0)
  const mainAt = (t: number): Pt => ({ x: lerp(mainX0, mainX1, t), y: lerp(yA, yB, t) })

  const startT = -0.5 * step // main line lead-in above the first project
  const S0 = mainAt(startT)
  const A = mainAt(0)
  const B = mainAt(1)
  const tailEnd: Pt = {
    x: Math.min(B.x + mainTravel * step, w - 14),
    y: Math.min(yB + spanV * 0.18, top + usable),
  }

  const rightEdge = w - pad - 6

  const segments = nodes.map((node, i) => {
    const a = aOf(i)
    const P = mainAt(a) // node = branch point on the main

    // Horizontal branch carrying the project's commits.
    const k = Math.min(node.commits.length, RIB_COMMITS)
    const room = rightEdge - (P.x + 11)
    const spacing = Math.max(10, Math.min(18, k > 0 ? room / k : 18))
    const dots = Array.from({ length: k }, (_, j) => {
      const g = (j + 1) / (k + 1)
      return {
        x: Math.min(P.x + 11 + j * spacing, rightEdge),
        y: P.y,
        t: a - (1 - g) * 0.7 * step, // staggered, all ≤ a (shown by the time active)
        commit: node.commits[j],
      }
    })
    const ribEndX = k > 0 ? dots[k - 1].x + 6 : P.x + 14
    const ribD = `M ${P.x} ${P.y} L ${ribEndX} ${P.y}`

    // Sub-branches → the repo's "level" by commit total (see featureBranchCount),
    // drawn as short parallel stubs below the main rib. Real branch names label
    // them when available.
    const subCount = featureBranchCount(node.total)
    const subs = Array.from({ length: subCount }, (_, e) => {
      const y = P.y + 7 + e * 6
      const x1 = Math.min(P.x + 8 + 32, rightEdge)
      return {
        d: `M ${P.x + 5} ${y} L ${x1} ${y}`,
        tip: { x: x1, y },
        name: node.branchNames[e + 1] ?? `feature/${e + 1}`,
      }
    })

    return {
      node,
      i,
      P,
      ba: a - 0.85 * step, // branch reveal window
      bs: 0.85 * step,
      nodeT: a === 0 ? -1 : a - 0.1 * step,
      ribD,
      dots,
      subs,
    }
  })

  const cur = nodes[active]

  return (
    <div className="depth-nav-graph">
      <div className="depth-nav-graph-head">
        <p className="depth-nav-label">Git Tree</p>
        {cur && (
          <p className="git-graph-caption">
            <span className="git-graph-dot" style={{ background: cur.accent }} aria-hidden />
            <span className="git-graph-cap-name">{cur.name}</span>
            <span className="git-graph-cap-meta">
              {cur.total > 0 ? `${cur.total} commits` : 'sem commits'}
              {cur.branches > 0
                ? ` · ${cur.branches} ${cur.branches === 1 ? 'branch' : 'branches'}`
                : ''}
            </span>
          </p>
        )}
      </div>

      <div
        ref={holderRef}
        className="git-graph-holder"
        style={
          {
            '--hx0': `${A.x}px`,
            '--hxK': `${B.x - A.x}px`,
            '--hy0': `${A.y}px`,
            '--hyK': `${B.y - A.y}px`,
            '--mst': startT,
            '--mden': 1 - startT,
          } as React.CSSProperties
        }
      >
        {ready && (
          <svg
            className="git-graph"
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            aria-hidden="true"
          >
            {/* Main — continuous diagonal, dim base + bright copy revealed by --p */}
            <line className="trunk-base" x1={S0.x} y1={S0.y} x2={B.x} y2={B.y} />
            <line className="trunk-live" x1={S0.x} y1={S0.y} x2={B.x} y2={B.y} pathLength={1} />
            {/* In-progress tail */}
            <line
              className="spine-tail"
              x1={B.x}
              y1={B.y}
              x2={tailEnd.x}
              y2={tailEnd.y}
              style={{ '--t': Math.max(0, 1 - step * 0.4) } as React.CSSProperties}
            />

            {segments.map((s) => (
              <g
                key={s.node.slug}
                className="git-branch"
                data-active={s.i === active || undefined}
                style={{ '--ba': s.ba, '--bs': s.bs } as React.CSSProperties}
              >
                {/* horizontal branch */}
                <path className="branch" d={s.ribD} pathLength={1} style={{ stroke: s.node.accent }} />

                {/* real extra branches */}
                {s.subs.map((sub, e) => (
                  <g key={`sub-${e}`}>
                    <path
                      className="branch-sub"
                      d={sub.d}
                      pathLength={1}
                      style={{ stroke: s.node.accent }}
                    >
                      <title>{sub.name}</title>
                    </path>
                    <circle
                      className="dot"
                      cx={sub.tip.x}
                      cy={sub.tip.y}
                      r={2.4}
                      style={{ fill: s.node.accent, '--t': s.ba + s.bs } as React.CSSProperties}
                    >
                      <title>{sub.name}</title>
                    </circle>
                  </g>
                ))}

                {/* commits along the horizontal branch */}
                {s.dots.map((dot, di) => (
                  <circle
                    key={di}
                    className="dot"
                    cx={dot.x}
                    cy={dot.y}
                    r={3.3}
                    style={
                      { fill: DOT_COLOR[dot.commit.type], '--t': dot.t } as React.CSSProperties
                    }
                  >
                    <title>{`${dot.commit.type}: ${dot.commit.message} (${dot.commit.date})`}</title>
                  </circle>
                ))}

                {/* project node — the branch point on the main */}
                <circle
                  className="node"
                  cx={s.P.x}
                  cy={s.P.y}
                  r={4.5}
                  style={{ stroke: s.node.accent, '--t': s.nodeT } as React.CSSProperties}
                >
                  <title>{s.node.name}</title>
                </circle>
              </g>
            ))}

            {/* Playhead — rides the diagonal main with --p */}
            <g className="git-head">
              <line className="git-head-tick" x1={0} y1={0} x2={38} y2={0} />
              <circle className="git-head-ring" cx={0} cy={0} r={7} />
              <circle className="git-head-core" cx={0} cy={0} r={2.4} />
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}
