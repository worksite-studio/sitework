import { useState } from 'react'
import { Button, Dialog, Field, Input } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { asId } from '@/types'
import type {
  Certificate,
  CertificateId,
  CertificateType,
  Subcontractor,
  SubcontractorId,
} from '@/types'

interface SubFormProps {
  open: boolean
  onClose: () => void
  /** Existing subcontractor when editing; omit for add. */
  initial?: Subcontractor
}

const CERT_TYPES: CertificateType[] = ['PL', 'WC', 'PI', 'Licence', 'Other']

const blank = (): Omit<Subcontractor, 'id'> => ({
  name: '',
  trade: '',
  contact: '',
  phone: '',
  email: '',
  abn: '',
  licence: '',
  liabilityExp: '',
  liabilityAmt: 0,
  wcExp: '',
  swms: false,
  rating: 0,
  notes: '',
  projects: [],
  certificates: [],
})

/**
 * Subcontractor add/edit dialog. Port of legacy `z1` plus the certificates[]
 * editor added in Phase 1.5-E (file upload is the dataURL pattern from
 * ARCHITECTURE.md §11 — kept for parity; Phase 5 swaps to object storage).
 */
export function SubForm({ open, onClose, initial }: SubFormProps) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Subcontractor, 'id'>>(() =>
    initial ? { ...initial, certificates: initial.certificates ?? [] } : blank(),
  )
  const [attempted, setAttempted] = useState(false)

  const isEdit = !!initial
  const nameMissing = form.name.trim() === ''
  const tradeMissing = form.trade.trim() === ''

  function reset() {
    setForm(blank())
    setAttempted(false)
  }

  function addCertRow() {
    const newCert: Certificate = {
      id: asId<CertificateId>(`CERT-${Date.now()}`),
      type: 'PL',
      file: { name: '', dataUrl: '', size: 0 },
      expiry: '',
      uploadedAt: new Date().toISOString().slice(0, 10),
    }
    setForm({ ...form, certificates: [...(form.certificates ?? []), newCert] })
  }

  function updateCert(idx: number, patch: Partial<Certificate>) {
    const next = [...(form.certificates ?? [])]
    const existing = next[idx]
    if (!existing) return
    next[idx] = { ...existing, ...patch }
    setForm({ ...form, certificates: next })
  }

  function removeCert(idx: number) {
    const next = [...(form.certificates ?? [])]
    next.splice(idx, 1)
    setForm({ ...form, certificates: next })
  }

  function save() {
    if (nameMissing || tradeMissing) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_SUB', subId: initial.id, patch: form })
    } else {
      const id = asId<SubcontractorId>(`SUB-${Date.now()}`)
      dispatch({ type: 'ADD_SUB', sub: { id, ...form } })
    }
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={isEdit ? `Edit ${initial?.name || 'subcontractor'}` : 'New subcontractor'}
      widthClass="max-w-2xl"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Name"
          required
          error={attempted && nameMissing ? 'Name is required' : undefined}
        >
          <Input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            invalid={attempted && nameMissing}
          />
        </Field>
        <Field
          label="Trade"
          required
          error={attempted && tradeMissing ? 'Trade is required' : undefined}
        >
          <Input
            value={form.trade}
            onChange={(e) => setForm({ ...form, trade: e.target.value })}
            invalid={attempted && tradeMissing}
            placeholder="e.g. Carpentry / Joinery"
          />
        </Field>
        <Field label="Contact name">
          <Input
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="ABN">
          <Input value={form.abn} onChange={(e) => setForm({ ...form, abn: e.target.value })} />
        </Field>
        <Field label="Licence number">
          <Input
            value={form.licence}
            onChange={(e) => setForm({ ...form, licence: e.target.value })}
          />
        </Field>
        <Field label="Rating (0–5)">
          <Input
            type="number"
            min={0}
            max={5}
            value={form.rating}
            onChange={(e) =>
              setForm({ ...form, rating: Math.max(0, Math.min(5, Number(e.target.value) || 0)) })
            }
          />
        </Field>
        <Field label="Public Liability expiry">
          <Input
            type="date"
            value={form.liabilityExp}
            onChange={(e) => setForm({ ...form, liabilityExp: e.target.value })}
          />
        </Field>
        <Field label="PL cover ($)">
          <Input
            type="number"
            min={0}
            value={form.liabilityAmt}
            onChange={(e) => setForm({ ...form, liabilityAmt: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Workers Comp expiry">
          <Input
            type="date"
            value={form.wcExp}
            onChange={(e) => setForm({ ...form, wcExp: e.target.value })}
          />
        </Field>
        <Field label="SWMS on file">
          <select
            value={form.swms ? 'yes' : 'no'}
            onChange={(e) => setForm({ ...form, swms: e.target.value === 'yes' })}
            className="h-9 w-full rounded-md border border-sw-border px-3 text-sm bg-sw-surface"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      </div>

      {/* Certificates editor */}
      <div className="space-y-2 pt-3 border-t border-sw-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Certificates</h3>
          <Button size="sm" variant="secondary" onClick={addCertRow}>
            + Add Certificate
          </Button>
        </div>
        {(form.certificates ?? []).length === 0 ? (
          <p className="text-xs text-sw-muted">
            No certs on file. Add expiry-tracked certificates for PL, WC, PI, etc.
          </p>
        ) : (
          <ul className="space-y-2">
            {(form.certificates ?? []).map((cert, idx) => (
              <li
                key={cert.id}
                className="grid grid-cols-[110px_140px_1fr_auto] gap-2 items-end p-2 rounded-md border border-sw-border bg-sw-bg"
              >
                <Field label="Type">
                  <select
                    value={cert.type}
                    onChange={(e) => updateCert(idx, { type: e.target.value as CertificateType })}
                    className="h-9 w-full rounded-md border border-sw-border px-2 text-sm bg-sw-surface"
                  >
                    {CERT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Expiry">
                  <Input
                    type="date"
                    value={cert.expiry}
                    onChange={(e) => updateCert(idx, { expiry: e.target.value })}
                  />
                </Field>
                <Field label="File reference">
                  <Input
                    value={cert.file.name}
                    onChange={(e) =>
                      updateCert(idx, { file: { ...cert.file, name: e.target.value } })
                    }
                    placeholder="filename.pdf"
                  />
                </Field>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCert(idx)}
                  aria-label={`Remove certificate ${idx + 1}`}
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  )
}
