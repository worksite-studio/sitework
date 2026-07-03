import { useState } from 'react'
import { Button, Dialog, Field, Input } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { asId } from '@/types'
import type { Lead, LeadId, LeadStage } from '@/types'
import { newId } from '@/lib/newId'

interface LeadFormProps {
  open: boolean
  onClose: () => void
  initial?: Lead
}

const STAGES: LeadStage[] = ['prospect', 'tendering', 'won', 'lost']

const blank = (): Omit<Lead, 'id'> => ({
  name: '',
  clientName: '',
  value: 0,
  stage: 'prospect',
  source: '',
  followUp: '',
  notes: '',
  created: new Date().toISOString().slice(0, 10),
})

/**
 * Lead add/edit dialog. Port of the legacy `G1` detail form. Required: Name
 * + Client name (legacy app's gating). Stage drives the pipeline counts on
 * the Dashboard.
 */
export function LeadForm({ open, onClose, initial }: LeadFormProps) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Lead, 'id'>>(() => (initial ? { ...initial } : blank()))
  const [attempted, setAttempted] = useState(false)

  const isEdit = !!initial
  const nameMissing = form.name.trim() === ''
  const clientMissing = form.clientName.trim() === ''

  function reset() {
    setForm(blank())
    setAttempted(false)
  }

  function save() {
    if (nameMissing || clientMissing) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_LEAD', leadId: initial.id, patch: form })
    } else {
      const id = asId<LeadId>(newId('LED'))
      dispatch({ type: 'ADD_LEAD', lead: { id, ...form } })
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
      title={isEdit ? `Edit ${initial?.name || 'lead'}` : 'New lead'}
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
          placeholder="Project working name"
        />
      </Field>
      <Field
        label="Client name"
        required
        error={attempted && clientMissing ? 'Client name is required' : undefined}
      >
        <Input
          value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          invalid={attempted && clientMissing}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expected value ($)">
          <Input
            type="number"
            min={0}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Stage">
          <select
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value as LeadStage })}
            className="h-9 w-full rounded-md border border-sw-border px-3 text-sm bg-sw-surface"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Source">
          <Input
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            placeholder="e.g. Referral"
          />
        </Field>
        <Field label="Follow-up date">
          <Input
            type="date"
            value={form.followUp}
            onChange={(e) => setForm({ ...form, followUp: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Notes">
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </Dialog>
  )
}
