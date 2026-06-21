'use client'

import type { RepoGraph } from '@/lib/commits'
import './gitTreeVertical.css'

// Per-lane colors (lane 0 = project accent; the rest cycle this palette).
const LANE_COLORS = ['#22d3ee', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#60a5fa', '#fb923c']

const GX = 10 // left padding (room for left-side branches)
const LANE_W = 15 // horizontal step per lane depth
const ROW = 18 // row height (zoomed out a touch)
const TOP = 12
const PAD = 12
const DOT_R = 4
const MSG_GAP = 10
const MSG_W = 168
const STEP = 0.04 // reveal stagger per row (s)

const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const f = (n: number) => n.toFixed(1)

/**
 * Vertical git graph — a real "railroad" like a git client, branching to BOTH
 * sides of a central trunk.
 *
 * Commits go newest → oldest (top → bottom). A lane-assignment pass over the real
 * DAG places each commit in a lane; lane 0 is the central trunk, odd lanes fan
 * RIGHT and even lanes fan LEFT. Only FIRST-PARENT edges are drawn (so branches
 * fork off and stay open — merge points are NOT reconnected). Each lane has its
 * own color. Short messages on the right. Static SVG; no per-frame cost.
 */
export function GitTreeVertical({
  graph,
  name,
  accent = '#3c72c6',
}: {
  graph: RepoGraph | null
  name: string
  accent?: string
}) {
  const commits = graph?.commits ?? []
  if (!graph || commits.length === 0) {
    return (
      <div className="gtv">
        <p className="gtv-head">
          <span className="gtv-dot" style={{ background: accent }} aria-hidden />
          <span className="gtv-name">{name}</span>
        </p>
        <p className="gtv-empty">sem dados de git</p>
      </div>
    )
  }

  const laneColor = (l: number) => (l === 0 ? accent : LANE_COLORS[l % LANE_COLORS.length])
  const inSet = new Set(commits.map((c) => c.sha))

  // ── lane assignment (top = newest) ──
  const place = new Map<string, { lane: number; row: number }>()
  const active: (string | null)[] = []
  commits.forEach((c, row) => {
    let lane = active.indexOf(c.sha)
    if (lane === -1) {
      lane = active.indexOf(null)
      if (lane === -1) {
        lane = active.length
        active.push(null)
      }
    }
    for (let i = 0; i < active.length; i++) if (active[i] === c.sha && i !== lane) active[i] = null
    const inParents = c.parents.filter((p) => inSet.has(p))
    if (inParents.length === 0) {
      active[lane] = null
    } else {
      active[lane] = inParents[0]
      for (let pi = 1; pi < inParents.length; pi++) {
        let nl = active.indexOf(null)
        if (nl === -1) {
          nl = active.length
          active.push(null)
        }
        active[nl] = inParents[pi]
      }
    }
    place.set(c.sha, { lane, row })
  })

  // lanes fan to both sides: odd → right, even → left; depth = ceil(lane/2)
  const lanesUsed = new Set([...place.values()].map((p) => p.lane))
  let maxLeft = 0
  let maxRight = 0
  for (const l of lanesUsed) {
    if (l === 0) continue
    const depth = Math.ceil(l / 2)
    if (l % 2 === 1) maxRight = Math.max(maxRight, depth)
    else maxLeft = Math.max(maxLeft, depth)
  }
  const CENTER = GX + maxLeft * LANE_W
  const laneX = (l: number) =>
    l === 0 ? CENTER : CENTER + (l % 2 === 1 ? 1 : -1) * Math.ceil(l / 2) * LANE_W
  const y = (row: number) => TOP + row * ROW
  const msgX = CENTER + maxRight * LANE_W + DOT_R + MSG_GAP
  const W = msgX + MSG_W
  const H = TOP + commits.length * ROW + PAD

  return (
    <div className="gtv">
      <p className="gtv-head">
        <span className="gtv-dot" style={{ background: accent }} aria-hidden />
        <span className="gtv-name">{name}</span>
        <span className="gtv-meta">
          {graph.total > 0 ? `${graph.total} commits` : 'sem commits'}
          {graph.branchCount > 0
            ? ` · ${graph.branchCount} ${graph.branchCount === 1 ? 'branch' : 'branches'}`
            : ''}
        </span>
      </p>

      <svg
        key={name}
        className="gtv-svg"
        width={W}
        height={H}
        viewBox={`0 0 ${f(W)} ${f(H)}`}
        role="img"
        aria-label={`Git graph de ${name}: ${graph.total} commits, ${graph.branchCount} branches`}
      >
        {/* edges (under the dots): FIRST-PARENT only — forks stay, merges open */}
        {commits.map((c) => {
          const me = place.get(c.sha)!
          const ps = c.parents[0]
          if (!ps) return null
          const xc = laneX(me.lane)
          const yc = y(me.row)
          const dv = { '--d': `${(me.row * STEP).toFixed(2)}s` } as React.CSSProperties
          const par = place.get(ps)
          if (!par) {
            return (
              <path
                key={c.sha}
                className="gtv-edge gtv-edge-stub"
                d={`M ${f(xc)} ${f(yc)} L ${f(xc)} ${f(yc + ROW * 0.8)}`}
                style={{ ...dv, stroke: laneColor(me.lane) }}
              />
            )
          }
          const xp = laneX(par.lane)
          const yp = y(par.row)
          const d =
            xc === xp
              ? `M ${f(xc)} ${f(yc)} L ${f(xp)} ${f(yp)}`
              : `M ${f(xc)} ${f(yc)} C ${f(xc)} ${f((yc + yp) / 2)} ${f(xp)} ${f((yc + yp) / 2)} ${f(xp)} ${f(yp)}`
          return (
            <path
              key={c.sha}
              className="gtv-edge"
              d={d}
              pathLength={1}
              style={{ ...dv, stroke: laneColor(me.lane) }}
            />
          )
        })}

        {/* commit dots + message */}
        {commits.map((c) => {
          const me = place.get(c.sha)!
          const dv = { '--d': `${(me.row * STEP).toFixed(2)}s` } as React.CSSProperties
          return (
            <g key={c.sha}>
              <circle
                className="gtv-node"
                cx={laneX(me.lane)}
                cy={y(me.row)}
                r={DOT_R}
                style={{ ...dv, fill: laneColor(me.lane) }}
              >
                <title>{`${c.type}: ${c.message} (${c.date})`}</title>
              </circle>
              <text className="gtv-msg" x={msgX} y={y(me.row)} style={dv}>
                {trunc(c.message, 28)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
