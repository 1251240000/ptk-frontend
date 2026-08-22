import { expect, test } from '@playwright/test'

import { installMockApi } from './mock-api'

test('Models remains outside the public Web surface while About is published', async ({ page }) => {
  await installMockApi(page, { anonymous: true })

  await page.goto('/en/models')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')

  await page.goto('/en/about')
  await expect(page.getByRole('heading', { name: 'Model access you can measure', level: 1 })).toBeVisible()
  await expect(page.getByRole('main').getByText('Partokens gives developers one model-access endpoint')).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
})

const localizedDocsCases = [
  {
    locale: 'zh-CN',
    summary: '选择合适的接入方式，准备账户、API 密钥和实时模型 ID，然后完成一次最小调用。',
    deepHeading: '发送请求',
    search: '轮换',
    searchResult: 'API 密钥管理',
  },
  {
    locale: 'zh-TW',
    summary: '選擇一種整合方法，準備帳戶、API 金鑰和目前可用的模型 ID，然後完成一次最小呼叫。',
    deepHeading: '傳送請求',
    search: '輪替',
    searchResult: 'API 金鑰管理',
  },
  {
    locale: 'en',
    summary: 'Choose an integration method, prepare the account, API key, and live model ID, then complete one minimal call.',
    deepHeading: 'Send the request',
    search: 'rotate',
    searchResult: 'API key management',
  },
  {
    locale: 'ja',
    summary: '統合方法を選び、アカウント、API キー、現在のモデル ID を準備して、最小構成の呼び出しを 1 回完了します。',
    deepHeading: 'リクエストを送信する',
    search: 'ローテーション',
    searchResult: 'API キー管理',
  },
  {
    locale: 'ru',
    summary: 'Выберите метод интеграции, подготовьте учетную запись, ключ API и идентификатор активной модели, а затем выполните один минимальный вызов.',
    deepHeading: 'Отправить запрос',
    search: 'чередуйте',
    searchResult: 'Управление API-ключами',
  },
  {
    locale: 'fr',
    summary: "Choisissez une méthode d'intégration, préparez le compte, la clé API et l'ID de modèle actuel, puis effectuez un appel minimal.",
    deepHeading: "Envoyer la requête",
    search: 'révoquez',
    searchResult: 'Gestion des clés API',
  },
  {
    locale: 'vi',
    summary: 'Chọn phương thức tích hợp, chuẩn bị tài khoản, khóa API và ID mô hình đang khả dụng, sau đó hoàn thành một lệnh gọi tối thiểu.',
    deepHeading: 'Gửi yêu cầu',
    search: 'xoay',
    searchResult: 'Quản lý khóa API',
  },
] as const

test('all seven locales publish localized documentation without fallback', async ({ page }) => {
  await installMockApi(page)

  for (const { locale, summary } of localizedDocsCases) {
    await page.goto(`/${locale}/docs`)
    await expect(page.locator('.r3-docs-article')).toBeVisible()
    await expect(page.locator('.r3-docs-hero > p')).toHaveText(summary)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.locator('.r3-docs-language-fallback')).toHaveCount(0)
  }
})

test('all seven locales expose localized deep articles and search text', async ({ page }) => {
  await installMockApi(page)

  for (const { locale, deepHeading, search, searchResult } of localizedDocsCases) {
    await page.goto(`/${locale}/docs#docs/first-request`)
    await expect(page.getByRole('heading', { name: deepHeading, level: 2 })).toBeVisible()
    await expect(page.locator('.r3-docs-language-fallback')).toHaveCount(0)

    const navigation = page.locator('.r3-docs-index')
    await page.getByRole('searchbox').fill(search)
    await expect(navigation.getByRole('button', { name: searchResult, exact: true })).toBeVisible()
  }
})

test('legacy docs deep links redirect to the corresponding SPA article', async ({ page }) => {
  await installMockApi(page)

  await page.goto('/en/docs/guides/image-studio?source=legacy')
  await expect(page).toHaveURL(/\/en\/docs\?source=legacy#docs\/image-studio$/)
  await expect(page.getByRole('heading', { name: 'Image Studio', level: 1 })).toBeVisible()
  await expect(page.locator('.r3-docs-hero > p')).toContainText('Open Image Studio from the console')

  await page.goto('/zh-CN/docs/guides/usage-logs')
  await expect(page).toHaveURL(/\/zh-CN\/docs#docs\/usage-logs$/)
  await expect(page.getByRole('heading', { name: '使用日志', level: 1 })).toBeVisible()
})

test('unknown docs deep links use the localized 404 surface', async ({ page }) => {
  await installMockApi(page)

  await page.goto('/fr/docs/not-a-real-document')
  await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
})

test('mobile docs navigation and dense content stay usable within the viewport', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await installMockApi(page)
  await page.goto('/en/docs#docs/first-request')

  const navigation = page.locator('.r3-docs-index')
  await page.getByRole('button', { name: 'Open documentation navigation' }).click()
  await expect(navigation).toHaveAttribute('data-open', 'true')

  const search = page.getByRole('searchbox', { name: 'Search documentation' })
  await search.fill('image studio')
  await expect(navigation.getByRole('button', { name: 'Image Studio' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(search).toHaveValue('')
  await navigation.getByRole('button', { name: 'Close documentation navigation' }).click()
  await expect(navigation).toHaveAttribute('data-open', 'false')

  const codeLanguages = page.locator('.r3-sdk-tabs[aria-label="Code language"]')
  await codeLanguages.getByRole('button', { name: 'JavaScript' }).click()
  await expect(codeLanguages.getByRole('button', { name: 'JavaScript' })).toHaveAttribute('aria-pressed', 'true')
  const javascriptBlock = page.locator('.r3-code-block').filter({ has: page.getByRole('button', { name: 'Copy code: JavaScript' }) })
  await javascriptBlock.getByRole('button', { name: 'Copy code: JavaScript' }).click()
  await expect(javascriptBlock.getByRole('status')).toHaveText('Copied')
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('chat.completions.create')

  await page.goto('/en/docs#docs/models-api')
  const tableWrap = page.locator('.r3-docs-table-wrap')
  await expect(tableWrap.locator('table')).toBeVisible()
  expect(await tableWrap.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)

  const codeBlock = page.locator('.r3-code-block pre').first()
  await expect(codeBlock).toBeVisible()
  expect(await codeBlock.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})

test('service status exposes unavailable state and recovers through retry', async ({ page }) => {
  await installMockApi(page, {
    statusResponses: [
      { status: 503, body: { success: false, message: 'maintenance' } },
      { body: { success: true, data: { version: 'fixture-recovered', start_time: 1_720_000_000 } } },
    ],
  })

  await page.goto('/en/status')
  await expect(page.getByRole('heading', { name: 'Service status cannot be confirmed' })).toBeVisible()
  await page.getByRole('button', { name: 'Check again' }).click()
  await expect(page.getByRole('heading', { name: 'API service is operational' })).toBeVisible()
  await expect(page.getByText('fixture-recovered')).toBeVisible()
})

test('notices persist their local content-version hash and clear the unread marker', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/en/')
  await expect(page.locator('.r3-notice-dot')).toHaveCount(1)
  await page.getByRole('button', { name: 'Notices' }).first().click()
  await expect(page).toHaveURL(/\/en\/notices$/)
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('partokens:public-notice-seen:v1'))).not.toBeNull()
  await page.getByRole('button', { name: 'Partokens' }).click()
  await expect(page).toHaveURL(/\/en$/)
  await expect(page.locator('.r3-notice-dot')).toHaveCount(0)
})

test('locale switching preserves the docs route and hash', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/en/docs#docs/first-request')
  await expect(page).toHaveURL(/\/en\/docs#docs\/first-request$/)
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('menuitemradio', { name: '日本語' }).click()
  await expect(page).toHaveURL(/\/ja\/docs#docs\/first-request$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  await expect(page.locator('.r3-docs-hero > p')).toContainText('API キー、Base URL、モデル ID を準備し')
  await expect(page.locator('.r3-docs-language-fallback')).toHaveCount(0)
})

test('public product links preserve their intended workspace through sign-in', async ({ page }) => {
  await installMockApi(page, { anonymous: true })
  const destinations = [
    ['Playground', '/en/console/playground'],
    ['Image studio', '/en/console/studio'],
  ] as const

  for (const [label, destination] of destinations) {
    await page.goto('/en/')
    await page.locator('.r3-public-footer').getByRole('button', { name: label }).click()
    await expect(page).toHaveURL(/\/en\/auth\/sign-in/)
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(destination)
  }
})

test('localized public metadata and the 404 surface follow the active locale', async ({ page }) => {
  await installMockApi(page)
  await page.goto('/fr/status')

  await expect(page).toHaveTitle('État du service | Partokens')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Consultez la disponibilité actuelle et les informations de déploiement de l’API Partokens.')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${new URL(page.url()).origin}/fr/status`)
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(8)

  await page.goto('/ja/auth/sign-in')
  await expect(page).toHaveTitle('ログイン | Partokens')
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', 'Partokens model access, usage, and account console')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${new URL(page.url()).origin}/ja/auth/sign-in`)

  await page.goto('/fr/not-published')
  await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
})

test('legal documents keep structured navigation usable on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await installMockApi(page)
  await page.goto('/ru/legal/user-agreement')

  await expect(page.getByRole('heading', { name: 'Пользовательское соглашение', level: 1 })).toBeVisible()
  await expect(page.getByText('Требуется проверка владельца')).toBeVisible()
  await expect(page.locator('.r3-legal-section-index a')).toHaveCount(3)
  await page.locator('.r3-legal-section-index a').first().click()
  await expect(page).toHaveURL(/#legal-user-agreement-section-1$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})

test('public shell traps mobile focus, restores the trigger, and has no page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installMockApi(page)
  await page.goto('/en/')

  const menu = page.getByRole('button', { name: 'Menu' })
  await menu.focus()
  await menu.click()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
  await expect(menu).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  expect(await page.locator('.r3-home-started').boundingBox()).not.toBeNull()
})
