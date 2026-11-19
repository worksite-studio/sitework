import { useEffect, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/formatCurrency'
import { shortestAngleDelta, type Segment } from '@/lib/pie'

interface CostDonutProps {
  /** Ring wedges from `donutSegments` (ordered as the legend lists them). */
  segments: Segment[]
  /** Committed total shown in the centre at rest. */
  total: number
  /** Per-slice colours, indexed to `segments`. */
  ramp: string[]
}

/**
 * Interactive cost-distribution donut (4.8-C).
 *
 * Scrub the legend (hover or keyboard-focus) or wheel over the ring, and the
 * donut rotates so the active segment swings to 12 o'clock and lights up while
 * the rest dim; the centre readout switches to that segment's $ and %. Hovering
 * a ring wedge drives the same selection (reciprocal with the legend).
 *
 * Geometry matches `donutSegments({ cx: 60, cy: 60, rOuter: 56, rInner: 34 })` —
 * a 120×120 viewBox. Rotation accumulates so every turn takes the short way.
 */
export function CostDonut({ segments, total, ramp }: CostDonutProps) {
  const [active, setActive] = useState<number | null>(null)
  const [rotation, setRotation] = useState(0)
  const rotationRef = useRef(0)
  const lastMidRef = useRef(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const n = segments.length

  function mid(seg: Segment): number {
    return (seg.startAngle + seg.endAngle) / 2
  }

  function focus(i: number | null) {
    setActive(i)
    const target = i == null ? 0 : mid(segments[i]!)
    rotationRef.current += shortestAngleDelta(lastMidRef.current, target)
    lastMidRef.current = target
    setRotation(rotationRef.current)
  }

  // Wheel over the donut cycles the selection. Bound non-passively so the page
  // doesn't scroll while the cursor is on the ring.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || n === 0) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const step = e.deltaY > 0 ? 1 : -1
      setActive((prev) => {
        const next = ((prev ?? -1) + step + n) % n
        const target = mid(segments[next]!)
        rotationRef.current += shortestAngleDelta(lastMidRef.current, target)
        lastMidRef.current = target
        setRotation(rotationRef.current)
        return next
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // segments identity changes with the data; n guards the empty case.
  }, [segments, n])

  if (total <= 0) {
    return (
      <div className="flex items-center gap-5">
        <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full border border-dashed border-sw-rule text-center text-[10px] text-sw-faint">
          No committed cost yet
        </div>
      </div>
    )
  }

  const activeSeg = active == null ? null : segments[active]

  return (
    <div className="flex items-center gap-5">
      <div ref={wrapRef} className="shrink-0">
        <svg
          width={140}
          height={140}
          viewBox="0 0 120 120"
          role="img"
          aria-label="Committed cost by code"
        >
          <g
            className="motion-reduce:transition-none"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformBox: 'view-box',
              transformOrigin: '60px 60px',
              // Slow, gently-settling turn (easeOutQuint) — reads smoother than a snappy ease.
              transition: 'transform .8s cubic-bezier(.22,1,.36,1)',
            }}
          >
            {segments.map((seg, i) => (
              <path
                key={seg.label}
                d={seg.d}
                fill={ramp[i % ramp.length]}
                opacity={active == null || active === i ? 1 : 0.3}
                stroke={active === i ? 'var(--sw-ink)' : 'none'}
                strokeWidth={active === i ? 0.75 : 0}
                onMouseEnter={() => focus(i)}
                onMouseLeave={() => focus(null)}
                style={{ cursor: 'pointer', transition: 'opacity .2s' }}
              />
            ))}
          </g>
          {/* Centre readout — outside the rotating group so it stays upright. */}
          <text
            x={60}
            y={56}
            textAnchor="middle"
            className="fill-sw-dim text-[8px] font-semibold uppercase tracking-[0.1em]"
          >
            {activeSeg ? `${(activeSeg.fraction * 100).toFixed(0)}% of spend` : 'Committed'}
          </text>
          <text x={60} y={70} textAnchor="middle" className="fill-sw-ink text-[13px] font-bold">
            {formatCurrency(activeSeg ? activeSeg.value : total)}
          </text>
        </svg>
      </div>

      <ul className="min-w-[160px] space-y-1.5">
        {segments.map((seg, i) => (
          <li key={seg.label}>
            <button
              type="button"
              aria-pressed={active === i}
              onMouseEnter={() => focus(i)}
              onMouseLeave={() => focus(null)}
              onFocus={() => focus(i)}
              onBlur={() => focus(null)}
              className="flex w-full items-center gap-2 rounded-[1px] px-1 py-0.5 text-left text-[11px] transition hover:bg-sw-muted/5 aria-pressed:bg-sw-muted/10"
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[1px]"
                style={{ background: ramp[i % ramp.length] }}
              />
              <span
                className={`truncate text-sw-mid ${active === i ? 'font-semibold text-sw-ink' : ''}`}
                title={seg.label}
              >
                {seg.label}
              </span>
              <span className="ml-auto shrink-0 tabular-nums text-sw-dim">
                {(seg.fraction * 100).toFixed(0)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
