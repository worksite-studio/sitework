import { test, expect } from '@playwright/test'

test('home page renders SITEWORK heading and seed-sanity project list', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SITEWORK' })).toBeVisible()
  await expect(page.getByText('Akademie')).toBeVisible()
  await expect(page.getByText('PRJ-001')).toBeVisible()
})
