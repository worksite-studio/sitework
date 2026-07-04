import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAppState } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { computeDashboardKpis } from './computeKpis'
import type { RootState } from '@/types'

/**
 * Dashboard — faithful port of legacy `Y1v2` + `AlertPanel` (PARITY gaps 10/11):
 * Alerts & Compliance panel leads, then the greeting block, five editorial
 * stat blocks over 2px ink rules, and the ruled Project Health / Budget &
 * Margin columns. All styling values are lifted verbatim from the baseline.
 */

interface Alert {
  type: 'error' | 'warn' | 'info'
  text: string
}

const ALERT_ROW_BG: Record<Alert['type'], string> = {
  error: '#FEE2E240',
  warn: '#FEF3C740',
  info: '#EFF6FF40',
}
const ALERT_DOT: Record<Alert['type'], string> = {
  error: '#EF4444',
  warn: '#F59E0B',
  info: '#3B82F6',
}

/** Port of legacy `AlertPanel` alert building — same rules, same copy. */
function buildAlerts(state: RootState): Alert[] {
  const today = new Date()
  const soon = new Date()
  soon.setDate(today.getDate() + 30)
  const alerts: Alert[] = []

  for (const sub of state.subs) {
    const checks = [
      { label: `${sub.name} — Public Liability expires`, date: sub.liabilityExp },
      { label: `${sub.name} — Workers Comp expires`, date: sub.wcExp },
    ]
    for (const { label, date } of checks) {
      if (!date) continue
      const d = new Date(date)
      if (d < today) {
        alerts.push({ type: 'error', text: `${label} (EXPIRED)` })
      } else if (d < soon) {
        const days = Math.ceil((d.getTime() - today.getTime()) / 86400000)
        alerts.push({ type: 'warn', text: `${label} in ${days} days` })
      }
    }
    if (!sub.swms) alerts.push({ type: 'warn', text: `${sub.name} — SWMS not on file` })
  }

  for (const [projectId, rfis] of Object.entries(state.rfis)) {
    const project = state.projects.find((p) => (p.id as string) === projectId)
    for (const rfi of rfis ?? []) {
      if (rfi.status === 'Open' && rfi.dateRequired && new Date(rfi.dateRequired) < today) {
        alerts.push({
          type: 'warn',
          text: `RFI overdue: ${rfi.subject}${project ? ` — ${project.name}` : ''}`,
        })
      }
    }
  }

  for (const p of state.projects.filter((p) => p.status === 'live')) {
    const pending = p.variations.filter((v) => v.status === 'Pending')
    if (pending.length > 0) {
      alerts.push({
        type: 'info',
        text: `${pending.length} pending variation${pending.length > 1 ? 's' : ''} on ${p.name}`,
      })
    }
  }

  return alerts
}

/** Legacy `Ma` — committed vs budget health. */
function health(budget: number, committed: number): { color: string; label: string } {
  if (!budget) return { color: 'var(--sw-faint)', label: '—' }
  if (committed <= budget) return { color: 'var(--sw-pos)', label: 'On Budget' }
  if (committed <= budget * 1.1) return { color: 'var(--sw-violet)', label: 'At Risk' }
  return { color: 'var(--sw-neg)', label: 'Over' }
}

function StatBlock({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string
  value: string | number
  sublabel: string
  accent?: string
}) {
  return (
    <div className="flex-1 border-b-2 border-sw-ink pb-3.5">
      <div className="mb-[7px] text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
        {label}
      </div>
      <div
        className="mb-[3px] text-[28px] font-bold leading-none tracking-[-0.02em]"
        style={{ color: accent ?? 'var(--sw-ink)' }}
      >
        {value}
      </div>
      <div className="text-[11px] text-sw-dim">{sublabel}</div>
    </div>
  )
}

export function DashboardPage() {
  const state = useAppState()
  const kpis = useMemo(() => computeDashboardKpis(state), [state])
  const alerts = useMemo(() => buildAlerts(state), [state])
  const active = state.projects.filter((p) => p.status === 'live')

  const userName = typeof state.settings.userName === 'string' ? state.settings.userName : ''
  const totalContractValue = active.reduce(
    (s, p) => s + p.codes.reduce((cs, c) => cs + c.budget, 0),
    0,
  )
  const approvedOutstanding = state.projects.reduce(
    (s, p) => s + p.invoices.filter((i) => i.status === 'Approved').reduce((a, i) => a + i.amount, 0),
    0,
  )
  const subsNeedingAttention = state.subs.filter((sub) => {
    const today = new Date()
    const soon = new Date()
    soon.setDate(today.getDate() + 30)
    const expiring = (d: string) => !!d && new Date(d) < soon
    return expiring(sub.liabilityExp) || expiring(sub.wcExp) || !sub.swms
  }).length

  const shown = alerts.slice(0, 8)

  return (
    <div>
      {/* Alerts & Compliance — leads the page, exactly like the baseline */}
      {alerts.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-[1px] border border-sw-rule">
          <div className="flex items-center justify-between border-b border-sw-rule bg-white px-4 py-2.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-sw-ink">
              Alerts & Compliance
            </div>
            <div className="text-[11px] text-sw-dim">
              {alerts.length} item{alerts.length !== 1 ? 's' : ''}
            </div>
          </div>
          {shown.map((alert, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-4 py-[9px]"
              style={{
                background: ALERT_ROW_BG[alert.type],
                borderBottom: idx < shown.length - 1 ? '1px solid var(--sw-rule)' : 'none',
              }}
            >
              <div
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: ALERT_DOT[alert.type] }}
              />
              <div className="text-xs text-sw-ink">{alert.text}</div>
            </div>
          ))}
          {alerts.length > 8 && (
            <div className="bg-white px-4 py-2 text-[11px] text-sw-dim">
              +{alerts.length - 8} more alerts
            </div>
          )}
        </div>
      )}

      {/* Greeting */}
      <div className="mb-7">
        <div className="mb-1.5 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
          {userName ? `Good morning, ${userName}.` : 'Good morning.'}
        </div>
        <div className="text-[13px] text-sw-dim">Here's where things stand today.</div>
      </div>

      {/* Editorial stat blocks */}
      <div className="mb-12 flex gap-12">
        <StatBlock
          label="Active Projects"
          value={active.length}
          sublabel={`$${(totalContractValue / 1e6).toFixed(1)}M contract value`}
        />
        <StatBlock
          label="Outstanding Invoices"
          value={formatCurrency(approvedOutstanding)}
          sublabel="Approved, awaiting payment"
          accent="var(--sw-violet)"
        />
        <StatBlock
          label="Open Variations"
          value={formatCurrency(kpis.openVariationsTotal)}
          sublabel="Pending approval"
        />
        <StatBlock
          label="Portfolio Margin"
          value={`${Math.round(kpis.portfolioMarginPct)}%`}
          sublabel="Across active projects"
        />
        <StatBlock
          label="Compliance Alerts"
          value={subsNeedingAttention}
          sublabel="Subs needing attention"
          accent={subsNeedingAttention > 0 ? 'var(--sw-neg)' : undefined}
        />
      </div>

      {/* Project Health | Budget & Margin — ruled columns */}
      <div className="grid grid-cols-2 gap-12">
        <section className="border-t border-sw-ink pt-5">
          <h2 className="mb-4 text-[13px] font-bold text-sw-ink">Project Health</h2>
          {active.map((p) => {
            const budget = p.codes.reduce((s, c) => s + c.budget, 0)
            const committed = p.codes.reduce((s, c) => s + c.committed, 0)
            const h = health(budget, committed)
            const client = state.clients.find((c) => c.id === p.clientId)
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}/overview`}
                className="flex items-center gap-3 border-b border-sw-rule-l py-2.5"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: h.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-sw-ink">{p.name}</span>
                  <span className="block text-[11px] text-sw-faint">{client?.name}</span>
                </span>
                <span className="text-right">
                  <span
                    className="block font-mono text-xs font-semibold"
                    style={{ color: h.color }}
                  >
                    {budget > 0 ? Math.round((committed / budget) * 100) : 0}%
                  </span>
                  <span className="block text-[10px] text-sw-faint">
                    {h.label} · committed vs budget
                  </span>
                </span>
              </Link>
            )
          })}
          {active.length === 0 && (
            <div className="py-5 text-center text-[13px] text-sw-faint">No active projects</div>
          )}
        </section>

        <section className="border-t border-sw-ink pt-5">
          <h2 className="mb-4 text-[13px] font-bold text-sw-ink">Budget & Margin</h2>
          {active.map((p) => {
            const budget = p.codes.reduce((s, c) => s + c.budget, 0)
            const committed = p.codes.reduce((s, c) => s + c.committed, 0)
            const spent = budget > 0 ? Math.round((committed / budget) * 100) : 0
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 border-b border-sw-rule-l py-[9px]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-sw-ink">{p.name}</span>
                  <span className="block text-[10px] text-sw-faint">
                    ${(budget / 1e3).toFixed(0)}K budget
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-xs font-bold text-sw-pos">
                    {p.margin}%
                  </span>
                  <span className="block text-[10px] text-sw-faint">{spent}% spent</span>
                </span>
              </div>
            )
          })}
          {active.length === 0 && (
            <div className="py-5 text-center text-[13px] text-sw-faint">No active projects</div>
          )}
        </section>
      </div>
    </div>
  )
}
