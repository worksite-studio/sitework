import { useMemo, useState } from 'react'
import { useAppState } from '@/state/context'
import { Button, EmptyState } from '@/components/ui'
import { formatCurrency } from '@/lib/formatCurrency'
import { MaterialForm } from './MaterialForm'
import type { Material } from '@/types'

/**
 * Materials catalogue. Like Suppliers, not in the top-level sidebar nav
 * — accessed via /materials URL. Surfaces supplier name from the
 * suppliers[] FK so the row reads at a glance.
 */
export function MaterialsPage() {
  const { materials, suppliers } = useAppState()
  const [editing, setEditing] = useState<Material | null>(null)
  const [creating, setCreating] = useState(false)

  const supplierName = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of suppliers) m.set(s.id as string, s.name)
    return (id: string) => m.get(id) ?? '—'
  }, [suppliers])

  return (
    <div className="sw-page space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Materials</h1>
        <Button onClick={() => setCreating(true)}>+ New Material</Button>
      </header>

      {materials.length === 0 ? (
        <EmptyState
          title="No materials yet"
          description="Add materials so line items + POs can reference them."
          action={<Button onClick={() => setCreating(true)}>+ New Material</Button>}
        />
      ) : (
        <div>
          <ul className="divide-y divide-sw-border">
            {materials.map((mat) => (
              <li key={mat.id}>
                <button
                  type="button"
                  onClick={() => setEditing(mat)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-sw-muted/5 transition"
                >
                  <div>
                    <div className="font-medium">{mat.name}</div>
                    <div className="text-xs text-sw-muted">
                      {mat.cat || '—'} · {mat.sku || mat.id} · {supplierName(mat.supId as string)}
                    </div>
                  </div>
                  <div className="text-sm font-medium tabular-nums">
                    {formatCurrency(mat.price)} <span className="text-sw-muted">/ {mat.unit}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <MaterialForm open={creating} onClose={() => setCreating(false)} />
      {editing && <MaterialForm open onClose={() => setEditing(null)} initial={editing} />}
    </div>
  )
}
