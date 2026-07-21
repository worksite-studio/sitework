import { useState } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { asId } from '@/types'
import { newId } from '@/lib/newId'
import type { CostCodeId, ProjectId } from '@/types'

const ADD = '__add__'

/** Minimal shape the picker needs — Invoice/PO pass full CostCodes, Variation
 *  passes its slim `{id, code, desc}` list; both satisfy this. */
type CodeOption = { id: CostCodeId; code: string; desc: string }

/** Next auto-numbered 3-digit code — mirrors the BOQ tab's `nextCode`. */
function nextCodeFor(codes: CodeOption[]): string {
  const max = codes
    .map((c) => Number(c.code))
    .filter((n) => Number.isFinite(n))
    .reduce((m, n) => Math.max(m, n), 0)
  return String(max + 1).padStart(3, '0')
}

interface Props {
  projectId: ProjectId
  codes: CodeOption[]
  /** Selected CostCodeId as a string ('' when none). */
  value: string
  onChange: (ccId: string) => void
  invalid?: boolean
  /** Injected by `Field` for label association — forwarded to the <select>. */
  id?: string
}

/**
 * Cost-code picker with an inline "add new" path (4.7-L). Lists the project's
 * codes plus a "+ Add new cost code…" option; choosing it reveals code +
 * description fields that dispatch ADD_CODE and select the new code — so a code
 * can be created without leaving the Invoice / PO / Variation form. New codes
 * start with a $0 budget (4.7-E: budget is the sum of line items, added later
 * on the BOQ); every form reads `project.codes`, so a new code appears
 * everywhere immediately.
 */
export function CostCodeSelect({ projectId, codes, value, onChange, invalid, id }: Props) {
  const dispatch = useDispatch()
  const [adding, setAdding] = useState(false)
  const [code, setCode] = useState('')
  const [desc, setDesc] = useState('')
  const [attempted, setAttempted] = useState(false)

  function startAdd() {
    setCode(nextCodeFor(codes))
    setDesc('')
    setAttempted(false)
    setAdding(true)
  }

  function confirmAdd() {
    if (code.trim() === '' || desc.trim() === '') {
      setAttempted(true)
      return
    }
    const id = asId<CostCodeId>(newId('CC'))
    dispatch({
      type: 'ADD_CODE',
      projectId,
      code: {
        id,
        code: code.trim(),
        desc: desc.trim(),
        budget: 0,
        committed: 0,
        actual: 0,
        vars: 0,
      },
    })
    onChange(id as unknown as string)
    setAdding(false)
  }

  if (adding) {
    return (
      <div id={id} className="space-y-2">
        <div className="grid grid-cols-[84px_1fr] gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            invalid={attempted && code.trim() === ''}
            aria-label="New code"
            placeholder="001"
          />
          <Input
            autoFocus
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            invalid={attempted && desc.trim() === ''}
            aria-label="New cost code description"
            placeholder="e.g. Landscaping"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={confirmAdd}>
            Add code
          </Button>
          <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
        <p className="text-[11px] text-sw-faint">Budget builds from line items on the BOQ tab.</p>
      </div>
    )
  }

  return (
    <Select
      id={id}
      value={value}
      invalid={invalid}
      onChange={(e) => {
        if (e.target.value === ADD) startAdd()
        else onChange(e.target.value)
      }}
    >
      <option value="">— choose code —</option>
      {codes.map((c) => (
        <option key={c.id} value={c.id as string}>
          {c.code} — {c.desc}
        </option>
      ))}
      <option value={ADD}>+ Add new cost code…</option>
    </Select>
  )
}
