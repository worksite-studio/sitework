import { useState } from 'react'
import { Button, Dialog, Field, Select } from '@/components/ui'
import { useAppState, useDispatch } from '@/state/context'
import type { BoqTemplateId, ProjectId } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: ProjectId
}

/**
 * Port of legacy `Bti` — the Phase 1.5-C "Import from BOQ Template" dialog.
 * Dispatches IMPORT_TEMPLATE_INTO_BOQ which dedupes by code string before
 * appending the template's missing codes onto the project's BOQ.
 */
export function BoqTemplateImportDialog({ open, onClose, projectId }: Props) {
  const { templates } = useAppState()
  const dispatch = useDispatch()
  const [selected, setSelected] = useState<BoqTemplateId | ''>('')
  const tpl = templates.find((t) => t.id === selected)

  function reset() {
    setSelected('')
  }

  function importTpl() {
    if (!tpl) return
    dispatch({ type: 'IMPORT_TEMPLATE_INTO_BOQ', projectId, templateId: tpl.id })
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
      title="Import from BOQ template"
      description="Adds any codes from the template that aren't already on this project. Dedupes by code string."
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
          <Button onClick={importTpl} disabled={!tpl}>
            Import
          </Button>
        </>
      }
    >
      <Field label="Template">
        <Select value={selected} onChange={(e) => setSelected(e.target.value as BoqTemplateId)}>
          <option value="">— Choose a template —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id as string}>
              {t.name} ({t.codes.length} codes)
            </option>
          ))}
        </Select>
      </Field>
      {tpl && (
        <div className="text-xs text-sw-muted">
          {tpl.desc}{' '}
          <span className="block mt-1">Codes that already exist on this project are skipped.</span>
        </div>
      )}
    </Dialog>
  )
}
