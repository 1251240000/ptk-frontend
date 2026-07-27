import { describe, expect, it } from 'vitest'

import {
  containsSensitiveLogText,
  parseLogPage,
  parseLogStats,
  sanitizeLogRecord,
} from './console-foundation-logs-page'

describe('console foundation usage log boundary', () => {
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
      other: JSON.stringify({ output_url: 'https://private.example/result?sig=secret' }),
      api_key: 'sk-raw-unknown-field',
    })

    expect(record).toMatchObject({
      tokenName: 'Bearer [redacted]',
      modelName: 'model [redacted key]',
      requestId: '[redacted URL]',
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
    expect(page.invalidCount).toBe(1)
    expect(page.partialCount).toBe(1)
    expect(() => parseLogPage({ items: [{ id: 2 }], total: 1, page: 1, page_size: 20 }, 1)).toThrow(/required id, time, and type/)
  })

  it('validates statistics independently and blocks sensitive filter values', () => {
    expect(parseLogStats({ quota: 1_000, rpm: 2 })).toEqual({ quota: 1_000, rpm: 2, tpm: undefined, partial: true })
    expect(() => parseLogStats({ quota: '1000' })).toThrow(/no metric is usable/)
    expect(containsSensitiveLogText('Bearer account-secret')).toBe(true)
    expect(containsSensitiveLogText('https://example.test/callback?token=secret')).toBe(true)
    expect(containsSensitiveLogText('req_123456')).toBe(false)
  })
})
