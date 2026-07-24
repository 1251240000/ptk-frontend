import { describe, expect, it } from 'vitest'

import { isConfiguredTopupAmount } from './wallet'

describe('wallet preset validation', () => {
  it('accepts only an exact amount from the latest backend options', () => {
    expect(isConfiguredTopupAmount([10, 50, 100], 50)).toBe(true)
    expect(isConfiguredTopupAmount([10, 50, 100], 25)).toBe(false)
    expect(isConfiguredTopupAmount([10, 50, 100], Number.NaN)).toBe(false)
  })

  it('rejects a formerly valid amount after options change', () => {
    expect(isConfiguredTopupAmount([10, 50], 50)).toBe(true)
    expect(isConfiguredTopupAmount([10, 20], 50)).toBe(false)
  })
})
