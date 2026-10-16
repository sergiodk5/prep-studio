import { expect, test } from './fixtures'

test('edits a lesson and keeps the changes after a reload', async ({ page }) => {
  await page.goto('/courses/seed-technical')
  await page.getByRole('link', { name: 'Vue state and stores' }).click()

  await page.getByLabel('Title', { exact: true }).fill('Vue state and Pinia stores')
  await page.getByLabel('Notes (Markdown)').fill('- Stores by domain\n- Plain refs')
  await expect(page.getByRole('status')).toHaveText('Unsaved changes')
  await page.getByRole('button', { name: 'Save now' }).click()
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
  await tabA.getByRole('button', { name: 'Save now' }).click()
  await expect(tabA.getByRole('status')).toHaveText('All changes saved')

  await tabB.getByLabel('Notes (Markdown)').fill('From tab B')
  await tabB.getByRole('button', { name: 'Save now' }).click()
  await expect(tabB.getByRole('alert')).toHaveText(
    'Someone else saved this lesson first. Autosave is paused. Save again to keep your version.',
  )

  await tabB.getByRole('button', { name: 'Save now' }).click()
  await expect(tabB.getByRole('status')).toHaveText('All changes saved')
})

test('autosaves after the user stops typing', async ({ page }) => {
  await page.goto('/lessons/seed-technical-lesson-2')

  await page.getByLabel('Notes (Markdown)').fill('Measure before you optimise')
  await expect(page.getByRole('status')).toHaveText('Unsaved changes')
  await expect(page.getByRole('status')).toHaveText('All changes saved')

  await page.reload()
  await expect(page.getByLabel('Notes (Markdown)')).toHaveValue('Measure before you optimise')
})

test('saves right away when leaving before autosave runs', async ({ page }) => {
  await page.goto('/lessons/seed-technical-lesson-3')

  await page.getByLabel('Notes (Markdown)').fill('Embed what you read together')
  await page.getByRole('link', { name: 'Back to course' }).click()
  await expect(page.getByRole('heading', { name: 'Technical screen' })).toBeVisible()

  await page.getByRole('link', { name: 'MongoDB data modelling' }).click()
  await expect(page.getByLabel('Notes (Markdown)')).toHaveValue('Embed what you read together')
})

test('asks before leaving a lesson that cannot be saved', async ({ page }) => {
  await page.goto('/lessons/seed-technical-lesson-3')
  await page.getByLabel('Title', { exact: true }).fill('')

  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('link', { name: 'Back to course' }).click()
  await expect(page.getByLabel('Title', { exact: true })).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('link', { name: 'Back to course' }).click()
  await expect(page.getByRole('heading', { name: 'Technical screen' })).toBeVisible()
})

test('warns before closing the tab with unsaved changes', async ({ page }) => {
  await page.goto('/lessons/seed-technical-lesson-3')
  await page.getByLabel('Title', { exact: true }).fill('')

  const dialog = page.waitForEvent('dialog')
  await page.close({ runBeforeUnload: true })

  expect((await dialog).type()).toBe('beforeunload')
})
