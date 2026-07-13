import { useState } from 'react'
import { useAppState } from '@/state/context'
import { Button } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { useProject } from '../useProject'
import { reconcilePcPs } from '../computeFinancials'
import { PcPsForm } from './PcPsForm'
import type { PrimeCostItem, ProvisionalSum } from '@/types'

type Item = PrimeCostItem | ProvisionalSum

/**
 * PC & PS — transliteration of legacy `Pcps` (R6, PARITY gap 5 + gap-12
 * anatomy): 26px title + margin-on-excess explainer, two sections with
 * "+ Add PC Item" / "+ Add PS Item" buttons (`pcf`/`psf` forms), row-click
 * edit, legacy value display (— for zero actual/margin, abs-with-sign
 * variance and net), and the inline right-aligned totals footer line.
 * Maths via reconcilePcPs (R0): net = variance + margin-on-excess.
 */
export function PcPsTab() {
  const project = useProject()
  const state = useAppState()
  const [adding, setAdding] = useState<'pc' | 'ps' | null>(null)
  const [editing, setEditing] = useState<{ kind: 'pc' | 'ps'; item: Item } | null>(null)
  if (!project) return null

  const pcRows: PrimeCostItem[] = state.primeCostItems[project.id as string] ?? []
  const psRows: ProvisionalSum[] = state.provisionalSums[project.id as string] ?? []

  return (
    <div>
      <header className="mb-6">
        <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">PC & PS</h2>
        <div className="text-[13px] text-sw-dim">
          Prime Cost Items and Provisional Sums. Margin is applied on excess only — never on the
          full actual cost.
        </div>
      </header>

      <Section
        title="Prime Cost Items"
        addLabel="+ Add PC Item"
        rows={pcRows}
        onAdd={() => setAdding('pc')}
        onEdit={(item) => setEditing({ kind: 'pc', item })}
      />
      <Section
        title="Provisional Sums"
        addLabel="+ Add PS Item"
        rows={psRows}
        onAdd={() => setAdding('ps')}
        onEdit={(item) => setEditing({ kind: 'ps', item })}
      />

      {adding && (
        <PcPsForm open onClose={() => setAdding(null)} projectId={project.id} kind={adding} />
      )}
      {editing && (
        <PcPsForm
          open
          onClose={() => setEditing(null)}
          projectId={project.id}
          kind={editing.kind}
          initial={editing.item}
        />
      )}
    </div>
  )
}

/** Legacy `k()` display: absolute value, "+" prefix on positives only. */
function signedAbs(n: number): string {
  return `${n > 0 ? '+' : ''}${formatCurrency(Math.abs(n))}`
}

interface SectionProps {
  title: string
  addLabel: string
  rows: Item[]
  onAdd: () => void
  onEdit: (item: Item) => void
}

function Section({ title, addLabel, rows, onAdd, onEdit }: SectionProps) {
  const totals = rows.reduce(
    (acc, r) => {
      const calc = reconcilePcPs(r.allowance, r.actualCost, r.marginRate)
      return {
        allowance: acc.allowance + calc.allowance,
        actualCost: acc.actualCost + calc.actualCost,
        net: acc.net + calc.netToClaim,
      }
    },
    { allowance: 0, actualCost: 0, net: 0 },
  )

  return (
    <div className="mb-9">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-[18px] font-bold tracking-[-0.01em] text-sw-ink">{title}</h3>
        <Button onClick={onAdd}>{addLabel}</Button>
      </div>
      <div className="border-t border-sw-ink bg-white">
        <table className="sw-table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-right">Allowance</th>
              <th className="text-right">Actual Cost</th>
              <th className="text-right">Variance</th>
              <th className="text-right">Margin on Excess</th>
              <th className="text-right">Net to Claim</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-[13px] text-sw-faint">
                  No {title.toLowerCase()} yet — click {addLabel} to add one.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const calc = reconcilePcPs(r.allowance, r.actualCost, r.marginRate)
                const col =
                  calc.variance > 0
                    ? 'var(--sw-neg)'
                    : calc.variance < 0
                      ? 'var(--sw-pos)'
                      : 'var(--sw-dim)'
                return (
                  <tr
                    key={r.id as string}
                    onClick={() => onEdit(r)}
                    className="cursor-pointer border-b border-sw-rule-l"
                  >
                    <td>{r.description}</td>
                    <td className="text-right font-mono">{formatCurrency(calc.allowance)}</td>
                    <td className="text-right font-mono">
                      {calc.actualCost > 0 ? formatCurrency(calc.actualCost) : '—'}
                    </td>
                    <td className="text-right font-mono" style={{ color: col }}>
                      {calc.variance === 0 ? '—' : signedAbs(calc.variance)}
                    </td>
                    <td className="text-right font-mono text-sw-dim">
                      {calc.marginOnExcess > 0 ? formatCurrency(calc.marginOnExcess) : '—'}
                    </td>
                    <td className="text-right font-mono font-semibold" style={{ color: col }}>
                      {calc.netToClaim === 0 ? '—' : signedAbs(calc.netToClaim)}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="mt-2 flex justify-end gap-8 px-4 py-2.5 text-[11px] text-sw-dim">
          <span>
            Allowance total:{' '}
            <strong className="font-mono text-sw-ink">{formatCurrency(totals.allowance)}</strong>
          </span>
          <span>
            Actual total:{' '}
            <strong className="font-mono text-sw-ink">{formatCurrency(totals.actualCost)}</strong>
          </span>
          <span>
            Net to Claim:{' '}
            <strong className="font-mono" style={{ color: 'var(--sw-pos)' }}>
              {formatCurrency(Math.abs(totals.net))}
            </strong>
          </span>
        </div>
      )}
    </div>
  )
}
