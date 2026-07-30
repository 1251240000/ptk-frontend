import { expect, test, type Request } from '@playwright/test'

import { installMockApi, primeUserSession } from './mock-api'

const appLocales = ['zh-CN', 'zh-TW', 'en', 'ja', 'ru', 'fr', 'vi'] as const
const evidenceScreenshots = process.env.PARTOKENS_E2E_EVIDENCE_DIR || '../../dogfood-output/r60-console-staging-validation/screenshots'

function requestBody(request: Request) {
  try {
    return request.postDataJSON() as Record<string, unknown>
  } catch {
    return {}
  }
}

test('legal consent gates password and OAuth sign-in before an ordinary-user redirect', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/en/auth/sign-in')

  const submit = page.getByRole('button', { name: 'Sign in', exact: true })
  await expect(submit).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeDisabled()
  await expect(page.getByLabel('Username or email')).toHaveCount(1)
  await expect(page.getByLabel('Verification code')).toHaveCount(0)

  await page.getByLabel('Username or email').fill('fixture-user')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('checkbox').check()

  await expect(submit).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Continue with LinuxDO' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled()

  await submit.click()
  await page.waitForURL('**/en/console/overview')
  await expect(page.getByRole('heading', { name: /Overview/ })).toBeVisible()
})

test('all seven localized authentication entries remain usable at a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installMockApi(page)

  for (const locale of appLocales) {
    await page.goto(`/${locale}/auth/sign-in`)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.locator('.auth-submit')).toBeVisible()
    await expect(page.getByRole('checkbox')).toBeVisible()
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(hasHorizontalOverflow, `${locale} sign-in overflowed horizontally`).toBe(false)
  }
})

test('email verification is limited to registration and the submitted code is preserved', async ({ page }) => {
  let verificationEmail = ''
  let registration: Record<string, unknown> = {}
  await installMockApi(page, {
    onRequest: (request) => {
      const url = new URL(request.url())
      if (url.pathname === '/api/verification') verificationEmail = url.searchParams.get('email') || ''
      if (url.pathname === '/api/user/register') registration = requestBody(request)
    },
  })
  await page.goto('/en/auth/sign-up')

  await page.getByLabel('Username', { exact: true }).fill('new-fixture-user')
  await page.getByLabel('Email', { exact: true }).fill('new@example.test')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText('Verification code sent')).toBeVisible()
  expect(verificationEmail).toBe('new@example.test')

  await page.getByLabel('Verification code').fill('123456')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByLabel('Confirm password').fill('fixture-password')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()

  await page.waitForURL('**/en/auth/sign-in')
  expect(registration).toMatchObject({
    username: 'new-fixture-user',
    email: 'new@example.test',
    verification_code: '123456',
  })
})

test('administrators leave the standalone locale routes for the native management entry', async ({ page }) => {
  await installMockApi(page, { role: 10 })
  await page.goto('/en/auth/sign-in')
  await page.getByLabel('Username or email').fill('fixture-admin')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL(/\/channels$/)
  expect(new URL(page.url()).pathname).toBe('/channels')
})

test('OAuth callback restores the saved locale and enters the ordinary-user console', async ({ page }) => {
  let callback = ''
  await page.addInitScript(() => window.localStorage.setItem('partokens-oauth-locale', 'fr'))
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/oauth/google') callback = request.url()
    },
  })

  await page.goto('/oauth/google?code=fixture-code&state=fixture-state')
  await page.waitForURL('**/fr/console/overview')
  const callbackUrl = new URL(callback)
  expect(callbackUrl.searchParams.get('code')).toBe('fixture-code')
  expect(callbackUrl.searchParams.get('state')).toBe('fixture-state')
})

test('password login completes the required two-factor route before entering the console', async ({ page }) => {
  let verification: Record<string, unknown> = {}
  await installMockApi(page, {
    requireTwoFactor: true,
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/login/2fa') verification = requestBody(request)
    },
  })
  await page.goto('/en/auth/sign-in')
  await page.getByLabel('Username or email').fill('fixture-user')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL('**/en/auth/otp')

  await page.getByLabel('Verification code').fill('123456')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.waitForURL('**/en/console/overview')
  expect(verification).toEqual({ code: '123456', flow_token: 'fixture-two-factor-flow' })
})

test('API key lifecycle covers create, edit, disable, reveal, and delete', async ({ page }) => {
  const mutations: string[] = []
  await primeUserSession(page)
  await installMockApi(page, {
    onRequest: (request) => {
      const url = new URL(request.url())
      if (url.pathname.startsWith('/api/token') && request.method() !== 'GET') mutations.push(`${request.method()} ${url.pathname}${url.search}`)
    },
  })
  await page.goto('/en/console/keys')

  await page.getByRole('button', { name: 'Create key' }).first().click()
  await page.getByLabel('Name').fill('Phase seven key')
  await page.getByRole('button', { name: 'Create key' }).last().click()
  await expect(page.getByRole('dialog', { name: 'Reveal full key?' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirm reveal' }).click()
  await expect(page.getByText('fixture-key-8')).toBeVisible()
  await page.keyboard.press('Escape')

  let row = page.getByRole('row', { name: /Phase seven key/ })
  await expect(row).toBeVisible()
  await page.getByRole('button', { name: 'Actions Phase seven key' }).click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await page.getByLabel('Name').fill('Phase seven key edited')
  await page.getByRole('button', { name: 'Save changes' }).click()
  row = page.getByRole('row', { name: /Phase seven key edited/ })
  await expect(row).toBeVisible()

  const actions = page.getByRole('button', { name: 'Actions Phase seven key edited' })
  await actions.click()
  await page.getByRole('menuitem', { name: 'Disable' }).click()
  await page.getByRole('dialog', { name: 'Disable this API key?' }).getByRole('button', { name: 'Disable key' }).click()
  await expect(row).toContainText('Disabled')
  await actions.click()
  await page.getByRole('menuitem', { name: 'Reveal' }).click()
  await page.getByRole('button', { name: 'Confirm reveal' }).click()
  await expect(page.getByText('fixture-key-8')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('fixture-key-8')).toHaveCount(0)

  await actions.click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await page.getByRole('dialog', { name: 'Delete this key?' }).getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('row', { name: /Phase seven key edited/ })).toHaveCount(0)
  expect(mutations).toEqual(expect.arrayContaining([
    'POST /api/token/',
    'PUT /api/token/',
    'PUT /api/token/?status_only=true',
    'POST /api/token/8/key',
    'DELETE /api/token/8',
  ]))
})

test('usage-log filters preserve self scope and open a redacted detail drawer', async ({ page }) => {
  let filteredRequest = ''
  await primeUserSession(page)
  await installMockApi(page, {
    onRequest: (request) => {
      const url = new URL(request.url())
      if (url.pathname === '/api/log/self' && url.searchParams.get('request_id')) filteredRequest = request.url()
    },
  })
  await page.goto('/en/console/usage-logs')
  await page.getByRole('textbox', { name: 'Request ID' }).fill('req_fixture')
  await page.getByRole('textbox', { name: 'Request ID' }).press('Enter')
  await expect(page.getByRole('row', { name: /gpt-4.1-mini/ })).toBeVisible()
  expect(new URL(filteredRequest).searchParams.get('request_id')).toBe('req_fixture')

  await page.getByRole('button', { name: /View details req_fixture/ }).first().click()
  await expect(page.getByRole('dialog', { name: 'Request details' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Request content, raw metadata' })).toBeVisible()
  await expect(page.getByText('Fixture completion request')).toHaveCount(0)
  await expect(page.getByText(/billing_mode/)).toHaveCount(0)
})

test('overview uses live fixture state and model filters change the visible catalog', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/overview')

  await expect(page.getByRole('heading', { name: 'Recent usage' })).toBeVisible()
  await expect(page.getByText('Studio fixture', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create a key' })).toHaveAttribute('href', '/en/console/keys')
  await expect(page.getByRole('link', { name: 'Open Playground' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Inspect logs' })).toHaveAttribute('href', '/en/console/usage-logs')
  await expect(page.getByText('/v1/chat/completions').first()).toBeVisible()

  await page.goto('/en/models')
  await expect(page.locator('.model-row')).toHaveCount(2)
  await page.getByLabel('Billing').selectOption('fixed')
  await expect(page.locator('.model-row')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'gpt-image-1' })).toBeVisible()
  await page.getByLabel('Endpoint').selectOption('chat')
  await expect(page.locator('.model-row')).toHaveCount(0)
})

test('public model marketplace explains a deployment-level pricing login requirement', async ({ page }) => {
  await installMockApi(page, { pricingRequiresAuth: true })
  await page.goto('/en/models')
  await expect(page.getByRole('heading', { name: 'Sign in to view model pricing' })).toBeVisible()
  await expect(page.getByText('This deployment requires an account before showing model pricing.')).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute('href', '/en/auth/sign-in')
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0)
})

test('wallet exposes only current presets and revalidates the selected amount at submission', async ({ page }) => {
  let payment: Record<string, unknown> = {}
  await primeUserSession(page)
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/pay') payment = requestBody(request)
    },
  })
  await page.goto('/en/console/wallet')

  await expect(page.getByRole('heading', { name: 'Preset amounts' })).toBeVisible()
  await expect(page.locator('.amount-options button')).toHaveCount(2)
  await expect(page.locator('.amount-options button')).toHaveText([/\$10/, /\$50/])
  await expect(page.locator('input[type="number"]')).toHaveCount(0)

  await page.getByRole('button', { name: /\$50/ }).click()
  await expect(page.getByText('$45.00', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to payment' }).click()
  await expect(page.getByRole('dialog', { name: 'Confirm top-up' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirm and continue' }).click()
  const paymentError = page.getByRole('alert')
  await expect(paymentError).toContainText('Payment fixture stopped before checkout.')
  expect(payment).toMatchObject({ amount: 50, payment_method: 'fixture-pay' })
  await paymentError.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${evidenceScreenshots}/wallet-presets-fixed.png` })
})

test('Playground streams a reply and restores the browser-local conversation after reload', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/playground')

  await expect(page.getByText('Conversation history is stored only in this browser. Partokens does not store your conversation history.').first()).toBeVisible()
  await expect(page.getByLabel('Model')).toHaveValue('gpt-4.1-mini')
  await page.getByPlaceholder('Start with a question').fill('Explain the fixture response.')
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByText('This response arrived through a mocked SSE stream.')).toBeVisible()
  await page.getByText('Reasoning', { exact: true }).click()
  await expect(page.getByText('Checked the fixture.')).toBeVisible()
  await page.reload()
  await expect(page.getByText('This response arrived through a mocked SSE stream.')).toBeVisible()
  await expect(page.getByLabel('Conversation name')).toHaveValue('Explain the fixture response.')
})

test('Image Studio uses a confirmed in-memory key and persists only the generated local asset', async ({ page }) => {
  let usedSessionCredential = false
  await primeUserSession(page)
  await installMockApi(page, {
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/v1/images/generations') {
        usedSessionCredential = request.headers().authorization === 'Bearer fixture-session-token'
      }
    },
  })
  await page.goto('/en/console/studio')

  await expect(page.getByLabel('Canvas name')).toBeVisible()
  await expect(page.locator('.project-row')).toHaveCount(1)
  await page.getByLabel('Prompt', { exact: true }).fill('A precise fixture image')
  await page.getByRole('combobox', { name: 'Model' }).selectOption('gpt-image-1')
  await page.getByRole('combobox', { name: 'Existing key' }).selectOption('7')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Unlock for session' }).click()
  await expect(page.getByText('Unlocked', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Generate images' }).click()
  await expect(page.getByRole('status')).toContainText('Images added to the local canvas')
  await expect(page.locator('.canvas-node.result strong', { hasText: 'Generated image 1' })).toBeVisible()
  expect(usedSessionCredential).toBe(true)

  const tokenPersisted = await page.evaluate(async () => {
    const marker = 'fixture-session-token'
    if (`${JSON.stringify(localStorage)}${JSON.stringify(sessionStorage)}`.includes(marker)) return true
    const databases = await indexedDB.databases()
    for (const database of databases) {
      if (!database.name) continue
      const values = await new Promise<unknown[]>((resolve, reject) => {
        const open = indexedDB.open(database.name!)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const instance = open.result
          const stores = Array.from(instance.objectStoreNames)
          if (!stores.length) { instance.close(); resolve([]); return }
          const transaction = instance.transaction(stores, 'readonly')
          const collected: unknown[] = []
          for (const storeName of stores) {
            const request = transaction.objectStore(storeName).getAll()
            request.onsuccess = () => collected.push(...request.result)
          }
          transaction.onerror = () => reject(transaction.error)
          transaction.oncomplete = () => { instance.close(); resolve(collected) }
        }
      })
      if (JSON.stringify(values).includes(marker)) return true
    }
    return false
  })
  expect(tokenPersisted).toBe(false)

  await page.reload()
  await expect(page.locator('.canvas-node.result strong', { hasText: 'Generated image 1' })).toBeVisible()
  await expect(page.locator('.project-row')).toHaveCount(1)
  await expect(page.getByText('Locked', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Unlock for session' })).toBeVisible()
  await page.screenshot({ path: `${evidenceScreenshots}/studio-local-asset-fixed.png` })
})
