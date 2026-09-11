import { expect, test, type Request } from '@playwright/test'

import { installMockAdminApi, installMockApi, primeUserSession } from './mock-api'

const appLocales = ['zh-CN', 'zh-TW', 'en', 'ja', 'ru', 'fr', 'vi'] as const
const evidenceScreenshots = process.env.PARTOKENS_E2E_EVIDENCE_DIR || '../../dogfood-output/r60-console-staging-validation/screenshots'

test('channel table is flat and supports model health, latency, filters and actions', async ({ page }) => {
  await installMockApi(page, { role: 100 })
  const channel = {
    id: 'lc_table', name: 'OpenAI 主渠道', channel_type: 1, base_url: 'https://api.example.test',
    credential_fingerprint: 'sha256:1234...abcd', cost_ratio: 1.125, note: '', template_channel_id: 10,
    masked_key: 'sk-abc.....abcd',
    models: ['gpt-4.1-mini', 'slow-model', 'retired-model', 'untested-model'], enabled: true, state: 'active',
    status: 'available', groups: 2, attempt_layers: 1, record_count: 3, latest_test_time: 1777000000,
    response_time: 180, physical_records: [], updated_at: 1777000000,
    latest_model_results: [
      { model_id: 'gpt-4.1-mini', status: 'available', latency_ms: 180, tested_at: 1777000000 },
      { model_id: 'slow-model', status: 'available', latency_ms: 3500, tested_at: 1777000000 },
      { model_id: 'retired-model', status: 'unavailable', latency_ms: 90, tested_at: 1777000000 },
    ],
  }
  let channels = [channel, { ...channel, id: 'lc_other', name: '备用渠道', enabled: false, status: 'disabled', models: [] }]
  const routes = ['default', 'premium'].map((group_name) => ({ group_name, revision: 1, config: { layers: [{ members: [{ logical_id: channel.id, weight: 100 }] }] }, updated_at: 1777000000, updated_by: 'root' }))
  let deletions = 0
  const patches: Record<string, unknown>[] = []
  let failSave = false
  await page.route('**/admin-api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (route.request().method() === 'PATCH') {
      if (failSave) return route.fulfill({ status: 503, json: { success: false, message: '保存失败，请重试' } })
      const patch = route.request().postDataJSON()
      patches.push(patch)
      channels = channels.map((item) => path.endsWith(item.id) ? { ...item, ...patch } : item)
    }
    if (route.request().method() === 'DELETE') {
      deletions += 1
      channels = channels.filter((item) => !path.endsWith(item.id))
    }
    if (path.endsWith('/status')) channels = channels.map((item) => path.includes(item.id) ? { ...item, enabled: route.request().postDataJSON().enabled } : item)
    await route.fulfill({ json: { success: true, data: path.endsWith('/bootstrap') ? { channels, routes, groups: ['default', 'premium'], retry_times: 2, monitor: null, changes: [] } : {} } })
  })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/zh-CN/console/admin/channels')
  await expect(page.getByRole('table')).toHaveCount(1)
  await expect(page.getByRole('columnheader')).toHaveText(['渠道名', '渠道类型', '地址', '密钥', '倍率', '模型配置', '绑定分组', '操作'])
  await expect(page.locator('tbody tr')).toHaveCount(2)
  const firstRow = page.locator('tbody tr').first()
  await expect(firstRow.getByLabel('脱敏密钥')).toHaveText('sk-abc.....abcd')
  await expect(firstRow.getByRole('img', { name: 'OpenAI' })).toBeVisible()
  await firstRow.getByRole('img', { name: 'OpenAI' }).hover()
  await expect(page.getByRole('tooltip')).toHaveText('OpenAI')
  await expect(page.getByRole('button', { name: '编辑渠道', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '模型配置', exact: true })).toHaveCount(0)
  await expect(firstRow.locator('td').last().getByRole('button')).toHaveCount(3)
  const actionColors = await page.locator('tbody tr').evaluateAll((rows) => rows.flatMap((row) => Array.from(row.querySelectorAll('td:last-child button')).map((button) => ({ label: button.getAttribute('aria-label'), color: getComputedStyle(button).color }))))
  expect(new Set(actionColors.map(({ color }) => color)).size).toBe(4)
  await firstRow.getByRole('button', { name: '编辑渠道名：OpenAI 主渠道', exact: true }).click()
  await page.getByRole('textbox', { name: '编辑渠道名', exact: true }).fill('取消的名称')
  await page.getByRole('button', { name: '取消编辑渠道名', exact: true }).click()
  expect(patches).toEqual([])
  await firstRow.getByRole('button', { name: '编辑渠道名：OpenAI 主渠道', exact: true }).click()
  await page.getByRole('textbox', { name: '编辑渠道名', exact: true }).fill('OpenAI 新名称')
  failSave = true
  await page.getByRole('button', { name: '保存渠道名', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('保存失败，请重试')
  await expect(page.getByRole('textbox', { name: '编辑渠道名', exact: true })).toHaveValue('OpenAI 新名称')
  failSave = false
  await page.getByRole('button', { name: '保存渠道名', exact: true }).click()
  await expect(firstRow).toContainText('OpenAI 新名称')
  expect(patches).toEqual([{ name: 'OpenAI 新名称' }])
  await firstRow.getByRole('button', { name: '编辑倍率：1.125x', exact: true }).click()
  await page.getByRole('textbox', { name: '编辑倍率', exact: true }).fill('-1')
  await page.getByRole('button', { name: '保存倍率', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('倍率必须为非负数')
  await page.getByRole('textbox', { name: '编辑倍率', exact: true }).fill('0')
  await page.getByRole('button', { name: '保存倍率', exact: true }).click()
  await expect(firstRow.getByRole('button', { name: '编辑倍率：0.000x', exact: true })).toBeVisible()
  expect(patches[1]).toEqual({ cost_ratio: 0 })
  await firstRow.locator('[data-model-status]').first().click()
  await expect(page.getByRole('heading', { name: 'OpenAI 新名称 · 模型配置', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '配置渠道模型', exact: true }).click()
  await expect(page.getByRole('heading', { name: '备用渠道 · 模型配置', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('上游地址', { exact: true })).toHaveCount(0)
  await expect(page.getByText('密钥变体', { exact: true })).toHaveCount(0)
  await expect(page.locator('[data-model-status="available"]')).toHaveText('gpt-4.1-mini')
  await expect(page.locator('[data-model-status="slow"]')).toHaveText('slow-model')
  await expect(page.locator('[data-model-status="unavailable"]')).toHaveText('retired-model')
  await expect(page.locator('[data-model-status="unknown"]')).toHaveText('untested-model')
  await expect(page.locator('tbody tr').first()).toContainText('default')
  await expect(page.locator('tbody tr').first()).toContainText('premium')
  await page.getByRole('switch', { name: '显示延迟 ms' }).click()
  await expect(page.locator('[data-model-status="available"]')).toContainText('180 ms')
  await expect(page.locator('[data-model-status="slow"]')).toContainText('3500 ms')
  await page.screenshot({ path: '/tmp/partokens-channels-desktop.png', fullPage: true })
  await page.getByRole('switch', { name: '显示延迟 ms' }).click()
  await expect(page.getByText('180 ms', { exact: true })).toHaveCount(0)
  await page.getByLabel('搜索渠道').fill('premium')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await page.getByLabel('搜索渠道').fill('missing')
  await expect(page.getByText('没有匹配的渠道')).toBeVisible()
  await page.getByLabel('搜索渠道').fill('')
  await page.getByRole('button', { name: '复制渠道', exact: true }).first().click()
  await expect(page.getByLabel('显示名称')).toHaveValue('OpenAI 新名称 · 副本')
  await expect(page.getByLabel('API 密钥', { exact: true })).toHaveValue('')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '禁用渠道', exact: true }).click()
  await expect(page.getByRole('button', { name: '启用渠道', exact: true })).toHaveCount(2)
  await page.getByRole('button', { name: '删除渠道', exact: true }).first().click()
  await expect(page.getByRole('button', { name: '确认删除' })).toBeDisabled()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  expect(deletions).toBe(0)
  await page.getByRole('button', { name: '删除渠道', exact: true }).last().click()
  await page.getByRole('button', { name: '确认删除' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  expect(deletions).toBe(1)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('[data-slot="table-container"]').evaluate((element) => { element.scrollLeft = 0 })
  await firstRow.getByRole('button', { name: '编辑渠道名：OpenAI 新名称', exact: true }).click()
  await page.getByRole('textbox', { name: '编辑渠道名', exact: true }).fill('手机端名称')
  await page.getByRole('button', { name: '保存渠道名', exact: true }).click()
  await expect(firstRow).toContainText('手机端名称')
  await page.screenshot({ path: '/tmp/partokens-channels-mobile.png', fullPage: true })
  await page.locator('[data-slot="table-container"]').evaluate((element) => { element.scrollLeft = element.scrollWidth })
  await expect(firstRow.getByRole('button', { name: '删除渠道', exact: true })).toBeInViewport()
  await page.screenshot({ path: '/tmp/partokens-channels-mobile-actions.png', fullPage: true })
  await page.addInitScript(() => localStorage.setItem('partokens-theme', 'dark'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await page.locator('[data-slot="table-container"]').evaluate((element) => { element.scrollLeft = element.scrollWidth })
  await page.screenshot({ path: '/tmp/partokens-channels-mobile-dark.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(await page.locator('[data-slot="table-container"]').evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
})

function requestBody(request: Request) {
  try {
    return request.postDataJSON() as Record<string, unknown>
  } catch {
    return {}
  }
}

test('legal consent defaults checked and still gates password and OAuth sign-in', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/en/auth/sign-in')

  const submit = page.getByRole('button', { name: 'Sign in', exact: true })
  const consent = page.getByRole('checkbox')
  await expect(consent).toBeChecked()
  await expect(submit).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeEnabled()
  await expect(page.getByLabel('Username or email')).toHaveCount(1)
  await expect(page.getByLabel('Verification code')).toHaveCount(0)

  await page.getByLabel('Username or email').fill('fixture-user')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await consent.uncheck()
  await expect(submit).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeDisabled()
  await consent.check()

  await expect(submit).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Continue with LinuxDO' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Continue with GitHub' }).locator('[data-provider-icon="github"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with LinuxDO' }).locator('[data-provider-icon="linuxdo"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' }).locator('[data-provider-icon="google"]')).toBeVisible()
  await expect(page.locator('.r32-oauth-grid .pt-button')).toHaveText(['GitHub', 'Google', 'LinuxDO'])

  await submit.click()
  await page.waitForURL('**/en/console/overview')
  await expect(page.getByRole('heading', { name: /Overview/ })).toBeVisible()
})

test('homepage console entry keeps the login session when refresh remains unavailable', async ({ page }) => {
  let refreshAttempts = 0
  let selfAttempts = 0
  await installMockApi(page, {
    anonymous: true,
    onRequest: (request) => {
      if (new URL(request.url()).pathname === '/api/user/auth/refresh') refreshAttempts += 1
    },
  })
  await page.route('**/api/user/self', async (route) => {
    selfAttempts += 1
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Unauthorized', code: 'AUTH_REQUIRED' }),
    })
  })

  await page.goto('/en/')
  await page.getByRole('button', { name: 'Go to console' }).first().click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/en/auth/sign-in')
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/en/console/overview')

  await page.getByLabel('Username or email').fill('fixture-user')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await expect(page.getByRole('heading', { name: /Overview/ })).toBeVisible()
  await expect(page).toHaveURL('/en/console/overview')
  expect(selfAttempts).toBe(0)
  expect(refreshAttempts).toBe(1)
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
  await expect(page.getByRole('checkbox')).toBeChecked()
  await expect(page.getByRole('button', { name: 'Continue with GitHub' }).locator('[data-provider-icon="github"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with LinuxDO' }).locator('[data-provider-icon="linuxdo"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' }).locator('[data-provider-icon="google"]')).toBeVisible()
  await expect(page.locator('.r32-oauth-grid .pt-button')).toHaveText(['GitHub', 'Google', 'LinuxDO'])

  await page.getByLabel('Username', { exact: true }).fill('new-fixture-user')
  await page.getByLabel('Email', { exact: true }).fill('new@example.test')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText('Verification code sent')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Verify', exact: true })).toHaveCount(0)
  expect(verificationEmail).toBe('new@example.test')

  await page.getByLabel('Verification code').fill('123456')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByLabel('Confirm password').fill('fixture-password')
  await page.getByRole('button', { name: 'Create account' }).click()

  await page.waitForURL('**/en/auth/sign-in')
  expect(registration).toMatchObject({
    username: 'new-fixture-user',
    email: 'new@example.test',
    verification_code: '123456',
  })
})

test('registration highlights invalid username and password fields until they are valid', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/en/auth/sign-up')

  const username = page.getByLabel('Username', { exact: true })
  const password = page.getByLabel('Password', { exact: true })
  const confirm = page.getByLabel('Confirm password')

  await password.focus()
  await page.keyboard.press('Tab')
  await expect(confirm).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(password).toBeFocused()

  await username.fill('abc')
  await password.fill('short')
  await confirm.fill('different')

  for (const input of [username, password, confirm]) {
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input.locator('xpath=..')).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await expect(input.locator('xpath=..')).toHaveCSS('background-image', /linear-gradient/)
  }
  await expect(page.getByRole('button', { name: 'Create account' })).toBeDisabled()

  await username.fill('abcd')
  await password.fill('long-enough')
  await confirm.fill('long-enough')

  for (const input of [username, password, confirm]) {
    await expect(input).not.toHaveAttribute('aria-invalid')
  }
})

test('ordinary administrators enter the localized overview after sign-in', async ({ page }) => {
  await installMockApi(page, { role: 10 })
  await page.goto('/en/auth/sign-in')
  await page.getByLabel('Username or email').fill('fixture-admin')
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL(/\/en\/console\/overview$/)
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
})

test('Root enters localized channel administration after sign-in', async ({ page }) => {
  await installMockAdminApi(page)
  await installMockApi(page, { role: 100 })
  await page.goto('/zh-CN/auth/sign-in')
  await page.getByLabel('用户名或邮箱').fill('fixture-root')
  await page.getByLabel('密码', { exact: true }).fill('fixture-password')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: '登录', exact: true }).click()

  await page.waitForURL(/\/zh-CN\/console\/admin\/channels$/)
  await expect(page.getByRole('heading', { name: '渠道', exact: true })).toBeVisible()
  await expect(page.getByText('管理员', { exact: true })).toBeVisible()
})

test('OAuth callback restores the saved locale and enters the ordinary-user console', async ({ page }) => {
  let callback = ''
  await page.addInitScript(() => {
    window.sessionStorage.setItem('partokens-oauth-locale', 'fr')
    window.sessionStorage.setItem('partokens-oauth-state:google', 'fixture-state')
  })
  await installMockApi(page, {
    anonymous: true,
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
  await page.addInitScript(() => {
    const expiredMessage = 'Login flow expired. Please sign in again.'
    const detectExpiredMessage = () => {
      if (document.body?.textContent?.includes(expiredMessage)) {
        window.sessionStorage.setItem('partokens-e2e-expired-login-flow-seen', 'true')
      }
    }
    new MutationObserver(detectExpiredMessage).observe(document, { childList: true, subtree: true, characterData: true })
  })
  await installMockApi(page, {
    anonymous: true,
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

  await page.getByLabel('Authenticator code').fill('123456')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.waitForURL('**/en/console/overview')
  expect(verification).toEqual({ code: '123456', flow_token: 'fixture-two-factor-flow' })
  expect(await page.evaluate(() => window.sessionStorage.getItem('partokens-e2e-expired-login-flow-seen'))).toBeNull()
})

test('two-factor backup mode normalizes the displayed code before submission', async ({ page }) => {
  let verification: Record<string, unknown> = {}
  await installMockApi(page, {
    anonymous: true,
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
  await page.getByRole('button', { name: 'Use a backup code' }).click()
  await page.getByLabel('Backup code').fill('cawd-oqdv')
  await page.getByRole('button', { name: 'Verify' }).click()

  await page.waitForURL('**/en/console/overview')
  expect(verification).toEqual({ code: 'CAWDOQDV', flow_token: 'fixture-two-factor-flow' })
})

test('technical reset links restore the locale and remove reset credentials after success', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('partokens-locale', 'fr'))
  await installMockApi(page)
  await page.goto('/user/reset?email=member%40example.test&token=fixture-reset-token')

  await expect.poll(() => new URL(page.url()).pathname).toBe('/fr/auth/reset')
  expect(new URL(page.url()).searchParams.get('email')).toBe('member@example.test')
  expect(new URL(page.url()).searchParams.get('token')).toBe('fixture-reset-token')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await expect(page.getByText('me***@example.test')).toBeVisible()
  await page.getByRole('button', { name: 'Réinitialiser le mot de passe' }).click()
  await expect(page.getByText('fixture-reset-password')).toBeVisible()
  await expect.poll(() => page.url()).toBe('http://127.0.0.1:4174/fr/auth/reset')
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
  await page.getByRole('combobox', { name: 'Group' }).click()
  await page.getByRole('option', { name: /Image/ }).click()
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
  await expect(page.getByRole('status').filter({ hasText: 'To protect your privacy, Partokens does not record' })).toBeVisible()
  await expect(page.getByText('Fixture completion request')).toHaveCount(0)
  await expect(page.getByText(/billing_mode/)).toHaveCount(0)
})

test('overview uses live fixture state', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/overview')

  await expect(page.getByRole('heading', { name: 'Recent usage' })).toBeVisible()
  await expect(page.getByText('Studio fixture', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Manage keys' })).toHaveAttribute('href', '/en/console/keys')
  await expect(page.getByRole('link', { name: 'Inspect logs' })).toHaveAttribute('href', '/en/console/usage-logs')
  await expect(page.getByText('https://partokens.com', { exact: true })).toBeVisible()
})

test('the unreleased public model marketplace stays outside the public surface', async ({ page }) => {
  await installMockApi(page, { anonymous: true })
  await page.goto('/en/models')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
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

  await expect(page.getByRole('heading', { name: 'Add funds' })).toBeVisible()
  const topup = page.getByRole('region', { name: 'Add funds' })
  const presets = topup.getByRole('radiogroup', { name: 'Preset amounts' }).getByRole('radio')
  await expect(presets).toHaveCount(2)
  await expect(presets.nth(0)).toContainText('$10')
  await expect(presets.nth(1)).toContainText('$50')
  await expect(page.locator('input[type="number"]')).toHaveCount(0)

  await topup.getByRole('radio', { name: /\$50/ }).click()
  await expect(topup.getByText('$45', { exact: true })).toBeVisible()
  await expect(topup.getByRole('combobox', { name: 'Payment method' })).toHaveCount(0)
  await topup.getByRole('button', { name: 'Top up now' }).click()
  const dialog = page.getByRole('dialog', { name: 'Confirm top-up' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('combobox', { name: 'Payment method' })).toHaveText('Fixture Pay')
  await expect(dialog.getByText('You pay').locator('..')).toContainText('$45')
  await dialog.getByRole('button', { name: 'Confirm top-up' }).click()
  const paymentError = page.getByText('Payment fixture stopped before checkout.', { exact: true })
  await expect(paymentError).toContainText('Payment fixture stopped before checkout.')
  expect(payment).toMatchObject({ amount: 50, payment_method: 'fixture-pay' })
  await paymentError.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${evidenceScreenshots}/wallet-presets-fixed.png` })
})

test('Playground streams a reply and restores the browser-local conversation after reload', async ({ page }) => {
  await primeUserSession(page)
  await installMockApi(page)
  await page.goto('/en/console/playground')

  await expect(page.getByText('Conversation history is stored only in this browser. Partokens does not store your conversation history.')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Model and group.*gpt-4\.1-mini/ })).toBeVisible()
  await page.getByPlaceholder('Enter a message').fill('Explain the fixture response.')
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByText('This response arrived through a mocked SSE stream.')).toBeVisible()
  await page.getByText('Reasoning', { exact: true }).click()
  await expect(page.getByText('Checked the fixture.')).toBeVisible()
  await page.reload()
  await expect(page.getByText('This response arrived through a mocked SSE stream.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Explain the fixture response.', level: 1 })).toBeVisible()
})

test('Image Studio matches the design-lab flow while keeping the key in memory and results local', async ({ page }) => {
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

  await expect(page.getByRole('heading', { name: 'Image studio', level: 1 })).toBeVisible()
  await expect(page.locator('[data-studio-page]')).toBeVisible()
  await page.getByLabel('Prompt', { exact: true }).fill('A precise fixture image')
  await expect(page.getByRole('combobox', { name: 'Model' })).toContainText('gpt-image-1')
  await page.getByRole('button', { name: 'Generate' }).click()
  const keyDialog = page.getByRole('dialog', { name: 'API key required' })
  await expect(keyDialog).toContainText('The full key stays in memory only for this Studio session.')
  await keyDialog.getByRole('combobox', { name: 'API key' }).click()
  await page.getByRole('option', { name: 'Studio fixture' }).click()
  await keyDialog.getByRole('button', { name: 'Continue generating' }).click()
  await expect(page.getByRole('img', { name: 'A precise fixture image, Variation 1' })).toBeVisible()
  await expect(page.getByText('1 of 1')).toBeVisible()
  expect(usedSessionCredential).toBe(true)

  const projectCount = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const open = indexedDB.open('partokens-local')
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const instance = open.result
      const count = instance.transaction('studioProjects', 'readonly').objectStore('studioProjects').count()
      count.onerror = () => { instance.close(); reject(count.error) }
      count.onsuccess = () => { instance.close(); resolve(count.result) }
    }
  }))
  expect(projectCount).toBe(1)

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
  await expect(page.getByRole('img', { name: 'A precise fixture image, Variation 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByRole('dialog', { name: 'API key required' })).toBeVisible()
  await page.screenshot({ path: `${evidenceScreenshots}/studio-local-asset-fixed.png` })
})
