import { useMemo, useState } from 'react'
import { useAppState } from '@/state/context'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { LeadForm } from './LeadForm'
import type { Lead, LeadStage } from '@/types'

const STAGE_FILTERS: Array<{ id: LeadStage | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'prospect', label: 'Prospect' },
  { id: 'tendering', label: 'Tendering' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
]

/**
 * Leads / Tender pipeline — port of the legacy `G1` list. Filter chips run
 * along the top; row click opens the edit dialog. Total pipeline value
 * sums the expected value of every lead in the current filter.
 */
export function LeadsPage() {
  const { leads } = useAppState()
  const [filter, setFilter] = useState<LeadStage | 'all'>('all')
  const [editing, setEditing] = useState<Lead | null>(null)
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(
    () => (filter === 'all' ? leads : leads.filter((l) => l.stage === filter)),
    [leads, filter],
  )
  const totalValue = filtered.reduce((s, l) => s + (l.value || 0), 0)

  return (
    <div className="sw-page space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Leads / Tender</h1>
        <Button onClick={() => setCreating(true)}>+ New Lead</Button>
      </header>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {STAGE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === f.id
                  ? 'bg-sw-primary text-white'
                  : 'text-sw-text hover:bg-sw-muted/10 border border-sw-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {filtered.length > 0 && (
          <div className="text-xs text-sw-muted">
            <span className="font-medium text-sw-text">{formatCurrency(totalValue)}</span> across{' '}
            {filtered.length} {filtered.length === 1 ? 'lead' : 'leads'}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'No leads yet' : `No leads in ${filter}`}
          description="Add a lead to start tracking the pipeline."
          action={<Button onClick={() => setCreating(true)}>+ New Lead</Button>}
        />
      ) : (
        <div>
          <ul className="divide-y divide-sw-border">
            {filtered.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setEditing(l)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-sw-muted/5 transition"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-sw-muted">
                      {l.clientName}
                      {l.source && ` · ${l.source}`}
                      {l.followUp && ` · follow-up ${formatDate(l.followUp)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-sm font-medium tabular-nums">
                      {formatCurrency(l.value)}
                    </div>
                    <StatusBadge status={l.stage} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <LeadForm open={creating} onClose={() => setCreating(false)} />
      {editing && <LeadForm open onClose={() => setEditing(null)} initial={editing} />}
    </div>
  )
}
