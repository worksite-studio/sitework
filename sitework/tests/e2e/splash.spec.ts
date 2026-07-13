import { test, expect } from '@playwright/test'

// Splash — port of legacy `Lp`/`Ap`: shows on every full page load,
// dismissed by a click, never re-shown by client-side navigation.
// (No skip flag here — this spec exercises the real entry flow.)

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('splash gates entry, click enters, client-side nav does not re-trigger', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Tap anywhere to enter')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /Project Health/i })).not.toBeVisible()

  await page.getByText('Tap anywhere to enter').click()
  await expect(page.getByText('Tap anywhere to enter')).not.toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /Project Health/i })).toBeVisible()

  // Client-side navigation keeps the app entered
  await page.getByRole('link', { name: 'Projects' }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByText('Tap anywhere to enter')).not.toBeVisible()
})

test('deep links are gated too — splash covers any full load', async ({ page }) => {
  await page.goto('/projects/PRJ-001/overview')
  await expect(page.getByText('Tap anywhere to enter')).toBeVisible()
  await page.getByText('Tap anywhere to enter').click()
  await expect(page.getByRole('heading', { name: 'Akademie' })).toBeVisible()
})
