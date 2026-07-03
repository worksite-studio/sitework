import { useEffect, useReducer, useRef, useState, type Dispatch, type Reducer } from 'react'
import type { RootState } from '@/types'

/** Current persistence schema version. Bump when the shape changes incompatibly. */
export const STATE_KEY = 'sw_state_v2' as const
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
 * Compute the initial state for the persisted reducer. Reads sw_state_v2
 * if present, otherwise falls back to seed. Doesn't perform the v1
 * migration — call `migrateLegacyState()` ahead of mount for that.
 */
export function loadInitialState(seed: RootState, storage = browserStorage): RootState {
  if (!storage) return seed
  try {
    const raw = storage.getItem(STATE_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw) as unknown
    return mergeSeedWithStored(seed, parsed)
  } catch {
    return seed
  }
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
