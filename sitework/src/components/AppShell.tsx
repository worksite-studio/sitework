import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { TOP_NAV } from '@/nav'
import { useAppState, usePersistFailed } from '@/state/context'
import { exportStateFile } from '@/lib/backup'
import { Splash } from '@/components/Splash'
import { hasEntered, markEntered } from '@/components/splashGate'

/**
 * Application shell — faithful port of the legacy `Pc` chrome (PARITY gap 10):
 * a 52px horizontal top bar with the spaced-caps SITEWORK wordmark, uppercase
 * letterspaced nav (active = ink + 2px underline), pulsing Xero dot, and the
 * WS avatar → Settings. No sidebar — the baseline never had one.
 */
export function AppShell() {
  const state = useAppState()
  const { settings } = state
  const persistFailed = usePersistFailed()
  const [entered, setEntered] = useState(hasEntered)
  const businessName =
    (typeof settings.businessName === 'string' && settings.businessName) || 'Worksite'

  if (!entered)
    return (
      <Splash
        onEnter={() => {
          markEntered()
          setEntered(true)
        }}
      />
    )

  return (
    <div className="flex min-h-screen flex-col bg-white text-sw-ink">
      <header className="flex h-[52px] shrink-0 items-center border-b border-sw-rule bg-white px-10">
        <div className="mr-[52px] shrink-0 text-[17px] font-bold uppercase leading-none tracking-[0.2em] text-sw-ink">
          SITEWORK
        </div>
        <nav className="flex h-[52px] flex-1 items-center overflow-hidden">
          {TOP_NAV.map((item) => (
            <NavLink
              key={item.id}
              to={item.id === 'dashboard' ? '/' : `/${item.id}`}
              end={item.id === 'dashboard'}
              className={({ isActive }) =>
                `flex h-[52px] shrink-0 items-center px-3.5 text-[10px] uppercase tracking-[0.08em] border-b-2 transition ${
                  isActive
                    ? 'font-semibold text-sw-ink border-sw-ink'
                    : 'font-normal text-sw-dim border-transparent hover:text-sw-mid'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-5">
          <div className="flex items-center gap-[5px]">
            <div
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-sw-xero"
              style={{ animation: 'xpulse 2.2s infinite' }}
            />
            <span className="text-[10px] text-sw-dim">Xero</span>
          </div>
          <Link to="/settings" className="flex items-center gap-[7px]">
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full border border-sw-rule text-[8px] font-bold text-sw-ink">
              WS
            </span>
            <span className="text-[11px] font-medium text-sw-ink">{businessName}</span>
          </Link>
        </div>
      </header>

      {persistFailed && (
        <div
          role="alert"
          className="flex items-center gap-3 px-10 py-2 bg-sw-danger text-white text-sm"
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

      <main className="min-w-0 flex-1 overflow-auto bg-white">
        <Outlet />
      </main>
    </div>
  )
}
