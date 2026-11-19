import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { useAppState, useDispatch } from '@/state/context'
import { ProjectForm } from '@/modules/Projects/ProjectForm'
import { donutSegments, type Slice } from '@/lib/pie'
import { useProject } from '../useProject'
import { codeDocTotals, computeProjectFinancials } from '../computeFinancials'
import { CostDonut } from './CostDonut'

/**
 * Project Overview — the builder's internal cockpit (Phase 4.7-M redesign).
 * Replaces the old analytic BOQ dump (that lives one tab over on BOQ) with a
 * whole-project HEALTH summary: header → a curated finance strip (adjusted
 * contract · cost to date · current-vs-target margin · true overrun) → eight
 * section cards, each a snapshot of a project area that links to its tab. The
 * Open Book stays its own client-facing report — the Finance card links to it.
 */
export function OverviewTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)

  const fin = useMemo(() => {
    if (!project) return null
    const purchases = state.purchases[project.id as string] ?? []
    return computeProjectFinancials(project, purchases)
  }, [project, state.purchases])

  // ── Cost distribution (4.8-B / interactive 4.8-C) ────────────────────────
  // Committed spend per cost code, from live documents (invoices + POs), same
  // basis the BOQ tab renders — so the donut and the BOQ agree. Memoised so the
  // donut's hover/wheel re-renders don't recompute codeDocTotals each tick.
  // (Hoisted above the early return — hooks must run on every render.)
  const dist = useMemo(() => {
    const codes = project?.codes ?? []
    const invoices = project?.invoices ?? []
    const purchases = project ? (state.purchases[project.id as string] ?? []) : []
    const codeCommits = codes.map((c) => ({
      code: c,
      committed: codeDocTotals(c.id, invoices, purchases).committed,
    }))
    // Full cost-code index: every code is in the scroll list (committed-desc,
    // so spenders lead and the zero-spend balance follows). Only codes with
    // committed spend draw an arc; the rest list at 0% for navigation.
    const slices: Slice[] = [...codeCommits]
      .sort((a, b) => b.committed - a.committed)
      .map((x) => ({
        key: x.code.id as string,
        label: x.code.desc || x.code.code,
        value: x.committed,
      }))
    return {
      committedTotal: codeCommits.reduce((s, x) => s + x.committed, 0),
      segments: donutSegments(
        slices,
        { cx: 60, cy: 60, rOuter: 56, rInner: 34 },
        { includeZero: true },
      ),
      // Variance hotspots — codes committed over their budget, worst first.
      hotspots: codeCommits
        .filter((x) => x.committed > x.code.budget)
        .map((x) => ({ ...x, overrun: x.committed - x.code.budget }))
        .sort((a, b) => b.overrun - a.overrun)
        .slice(0, 4),
    }
  }, [project, state.purchases])

  if (!project || !fin) return null

  const pid = project.id as string
  const client = state.clients.find((c) => c.id === project.clientId)
  const marginTarget = project.margin ?? 15
  const base = `/projects/${pid}`

  const { committedTotal, segments, hotspots } = dist

  // ── Finance strip derived values ─────────────────────────────────────────
  const marginOk = fin.currentMarginPct >= marginTarget
  const erosion = fin.marginErosionPct
  const marginColor = marginOk
    ? 'var(--sw-pos)'
    : erosion > 2
      ? 'var(--sw-neg)'
      : 'var(--sw-violet)'

  // ── Per-area snapshots for the section cards ─────────────────────────────
  const approvedVos = project.variations.filter((v) => v.status === 'Approved')
  const pendingVos = project.variations.filter((v) => v.status === 'Pending')

  const claims = state.claims[pid] ?? []
  const claimedTotal = claims.reduce((s, c) => s + (c.amount || 0), 0)
  const claimsOutstanding = claims
    .filter((c) => c.status === 'Approved')
    .reduce((s, c) => s + (c.amount || 0), 0)

  const milestones = state.milestones[pid] ?? []
  const delayedMs = milestones.filter((m) => m.status === 'delayed').length
  const nextMs = [...milestones]
    .filter((m) => m.status !== 'complete')
    .sort((a, b) => (a.date > b.date ? 1 : -1))[0]

  const today = new Date()
  const soon = new Date()
  soon.setDate(today.getDate() + 30)
  const expiring = (d: string) => !!d && new Date(d) < soon
  const projectSubs = state.subs.filter((s) => s.projects.includes(project.id))
  const subsAttention = projectSubs.filter(
    (s) => expiring(s.liabilityExp) || expiring(s.wcExp) || !s.swms,
  ).length

  const defects = state.defects[pid] ?? []
  const openDefects = defects.filter(
    (d) => d.status === 'Open' || d.status === 'In Progress',
  ).length
  const rectifiedDefects = defects.filter((d) => d.status === 'Rectified').length

  const rfis = state.rfis[pid] ?? []
  const overdueRfis = rfis.filter(
    (r) =>
      r.status === 'Overdue' ||
      (r.status === 'Open' && !!r.dateRequired && new Date(r.dateRequired) < today),
  ).length
  const openRfis = rfis.filter((r) => r.status === 'Open' || r.status === 'Overdue').length

  function duplicateProject() {
    if (!project) return
    dispatch({
      type: 'DUPLICATE_PROJECT',
      projectId: project.id,
      newName: `${project.name} (Copy)`,
    })
    navigate('/projects')
  }

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-[-0.02em] text-sw-ink">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="text-[13px] text-sw-dim">
            {client?.name}
            {client?.name && project.address ? ' · ' : ''}
            {project.address}
          </div>
          <span className="mt-2 inline-block rounded-[2px] border border-sw-rule px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.08em] text-sw-dim">
            {project.contractType === 'cost-plus' ? 'Cost Plus' : 'Fixed Price'}
          </span>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit Project
          </Button>
          <button
            type="button"
            onClick={duplicateProject}
            className="cursor-pointer rounded-[1px] border border-sw-rule bg-transparent px-3 py-[5px] text-[11px] text-sw-dim transition hover:text-sw-ink"
          >
            Duplicate Project
          </button>
        </div>
      </header>

      {/* ── Finance strip ────────────────────────────────────────────────── */}
      <div className="mb-9 flex flex-wrap gap-10">
        <Stat
          label="Adjusted Contract"
          value={formatCurrency(fin.adjustedContractValue)}
          sub={
            fin.approvedVariations > 0
              ? `incl. ${formatCurrency(fin.approvedVariations)} vars`
              : 'no variations'
          }
        />
        <Stat label="Cost to Date" value={formatCurrency(fin.costToDate)} sub="committed" />
        <Stat
          label="Current Margin"
          value={`${fin.currentMarginPct.toFixed(1)}%`}
          color={marginColor}
          sub={`${erosion > 0 ? '↓' : '↑'} target ${marginTarget}%`}
        />
        <Stat
          label="True Overrun"
          value={fin.trueOverrun > 0 ? formatCurrency(fin.trueOverrun) : 'Within Budget'}
          color={fin.trueOverrun > 0 ? 'var(--sw-neg)' : 'var(--sw-pos)'}
          sub={
            fin.trueOverrun > 0
              ? 'above adj. budget'
              : `adj. budget ${formatCurrency(fin.adjustedBudget)}`
          }
        />
      </div>

      {/* ── Cost distribution + variance hotspots (4.8-B) ────────────────── */}
      <section aria-label="Cost distribution" className="mb-9 grid gap-8 md:grid-cols-[auto_1fr]">
        {/* Donut + legend (4.8-C interactive) */}
        <CostDonut segments={segments} total={committedTotal} />

        {/* Variance hotspots */}
        <div className="border-t border-sw-rule pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <div className="mb-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
            Variance hotspots
          </div>
          {hotspots.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {hotspots.map((h) => (
                <li
                  key={h.code.id}
                  className="flex items-baseline justify-between gap-3 text-[12px]"
                >
                  <span className="truncate text-sw-ink" title={h.code.desc}>
                    {h.code.desc || h.code.code}
                  </span>
                  <span
                    className="shrink-0 tabular-nums font-semibold"
                    style={{ color: 'var(--sw-neg)' }}
                  >
                    +{formatCurrency(h.overrun)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mb-4 text-[12px]" style={{ color: 'var(--sw-pos)' }}>
              Every cost code is within budget.
            </div>
          )}
          <div className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
            <MiniStat
              label="Margin now · target"
              value={`${fin.currentMarginPct.toFixed(1)}% · ${marginTarget}%`}
              color={marginColor}
            />
            <MiniStat
              label="True overrun"
              value={fin.trueOverrun > 0 ? formatCurrency(fin.trueOverrun) : 'Within budget'}
              color={fin.trueOverrun > 0 ? 'var(--sw-neg)' : 'var(--sw-pos)'}
            />
          </div>
        </div>
      </section>

      {/* ── Section cards ────────────────────────────────────────────────── */}
      <section aria-label="Project sections" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SectionCard
          to={`${base}/openbook`}
          title="Finance · Open Book"
          value={`${fin.currentMarginPct.toFixed(1)}%`}
          valueColor={marginColor}
          sub={`margin · ${formatCurrency(fin.adjustedContractValue)} contract`}
          flag={!marginOk ? 'Margin eroded' : undefined}
          flagColor="var(--sw-neg)"
        />
        <SectionCard
          to={`${base}/variations`}
          title="Variations"
          value={formatCurrency(fin.approvedVariations)}
          sub={`${approvedVos.length} approved`}
          flag={pendingVos.length > 0 ? `${pendingVos.length} pending` : undefined}
          flagColor="var(--sw-violet)"
        />
        <SectionCard
          to={`${base}/claims`}
          title="Progress Claims"
          value={formatCurrency(claimedTotal)}
          sub={`of ${formatCurrency(fin.contractValue)} contract`}
          flag={
            claimsOutstanding > 0 ? `${formatCurrency(claimsOutstanding)} outstanding` : undefined
          }
          flagColor="var(--sw-violet)"
        />
        <SectionCard
          to={`${base}/cashflow`}
          title="Cash Flow"
          value={formatCurrency(fin.invoicesOutstanding)}
          valueColor={fin.invoicesOutstanding > 0 ? 'var(--sw-violet)' : 'var(--sw-pos)'}
          sub={`${formatCurrency(fin.invoicesPaid)} paid`}
        />
        <SectionCard
          to={`${base}/schedule`}
          title="Schedule"
          value={nextMs ? formatDateShort(nextMs.date) : `${milestones.length}`}
          sub={nextMs ? `next: ${nextMs.name}` : 'milestones'}
          flag={delayedMs > 0 ? `${delayedMs} delayed` : undefined}
          flagColor="var(--sw-neg)"
        />
        <SectionCard
          to={`${base}/defects`}
          title="Defects"
          value={`${openDefects}`}
          valueColor={openDefects > 0 ? 'var(--sw-neg)' : 'var(--sw-pos)'}
          sub={`open · ${rectifiedDefects} rectified`}
        />
        <SectionCard
          to={`${base}/rfis`}
          title="RFIs"
          value={`${openRfis}`}
          sub="open"
          flag={overdueRfis > 0 ? `${overdueRfis} overdue` : undefined}
          flagColor="var(--sw-neg)"
        />
        <SectionCard
          to="/subs"
          title="Compliance"
          value={`${subsAttention}`}
          valueColor={subsAttention > 0 ? 'var(--sw-neg)' : 'var(--sw-pos)'}
          sub={`of ${projectSubs.length} subs need attention`}
        />
      </section>

      {editing && <ProjectForm open initial={project} onClose={() => setEditing(false)} />}
    </div>
  )
}

/** dd Mon — compact milestone date. */
function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}

/** Finance-strip stat: 1px ink top rule, 9px label, 24px value, 11px faint sub. */
function Stat({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string
  color?: string
  sub?: string
}) {
  return (
    <div className="border-t border-sw-ink pt-3">
      <div className="mb-2 text-[9px] font-medium uppercase tracking-[0.1em] text-sw-dim">
        {label}
      </div>
      <div
        className="mb-[3px] text-[24px] font-bold tracking-[-0.02em]"
        style={{ color: color ?? 'var(--sw-ink)' }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-sw-faint">{sub}</div>}
    </div>
  )
}

/** Compact label/value pair used under the variance hotspots. */
function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-sw-dim">
        {label}
      </div>
      <div
        className="text-[14px] font-bold tracking-[-0.01em]"
        style={{ color: color ?? 'var(--sw-ink)' }}
      >
        {value}
      </div>
    </div>
  )
}

/** A project-area snapshot card that links to its tab. */
function SectionCard({
  to,
  title,
  value,
  valueColor,
  sub,
  flag,
  flagColor,
}: {
  to: string
  title: string
  value: ReactNode
  valueColor?: string
  sub?: string
  flag?: string
  flagColor?: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-[2px] border border-sw-rule p-4 transition hover:border-sw-ink hover:bg-sw-muted/5"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
          {title}
        </span>
        <span className="text-[13px] leading-none text-sw-faint transition group-hover:text-sw-ink">
          ›
        </span>
      </div>
      <div
        className="text-[22px] font-bold tracking-[-0.02em]"
        style={{ color: valueColor ?? 'var(--sw-ink)' }}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-sw-faint">{sub}</div>}
      {flag && (
        <div
          className="mt-2 inline-flex self-start rounded-[1px] px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-[0.06em]"
          style={{ color: flagColor, border: `1px solid ${flagColor}40` }}
        >
          {flag}
        </div>
      )}
    </Link>
  )
}
