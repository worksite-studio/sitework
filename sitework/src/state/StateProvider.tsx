import { useMemo, type ReactNode } from 'react'
import type { Action } from './actions'
import { reducer } from './reducer'
import { seed } from './seed'
import { useReducerPersisted } from './persistence'
import { StateContext } from './context'

/**
 * Wraps the whole app. Holds the single useReducer (persisted to
 * localStorage under sw_state_v2) and exposes it via context so any
 * module can read state / dispatch without prop-drilling.
 *
 * Legacy equivalent: the useReducer call inside `Pc`. Phase 4 lifts it into
 * a provider so routed module components can reach it.
 */
export function StateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch, persistFailed] = useReducerPersisted<Action>(reducer, seed)
  const value = useMemo(
    () => ({ state, dispatch, persistFailed }),
    [state, dispatch, persistFailed],
  )
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}
