import { useMemo, useState } from 'react'
import { useAppState } from '@/state/context'
import { Button, Card, EmptyState } from '@/components/ui'
import { ClientForm } from './ClientForm'
import type { Client } from '@/types'

/**
 * Clients module — port of legacy `L1`. Lists clients with row-click edit
 * and a "+ New Client" button. Projects-per-client count is shown so a
 * client with active jobs is obvious.
 */
export function ClientsPage() {
  const { clients, projects } = useAppState()
  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)

  const projectCountByClient = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of projects) {
      m.set(p.clientId as string, (m.get(p.clientId as string) ?? 0) + 1)
    }
    return m
  }, [projects])

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <Button onClick={() => setCreating(true)}>+ New Client</Button>
      </header>

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add a client to associate projects with the owner or principal."
          action={<Button onClick={() => setCreating(true)}>+ New Client</Button>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-sw-border">
            {clients.map((c) => {
              const count = projectCountByClient.get(c.id as string) ?? 0
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-sw-muted/5 transition"
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-sw-muted">
                        {[c.contact, c.phone, c.email].filter(Boolean).join(' · ') || c.id}
                      </div>
                    </div>
                    <div className="text-xs text-sw-muted">
                      {count} {count === 1 ? 'project' : 'projects'}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <ClientForm open={creating} onClose={() => setCreating(false)} />
      {editing && <ClientForm open onClose={() => setEditing(null)} initial={editing} />}
    </div>
  )
}
