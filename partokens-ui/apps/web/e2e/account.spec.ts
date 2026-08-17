import { expect, test, type Request } from '@playwright/test'

import { installMockApi, primeUserSession } from './mock-api'

function requestBody(request: Request) {
  try {
    return request.postDataJSON() as Record<string, unknown>
  } catch {
    return {}
  }
}

test('Profile tasks keep one canonical route across links, reload, history, and legacy intents', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/profile')

  await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible()
  const tabs = page.getByRole('tab')
  await expect(tabs).toHaveCount(4)
  await expect(page.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('tab', { name: 'Security' }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get('tab')).toBe('security')
  await expect(page.getByText('Two-factor authentication')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Security' })).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('tab', { name: 'Connections' }).click()
  await expect(page.getByText('Account bindings')).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('tab', { name: 'Security' })).toHaveAttribute('aria-selected', 'true')
  await page.goForward()
  await expect(page.getByRole('tab', { name: 'Connections' })).toHaveAttribute('aria-selected', 'true')

  await page.goto('/en/console-notifications')
  await expect.poll(() => new URL(page.url()).pathname).toBe('/en/console/profile')
  expect(new URL(page.url()).searchParams.get('tab')).toBe('notifications')
  await expect(page.getByRole('tab', { name: 'Notifications' })).toHaveAttribute('aria-selected', 'true')
})

test('Profile tabs support keyboard navigation and keep Account content inside the active task', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/profile')

  const profileTab = page.getByRole('tab', { name: 'Profile' })
  await profileTab.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Security' })).toBeFocused()
  await expect(page.getByRole('tab', { name: 'Security' })).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: 'Notifications' })).toBeFocused()
  await expect(page.getByText('Notifications and behavior')).toBeVisible()
  await expect(page.getByText('Account bindings')).toHaveCount(0)
})

test('Connections merges configured providers with bindings and confirms account changes', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/profile?tab=connections')

  const enterprise = page.getByRole('article', { name: 'Enterprise SSO' })
  await expect(enterprise).toContainText('Available to connect')
  const connectTrigger = enterprise.getByRole('button', { name: 'Connect' })
  await connectTrigger.click()
  const connectDialog = page.getByRole('dialog', { name: 'Connect account' })
  await expect(connectDialog).toContainText('Enterprise SSO')
  await connectDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(connectTrigger).toBeFocused()

  const google = page.getByRole('article', { name: 'Google' })
  await expect(google).toContainText('fixture-google')
  const disconnectTrigger = google.getByRole('button', { name: 'Disconnect' })
  await disconnectTrigger.click()
  const disconnectDialog = page.getByRole('dialog', { name: 'Disconnect account' })
  await expect(disconnectDialog).toContainText('Google')
  await disconnectDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(disconnectTrigger).toBeFocused()
})

test('Wallet renders only configured amounts and server-backed billing data', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/wallet')

  await expect(page.getByRole('heading', { name: 'Wallet', level: 1 })).toBeVisible()
  const amounts = page.getByRole('radio')
  await expect(amounts).toHaveCount(2)
  await expect(amounts.nth(0)).toContainText('$10')
  await expect(amounts.nth(1)).toContainText('$50')
  const builderPlan = page.getByRole('article', { name: 'Builder' })
  await expect(builderPlan).toBeVisible()
  const builderPlanText = await builderPlan.evaluate((element) => element.textContent || '')
  const quotaIndex = builderPlanText.indexOf('Quota')
  const priceIndex = builderPlanText.indexOf('Price')
  expect(quotaIndex).toBeGreaterThanOrEqual(0)
  expect(priceIndex).toBeGreaterThanOrEqual(0)
  expect(quotaIndex).toBeLessThan(priceIndex)
  await expect(page.getByText('FIXTURE-ORDER-19')).toBeVisible()
  await expect(page.getByText('$25.00')).toHaveCount(0)
  await expect(page.getByText('Starter recommendation')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Transfer to balance' })).toBeVisible()
  await expect(page.getByPlaceholder('xxxxxxxx')).toBeVisible()
  const rewardCells = page.getByRole('heading', { name: 'Affiliate rewards' }).locator('xpath=ancestor::section[1]').locator('> div.grid > div')
  await expect(rewardCells).toHaveCount(3)
  const rewardHeights = await rewardCells.evaluateAll((cells) => cells.map((cell) => Math.round(cell.getBoundingClientRect().height)))
  expect(new Set(rewardHeights).size).toBe(1)

  const activeTrigger = page.getByRole('button', { name: 'View active (1)' })
  await activeTrigger.click()
  const activeDialog = page.getByRole('dialog', { name: 'Active subscriptions' })
  await expect(activeDialog).toContainText('Builder')
  await expect(activeDialog).toContainText('Total quota')
  await activeDialog.getByRole('button', { name: 'Close', exact: true }).first().click()
  await expect(activeTrigger).toBeFocused()

  const subscribe = page.getByRole('button', { name: 'Subscribe' })
  await subscribe.click()
  const subscribeDialog = page.getByRole('dialog', { name: 'Confirm subscription' })
  const paymentMethod = subscribeDialog.getByRole('combobox', { name: 'Payment method' })
  await expect(paymentMethod).toHaveText('Balance')
  const purchaseSummaryBox = await subscribeDialog.locator('div.rounded-md.border.text-sm').first().boundingBox()
  const paymentMethodBox = await paymentMethod.boundingBox()
  if (!purchaseSummaryBox || !paymentMethodBox) throw new Error('Payment method layout could not be measured')
  expect(paymentMethodBox.width).toBeLessThan(purchaseSummaryBox.width)
  expect(paymentMethodBox.x + paymentMethodBox.width).toBeGreaterThan(purchaseSummaryBox.x + purchaseSummaryBox.width - 20)
  await subscribeDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(subscribe).toBeFocused()
})

test('Wallet recommends the starter plan only when no subscription is active', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page, { activeSubscriptions: false })
  await page.goto('/en/console/wallet')

  const builder = page.getByRole('article', { name: 'Builder' })
  await expect(builder).toContainText('Starter recommendation')
  await expect(builder.getByText('$20', { exact: true })).toBeVisible()
  await expect(builder.getByText('$5', { exact: true })).toBeVisible()
})

test('redacted notification secrets remain configured and are omitted when unchanged', async ({ page }) => {
  let settingsPayload: Record<string, unknown> = {}
  await primeUserSession(page)
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/setting' && request.method() === 'PUT') settingsPayload = requestBody(request)
    },
  })
  await page.goto('/en/console/profile?tab=notifications')

  const secret = page.getByLabel('Webhook secret')
  await expect(secret).toHaveValue('')
  await expect(secret).toHaveAttribute('placeholder', 'Configured')
  await page.getByLabel('Balance warning in USD').fill('6')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Preferences updated')).toBeVisible()

  expect(settingsPayload.quota_warning_threshold).toBe(3_000_000)
  expect(settingsPayload).not.toHaveProperty('webhook_secret')
  expect(JSON.stringify(settingsPayload)).not.toContain('configured')
})

test('stored notification secrets stay out of the form and survive unrelated preference updates', async ({ page }) => {
  const storedSecret = 'fixture-existing-webhook-secret'
  let settingsPayload: Record<string, unknown> = {}
  await primeUserSession(page)
  await installMockApi(page, {
    userSetting: {
      notify_type: 'webhook',
      quota_warning_threshold: 500_000,
      webhook_url: 'https://hooks.example.test/account',
      webhook_secret: storedSecret,
      language: 'en',
    },
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/setting' && request.method() === 'PUT') settingsPayload = requestBody(request)
    },
  })
  await page.goto('/en/console/profile?tab=notifications')

  const secret = page.getByLabel('Webhook secret')
  await expect(secret).toHaveValue('')
  await expect(page.locator('body')).not.toContainText(storedSecret)
  await page.getByLabel('Balance warning in USD').fill('7')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Preferences updated')).toBeVisible()

  expect(settingsPayload.quota_warning_threshold).toBe(3_500_000)
  expect(settingsPayload.webhook_secret).toBe(storedSecret)
})

test('Account security overlays complete the protected credential workflows', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/profile?tab=security')

  await page.getByRole('button', { name: 'Set up 2FA' }).click()
  const setupDialog = page.getByRole('dialog', { name: 'Set up 2FA' })
  await expect(setupDialog).toBeVisible()
  await expect(setupDialog.getByText('Manual setup key')).toBeVisible()
  await setupDialog.getByLabel('Authenticator code').fill('123456')
  await setupDialog.getByRole('button', { name: 'Enable 2FA' }).click()

  const backupDialog = page.getByRole('dialog', { name: 'New backup codes' })
  await expect(backupDialog).toBeVisible()
  await expect(backupDialog.getByText('BACKUP-1001')).toBeVisible()
  await backupDialog.getByRole('button', { name: 'Done' }).click()

  await page.getByRole('button', { name: 'Register Passkey' }).click()
  const passkeyDialog = page.getByRole('dialog', { name: 'Register Passkey' })
  await expect(passkeyDialog.getByLabel('Authenticator or backup code')).toBeVisible()
  await passkeyDialog.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: 'Generate token' }).click()
  const tokenDialog = page.getByRole('dialog', { name: 'Generate access token?' })
  await expect(tokenDialog).toBeVisible()
  await tokenDialog.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByText('fixture-transient-system-token')).toBeVisible()

  await page.setViewportSize({ width: 320, height: 720 })
  await page.getByRole('button', { name: 'Delete account' }).click()
  const deleteDialog = page.getByRole('dialog', { name: 'Delete account' })
  await expect(deleteDialog).toBeVisible()
  await deleteDialog.getByLabel('Password').fill('fixture-password')
  await deleteDialog.getByLabel(/Type username to confirm/).fill('wrong-user')
  await expect(deleteDialog.getByRole('button', { name: 'Permanently delete' })).toBeDisabled()
  await deleteDialog.getByLabel(/Type username to confirm/).fill('fixture-user')
  await expect(deleteDialog.getByRole('button', { name: 'Permanently delete' })).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('Account pages remain free of horizontal overflow at supported narrow viewports', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 })
    for (const path of ['/en/console/wallet', '/en/console/profile', '/en/console/profile?tab=security', '/en/console/profile?tab=connections', '/en/console/profile?tab=notifications']) {
      await page.goto(path)
      await expect(page.locator('[data-account-page]')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${path} overflowed at ${width}px`).toBe(true)
    }
  }
})
