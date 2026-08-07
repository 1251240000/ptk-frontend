import { expect, test } from '@playwright/test'

import { installMockApi, primeUserSession } from './mock-api'

test('Studio preserves the active design-lab composition across supported widths', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 320 ? 720 : width <= 390 ? 844 : 900 })
    await page.goto('/en/console/studio')
    await expect(page.getByRole('heading', { name: 'Image studio', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Generation settings' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No images yet' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Studio overflowed at ${width}px`).toBe(true)
  }
})

test('Studio reference upload uses the edit endpoint and remains replaceable', async ({ page }) => {
  let editRequest = false
  await primeUserSession(page)
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/v1/images/edits') editRequest = true
    },
  })
  await page.goto('/en/console/studio')
  await page.getByRole('button', { name: 'Upload reference' }).click()
  await page.locator('input[type=file]').setInputFiles({
    name: 'reference.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  })
  await expect(page.getByRole('img', { name: 'Reference preview' })).toBeVisible()

  await page.getByLabel('Prompt', { exact: true }).fill('Keep this composition')
  await page.getByRole('button', { name: 'Generate' }).click()
  const dialog = page.getByRole('dialog', { name: 'API key required' })
  await dialog.getByRole('combobox', { name: 'API key' }).click()
  await page.getByRole('option', { name: 'Studio fixture' }).click()
  await dialog.getByRole('button', { name: 'Unlock and generate' }).click()
  await expect(page.getByRole('img', { name: 'Keep this composition, Variation 1' })).toBeVisible()
  expect(editRequest).toBe(true)

  await page.getByRole('button', { name: 'Remove reference image' }).click()
  await expect(page.getByRole('button', { name: 'Upload reference' })).toBeVisible()
})
