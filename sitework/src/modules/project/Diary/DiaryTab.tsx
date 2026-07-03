import { useState } from 'react'
import { Button, Card, Dialog, EmptyState, Field, Input } from '@/components/ui'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { DiaryEntry, DiaryEntryId, ProjectId } from '@/types'
import { newId } from '@/lib/newId'

interface FormProps {
  open: boolean
  onClose: () => void
  projectId: ProjectId
}

function DiaryForm({ open, onClose, projectId }: FormProps) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<DiaryEntry, 'id'>>({
    date: new Date().toISOString().slice(0, 10),
    weather: '',
    workers: 0,
    subs: [],
    hours: 0,
    notes: '',
    incidents: false,
  })

  function save() {
    const id = asId<DiaryEntryId>(newId('DY'))
    dispatch({ type: 'ADD_DIARY_ENTRY', projectId, entry: { id, ...form } })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New diary entry"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Weather">
          <Input
            value={form.weather}
            onChange={(e) => setForm({ ...form, weather: e.target.value })}
            placeholder="e.g. Sunny, 26°C"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Workers on site">
          <Input
            type="number"
            min={0}
            value={form.workers}
            onChange={(e) => setForm({ ...form, workers: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Total hours">
          <Input
            type="number"
            min={0}
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>
      <Field label="Notes">
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      <Field label="Incidents this day">
        <select
          value={form.incidents ? 'yes' : 'no'}
          onChange={(e) => setForm({ ...form, incidents: e.target.value === 'yes' })}
          className="h-9 w-full rounded-md border border-sw-border px-3 text-sm bg-sw-surface"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </Field>
    </Dialog>
  )
}

export function DiaryTab() {
  const project = useProject()
  const state = useAppState()
  const [creating, setCreating] = useState(false)
  if (!project) return null

  const entries = state.diary[project.id as string] ?? []

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Site Diary</h2>
        <Button onClick={() => setCreating(true)}>+ Add Entry</Button>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No diary entries yet"
          description="Record daily site conditions, headcount, and incidents."
          action={<Button onClick={() => setCreating(true)}>+ Add Entry</Button>}
        />
      ) : (
        <div className="space-y-2">
          {[...entries]
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .map((e) => (
              <Card key={e.id} className="p-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{formatDate(e.date)}</div>
                  <div className="text-xs text-sw-muted">
                    {e.weather && <>{e.weather} · </>}
                    {e.workers} workers · {e.hours} hrs
                    {e.incidents && <span className="text-sw-danger ml-2">⚠ incident</span>}
                  </div>
                </div>
                {e.notes && <p className="text-xs text-sw-muted">{e.notes}</p>}
                {e.subs.length > 0 && (
                  <p className="text-xs text-sw-muted">Subs: {e.subs.join(', ')}</p>
                )}
              </Card>
            ))}
        </div>
      )}

      <DiaryForm open={creating} onClose={() => setCreating(false)} projectId={project.id} />
    </div>
  )
}
