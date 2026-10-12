import { expect, test } from '@playwright/test'

test('shows the app header on the home page', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Prep Studio' })).toBeVisible()
})
