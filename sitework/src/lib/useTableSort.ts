import { useCallback, useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'
export type SortValue = string | number | null | undefined

export interface SortState<K extends string> {
  key: K | null
  dir: SortDir
}

export interface UseTableSort<T, K extends string> {
  /** Rows in current sort order (original order when no key is active). */
  sorted: T[]
  /** Current sort key + direction. */
  sort: SortState<K>
  /** Click a column: activate it ascending, or flip direction if already active. */
  toggle: (key: K) => void
  /** " ↑" / " ↓" for the active column, else "" — for header captions. */
  indicator: (key: K) => string
  /** aria-sort value for a header cell. */
  ariaSort: (key: K) => 'ascending' | 'descending' | 'none'
}

/**
 * Generic client-side table sort — Phase 4.5-E. Give it the rows and a map of
 * column key → value accessor; it returns the sorted rows plus header helpers.
 * Numbers sort numerically, everything else by locale string compare; nullish
 * values sort last regardless of direction. No virtualization or pagination —
 * these tables are small (a project's invoices/POs/codes).
 */
export function useTableSort<T, K extends string>(
  rows: T[],
  accessors: Record<K, (row: T) => SortValue>,
  initial: SortState<K> = { key: null, dir: 'asc' },
): UseTableSort<T, K> {
  const [sort, setSort] = useState<SortState<K>>(initial)

  const toggle = useCallback((key: K) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }, [])

  const sorted = useMemo(() => {
    if (!sort.key) return rows
    const acc = accessors[sort.key]
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = acc(a)
      const vb = acc(b)
      if (va == null && vb == null) return 0
      if (va == null) return 1 // nullish always last
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor
      return String(va).localeCompare(String(vb)) * factor
    })
  }, [rows, sort, accessors])

  const indicator = useCallback(
    (key: K) => (sort.key === key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''),
    [sort],
  )

  const ariaSort = useCallback(
    (key: K): 'ascending' | 'descending' | 'none' =>
      sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none',
    [sort],
  )

  return { sorted, sort, toggle, indicator, ariaSort }
}
