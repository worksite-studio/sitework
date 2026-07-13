/**
 * Help & Education content — the legacy `wi` blob transliterated verbatim
 * (R8, PARITY gap 6): 3 getting-started guides, 6 module docs, 14 glossary
 * terms. Copy is the baseline's word-for-word; do not edit without a
 * baseline change.
 */

export interface Guide {
  id: string
  title: string
  body: string
  steps: string[]
}

export interface ModuleDoc {
  id: string
  title: string
  body: string
  tip: string
}

export interface GlossaryTerm {
  term: string
  def: string
}

export const gettingStarted: Guide[] = [
  {
    id: 'gs-1',
    title: 'Welcome to SITEWORK',
    body: `SITEWORK is a construction finance platform built for Australian builders, project managers and site administrators. It replaces spreadsheets and disconnected tools with a single system for tracking, managing and forecasting project costs.

This guide will walk you through the core modules and how they connect. SITEWORK is designed around the way Australian construction projects actually run — from the first lead through to Final Financial Completion.`,
    steps: [
      'Create your first project or import an estimate',
      'Set up your cost codes using a BOQ template or from scratch',
      'Add your subcontractors to the compliance register',
      'Connect Xero to sync your invoices automatically',
      'Start logging site diary entries and tracking variations',
    ],
  },
  {
    id: 'gs-2',
    title: 'Your first project',
    body: `Every project in SITEWORK starts with three things: a client, a contract value, and a set of cost codes. Cost codes are the backbone of the system — they're how you track where every dollar is budgeted, committed and spent.

We recommend starting from a BOQ template, which gives you a realistic cost code structure pre-seeded with industry-standard percentage splits. You can then adjust the budgets to match your estimate.`,
    steps: [
      'Go to Projects and click New Project',
      'Select a client or add a new one',
      'Choose a BOQ template that matches your project type',
      'Enter your overall project budget — SITEWORK will split it across codes automatically',
      'Add your subcontractors under the Subcontractors tab',
    ],
  },
  {
    id: 'gs-3',
    title: 'Connecting Xero',
    body: `SITEWORK integrates directly with Xero through OAuth 2.0 — meaning your financial data stays in sync without double entry. Once connected, invoices you approve in SITEWORK can be pushed directly to Xero as bills, and payments reconciled back.

The Xero connection is two-way: SITEWORK reads supplier contacts and bank accounts from Xero, and writes bills and cost allocations back. This is your primary tool for reducing admin time.`,
    steps: [
      'Go to Settings > Integrations',
      "Click Connect Xero and authorise through Xero's login page",
      'Map your Xero accounts to SITEWORK cost code categories',
      'Enable auto-sync for approved invoices',
      'Review synced transactions in the Invoices tab — look for the Xero indicator',
    ],
  },
]

export const moduleDocs: ModuleDoc[] = [
  {
    id: 'mod-1',
    title: 'BOQ & Budget',
    body: `The Bill of Quantities (BOQ) is the financial backbone of each project. It breaks your contract down into cost codes — each with a budget, committed amount, actual spend, and variance. SITEWORK calculates your RAG status (on budget / at risk / over) automatically as you log costs.

Cost codes can contain line items — detailed breakdowns by labour, material and subcontractor. This is where Rawlinson rate lookup integrates, giving you benchmark pricing for each item.`,
    tip: 'Use the Rawlinson Rate Lookup when creating line items to benchmark your rates against current Australian market data.',
  },
  {
    id: 'mod-2',
    title: 'Variations',
    body: `Variations are changes to the contract scope. Every variation should be logged in SITEWORK before work commences — with a cost code, amount, description and status. Approved variations automatically update your committed costs.

Pending variations are flagged on the Dashboard so nothing slips through. SITEWORK tracks your total approved variation value separately from your original contract, giving you a clear picture of your true contract sum at any point.`,
    tip: 'Log every verbal variation immediately, even as Pending. A variation registered and declined is better than one that never existed.',
  },
  {
    id: 'mod-3',
    title: 'Progress Claims & Invoices',
    body: `SITEWORK manages two types of invoices: subcontractor/supplier invoices (cost side) and progress claims to your client (revenue side). The Invoices module handles the cost side — each invoice is allocated to a cost code, approved, and synced to Xero.

For progress claims, SITEWORK uses milestone-based claim schedules tied to your Schedule module. Claim periods show what's been certified, what's been paid, and what's outstanding — the data you need for cash flow forecasting.`,
    tip: 'Always allocate invoices to a cost code immediately. Unallocated invoices make your BOQ unreliable.',
  },
  {
    id: 'mod-4',
    title: 'Retention & FFC',
    body: `Retention is money held back from progress payments — typically 5% under HIA and MBA contracts — until Practical Completion (PC) and the end of the Defects Liability Period (DLP). SITEWORK tracks retention separately from your main cash flow so you always know what's held and when it's due.

Final Financial Completion (FFC) is the moment all claims are settled and the final retention is releasable. SITEWORK generates FFC certificates and tracks the timeline from PC through to DLP end date.`,
    tip: 'Set your PC date and DLP months when the project starts, not when completion is approaching. SITEWORK will alert you as key dates approach.',
  },
  {
    id: 'mod-5',
    title: 'Subcontractor Compliance',
    body: `SITEWORK maintains a compliance register for every subcontractor — public liability insurance expiry, workers compensation expiry, and SWMS (Safe Work Method Statement) status. The register uses traffic light RAG coding: green is current, amber is expiring within 60 days, red is expired.

Expired compliance blocks a subcontractor from appearing as available on new projects. The Dashboard compliance alert surfaces all issues so nothing is missed before someone steps on site.`,
    tip: 'Request updated certificates as part of your PO process, not separately. Attaching compliance to payment is the most effective enforcement mechanism.',
  },
  {
    id: 'mod-6',
    title: 'Site Diary',
    body: `The Site Diary is a legally important document. In disputes, a contemporaneous daily record of weather, workers, subcontractors on site, progress and incidents is critical evidence. SITEWORK makes it easy to log entries from the field — each entry records weather conditions, worker and hour counts, which subs were on site, notes and any incidents.

Entries are reverse-chronological and exportable. Make it a daily habit for every site supervisor.`,
    tip: 'Log incidents immediately — even near-misses. An incident record created the same day carries significantly more weight than one created later.',
  },
]

export const glossary: GlossaryTerm[] = [
  {
    term: 'BOQ',
    def: 'Bill of Quantities. A structured breakdown of all work items in a project, with quantities, units and rates. The foundation of cost management.',
  },
  {
    term: 'Cost Code',
    def: 'A category of work within a project (e.g. Electrical, Framing). Every cost — budget, committed and actual — is allocated to a cost code.',
  },
  {
    term: 'Committed Cost',
    def: "Money you've contractually committed to spend — subcontractor agreements, purchase orders, accepted quotes. Not yet paid but obligated.",
  },
  {
    term: 'Actual Cost',
    def: 'Money actually paid out. Should reconcile with your Xero accounts.',
  },
  {
    term: 'Variation (VO)',
    def: 'A change to the original contract scope. Can increase or decrease the contract value. Must be approved in writing before work commences.',
  },
  {
    term: 'Practical Completion (PC)',
    def: 'The stage when works are complete to the extent that the client can occupy and use the building, subject to minor defects.',
  },
  {
    term: 'Defects Liability Period (DLP)',
    def: 'A period (typically 6-12 months) after PC during which the builder must rectify defects at no cost. Retention is typically held until DLP end.',
  },
  {
    term: 'Final Financial Completion (FFC)',
    def: 'When all financial obligations under the contract are settled. Releases remaining retention.',
  },
  {
    term: 'Retention',
    def: 'A percentage of progress payments held back by the principal/client as security. Typically 5% under standard Australian residential contracts.',
  },
  {
    term: 'Progress Claim',
    def: 'A formal claim by the builder for payment of work completed to date. Issued periodically per the contract schedule.',
  },
  {
    term: 'SWMS',
    def: 'Safe Work Method Statement. A document identifying construction work risks and control measures. Required for high-risk construction work in all Australian states.',
  },
  {
    term: 'RAG Status',
    def: 'Red / Amber / Green status indicator. In SITEWORK, used to show budget health (on budget / at risk / over) and compliance status (current / expiring / expired).',
  },
  {
    term: 'Rawlinson Rate',
    def: "Benchmark construction rates published in the Rawlinson's Australian Construction Handbook. Used in SITEWORK as a reference for line item pricing.",
  },
  {
    term: 'Xero',
    def: 'Cloud accounting platform used by SITEWORK for two-way financial sync. Invoices approved in SITEWORK are pushed to Xero as bills; payments reconcile back.',
  },
]

/** Legacy X1 Rawlinson tab data. */
export const rawlinsonCoverage = [
  'Preliminaries',
  'Demolition',
  'Concrete Works',
  'Framing & Structure',
  'Roofing',
  'Electrical',
  'Plumbing',
  'Carpentry & Joinery',
  'Tiling',
  'Painting',
  '+ more trades updated annually',
]

export const rawlinsonFactors = [
  { region: 'NSW', multiplier: 1, note: 'Base index' },
  { region: 'VIC', multiplier: 0.97, note: '-3%' },
  { region: 'QLD', multiplier: 1.03, note: '+3%' },
  { region: 'WA', multiplier: 1.18, note: '+18% (labour premium)' },
  { region: 'SA', multiplier: 0.94, note: '-6%' },
  { region: 'ACT', multiplier: 1.08, note: '+8%' },
  { region: 'TAS', multiplier: 0.92, note: '-8%' },
  { region: 'NT', multiplier: 1.25, note: '+25% (remote premium)' },
]
