import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTableSort } from './useTableSort'

interface Row {
  name: string
  amount: number
  due: string | null
}

const rows: Row[] = [
  { name: 'Beta', amount: 300, due: '2025-03-01' },
  { name: 'alpha', amount: 100, due: null },
  { name: 'Gamma', amount: 200, due: '2025-01-15' },
]

const accessors = {
  name: (r: Row) => r.name,
  amount: (r: Row) => r.amount,
  due: (r: Row) => r.due,
}

describe('useTableSort', () => {
  it('returns rows untouched until a column is chosen', () => {
    const { result } = renderHook(() => useTableSort(rows, accessors))
    expect(result.current.sorted.map((r) => r.name)).toEqual(['Beta', 'alpha', 'Gamma'])
    expect(result.current.sort).toEqual({ key: null, dir: 'asc' })
  })

  it('sorts numbers numerically ascending, then flips to descending', () => {
    const { result } = renderHook(() => useTableSort(rows, accessors))
    act(() => result.current.toggle('amount'))
    expect(result.current.sorted.map((r) => r.amount)).toEqual([100, 200, 300])
    expect(result.current.indicator('amount')).toBe(' ↑')
    act(() => result.current.toggle('amount'))
    expect(result.current.sorted.map((r) => r.amount)).toEqual([300, 200, 100])
    expect(result.current.indicator('amount')).toBe(' ↓')
  })

  it('sorts strings case-insensitively by locale', () => {
    const { result } = renderHook(() => useTableSort(rows, accessors))
    act(() => result.current.toggle('name'))
    expect(result.current.sorted.map((r) => r.name)).toEqual(['alpha', 'Beta', 'Gamma'])
  })

  it('always sorts nullish values last, regardless of direction', () => {
    const { result } = renderHook(() => useTableSort(rows, accessors))
    act(() => result.current.toggle('due'))
    expect(result.current.sorted.map((r) => r.due)).toEqual(['2025-01-15', '2025-03-01', null])
    act(() => result.current.toggle('due')) // desc
    expect(result.current.sorted.map((r) => r.due)).toEqual(['2025-03-01', '2025-01-15', null])
  })

  it('exposes aria-sort for the active column only', () => {
    const { result } = renderHook(() => useTableSort(rows, accessors))
    act(() => result.current.toggle('name'))
    expect(result.current.ariaSort('name')).toBe('ascending')
    expect(result.current.ariaSort('amount')).toBe('none')
  })
})
