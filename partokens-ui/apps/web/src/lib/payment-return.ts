import { isAppLocale, type AppLocale } from '@partokens/i18n'

import type { TopupRecord } from '@partokens/api-client'

export const paymentReturnStorageKey = 'partokens-payment-return'
const paymentReturnContextMaxAgeMs = 24 * 60 * 60 * 1000
const paymentOrderClockSkewMs = 5 * 60 * 1000

export type PaymentReturnStatus = 'success' | 'pending' | 'failed' | 'expired' | 'cancelled' | 'unknown'

export type PaymentReturnParams = {
  status: PaymentReturnStatus
  order_id?: string
  trade_no?: string
  session_id?: string
  provider?: string
}

export type PaymentReturnContext = {
  locale: AppLocale
  provider?: string
  order_id?: string
  trade_no?: string
  created_at: number
  wallet_path: string
}

const allowedProviders = new Set(['epay', 'stripe', 'creem', 'waffo', 'waffo-pancake'])
const identifierPattern = /^[\w.:/-]{1,200}$/

function safeValue(value: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed && identifierPattern.test(trimmed) && !trimmed.includes('://') ? trimmed : undefined
}

function normalizeProvider(value: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase()
  return normalized && allowedProviders.has(normalized) ? normalized : undefined
}

export function normalizePaymentStatus(status?: string | null, pay?: string | null): PaymentReturnStatus {
  const statusValue = status?.trim().toLowerCase()
  if (statusValue === 'success' || statusValue === 'pending' || statusValue === 'failed' || statusValue === 'expired' || statusValue === 'cancelled') return statusValue
  const payValue = pay?.trim().toLowerCase()
  if (payValue === 'success') return 'success'
  if (payValue === 'fail') return 'failed'
  if (payValue === 'pending') return 'pending'
  return 'unknown'
}

export function normalizePaymentReturnParams(search: string | URLSearchParams): PaymentReturnParams {
  const query = typeof search === 'string' ? new URLSearchParams(search) : search
  const params: PaymentReturnParams = {
    status: normalizePaymentStatus(query.get('status'), query.get('pay')),
    order_id: safeValue(query.get('order_id')),
    trade_no: safeValue(query.get('trade_no') || query.get('out_trade_no')),
    session_id: safeValue(query.get('session_id')),
    provider: normalizeProvider(query.get('provider')),
  }
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined)) as PaymentReturnParams
}

export function paymentReturnQuery(params: PaymentReturnParams): string {
  const query = new URLSearchParams()
  query.set('status', params.status)
  for (const key of ['order_id', 'trade_no', 'session_id', 'provider'] as const) {
    const value = params[key]
    if (value) query.set(key, value)
  }
  return query.toString()
}

export function hasPaymentReturnSignals(search: string | URLSearchParams): boolean {
  const query = typeof search === 'string' ? new URLSearchParams(search) : search
  return ['status', 'pay', 'order_id', 'trade_no', 'out_trade_no', 'session_id'].some((key) => query.has(key))
}

export function resolvePaymentLocale(options: {
  pathLocale?: string
  langCode?: string | null
  lang?: string | null
  sessionLocale?: string | null
  userLocale?: string | null
  storedLocale?: string | null
  browserLocale?: string | null
} = {}): AppLocale {
  const candidates = [options.pathLocale, options.langCode, options.lang, options.sessionLocale, options.userLocale, options.storedLocale]
  for (const candidate of candidates) if (isAppLocale(candidate ?? undefined)) return candidate as AppLocale

  const browser = options.browserLocale?.toLowerCase()
  if (browser?.startsWith('zh-tw') || browser?.startsWith('zh-hk')) return 'zh-TW'
  if (browser?.startsWith('zh')) return 'zh-CN'
  const short = browser?.split('-')[0]
  if (isAppLocale(short)) return short
  return 'zh-CN'
}

export function savePaymentReturnContext(context: PaymentReturnContext): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(paymentReturnStorageKey, JSON.stringify(context))
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}

export function readPaymentReturnContext(): PaymentReturnContext | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(paymentReturnStorageKey)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<PaymentReturnContext>
    const createdAt = Number(value.created_at)
    const age = Date.now() - createdAt
    if (!isAppLocale(value.locale) || !Number.isFinite(age) || age < -paymentOrderClockSkewMs || age > paymentReturnContextMaxAgeMs || typeof value.wallet_path !== 'string') {
      window.sessionStorage.removeItem(paymentReturnStorageKey)
      return null
    }
    return {
      locale: value.locale,
      provider: typeof value.provider === 'string' ? value.provider : undefined,
      order_id: typeof value.order_id === 'string' ? value.order_id : undefined,
      trade_no: typeof value.trade_no === 'string' ? value.trade_no : undefined,
      created_at: createdAt,
      wallet_path: value.wallet_path,
    }
  } catch {
    return null
  }
}

export function clearPaymentReturnContext(): void {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.removeItem(paymentReturnStorageKey) } catch { /* noop */ }
}

export function clearPaymentReturnContextIfMatched(params: PaymentReturnParams): void {
  const context = readPaymentReturnContext()
  if (!context) return
  if ((!params.order_id || params.order_id === context.order_id) && (!params.trade_no || params.trade_no === context.trade_no)) clearPaymentReturnContext()
}

export function matchPaymentOrder(records: TopupRecord[], params: Pick<PaymentReturnParams, 'order_id' | 'trade_no' | 'session_id'>): TopupRecord | null {
  const identifiers = new Set([params.order_id, params.trade_no, params.session_id].filter((value): value is string => Boolean(value)))
  if (identifiers.size === 0) return null
  return records.find((record) => {
    const candidate = record as TopupRecord & { order_id?: string; session_id?: string }
    return [candidate.trade_no, candidate.order_id, candidate.session_id].some((value) => value != null && identifiers.has(value))
  }) ?? null
}

export function matchRecentPaymentOrder(records: TopupRecord[], context: PaymentReturnContext): TopupRecord | null {
  const expectedProvider = context.provider?.replaceAll('_', '-').toLowerCase()
  const candidates = records.filter((record) => {
    const createdAt = Number(record.create_time) * (Number(record.create_time) > 10_000_000_000 ? 1 : 1000)
    if (!Number.isFinite(createdAt) || Math.abs(createdAt - context.created_at) > paymentOrderClockSkewMs) return false
    if (!expectedProvider) return true
    const provider = (record.payment_provider || record.payment_method || '').replaceAll('_', '-').toLowerCase()
    return provider === expectedProvider
  })
  return candidates.length === 1 ? candidates[0]! : null
}

export function normalizeServerPaymentStatus(value: unknown): PaymentReturnStatus {
  const status = typeof value === 'string' ? value.toLowerCase() : ''
  if (status === 'success' || status === 'pending' || status === 'failed' || status === 'expired' || status === 'cancelled') return status
  return 'unknown'
}
