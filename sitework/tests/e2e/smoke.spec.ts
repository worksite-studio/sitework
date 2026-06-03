import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Start each spec from a clean slate so the persisted dispatch from a
  // previous spec doesn't bleed in.
  await page.addInitScript(() => localStorage.clear())
})

test('dashboard renders KPI tiles + Project Health + Pipeline', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Active Projects', { exact: true })).toBeVisible()
  await expect(page.getByText('Outstanding Invoices', { exact: true })).toBeVisible()
  await expect(page.getByText('Portfolio Margin', { exact: true })).toBeVisible()
  await expect(page.getByText('Compliance Alerts', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /Project Health/i })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /Pipeline/i })).toBeVisible()

  // Click a Project Health row navigates to the project overview
  await page
    .getByRole('link', { name: /Akademie/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/overview$/)
})

test('navigates to Projects list and into a project tab', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Projects' }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByText('Akademie')).toBeVisible()

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

test('clients module: add then edit a client', async ({ page }) => {
  await page.goto('/clients')
  await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible()
  await expect(page.getByText('Fletcher Architecture')).toBeVisible()

  // Add
  await page.getByRole('button', { name: '+ New Client' }).first().click()
  await page.getByLabel(/^Name/).fill('Smoke Test Pty Ltd')
  await page.getByLabel('Phone').fill('0400 000 000')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Smoke Test Pty Ltd')).toBeVisible()

  // Edit — click the row
  await page.getByText('Smoke Test Pty Ltd').click()
  await page.getByLabel(/^Name/).fill('Smoke Test (renamed)')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Smoke Test (renamed)')).toBeVisible()
})

test('subcontractors module: list shows cert chips, add then edit a sub', async ({ page }) => {
  await page.goto('/subs')
  await expect(page.getByRole('heading', { name: 'Subcontractors' })).toBeVisible()

  // Seed includes Worksite Studio with a cert
  await expect(page.getByText('Worksite Studio')).toBeVisible()

  // Add
  await page.getByRole('button', { name: '+ New Subcontractor' }).first().click()
  await page.getByLabel(/^Name\*$/).fill('Smoke Subs Pty Ltd')
  await page.getByLabel(/^Trade\*$/).fill('Carpentry')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Smoke Subs Pty Ltd')).toBeVisible()

  // Edit — row click, rename
  await page.getByRole('button', { name: /Smoke Subs Pty Ltd/ }).click()
  await expect(page.getByRole('heading', { name: /Edit Smoke Subs Pty Ltd/i })).toBeVisible()
  await page.getByLabel(/^Name\*$/).fill('Smoke Subs (renamed)')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Smoke Subs (renamed)')).toBeVisible()
})

test('subcontractors form requires Name and Trade', async ({ page }) => {
  await page.goto('/subs')
  await page.getByRole('button', { name: '+ New Subcontractor' }).first().click()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Name is required')).toBeVisible()
  await expect(page.getByText('Trade is required')).toBeVisible()
})

test('leads module: filter chips + add a lead', async ({ page }) => {
  await page.goto('/leads')
  await expect(page.getByRole('heading', { name: 'Leads / Tender' })).toBeVisible()
  // Filter chips
  await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Prospect', exact: true })).toBeVisible()

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
  await expect(page.getByRole('heading', { name: 'Residential New Build' })).toBeVisible()

  // Open the wizard
  await page.getByRole('button', { name: 'Use template' }).first().click()
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

test('settings module: edit + save flips the dirty/saved state', async ({ page }) => {
  // Persistence (localStorage write-through) is covered by persistence unit
  // tests; here we'd hit beforeEach's localStorage.clear() on reload, so we
  // assert the in-page dirty → saved transition instead.
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled()

  await page.getByLabel('Business name').fill('Acme Builders Pty Ltd')
  await expect(page.getByText('Unsaved changes.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Saved.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled()
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
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Name is required')).toBeVisible()
})
