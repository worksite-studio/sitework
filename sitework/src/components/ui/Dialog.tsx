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
  /** Override the dialog width (default `max-w-lg`). */
  widthClass?: string
}

/**
 * Lightweight modal. No focus-trap or portal yet (acceptable for Phase 4
 * scaffold; swap to shadcn `<Dialog>` once `npx shadcn init` is wired).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClass = 'max-w-lg',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={cn('w-full bg-sw-surface rounded-lg shadow-xl flex flex-col', widthClass)}>
        <header className="px-5 py-4 border-b border-sw-border">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-xs text-sw-muted mt-0.5">{description}</p>}
        </header>
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <footer className="px-5 py-3 border-t border-sw-border flex justify-end gap-2">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
