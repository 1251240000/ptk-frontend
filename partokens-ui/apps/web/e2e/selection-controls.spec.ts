import { expect, test, type Locator } from '@playwright/test'

import { installMockApi, primeUserSession } from './mock-api'

const evidence = process.env.PARTOKENS_E2E_OUTPUT_DIR || '../../dogfood-output/2026-09-10-selection-controls'

async function expectContrast(control: Locator, part: 'check' | 'border' | 'native' | 'radio') {
  await expect.poll(() => control.evaluate((element, target) => {
    const context = document.createElement('canvas').getContext('2d')!
    const luminance = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map((channel) => {
        const value = channel / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
    }
    const style = getComputedStyle(element)
    const foreground = target === 'native' ? getComputedStyle(element, '::after').borderRightColor
      : target === 'border' ? style.borderColor
        : getComputedStyle(element.querySelector(target === 'radio' ? 'svg' : '[data-slot="checkbox-indicator"]')!).color
    let surface: Element | null = element
    let background = style.backgroundColor
    while (background === 'rgba(0, 0, 0, 0)' && surface?.parentElement) {
      surface = surface.parentElement
      background = getComputedStyle(surface).backgroundColor
    }
    const values = [luminance(foreground), luminance(background)]
    return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05)
  }, part)).toBeGreaterThanOrEqual(3)
}

for (const theme of ['light', 'dark']) {
  test(`selection controls remain distinct across pages in ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript((value) => localStorage.setItem('partokens-theme', value), theme)
    await installMockApi(page, { anonymous: true })
    for (const route of ['sign-in', 'sign-up']) {
      await page.goto(`/en/auth/${route}`)
      const consent = page.getByRole('checkbox')
      await consent.check()
      await expectContrast(consent, 'native')
      await consent.uncheck()
      await expectContrast(consent, 'border')
      await consent.focus()
      await page.keyboard.press('Space')
      await expect(consent).toBeChecked()
      await page.screenshot({ path: `${evidence}/${route}-${theme}.png` })
    }

    await page.getByRole('button', { name: 'Theme', exact: true }).click()
    const themeOption = page.getByRole('menuitemradio', { name: theme === 'light' ? 'Light mode' : 'Dark mode' })
    await expect(themeOption).toHaveAttribute('aria-checked', 'true')
    await expectContrast(themeOption, 'radio')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Language', exact: true }).click()
    const language = page.getByRole('menuitemradio', { name: 'English', exact: true })
    await expect(language).toHaveAttribute('aria-checked', 'true')
    await expectContrast(language, 'radio')
    await page.keyboard.press('Escape')

    await primeUserSession(page)
    await installMockApi(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/console/keys')
    await page.getByRole('button', { name: 'Actions Studio fixture', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Select for batch' }).click()
    const all = page.getByRole('checkbox', { name: 'Select page', exact: true })
    const first = page.getByRole('checkbox', { name: 'Select Studio fixture', exact: true })
    const other = page.getByRole('checkbox', { name: 'Select Automation fixture', exact: true })
    await expect(all).toHaveAttribute('aria-checked', 'mixed')
    await expect(all.locator('.lucide-minus')).toBeVisible()
    await expectContrast(all, 'check')
    await expectContrast(first, 'check')
    await expectContrast(other, 'border')
    await all.click()
    await expect(other).toBeChecked()
    await expect(all.locator('.lucide-check')).toBeVisible()
    await other.uncheck()
    await expect(all).toHaveAttribute('aria-checked', 'mixed')
    await page.screenshot({ path: `${evidence}/keys-${theme}.png` })
    await page.setViewportSize({ width: 390, height: 844 })
    await expectContrast(first, 'check')
    await page.screenshot({ path: `${evidence}/keys-mobile-${theme}.png` })

    await page.goto('/en/console/wallet')
    const amounts = page.getByRole('radiogroup', { name: 'Preset amounts' }).getByRole('radio')
    await expect(amounts).toHaveCount(2)
    await amounts.first().click()
    await expect(amounts.first().locator('.lucide-circle-dot')).toBeVisible()
    await expect(amounts.last().locator('.lucide-circle')).toBeVisible()
    await expectContrast(amounts.first(), 'radio')
    await expectContrast(amounts.last(), 'radio')
    await amounts.last().click()
    await expect(amounts.first()).toHaveAttribute('aria-checked', 'false')
    await expect(amounts.last()).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('radiogroup', { name: 'Preset amounts' }).screenshot({ path: `${evidence}/wallet-${theme}.png` })
  })
}
