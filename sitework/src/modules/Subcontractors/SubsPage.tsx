import { useState } from 'react'
import { useAppState } from '@/state/context'
import { Button, Card, EmptyState, ExpiryChip } from '@/components/ui'
import { getExpiryInfo } from '@/lib/certExpiry'
import { cn } from '@/lib/cn'
import { SubForm } from './SubForm'
import type { Subcontractor } from '@/types'

/**
 * Subcontractors module — port of legacy `V1`. Row click opens the edit
 * dialog. Each row shows the PL / WC chips (always present), then any
 * certificates[] chips with their type prefix (PL/WC/PI/Licence/Other).
 *
 * Project-count is shown via the sub.projects[] denormalised array so a
 * sub assigned to active jobs is obvious without a join.
 */
export function SubsPage() {
  const { subs } = useAppState()
  const [editing, setEditing] = useState<Subcontractor | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Subcontractors</h1>
        <Button onClick={() => setCreating(true)}>+ New Subcontractor</Button>
      </header>

      {subs.length === 0 ? (
        <EmptyState
          title="No subcontractors yet"
          description="Add a subcontractor to track licences, insurance expiries, and project assignments."
          action={<Button onClick={() => setCreating(true)}>+ New Subcontractor</Button>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-sw-border">
            {subs.map((s) => {
              const plInfo = getExpiryInfo(s.liabilityExp)
              const wcInfo = getExpiryInfo(s.wcExp)
              const certs = s.certificates ?? []
              const hasIssue =
                plInfo.status === 'expired' ||
                plInfo.status === 'expiring' ||
                wcInfo.status === 'expired' ||
                wcInfo.status === 'expiring' ||
                certs.some((c) => {
                  const st = getExpiryInfo(c.expiry).status
                  return st === 'expired' || st === 'expiring'
                })
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    className="w-full text-left px-4 py-3 hover:bg-sw-muted/5 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-sw-muted">{s.trade}</span>
                          {hasIssue && (
                            <span
                              className={cn(
                                'text-[10px] uppercase font-medium tracking-wide px-1.5 py-0.5 rounded',
                                'bg-sw-danger/10 text-sw-danger',
                              )}
                            >
                              Attention
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-sw-muted">
                          {[s.contact, s.phone, s.email].filter(Boolean).join(' · ') || s.id}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 shrink-0">
                        <ExpiryChip kind="PL" iso={s.liabilityExp} />
                        <ExpiryChip kind="WC" iso={s.wcExp} />
                        {certs.map((c) => (
                          <ExpiryChip key={c.id} kind={c.type} iso={c.expiry} />
                        ))}
                        <span className="text-xs text-sw-muted ml-2">
                          {s.projects.length} {s.projects.length === 1 ? 'project' : 'projects'}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <SubForm open={creating} onClose={() => setCreating(false)} />
      {editing && <SubForm open onClose={() => setEditing(null)} initial={editing} />}
    </div>
  )
}
