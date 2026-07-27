import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent, type MouseEvent, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar,
} from '@partokens/design-system/components'
import {
  getLogs,
  getLogStats,
  type UsageLogQuery,
} from '@partokens/api-client'
import { isAppLocale, type AppLocale } from '@partokens/i18n'

import { formatDate, formatInteger, formatQuota } from '@/lib/format'

export const foundationLogsQueryRoot = ['console-foundation', 'logs'] as const
export const foundationLogStatsQueryRoot = ['console-foundation', 'log-stats'] as const

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

type SafeLogPage = {
  records: SafeLogRecord[]
  total: number
  page: number
  pageSize: number
  invalidCount: number
  partialCount: number
  redactedCount: number
  paginationPartial: boolean
}

type SafeLogStats = {
  quota?: number
  rpm?: number
  tpm?: number
  partial: boolean
}

type LogFilterState = {
  type: string
  model: string
  group: string
  searchKind: 'request' | 'upstream' | 'token' | 'model'
  searchValue: string
  rangeHours: string
}

class ContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContractError'
  }
}

class SafeRequestError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'SafeRequestError'
    this.status = status
  }
}

function usePageLocale(): AppLocale {
  const params = useParams({ strict: false }) as { locale?: string }
  return isAppLocale(params.locale) ? params.locale : 'zh-CN'
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
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ContractError('Usage log contract is incomplete: paginated data is missing.')
  const source = input as Record<string, unknown>
  if (!Array.isArray(source.items)) throw new ContractError('Usage log contract is incomplete: the items array is missing.')
  const total = finiteNumber(source.total)
  const responsePage = finiteNumber(source.page)
  const responsePageSize = finiteNumber(source.page_size)
  if (total == null || total < 0 || !Number.isInteger(total)) throw new ContractError('Usage log contract is incomplete: the total is invalid.')

  const records: SafeLogRecord[] = []
  let invalidCount = 0
  for (const item of source.items) {
    const record = sanitizeLogRecord(item)
    if (record) records.push(record)
    else invalidCount += 1
  }
  if (source.items.length > 0 && records.length === 0) throw new ContractError('Usage log contract is incomplete: no record has the required id, time, and type fields.')

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
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ContractError('Usage statistics contract is incomplete.')
  const source = input as Record<string, unknown>
  const quota = finiteNumber(source.quota)
  const rpm = finiteNumber(source.rpm)
  const tpm = finiteNumber(source.tpm)
  if (quota == null && rpm == null && tpm == null) throw new ContractError('Usage statistics contract is incomplete: no metric is usable.')
  return {
    quota: quota != null && quota >= 0 ? quota : undefined,
    rpm: rpm != null && rpm >= 0 ? rpm : undefined,
    tpm: tpm != null && tpm >= 0 ? tpm : undefined,
    partial: quota == null || quota < 0 || rpm == null || rpm < 0 || tpm == null || tpm < 0,
  }
}

function errorStatus(error: unknown): number | undefined {
  if (error instanceof SafeRequestError) return error.status
  return (error as { response?: { status?: number } } | null)?.response?.status
}

function safeQueryError(error: unknown, kind: 'logs' | 'stats') {
  const status = errorStatus(error)
  if (status === 401) return `Your session expired. Sign in again to load usage ${kind}.`
  if (status === 403) return `Your account cannot access usage ${kind}.`
  if (error instanceof ContractError) return error.message
  return kind === 'logs' ? 'Usage logs are unavailable.' : 'Usage statistics are unavailable.'
}

async function fetchLogPage(params: UsageLogQuery, requestedPage: number) {
  try {
    const response = await getLogs(params)
    if (!response.success) throw new SafeRequestError('Usage logs are unavailable.')
    return parseLogPage(response.data, requestedPage)
  } catch (error) {
    if (error instanceof ContractError || error instanceof SafeRequestError) throw error
    throw new SafeRequestError('Usage logs are unavailable.', errorStatus(error))
  }
}

async function fetchStats(params: Omit<UsageLogQuery, 'p' | 'page_size'>) {
  try {
    const response = await getLogStats(params)
    if (!response.success) throw new SafeRequestError('Usage statistics are unavailable.')
    return parseLogStats(response.data)
  } catch (error) {
    if (error instanceof ContractError || error instanceof SafeRequestError) throw error
    throw new SafeRequestError('Usage statistics are unavailable.', errorStatus(error))
  }
}

function defaultFilters(): LogFilterState {
  return { type: '0', model: '', group: '', searchKind: 'request', searchValue: '', rangeHours: '24' }
}

function cleanFilterValue(value: string) {
  return value.trim().slice(0, 160)
}

function makeListParams(filters: LogFilterState, appliedAt: number, page: number): UsageLogQuery {
  const searchValue = cleanFilterValue(filters.searchValue)
  const model = filters.searchKind === 'model' && searchValue ? searchValue : cleanFilterValue(filters.model)
  return {
    p: page,
    page_size: pageSize,
    ...(Number(filters.type) ? { type: Number(filters.type) } : {}),
    ...(model ? { model_name: model } : {}),
    ...(searchValue && filters.searchKind === 'token' ? { token_name: searchValue } : {}),
    ...(cleanFilterValue(filters.group) ? { group: cleanFilterValue(filters.group) } : {}),
    ...(searchValue && filters.searchKind === 'request' ? { request_id: searchValue } : {}),
    ...(searchValue && filters.searchKind === 'upstream' ? { upstream_request_id: searchValue } : {}),
    start_timestamp: appliedAt - Number(filters.rangeHours) * 3600,
    end_timestamp: appliedAt,
  }
}

function makeStatsParams(params: UsageLogQuery): Omit<UsageLogQuery, 'p' | 'page_size'> {
  return {
    ...(params.type ? { type: params.type } : {}),
    ...(params.model_name ? { model_name: params.model_name } : {}),
    ...(params.token_name ? { token_name: params.token_name } : {}),
    ...(params.group ? { group: params.group } : {}),
    ...(params.start_timestamp ? { start_timestamp: params.start_timestamp } : {}),
    ...(params.end_timestamp ? { end_timestamp: params.end_timestamp } : {}),
  }
}

function logTypeLabel(type: number) {
  const labels: Record<number, string> = { 1: 'Top-up', 2: 'Usage', 3: 'Management', 4: 'System', 5: 'Error', 6: 'Refund', 7: 'Login' }
  return labels[type] || `Event ${type}`
}

function TypeBadge({ type }: { type: number }) {
  const { t } = useTranslation()
  if (type === 5) return <Badge variant="destructive">{t(logTypeLabel(type))}</Badge>
  if (type === 2) return <Badge variant="outline">{t(logTypeLabel(type))}</Badge>
  return <Badge variant="secondary">{t(logTypeLabel(type))}</Badge>
}

function totalTokens(record: SafeLogRecord): number | undefined {
  if (record.promptTokens == null || record.completionTokens == null) return undefined
  return record.promptTokens + record.completionTokens
}

function latency(record: SafeLogRecord) {
  return record.useTime == null ? '—' : `${record.useTime.toFixed(2)} s`
}

function ListState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <AlertTriangle className="size-5 text-destructive" />
      <div><h2 className="text-sm font-semibold">Usage logs are unavailable</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">{safeQueryError(error, 'logs')}</p></div>
      <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw />Retry</Button>
    </div>
  )
}

function ListSkeleton() {
  return <div aria-label="Loading usage logs" aria-busy="true" className="space-y-3 p-4">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/30"><FileSearch className="size-5 text-muted-foreground" /></div>
      <h2 className="text-sm font-semibold">{filtered ? 'No matching usage logs' : 'No usage logs yet'}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{filtered ? 'Change or clear the current filters.' : 'Account requests and events will appear here.'}</p>
      {filtered ? <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>Clear filters</Button> : null}
    </div>
  )
}

function StatsStrip({
  query,
  total,
  locale,
  traceBlocked,
}: {
  query: ReturnType<typeof useQuery<SafeLogStats>>
  total?: number
  locale: AppLocale
  traceBlocked: boolean
}) {
  if (query.isLoading) {
    return <section aria-label="Loading usage statistics" className="grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`min-w-0 p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : ''}`}><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-7 w-24" /></div>)}</section>
  }
  const metrics = [
    ['Filtered cost', traceBlocked || query.isError ? 'Unavailable' : query.data ? formatQuota(query.data.quota, locale) : '—'],
    ['Records', total == null ? '—' : formatInteger(total, locale)],
    ['Prompt tokens', 'Unavailable'],
    ['Completion tokens', 'Unavailable'],
  ]
  return (
    <section aria-label="Usage statistics" className="grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4">
      {metrics.map(([label, value], index) => <div key={label} className={`min-w-0 p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : ''}`}><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 min-w-0 truncate font-mono font-semibold tabular-nums ${value === 'Unavailable' ? 'text-sm text-muted-foreground' : 'text-xl'}`}>{value}</p></div>)}
      {!traceBlocked && query.isError ? <div role="alert" className="col-span-2 flex items-center justify-between gap-3 border-t px-4 py-3 text-sm lg:col-span-4"><span className="min-w-0 text-destructive">{safeQueryError(query.error, 'stats')}</span><Button variant="outline" size="sm" className="shrink-0" onClick={() => void query.refetch()}><RefreshCw />Retry</Button></div> : null}
      {traceBlocked ? <p role="status" className="col-span-2 border-t px-4 py-3 text-xs text-muted-foreground lg:col-span-4">Filtered cost is unavailable because the statistics contract does not accept request or upstream request IDs. The record count remains exact.</p> : null}
      {!traceBlocked && query.data?.partial ? <p role="status" className="col-span-2 border-t px-4 py-3 text-xs text-muted-foreground lg:col-span-4">Some usage statistics are unavailable; usable metrics remain visible.</p> : null}
    </section>
  )
}

function DetailList({ record, locale }: { record: SafeLogRecord; locale: AppLocale }) {
  const { t } = useTranslation()
  const rows = [
    [t('Request ID'), record.requestId || '—'],
    [t('Upstream request ID'), record.upstreamRequestId || '—'],
    [t('Time'), formatDate(record.createdAt, locale)],
    [t('Type'), t(logTypeLabel(record.type))],
    [t('Model'), record.modelName || '—'],
    [t('Key name'), record.tokenName || '—'],
    [t('Group'), record.group || '—'],
    [t('Streaming'), record.isStream == null ? '—' : record.isStream ? t('Yes') : t('No')],
    [t('Prompt tokens'), formatInteger(record.promptTokens, locale)],
    [t('Completion tokens'), formatInteger(record.completionTokens, locale)],
    [t('Cost'), formatQuota(record.quota, locale)],
    [t('Latency'), latency(record)],
  ]
  return <div className="space-y-3"><dl className="divide-y rounded-md border">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-3 px-3 py-2.5 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-end font-medium">{value}</dd></div>)}</dl><p role="status" className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">Request content, raw metadata, and sensitive URLs are withheld because the self-log API has no field-level sensitivity contract.</p></div>
}

function LogDetails({
  record,
  locale,
  returnFocus,
  onClose,
}: {
  record: SafeLogRecord
  locale: AppLocale
  returnFocus: RefObject<HTMLButtonElement | null>
  onClose: () => void
}) {
  const { isMobile } = useSidebar()
  const description = `${record.requestId || `Event ${record.rowId}`} · ${formatDate(record.createdAt, locale)}`
  const closeAutoFocus = (event: Event) => {
    event.preventDefault()
    returnFocus.current?.focus()
  }

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md" onCloseAutoFocus={closeAutoFocus}>
          <SheetHeader><SheetTitle>Request details</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"><DetailList record={record} locale={locale} /></div>
          <SheetFooter className="border-t"><Button variant="outline" onClick={onClose}>Close</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl" onCloseAutoFocus={closeAutoFocus}>
        <DialogHeader><DialogTitle>Request details</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <DetailList record={record} locale={locale} />
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function uniqueOptions(values: Array<string | undefined>, selected: string) {
  return [...new Set([selected, ...values].filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b))
}

function updatedLabel(timestamp: number, locale: AppLocale) {
  if (!timestamp) return 'Not updated'
  return `Updated at ${new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(timestamp)}`
}

export function ConsoleFoundationLogsPage() {
  const { t } = useTranslation()
  const locale = usePageLocale()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<LogFilterState>(defaultFilters)
  const [applied, setApplied] = useState<LogFilterState>(defaultFilters)
  const [appliedAt, setAppliedAt] = useState(() => Math.floor(Date.now() / 1000))
  const [page, setPage] = useState(1)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SafeLogRecord | null>(null)
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null)
  const params = useMemo(() => makeListParams(applied, appliedAt, page), [applied, appliedAt, page])
  const statParams = useMemo(() => makeStatsParams(params), [params])
  const statsTraceBlocked = Boolean(applied.searchValue) && (applied.searchKind === 'request' || applied.searchKind === 'upstream')
  const logs = useQuery({ queryKey: [...foundationLogsQueryRoot, 'list', params], queryFn: () => fetchLogPage(params, page), retry: false })
  const stats = useQuery({ queryKey: [...foundationLogStatsQueryRoot, statParams], queryFn: () => fetchStats(statParams), enabled: !statsTraceBlocked, retry: false })
  const totalPages = Math.max(1, Math.ceil((logs.data?.total || 0) / (logs.data?.pageSize || pageSize)))
  const hasFilters = applied.type !== '0' || Boolean(applied.model || applied.group || applied.searchValue) || applied.rangeHours !== '24'
  const hasVisibleFilters = filters.type !== '0' || Boolean(filters.model || filters.group || filters.searchValue) || filters.rangeHours !== '24'
  const modelOptions = useMemo(() => uniqueOptions(logs.data?.records.map((record) => record.modelName) || [], applied.model).filter((value) => value !== '__all__'), [applied.model, logs.data?.records])
  const groupOptions = useMemo(() => uniqueOptions(logs.data?.records.map((record) => record.group) || [], applied.group).filter((value) => value !== '__all__'), [applied.group, logs.data?.records])
  const searchLabels: Record<LogFilterState['searchKind'], string> = { request: 'Request ID', upstream: 'Upstream request ID', token: 'Key name', model: 'Model' }

  const applySearch = (event: FormEvent) => {
    event.preventDefault()
    if (containsSensitiveLogText(filters.searchValue)) {
      setFilterError('Credential-shaped values and URLs cannot be used as log filters.')
      return
    }
    const searchValue = cleanFilterValue(filters.searchValue)
    setFilterError(null)
    setPage(1)
    setSelected(null)
    setFilters((current) => ({ ...current, searchValue }))
    setApplied({ ...filters, searchValue })
    setAppliedAt(Math.floor(Date.now() / 1000))
  }
  const applySelect = (key: 'type' | 'model' | 'group' | 'rangeHours', value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setApplied((current) => ({ ...current, [key]: value }))
    setFilterError(null)
    setPage(1)
    setSelected(null)
    setAppliedAt(Math.floor(Date.now() / 1000))
  }
  const changeSearchKind = (value: string) => {
    const searchKind = value as LogFilterState['searchKind']
    setFilters((current) => ({ ...current, searchKind, searchValue: '' }))
    setApplied((current) => ({ ...current, searchKind, searchValue: '' }))
    setFilterError(null)
    setPage(1)
    setSelected(null)
    setAppliedAt(Math.floor(Date.now() / 1000))
  }
  const clearFilters = () => {
    const next = defaultFilters()
    setFilters(next)
    setApplied(next)
    setAppliedAt(Math.floor(Date.now() / 1000))
    setFilterError(null)
    setPage(1)
    setSelected(null)
  }
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: foundationLogsQueryRoot }),
      queryClient.invalidateQueries({ queryKey: foundationLogStatsQueryRoot }),
    ])
  }
  const openDetails = (record: SafeLogRecord, event: MouseEvent<HTMLButtonElement>) => {
    detailTriggerRef.current = event.currentTarget
    setSelected(record)
  }
  const partial = logs.data && (logs.data.invalidCount > 0 || logs.data.partialCount > 0 || logs.data.redactedCount > 0 || logs.data.paginationPartial)
  const refreshing = logs.isFetching || (!statsTraceBlocked && stats.isFetching)

  return <div className="flex flex-col gap-6 pb-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><h1 id="console-foundation-title" className="text-2xl font-bold tracking-tight">{t('Usage logs')}</h1><p className="text-muted-foreground">Inspect model calls, account events, cost, and request latency.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}{refreshing ? 'Refreshing...' : t('Refresh')}</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button className="text-primary-foreground" style={{ color: 'var(--primary-foreground)' }}><Download />Export<ChevronDown className="ms-1" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Complete filtered export</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled><Download />Export CSV unavailable</DropdownMenuItem>
            <DropdownMenuItem disabled><Download />Export JSON unavailable</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <form aria-label="Usage log filters" className="flex flex-col gap-3 lg:flex-row lg:items-center" onSubmit={applySearch}>
      <div className="relative min-w-0 flex-1 lg:max-w-xs">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="absolute start-1 top-1/2 z-10 size-8 -translate-y-1/2 text-muted-foreground" aria-label={`Search field: ${searchLabels[filters.searchKind]}`}><Search /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52"><DropdownMenuLabel>Search exact field</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => changeSearchKind('request')}>Request ID</DropdownMenuItem><DropdownMenuItem onSelect={() => changeSearchKind('upstream')}>Upstream request ID</DropdownMenuItem><DropdownMenuItem onSelect={() => changeSearchKind('token')}>API key name</DropdownMenuItem><DropdownMenuItem onSelect={() => changeSearchKind('model')}>Model</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
        <Input value={filters.searchValue} onChange={(event) => { setFilters((current) => ({ ...current, searchValue: event.target.value })); setFilterError(null) }} placeholder="Search request ID, key, or model..." aria-label={searchLabels[filters.searchKind]} className="ps-10" autoComplete="off" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <Select value={filters.type} onValueChange={(value) => applySelect('type', value)}><SelectTrigger className="w-full sm:w-36" aria-label="Filter by event type"><SelectValue /></SelectTrigger><SelectContent>{[[0, 'All types'], [1, 'Top-up'], [2, 'Usage'], [3, 'Management'], [4, 'System'], [5, 'Error'], [6, 'Refund'], [7, 'Login']].map(([value, label]) => <SelectItem key={value} value={String(value)}>{t(String(label))}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.model || '__all__'} onValueChange={(value) => applySelect('model', value === '__all__' ? '' : value)}><SelectTrigger className="w-full sm:w-44" aria-label="Filter by model"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">All models</SelectItem>{modelOptions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.rangeHours} onValueChange={(value) => applySelect('rangeHours', value)}><SelectTrigger className="w-full sm:w-40" aria-label="Filter by time range"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="24">Last 24 hours</SelectItem><SelectItem value="168">Last 7 days</SelectItem><SelectItem value="720">Last 30 days</SelectItem></SelectContent></Select>
        <Select value={filters.group || '__all__'} onValueChange={(value) => applySelect('group', value === '__all__' ? '' : value)}><SelectTrigger className="w-full sm:w-36" aria-label="Filter by key group"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">All groups</SelectItem>{groupOptions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      </div>
      {hasVisibleFilters ? <Button type="button" variant="ghost" size="sm" className="self-start lg:self-auto" onClick={clearFilters}>Clear</Button> : null}
    </form>
    {filterError ? <p role="alert" className="-mt-3 text-sm text-destructive">{filterError}</p> : null}

    <StatsStrip query={stats} total={logs.data?.total} locale={locale} traceBlocked={statsTraceBlocked} />

    <section aria-label="Usage logs" className="overflow-hidden rounded-md border">
      {logs.isLoading ? <ListSkeleton /> : logs.isError ? <ListState error={logs.error} onRetry={() => void logs.refetch()} /> : logs.data?.records.length ? <>
        {partial ? <p role="status" className="border-b bg-muted/20 px-4 py-3 text-xs text-muted-foreground">Some log records or fields were unavailable or redacted. Usable fields remain visible.</p> : null}
        <div className="hidden overflow-x-auto lg:block"><Table className="min-w-[1040px]"><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="ps-4">Time / request</TableHead><TableHead>{t('Type')}</TableHead><TableHead>{t('Key name')}</TableHead><TableHead>{t('Model')}</TableHead><TableHead>{t('Streaming')}</TableHead><TableHead>Tokens</TableHead><TableHead>{t('Cost')}</TableHead><TableHead>{t('Latency')}</TableHead><TableHead><span className="sr-only">{t('Details')}</span></TableHead></TableRow></TableHeader><TableBody>{logs.data.records.map((record) => <TableRow key={`${record.rowId}-${record.requestId || ''}`}><TableCell className="ps-4"><div className="whitespace-nowrap font-medium">{formatDate(record.createdAt, locale)}</div><code className="mt-0.5 block max-w-48 truncate font-mono text-xs text-muted-foreground" title={record.requestId}>{record.requestId || '—'}</code></TableCell><TableCell><TypeBadge type={record.type} /></TableCell><TableCell className="max-w-40 truncate" title={record.tokenName}>{record.tokenName || '—'}</TableCell><TableCell className="max-w-48 truncate font-medium" title={record.modelName}>{record.modelName || '—'}</TableCell><TableCell>{record.isStream == null ? '—' : record.isStream ? t('Yes') : t('No')}</TableCell><TableCell className="font-mono text-xs">{formatInteger(totalTokens(record), locale)}</TableCell><TableCell className="font-mono text-xs">{formatQuota(record.quota, locale)}</TableCell><TableCell className="font-mono text-xs">{latency(record)}</TableCell><TableCell className="pe-3 text-end"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={`${t('View details')} ${record.requestId || record.rowId}`} onClick={(event) => openDetails(record, event)}><ChevronRight /></Button></TooltipTrigger><TooltipContent>{t('View details')}</TooltipContent></Tooltip></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="divide-y lg:hidden">{logs.data.records.map((record) => <article key={`${record.rowId}-${record.requestId || ''}`} className="space-y-4 p-4"><div className="flex min-w-0 items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><TypeBadge type={record.type} /><time className="text-xs text-muted-foreground">{formatDate(record.createdAt, locale)}</time></div><code className="mt-2 block break-all font-mono text-xs">{record.requestId || '—'}</code></div><Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`${t('View details')} ${record.requestId || record.rowId}`} onClick={(event) => openDetails(record, event)}><ChevronRight /></Button></div><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Key name')}</dt><dd className="mt-1 break-words">{record.tokenName || '—'}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Model')}</dt><dd className="mt-1 break-words">{record.modelName || '—'}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">Tokens</dt><dd className="mt-1 font-mono text-xs">{formatInteger(totalTokens(record), locale)}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Cost')} / {t('Latency')}</dt><dd className="mt-1 font-mono text-xs">{formatQuota(record.quota, locale)} / {latency(record)}</dd></div></dl></article>)}</div>
      </> : <EmptyState filtered={hasFilters} onClear={clearFilters} />}
      <footer className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-sm text-muted-foreground"><span>{t('Page')} {page} / {totalPages}{logs.data ? ` · ${formatInteger(logs.data.records.length, locale)} of ${formatInteger(logs.data.total, locale)} records · ${updatedLabel(logs.dataUpdatedAt, locale)}` : ''}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || logs.isFetching} onClick={() => { setSelected(null); setPage((value) => Math.max(1, value - 1)) }}>{t('Previous')}</Button><Button variant="outline" size="sm" disabled={page >= totalPages || logs.isFetching} onClick={() => { setSelected(null); setPage((value) => value + 1) }}>{t('Next')}</Button></div></footer>
    </section>

    {selected ? <LogDetails record={selected} locale={locale} returnFocus={detailTriggerRef} onClose={() => setSelected(null)} /> : null}
  </div>
}
