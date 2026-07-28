import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
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
  type SafeLogRecord,
  type SafeLogStats,
} from '@/lib/console-usage-contract'
import { formatDate, formatInteger, formatQuota } from '@/lib/format'

const pageSize = 20

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
  const { t } = useTranslation()
  if (query.isLoading) {
    return <section aria-label={t('Loading usage statistics')} className="grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`min-w-0 p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : ''}`}><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-7 w-24" /></div>)}</section>
  }
  const metrics = [
    [t('Filtered cost'), traceBlocked || query.isError ? t('Unavailable') : query.data ? formatQuota(query.data.quota, locale) : '—'],
    [t('Records'), total == null ? '—' : formatInteger(total, locale)],
    [t('Prompt tokens'), t('Unavailable')],
    [t('Completion tokens'), t('Unavailable')],
  ]
  return (
    <section aria-label={t('Usage statistics')} className="grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4">
      {metrics.map(([label, value], index) => <div key={label} className={`min-w-0 p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : ''}`}><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 min-w-0 truncate font-mono font-semibold tabular-nums ${value === t('Unavailable') ? 'text-sm text-muted-foreground' : 'text-xl'}`}>{value}</p></div>)}
      {!traceBlocked && query.isError ? <div role="alert" className="col-span-2 flex items-center justify-between gap-3 border-t px-4 py-3 text-sm lg:col-span-4"><span className="min-w-0 text-destructive">{safeQueryError(query.error, 'stats', t)}</span><Button variant="outline" size="sm" className="shrink-0" onClick={() => void query.refetch()}><RefreshCw />{t('Retry')}</Button></div> : null}
      {traceBlocked ? <p role="status" className="col-span-2 border-t px-4 py-3 text-xs text-muted-foreground lg:col-span-4">{t('Filtered cost is unavailable because the statistics contract does not accept request or upstream request IDs. The record count remains exact.')}</p> : null}
      {!traceBlocked && query.data?.partial ? <p role="status" className="col-span-2 border-t px-4 py-3 text-xs text-muted-foreground lg:col-span-4">{t('Some usage statistics are unavailable; usable metrics remain visible.')}</p> : null}
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
  return <div className="space-y-3"><dl className="divide-y rounded-md border">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-3 px-3 py-2.5 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-end font-medium">{value}</dd></div>)}</dl><p role="status" className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">{t('Request content, raw metadata, and sensitive URLs are withheld because the self-log API has no field-level sensitivity contract.')}</p></div>
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
  const description = `${record.requestId || t('Event {{id}}', { id: record.rowId })} · ${formatDate(record.createdAt, locale)}`
  const closeAutoFocus = (event: Event) => {
    event.preventDefault()
    returnFocus.current?.focus()
  }

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md" onCloseAutoFocus={closeAutoFocus}>
          <SheetHeader><SheetTitle>{t('Request details')}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"><DetailList record={record} locale={locale} /></div>
          <SheetFooter className="border-t"><Button variant="outline" onClick={onClose}>{t('Close')}</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl" onCloseAutoFocus={closeAutoFocus}>
        <DialogHeader><DialogTitle>{t('Request details')}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
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
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null)
  const params = useMemo(() => makeListParams(applied, appliedAt, page), [applied, appliedAt, page])
  const statParams = useMemo(() => makeStatsParams(params), [params])
  const statsTraceBlocked = Boolean(applied.searchValue) && (applied.searchKind === 'request' || applied.searchKind === 'upstream')
  const logs = useQuery({ queryKey: consoleQueryKeys.usageLogs.list(params), queryFn: ({ signal }) => fetchLogPage(params, page, signal), retry: false })
  const stats = useQuery({ queryKey: consoleQueryKeys.usageLogs.stats(statParams), queryFn: ({ signal }) => fetchStats(statParams, signal), enabled: !statsTraceBlocked, retry: false })
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
    try {
      await refreshConsoleQueries(queryClient, consoleQueryKeys.usageLogs.all)
    } catch {
      toast.error(t('Usage logs are unavailable'), { description: t('Available account data remains visible.') })
    }
  }
  const openDetails = (record: SafeLogRecord, event: MouseEvent<HTMLButtonElement>) => {
    detailTriggerRef.current = event.currentTarget
    setSelected(record)
  }
  const partial = logs.data && (logs.data.invalidCount > 0 || logs.data.partialCount > 0 || logs.data.redactedCount > 0 || logs.data.paginationPartial)
  const refreshing = logs.isFetching || (!statsTraceBlocked && stats.isFetching)

  return <div className="flex flex-col gap-6 pb-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><h1 id="console-title" className="text-2xl font-bold tracking-tight">{t('Usage logs')}</h1><p className="text-muted-foreground">{t('Inspect model calls, account events, cost, and request latency.')}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}{refreshing ? t('Refreshing...') : t('Refresh')}</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button className="text-primary-foreground" style={{ color: 'var(--primary-foreground)' }}><Download />{t('Export')}<ChevronDown className="ms-1" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('Complete filtered export')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled><Download />{t('Export CSV unavailable')}</DropdownMenuItem>
            <DropdownMenuItem disabled><Download />{t('Export JSON unavailable')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

    <StatsStrip query={stats} total={logs.data?.total} locale={locale} traceBlocked={statsTraceBlocked} />

    <section aria-label={t('Usage logs')} className="overflow-hidden rounded-md border">
      {logs.isLoading ? <ListSkeleton /> : logs.isError ? <ListState error={logs.error} onRetry={() => void logs.refetch()} /> : logs.data?.records.length ? <>
        {partial ? <p role="status" className="border-b bg-muted/20 px-4 py-3 text-xs text-muted-foreground">{t('Some log records or fields were unavailable or redacted. Usable fields remain visible.')}</p> : null}
        <div className="hidden overflow-x-auto lg:block"><Table className="min-w-[1040px]"><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="ps-4">{t('Time / request')}</TableHead><TableHead>{t('Type')}</TableHead><TableHead>{t('Key name')}</TableHead><TableHead>{t('Model')}</TableHead><TableHead>{t('Streaming')}</TableHead><TableHead>{t('Tokens')}</TableHead><TableHead>{t('Cost')}</TableHead><TableHead>{t('Latency')}</TableHead><TableHead><span className="sr-only">{t('Details')}</span></TableHead></TableRow></TableHeader><TableBody>{logs.data.records.map((record) => <TableRow key={`${record.rowId}-${record.requestId || ''}`}><TableCell className="ps-4"><div className="whitespace-nowrap font-medium">{formatDate(record.createdAt, locale)}</div><code className="mt-0.5 block max-w-48 truncate font-mono text-xs text-muted-foreground" title={record.requestId}>{record.requestId || '—'}</code></TableCell><TableCell><TypeBadge type={record.type} /></TableCell><TableCell className="max-w-40 truncate" title={record.tokenName}>{record.tokenName || '—'}</TableCell><TableCell className="max-w-48 truncate font-medium" title={record.modelName}>{record.modelName || '—'}</TableCell><TableCell>{record.isStream == null ? '—' : record.isStream ? t('Yes') : t('No')}</TableCell><TableCell className="font-mono text-xs">{formatInteger(totalTokens(record), locale)}</TableCell><TableCell className="font-mono text-xs">{formatQuota(record.quota, locale)}</TableCell><TableCell className="font-mono text-xs">{latency(record)}</TableCell><TableCell className="pe-3 text-end"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={t('View details {{request}}', { request: record.requestId || record.rowId })} onClick={(event) => openDetails(record, event)}><ChevronRight /></Button></TooltipTrigger><TooltipContent>{t('View details')}</TooltipContent></Tooltip></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="divide-y lg:hidden">{logs.data.records.map((record) => <article key={`${record.rowId}-${record.requestId || ''}`} className="space-y-4 p-4"><div className="flex min-w-0 items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><TypeBadge type={record.type} /><time className="text-xs text-muted-foreground">{formatDate(record.createdAt, locale)}</time></div><code className="mt-2 block break-all font-mono text-xs">{record.requestId || '—'}</code></div><Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={t('View details {{request}}', { request: record.requestId || record.rowId })} onClick={(event) => openDetails(record, event)}><ChevronRight /></Button></div><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Key name')}</dt><dd className="mt-1 break-words">{record.tokenName || '—'}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Model')}</dt><dd className="mt-1 break-words">{record.modelName || '—'}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Tokens')}</dt><dd className="mt-1 font-mono text-xs">{formatInteger(totalTokens(record), locale)}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Cost')} / {t('Latency')}</dt><dd className="mt-1 font-mono text-xs">{formatQuota(record.quota, locale)} / {latency(record)}</dd></div></dl></article>)}</div>
      </> : <EmptyState filtered={hasFilters} onClear={clearFilters} />}
      <footer className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-sm text-muted-foreground"><span>{t('Page {{page}} / {{pages}}', { page, pages: totalPages })}{logs.data ? ` · ${t('{{visible}} of {{total}} records', { visible: formatInteger(logs.data.records.length, locale), total: formatInteger(logs.data.total, locale) })} · ${updatedLabel(logs.dataUpdatedAt, locale, t)}` : ''}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || logs.isFetching} onClick={() => { setSelected(null); setPage((value) => Math.max(1, value - 1)) }}>{t('Previous')}</Button><Button variant="outline" size="sm" disabled={page >= totalPages || logs.isFetching} onClick={() => { setSelected(null); setPage((value) => value + 1) }}>{t('Next')}</Button></div></footer>
    </section>

    {selected ? <LogDetails record={selected} locale={locale} returnFocus={detailTriggerRef} onClose={() => setSelected(null)} /> : null}
  </div>
}
