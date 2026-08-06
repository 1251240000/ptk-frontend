// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthFlowStore } from '../auth-flow-store'
import {
  cleanBackupCode,
  clearOAuthLoginContext,
  formatBackupCode,
  maskEmail,
  readOAuthLoginContext,
  resolveAuthReturnPath,
  saveOAuthLoginContext,
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
    expect(resolveAuthReturnPath('/en/console/usage-logs?type=2#request', 'en')).toBe('/en/console/usage-logs?type=2#request')
  })

  it.each([
    'https://example.test/en/console/overview',
    '//example.test/en/console/overview',
    '/fr/console/overview',
    '/en/auth/sign-up',
    'en/console/overview',
  ])('rejects an external, cross-locale, authentication, or relative return path', (candidate) => {
    expect(resolveAuthReturnPath(candidate, 'en')).toBeNull()
  })
})

describe('transient OAuth context', () => {
  it('keeps only locale, state, and validated intent context in session storage', () => {
    saveOAuthLoginContext('github', 'csrf-state', 'fr', '/fr/console/overview')

    expect(readOAuthLoginContext('github')).toEqual({
      locale: 'fr',
      state: 'csrf-state',
      returnTo: '/fr/console/overview',
    })
    expect(localStorageSetItem).not.toHaveBeenCalled()

    clearOAuthLoginContext('github')
    expect(readOAuthLoginContext('github')).toEqual({ locale: null, state: null, returnTo: null })
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
