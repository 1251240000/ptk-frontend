import type { AppLocale } from '@partokens/i18n'

const registrationEmailKey = 'partokens-auth-registration-email'
const registrationSentAtKey = 'partokens-auth-registration-sent-at'
const oauthLocaleKey = 'partokens-oauth-locale'
const oauthReturnKey = 'partokens-oauth-return'
const oauthStatePrefix = 'partokens-oauth-state:'
const oauthBindStatePrefix = 'partokens-oauth-bind-state:'

function sessionStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function resolveAuthReturnPath(candidate: string | null | undefined, locale: AppLocale): string | null {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) return null

  try {
    const url = new URL(candidate, window.location.origin)
    const localizedRoot = `/${locale}/`
    if (url.origin !== window.location.origin || !url.pathname.startsWith(localizedRoot)) return null
    if (url.pathname.startsWith(`${localizedRoot}auth/`)) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function maskEmail(email: string): string {
  const separator = email.lastIndexOf('@')
  if (separator <= 0) return ''
  const local = email.slice(0, separator)
  const domain = email.slice(separator + 1)
  if (!domain) return ''
  const visible = local.length > 1 ? local.slice(0, 2) : local.slice(0, 1)
  return `${visible}***@${domain}`
}

export function cleanBackupCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()
}

export function formatBackupCode(value: string): string {
  const clean = cleanBackupCode(value)
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}

export function readRegistrationContext(): { email: string; sentAt: number } {
  const storage = sessionStorage()
  const sentAt = Number(storage?.getItem(registrationSentAtKey) || 0)
  return {
    email: storage?.getItem(registrationEmailKey) || '',
    sentAt: Number.isFinite(sentAt) ? sentAt : 0,
  }
}

export function saveRegistrationContext(email: string, sentAt = Date.now()): void {
  const storage = sessionStorage()
  if (!storage) return
  storage.setItem(registrationEmailKey, email)
  storage.setItem(registrationSentAtKey, String(sentAt))
}

export function clearRegistrationContext(): void {
  const storage = sessionStorage()
  storage?.removeItem(registrationEmailKey)
  storage?.removeItem(registrationSentAtKey)
}

export function saveOAuthLoginContext(provider: string, state: string, locale: AppLocale, returnTo?: string): void {
  const storage = sessionStorage()
  if (!storage) return
  storage.setItem(oauthLocaleKey, locale)
  storage.setItem(`${oauthStatePrefix}${provider}`, state)
  if (returnTo) storage.setItem(oauthReturnKey, returnTo)
  else storage.removeItem(oauthReturnKey)
}

export function readOAuthLoginContext(provider: string): { locale: string | null; state: string | null; returnTo: string | null } {
  const storage = sessionStorage()
  return {
    locale: storage?.getItem(oauthLocaleKey) || null,
    state: storage?.getItem(`${oauthStatePrefix}${provider}`) || null,
    returnTo: storage?.getItem(oauthReturnKey) || null,
  }
}

export function clearOAuthLoginContext(provider: string): void {
  const storage = sessionStorage()
  storage?.removeItem(oauthLocaleKey)
  storage?.removeItem(oauthReturnKey)
  storage?.removeItem(`${oauthStatePrefix}${provider}`)
}

export function markOAuthBindPopup(popup: Window, provider: string, state: string): boolean {
  try {
    const key = `${oauthBindStatePrefix}${provider}`
    popup.sessionStorage.setItem(key, state)
    return popup.sessionStorage.getItem(key) === state
  } catch {
    return false
  }
}

export function isOAuthBindCallback(provider: string, state: string): boolean {
  if (!window.opener || window.opener.closed || !state) return false
  try {
    return window.sessionStorage.getItem(`${oauthBindStatePrefix}${provider}`) === state
  } catch {
    return false
  }
}

export function clearOAuthBindContext(provider: string): void {
  sessionStorage()?.removeItem(`${oauthBindStatePrefix}${provider}`)
}
