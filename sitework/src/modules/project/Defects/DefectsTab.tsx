import { useState } from 'react'
import { useAppState, useDispatch } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useProject } from '../useProject'
import { DefectForm } from './DefectForm'
import type { Defect, Retention } from '@/types'

/**
 * Defects tab — transliteration of legacy `k1v2` (R7, PARITY gap-12 row):
 * the page leads with `k1`'s **Retention & FFC** module (Retention Summary
 * kv rows + purple progress bar, Completion Timeline with PC / FFC / DLP
 * nodes and the "Issue FFC Certificate" action), then a 2px-ink-ruled
 * "Defects & PC Checklist" section — "N open · N rectified" (+ green
 * "All clear"), zebra rows, pill Open/Rectified statuses (legacy uses
 * pills HERE, unlike the bare-text tables), rectified date in green,
 * per-row Edit link, "+ Log Defect".
 */
export function DefectsTab() {
  const project = useProject()
  const state = useAppState()
  const [modal, setModal] = useState<'new' | { defect: Defect } | null>(null)
  if (!project) return null

  const defects: Defect[] = state.defects[project.id as string] ?? []
  const retention = state.retention[project.id as string]
  const open = defects.filter((x) => x.status === 'Open').length
  const rectified = defects.filter((x) => x.status === 'Rectified').length

  return (
    <div>
      <RetentionPanel retention={retention} />

      <div className="mt-10 border-t-2 border-sw-ink pt-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="mb-1 text-[18px] font-bold text-sw-ink">Defects & PC Checklist</div>
            <div className="text-[13px] text-sw-dim">
              {open} open · {rectified} rectified
              {defects.length > 0 && open === 0 && (
                <span className="ml-2 font-semibold" style={{ color: 'var(--sw-pos)' }}>
                  All clear
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModal('new')}
            className="cursor-pointer bg-sw-ink px-3.5 py-[7px] text-[12px] font-semibold text-white"
          >
            + Log Defect
          </button>
        </div>

        <div className="border-t border-sw-ink">
          <table className="sw-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Location</th>
                <th>Trade</th>
                <th>Logged</th>
                <th>Rectified</th>
                <th>Status</th>
                <th aria-label="Edit" />
              </tr>
            </thead>
            <tbody>
              {defects.length > 0 ? (
                defects.map((def, idx) => (
                  <tr
                    key={def.id as string}
                    style={{ background: idx % 2 === 0 ? '#fff' : 'var(--sw-bg)' }}
                  >
                    <td className="font-medium">{def.item}</td>
                    <td className="text-sw-dim">{def.location}</td>
                    <td className="text-sw-dim">{def.trade}</td>
                    <td className="text-sw-dim">{formatDate(def.dateLogged)}</td>
                    <td style={{ color: def.dateRectified ? 'var(--sw-pos)' : 'var(--sw-dim)' }}>
                      {def.dateRectified ? formatDate(def.dateRectified) : '—'}
                    </td>
                    <td>
                      {/* Legacy k1v2 uses PILLS here, unlike the bare-text money tables. */}
                      <span
                        className="px-2 py-[2px] text-[11px] font-semibold"
                        style={{
                          background: def.status === 'Rectified' ? '#DCFCE7' : '#FEF2F2',
                          color: def.status === 'Rectified' ? '#16A34A' : '#DC2626',
                        }}
                      >
                        {def.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setModal({ defect: def })}
                        className="cursor-pointer bg-transparent text-[11px] text-sw-ink hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[13px] text-sw-faint">
                    No defects logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'new' && <DefectForm open onClose={() => setModal(null)} projectId={project.id} />}
      {modal !== null && modal !== 'new' && (
        <DefectForm
          open
          onClose={() => setModal(null)}
          projectId={project.id}
          initial={modal.defect}
        />
      )}
    </div>
  )
}

/** Legacy `k1` — Retention & FFC: summary + completion timeline. */
function RetentionPanel({ retention }: { retention: Retention | undefined }) {
  const project = useProject()
  const dispatch = useDispatch()
  if (!retention || !project) {
    return <div className="p-10 text-center text-[13px] text-sw-faint">No retention data.</div>
  }

  const today = new Date()
  const maxRetention = (retention.contractValue ?? 0) * (retention.rate / 100)
  const held = retention.held ?? 0
  const released = retention.released ?? 0
  const netHeld = held - released
  const heldPct = maxRetention > 0 ? Math.min((held / maxRetention) * 100, 100) : 0
  const pc = retention.pcDate ? new Date(retention.pcDate) : null
  const daysToPc = pc ? Math.ceil((pc.getTime() - today.getTime()) / 86400000) : null
  const dlpEnd =
    pc && retention.dlpMonths
      ? new Date(pc.getTime() + retention.dlpMonths * 30.44 * 86400000)
      : null
  const halfRelease = `Release $${(maxRetention / 2).toLocaleString('en-AU', {
    maximumFractionDigits: 0,
  })}`

  const steps = [
    {
      label: 'Practical Completion',
      date: retention.pcDate ? formatDate(retention.pcDate) : 'Not set',
      note:
        daysToPc != null
          ? daysToPc > 0
            ? `${daysToPc} days away`
            : `${Math.abs(daysToPc)} days ago`
          : null,
      release: halfRelease,
      active: !!retention.pcDate,
    },
    {
      label: 'Final Financial Completion',
      date: retention.ffcDate ? formatDate(retention.ffcDate) : 'Pending',
      note: 'After all claims settled',
      release: 'FFC Certificate issued',
      active: !!retention.ffcDate,
    },
    {
      label: 'End of DLP',
      date: dlpEnd ? formatDate(dlpEnd.toISOString().slice(0, 10)) : 'Pending',
      note: `${retention.dlpMonths ?? 0} month defects period`,
      release: `${halfRelease} remaining`,
      active: !!dlpEnd,
    },
  ]

  return (
    <div>
      <h2 className="mb-7 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Retention & FFC</h2>
      <div className="grid grid-cols-2 gap-[60px]">
        {/* Retention Summary */}
        <div className="border-t border-sw-ink bg-white py-5">
          <div className="mb-5 text-[13px] font-bold text-sw-ink">Retention Summary</div>
          {(
            [
              { l: 'Contract Value', v: formatCurrency(retention.contractValue ?? 0) },
              { l: 'Retention Rate', v: `${retention.rate}%` },
              { l: 'Maximum Retention', v: formatCurrency(maxRetention) },
              { l: 'Currently Held', v: formatCurrency(held), c: 'var(--sw-violet)', b: true },
              { l: 'Released to Date', v: formatCurrency(released), c: 'var(--sw-pos)' },
              { l: 'Net Balance Held', v: formatCurrency(netHeld), b: true },
            ] as Array<{ l: string; v: string; c?: string; b?: boolean }>
          ).map(({ l, v, c, b }) => (
            <div key={l} className="flex justify-between border-b border-sw-rule-l py-[9px]">
              <span className="text-[12px] text-sw-dim">{l}</span>
              <span
                className="font-mono text-[13px]"
                style={{ color: c ?? 'var(--sw-ink)', fontWeight: b ? 700 : 400 }}
              >
                {v}
              </span>
            </div>
          ))}
          <div className="mt-4">
            <div className="mb-[5px] flex justify-between">
              <span className="text-[10px] text-sw-dim">Retention held vs maximum</span>
              <span className="text-[10px] font-semibold">{heldPct.toFixed(0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-[1px] bg-sw-rule-l">
              <div
                className="h-full rounded-[1px]"
                style={{
                  width: `${heldPct}%`,
                  background: 'linear-gradient(90deg,#7C3AED 0%,#A78BFA 100%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Completion Timeline */}
        <div className="border-t border-sw-ink bg-white py-5">
          <div className="mb-5 text-[13px] font-bold text-sw-ink">Completion Timeline</div>
          {steps.map((s, i) => (
            <div key={s.label} className="flex gap-3.5" style={{ marginBottom: i < 2 ? 20 : 0 }}>
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className="mt-[2px] h-3 w-3 rounded-full"
                  style={{
                    border: `2px solid ${s.active ? 'var(--sw-pos)' : 'var(--sw-rule)'}`,
                    background: s.active ? 'var(--sw-pos)' : '#fff',
                  }}
                />
                {i < 2 && <div className="mt-1 h-[30px] w-[2px] bg-white" />}
              </div>
              <div className="flex-1">
                <div
                  className="text-[12px] font-bold"
                  style={{ color: s.active ? 'var(--sw-ink)' : 'var(--sw-dim)' }}
                >
                  {s.label}
                </div>
                <div
                  className="mt-[2px] text-[11px]"
                  style={{ color: s.active ? 'var(--sw-ink)' : 'var(--sw-faint)' }}
                >
                  {s.date}
                </div>
                {s.note && <div className="mt-px text-[10px] text-sw-faint">{s.note}</div>}
                <div
                  className="mt-[3px] text-[11px]"
                  style={{
                    color: s.active ? 'var(--sw-pos)' : 'var(--sw-faint)',
                    fontWeight: s.active ? 600 : 400,
                  }}
                >
                  {s.release}
                </div>
              </div>
            </div>
          ))}
          {!retention.ffcDate && (
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'UPDATE_RETENTION',
                  projectId: project.id,
                  patch: { ffcDate: new Date().toISOString().slice(0, 10) },
                })
              }
              className="mt-5 cursor-pointer rounded-[1px] px-4 py-2 text-[12px] font-semibold text-white"
              style={{ background: 'var(--sw-pos)' }}
            >
              Issue FFC Certificate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
