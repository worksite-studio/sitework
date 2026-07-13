import { useCallback, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { ConfirmContext, type ConfirmOptions } from './confirm-context'

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void
}

/**
 * Confirm host — Phase 4.5-D. Renders a single reusable confirm Dialog and
 * hands `useConfirm()` a promise-returning function. Replaces `window.confirm`
 * across the app with a styled, accessible modal (focus-trapped by the native
 * Dialog rewrite). Wraps the routed app.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...opts, resolve })
      }),
    [],
  )

  // Closes over the current render's `pending`, so it always resolves the
  // active request. Resolving an already-settled promise is a no-op.
  function settle(value: boolean) {
    pending?.resolve(value)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={pending !== null}
        onClose={() => settle(false)}
        title={pending?.title ?? ''}
        footer={
          pending && (
            <>
              <Button variant="ghost" onClick={() => settle(false)}>
                {pending.cancelLabel ?? 'Cancel'}
              </Button>
              <Button variant={pending.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
                {pending.confirmLabel ?? 'Confirm'}
              </Button>
            </>
          )
        }
      >
        <p className="text-[13px] leading-relaxed text-sw-dim">{pending?.message}</p>
      </Dialog>
    </ConfirmContext.Provider>
  )
}
