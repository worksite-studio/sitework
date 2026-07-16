import { test, expect } from '@playwright/test'

// Splash: shows on every full page load, entered only by clicking the
// SITEWORK wordmark, never re-shown by client-side navigation (including
// returning from a print view). (No skip flag here — this spec exercises the
// real entry flow.)

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

const enter = 'Enter SITEWORK'

test('splash gates entry, wordmark enters, client-side nav does not re-trigger', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: enter })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /Project Health/i })).not.toBeVisible()

  await page.getByRole('button', { name: enter }).click()
  await expect(page.getByRole('button', { name: enter })).not.toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /Project Health/i })).toBeVisible()

  // Client-side navigation keeps the app entered. Exact match: the "Active
  // Projects" dashboard tile is also a link (4.5-C) and otherwise collides.
  await page.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('button', { name: enter })).not.toBeVisible()
})

test('the rest of the splash is inert — only the wordmark enters', async ({ page }) => {
  await page.goto('/')
  // Click well away from the wordmark button; the splash should stay.
  await page.mouse.click(20, 20)
  await expect(page.getByRole('button', { name: enter })).toBeVisible()
})

test('deep links are gated too — splash covers any full load', async ({ page }) => {
  await page.goto('/projects/PRJ-001/overview')
  await expect(page.getByRole('button', { name: enter })).toBeVisible()
  await page.getByRole('button', { name: enter }).click()
  await expect(page.getByRole('heading', { name: 'Akademie' })).toBeVisible()
})

test('returning from a print view does not re-trigger the splash (gap 4.7-A)', async ({ page }) => {
  // A print route lives outside AppShell; opening one then going Back used to
  // remount the shell and re-show the splash.
  await page.goto('/print/boq/PRJ-001')
  await expect(page.getByRole('button', { name: enter })).not.toBeVisible()
  await page.getByRole('link', { name: '← Back' }).click()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/boq$/)
  await expect(page.getByRole('button', { name: enter })).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'BOQ & Budget' })).toBeVisible()
})
