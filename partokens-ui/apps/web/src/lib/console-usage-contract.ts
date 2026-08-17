import { ConsoleContractError } from './console-query'

const pageSize = 20
const sensitiveUrlPattern = /https?:\/\/[^\s<>"']+/gi
const bearerPattern = /\bBearer\s+[^\s,;"']+/gi
const headerSecretPattern = /\b(?:authorization|api[-_ ]?key|access[-_ ]?token)\s*[:=]\s*[^\s,;"']+/gi
const keyPattern = /\b(?:sk|pk|rk|key)-[A-Za-z0-9._~+/=-]{8,}\b/gi

export type SafeLogRecord = {
  rowId: number
  createdAt: number
  type: number
  tokenName?: string
  modelName?: string
  promptTokens: number
  completionTokens: number
  cacheTokens: number
  quota?: number
  useTime?: number
  firstResponseTime?: number
  isStream?: boolean
  group?: string
  groupRatio?: number
  modelRatio?: number
  completionRatio?: number
  cacheRatio?: number
  modelPrice?: number
  requestId?: string
  upstreamRequestId?: string
  partial: boolean
  redacted: boolean
}

export type SafeLogPage = {
  records: SafeLogRecord[]
  total: number
  page: number
  pageSize: number
  invalidCount: number
  partialCount: number
  redactedCount: number
  paginationPartial: boolean
}

export type SafeLogStats = {
  quota: number
  rpm: number
  tpm: number
  partial: boolean
}

export type SafeLogTokenTotalsPage = {
  promptTokens: number
  completionTokens: number
  cacheTokens: number
  total: number
  page: number
  pageSize: number
  partial: boolean
}

export type SafeLogTokenTotals = Pick<SafeLogTokenTotalsPage, 'promptTokens' | 'completionTokens' | 'cacheTokens' | 'partial'>

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function safeBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function nonNegativeNumber(value: unknown): number | undefined {
  const number = finiteNumber(value)
  return number != null && number >= 0 ? number : undefined
}

function nonNegativeInteger(value: unknown): number | undefined {
  const number = nonNegativeNumber(value)
  return number != null && Number.isSafeInteger(number) ? number : undefined
}

function safeLogMetadata(value: unknown): {
  cacheTokens: number
  groupRatio?: number
  modelRatio?: number
  completionRatio?: number
  cacheRatio?: number
  modelPrice?: number
  firstResponseTime?: number
  invalid: boolean
} {
  let source: Record<string, unknown> | undefined
  let invalid = false
  if (typeof value === 'string' && value.length <= 16_000) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) source = parsed as Record<string, unknown>
      else invalid = true
    } catch {
      invalid = true
    }
  } else if (value && typeof value === 'object' && !Array.isArray(value)) {
    source = value as Record<string, unknown>
  } else if (value != null && value !== '') {
    invalid = true
  }

  const cacheTokens = nonNegativeNumber(source?.cache_tokens)
  const groupRatio = nonNegativeNumber(source?.group_ratio)
  const modelRatio = nonNegativeNumber(source?.model_ratio)
  const completionRatio = nonNegativeNumber(source?.completion_ratio)
  const cacheRatio = nonNegativeNumber(source?.cache_ratio)
  // Ratio-billed text logs use -1 as the backend sentinel for model_price.
  const modelPrice = finiteNumber(source?.model_price)
  const firstResponseTime = nonNegativeNumber(source?.frt)
  invalid ||= (source?.cache_tokens != null && cacheTokens == null)
    || (source?.group_ratio != null && groupRatio == null)
    || (source?.model_ratio != null && modelRatio == null)
    || (source?.completion_ratio != null && completionRatio == null)
    || (source?.cache_ratio != null && cacheRatio == null)
    || (source?.model_price != null && modelPrice == null)
    || (source?.frt != null && firstResponseTime == null)
  return { cacheTokens: cacheTokens ?? 0, groupRatio, modelRatio, completionRatio, cacheRatio, modelPrice, firstResponseTime, invalid }
}

function safeCacheTokens(value: unknown): { value: number; invalid: boolean } {
  if (value == null || value === '') return { value: 0, invalid: false }
  let source: Record<string, unknown>
  if (typeof value === 'string' && value.length <= 16_000) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { value: 0, invalid: true }
      source = parsed as Record<string, unknown>
    } catch {
      return { value: 0, invalid: true }
    }
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    source = value as Record<string, unknown>
  } else {
    return { value: 0, invalid: true }
  }
  const cacheTokens = nonNegativeInteger(source.cache_tokens)
  return { value: cacheTokens ?? 0, invalid: source.cache_tokens != null && cacheTokens == null }
}

function sanitizeText(value: unknown, limit = 160): { value?: string; redacted: boolean; invalid: boolean } {
  if (value == null || value === '') return { redacted: false, invalid: false }
  if (typeof value !== 'string') return { redacted: false, invalid: true }
  const trimmed = value.trim().slice(0, limit)
  const sanitized = trimmed
    .replace(sensitiveUrlPattern, '[redacted URL]')
    .replace(bearerPattern, 'Bearer [redacted]')
    .replace(headerSecretPattern, '[redacted credential]')
    .replace(keyPattern, '[redacted key]')
  return { value: sanitized || undefined, redacted: sanitized !== trimmed, invalid: value.length > limit }
}

export function containsSensitiveLogText(value: string): boolean {
  const patterns = [sensitiveUrlPattern, bearerPattern, headerSecretPattern, keyPattern]
  return patterns.some((pattern) => {
    pattern.lastIndex = 0
    return pattern.test(value)
  })
}

export function sanitizeLogRecord(input: unknown): SafeLogRecord | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const source = input as Record<string, unknown>
  const rowId = finiteNumber(source.id)
  const createdAt = finiteNumber(source.created_at)
  const type = finiteNumber(source.type)
  if (!rowId || !Number.isInteger(rowId) || !createdAt || createdAt < 0 || type == null || !Number.isInteger(type)) return null

  const textFields = {
    tokenName: sanitizeText(source.token_name, 120),
    modelName: sanitizeText(source.model_name, 120),
    group: sanitizeText(source.group, 80),
    requestId: sanitizeText(source.request_id, 160),
    upstreamRequestId: sanitizeText(source.upstream_request_id, 160),
  }
  const promptTokens = nonNegativeNumber(source.prompt_tokens)
  const completionTokens = nonNegativeNumber(source.completion_tokens)
  const quota = nonNegativeNumber(source.quota)
  const useTime = nonNegativeNumber(source.use_time)
  const isStream = safeBoolean(source.is_stream)
  const metadata = safeLogMetadata(source.other)
  const invalidOptional = Object.values(textFields).some((field) => field.invalid)
    || (source.prompt_tokens != null && promptTokens == null)
    || (source.completion_tokens != null && completionTokens == null)
    || (source.quota != null && quota == null)
    || (source.use_time != null && useTime == null)
    || (source.is_stream != null && isStream == null)
    || metadata.invalid
  const usageFieldsMissing = type === 2 && (
    quota == null || useTime == null || isStream == null
  )

  return {
    rowId,
    createdAt,
    type,
    tokenName: textFields.tokenName.value,
    modelName: textFields.modelName.value,
    promptTokens: promptTokens ?? 0,
    completionTokens: completionTokens ?? 0,
    cacheTokens: metadata.cacheTokens,
    quota,
    useTime,
    firstResponseTime: metadata.firstResponseTime,
    isStream,
    group: textFields.group.value,
    groupRatio: metadata.groupRatio,
    modelRatio: metadata.modelRatio,
    completionRatio: metadata.completionRatio,
    cacheRatio: metadata.cacheRatio,
    modelPrice: metadata.modelPrice != null && metadata.modelPrice >= 0 ? metadata.modelPrice : undefined,
    requestId: textFields.requestId.value,
    upstreamRequestId: textFields.upstreamRequestId.value,
    partial: invalidOptional || usageFieldsMissing,
    redacted: Object.values(textFields).some((field) => field.redacted),
  }
}

export function parseLogPage(input: unknown, requestedPage: number): SafeLogPage {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ConsoleContractError('Usage log contract is incomplete: paginated data is missing.')
  const source = input as Record<string, unknown>
  if (!Array.isArray(source.items)) throw new ConsoleContractError('Usage log contract is incomplete: the items array is missing.')
  const total = finiteNumber(source.total)
  const responsePage = finiteNumber(source.page)
  const responsePageSize = finiteNumber(source.page_size)
  if (total == null || total < 0 || !Number.isInteger(total)) throw new ConsoleContractError('Usage log contract is incomplete: the total is invalid.')

  const records: SafeLogRecord[] = []
  let invalidCount = 0
  for (const item of source.items) {
    const record = sanitizeLogRecord(item)
    if (record) records.push(record)
    else invalidCount += 1
  }
  if (source.items.length > 0 && records.length === 0) throw new ConsoleContractError('Usage log contract is incomplete: no record has the required id, time, and type fields.')

  const validResponsePage = responsePage != null && Number.isInteger(responsePage) && responsePage > 0
  const validResponsePageSize = responsePageSize != null && Number.isInteger(responsePageSize) && responsePageSize > 0
  return {
    records,
    total,
    page: validResponsePage ? responsePage : requestedPage,
    pageSize: validResponsePageSize ? responsePageSize : pageSize,
    invalidCount,
    partialCount: records.filter((record) => record.partial).length,
    redactedCount: records.filter((record) => record.redacted).length,
    paginationPartial: !validResponsePage || !validResponsePageSize || responsePage !== requestedPage || records.length > total,
  }
}

export function parseLogStats(input: unknown): SafeLogStats {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ConsoleContractError('Usage statistics contract is incomplete.')
  const source = input as Record<string, unknown>
  const quota = nonNegativeNumber(source.quota)
  const rpm = nonNegativeNumber(source.rpm)
  const tpm = nonNegativeNumber(source.tpm)
  return {
    quota: quota ?? 0,
    rpm: rpm ?? 0,
    tpm: tpm ?? 0,
    partial: quota == null || rpm == null || tpm == null,
  }
}

export function parseLogTokenTotalsPage(input: unknown, requestedPage: number): SafeLogTokenTotalsPage {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ConsoleContractError('Usage log contract is incomplete: paginated data is missing.')
  const source = input as Record<string, unknown>
  if (!Array.isArray(source.items)) throw new ConsoleContractError('Usage log contract is incomplete: the items array is missing.')
  const total = nonNegativeInteger(source.total)
  const responsePage = nonNegativeInteger(source.page)
  const responsePageSize = nonNegativeInteger(source.page_size)
  if (total == null) throw new ConsoleContractError('Usage log contract is incomplete: the total is invalid.')

  let promptTokens = 0
  let completionTokens = 0
  let cacheTokens = 0
  let partial = responsePage == null || responsePage < 1 || responsePage !== requestedPage || responsePageSize == null || responsePageSize < 1

  for (const item of source.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      partial = true
      continue
    }
    const record = item as Record<string, unknown>
    const type = nonNegativeInteger(record.type)
    if (type == null) {
      partial = true
      continue
    }
    if (type !== 2) continue

    const prompt = nonNegativeInteger(record.prompt_tokens)
    const completion = nonNegativeInteger(record.completion_tokens)
    const cache = safeCacheTokens(record.other)
    if (prompt == null || completion == null || cache.invalid) partial = true

    const nextPrompt = promptTokens + (prompt ?? 0)
    const nextCompletion = completionTokens + (completion ?? 0)
    const nextCache = cacheTokens + cache.value
    if (![nextPrompt, nextCompletion, nextCache].every(Number.isSafeInteger)) {
      partial = true
      continue
    }
    promptTokens = nextPrompt
    completionTokens = nextCompletion
    cacheTokens = nextCache
  }

  return {
    promptTokens,
    completionTokens,
    cacheTokens,
    total,
    page: responsePage && responsePage > 0 ? responsePage : requestedPage,
    pageSize: responsePageSize && responsePageSize > 0 ? responsePageSize : pageSize,
    partial,
  }
}

export function mergeLogTokenTotals(pages: SafeLogTokenTotalsPage[], truncated = false): SafeLogTokenTotals {
  return pages.reduce<SafeLogTokenTotals>((totals, page) => {
    const promptTokens = totals.promptTokens + page.promptTokens
    const completionTokens = totals.completionTokens + page.completionTokens
    const cacheTokens = totals.cacheTokens + page.cacheTokens
    return {
      promptTokens: Number.isSafeInteger(promptTokens) ? promptTokens : totals.promptTokens,
      completionTokens: Number.isSafeInteger(completionTokens) ? completionTokens : totals.completionTokens,
      cacheTokens: Number.isSafeInteger(cacheTokens) ? cacheTokens : totals.cacheTokens,
      partial: totals.partial || page.partial || !Number.isSafeInteger(promptTokens) || !Number.isSafeInteger(completionTokens) || !Number.isSafeInteger(cacheTokens),
    }
  }, { promptTokens: 0, completionTokens: 0, cacheTokens: 0, partial: truncated })
}
