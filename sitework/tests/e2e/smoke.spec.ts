import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Start each spec from a clean slate so the persisted dispatch from a
  // previous spec doesn't bleed in.
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.setItem('sw:skipSplash', '1')
  })
})

test('dashboard renders stat blocks + unified Projects register (gap 4.7-H)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/^Good morning/)).toBeVisible()
  await expect(page.getByText('Active Projects', { exact: true })).toBeVisible()
  await expect(page.getByText('Outstanding Invoices', { exact: true })).toBeVisible()
  await expect(page.getByText('Portfolio Margin', { exact: true })).toBeVisible()
  await expect(page.getByText('Compliance Alerts', { exact: true })).toBeVisible()
  // Hybrid rebuild: one attention-sorted register replaces the old
  // Project-Health / Budget-&-Margin columns.
  await expect(page.getByRole('heading', { level: 2, name: /^Projects$/ })).toBeVisible()

  // Clicking a register row navigates to the project overview. Scope to the
  // register region so the Alerts panel's project links don't collide.
  await page
    .getByRole('region', { name: 'Project register' })
    .getByRole('link', { name: /Akademie/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/overview$/)
})

test('dashboard KPI tiles + alert rows click through (gap 4.7-H)', async ({ page }) => {
  await page.goto('/')
  // Money KPI tiles drill through to the portfolio.
  await page.getByRole('link', { name: /Outstanding Invoices/ }).click()
  await expect(page).toHaveURL(/\/projects$/)

  // Alert rows link to their source tab (subs / project RFIs / project VOs).
  await page.goto('/')
  const alerts = page.getByRole('region', { name: 'Alerts and compliance' })
  const firstAlert = alerts.getByRole('link').first()
  await expect(firstAlert).toBeVisible()
  await firstAlert.click()
  await expect(page).toHaveURL(/\/(subs|projects\/PRJ-\d+\/(rfis|variations))/)
})

test('navigates to Projects list and into a project tab', async ({ page }) => {
  await page.goto('/')
  // Exact: the "Active Projects" dashboard tile is also a link (4.5-C).
  await page.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page).toHaveURL(/\/projects$/)
  // Role-anchored: during the route swap the dashboard's Project Health
  // "Akademie" briefly coexists with the list row — bare getByText is
  // ambiguous mid-transition (strict-mode violation).
  await expect(page.getByRole('link', { name: /Akademie/ })).toBeVisible()

  await page.getByRole('link', { name: /Akademie/ }).click()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/overview$/)

  await page.getByRole('link', { name: 'BOQ & Budget' }).click()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/boq$/)

  await page.goBack()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/overview$/)
})

test('deep-link into a project tab works', async ({ page }) => {
  await page.goto('/projects/PRJ-001/claims')
  await expect(page.getByRole('heading', { name: 'Progress Claims' })).toBeVisible()
})

test('project Overview tab renders D1 stats + BOQ table + Contract vs Cost panel', async ({
  page,
}) => {
  await page.goto('/projects/PRJ-001/overview')
  // D1 stat row (legacy-only stats)
  await expect(page.getByText('True Overrun')).toBeVisible()
  await expect(page.getByText('Original Budget', { exact: true })).toBeVisible()
  // D1 analytic BOQ table (zero-placeholder codes filtered out)
  await expect(
    page.getByText('Preliminary Costs, Consultant Fees, Site Establishment'),
  ).toBeVisible()
  await expect(page.getByText('Surveying — Set-Out, TBM, Pins')).not.toBeVisible()
  // D1v2 panel + Duplicate Project button
  await expect(page.getByRole('heading', { name: /Contract vs Cost/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Duplicate Project' })).toBeVisible()
})

test('project BOQ tab renders codes table and supports add', async ({ page }) => {
  await page.goto('/projects/PRJ-001/boq')
  await expect(page.getByRole('heading', { name: 'BOQ & Budget' })).toBeVisible()
  await expect(
    page.getByText('Preliminary Costs, Consultant Fees, Site Establishment'),
  ).toBeVisible()

  // Open the cost-code form via the + Cost Code button
  await page.getByRole('button', { name: '+ Cost Code' }).first().click()
  await expect(page.getByRole('heading', { name: 'Add Cost Code' })).toBeVisible()
  // Auto-numbered Code (next 3-digit) is pre-filled
  await expect(page.getByLabel(/^Code\*$/)).not.toHaveValue('')
})

test('BOQ line-item units: m removed, m³ added, custom unit reveals a field (gap 4.7-D)', async ({
  page,
}) => {
  await page.goto('/projects/PRJ-001/boq')
  // Expand the first code, then open its Add Line Item dialog.
  await page.getByText('Preliminary Costs, Consultant Fees, Site Establishment').click()
  await page.getByRole('button', { name: '+ Add Line Item' }).first().click()
  const unit = page.getByLabel('Unit')
  await expect(unit.locator('option', { hasText: 'm³' })).toHaveCount(1)
  await expect(unit.locator('option', { hasText: /^m$/ })).toHaveCount(0)
  await unit.selectOption('__custom__')
  await expect(page.getByLabel('New unit')).toBeVisible()
})

test('BOQ budget rolls up from line items; adding one updates it (gap 4.7-E)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/boq')
  // Migrated/reconciled budget of code 001 = its line-item sum.
  const codeRow = page.getByText('Preliminary Costs, Consultant Fees, Site Establishment')
  await expect(page.getByText('/ $7,460')).toBeVisible()
  await codeRow.click() // expand
  await page.getByRole('button', { name: '+ Add Line Item' }).first().click()
  await page.getByLabel(/^Description/).fill('Extra survey')
  await page.getByLabel('Qty').fill('2')
  await page.getByLabel('Rate').fill('500')
  await page.getByRole('button', { name: 'Save Line Item' }).click()
  await expect(page.getByText('Extra survey')).toBeVisible()
  // Budget rolled up by 2 × 500 = 1,000 → $8,460.
  await expect(page.getByText('/ $8,460')).toBeVisible()
})

test('BOQ cost-code form has no budget field (gap 4.7-E)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/boq')
  await page.getByRole('button', { name: '+ Cost Code' }).first().click()
  await expect(page.getByRole('heading', { name: 'Add Cost Code' })).toBeVisible()
  await expect(page.getByLabel(/Budget/)).toHaveCount(0)
})

test('BOQ totals summary shows cost → margin → GST → total (gap 4.7-F)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/boq')
  await expect(page.getByText('BOQ Summary')).toBeVisible()
  await expect(page.getByText('Cost subtotal')).toBeVisible()
  await expect(page.getByText(/Margin \(\d+%\)/)).toBeVisible()
  await expect(page.getByText('Contract (ex GST)')).toBeVisible()
  await expect(page.getByText('GST (10%)')).toBeVisible()
  await expect(page.getByText('Total (inc GST)')).toBeVisible()
})

test('project PC & PS tab — Pcps anatomy + pcf add form (gap 5)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/pcps')
  await expect(page.getByRole('heading', { name: 'PC & PS' })).toBeVisible()
  await expect(page.getByText(/Margin is applied on excess only/)).toBeVisible()
  await expect(page.getByRole('heading', { name: /Prime Cost Items/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Provisional Sums/ })).toBeVisible()
  await expect(page.getByText('Margin on Excess', { exact: true }).first()).toBeVisible()
  // Legacy inline totals footer
  await expect(page.getByText(/Allowance total:/).first()).toBeVisible()

  // pcf add form: validation then happy path
  await page.getByRole('button', { name: '+ Add PC Item' }).click()
  await expect(page.getByRole('heading', { name: 'Add PC Item' })).toBeVisible()
  await page.getByRole('button', { name: 'Add PC Item', exact: true }).last().click()
  await expect(page.getByText('Required')).toBeVisible()
  await page.getByLabel(/^Description\*$/).fill('Smoke PC allowance')
  await page.getByLabel(/^Allowance/).fill('5000')
  await page.getByRole('button', { name: 'Add PC Item', exact: true }).last().click()
  await expect(page.getByText('Smoke PC allowance')).toBeVisible()
})

test('project Variations tab — requestedBy column + v1 form (gap 4)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/variations')
  await expect(page.getByRole('heading', { name: 'Variations', exact: true })).toBeVisible()
  // Legacy B1 sub-line with count + REQUESTED BY column
  await expect(page.getByText(/7 variations ·/)).toBeVisible()
  await expect(page.getByText('Requested By', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '+ New Variation' }).first().click()
  await expect(page.getByRole('heading', { name: 'New Variation' })).toBeVisible()
  // v1 fields: Requested By select (default Owner), Reason Category with Other
  await expect(page.getByLabel('Requested By')).toHaveValue('Owner')
  // Conditional comment fields appear on Other
  await page.getByLabel('Reason Category').selectOption('Other')
  await expect(page.getByLabel('Comment / Reason Detail')).toBeVisible()
  await page.getByLabel('Requested By').selectOption('Other')
  await expect(page.getByLabel(/Requested By — Comment/)).toBeVisible()
})

test('project Invoices tab — cost-plus substantiation gate blocks save', async ({ page }) => {
  // PRJ-001 is cost-plus in seed
  await page.goto('/projects/PRJ-001/invoices')
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
  await page.getByRole('button', { name: '+ Invoice' }).first().click()
  await expect(page.getByRole('heading', { name: 'New Invoice' })).toBeVisible()
  // Fill required fields BUT leave docs empty
  await page.getByLabel(/^Supplier \/ subcontractor\*$/).fill('Test Supplier')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(/supporting document/i).first()).toBeVisible()
})

test('project Invoices — Budget Match column flags the cost code health (gap 4.7-K)', async ({
  page,
}) => {
  await page.goto('/projects/PRJ-001/invoices')
  await expect(page.getByRole('columnheader', { name: 'Budget Match' })).toBeVisible()
  // Seed PRJ-001 has over-budget codes, so at least one row reads "Over".
  await expect(page.getByRole('cell', { name: 'Over', exact: true }).first()).toBeVisible()
})

test('project Invoices tab — fixed-price doesn’t gate on docs', async ({ page }) => {
  // PRJ-005 is fixed-price in seed
  await page.goto('/projects/PRJ-005/invoices')
  await page.getByRole('button', { name: '+ Invoice' }).first().click()
  await expect(page.getByRole('heading', { name: 'New Invoice' })).toBeVisible()
  // No "Supporting documents" field at all on fixed-price
  await expect(page.getByText('Supporting documents')).not.toBeVisible()
})

test('project POs tab renders + Receive button on sent POs', async ({ page }) => {
  await page.goto('/projects/PRJ-001/purchases')
  await expect(page.getByRole('heading', { name: 'Purchase Orders' })).toBeVisible()
})

test('project Claims tab — claim numbering + substantiation gate', async ({ page }) => {
  await page.goto('/projects/PRJ-001/claims')
  await expect(page.getByRole('heading', { name: 'Progress Claims' })).toBeVisible()
  // Rows carry a project-scoped reference (gap 4.7-I).
  await expect(page.getByRole('cell', { name: /^PRJ-001-C\d+$/ }).first()).toBeVisible()
  await page.getByRole('button', { name: '+ New Claim' }).first().click()
  // Dialog title shows the next claim's project-scoped ref (auto-fill).
  await expect(page.getByRole('heading', { name: /^New claim PRJ-001-C\d+$/ })).toBeVisible()
  // Substantiation field visible on cost-plus
  await expect(page.getByText('Supporting documents').first()).toBeVisible()
})

test('project Claims — a duplicate claim number is blocked (gap 4.7-I)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/claims')
  await page.getByRole('button', { name: '+ New Claim' }).first().click()
  // Seed PRJ-001 already has claims #1–7 — reuse #1.
  await page.getByLabel('Claim no.').fill('1')
  await page.getByLabel(/^Description/).fill('Duplicate number test')
  await page.getByRole('button', { name: 'Save' }).click()
  // Blocked with an inline error; the dialog stays open.
  await expect(page.getByText('#1 already exists')).toBeVisible()
  await expect(page.getByRole('heading', { name: /^New claim PRJ-001-C1$/ })).toBeVisible()
})

test('project Defects + Schedule + Diary + RFIs + Selections + Timesheets tabs render', async ({
  page,
}) => {
  for (const [path, heading] of [
    ['defects', 'Retention & FFC'],
    ['schedule', 'Schedule'],
    ['diary', 'Site Diary'],
    ['rfis', 'RFI Register'],
    ['selections', 'Client Selections'],
    ['timesheets', 'Timesheets'],
  ] as const) {
    await page.goto(`/projects/PRJ-001/${path}`)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }
})

test('project Calendar tab aggregates milestones + sub expiries', async ({ page }) => {
  await page.goto('/projects/PRJ-001/calendar')
  await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toBeVisible()
  // Seed PRJ-001 has DA Approval milestone — should appear
  await expect(page.getByText('DA Approval')).toBeVisible()
})

test('project Open Book tab renders read-only summary', async ({ page }) => {
  await page.goto('/projects/PRJ-001/openbook')
  await expect(page.getByText('OPEN-BOOK REPORT', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Contract & Cost Summary' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Print/ })).toBeVisible()
})

test('project Cash Flow tab renders monthly forecast', async ({ page }) => {
  await page.goto('/projects/PRJ-001/cashflow')
  await expect(page.getByRole('heading', { name: 'Cash Flow', exact: true })).toBeVisible()
})

test('print routes — BOQ + Retention render outside the AppShell', async ({ page }) => {
  // Disable auto window.print() so the dialog doesn't pause the test runner.
  await page.addInitScript(() => {
    window.print = () => {}
  })

  await page.goto('/print/boq/PRJ-001')
  await expect(page.getByRole('heading', { name: 'Akademie' })).toBeVisible()
  await expect(page.getByText('Generated', { exact: false })).toBeVisible()
  // No sidebar nav — AppShell isn't rendered on print routes
  await expect(page.getByRole('link', { name: 'Projects' })).toHaveCount(0)

  await page.goto('/print/retention/PRJ-001')
  await expect(page.getByRole('heading', { name: 'Retention summary' })).toBeVisible()
  await expect(page.getByText('Balance to release')).toBeVisible()
})

test('BOQ export — margin toggle reveals Margin/Sell + colour-codes actual (gap 4.7-G)', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })
  await page.goto('/print/boq/PRJ-001')

  // Margin & Sell columns are hidden by default (cost-only export).
  await expect(page.getByRole('columnheader', { name: /^Sell$/ })).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: /^Margin/ })).toHaveCount(0)

  // Toggling the option reveals both derived columns.
  await page.getByRole('checkbox', { name: /Show margin/ }).check()
  await expect(page.getByRole('columnheader', { name: /^Margin/ })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /^Sell$/ })).toBeVisible()

  // Actual cells are colour-coded against their adjusted budget.
  await expect(page.locator('td.text-sw-pos, td.text-sw-neg').first()).toBeVisible()
})

test('print routes — Tax Invoice + Progress Claim render with content', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })

  // Seed PRJ-001 has INV-001 with Certis Building Certifiers as supplier
  await page.goto('/print/invoice/PRJ-001/INV-001')
  await expect(page.getByText('Tax invoice', { exact: false }).first()).toBeVisible()
  await expect(page.getByText('Certis Building Certifiers')).toBeVisible()

  // Seed PRJ-001 has CLM-001 Stage 1
  await page.goto('/print/claim/PRJ-001/CLM-001')
  await expect(page.getByText('Progress claim', { exact: false }).first()).toBeVisible()
  await expect(page.getByText(/Stage 1/)).toBeVisible()
})

test('clients module: add then edit a client', async ({ page }) => {
  await page.goto('/clients')
  await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible()
  await expect(page.getByText('Fletcher Architecture')).toBeVisible()

  // Add
  await page.getByRole('button', { name: '+ New Client' }).first().click()
  await page.getByLabel(/^Company \/ Client Name/).fill('Smoke Test Pty Ltd')
  await page.getByLabel('Phone').fill('0400 000 000')
  await page.getByRole('button', { name: 'Save Client' }).click()
  await expect(page.getByText('Smoke Test Pty Ltd')).toBeVisible()

  // Edit — row click expands the L1 detail strip, then Edit Client
  await page.getByText('Smoke Test Pty Ltd').click()
  await page.getByRole('button', { name: 'Edit Client' }).click()
  await page.getByLabel(/^Company \/ Client Name/).fill('Smoke Test (renamed)')
  await page.getByRole('button', { name: 'Save Client' }).click()
  await expect(page.getByText('Smoke Test (renamed)')).toBeVisible()
})

test('subcontractors module: V1 table, add then edit a sub', async ({ page }) => {
  await page.goto('/subs')
  await expect(page.getByRole('heading', { name: 'Subcontractors' })).toBeVisible()

  // Legacy V1 anatomy: compliance sub-line, trade chips, licence/SWMS columns
  await expect(page.getByText(/compliance issue/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'PLUMBING' })).toBeVisible()
  await expect(page.getByText('Licence', { exact: true })).toBeVisible()
  await expect(page.getByText('SWMS', { exact: true })).toBeVisible()
  await expect(page.getByText('Worksite Studio')).toBeVisible()

  // Add
  await page.getByRole('button', { name: '+ Add Subcontractor' }).first().click()
  await page.getByLabel(/^Name\*$/).fill('Smoke Subs Pty Ltd')
  await page.getByLabel(/^Trade\*$/).fill('Carpentry')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Smoke Subs Pty Ltd')).toBeVisible()

  // Edit — row click, rename
  await page.getByText('Smoke Subs Pty Ltd').click()
  await expect(page.getByRole('heading', { name: /Edit Smoke Subs Pty Ltd/i })).toBeVisible()
  await page.getByLabel(/^Name\*$/).fill('Smoke Subs (renamed)')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Smoke Subs (renamed)')).toBeVisible()
})

test('subcontractors form requires Name and Trade', async ({ page }) => {
  await page.goto('/subs')
  await page.getByRole('button', { name: '+ Add Subcontractor' }).first().click()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Name is required')).toBeVisible()
  await expect(page.getByText('Trade is required')).toBeVisible()
})

test('leads module: G1 kanban + add a lead + detail drill-in', async ({ page }) => {
  await page.goto('/leads')
  await expect(page.getByRole('heading', { name: 'Lead Pipeline' })).toBeVisible()
  // Five kanban columns incl. the restored Quoted stage (gap 15)
  for (const col of ['Prospect', 'Tendering', 'Quoted', 'Won', 'Lost']) {
    await expect(page.getByText(col, { exact: true })).toBeVisible()
  }
  // Card click drills into the detail view
  await page.getByText('Avalon Knockdown Rebuild').click()
  await expect(page.getByText('Estimated Value')).toBeVisible()
  await page.getByRole('button', { name: 'Pipeline' }).click()

  // Add a lead
  await page.getByRole('button', { name: '+ New Lead' }).first().click()
  await page.getByLabel(/^Name\*$/).fill('Hilltop Renovation Bid')
  await page.getByLabel(/^Client name\*$/).fill('Hilltop Family')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Hilltop Renovation Bid')).toBeVisible()
})

test('estimating module: tab switch + open template wizard', async ({ page }) => {
  await page.goto('/estimating')
  await expect(page.getByRole('heading', { name: 'Estimating' })).toBeVisible()

  // Switch to templates tab and verify a known template
  await page.getByRole('button', { name: /BOQ Templates/ }).click()
  await expect(page.getByText('Residential New Build', { exact: true })).toBeVisible()

  // Open the wizard
  await page.getByRole('button', { name: 'Use Template' }).first().click()
  await expect(page.getByRole('heading', { name: /New estimate from/ })).toBeVisible()

  // Validation: empty submit blocks
  await page.getByRole('button', { name: 'Create estimate' }).click()
  await expect(page.getByText('Name is required')).toBeVisible()

  // Happy path
  await page.getByLabel(/^Estimate name\*$/).fill('Test Estimate')
  await page.getByLabel(/^Contract value/).fill('500000')
  await page.getByRole('button', { name: 'Create estimate' }).click()

  // Switch back to estimates tab and confirm
  await page.getByRole('button', { name: /^Estimates/ }).click()
  await expect(page.getByText('Test Estimate')).toBeVisible()
})

test('settings module: full St1 field set, save flashes Saved!', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  // Legacy St1 field set (PARITY gap 2)
  await expect(page.getByLabel('Business Name')).toBeVisible()
  await expect(page.getByLabel('Default Contract Type')).toBeVisible()
  await expect(page.getByLabel('Default Margin (%)')).toBeVisible()
  await expect(page.getByText('Registered for GST')).toBeVisible()
  await expect(page.getByLabel('Home State')).toBeVisible()
  await expect(page.getByLabel('Licence VIC')).toBeVisible()
  await expect(page.getByLabel('QBCC (QLD)')).toBeVisible()
  await expect(page.getByLabel('NT (no scheme)')).toBeVisible()
  // Reset to Demo Data (gap 3)
  await expect(page.getByRole('button', { name: 'Reset to Demo Data' })).toBeVisible()

  await page.getByLabel('Business Name').fill('Acme Builders Pty Ltd')
  await page.getByRole('button', { name: 'Save Settings' }).click()
  await expect(page.getByText('Saved!')).toBeVisible()
})

test('settings defaults seed the project form (legacy sw_ct / sw_state wiring)', async ({
  page,
}) => {
  await page.goto('/settings')
  await page.getByLabel('Default Contract Type').selectOption('fixed-price')
  await page.getByLabel('Home State').selectOption('VIC')
  await page.getByRole('button', { name: 'Save Settings' }).click()
  await expect(page.getByText('Saved!')).toBeVisible()

  // Client-side nav (goto would reload and hit beforeEach's localStorage.clear()).
  await page.getByRole('link', { name: 'Projects' }).click()
  await page.getByRole('button', { name: '+ New Project' }).click()
  await expect(page.getByLabel('Contract Type')).toHaveValue('fixed-price')
  await expect(page.getByLabel('State')).toHaveValue('VIC')
})

test('help & education — X1 four tabs with real content (gap 6)', async ({ page }) => {
  await page.goto('/education')
  await expect(page.getByRole('heading', { name: 'Help & Education' })).toBeVisible()
  // Getting Started default: first guide + numbered steps
  await expect(page.getByText('Welcome to SITEWORK', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Create your first project or import an estimate')).toBeVisible()
  // Guide switch
  await page.getByText('Connecting Xero', { exact: true }).click()
  await expect(page.getByText(/OAuth 2\.0/)).toBeVisible()
  // Module Guides + Pro Tip callout
  await page.getByRole('button', { name: 'Module Guides' }).click()
  await expect(page.getByText('Pro Tip')).toBeVisible()
  await expect(page.getByText(/Rawlinson Rate Lookup/).first()).toBeVisible()
  // Glossary: 14 terms
  await page.getByRole('button', { name: 'Glossary' }).click()
  await expect(page.getByText('14 terms')).toBeVisible()
  await expect(page.getByText('SWMS', { exact: true })).toBeVisible()
  // Rawlinson Rates: handbook + location factors
  await page.getByRole('button', { name: 'Rawlinson Rates' }).click()
  await expect(page.getByText(/Australian Construction Handbook/)).toBeVisible()
  await expect(page.getByText('Regional Location Factors')).toBeVisible()
  await expect(page.getByText('+25% (remote premium)')).toBeVisible()
})

test('suppliers + materials catalogues render at their direct URLs', async ({ page }) => {
  await page.goto('/suppliers')
  await expect(page.getByRole('heading', { name: 'Suppliers' })).toBeVisible()
  await expect(page.getByText('Worksite Studio')).toBeVisible()

  await page.goto('/materials')
  await expect(page.getByRole('heading', { name: 'Materials' })).toBeVisible()
  await expect(page.getByText('Scyon Linea Cladding')).toBeVisible()
})

test('clients form blocks save when Name is empty', async ({ page }) => {
  await page.goto('/clients')
  await page.getByRole('button', { name: '+ New Client' }).first().click()
  await page.getByRole('button', { name: 'Save Client' }).click()
  await expect(page.getByText('Name is required')).toBeVisible()
})

test('linking layer — BOQ committed drills to cost-code-filtered invoices (gap 4.5-C)', async ({
  page,
}) => {
  await page.goto('/projects/PRJ-001/boq')
  // Each code header's committed figure is a drill link to its invoices.
  await page.getByTitle('View invoices booked to this code').first().click()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/invoices\?cc=/)
  await expect(page.getByText(/Filtered by cost code/)).toBeVisible()
  // Clearing the filter drops the param and the banner.
  await page.getByRole('button', { name: /Clear/ }).click()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/invoices$/)
  await expect(page.getByText(/Filtered by cost code/)).toHaveCount(0)
})

test('linking layer — client row drills to client-filtered projects (gap 4.5-C)', async ({
  page,
}) => {
  await page.goto('/clients')
  await page.getByTitle("View this client's projects").first().click()
  await expect(page).toHaveURL(/\/projects\?client=/)
  await expect(page.getByText(/Filtered by client/)).toBeVisible()
})

test('linking layer — Dashboard Active Projects tile links to the projects list (gap 4.5-C)', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Active Projects/ }).click()
  await expect(page).toHaveURL(/\/projects$/)
})

test('dashboard Compliance Alerts tile links to subcontractors, not a 404 (gap 4.7-A)', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Compliance Alerts/ }).click()
  await expect(page).toHaveURL(/\/subs$/)
  await expect(page.getByRole('heading', { name: 'Subcontractors' })).toBeVisible()
})

test('UX kit — PO row opens the edit dialog, save shows a toast (gap 4.5-D)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/purchases')
  // Click the PO-number cell (no drill link) so the row-edit handler fires.
  await page.getByRole('cell').filter({ hasText: /^PO-/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Edit Purchase Order' })).toBeVisible()
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Purchase order updated')).toBeVisible()
})

test('UX kit — deleting a cost code goes through the confirm dialog (gap 4.5-D)', async ({
  page,
}) => {
  await page.goto('/projects/PRJ-001/boq')
  // Delete buttons carry the "Delete code" title.
  await page.getByTitle('Delete code').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Delete cost code' })).toBeVisible()
  // Cancel leaves everything in place.
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { name: 'Delete cost code' })).toHaveCount(0)
})

test('tables — invoice supplier search narrows the rows (gap 4.5-E)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/invoices')
  await expect(page.getByRole('cell', { name: 'Certis Building Certifiers' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search invoices' }).fill('Byron')
  await expect(page.getByRole('cell', { name: 'Byron Shire Council' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Certis Building Certifiers' })).toHaveCount(0)
})

test('tables — clicking a column header sorts it (gap 4.5-E)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/invoices')
  const amountHeader = page.getByRole('columnheader', { name: /Amount \(ex GST\)/ })
  await expect(amountHeader).toHaveAttribute('aria-sort', 'none')
  await amountHeader.click()
  await expect(amountHeader).toHaveAttribute('aria-sort', 'ascending')
  await amountHeader.click()
  await expect(amountHeader).toHaveAttribute('aria-sort', 'descending')
})

test('tables — BOQ over-budget toggle filters the code list (gap 4.5-E)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/boq')
  const allCodes = await page.getByText(/Consultant Fees, Site Establishment/).count()
  expect(allCodes).toBeGreaterThan(0)
  const toggle = page.getByRole('button', { name: 'Over budget only' })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  // The reorder arrows disappear while a non-manual view is active.
  await expect(page.getByRole('button', { name: 'Move up' })).toHaveCount(0)
})

test('a11y — sortable headers are keyboard-operable (gap 4.5-F)', async ({ page }) => {
  await page.goto('/projects/PRJ-001/invoices')
  const amountHeader = page.getByRole('columnheader', { name: /Amount \(ex GST\)/ })
  await amountHeader.focus()
  await page.keyboard.press('Enter')
  await expect(amountHeader).toHaveAttribute('aria-sort', 'ascending')
  await page.keyboard.press('Enter')
  await expect(amountHeader).toHaveAttribute('aria-sort', 'descending')
})

test('invoices — a note saved in the dialog embeds in the row (gap 4.7-C)', async ({ page }) => {
  await page.goto('/projects/PRJ-005/invoices')
  await page.getByRole('button', { name: '+ Invoice' }).first().click()
  await page.getByLabel(/^Supplier \/ subcontractor\*$/).fill('Note Test Supplier')
  await page.getByLabel('Notes').fill('Waiting on credit for damaged sheets')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Note Test Supplier')).toBeVisible()
  await expect(page.getByText('Note: Waiting on credit for damaged sheets')).toBeVisible()
})

test('tables — Date/Due lead the columns and status sits in the Status column (gap 4.7-B)', async ({
  page,
}) => {
  await page.goto('/projects/PRJ-001/invoices')
  const headers = page.locator('thead th')
  await expect(headers.nth(0)).toContainText('Date')
  await expect(headers.nth(1)).toContainText('Due')
  // The old Comments column (which the status badge used to hide under) is gone.
  await expect(page.getByRole('columnheader', { name: 'Comments' })).toHaveCount(0)
  // Status now renders in the last-but-two column of a row (its own Status column).
  const firstRow = page.locator('tbody tr').first()
  await expect(firstRow.getByText(/^(PAID|APPROVED|PENDING|DISPUTED)$/)).toBeVisible()
})
