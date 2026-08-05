import { expect, test } from '@playwright/test'

import { installMockApi } from './mock-api'

test('anonymous models keep the account gate and never request pricing', async ({ page }) => {
  const pricingRequests: string[] = []
  await installMockApi(page, {
    anonymous: true,
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/pricing') pricingRequests.push(request.url())
    },
  })

  await page.goto('/en/models')
  await expect(page.getByRole('heading', { name: 'Sign in to view model pricing' })).toBeVisible()
  expect(pricingRequests).toHaveLength(0)
})

test('authenticated models render validated fixture rows without fabricated fields', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/en/models')

  await expect(page.locator('.r3-model-row')).toHaveCount(2)
  await expect(page.getByRole('heading', { name: 'gpt-4.1-mini' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'gpt-image-1' })).toBeVisible()
  await expect(page.getByText('drop-me')).toHaveCount(0)
})

test('service status exposes unavailable state and recovers through retry', async ({ page }) => {
  await installMockApi(page, {
    statusResponses: [
      { status: 503, body: { success: false, message: 'maintenance' } },
      { body: { success: true, data: { version: 'fixture-recovered', start_time: 1_720_000_000 } } },
    ],
  })

  await page.goto('/en/status')
  await expect(page.getByRole('heading', { name: 'Service status cannot be confirmed' })).toBeVisible()
  await page.getByRole('button', { name: 'Check again' }).click()
  await expect(page.getByRole('heading', { name: 'API service is operational' })).toBeVisible()
  await expect(page.getByText('fixture-recovered')).toBeVisible()
})

test('notices persist their local content-version hash and clear the unread marker', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/en/')
  await expect(page.locator('.r3-notice-dot')).toHaveCount(1)
  await page.getByRole('button', { name: 'Notices' }).first().click()
  await expect(page).toHaveURL(/\/en\/notices$/)
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('partokens:public-notice-seen:v1'))).not.toBeNull()
  await page.getByRole('button', { name: 'Partokens' }).click()
  await expect(page).toHaveURL(/\/en$/)
  await expect(page.locator('.r3-notice-dot')).toHaveCount(0)
})

test('locale switching preserves the docs route and hash', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/en/docs#docs-first-request')
  await expect(page).toHaveURL(/\/en\/docs#docs-first-request$/)
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('menuitem', { name: '日本語' }).click()
  await expect(page).toHaveURL(/\/ja\/docs#docs-first-request$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
})

test('public shell traps mobile focus, restores the trigger, and has no page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installMockApi(page)
  await page.goto('/en/')

  const menu = page.getByRole('button', { name: 'Menu' })
  await menu.focus()
  await menu.click()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
  await expect(menu).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  expect(await page.locator('.r3-home-started').boundingBox()).not.toBeNull()
})
