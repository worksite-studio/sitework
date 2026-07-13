import { useState } from 'react'
import { Button, Dialog, Field, Input } from '@/components/ui'
import { parseAmount } from '@/lib/money'
import { useDispatch } from '@/state/context'
import type { BoqTemplate } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  template: BoqTemplate | null
}

/**
 * "Use template" wizard — port of legacy `Et1`. Captures the new estimate's
 * name + contract value, then dispatches CREATE_ESTIMATE_FROM_TEMPLATE
 * which seeds each cost code's budget from the template's pct.
 */
export function NewFromTemplateDialog({ open, onClose, template }: Props) {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [contractValue, setContractValue] = useState(0)
  const [attempted, setAttempted] = useState(false)

  if (!template) return null

  const nameMissing = name.trim() === ''
  const valueMissing = !(contractValue > 0)

  function reset() {
    setName('')
    setContractValue(0)
    setAttempted(false)
  }

  function save() {
    if (nameMissing || valueMissing) {
      setAttempted(true)
      return
    }
    dispatch({
      type: 'CREATE_ESTIMATE_FROM_TEMPLATE',
      templateId: template!.id,
      name,
      contractValue,
    })
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
      title={`New estimate from "${template.name}"`}
      description={`Generates ${template.codes.length} cost codes with budgets seeded from the template percentages.`}
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
          <Button onClick={save}>Create estimate</Button>
        </>
      }
    >
      <Field
        label="Estimate name"
        required
        error={attempted && nameMissing ? 'Name is required' : undefined}
      >
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={attempted && nameMissing}
          placeholder="e.g. 12 Pacific Ave Renovation"
        />
      </Field>
      <Field
        label="Contract value (excl GST)"
        required
        error={attempted && valueMissing ? 'Contract value must be > 0' : undefined}
        hint="Used to compute each cost code's budget from the template percentages."
      >
        <Input
          type="number"
          min={0}
          value={contractValue}
          onChange={(e) => setContractValue(parseAmount(e.target.value))}
          invalid={attempted && valueMissing}
        />
      </Field>
    </Dialog>
  )
}
