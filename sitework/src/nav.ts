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

/** Per-project tabs (legacy `m` array). */
export const PROJECT_TABS: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'boq', label: 'BOQ & Budget' },
  { id: 'pcps', label: 'PC & PS' },
  { id: 'variations', label: 'Variations' },
  { id: 'claims', label: 'Progress Claims' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'purchases', label: 'Purchase Orders' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'diary', label: 'Site Diary' },
  { id: 'selections', label: 'Client Selections' },
  { id: 'timesheets', label: 'Timesheets' },
  { id: 'defects', label: 'Defects' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'openbook', label: 'Open Book' },
  { id: 'cashflow', label: 'Cash Flow' },
  { id: 'rfis', label: 'RFI Register' },
]
