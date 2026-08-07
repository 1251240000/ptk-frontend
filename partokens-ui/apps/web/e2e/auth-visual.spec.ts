import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test, type Locator, type Page } from '@playwright/test'

import { installMockApi } from './mock-api'

const evidenceRoot = process.env.PARTOKENS_E2E_EVIDENCE_DIR || '../../dogfood-output/r42-auth-production/screenshots'
const viewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 720 },
] as const
const themes = ['light', 'dark'] as const

async function settled(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.r32-auth-form-shell')).toBeVisible()
}

async function box(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value!
}

function expectNear(actual: number, expected: number, label: string) {
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(1)
}

test('authentication composition matches the active design-lab geometry across approved viewports and themes', async ({ page }) => {
  test.setTimeout(120_000)
  mkdirSync(resolve(process.cwd(), evidenceRoot), { recursive: true })
  await installMockApi(page)

  for (const theme of themes) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.addInitScript(({ value }) => {
        window.localStorage.setItem('partokens-theme', value)
        window.localStorage.setItem('partokens-locale', 'en')
      }, { value: theme })
      await page.goto('/en/auth/sign-in')
      await settled(page)

      const design = await page.context().newPage()
      await design.setViewportSize(viewport)
      await design.addInitScript(({ value }) => {
        window.localStorage.setItem('partokens-theme', value)
        window.localStorage.setItem('partokens-locale', 'en')
      }, { value: theme })
      await design.goto('http://127.0.0.1:4180/#signin')
      await settled(design)

      await expect(page.locator('.r32-auth-brand svg.partokens-mark')).toBeVisible()
      await expect(page.getByRole('checkbox')).toBeChecked()

      const productionBackground = page.locator('.r32-auth-rail-background')
      const designBackground = design.locator('.r32-auth-rail-background')
      await expect(productionBackground).toHaveAttribute('src', `/auth/auth-routing-${theme}.jpg`)
      await expect(designBackground).toHaveAttribute('src', `/auth/auth-routing-${theme}.jpg`)
      if (viewport.width <= 960) {
        await expect(productionBackground).toBeHidden()
        await expect(designBackground).toBeHidden()
      } else {
        await expect(productionBackground).toBeVisible()
        await expect(designBackground).toBeVisible()
        expect(await productionBackground.evaluate((element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBe(true)
        expect(await designBackground.evaluate((element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBe(true)
      }

      for (const selector of ['.r32-auth-rail', '.r32-auth-task', '.r32-auth-form-shell', '.r32-auth-route-button']) {
        const actual = await box(page.locator(selector).first())
        const baseline = await box(design.locator(selector).first())
        expectNear(actual.x, baseline.x, `${selector} x at ${viewport.width} ${theme}`)
        expectNear(actual.y, baseline.y, `${selector} y at ${viewport.width} ${theme}`)
        expectNear(actual.width, baseline.width, `${selector} width at ${viewport.width} ${theme}`)
      }

      const overflow = await page.evaluate(() => ({
        horizontal: document.documentElement.scrollWidth > window.innerWidth,
        bodyHorizontal: document.body.scrollWidth > window.innerWidth,
      }))
      expect(overflow, `${viewport.width}x${viewport.height} ${theme}`).toEqual({ horizontal: false, bodyHorizontal: false })

      const suffix = `${viewport.width}x${viewport.height}-${theme}`
      await page.screenshot({ path: resolve(process.cwd(), evidenceRoot, `signin-production-${suffix}.png`), fullPage: true })
      await design.screenshot({ path: resolve(process.cwd(), evidenceRoot, `signin-design-${suffix}.png`), fullPage: true })
      await design.close()
    }
  }
})

test('registration and callback states keep the approved task geometry', async ({ page }) => {
  mkdirSync(resolve(process.cwd(), evidenceRoot), { recursive: true })
  await installMockApi(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/en/auth/sign-up')
  await settled(page)
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Verification code')).toBeVisible()
  await page.screenshot({ path: resolve(process.cwd(), evidenceRoot, 'signup-production-1440x900-light.png'), fullPage: true })

  await page.evaluate(() => {
    window.sessionStorage.setItem('partokens-auth-oauth-context', JSON.stringify({
      intent: 'login',
      locale: 'en',
      provider: 'google',
      state: 'visual-state',
    }))
  })
  await page.goto('/oauth/google?code=visual-code&state=visual-state')
  await expect(page.getByRole('heading', { name: 'Sign-in confirmed' })).toBeVisible()
  const callbackBox = await box(page.locator('.r32-oauth-route'))
  expect(callbackBox.height).toBeGreaterThanOrEqual(120)
  await page.screenshot({ path: resolve(process.cwd(), evidenceRoot, 'oauth-ready-production-1440x900-light.png'), fullPage: true })
})
