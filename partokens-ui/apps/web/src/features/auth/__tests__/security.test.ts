// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearOAuthContext, readOAuthContext, validatedReturnPath, writeOAuthContext } from '../auth-flow'
import { useAuthFlowStore } from '../auth-flow-store'
import {
  cleanBackupCode,
  formatBackupCode,
  maskEmail,
} from '../auth-utils'

const localStorageSetItem = vi.fn()

beforeEach(() => {
  localStorageSetItem.mockClear()
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: localStorageSetItem,
    removeItem: vi.fn(),
    clear: vi.fn(),
  })
  window.sessionStorage.clear()
  useAuthFlowStore.getState().clearRegistration()
  window.history.replaceState({}, '', '/en/auth/sign-in')
})

describe('authentication defaults', () => {
  it('starts registration with legal consent checked', () => {
    expect(useAuthFlowStore.getState().registration.consent).toBe(true)
  })
})

describe('authentication navigation boundaries', () => {
  it('accepts a same-locale route while preserving its search and hash', () => {
    expect(validatedReturnPath('en', '/en/console/usage-logs?type=2#request')).toBe('/en/console/usage-logs?type=2#request')
  })

  it.each([
    'https://example.test/en/console/overview',
    '//example.test/en/console/overview',
    '/fr/console/overview',
    '/en/auth/sign-up',
    'en/console/overview',
  ])('rejects an external, cross-locale, authentication, or relative return path', (candidate) => {
    expect(validatedReturnPath('en', candidate)).toBeNull()
  })
})

describe('transient OAuth context', () => {
  it('keeps only locale, state, and validated intent context in session storage', () => {
    writeOAuthContext({
      intent: 'login',
      locale: 'fr',
      provider: 'github',
      state: 'csrf-state',
      returnTo: '/fr/console/overview',
    })

    expect(readOAuthContext()).toEqual({
      intent: 'login',
      locale: 'fr',
      provider: 'github',
      state: 'csrf-state',
      returnTo: '/fr/console/overview',
    })
    expect(localStorageSetItem).not.toHaveBeenCalled()

    clearOAuthContext()
    expect(readOAuthContext()).toBeNull()
  })
})

describe('authentication display helpers', () => {
  it('masks reset email addresses without exposing the full local part', () => {
    expect(maskEmail('michael@example.com')).toBe('mi***@example.com')
    expect(maskEmail('a@example.com')).toBe('a***@example.com')
    expect(maskEmail('invalid')).toBe('')
  })

  it('normalizes backup codes to the backend format without persisting them', () => {
    expect(formatBackupCode('ca wd-oqdv!')).toBe('CAWD-OQDV')
    expect(cleanBackupCode('CAWD-OQDV')).toBe('CAWDOQDV')
    expect(window.sessionStorage.length).toBe(0)
  })
})
