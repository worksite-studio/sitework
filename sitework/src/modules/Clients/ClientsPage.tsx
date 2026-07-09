import { Fragment, useMemo, useState } from 'react'
import { useAppState } from '@/state/context'
import { Button } from '@/components/ui'
import { ClientForm } from './ClientForm'
import type { Client, ClientId } from '@/types'

/**
 * Clients — transliteration of legacy `L1` (R5, PARITY gap-12 row): ruled
 * table with Client / Contact (email) / mono ABN / Projects columns. Row
 * click expands an inline detail strip (Phone / Email / ABN / Address +
 * "Edit Client" ghost) — legacy's expand-in-place pattern, not a modal.
 */
export function ClientsPage() {
  const { clients, projects } = useAppState()
  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<ClientId | null>(null)

  const projectCountByClient = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of projects) {
      m.set(p.clientId as string, (m.get(p.clientId as string) ?? 0) + 1)
    }
    return m
  }, [projects])

  return (
    <div className="sw-page">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Clients</h1>
        <Button onClick={() => setCreating(true)}>+ New Client</Button>
      </header>

      <div className="border-t border-sw-ink bg-white">
        <table className="sw-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Contact</th>
              <th>ABN</th>
              <th className="text-right">Projects</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-[13px] text-sw-faint">
                  No clients yet. Click + New Client to add one.
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const count = projectCountByClient.get(client.id as string) ?? 0
                const isExpanded = expandedId === client.id
                return (
                  <Fragment key={client.id as string}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : client.id)}
                      className="cursor-pointer border-b border-sw-rule-l"
                    >
                      <td className="font-semibold">{client.name}</td>
                      <td className="text-sw-dim">{client.email}</td>
                      <td className="font-mono text-sw-dim">{client.abn || '—'}</td>
                      <td className="text-right">{count}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan={4}
                          className="border-b border-sw-rule-l px-4 py-3"
                          style={{ background: '#FAFAFA' }}
                        >
                          <div className="mb-2.5 flex flex-wrap gap-6 text-[12px] text-sw-dim">
                            {client.phone && <span>Phone: {client.phone}</span>}
                            {client.email && <span>Email: {client.email}</span>}
                            {client.abn && <span>ABN: {client.abn}</span>}
                            {client.address && <span>Address: {client.address}</span>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setEditing(client)}>
                            Edit Client
                          </Button>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <ClientForm open={creating} onClose={() => setCreating(false)} />
      {editing && <ClientForm open onClose={() => setEditing(null)} initial={editing} />}
    </div>
  )
}
