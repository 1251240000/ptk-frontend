const quotaPerUnit = 500_000

export function quotaDollarsToUnits(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.round(value * quotaPerUnit)
}

export function quotaUnitsToDollars(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return value / quotaPerUnit
}

export function formatQuota(value: number | undefined, locale: string): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / quotaPerUnit)
}

export function formatInteger(value: number | undefined, locale: string): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
}

export function formatDate(value: number | undefined, locale: string): string {
  if (!value || value < 0) return '—'
  const milliseconds = value > 10_000_000_000 ? value : value * 1000
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(milliseconds)
}

export function extractItems<T>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[]
  if (!input || typeof input !== 'object') return []
  const record = input as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items as T[]
  if (Array.isArray(record.data)) return record.data as T[]
  return []
}

export function maskKey(value: string | undefined): string {
  if (!value) return 'sk-••••••••••••'
  if (value.length <= 10) return value
  return `${value.slice(0, 5)}••••••${value.slice(-4)}`
}

export function maskTrace(value: string | undefined): string {
  if (!value) return '—'
  if (value.length <= 12) return value
  return `${value.slice(0, 7)}…${value.slice(-5)}`
}
