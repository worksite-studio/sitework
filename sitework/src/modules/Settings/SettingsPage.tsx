import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useAppState, useDispatch } from '@/state/context'
import { Button } from '@/components/ui'
import { exportStateFile, parseBackupFile } from '@/lib/backup'
import { STATE_KEY, LEGACY_KEY } from '@/state/persistence'
import { seed } from '@/state/seed'
import type { AustralianState, Settings } from '@/types'

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']

const INSURANCE_FIELDS = [
  { key: 'hbcf', label: 'HBCF (NSW)' },
  { key: 'dbi', label: 'DBI (VIC)' },
  { key: 'vba', label: 'VBA (VIC)' },
  { key: 'qbcc', label: 'QBCC (QLD)' },
  { key: 'hii', label: 'HII (WA)' },
  { key: 'bii', label: 'BII (SA)' },
  { key: 'actf', label: 'ACT Fidelity' },
  { key: 'tasins', label: 'TAS (no scheme)' },
  { key: 'ntins', label: 'NT (no scheme)' },
] as const
type InsuranceKey = (typeof INSURANCE_FIELDS)[number]['key']

const boxInput =
  'border border-sw-rule bg-white px-2.5 py-2 text-[14px] text-sw-ink outline-none focus:border-sw-ink'
const gridInput =
  'flex-1 border border-sw-rule bg-white px-2 py-1.5 font-mono text-[13px] text-sw-ink outline-none focus:border-sw-ink'

/**
 * Settings — transliteration of legacy `St1` (R4, PARITY gaps 2 + 3):
 * Business Name / Your Name / Default Contract Type / Default Margin (%) /
 * GST checkbox / Home State / ABN / Builder Licences by State (8) /
 * Insurance Registration Numbers (9), each a ruled `stSec` section with
 * boxed inputs (legacy Settings uses bordered fields, not underlines).
 * Save Settings + red Reset to Demo Data with legacy's verbatim confirm.
 *
 * Storage: the port's reducer state (`UPDATE_SETTINGS`), not legacy's
 * per-key localStorage — so no post-save reload is needed; the greeting
 * and project-form defaults react immediately.
 *
 * Backup + Integrations cards below are port-additive (4.5-A, keep).
 */
export function SettingsPage() {
  const state = useAppState()
  const { settings } = state
  const dispatch = useDispatch()
  const restoreInputRef = useRef<HTMLInputElement>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [restoredAt, setRestoredAt] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState<Settings>(() => ({
    businessName: settings.businessName ?? 'Worksite',
    userName: settings.userName ?? '',
    defaultContractType: settings.defaultContractType ?? 'cost-plus',
    defaultMarginPct: settings.defaultMarginPct ?? 15,
    gstRegistered: settings.gstRegistered !== false,
    homeState: settings.homeState ?? 'NSW',
    abn: settings.abn ?? '',
    licences: { ...settings.licences },
    insurance: { ...settings.insurance },
  }))

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function save() {
    dispatch({ type: 'UPDATE_SETTINGS', patch: form })
    setSaved(true)
  }

  function resetToDemo() {
    // Legacy St1 confirm copy, verbatim.
    if (
      !window.confirm(
        'Reset to demo data? All current projects, invoices, claims, variations etc. will be wiped and replaced with the original seed data. This cannot be undone.',
      )
    )
      return
    localStorage.removeItem(STATE_KEY)
    localStorage.removeItem(LEGACY_KEY)
    window.location.reload()
  }

  async function onRestoreFilePicked(file: File | undefined) {
    if (!file) return
    setRestoreError(null)
    setRestoredAt(null)
    const parsed = parseBackupFile(await file.text(), seed)
    if (!parsed) {
      setRestoreError("That file isn't a SITEWORK backup — nothing was changed.")
      return
    }
    const ok = window.confirm(
      'Restore from backup? This replaces ALL current data with the contents of the file.',
    )
    if (!ok) return
    dispatch({ type: 'RESTORE_STATE', state: parsed })
    setRestoredAt(Date.now())
  }

  return (
    <div className="sw-page">
      <header className="mb-7">
        <h1 className="mb-1.5 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Settings</h1>
        <p className="text-[13px] text-sw-dim">Configure your default preferences.</p>
      </header>

      <Sec label="Business Name">
        <input
          aria-label="Business Name"
          className={`${boxInput} w-full max-w-[320px]`}
          value={form.businessName ?? ''}
          onChange={(e) => set('businessName', e.target.value)}
        />
      </Sec>

      <Sec label="Your Name">
        <input
          aria-label="Your Name"
          className={`${boxInput} w-full max-w-[320px]`}
          value={form.userName ?? ''}
          onChange={(e) => set('userName', e.target.value)}
          placeholder="Used in your dashboard greeting"
        />
      </Sec>

      <Sec label="Default Contract Type">
        <select
          aria-label="Default Contract Type"
          className={boxInput}
          value={form.defaultContractType}
          onChange={(e) =>
            set('defaultContractType', e.target.value as Settings['defaultContractType'])
          }
        >
          <option value="cost-plus">Cost Plus</option>
          <option value="fixed-price">Fixed Price</option>
        </select>
      </Sec>

      <Sec label="Default Margin (%)">
        <input
          aria-label="Default Margin (%)"
          type="number"
          min={0}
          max={100}
          className={`${boxInput} w-[100px]`}
          value={form.defaultMarginPct ?? 15}
          onChange={(e) => set('defaultMarginPct', Number(e.target.value) || 0)}
        />
      </Sec>

      <Sec label="GST">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={form.gstRegistered !== false}
            onChange={(e) => set('gstRegistered', e.target.checked)}
          />
          <span className="text-[14px] text-sw-ink">Registered for GST</span>
        </label>
      </Sec>

      <Sec label="Home State">
        <select
          aria-label="Home State"
          className={boxInput}
          value={form.homeState}
          onChange={(e) => set('homeState', e.target.value as AustralianState)}
        >
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Sec>

      <Sec label="ABN">
        <input
          aria-label="ABN"
          className={`${boxInput} w-full max-w-[240px] font-mono`}
          placeholder="e.g. 12 345 678 901"
          value={form.abn ?? ''}
          onChange={(e) => set('abn', e.target.value)}
        />
      </Sec>

      <Sec label="Builder Licences by State">
        <div className="mb-2.5 text-[11px] text-sw-dim">
          Enter licence numbers for each state you operate in.
        </div>
        <div className="grid max-w-[520px] grid-cols-2 gap-2.5">
          {STATES.map((s) => (
            <label key={s} className="flex items-center gap-2">
              <span className="w-9 text-[11px] font-semibold text-sw-dim">{s}</span>
              <input
                aria-label={`Licence ${s}`}
                className={gridInput}
                value={form.licences?.[s] ?? ''}
                onChange={(e) => set('licences', { ...form.licences, [s]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </Sec>

      <Sec label="Insurance Registration Numbers">
        <div className="mb-2.5 text-[11px] text-sw-dim">
          Registration numbers with the mandatory insurance scheme for each state. TAS and NT have
          no mandatory scheme — fields provided for any voluntary or contractual cover.
        </div>
        <div className="grid max-w-[520px] grid-cols-2 gap-2.5">
          {INSURANCE_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2">
              <span className="w-[88px] text-[11px] font-semibold text-sw-dim">{label}</span>
              <input
                aria-label={label}
                className={gridInput}
                value={form.insurance?.[key as InsuranceKey] ?? ''}
                onChange={(e) => set('insurance', { ...form.insurance, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </Sec>

      <div className="mt-6 flex items-center gap-4">
        <Button onClick={save}>Save Settings</Button>
        <button
          type="button"
          onClick={resetToDemo}
          className="cursor-pointer bg-transparent px-6 py-2.5 text-[13px] font-semibold"
          style={{ border: '1px solid var(--sw-neg)', color: 'var(--sw-neg)' }}
        >
          Reset to Demo Data
        </button>
        {saved && (
          <span className="text-[13px]" style={{ color: 'var(--sw-pos)' }}>
            Saved!
          </span>
        )}
      </div>

      {/* ── Port-additive (4.5-A reliability): Backup + Integrations ──── */}
      <div className="mt-12 max-w-2xl space-y-3 border-t border-sw-rule pt-6">
        <h2 className="text-[12px] font-semibold text-sw-ink">Backup</h2>
        <p className="text-sm text-sw-muted">
          All data lives in this browser until the cloud backend lands. Download a backup file
          regularly, and restore from one if you switch machines or clear the browser.
        </p>
        <div className="flex items-center gap-3">
          <Button onClick={() => exportStateFile(state)}>Download backup</Button>
          <Button variant="secondary" onClick={() => restoreInputRef.current?.click()}>
            Restore from backup…
          </Button>
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              void onRestoreFilePicked(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
        {restoreError && <p className="text-xs text-sw-danger">{restoreError}</p>}
        {restoredAt && <p className="text-xs text-sw-success">Backup restored.</p>}
      </div>

      <div className="mt-8 max-w-2xl space-y-2">
        <h2 className="text-[12px] font-semibold text-sw-ink">Integrations</h2>
        <p className="text-sm text-sw-muted">
          Xero — wired in Phase 6 alongside backend auth. Settings here will gain a "Connect Xero"
          button at that point; for now the Xero badge in the header is a placeholder.
        </p>
      </div>
    </div>
  )
}

/** Legacy `stSec`: ruled section — 1px rule top, 11px uppercase label. */
function Sec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-sw-rule py-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-sw-dim">
        {label}
      </div>
      {children}
    </div>
  )
}
