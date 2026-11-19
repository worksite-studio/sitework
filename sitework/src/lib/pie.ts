/**
 * Pure donut/pie geometry — turns `{ label, value }[]` into SVG ring wedges.
 *
 * No chart library: the Overview cost-distribution donut (4.8-B) and anything
 * else that needs a pie builds on these. Kept side-effect-free and rounded to
 * 2dp so paths are stable and unit-testable.
 */

export interface Slice {
  label: string
  value: number
}

export interface Segment extends Slice {
  /** value ÷ total, 0–1. */
  fraction: number
  /** Start angle in degrees, 0 = 12 o'clock, clockwise. */
  startAngle: number
  endAngle: number
  /** SVG `d` for the donut-ring wedge (outer arc → inner arc → close). */
  d: string
}

export interface DonutGeometry {
  cx: number
  cy: number
  /** Outer ring radius. */
  rOuter: number
  /** Inner cut-out radius (0 = a solid pie). */
  rInner: number
}

/**
 * Signed rotation that carries `from` onto `to` the **short way** around the
 * circle — always in the half-open range `(-180, 180]`. Accumulate the result
 * so an animated donut turns the shorter direction instead of unwinding 350°.
 */
export function shortestAngleDelta(from: number, to: number): number {
  let delta = (to - from) % 360
  if (delta <= -180) delta += 360
  else if (delta > 180) delta -= 360
  return delta
}

/** Point on a circle, 0° at 12 o'clock, angle increasing clockwise. */
function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return [round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))]
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Collapse a slice list to the `limit` largest, rolling the remainder into a
 * single `otherLabel` slice. Input is sorted descending by value first; the
 * "Other" slice is appended last (omitted when it would be zero). Slices with a
 * non-positive value are dropped.
 */
export function collapseToTop(slices: Slice[], limit: number, otherLabel = 'Other'): Slice[] {
  const positive = slices.filter((s) => s.value > 0).sort((a, b) => b.value - a.value)
  if (positive.length <= limit) return positive
  const head = positive.slice(0, limit)
  const rest = positive.slice(limit).reduce((s, x) => s + x.value, 0)
  if (rest > 0) head.push({ label: otherLabel, value: rest })
  return head
}

/**
 * Build donut-ring segments for the given slices. Non-positive slices are
 * dropped; order is preserved. Returns `[]` when the total is zero. A lone
 * full-circle slice is rendered as a closed ring (two half-arcs) since a single
 * SVG arc cannot sweep 360°.
 */
export function donutSegments(slices: Slice[], geom: DonutGeometry): Segment[] {
  const { cx, cy, rOuter, rInner } = geom
  const usable = slices.filter((s) => s.value > 0)
  const total = usable.reduce((s, x) => s + x.value, 0)
  if (total <= 0) return []

  const out: Segment[] = []
  let cursor = 0
  for (const s of usable) {
    const fraction = s.value / total
    const startAngle = cursor * 360
    const endAngle = (cursor + fraction) * 360
    cursor += fraction
    out.push({
      ...s,
      fraction,
      startAngle: round(startAngle),
      endAngle: round(endAngle),
      d: ringPath(cx, cy, rOuter, rInner, startAngle, endAngle, fraction),
    })
  }
  return out
}

/** SVG path for one donut-ring wedge between two angles. */
function ringPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
  fraction: number,
): string {
  // A single arc command can't close a full circle — split into two halves.
  if (fraction >= 1) {
    const mid = startAngle + 180
    const oTop = polar(cx, cy, rOuter, startAngle)
    const oMid = polar(cx, cy, rOuter, mid)
    const iTop = polar(cx, cy, rInner, startAngle)
    const iMid = polar(cx, cy, rInner, mid)
    return (
      `M ${oTop[0]} ${oTop[1]} ` +
      `A ${rOuter} ${rOuter} 0 0 1 ${oMid[0]} ${oMid[1]} ` +
      `A ${rOuter} ${rOuter} 0 0 1 ${oTop[0]} ${oTop[1]} Z ` +
      `M ${iTop[0]} ${iTop[1]} ` +
      `A ${rInner} ${rInner} 0 0 1 ${iMid[0]} ${iMid[1]} ` +
      `A ${rInner} ${rInner} 0 0 1 ${iTop[0]} ${iTop[1]} Z`
    )
  }

  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  const oStart = polar(cx, cy, rOuter, startAngle)
  const oEnd = polar(cx, cy, rOuter, endAngle)
  const iEnd = polar(cx, cy, rInner, endAngle)
  const iStart = polar(cx, cy, rInner, startAngle)
  return (
    `M ${oStart[0]} ${oStart[1]} ` +
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${oEnd[0]} ${oEnd[1]} ` +
    `L ${iEnd[0]} ${iEnd[1]} ` +
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iStart[0]} ${iStart[1]} Z`
  )
}
