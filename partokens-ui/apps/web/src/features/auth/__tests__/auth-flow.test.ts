// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'

import { authFailureKind, localizedAuthError, validatedReturnPath } from '../auth-flow'
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
})
