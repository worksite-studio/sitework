import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { StatBlock } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { useAppState } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { computeDashboardKpis, computeProjectRegister, type HealthKey } from './computeKpis'
import type { RootState } from '@/types'

/**
 * Dashboard — Phase 4.7-H hybrid rebuild. The old Project-Health and
 * Budget-&-Margin columns (which overlapped) are merged into ONE unified,
 * attention-sorted Projects register (`computeProjectRegister`): each live
 * project shows a committed-vs-budget health bar, margin, status, and
 * attention flags, sorted so the projects needing action lead. The Alerts &
 * Compliance rows and the KPI tiles now click through to their source.
 */

interface Alert {
  type: 'error' | 'warn' | 'info'
  text: string
  /** Where clicking the row navigates — its source record's tab. */
  to: string
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

/** Port of legacy `AlertPanel` alert building — same rules, now each row
 *  carries a `to` link to its source (subs / project RFIs / project VOs). */
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
        alerts.push({ type: 'error', text: `${label} (EXPIRED)`, to: '/subs' })
      } else if (d < soon) {
        const days = Math.ceil((d.getTime() - today.getTime()) / 86400000)
        alerts.push({ type: 'warn', text: `${label} in ${days} days`, to: '/subs' })
      }
    }
    if (!sub.swms)
      alerts.push({ type: 'warn', text: `${sub.name} — SWMS not on file`, to: '/subs' })
  }

  for (const [projectId, rfis] of Object.entries(state.rfis)) {
    const project = state.projects.find((p) => (p.id as string) === projectId)
    for (const rfi of rfis ?? []) {
      if (rfi.status === 'Open' && rfi.dateRequired && new Date(rfi.dateRequired) < today) {
        alerts.push({
          type: 'warn',
          text: `RFI overdue: ${rfi.subject}${project ? ` — ${project.name}` : ''}`,
          to: `/projects/${projectId}/rfis`,
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
        to: `/projects/${p.id}/variations`,
      })
    }
  }

  return alerts
}

/** Health band → colour + label (legacy `Ma`). */
const HEALTH: Record<HealthKey, { color: string; label: string }> = {
  on: { color: 'var(--sw-pos)', label: 'On Budget' },
  risk: { color: 'var(--sw-violet)', label: 'At Risk' },
  over: { color: 'var(--sw-neg)', label: 'Over' },
  none: { color: 'var(--sw-faint)', label: '—' },
}

/** Attention-flag micro-chip (uppercase, bare colour, no pill). */
function FlagChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-[1px] px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-[0.06em]"
      style={{ color, border: `1px solid ${color}40` }}
    >
      {label}
    </span>
  )
}

export function DashboardPage() {
  const state = useAppState()
  const kpis = useMemo(() => computeDashboardKpis(state), [state])
  const alerts = useMemo(() => buildAlerts(state), [state])
  const register = useMemo(() => computeProjectRegister(state), [state])

  const userName = typeof state.settings.userName === 'string' ? state.settings.userName : ''
  const subsNeedingAttention = state.subs.filter((sub) => {
    const today = new Date()
    const soon = new Date()
    soon.setDate(today.getDate() + 30)
    const expiring = (d: string) => !!d && new Date(d) < soon
    return expiring(sub.liabilityExp) || expiring(sub.wcExp) || !sub.swms
  }).length

  const shown = alerts.slice(0, 8)

  return (
    <div className="sw-page">
      {/* Alerts & Compliance — leads the page; each row links to its source */}
      {alerts.length > 0 && (
        <section
          aria-label="Alerts and compliance"
          className="mb-8 overflow-hidden rounded-[1px] border border-sw-rule"
        >
          <div className="flex items-center justify-between border-b border-sw-rule bg-white px-4 py-2.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-sw-ink">
              Alerts & Compliance
            </div>
            <div className="text-[11px] text-sw-dim">
              {alerts.length} item{alerts.length !== 1 ? 's' : ''}
            </div>
          </div>
          {shown.map((alert, idx) => (
            <Link
              key={idx}
              to={alert.to}
              className="flex items-center gap-2.5 px-4 py-[9px] transition hover:brightness-95"
              style={{
                background: ALERT_ROW_BG[alert.type],
                borderBottom: idx < shown.length - 1 ? '1px solid var(--sw-rule)' : 'none',
              }}
            >
              <div
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: ALERT_DOT[alert.type] }}
              />
              <div className="flex-1 text-xs text-sw-ink">{alert.text}</div>
              <div className="text-[13px] leading-none text-sw-faint">›</div>
            </Link>
          ))}
          {alerts.length > 8 && (
            <div className="bg-white px-4 py-2 text-[11px] text-sw-dim">
              +{alerts.length - 8} more alerts
            </div>
          )}
        </section>
      )}

      {/* Greeting */}
      <div className="mb-7">
        <div className="mb-1.5 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
          {userName ? `Good morning, ${userName}.` : 'Good morning.'}
        </div>
        <div className="text-[13px] text-sw-dim">Here's where things stand today.</div>
      </div>

      {/* Editorial stat blocks — money tiles drill through to the portfolio */}
      <div className="mb-12 flex gap-12">
        <StatBlock
          label="Active Projects"
          value={kpis.activeProjectsCount}
          sublabel={`$${(kpis.portfolioContractValue / 1e6).toFixed(1)}M contract value`}
          to="/projects"
        />
        <StatBlock
          label="Outstanding Invoices"
          value={formatCurrency(kpis.outstandingInvoicesTotal)}
          sublabel="Approved, awaiting payment"
          accent="var(--sw-violet)"
          to="/projects"
        />
        <StatBlock
          label="Open Variations"
          value={formatCurrency(kpis.openVariationsTotal)}
          sublabel="Pending approval"
          to="/projects"
        />
        <StatBlock
          label="Portfolio Margin"
          value={`${Math.round(kpis.portfolioMarginPct)}%`}
          sublabel="Across active projects"
          to="/projects"
        />
        <StatBlock
          label="Compliance Alerts"
          value={subsNeedingAttention}
          sublabel="Subs needing attention"
          accent={subsNeedingAttention > 0 ? 'var(--sw-neg)' : undefined}
          to="/subs"
        />
      </div>

      {/* Unified Projects register — attention-sorted (4.7-H) */}
      <section aria-label="Project register" className="border-t border-sw-ink pt-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[13px] font-bold text-sw-ink">Projects</h2>
          <span className="text-[10px] uppercase tracking-[0.08em] text-sw-faint">
            Sorted by attention
          </span>
        </div>

        {register.map((r) => {
          const h = HEALTH[r.health]
          const barPct = Math.min(r.spentPct, 100)
          return (
            <Link
              key={r.id}
              to={`/projects/${r.id}/overview`}
              className="flex items-center gap-4 border-b border-sw-rule-l py-3 transition hover:bg-sw-muted/5"
            >
              {/* Name + client */}
              <span className="flex min-w-0 items-center gap-3" style={{ flexBasis: '30%' }}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: h.color }} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-sw-ink">
                    {r.name}
                  </span>
                  <span className="block truncate text-[11px] text-sw-faint">{r.clientName}</span>
                </span>
              </span>

              {/* Committed-vs-budget health bar */}
              <span className="min-w-0 flex-1">
                <span className="relative block h-1.5 overflow-hidden rounded-[1px] bg-sw-rule-l">
                  <span
                    className="absolute inset-y-0 left-0 rounded-[1px]"
                    style={{ width: `${barPct}%`, background: h.color }}
                  />
                </span>
                <span className="mt-1 block text-[10px] text-sw-faint">
                  {formatCurrency(r.committed)} / {formatCurrency(r.budget)} committed
                </span>
              </span>

              {/* Spend % */}
              <span className="w-[52px] text-right">
                <span className="block font-mono text-xs font-semibold" style={{ color: h.color }}>
                  {r.spentPct}%
                </span>
                <span className="block text-[10px] text-sw-faint">spent</span>
              </span>

              {/* Margin */}
              <span className="w-[52px] text-right">
                <span className="block font-mono text-xs font-bold text-sw-pos">{r.margin}%</span>
                <span className="block text-[10px] text-sw-faint">margin</span>
              </span>

              {/* Attention flags */}
              <span className="flex w-[190px] flex-wrap items-center justify-end gap-1">
                {r.flags.overBudget && <FlagChip label="Over budget" color="var(--sw-neg)" />}
                {r.flags.variationPending && (
                  <FlagChip label="VO pending" color="var(--sw-violet)" />
                )}
                {r.flags.claimDue && <FlagChip label="Claim due" color="#D97706" />}
              </span>

              {/* Status */}
              <span className="w-[64px] text-right">
                <StatusBadge status={r.status} />
              </span>
            </Link>
          )
        })}
        {register.length === 0 && (
          <div className="py-5 text-center text-[13px] text-sw-faint">No active projects</div>
        )}
      </section>
    </div>
  )
}
