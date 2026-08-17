import { describe, expect, it } from 'vitest'

import {
  containsSensitiveLogText,
  mergeLogTokenTotals,
  parseLogPage,
  parseLogStats,
  parseLogTokenTotalsPage,
  sanitizeLogRecord,
} from '@/lib/console-usage-contract'

describe('canonical console usage log boundary', () => {
  it('projects API records onto safe fields before they can enter Query cache', () => {
    const record = sanitizeLogRecord({
      id: 1,
      created_at: 1_721_520_000,
      type: 2,
      token_name: 'Bearer secret-value',
      model_name: 'model sk-1234567890abcdef',
      prompt_tokens: 12,
      completion_tokens: 8,
      quota: 5_000,
      use_time: 0.4,
      is_stream: false,
      group: 'default',
      request_id: 'https://private.example/path?token=secret',
      upstream_request_id: 'upstream-safe',
      content: 'Authorization: Bearer raw-request-secret',
      other: JSON.stringify({ output_url: 'https://private.example/result?sig=secret', cache_tokens: 3, group_ratio: 1.5, model_ratio: 0.2, completion_ratio: 4, cache_ratio: 0.25, model_price: -1, frt: 275 }),
      api_key: 'sk-raw-unknown-field',
    })

    expect(record).toMatchObject({
      tokenName: 'Bearer [redacted]',
      modelName: 'model [redacted key]',
      requestId: '[redacted URL]',
      promptTokens: 12,
      completionTokens: 8,
      cacheTokens: 3,
      groupRatio: 1.5,
      modelRatio: 0.2,
      completionRatio: 4,
      cacheRatio: 0.25,
      modelPrice: undefined,
      firstResponseTime: 275,
      redacted: true,
    })
    expect(record).not.toHaveProperty('content')
    expect(record).not.toHaveProperty('other')
    expect(record).not.toHaveProperty('api_key')
    expect(JSON.stringify(record)).not.toContain('raw-request-secret')
    expect(JSON.stringify(record)).not.toContain('sig=secret')
  })

  it('keeps usable partial rows while rejecting an unusable page contract', () => {
    const page = parseLogPage({
      items: [
        { id: 1, created_at: 1_721_520_000, type: 2, prompt_tokens: 4 },
        { id: 2 },
      ],
      total: 2,
      page: 1,
      page_size: 20,
    }, 1)

    expect(page.records).toHaveLength(1)
    expect(page.records[0]).toMatchObject({ promptTokens: 4, completionTokens: 0, cacheTokens: 0 })
    expect(page.invalidCount).toBe(1)
    expect(page.partialCount).toBe(1)
    expect(() => parseLogPage({ items: [{ id: 2 }], total: 1, page: 1, page_size: 20 }, 1)).toThrow(/required id, time, and type/)
  })

  it('validates statistics independently and blocks sensitive filter values', () => {
    expect(parseLogStats({ quota: 1_000, rpm: 2 })).toEqual({ quota: 1_000, rpm: 2, tpm: 0, partial: true })
    expect(parseLogStats({ quota: '1000' })).toEqual({ quota: 0, rpm: 0, tpm: 0, partial: true })
    expect(containsSensitiveLogText('Bearer account-secret')).toBe(true)
    expect(containsSensitiveLogText('https://example.test/callback?token=secret')).toBe(true)
    expect(containsSensitiveLogText('req_123456')).toBe(false)
  })

  it('aggregates token totals from usage log pages instead of unsupported statistics fields', () => {
    const first = parseLogTokenTotalsPage({
      items: [
        { type: 2, prompt_tokens: 120, completion_tokens: 64, other: JSON.stringify({ cache_tokens: 12 }) },
        { type: 5, prompt_tokens: 999, completion_tokens: 999, other: JSON.stringify({ cache_tokens: 999 }) },
      ],
      total: 3,
      page: 1,
      page_size: 2,
    }, 1)
    const second = parseLogTokenTotalsPage({
      items: [{ type: 2, prompt_tokens: 80, completion_tokens: 36, other: { cache_tokens: 8 } }],
      total: 3,
      page: 2,
      page_size: 2,
    }, 2)

    expect(mergeLogTokenTotals([first, second])).toEqual({
      promptTokens: 200,
      completionTokens: 100,
      cacheTokens: 20,
      partial: false,
    })
  })

  it('marks token totals partial instead of presenting missing fields as exact zeroes', () => {
    const page = parseLogTokenTotalsPage({
      items: [{ type: 2, prompt_tokens: 4, other: '{"cache_tokens":"invalid"}' }],
      total: 1,
      page: 1,
      page_size: 100,
    }, 1)

    expect(page).toMatchObject({ promptTokens: 4, completionTokens: 0, cacheTokens: 0, partial: true })
    expect(mergeLogTokenTotals([page], true)).toMatchObject({ promptTokens: 4, partial: true })
  })
})
