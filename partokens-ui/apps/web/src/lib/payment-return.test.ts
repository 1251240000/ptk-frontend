// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TopupRecord } from '@partokens/api-client'

import {
  matchPaymentOrder,
  matchRecentPaymentOrder,
  normalizePaymentReturnParams,
  normalizePaymentStatus,
  paymentReturnStorageKey,
  readPaymentReturnContext,
  resolvePaymentLocale,
} from './payment-return'

beforeEach(() => window.sessionStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('payment return normalization', () => {
  it('maps provider pay values, including pay=fail to failed', () => {
    expect(normalizePaymentStatus(undefined, 'success')).toBe('success')
    expect(normalizePaymentStatus(undefined, 'fail')).toBe('failed')
    expect(normalizePaymentStatus(undefined, 'pending')).toBe('pending')
    expect(normalizePaymentStatus('not-real', undefined)).toBe('unknown')
  })

  it('keeps only safe identifiers and supported provider values', () => {
    expect(normalizePaymentReturnParams('?pay=fail&trade_no=ORDER-2&provider=waffo&secret=drop')).toEqual({
      status: 'failed',
      trade_no: 'ORDER-2',
      provider: 'waffo',
    })
    expect(normalizePaymentReturnParams('?status=success&order_id=https%3A%2F%2Fevil.example')).toEqual({ status: 'success' })
    expect(normalizePaymentReturnParams('?pay=success&out_trade_no=EPAY-2')).toEqual({ status: 'success', trade_no: 'EPAY-2' })
  })

  it('resolves locale in the documented priority order', () => {
    expect(resolvePaymentLocale({ pathLocale: 'en', langCode: 'zh-CN', browserLocale: 'fr-FR' })).toBe('en')
    expect(resolvePaymentLocale({ langCode: 'invalid', lang: 'ja', storedLocale: 'fr', browserLocale: 'en-US' })).toBe('ja')
    expect(resolvePaymentLocale({ browserLocale: 'zh-TW' })).toBe('zh-TW')
    expect(resolvePaymentLocale({ browserLocale: 'xx-XX' })).toBe('zh-CN')
  })

  it('matches an order by trade number or backend order/session fields', () => {
    const records = [{ id: 1, amount: 20, money: 20, trade_no: 'TRADE-1', order_id: 'ORDER-1', session_id: 'SESSION-1', payment_method: 'waffo', create_time: 1, status: 'failed' }] as TopupRecord[]
    expect(matchPaymentOrder(records, { trade_no: 'TRADE-1' })?.status).toBe('failed')
    expect(matchPaymentOrder(records, { order_id: 'ORDER-1' })?.trade_no).toBe('TRADE-1')
    expect(matchPaymentOrder(records, { session_id: 'SESSION-1' })?.trade_no).toBe('TRADE-1')
    expect(matchPaymentOrder(records, { order_id: 'TRADE-1' })?.trade_no).toBe('TRADE-1')
    expect(matchPaymentOrder(records, { trade_no: 'MISSING' })).toBeNull()
    expect(matchPaymentOrder(records, {})).toBeNull()
  })

  it('matches an identifier-free return only to one recent provider order', () => {
    const createdAt = Date.now()
    const context = { locale: 'en', provider: 'stripe', created_at: createdAt, wallet_path: '/en/console/wallet' } as const
    const recent = { id: 2, amount: 20, money: 20, trade_no: 'STRIPE-2', payment_method: 'stripe', payment_provider: 'stripe', create_time: Math.floor(createdAt / 1000), status: 'success' } as TopupRecord
    const old = { ...recent, id: 1, trade_no: 'STRIPE-1', create_time: Math.floor((createdAt - 10 * 60 * 1000) / 1000) }

    expect(matchRecentPaymentOrder([old, recent], context)?.trade_no).toBe('STRIPE-2')
    expect(matchRecentPaymentOrder([recent, { ...recent, id: 3, trade_no: 'STRIPE-3' }], context)).toBeNull()
  })

  it('removes payment return context after 24 hours', () => {
    vi.spyOn(Date, 'now').mockReturnValue(2_000_000_000_000)
    window.sessionStorage.setItem(paymentReturnStorageKey, JSON.stringify({ locale: 'en', provider: 'stripe', created_at: Date.now() - 24 * 60 * 60 * 1000 - 1, wallet_path: '/en/console/wallet' }))

    expect(readPaymentReturnContext()).toBeNull()
    expect(window.sessionStorage.getItem(paymentReturnStorageKey)).toBeNull()
  })
})
