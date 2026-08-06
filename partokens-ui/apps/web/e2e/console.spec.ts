import { expect, test } from '@playwright/test'

import { installMockApi, primeUserSession } from './mock-api'

const evidenceScreenshots = process.env.PARTOKENS_E2E_EVIDENCE_DIR || '../../dogfood-output/r60-console-staging-validation/screenshots'

test('the canonical console keeps the existing authentication boundary and return path', async ({ page }) => {
  await installMockApi(page)
  await page.route('**/api/user/auth/refresh', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Unauthorized', data: null }),
    })
  })
  await page.goto('/en/console/overview')

  await expect.poll(() => new URL(page.url()).pathname).toBe('/en/auth/sign-in')
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/en/console/overview')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('the canonical console keeps administrators on the native management entry', async ({ page }) => {
  await installMockApi(page, { role: 10 })
  await page.goto('/en/console/overview')

  await expect.poll(() => new URL(page.url()).pathname).toBe('/channels')
})

test('compatibility entries redirect to locale-preserving canonical routes and keep search', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)

  const routes = [
    ['/en/console-foundation', '/en/console/overview'],
    ['/fr/console-foundation/overview', '/fr/console/overview'],
    ['/en/console-foundation/analytics', '/en/console/analytics'],
    ['/en/console-foundation/keys', '/en/console/keys'],
    ['/en/console-foundation/logs', '/en/console/usage-logs'],
  ] as const

  for (const [legacy, canonical] of routes) {
    await page.goto(`${legacy}?compat=r56`)
    await expect.poll(() => new URL(page.url()).pathname).toBe(canonical)
    expect(new URL(page.url()).searchParams.get('compat')).toBe('r56')
    await expect(page.locator('[data-console-root]')).toHaveCount(1)
  }
})

test('canonical leaf routes retain locale and search across a full refresh', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)

  const routes = [
    ['/fr/console/overview', 'fr'],
    ['/ja/console/analytics', 'ja'],
    ['/zh-TW/console/keys', 'zh-TW'],
    ['/vi/console/usage-logs', 'vi'],
  ] as const

  for (const [path, locale] of routes) {
    const marker = path.split('/').at(-1) || 'overview'
    await page.goto(`${path}?r58=${marker}`)
    await expect(page.locator('[data-console-root]')).toHaveCount(1)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.locator('a[aria-current="page"]')).toHaveAttribute('href', path)
    expect(new URL(page.url()).searchParams.get('r58')).toBe(marker)

    await page.reload()
    await expect(page.locator('[data-console-root]')).toHaveCount(1)
    await expect(page.locator('a[aria-current="page"]')).toHaveAttribute('href', path)
    expect(new URL(page.url()).pathname).toBe(path)
    expect(new URL(page.url()).searchParams.get('r58')).toBe(marker)
  }
})

test('the desktop shell uses the real session, theme store, and keyboard sidebar control', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console')
  await page.waitForURL('**/en/console/overview')

  await expect(page.locator('.top-nav')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
  await expect(page.getByText('Fixture User', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('link', { name: 'Analytics' })).toHaveAttribute('href', '/en/console/analytics')
  await expect(page.getByRole('link', { name: 'API keys' })).toHaveAttribute('href', '/en/console/keys')
  await expect(page.getByRole('link', { name: 'Usage logs' })).toHaveAttribute('href', '/en/console/usage-logs')

  const desktopSidebar = page.locator('[data-slot="sidebar"][data-state]')
  await expect(desktopSidebar).toHaveAttribute('data-state', 'expanded')
  await page.keyboard.press('Control+b')
  await expect(desktopSidebar).toHaveAttribute('data-state', 'collapsed')
  await page.keyboard.press('Control+b')
  await expect(desktopSidebar).toHaveAttribute('data-state', 'expanded')
  expect(await page.evaluate(() => document.cookie)).not.toContain('sidebar_state=')

  await page.screenshot({ path: `${evidenceScreenshots}/canonical-console-1440.png` })

  await page.getByRole('button', { name: 'Change theme' }).click()
  await page.getByRole('menuitemradio', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('link', { name: 'Analytics' }).click()
  await page.waitForURL('**/en/console/analytics')
  await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Analytics' })).toHaveAttribute('aria-current', 'page')

  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})

test('the mobile sidebar closes by Escape and navigation, then restores trigger focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/overview')

  const trigger = page.locator('[data-console-sidebar-trigger]')
  await trigger.focus()
  await page.keyboard.press('Enter')
  const mobileSidebar = page.getByRole('dialog', { name: 'Sidebar' })
  await expect(mobileSidebar).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(mobileSidebar).toHaveCount(0)
  await expect(trigger).toBeFocused({ timeout: 1_000 })

  await page.keyboard.press('Control+b')
  await expect(mobileSidebar).toBeVisible()
  await page.screenshot({ path: `${evidenceScreenshots}/canonical-console-navigation-390.png` })
  await page.getByRole('link', { name: 'Overview' }).click()
  await expect(mobileSidebar).toHaveCount(0)
  await expect(trigger).toBeFocused({ timeout: 1_000 })
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
  expect(await page.evaluate(() => document.cookie)).not.toContain('sidebar_state=')

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalOverflow).toBe(false)
})

test('the 320px Console shell exposes named controls in keyboard order without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/overview?focus=r58')

  const trigger = page.locator('[data-console-sidebar-trigger]')
  await expect(trigger).toHaveAccessibleName(/sidebar/i)
  await expect(page.getByRole('button', { name: 'Change theme' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
  await trigger.focus()
  await page.keyboard.press('Enter')

  const sidebar = page.getByRole('dialog', { name: 'Sidebar' })
  await expect(sidebar).toBeVisible()
  const labels = await sidebar.locator('button:not([disabled]), a[href]').evaluateAll((elements) => elements.map((element) =>
    element.getAttribute('aria-label') || element.textContent?.replace(/\s+/g, ' ').trim() || '',
  ))
  const overview = labels.findIndex((label) => label === 'Overview')
  const analytics = labels.findIndex((label) => label === 'Analytics')
  const keys = labels.findIndex((label) => label === 'API keys')
  const logs = labels.findIndex((label) => label === 'Usage logs')
  expect(overview).toBeGreaterThanOrEqual(0)
  expect(analytics).toBeGreaterThan(overview)
  expect(keys).toBeGreaterThan(analytics)
  expect(logs).toBeGreaterThan(keys)

  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  const recentUsageNote = page.getByRole('region', { name: 'Account usage summary' }).getByText('Last 30 days', { exact: true })
  await expect(recentUsageNote).toBeVisible()
  expect(await recentUsageNote.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(new URL(page.url()).searchParams.get('focus')).toBe('r58')
})

test('public, authentication, canonical console, and compatibility routes stay free of browser errors', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await primeUserSession(page)
  await installMockApi(page)

  await page.goto('/en/')
  await expect(page.getByRole('main')).toBeVisible()
  await page.goto('/en/auth/sign-in')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page.goto('/en/console/overview')
  await expect(page.getByRole('heading', { name: 'Recent usage' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
  await page.goto('/en/console-foundation/overview')
  await page.waitForURL('**/en/console/overview')
  await page.goto('/en/console/analytics')
  await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible()
  await expect(page.locator('[data-console-root]')).toHaveCount(1)

  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})

test('canonical console overview refreshes a child-query 401 while keeping an adjacent 403 isolated', async ({ page }) => {
  await primeUserSession(page)
  let refreshAttempts = 0
  const refreshSessionHeaders: string[] = []
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/auth/refresh') {
        refreshAttempts += 1
        refreshSessionHeaders.push(request.headers()['x-auth-session'] || '')
      }
    },
  })
  let tokenAttempts = 0
  let logAttempts = 0

  await page.route('**/api/token/**', async (route) => {
    tokenAttempts += 1
    if (tokenAttempts === 1) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Bearer server-secret-must-not-render', data: null }),
      })
      return
    }
    await route.fallback()
  })
  await page.route('**/api/log/self**', async (route) => {
    if (new URL(route.request().url()).pathname !== '/api/log/self') {
      await route.fallback()
      return
    }
    logAttempts += 1
    if (logAttempts === 1) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'api-key=server-secret-must-not-render', data: null }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: '', data: { items: [], total: 0, page: 1, page_size: 5 } }),
    })
  })

  await page.goto('/en/console/overview')
  const readiness = page.getByRole('region', { name: 'Request readiness' })
  const recent = page.getByRole('region', { name: 'Recent usage' })
  await expect(readiness).toContainText('Your account cannot access API key readiness.')
  await expect(recent).toContainText('No recent usage')
  await expect(page.getByRole('region', { name: 'API service' })).toContainText('Available')
  await expect(page.getByText('server-secret-must-not-render')).toHaveCount(0)

  await readiness.getByRole('button', { name: 'Retry' }).click()
  await expect(readiness).toContainText('API key ready')
  expect(tokenAttempts).toBe(2)
  expect(logAttempts).toBe(2)
  expect(refreshAttempts).toBe(2)
  expect(refreshSessionHeaders[0]).toBe('')
  expect(refreshSessionHeaders[1]).not.toBe('')
})

test('restricted feature responses keep all canonical console areas on self scope without refreshing', async ({ page }) => {
  await primeUserSession(page)
  let refreshAttempts = 0
  const requestedPaths: string[] = []
  await installMockApi(page, {
    onRequest: (request) => {
      const path = new URL(request.url()).pathname
      requestedPaths.push(path)
      if (path === '/api/user/auth/refresh') refreshAttempts += 1
    },
  })
  const restrictedPaths = new Set([
    '/api/token/',
    '/api/log/self',
    '/api/log/self/stat',
    '/api/data/self',
    '/api/data/flow/self',
  ])
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (!restrictedPaths.has(path)) return route.fallback()
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Bearer restricted-response-secret', data: { key: 'sk-restricted-response-secret' } }),
    })
  })

  await page.goto('/en/console/overview')
  await expect(page.getByRole('region', { name: 'Request readiness' })).toContainText('Your account cannot access API key readiness.')
  await expect(page.getByRole('region', { name: 'Recent usage' })).toContainText('Your account cannot access Recent usage.')

  await page.getByRole('link', { name: 'Analytics' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot access this analytics data.' }).first()).toBeVisible()

  await page.getByRole('link', { name: 'API keys' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot manage API keys.' })).toBeVisible()

  await page.getByRole('link', { name: 'Usage logs' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot access usage logs.' })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot access usage statistics.' })).toBeVisible()

  expect(refreshAttempts).toBe(1)
  expect(requestedPaths).not.toContain('/api/log/')
  await expect(page.getByText(/restricted-response-secret/)).toHaveCount(0)
  const restrictedResponsePersisted = await page.evaluate(() => {
    return [window.localStorage, window.sessionStorage].some((storage) => {
      const values = Array.from({ length: storage.length }, (_, index) => storage.getItem(storage.key(index) || '') || '')
      return values.some((value) => value.includes('restricted-response-secret'))
    })
  })
  expect(restrictedResponsePersisted).toBe(false)
})

test('canonical console analytics uses real-shaped aggregates and preserves keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const requests: string[] = []
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await primeUserSession(page)
  await installMockApi(page, { onRequest: (request) => requests.push(request.url()) })
  await page.goto('/en/console/analytics')

  await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Analytics' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByLabel('Usage summary')).toContainText('19')
  await expect(page.getByRole('tabpanel', { name: 'Trend' }).getByRole('img').first()).toBeVisible()
  await page.screenshot({ path: `${evidenceScreenshots}/analytics-1440.png`, fullPage: true })

  const details = page.getByRole('button', { name: 'View data' })
  await details.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Aggregated usage data' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(details).toBeFocused()

  const initialUsageRequests = requests.filter((url) => new URL(url).pathname === '/api/data/self').length
  await page.getByRole('button', { name: 'Refresh' }).click()
  await expect.poll(() => requests.filter((url) => new URL(url).pathname === '/api/data/self').length).toBeGreaterThan(initialUsageRequests)

  await page.getByRole('tab', { name: 'Tokens' }).click()
  await expect(page.getByRole('tabpanel', { name: 'Trend' }).getByRole('img').first()).toBeVisible()
  await page.getByRole('tab', { name: 'Models' }).click()
  await expect(page.getByText('gpt-image-1', { exact: true }).first()).toBeVisible()
  await page.getByRole('tab', { name: 'Routes' }).click()
  await expect(page.getByText('Studio fixture', { exact: true }).first()).toBeVisible()

  await page.getByRole('combobox', { name: 'Time range' }).click()
  await page.getByRole('option', { name: 'Last 90 days' }).click()
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await expect.poll(() => requests.filter((url) => new URL(url).pathname === '/api/data/self').length).toBeGreaterThanOrEqual(4)
  const quotaRequests = requests.filter((url) => new URL(url).pathname === '/api/data/self').map((url) => new URL(url))
  expect(quotaRequests.slice(-3).every((url) => Number(url.searchParams.get('end_timestamp')) - Number(url.searchParams.get('start_timestamp')) <= 30 * 86_400)).toBe(true)

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})

test('canonical console analytics refreshes a usage 401 while keeping a flow 403 independent', async ({ page }) => {
  await primeUserSession(page)
  let refreshAttempts = 0
  let usageAttempts = 0
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/auth/refresh') refreshAttempts += 1
    },
  })
  await page.route('**/api/data/self**', async (route) => {
    usageAttempts += 1
    if (usageAttempts === 1) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unauthorized', data: null }) })
      return
    }
    await route.fallback()
  })
  await page.route('**/api/data/flow/self**', async (route) => {
    await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Forbidden', data: null }) })
  })
  await page.goto('/en/console/analytics')

  await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible()
  await expect(page.getByLabel('Usage summary')).toContainText('19')
  await expect(page.getByRole('status').filter({ hasText: 'Request flow is unavailable. Usage views remain usable.' })).toBeVisible()
  await page.getByRole('tab', { name: 'Routes' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot access this analytics data.' })).toBeVisible()
  expect(usageAttempts).toBeGreaterThanOrEqual(2)
  expect(refreshAttempts).toBe(2)
})

test('canonical console analytics stops incomplete contracts and renders true empty data', async ({ page }) => {
  let state: 'partial' | 'empty' = 'partial'
  await primeUserSession(page)
  await installMockApi(page)
  await page.route('**/api/data/self**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    const data = state === 'empty' ? [] : [
      { created_at: 1_721_520_000, model_name: 'gpt-4.1-mini', request_count: 3, token_used: 320, quota: 2_000 },
      { created_at: 1_721_520_000, model_name: 'missing-metrics' },
    ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: '', data }) })
  })
  await page.route('**/api/data/flow/self**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: '', data: state === 'empty' ? [] : [{ token_name: 'missing-metrics' }] }) })
  })
  await page.goto('/en/console/analytics')

  await expect(page.getByLabel('Loading analytics')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Some aggregate rows are incomplete' })).toBeVisible()
  await page.getByRole('tab', { name: 'Routes' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Analytics contract is incomplete' })).toBeVisible()

  state = 'empty'
  await page.reload()
  await expect(page.getByText('No usage in this period')).toBeVisible()
})

for (const width of [390, 320]) {
  test(`canonical console analytics stays responsive at ${width}px with locale and theme intact`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await primeUserSession(page)
    await installMockApi(page)
    await page.goto('/zh-CN/console/analytics')

    await expect(page.getByRole('heading', { name: '数据看板' })).toBeVisible()
    if (width === 390) await page.screenshot({ path: `${evidenceScreenshots}/analytics-390.png`, fullPage: true })
    await page.getByRole('button', { name: '切换主题' }).click()
    await page.getByRole('menuitemradio', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('tab', { name: '路由' }).click()
    await expect(page.getByRole('tabpanel', { name: '路由' }).locator('article').filter({ hasText: 'Studio fixture' }).first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])
  })
}

test('canonical console usage logs uses self-scoped list and statistics queries without retaining sensitive payloads', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const requests: string[] = []
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await primeUserSession(page)
  await installMockApi(page, { onRequest: (request) => requests.push(request.url()) })
  await page.goto('/en/console/usage-logs')

  await expect(page.getByRole('heading', { name: 'Usage logs', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Usage logs' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('req_fixture_123456789').first()).toBeVisible()
  await expect(page.getByLabel('Usage statistics')).toContainText('$0.02')
  await expect(page.getByText('Fixture completion request')).toHaveCount(0)
  await expect(page.getByText(/billing_mode/)).toHaveCount(0)
  await page.screenshot({ path: `${evidenceScreenshots}/logs-1440.png`, fullPage: true })

  const details = page.getByRole('button', { name: /View details req_fixture/ }).first()
  await details.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Request details' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Request content, raw metadata' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(details).toBeFocused()

  const initialLogRequests = requests.filter((url) => new URL(url).pathname === '/api/log/self').length
  const initialStatRequests = requests.filter((url) => new URL(url).pathname === '/api/log/self/stat').length
  await page.getByRole('button', { name: 'Refresh' }).click()
  await expect.poll(() => requests.filter((url) => new URL(url).pathname === '/api/log/self').length).toBeGreaterThan(initialLogRequests)
  await expect.poll(() => requests.filter((url) => new URL(url).pathname === '/api/log/self/stat').length).toBeGreaterThan(initialStatRequests)

  await page.getByRole('textbox', { name: 'Request ID' }).fill('req_fixture_123456789')
  await page.getByRole('textbox', { name: 'Request ID' }).press('Enter')
  await expect.poll(() => requests.filter((url) => new URL(url).pathname === '/api/log/self').at(-1)).toContain('request_id=req_fixture_123456789')
  const latestStat = requests.filter((url) => new URL(url).pathname === '/api/log/self/stat').at(-1) || ''
  expect(new URL(latestStat).searchParams.has('request_id')).toBe(false)
  await expect(page.getByRole('status').filter({ hasText: 'statistics contract does not accept request or upstream request IDs' })).toBeVisible()
  expect(await page.evaluate(() => Object.values(window.localStorage).some((value) => value.includes('Fixture completion request') || value.includes('billing_mode')))).toBe(false)
  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})

test('canonical console usage logs supports exact upstream filtering and server pagination, and blocks credential-shaped filters', async ({ page }) => {
  const requests: string[] = []
  await primeUserSession(page)
  await installMockApi(page, { onRequest: (request) => requests.push(request.url()) })
  await page.route('**/api/log/self**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname !== '/api/log/self') return route.fallback()
    requests.push(route.request().url())
    const pageNumber = Number(url.searchParams.get('p') || 1)
    const id = pageNumber === 2 ? 21 : 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: '', data: { items: [{ id, created_at: 1_721_520_000 + id, type: 2, token_name: 'Worker', model_name: 'gpt-4.1-mini', prompt_tokens: id, completion_tokens: 1, quota: 500, use_time: 0.2, is_stream: false, group: 'default', request_id: `req_page_${pageNumber}`, upstream_request_id: 'upstream_exact' }], total: 21, page: pageNumber, page_size: 20 } }),
    })
  })
  await page.goto('/en/console/usage-logs')

  await expect(page.getByText('req_page_1').first()).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('req_page_2').first()).toBeVisible()
  expect(new URL(requests.filter((url) => new URL(url).pathname === '/api/log/self').at(-1) || '').searchParams.get('p')).toBe('2')

  await page.getByRole('button', { name: 'Search field: Request ID' }).click()
  await page.getByRole('menuitem', { name: 'Upstream request ID' }).click()
  await page.getByRole('textbox', { name: 'Upstream request ID' }).fill('upstream_exact')
  await page.getByRole('textbox', { name: 'Upstream request ID' }).press('Enter')
  await expect.poll(() => new URL(requests.filter((url) => new URL(url).pathname === '/api/log/self').at(-1) || '').searchParams.get('upstream_request_id')).toBe('upstream_exact')
  await expect(page.getByText('Page 1 / 2')).toBeVisible()

  const beforeBlockedFilter = requests.filter((url) => new URL(url).pathname === '/api/log/self').length
  await page.getByRole('textbox', { name: 'Upstream request ID' }).fill('Bearer account-secret')
  await page.getByRole('textbox', { name: 'Upstream request ID' }).press('Enter')
  await expect(page.getByRole('alert').filter({ hasText: 'Credential-shaped values and URLs' })).toBeVisible()
  expect(requests.filter((url) => new URL(url).pathname === '/api/log/self')).toHaveLength(beforeBlockedFilter)
})

test('canonical console usage logs refreshes a list 401 while keeping statistics 403 independent', async ({ page }) => {
  await primeUserSession(page)
  let refreshAttempts = 0
  let listAttempts = 0
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/auth/refresh') refreshAttempts += 1
    },
  })
  await page.route('**/api/log/self**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/stat')) {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'sensitive backend detail', data: null }) })
      return
    }
    listAttempts += 1
    if (listAttempts === 1) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'sensitive backend detail', data: null }) })
      return
    }
    await route.fallback()
  })
  await page.goto('/en/console/usage-logs')

  await expect(page.getByRole('row', { name: /gpt-4\.1-mini/ })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot access usage statistics.' })).toBeVisible()
  await expect(page.getByText('sensitive backend detail')).toHaveCount(0)
  expect(listAttempts).toBe(2)
  expect(refreshAttempts).toBe(2)
})

test('canonical console usage logs exposes loading, partial, redacted, contract, and empty states', async ({ page }) => {
  let state: 'partial' | 'contract' | 'empty' = 'partial'
  await primeUserSession(page)
  await installMockApi(page)
  await page.route('**/api/log/self**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname !== '/api/log/self') return route.fallback()
    await new Promise((resolve) => setTimeout(resolve, 350))
    const items = state === 'empty' ? [] : state === 'contract' ? [{ id: 2 }] : [
      { id: 1, created_at: 1_721_520_000, type: 2, token_name: 'Bearer private-token', model_name: 'https://private.example/model?key=secret', prompt_tokens: 4, content: 'sk-request-content-secret', other: '{"output_url":"https://private.example/result?sig=secret"}' },
      { id: 2 },
    ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: '', data: { items, total: items.length, page: 1, page_size: 20 } }) })
  })
  await page.goto('/en/console/usage-logs')

  await expect(page.getByLabel('Loading usage logs')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Some log records or fields were unavailable or redacted' })).toBeVisible()
  await expect(page.getByText('Bearer [redacted]').first()).toBeVisible()
  await expect(page.getByRole('table').getByText('[redacted URL]')).toBeVisible()
  await expect(page.getByText('private-token')).toHaveCount(0)
  await expect(page.getByText('sk-request-content-secret')).toHaveCount(0)
  await expect(page.getByText('sig=secret')).toHaveCount(0)

  state = 'contract'
  await page.reload()
  await expect(page.getByRole('alert').filter({ hasText: 'no record has the required id, time, and type fields' })).toBeVisible()

  state = 'empty'
  await page.reload()
  await expect(page.getByText('No usage logs yet')).toBeVisible()
})

test('canonical usage logs uses the canonical Console shell and route', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/usage-logs')

  await expect(page.getByRole('heading', { name: 'Usage logs', exact: true })).toBeVisible()
  await expect(page.locator('[data-console-root]')).toHaveCount(1)
  expect(new URL(page.url()).pathname).toBe('/en/console/usage-logs')
})

for (const width of [390, 320]) {
  test(`canonical console usage logs stays responsive at ${width}px with locale, theme, and detail focus intact`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await primeUserSession(page)
    await installMockApi(page)
    await page.goto('/zh-CN/console/usage-logs')

    await expect(page.getByRole('heading', { name: '使用日志' })).toBeVisible()
    await page.getByRole('button', { name: '切换主题' }).click()
    await page.getByRole('menuitemradio', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const details = page.getByRole('button', { name: /查看 req_fixture.*详情/ }).first()
    await expect(details).toBeVisible()
    await details.scrollIntoViewIfNeeded()
    await details.focus()
    await expect(details).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(details).toBeFocused()
    await page.evaluate(() => window.scrollTo(0, 0))
    if (width === 390) await page.screenshot({ path: `${evidenceScreenshots}/logs-390.png`, fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])
  })
}

test('canonical console API keys uses the token CRUD, status, batch, and reveal contracts without retaining secrets', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const requests: Array<{ method: string; url: string; body: string | null }> = []
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await primeUserSession(page)
  await installMockApi(page, { tokenCreateOmitsData: true, onRequest: (request) => requests.push({ method: request.method(), url: request.url(), body: request.postData() }) })
  await page.goto('/en/console/keys')

  await expect(page.getByRole('heading', { name: 'API keys', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'API keys' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('ABCD**********WXYZ').first()).toBeVisible()
  await expect(page.getByText('fixture-session-token')).toHaveCount(0)
  await page.screenshot({ path: `${evidenceScreenshots}/keys-1440.png`, fullPage: true })

  const studioActions = page.getByRole('button', { name: 'Actions Studio fixture' })
  await studioActions.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('menuitem', { name: 'Reveal' }).click()
  await expect(page.getByRole('dialog', { name: 'Reveal full key?' })).toBeVisible()
  await expect(page.getByText('fixture-session-token')).toHaveCount(0)
  await page.getByRole('button', { name: 'Confirm reveal' }).click()
  await expect(page.getByText('fixture-session-token')).toBeVisible()
  expect(await page.evaluate(() => Object.values(window.localStorage).some((value) => value.includes('fixture-session-token')))).toBe(false)
  await page.keyboard.press('Escape')
  await expect(page.getByText('fixture-session-token')).toHaveCount(0)
  await expect(studioActions).toBeFocused()

  await studioActions.click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  const nameInput = page.getByLabel('Name')
  await expect(nameInput).toHaveValue('Studio fixture')
  await nameInput.fill('Studio production')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Studio production', { exact: true }).first()).toBeVisible()

  const renamedActions = page.getByRole('button', { name: 'Actions Studio production' })
  await renamedActions.click()
  await page.getByRole('menuitem', { name: 'Disable' }).click()
  await page.getByRole('dialog', { name: 'Disable this API key?' }).getByRole('button', { name: 'Disable key' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Studio production' })).toContainText('Disabled')

  await page.getByRole('button', { name: 'Create key' }).first().click()
  await page.getByLabel('Name').fill('Build worker')
  await page.getByLabel('Quota (USD)').fill('3.5')
  await page.getByRole('button', { name: 'Create key' }).last().click()
  await expect(page.getByText('Build worker', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'server did not return its id' })).toBeVisible()

  await page.getByRole('button', { name: 'Actions Build worker' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await page.getByRole('dialog', { name: 'Delete this key?' }).getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Build worker', { exact: true })).toHaveCount(0)

  await renamedActions.click()
  await page.getByRole('menuitem', { name: 'Select for batch' }).click()
  await page.getByRole('checkbox', { name: 'Select Automation fixture' }).check()
  await page.getByRole('button', { name: 'Delete selected' }).click()
  await page.getByRole('dialog', { name: 'Delete selected keys?' }).getByRole('button', { name: 'Delete selected' }).click()
  await expect(page.getByText('No API keys yet')).toBeVisible()

  const paths = requests.map((request) => [request.method, new URL(request.url).pathname])
  expect(paths).toContainEqual(['POST', '/api/token/7/key'])
  expect(paths).toContainEqual(['PUT', '/api/token/'])
  expect(paths).toContainEqual(['POST', '/api/token/'])
  expect(paths).toContainEqual(['DELETE', '/api/token/8'])
  expect(paths).toContainEqual(['POST', '/api/token/batch'])
  const createBody = requests.find((request) => request.method === 'POST' && new URL(request.url).pathname === '/api/token/')?.body || ''
  expect(createBody).toContain('"remain_quota":1750000')
  expect(createBody).not.toContain('fixture-session-token')
  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})

test('canonical console API key reveal expires from memory without closing the confirmation surface', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/keys')
  await expect(page.getByText('Studio fixture', { exact: true }).first()).toBeVisible()

  await page.evaluate(() => {
    const nativeSetTimeout = window.setTimeout.bind(window)
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => (
      nativeSetTimeout(handler, timeout === 60_000 ? 250 : timeout, ...args)
    )) as typeof window.setTimeout
  })

  await page.getByRole('button', { name: 'Actions Studio fixture' }).click()
  await page.getByRole('menuitem', { name: 'Reveal' }).click()
  await page.getByRole('button', { name: 'Confirm reveal' }).click()
  await expect(page.getByText('fixture-session-token')).toBeVisible()
  await expect(page.getByText('fixture-session-token')).toHaveCount(0, { timeout: 2_000 })
  await expect(page.getByRole('dialog', { name: 'Reveal full key?' })).toBeVisible()
})

test('canonical console API keys refreshes a list 401 and keeps a mutation 403 local', async ({ page }) => {
  await primeUserSession(page)
  let refreshAttempts = 0
  let listAttempts = 0
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/auth/refresh') refreshAttempts += 1
    },
  })
  await page.route('**/api/token/**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'GET' && url.pathname === '/api/token/' && listAttempts++ === 0) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unauthorized', data: null }) })
      return
    }
    await route.fallback()
  })
  await page.goto('/en/console/keys')
  await expect(page.getByText('Studio fixture', { exact: true }).first()).toBeVisible()
  expect(listAttempts).toBe(2)
  expect(refreshAttempts).toBe(2)
  await page.route('**/api/token/7/key', async (route) => {
    await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Forbidden', data: null }) })
  })
  await page.getByRole('button', { name: 'Actions Studio fixture' }).click()
  await page.getByRole('menuitem', { name: 'Reveal' }).click()
  await page.getByRole('button', { name: 'Confirm reveal' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot manage API keys.' })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).last().click()

  await page.route('**/api/token/**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'PUT' && url.pathname === '/api/token/' && url.searchParams.get('status_only') === 'true') {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Forbidden', data: null }) })
      return
    }
    await route.fallback()
  })
  await page.getByRole('button', { name: 'Actions Studio fixture' }).click()
  await page.getByRole('menuitem', { name: 'Disable' }).click()
  await page.getByRole('dialog', { name: 'Disable this API key?' }).getByRole('button', { name: 'Disable key' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot manage API keys.' })).toBeVisible()
})

test('canonical console API key permission failures classify 403, 404, and business failures without refresh or persistence', async ({ page }) => {
  await primeUserSession(page)
  let refreshAttempts = 0
  let allowDetail = false
  const responseMarkers = [
    'permission-response-secret',
    'non-owner-resource-payload',
    'sk-permission-response-secret',
  ]
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/auth/refresh') refreshAttempts += 1
    },
  })
  await page.route('**/api/token/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const failureBody = {
      success: false,
      message: 'Bearer permission-response-secret',
      data: { id: 7, name: 'non-owner-resource-payload', key: 'sk-permission-response-secret' },
    }
    if (request.method() === 'GET' && url.pathname === '/api/token/7' && !allowDetail) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify(failureBody) })
      return
    }
    if (request.method() === 'PUT' && url.pathname === '/api/token/') {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify(failureBody) })
      return
    }
    if (request.method() === 'POST' && (url.pathname === '/api/token/7/key' || url.pathname === '/api/token/batch')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(failureBody) })
      return
    }
    if (request.method() === 'DELETE' && url.pathname === '/api/token/7') {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify(failureBody) })
      return
    }
    await route.fallback()
  })

  await page.goto('/en/console/keys')
  await expect(page.getByText('Studio fixture', { exact: true }).first()).toBeVisible()

  const actions = page.getByRole('button', { name: 'Actions Studio fixture' })
  await actions.click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'This API key does not exist or is not visible to your account.' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()

  allowDetail = true
  await actions.click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await expect(page.getByLabel('Name')).toHaveValue('Studio fixture')
  await page.getByLabel('Name').fill('Non-owner attempted rename')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot manage API keys.' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await actions.click()
  await page.getByRole('menuitem', { name: 'Disable' }).click()
  await page.getByRole('dialog', { name: 'Disable this API key?' }).getByRole('button', { name: 'Disable key' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Your account cannot manage API keys.' })).toBeVisible()
  await page.getByRole('dialog', { name: 'Disable this API key?' }).getByRole('button', { name: 'Cancel' }).click()

  await actions.click()
  await page.getByRole('menuitem', { name: 'Reveal' }).click()
  await page.getByRole('button', { name: 'Confirm reveal' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Unable to reveal key' })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).last().click()

  await actions.click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await page.getByRole('dialog', { name: 'Delete this key?' }).getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'This API key does not exist or is not visible to your account.' })).toBeVisible()
  await page.getByRole('dialog', { name: 'Delete this key?' }).getByRole('button', { name: 'Cancel' }).click()

  await actions.click()
  await page.getByRole('menuitem', { name: 'Select for batch' }).click()
  await page.getByRole('button', { name: 'Delete selected' }).click()
  await page.getByRole('dialog', { name: 'Delete selected keys?' }).getByRole('button', { name: 'Delete selected' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Unable to delete selected API keys.' })).toBeVisible()

  expect(refreshAttempts).toBe(1)
  expect(new URL(page.url()).pathname).toBe('/en/console/keys')
  await expect(page.getByText(/permission-response-secret|non-owner-resource-payload/)).toHaveCount(0)
  const persisted = await page.evaluate(async (markers) => {
    const webStorage = [window.localStorage, window.sessionStorage].flatMap((storage) =>
      Array.from({ length: storage.length }, (_, index) => storage.getItem(storage.key(index) || '') || ''),
    )
    if (webStorage.some((value) => markers.some((marker) => value.includes(marker)))) return true
    const databases = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : []
    for (const database of databases) {
      if (!database.name) continue
      const connection = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(database.name!)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      for (const storeName of Array.from(connection.objectStoreNames)) {
        const values = await new Promise<unknown[]>((resolve, reject) => {
          const transaction = connection.transaction(storeName, 'readonly')
          const request = transaction.objectStore(storeName).getAll()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        if (markers.some((marker) => JSON.stringify(values).includes(marker))) {
          connection.close()
          return true
        }
      }
      connection.close()
    }
    return false
  }, responseMarkers)
  expect(persisted).toBe(false)
})

test('canonical console API keys exposes loading, partial, contract, and empty list states', async ({ page }) => {
  let state: 'partial' | 'contract' | 'empty' = 'partial'
  await primeUserSession(page)
  await installMockApi(page)
  await page.route('**/api/token/**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() !== 'GET' || url.pathname !== '/api/token/') return route.fallback()
    await new Promise((resolve) => setTimeout(resolve, 350))
    const items = state === 'empty' ? [] : state === 'contract' ? [{ status: 1 }] : [{ id: 11, name: 'Partial key', key: 'PART**********KEYS', status: 1 }, { id: 12 }]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: '', data: { items, total: items.length, page: 1, page_size: 100 } }) })
  })
  await page.goto('/en/console/keys')

  await expect(page.getByLabel('Loading API keys')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Some API key records or fields are unavailable' })).toBeVisible()
  await expect(page.getByText('Partial key', { exact: true }).first()).toBeVisible()

  state = 'contract'
  await page.reload()
  await expect(page.getByRole('alert').filter({ hasText: 'API key contract is incomplete' })).toBeVisible()

  state = 'empty'
  await page.reload()
  await expect(page.getByText('No API keys yet')).toBeVisible()
})

test('canonical API keys uses the canonical Console shell', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/keys')

  await expect(page.getByRole('heading', { name: 'API keys', exact: true })).toBeVisible()
  await expect(page.locator('[data-console-root]')).toHaveCount(1)
  expect(new URL(page.url()).pathname).toBe('/en/console/keys')
})

for (const width of [390, 320]) {
  test(`canonical console API keys stays responsive at ${width}px with locale, theme, and focus intact`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await primeUserSession(page)
    await installMockApi(page)
    await page.goto('/zh-CN/console/keys')

    await expect(page.getByRole('heading', { name: 'API 密钥' })).toBeVisible()
    await page.getByRole('button', { name: '切换主题' }).click()
    await page.getByRole('menuitemradio', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const actions = page.getByRole('button', { name: /Studio fixture/ })
    await actions.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('menuitem', { name: '显示完整值' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(actions).toBeFocused()
    if (width === 390) await page.screenshot({ path: `${evidenceScreenshots}/keys-390.png`, fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])
  })
}
