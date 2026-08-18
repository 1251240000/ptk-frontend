import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  Database,
  FileSearch,
  Gauge,
  LoaderCircle,
  RefreshCw,
  Search,
  TimerReset,
} from 'lucide-react'
import { Fragment, useMemo, useRef, useState, type FormEvent, type MouseEvent, type ReactNode, type RefObject } from 'react'
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
  toast,
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

import {
  asConsoleRequestError,
  ConsoleRequestError,
  consoleErrorMessage,
  consoleQueryKeys,
  refreshConsoleQueries,
} from '@/lib/console-query'
import {
  containsSensitiveLogText,
  parseLogPage,
  parseLogStats,
  parseLogTokenTotalsPage,
  mergeLogTokenTotals,
  type SafeLogRecord,
  type SafeLogStats,
  type SafeLogTokenTotals,
} from '@/lib/console-usage-contract'
import { formatDate, formatInteger, formatQuota } from '@/lib/format'
import { ModelProviderBadge } from '@/components/model-provider-badge'

const pageSize = 20
const tokenTotalsPageSize = 100
const maxTokenTotalsPages = 100
const tokenTotalsConcurrency = 4

type LogFilterState = {
  type: string
  model: string
  group: string
  searchKind: 'request' | 'upstream' | 'token' | 'model'
  searchValue: string
  rangeHours: string
}

function usePageLocale(): AppLocale {
  const params = useParams({ strict: false }) as { locale?: string }
  return isAppLocale(params.locale) ? params.locale : 'zh-CN'
}

function safeQueryError(error: unknown, kind: 'logs' | 'stats', t: TFunction) {
  const area = kind === 'logs' ? t('logs') : t('statistics')
  return consoleErrorMessage(error, {
    authentication: t('Your session expired. Sign in again to load usage {{area}}.', { area }),
    authorization: t('Your account cannot access usage {{area}}.', { area }),
    availability: kind === 'logs' ? t('Usage logs are unavailable.') : t('Usage statistics are unavailable.'),
  })
}

async function fetchLogPage(params: UsageLogQuery, requestedPage: number, signal?: AbortSignal) {
  try {
    const response = await getLogs(params, signal)
    if (!response.success) throw new ConsoleRequestError('Usage logs are unavailable.')
    return parseLogPage(response.data, requestedPage)
  } catch (error) {
    throw asConsoleRequestError(error, 'Usage logs are unavailable.')
  }
}

async function fetchStats(params: Omit<UsageLogQuery, 'p' | 'page_size'>, signal?: AbortSignal) {
  try {
    const response = await getLogStats(params, signal)
    if (!response.success) throw new ConsoleRequestError('Usage statistics are unavailable.')
    return parseLogStats(response.data)
  } catch (error) {
    throw asConsoleRequestError(error, 'Usage statistics are unavailable.')
  }
}

async function fetchTokenTotals(params: Omit<UsageLogQuery, 'p' | 'page_size'>, signal?: AbortSignal): Promise<SafeLogTokenTotals> {
  try {
    const loadPage = async (page: number) => {
      const response = await getLogs({ ...params, p: page, page_size: tokenTotalsPageSize }, signal)
      if (!response.success) throw new ConsoleRequestError('Usage token totals are unavailable.')
      return parseLogTokenTotalsPage(response.data, page)
    }

    const firstPage = await loadPage(1)
    const availablePages = Math.max(1, Math.ceil(firstPage.total / firstPage.pageSize))
    const pageCount = Math.min(availablePages, maxTokenTotalsPages)
    const pages = [firstPage]

    for (let first = 2; first <= pageCount; first += tokenTotalsConcurrency) {
      const batch = Array.from(
        { length: Math.min(tokenTotalsConcurrency, pageCount - first + 1) },
        (_, index) => loadPage(first + index),
      )
      pages.push(...await Promise.all(batch))
    }

    return mergeLogTokenTotals(pages, availablePages > maxTokenTotalsPages)
  } catch (error) {
    throw asConsoleRequestError(error, 'Usage token totals are unavailable.')
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

function makeTokenTotalsParams(params: UsageLogQuery): Omit<UsageLogQuery, 'p' | 'page_size'> | null {
  if (params.type != null && params.type !== 2) return null
  return {
    type: 2,
    ...(params.model_name ? { model_name: params.model_name } : {}),
    ...(params.token_name ? { token_name: params.token_name } : {}),
    ...(params.group ? { group: params.group } : {}),
    ...(params.request_id ? { request_id: params.request_id } : {}),
    ...(params.upstream_request_id ? { upstream_request_id: params.upstream_request_id } : {}),
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

function GroupValue({ record }: { record: SafeLogRecord }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="max-w-28 truncate" title={record.group}>{record.group || '—'}</span>
      {record.groupRatio != null ? <Badge variant="outline" className="font-mono font-normal text-muted-foreground">{record.groupRatio}x {t('Ratio')}</Badge> : null}
    </div>
  )
}

function TokenMetrics({ record, locale, compact = false }: { record: SafeLogRecord; locale: AppLocale; compact?: boolean }) {
  const { t } = useTranslation()
  const metrics = [
    [t('Input tokens'), record.promptTokens, ArrowUpFromLine],
    [t('Output tokens'), record.completionTokens, ArrowDownToLine],
    [t('Cached tokens'), record.cacheTokens, Database],
  ] as const
  return (
    <div className={`grid grid-cols-[max-content_max-content] gap-x-3 gap-y-1 font-mono text-xs tabular-nums ${compact ? 'w-max' : 'min-w-28'}`}>
      {metrics.map(([label, value, Icon], index) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <span className={`inline-flex min-w-0 items-center gap-1.5 ${index === 2 ? 'col-span-2' : ''}`} aria-label={`${label}: ${formatInteger(value, locale)}`}>
              <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>{formatInteger(value, locale)}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

function durationTone(seconds: number, kind: 'first' | 'total') {
  const greenLimit = kind === 'first' ? 10 : 30
  const yellowLimit = kind === 'first' ? 30 : 60
  if (seconds <= greenLimit) return 'text-success'
  if (seconds <= yellowLimit) return 'text-warning'
  return 'text-destructive'
}

function formatDuration(seconds: number | undefined) {
  return seconds == null ? '—' : `${seconds.toFixed(2)} s`
}

function DurationMetrics({ record }: { record: SafeLogRecord }) {
  const { t } = useTranslation()
  const firstSeconds = record.firstResponseTime == null ? undefined : record.firstResponseTime / 1000
  const metrics: ReadonlyArray<readonly [string, number | undefined, typeof TimerReset, 'first' | 'total']> = [
    ...(record.isStream ? [[t('First token'), firstSeconds, TimerReset, 'first'] as const] : []),
    [t('Total time'), record.useTime, Gauge, 'total'],
  ]
  return (
    <div className="grid min-w-28 gap-1 text-xs tabular-nums">
      {metrics.map(([label, seconds, Icon, kind]) => (
        <span key={label} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">{label}</span>
          <span className={`font-mono font-medium ${seconds == null ? 'text-muted-foreground' : durationTone(seconds, kind)}`}>{formatDuration(seconds)}</span>
        </span>
      ))}
    </div>
  )
}

function ListState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <AlertTriangle className="size-5 text-destructive" />
      <div><h2 className="text-sm font-semibold">{t('Usage logs are unavailable')}</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">{safeQueryError(error, 'logs', t)}</p></div>
      <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw />{t('Retry')}</Button>
    </div>
  )
}

function ListSkeleton() {
  const { t } = useTranslation()
  return <div aria-label={t('Loading usage logs')} aria-busy="true" className="space-y-3 p-4">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/30"><FileSearch className="size-5 text-muted-foreground" /></div>
      <h2 className="text-sm font-semibold">{filtered ? t('No matching usage logs') : t('No usage logs yet')}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{filtered ? t('Change or clear the current filters.') : t('Account requests and events will appear here.')}</p>
      {filtered ? <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>{t('Clear filters')}</Button> : null}
    </div>
  )
}

function StatsStrip({
  statsQuery,
  tokenTotalsQuery,
  total,
  locale,
  traceBlocked,
}: {
  statsQuery: ReturnType<typeof useQuery<SafeLogStats>>
  tokenTotalsQuery: ReturnType<typeof useQuery<SafeLogTokenTotals>>
  total?: number
  locale: AppLocale
  traceBlocked: boolean
}) {
  const { t } = useTranslation()
  const tokenValue = (value: number | undefined) => tokenTotalsQuery.isLoading
    ? <Skeleton className="h-7 w-24" />
    : tokenTotalsQuery.isError || value == null
      ? t('Unavailable')
      : `${tokenTotalsQuery.data?.partial ? '≥ ' : ''}${formatInteger(value, locale)}`
  const metrics = [
    [t('Filtered cost'), statsQuery.isLoading ? <Skeleton className="h-7 w-24" /> : traceBlocked || statsQuery.isError ? t('Unavailable') : formatQuota(statsQuery.data?.quota ?? 0, locale, 6)],
    [t('Records'), formatInteger(total ?? 0, locale)],
    [t('Input tokens'), tokenValue(tokenTotalsQuery.data?.promptTokens)],
    [t('Output tokens'), tokenValue(tokenTotalsQuery.data?.completionTokens)],
    [t('Cached tokens'), tokenValue(tokenTotalsQuery.data?.cacheTokens)],
  ] as const
  return (
    <section aria-label={t('Usage statistics')} className="grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-5">
      {metrics.map(([label, value], index) => <div key={label} className={`min-w-0 p-4 ${index < 4 && index % 2 === 0 ? 'border-e' : ''} ${index < 4 ? 'border-b' : ''} lg:border-b-0 ${index < 4 ? 'lg:border-e' : ''}`}><p className="text-xs text-muted-foreground">{label}</p><div className={`mt-1 min-w-0 truncate font-mono font-semibold tabular-nums ${value === t('Unavailable') ? 'text-sm text-muted-foreground' : 'text-xl'}`}>{value}</div></div>)}
      {!traceBlocked && statsQuery.isError ? <div role="alert" className="col-span-2 flex items-center justify-between gap-3 border-t px-4 py-3 text-sm lg:col-span-5"><span className="min-w-0 text-destructive">{safeQueryError(statsQuery.error, 'stats', t)}</span><Button variant="outline" size="sm" className="shrink-0" onClick={() => void statsQuery.refetch()}><RefreshCw />{t('Retry')}</Button></div> : null}
      {tokenTotalsQuery.isError ? <div role="alert" className="col-span-2 flex items-center justify-between gap-3 border-t px-4 py-3 text-sm lg:col-span-5"><span className="min-w-0 text-destructive">{t('Usage token totals are unavailable.')}</span><Button variant="outline" size="sm" className="shrink-0" onClick={() => void tokenTotalsQuery.refetch()}><RefreshCw />{t('Retry')}</Button></div> : null}
      {traceBlocked ? <p role="status" className="col-span-2 border-t px-4 py-3 text-xs text-muted-foreground lg:col-span-5">{t('Filtered cost is unavailable because the statistics contract does not accept request or upstream request IDs. The record count remains exact.')}</p> : null}
      {!traceBlocked && statsQuery.data?.partial ? <p role="status" className="col-span-2 border-t px-4 py-3 text-xs text-muted-foreground lg:col-span-5">{t('Some usage statistics are unavailable; usable metrics remain visible.')}</p> : null}
      {tokenTotalsQuery.data?.partial ? <p role="status" className="col-span-2 border-t px-4 py-3 text-xs text-muted-foreground lg:col-span-5">{t('Token totals are incomplete because some matching usage logs could not be aggregated.')}</p> : null}
    </section>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-3 px-3 py-2.5 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="flex min-w-0 justify-end break-words text-end font-medium">{children}</dd></div>
}

const basePricePerMillion = 2

function formatModelPrice(value: number | undefined, locale: AppLocale) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }).format(value)
}

function PricingDetails({ record, locale }: { record: SafeLogRecord; locale: AppLocale }) {
  const { t } = useTranslation()
  if (record.modelRatio == null && record.completionRatio == null && record.cacheRatio == null) return null
  const standardInput = record.modelRatio != null && record.modelRatio > 0
    ? record.modelRatio * basePricePerMillion
    : record.modelPrice != null && record.modelPrice > 0
      ? record.modelPrice
      : undefined
  if (standardInput == null) return null
  const groupRatio = record.groupRatio ?? 1
  const completionRatio = record.completionRatio ?? 1
  const cacheRatio = record.cacheRatio ?? 1
  const prices = [
    [t('Input tokens'), standardInput, standardInput * groupRatio],
    [t('Output tokens'), standardInput * completionRatio, standardInput * completionRatio * groupRatio],
    [t('Cached tokens'), standardInput * cacheRatio, standardInput * cacheRatio * groupRatio],
  ] as const
  return (
    <section className="overflow-hidden rounded-md border" aria-labelledby="model-pricing-heading">
      <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
        <h3 id="model-pricing-heading" className="text-sm font-semibold">{t('Model pricing')}</h3>
        <span className="text-[11px] text-muted-foreground">{t('Per million tokens')}</span>
      </div>
      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-2 border-t px-3 py-2.5 text-xs">
        <span className="text-muted-foreground" />
        <span className="text-end text-muted-foreground">{t('Standard price')}</span>
        <span className="text-end text-muted-foreground">{t('Actual price')}</span>
        {prices.map(([label, standard, actual]) => (
          <Fragment key={label}>
            <span className="font-medium">{label}</span>
            <span className="text-end font-mono tabular-nums">{formatModelPrice(standard, locale)}</span>
            <span className="text-end font-mono font-medium tabular-nums">{formatModelPrice(actual, locale)}</span>
          </Fragment>
        ))}
      </div>
    </section>
  )
}

function DetailList({ record, locale }: { record: SafeLogRecord; locale: AppLocale }) {
  const { t } = useTranslation()
  return <div className="space-y-3"><dl className="divide-y rounded-md border">
    <DetailRow label={t('Request ID')}>{record.requestId || '—'}</DetailRow>
    <DetailRow label={t('Time')}>{formatDate(record.createdAt, locale)}</DetailRow>
    <DetailRow label={t('Type')}><TypeBadge type={record.type} /></DetailRow>
    <DetailRow label={t('Group')}><GroupValue record={record} /></DetailRow>
    <DetailRow label={t('Model')}><ModelProviderBadge model={record.modelName} /></DetailRow>
    <DetailRow label={t('Key name')}>{record.tokenName || '—'}</DetailRow>
    <DetailRow label={t('Streaming')}>{record.isStream == null ? '—' : record.isStream ? t('Yes') : t('No')}</DetailRow>
    <DetailRow label={t('Token')}><TokenMetrics record={record} locale={locale} compact /></DetailRow>
    <DetailRow label={t('Cost')}><span className="font-mono tabular-nums">{formatQuota(record.quota, locale, 6)}</span></DetailRow>
    <DetailRow label={t('Duration')}><DurationMetrics record={record} /></DetailRow>
  </dl><PricingDetails record={record} locale={locale} /><p role="status" className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">{t('To protect your privacy, Partokens does not record request bodies, metadata, or other sensitive content.')}</p></div>
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
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const closeAutoFocus = (event: Event) => {
    event.preventDefault()
    returnFocus.current?.focus()
  }

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md" onCloseAutoFocus={closeAutoFocus}>
          <SheetHeader><SheetTitle>{t('Request details')}</SheetTitle><SheetDescription className="sr-only">{t('Request details')}</SheetDescription></SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"><DetailList record={record} locale={locale} /></div>
          <SheetFooter className="border-t"><Button variant="outline" onClick={onClose}>{t('Close')}</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl" onCloseAutoFocus={closeAutoFocus}>
        <DialogHeader><DialogTitle>{t('Request details')}</DialogTitle><DialogDescription className="sr-only">{t('Request details')}</DialogDescription></DialogHeader>
        <DetailList record={record} locale={locale} />
        <DialogFooter><Button variant="outline" onClick={onClose}>{t('Close')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function uniqueOptions(values: Array<string | undefined>, selected: string) {
  return [...new Set([selected, ...values].filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b))
}

function updatedLabel(timestamp: number, locale: AppLocale, t: TFunction) {
  if (!timestamp) return t('Not updated')
  return t('Updated at {{time}}', { time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(timestamp) })
}

export function ConsoleUsageLogsPage() {
  const { t } = useTranslation()
  const locale = usePageLocale()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<LogFilterState>(defaultFilters)
  const [applied, setApplied] = useState<LogFilterState>(defaultFilters)
  const [appliedAt, setAppliedAt] = useState(() => Math.floor(Date.now() / 1000))
  const [page, setPage] = useState(1)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SafeLogRecord | null>(null)
  const [manualRefreshing, setManualRefreshing] = useState(false)
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null)
  const params = useMemo(() => makeListParams(applied, appliedAt, page), [applied, appliedAt, page])
  const statParams = useMemo(() => makeStatsParams(params), [params])
  const tokenTotalsParams = useMemo(() => makeTokenTotalsParams(params), [params])
  const statsTraceBlocked = Boolean(applied.searchValue) && (applied.searchKind === 'request' || applied.searchKind === 'upstream')
  const logs = useQuery({ queryKey: consoleQueryKeys.usageLogs.list(params), queryFn: ({ signal }) => fetchLogPage(params, page, signal), retry: false })
  const stats = useQuery({ queryKey: consoleQueryKeys.usageLogs.stats(statParams), queryFn: ({ signal }) => fetchStats(statParams, signal), enabled: !statsTraceBlocked, retry: false })
  const tokenTotals = useQuery({
    queryKey: consoleQueryKeys.usageLogs.tokenTotals(tokenTotalsParams),
    queryFn: ({ signal }) => tokenTotalsParams ? fetchTokenTotals(tokenTotalsParams, signal) : Promise.resolve({ promptTokens: 0, completionTokens: 0, cacheTokens: 0, partial: false }),
    retry: false,
  })
  const totalPages = Math.max(1, Math.ceil((logs.data?.total || 0) / (logs.data?.pageSize || pageSize)))
  const hasFilters = applied.type !== '0' || Boolean(applied.model || applied.group || applied.searchValue) || applied.rangeHours !== '24'
  const hasVisibleFilters = filters.type !== '0' || Boolean(filters.model || filters.group || filters.searchValue) || filters.rangeHours !== '24'
  const modelOptions = useMemo(() => uniqueOptions(logs.data?.records.map((record) => record.modelName) || [], applied.model).filter((value) => value !== '__all__'), [applied.model, logs.data?.records])
  const groupOptions = useMemo(() => uniqueOptions(logs.data?.records.map((record) => record.group) || [], applied.group).filter((value) => value !== '__all__'), [applied.group, logs.data?.records])
  const searchLabels: Record<LogFilterState['searchKind'], string> = { request: t('Request ID'), upstream: t('Upstream request ID'), token: t('Key name'), model: t('Model') }

  const applySearch = (event: FormEvent) => {
    event.preventDefault()
    if (containsSensitiveLogText(filters.searchValue)) {
      setFilterError(t('Credential-shaped values and URLs cannot be used as log filters.'))
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
    const toastId = toast.loading(t('Refreshing usage logs...'), { duration: Infinity })
    setManualRefreshing(true)
    try {
      await refreshConsoleQueries(queryClient, consoleQueryKeys.usageLogs.all)
      toast.success(t('Usage logs refreshed'), { id: toastId, description: t('Usage logs are up to date.'), duration: 6000 })
    } catch {
      toast.error(t('Usage logs refresh failed'), { id: toastId, description: t('Available account data remains visible.'), duration: 6000 })
    } finally {
      setManualRefreshing(false)
    }
  }
  const openDetails = (record: SafeLogRecord, event: MouseEvent<HTMLButtonElement>) => {
    detailTriggerRef.current = event.currentTarget
    setSelected(record)
  }
  const partial = logs.data && (logs.data.invalidCount > 0 || logs.data.partialCount > 0 || logs.data.redactedCount > 0 || logs.data.paginationPartial)
  const refreshing = manualRefreshing || logs.isFetching || (!statsTraceBlocked && stats.isFetching) || tokenTotals.isFetching

  return <div className="flex flex-col gap-6 pb-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><h1 id="console-title" className="text-2xl font-bold tracking-tight">{t('Usage logs')}</h1><p className="text-muted-foreground">{t('Inspect model calls, account events, cost, and request latency.')}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}{refreshing ? t('Refreshing...') : t('Refresh')}</Button>
      </div>
    </header>

    <form aria-label={t('Usage log filters')} className="flex flex-col gap-3 lg:flex-row lg:items-center" onSubmit={applySearch}>
      <div className="relative min-w-0 flex-1 lg:max-w-xs">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="absolute start-1 top-1/2 z-10 size-8 -translate-y-1/2 text-muted-foreground" aria-label={t('Search field: {{field}}', { field: searchLabels[filters.searchKind] })}><Search /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52"><DropdownMenuLabel>{t('Search exact field')}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => changeSearchKind('request')}>{t('Request ID')}</DropdownMenuItem><DropdownMenuItem onSelect={() => changeSearchKind('upstream')}>{t('Upstream request ID')}</DropdownMenuItem><DropdownMenuItem onSelect={() => changeSearchKind('token')}>{t('API key name')}</DropdownMenuItem><DropdownMenuItem onSelect={() => changeSearchKind('model')}>{t('Model')}</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
        <Input value={filters.searchValue} onChange={(event) => { setFilters((current) => ({ ...current, searchValue: event.target.value })); setFilterError(null) }} placeholder={t('Search request ID, key, or model...')} aria-label={searchLabels[filters.searchKind]} className="ps-10" autoComplete="off" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <Select value={filters.type} onValueChange={(value) => applySelect('type', value)}><SelectTrigger className="w-full sm:w-36" aria-label={t('Filter by event type')}><SelectValue /></SelectTrigger><SelectContent>{[[0, 'All types'], [1, 'Top-up'], [2, 'Usage'], [3, 'Management'], [4, 'System'], [5, 'Error'], [6, 'Refund'], [7, 'Login']].map(([value, label]) => <SelectItem key={value} value={String(value)}>{t(String(label))}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.model || '__all__'} onValueChange={(value) => applySelect('model', value === '__all__' ? '' : value)}><SelectTrigger className="w-full sm:w-44" aria-label={t('Filter by model')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">{t('All models')}</SelectItem>{modelOptions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.rangeHours} onValueChange={(value) => applySelect('rangeHours', value)}><SelectTrigger className="w-full sm:w-40" aria-label={t('Filter by time range')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="24">{t('Last 24 hours')}</SelectItem><SelectItem value="168">{t('Last 7 days')}</SelectItem><SelectItem value="720">{t('Last 30 days')}</SelectItem></SelectContent></Select>
        <Select value={filters.group || '__all__'} onValueChange={(value) => applySelect('group', value === '__all__' ? '' : value)}><SelectTrigger className="w-full sm:w-36" aria-label={t('Filter by key group')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">{t('All groups')}</SelectItem>{groupOptions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      </div>
      {hasVisibleFilters ? <Button type="button" variant="ghost" size="sm" className="self-start lg:self-auto" onClick={clearFilters}>{t('Clear')}</Button> : null}
    </form>
    {filterError ? <p role="alert" className="-mt-3 text-sm text-destructive">{filterError}</p> : null}

    <StatsStrip statsQuery={stats} tokenTotalsQuery={tokenTotals} total={logs.data?.total} locale={locale} traceBlocked={statsTraceBlocked} />

    <section aria-label={t('Usage logs')} className="overflow-hidden rounded-md border">
      {logs.isLoading ? <ListSkeleton /> : logs.isError ? <ListState error={logs.error} onRetry={() => void logs.refetch()} /> : logs.data?.records.length ? <>
        {partial ? <p role="status" className="border-b bg-muted/20 px-4 py-3 text-xs text-muted-foreground">{t('Some log records or fields were unavailable or redacted. Usable fields remain visible.')}</p> : null}
        <div className="hidden overflow-x-auto lg:block"><Table className="min-w-[1120px]"><TableHeader><TableRow className="hover:bg-transparent">
          <TableHead className="ps-4">{t('Request time')}</TableHead><TableHead>{t('Type')}</TableHead><TableHead>{t('Group')}</TableHead><TableHead>{t('Key name')}</TableHead><TableHead>{t('Model')}</TableHead><TableHead>{t('Streaming')}</TableHead><TableHead>{t('Token')}</TableHead><TableHead>{t('Cost')}</TableHead><TableHead>{t('Duration')}</TableHead><TableHead><span className="sr-only">{t('Details')}</span></TableHead>
        </TableRow></TableHeader><TableBody>{logs.data.records.map((record) => <TableRow key={`${record.rowId}-${record.requestId || ''}`}>
          <TableCell className="whitespace-nowrap ps-4 font-medium">{formatDate(record.createdAt, locale)}</TableCell>
          <TableCell><TypeBadge type={record.type} /></TableCell><TableCell><GroupValue record={record} /></TableCell><TableCell className="max-w-40 truncate" title={record.tokenName}>{record.tokenName || '—'}</TableCell><TableCell className="max-w-56"><ModelProviderBadge model={record.modelName} /></TableCell><TableCell>{record.isStream == null ? '—' : record.isStream ? t('Yes') : t('No')}</TableCell><TableCell><TokenMetrics record={record} locale={locale} /></TableCell><TableCell className="whitespace-nowrap font-mono text-xs tabular-nums">{formatQuota(record.quota, locale, 6)}</TableCell><TableCell><DurationMetrics record={record} /></TableCell><TableCell className="pe-3 text-end"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={t('View details {{request}}', { request: record.requestId || record.rowId })} onClick={(event) => openDetails(record, event)}><ChevronRight /></Button></TooltipTrigger><TooltipContent>{t('View details')}</TooltipContent></Tooltip></TableCell>
        </TableRow>)}</TableBody></Table></div>
        <div className="divide-y lg:hidden">{logs.data.records.map((record) => <article key={`${record.rowId}-${record.requestId || ''}`} className="space-y-4 p-4"><div className="flex min-w-0 items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><TypeBadge type={record.type} /><GroupValue record={record} /><time className="text-xs text-muted-foreground">{formatDate(record.createdAt, locale)}</time></div></div><Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={t('View details {{request}}', { request: record.requestId || record.rowId })} onClick={(event) => openDetails(record, event)}><ChevronRight /></Button></div><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Key name')}</dt><dd className="mt-1 break-words">{record.tokenName || '—'}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Model')}</dt><dd className="mt-1"><ModelProviderBadge model={record.modelName} /></dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Token')}</dt><dd className="mt-1"><TokenMetrics record={record} locale={locale} /></dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Cost')}</dt><dd className="mt-1 whitespace-nowrap font-mono text-xs tabular-nums">{formatQuota(record.quota, locale, 6)}</dd></div><div className="col-span-2 min-w-0"><dt className="text-xs text-muted-foreground">{t('Duration')}</dt><dd className="mt-1"><DurationMetrics record={record} /></dd></div></dl></article>)}</div>
      </> : <EmptyState filtered={hasFilters} onClear={clearFilters} />}
      <footer className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-sm text-muted-foreground"><span>{t('Page {{page}} / {{pages}}', { page, pages: totalPages })}{logs.data ? ` · ${t('{{visible}} of {{total}} records', { visible: formatInteger(logs.data.records.length, locale), total: formatInteger(logs.data.total, locale) })} · ${updatedLabel(logs.dataUpdatedAt, locale, t)}` : ''}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || logs.isFetching} onClick={() => { setSelected(null); setPage((value) => Math.max(1, value - 1)) }}>{t('Previous')}</Button><Button variant="outline" size="sm" disabled={page >= totalPages || logs.isFetching} onClick={() => { setSelected(null); setPage((value) => value + 1) }}>{t('Next')}</Button></div></footer>
    </section>

    {selected ? <LogDetails record={selected} locale={locale} returnFocus={detailTriggerRef} onClose={() => setSelected(null)} /> : null}
  </div>
}
