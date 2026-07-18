import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState, useDispatch } from '@/state/context'
import { Button, EntityLink, useConfirm, useToast } from '@/components/ui'
import { formatCurrency, formatCurrencyExact } from '@/lib/formatCurrency'
import { gstOf, incGst } from '@/lib/money'
import { formatDate } from '@/lib/formatDate'
import { useProject } from '../useProject'
import { codeDocTotals } from '../computeFinancials'
import { CostCodeForm } from './CostCodeForm'
import { BoqTemplateImportDialog } from './BoqTemplateImportDialog'
import { LineItemForm } from './LineItemForm'
import type { CostCode, CostCodeId, LineItem } from '@/types'

/**
 * BOQ & Budget — transliteration of legacy `w1` (R1, PARITY gap 16): the
 * EDIT surface, not the analytic table (that lives on Overview, `D1`).
 *
 * Every cost code is an expandable row: [+/−] · mono code · description ·
 * live committed (from invoices + POs, legacy `Gc`) coloured by budget
 * health · "/ budget" · ↑ ↓ ✎ × actions. Expanded: the line-items table,
 * "+ Add Line Item", and an amber Approved Variations sub-table when VOs
 * target the code. Header: Import Template + "+ Cost Code" (Export is
 * port-additive, kept per PARITY gap-12).
 */
export function BoqTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const confirm = useConfirm()
  const { toast } = useToast()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<CostCode | null>(null)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [addingItemFor, setAddingItemFor] = useState<CostCodeId | null>(null)
  const [editingItem, setEditingItem] = useState<{ ccId: CostCodeId; item: LineItem } | null>(null)
  // View controls (Phase 4.5-E): over-budget filter + spend sort. Sorting is a
  // view only — manual order stays in state, so the reorder arrows hide while
  // sorted and return when back to manual order.
  const [overBudgetOnly, setOverBudgetOnly] = useState(false)
  const [sortBySpend, setSortBySpend] = useState(false)

  const nextCode = useMemo(() => {
    if (!project) return '001'
    const max = project.codes
      .map((c) => Number(c.code))
      .filter((n) => Number.isFinite(n))
      .reduce((m, n) => Math.max(m, n), 0)
    return String(max + 1).padStart(3, '0')
  }, [project])

  if (!project) return null
  const purchases = state.purchases[project.id as string] ?? []

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Legacy `Ma` colour for the committed figure vs the code budget.
  function healthColor(budget: number, committed: number): string {
    if (!budget) return 'var(--sw-faint)'
    if (committed <= budget) return 'var(--sw-pos)'
    if (committed <= budget * 1.1) return 'var(--sw-violet)'
    return 'var(--sw-neg)'
  }

  async function deleteCode(c: CostCode) {
    if (!project) return
    const ok = await confirm({
      title: 'Delete cost code',
      message: `Delete cost code ${c.code}? This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    dispatch({ type: 'DELETE_CODE', projectId: project.id, codeId: c.id })
    toast(`Cost code ${c.code} deleted`, 'success')
  }

  async function deleteLineItem(ccId: CostCodeId, item: LineItem) {
    if (!project) return
    const ok = await confirm({
      title: 'Delete line item',
      message: `Delete "${item.desc}"? The code's budget will update.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    dispatch({ type: 'DELETE_LINE_ITEM', projectId: project.id, ccId, lineItemId: item.id })
    toast('Line item deleted', 'success')
  }

  // committed spend per code (legacy `Gc`), used for the over-budget filter and
  // the spend sort.
  const committedOf = (code: CostCode) =>
    codeDocTotals(code.id as string, project.invoices, purchases).committed
  let displayCodes = project.codes
  if (overBudgetOnly) displayCodes = displayCodes.filter((c) => committedOf(c) > (c.budget || 0))
  if (sortBySpend) displayCodes = [...displayCodes].sort((a, b) => committedOf(b) - committedOf(a))
  const manualOrder = !sortBySpend && !overBudgetOnly

  // BOQ totals (4.7-F): line items are the COST; margin is markup on sell
  // (contract = cost ÷ (1 − margin%)), GST on top. Makes explicit that the
  // BOQ figures exclude margin and GST.
  const costSubtotal = project.codes.reduce((s, c) => s + (c.budget || 0), 0)
  const marginPct = project.margin ?? 15
  const contractExGst = marginPct < 100 ? costSubtotal / (1 - marginPct / 100) : costSubtotal
  const marginAmount = contractExGst - costSubtotal

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h2 className="text-[26px] font-bold tracking-[-0.02em] text-sw-ink">BOQ & Budget</h2>
        <div className="flex gap-2">
          <Link
            to={`/print/boq/${project.id}`}
            target="_blank"
            className="inline-flex items-center border border-sw-rule rounded-[1px] bg-transparent px-4 h-9 text-sm font-medium text-sw-ink hover:bg-sw-muted/5 transition"
          >
            Export
          </Link>
          <Button variant="secondary" onClick={() => setImporting(true)}>
            Import Template
          </Button>
          <Button onClick={() => setCreating(true)}>+ Cost Code</Button>
        </div>
      </header>

      {/* BOQ totals summary (4.7-F): cost → margin → contract → GST → total. */}
      {project.codes.length > 0 && (
        <div className="mb-5 flex justify-end">
          <div className="w-[300px] border border-sw-rule rounded-[2px] p-4">
            <div className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
              BOQ Summary
            </div>
            <div className="flex justify-between py-1 text-[13px]">
              <span className="text-sw-dim">Cost subtotal</span>
              <span className="font-mono">{formatCurrency(costSubtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13px]">
              <span className="text-sw-dim">Margin ({marginPct}%)</span>
              <span className="font-mono text-sw-pos">+{formatCurrency(marginAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-sw-rule-l py-1 pt-1.5 text-[13px]">
              <span className="text-sw-dim">Contract (ex GST)</span>
              <span className="font-mono font-semibold">{formatCurrency(contractExGst)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13px]">
              <span className="text-sw-dim">GST (10%)</span>
              <span className="font-mono">+{formatCurrency(gstOf(contractExGst))}</span>
            </div>
            <div className="flex justify-between border-t border-sw-ink py-1 pt-1.5 text-[13px]">
              <span className="font-semibold">Total (inc GST)</span>
              <span className="font-mono font-bold">{formatCurrency(incGst(contractExGst))}</span>
            </div>
          </div>
        </div>
      )}

      {/* View controls (Phase 4.5-E): over-budget filter + spend sort. */}
      {project.codes.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setOverBudgetOnly((v) => !v)}
            aria-pressed={overBudgetOnly}
            className="cursor-pointer px-3 py-[5px] text-[12px]"
            style={{
              border: `1px solid ${overBudgetOnly ? 'var(--sw-neg)' : 'var(--sw-rule)'}`,
              background: overBudgetOnly ? 'var(--sw-neg)' : 'transparent',
              color: overBudgetOnly ? '#fff' : 'var(--sw-dim)',
            }}
          >
            Over budget only
          </button>
          <button
            type="button"
            onClick={() => setSortBySpend((v) => !v)}
            aria-pressed={sortBySpend}
            className="cursor-pointer px-3 py-[5px] text-[12px]"
            style={{
              border: `1px solid ${sortBySpend ? 'var(--sw-ink)' : 'var(--sw-rule)'}`,
              background: sortBySpend ? 'var(--sw-ink)' : 'transparent',
              color: sortBySpend ? '#fff' : 'var(--sw-dim)',
            }}
          >
            Sort by spend {sortBySpend ? '↓' : ''}
          </button>
        </div>
      )}

      {overBudgetOnly && displayCodes.length === 0 && (
        <div className="border-y border-sw-rule py-10 text-center text-[13px] text-sw-faint">
          No cost codes are over budget.
        </div>
      )}

      {displayCodes.map((code) => {
        const items = project.lineItems[code.id as string] ?? []
        const open = expanded.has(code.id as string)
        const live = codeDocTotals(code.id as string, project.invoices, purchases)
        const vos = project.variations.filter((v) => v.status === 'Approved' && v.ccId === code.id)
        return (
          <div key={code.id as string} className="border-b border-sw-rule">
            {/* Code header row */}
            <div
              onClick={() => toggle(code.id as string)}
              className="flex cursor-pointer items-center gap-3 border-b border-sw-rule bg-white py-3.5"
            >
              <span className="text-[10px] text-sw-faint">{open ? '−' : '+'}</span>
              <span className="w-[30px] font-mono text-[11px] text-sw-dim">{code.code}</span>
              <span className="flex-1 text-[13px] font-semibold text-sw-ink">{code.desc}</span>
              <EntityLink
                to={`../invoices?cc=${code.id}`}
                stopPropagation
                title="View invoices booked to this code"
                className="font-mono text-[13px] font-bold"
                style={{ color: healthColor(code.budget || 0, live.committed) }}
              >
                {formatCurrency(live.committed)}
              </EntityLink>
              <span className="font-mono text-[12px] text-sw-dim">
                / {formatCurrency(code.budget || 0)}
              </span>
              <span className="ml-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                {manualOrder && (
                  <>
                    <button
                      type="button"
                      title="Move up"
                      onClick={() =>
                        dispatch({ type: 'MOVE_CODE_UP', projectId: project.id, codeId: code.id })
                      }
                      className="px-[3px] text-[11px] leading-none text-sw-faint hover:text-sw-ink"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      onClick={() =>
                        dispatch({ type: 'MOVE_CODE_DOWN', projectId: project.id, codeId: code.id })
                      }
                      className="px-[3px] text-[11px] leading-none text-sw-faint hover:text-sw-ink"
                    >
                      ↓
                    </button>
                  </>
                )}
                <button
                  type="button"
                  title="Edit code"
                  onClick={() => setEditing(code)}
                  className="px-1 text-[10px] text-sw-dim hover:text-sw-ink"
                >
                  ✎
                </button>
                <button
                  type="button"
                  title="Delete code"
                  onClick={() => deleteCode(code)}
                  className="px-1 text-[11px] text-sw-danger"
                >
                  ×
                </button>
              </span>
            </div>

            {/* Expanded: line items + approved variations */}
            {open && (
              <div className="border-b border-sw-rule py-3 pl-6 pb-4">
                <table className="sw-table mb-2.5">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="text-right">Qty</th>
                      <th>Unit</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Amount</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((li) => (
                      <tr key={li.id as string} className="border-b border-sw-rule-l">
                        <td>{li.desc}</td>
                        <td className="text-right font-mono">{li.qty}</td>
                        <td className="text-sw-dim">{li.unit}</td>
                        <td className="text-right font-mono">{formatCurrencyExact(li.rate)}</td>
                        <td className="text-right font-mono font-semibold">
                          {formatCurrency(li.qty * li.rate)}
                        </td>
                        <td className="whitespace-nowrap text-right">
                          <button
                            type="button"
                            title="Edit line item"
                            onClick={() => setEditingItem({ ccId: code.id, item: li })}
                            className="px-1 text-[10px] text-sw-dim hover:text-sw-ink"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            title="Delete line item"
                            onClick={() => deleteLineItem(code.id, li)}
                            className="px-1 text-[11px] text-sw-danger"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-2.5 text-[12px] text-sw-faint">
                          No line items. Add one below.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => setAddingItemFor(code.id)}
                  className="text-[11px] font-medium text-sw-violet hover:underline"
                >
                  + Add Line Item
                </button>

                {vos.length > 0 && (
                  <div className="mt-3 border-t border-dashed border-[#E5E7EB] pt-2.5">
                    <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#D97706]">
                      Approved Variations
                    </div>
                    <table className="sw-table">
                      <thead>
                        <tr>
                          <th>VO Ref</th>
                          <th>Description</th>
                          <th>Date</th>
                          <th className="text-right">Variation Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vos.map((v) => (
                          <tr key={v.id as string} className="bg-[#FFFBEB]">
                            <td className="font-mono text-sw-dim">{v.id as string}</td>
                            <td>{v.desc}</td>
                            <td className="text-sw-dim">{v.date ? formatDate(v.date) : '—'}</td>
                            <td className="text-right font-mono font-semibold text-[#D97706]">
                              {formatCurrency(v.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end pt-1.5 pr-4">
                      <span className="font-mono text-[11px] font-semibold text-[#D97706]">
                        Total Variations: {formatCurrency(vos.reduce((s, v) => s + v.amount, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

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
      {addingItemFor && (
        <LineItemForm
          open
          onClose={() => setAddingItemFor(null)}
          projectId={project.id}
          ccId={addingItemFor}
        />
      )}
      {editingItem && (
        <LineItemForm
          open
          onClose={() => setEditingItem(null)}
          projectId={project.id}
          ccId={editingItem.ccId}
          initial={editingItem.item}
        />
      )}
    </div>
  )
}
