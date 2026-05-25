import { test, expect } from '@playwright/test'

test('home page renders SITEWORK heading and HMR-verify button', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SITEWORK' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Verify HMR' })).toBeVisible()
})
