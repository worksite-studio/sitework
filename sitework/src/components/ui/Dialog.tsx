import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  /** Footer content — typically a Button row. */
  footer?: ReactNode
  /** Override the dialog width (default 480px; pass `w-[720px]` for wide). */
  widthClass?: string
}

/**
 * Modal — Phase 4.5-D rewrite onto the native `<dialog>` element. `showModal()`
 * gives a real focus trap and top-layer stacking for free (Escape, tab-cycle,
 * nested confirm-over-form); we add body scroll-lock and backdrop-click close.
 * Keeps the previous API and the `<h2>` title so role/name queries in tests
 * keep working.
 *
 * jsdom (component tests) doesn't implement `showModal`/`close`, so both are
 * guarded with a fallback to the `open` attribute — the element still renders.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClass = 'w-[480px]',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      try {
        el.showModal()
      } catch {
        el.setAttribute('open', '')
      }
    } else if (!open && el.open) {
      try {
        el.close()
      } catch {
        el.removeAttribute('open')
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'm-auto max-h-[88vh] max-w-full rounded-[1px] border border-sw-rule bg-white p-0 shadow-none backdrop:bg-black/60',
        widthClass,
      )}
    >
      {open && (
        <div className="flex max-h-[88vh] flex-col">
          <header className="flex items-center justify-between border-b border-sw-rule px-6 py-[18px]">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sw-ink">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-[11px] text-sw-muted">{description}</p>}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="cursor-pointer px-1 text-[14px] font-light leading-none text-sw-muted"
            >
              ✕
            </button>
          </header>
          <div className="space-y-3 overflow-y-auto p-6">{children}</div>
          {footer && <footer className="flex justify-end gap-2 px-6 pb-6">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
