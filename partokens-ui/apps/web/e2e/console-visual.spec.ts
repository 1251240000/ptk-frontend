import { expect, test, type Page } from '@playwright/test'

import { installMockApi, primeUserSession } from './mock-api'

const output = '../../dogfood-output/r59-console-release-readiness/screenshots'
const viewports = [
  { name: '1440', width: 1440, height: 1000 },
  { name: '390', width: 390, height: 844 },
  { name: '320', width: 320, height: 844 },
] as const

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((value) => window.localStorage.setItem('partokens-theme', value), theme)
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

for (const viewport of viewports) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Canonical Console Overview ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await primeUserSession(page)
      await setTheme(page, theme)
      await installMockApi(page)
      await page.goto('/en/console/overview')
      await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expectNoOverflow(page)
      await page.screenshot({ path: `${output}/overview-production-${theme}-${viewport.name}.png` })
      if (theme === 'light') await page.screenshot({ path: `${output}/shell-production-light-${viewport.name}.png` })
    })

    test(`Canonical Console Overview design ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await setTheme(page, theme)
      await page.goto('http://127.0.0.1:4180/#console')
      await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
      await expectNoOverflow(page)
      await page.screenshot({ path: `${output}/overview-design-${theme}-${viewport.name}.png` })
      if (theme === 'light') await page.screenshot({ path: `${output}/shell-design-light-${viewport.name}.png` })
    })

    test(`Canonical Console Analytics design ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await setTheme(page, theme)
      await page.goto('http://127.0.0.1:4180/#console-analytics')
      await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
      await expectNoOverflow(page)
      await page.screenshot({ path: `${output}/analytics-design-${theme}-${viewport.name}.png` })
    })

    test(`Canonical Console Analytics production ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await primeUserSession(page)
      await setTheme(page, theme)
      await installMockApi(page)
      await page.goto('/en/console/analytics')
      await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
      await expect(page.getByLabel('Usage summary')).toBeVisible()
      await expect(page.getByRole('button', { name: /Export/ })).toBeEnabled()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expectNoOverflow(page)
      await page.screenshot({ path: `${output}/analytics-production-${theme}-${viewport.name}.png` })
    })

    test(`Canonical Console API Keys design ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await setTheme(page, theme)
      await page.goto('http://127.0.0.1:4180/#console-keys')
      await expect(page.getByRole('heading', { name: 'API keys' })).toBeVisible()
      await expectNoOverflow(page)
      await page.screenshot({ path: `${output}/keys-design-${theme}-${viewport.name}.png` })
    })

    test(`Canonical Console API Keys production ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await primeUserSession(page)
      await setTheme(page, theme)
      await installMockApi(page)
      await page.goto('/en/console/keys')
      await expect(page.getByRole('heading', { name: 'API keys' })).toBeVisible()
      await expect(page.getByRole('combobox', { name: 'Permission filter unavailable' })).toBeDisabled()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expectNoOverflow(page)
      await page.screenshot({ path: `${output}/keys-production-${theme}-${viewport.name}.png` })
    })

    test(`Canonical Console Usage Logs design ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await setTheme(page, theme)
      await page.goto('http://127.0.0.1:4180/#console-logs')
      await expect(page.getByRole('heading', { name: 'Usage logs' })).toBeVisible()
      await expectNoOverflow(page)
      await page.screenshot({ path: `${output}/logs-design-${theme}-${viewport.name}.png` })
    })

    test(`Canonical Console Usage Logs production ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await primeUserSession(page)
      await setTheme(page, theme)
      await installMockApi(page)
      await page.goto('/en/console/usage-logs')
      await expect(page.getByRole('heading', { name: 'Usage logs' })).toBeVisible()
      await expect(page.getByLabel('Usage statistics')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expectNoOverflow(page)
      await page.screenshot({ path: `${output}/logs-production-${theme}-${viewport.name}.png` })
    })
  }
}

test('Canonical Console Overview overlay and mobile navigation restore focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/overview')

  const details = page.getByRole('button', { name: 'View details' }).first()
  await details.scrollIntoViewIfNeeded()
  await details.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Request details' })).toBeVisible()
  await page.screenshot({ path: `${output}/overview-production-overlay-390.png` })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(details).toBeFocused()

  const trigger = page.locator('[data-console-sidebar-trigger]')
  await trigger.focus()
  await page.keyboard.press('Enter')
  const sidebar = page.locator('[data-sidebar="sidebar"][data-mobile="true"]')
  await expect(sidebar).toBeVisible()
  await page.screenshot({ path: `${output}/shell-production-mobile-navigation-390.png` })
  await page.keyboard.press('Escape')
  await expect(sidebar).toBeHidden()
  await expect(trigger).toBeFocused()
  expect(await page.evaluate(() => document.cookie)).not.toContain('sidebar_state=')
})

test('Canonical Console Overview loading and partial states preserve the composition', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await primeUserSession(page)
  await installMockApi(page)
  let releaseTokenRequest = () => {}
  const tokenRequestHeld = new Promise<void>((resolve) => {
    releaseTokenRequest = resolve
  })
  await page.route('**/api/token/**', async (route) => {
    await tokenRequestHeld
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: '',
        data: {
          items: [
            { id: 7, name: 'Studio fixture', status: 1, accessed_time: 1_721_520_000 },
            { id: null, name: 'Incomplete fixture', status: 1 },
          ],
          total: 2,
          page: 1,
          page_size: 100,
        },
      }),
    })
  })
  await page.goto('/en/console/overview')
  await expect(page.getByLabel('Loading overview')).toBeVisible()
  await page.screenshot({ path: `${output}/overview-production-loading-390.png` })
  releaseTokenRequest()
  const partialNotice = page.getByText('Some account records were incomplete or redacted. Only validated fields are shown.')
  await expect(partialNotice).toBeVisible()
  await partialNotice.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${output}/overview-production-partial-390.png` })
  await expectNoOverflow(page)
})

test('Canonical Console Analytics details use dialog and sheet with focus restoration', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/analytics')

  const details = page.getByRole('button', { name: 'View data' })
  await details.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Aggregated usage data' })).toBeVisible()
  await page.screenshot({ path: `${output}/analytics-production-overlay-1440.png` })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(details).toBeFocused()

  await page.setViewportSize({ width: 390, height: 844 })
  await details.click()
  await expect(page.getByRole('dialog', { name: 'Aggregated usage data' })).toBeVisible()
  await page.screenshot({ path: `${output}/analytics-production-overlay-390.png` })
  await page.keyboard.press('Escape')
  await expect(details).toBeFocused()
})

test('Canonical Console Analytics loading and contract states preserve the composition', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await primeUserSession(page)
  await installMockApi(page)
  await page.route('**/api/data/self**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: '', data: [{ created_at: 1_721_520_000, model_name: 'partial-model', count: 3 }] }) })
  })
  await page.goto('/en/console/analytics')
  await expect(page.getByLabel('Loading analytics')).toBeVisible()
  await page.screenshot({ path: `${output}/analytics-production-loading-390.png` })
  await expect(page.getByRole('status')).toContainText('Some aggregate rows are incomplete')
  await page.getByRole('tab', { name: 'Tokens' }).click()
  await expect(page.getByRole('alert')).toContainText('Analytics contract is incomplete')
  await page.screenshot({ path: `${output}/analytics-production-contract-390.png` })
  await expectNoOverflow(page)
})

test('Canonical Console API Keys uses desktop dialog, mobile sheet, confirmation, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/keys')

  const create = page.getByRole('button', { name: 'Create key' })
  await create.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Create API key' })).toBeVisible()
  await page.screenshot({ path: `${output}/keys-production-overlay-1440.png` })
  await page.keyboard.press('Escape')
  await expect(create).toBeFocused()

  const actions = page.getByRole('button', { name: 'Actions Studio fixture' })
  await actions.click()
  await page.getByRole('menuitem', { name: 'Reveal' }).click()
  await expect(page.getByRole('dialog', { name: 'Reveal full key?' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirm reveal' }).click()
  await expect(page.getByText('fixture-session-token')).toBeVisible()
  await page.screenshot({ path: `${output}/keys-production-reveal-1440.png` })
  await page.keyboard.press('Escape')
  await expect(page.getByText('fixture-session-token')).toHaveCount(0)
  await expect(actions).toBeFocused()

  await page.setViewportSize({ width: 390, height: 844 })
  await create.click()
  await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible()
  await page.screenshot({ path: `${output}/keys-production-overlay-390.png` })
  await page.keyboard.press('Escape')
  await expect(create).toBeFocused()
  await expectNoOverflow(page)
})

test('Canonical Console API Keys loading, partial, and contract states preserve the list surface', async ({ page }) => {
  let state: 'partial' | 'contract' = 'partial'
  await page.setViewportSize({ width: 390, height: 844 })
  await primeUserSession(page)
  await installMockApi(page)
  await page.route('**/api/token/**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() !== 'GET' || url.pathname !== '/api/token/') return route.fallback()
    await new Promise((resolve) => setTimeout(resolve, 500))
    const items = state === 'partial' ? [{ id: 11, name: 'Partial key', key: 'PART**********KEYS', status: 1 }] : [{ status: 1 }]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: '', data: { items, total: items.length, page: 1, page_size: 100 } }) })
  })
  await page.goto('/en/console/keys')
  await expect(page.getByLabel('Loading API keys')).toBeVisible()
  await page.screenshot({ path: `${output}/keys-production-loading-390.png` })
  await expect(page.getByRole('status').filter({ hasText: 'Some API key records or fields are unavailable' })).toBeVisible()
  await page.screenshot({ path: `${output}/keys-production-partial-390.png` })

  state = 'contract'
  await page.reload()
  await expect(page.getByRole('alert').filter({ hasText: 'API key contract is incomplete' })).toBeVisible()
  await page.screenshot({ path: `${output}/keys-production-contract-390.png` })
  await expectNoOverflow(page)
})

test('Canonical Console Usage Logs uses desktop dialog, mobile sheet, disabled export, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/usage-logs')

  const exportTrigger = page.getByRole('button', { name: 'Export' })
  await exportTrigger.click()
  await expect(page.getByRole('menuitem', { name: 'Export CSV unavailable' })).toBeDisabled()
  await page.screenshot({ path: `${output}/logs-production-menu-1440.png` })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(exportTrigger).toBeFocused()

  const details = page.getByRole('button', { name: /View details req_fixture/ })
  await details.focus()
  await expect(details).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Request details' })).toBeVisible()
  await page.screenshot({ path: `${output}/logs-production-overlay-1440.png` })
  await page.keyboard.press('Escape')
  await expect(details).toBeFocused()

  await page.setViewportSize({ width: 390, height: 844 })
  await details.click()
  await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible()
  await page.screenshot({ path: `${output}/logs-production-overlay-390.png` })
  await page.keyboard.press('Escape')
  await expect(details).toBeFocused()
  await expectNoOverflow(page)
})

test('Canonical Console Usage Logs loading, partial, and contract states preserve the design-lab composition', async ({ page }) => {
  let state: 'partial' | 'contract' = 'partial'
  await page.setViewportSize({ width: 390, height: 844 })
  await primeUserSession(page)
  await installMockApi(page)
  await page.route('**/api/log/self**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname !== '/api/log/self') return route.fallback()
    await new Promise((resolve) => setTimeout(resolve, 500))
    const items = state === 'partial'
      ? [{ id: 1, created_at: 1_721_520_000, type: 2, token_name: 'Safe key', model_name: 'partial-model', prompt_tokens: 4 }]
      : [{ id: 2 }]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: '', data: { items, total: items.length, page: 1, page_size: 20 } }) })
  })
  await page.goto('/en/console/usage-logs')
  await expect(page.getByLabel('Loading usage logs')).toBeVisible()
  await page.screenshot({ path: `${output}/logs-production-loading-390.png` })
  await expect(page.getByRole('status').filter({ hasText: 'Some log records or fields were unavailable' })).toBeVisible()
  await page.screenshot({ path: `${output}/logs-production-partial-390.png` })

  state = 'contract'
  await page.reload()
  await expect(page.getByRole('alert').filter({ hasText: 'no record has the required id, time, and type fields' })).toBeVisible()
  await page.screenshot({ path: `${output}/logs-production-contract-390.png` })
  await expectNoOverflow(page)
})
