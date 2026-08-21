import { expect, test } from '@playwright/test'

import { installMockApi } from './mock-api'

test('unreleased Models and About routes stay outside the public surface', async ({ page }) => {
  await installMockApi(page)
  for (const path of ['/en/models', '/en/about']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  }
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
  await page.getByRole('menuitemradio', { name: '日本語' }).click()
  await expect(page).toHaveURL(/\/ja\/docs#docs-first-request$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
})

test('public product links preserve their intended workspace through sign-in', async ({ page }) => {
  await installMockApi(page, { anonymous: true })
  const destinations = [
    ['Playground', '/en/console/playground'],
    ['Image studio', '/en/console/studio'],
  ] as const

  for (const [label, destination] of destinations) {
    await page.goto('/en/')
    await page.locator('.r3-public-footer').getByRole('button', { name: label }).click()
    await expect(page).toHaveURL(/\/en\/auth\/sign-in/)
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(destination)
  }
})

test('localized public metadata and the 404 surface follow the active locale', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/fr/status')

  await expect(page).toHaveTitle('État du service | Partokens')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Consultez la disponibilité actuelle et les informations de déploiement de l’API Partokens.')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${new URL(page.url()).origin}/fr/status`)
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(8)

  await page.goto('/ja/auth/sign-in')
  await expect(page).toHaveTitle('ログイン | Partokens')
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', 'Partokens model access, usage, and account console')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${new URL(page.url()).origin}/ja/auth/sign-in`)

  await page.goto('/fr/not-published')
  await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
})

test('legal documents keep structured navigation usable on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await installMockApi(page)
  await page.goto('/ru/legal/user-agreement')

  await expect(page.getByRole('heading', { name: 'Пользовательское соглашение', level: 1 })).toBeVisible()
  await expect(page.getByText('Требуется проверка владельца')).toBeVisible()
  await expect(page.locator('.r3-legal-section-index a')).toHaveCount(3)
  await page.locator('.r3-legal-section-index a').first().click()
  await expect(page).toHaveURL(/#legal-user-agreement-section-1$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
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
