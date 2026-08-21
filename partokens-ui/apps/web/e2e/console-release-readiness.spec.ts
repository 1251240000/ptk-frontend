import { expect, test } from '@playwright/test'

import { locales, resources, type AppLocale } from '@partokens/i18n'

import { installMockApi, primeUserSession } from './mock-api'

function translated(locale: AppLocale, key: string) {
  return (resources[locale].translation as Record<string, string>)[key]
}

const canonicalRoutes = [
  ['overview', 'Overview', 'Account readiness, usage, and the next useful action in one view.'],
  ['analytics', 'Analytics', 'Inspect usage trends, model share, cost, and request routes.'],
  ['keys', 'API keys', 'Create scoped credentials and control access to the Partokens API.'],
  ['usage-logs', 'Usage logs', 'Inspect model calls, account events, cost, and request latency.'],
] as const

for (const locale of locales) {
  test(`${locale} renders localized copy on every canonical Console page`, async ({ page }) => {
    await primeUserSession(page)
    await installMockApi(page)

    for (const [route, heading, description] of canonicalRoutes) {
      await page.goto(`/${locale}/console/${route}`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: translated(locale, heading), exact: true })).toBeVisible()
      await expect(page.getByText(translated(locale, description), { exact: true })).toBeVisible()
      await expect(page.getByRole('main', { name: translated(locale, 'Console content') })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      if (locale !== 'en') await expect(page.getByText(description, { exact: true })).toHaveCount(0)
    }
  })
}

test('deep links and browser history restore locale, route, and search', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/ja/console/overview?r59=history')
  await expect(page.getByRole('heading', { name: translated('ja', 'Overview') })).toBeVisible()

  await page.getByRole('link', { name: translated('ja', 'Analytics') }).first().click()
  await expect(page).toHaveURL(/\/ja\/console\/analytics$/)
  await page.getByRole('link', { name: translated('ja', 'API keys') }).first().click()
  await expect(page).toHaveURL(/\/ja\/console\/keys$/)

  await page.goBack()
  await expect(page).toHaveURL(/\/ja\/console\/analytics$/)
  await expect(page.getByRole('heading', { name: translated('ja', 'Analytics'), exact: true })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL('/ja/console/overview?r59=history')
  await expect(page.getByRole('heading', { name: translated('ja', 'Overview'), exact: true })).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL(/\/ja\/console\/analytics$/)
})

test('a delayed API key search cannot overwrite the latest filter result', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  let oldRequests = 0
  let newRequests = 0
  await page.route('**/api/token/search**', async (route) => {
    const keyword = new URL(route.request().url()).searchParams.get('keyword')
    if (keyword !== 'old' && keyword !== 'new') return route.fallback()
    if (keyword === 'old') oldRequests += 1
    else newRequests += 1
    await new Promise((resolve) => setTimeout(resolve, keyword === 'old' ? 800 : 50))
    const label = keyword === 'old' ? 'Old delayed key' : 'New current key'
    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: '',
          data: { items: [{ id: keyword === 'old' ? 81 : 82, name: label, key: 'R59**********TEST', status: 1 }], total: 1, page: 1, page_size: 100 },
        }),
      })
    } catch {
      // The expected abort closes the delayed route before it can fulfill.
    }
  })

  await page.goto('/en/console/keys')
  const search = page.getByRole('textbox', { name: 'Search API keys' })
  await search.fill('old')
  await expect.poll(() => oldRequests).toBe(1)
  await search.fill('new')
  await expect.poll(() => newRequests).toBe(1)
  await expect(page.getByText('New current key', { exact: true }).first()).toBeVisible()
  await page.waitForTimeout(900)
  await expect(page.getByText('Old delayed key', { exact: true })).toHaveCount(0)
})

test('an API key mutation performs one list invalidation and no settled duplicate', async ({ page }) => {
  const requests: string[] = []
  await primeUserSession(page)
  await installMockApi(page, { onRequest: (request) => requests.push(`${request.method()} ${new URL(request.url()).pathname}`) })
  await page.goto('/en/console/keys')
  await expect(page.getByText('Studio fixture', { exact: true }).first()).toBeVisible()
  const before = requests.filter((request) => request === 'GET /api/token/').length

  await page.getByRole('button', { name: 'Actions Studio fixture' }).click()
  await page.getByRole('menuitem', { name: 'Disable' }).click()
  await page.getByRole('button', { name: 'Disable key' }).click()
  await expect(page.getByText('API key disabled.', { exact: true })).toBeVisible()
  await expect.poll(() => requests.filter((request) => request === 'GET /api/token/').length).toBe(before + 1)
})

test('offline refresh keeps cached data visible and recovers when connectivity returns', async ({ context, page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  let offline = false
  await page.route('**/api/**', async (route) => {
    if (offline) await route.abort('internetdisconnected')
    else await route.fallback()
  })
  await page.goto('/en/console/overview')
  await expect(page.getByText('Studio fixture', { exact: true }).first()).toBeVisible()

  offline = true
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByText('Overview refresh failed', { exact: true })).toBeVisible()
  await expect(page.getByText('Studio fixture', { exact: true }).first()).toBeVisible()

  offline = false
  await context.setOffline(false)
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByText('Overview refreshed', { exact: true })).toBeVisible()
})

test('lazy route failure retry preserves locale and search then restores main focus', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  let failedChunk = false
  let markChunkRequested: () => void = () => undefined
  let releaseChunk: () => void = () => undefined
  const chunkRequested = new Promise<void>((resolve) => { markChunkRequested = resolve })
  const chunkHeld = new Promise<void>((resolve) => { releaseChunk = resolve })
  await page.route('**/*', async (route) => {
    const url = route.request().url()
    if (!failedChunk && url.includes('console-analytics') && /\.js(?:\?|$)/.test(url)) {
      failedChunk = true
      markChunkRequested()
      await chunkHeld
      await route.abort('failed')
      return
    }
    await route.fallback()
  })

  await page.goto('/fr/console/analytics?r59=lazy-retry', { waitUntil: 'domcontentloaded' })
  await chunkRequested
  await expect(page.getByRole('status', { name: translated('fr', 'Loading Console page') })).toBeVisible()
  releaseChunk()
  await expect(page.getByRole('heading', { name: translated('fr', 'Console page could not be loaded') })).toBeVisible()
  expect(failedChunk).toBe(true)
  await page.getByRole('button', { name: translated('fr', 'Try again') }).click()

  await expect(page).toHaveURL('/fr/console/analytics?r59=lazy-retry')
  await expect(page.getByRole('heading', { name: translated('fr', 'Analytics'), exact: true })).toBeVisible()
  await expect(page.getByRole('main', { name: translated('fr', 'Console content') })).toBeFocused()
})

test('reduced motion collapses Console animations to a single near-zero frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/overview')
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()

  const motion = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.className = 'animate-spin'
    document.body.append(probe)
    const style = window.getComputedStyle(probe)
    const result = { duration: style.animationDuration, iterations: style.animationIterationCount }
    probe.remove()
    return result
  })
  expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(0.00001)
  expect(motion.iterations).toBe('1')
})
