import { useState } from 'react'
import { Button, StatBlock } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { useAppState } from '@/state/context'
import { ProjectForm } from '@/modules/Projects/ProjectForm'
import { useProject } from '../useProject'
import {
  computeProjectFinancials,
  outstandingInvoiceTotal,
  retentionHeld,
} from '../computeFinancials'

/**
 * Project Overview — port of legacy `D1`/`D1v2`: project header (24px name,
 * client · address, contract-type badge, Edit Project ghost), five editorial
 * stat blocks over ink rules, then ruled Contract-vs-Cost and Project-info
 * columns. Baseline styling throughout (PARITY gap 10).
 */
export function OverviewTab() {
  const project = useProject()
  const state = useAppState()
  const [editing, setEditing] = useState(false)
  if (!project) return null

  const fin = computeProjectFinancials(project)
  const outstanding = outstandingInvoiceTotal(project)
  const heldRetention = retentionHeld(state, project.id as string)
  const client = state.clients.find((c) => c.id === project.clientId)
  const marginAccent =
    fin.marginErosionPct < -5
      ? 'var(--sw-neg)'
      : fin.marginErosionPct < 0
        ? 'var(--sw-violet)'
        : 'var(--sw-pos)'

  return (
    <div>
      <header className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-sw-ink mb-1.5">
            {project.name}
          </h1>
          <div className="text-[13px] text-sw-dim">
            {client?.name}
            {client?.name && project.address ? ' · ' : ''}
            {project.address}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center border border-sw-rule rounded-[2px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-sw-dim">
            {project.contractType === 'cost-plus' ? 'Cost Plus' : 'Fixed Price'}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit Project
          </Button>
        </div>
      </header>

      <section className="mb-12 flex gap-12">
        <StatBlock
          label="Contract Value"
          value={formatCurrency(fin.adjustedContractValue)}
          sublabel={
            fin.approvedVariations > 0
              ? `original + ${formatCurrency(fin.approvedVariations)} variations`
              : `target ${project.margin}% margin`
          }
        />
        <StatBlock
          label="Cost to Date"
          value={formatCurrency(fin.costToDate)}
          sublabel={`${formatCurrency(fin.committedToDate)} committed`}
        />
        <StatBlock
          label="Current Margin"
          accent={marginAccent}
          value={`${fin.currentMarginPct.toFixed(1)}%`}
          sublabel={`target ${project.margin}%`}
        />
        <StatBlock
          label="Margin Erosion"
          accent={marginAccent}
          value={`${fin.marginErosionPct >= 0 ? '+' : ''}${fin.marginErosionPct.toFixed(1)}%`}
          sublabel={fin.marginErosionPct >= 0 ? 'above target' : 'below target'}
        />
        <StatBlock
          label="Outstanding Invoices"
          value={formatCurrency(outstanding)}
          sublabel={`retention held ${formatCurrency(heldRetention)}`}
        />
      </section>

      <section className="grid grid-cols-2 gap-12">
        <div className="border-t border-sw-ink pt-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-sw-ink">Contract vs Cost</h2>
            <StatusBadge status={project.contractType} />
          </header>
          <dl className="text-[13px]">
            <div className="flex justify-between border-b border-sw-rule-l py-2">
              <dt className="text-sw-dim">Original budget</dt>
              <dd className="font-mono">{formatCurrency(fin.originalBudget)}</dd>
            </div>
            <div className="flex justify-between border-b border-sw-rule-l py-2">
              <dt className="text-sw-dim">Approved variations</dt>
              <dd className="font-mono">{formatCurrency(fin.approvedVariations)}</dd>
            </div>
            <div className="flex justify-between border-b border-sw-rule-l py-2 font-semibold">
              <dt>Adjusted contract value</dt>
              <dd className="font-mono">{formatCurrency(fin.adjustedContractValue)}</dd>
            </div>
            <div className="flex justify-between border-b border-sw-rule-l py-2">
              <dt className="text-sw-dim">Cost to date</dt>
              <dd className="font-mono">−{formatCurrency(fin.costToDate)}</dd>
            </div>
            <div className="flex justify-between py-2 font-semibold">
              <dt>Remaining</dt>
              <dd
                className="font-mono"
                style={{
                  color: fin.remainingContract < 0 ? 'var(--sw-neg)' : 'var(--sw-pos)',
                }}
              >
                {formatCurrency(fin.remainingContract)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-sw-ink pt-5">
          <header className="mb-4">
            <h2 className="text-[13px] font-bold text-sw-ink">Project info</h2>
          </header>
          <dl className="text-[13px]">
            <div className="flex justify-between border-b border-sw-rule-l py-2">
              <dt className="text-sw-dim">State</dt>
              <dd>{project.state}</dd>
            </div>
            <div className="flex justify-between border-b border-sw-rule-l py-2">
              <dt className="text-sw-dim">Contract form</dt>
              <dd>{project.contractForm}</dd>
            </div>
            <div className="flex justify-between border-b border-sw-rule-l py-2">
              <dt className="text-sw-dim">Classification</dt>
              <dd>{project.contractClassification}</dd>
            </div>
            <div className="flex justify-between border-b border-sw-rule-l py-2">
              <dt className="text-sw-dim">Cost codes</dt>
              <dd>{project.codes.length}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sw-dim">Variations</dt>
              <dd>
                {project.variations.length} total ·{' '}
                {project.variations.filter((v) => v.status === 'Approved').length} approved
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {editing && <ProjectForm open initial={project} onClose={() => setEditing(false)} />}
    </div>
  )
}
