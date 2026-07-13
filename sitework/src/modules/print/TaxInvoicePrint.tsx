import { useParams } from 'react-router-dom'
import { PrintLayout } from './PrintLayout'
import { useAppState } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { gstOf, incGst } from '@/lib/money'
import type { InvoiceId, ProjectId } from '@/types'

/**
 * Tax Invoice — print view for a single invoice with GST breakdown
 * (ex-GST / GST / inc-GST). Header carries builder ABN, footer leaves
 * room for payment terms / reference.
 */
export function TaxInvoicePrint() {
  const { projectId, invoiceId } = useParams<{ projectId: string; invoiceId: string }>()
  const state = useAppState()
  const project = state.projects.find((p) => p.id === (projectId as ProjectId))
  const invoice = project ? project.invoices.find((i) => i.id === (invoiceId as InvoiceId)) : null
  const client = project ? state.clients.find((c) => c.id === project.clientId) : null

  if (!project || !invoice) {
    return (
      <PrintLayout title="Tax invoice — not found" backTo="/" autoPrint={false}>
        <p>Invoice not found.</p>
      </PrintLayout>
    )
  }

  const code = project.codes.find((c) => c.id === invoice.ccId)
  // invoice.amount is ex-GST (per the Invoice type contract and every table);
  // derive GST and the inc-GST total from it via the central money helpers.
  const exGst = invoice.amount || 0
  const gst = gstOf(exGst)
  const total = incGst(exGst)

  return (
    <PrintLayout title="Tax invoice" backTo={`/projects/${project.id}/invoices`}>
      <header className="flex items-start justify-between gap-6 mb-5">
        <div>
          <h1>{(state.settings.businessName as string) || 'Worksite Studio'}</h1>
          <div className="text-xs text-sw-muted mt-0.5">
            ABN {(state.settings.abn as string) || '—'} · Licence{' '}
            {(state.settings.licence as string) || '—'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-sw-muted">Tax invoice</div>
          <div className="text-lg font-semibold">{invoice.id}</div>
          <div className="text-xs text-sw-muted">Date: {formatDate(invoice.date)}</div>
          <div className="text-xs text-sw-muted">Due: {formatDate(invoice.due)}</div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 mb-5">
        <div>
          <h2>Bill to</h2>
          <p className="font-medium">{client?.name ?? '—'}</p>
          <p className="text-xs">{client?.address ?? ''}</p>
        </div>
        <div>
          <h2>Project</h2>
          <p className="font-medium">{project.name}</p>
          <p className="text-xs">{project.address}</p>
        </div>
      </section>

      <section className="mb-5">
        <h2>Line item</h2>
        <table>
          <thead>
            <tr>
              <th>Supplier / Sub</th>
              <th>Cost code</th>
              <th className="text-right">Amount (ex GST)</th>
              <th className="text-right">GST</th>
              <th className="text-right">Total inc GST</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{invoice.supplier}</td>
              <td>{code ? `${code.code} · ${code.desc}` : '—'}</td>
              <td className="text-right tabular-nums">{formatCurrency(exGst)}</td>
              <td className="text-right tabular-nums">{formatCurrency(gst)}</td>
              <td className="text-right tabular-nums font-medium">{formatCurrency(total)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Totals</td>
              <td className="text-right tabular-nums">{formatCurrency(exGst)}</td>
              <td className="text-right tabular-nums">{formatCurrency(gst)}</td>
              <td className="text-right tabular-nums">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-10 pt-6 border-t border-sw-border grid grid-cols-2 gap-6 text-xs">
        <div>
          <h2>Payment terms</h2>
          <p>Due {formatDate(invoice.due)}.</p>
          <p>Status at time of issue: {invoice.status}.</p>
        </div>
        <div>
          <h2>Reference</h2>
          <p>Project {project.id}</p>
          <p>Invoice {invoice.id}</p>
        </div>
      </section>
    </PrintLayout>
  )
}
