import { useAppState } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { useProject } from '../useProject'
import { computeProjectFinancials } from '../computeFinancials'

/**
 * Cash Flow — transliteration of legacy `j1` + `j1v2` (R3, PARITY gaps
 * 14 + 8b):
 *
 *   j1: header + three stat blocks (Total Committed = paid + approved
 *   invoices / Paid to Date / Outstanding), the Monthly Cost Outflows
 *   stacked bar chart (paid green under approved lilac) with legend, and
 *   the month table (rows only where total > 0; Cumulative is a running
 *   sum of PAID only — legacy behaviour).
 *
 *   j1v2: the Forward Cash Flow Forecast — 12 months from today, committed
 *   (approved invoices due + un-received POs dated in month, #2563EB) with
 *   the remaining contract spread across empty months (#BFDBFE). The
 *   "Committed" legend entry renders only when a committed total exists
 *   (gap 8b). Three mini stats close the section.
 *
 * Legacy quirks preserved: j1's month window is the fixed seed-era range
 * Sep-25 → Jun-26, and the cumulative column tracks paid only.
 */
export function CashFlowTab() {
  const project = useProject()
  const state = useAppState()
  if (!project) return null

  const purchases = state.purchases[project.id as string] ?? []
  const fin = computeProjectFinancials(project, purchases)

  // ── j1: historical outflows (fixed legacy window, s = 8..17) ──────────
  interface HistMonth {
    key: string
    label: string
    paid: number
    approved: number
    total: number
  }
  const hist: HistMonth[] = []
  for (let s = 8; s <= 17; s++) {
    const year = 2025 + Math.floor(s / 12)
    const monthIdx = s % 12
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
    const label = new Date(year, monthIdx, 1).toLocaleDateString('en-AU', {
      month: 'short',
      year: '2-digit',
    })
    const paid = project.invoices
      .filter((i) => i.status === 'Paid' && i.date?.startsWith(key))
      .reduce((sum, i) => sum + (i.amount || 0), 0)
    const approved = project.invoices
      .filter((i) => i.status === 'Approved' && i.date?.startsWith(key))
      .reduce((sum, i) => sum + (i.amount || 0), 0)
    hist.push({ key, label, paid, approved, total: paid + approved })
  }
  const histMax = Math.max(...hist.map((m) => m.total), 1)
  const paidTotal = fin.invoicesPaid
  const approvedTotal = fin.invoicesOutstanding
  const HIST_BAR_H = 160
  const HIST_BAR_W = 28
  let cumulative = 0

  // ── j1v2: forward forecast (12 months from today) ─────────────────────
  interface FcMonth {
    key: string
    label: string
    committed: number
    forecast: number
  }
  const today = new Date()
  const remaining = Math.max(fin.contractValue - paidTotal, 0)
  const approvedInvs = project.invoices.filter((i) => i.status === 'Approved')
  const pendingPOs = purchases.filter((p) => p.status !== 'received')
  const fc: FcMonth[] = []
  for (let i = 0; i < 12; i++) {
    const d2 = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const key = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}`
    const label = d2.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
    const invsDue = approvedInvs
      .filter((inv) => inv.due && inv.due.startsWith(key))
      .reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const posDue = pendingPOs
      .filter((p) => p.date && p.date.startsWith(key))
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    fc.push({ key, label, committed: invsDue + posDue, forecast: 0 })
  }
  const fcCommitted = fc.reduce((sum, m) => sum + m.committed, 0)
  const toForecast = Math.max(remaining - fcCommitted, 0)
  const emptyMonths = fc.filter((m) => m.committed === 0).length || 1
  for (const m of fc) {
    if (m.committed === 0) m.forecast = toForecast / emptyMonths
  }
  const fcMax = Math.max(...fc.map((m) => m.committed + m.forecast), 1)
  const FC_BAR_H = 140

  return (
    <div>
      {/* ── j1 header + stats ─────────────────────────────────────────── */}
      <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Cash Flow</h2>
      <div className="mb-6 text-[13px] text-sw-dim">Cost outflows by month</div>

      <div className="mb-8 flex gap-9">
        <CfStat label="Total Committed" value={formatCurrency(paidTotal + approvedTotal)} />
        <CfStat label="Paid to Date" value={formatCurrency(paidTotal)} color="var(--sw-pos)" />
        <CfStat
          label="Outstanding"
          value={formatCurrency(approvedTotal)}
          color={approvedTotal > 0 ? 'var(--sw-violet)' : 'var(--sw-pos)'}
        />
      </div>

      {/* ── j1 monthly outflows chart ─────────────────────────────────── */}
      <div className="mb-4 border-b border-sw-rule bg-white p-6">
        <div className="mb-4 text-[12px] font-semibold text-sw-ink">Monthly Cost Outflows</div>
        <div className="flex items-end gap-2" style={{ height: HIST_BAR_H + 28 }}>
          {hist.map((m) => (
            <div key={m.key} className="flex shrink-0 flex-col items-center gap-1">
              <div
                className="flex flex-col justify-end gap-px"
                style={{ height: HIST_BAR_H, width: HIST_BAR_W }}
              >
                {m.approved > 0 && (
                  <div
                    style={{
                      width: HIST_BAR_W,
                      height: (m.approved / histMax) * HIST_BAR_H,
                      background: 'var(--sw-accent-bg)',
                      border: '1px solid #C7D2FE',
                      borderRadius: '1px 1px 0 0',
                    }}
                  />
                )}
                {m.paid > 0 && (
                  <div
                    style={{
                      width: HIST_BAR_W,
                      height: (m.paid / histMax) * HIST_BAR_H,
                      background: 'var(--sw-pos)',
                      borderRadius: m.approved > 0 ? '0' : '3px 3px 0 0',
                    }}
                  />
                )}
                {m.total === 0 && (
                  <div style={{ width: HIST_BAR_W, height: 2, background: '#fff' }} />
                )}
              </div>
              <div className="whitespace-nowrap text-[9px] text-sw-faint">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4">
          <span className="flex items-center gap-[5px]">
            <span className="h-2.5 w-2.5 rounded-[1px]" style={{ background: 'var(--sw-pos)' }} />
            <span className="text-[10px] text-sw-dim">Paid</span>
          </span>
          <span className="flex items-center gap-[5px]">
            <span
              className="h-2.5 w-2.5 rounded-[1px]"
              style={{ background: 'var(--sw-accent-bg)', border: '1px solid #C7D2FE' }}
            />
            <span className="text-[10px] text-sw-dim">Approved / Outstanding</span>
          </span>
        </div>
      </div>

      {/* ── j1 month table ────────────────────────────────────────────── */}
      <div className="border-t border-sw-ink bg-white">
        <table className="sw-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Approved</th>
              <th className="text-right">Total</th>
              <th className="text-right">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {hist
              .filter((m) => m.total > 0)
              .map((m) => {
                cumulative += m.paid
                return (
                  <tr key={m.key} className="border-b border-sw-rule-l">
                    <td className="font-semibold">{m.label}</td>
                    <td className="text-right font-mono" style={{ color: 'var(--sw-pos)' }}>
                      {m.paid > 0 ? formatCurrency(m.paid) : '—'}
                    </td>
                    <td className="text-right font-mono" style={{ color: 'var(--sw-violet)' }}>
                      {m.approved > 0 ? formatCurrency(m.approved) : '—'}
                    </td>
                    <td className="text-right font-mono font-semibold">
                      {formatCurrency(m.total)}
                    </td>
                    <td className="text-right font-mono text-sw-dim">
                      {formatCurrency(cumulative)}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
        {hist.every((m) => m.total === 0) && (
          <div className="p-10 text-center text-[13px] text-sw-faint">No cost data to display.</div>
        )}
      </div>

      {/* ── j1v2 forward forecast ─────────────────────────────────────── */}
      <div className="mt-10 border-t-2 border-sw-ink pt-8">
        <div className="mb-5">
          <div className="mb-1 text-[18px] font-bold text-sw-ink">Forward Cash Flow Forecast</div>
          <div className="text-[13px] text-sw-dim">
            {formatCurrency(remaining)} remaining · 12-month outlook
          </div>
        </div>

        {/* Legend — "Committed" entry only when a committed total exists (gap 8b). */}
        <div className="mb-5 flex gap-5">
          {fcCommitted > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[1px]" style={{ background: '#2563EB' }} />
              <span className="text-[11px] text-sw-dim">
                Committed (approved invoices / POs due)
              </span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[1px]" style={{ background: '#BFDBFE' }} />
            <span className="text-[11px] text-sw-dim">Forecast (remaining contract spread)</span>
          </span>
        </div>

        <div
          className="flex items-end gap-2 overflow-x-auto border-b border-sw-rule"
          style={{ height: FC_BAR_H + 40 }}
        >
          {fc.map((m) => {
            const committedH = m.committed > 0 ? Math.max((m.committed / fcMax) * FC_BAR_H, 2) : 0
            const forecastH = m.forecast > 0 ? Math.max((m.forecast / fcMax) * FC_BAR_H, 2) : 0
            const total = m.committed + m.forecast
            return (
              <div key={m.key} className="flex flex-col items-center" style={{ flex: '0 0 52px' }}>
                {total > 0 && (
                  <div className="mb-[3px] font-mono text-[9px] text-sw-dim">
                    {total >= 1e3 ? `${(total / 1e3).toFixed(0)}k` : total.toFixed(0)}
                  </div>
                )}
                <div className="flex w-full flex-col justify-end" style={{ height: FC_BAR_H }}>
                  {forecastH > 0 && (
                    <div
                      style={{
                        width: '100%',
                        height: forecastH,
                        background: '#BFDBFE',
                        borderRadius: '1px 1px 0 0',
                      }}
                    />
                  )}
                  {committedH > 0 && (
                    <div
                      style={{
                        width: '100%',
                        height: committedH,
                        background: '#2563EB',
                        borderRadius: forecastH === 0 ? '3px 3px 0 0' : '0',
                      }}
                    />
                  )}
                  {total === 0 && (
                    <div style={{ width: '100%', height: 2, background: 'var(--sw-rule)' }} />
                  )}
                </div>
                <div className="mt-1.5 text-center text-[10px] text-sw-dim">{m.label}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex gap-10">
          <FcStat
            label="Total Committed (12mo)"
            value={formatCurrency(fc.reduce((sum, m) => sum + m.committed, 0))}
          />
          <FcStat
            label="Forecast Remaining"
            value={formatCurrency(fc.reduce((sum, m) => sum + m.forecast, 0))}
            muted
          />
          <FcStat
            label="Total Projected Outflow"
            value={formatCurrency(fc.reduce((sum, m) => sum + m.committed + m.forecast, 0))}
          />
        </div>
      </div>
    </div>
  )
}

/** Legacy j1 stat: 1px rule top, 10px caption, 20px value. */
function CfStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border-t border-sw-rule py-3">
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-sw-dim">
        {label}
      </div>
      <div className="text-[20px] font-bold" style={{ color: color ?? 'var(--sw-ink)' }}>
        {value}
      </div>
    </div>
  )
}

/** Legacy j1v2 mini stat: 1px rule top, 9px caption, 18px value. */
function FcStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="border-t border-sw-rule pt-3">
      <div className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-sw-dim">
        {label}
      </div>
      <div
        className="text-[18px] font-bold"
        style={{ color: muted ? 'var(--sw-dim)' : 'var(--sw-ink)' }}
      >
        {value}
      </div>
    </div>
  )
}
