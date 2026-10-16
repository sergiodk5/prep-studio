import { expect, test } from './fixtures'

test('shows a conflict when another tab renamed the course first', async ({ context }) => {
  const tabA = await context.newPage()
  const tabB = await context.newPage()
  await tabA.goto('/')
  await tabB.goto('/')

  await tabA.getByRole('button', { name: 'Rename Technical screen' }).click()
  await tabA.getByLabel('Course title').fill('From tab A')
  await tabA.getByRole('button', { name: 'Save' }).click()
  await expect(tabA.getByRole('button', { name: 'Rename From tab A' })).toBeVisible()

  await tabB.getByRole('button', { name: 'Rename Technical screen' }).click()
  await tabB.getByLabel('Course title').fill('From tab B')
  await tabB.getByRole('button', { name: 'Save' }).click()
  await expect(tabB.getByLabel('Course title')).toHaveAccessibleDescription(
    'Someone else renamed this course to "From tab A". Save again to keep your title.',
  )

  await tabB.getByRole('button', { name: 'Save' }).click()
  await expect(tabB.getByRole('button', { name: 'Rename From tab B' })).toBeVisible()
})

test('keeps the course on Keep and deletes it on confirm', async ({ page }) => {
  const deleteButton = page.getByRole('button', { name: 'Delete Technical screen' })
  await page.goto('/')

  await deleteButton.click()
  await expect(page.getByRole('button', { name: 'Keep' })).toBeFocused()
  await page.getByRole('button', { name: 'Keep' }).click()
  await expect(page.getByRole('button', { name: 'Delete course' })).toHaveCount(0)
  await expect(deleteButton).toBeVisible()

  await deleteButton.click()
  await page.getByRole('button', { name: 'Delete course' }).click()
  await expect(deleteButton).toHaveCount(0)
})

test('deletes quietly when another tab already deleted the course', async ({ context }) => {
  const tabA = await context.newPage()
  const tabB = await context.newPage()
  await tabA.goto('/')
  await tabB.goto('/')

  await tabA.getByRole('button', { name: 'Delete Technical screen' }).click()
  await tabA.getByRole('button', { name: 'Delete course' }).click()
  await expect(tabA.getByRole('button', { name: 'Delete Technical screen' })).toHaveCount(0)

  await tabB.getByRole('button', { name: 'Delete Technical screen' }).click()
  await tabB.getByRole('button', { name: 'Delete course' }).click()
  await expect(tabB.getByRole('button', { name: 'Delete Technical screen' })).toHaveCount(0)
  await expect(tabB.getByText('Course not found')).toHaveCount(0)
})
