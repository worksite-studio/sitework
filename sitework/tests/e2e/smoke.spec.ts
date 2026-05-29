import { test, expect } from '@playwright/test'

test('shell renders with sidebar nav', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})

test('navigates to Projects list and into a project tab', async ({ page }) => {
  await page.goto('/')

  // Sidebar → Projects
  await page.getByRole('link', { name: 'Projects' }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByText('Akademie')).toBeVisible()

  // Into the first project → overview tab via index redirect
  await page.getByRole('link', { name: /Akademie/ }).click()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/overview$/)

  // Tab bar present, switch to BOQ
  await page.getByRole('link', { name: 'BOQ & Budget' }).click()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/boq$/)

  // Back button returns to overview (URL routing works)
  await page.goBack()
  await expect(page).toHaveURL(/\/projects\/PRJ-001\/overview$/)
})

test('deep-link into a project tab works', async ({ page }) => {
  await page.goto('/projects/PRJ-001/claims')
  await expect(page.getByRole('heading', { name: 'Progress Claims' })).toBeVisible()
})
