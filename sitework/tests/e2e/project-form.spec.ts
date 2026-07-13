import { test, expect } from '@playwright/test'

// Session P1 — the I0-port project form + statutory validation.
// Acceptance mirror of the legacy baseline behaviour on :8766.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.setItem('sw:skipSplash', '1')
  })
})

test('creates a project from + New Project (happy path, NSW)', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: '+ New Project' }).click()
  await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible()

  await page.getByLabel(/^Project Name\*$/).fill('Test Duplex')
  // NSW deposit-cap helper shows for the default state
  await expect(page.getByText(/NSW: max 10% of contract or \$20,000/)).toBeVisible()
  await page.getByRole('button', { name: 'Save Project' }).click()

  await expect(page.getByRole('heading', { name: 'New Project' })).not.toBeVisible()
  await expect(page.getByText('Test Duplex')).toBeVisible()
})

test('blocks save with empty name and red-lines the field', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: '+ New Project' }).click()
  await page.getByRole('button', { name: 'Save Project' }).click()

  await expect(page.getByText('Project name is required')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible()
})

test('VIC s.13: cost-plus under $1m blocks save; renovation exemption unblocks', async ({
  page,
}) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: '+ New Project' }).click()

  await page.getByLabel(/^Project Name\*$/).fill('Melbourne Reno')
  await page.getByLabel('State').selectOption('VIC')
  await page.getByLabel('Estimated Value ($)').fill('500000')

  // Hard-block banner appears live, before any save attempt
  await expect(page.getByRole('alert')).toContainText('VIC cost-plus restriction (DBCA s.13)')

  // Save is refused while blocked
  await page.getByRole('button', { name: 'Save Project' }).click()
  await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible()

  // Ticking the renovation/unknown-cost exemption lifts the block
  await page.getByText(/renovation\/restoration where cost cannot be calculated/).click()
  await expect(page.getByRole('alert')).not.toBeVisible()
  await page.getByRole('button', { name: 'Save Project' }).click()
  await expect(page.getByRole('heading', { name: 'New Project' })).not.toBeVisible()
  await expect(page.getByText('Melbourne Reno')).toBeVisible()
})

test('VIC s.13: raising the estimate to $1m lifts the block', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: '+ New Project' }).click()

  await page.getByLabel(/^Project Name\*$/).fill('Toorak New Build')
  await page.getByLabel('State').selectOption('VIC')
  await page.getByLabel('Estimated Value ($)').fill('999999')
  await expect(page.getByRole('alert')).toBeVisible()

  await page.getByLabel('Estimated Value ($)').fill('1000000')
  await expect(page.getByRole('alert')).not.toBeVisible()
})

test('VIC s.13: fixed-price is never blocked (and hides Estimated Value)', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: '+ New Project' }).click()

  await page.getByLabel(/^Project Name\*$/).fill('Fixed VIC Job')
  await page.getByLabel('State').selectOption('VIC')
  await page.getByLabel('Contract Type').selectOption('fixed-price')

  await expect(page.getByRole('alert')).not.toBeVisible()
  await expect(page.getByLabel('Estimated Value ($)')).not.toBeVisible()

  await page.getByRole('button', { name: 'Save Project' }).click()
  await expect(page.getByText('Fixed VIC Job')).toBeVisible()
})

test('QLD HWS: cost-plus requires the acknowledgement tick', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: '+ New Project' }).click()

  await page.getByLabel(/^Project Name\*$/).fill('Brisbane Extension')
  await page.getByLabel('State').selectOption('QLD')

  await expect(
    page.getByText(/QLD: cost-plus contracts disqualify the owner from QBCC Home Warranty/),
  ).toBeVisible()

  // Save refused until acknowledged
  await page.getByRole('button', { name: 'Save Project' }).click()
  await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible()

  await page.getByText('I acknowledge this consequence on behalf of the owner.').click()
  await page.getByRole('button', { name: 'Save Project' }).click()
  await expect(page.getByRole('heading', { name: 'New Project' })).not.toBeVisible()
  await expect(page.getByText('Brisbane Extension')).toBeVisible()
})

test('edits an existing project from the Overview tab', async ({ page }) => {
  await page.goto('/projects/PRJ-001/overview')
  await page.getByRole('button', { name: 'Edit Project' }).click()
  await expect(page.getByRole('heading', { name: 'Edit Project' })).toBeVisible()

  const name = page.getByLabel(/^Project Name\*$/)
  await expect(name).toHaveValue('Akademie')
  await name.fill('Akademie Stage 2')
  await page.getByRole('button', { name: 'Save Project' }).click()

  await expect(page.getByRole('heading', { name: 'Edit Project' })).not.toBeVisible()
  await expect(page.getByText('Akademie Stage 2').first()).toBeVisible()
})
