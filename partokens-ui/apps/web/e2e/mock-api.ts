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
}

type MockApiOptions = {
  role?: number
  requireTwoFactor?: boolean
  pricingRequiresAuth?: boolean
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
  const user = { ...standardUser, role: options.role ?? standardUser.role }
  let nextTokenId = 8
  let tokens = [{
    id: 7,
    name: 'Studio fixture',
    status: 1,
    group: 'default',
    remain_quota: 500_000,
    unlimited_quota: false,
    expired_time: -1,
    accessed_time: 1_721_520_000,
    model_limits_enabled: true,
    model_limits: 'gpt-image-1',
    allow_ips: '',
  }]

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    options.onRequest?.(request)
    const url = new URL(request.url())
    const path = url.pathname.replace(/\/$/, '') || '/'
    const method = request.method()

    if (path === '/api/status') {
      await json(route, envelope({
        system_name: 'Partokens',
        version: 'fixture',
        register_enabled: true,
        email_verification: true,
        github_client_id: 'github-fixture',
        linuxdo_client_id: 'linuxdo-fixture',
        custom_oauth_providers: [{
          id: 1,
          name: 'Google',
          slug: 'google',
          client_id: 'google-fixture',
          authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
          scopes: 'openid profile email',
        }],
      }))
      return
    }
    if (path === '/api/user/login') {
      await json(route, envelope(options.requireTwoFactor ? { ...user, require_2fa: true } : user))
      return
    }
    if (path === '/api/user/login/2fa') {
      await json(route, envelope(user))
      return
    }
    if (path === '/api/user/self' && method === 'GET') {
      await json(route, envelope(user))
      return
    }
    if (path === '/api/user/register' || path === '/api/verification') {
      await json(route, envelope(null))
      return
    }
    if (path === '/api/oauth/state') {
      await json(route, envelope('fixture-oauth-state'))
      return
    }
    if (path.startsWith('/api/oauth/')) {
      await json(route, envelope(user))
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
      const created = { ...input, id: nextTokenId++, status: 1, accessed_time: 0 }
      tokens = [...tokens, created as typeof tokens[number]]
      await json(route, envelope(created))
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
      await json(route, envelope(null))
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
      await json(route, envelope({ items: [], total: 0, page: 1, page_size: 10 }))
      return
    }
    if (path === '/api/subscription/plans') {
      await json(route, envelope([]))
      return
    }
    if (path === '/api/subscription/self') {
      await json(route, envelope({ billing_preference: 'subscription_first', subscriptions: [], all_subscriptions: [] }))
      return
    }
    if (path === '/api/user/aff') {
      await json(route, envelope('fixture-affiliate'))
      return
    }
    if (path === '/api/data/self' || path === '/api/data/flow/self') {
      await json(route, envelope([]))
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
  await page.addInitScript((userId) => {
    window.localStorage.setItem('partokens-user-id', String(userId))
    window.localStorage.setItem('partokens-locale', 'en')
  }, standardUser.id)
}
