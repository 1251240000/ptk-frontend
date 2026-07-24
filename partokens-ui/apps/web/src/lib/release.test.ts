import { describe, expect, it } from 'vitest'

import { normalizePublicSourceUrl } from './release'

describe('public source release metadata', () => {
  it('accepts an HTTPS corresponding-source URL', () => {
    expect(normalizePublicSourceUrl(' https://code.example/partokens-ui ')).toBe('https://code.example/partokens-ui')
  })

  it('rejects missing, malformed, and non-HTTPS source locations', () => {
    expect(normalizePublicSourceUrl(undefined)).toBeNull()
    expect(normalizePublicSourceUrl('not a url')).toBeNull()
    expect(normalizePublicSourceUrl('http://code.example/partokens-ui')).toBeNull()
  })
})
