import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState, useDispatch } from '@/state/context'
import { Button, Card, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { NewFromTemplateDialog } from './NewFromTemplateDialog'
import type { BoqTemplate, Estimate } from '@/types'

type Tab = 'estimates' | 'templates'

/**
 * Estimating module — port of legacy `H1`. Two-tab module:
 * - "Estimates" — list of saved estimates with status + sum of code budgets
 * - "Templates" — 6 BOQ templates from seed, each with a "Use template"
 *   action that opens the NewFromTemplateDialog
 *
 * Promoting an estimate to a project (PROMOTE_ESTIMATE) lives on the
 * estimate detail row's button.
 */
export function EstimatingPage() {
  const { estimates, templates } = useAppState()
  const dispatch = useDispatch()
  const [tab, setTab] = useState<Tab>('estimates')
  const [templateFor, setTemplateFor] = useState<BoqTemplate | null>(null)

  function totalBudget(est: Estimate) {
    return est.codes.reduce((s, c) => s + (c.budget || 0), 0)
  }

  function promote(est: Estimate) {
    const name = window.prompt(`Promote "${est.name}" to a new project. Project name?`, est.name)
    if (!name) return
    dispatch({ type: 'PROMOTE_ESTIMATE', estimateId: est.id, projectName: name })
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Estimating</h1>
      </header>

      <div className="flex gap-1 border-b border-sw-border">
        {(
          [
            { id: 'estimates', label: `Estimates (${estimates.length})` },
            { id: 'templates', label: `BOQ Templates (${templates.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-sw-surface border border-sw-border border-b-sw-surface text-sw-text'
                : 'text-sw-muted hover:text-sw-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'estimates' &&
        (estimates.length === 0 ? (
          <EmptyState
            title="No estimates yet"
            description="Start an estimate from a BOQ template, or add one directly."
            action={<Button onClick={() => setTab('templates')}>Browse templates</Button>}
          />
        ) : (
          <Card>
            <ul className="divide-y divide-sw-border">
              {estimates.map((est) => (
                <li
                  key={est.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-sw-muted/5"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{est.name}</div>
                    <div className="text-xs text-sw-muted">
                      {est.id} · {est.codes.length} codes ·{' '}
                      <span className="font-medium text-sw-text">
                        {formatCurrency(totalBudget(est))}
                      </span>{' '}
                      · created {formatDate(est.createdDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={est.status} />
                    <Button size="sm" variant="secondary" onClick={() => promote(est)}>
                      Promote → Project
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="p-4 space-y-2 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{tpl.name}</h3>
                <StatusBadge status={tpl.type} />
              </div>
              <p className="text-xs text-sw-muted flex-1">{tpl.desc}</p>
              <div className="text-xs text-sw-muted">{tpl.codes.length} cost codes</div>
              <Button size="sm" onClick={() => setTemplateFor(tpl)}>
                Use template
              </Button>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-sw-muted">
        Tip: estimates can also be created by converting a lead from the{' '}
        <Link to="/leads" className="text-sw-info hover:underline">
          Leads / Tender
        </Link>{' '}
        page.
      </p>

      <NewFromTemplateDialog
        open={!!templateFor}
        onClose={() => setTemplateFor(null)}
        template={templateFor}
      />
    </div>
  )
}
