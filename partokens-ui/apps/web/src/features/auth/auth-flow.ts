import { exchangeOAuth, getOAuthState, type PartokensStatus } from '@partokens/api-client'
import { isAppLocale, type AppLocale } from '@partokens/i18n'

const oauthContextKey = 'partokens-auth-oauth-context'
const legacyOAuthKeys = ['partokens-oauth-intent', 'partokens-oauth-locale', 'partokens-oauth-return'] as const
const legacyOAuthStatePrefix = 'partokens-oauth-state:'
const legacyOAuthBindStatePrefix = 'partokens-oauth-bind-state:'

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

export function readOAuthContext(provider?: string, storage: Storage = storageFor()): OAuthContext | null {
  const raw = storage.getItem(oauthContextKey)
  if (raw) {
    try {
      const value = JSON.parse(raw) as Partial<OAuthContext>
      if (
        isOAuthIntent(value.intent) &&
        isAppLocale(value.locale) &&
        typeof value.provider === 'string' &&
        value.provider &&
        typeof value.state === 'string' &&
        value.state &&
        (value.returnTo === undefined || typeof value.returnTo === 'string')
      ) return value as OAuthContext
    } catch {
      // Fall through to the one-release legacy migration below.
    }
  }

  if (!provider) return null
  const bindState = storage.getItem(`${legacyOAuthBindStatePrefix}${provider}`)
  const loginState = storage.getItem(`${legacyOAuthStatePrefix}${provider}`)
  const state = bindState || loginState
  if (!state) return null
  const storedLocale = storage.getItem('partokens-oauth-locale')
  let preferredLocale: string | null = null
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function') {
      preferredLocale = window.localStorage.getItem('partokens-locale')
    }
  } catch { /* Storage may be disabled. */ }
  const locale = isAppLocale(storedLocale || undefined)
    ? storedLocale as AppLocale
    : isAppLocale(preferredLocale || undefined) ? preferredLocale as AppLocale : 'zh-CN'
  const returnTo = storage.getItem('partokens-oauth-return') || undefined
  return { intent: bindState ? 'bind' : 'login', locale, provider, state, returnTo }
}

export function writeOAuthContext(context: OAuthContext, storage: Storage = storageFor()) {
  storage.setItem(oauthContextKey, JSON.stringify(context))
}

export function clearOAuthContext(storage: Storage = storageFor()) {
  storage.removeItem(oauthContextKey)
  for (const key of legacyOAuthKeys) storage.removeItem(key)
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index)
    if (key?.startsWith(legacyOAuthStatePrefix) || key?.startsWith(legacyOAuthBindStatePrefix)) storage.removeItem(key)
  }
  if (typeof window !== 'undefined' && storage === window.sessionStorage) {
    try {
      if (typeof window.localStorage?.removeItem === 'function') {
        for (const key of legacyOAuthKeys) window.localStorage.removeItem(key)
      }
    } catch { /* Storage may be disabled. */ }
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

export type AuthFailureKind = 'network' | 'rate-limit' | 'turnstile' | 'other'

type AuthTranslate = (key: string, options?: Record<string, string>) => string

const invalidCredentialsMessages = new Set([
  '用户名或密码错误，或用户已被封禁',
  '使用者名或密碼錯誤，或使用者已被封禁',
  'Username or password is incorrect, or user has been banned',
])

const newApiAuthMessages = new Map<string, string>([
  ['参数错误', 'Authentication request is invalid.'],
  ['无效的参数', 'Authentication request is invalid.'],
  ['無效的參數', 'Authentication request is invalid.'],
  ['Invalid parameters', 'Authentication request is invalid.'],
  ['无效的邮箱地址', 'Invalid email address.'],
  ['無效的電子郵件地址', 'Invalid email address.'],
  ['Invalid email address', 'Invalid email address.'],
  ["The administrator has enabled the email domain name whitelist, and your email address is not allowed due to special symbols or it's not in the whitelist.", 'This email address is not allowed by the configured domain whitelist.'],
  ['管理员已启用邮箱地址别名限制，您的邮箱地址由于包含特殊符号而被拒绝。', 'Email aliases with special symbols are not allowed.'],
  ['管理員已啟用電子郵件地址別名限制，您的電子郵件地址因包含特殊符號而被拒絕。', 'Email aliases with special symbols are not allowed.'],
  ['邮箱地址已被占用', 'Email address is already in use.'],
  ['信箱位址已被占用', 'Email address is already in use.'],
  ['Email address is already in use', 'Email address is already in use.'],
  ['email is already in use', 'Email address is already in use.'],
  ['无效的授权码', 'OAuth authorization code is invalid.'],
  ['無效的授權碼', 'OAuth authorization code is invalid.'],
  ['Invalid authorization code', 'OAuth authorization code is invalid.'],
  ['获取用户信息失败', 'Unable to load the OAuth account information.'],
  ['獲取使用者資訊失敗', 'Unable to load the OAuth account information.'],
  ['Failed to get user information', 'Unable to load the OAuth account information.'],
  ['该账户已被其他用户绑定', 'This OAuth account is already connected to another user.'],
  ['該帳號已被其他使用者綁定', 'This OAuth account is already connected to another user.'],
  ['This account has been bound to another user', 'This OAuth account is already connected to another user.'],
  ['未知的 OAuth 提供商', 'Unknown OAuth provider.'],
  ['未知的 OAuth 供應者', 'Unknown OAuth provider.'],
  ['Unknown OAuth provider', 'Unknown OAuth provider.'],
  ['用户已注销', 'OAuth account has been deleted.'],
  ['使用者已註銷', 'OAuth account has been deleted.'],
  ['User has been deleted', 'OAuth account has been deleted.'],
  ['state 参数为空或不匹配', 'OAuth state is invalid or has expired.'],
  ['state 參數為空或不匹配', 'OAuth state is invalid or has expired.'],
  ['State parameter is empty or mismatched', 'OAuth state is invalid or has expired.'],
  ['Linux DO 信任等级未达到管理员设置的最低信任等级', 'Linux DO trust level is too low for this account.'],
  ['Linux DO 信任等級未達到管理員設定的最低信任等級', 'Linux DO trust level is too low for this account.'],
  ['Linux DO trust level does not meet the minimum required by administrator', 'Linux DO trust level is too low for this account.'],
  ['绑定操作需要登录', 'Sign in to connect an account.'],
  ['綁定操作需要登入', 'Sign in to connect an account.'],
  ['a dashboard login session is required', 'Sign in to connect an account.'],
  ['not authenticated', 'Sign in to connect an account.'],
  ['access_denied', 'OAuth authorization was cancelled.'],
  ['cancelled', 'OAuth authorization was cancelled.'],
  ['canceled', 'OAuth authorization was cancelled.'],
  ['用户拒绝授权', 'OAuth authorization was cancelled.'],
  ['使用者拒絕授權', 'OAuth authorization was cancelled.'],
  ['Authorization denied', 'OAuth authorization was cancelled.'],
  ['The user denied access', 'OAuth authorization was cancelled.'],
  ['User denied access', 'OAuth authorization was cancelled.'],
  ['Access denied', 'OAuth authorization was cancelled.'],
  ['access denied', 'OAuth authorization was cancelled.'],
  ['当前认证方式不支持安全验证', 'Security verification is unavailable for this session.'],
  ['目前認證方式不支援安全驗證', 'Security verification is unavailable for this session.'],
  ['验证码必须是6位数字', 'Enter a 6-digit authenticator code.'],
  ['驗證碼必須是 6 位數字', 'Enter a 6-digit authenticator code.'],
  ['验证码只能包含数字', 'Enter a 6-digit authenticator code.'],
  ['驗證碼只能包含數字', 'Enter a 6-digit authenticator code.'],
  ['用户已启用2FA，请先禁用后重新设置', 'Two-factor authentication is already enabled.'],
  ['使用者已啟用2FA，請先停用後重新設定', 'Two-factor authentication is already enabled.'],
  ['用户已存在2FA设置', 'Two-factor authentication is already enabled.'],
  ['使用者已存在2FA設定', 'Two-factor authentication is already enabled.'],
  ['2FA已经启用', 'Two-factor authentication is already enabled.'],
  ['2FA已經啟用', 'Two-factor authentication is already enabled.'],
  ['请先完成2FA初始化设置', 'Two-factor setup is not initialized.'],
  ['請先完成2FA初始化設定', 'Two-factor setup is not initialized.'],
  ['无效的2FA待验证设置', 'Two-factor setup is invalid.'],
  ['無效的2FA待驗證設定', 'Two-factor setup is invalid.'],
  ['生成2FA密钥失败', 'Unable to initialize two-factor authentication. Try again.'],
  ['生成2FA密鑰失敗', 'Unable to initialize two-factor authentication. Try again.'],
  ['生成备用码失败', 'Unable to generate backup codes. Try again.'],
  ['生成備用碼失敗', 'Unable to generate backup codes. Try again.'],
  ['保存备用码失败', 'Unable to save backup codes. Try again.'],
  ['保存備用碼失敗', 'Unable to save backup codes. Try again.'],
  ['更新2FA失败次数冲突，请重试', 'Unable to update two-factor authentication. Try again.'],
  ['更新2FA失敗次數衝突，請再試', 'Unable to update two-factor authentication. Try again.'],
  ['2FA记录ID不能为空', 'Authentication request is invalid.'],
  ['2FA記錄ID不能為空', 'Authentication request is invalid.'],
  ['用户ID不能为空', 'Authentication request is invalid.'],
  ['使用者ID不能為空', 'Authentication request is invalid.'],
  ['生成默认令牌失败', 'Registration failed.'],
  ['生成預設令牌失敗', 'Registration failed.'],
  ['创建默认令牌失败', 'Registration failed.'],
  ['建立預設令牌失敗', 'Registration failed.'],
  ['Failed to create default token', 'Registration failed.'],
  ['管理员关闭了新用户注册', 'Registration is currently unavailable.'],
  ['管理員關閉了新使用者註冊', 'Registration is currently unavailable.'],
  ['New user registration has been disabled by administrator', 'Registration is currently unavailable.'],
  ['管理员关闭了通过密码进行注册，请使用第三方账户验证的形式进行注册', 'Password registration is currently unavailable.'],
  ['管理員關閉了通過密碼進行註冊，請使用第三方帳號驗證的形式進行註冊', 'Password registration is currently unavailable.'],
  ['Password registration has been disabled by administrator, please use third-party account verification', 'Password registration is currently unavailable.'],
  ['用户名已存在，或已注销', 'Username already exists or has been deleted.'],
  ['使用者名已存在，或已註銷', 'Username already exists or has been deleted.'],
  ['Username already exists or has been deleted', 'Username already exists or has been deleted.'],
  ['用户注册失败或用户ID获取失败', 'Registration failed.'],
  ['使用者註冊失敗或使用者 ID 取得失敗', 'Registration failed.'],
  ['User registration failed or user ID retrieval failed', 'Registration failed.'],
  ['管理员开启了邮箱验证，请输入邮箱地址和验证码', 'Enter the email address and verification code required for registration.'],
  ['管理員開啟了信箱驗證，請輸入信箱位址和驗證碼', 'Enter the email address and verification code required for registration.'],
  ['Email verification is enabled, please enter email address and verification code', 'Enter the email address and verification code required for registration.'],
  ['验证码错误或已过期', 'Verification code is incorrect or has expired.'],
  ['驗證碼錯誤或已過期', 'Verification code is incorrect or has expired.'],
  ['Verification code is incorrect or has expired', 'Verification code is incorrect or has expired.'],
  ['重置链接非法或已过期', 'This reset link is invalid or has expired. Request a new one.'],
  ['重設連結非法或已過期', 'This reset link is invalid or has expired. Request a new one.'],
  ['Password reset link is invalid or has expired', 'This reset link is invalid or has expired. Request a new one.'],
  ['Turnstile token 为空', 'Complete the security verification and try again.'],
  ['Turnstile token is empty', 'Complete the security verification and try again.'],
  ['Turnstile 校验失败，请刷新重试！', 'Complete the security verification and try again.'],
  ['Turnstile verification failed, please refresh and try again!', 'Complete the security verification and try again.'],
  ['数据库出错，请联系管理员', 'The authentication service is temporarily unavailable. Try again.'],
  ['資料庫出錯，請聯繫管理員', 'The authentication service is temporarily unavailable. Try again.'],
  ['Database error, please contact the administrator', 'The authentication service is temporarily unavailable. Try again.'],
  ['database error', 'The authentication service is temporarily unavailable. Try again.'],
  ['auth flow is invalid', 'The authentication service is temporarily unavailable. Try again.'],
  ['auth flow has expired', 'Login flow expired. Please sign in again.'],
  ['auth flow has already been consumed', 'Login flow expired. Please sign in again.'],
  ['管理员关闭了密码登录', 'Password sign-in is currently unavailable.'],
  ['管理員關閉了密碼登錄', 'Password sign-in is currently unavailable.'],
  ['Password login has been disabled by administrator', 'Password sign-in is currently unavailable.'],
  ['用户已被封禁', 'Account has been banned.'],
  ['使用者已被封禁', 'Account has been banned.'],
  ['User has been banned', 'Account has been banned.'],
  ['会话已过期，请重新登录', 'Login flow expired. Please sign in again.'],
  ['使用者不存在', 'Account not found.'],
  ['用户不存在', 'Account not found.'],
  ['User does not exist', 'Account not found.'],
  ['用户已被禁用', 'Account has been disabled.'],
  ['該使用者已被禁用', 'Account has been disabled.'],
  ['This user has been disabled', 'Account has been disabled.'],
  ['用户未启用2FA', 'Two-factor authentication is not enabled for this account.'],
  ['使用者未啟用2FA', 'Two-factor authentication is not enabled for this account.'],
  ['User has not enabled 2FA', 'Two-factor authentication is not enabled for this account.'],
  ['2fa not enabled', 'Two-factor authentication is not enabled for this account.'],
  ['2fa already enabled', 'Two-factor authentication is already enabled.'],
  ['验证码或备用码错误，请重试', 'Verification code or backup code is incorrect.'],
  ['验证码或备用码不正确', 'Verification code or backup code is incorrect.'],
  ['驗證碼或備用碼錯誤，請重試', 'Verification code or backup code is incorrect.'],
  ['驗證碼或備用碼不正確', 'Verification code or backup code is incorrect.'],
  ['Verification code or backup code is incorrect', 'Verification code or backup code is incorrect.'],
  ['Session expired, please sign in again', 'Login flow expired. Please sign in again.'],
  ['Session expired, please login again', 'Login flow expired. Please sign in again.'],
])

const emailRateLimitPatterns = [
  /^发送过于频繁，请等待\s*(\d+)\s*秒后再试$/,
  /^傳送過於頻繁，請等待\s*(\d+)\s*秒後再試$/,
  /^Too many requests,? please wait\s*(\d+)\s*seconds? and try again$/i,
]

const invalidRegistrationPatterns = [
  /^输入不合法(?:\s|$)/,
  /^輸入不合法(?:\s|$)/,
  /^Invalid input(?:\s|$)/i,
]

const accountLockedPatterns = [
  /^账户已被锁定，请在\s*(.+?)\s*后重试[。.]?$/,
  /^帳戶已被鎖定，請在\s*(.+?)\s*後重試[。.]?$/,
  /^Account (?:has been )?locked,?\s*(?:please )?try again after\s*(.+?)[.]?$/i,
]

const oauthProviderPatterns: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /^管理员未开启通过\s*(.+?)\s*登录以及注册$/, key: 'OAuth login and registration are disabled for {{provider}}.' },
  { pattern: /^管理員未開啟通過\s*(.+?)\s*登錄以及註冊$/, key: 'OAuth login and registration are disabled for {{provider}}.' },
  { pattern: /^(.+?) login and registration has not been enabled by administrator$/i, key: 'OAuth login and registration are disabled for {{provider}}.' },
  { pattern: /^该\s*(.+?)\s*账户已被绑定$/, key: 'This {{provider}} account is already connected.' },
  { pattern: /^該\s*(.+?)\s*帳號已被綁定$/, key: 'This {{provider}} account is already connected.' },
  { pattern: /^This (.+?) account has already been bound$/i, key: 'This {{provider}} account is already connected.' },
  { pattern: /^无法连接至\s*(.+?)\s*服务器，请稍后重试$/, key: 'Unable to connect to {{provider}}. Try again later.' },
  { pattern: /^無法連接至\s*(.+?)\s*伺服器，請稍後再試$/, key: 'Unable to connect to {{provider}}. Try again later.' },
  { pattern: /^Unable to connect to (.+?) server, please try again later$/i, key: 'Unable to connect to {{provider}}. Try again later.' },
  { pattern: /^(.+?) 获取 Token 失败，请检查设置$/, key: 'Unable to obtain a token from {{provider}}. Check provider settings.' },
  { pattern: /^(.+?) 獲取 Token 失敗，請檢查設定$/, key: 'Unable to obtain a token from {{provider}}. Check provider settings.' },
  { pattern: /^Failed to get token from (.+?), please check settings$/i, key: 'Unable to obtain a token from {{provider}}. Check provider settings.' },
  { pattern: /^(.+?) 获取用户信息为空，请检查设置$/, key: '{{provider}} returned no account information. Check provider settings.' },
  { pattern: /^(.+?) 獲取使用者資訊為空，請檢查設定$/, key: '{{provider}} returned no account information. Check provider settings.' },
  { pattern: /^(.+?) returned empty user info, please check settings$/i, key: '{{provider}} returned no account information. Check provider settings.' },
]

function localizedNewApiAuthMessage(message: string, t: AuthTranslate): string | null {
  const normalized = message.trim()
  if (invalidCredentialsMessages.has(normalized)) {
    return t('Username or password is incorrect, or the account has been banned.')
  }
  for (const pattern of accountLockedPatterns) {
    const match = normalized.match(pattern)
    if (match?.[1]) return t('Account locked. Try again after {{time}}.', { time: match[1].trim() })
  }
  for (const pattern of emailRateLimitPatterns) {
    const match = normalized.match(pattern)
    if (match?.[1]) return t('Too many verification emails. Try again in {{seconds}}s.', { seconds: match[1] })
  }
  if (normalized === '发送过于频繁，请稍后再试' || normalized === '傳送過於頻繁，請稍後再試') {
    return t('Too many verification emails. Try again later.')
  }
  if (invalidRegistrationPatterns.some((pattern) => pattern.test(normalized))) {
    return t('Registration details are invalid.')
  }
  for (const { pattern, key } of oauthProviderPatterns) {
    const match = normalized.match(pattern)
    if (match?.[1]) return t(key, { provider: match[1].trim() })
  }
  const key = newApiAuthMessages.get(normalized)
  return key ? t(key) : null
}

const authCodeMessages: Record<string, string> = {
  AUTH_SESSION_LIMIT: 'Too many active sessions. Close another session and try again.',
  AUTH_SESSION_ISSUANCE_LIMIT: 'Too many new sessions were created recently. Wait a moment and try again.',
  AUTH_SESSION_REQUIRED: 'Sign in to continue.',
  AUTH_SESSION_ID_REQUIRED: 'Login flow expired. Please sign in again.',
  AUTH_SESSION_NOT_FOUND: 'Login flow expired. Please sign in again.',
  AUTH_REFRESH_RACE: 'Login flow expired. Please sign in again.',
  AUTH_TOKEN_EXPIRED: 'Login flow expired. Please sign in again.',
  AUTH_REFRESH_FAILED: 'The authentication service is temporarily unavailable. Try again.',
  AUTH_INVALID_REFRESH_RESPONSE: 'The authentication service is temporarily unavailable. Try again.',
  AUTH_SESSION_INVALID: 'Login flow expired. Please sign in again.',
  AUTH_SESSION_MISMATCH: 'Login flow expired. Please sign in again.',
  AUTH_SESSION_REVOKED: 'Login flow expired. Please sign in again.',
  AUTH_UNAUTHORIZED: 'Login flow expired. Please sign in again.',
  AUTH_INTERNAL_ERROR: 'The authentication service is temporarily unavailable. Try again.',
}

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

export function localizedAuthError(error: unknown, fallback: string, t: AuthTranslate) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return t('You appear to be offline. Check your connection and try again.')
  const value = error && typeof error === 'object' ? error as {
    code?: string
    response?: { status?: number; data?: { code?: string; message?: string } }
  } : null
  const code = value?.response?.data?.code || value?.code
  if (code && authCodeMessages[code]) return t(authCodeMessages[code])
  const responseMessage = value?.response?.data?.message
  const localizedResponseMessage = responseMessage ? localizedNewApiAuthMessage(responseMessage, t) : null
  if (localizedResponseMessage) return localizedResponseMessage
  const kind = authFailureKind(error)
  if (kind === 'network') return t('Unable to reach the authentication service. Check your connection and try again.')
  if (kind === 'rate-limit') return t('Too many authentication attempts. Wait a moment and try again.')
  if (kind === 'turnstile') return t('Complete the security verification and try again.')
  if (value?.response) {
    const response = value.response
    if (response.status === 400) return t('Authentication request is invalid.')
    if (response.status === 413) return t('Request is too large. Try again.')
    if (response.status === 401 || response.status === 403 || response.status === 404) return t('Login flow expired. Please sign in again.')
    if (response.status === 409) return t('Unable to complete sign in. Try again.')
    if (response?.status && response.status >= 500) return t('The authentication service is temporarily unavailable. Try again.')
  }
  if (error instanceof Error && error.message) return localizedNewApiAuthMessage(error.message, t) ?? fallback
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
    const result = await getOAuthState({
      provider,
      intent,
      aff: intent === 'login' ? window.localStorage.getItem('aff') || undefined : undefined,
    })
    if (!result.success || !result.data) {
      const failure = new Error(result.message || 'OAuth state unavailable') as Error & { code?: string }
      failure.code = result.code
      throw failure
    }
    state = result.data.flow_token
  } catch (error) {
    popup?.close()
    throw error
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
        (typeof data.code !== 'string' && typeof data.error !== 'string')
      ) return
      const code = typeof data.code === 'string' ? data.code : undefined
      const providerError = typeof data.error === 'string' ? data.error : undefined
      const providerErrorDescription = typeof data.error_description === 'string' ? data.error_description : undefined
      void exchangeOAuth(provider, { code, state, error: providerError, error_description: providerErrorDescription }, 'bind')
        .then((result) => {
          if (!result.success || !result.data || !('action' in result.data) || result.data.action !== 'bind') {
            const failure = new Error(result.message || 'OAuth bind failed') as Error & { code?: string }
            failure.code = result.code
            throw failure
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
