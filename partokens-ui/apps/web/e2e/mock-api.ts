import type { Page, Request, Route } from '@playwright/test'

export const standardUser = {
  id: 42,
  username: 'fixture-user',
  display_name: 'Fixture User',
  email: 'fixture@example.test',
  role: 1,
  group: 'default',
  quota: 2_000_000,
  used_quota: 500_000,
  request_count: 23,
  aff_quota: 0,
  aff_history_quota: 0,
  aff_count: 0,
  setting: JSON.stringify({
    notify_type: 'webhook',
    quota_warning_threshold: 500_000,
    webhook_url: 'https://hooks.example.test/account',
    webhook_secret: 'configured',
    notification_email: 'fixture@example.test',
    accept_unset_model_ratio_model: false,
    record_ip_log: false,
    language: 'en',
  }),
}

const fixtureSessionId = '10000000-0000-4000-8000-000000000042'

function authBundle(user: typeof standardUser, tokenVersion: number) {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: `fixture-access-${tokenVersion}`,
    token_type: 'Bearer',
    access_expires_at: now + 15 * 60,
    user,
    session: {
      sid: fixtureSessionId,
      current: true,
      login_method: 'password',
      ip: '127.0.0.1',
      user_agent: 'Playwright',
      created_at: now - 60,
      last_active_at: now,
      expires_at: now + 30 * 24 * 60 * 60,
    },
  }
}

type MockApiOptions = {
  anonymous?: boolean
  role?: number
  requireTwoFactor?: boolean
  twoFactorEnabled?: boolean
  passkeyEnabled?: boolean
  pricingRequiresAuth?: boolean
  statusResponses?: Array<{ status?: number; body: unknown }>
  tokenCreateOmitsData?: boolean
  userSetting?: Record<string, unknown>
  onRequest?: (request: Request) => void
}

function envelope(data: unknown, extra: Record<string, unknown> = {}) {
  return { success: true, message: '', data, ...extra }
}

async function json(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  })
}

export async function installMockApi(page: Page, options: MockApiOptions = {}) {
  const user = {
    ...standardUser,
    role: options.role ?? standardUser.role,
    ...(options.userSetting ? { setting: JSON.stringify(options.userSetting) } : {}),
  }
  let authVersion = 1
  let statusResponseIndex = 0
  let nextTokenId = 8
  let twoFactorEnabled = options.twoFactorEnabled ?? false
  let tokens = [{
    id: 7,
    name: 'Studio fixture',
    key: 'ABCD**********WXYZ',
    status: 1,
    group: 'default',
    remain_quota: 500_000,
    used_quota: 120_000,
    unlimited_quota: false,
    expired_time: -1,
    created_time: 1_720_000_000,
    accessed_time: 1_721_520_000,
    model_limits_enabled: true,
    model_limits: 'gpt-image-1',
    allow_ips: '',
    cross_group_retry: false,
  }, {
    id: 6,
    name: 'Automation fixture',
    key: 'EFGH**********QRST',
    status: 2,
    group: 'default',
    remain_quota: 1_000_000,
    used_quota: 0,
    unlimited_quota: false,
    expired_time: 1_800_000_000,
    created_time: 1_719_000_000,
    accessed_time: 1_719_000_000,
    model_limits_enabled: false,
    model_limits: '',
    allow_ips: '',
    cross_group_retry: false,
  }]

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    options.onRequest?.(request)
    const url = new URL(request.url())
    const path = url.pathname.replace(/\/$/, '') || '/'
    const method = request.method()

    if (path === '/api/status') {
      const configuredStatus = options.statusResponses?.[statusResponseIndex++]
      if (configuredStatus) {
        await json(route, configuredStatus.body, configuredStatus.status ?? 200)
        return
      }
      await json(route, envelope({
        system_name: 'Partokens',
        version: 'fixture',
        register_enabled: true,
        password_login_enabled: true,
        password_register_enabled: true,
        oauth_register_enabled: true,
        email_verification: true,
        github_oauth: true,
        github_client_id: 'github-fixture',
        linuxdo_oauth: true,
        linuxdo_client_id: 'linuxdo-fixture',
        custom_oauth_providers: [{
          id: 1,
          name: 'Google',
          slug: 'google',
          client_id: 'google-fixture',
          authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
          scopes: 'openid profile email',
        }, {
          id: 2,
          name: 'Enterprise SSO',
          slug: 'enterprise-sso',
          client_id: 'enterprise-fixture',
          authorization_endpoint: 'https://sso.example.test/oauth/authorize',
          scopes: 'openid profile email',
        }],
      }))
      return
    }
    if (path === '/api/user/login') {
      await json(route, envelope(options.requireTwoFactor ? {
        require_2fa: true,
        flow_token: 'fixture-two-factor-flow',
        expires_at: Math.floor(Date.now() / 1000) + 300,
      } : authBundle(user, authVersion++)))
      return
    }
    if (path === '/api/user/login/2fa') {
      await json(route, envelope(authBundle(user, authVersion++)))
      return
    }
    if (path === '/api/user/auth/refresh' && method === 'POST') {
      if (options.anonymous) {
        await json(route, { success: false, message: 'Unauthorized', code: 'AUTH_REQUIRED' }, 401)
        return
      }
      await json(route, envelope(authBundle(user, authVersion++)))
      return
    }
    if (path === '/api/user/auth/logout' && method === 'POST') {
      await json(route, envelope({ revoked_sid: fixtureSessionId, cookie_cleared: true }))
      return
    }
    if (path === '/api/user/self' && method === 'GET') {
      await json(route, envelope(user))
      return
    }
    if (path === '/api/user/self' && method === 'PUT') {
      await json(route, envelope(null))
      return
    }
    if (path === '/api/user/setting' && method === 'PUT') {
      await json(route, envelope(null))
      return
    }
    if (path === '/api/user/register' || path === '/api/verification') {
      await json(route, envelope(null))
      return
    }
    if (path === '/api/reset_password') {
      await json(route, envelope(null))
      return
    }
    if (path === '/api/user/reset' && method === 'POST') {
      await json(route, envelope('fixture-reset-password'))
      return
    }
    if (path === '/api/oauth/state') {
      await json(route, envelope({ flow_token: 'fixture-oauth-state', expires_at: Math.floor(Date.now() / 1000) + 600 }))
      return
    }
    if (path.startsWith('/api/oauth/')) {
      await json(route, envelope(authBundle(user, authVersion++)))
      return
    }
    if (path === '/api/pricing') {
      if (options.pricingRequiresAuth) {
        await json(route, { success: false, message: 'Unauthorized', data: null }, 401)
        return
      }
      await json(route, envelope([
        { model_name: 'gpt-4.1-mini', vendor_name: 'OpenAI', quota_type: 0, model_ratio: 1, completion_ratio: 1, enable_groups: ['default'], supported_endpoint_types: ['chat'] },
        { model_name: 'gpt-image-1', vendor_name: 'OpenAI', quota_type: 1, model_price: 0.04, enable_groups: ['default'], supported_endpoint_types: ['images'] },
      ]))
      return
    }
    if (path === '/api/token/search' && method === 'GET') {
      const keyword = (url.searchParams.get('keyword') || '').toLowerCase()
      const items = tokens.filter((token) => token.name.toLowerCase().includes(keyword))
      await json(route, envelope({ items, total: items.length, page: 1, page_size: 20 }))
      return
    }
    if (path === '/api/token' && method === 'GET') {
      await json(route, envelope({
        items: tokens,
        total: tokens.length,
        page: 1,
        page_size: 20,
      }))
      return
    }
    if (path === '/api/token' && method === 'POST') {
      const input = request.postDataJSON() as Record<string, unknown>
      const created = { ...input, id: nextTokenId++, key: 'IJKL**********MNOP', status: 1, used_quota: 0, created_time: 1_722_000_000, accessed_time: 1_722_000_000 }
      tokens = [...tokens, created as typeof tokens[number]]
      await json(route, options.tokenCreateOmitsData ? { success: true, message: '' } : envelope(created))
      return
    }
    if (path === '/api/token' && method === 'PUT') {
      const input = request.postDataJSON() as Record<string, unknown>
      const id = Number(input.id)
      tokens = tokens.map((token) => token.id === id ? { ...token, ...input } as typeof token : token)
      await json(route, envelope(tokens.find((token) => token.id === id)))
      return
    }
    if (path === '/api/token/batch' && method === 'POST') {
      const ids = ((request.postDataJSON() as { ids?: number[] }).ids || [])
      tokens = tokens.filter((token) => !ids.includes(token.id))
      await json(route, envelope(ids.length))
      return
    }
    const tokenMatch = path.match(/^\/api\/token\/(\d+)$/)
    if (tokenMatch && method === 'GET') {
      await json(route, envelope(tokens.find((token) => token.id === Number(tokenMatch[1]))))
      return
    }
    if (tokenMatch && method === 'DELETE') {
      tokens = tokens.filter((token) => token.id !== Number(tokenMatch[1]))
      await json(route, { success: true, message: '' })
      return
    }
    const revealMatch = path.match(/^\/api\/token\/(\d+)\/key$/)
    if (revealMatch && method === 'POST') {
      const id = Number(revealMatch[1])
      await json(route, envelope({ key: id === 7 ? 'fixture-session-token' : `fixture-key-${id}` }))
      return
    }
    if (path === '/api/user/models') {
      await json(route, envelope(['gpt-4.1-mini', 'gpt-image-1']))
      return
    }
    if (path === '/api/user/self/groups') {
      await json(route, envelope({ default: { ratio: 1 } }))
      return
    }
    if (path === '/api/user/topup/info') {
      await json(route, envelope({
        amount_options: [10, 50],
        discount: { '10': 1, '50': 0.9 },
        pay_methods: [{ name: 'Fixture Pay', type: 'fixture-pay', min_topup: 1 }],
        enable_online_topup: true,
        enable_stripe_topup: false,
        enable_redemption: true,
        payment_compliance_confirmed: true,
      }))
      return
    }
    if (path === '/api/user/amount') {
      const amount = Number((request.postDataJSON() as { amount?: number } | null)?.amount || 0)
      await json(route, envelope(`$${(amount * (amount === 50 ? 0.9 : 1)).toFixed(2)}`))
      return
    }
    if (path === '/api/user/pay') {
      await json(route, { success: false, message: 'Payment fixture stopped before checkout.', data: null })
      return
    }
    if (path === '/api/user/topup/self') {
      await json(route, envelope({ items: [{ id: 19, amount: 50, money: 45, trade_no: 'FIXTURE-ORDER-19', payment_method: 'Fixture Pay', create_time: 1_721_520_000, complete_time: 1_721_520_030, status: 'success' }], total: 1, page: 1, page_size: 10 }))
      return
    }
    if (path === '/api/subscription/plans') {
      await json(route, envelope([{ plan: { id: 4, title: 'Builder', subtitle: 'Fixture plan', price_amount: 20, currency: 'USD', duration_unit: 'month', duration_value: 1, quota_reset_period: 'monthly', enabled: true, sort_order: 1, allow_balance_pay: true, max_purchase_per_user: 2, total_amount: 2_500_000 } }]))
      return
    }
    if (path === '/api/subscription/self') {
      const subscription = { subscription: { id: 31, plan_id: 4, status: 'active', source: 'balance', start_time: 1_721_520_000, end_time: 1_724_112_000, amount_total: 2_500_000, amount_used: 400_000 } }
      await json(route, envelope({ billing_preference: 'subscription_first', subscriptions: [subscription], all_subscriptions: [subscription] }))
      return
    }
    if (path === '/api/user/aff') {
      await json(route, envelope('fixture-affiliate'))
      return
    }
    if (path === '/api/user/oauth/bindings' && method === 'GET') {
      await json(route, envelope([{ provider_id: '1', provider_name: 'Google', external_id: 'fixture-google' }]))
      return
    }
    if (/^\/api\/user\/oauth\/bindings\/[^/]+$/.test(path) && method === 'DELETE') {
      await json(route, envelope(null))
      return
    }
    if (path === '/api/user/2fa/status') {
      await json(route, envelope({ enabled: twoFactorEnabled, locked: false, backup_codes_remaining: twoFactorEnabled ? 8 : 0 }))
      return
    }
    if (path === '/api/user/2fa/setup' && method === 'POST') {
      await json(route, envelope({
        secret: 'JBSWY3DPEHPK3PXP',
        qr_code_data: 'otpauth://totp/Partokens:fixture?secret=JBSWY3DPEHPK3PXP&issuer=Partokens',
        backup_codes: ['BACKUP-1001', 'BACKUP-1002', 'BACKUP-1003', 'BACKUP-1004'],
      }))
      return
    }
    if (path === '/api/user/2fa/enable' && method === 'POST') {
      twoFactorEnabled = true
      await json(route, envelope(null))
      return
    }
    if (path === '/api/user/2fa/disable' && method === 'POST') {
      twoFactorEnabled = false
      await json(route, envelope(null))
      return
    }
    if (path === '/api/user/2fa/backup_codes' && method === 'POST') {
      await json(route, envelope({ backup_codes: ['BACKUP-2001', 'BACKUP-2002', 'BACKUP-2003', 'BACKUP-2004'] }))
      return
    }
    if (path === '/api/user/passkey') {
      await json(route, envelope({ enabled: options.passkeyEnabled ?? false, last_used_at: options.passkeyEnabled ? '2026-08-07T10:00:00Z' : null }))
      return
    }
    if (path === '/api/user/checkin' && method === 'GET') {
      await json(route, envelope({ enabled: true, stats: { checked_in_today: false, total_checkins: 2, total_quota: 20_000, checkin_count: 2, records: [{ checkin_date: '2026-08-01', quota_awarded: 10_000 }, { checkin_date: '2026-08-03', quota_awarded: 10_000 }] } }))
      return
    }
    if (path === '/api/user/checkin' && method === 'POST') {
      await json(route, envelope({ quota_awarded: 10_000 }))
      return
    }
    if (path === '/api/user/token' && method === 'GET') {
      await json(route, envelope('fixture-transient-system-token'))
      return
    }
    if (path === '/api/data/self') {
      await json(route, envelope([
        { created_at: 1_721_433_600, model_name: 'gpt-4.1-mini', request_count: 8, token_used: 1_840, quota: 8_000 },
        { created_at: 1_721_520_000, model_name: 'gpt-4.1-mini', request_count: 7, token_used: 1_420, quota: 7_000 },
        { created_at: 1_721_520_000, model_name: 'gpt-image-1', request_count: 4, token_used: 640, quota: 20_000 },
      ]))
      return
    }
    if (path === '/api/data/flow/self') {
      await json(route, envelope([
        { token_id: 7, token_name: 'Studio fixture', use_group: 'default', model_name: 'gpt-4.1-mini', count: 15, token_used: 3_260, quota: 15_000 },
        { token_id: 7, token_name: 'Studio fixture', use_group: 'default', model_name: 'gpt-image-1', count: 4, token_used: 640, quota: 20_000 },
      ]))
      return
    }
    if (path === '/api/log/self') {
      await json(route, envelope({ items: [{
        id: 91,
        created_at: 1_721_520_000,
        type: 2,
        token_name: 'Studio fixture',
        model_name: 'gpt-4.1-mini',
        prompt_tokens: 120,
        completion_tokens: 64,
        quota: 12_000,
        use_time: 0.42,
        is_stream: true,
        content: 'Fixture completion request',
        group: 'default',
        request_id: 'req_fixture_123456789',
        upstream_request_id: 'upstream_fixture_987654321',
        other: JSON.stringify({ billing_mode: 'token', model_ratio: 1, completion_ratio: 1 }),
      }], total: 1, page: 1, page_size: 20 }))
      return
    }
    if (path === '/api/log/self/stat') {
      await json(route, envelope({ quota: 12_000, rpm: 3, tpm: 184 }))
      return
    }

    await json(route, envelope([]))
  })

  await page.route('**/pg/chat/completions', async (route) => {
    options.onRequest?.(route.request())
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' },
      body: [
        'data: {"choices":[{"delta":{"reasoning_content":"Checked the fixture. "}}]}',
        '',
        'data: {"choices":[{"delta":{"content":"This response arrived through a mocked SSE stream."}}]}',
        '',
        'data: [DONE]',
        '',
      ].join('\n'),
    })
  })

  await page.route('**/v1/images/**', async (route) => {
    options.onRequest?.(route.request())
    await json(route, {
      data: [{
        b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        revised_prompt: 'A generated fixture image.',
      }],
    })
  })
}

export async function primeUserSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('partokens-locale', 'en')
  })
}
