import { describe, expect, it } from 'vitest'
import { collapseToTop, donutSegments, shortestAngleDelta, type Slice } from './pie'

const geom = { cx: 50, cy: 50, rOuter: 40, rInner: 24 }

describe('collapseToTop', () => {
  it('returns slices untouched (sorted desc) when within the limit', () => {
    const r = collapseToTop(
      [
        { label: 'a', value: 1 },
        { label: 'b', value: 3 },
      ],
      6,
    )
    expect(r.map((s) => s.label)).toEqual(['b', 'a'])
  })

  it('rolls the tail into an Other slice beyond the limit', () => {
    const slices: Slice[] = [
      { label: 'a', value: 10 },
      { label: 'b', value: 8 },
      { label: 'c', value: 6 },
      { label: 'd', value: 4 },
      { label: 'e', value: 2 },
    ]
    const r = collapseToTop(slices, 3)
    expect(r).toHaveLength(4)
    expect(r.map((s) => s.label)).toEqual(['a', 'b', 'c', 'Other'])
    expect(r[3]!.value).toBe(6) // 4 + 2
  })

  it('drops non-positive slices', () => {
    const r = collapseToTop(
      [
        { label: 'a', value: 5 },
        { label: 'zero', value: 0 },
        { label: 'neg', value: -3 },
      ],
      6,
    )
    expect(r.map((s) => s.label)).toEqual(['a'])
  })
})

describe('donutSegments', () => {
  it('returns [] when the total is zero', () => {
    expect(donutSegments([{ label: 'a', value: 0 }], geom)).toEqual([])
  })

  it('splits the ring into fractions that sum to 1 and sweep 360°', () => {
    const segs = donutSegments(
      [
        { label: 'a', value: 1 },
        { label: 'b', value: 1 },
        { label: 'c', value: 2 },
      ],
      geom,
    )
    expect(segs).toHaveLength(3)
    expect(segs[0]!.fraction).toBeCloseTo(0.25)
    expect(segs[2]!.fraction).toBeCloseTo(0.5)
    const sum = segs.reduce((s, x) => s + x.fraction, 0)
    expect(sum).toBeCloseTo(1)
    expect(segs[0]!.startAngle).toBe(0)
    expect(segs[2]!.endAngle).toBe(360)
  })

  it('emits a wedge path with both outer and inner arcs', () => {
    const segs = donutSegments(
      [
        { label: 'a', value: 1 },
        { label: 'b', value: 1 },
      ],
      geom,
    )
    // two arc commands (outer + inner) per wedge, not a full-circle split
    expect(segs[0]!.d.match(/A /g)).toHaveLength(2)
    expect(segs[0]!.d.startsWith('M ')).toBe(true)
    expect(segs[0]!.d.endsWith('Z')).toBe(true)
  })

  it('sets the large-arc flag for a slice over half the ring', () => {
    const segs = donutSegments(
      [
        { label: 'big', value: 3 },
        { label: 'small', value: 1 },
      ],
      geom,
    )
    // big = 270° → large-arc flag 1
    expect(segs[0]!.d).toContain('0 1 1')
    // small = 90° → large-arc flag 0
    expect(segs[1]!.d).toContain('0 0 1')
  })

  it('renders a lone full-circle slice as a closed ring (four arcs)', () => {
    const segs = donutSegments([{ label: 'only', value: 5 }], geom)
    expect(segs).toHaveLength(1)
    expect(segs[0]!.fraction).toBe(1)
    // two half-arcs outer + two half-arcs inner
    expect(segs[0]!.d.match(/A /g)).toHaveLength(4)
  })
})

describe('shortestAngleDelta', () => {
  it('is zero for a no-op', () => {
    expect(shortestAngleDelta(90, 90)).toBe(0)
  })

  it('turns forward for a small positive step', () => {
    expect(shortestAngleDelta(30, 90)).toBe(60)
  })

  it('turns backward rather than the long way round', () => {
    // 350° → 10° is +20° the short way, not −340°
    expect(shortestAngleDelta(350, 10)).toBe(20)
    // 10° → 350° is −20°, not +340°
    expect(shortestAngleDelta(10, 350)).toBe(-20)
  })

  it('normalises angles outside 0–360 first', () => {
    expect(shortestAngleDelta(0, 720)).toBe(0)
    expect(shortestAngleDelta(-10, 10)).toBe(20)
  })

  it('keeps the result within (-180, 180]', () => {
    expect(shortestAngleDelta(0, 180)).toBe(180)
    expect(shortestAngleDelta(0, 181)).toBe(-179)
  })
})
