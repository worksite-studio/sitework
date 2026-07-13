import { createContext, useContext } from 'react'

export interface ConfirmOptions {
  title: string
  message: string
  /** Confirm-button label (default "Confirm"). */
  confirmLabel?: string
  /** Cancel-button label (default "Cancel"). */
  cancelLabel?: string
  /** Style the confirm button as destructive (red). */
  danger?: boolean
}

export type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * Promise-based confirm (Phase 4.5-D) — the in-app replacement for
 * `window.confirm`. Resolves true on confirm, false on cancel/dismiss, so a
 * call site reads `if (!(await confirm({...}))) return`. Must be under a
 * `ConfirmProvider`.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
