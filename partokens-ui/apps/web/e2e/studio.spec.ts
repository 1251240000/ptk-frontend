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
    await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0)
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
  await expect(dialog.getByRole('button', { name: 'Create key' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toHaveCount(0)
  await dialog.getByRole('combobox', { name: 'API key' }).click()
  await page.getByRole('option', { name: 'Studio fixture' }).click()
  await dialog.getByRole('button', { name: 'Continue generating' }).click()
  await expect(page.getByRole('img', { name: 'Keep this composition, Variation 1' })).toBeVisible()
  expect(editRequest).toBe(true)

  await page.getByRole('button', { name: 'Remove reference image' }).click()
  await expect(page.getByRole('button', { name: 'Upload reference' })).toBeVisible()
})

test('Studio restores the latest generated result after leaving the page', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/studio')

  const generate = async (prompt: string, unlock = false) => {
    await page.getByLabel('Prompt', { exact: true }).fill(prompt)
    await page.getByRole('button', { name: 'Generate' }).click()
    if (unlock) {
      const dialog = page.getByRole('dialog', { name: 'API key required' })
      await dialog.getByRole('combobox', { name: 'API key' }).click()
      await page.getByRole('option', { name: 'Studio fixture' }).click()
      await dialog.getByRole('button', { name: 'Continue generating' }).click()
    }
    await expect(page.getByRole('img', { name: `${prompt}, Variation 1` })).toBeVisible()
  }

  await generate('First persisted result', true)
  await generate('Latest persisted result')
  await page.getByRole('link', { name: 'Overview' }).click()
  await page.getByRole('link', { name: 'Image studio' }).click()

  await expect(page.getByRole('img', { name: 'Latest persisted result, Variation 1' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'First persisted result, Variation 1' })).toHaveCount(0)
})

test('Studio uses existing user-created keys from the Image group only', async ({ page }) => {
  let requestedModelGroup: string | null = null
  let tokenListRequests = 0
  await primeUserSession(page)
  await installMockApi(page, {
    tokens: [
      {
        id: 6,
        name: 'My existing key',
        key: 'EFGH**********QRST',
        status: 1,
        group: 'Image',
        remain_quota: 1_000_000,
        used_quota: 0,
        unlimited_quota: false,
        expired_time: -1,
        created_time: 1_719_000_000,
        accessed_time: 1_719_000_000,
        model_limits_enabled: false,
        model_limits: '',
        allow_ips: '',
        cross_group_retry: false,
      },
      {
        id: 8,
        name: 'Default group key',
        key: 'IJKL**********UVWX',
        status: 1,
        group: 'default',
        remain_quota: 1_000_000,
        used_quota: 0,
        unlimited_quota: false,
        expired_time: -1,
        created_time: 1_719_000_001,
        accessed_time: 1_719_000_001,
        model_limits_enabled: false,
        model_limits: '',
        allow_ips: '',
        cross_group_retry: false,
      },
    ],
    onRequest: (request) => {
      const url = new URL(request.url())
      if (url.pathname === '/api/user/models') requestedModelGroup = url.searchParams.get('group')
      if (url.pathname === '/api/token/' && request.method() === 'GET') tokenListRequests += 1
    },
  })
  await page.goto('/en/console/studio')
  await expect.poll(() => requestedModelGroup).toBe('Image')
  await expect.poll(() => tokenListRequests).toBe(1)
  await page.getByRole('link', { name: 'Overview' }).click()
  await page.getByRole('link', { name: 'Image studio' }).click()
  await page.getByLabel('Prompt', { exact: true }).fill('Use my existing key')
  await page.getByRole('button', { name: 'Generate' }).click()

  const dialog = page.getByRole('dialog', { name: 'API key required' })
  await dialog.getByRole('combobox', { name: 'API key' }).click()
  await expect(page.getByRole('option', { name: /Default group key/ })).toHaveCount(0)
  await page.getByRole('option', { name: 'My existing key' }).click()
  await dialog.getByRole('button', { name: 'Continue generating' }).click()
  await expect(page.getByRole('img', { name: 'Use my existing key, Variation 1', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Local result history' })).toHaveCount(0)
})

test('Studio does not treat an incompatible Image key as no key', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page, {
    tokens: [{
      id: 9,
      name: 'Existing restricted image key',
      key: 'QRST**********UVWX',
      status: 1,
      group: 'Image',
      remain_quota: 1_000_000,
      used_quota: 0,
      unlimited_quota: false,
      expired_time: -1,
      created_time: 1_719_000_002,
      accessed_time: 1_719_000_002,
      model_limits_enabled: true,
      model_limits: 'another-image-model',
      allow_ips: '',
      cross_group_retry: false,
    }],
  })
  await page.goto('/en/console/studio')
  await page.getByLabel('Prompt', { exact: true }).fill('Use the existing image key')
  await page.getByRole('button', { name: 'Generate' }).click()

  const dialog = page.getByRole('dialog', { name: 'API key required' })
  await expect(dialog.getByRole('combobox', { name: 'API key' })).toContainText('Existing restricted image key')
  await expect(dialog.getByRole('button', { name: 'Continue generating' })).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Create key' })).toHaveCount(0)
  await expect(dialog.getByRole('link', { name: 'Open API keys' })).toHaveCount(0)
})

test('Studio sends a custom image size and ten requested images', async ({ page }) => {
  let generationPayload: Record<string, unknown> | null = null
  await primeUserSession(page)
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/v1/images/generations') generationPayload = request.postDataJSON() as Record<string, unknown>
    },
  })
  await page.goto('/en/console/studio')
  await page.getByRole('combobox', { name: 'Model' }).click()
  await expect(page.getByRole('option', { name: 'gpt-4.1-mini' })).toHaveCount(0)
  await expect(page.getByRole('option', { name: 'gemini-3-pro-image-preview' })).toHaveCount(0)
  await expect(page.getByRole('option', { name: 'gpt-image-1' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByLabel('Prompt', { exact: true }).fill('A custom landscape')
  await page.getByRole('combobox', { name: 'Image size' }).click()
  await page.getByRole('option', { name: 'Custom size' }).click()
  await page.getByLabel('Width').fill('')
  await page.getByLabel('Width').pressSequentially('1600')
  await page.getByLabel('Height').fill('')
  await page.getByLabel('Height').pressSequentially('1024')
  await expect(page.getByLabel('Width')).toHaveValue('1600')
  await expect(page.getByLabel('Height')).toHaveValue('1024')
  await page.getByRole('button', { name: '10', exact: true }).click()
  await page.getByRole('button', { name: 'Generate' }).click()
  const dialog = page.getByRole('dialog', { name: 'API key required' })
  await dialog.getByRole('combobox', { name: 'API key' }).click()
  await page.getByRole('option', { name: 'Studio fixture' }).click()
  await dialog.getByRole('button', { name: 'Continue generating' }).click()
  await expect(page.getByRole('img', { name: 'A custom landscape, Variation 1', exact: true })).toBeVisible()
  expect(generationPayload).toMatchObject({ size: '1600x1024', n: 10 })
  await expect(page.getByRole('img', { name: /A custom landscape, Variation/ })).toHaveCount(10)
  await expect(page.getByText('Square · 1 x 1').first()).toBeVisible()
  await expect(page.getByText('Landscape · 1600 x 900')).toHaveCount(0)

  await page.getByRole('img', { name: 'A custom landscape, Variation 1', exact: true }).hover()
  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download image' }).first().click()
  expect((await download).suggestedFilename()).toBe('partokens-image-1.png')
  await page.getByRole('button', { name: 'Use as reference' }).first().click()
  await expect(page.getByRole('img', { name: 'Reference preview' })).toBeVisible()
})

test('Studio shows create and open actions when no key exists, without a quota field', async ({ page }) => {
  let createPayload: Record<string, unknown> | null = null
  await primeUserSession(page)
  await installMockApi(page, {
    tokens: [],
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/token/' && request.method() === 'POST') createPayload = request.postDataJSON() as Record<string, unknown>
    },
  })
  await page.goto('/en/console/studio')
  await page.getByLabel('Prompt', { exact: true }).fill('A dedicated key fixture')
  await page.getByRole('button', { name: 'Generate' }).click()

  const keyDialog = page.getByRole('dialog', { name: 'API key required' })
  await expect(keyDialog.getByRole('button', { name: 'Create key' })).toBeVisible()
  await expect(keyDialog.getByRole('link', { name: 'Open API keys' })).toBeVisible()
  await expect(keyDialog.getByRole('button', { name: 'Continue generating' })).toHaveCount(0)
  await expect(keyDialog.getByRole('button', { name: 'Cancel' })).toHaveCount(0)
  await keyDialog.getByRole('button', { name: 'Create key' }).click()
  const createDialog = page.getByRole('dialog', { name: 'Create dedicated key' })
  await createDialog.getByLabel('Name').fill('On-demand image key')
  await expect(createDialog.getByLabel('Quota limit')).toHaveCount(0)
  await createDialog.getByRole('button', { name: 'Create key' }).click()

  await expect(keyDialog).toBeVisible()
  await expect(keyDialog.getByRole('combobox', { name: 'API key' })).toContainText('On-demand image key')
  expect(createPayload).toMatchObject({
    name: 'On-demand image key',
    group: 'Image',
    model_limits_enabled: true,
    model_limits: 'gpt-image-1',
    remain_quota: 0,
    unlimited_quota: true,
  })
})
