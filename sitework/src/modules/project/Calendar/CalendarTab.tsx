import { useMemo } from 'react'
import { Card, EmptyState, ExpiryChip } from '@/components/ui'
import { formatDate } from '@/lib/formatDate'
import { getExpiryInfo } from '@/lib/certExpiry'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'

type CalendarKind = 'milestone' | 'sub-pl' | 'sub-wc' | 'cert' | 'pc' | 'ps' | 'defect'

interface CalendarItem {
  date: string
  kind: CalendarKind
  label: string
  detail: string
}

const KIND_LABEL: Record<CalendarKind, string> = {
  milestone: 'MILESTONE',
  'sub-pl': 'PL',
  'sub-wc': 'WC',
  cert: 'CERT',
  pc: 'PC',
  ps: 'PS',
  defect: 'DEFECT',
}

/**
 * Project Calendar tab — port of Calx (Phase 1.5-D). Aggregates dated
 * surfaces from across the project: milestones, defect warranty expiries,
 * subcontractor PL/WC + certificate expiries (for any sub assigned to the
 * project), and PC/PS items with a due date. Sorted chronologically and
 * grouped by month.
 */
export function CalendarTab() {
  const project = useProject()
  const state = useAppState()

  const items = useMemo<CalendarItem[]>(() => {
    if (!project) return []
    const out: CalendarItem[] = []

    // Milestones
    const milestones = state.milestones[project.id as string] ?? []
    for (const m of milestones) {
      if (!m.date) continue
      out.push({
        date: m.date,
        kind: 'milestone',
        label: m.name,
        detail: m.status,
      })
    }

    // Defects — when rectified, the rectification date is the warranty
    // anchor; when open, we surface the logged date so it stays visible.
    const defects = state.defects[project.id as string] ?? []
    for (const d of defects) {
      const anchor = d.dateRectified || d.dateLogged
      if (!anchor) continue
      out.push({
        date: anchor,
        kind: 'defect',
        label: d.item,
        detail: `${d.location} · ${d.status}`,
      })
    }

    // Subs assigned to the project — PL + WC expiries + cert expiries
    for (const sub of state.subs) {
      if (!sub.projects.includes(project.id)) continue
      if (sub.liabilityExp) {
        out.push({
          date: sub.liabilityExp,
          kind: 'sub-pl',
          label: `${sub.name} — Public Liability`,
          detail: sub.trade,
        })
      }
      if (sub.wcExp) {
        out.push({
          date: sub.wcExp,
          kind: 'sub-wc',
          label: `${sub.name} — Workers Comp`,
          detail: sub.trade,
        })
      }
      for (const cert of sub.certificates ?? []) {
        if (!cert.expiry) continue
        out.push({
          date: cert.expiry,
          kind: 'cert',
          label: `${sub.name} — ${cert.type}`,
          detail: cert.file.name || 'Certificate',
        })
      }
    }

    // Sort chronologically
    return out.sort((a, b) => (a.date < b.date ? -1 : 1))
  }, [project, state])

  if (!project) return null

  // Group by YYYY-MM
  const groups = new Map<string, CalendarItem[]>()
  for (const it of items) {
    const key = it.date.slice(0, 7)
    const bucket = groups.get(key) ?? []
    bucket.push(it)
    groups.set(key, bucket)
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold">Calendar</h2>
        </header>
        <EmptyState
          title="Nothing dated yet"
          description="Add milestones, log defects, or assign subcontractors with expiries to see them here."
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Calendar</h2>
        <p className="text-xs text-sw-muted">
          Aggregated milestones, defects, and insurance expiries — chronological.
        </p>
      </header>

      <div className="space-y-4">
        {Array.from(groups.entries()).map(([month, entries]) => (
          <section key={month} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sw-muted">
              {formatMonthHeader(month)}
            </h3>
            <Card>
              <ul className="divide-y divide-sw-border">
                {entries.map((it, idx) => (
                  <li
                    key={`${it.kind}-${it.date}-${idx}`}
                    className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{it.label}</div>
                      <div className="text-xs text-sw-muted">{it.detail}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-sw-muted tabular-nums">
                        {formatDate(it.date)}
                      </span>
                      {it.kind === 'sub-pl' || it.kind === 'sub-wc' || it.kind === 'cert' ? (
                        <ExpiryChip iso={it.date} kind={KIND_LABEL[it.kind]} />
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneFor(it)}`}
                        >
                          {KIND_LABEL[it.kind]}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>
    </div>
  )
}

function formatMonthHeader(yyyymm: string): string {
  const date = new Date(`${yyyymm}-01`)
  if (Number.isNaN(date.getTime())) return yyyymm
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

function toneFor(it: CalendarItem): string {
  if (it.kind === 'milestone') return 'bg-sw-info/10 text-sw-info ring-sw-info/20'
  if (it.kind === 'defect') {
    const status = getExpiryInfo(it.date).status
    if (status === 'expiring' || status === 'expired') {
      return 'bg-sw-warning/10 text-sw-warning ring-sw-warning/20'
    }
    return 'bg-sw-muted/10 text-sw-muted ring-sw-muted/20'
  }
  return 'bg-sw-muted/10 text-sw-muted ring-sw-muted/20'
}
