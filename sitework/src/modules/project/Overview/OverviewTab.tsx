import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { useAppState, useDispatch } from '@/state/context'
import { ProjectForm } from '@/modules/Projects/ProjectForm'
import { useProject } from '../useProject'
import { computeProjectFinancials } from '../computeFinancials'

/**
 * Project Overview — transliteration of legacy `D1` followed by `D1v2`'s
 * Contract-vs-Cost panel (R1, PARITY gaps 13 + 8a + 9-button):
 *
 *   header (name · client · address · contract-type chip, Edit Project ghost)
 *   → five D1 stat blocks over 1px ink rules
 *   → the analytic BOQ table (zero-placeholder codes filtered out)
 *   → D1v2 "Contract vs Cost" 4-KPI panel with Duplicate Project.
 *
 * Legacy is the spec — layout, copy, colours and maths mirror the source.
 */
export function OverviewTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)

  const fin = useMemo(() => {
    if (!project) return null
    const purchases = state.purchases[project.id as string] ?? []
    return computeProjectFinancials(project, purchases)
  }, [project, state.purchases])
  if (!project || !fin) return null

  const client = state.clients.find((c) => c.id === project.clientId)
  const marginTarget = project.margin ?? 15

  const approvedCount = project.variations.filter((v) => v.status === 'Approved').length
  const pendingCount = project.variations.filter((v) => v.status === 'Pending').length
  const pctSpent = ((fin.codeActualTotal / fin.originalBudget) * 100 || 0).toFixed(0)

  // Legacy D1 tbody filter: hide all-zero placeholder codes (44 → 25).
  const visibleCodes = project.codes.filter(
    (c) =>
      c.budget !== 0 ||
      c.committed !== 0 ||
      (c.actual != null && c.actual !== 0) ||
      project.variations.some((v) => v.status === 'Approved' && v.ccId === c.id),
  )

  // Legacy `Ma` — committed vs (adjusted) budget health.
  function health(budget: number, committed: number): 'On Budget' | 'At Risk' | 'Over' | '—' {
    if (!budget) return '—'
    if (committed <= budget) return 'On Budget'
    if (committed <= budget * 1.1) return 'At Risk'
    return 'Over'
  }

  // D1v2 derived colours.
  const marginOk = fin.currentMarginPct >= marginTarget
  const erosion = fin.marginErosionPct
  const erosionColor =
    erosion > 2 ? 'var(--sw-neg)' : erosion > 0 ? 'var(--sw-violet)' : 'var(--sw-pos)'

  function duplicateProject() {
    if (!project) return
    // Legacy shell onDuplicate: dispatch, then return to the projects list.
    // Name suffix per legacy Z1: "<name> (Copy)".
    dispatch({
      type: 'DUPLICATE_PROJECT',
      projectId: project.id,
      newName: `${project.name} (Copy)`,
    })
    navigate('/projects')
  }

  return (
    <div>
      {/* ── D1 header ─────────────────────────────────────────────────── */}
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
          <span className="mt-2 inline-block border border-sw-rule rounded-[2px] px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.08em] text-sw-dim">
            {project.contractType === 'cost-plus' ? 'Cost Plus' : 'Fixed Price'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit Project
        </Button>
      </header>

      {/* ── D1 stat row (1px ink top rules, 24px values) ──────────────── */}
      <div className="mb-10 flex gap-12">
        <Stat
          label="Contract Value"
          value={formatCurrency(fin.contractValue)}
          sub={`target ${marginTarget}% margin`}
        />
        <Stat
          label="Original Budget"
          value={formatCurrency(fin.originalBudget)}
          sub={`${pctSpent}% spent`}
        />
        <Stat
          label="Approved Variations"
          value={formatCurrency(fin.approvedVariations)}
          color={fin.approvedVariations > 0 ? 'var(--sw-violet)' : 'var(--sw-dim)'}
          sub={`${approvedCount} approved / ${pendingCount} pending`}
        />
        <Stat
          label="True Overrun"
          value={fin.trueOverrun > 0 ? formatCurrency(fin.trueOverrun) : 'Within Budget'}
          color={fin.trueOverrun > 0 ? 'var(--sw-neg)' : 'var(--sw-pos)'}
          sub={
            fin.trueOverrun > 0
              ? 'Above adj. budget'
              : `Adj. budget: ${formatCurrency(fin.adjustedBudget)}`
          }
        />
        <Stat
          label="Outstanding Invoices"
          value={formatCurrency(fin.invoicesOutstanding)}
          color={fin.invoicesOutstanding > 0 ? 'var(--sw-violet)' : 'var(--sw-pos)'}
          sub={`$${(fin.invoicesPaid / 1e3).toFixed(0)}K paid`}
        />
      </div>

      {/* ── D1 analytic BOQ table ─────────────────────────────────────── */}
      <div className="border-t border-sw-ink bg-white">
        <table className="sw-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th className="text-right">Orig. Budget</th>
              <th className="text-right">Variations</th>
              <th className="text-right">Adj. Budget</th>
              <th className="text-right">Actual</th>
              <th className="text-right">Overrun</th>
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleCodes.map((code) => {
              const va = project.variations
                .filter((v) => v.status === 'Approved' && v.ccId === code.id)
                .reduce((s, v) => s + (v.amount || 0), 0)
              const adjBudget = (code.budget || 0) + va
              const trueOverrun = (code.committed || 0) - adjBudget
              return (
                <tr key={code.id as string} className="border-b border-sw-rule-l">
                  <td className="font-mono text-sw-dim">{code.code}</td>
                  <td>{code.desc}</td>
                  <td className="text-right font-mono">{formatCurrency(code.budget || 0)}</td>
                  <td
                    className="text-right font-mono"
                    style={{ color: va > 0 ? 'var(--sw-violet)' : 'var(--sw-dim)' }}
                  >
                    {va > 0 ? formatCurrency(va) : '—'}
                  </td>
                  <td className="text-right font-mono font-semibold">
                    {formatCurrency(adjBudget)}
                  </td>
                  <td className="text-right font-mono">{formatCurrency(code.actual || 0)}</td>
                  {/* Legacy k() displays the absolute value; "+" flags a true overrun. */}
                  <td
                    className="text-right font-mono"
                    style={{ color: trueOverrun > 0 ? 'var(--sw-neg)' : 'var(--sw-pos)' }}
                  >
                    {trueOverrun > 0 ? '+' : ''}
                    {formatCurrency(Math.abs(trueOverrun))}
                  </td>
                  <td className="text-right">
                    <StatusBadge status={health(adjBudget, code.committed || 0)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── D1v2 Contract vs Cost panel ───────────────────────────────── */}
      <section className="mt-8 border-t-2 border-sw-ink pt-6">
        <header className="mb-5 flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-sw-ink">
            Contract vs Cost
          </h2>
          <button
            type="button"
            onClick={duplicateProject}
            className="border border-sw-rule rounded-[1px] bg-transparent px-3 py-[5px] text-[11px] text-sw-dim cursor-pointer hover:text-sw-ink transition"
          >
            Duplicate Project
          </button>
        </header>
        <div className="grid grid-cols-4 gap-6">
          <Kpi
            label="Contract Value"
            value={formatCurrency(fin.adjustedContractValue)}
            sub={
              fin.approvedVariations > 0
                ? `incl. ${formatCurrency(fin.approvedVariations)} vars`
                : undefined
            }
          />
          <Kpi label="Cost to Date" value={formatCurrency(fin.costToDate)} sub="committed" />
          <Kpi
            label="Current Margin"
            value={`${fin.currentMarginPct.toFixed(1)}%`}
            color={marginOk ? 'var(--sw-pos)' : 'var(--sw-neg)'}
            accent={marginOk ? 'var(--sw-pos)' : 'var(--sw-neg)'}
            sub={`target ${marginTarget}%`}
          />
          <Kpi
            label="Margin Erosion"
            value={`${erosion > 0 ? '-' : '+'}${Math.abs(erosion).toFixed(1)}%`}
            color={erosionColor}
            accent={erosionColor}
            sub={erosion > 0 ? 'below target' : 'above target'}
          />
        </div>
      </section>

      {editing && <ProjectForm open initial={project} onClose={() => setEditing(false)} />}
    </div>
  )
}

/** Legacy D1 stat block: 1px ink top rule, 9px label, 24px value, 11px faint sub. */
function Stat({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string
  color?: string
  sub?: string
}) {
  return (
    // Content-width like legacy `h` (no flex-1) — the ink rule spans the text.
    <div className="border-t border-sw-ink pt-3">
      <div className="mb-2 text-[9px] font-medium uppercase tracking-[0.1em] text-sw-dim">
        {label}
      </div>
      <div
        className="mb-[3px] text-[24px] font-bold tracking-[-0.02em]"
        style={{ color: color ?? 'var(--sw-ink)' }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-sw-faint">{sub}</div>}
    </div>
  )
}

/** Legacy D1v2 KPI cell: 1px rule top, optional 3px left accent, 22px value. */
function Kpi({
  label,
  value,
  color,
  accent,
  sub,
}: {
  label: string
  value: string
  color?: string
  accent?: string
  sub?: string
}) {
  return (
    <div
      className="border-t border-sw-rule py-3"
      style={accent ? { borderLeft: `3px solid ${accent}`, paddingLeft: 10 } : undefined}
    >
      <div className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-sw-dim">
        {label}
      </div>
      <div className="text-[22px] font-bold" style={{ color: color ?? 'var(--sw-ink)' }}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-sw-dim">{sub}</div>}
    </div>
  )
}
