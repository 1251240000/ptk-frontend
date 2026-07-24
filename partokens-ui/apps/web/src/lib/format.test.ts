import { describe, expect, it } from 'vitest'

import { extractItems, formatQuota, maskKey, maskTrace, quotaDollarsToUnits, quotaUnitsToDollars } from './format'

describe('format helpers', () => {
  it('normalizes supported list envelopes', () => {
    expect(extractItems<number>([1, 2])).toEqual([1, 2])
    expect(extractItems<number>({ items: [3] })).toEqual([3])
    expect(extractItems<number>({ data: [4] })).toEqual([4])
  })

  it('formats backend quota units without fabricating missing values', () => {
    expect(formatQuota(500_000, 'en')).toBe('$1.00')
    expect(formatQuota(undefined, 'en')).toBe('—')
  })

  it('masks long keys', () => {
    expect(maskKey('sk-1234567890abcdef')).toBe('sk-12••••••cdef')
    expect(maskTrace('req_1234567890abcdef')).toBe('req_123…bcdef')
  })

  it('converts editable currency amounts to backend quota units', () => {
    expect(quotaDollarsToUnits(10.25)).toBe(5_125_000)
    expect(quotaUnitsToDollars(5_125_000)).toBe(10.25)
    expect(quotaDollarsToUnits(-1)).toBe(0)
  })
})
