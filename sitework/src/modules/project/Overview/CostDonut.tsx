import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/formatCurrency'
import { shortestAngleDelta, violetRamp, type Segment } from '@/lib/pie'

interface CostDonutProps {
  /** Ring wedges from `donutSegments` (ordered as the legend lists them). */
  segments: Segment[]
  /** Total shown in the centre at rest. */
  total: number
  /** Centre label at rest (e.g. "Committed", "Budget"). */
  restLabel?: string
  /** Suffix on the active readout — "35% {shareLabel}" (e.g. "of spend"). */
  shareLabel?: string
  /** Accessible label for the ring. */
  ariaLabel?: string
  /**
   * Controlled selection by segment `key` (a cost-code id). When `onSelect` is
   * provided the component is controlled — selection lives in the parent, so a
   * table and the donut can highlight each other. Uncontrolled otherwise.
   */
  selectedKey?: string | null
  onSelect?: (key: string | null) => void
}

/**
 * Interactive cost donut (4.8-C, generalised 4.8-F).
 *
 * Scrub the legend (hover or keyboard-focus) and the donut rotates so the active
 * segment swings to 12 o'clock and lights up while the rest dim; the centre
 * readout switches to that segment's value + share. (No wheel capture — it would
 * trap page scroll when the donut sits near the top of a tab.)
 *
 * The segment list may be the FULL cost-code index (via `donutSegments(…,
 * { includeZero: true })`) — zero-value codes have no arc but still appear in
 * the scrollable legend for navigation. In controlled mode (`onSelect`) the
 * selection is lifted to the parent so a linked table highlights in step.
 *
 * Geometry matches `donutSegments({ cx: 60, cy: 60, rOuter: 56, rInner: 34 })`.
 */
export function CostDonut({
  segments,
  total,
  restLabel = 'Committed',
  shareLabel = 'of spend',
  ariaLabel = 'Committed cost by code',
  selectedKey,
  onSelect,
}: CostDonutProps) {
  const controlled = onSelect !== undefined
  const [internalActive, setInternalActive] = useState<number | null>(null)
  const [rotation, setRotation] = useState(0)
  const rotationRef = useRef(0)
  const lastMidRef = useRef(0)
  const listRef = useRef<HTMLUListElement>(null)
  const ramp = violetRamp(segments.length)

  const mid = (seg: Segment) => (seg.startAngle + seg.endAngle) / 2

  // Resolve the active index — from the controlled key, or internal state.
  const controlledIdx =
    selectedKey == null ? null : segments.findIndex((s) => s.key === selectedKey)
  const active = controlled
    ? controlledIdx != null && controlledIdx >= 0
      ? controlledIdx
      : null
    : internalActive

  // Rotation follows the active index (short way round), for both modes.
  useEffect(() => {
    const target = active == null ? 0 : mid(segments[active]!)
    rotationRef.current += shortestAngleDelta(lastMidRef.current, target)
    lastMidRef.current = target
    setRotation(rotationRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Keep the active legend row in view when driven by wheel/keyboard.
  useLayoutEffect(() => {
    if (active == null || !listRef.current) return
    const row = listRef.current.children[active] as HTMLElement | undefined
    row?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function focus(i: number | null) {
    if (controlled) onSelect!(i == null ? null : (segments[i]?.key ?? null))
    else setInternalActive(i)
  }

  if (total <= 0) {
    return (
      <div className="flex items-center gap-5">
        <div className="flex h-[180px] w-[180px] items-center justify-center rounded-full border border-dashed border-sw-rule text-center text-[10px] text-sw-faint">
          Nothing to show yet
        </div>
      </div>
    )
  }

  const activeSeg = active == null ? null : segments[active]

  return (
    <div className="flex items-center gap-5">
      <div className="shrink-0">
        <svg width={180} height={180} viewBox="0 0 120 120" role="img" aria-label={ariaLabel}>
          <g
            className="motion-reduce:transition-none"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformBox: 'view-box',
              transformOrigin: '60px 60px',
              transition: 'transform .8s cubic-bezier(.22,1,.36,1)',
            }}
          >
            {segments.map((seg, i) =>
              seg.d ? (
                <path
                  key={seg.key ?? seg.label}
                  d={seg.d}
                  fill={ramp[i % ramp.length]}
                  opacity={active == null || active === i ? 1 : 0.3}
                  stroke={active === i ? 'var(--sw-ink)' : 'none'}
                  strokeWidth={active === i ? 0.75 : 0}
                  onMouseEnter={() => focus(i)}
                  onMouseLeave={() => focus(null)}
                  style={{ cursor: 'pointer', transition: 'opacity .2s' }}
                />
              ) : null,
            )}
          </g>
          {/* Centre readout — outside the rotating group so it stays upright. */}
          <text
            x={60}
            y={56}
            textAnchor="middle"
            className="fill-sw-dim text-[6px] font-semibold uppercase tracking-[0.1em]"
          >
            {activeSeg ? `${(activeSeg.fraction * 100).toFixed(0)}% ${shareLabel}` : restLabel}
          </text>
          <text x={60} y={70} textAnchor="middle" className="fill-sw-ink text-[13px] font-bold">
            {formatCurrency(activeSeg ? activeSeg.value : total)}
          </text>
        </svg>
      </div>

      <ul ref={listRef} className="max-h-[180px] min-w-[180px] space-y-1.5 overflow-y-auto pr-1">
        {segments.map((seg, i) => (
          <li key={seg.key ?? seg.label}>
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
                style={{
                  background: seg.d ? ramp[i % ramp.length] : 'transparent',
                  border: seg.d ? 'none' : '1px solid var(--sw-rule)',
                }}
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
