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
  promptTokens?: number
  completionTokens?: number
  quota?: number
  useTime?: number
  isStream?: boolean
  group?: string
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
  quota?: number
  rpm?: number
  tpm?: number
  partial: boolean
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function safeBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
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
  const promptTokens = finiteNumber(source.prompt_tokens)
  const completionTokens = finiteNumber(source.completion_tokens)
  const quota = finiteNumber(source.quota)
  const useTime = finiteNumber(source.use_time)
  const isStream = safeBoolean(source.is_stream)
  const invalidOptional = Object.values(textFields).some((field) => field.invalid)
    || (source.prompt_tokens != null && promptTokens == null)
    || (source.completion_tokens != null && completionTokens == null)
    || (source.quota != null && quota == null)
    || (source.use_time != null && useTime == null)
    || (source.is_stream != null && isStream == null)
  const usageFieldsMissing = type === 2 && (
    promptTokens == null || completionTokens == null || quota == null || useTime == null || isStream == null
  )

  return {
    rowId,
    createdAt,
    type,
    tokenName: textFields.tokenName.value,
    modelName: textFields.modelName.value,
    promptTokens,
    completionTokens,
    quota,
    useTime,
    isStream,
    group: textFields.group.value,
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
  const quota = finiteNumber(source.quota)
  const rpm = finiteNumber(source.rpm)
  const tpm = finiteNumber(source.tpm)
  if (quota == null && rpm == null && tpm == null) throw new ConsoleContractError('Usage statistics contract is incomplete: no metric is usable.')
  return {
    quota: quota != null && quota >= 0 ? quota : undefined,
    rpm: rpm != null && rpm >= 0 ? rpm : undefined,
    tpm: tpm != null && tpm >= 0 ? tpm : undefined,
    partial: quota == null || quota < 0 || rpm == null || rpm < 0 || tpm == null || tpm < 0,
  }
}
