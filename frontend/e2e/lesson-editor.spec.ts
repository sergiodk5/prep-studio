import { expect, test } from '@playwright/test'

test('edits a lesson and keeps the changes after a reload', async ({ page }) => {
  await page.goto('/courses/seed-technical')
  await page.getByRole('link', { name: 'Vue state and stores' }).click()

  await page.getByLabel('Title', { exact: true }).fill('Vue state and Pinia stores')
  await page.getByLabel('Notes (Markdown)').fill('- Stores by domain\n- Plain refs')
  await expect(page.getByRole('status')).toHaveText('Unsaved changes')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('status')).toHaveText('All changes saved')

  await page.reload()
  await expect(page.getByLabel('Notes (Markdown)')).toHaveValue('- Stores by domain\n- Plain refs')
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Vue state and Pinia stores')

  await page.getByRole('link', { name: 'Back to course' }).click()
  await expect(page.getByRole('link', { name: 'Vue state and Pinia stores' })).toBeVisible()
})

test('shows a conflict when another tab saved the lesson first', async ({ context }) => {
  const tabA = await context.newPage()
  const tabB = await context.newPage()
  await tabA.goto('/lessons/seed-technical-lesson-1')
  await tabB.goto('/lessons/seed-technical-lesson-1')

  await tabA.getByLabel('Notes (Markdown)').fill('From tab A')
  await tabA.getByRole('button', { name: 'Save' }).click()
  await expect(tabA.getByRole('status')).toHaveText('All changes saved')

  await tabB.getByLabel('Notes (Markdown)').fill('From tab B')
  await tabB.getByRole('button', { name: 'Save' }).click()
  await expect(tabB.getByRole('alert')).toHaveText(
    'Someone else saved this lesson first. Save again to keep your version.',
  )

  await tabB.getByRole('button', { name: 'Save' }).click()
  await expect(tabB.getByRole('status')).toHaveText('All changes saved')
})
