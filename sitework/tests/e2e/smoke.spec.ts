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

test('clients form blocks save when Name is empty', async ({ page }) => {
  await page.goto('/clients')
  await page.getByRole('button', { name: '+ New Client' }).first().click()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Name is required')).toBeVisible()
})
