import { useEffect, type ReactNode } from 'react'
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
 * Modal — port of legacy `xt`. Square panel (480/720px), 1px rule border,
 * no shadow, uppercase 11px title, ✕ close. Title stays a real <h2> so
 * role/name queries in tests keep working.
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
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'max-w-full max-h-[88vh] rounded-[1px] border border-sw-rule bg-white shadow-none flex flex-col',
          widthClass,
        )}
      >
        <header className="flex items-center justify-between px-6 py-[18px] border-b border-sw-rule">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sw-ink">
              {title}
            </h2>
            {description && <p className="text-[11px] text-sw-muted mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-[14px] font-light leading-none text-sw-muted px-1 cursor-pointer"
          >
            ✕
          </button>
        </header>
        <div className="p-6 space-y-3 overflow-y-auto">{children}</div>
        {footer && <footer className="px-6 pb-6 flex justify-end gap-2">{footer}</footer>}
      </div>
    </div>
  )
}
