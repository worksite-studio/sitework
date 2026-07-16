import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { markEntered } from '@/components/splashGate'

interface PrintLayoutProps {
  title: string
  /** Where the "Back" link should go. Hidden in print output. */
  backTo: string
  /** Auto-trigger the browser print dialog after first render. Default true. */
  autoPrint?: boolean
  children: ReactNode
}

/**
 * Wraps every print view. Outside AppShell, so no sidebar/header bleeds
 * into the printed page. The `.print-page` class drives @page sizing and
 * the typographic resets in index.css.
 */
export function PrintLayout({ title, backTo, autoPrint = true, children }: PrintLayoutProps) {
  // Viewing a print page means you're already "in" the app — so returning
  // (Back) shouldn't be gated by the splash, even if this print route was
  // opened in a fresh tab (print lives outside AppShell).
  useEffect(() => {
    markEntered()
  }, [])

  useEffect(() => {
    if (!autoPrint) return
    // Defer one frame so the page has a chance to render before the dialog
    // opens — otherwise some browsers print before the content paints.
    const id = window.setTimeout(() => window.print(), 250)
    return () => window.clearTimeout(id)
  }, [autoPrint])

  return (
    <>
      <header className="print-hide max-w-[210mm] mx-auto px-6 py-3 flex items-center justify-between border-b border-sw-border bg-sw-surface sticky top-0">
        <Link to={backTo} className="text-sm text-sw-muted hover:text-sw-text">
          ← Back
        </Link>
        <div className="text-sm font-medium">{title}</div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center rounded-md border border-sw-border bg-sw-surface px-3 py-1.5 text-sm font-medium hover:bg-sw-muted/5 transition"
        >
          Print / Save PDF
        </button>
      </header>
      <main className="print-page">{children}</main>
    </>
  )
}
