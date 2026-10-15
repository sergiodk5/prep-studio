import { expect, test } from '@playwright/test'

test('opens a course and shows its lessons in order', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Technical screen' }).click()

  await expect(page.getByRole('heading', { name: 'Technical screen' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Lessons' }).getByRole('listitem')).toContainText([
    'Vue state and stores',
    'Rendering performance',
    'MongoDB data modelling',
    'PHP and Laravel',
  ])
})

test('shows a message for a course that does not exist', async ({ page }) => {
  await page.goto('/courses/missing')

  await expect(page.getByRole('alert')).toHaveText(
    'This course does not exist. It may have been deleted.',
  )
})

test('adds, renames and deletes a lesson', async ({ page }) => {
  await page.goto('/courses/seed-pm')
  await expect(page.getByText('No lessons yet.')).toBeVisible()

  await page.getByLabel('New lesson title').fill('Stakeholders')
  await page.getByRole('button', { name: 'Add lesson' }).click()
  await expect(page.getByLabel('New lesson title')).toHaveValue('')

  await page.getByRole('button', { name: 'Rename Stakeholders' }).click()
  await page.getByLabel('Lesson title', { exact: true }).fill('Working with stakeholders')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: 'Rename Working with stakeholders' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete Working with stakeholders' }).click()
  await page.getByRole('button', { name: 'Delete lesson' }).click()
  await expect(page.getByText('No lessons yet.')).toBeVisible()
})
