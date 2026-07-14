import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastTone } from './toast-context'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

const TONE_ACCENT: Record<ToastTone, string> = {
  success: 'var(--sw-pos)',
  error: 'var(--sw-neg)',
  info: 'var(--sw-ink)',
}

/**
 * Toast host — Phase 4.5-D. Holds transient confirmations in a bottom-right
 * stack, each auto-dismissing after ~3.2s. Square cards with a 3px tone accent
 * matching the design tokens (green success / red error / ink info). Wraps the
 * routed app so any module can `useToast()`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto min-w-[220px] max-w-[360px] rounded-[1px] border border-sw-rule bg-white px-4 py-3 text-[13px] text-sw-ink shadow-sm"
            style={{ borderLeft: `3px solid ${TONE_ACCENT[t.tone]}` }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
