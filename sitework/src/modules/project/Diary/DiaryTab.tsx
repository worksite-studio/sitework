import { useState } from 'react'
import { Button, Dialog, Field, Input } from '@/components/ui'
import { parseAmount } from '@/lib/money'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { DiaryEntry, DiaryEntryId } from '@/types'
import { newId } from '@/lib/newId'

/**
 * Site Diary — transliteration of legacy `R1` + `A1` (R7, PARITY gap-12
 * row): "N entries · Last: date" sub-line, boxed entry cards with the
 * THU/27/Nov date block (right-ruled), "Weather: X" + "N workers · Nh"
 * meta line, violet Incident tag, green sub-name chips, notes; cards get
 * a blue border when an incident is flagged. "+ Add Entry" opens `A1`
 * (site notes required, subcontractor toggle chips, incident checkbox).
 */
export function DiaryTab() {
  const project = useProject()
  const state = useAppState()
  const [adding, setAdding] = useState(false)
  if (!project) return null

  const entries: DiaryEntry[] = state.diary[project.id as string] ?? []
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Site Diary</h2>
          <div className="text-[13px] text-sw-dim">
            {entries.length} entries · Last: {sorted[0] ? formatDate(sorted[0].date) : 'None'}
          </div>
        </div>
        <Button onClick={() => setAdding(true)}>+ Add Entry</Button>
      </header>

      <div className="flex flex-col gap-3">
        {sorted.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-sw-faint">No diary entries yet.</div>
        ) : (
          sorted.map((entry) => {
            const d = new Date(entry.date)
            return (
              <div
                key={entry.id as string}
                className="flex gap-5 bg-white px-6 py-5"
                style={{ border: `1px solid ${entry.incidents ? '#DBEAFE' : 'var(--sw-rule)'}` }}
              >
                {/* Legacy date block: weekday / day / month over a right rule. */}
                <div className="w-11 shrink-0 self-start border-r border-sw-rule pr-4 text-center">
                  <div className="text-[9px] font-semibold uppercase text-sw-dim">
                    {d.toLocaleDateString('en-AU', { weekday: 'short' })}
                  </div>
                  <div className="text-[22px] font-bold leading-[1.1] text-sw-ink">
                    {d.toLocaleDateString('en-AU', { day: '2-digit' })}
                  </div>
                  <div className="text-[11px] font-semibold text-sw-dim">
                    {d.toLocaleDateString('en-AU', { month: 'short' })}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2.5 flex flex-wrap items-center gap-3">
                    <span className="text-[12px] text-sw-dim">Weather: {entry.weather}</span>
                    <span className="text-[12px] text-sw-dim">
                      {entry.workers} workers · {entry.hours}h
                    </span>
                    {entry.incidents && (
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: 'var(--sw-violet)' }}
                      >
                        Incident
                      </span>
                    )}
                  </div>
                  {entry.subs.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-[5px]">
                      {entry.subs.map((s) => (
                        <span
                          key={s}
                          className="px-1 text-[10px] font-medium"
                          style={{ color: 'var(--sw-pos)' }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-[13px] leading-relaxed text-sw-dim">{entry.notes}</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {adding && <DiaryForm onClose={() => setAdding(false)} />}
    </div>
  )
}

/** Legacy `A1` — New Diary Entry: site notes required, sub toggle chips. */
function DiaryForm({ onClose }: { onClose: () => void }) {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weather: '',
    workers: '',
    hours: '',
    notes: '',
    incidents: false,
  })
  const [selectedSubs, setSelectedSubs] = useState<string[]>([])
  const [attempted, setAttempted] = useState(false)
  if (!project) return null

  function toggleSub(name: string) {
    setSelectedSubs((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
  }

  function save() {
    if (!project) return
    if (!form.notes.trim()) {
      setAttempted(true)
      return
    }
    const entry: DiaryEntry = {
      id: asId<DiaryEntryId>(newId('DIA')),
      date: form.date,
      weather: form.weather,
      workers: parseAmount(form.workers),
      subs: selectedSubs,
      hours: parseAmount(form.hours),
      notes: form.notes,
      incidents: form.incidents,
    }
    dispatch({ type: 'ADD_DIARY_ENTRY', projectId: project.id, entry })
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="New Diary Entry"
      widthClass="max-w-xl"
      footer={<Button onClick={save}>Add Entry</Button>}
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
            placeholder="e.g. Sunny, 24°C"
          />
        </Field>
        <Field label="Workers on Site">
          <Input
            type="number"
            value={form.workers}
            onChange={(e) => setForm({ ...form, workers: e.target.value })}
          />
        </Field>
        <Field label="Total Hours">
          <Input
            type="number"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
          />
        </Field>
      </div>

      {state.subs.length > 0 && (
        <div className="mb-1">
          <div className="mb-2 text-[11px] font-medium text-sw-dim">Subcontractors on site</div>
          <div className="flex flex-wrap gap-1.5">
            {state.subs.map((sub) => {
              const on = selectedSubs.includes(sub.name)
              return (
                <button
                  key={sub.id as string}
                  type="button"
                  onClick={() => toggleSub(sub.name)}
                  className="cursor-pointer px-2.5 py-[5px] text-[11px] font-medium"
                  style={{
                    border: `1px solid ${on ? 'var(--sw-ink)' : 'var(--sw-rule)'}`,
                    background: on ? 'var(--sw-accent-bg)' : '#fff',
                    color: on ? 'var(--sw-ink)' : 'var(--sw-dim)',
                  }}
                >
                  {sub.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Field
        label="Site Notes"
        required
        error={attempted && !form.notes.trim() ? 'Required' : undefined}
      >
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Work completed, deliveries, issues, client visits..."
          className="min-h-20 w-full resize-y border bg-sw-bg px-3 py-2.5 text-[13px] text-sw-ink outline-none"
          style={{
            borderColor: attempted && !form.notes.trim() ? 'var(--sw-neg)' : 'var(--sw-rule)',
          }}
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={form.incidents}
          onChange={(e) => setForm({ ...form, incidents: e.target.checked })}
        />
        <span className="text-[12px] text-sw-dim">Incident or near-miss to report</span>
      </label>
    </Dialog>
  )
}
