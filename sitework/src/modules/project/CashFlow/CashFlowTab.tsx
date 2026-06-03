import { useMemo } from 'react'
import { Card, EmptyState } from '@/components/ui'
import { formatCurrency } from '@/lib/formatCurrency'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'

/**
 * Cash Flow tab — port of legacy j1v2. Outflow forecast by month, derived
 * from invoices (due date + amount, excluding Paid + Disputed) and POs
 * (dueDate + amount, excluding received).
 */
export function CashFlowTab() {
  const project = useProject()
  const state = useAppState()

  const monthly = useMemo(() => {
    if (!project) return new Map<string, { outflow: number; count: number }>()
    const buckets = new Map<string, { outflow: number; count: number }>()
    const add = (date: string | null | undefined, amount: number) => {
      if (!date) return
      const key = date.slice(0, 7) // YYYY-MM
      const bucket = buckets.get(key) ?? { outflow: 0, count: 0 }
      bucket.outflow += amount
      bucket.count += 1
      buckets.set(key, bucket)
    }
    for (const inv of project.invoices) {
      if (inv.status === 'Paid' || inv.status === 'Disputed') continue
      add(inv.due, inv.amount || 0)
    }
    const pos = state.purchases[project.id as string] ?? []
    for (const po of pos) {
      if (po.status === 'received') continue
      add(po.dueDate, po.amount || 0)
    }
    return new Map([...buckets.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)))
  }, [project, state])

  if (!project) return null

  const total = [...monthly.values()].reduce((s, b) => s + b.outflow, 0)
  const maxOutflow = Math.max(1, ...[...monthly.values()].map((b) => b.outflow))

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Cash Flow</h2>
        <p className="text-xs text-sw-muted">
          Forecast outflow by month — invoices due (excluding Paid + Disputed) + POs raised
          (excluding received). Total committed:{' '}
          <span className="font-medium text-sw-text">{formatCurrency(total)}</span>
        </p>
      </header>

      {monthly.size === 0 ? (
        <EmptyState
          title="No outflow forecast"
          description="Add invoices with due dates or POs with delivery dates to see a forecast."
        />
      ) : (
        <Card className="p-4 space-y-2">
          {[...monthly.entries()].map(([month, b]) => {
            const pct = (b.outflow / maxOutflow) * 100
            return (
              <div key={month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sw-muted">{formatMonthHeader(month)}</span>
                  <span className="tabular-nums">
                    <span className="font-medium">{formatCurrency(b.outflow)}</span>{' '}
                    <span className="text-xs text-sw-muted">
                      · {b.count} {b.count === 1 ? 'item' : 'items'}
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded bg-sw-muted/10 overflow-hidden">
                  <div
                    className="h-full bg-sw-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

function formatMonthHeader(yyyymm: string): string {
  const date = new Date(`${yyyymm}-01`)
  if (Number.isNaN(date.getTime())) return yyyymm
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}
