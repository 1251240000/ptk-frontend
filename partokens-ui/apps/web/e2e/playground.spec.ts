import { expect, test } from '@playwright/test'

import { installMockApi, primeUserSession } from './mock-api'

test('Playground can select a model before creating the first conversation', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/playground')

  await expect(page.getByRole('button', { name: /Model and group.*gpt-4\.1-mini/ })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Conversation actions' })).toHaveCount(0)
  await page.getByRole('button', { name: /Model and group.*gpt-4\.1-mini/ }).click()
  const selectionDialog = page.getByRole('dialog', { name: 'Model and group' })
  await selectionDialog.getByRole('button', { name: 'Save' }).click()
  await page.getByPlaceholder('Enter a message').fill('Start without a new chat button.')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('This response arrived through a mocked SSE stream.')).toBeVisible()
})

test('Playground keeps failed model requests visible in the assistant reply', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page, { playgroundFailure: true })
  await page.goto('/en/console/playground')

  await page.getByPlaceholder('Enter a message').fill('Trigger a failed model request.')
  await page.getByRole('button', { name: 'Send' }).click()

  const assistantError = page.locator('[data-playground-message-error]')
  await expect(assistantError).toBeVisible()
  await expect(assistantError).toHaveText('The model request failed: "Upstream fixture failed"')
  await expect(page.getByText('Failed', { exact: true })).toBeVisible()
  await expect(page.locator('form')).not.toContainText('Upstream fixture failed')
})

test('Playground keeps model selection and parameter controls in accessible overlays', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/playground')

  await page.getByRole('button', { name: 'New chat' }).click()
  const modelButton = page.getByRole('button', { name: /Model and group.*gpt-4\.1-mini/ })
  await modelButton.click()
  const selectionDialog = page.getByRole('dialog', { name: 'Model and group' })
  await expect(selectionDialog.getByRole('combobox', { name: 'Group' })).toHaveText('default')
  await expect(selectionDialog.getByRole('combobox', { name: 'Model' })).toHaveText('gpt-4.1-mini')
  await selectionDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(modelButton).toBeFocused()

  await page.getByRole('button', { name: 'Generation parameters' }).click()
  const parameterDialog = page.getByRole('dialog', { name: 'Generation parameters' })
  await expect(parameterDialog.getByRole('switch', { name: 'Streaming' })).toBeChecked()
  await parameterDialog.getByRole('spinbutton', { name: 'Max tokens' }).fill('2048')
  await parameterDialog.getByRole('button', { name: 'Save parameters' }).click()
  await expect(page.getByText('Parameters saved', { exact: true })).toBeVisible()
})

test('Playground exposes rename, pin, and delete actions for the current conversation', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/playground')
  await page.getByRole('button', { name: 'New chat' }).click()

  await page.getByRole('button', { name: 'Conversation actions' }).click()
  await expect(page.getByRole('menuitem', { name: 'Pin conversation' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Pin conversation' }).click()
  await expect(page.getByText('Conversation pinned', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Conversation actions' }).click()
  await page.getByRole('menuitem', { name: 'Rename conversation' }).click()
  const renameDialog = page.getByRole('dialog', { name: 'Rename conversation' })
  await renameDialog.getByRole('textbox', { name: 'Conversation name' }).fill('Pinned fixture chat')
  await renameDialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { name: 'Pinned fixture chat' })).toBeVisible()

  await page.getByRole('button', { name: 'Conversation actions' }).click()
  await page.getByRole('menuitem', { name: 'Delete conversation' }).click()
  await page.getByRole('dialog', { name: 'Delete conversation' }).getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Conversation deleted', { exact: true })).toBeVisible()
})

test('Playground mobile history uses one sheet and restores focus without page overflow', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/en/console/playground')

  const historyTrigger = page.getByRole('button', { name: 'Open conversation history' })
  await historyTrigger.click()
  await expect(page.getByRole('heading', { name: 'Conversation history' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden')
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(historyTrigger).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('Playground delete confirmation is explicit and scoped to the selected conversation', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/playground')
  await page.getByRole('button', { name: 'New chat' }).click()

  await page.getByRole('button', { name: 'Delete conversation' }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete conversation' })
  await expect(dialog).toContainText('Delete this conversation from this browser?')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { name: 'New conversation' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete conversation' }).click()
  await page.getByRole('dialog', { name: 'Delete conversation' }).getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Start a new chat' })).toBeVisible()
})

test('Playground stays within the viewport at supported narrow and medium widths', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: width === 320 ? 720 : 844 })
    await page.goto('/en/console/playground')
    await expect(page.locator('[data-playground-page]')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `overflow at ${width}px`).toBe(true)
  }
})
