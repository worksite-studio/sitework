import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PrintLayout } from './PrintLayout'
import { useAppState } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { roundCents } from '@/lib/money'
import type { ProjectId } from '@/types'

/**
 * BOQ Export — cost codes with budget / variations / adjusted / actual /
 * overrun for the printed contract administration trail.
 *
 * Export options (4.7-G):
 *  - "Show margin & sell" reveals two derived columns — per-code Margin $
 *    (sell − cost) and Sell price (cost ÷ (1 − margin%)) — so the same export
 *    doubles as an internal cost sheet (hidden) or a client-facing sell sheet
 *    (shown). Hidden by default, preserving the original cost-only output.
 *  - Colour-coding (always on, existing palette tokens): Actual is green when
 *    at/under the adjusted budget, red when over; Variations are lilac.
 * `autoPrint` is off so options can be set before printing.
 */
export function BoqExportPrint() {
  const { projectId } = useParams<{ projectId: string }>()
  const state = useAppState()
  const project = state.projects.find((p) => p.id === (projectId as ProjectId))
  const [showMargin, setShowMargin] = useState(false)

  if (!project) {
    return (
      <PrintLayout title="BOQ — not found" backTo="/" autoPrint={false}>
        <p>Project not found.</p>
      </PrintLayout>
    )
  }

  const marginPct = project.margin ?? 15
  // Margin is a markup on the sell price: sell = cost ÷ (1 − margin%). Mirrors
  // the on-screen BOQ Summary (4.7-F) and the R0 contract-value maths.
  const sellOf = (cost: number) =>
    marginPct < 100 ? roundCents(cost / (1 - marginPct / 100)) : cost

  const rows = project.codes.map((c) => {
    const cost = c.budget || 0
    const sell = sellOf(cost)
    return {
      code: c,
      cost,
      sell,
      marginAmt: roundCents(sell - cost),
      vars: c.vars || 0,
      actual: c.actual || 0,
      adj: cost + (c.vars || 0),
    }
  })

  const totals = rows.reduce(
    (acc, r) => ({
      budget: acc.budget + r.cost,
      margin: acc.margin + r.marginAmt,
      sell: acc.sell + r.sell,
      vars: acc.vars + r.vars,
      actual: acc.actual + r.actual,
    }),
    { budget: 0, margin: 0, sell: 0, vars: 0, actual: 0 },
  )
  const adj = totals.budget + totals.vars
  const overrun = totals.actual - adj

  // Actual colour vs its adjusted budget — green at/under, red over.
  const actualClass = (actual: number, rowAdj: number) =>
    `text-right tabular-nums ${actual <= rowAdj ? 'text-sw-pos' : 'text-sw-neg'}`

  return (
    <PrintLayout title="BOQ export" backTo={`/projects/${project.id}/boq`} autoPrint={false}>
      {/* Export options — screen only, hidden from the printed page. */}
      <div className="print-hide mb-4 flex items-center gap-2 text-sm text-sw-muted">
        <label className="inline-flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={showMargin}
            onChange={(e) => setShowMargin(e.target.checked)}
          />
          Show margin &amp; sell columns
        </label>
        <span className="text-xs">· margin {marginPct}%</span>
      </div>

      <header className="flex items-start justify-between gap-6 mb-5">
        <div>
          <h1>{project.name}</h1>
          <p className="text-xs text-sw-muted">
            BOQ &amp; Budget · {project.contractType} · {project.state} · {project.codes.length}{' '}
            codes
          </p>
        </div>
        <div className="text-right text-xs text-sw-muted">
          Generated {new Date().toLocaleDateString('en-AU')}
        </div>
      </header>

      <section>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th className="text-right">Orig. budget</th>
              {showMargin && <th className="text-right">Margin ({marginPct}%)</th>}
              {showMargin && <th className="text-right">Sell</th>}
              <th className="text-right">Variations</th>
              <th className="text-right">Adj. budget</th>
              <th className="text-right">Actual</th>
              <th className="text-right">Overrun</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rowOver = r.actual - r.adj
              return (
                <tr key={r.code.id}>
                  <td className="tabular-nums">{r.code.code}</td>
                  <td>{r.code.desc}</td>
                  <td className="text-right tabular-nums">{formatCurrency(r.cost)}</td>
                  {showMargin && (
                    <td className="text-right tabular-nums text-sw-pos">
                      +{formatCurrency(r.marginAmt)}
                    </td>
                  )}
                  {showMargin && (
                    <td className="text-right tabular-nums font-semibold">
                      {formatCurrency(r.sell)}
                    </td>
                  )}
                  <td className="text-right tabular-nums text-sw-lilac">
                    {r.vars ? formatCurrency(r.vars) : '—'}
                  </td>
                  <td className="text-right tabular-nums">{formatCurrency(r.adj)}</td>
                  <td className={actualClass(r.actual, r.adj)}>{formatCurrency(r.actual)}</td>
                  <td className="text-right tabular-nums">
                    {rowOver > 0 ? `+${formatCurrency(rowOver)}` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Totals</td>
              <td className="text-right tabular-nums">{formatCurrency(totals.budget)}</td>
              {showMargin && (
                <td className="text-right tabular-nums text-sw-pos">
                  +{formatCurrency(totals.margin)}
                </td>
              )}
              {showMargin && (
                <td className="text-right tabular-nums font-semibold">
                  {formatCurrency(totals.sell)}
                </td>
              )}
              <td className="text-right tabular-nums text-sw-lilac">
                {totals.vars ? formatCurrency(totals.vars) : '—'}
              </td>
              <td className="text-right tabular-nums">{formatCurrency(adj)}</td>
              <td className={actualClass(totals.actual, adj)}>{formatCurrency(totals.actual)}</td>
              <td className="text-right tabular-nums">
                {overrun > 0 ? `+${formatCurrency(overrun)}` : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </PrintLayout>
  )
}
