// @vitest-environment jsdom

import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AuthContractError,
  api,
  authenticatedFetch,
  clearAuthentication,
  confirmPasswordReset,
  exchangeOAuth,
  getSelf,
  installAuthentication,
  login,
  loginTwoFactor,
  parseAuthBundle,
  refreshAuthentication,
  type AuthBundle,
} from '@partokens/api-client'

import { useSessionStore } from '@/stores/session'
import { startOAuthAuthorization } from '@/pages/auth-pages'

const originalAdapter = api.defaults.adapter
const sid = '10000000-0000-4000-8000-000000000017'

function bundle(token = 'unit-access-1', overrides: Partial<AuthBundle> = {}): AuthBundle {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: token,
    token_type: 'Bearer',
    access_expires_at: now + 900,
    user: {
      id: 17,
      username: 'unit-user',
      display_name: 'Unit User',
      role: 1,
      group: 'default',
    },
    session: {
      sid,
      current: true,
      login_method: 'password',
      ip: '127.0.0.1',
      user_agent: 'Vitest',
      created_at: now - 60,
      last_active_at: now,
      expires_at: now + 2_592_000,
    },
    ...overrides,
  }
}

function response(config: InternalAxiosRequestConfig, data: unknown, status = 200): AxiosResponse {
  return { config, data, headers: {}, status, statusText: String(status) }
}

function resetForBootstrap() {
  clearAuthentication(false)
  useSessionStore.setState({ resolved: false, loading: false, pendingTwoFactor: null })
}

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

beforeEach(() => {
  vi.useRealTimers()
  Object.defineProperty(window, 'localStorage', { configurable: true, value: memoryStorage() })
  Object.defineProperty(window, 'sessionStorage', { configurable: true, value: memoryStorage() })
  window.localStorage.clear()
  window.sessionStorage.clear()
  window.history.replaceState({}, '', '/en/console/overview')
  resetForBootstrap()
})

afterEach(() => {
  clearAuthentication(false)
  api.defaults.adapter = originalAdapter
  vi.restoreAllMocks()
  vi.useRealTimers()
})

afterAll(() => {
  api.defaults.adapter = originalAdapter
})

describe('authentication bundle parsing', () => {
  it('projects only validated user and session fields', () => {
    const parsed = parseAuthBundle({
      ...bundle(),
      response_metadata: { unsafe: true },
      user: { ...bundle().user, metadata: { secret: true } },
      session: { ...bundle().session, internal_status: 'active' },
    })

    expect(parsed.user).toEqual(bundle().user)
    expect('metadata' in parsed.user).toBe(false)
    expect('internal_status' in parsed.session).toBe(false)
    expect('response_metadata' in parsed).toBe(false)
  })

  it.each([
    null,
    {},
    { access_token: 'partial' },
    { ...bundle(), token_type: 'Basic' },
    { ...bundle(), user: { id: 17, role: 1 } },
    { ...bundle(), session: { ...bundle().session, current: false } },
    { ...bundle(), session: { ...bundle().session, expires_at: 1 } },
  ])('rejects malformed, partial, or expired bundles', (value) => {
    expect(() => parseAuthBundle(value)).toThrow(AuthContractError)
  })
})

describe('authentication lifecycle', () => {
  it('installs an anonymous 2FA challenge without a transient empty state', () => {
    const pendingStates: Array<string | null> = []
    const unsubscribe = useSessionStore.subscribe((state) => {
      pendingStates.push(state.pendingTwoFactor?.flow_token ?? null)
    })

    useSessionStore.getState().setPendingTwoFactor({
      require_2fa: true,
      flow_token: 'unit-flow',
      expires_at: Math.floor(Date.now() / 1000) + 300,
    })

    unsubscribe()
    expect(pendingStates).toEqual(['unit-flow'])
  })

  it('installs password login atomically and sends the bearer on same-origin requests', async () => {
    let authorization = ''
    api.defaults.adapter = async (config) => {
      if (config.url === '/api/user/login') return response(config, { success: true, data: bundle() })
      authorization = String(config.headers.get('Authorization') || '')
      return response(config, { success: true, data: bundle().user })
    }

    const result = await login({ username: 'unit-user', password: 'not-a-real-password' })
    await getSelf()

    expect(result.success).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({
      user: { id: 17 },
      session: { sid },
      accessToken: 'unit-access-1',
      resolved: true,
    })
    expect(authorization).toBe('Bearer unit-access-1')
  })

  it('restores a page refresh through the HttpOnly-cookie refresh endpoint', async () => {
    const requests: InternalAxiosRequestConfig[] = []
    api.defaults.adapter = async (config) => {
      requests.push(config)
      return response(config, { success: true, data: bundle('restored-access') })
    }

    const user = await useSessionStore.getState().resolve()

    expect(user?.id).toBe(17)
    expect(requests).toHaveLength(1)
    expect(requests[0]?.url).toBe('/api/user/auth/refresh')
    expect(requests[0]?.headers.get('X-Auth-Session')).toBeUndefined()
  })

  it('rotates access credentials while preserving SID and user identity', async () => {
    installAuthentication(bundle('old-access'))
    let refreshSession = ''
    api.defaults.adapter = async (config) => {
      refreshSession = String(config.headers.get('X-Auth-Session') || '')
      return response(config, {
        success: true,
        data: bundle('rotated-access'),
      })
    }

    const outcome = await refreshAuthentication()

    expect(outcome.kind).toBe('authenticated')
    expect(useSessionStore.getState()).toMatchObject({
      accessToken: 'rotated-access',
      session: { sid },
      user: { id: 17 },
    })
    expect(refreshSession).toBe(sid)
  })

  it('automatically refreshes before access token expiry', async () => {
    vi.useFakeTimers()
    const now = Math.floor(Date.now() / 1000)
    let refreshCalls = 0
    installAuthentication(bundle('expiring-access', { access_expires_at: now + 120 }))
    api.defaults.adapter = async (config) => {
      if (config.url === '/api/user/auth/refresh') {
        refreshCalls += 1
        return response(config, { success: true, data: bundle('scheduled-access') })
      }
      return response(config, { success: true, data: {} })
    }

    await vi.advanceTimersByTimeAsync(60_000)

    expect(refreshCalls).toBe(1)
    expect(useSessionStore.getState().accessToken).toBe('scheduled-access')
  })

  it('refreshes once and retries an Axios 401 only once', async () => {
    installAuthentication(bundle('expired-access'))
    let protectedCalls = 0
    let refreshCalls = 0
    api.defaults.adapter = async (config) => {
      if (config.url === '/api/user/auth/refresh') {
        refreshCalls += 1
        return response(config, { success: true, data: bundle('retry-access') })
      }
      protectedCalls += 1
      if (protectedCalls === 1) {
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response(config, {
          success: false,
          code: 'AUTH_TOKEN_EXPIRED',
        }, 401))
      }
      return response(config, { success: true, data: { ok: true } })
    }

    await api.get('/api/protected')

    expect(refreshCalls).toBe(1)
    expect(protectedCalls).toBe(2)
  })

  it('clears authentication when an Axios retry is also unauthorized', async () => {
    window.history.replaceState({}, '', '/en/auth/sign-in')
    installAuthentication(bundle('invalid-access'))
    let protectedCalls = 0
    api.defaults.adapter = async (config) => {
      if (config.url === '/api/user/auth/refresh') {
        return response(config, { success: true, data: bundle('retry-access') })
      }
      protectedCalls += 1
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response(config, {
        success: false,
        code: 'AUTH_UNAUTHORIZED',
      }, 401))
    }

    await expect(api.get('/api/protected')).rejects.toBeInstanceOf(AxiosError)

    expect(protectedCalls).toBe(2)
    expect(useSessionStore.getState()).toMatchObject({ user: null, session: null, accessToken: null })
  })

  it('does not refresh Axios requests for 403, 404, or HTTP 200 business failures', async () => {
    installAuthentication(bundle())
    let refreshCalls = 0
    api.defaults.adapter = async (config) => {
      if (config.url === '/api/user/auth/refresh') refreshCalls += 1
      if (config.url === '/api/forbidden') {
        throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, response(config, {
          success: false,
          code: 'AUTH_FORBIDDEN',
          message: 'Bearer permission-response-secret',
          data: { id: 17, key: 'sk-permission-response-secret' },
        }, 403))
      }
      if (config.url === '/api/missing') {
        throw new AxiosError('Not found', 'ERR_BAD_REQUEST', config, undefined, response(config, {
          success: false,
          code: 'RESOURCE_NOT_FOUND',
          message: 'api-key=missing-response-secret',
          data: { id: 17, key: 'sk-missing-response-secret' },
        }, 404))
      }
      return response(config, {
        success: false,
        code: 'BUSINESS_FAILURE',
        message: 'business-response-secret',
        data: { id: 17, key: 'sk-business-response-secret' },
      })
    }

    await expect(api.get('/api/forbidden')).rejects.toBeInstanceOf(AxiosError)
    await expect(api.get('/api/missing')).rejects.toBeInstanceOf(AxiosError)
    const businessFailure = await api.get('/api/business-failure')

    expect(businessFailure.data).toMatchObject({ success: false, code: 'BUSINESS_FAILURE' })
    expect(refreshCalls).toBe(0)
    expect(useSessionStore.getState().accessToken).toBe('unit-access-1')
    const persistentValues = [window.localStorage, window.sessionStorage].flatMap((storage) =>
      Array.from({ length: storage.length }, (_, index) => storage.getItem(storage.key(index) || '') || ''),
    ).join(' ')
    expect(persistentValues).not.toMatch(/permission-response-secret|missing-response-secret|business-response-secret/)
  })

  it('does not attach the bearer or legacy user header to an external Axios origin', async () => {
    installAuthentication(bundle('same-origin-only-axios'))
    let authorization = ''
    let legacyUser = ''
    api.defaults.adapter = async (config) => {
      authorization = String(config.headers.get('Authorization') || '')
      legacyUser = String(config.headers.get('New-Api-User') || '')
      return response(config, { success: true, data: null })
    }

    await api.get('https://example.test/collect')

    expect(authorization).toBe('')
    expect(legacyUser).toBe('')
  })

  it('uses one refresh for concurrent callers', async () => {
    installAuthentication(bundle())
    let refreshCalls = 0
    api.defaults.adapter = (async (config) => {
      refreshCalls += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return response(config, { success: true, data: bundle('single-flight-access') })
    }) as AxiosAdapter

    const first = refreshAuthentication()
    const second = refreshAuthentication()
    const third = refreshAuthentication()
    await Promise.all([first, second, third])

    expect(first).toBe(second)
    expect(second).toBe(third)
    expect(refreshCalls).toBe(1)
  })

  it.each([
    ['HTTP 401', 401, { success: false, code: 'AUTH_UNAUTHORIZED' }],
    ['HTTP 403', 403, { success: false, code: 'AUTH_ORIGIN_FORBIDDEN' }],
    ['invalid session', 200, { success: false, code: 'AUTH_SESSION_INVALID' }],
    ['expired session', 200, { success: false, code: 'AUTH_SESSION_EXPIRED' }],
    ['revoked session', 200, { success: false, code: 'AUTH_SESSION_REVOKED' }],
    ['malformed envelope', 200, { success: true, data: { token_type: 'Bearer' } }],
  ])('clears memory on %s refresh', async (_name, status, data) => {
    installAuthentication(bundle())
    api.defaults.adapter = async (config) => response(config, data, status)

    const outcome = await refreshAuthentication()

    expect(outcome.kind).toBe('anonymous')
    expect(useSessionStore.getState()).toMatchObject({ user: null, session: null, accessToken: null })
  })

  it.each([
    ['SID', bundle('mismatch', { session: { ...bundle().session, sid: '20000000-0000-4000-8000-000000000017' } })],
    ['user', bundle('mismatch', { user: { ...bundle().user, id: 18 } })],
  ])('rejects a successful refresh with a mismatched %s', async (_name, refreshed) => {
    installAuthentication(bundle())
    api.defaults.adapter = async (config) => response(config, { success: true, data: refreshed })

    const outcome = await refreshAuthentication()

    expect(outcome).toMatchObject({ kind: 'anonymous', code: 'AUTH_SESSION_MISMATCH' })
    expect(useSessionStore.getState().accessToken).toBeNull()
  })

  it('supports the 2FA challenge and installs the final 2FA and OAuth bundles', async () => {
    let phase: 'login' | 'two-factor' | 'oauth' = 'login'
    api.defaults.adapter = async (config) => {
      if (phase === 'login') return response(config, {
        success: true,
        data: { require_2fa: true, flow_token: 'unit-flow', expires_at: Math.floor(Date.now() / 1000) + 300 },
      })
      if (phase === 'two-factor') return response(config, { success: true, data: bundle('two-factor-access') })
      return response(config, { success: true, data: bundle('oauth-access') })
    }

    const challenge = await login({ username: 'unit-user', password: 'not-a-real-password' })
    expect(challenge.data).toMatchObject({ require_2fa: true, flow_token: 'unit-flow' })
    phase = 'two-factor'
    await loginTwoFactor('123456', 'unit-flow')
    expect(useSessionStore.getState().accessToken).toBe('two-factor-access')
    phase = 'oauth'
    await exchangeOAuth('google', { code: 'unit-code', state: 'unit-state' })
    expect(useSessionStore.getState().accessToken).toBe('oauth-access')
  })

  it.each([
    ['password login', () => login({ username: 'unit-user', password: 'not-a-real-password' })],
    ['2FA completion', () => loginTwoFactor('123456', 'unit-flow')],
    ['OAuth callback', () => exchangeOAuth('google', { code: 'unit-code', state: 'unit-state' })],
  ])('rejects a malformed %s success envelope', async (_name, request) => {
    api.defaults.adapter = async (config) => response(config, {
      success: true,
      data: { access_token: 'partial-access', token_type: 'Bearer' },
    })

    await expect(request()).rejects.toBeInstanceOf(AuthContractError)
    expect(useSessionStore.getState().accessToken).toBeNull()
  })

  it('rejects a password-reset success that does not contain a one-time password', async () => {
    api.defaults.adapter = async (config) => response(config, { success: true, data: { unexpected: true } })

    await expect(confirmPasswordReset({ email: 'unit@example.test', token: 'unit-reset' })).rejects.toBeInstanceOf(AuthContractError)
  })

  it('refreshes and retries native fetch once with the rotated bearer', async () => {
    installAuthentication(bundle('native-old-access'))
    api.defaults.adapter = async (config) => response(config, {
      success: true,
      data: bundle('native-rotated-access'),
    })
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    const result = await authenticatedFetch('/pg/chat/completions', { method: 'POST' }, fetcher)

    expect(result.status).toBe(200)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer native-old-access')
    expect(new Headers(fetcher.mock.calls[1]?.[1]?.headers).get('Authorization')).toBe('Bearer native-rotated-access')
  })

  it('clears native-fetch authentication when the single retry is also unauthorized', async () => {
    window.history.replaceState({}, '', '/en/auth/sign-in')
    installAuthentication(bundle('native-invalid-access'))
    api.defaults.adapter = async (config) => response(config, {
      success: true,
      data: bundle('native-retry-access'),
    })
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 }))

    const result = await authenticatedFetch('/pg/chat/completions', {}, fetcher)

    expect(result.status).toBe(401)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(useSessionStore.getState()).toMatchObject({ user: null, session: null, accessToken: null })
  })

  it('never adds the bearer to an external fetch origin', async () => {
    installAuthentication(bundle('same-origin-only-access'))
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }))

    await authenticatedFetch('https://example.test/collect', { headers: { 'X-Test': 'allowed' } }, fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get('Authorization')).toBeNull()
  })

  it('clears memory after logout even when logout races with refresh', async () => {
    installAuthentication(bundle('pre-logout-access'))
    let releaseRefresh: ((value: AxiosResponse) => void) | undefined
    api.defaults.adapter = ((config) => {
      if (config.url === '/api/user/auth/refresh') {
        return new Promise<AxiosResponse>((resolve) => { releaseRefresh = resolve })
          .then((value) => ({ ...value, config }))
      }
      return Promise.resolve(response(config, { success: true, data: { cookie_cleared: true } }))
    }) as AxiosAdapter

    const refreshing = refreshAuthentication()
    await vi.waitFor(() => expect(releaseRefresh).toBeTypeOf('function'))
    await useSessionStore.getState().signOut()
    releaseRefresh?.(response({} as InternalAxiosRequestConfig, { success: true, data: bundle('late-access') }))
    const outcome = await refreshing

    expect(outcome.kind).toBe('superseded')
    expect(useSessionStore.getState()).toMatchObject({ user: null, session: null, accessToken: null })
  })

  it('does not let an older refresh response overwrite a newer login', async () => {
    installAuthentication(bundle('before-refresh'))
    let releaseRefresh: ((value: AxiosResponse) => void) | undefined
    api.defaults.adapter = ((config) => {
      if (config.url === '/api/user/auth/refresh') {
        return new Promise<AxiosResponse>((resolve) => { releaseRefresh = resolve })
          .then((value) => ({ ...value, config }))
      }
      return Promise.resolve(response(config, { success: true, data: bundle('new-login') }))
    }) as AxiosAdapter

    const refreshing = refreshAuthentication()
    await vi.waitFor(() => expect(releaseRefresh).toBeTypeOf('function'))
    await login({ username: 'unit-user', password: 'not-a-real-password' })
    releaseRefresh?.(response({} as InternalAxiosRequestConfig, { success: true, data: bundle('stale-refresh') }))
    const outcome = await refreshing

    expect(outcome.kind).toBe('superseded')
    expect(useSessionStore.getState().accessToken).toBe('new-login')
  })

  it('completes local logout when server revocation fails', async () => {
    installAuthentication(bundle('logout-failure-access'))
    api.defaults.adapter = async (config) => {
      throw new AxiosError('Unavailable', 'ERR_NETWORK', config)
    }

    await expect(useSessionStore.getState().signOut()).resolves.toBeUndefined()

    expect(useSessionStore.getState()).toMatchObject({ user: null, session: null, accessToken: null })
  })

  it('closes the OAuth bind popup when state creation fails', async () => {
    const close = vi.fn()
    const popup = { close, closed: false, location: { assign: vi.fn() } }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    api.defaults.adapter = async (config) => {
      throw new AxiosError('Unavailable', 'ERR_NETWORK', config)
    }

    await expect(startOAuthAuthorization({
      provider: 'github',
      status: { github_client_id: 'unit-client' },
      locale: 'en',
      intent: 'bind',
    })).rejects.toThrow('Unavailable')

    expect(close).toHaveBeenCalledTimes(1)
  })

  it('accepts an OAuth bind callback only from the expected popup, origin, provider, and state', async () => {
    const close = vi.fn()
    const assign = vi.fn()
    const popup = { close, closed: false, location: { assign }, sessionStorage: memoryStorage() }
    const wrongPopup = { close: vi.fn(), closed: false, location: { assign: vi.fn() }, sessionStorage: memoryStorage() }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    let exchangeCalls = 0
    api.defaults.adapter = async (config) => {
      if (config.url === '/api/oauth/state') return response(config, {
        success: true,
        data: { flow_token: 'unit-oauth-state', expires_at: Math.floor(Date.now() / 1000) + 300 },
      })
      exchangeCalls += 1
      return response(config, { success: true, data: { action: 'bind' } })
    }

    const binding = startOAuthAuthorization({
      provider: 'github',
      status: { github_client_id: 'unit-client' },
      locale: 'en',
      intent: 'bind',
    })
    await vi.waitFor(() => expect(assign).toHaveBeenCalledTimes(1))

    const dispatch = (origin: string, source: typeof popup | typeof wrongPopup, data: Record<string, unknown>) => {
      window.dispatchEvent(new MessageEvent('message', { origin, source: source as unknown as Window, data }))
    }
    const valid = {
      source: 'partokens-oauth-bind',
      provider: 'github',
      state: 'unit-oauth-state',
      code: 'unit-code',
    }
    dispatch('https://example.test', popup, valid)
    dispatch(window.location.origin, wrongPopup, valid)
    dispatch(window.location.origin, popup, { ...valid, provider: 'oidc' })
    dispatch(window.location.origin, popup, { ...valid, state: 'wrong-state' })
    await Promise.resolve()
    expect(exchangeCalls).toBe(0)

    dispatch(window.location.origin, popup, valid)
    await binding

    expect(exchangeCalls).toBe(1)
    expect(close).toHaveBeenCalledTimes(1)
    expect(window.localStorage.length).toBe(0)
  })

  it('propagates an OAuth bind cancellation from the provider popup', async () => {
    const close = vi.fn()
    const assign = vi.fn()
    const popup = { close, closed: false, location: { assign }, sessionStorage: memoryStorage() }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
    let exchangeCalls = 0
    api.defaults.adapter = async (config) => {
      if (config.url === '/api/oauth/state') return response(config, {
        success: true,
        data: { flow_token: 'unit-oauth-cancel-state', expires_at: Math.floor(Date.now() / 1000) + 300 },
      })
      exchangeCalls += 1
      return response(config, { success: false, message: 'access_denied' })
    }

    const binding = startOAuthAuthorization({
      provider: 'github',
      status: { github_client_id: 'unit-client' },
      locale: 'en',
      intent: 'bind',
    })
    await vi.waitFor(() => expect(assign).toHaveBeenCalledTimes(1))
    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin,
      source: popup as unknown as Window,
      data: {
        source: 'partokens-oauth-bind',
        provider: 'github',
        state: 'unit-oauth-cancel-state',
        error: 'access_denied',
        error_description: 'The user denied access',
      },
    }))

    await expect(binding).rejects.toThrow('access_denied')
    expect(exchangeCalls).toBe(1)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('does not persist or print access credentials', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    installAuthentication(bundle('unit-sensitive-access'))

    const persistentValues = [window.localStorage, window.sessionStorage].flatMap((storage) =>
      Array.from({ length: storage.length }, (_, index) => storage.getItem(storage.key(index) || '') || ''),
    )
    expect(persistentValues.join(' ')).not.toContain('unit-sensitive-access')
    expect(window.location.href).not.toContain('unit-sensitive-access')
    expect(log).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })
})
