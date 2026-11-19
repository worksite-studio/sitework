/**
 * Navigation definitions — ported verbatim from the legacy `Pc` shell
 * (the `f` array for top-level nav, the `m` array for project tabs).
 *
 * Keeping ids identical to the legacy app means URLs map 1:1 onto the
 * old view/tab state, which keeps the parity check honest.
 */

export interface NavItem {
  /** URL segment + legacy view id. */
  id: string
  label: string
}

/** Top-level sidebar nav (legacy `f` array). */
export const TOP_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'leads', label: 'Leads / Tender' },
  { id: 'estimating', label: 'Estimating' },
  { id: 'clients', label: 'Clients' },
  { id: 'subs', label: 'Subcontractors' },
  { id: 'education', label: 'Help & Learn' },
  { id: 'settings', label: 'Settings' },
]

/**
 * Per-project tabs — ordered to follow the natural project-delivery lifecycle
 * (set up → plan → procure → build → claim → close) so each stage daisy-chains
 * off the one before it. Legacy ids are unchanged, so routes/URLs map 1:1 onto
 * the old view/tab state — this is display order only.
 *
 *   Set up / budget : Overview · BOQ & Budget · PC & PS · Client Selections
 *   Plan            : Schedule (Program of Works) · Calendar
 *   Procure         : Purchase Orders
 *   Build           : Variations · Invoices · Timesheets · Site Diary · RFI Register
 *   Claim / finance : Progress Claims · Cash Flow
 *   Close           : Defects · Open Book
 */
export const PROJECT_TABS: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'boq', label: 'BOQ & Budget' },
  { id: 'pcps', label: 'PC & PS' },
  { id: 'selections', label: 'Client Selections' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'purchases', label: 'Purchase Orders & Subcontracts' },
  { id: 'variations', label: 'Variations' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'timesheets', label: 'Timesheets' },
  { id: 'diary', label: 'Site Diary' },
  { id: 'rfis', label: 'RFI Register' },
  { id: 'claims', label: 'Progress Claims' },
  { id: 'cashflow', label: 'Cash Flow' },
  { id: 'defects', label: 'Defects' },
  { id: 'openbook', label: 'Open Book' },
]
