import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import {
  AlertTriangle,
  BarChart3,
  Bot,
  ChevronDown,
  Download,
  KeyRound,
  LoaderCircle,
  MoreHorizontal,
  RefreshCw,
  Route,
} from 'lucide-react'
import { useMemo, useRef, useState, type MouseEvent } from 'react'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar,
} from '@partokens/design-system/components'
import { getFlowQuotaData, getQuotaData } from '@partokens/api-client'
import { isAppLocale, type AppLocale } from '@partokens/i18n'

import {
  asConsoleRequestError,
  ConsoleContractError,
  consoleErrorMessage,
  consoleQueryKeys,
  refreshConsoleQueries,
} from '@/lib/console-query'
import { formatInteger, formatQuota } from '@/lib/format'

type AnalyticsRange = '1' | '7' | '30' | '90'
type AnalyticsGranularity = 'hour' | 'day' | 'week'
type AnalyticsMeasure = 'requests' | 'tokens' | 'quota'
type AnalyticsView = 'trend' | 'ranking' | 'flow'
type MetricKey = keyof MetricTotals

type MetricTotals = { requests: number; tokens: number; quota: number }
type SafeUsageRow = { createdAt?: number; modelName?: string; requests?: number; tokens?: number; quota?: number }
type SafeFlowRow = { tokenId?: number; tokenName?: string; group?: string; modelName?: string; requests?: number; tokens?: number; quota?: number }
type ProjectedRows<T> = { rows: T[]; partial: boolean }
type UsageWindow = { current: ProjectedRows<SafeUsageRow>; previous: ProjectedRows<SafeUsageRow> }
type TrendPoint = MetricTotals & { label: string; shortLabel: string; timestamp: number; previous: MetricTotals }
type ModelTotal = MetricTotals & { name: string }
type FlowTotal = MetricTotals & { tokenName: string; group: string; modelName: string }

const EMPTY_TOTALS: MetricTotals = { requests: 0, tokens: 0, quota: 0 }
const rangeLabels: Record<AnalyticsRange, string> = {
  '1': 'Last 24 hours',
  '7': 'Last 7 days',
  '30': 'Last 30 days',
  '90': 'Last 90 days',
}
const granularityLabels: Record<AnalyticsGranularity, string> = {
  hour: 'Hourly',
  day: 'Daily',
  week: 'Weekly',
}

class AnalyticsContractError extends ConsoleContractError {
  constructor() {
    super('Analytics response contract is incomplete.')
    this.name = 'AnalyticsContractError'
  }
}

function usePageLocale(): AppLocale {
  const params = useParams({ strict: false }) as { locale?: string }
  return isAppLocale(params.locale) ? params.locale : 'zh-CN'
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

function safeLabel(value: unknown, limit = 120): string | undefined {
  if (typeof value !== 'string') return undefined
  const label = value.trim()
  if (!label || label.length > limit || /https?:\/\/|\bBearer\b|(?:api[-_ ]?key|token)\s*[:=]/i.test(label)) return undefined
  return label
}

function sourceObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function envelopeRows(value: unknown): unknown[] {
  const envelope = sourceObject(value)
  if (!envelope || envelope.success !== true || !Array.isArray(envelope.data)) throw new AnalyticsContractError()
  return envelope.data
}

function projectUsage(value: unknown): ProjectedRows<SafeUsageRow> {
  const input = envelopeRows(value)
  const rows: SafeUsageRow[] = []
  let partial = false
  for (const item of input) {
    const source = sourceObject(item)
    if (!source) {
      partial = true
      continue
    }
    const requests = finiteNumber(source.count) ?? finiteNumber(source.request_count)
    const tokens = finiteNumber(source.token_used)
    const quota = finiteNumber(source.quota)
    const createdAt = finiteNumber(source.created_at)
    const modelName = safeLabel(source.model_name)
    if (requests == null && tokens == null && quota == null) {
      partial = true
      continue
    }
    if (createdAt == null || !modelName || requests == null || tokens == null || quota == null) partial = true
    rows.push({ createdAt, modelName, requests, tokens, quota })
  }
  return { rows, partial }
}

function projectFlow(value: unknown): ProjectedRows<SafeFlowRow> {
  const input = envelopeRows(value)
  const rows: SafeFlowRow[] = []
  let partial = false
  for (const item of input) {
    const source = sourceObject(item)
    if (!source) {
      partial = true
      continue
    }
    const requests = finiteNumber(source.count)
    const tokens = finiteNumber(source.token_used)
    const quota = finiteNumber(source.quota)
    if (requests == null && tokens == null && quota == null) {
      partial = true
      continue
    }
    const tokenId = finiteNumber(source.token_id)
    const tokenName = safeLabel(source.token_name)
    const group = safeLabel(source.use_group, 64)
    const modelName = safeLabel(source.model_name)
    if (!tokenName || !group || !modelName || requests == null || tokens == null || quota == null) partial = true
    rows.push({ tokenId, tokenName, group, modelName, requests, tokens, quota })
  }
  return { rows, partial }
}

async function safeRequest<T>(request: () => Promise<unknown>, project: (value: unknown) => T): Promise<T> {
  try {
    return project(await request())
  } catch (error) {
    throw asConsoleRequestError(error, 'Analytics data is unavailable.')
  }
}

function errorMessage(error: unknown, t: TFunction): string {
  return consoleErrorMessage(error, {
    authentication: t('Sign in again to load analytics data.'),
    authorization: t('Your account cannot access this analytics data.'),
    contract: t('The analytics response contract is incomplete.'),
    availability: t('The aggregate usage request failed. Try again to reload the current period.'),
  })
}

function requestBounds(range: AnalyticsRange, previous = false) {
  const seconds = Number(range) * 86_400
  const end = Math.floor(Date.now() / 1000) - (previous ? seconds : 0)
  return { start_timestamp: end - seconds, end_timestamp: end }
}

function requestGranularity(granularity: AnalyticsGranularity) {
  return granularity === 'week' ? 'day' : granularity
}

async function loadUsage(range: AnalyticsRange, granularity: AnalyticsGranularity, signal?: AbortSignal): Promise<UsageWindow> {
  const default_time = requestGranularity(granularity)
  const [current, previous] = await Promise.all([
    safeRequest(() => getQuotaData({ ...requestBounds(range), default_time }, signal), projectUsage),
    safeRequest(() => getQuotaData({ ...requestBounds(range, true), default_time }, signal), projectUsage),
  ])
  return { current, previous }
}

function rowTotals(row: SafeUsageRow | SafeFlowRow): MetricTotals {
  return { requests: row.requests ?? 0, tokens: row.tokens ?? 0, quota: row.quota ?? 0 }
}

function addTotals(left: MetricTotals, right: MetricTotals): MetricTotals {
  return { requests: left.requests + right.requests, tokens: left.tokens + right.tokens, quota: left.quota + right.quota }
}

function sumRows(rows: Array<SafeUsageRow | SafeFlowRow>): MetricTotals {
  return rows.reduce((total, row) => addTotals(total, rowTotals(row)), EMPTY_TOTALS)
}

function metricComplete(rows: Array<SafeUsageRow | SafeFlowRow>, metric: MetricKey): boolean {
  return rows.length > 0 && rows.every((row) => row[metric] != null)
}

function measureValue(totals: MetricTotals, measure: AnalyticsMeasure) {
  return totals[measure]
}

function measureLabel(measure: AnalyticsMeasure, t: TFunction) {
  if (measure === 'quota') return t('Cost')
  if (measure === 'tokens') return t('Tokens')
  return t('Requests')
}

function formatMeasure(value: number, measure: AnalyticsMeasure, locale: AppLocale, compact = false) {
  if (measure === 'quota') return formatQuota(value, locale)
  if (compact) return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  return formatInteger(value, locale)
}

function bucketTimestamp(timestamp: number, granularity: AnalyticsGranularity) {
  const date = new Date(timestamp * 1000)
  if (granularity === 'hour') date.setMinutes(0, 0, 0)
  if (granularity === 'day') date.setHours(0, 0, 0, 0)
  if (granularity === 'week') {
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  }
  return Math.floor(date.getTime() / 1000)
}

function dateLabel(timestamp: number, granularity: AnalyticsGranularity, locale: AppLocale, short = false) {
  const options: Intl.DateTimeFormatOptions = granularity === 'hour'
    ? { hour: '2-digit', minute: '2-digit', month: short ? undefined : 'short', day: short ? undefined : 'numeric' }
    : granularity === 'week'
      ? { month: short ? undefined : 'short', day: 'numeric' }
      : { month: short ? undefined : 'short', day: 'numeric' }
  return new Intl.DateTimeFormat(locale, options).format(timestamp * 1000)
}

function trendRows(rows: SafeUsageRow[], granularity: AnalyticsGranularity, locale: AppLocale) {
  const buckets = new Map<number, MetricTotals>()
  for (const row of rows) {
    if (!row.createdAt) continue
    const bucket = bucketTimestamp(row.createdAt, granularity)
    buckets.set(bucket, addTotals(buckets.get(bucket) ?? EMPTY_TOTALS, rowTotals(row)))
  }
  return [...buckets.entries()].sort(([left], [right]) => left - right).map(([timestamp, totals]) => ({
    ...totals,
    timestamp,
    label: dateLabel(timestamp, granularity, locale),
    shortLabel: dateLabel(timestamp, granularity, locale, true),
  }))
}

function buildTrend(current: SafeUsageRow[], previous: SafeUsageRow[], granularity: AnalyticsGranularity, locale: AppLocale): TrendPoint[] {
  const currentPoints = trendRows(current, granularity, locale)
  const previousPoints = trendRows(previous, granularity, locale)
  return currentPoints.map((point, index) => ({ ...point, previous: previousPoints[index] ?? EMPTY_TOTALS }))
}

function buildRanking(rows: SafeUsageRow[]): ModelTotal[] {
  const models = new Map<string, MetricTotals>()
  for (const row of rows) {
    if (!row.modelName) continue
    models.set(row.modelName, addTotals(models.get(row.modelName) ?? EMPTY_TOTALS, rowTotals(row)))
  }
  return [...models.entries()].map(([name, totals]) => ({ name, ...totals }))
}

function buildFlows(rows: SafeFlowRow[], t: TFunction): FlowTotal[] {
  const flows = new Map<string, FlowTotal>()
  for (const row of rows) {
    const tokenName = row.tokenName ?? (row.tokenId ? t('Deleted key #{{id}}', { id: row.tokenId }) : t('Deleted key'))
    const group = row.group ?? t('Unavailable')
    const modelName = row.modelName ?? t('Unavailable')
    const key = JSON.stringify([row.tokenId ?? null, tokenName, group, modelName])
    const total = addTotals(flows.get(key) ?? EMPTY_TOTALS, rowTotals(row))
    flows.set(key, { tokenName, group, modelName, ...total })
  }
  return [...flows.values()]
}

function AnalyticsLoading() {
  const { t } = useTranslation()
  return (
    <div aria-label={t('Loading analytics')} aria-busy="true" className="space-y-6">
      <section className="grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className={`p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : ''}`}><Skeleton className="h-3 w-24" /><Skeleton className="mt-3 h-7 w-20" /></div>)}
      </section>
      <section className="overflow-hidden rounded-md border">
        <div className="flex items-center justify-between border-b p-4"><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-44" /></div><Skeleton className="h-8 w-48" /></div>
        <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)] sm:p-6"><Skeleton className="h-72 w-full" /><Skeleton className="h-72 w-full" /></div>
      </section>
    </div>
  )
}

function StatePanel(props: { kind: 'error' | 'empty' | 'contract'; message: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <section role={props.kind === 'empty' ? undefined : 'alert'} className="flex min-h-96 flex-col items-center justify-center rounded-md border px-6 py-12 text-center">
      <div className={`mb-4 flex size-10 items-center justify-center rounded-md border ${props.kind === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'bg-muted/40 text-muted-foreground'}`}>{props.kind === 'error' ? <AlertTriangle className="size-5" /> : <BarChart3 className="size-5" />}</div>
      <h2 className="text-sm font-semibold">{props.kind === 'empty' ? t('No usage in this period') : props.kind === 'contract' ? t('Analytics contract is incomplete') : t('Analytics data is unavailable')}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{props.message}</p>
      {props.onRetry ? <Button variant="outline" size="sm" className="mt-4" onClick={props.onRetry}><RefreshCw />{t('Try again')}</Button> : null}
    </section>
  )
}

function SecondaryError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

function MetricSummary(props: { current: MetricTotals; previous: MetricTotals; locale: AppLocale; currentRows: SafeUsageRow[]; previousRows: SafeUsageRow[] }) {
  const { t } = useTranslation()
  const items = (['requests', 'tokens', 'quota'] as const).map((metric) => ({
    label: measureLabel(metric, t),
    value: metricComplete(props.currentRows, metric) ? formatMeasure(props.current[metric], metric, props.locale) : '—',
    note: metricComplete(props.previousRows, metric) ? t('{{value}} previous', { value: formatMeasure(props.previous[metric], metric, props.locale) }) : t('Previous unavailable'),
  }))
  items.push({ label: t('Success rate'), value: '—', note: t('Contract unavailable') })
  return (
    <section aria-label={t('Usage summary')} className="grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4">
      {items.map((item, index) => <div key={item.label} className={`min-w-0 p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : ''}`}><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-1 truncate font-mono text-xl font-semibold tabular-nums">{item.value}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.note}</p></div>)}
    </section>
  )
}

function TrendChart(props: { points: TrendPoint[]; measure: AnalyticsMeasure; locale: AppLocale }) {
  const { t } = useTranslation()
  const maximum = Math.max(...props.points.flatMap((point) => [measureValue(point, props.measure), measureValue(point.previous, props.measure)]), 1)
  const current = props.points.reduce((sum, point) => sum + measureValue(point, props.measure), 0)
  const previous = props.points.reduce((sum, point) => sum + measureValue(point.previous, props.measure), 0)
  const change = previous > 0 ? ((current - previous) / previous) * 100 : undefined
  const labelInterval = Math.max(1, Math.ceil(props.points.length / 7))
  return (
    <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
      <figure className="min-w-0 p-4 sm:p-6">
        <figcaption className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{measureLabel(props.measure, t)}</p><p className="mt-1 font-mono text-2xl font-semibold">{formatMeasure(current, props.measure, props.locale, true)}</p></div><Badge variant="secondary" className="font-mono">{change == null ? t('Previous unavailable') : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`}</Badge></figcaption>
        <div className="relative mt-6 h-64">
          <div aria-hidden="true" className="absolute inset-0 grid grid-rows-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="border-t border-dashed" />)}</div>
          <div className="relative z-10 grid h-full gap-1 sm:gap-2" style={{ gridTemplateColumns: `repeat(${props.points.length}, minmax(0, 1fr))` }}>
            {props.points.map((point, index) => {
              const present = measureValue(point, props.measure)
              const past = measureValue(point.previous, props.measure)
              const showLabel = props.points.length <= 14 || index % labelInterval === 0 || index === props.points.length - 1
              return <div key={point.timestamp} className="grid min-w-0 grid-rows-[minmax(0,1fr)_1.25rem] gap-2"><Tooltip><TooltipTrigger asChild><div tabIndex={0} role="img" aria-label={t('{{label}}: {{current}} current, {{previous}} previous', { label: point.label, current: formatMeasure(present, props.measure, props.locale), previous: formatMeasure(past, props.measure, props.locale) })} className="flex h-full min-w-0 items-end justify-center gap-px rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:gap-1"><span className="block w-[35%] rounded-t-sm bg-muted-foreground/25" style={{ height: `${Math.max(3, past / maximum * 100)}%` }} /><span className="block w-[35%] rounded-t-sm bg-chart-2" style={{ height: `${Math.max(3, present / maximum * 100)}%` }} /></div></TooltipTrigger><TooltipContent side="top"><p className="font-medium">{point.label}</p><p>{t('Current')}: {formatMeasure(present, props.measure, props.locale)}</p><p>{t('Previous')}: {formatMeasure(past, props.measure, props.locale)}</p></TooltipContent></Tooltip><span className="truncate text-center text-[10px] text-muted-foreground">{showLabel ? point.shortLabel : ''}</span></div>
            })}
          </div>
        </div>
      </figure>
      <aside className="border-t p-4 lg:border-t-0 lg:border-s sm:p-6"><p className="text-sm font-medium">{t('Period comparison')}</p><p className="mt-1 text-sm text-muted-foreground">{t('Usage aggregates for the selected measure and the immediately preceding period.')}</p><dl className="mt-6 space-y-4 text-sm"><div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-sm bg-chart-2" />{t('Current period')}</dt><dd className="font-mono font-medium">{formatMeasure(current, props.measure, props.locale, true)}</dd></div><div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-sm bg-muted-foreground/25" />{t('Previous period')}</dt><dd className="font-mono font-medium">{formatMeasure(previous, props.measure, props.locale, true)}</dd></div></dl></aside>
    </div>
  )
}

function ModelRanking(props: { models: ModelTotal[]; measure: AnalyticsMeasure; locale: AppLocale; requestsReady: boolean; quotaReady: boolean }) {
  const { t } = useTranslation()
  const sorted = [...props.models].sort((left, right) => measureValue(right, props.measure) - measureValue(left, props.measure))
  const total = sorted.reduce((sum, model) => sum + measureValue(model, props.measure), 0)
  return <div><div className="hidden md:block"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="ps-4">{t('Model')}</TableHead><TableHead>{t('Share')}</TableHead><TableHead>{t('Requests')}</TableHead><TableHead>{t('Cost')}</TableHead><TableHead>{t('Success')}</TableHead><TableHead>{t('Median latency')}</TableHead></TableRow></TableHeader><TableBody>{sorted.map((model) => { const share = total ? measureValue(model, props.measure) / total : 0; return <TableRow key={model.name}><TableCell className="max-w-64 truncate ps-4 font-medium">{model.name}</TableCell><TableCell><div className="flex min-w-36 items-center gap-3"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-chart-2" style={{ width: `${share * 100}%` }} /></span><span className="w-10 text-end font-mono text-xs">{new Intl.NumberFormat(props.locale, { style: 'percent', maximumFractionDigits: 1 }).format(share)}</span></div></TableCell><TableCell className="font-mono text-xs">{props.requestsReady ? formatInteger(model.requests, props.locale) : '—'}</TableCell><TableCell className="font-mono text-xs">{props.quotaReady ? formatQuota(model.quota, props.locale) : '—'}</TableCell><TableCell className="text-muted-foreground">{t('Unavailable')}</TableCell><TableCell className="text-muted-foreground">{t('Unavailable')}</TableCell></TableRow> })}</TableBody></Table></div><div className="divide-y md:hidden">{sorted.map((model, index) => { const share = total ? measureValue(model, props.measure) / total : 0; return <article key={model.name} className="space-y-4 p-4"><div className="flex min-w-0 items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">#{index + 1}</p><h3 className="break-words text-sm font-medium">{model.name}</h3></div><Badge variant="secondary">{new Intl.NumberFormat(props.locale, { style: 'percent', maximumFractionDigits: 1 }).format(share)}</Badge></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-chart-2" style={{ width: `${share * 100}%` }} /></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">{t('Requests')}</dt><dd className="mt-1 font-mono text-xs">{props.requestsReady ? formatInteger(model.requests, props.locale) : '—'}</dd></div><div><dt className="text-xs text-muted-foreground">{t('Cost')}</dt><dd className="mt-1 font-mono text-xs">{props.quotaReady ? formatQuota(model.quota, props.locale) : '—'}</dd></div><div><dt className="text-xs text-muted-foreground">{t('Success')}</dt><dd className="mt-1 text-muted-foreground">{t('Unavailable')}</dd></div><div><dt className="text-xs text-muted-foreground">{t('Median latency')}</dt><dd className="mt-1 text-muted-foreground">{t('Unavailable')}</dd></div></dl></article> })}</div></div>
}

function RequestFlow(props: { flows: FlowTotal[]; measure: AnalyticsMeasure; locale: AppLocale }) {
  const { t } = useTranslation()
  const sorted = [...props.flows].sort((left, right) => measureValue(right, props.measure) - measureValue(left, props.measure)).slice(0, 12)
  const total = props.flows.reduce((sum, flow) => sum + measureValue(flow, props.measure), 0)
  return <div><div className="hidden md:block"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="ps-4">{t('API key')}</TableHead><TableHead>{t('Group')}</TableHead><TableHead>{t('Model route')}</TableHead><TableHead>{measureLabel(props.measure, t)}</TableHead><TableHead>{t('Share')}</TableHead></TableRow></TableHeader><TableBody>{sorted.map((flow, index) => { const share = total ? measureValue(flow, props.measure) / total : 0; return <TableRow key={`${flow.tokenName}:${flow.modelName}:${index}`}><TableCell className="max-w-56 ps-4 font-medium"><span className="flex min-w-0 items-center gap-2"><KeyRound className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{flow.tokenName}</span></span></TableCell><TableCell><Badge variant="outline">{flow.group}</Badge></TableCell><TableCell className="max-w-64"><span className="flex min-w-0 items-center gap-2"><Bot className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{flow.modelName}</span></span></TableCell><TableCell className="font-mono text-xs">{formatMeasure(measureValue(flow, props.measure), props.measure, props.locale)}</TableCell><TableCell className="font-mono text-xs">{new Intl.NumberFormat(props.locale, { style: 'percent', maximumFractionDigits: 1 }).format(share)}</TableCell></TableRow> })}</TableBody></Table></div><div className="divide-y md:hidden">{sorted.map((flow, index) => { const share = total ? measureValue(flow, props.measure) / total : 0; return <article key={`${flow.tokenName}:${flow.modelName}:${index}`} className="space-y-3 p-4"><div className="flex min-w-0 items-start gap-2 text-sm font-medium"><KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 break-words">{flow.tokenName}</span><Badge variant="outline" className="ms-auto shrink-0">{flow.group}</Badge></div><div className="flex min-w-0 items-start gap-2 text-sm"><Route className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 break-words">{flow.modelName}</span></div><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className="font-mono">{formatMeasure(measureValue(flow, props.measure), props.measure, props.locale)}</span><span className="shrink-0 font-mono">{new Intl.NumberFormat(props.locale, { style: 'percent', maximumFractionDigits: 1 }).format(share)}</span></div></article> })}</div></div>
}

function DataRows(props: { points: TrendPoint[]; locale: AppLocale }) {
  const { t } = useTranslation()
  return <><div className="hidden sm:block"><div className="max-h-[55vh] overflow-auto rounded-md border"><Table><TableHeader className="sticky top-0 bg-background"><TableRow className="hover:bg-transparent"><TableHead>{t('Period')}</TableHead><TableHead>{t('Requests')}</TableHead><TableHead>{t('Tokens')}</TableHead><TableHead>{t('Cost')}</TableHead><TableHead>{t('Previous requests')}</TableHead></TableRow></TableHeader><TableBody>{props.points.map((point) => <TableRow key={point.timestamp}><TableCell className="font-medium">{point.label}</TableCell><TableCell className="font-mono text-xs">{formatInteger(point.requests, props.locale)}</TableCell><TableCell className="font-mono text-xs">{formatInteger(point.tokens, props.locale)}</TableCell><TableCell className="font-mono text-xs">{formatQuota(point.quota, props.locale)}</TableCell><TableCell className="font-mono text-xs">{formatInteger(point.previous.requests, props.locale)}</TableCell></TableRow>)}</TableBody></Table></div></div><div className="divide-y rounded-md border sm:hidden">{props.points.map((point) => <article key={point.timestamp} className="space-y-3 p-3"><h3 className="text-sm font-medium">{point.label}</h3><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">{t('Requests')}</dt><dd className="mt-1 font-mono text-xs">{formatInteger(point.requests, props.locale)}</dd></div><div><dt className="text-xs text-muted-foreground">{t('Tokens')}</dt><dd className="mt-1 font-mono text-xs">{formatInteger(point.tokens, props.locale)}</dd></div><div><dt className="text-xs text-muted-foreground">{t('Cost')}</dt><dd className="mt-1 font-mono text-xs">{formatQuota(point.quota, props.locale)}</dd></div><div><dt className="text-xs text-muted-foreground">{t('Previous requests')}</dt><dd className="mt-1 font-mono text-xs">{formatInteger(point.previous.requests, props.locale)}</dd></div></dl></article>)}</div></>
}

function AnalyticsDataDetails(props: { points: TrendPoint[]; period: string; locale: AppLocale; onClose: () => void; onClosedAutoFocus: () => void }) {
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const closeAutoFocus = (event: Event) => { event.preventDefault(); props.onClosedAutoFocus() }
  if (isMobile) return <Sheet open onOpenChange={(open) => !open && props.onClose()}><SheetContent className="w-full sm:max-w-md" onCloseAutoFocus={closeAutoFocus}><SheetHeader><SheetTitle>{t('Aggregated usage data')}</SheetTitle><SheetDescription>{props.period}</SheetDescription></SheetHeader><div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"><DataRows points={props.points} locale={props.locale} /></div><SheetFooter className="border-t"><Button variant="outline" onClick={props.onClose}>{t('Close')}</Button></SheetFooter></SheetContent></Sheet>
  return <Dialog open onOpenChange={(open) => !open && props.onClose()}><DialogContent className="sm:max-w-3xl" onCloseAutoFocus={closeAutoFocus}><DialogHeader><DialogTitle>{t('Aggregated usage data')}</DialogTitle><DialogDescription>{props.period}</DialogDescription></DialogHeader><DataRows points={props.points} locale={props.locale} /><DialogFooter><Button variant="outline" onClick={props.onClose}>{t('Close')}</Button></DialogFooter></DialogContent></Dialog>
}

function SupportingSummary(props: { modelCount: number; requestCount?: number; locale: AppLocale }) {
  const { t } = useTranslation()
  return <div className="grid gap-4 lg:grid-cols-2"><section aria-labelledby="analytics-model-health" className="overflow-hidden rounded-md border"><header className="border-b p-4"><h2 id="analytics-model-health" className="text-sm font-semibold">{t('Model health')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('Availability and latency across models with recorded usage.')}</p></header><dl className="grid grid-cols-3 divide-x p-4 text-center"><div><dt className="text-xs text-muted-foreground">{t('Models')}</dt><dd className="mt-1 font-mono text-lg font-semibold">{formatInteger(props.modelCount, props.locale)}</dd></div><div><dt className="text-xs text-muted-foreground">{t('Success')}</dt><dd className="mt-1 text-sm text-muted-foreground">{t('Unavailable')}</dd></div><div><dt className="text-xs text-muted-foreground">{t('Median')}</dt><dd className="mt-1 text-sm text-muted-foreground">{t('Unavailable')}</dd></div></dl></section><section aria-labelledby="analytics-routes" className="overflow-hidden rounded-md border"><header className="border-b p-4"><h2 id="analytics-routes" className="text-sm font-semibold">{t('Request routes')}</h2><p className="mt-1 text-sm text-muted-foreground">{props.requestCount == null ? t('Request count is available; endpoint dimensions are not.') : t('{{count}} requests; endpoint dimensions are not exposed.', { count: formatInteger(props.requestCount, props.locale) })}</p></header><div className="flex min-h-20 items-center px-4 text-sm text-muted-foreground"><AlertTriangle className="me-2 size-4 shrink-0" />{t('Contract unavailable')}</div></section></div>
}

function downloadFile(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function exportAnalytics(points: TrendPoint[], format: 'csv' | 'json', t: TFunction) {
  if (format === 'json') {
    downloadFile('partokens-analytics.json', 'application/json', JSON.stringify(points, null, 2))
    return
  }
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const rows = points.map((point) => [point.label, point.requests, point.tokens, point.quota, point.previous.requests, point.previous.tokens, point.previous.quota].map(escape).join(','))
  downloadFile('partokens-analytics.csv', 'text/csv;charset=utf-8', [[t('Period'), t('Requests'), t('Tokens'), t('Quota units'), t('Previous requests'), t('Previous tokens'), t('Previous quota units')].map(escape).join(','), ...rows].join('\n'))
}

export function ConsoleAnalyticsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const locale = usePageLocale()
  const [range, setRange] = useState<AnalyticsRange>('7')
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('day')
  const [appliedRange, setAppliedRange] = useState<AnalyticsRange>('7')
  const [appliedGranularity, setAppliedGranularity] = useState<AnalyticsGranularity>('day')
  const [measure, setMeasure] = useState<AnalyticsMeasure>('requests')
  const [view, setView] = useState<AnalyticsView>('trend')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailTriggerRef = useRef<HTMLButtonElement>(null)

  const usage = useQuery({ queryKey: consoleQueryKeys.analytics.usage(appliedRange, appliedGranularity), queryFn: ({ signal }) => loadUsage(appliedRange, appliedGranularity, signal), retry: false })
  const flow = useQuery({ queryKey: consoleQueryKeys.analytics.flow(appliedRange, appliedGranularity), queryFn: ({ signal }) => safeRequest(() => getFlowQuotaData({ ...requestBounds(appliedRange), default_time: requestGranularity(appliedGranularity) }, signal), projectFlow), retry: false })

  const currentRows = usage.data?.current.rows ?? []
  const previousRows = usage.data?.previous.rows ?? []
  const flowRows = flow.data?.rows ?? []
  const currentTotals = useMemo(() => sumRows(currentRows), [currentRows])
  const previousTotals = useMemo(() => sumRows(previousRows), [previousRows])
  const trend = useMemo(() => buildTrend(currentRows, previousRows, appliedGranularity, locale), [appliedGranularity, currentRows, locale, previousRows])
  const ranking = useMemo(() => buildRanking(currentRows), [currentRows])
  const flows = useMemo(() => buildFlows(flowRows, t), [flowRows, t])
  const pendingFilters = range !== appliedRange || granularity !== appliedGranularity
  const refreshing = usage.isFetching || flow.isFetching
  const initialLoading = usage.isPending || flow.isPending
  const lastUpdated = Math.max(usage.dataUpdatedAt, flow.dataUpdatedAt)
  const usagePartial = Boolean(usage.data?.current.partial || usage.data?.previous.partial)
  const flowPartial = Boolean(flow.data?.partial)
  const periodLabel = t('{{range}} - {{granularity}} aggregates', { range: t(rangeLabels[appliedRange]), granularity: t(granularityLabels[appliedGranularity]) })

  const changeRange = (value: string) => {
    const next = value as AnalyticsRange
    setRange(next)
    if (next === '1') setGranularity('hour')
    else if (next === '90') setGranularity('week')
    else if (granularity === 'hour' || granularity === 'week') setGranularity('day')
  }
  const applyFilters = () => { setAppliedRange(range); setAppliedGranularity(granularity) }
  const refresh = () => void refreshConsoleQueries(queryClient, consoleQueryKeys.analytics.all).catch(() => {
    toast.error(t('Analytics data is unavailable'), { description: t('Available account data remains visible.') })
  })
  const openDetails = (event: MouseEvent<HTMLButtonElement>) => { detailTriggerRef.current = event.currentTarget; setDetailsOpen(true) }
  const viewTitles: Record<AnalyticsView, [string, string]> = {
    trend: [t('Usage trend'), t('Compare the selected measure with the immediately preceding period.')],
    ranking: [t('Models by usage'), t('Compare model share, cost, success rate, and median latency.')],
    flow: [t('Key and model flow'), t('Trace aggregate requests from API keys to model routes.')],
  }
  const currentMeasureReady = metricComplete(currentRows, measure)
  const flowMeasureReady = metricComplete(flowRows, measure)

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h1 id="console-title" className="text-2xl font-bold tracking-tight">{t('Analytics')}</h1><p className="text-muted-foreground">{t('Inspect usage trends, model share, cost, and request routes.')}</p></div><div className="flex flex-wrap items-center gap-2"><Button variant="outline" disabled={refreshing} onClick={refresh}>{refreshing ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}{refreshing ? t('Refreshing...') : t('Refresh')}</Button><DropdownMenu><DropdownMenuTrigger asChild><Button disabled={refreshing || !trend.length || usagePartial}><Download />{t('Export')}<ChevronDown className="ms-1" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuLabel>{t('Aggregated usage')}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => exportAnalytics(trend, 'csv', t)}><Download />{t('Export CSV')}</DropdownMenuItem><DropdownMenuItem onSelect={() => exportAnalytics(trend, 'json', t)}><Download />{t('Export JSON')}</DropdownMenuItem></DropdownMenuContent></DropdownMenu><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={t('Analytics status')}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>{t('Contract status')}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem disabled>{t('Usage')}: {usage.isError ? t('unavailable') : usagePartial ? t('partial') : t('validated')}</DropdownMenuItem><DropdownMenuItem disabled>{t('Flow')}: {flow.isError ? t('unavailable') : flowPartial ? t('partial') : t('validated')}</DropdownMenuItem><DropdownMenuItem disabled>{t('Success and latency: unavailable')}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>

      <section aria-label={t('Analytics filters')} className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap"><Select value={range} onValueChange={changeRange} disabled={refreshing}><SelectTrigger className="w-full sm:w-44" aria-label={t('Time range')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">{t('Last 24 hours')}</SelectItem><SelectItem value="7">{t('Last 7 days')}</SelectItem><SelectItem value="30">{t('Last 30 days')}</SelectItem><SelectItem value="90">{t('Last 90 days')}</SelectItem></SelectContent></Select><Select value={granularity} onValueChange={(value) => setGranularity(value as AnalyticsGranularity)} disabled={refreshing}><SelectTrigger className="w-full sm:w-36" aria-label={t('Granularity')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hour" disabled={range !== '1'}>{t('Hourly')}</SelectItem><SelectItem value="day" disabled={range === '1' || range === '90'}>{t('Daily')}</SelectItem><SelectItem value="week" disabled={range === '1' || range === '7'}>{t('Weekly')}</SelectItem></SelectContent></Select></div><Tabs value={measure} onValueChange={(value) => setMeasure(value as AnalyticsMeasure)} className="min-w-0 sm:w-auto"><TabsList aria-label={t('Measure')} className="grid w-full grid-cols-3 sm:w-auto"><TabsTrigger value="requests">{t('Requests')}</TabsTrigger><TabsTrigger value="tokens">{t('Tokens')}</TabsTrigger><TabsTrigger value="quota">{t('Cost')}</TabsTrigger></TabsList></Tabs><Button variant="outline" disabled={!pendingFilters || refreshing} onClick={applyFilters}>{t('Apply filters')}</Button><span className="text-xs text-muted-foreground lg:ms-auto">{lastUpdated ? t('Updated at {{time}}', { time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(lastUpdated) }) : t('Waiting for analytics data')}</span></section>

      {initialLoading || refreshing ? <AnalyticsLoading /> : usage.isError ? <div className="space-y-3"><StatePanel kind="error" message={errorMessage(usage.error, t)} onRetry={() => void usage.refetch()} />{flow.isError ? <SecondaryError message={errorMessage(flow.error, t)} /> : null}</div> : usagePartial && currentRows.length === 0 ? <StatePanel kind="contract" message={t('Returned rows do not expose any complete usage metrics.')} /> : currentRows.length === 0 ? <StatePanel kind="empty" message={t('Requests will appear here after an API key or workspace starts using a model.')} /> : (
        <><MetricSummary current={currentTotals} previous={previousTotals} locale={locale} currentRows={currentRows} previousRows={previousRows} />{usagePartial || flowPartial || flow.isError ? <div role="status" className="flex items-start gap-2 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>{flow.isError ? t('Request flow is unavailable. Usage views remain usable.') : t('Some aggregate rows are incomplete. Only validated dimensions are shown.')}</p></div> : null}<Tabs value={view} onValueChange={(value) => setView(value as AnalyticsView)}><section aria-labelledby="analytics-workspace-title" className="overflow-hidden rounded-md border"><header className="flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><h2 id="analytics-workspace-title" className="text-sm font-semibold">{viewTitles[view][0]}</h2><p className="mt-1 text-sm text-muted-foreground">{viewTitles[view][1]}</p></div><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><TabsList className="grid w-full grid-cols-3 sm:w-auto"><TabsTrigger value="trend">{t('Trend')}</TabsTrigger><TabsTrigger value="ranking">{t('Models')}</TabsTrigger><TabsTrigger value="flow">{t('Routes')}</TabsTrigger></TabsList><Button ref={detailTriggerRef} variant="outline" size="sm" disabled={!trend.length || usagePartial} onClick={openDetails}>{t('View data')}</Button></div></header><TabsContent value="trend" className="mt-0">{!currentMeasureReady ? <StatePanel kind="contract" message={t('Returned rows do not consistently expose {{measure}} as a numeric field.', { measure: measureLabel(measure, t) })} /> : !trend.length ? <StatePanel kind="contract" message={t('Returned rows do not expose valid aggregate timestamps.')} /> : <TrendChart points={trend} measure={measure} locale={locale} />}</TabsContent><TabsContent value="ranking" className="mt-0">{!currentMeasureReady ? <StatePanel kind="contract" message={t('Returned rows do not consistently expose {{measure}} as a numeric field.', { measure: measureLabel(measure, t) })} /> : !ranking.length ? <StatePanel kind="contract" message={t('Returned rows do not expose validated model names.')} /> : <ModelRanking models={ranking} measure={measure} locale={locale} requestsReady={metricComplete(currentRows, 'requests')} quotaReady={metricComplete(currentRows, 'quota')} />}</TabsContent><TabsContent value="flow" className="mt-0">{flow.isError ? <StatePanel kind="error" message={errorMessage(flow.error, t)} onRetry={() => void flow.refetch()} /> : flowPartial && !flowRows.length ? <StatePanel kind="contract" message={t('Returned flow rows do not expose complete key, model, and usage dimensions.')} /> : !flowRows.length ? <StatePanel kind="empty" message={t('Key and model flow will appear after usage is recorded.')} /> : !flowMeasureReady ? <StatePanel kind="contract" message={t('Returned flow rows do not consistently expose {{measure}} as a numeric field.', { measure: measureLabel(measure, t) })} /> : <RequestFlow flows={flows} measure={measure} locale={locale} />}</TabsContent><footer className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-sm text-muted-foreground"><span>{periodLabel}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled>{t('Previous')}</Button><Button variant="outline" size="sm" disabled>{t('Next')}</Button></div></footer></section></Tabs><SupportingSummary modelCount={ranking.length} requestCount={metricComplete(currentRows, 'requests') ? currentTotals.requests : undefined} locale={locale} /></>
      )}
      {detailsOpen ? <AnalyticsDataDetails points={trend} period={periodLabel} locale={locale} onClose={() => setDetailsOpen(false)} onClosedAutoFocus={() => detailTriggerRef.current?.focus()} /> : null}
    </div>
  )
}
