import { Card, KpiTile } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'
import {
  computeProjectFinancials,
  outstandingInvoiceTotal,
  retentionHeld,
} from '../computeFinancials'

/**
 * Project Overview — port of legacy `D1v2`. The contract-vs-cost panel
 * with five headline KPIs, the BOQ delta summary, and a status surface
 * for outstanding invoices + retention held.
 *
 * The BOQ row-level breakdown lives on its own tab (`/boq`); this view
 * stays summary-level so it loads fast and reads at a glance.
 */
export function OverviewTab() {
  const project = useProject()
  const state = useAppState()
  if (!project) return null

  const fin = computeProjectFinancials(project)
  const outstanding = outstandingInvoiceTotal(project)
  const heldRetention = retentionHeld(state, project.id as string)
  const marginTone =
    fin.marginErosionPct < -5 ? 'danger' : fin.marginErosionPct < 0 ? 'warning' : 'success'

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiTile
          label="Contract Value"
          value={formatCurrency(fin.adjustedContractValue)}
          sublabel={
            fin.approvedVariations > 0
              ? `original + ${formatCurrency(fin.approvedVariations)} variations`
              : `target ${project.margin}% margin`
          }
        />
        <KpiTile
          label="Cost to Date"
          value={formatCurrency(fin.costToDate)}
          sublabel={`${formatCurrency(fin.committedToDate)} committed`}
        />
        <KpiTile
          label="Current Margin"
          tone={marginTone}
          value={`${fin.currentMarginPct.toFixed(1)}%`}
          sublabel={`target ${project.margin}%`}
        />
        <KpiTile
          label="Margin Erosion"
          tone={marginTone}
          value={`${fin.marginErosionPct >= 0 ? '+' : ''}${fin.marginErosionPct.toFixed(1)}%`}
          sublabel={fin.marginErosionPct >= 0 ? 'above target' : 'below target'}
        />
        <KpiTile
          label="Outstanding Invoices"
          value={formatCurrency(outstanding)}
          sublabel={`retention held ${formatCurrency(heldRetention)}`}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sw-muted">
              Contract vs Cost
            </h2>
            <StatusBadge status={project.contractType} />
          </header>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-sw-muted">Original budget</dt>
              <dd className="tabular-nums">{formatCurrency(fin.originalBudget)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sw-muted">Approved variations</dt>
              <dd className="tabular-nums">{formatCurrency(fin.approvedVariations)}</dd>
            </div>
            <div className="flex justify-between border-t border-sw-border pt-1.5 font-medium">
              <dt>Adjusted contract value</dt>
              <dd className="tabular-nums">{formatCurrency(fin.adjustedContractValue)}</dd>
            </div>
            <div className="flex justify-between pt-2">
              <dt className="text-sw-muted">Cost to date</dt>
              <dd className="tabular-nums">−{formatCurrency(fin.costToDate)}</dd>
            </div>
            <div className="flex justify-between border-t border-sw-border pt-1.5 font-medium">
              <dt>Remaining</dt>
              <dd
                className={`tabular-nums ${
                  fin.remainingContract < 0 ? 'text-sw-danger' : 'text-sw-success'
                }`}
              >
                {formatCurrency(fin.remainingContract)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5 space-y-3">
          <header>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sw-muted">
              Project info
            </h2>
          </header>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-sw-muted">State</dt>
              <dd>{project.state}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sw-muted">Contract form</dt>
              <dd>{project.contractForm}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sw-muted">Classification</dt>
              <dd>{project.contractClassification}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sw-muted">Cost codes</dt>
              <dd>{project.codes.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sw-muted">Variations</dt>
              <dd>
                {project.variations.length} total ·{' '}
                {project.variations.filter((v) => v.status === 'Approved').length} approved
              </dd>
            </div>
          </dl>
        </Card>
      </section>
    </div>
  )
}
