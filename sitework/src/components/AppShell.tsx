import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { TOP_NAV } from '@/nav'
import { useAppState, usePersistFailed } from '@/state/context'
import { exportStateFile } from '@/lib/backup'

/**
 * Application shell — port of the legacy `Pc` component's chrome (sidebar +
 * header). The routed module renders into <Outlet />.
 *
 * Desktop-first to match the legacy app (ARCHITECTURE.md §10). A simple
 * collapse toggle stands in for the planned shadcn <Sheet>; a richer mobile
 * treatment can land once shadcn primitives are wired in Session 5.
 */
export function AppShell() {
  const state = useAppState()
  const { settings } = state
  const persistFailed = usePersistFailed()
  const [collapsed, setCollapsed] = useState(false)
  const businessName =
    (typeof settings.businessName === 'string' && settings.businessName) || 'Worksite'

  return (
    <div className="flex min-h-screen bg-sw-bg text-sw-text">
      {/* Sidebar */}
      <aside
        className={`shrink-0 border-r border-sw-border bg-sw-surface transition-all ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b border-sw-border">
          <div className="grid place-items-center w-8 h-8 rounded-md bg-sw-primary text-white text-xs font-semibold">
            WS
          </div>
          {!collapsed && <span className="font-semibold tracking-tight">SITEWORK</span>}
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto text-sw-muted hover:text-sw-text text-sm"
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="p-2 space-y-0.5">
          {TOP_NAV.map((item) => (
            <NavLink
              key={item.id}
              to={item.id === 'dashboard' ? '/' : `/${item.id}`}
              end={item.id === 'dashboard'}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition ${
                  isActive ? 'bg-sw-primary text-white' : 'text-sw-text hover:bg-sw-muted/10'
                } ${collapsed ? 'text-center px-0' : ''}`
              }
              title={item.label}
            >
              {collapsed ? item.label.charAt(0) : item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 h-14 px-6 border-b border-sw-border bg-sw-surface">
          <span className="text-sm text-sw-muted">Good morning.</span>
          <span className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-sw-muted">Xero</span>
            <span className="grid place-items-center w-7 h-7 rounded-full bg-sw-primary text-white text-xs">
              WS
            </span>
            <span className="font-medium">{businessName}</span>
          </span>
        </header>

        {persistFailed && (
          <div
            role="alert"
            className="flex items-center gap-3 px-6 py-2 bg-sw-danger text-white text-sm"
          >
            <span className="font-medium">
              Changes are NOT being saved — browser storage is full or unavailable.
            </span>
            <button
              type="button"
              onClick={() => exportStateFile(state)}
              className="ml-auto shrink-0 rounded-md border border-white/60 px-3 py-1 text-sm font-medium hover:bg-white/10"
            >
              Download backup now
            </button>
          </div>
        )}

        <main className="flex-1 min-w-0 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
