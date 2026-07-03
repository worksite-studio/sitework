import { Component, type ReactNode } from 'react'
import { useRouteError } from 'react-router-dom'
import { exportRawStoredState } from '@/lib/backup'

/**
 * Crash screen shared by the top-level ErrorBoundary and the router's
 * errorElement. Data lives in localStorage, not React, so it survives any
 * render crash — the backup button reads storage directly.
 */
export function CrashFallback({ error }: { error?: unknown }) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : undefined
  return (
    <div className="min-h-screen grid place-items-center bg-sw-bg text-sw-text p-6">
      <div className="max-w-md w-full rounded-md border border-sw-border bg-sw-surface p-6 space-y-4">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-sw-muted">
          This screen hit an error and couldn't render. Your data is safe in this browser's storage
          — download a backup now if you want belt and braces, then reload.
        </p>
        {message && (
          <pre className="text-xs text-sw-danger whitespace-pre-wrap break-words bg-sw-danger/5 rounded p-2">
            {message}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-md bg-sw-primary text-white text-sm font-medium px-3 h-9 hover:opacity-90"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => {
              if (!exportRawStoredState()) {
                window.alert('No saved data found in this browser to back up.')
              }
            }}
            className="inline-flex items-center rounded-md border border-sw-border bg-sw-surface text-sm font-medium px-3 h-9 hover:bg-sw-muted/5"
          >
            Download backup
          </button>
        </div>
      </div>
    </div>
  )
}

/** errorElement for the root route — a crash in one tab keeps the URL and shows this instead of a white screen. */
export function RouteCrash() {
  const error = useRouteError()
  return <CrashFallback error={error} />
}

interface ErrorBoundaryState {
  error: unknown
  hasError: boolean
}

/**
 * Last-resort boundary around the whole app (router included). Render
 * errors inside routes are caught first by the root route's errorElement;
 * this catches everything outside it (providers, the router itself).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: undefined, hasError: false }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error, hasError: true }
  }

  render() {
    if (this.state.hasError) return <CrashFallback error={this.state.error} />
    return this.props.children
  }
}
