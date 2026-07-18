import { useEffect, useReducer, useRef, useState, type Dispatch, type Reducer } from 'react'
import { asId, type LineItemId, type RootState } from '@/types'
import { newId } from '@/lib/newId'

/** Current persistence schema version. Bump when the shape changes incompatibly. */
export const STATE_KEY = 'sw_state_v2' as const
/** Pre-Phase-4 single-file app's key — cleared by Reset to Demo Data too. */
const LEGACY_KEY = 'sw_state_v1' as const

/**
 * Pluggable storage so tests can run without `window.localStorage`.
 */
export interface PersistedStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const browserStorage: PersistedStorage | null =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? window.localStorage
    : null

/**
 * Merge stored state into seed defaults — newly added top-level keys
 * survive when older saves are loaded. Mirrors the legacy `Z1Persisted`
 * lazy initializer pattern.
 */
export function mergeSeedWithStored<S extends object>(seed: S, stored: unknown): S {
  if (!stored || typeof stored !== 'object') return seed
  const out = { ...seed } as Record<string, unknown>
  const storedRecord = stored as Record<string, unknown>
  for (const key of Object.keys(seed)) {
    const storedVal = storedRecord[key]
    if (storedVal !== undefined) {
      out[key] = storedVal
    }
  }
  return out as S
}

/**
 * 4.7-E: a cost code's budget is the sum of its line items — never typed. Any
 * code carrying a legacy budget but no line items has that value converted to
 * a single "Allowance" line. Then every code's budget is reconciled to its
 * line-item sum, so a legacy typed budget that didn't match its items is
 * corrected. Idempotent once run.
 */
export function normalizeCodeBudgets(state: RootState): RootState {
  let changed = false
  const projects = state.projects.map((p) => {
    let pChanged = false
    const lineItems = { ...p.lineItems }
    const codes = p.codes.map((code) => {
      const key = code.id as unknown as string
      let items = lineItems[key]
      if ((!items || items.length === 0) && (code.budget || 0) > 0) {
        items = [
          {
            id: asId<LineItemId>(newId('LI')),
            desc: 'Allowance',
            qty: 1,
            unit: 'allow',
            rate: code.budget,
            matId: null,
            supId: null,
          },
        ]
        lineItems[key] = items
        pChanged = true
      }
      const derived = Math.round(
        (items ?? []).reduce((s, li) => s + (li.qty || 0) * (li.rate || 0), 0),
      )
      if (derived !== code.budget) {
        pChanged = true
        return { ...code, budget: derived }
      }
      return code
    })
    if (!pChanged) return p
    changed = true
    return { ...p, codes, lineItems }
  })
  return changed ? { ...state, projects } : state
}

/**
 * Compute the initial state for the persisted reducer. Reads sw_state_v2
 * if present, otherwise falls back to seed. Doesn't perform the v1
 * migration — call `migrateLegacyState()` ahead of mount for that.
 */
export function loadInitialState(seed: RootState, storage = browserStorage): RootState {
  const base = ((): RootState => {
    if (!storage) return seed
    try {
      const raw = storage.getItem(STATE_KEY)
      if (!raw) return seed
      return mergeSeedWithStored(seed, JSON.parse(raw) as unknown)
    } catch {
      return seed
    }
  })()
  return normalizeCodeBudgets(base)
}

/**
 * `useReducer` + localStorage write-through. Writes happen on every dispatch
 * after the initial mount; the first write is skipped so loading the page
 * with no state doesn't overwrite seed with seed.
 *
 * The third tuple element flips to true when a write throws (quota exceeded
 * or storage unavailable) so the shell can warn the user that changes are
 * not being saved. It clears again as soon as a write succeeds.
 */
export function useReducerPersisted<A>(
  reducer: Reducer<RootState, A>,
  seed: RootState,
  storage: PersistedStorage | null = browserStorage,
): [RootState, Dispatch<A>, boolean] {
  const initialState = loadInitialState(seed, storage)
  const [state, dispatch] = useReducer(reducer, initialState)
  const [persistFailed, setPersistFailed] = useState(false)
  const isFirstWrite = useRef(true)

  useEffect(() => {
    if (!storage) return
    if (isFirstWrite.current) {
      isFirstWrite.current = false
      return
    }
    let failed = false
    try {
      storage.setItem(STATE_KEY, JSON.stringify(state))
    } catch {
      // Quota exceeded or storage unavailable — the AppShell banner tells the
      // user their changes aren't being saved. Phase 5 moves file attachments
      // out of state so the quota stops mattering.
      failed = true
    }
    setPersistFailed(failed)
  }, [state, storage])

  return [state, dispatch, persistFailed]
}

export { LEGACY_KEY }
