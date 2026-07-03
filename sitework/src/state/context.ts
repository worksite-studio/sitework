import { createContext, useContext, type Dispatch } from 'react'
import type { Action } from './actions'
import type { RootState } from '@/types'

export interface StateContextValue {
  state: RootState
  dispatch: Dispatch<Action>
  /** True while localStorage writes are failing — changes are NOT being saved. */
  persistFailed: boolean
}

export const StateContext = createContext<StateContextValue | null>(null)

/** Read the full root state. */
export function useAppState(): RootState {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useAppState must be used within <StateProvider>')
  return ctx.state
}

/** Get the typed dispatch function. */
export function useDispatch(): Dispatch<Action> {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useDispatch must be used within <StateProvider>')
  return ctx.dispatch
}

/** True while persistence writes are failing (quota exceeded etc.). */
export function usePersistFailed(): boolean {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('usePersistFailed must be used within <StateProvider>')
  return ctx.persistFailed
}
