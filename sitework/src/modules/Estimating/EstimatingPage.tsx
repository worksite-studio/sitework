import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState, useDispatch } from '@/state/context'
import { Button } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate } from '@/lib/formatDate'
import { NewFromTemplateDialog } from './NewFromTemplateDialog'
import { EstimateForm, EstCodeForm } from './EstimateForm'
import type { BoqTemplate, Estimate, EstimateId } from '@/types'

type Tab = 'estimates' | 'templates'

/**
 * Legacy H1 `s()` — AUD currency with minimumFractionDigits 0 (max stays 2):
 * whole dollars render bare ("$172,500"), cents show when present
 * ("$634,146.34") — exactly the mixed rendering :8766 shows.
 */
function aud(n: number): string {
  return n.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
  })
}

/**
 * Estimating — transliteration of legacy `H1` (R5, PARITY gap-12 row):
 * header sub-line ("N estimates · N won"), "+ New Estimate", underline
 * tabs (Estimates / BOQ Templates, no counts), estimate rows showing the
 * SELL total (budget ÷ (1 − margin/100) — gap 17 semantics) with status
 * beneath, and the estimate drill-in (Cost Budget / Contract / GST stats,
 * Cost Codes table, + Add Code, Edit, Promote to Project).
 */
export function EstimatingPage() {
  const { estimates, templates, clients } = useAppState()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('estimates')
  const [templateFor, setTemplateFor] = useState<BoqTemplate | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Estimate | null>(null)
  const [addingCodeFor, setAddingCodeFor] = useState<EstimateId | null>(null)
  const [selectedId, setSelectedId] = useState<EstimateId | null>(null)

  const selected = estimates.find((e) => e.id === selectedId)

  function sellPrice(est: Estimate): number {
    const cost = est.codes.reduce((s, c) => s + (c.budget || 0), 0)
    return est.margin < 100 ? cost / (1 - est.margin / 100) : 0
  }

  function promote(est: Estimate) {
    // Legacy shell onPromote: dispatch then land on the projects list.
    dispatch({ type: 'PROMOTE_ESTIMATE', estimateId: est.id })
    navigate('/projects')
  }

  // ── Estimate drill-in (legacy H1 detail) ───────────────────────────────
  if (selected) {
    const cost = selected.codes.reduce((s, c) => s + (c.budget || 0), 0)
    const contract = sellPrice(selected)
    const gst = contract * 0.1
    return (
      <div className="sw-page">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="mb-5 cursor-pointer bg-transparent text-[12px] text-sw-dim hover:text-sw-ink"
        >
          All Estimates
        </button>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
              {selected.name}
            </h1>
            <div className="flex items-center gap-2.5">
              <StatusBadge status={selected.status} />
              <span className="text-[12px] text-sw-faint">{formatDate(selected.createdDate)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(selected)}>
              Edit
            </Button>
            {selected.status !== 'won' && (
              <Button variant="ghost" size="sm" onClick={() => promote(selected)}>
                Promote to Project
              </Button>
            )}
          </div>
        </div>

        <div className="mb-8 flex gap-9">
          {[
            { l: 'Cost Budget', v: aud(cost) },
            { l: `Contract (${selected.margin}% margin)`, v: aud(contract) },
            { l: 'GST (10%)', v: aud(gst) },
          ].map(({ l, v }) => (
            <div key={l} className="border-t border-sw-rule py-3">
              <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.08em] text-sw-dim">
                {l}
              </div>
              <div className="text-[20px] font-bold text-sw-ink">{v}</div>
            </div>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] font-bold text-sw-ink">Cost Codes</div>
          <button
            type="button"
            onClick={() => setAddingCodeFor(selected.id)}
            className="cursor-pointer bg-transparent text-[12px] font-medium text-sw-ink hover:underline"
          >
            + Add Code
          </button>
        </div>
        <div className="border-t border-sw-ink bg-white">
          <table className="sw-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th className="text-right">Budget</th>
              </tr>
            </thead>
            <tbody>
              {selected.codes.map((c) => (
                <tr key={c.id as string} className="border-b border-sw-rule-l">
                  <td className="font-mono text-sw-dim">{c.code}</td>
                  <td>{c.desc}</td>
                  <td className="text-right font-mono">{aud(c.budget)}</td>
                </tr>
              ))}
              {selected.codes.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-[13px] text-sw-faint">
                    No cost codes yet — click + Add Code.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {editing && <EstimateForm open onClose={() => setEditing(null)} initial={editing} />}
        {addingCodeFor && (
          <EstCodeForm open onClose={() => setAddingCodeFor(null)} estimateId={addingCodeFor} />
        )}
      </div>
    )
  }

  // ── List view (legacy H1) ──────────────────────────────────────────────
  return (
    <div className="sw-page">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Estimating</h1>
          <div className="text-[13px] text-sw-dim">
            {estimates.length} estimates · {estimates.filter((e) => e.status === 'won').length} won
          </div>
        </div>
        {tab === 'estimates' && <Button onClick={() => setCreating(true)}>+ New Estimate</Button>}
      </header>

      {/* Legacy underline tabs, no counts. */}
      <div className="mb-5 flex border-b border-sw-rule">
        {(
          [
            { id: 'estimates', label: 'Estimates' },
            { id: 'templates', label: 'BOQ Templates' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="cursor-pointer bg-transparent px-4 py-2 text-[13px]"
            style={{
              borderBottom: tab === t.id ? '2px solid var(--sw-ink)' : '2px solid transparent',
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--sw-ink)' : 'var(--sw-dim)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'estimates' && estimates.length === 0 && (
        <div className="p-10 text-center text-[13px] text-sw-faint">
          No estimates yet. Click + New Estimate, or pick a BOQ Template below.
        </div>
      )}

      {tab === 'estimates' && estimates.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {estimates.map((est) => {
            const client = clients.find((c) => c.id === est.clientId)
            return (
              <div
                key={est.id}
                onClick={() => setSelectedId(est.id)}
                className="cursor-pointer border-b border-sw-rule bg-white py-4 transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-[3px] text-[15px] font-bold text-sw-ink">{est.name}</div>
                    <div className="text-[12px] text-sw-dim">
                      {client?.name} · {est.codes.length} cost codes
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[16px] font-bold text-sw-ink">
                      {aud(sellPrice(est))}
                    </div>
                    <StatusBadge status={est.status} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'templates' && (
        <div className="flex flex-col">
          {templates.map((tpl) => (
            <div key={tpl.id} className="border-b border-sw-rule bg-white py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-[3px] text-[15px] font-bold text-sw-ink">{tpl.name}</div>
                  <div className="mb-1 text-[12px] text-sw-dim">{tpl.desc}</div>
                  <div className="text-[11px] text-sw-faint">
                    {tpl.codes.length} cost codes · {tpl.type}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setTemplateFor(tpl)}>
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EstimateForm open={creating} onClose={() => setCreating(false)} />
      <NewFromTemplateDialog
        open={!!templateFor}
        onClose={() => setTemplateFor(null)}
        template={templateFor}
      />
    </div>
  )
}
