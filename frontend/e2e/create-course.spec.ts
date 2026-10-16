import { expect, test } from './fixtures'

test('creates a course from the new course page', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'New course' }).click()
  await expect(page).toHaveURL('/courses/new')

  await page.getByLabel('Title').fill('  System design round  ')
  await page.getByLabel('Track').selectOption('tech-lead')
  await page.getByRole('button', { name: 'Create course' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('listitem').filter({ hasText: 'System design round' })).toBeVisible()
})

test('shows field errors and stays on the page when the form is empty', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'New course' }).click()
  await expect(page).toHaveURL('/courses/new')

  await page.getByRole('button', { name: 'Create course' }).click()

  await expect(page).toHaveURL('/courses/new')
  await expect(page.getByLabel('Title')).toHaveAccessibleDescription('Title is required')
  await expect(page.getByLabel('Track')).toHaveAccessibleDescription('Choose a track')
})
