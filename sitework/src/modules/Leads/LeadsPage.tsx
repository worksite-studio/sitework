import { useState } from 'react'
import { useAppState, useDispatch } from '@/state/context'
import { Button, Dialog, Field, Select } from '@/components/ui'
import { formatDate } from '@/lib/formatDate'
import { LeadForm } from './LeadForm'
import type { Lead, LeadId, LeadStage, ClientId } from '@/types'

const COLUMNS: Array<{ id: LeadStage; label: string; color: string }> = [
  { id: 'prospect', label: 'Prospect', color: 'var(--sw-dim)' },
  { id: 'tendering', label: 'Tendering', color: 'var(--sw-violet)' },
  { id: 'quoted', label: 'Quoted', color: '#00B0CA' },
  { id: 'won', label: 'Won', color: 'var(--sw-pos)' },
  { id: 'lost', label: 'Lost', color: 'var(--sw-neg)' },
]

/**
 * Lead Pipeline — transliteration of legacy `G1` (R5, PARITY gap 15): a
 * five-column kanban (Prospect / Tendering / Quoted / Won / Lost, colour
 * squares, per-column $K totals), card click drills into the lead detail
 * (stage select, mini stats, notes, Convert to Project via `Cv1`), and
 * "+ New Lead". The port's flat filter list is thrown away.
 */
export function LeadsPage() {
  const { leads } = useAppState()
  const dispatch = useDispatch()
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<LeadId | null>(null)
  const [converting, setConverting] = useState<Lead | null>(null)

  const selected = leads.find((l) => l.id === selectedId)

  // ── Detail view (legacy G1 drill-in) ───────────────────────────────────
  if (selected) {
    return (
      <div className="sw-page">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="mb-5 cursor-pointer bg-transparent text-[12px] text-sw-dim hover:text-sw-ink"
        >
          Pipeline
        </button>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
              {selected.name}
            </h1>
            <div className="text-[13px] text-sw-dim">
              {selected.clientName} · {selected.source}
            </div>
          </div>
          <Select
            aria-label="Stage"
            value={selected.stage}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_LEAD',
                leadId: selected.id,
                patch: { stage: e.target.value as LeadStage },
              })
            }
            className="w-40"
          >
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3.5">
          {[
            { l: 'Estimated Value', v: `$${selected.value.toLocaleString('en-AU')}` },
            { l: 'Source', v: selected.source },
            { l: 'Follow-up', v: selected.followUp ? formatDate(selected.followUp) : '—' },
          ].map(({ l, v }) => (
            <div key={l} className="border-t border-sw-rule py-3">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-sw-dim">
                {l}
              </div>
              <div className="text-[16px] font-bold text-sw-ink">{v}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-sw-rule py-3">
          <div className="mb-1.5 text-[11px] font-medium text-sw-dim">Notes</div>
          <div className="text-[13px] leading-relaxed text-sw-ink">
            {selected.notes || 'No notes.'}
          </div>
        </div>

        {selected.stage === 'won' && !selected.convertedToProjectId && (
          <div className="mt-6 border-t border-sw-rule pt-5">
            <Button onClick={() => setConverting(selected)}>Convert to Project</Button>
          </div>
        )}
        {selected.convertedToProjectId && (
          <div
            className="mt-6 px-4 py-3 text-[13px] text-sw-ink"
            style={{ background: '#F0F9F4', borderLeft: '3px solid var(--sw-pos)' }}
          >
            ✓ Converted to project {selected.convertedToProjectId}
          </div>
        )}

        {converting && <ConvertLeadDialog lead={converting} onClose={() => setConverting(null)} />}
      </div>
    )
  }

  // ── Kanban board (legacy G1) ───────────────────────────────────────────
  const active = leads.filter((l) => !['won', 'lost'].includes(l.stage))
  const activeValue = active.reduce((s, l) => s + (l.value || 0), 0)

  return (
    <div className="sw-page">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
            Lead Pipeline
          </h1>
          <div className="text-[13px] text-sw-dim">
            {active.length} active · ${(activeValue / 1e6).toFixed(1)}M
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>+ New Lead</Button>
      </header>

      {leads.length === 0 && (
        <div className="mb-4 mt-2 border border-dashed border-sw-rule p-8 text-center text-[13px] text-sw-faint">
          No leads yet. Click + New Lead to start your pipeline.
        </div>
      )}

      <div className="flex gap-3.5 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const cards = leads.filter((l) => l.stage === col.id)
          const total = cards.reduce((s, l) => s + (l.value || 0), 0)
          return (
            <div key={col.id} style={{ minWidth: 210, flex: '0 0 210px' }}>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[1px]" style={{ background: col.color }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-sw-ink">
                    {col.label}
                  </span>
                </span>
                <span className="text-[10px] text-sw-faint">${(total / 1e3).toFixed(0)}K</span>
              </div>
              <div className="flex flex-col gap-2">
                {cards.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className="cursor-pointer border-b border-sw-rule bg-white py-3 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]"
                  >
                    <div className="mb-0.5 text-[13px] font-bold leading-tight text-sw-ink">
                      {l.name}
                    </div>
                    <div className="mb-2 text-[11px] text-sw-dim">{l.clientName}</div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] font-bold text-sw-ink">
                        ${(l.value / 1e3).toFixed(0)}K
                      </span>
                      <span className="bg-sw-bg px-[7px] py-[2px] text-[10px] text-sw-dim">
                        {l.source}
                      </span>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className="border-b border-sw-rule py-5 text-center text-[12px] text-sw-faint">
                    Empty
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <LeadForm open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

/** Legacy `Cv1` — pick a client (or none) for the converted project. */
function ConvertLeadDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { clients } = useAppState()
  const dispatch = useDispatch()
  const [clientId, setClientId] = useState<string>((clients[0]?.id as string) ?? '')

  function convert() {
    dispatch({
      type: 'CONVERT_LEAD_TO_PROJECT',
      leadId: lead.id,
      clientId: clientId ? (clientId as unknown as ClientId) : null,
    })
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Convert Lead to Project"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={convert}>Create Project</Button>
        </>
      }
    >
      <div
        className="mb-4 px-3.5 py-3 text-[13px] text-sw-dim"
        style={{ background: 'var(--sw-bg)', borderLeft: '3px solid var(--sw-rule)' }}
      >
        <div className="mb-0.5 font-semibold text-sw-ink">{lead.name}</div>
        <div className="text-[11px]">
          ${lead.value.toLocaleString('en-AU')} · {lead.clientName || '—'}
        </div>
      </div>
      <Field label="Client (for the new project)">
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">(no client)</option>
          {clients.map((c) => (
            <option key={c.id as string} value={c.id as string}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
    </Dialog>
  )
}
