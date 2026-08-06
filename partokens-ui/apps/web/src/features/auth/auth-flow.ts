import { exchangeOAuth, getOAuthState, type CurrentUser, type PartokensStatus } from '@partokens/api-client'
import { isAppLocale, type AppLocale } from '@partokens/i18n'

import { canonicalConsolePath } from '@/lib/routes'

const oauthContextKey = 'partokens-auth-oauth-context'
const legacyOAuthKeys = ['partokens-oauth-intent', 'partokens-oauth-locale', 'partokens-oauth-return'] as const

export type OAuthIntent = 'login' | 'bind'

export type OAuthContext = {
  intent: OAuthIntent
  locale: AppLocale
  provider: string
  returnTo?: string
  state: string
}

function isOAuthIntent(value: unknown): value is OAuthIntent {
  return value === 'login' || value === 'bind'
}

function storageFor(windowLike: Window = window) {
  return windowLike.sessionStorage
}

export function readOAuthContext(storage: Storage = storageFor()): OAuthContext | null {
  const raw = storage.getItem(oauthContextKey)
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<OAuthContext>
    if (
      !isOAuthIntent(value.intent) ||
      !isAppLocale(value.locale) ||
      typeof value.provider !== 'string' ||
      !value.provider ||
      typeof value.state !== 'string' ||
      !value.state ||
      (value.returnTo !== undefined && typeof value.returnTo !== 'string')
    ) return null
    return value as OAuthContext
  } catch {
    return null
  }
}

function writeOAuthContext(context: OAuthContext, storage: Storage = storageFor()) {
  storage.setItem(oauthContextKey, JSON.stringify(context))
}

export function clearOAuthContext(storage: Storage = storageFor()) {
  storage.removeItem(oauthContextKey)
  if (typeof window !== 'undefined' && storage === window.sessionStorage) {
    for (const key of legacyOAuthKeys) window.localStorage.removeItem(key)
  }
}

export function validatedReturnPath(locale: AppLocale, candidate?: string | null): string | null {
  if (!candidate || typeof window === 'undefined') return null
  try {
    const target = new URL(candidate, window.location.origin)
    const localeRoot = `/${locale}/`
    if (
      target.origin !== window.location.origin ||
      !candidate.startsWith('/') ||
      candidate.startsWith('//') ||
      !target.pathname.startsWith(localeRoot) ||
      target.pathname.startsWith(`${localeRoot}auth/`)
    ) return null
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return null
  }
}

export function requestedReturnPath(locale: AppLocale): string | null {
  return validatedReturnPath(locale, new URLSearchParams(window.location.search).get('redirect'))
}

export function authDestination(locale: AppLocale, user: CurrentUser, returnTo?: string | null) {
  if (user.role >= 10) {
    window.location.assign('/channels')
    return
  }
  window.location.assign(validatedReturnPath(locale, returnTo) ?? canonicalConsolePath(locale, 'overview'))
}

export type AuthFailureKind = 'network' | 'rate-limit' | 'turnstile' | 'other'

export function authFailureKind(error: unknown): AuthFailureKind {
  if (!error || typeof error !== 'object') return 'other'
  const value = error as {
    code?: string
    message?: string
    response?: { status?: number; data?: { code?: string; message?: string } }
  }
  const status = value.response?.status
  const code = `${value.code ?? ''} ${value.response?.data?.code ?? ''}`.toLowerCase()
  const message = `${value.message ?? ''} ${value.response?.data?.message ?? ''}`.toLowerCase()
  if (status === 429 || code.includes('rate_limit')) return 'rate-limit'
  if (code.includes('turnstile') || code.includes('captcha') || message.includes('turnstile') || message.includes('captcha')) return 'turnstile'
  if (!value.response && (value.code === 'ERR_NETWORK' || message.includes('network') || message.includes('fetch'))) return 'network'
  return 'other'
}

export function localizedAuthError(error: unknown, fallback: string, t: (key: string) => string) {
  const kind = authFailureKind(error)
  if (kind === 'network') return t('Unable to reach the authentication service. Check your connection and try again.')
  if (kind === 'rate-limit') return t('Too many authentication attempts. Wait a moment and try again.')
  if (kind === 'turnstile') return t('Complete the security verification and try again.')
  return fallback
}

export async function startOAuthAuthorization(input: {
  provider: 'github' | 'linuxdo' | 'oidc' | string
  status: PartokensStatus
  locale: AppLocale
  intent?: OAuthIntent
}) {
  let { provider } = input
  const intent = input.intent ?? 'login'
  const customProvider = input.status.custom_oauth_providers?.find((item) => item.slug === provider)
  const popup = intent === 'bind' ? window.open('about:blank', 'partokens-oauth-bind', 'popup,width=560,height=720') : null
  if (intent === 'bind' && !popup) throw new Error('OAuth popup unavailable')

  let target: URL
  if (provider === 'github' && input.status.github_client_id) {
    target = new URL('https://github.com/login/oauth/authorize')
    target.searchParams.set('client_id', input.status.github_client_id)
    target.searchParams.set('scope', 'user:email')
  } else if (provider === 'linuxdo' && input.status.linuxdo_client_id) {
    target = new URL('https://connect.linux.do/oauth2/authorize')
    target.searchParams.set('client_id', input.status.linuxdo_client_id)
    target.searchParams.set('response_type', 'code')
  } else {
    const custom = customProvider ?? (provider === 'oidc' && input.status.oidc_authorization_endpoint && input.status.oidc_client_id ? {
      slug: 'oidc',
      client_id: input.status.oidc_client_id,
      authorization_endpoint: input.status.oidc_authorization_endpoint,
      scopes: 'openid profile email',
    } : undefined)
    if (!custom) {
      popup?.close()
      throw new Error('Provider unavailable')
    }
    provider = custom.slug
    target = new URL(custom.authorization_endpoint)
    target.searchParams.set('client_id', custom.client_id)
    target.searchParams.set('redirect_uri', `${window.location.origin}/oauth/${provider}`)
    target.searchParams.set('response_type', 'code')
    target.searchParams.set('scope', custom.scopes || 'openid profile email')
  }

  let state: string
  try {
    state = await getOAuthState({
      provider,
      intent,
      aff: intent === 'login' ? window.localStorage.getItem('aff') || undefined : undefined,
    })
  } catch (error) {
    popup?.close()
    throw error
  }
  if (!state) {
    popup?.close()
    throw new Error('OAuth state unavailable')
  }

  target.searchParams.set('state', state)
  const context: OAuthContext = {
    provider,
    state,
    intent,
    locale: input.locale,
    returnTo: intent === 'login' ? requestedReturnPath(input.locale) ?? undefined : undefined,
  }
  clearOAuthContext()
  writeOAuthContext(context)

  if (intent === 'login') {
    window.location.assign(target.toString())
    return
  }

  try {
    const popupStorage = (popup as Window).sessionStorage
    if (popupStorage) writeOAuthContext(context, popupStorage)
  } catch {
    clearOAuthContext()
    popup?.close()
    throw new Error('OAuth popup unavailable')
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const cleanup = () => {
      window.removeEventListener('message', receive)
      window.clearInterval(closedCheck)
      window.clearTimeout(timeout)
    }
    const finish = (error?: unknown) => {
      if (settled) return
      settled = true
      cleanup()
      clearOAuthContext()
      try {
        const popupStorage = (popup as Window).sessionStorage
        if (popupStorage) clearOAuthContext(popupStorage)
      } catch { /* The provider may still own the popup origin. */ }
      popup?.close()
      if (error) reject(error)
      else resolve()
    }
    const receive = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown> | null
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        !data ||
        data.source !== 'partokens-oauth-bind' ||
        data.provider !== provider ||
        data.state !== state ||
        typeof data.code !== 'string'
      ) return
      void exchangeOAuth(provider, { code: data.code, state }, 'bind')
        .then((result) => {
          if (!result.success || !result.data || !('action' in result.data) || result.data.action !== 'bind') {
            throw new Error('OAuth bind failed')
          }
          finish()
        })
        .catch(finish)
    }
    const closedCheck = window.setInterval(() => {
      if (popup?.closed) finish(new Error('OAuth popup closed'))
    }, 500)
    const timeout = window.setTimeout(() => finish(new Error('OAuth bind timed out')), 300_000)
    window.addEventListener('message', receive)
    popup?.location.assign(target.toString())
  })
}
