import { useMemo, useState } from 'react'
import { useAppState } from '@/state/context'
import { Button, EmptyState } from '@/components/ui'
import { SupplierForm } from './SupplierForm'
import type { Supplier } from '@/types'

/**
 * Suppliers catalogue. Not in the top-level sidebar nav (matches legacy);
 * accessed via /suppliers URL or future deep-links from PO / Invoice forms
 * that need a supplier picker.
 *
 * Material-count per supplier shows where each supplier's products live.
 */
export function SuppliersPage() {
  const { suppliers, materials } = useAppState()
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [creating, setCreating] = useState(false)

  const materialsBySupplier = useMemo(() => {
    const m = new Map<string, number>()
    for (const mat of materials) m.set(mat.supId as string, (m.get(mat.supId as string) ?? 0) + 1)
    return m
  }, [materials])

  return (
    <div className="sw-page space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Suppliers</h1>
        <Button onClick={() => setCreating(true)}>+ New Supplier</Button>
      </header>

      {suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers yet"
          description="Add suppliers so POs and invoices can reference them."
          action={<Button onClick={() => setCreating(true)}>+ New Supplier</Button>}
        />
      ) : (
        <div>
          <ul className="divide-y divide-sw-border">
            {suppliers.map((s) => {
              const count = materialsBySupplier.get(s.id as string) ?? 0
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-sw-muted/5 transition"
                  >
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-sw-muted">
                        {[s.contact, s.phone, s.email].filter(Boolean).join(' · ') || s.id}
                      </div>
                    </div>
                    <div className="text-xs text-sw-muted">
                      {count} {count === 1 ? 'material' : 'materials'}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <SupplierForm open={creating} onClose={() => setCreating(false)} />
      {editing && <SupplierForm open onClose={() => setEditing(null)} initial={editing} />}
    </div>
  )
}
