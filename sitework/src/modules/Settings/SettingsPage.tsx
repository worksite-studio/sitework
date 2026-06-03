import { useState } from 'react'
import { useAppState, useDispatch } from '@/state/context'
import { Button, Card, Field, Input } from '@/components/ui'
import type { Settings } from '@/types'

const FIELDS: Array<{ key: keyof Settings; label: string; hint?: string }> = [
  { key: 'userName', label: 'Your name', hint: 'Shown in the header greeting.' },
  { key: 'businessName', label: 'Business name' },
  { key: 'abn', label: 'ABN' },
  { key: 'licence', label: 'Builder licence number' },
]

/**
 * Settings module — port of legacy `St1`. One persisted Settings record on
 * the root state, edited via a single form with explicit Save (no
 * auto-save while typing — matches the legacy gating pattern).
 *
 * Xero / integrations placeholder section sits below the business info,
 * marked "wired in a later phase" so the page is intentionally a
 * destination as Phase 6+ work lands.
 */
export function SettingsPage() {
  const { settings } = useAppState()
  const dispatch = useDispatch()
  // Initial form snapshot taken from settings at mount; the page is a
  // single-edit destination so we don't need to live-sync external mutations
  // (which would clobber the user's in-flight edits anyway).
  const [form, setForm] = useState<Settings>(settings)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const dirty = JSON.stringify(form) !== JSON.stringify(settings)

  function save() {
    dispatch({ type: 'UPDATE_SETTINGS', patch: form })
    setSavedAt(Date.now())
  }

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-sw-muted">
          Business profile shown across documents, dashboards, and integrations.
        </p>
      </header>

      <Card className="p-5 space-y-3 max-w-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sw-muted">
          Business profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              <Input
                value={(form[f.key] as string | undefined) ?? ''}
                onChange={(e) => set(f.key, e.target.value)}
              />
            </Field>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={!dirty}>
            Save changes
          </Button>
          {!dirty && savedAt && <span className="text-xs text-sw-success">Saved.</span>}
          {dirty && <span className="text-xs text-sw-warning">Unsaved changes.</span>}
        </div>
      </Card>

      <Card className="p-5 space-y-2 max-w-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sw-muted">
          Integrations
        </h2>
        <p className="text-sm text-sw-muted">
          Xero — wired in Phase 6 alongside backend auth. Settings here will gain a "Connect Xero"
          button at that point; for now the Xero badge in the header is a placeholder.
        </p>
      </Card>
    </div>
  )
}
