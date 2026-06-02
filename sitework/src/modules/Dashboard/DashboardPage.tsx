import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAppState } from '@/state/context'
import { Card, EmptyState, KpiTile } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { computeDashboardKpis, computePipelineCounts } from './computeKpis'

const STAGE_LABEL: Record<string, string> = {
  prospect: 'Prospect',
  tendering: 'Tendering',
  won: 'Won',
  lost: 'Lost',
}

/**
 * Dashboard — port of legacy `Y1v2`. Headline KPI tiles + Project Health
 * (active projects, clickable into the project overview) + Pipeline counts
 * (clickable into Leads). Compliance Alerts uses the same sub-cert /
 * insurance-expiry signals the Calendar tab (Phase 1.5-D) surfaces.
 */
export function DashboardPage() {
  const state = useAppState()
  const kpis = useMemo(() => computeDashboardKpis(state), [state])
  const pipeline = useMemo(() => computePipelineCounts(state), [state])
  const active = state.projects.filter((p) => p.status === 'live')

  const complianceTone =
    kpis.expiredCertsCount > 0 ? 'danger' : kpis.expiringCertsCount > 0 ? 'warning' : 'neutral'

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-sw-muted">
          Portfolio overview — active projects, money in motion, compliance flags.
        </p>
      </header>

      {/* KPI tiles */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiTile
          label="Active Projects"
          value={kpis.activeProjectsCount}
          sublabel={`${state.projects.length - kpis.activeProjectsCount} other`}
        />
        <KpiTile
          label="Outstanding Invoices"
          value={formatCurrency(kpis.outstandingInvoicesTotal)}
          sublabel={`${kpis.outstandingInvoicesCount} approved/pending`}
        />
        <KpiTile
          label="Open Variations"
          value={formatCurrency(kpis.openVariationsTotal)}
          sublabel={`${kpis.openVariationsCount} pending approval`}
        />
        <KpiTile
          label="Portfolio Margin"
          value={`${kpis.portfolioMarginPct.toFixed(1)}%`}
          sublabel="Across active projects"
        />
        <KpiTile
          label="Compliance Alerts"
          tone={complianceTone}
          value={kpis.expiredCertsCount + kpis.expiringCertsCount}
          sublabel={
            kpis.expiredCertsCount > 0
              ? `${kpis.expiredCertsCount} expired, ${kpis.expiringCertsCount} ≤30d`
              : kpis.expiringCertsCount > 0
                ? `${kpis.expiringCertsCount} expiring ≤30d`
                : 'All current'
          }
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Health */}
        <section className="lg:col-span-2 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sw-muted">
            Project Health
          </h2>
          {active.length === 0 ? (
            <EmptyState title="No active projects" description="Create a project to see it here." />
          ) : (
            <Card>
              <ul className="divide-y divide-sw-border">
                {active.map((p) => {
                  const budget = p.codes.reduce((s, c) => s + c.budget, 0)
                  const actual = p.codes.reduce((s, c) => s + c.actual, 0)
                  const overrun = actual - budget
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/projects/${p.id}/overview`}
                        className="block px-4 py-3 hover:bg-sw-muted/5 transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{p.name}</div>
                            <div className="text-xs text-sw-muted">
                              {p.id} · {p.state} · {p.contractType}
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <div className="font-medium text-sw-text">
                              {formatCurrency(actual)} <span className="text-sw-muted">/</span>{' '}
                              {formatCurrency(budget)}
                            </div>
                            {budget > 0 && (
                              <div className={overrun > 0 ? 'text-sw-danger' : 'text-sw-success'}>
                                {overrun > 0 ? `+${formatCurrency(overrun)} over` : 'On budget'}
                              </div>
                            )}
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </section>

        {/* Pipeline */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sw-muted">Pipeline</h2>
          <Card className="p-4 space-y-2">
            {(['prospect', 'tendering', 'won', 'lost'] as const).map((stage) => (
              <Link
                key={stage}
                to="/leads"
                className="flex items-center justify-between text-sm py-1 hover:text-sw-info transition"
              >
                <span>{STAGE_LABEL[stage]}</span>
                <span className="font-medium tabular-nums">{pipeline[stage]}</span>
              </Link>
            ))}
            {state.leads.length === 0 && <p className="text-xs text-sw-muted">No leads yet.</p>}
          </Card>
        </section>
      </div>
    </div>
  )
}
