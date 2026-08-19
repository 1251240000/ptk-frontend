// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'

import { authFailureKind, clearOAuthContext, localizedAuthError, readOAuthContext, validatedReturnPath } from '../auth-flow'
import {
  clearRegistrationContext,
  readRegistrationContext,
  registrationCooldown,
  writeRegistrationContext,
} from '../registration-context'

describe('authentication navigation and transient state', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/en/auth/sign-in')
    window.sessionStorage.clear()
  })

  it('accepts only same-origin localized non-authentication return paths', () => {
    expect(validatedReturnPath('en', '/en/console/overview?range=30d#usage')).toBe('/en/console/overview?range=30d#usage')
    expect(validatedReturnPath('en', 'https://example.test/en/console/overview')).toBeNull()
    expect(validatedReturnPath('en', '//example.test/en/console/overview')).toBeNull()
    expect(validatedReturnPath('en', '/fr/console/overview')).toBeNull()
    expect(validatedReturnPath('en', '/en/auth/otp')).toBeNull()
    expect(validatedReturnPath('en', '/channels')).toBeNull()
  })

  it('stores only reload-safe registration email and cooldown context', () => {
    writeRegistrationContext({ email: 'person@example.test', sentAt: 10_000 })

    expect(readRegistrationContext()).toEqual({ email: 'person@example.test', sentAt: 10_000 })
    expect(registrationCooldown(readRegistrationContext(), 25_000)).toBe(45)
    expect(window.sessionStorage.getItem('partokens-auth-registration-context')).not.toMatch(/password|code|token/i)

    clearRegistrationContext()
    expect(readRegistrationContext()).toBeNull()
  })

  it('reads and clears a legacy OAuth callback context during migration', () => {
    window.sessionStorage.setItem('partokens-oauth-locale', 'fr')
    window.sessionStorage.setItem('partokens-oauth-return', '/fr/console/overview')
    window.sessionStorage.setItem('partokens-oauth-state:google', 'legacy-state')

    expect(readOAuthContext('google')).toEqual({
      intent: 'login',
      locale: 'fr',
      provider: 'google',
      returnTo: '/fr/console/overview',
      state: 'legacy-state',
    })

    clearOAuthContext()
    expect(readOAuthContext('google')).toBeNull()
  })

  it('maps transport and rate-limit failures without exposing raw responses', () => {
    const t = (key: string) => `translated:${key}`
    const network = { code: 'ERR_NETWORK', message: 'Bearer secret-network-value' }
    const limited = { response: { status: 429, data: { message: 'api-key=secret-rate-value' } } }

    expect(authFailureKind(network)).toBe('network')
    expect(authFailureKind(limited)).toBe('rate-limit')
    expect(localizedAuthError(network, 'fallback', t)).toContain('translated:Unable to reach')
    expect(localizedAuthError(limited, 'fallback', t)).toContain('translated:Too many authentication attempts')
    expect(`${localizedAuthError(network, 'fallback', t)} ${localizedAuthError(limited, 'fallback', t)}`).not.toMatch(/secret-/)
  })

  it('localizes new-api authentication failures returned in successful HTTP responses', () => {
    const t = (key: string, options?: Record<string, string>) => `${key}|${options?.time ?? options?.seconds ?? options?.provider ?? ''}`

    expect(localizedAuthError(
      new Error('用户名或密码错误，或用户已被封禁'),
      'fallback',
      t,
    )).toBe('Username or password is incorrect, or the account has been banned.|')
    expect(localizedAuthError(
      new Error('账户已被锁定，请在2026-08-19 14:26:04后重试'),
      'fallback',
      t,
    )).toBe('Account locked. Try again after {{time}}.|2026-08-19 14:26:04')

    const messages = [
      ['验证码或备用码不正确', 'Verification code or backup code is incorrect.'],
      ['验证码或备用码错误，请重试', 'Verification code or backup code is incorrect.'],
      ['会话已过期，请重新登录', 'Login flow expired. Please sign in again.'],
      ['用户不存在', 'Account not found.'],
      ['用户已被禁用', 'Account has been disabled.'],
      ['用户未启用2FA', 'Two-factor authentication is not enabled for this account.'],
      ['参数错误', 'Authentication request is invalid.'],
      ['无效的参数', 'Authentication request is invalid.'],
      ['邮箱地址已被占用', 'Email address is already in use.'],
      ['email is already in use', 'Email address is already in use.'],
      ['无效的授权码', 'OAuth authorization code is invalid.'],
      ['未知的 OAuth 提供商', 'Unknown OAuth provider.'],
      ['用户已注销', 'OAuth account has been deleted.'],
      ['state 参数为空或不匹配', 'OAuth state is invalid or has expired.'],
      ['当前认证方式不支持安全验证', 'Security verification is unavailable for this session.'],
      ['生成备用码失败', 'Unable to generate backup codes. Try again.'],
      ['access_denied', 'OAuth authorization was cancelled.'],
      ['not authenticated', 'Sign in to connect an account.'],
      ['The user denied access', 'OAuth authorization was cancelled.'],
      ['无效的邮箱地址', 'Invalid email address.'],
      ['管理员关闭了新用户注册', 'Registration is currently unavailable.'],
      ['验证码错误或已过期', 'Verification code is incorrect or has expired.'],
      ['重置链接非法或已过期', 'This reset link is invalid or has expired. Request a new one.'],
      ["输入不合法 Key: 'User.Username' Error:Field validation", 'Registration details are invalid.'],
    ] as const
    for (const [message, expected] of messages) {
      expect(localizedAuthError(new Error(message), 'fallback', t)).toBe(`${expected}|`)
    }
    expect(localizedAuthError(new Error('an unknown backend detail'), 'translated fallback', t)).toBe('translated fallback')
    expect(localizedAuthError(new Error('发送过于频繁，请等待 12 秒后再试'), 'fallback', t)).toBe('Too many verification emails. Try again in {{seconds}}s.|12')
    expect(localizedAuthError(new Error('发送过于频繁，请稍后再试'), 'fallback', t)).toBe('Too many verification emails. Try again later.|')
    expect(localizedAuthError(new Error('管理员未开启通过 GitHub 登录以及注册'), 'fallback', t)).toBe('OAuth login and registration are disabled for {{provider}}.|GitHub')
    expect(localizedAuthError(new Error('Unable to connect to Linux DO server, please try again later'), 'fallback', t)).toBe('Unable to connect to {{provider}}. Try again later.|Linux DO')
    expect(localizedAuthError(new Error('This GitHub account has already been bound'), 'fallback', t)).toBe('This {{provider}} account is already connected.|GitHub')
  })

  it('localizes new-api session error codes from non-200 responses', () => {
    const t = (key: string) => `translated:${key}`
    expect(localizedAuthError({ response: { status: 409, data: { code: 'AUTH_SESSION_LIMIT', message: 'Conflict' } } }, 'fallback', t)).toBe('translated:Too many active sessions. Close another session and try again.')
    expect(localizedAuthError({ response: { status: 429, data: { code: 'AUTH_SESSION_ISSUANCE_LIMIT', message: 'Too Many Requests' } } }, 'fallback', t)).toBe('translated:Too many new sessions were created recently. Wait a moment and try again.')
    expect(localizedAuthError({ response: { status: 429, data: { message: '发送过于频繁，请等待 12 秒后再试' } } }, 'fallback', t)).toBe('translated:Too many verification emails. Try again in {{seconds}}s.')
    expect(localizedAuthError({ response: { status: 409, data: { message: 'Conflict' } } }, 'fallback', t)).toBe('translated:Unable to complete sign in. Try again.')
    expect(localizedAuthError({ response: { status: 413 } }, 'fallback', t)).toBe('translated:Request is too large. Try again.')
    expect(localizedAuthError({ response: { status: 403, data: { code: 'AUTH_SESSION_REQUIRED', message: 'a dashboard login session is required' } } }, 'fallback', t)).toBe('translated:Sign in to continue.')
    expect(localizedAuthError({ response: { status: 401, data: { code: 'AUTH_TOKEN_EXPIRED', message: 'Unauthorized' } } }, 'fallback', t)).toBe('translated:Login flow expired. Please sign in again.')
  })
})
