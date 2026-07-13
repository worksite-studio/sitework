import { useState } from 'react'
import { useAppState } from '@/state/context'
import { Button } from '@/components/ui'
import { formatDate } from '@/lib/formatDate'
import { SubForm } from './SubForm'
import type { Subcontractor } from '@/types'

interface CertStatus {
  color: string
  label: string
}

/**
 * Legacy `V1` `u()` — cert status against a 60-day window (`Nl = today+60`):
 * past → EXPIRED pink, within 60 days → Expiring violet, else Current green.
 */
function certStatus(dateIso: string | null | undefined, today: Date, soon: Date): CertStatus {
  if (!dateIso) return { color: 'var(--sw-faint)', label: '—' }
  const d = new Date(dateIso)
  if (d < today) return { color: 'var(--sw-neg)', label: 'EXPIRED' }
  if (d <= soon) return { color: 'var(--sw-violet)', label: 'Expiring' }
  return { color: 'var(--sw-pos)', label: 'Current' }
}

/**
 * Subcontractors — transliteration of legacy `V1` (R5, PARITY gap-12 row +
 * the gap-10 pill-drift fix): "N registered · N compliance issues" sub-line,
 * uppercase trade filter chips, six-column ruled table (Subcontractor w/
 * contact · phone, Trade, mono Licence, Public Liability + Workers Comp as
 * bare-text statuses with dates beneath, SWMS On file/Required), and the
 * lilac row tint on non-compliant subs. Row click edits.
 */
export function SubsPage() {
  const { subs } = useAppState()
  const [editing, setEditing] = useState<Subcontractor | null>(null)
  const [creating, setCreating] = useState(false)
  const [trade, setTrade] = useState('All')

  const today = new Date()
  const soon = new Date()
  soon.setDate(soon.getDate() + 60)

  const status = (iso: string | null | undefined) => certStatus(iso, today, soon)
  const trades = ['All', ...Array.from(new Set(subs.map((s) => s.trade)))]
  const visible = trade === 'All' ? subs : subs.filter((s) => s.trade === trade)
  const complianceIssues = subs.filter(
    (s) =>
      !s.swms || status(s.liabilityExp).label !== 'Current' || status(s.wcExp).label !== 'Current',
  ).length

  return (
    <div className="sw-page">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
            Subcontractors
          </h1>
          <div className="text-[13px] text-sw-dim">
            {subs.length} registered
            {complianceIssues > 0 && (
              <span className="ml-2 font-semibold" style={{ color: 'var(--sw-neg)' }}>
                · {complianceIssues} compliance issue{complianceIssues !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>+ Add Subcontractor</Button>
      </header>

      {/* Legacy trade filter chips: uppercase, ink-filled when active. */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {trades.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrade(t)}
            className="cursor-pointer rounded-[1px] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em]"
            style={{
              border: `1px solid ${trade === t ? 'var(--sw-ink)' : 'var(--sw-rule)'}`,
              background: trade === t ? 'var(--sw-ink)' : '#fff',
              color: trade === t ? '#fff' : 'var(--sw-dim)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="border-t border-sw-ink bg-white">
        <table className="sw-table">
          <thead>
            <tr>
              <th>Subcontractor</th>
              <th>Trade</th>
              <th>Licence</th>
              <th>Public Liability</th>
              <th>Workers Comp</th>
              <th>SWMS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((sub) => {
              const pl = status(sub.liabilityExp)
              const wc = status(sub.wcExp)
              const nonCompliant = !sub.swms || pl.label !== 'Current' || wc.label !== 'Current'
              return (
                <tr
                  key={sub.id as string}
                  onClick={() => setEditing(sub)}
                  className="cursor-pointer border-b border-sw-rule-l"
                  style={{ background: nonCompliant ? '#F5F3FF' : '#fff' }}
                >
                  <td>
                    <div className="text-[13px] font-bold text-sw-ink">{sub.name}</div>
                    <div className="text-[11px] text-sw-faint">
                      {sub.contact} · {sub.phone}
                    </div>
                  </td>
                  <td className="text-[10px] tracking-[0.04em] text-sw-dim">{sub.trade}</td>
                  <td className="font-mono text-sw-dim">{sub.licence || '—'}</td>
                  <td>
                    <div className="text-[11px] font-semibold" style={{ color: pl.color }}>
                      {pl.label}
                    </div>
                    {sub.liabilityExp && (
                      <div className="text-[10px] text-sw-faint">
                        {formatDate(sub.liabilityExp)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-[11px] font-semibold" style={{ color: wc.color }}>
                      {wc.label}
                    </div>
                    {sub.wcExp && (
                      <div className="text-[10px] text-sw-faint">{formatDate(sub.wcExp)}</div>
                    )}
                  </td>
                  <td>
                    {sub.swms ? (
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: 'var(--sw-pos)' }}
                      >
                        On file
                      </span>
                    ) : (
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: 'var(--sw-neg)' }}
                      >
                        Required
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="p-10 text-center text-[13px] text-sw-faint">
            No subcontractors in this trade.
          </div>
        )}
      </div>

      <SubForm open={creating} onClose={() => setCreating(false)} />
      {editing && <SubForm open onClose={() => setEditing(null)} initial={editing} />}
    </div>
  )
}
