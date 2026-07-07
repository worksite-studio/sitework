import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { useAppState, useDispatch } from '@/state/context'
import { newId } from '@/lib/newId'
import {
  depositCapText,
  qldHwsAckRequired,
  vicS13Blocked,
  QLD_HWS_ACK_LABEL,
  QLD_HWS_WARNING,
  VIC_RENO_LABEL,
  VIC_S13_BANNER,
} from '@/lib/statutory'
import { asId } from '@/types'
import type {
  AustralianState,
  ClientId,
  ContractClassification,
  ContractForm,
  ContractType,
  Project,
  ProjectId,
} from '@/types'

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  /** Existing project when editing; omit for create. */
  initial?: Project
}

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']
const CONTRACT_FORMS: ContractForm[] = [
  'HIA',
  'MBA',
  'FairTradingNSW',
  'QBCCL1',
  'QBCCL2',
  'ABICMW',
  'ABICSW',
  'AS4000',
  'AS4902',
  'Custom',
]

interface FormState {
  name: string
  clientId: string
  address: string
  startDate: string
  /** Kept as strings while typing; parsed on save exactly like legacy (`parseFloat(x) || fallback`). */
  margin: string
  estimatedValue: string
  contractType: ContractType
  state: AustralianState
  contractForm: ContractForm
  contractClassification: ContractClassification
  isRenovationWithUnknownCost: boolean
  qldHwsAcknowledged: boolean
}

// Legacy seeded contractType/state from the sw_ct / sw_state Settings keys;
// those Settings fields arrive in session P2 — until then the legacy
// fallbacks ('cost-plus' / 'NSW') apply.
const blank = (): FormState => ({
  name: '',
  clientId: '',
  address: '',
  startDate: '',
  margin: '15',
  estimatedValue: '0',
  contractType: 'cost-plus',
  state: 'NSW',
  contractForm: 'HIA',
  contractClassification: 'Domestic',
  isRenovationWithUnknownCost: false,
  qldHwsAcknowledged: false,
})

const fromProject = (p: Project): FormState => ({
  name: p.name,
  clientId: p.clientId as string,
  address: p.address,
  startDate: p.startDate,
  margin: String(p.margin),
  estimatedValue: String(p.estimatedValue),
  contractType: p.contractType,
  state: p.state,
  contractForm: p.contractForm,
  contractClassification: p.contractClassification,
  isRenovationWithUnknownCost: p.isRenovationWithUnknownCost,
  qldHwsAcknowledged: p.qldHwsAcknowledged,
})

/**
 * Project create/edit dialog — port of legacy `I0` (Phase 0-H statutory
 * validation). The VIC s.13 hard-block and QLD HWS acknowledgement gate
 * live in `src/lib/statutory.ts`; this form only renders their outcome.
 * Matching legacy behaviour: Save stays clickable — a blocked save flips
 * `attempted`, which red-lines the offending inputs.
 */
export function ProjectForm({ open, onClose, initial }: ProjectFormProps) {
  const { clients } = useAppState()
  const dispatch = useDispatch()
  const [form, setForm] = useState<FormState>(() => (initial ? fromProject(initial) : blank()))
  const [attempted, setAttempted] = useState(false)

  const isEdit = !!initial
  const nameMissing = form.name.trim() === ''
  const estimatedValueParsed = parseFloat(form.estimatedValue) || 0

  const vicBlocked = vicS13Blocked({
    state: form.state,
    contractType: form.contractType,
    estimatedValue: estimatedValueParsed,
    isRenovationWithUnknownCost: form.isRenovationWithUnknownCost,
  })
  const qldAckRequired = qldHwsAckRequired({
    state: form.state,
    contractType: form.contractType,
    qldHwsAcknowledged: form.qldHwsAcknowledged,
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function reset() {
    setForm(initial ? fromProject(initial) : blank())
    setAttempted(false)
  }

  function close() {
    reset()
    onClose()
  }

  function save() {
    if (nameMissing || vicBlocked || qldAckRequired) {
      setAttempted(true)
      return
    }
    const parsed = {
      name: form.name,
      clientId: asId<ClientId>(form.clientId),
      address: form.address,
      startDate: form.startDate,
      margin: parseFloat(form.margin) || 15,
      estimatedValue: estimatedValueParsed,
      contractType: form.contractType,
      state: form.state,
      contractForm: form.contractForm,
      contractClassification: form.contractClassification,
      isRenovationWithUnknownCost: form.isRenovationWithUnknownCost,
      qldHwsAcknowledged: form.qldHwsAcknowledged,
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_PROJECT', projectId: initial.id, patch: parsed })
    } else {
      const project: Project = {
        id: asId<ProjectId>(newId('PRJ')),
        status: 'live',
        ...parsed,
        codes: [],
        lineItems: {},
        variations: [],
        invoices: [],
      }
      dispatch({ type: 'ADD_PROJECT', project })
    }
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={isEdit ? 'Edit Project' : 'New Project'}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>Save Project</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Project Name"
          required
          error={attempted && nameMissing ? 'Project name is required' : undefined}
        >
          <Input
            autoFocus
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            invalid={attempted && nameMissing}
          />
        </Field>
        <Field label="Client">
          <Select value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="col-span-2">
          <Field label="Address">
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
        </div>
        <Field label="Contract Type">
          <Select
            value={form.contractType}
            onChange={(e) => set('contractType', e.target.value as ContractType)}
          >
            <option value="cost-plus">Cost Plus</option>
            <option value="fixed-price">Fixed Price</option>
          </Select>
        </Field>
        <Field label="State">
          <Select
            value={form.state}
            onChange={(e) => set('state', e.target.value as AustralianState)}
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contract Form">
          <Select
            value={form.contractForm}
            onChange={(e) => set('contractForm', e.target.value as ContractForm)}
          >
            {CONTRACT_FORMS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Classification">
          <Select
            value={form.contractClassification}
            onChange={(e) =>
              set('contractClassification', e.target.value as ContractClassification)
            }
          >
            <option value="Domestic">Domestic</option>
            <option value="Commercial">Commercial</option>
          </Select>
        </Field>
        <Field label="Start Date">
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
        </Field>
        <Field label="Margin %">
          <Input
            type="number"
            value={form.margin}
            onChange={(e) => set('margin', e.target.value)}
          />
        </Field>
        {form.contractType === 'cost-plus' && (
          <Field label="Estimated Value ($)">
            <Input
              type="number"
              placeholder="0"
              value={form.estimatedValue}
              onChange={(e) => set('estimatedValue', e.target.value)}
            />
          </Field>
        )}
      </div>

      <p className="text-xs italic text-sw-muted">{depositCapText(form.state)}</p>

      {form.state === 'VIC' && form.contractType === 'cost-plus' && (
        <label className="flex items-center gap-2 text-xs text-sw-muted cursor-pointer">
          <input
            type="checkbox"
            checked={form.isRenovationWithUnknownCost}
            onChange={(e) => set('isRenovationWithUnknownCost', e.target.checked)}
            className="w-3.5 h-3.5 cursor-pointer"
          />
          {VIC_RENO_LABEL}
        </label>
      )}

      {form.state === 'QLD' && form.contractType === 'cost-plus' && (
        <div className="rounded-md border border-sw-warning bg-sw-warning/10 px-3 py-2.5 text-xs space-y-2">
          <p className="text-sw-muted">{QLD_HWS_WARNING}</p>
          <label
            className={`flex items-center gap-2 cursor-pointer ${
              attempted && qldAckRequired ? 'text-sw-danger' : 'text-sw-muted'
            }`}
          >
            <input
              type="checkbox"
              checked={form.qldHwsAcknowledged}
              onChange={(e) => set('qldHwsAcknowledged', e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            {QLD_HWS_ACK_LABEL}
          </label>
        </div>
      )}

      {vicBlocked && (
        <div
          role="alert"
          className="rounded-md border border-sw-danger bg-sw-danger/10 px-3.5 py-3 text-xs text-sw-danger"
        >
          {VIC_S13_BANNER}
        </div>
      )}
    </Dialog>
  )
}
