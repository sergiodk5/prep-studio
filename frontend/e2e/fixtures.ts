import { expect, test as base } from '@playwright/test'

export const test = base.extend<{ resetData: void }>({
  resetData: [
    async ({ request }, use) => {
      await expect(await request.post('/api/testing/reset')).toBeOK()
      await use()
    },
    { auto: true },
  ],
})

export { expect }
