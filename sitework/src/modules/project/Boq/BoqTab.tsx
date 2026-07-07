import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from '@/state/context'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { useProject } from '../useProject'
import { CostCodeForm } from './CostCodeForm'
import { BoqTemplateImportDialog } from './BoqTemplateImportDialog'
import type { CostCode } from '@/types'

/**
 * BOQ tab — port of legacy `D1` (the BOQ table) + the row-edit + form
 * (`w1`/`p1`) + template-import button (`Bti`).
 *
 * Each row: code, description, original budget, approved-variation overlay,
 * adjusted budget, actual cost, overrun, on/over-budget status. Row click
 * opens the cost-code form for edit. "+ Cost Code" auto-numbers the next
 * code (Session 28 / 1.5-B fix).
 */
export function BoqTab() {
  const project = useProject()
  const dispatch = useDispatch()
  const [editing, setEditing] = useState<CostCode | null>(null)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)

  // Pre-compute the next auto code as a zero-padded 3-digit string after the
  // highest numeric code currently on the project, e.g. "045". Falls back to
  // "001" if no codes exist.
  const nextCode = useMemo(() => {
    if (!project) return '001'
    const max = project.codes
      .map((c) => Number(c.code))
      .filter((n) => Number.isFinite(n))
      .reduce((m, n) => Math.max(m, n), 0)
    return String(max + 1).padStart(3, '0')
  }, [project])

  if (!project) return null

  const rows = project.codes
  const totals = rows.reduce(
    (acc, r) => ({
      budget: acc.budget + (r.budget || 0),
      vars: acc.vars + (r.vars || 0),
      actual: acc.actual + (r.actual || 0),
    }),
    { budget: 0, vars: 0, actual: 0 },
  )

  function deleteCode(c: CostCode) {
    if (!project) return
    const ok = window.confirm(
      `Delete cost code ${c.code} "${c.desc}"? Variations + invoices that reference it stay but become orphaned.`,
    )
    if (!ok) return
    dispatch({ type: 'DELETE_CODE', projectId: project.id, codeId: c.id })
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-[18px] font-bold tracking-[-0.01em]">BOQ & Budget</h2>
        <div className="flex gap-2">
          <Link
            to={`/print/boq/${project.id}`}
            target="_blank"
            className="inline-flex items-center rounded-md border border-sw-border bg-sw-surface px-4 h-9 text-sm font-medium hover:bg-sw-muted/5 transition"
          >
            Export
          </Link>
          <Button variant="secondary" onClick={() => setImporting(true)}>
            Import from template
          </Button>
          <Button onClick={() => setCreating(true)}>+ Cost Code</Button>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="No cost codes yet"
          description="Add cost codes manually or import from a BOQ template to populate the project budget."
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setImporting(true)}>
                Import from template
              </Button>
              <Button onClick={() => setCreating(true)}>+ Cost Code</Button>
            </div>
          }
        />
      ) : (
        <div>
          <table className="sw-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th className="text-right">Orig. budget</th>
                <th className="text-right">Variations</th>
                <th className="text-right">Adj. budget</th>
                <th className="text-right">Actual</th>
                <th className="text-right">Overrun</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const adj = (c.budget || 0) + (c.vars || 0)
                const overrun = (c.actual || 0) - adj
                return (
                  <tr
                    key={c.id}
                    onClick={() => setEditing(c)}
                    className="border-b border-sw-border last:border-0 cursor-pointer hover:bg-sw-muted/5"
                  >
                    <td className="font-mono">{c.code}</td>
                    <td>{c.desc}</td>
                    <td className="text-right font-mono">{formatCurrency(c.budget || 0)}</td>
                    <td className="text-right font-mono">
                      {c.vars ? formatCurrency(c.vars) : '—'}
                    </td>
                    <td className="text-right font-mono">{formatCurrency(adj)}</td>
                    <td className="text-right font-mono">{formatCurrency(c.actual || 0)}</td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${
                        overrun > 0 ? 'text-sw-danger' : 'text-sw-muted'
                      }`}
                    >
                      {overrun > 0 ? `+${formatCurrency(overrun)}` : '—'}
                    </td>
                    <td>
                      <StatusBadge
                        variant={overrun > 0 ? 'danger' : 'success'}
                        label={overrun > 0 ? 'OVER BUDGET' : 'ON BUDGET'}
                        status="—"
                      />
                    </td>
                    <td
                      className="text-right"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => deleteCode(c)}
                        aria-label={`Delete code ${c.code}`}
                        className="text-sw-muted hover:text-sw-danger transition px-2"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-sw-muted/5 font-medium text-sm">
                <td colSpan={2} className="text-sw-muted text-xs uppercase">
                  Totals
                </td>
                <td className="text-right font-mono">{formatCurrency(totals.budget)}</td>
                <td className="text-right font-mono">
                  {totals.vars ? formatCurrency(totals.vars) : '—'}
                </td>
                <td className="text-right font-mono">
                  {formatCurrency(totals.budget + totals.vars)}
                </td>
                <td className="text-right font-mono">{formatCurrency(totals.actual)}</td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <CostCodeForm
        open={creating}
        onClose={() => setCreating(false)}
        projectId={project.id}
        nextCode={nextCode}
      />
      {editing && (
        <CostCodeForm
          open
          onClose={() => setEditing(null)}
          projectId={project.id}
          initial={editing}
        />
      )}
      <BoqTemplateImportDialog
        open={importing}
        onClose={() => setImporting(false)}
        projectId={project.id}
      />
    </div>
  )
}
