import { useMemo } from 'react'
import { formatDate } from '@/lib/formatDate'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'

interface CalEvent {
  date: string
  type: string
  label: string
}

/**
 * Calendar — transliteration of legacy `Calx` (R7, PARITY gap-12 row):
 * "N events" counter, events from milestones + defect logs + sub PL/WC/
 * certificate expiries, sorted and grouped by month (uppercase mono month
 * headers over rules), rows = mono date · bold event type · muted label,
 * with a pink EXPIRED pill for past dates and an amber "≤30d" pill for
 * the next 30 days.
 */
export function CalendarTab() {
  const project = useProject()
  const state = useAppState()

  const events: CalEvent[] = useMemo(() => {
    if (!project) return []
    const evts: CalEvent[] = []
    for (const m of state.milestones[project.id as string] ?? []) {
      if (m.date) evts.push({ date: m.date, type: 'Milestone', label: m.name })
    }
    for (const def of state.defects[project.id as string] ?? []) {
      if (def.dateLogged)
        evts.push({
          date: def.dateLogged,
          type: 'Defect logged',
          label: def.item + (def.location ? ' · ' + def.location : ''),
        })
    }
    for (const sub of state.subs) {
      if (sub.liabilityExp)
        evts.push({ date: sub.liabilityExp, type: 'Public Liability expiry', label: sub.name })
      if (sub.wcExp) evts.push({ date: sub.wcExp, type: 'Workers Comp expiry', label: sub.name })
      for (const cert of sub.certificates ?? []) {
        if (cert.expiry)
          evts.push({
            date: cert.expiry,
            type: `${cert.type} expiry`,
            label: sub.name + (cert.file?.name ? ' · ' + cert.file.name : ''),
          })
      }
    }
    return evts.sort((a, b) => a.date.localeCompare(b.date))
  }, [project, state.milestones, state.defects, state.subs])

  if (!project) return null

  const today = new Date().toISOString().slice(0, 10)
  const in30D = new Date()
  in30D.setDate(in30D.getDate() + 30)
  const in30 = in30D.toISOString().slice(0, 10)

  const groups = new Map<string, CalEvent[]>()
  for (const e of events) {
    const ym = e.date.slice(0, 7)
    if (!groups.has(ym)) groups.set(ym, [])
    groups.get(ym)!.push(e)
  }

  const chip = (date: string): { label: string; bg: string } | null => {
    if (date < today) return { label: 'EXPIRED', bg: 'var(--sw-neg)' }
    if (date < in30) return { label: '≤30d', bg: '#f59e0b' }
    return null
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h2 className="text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Calendar</h2>
        <div className="text-[12px] text-sw-dim">
          {events.length} event{events.length === 1 ? '' : 's'}
        </div>
      </header>

      {events.length === 0 ? (
        <div className="p-10 text-center text-[13px] text-sw-faint">
          No dated events yet. Milestones, defect logs, and insurance expiries will appear here as
          you populate them.
        </div>
      ) : (
        [...groups.keys()].sort().map((ym) => (
          <div key={ym} className="mb-6">
            <div className="mb-2 border-b border-sw-rule pb-1.5 font-mono text-[11px] font-semibold tracking-[0.06em] text-sw-dim">
              {new Date(`${ym}-01`)
                .toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })
                .toUpperCase()}
            </div>
            <div className="flex flex-col gap-1.5">
              {groups.get(ym)!.map((e, idx) => {
                const c = chip(e.date)
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded border border-sw-rule bg-white px-3 py-2.5 text-[13px]"
                  >
                    <span className="min-w-[90px] font-mono text-[12px] text-sw-dim">
                      {formatDate(e.date)}
                    </span>
                    <span className="min-w-[180px] font-semibold text-sw-ink">{e.type}</span>
                    <span className="flex-1 truncate text-sw-dim">{e.label}</span>
                    {c && (
                      <span
                        className="rounded-full px-2 py-[3px] font-mono text-[10px] font-semibold text-white"
                        style={{ background: c.bg }}
                      >
                        {c.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
