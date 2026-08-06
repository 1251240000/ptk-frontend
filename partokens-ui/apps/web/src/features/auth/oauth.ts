import { exchangeOAuth, getOAuthState, type PartokensStatus } from '@partokens/api-client'
import type { AppLocale } from '@partokens/i18n'

import { markOAuthBindPopup, saveOAuthLoginContext } from './auth-utils'

export type OAuthProviderSlug = 'github' | 'linuxdo' | 'oidc' | string

export async function startOAuthAuthorization(input: {
  provider: OAuthProviderSlug
  status: PartokensStatus
  locale: AppLocale
  intent?: 'login' | 'bind'
}): Promise<void> {
  let provider = input.provider
  const intent = input.intent || 'login'
  const customProvider = input.status.custom_oauth_providers?.find((item) => item.slug === provider)
  const popup = intent === 'bind'
    ? window.open('about:blank', 'partokens-oauth-bind', 'popup,width=560,height=720')
    : null
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
    const custom = customProvider ?? (
      provider === 'oidc' && input.status.oidc_authorization_endpoint && input.status.oidc_client_id
        ? {
            slug: 'oidc',
            client_id: input.status.oidc_client_id,
            authorization_endpoint: input.status.oidc_authorization_endpoint,
            scopes: 'openid profile email',
          }
        : undefined
    )
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

  if (intent === 'login') {
    const returnTo = new URLSearchParams(window.location.search).get('redirect') || undefined
    saveOAuthLoginContext(provider, state, input.locale, returnTo)
    window.location.assign(target.toString())
    return
  }

  if (!popup || !markOAuthBindPopup(popup, provider, state)) {
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
      popup.close()
      if (error) reject(error)
      else resolve()
    }
    const receive = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown> | null
      if (
        event.origin !== window.location.origin
        || event.source !== popup
        || !data
        || data.source !== 'partokens-oauth-bind'
        || data.provider !== provider
        || data.state !== state
        || (typeof data.code !== 'string' && typeof data.error !== 'string')
      ) return

      void exchangeOAuth(provider, {
        code: typeof data.code === 'string' ? data.code : undefined,
        state,
        error: typeof data.error === 'string' ? data.error : undefined,
        error_description: typeof data.error_description === 'string' ? data.error_description : undefined,
      }, 'bind')
        .then((result) => {
          if (!result.success || !result.data || !('action' in result.data) || result.data.action !== 'bind') {
            throw new Error(result.message || 'OAuth bind failed')
          }
          finish()
        })
        .catch(finish)
    }
    const closedCheck = window.setInterval(() => {
      if (popup.closed) finish(new Error('OAuth popup closed'))
    }, 500)
    const timeout = window.setTimeout(() => finish(new Error('OAuth bind timed out')), 300_000)
    window.addEventListener('message', receive)
    popup.location.assign(target.toString())
  })
}
