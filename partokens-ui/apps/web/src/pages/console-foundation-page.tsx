import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  CircleUserRound,
  Eye,
  KeyRound,
  LoaderCircle,
  MoreHorizontal,
  Play,
  ReceiptText,
  RefreshCw,
  Route,
  Server,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
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
  getPricing,
  getStatus,
  getTokens,
} from '@partokens/api-client'
import { isAppLocale, type AppLocale } from '@partokens/i18n'

import { formatDate, formatInteger, formatQuota } from '@/lib/format'
import {
  parseLogPage,
  type SafeLogRecord,
} from '@/pages/console-foundation-logs-page'
import { useSessionStore } from '@/stores/session'

const overviewQueryRoot = ['console-foundation', 'overview'] as const

type SafeStatus = { version?: string }
type SafeToken = { id: number; name: string; status: number; accessedAt?: number }
type SafeTokenPage = { records: SafeToken[]; partial: boolean }
type SafeStats = { quota?: number; partial: boolean }

class ContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContractError'
  }
}

class SafeRequestError extends Error {
  status?: number

  constructor(status?: number) {
    super('The requested account data is unavailable.')
    this.name = 'SafeRequestError'
    this.status = status
  }
}

function usePageLocale(): AppLocale {
  const params = useParams({ strict: false }) as { locale?: string }
  return isAppLocale(params.locale) ? params.locale : 'zh-CN'
}

function lastThirtyDays() {
  const end = Math.floor(Date.now() / 1000)
  return { start_timestamp: end - 30 * 86400, end_timestamp: end }
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function safeLabel(value: unknown, limit: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > limit || /https?:\/\/|\bBearer\b|(?:api[-_ ]?key|token)\s*[:=]/i.test(trimmed)) return undefined
  return trimmed
}

function safeStatus(input: unknown): SafeStatus {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ContractError('Service status contract is incomplete.')
  const version = safeLabel((input as Record<string, unknown>).version, 64)
  return { version }
}

function safeTokens(input: unknown): SafeTokenPage {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ContractError('API key contract is incomplete.')
  const items = (input as Record<string, unknown>).items
  if (!Array.isArray(items)) throw new ContractError('API key contract is incomplete.')

  const records: SafeToken[] = []
  let invalid = 0
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      invalid += 1
      continue
    }
    const source = item as Record<string, unknown>
    const id = finiteNumber(source.id)
    const name = safeLabel(source.name, 120)
    const status = finiteNumber(source.status)
    if (!id || !Number.isInteger(id) || !name || status == null || !Number.isInteger(status)) {
      invalid += 1
      continue
    }
    records.push({ id, name, status, accessedAt: finiteNumber(source.accessed_time) })
  }

  if (items.length > 0 && records.length === 0) throw new ContractError('API key contract is incomplete.')
  return { records, partial: invalid > 0 }
}

function safePricingCount(input: unknown): number {
  if (Array.isArray(input)) return input.length
  if (!input || typeof input !== 'object') throw new ContractError('Pricing contract is incomplete.')
  const source = input as Record<string, unknown>
  if (Array.isArray(source.items)) return source.items.length
  if (Array.isArray(source.data)) return source.data.length
  throw new ContractError('Pricing contract is incomplete.')
}

function safeStats(input: unknown): SafeStats {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ContractError('Usage statistics contract is incomplete.')
  const source = input as Record<string, unknown>
  const quota = finiteNumber(source.quota)
  if (source.quota != null && quota == null) throw new ContractError('Usage statistics contract is incomplete.')
  return { quota, partial: quota == null }
}

async function safeQuery<T>(
  request: () => Promise<{ success: boolean; data: unknown }>,
  project: (input: unknown) => T,
): Promise<T> {
  try {
    const response = await request()
    if (!response.success) throw new SafeRequestError()
    return project(response.data)
  } catch (error) {
    if (error instanceof ContractError || error instanceof SafeRequestError) throw error
    const status = (error as { response?: { status?: number } } | null)?.response?.status
    throw new SafeRequestError(status)
  }
}

function safeErrorMessage(error: unknown, area: string): string {
  if (error instanceof ContractError) return `${area} contract is incomplete.`
  const status = error instanceof SafeRequestError ? error.status : undefined
  if (status === 401) return `Your session expired. Sign in again to load ${area.toLowerCase()}.`
  if (status === 403) return `Your account cannot access ${area.toLowerCase()}.`
  return `${area} is unavailable.`
}

function OverviewLoading() {
  return (
    <div role="status" aria-label="Loading overview" className="space-y-6">
      <section className="grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : 'lg:border-e-0'}`}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-6 w-28" />
          </div>
        ))}
      </section>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
      </div>
      <Skeleton className="h-56 rounded-md" />
      <Skeleton className="h-72 rounded-md" />
      <span className="sr-only">Refreshing account and usage data...</span>
    </div>
  )
}

function MetricSummary(props: {
  locale: AppLocale
  balance?: number
  recent?: number
  total?: number
  requests?: number
}) {
  const metrics = [
    { label: 'Account balance', value: formatQuota(props.balance, props.locale), note: 'USD' },
    { label: 'Recent usage', value: formatQuota(props.recent, props.locale), note: 'Last 30 days' },
    { label: 'Total usage', value: formatQuota(props.total, props.locale), note: 'All time' },
    { label: 'Requests', value: formatInteger(props.requests, props.locale), note: 'All time' },
  ]

  return (
    <section aria-label="Account usage summary" className="grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`min-w-0 p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : 'lg:border-e-0'}`}
        >
          <p className="text-xs text-muted-foreground">{metric.label}</p>
          <div className="mt-1 flex min-w-0 items-baseline gap-2">
            <p className="min-w-0 truncate font-mono text-xl font-semibold tabular-nums">{metric.value}</p>
            <span className="truncate text-xs text-muted-foreground">{metric.note}</span>
          </div>
        </div>
      ))}
    </section>
  )
}

function QueryState(props: { message: string; onRetry: () => void; compact?: boolean }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center px-6 text-center ${props.compact ? 'min-h-40 py-8' : 'min-h-64 py-12'}`}>
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10">
        <AlertTriangle className="size-5 text-destructive" />
      </div>
      <h3 className="text-sm font-semibold">{props.message}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">The available account sections remain usable.</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={props.onRetry}><RefreshCw />Retry</Button>
    </div>
  )
}

function RequestReadiness(props: {
  userName: string
  requestCount: number
  query: ReturnType<typeof useQuery<SafeTokenPage>>
  locale: AppLocale
  playgroundAvailable: boolean
}) {
  const available = (props.query.data?.records ?? []).filter((token) => token.status === 1)
  const preferred = [...available].sort((a, b) => (b.accessedAt ?? 0) - (a.accessedAt ?? 0))[0]
  const steps = [
    { label: 'Account ready', done: Boolean(props.userName), icon: CircleUserRound },
    { label: 'API key ready', done: Boolean(preferred), icon: KeyRound },
    { label: 'First request', done: props.requestCount > 0, icon: CheckCircle2 },
  ]

  return (
    <section aria-labelledby="request-readiness-title" className="overflow-hidden rounded-md border">
      <header className="flex items-start justify-between gap-4 border-b p-4">
        <div className="min-w-0">
          <h2 id="request-readiness-title" className="text-sm font-semibold">Request readiness</h2>
          <p className="mt-1 text-sm text-muted-foreground">Everything required to send an authenticated request.</p>
        </div>
        <Badge variant="outline" className="shrink-0 gap-1.5"><Check className="size-3.5" />{steps.filter((step) => step.done).length} / 3</Badge>
      </header>
      {props.query.isError ? (
        <QueryState compact message={safeErrorMessage(props.query.error, 'API key readiness')} onRetry={() => void props.query.refetch()} />
      ) : (
        <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex min-w-0 items-center gap-3 p-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted"><Icon className="size-4" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                  <p className="break-words text-sm font-medium">{step.label}</p>
                </div>
                {step.done ? <Check className="ms-auto size-4 shrink-0 text-emerald-500" /> : null}
              </div>
            )
          })}
        </div>
      )}
      <footer className="flex flex-col gap-3 border-t bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Available endpoint</p>
          <code className="mt-1 block break-all font-mono text-xs font-medium">/v1/chat/completions</code>
        </div>
        {props.playgroundAvailable ? (
          <Button asChild size="sm"><Link to="/$locale/console/playground" params={{ locale: props.locale }}><Play />Open Playground</Link></Button>
        ) : (
          <Button size="sm" disabled><Play />Open Playground</Button>
        )}
      </footer>
    </section>
  )
}

function ServiceReadiness(props: { query: ReturnType<typeof useQuery<SafeStatus>>; locale: AppLocale }) {
  const checking = props.query.isLoading || props.query.isFetching
  return (
    <section aria-labelledby="service-readiness-title" className="flex min-h-full flex-col overflow-hidden rounded-md border">
      <header className="flex items-start justify-between gap-4 border-b p-4">
        <div className="min-w-0">
          <h2 id="service-readiness-title" className="text-sm font-semibold">API service</h2>
          <p className="mt-1 text-sm text-muted-foreground">Current availability and deployed version.</p>
        </div>
        {checking ? (
          <Badge variant="secondary" className="shrink-0 gap-1.5"><LoaderCircle className="size-3.5 animate-spin" />Checking</Badge>
        ) : props.query.isError ? (
          <Badge variant="destructive" className="shrink-0">Unavailable</Badge>
        ) : (
          <Badge variant="outline" className="shrink-0 gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" />Available</Badge>
        )}
      </header>
      {props.query.isError ? (
        <QueryState compact message={safeErrorMessage(props.query.error, 'API service')} onRetry={() => void props.query.refetch()} />
      ) : (
        <dl className="divide-y px-4">
          <div className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">Service</dt><dd className="font-medium">Partokens API</dd></div>
          <div className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">Version</dt><dd><code className="font-mono text-xs">{props.query.data?.version ?? '—'}</code></dd></div>
          <div className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">Compatibility</dt><dd className="font-medium">OpenAI API</dd></div>
        </dl>
      )}
      <footer className="mt-auto border-t p-3">
        <Button asChild variant="ghost" size="sm" className="w-full justify-between"><Link to="/$locale/docs" params={{ locale: props.locale }}>Notices<ArrowRight /></Link></Button>
      </footer>
    </section>
  )
}

function RequestTrace(props: { locale: AppLocale }) {
  const stages = [
    { label: 'Client', value: 'OpenAI SDK', icon: Server },
    { label: 'Available endpoint', value: 'POST /v1/chat/completions', icon: Route },
    { label: 'Provider route', value: 'Not exposed', icon: Bot },
    { label: 'Response', value: 'Not observed', icon: CheckCircle2 },
  ]

  return (
    <section aria-labelledby="request-trace-title" className="overflow-hidden rounded-md border">
      <header className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="request-trace-title" className="text-sm font-semibold">Request route</h2>
          <p className="mt-1 text-sm text-muted-foreground">The active path from compatible client to provider response.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="self-start sm:self-auto"><Link to="/$locale/console-foundation/logs" params={{ locale: props.locale }}>Inspect logs<ArrowRight /></Link></Button>
      </header>
      <ol className="grid divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {stages.map((stage, index) => {
          const Icon = stage.icon
          return (
            <li key={stage.label} className="flex min-w-0 items-center gap-3 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/30"><Icon className="size-4" /></div>
              <div className="min-w-0"><p className="text-xs text-muted-foreground">{index + 1}. {stage.label}</p><p className="mt-1 break-words text-sm font-medium">{stage.value}</p></div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function logTime(log: SafeLogRecord, locale: AppLocale) {
  return formatDate(log.createdAt, locale)
}

function logTokens(log: SafeLogRecord) {
  if (log.promptTokens == null || log.completionTokens == null) return undefined
  return log.promptTokens + log.completionTokens
}

function UsageStatus(props: { record: SafeLogRecord }) {
  if (props.record.type === 5) return <Badge variant="destructive">Error</Badge>
  return <Badge variant="outline" className="gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" />Recorded</Badge>
}

function UsageDetails(props: { record: SafeLogRecord; locale: AppLocale }) {
  const fields = [
    ['Request ID', props.record.requestId ?? '—'],
    ['Time', logTime(props.record, props.locale)],
    ['Model', props.record.modelName ?? '—'],
    ['API key', props.record.tokenName ?? '—'],
    ['Endpoint', 'Not exposed'],
    ['Tokens', formatInteger(logTokens(props.record), props.locale)],
    ['Cost', formatQuota(props.record.quota, props.locale)],
    ['Latency', props.record.useTime == null ? '—' : `${props.record.useTime.toFixed(2)} s`],
    ['Status', props.record.type === 5 ? 'Error' : 'Recorded'],
  ]

  return (
    <dl className="divide-y rounded-md border">
      {fields.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-4 px-3 py-2.5 text-sm">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words text-end font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function UsageDetailOverlay(props: {
  record: SafeLogRecord
  locale: AppLocale
  onClose: () => void
  onClosedAutoFocus: () => void
}) {
  const { isMobile } = useSidebar()
  const closeAutoFocus = (event: Event) => {
    event.preventDefault()
    props.onClosedAutoFocus()
  }

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && props.onClose()}>
        <SheetContent className="w-full sm:max-w-md" onCloseAutoFocus={closeAutoFocus}>
          <SheetHeader><SheetTitle>Request details</SheetTitle><SheetDescription>{props.record.requestId ?? 'Request'} at {logTime(props.record, props.locale)}</SheetDescription></SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"><UsageDetails record={props.record} locale={props.locale} /></div>
          <SheetFooter className="border-t"><Button variant="outline" onClick={props.onClose}>Close</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="sm:max-w-xl" onCloseAutoFocus={closeAutoFocus}>
        <DialogHeader><DialogTitle>Request details</DialogTitle><DialogDescription>{props.record.requestId ?? 'Request'} at {logTime(props.record, props.locale)}</DialogDescription></DialogHeader>
        <UsageDetails record={props.record} locale={props.locale} />
        <DialogFooter><Button variant="outline" onClick={props.onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RecentUsage(props: {
  query: ReturnType<typeof useQuery<ReturnType<typeof parseLogPage>>>
  locale: AppLocale
}) {
  const [detail, setDetail] = useState<SafeLogRecord | null>(null)
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null)
  const records = props.query.data?.records ?? []
  const openDetails = (record: SafeLogRecord, event: MouseEvent<HTMLButtonElement>) => {
    detailTriggerRef.current = event.currentTarget
    setDetail(record)
  }

  return (
    <section aria-labelledby="recent-usage-title" className="overflow-hidden rounded-md border">
      <header className="flex items-center justify-between gap-4 border-b p-4">
        <div className="min-w-0"><h2 id="recent-usage-title" className="text-sm font-semibold">Recent usage</h2><p className="mt-1 text-sm text-muted-foreground">Latest model requests across active API keys.</p></div>
        <Button asChild variant="ghost" size="sm" className="shrink-0"><Link to="/$locale/console-foundation/logs" params={{ locale: props.locale }}>View all<ArrowRight /></Link></Button>
      </header>
      {props.query.isError ? (
        <QueryState message={safeErrorMessage(props.query.error, 'Recent usage')} onRetry={() => void props.query.refetch()} />
      ) : records.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/40"><ReceiptText className="size-5 text-muted-foreground" /></div>
          <h3 className="text-sm font-semibold">No recent usage</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Requests will appear here after an API key sends its first model call.</p>
          <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/$locale/console/playground" params={{ locale: props.locale }}>Open Playground</Link></Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="ps-4">Time</TableHead><TableHead>Model</TableHead><TableHead>API key</TableHead><TableHead>Status</TableHead><TableHead>Tokens</TableHead><TableHead>Cost</TableHead><TableHead>Latency</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.rowId}>
                    <TableCell className="whitespace-nowrap ps-4 text-muted-foreground">{logTime(record, props.locale)}</TableCell>
                    <TableCell className="font-medium">{record.modelName ?? '—'}</TableCell>
                    <TableCell>{record.tokenName ?? '—'}</TableCell>
                    <TableCell><UsageStatus record={record} /></TableCell>
                    <TableCell className="font-mono text-xs">{formatInteger(logTokens(record), props.locale)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatQuota(record.quota, props.locale)}</TableCell>
                    <TableCell className="font-mono text-xs">{record.useTime == null ? '—' : `${record.useTime.toFixed(2)} s`}</TableCell>
                    <TableCell className="text-end"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={`View ${record.requestId ?? record.rowId} details`} onClick={(event) => openDetails(record, event)}><Eye /></Button></TooltipTrigger><TooltipContent>View details</TooltipContent></Tooltip></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="divide-y md:hidden">
            {records.map((record) => (
              <article key={record.rowId} className="p-4">
                <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{record.modelName ?? '—'}</p><code className="mt-1 block truncate font-mono text-xs text-muted-foreground">{record.requestId ?? `log-${record.rowId}`}</code></div><UsageStatus record={record} /></div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div className="min-w-0"><dt className="text-xs text-muted-foreground">Time</dt><dd className="mt-1 break-words">{logTime(record, props.locale)}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">API key</dt><dd className="mt-1 break-words">{record.tokenName ?? '—'}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">Tokens</dt><dd className="mt-1 font-mono text-xs">{formatInteger(logTokens(record), props.locale)}</dd></div><div className="min-w-0"><dt className="text-xs text-muted-foreground">Cost / latency</dt><dd className="mt-1 font-mono text-xs">{formatQuota(record.quota, props.locale)} / {record.useTime == null ? '—' : `${record.useTime.toFixed(2)} s`}</dd></div></dl>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={(event) => openDetails(record, event)}><Eye />View details</Button>
              </article>
            ))}
          </div>
        </>
      )}
      {detail ? <UsageDetailOverlay record={detail} locale={props.locale} onClose={() => setDetail(null)} onClosedAutoFocus={() => detailTriggerRef.current?.focus()} /> : null}
    </section>
  )
}

export function ConsoleFoundationOverviewPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const locale = usePageLocale()
  const user = useSessionStore((state) => state.user)
  const range = useMemo(lastThirtyDays, [])
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const status = useQuery({
    queryKey: [...overviewQueryRoot, 'status'],
    queryFn: () => safeQuery(getStatus, safeStatus),
    retry: false,
  })
  const tokens = useQuery({
    queryKey: [...overviewQueryRoot, 'tokens'],
    queryFn: () => safeQuery(() => getTokens({ p: 1, size: 100 }), safeTokens),
    retry: false,
  })
  const pricing = useQuery({
    queryKey: [...overviewQueryRoot, 'pricing-count'],
    queryFn: () => safeQuery(getPricing, safePricingCount),
    retry: false,
  })
  const stats = useQuery({
    queryKey: [...overviewQueryRoot, 'stats', range],
    queryFn: () => safeQuery(() => getLogStats(range), safeStats),
    retry: false,
  })
  const logs = useQuery({
    queryKey: [...overviewQueryRoot, 'recent-logs', range],
    queryFn: () => safeQuery(() => getLogs({ p: 1, page_size: 5, ...range }), (input) => parseLogPage(input, 1)),
    retry: false,
  })

  const initialLoading = status.isLoading || tokens.isLoading || pricing.isLoading || stats.isLoading || logs.isLoading
  const partial = tokens.data?.partial || stats.data?.partial || Boolean(logs.data && (logs.data.partialCount || logs.data.invalidCount || logs.data.redactedCount))
  const playgroundAvailable = Boolean(pricing.data && pricing.data > 0)

  useEffect(() => {
    if (!initialLoading && !updatedAt) setUpdatedAt(new Date())
  }, [initialLoading, updatedAt])

  const refresh = async () => {
    const toastId = toast.loading('Refreshing overview...', { duration: Infinity })
    setRefreshing(true)
    try {
      await queryClient.refetchQueries({ queryKey: overviewQueryRoot })
      setUpdatedAt(new Date())
      toast.success('Overview refreshed', { id: toastId, description: 'Account usage and service data are up to date.', duration: 6000 })
    } catch {
      toast.error('Overview refresh failed', { id: toastId, description: 'Available account data remains visible.', duration: 6000 })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 id="console-foundation-title" className="text-2xl font-bold tracking-tight">{t('Overview')}</h1>
          <p className="text-muted-foreground">{t('Account readiness, usage, and the next useful action in one view.')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" disabled={refreshing}><Link to="/$locale/console-foundation/keys" params={{ locale }}><KeyRound />{t('Create a key')}</Link></Button>
          {playgroundAvailable ? (
            <Button asChild><Link to="/$locale/console/playground" params={{ locale }}><Play />{t('Open Playground')}</Link></Button>
          ) : (
            <Button disabled><Play />{t('Open Playground')}</Button>
          )}
          <Button variant="outline" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}{refreshing ? t('Refreshing...') : t('Refresh')}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={refreshing} aria-label={t('Overview actions')}><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('Overview actions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/$locale/console-foundation/analytics" params={{ locale }}><ArrowRight />{t('Analytics')}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/$locale/console-foundation/logs" params={{ locale }}><ReceiptText />{t('Usage logs')}</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {initialLoading || refreshing ? <OverviewLoading /> : (
        <>
          <MetricSummary locale={locale} balance={user?.quota} recent={stats.data?.quota} total={user?.used_quota} requests={user?.request_count} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
            <RequestReadiness userName={user?.email || user?.username || 'Account'} requestCount={Number(user?.request_count || 0)} query={tokens} locale={locale} playgroundAvailable={playgroundAvailable} />
            <ServiceReadiness query={status} locale={locale} />
          </div>
          <RequestTrace locale={locale} />
          <RecentUsage query={logs} locale={locale} />
          {pricing.isError ? <p role="alert" className="text-xs text-muted-foreground">{safeErrorMessage(pricing.error, 'Pricing data')}</p> : null}
          {partial ? <p role="status" className="text-xs text-muted-foreground">Some account records were incomplete or redacted. Only validated fields are shown.</p> : null}
          <p className="text-end text-xs text-muted-foreground">{updatedAt ? `Updated at ${updatedAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : 'Update unavailable'}</p>
        </>
      )}
    </div>
  )
}
