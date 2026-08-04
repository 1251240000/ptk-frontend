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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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

import { ConsoleShell, type ConsoleScreenProps } from './shadcn-console-shell'

type AnalyticsRange = '1' | '7' | '30' | '90'
type AnalyticsGranularity = 'hour' | 'day' | 'week'
type AnalyticsMeasure = 'requests' | 'tokens' | 'cost'
type AnalyticsView = 'trend' | 'ranking' | 'flow'
type DataState = 'ready' | 'empty' | 'error'

type AnalyticsPoint = {
  label: string
  shortLabel: string
  requests: number
  tokens: number
  cost: number
  previousRequests: number
  previousTokens: number
  previousCost: number
}

type AnalyticsTotals = {
  requests: number
  tokens: number
  cost: number
  previousRequests: number
  previousTokens: number
  previousCost: number
}

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

const sevenDayPoints: AnalyticsPoint[] = [
  { label: 'Jul 18', shortLabel: '18', requests: 42, tokens: 2400, cost: 1.14, previousRequests: 38, previousTokens: 2150, previousCost: 1.02 },
  { label: 'Jul 19', shortLabel: '19', requests: 68, tokens: 1900, cost: 1.52, previousRequests: 54, previousTokens: 1820, previousCost: 1.28 },
  { label: 'Jul 20', shortLabel: '20', requests: 54, tokens: 2100, cost: 1.27, previousRequests: 51, previousTokens: 1940, previousCost: 1.18 },
  { label: 'Jul 21', shortLabel: '21', requests: 82, tokens: 3600, cost: 2.08, previousRequests: 72, previousTokens: 3210, previousCost: 1.81 },
  { label: 'Jul 22', shortLabel: '22', requests: 61, tokens: 2500, cost: 1.43, previousRequests: 57, previousTokens: 2280, previousCost: 1.31 },
  { label: 'Jul 23', shortLabel: '23', requests: 88, tokens: 3800, cost: 2.91, previousRequests: 76, previousTokens: 3120, previousCost: 2.44 },
  { label: 'Jul 24', shortLabel: '24', requests: 73, tokens: 2300, cost: 2.07, previousRequests: 62, previousTokens: 1900, previousCost: 1.83 },
]

function makeDailyPoints(days: number) {
  const end = Date.UTC(2026, 6, 24)
  return Array.from({ length: days }, (_, index): AnalyticsPoint => {
    const date = new Date(end - (days - index - 1) * 86_400_000)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    const requests = 36 + ((index * 29 + days * 7) % 61)
    const tokens = requests * (31 + (index % 5) * 7)
    const cost = Number((tokens * 0.00055 + requests * 0.0045).toFixed(2))
    const previousFactor = 0.82 + (index % 4) * 0.035

    return {
      label,
      shortLabel: String(date.getUTCDate()),
      requests,
      tokens,
      cost,
      previousRequests: Math.round(requests * previousFactor),
      previousTokens: Math.round(tokens * previousFactor),
      previousCost: Number((cost * previousFactor).toFixed(2)),
    }
  })
}

function makeHourlyPoints() {
  return Array.from({ length: 24 }, (_, index): AnalyticsPoint => {
    const requests = 8 + ((index * 11 + 7) % 24)
    const tokens = requests * (28 + (index % 4) * 6)
    const cost = Number((tokens * 0.00058 + requests * 0.004).toFixed(2))
    const previousFactor = 0.79 + (index % 5) * 0.03
    const hour = `${String(index).padStart(2, '0')}:00`

    return {
      label: `Jul 24, ${hour}`,
      shortLabel: hour,
      requests,
      tokens,
      cost,
      previousRequests: Math.round(requests * previousFactor),
      previousTokens: Math.round(tokens * previousFactor),
      previousCost: Number((cost * previousFactor).toFixed(2)),
    }
  })
}

function aggregateWeeks(points: AnalyticsPoint[]) {
  const weeks: AnalyticsPoint[] = []
  for (let index = 0; index < points.length; index += 7) {
    const group = points.slice(index, index + 7)
    const first = group[0]
    const last = group[group.length - 1]
    if (!first || !last) continue
    weeks.push({
      label: `${first.label} - ${last.label}`,
      shortLabel: `W${weeks.length + 1}`,
      requests: group.reduce((sum, point) => sum + point.requests, 0),
      tokens: group.reduce((sum, point) => sum + point.tokens, 0),
      cost: group.reduce((sum, point) => sum + point.cost, 0),
      previousRequests: group.reduce((sum, point) => sum + point.previousRequests, 0),
      previousTokens: group.reduce((sum, point) => sum + point.previousTokens, 0),
      previousCost: group.reduce((sum, point) => sum + point.previousCost, 0),
    })
  }
  return weeks
}

function getAnalyticsPoints(range: AnalyticsRange, granularity: AnalyticsGranularity) {
  if (range === '1') return makeHourlyPoints()
  if (range === '7') return sevenDayPoints
  const daily = makeDailyPoints(Number(range))
  return granularity === 'week' ? aggregateWeeks(daily) : daily
}

function getTotals(points: AnalyticsPoint[]): AnalyticsTotals {
  return points.reduce((totals, point) => ({
    requests: totals.requests + point.requests,
    tokens: totals.tokens + point.tokens,
    cost: totals.cost + point.cost,
    previousRequests: totals.previousRequests + point.previousRequests,
    previousTokens: totals.previousTokens + point.previousTokens,
    previousCost: totals.previousCost + point.previousCost,
  }), {
    requests: 0,
    tokens: 0,
    cost: 0,
    previousRequests: 0,
    previousTokens: 0,
    previousCost: 0,
  })
}

function measureValue(point: AnalyticsPoint, measure: AnalyticsMeasure, previous = false) {
  if (measure === 'requests') return previous ? point.previousRequests : point.requests
  if (measure === 'tokens') return previous ? point.previousTokens : point.tokens
  return previous ? point.previousCost : point.cost
}

function totalValue(totals: AnalyticsTotals, measure: AnalyticsMeasure, previous = false) {
  if (measure === 'requests') return previous ? totals.previousRequests : totals.requests
  if (measure === 'tokens') return previous ? totals.previousTokens : totals.tokens
  return previous ? totals.previousCost : totals.cost
}

function formatMeasure(value: number, measure: AnalyticsMeasure, compact = false) {
  if (measure === 'cost') return `$${value.toFixed(2)}`
  if (compact) return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  return Math.round(value).toLocaleString('en-US')
}

function downloadFile(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function createAnalyticsCsv(points: AnalyticsPoint[]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`
  const rows = points.map((point) => [
    point.label,
    String(point.requests),
    String(point.tokens),
    point.cost.toFixed(2),
    String(point.previousRequests),
    String(point.previousTokens),
    point.previousCost.toFixed(2),
  ].map(escape).join(','))
  return [
    ['Period', 'Requests', 'Tokens', 'Cost', 'Previous requests', 'Previous tokens', 'Previous cost'].map(escape).join(','),
    ...rows,
  ].join('\n')
}

function AnalyticsLoading() {
  return (
    <div aria-label='Loading analytics' aria-busy='true' className='space-y-6'>
      <section className='grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className='border-e border-b p-4 last:border-e-0 lg:border-b-0'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='mt-3 h-7 w-20' />
          </div>
        ))}
      </section>
      <section className='overflow-hidden rounded-md border'>
        <div className='flex items-center justify-between border-b p-4'>
          <div className='space-y-2'><Skeleton className='h-4 w-28' /><Skeleton className='h-3 w-44' /></div>
          <Skeleton className='h-8 w-48' />
        </div>
        <div className='grid gap-6 p-4 lg:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)] sm:p-6'>
          <Skeleton className='h-72 w-full' />
          <Skeleton className='h-72 w-full' />
        </div>
      </section>
    </div>
  )
}

function AnalyticsError({ onRetry }: { onRetry: () => void }) {
  return (
    <section role='alert' className='flex min-h-96 flex-col items-center justify-center rounded-md border px-6 py-12 text-center'>
      <div className='mb-4 flex size-10 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10'>
        <AlertTriangle className='size-5 text-destructive' />
      </div>
      <h2 className='text-sm font-semibold'>Analytics data is unavailable</h2>
      <p className='mt-1 max-w-md text-sm text-muted-foreground'>The aggregate usage request failed. Try again to reload the current period.</p>
      <Button variant='outline' size='sm' className='mt-4' onClick={onRetry}><RefreshCw />Try again</Button>
    </section>
  )
}

function AnalyticsEmpty({ onRestore }: { onRestore: () => void }) {
  return (
    <section className='flex min-h-96 flex-col items-center justify-center rounded-md border px-6 py-12 text-center'>
      <div className='mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/40'>
        <BarChart3 className='size-5 text-muted-foreground' />
      </div>
      <h2 className='text-sm font-semibold'>No usage in this period</h2>
      <p className='mt-1 max-w-md text-sm text-muted-foreground'>Requests will appear here after an API key or workspace starts using a model.</p>
      <Button variant='outline' size='sm' className='mt-4' onClick={onRestore}>Restore sample data</Button>
    </section>
  )
}

function MetricSummary({ totals }: { totals: AnalyticsTotals }) {
  const items = [
    ['Requests', totals.requests.toLocaleString('en-US'), `${totals.previousRequests.toLocaleString('en-US')} previous`],
    ['Tokens', totals.tokens.toLocaleString('en-US'), `${totals.previousTokens.toLocaleString('en-US')} previous`],
    ['Cost', `$${totals.cost.toFixed(2)}`, `$${totals.previousCost.toFixed(2)} previous`],
    ['Success rate', '98.7%', '97.9% previous'],
  ]

  return (
    <section aria-label='Usage summary' className='grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4'>
      {items.map(([label, value, note], index) => (
        <div key={label} className={`p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 lg:border-e ${index === items.length - 1 ? 'lg:border-e-0' : ''}`}>
          <p className='text-xs text-muted-foreground'>{label}</p>
          <p className='mt-1 font-mono text-xl font-semibold'>{value}</p>
          <p className='mt-1 text-xs text-muted-foreground'>{note}</p>
        </div>
      ))}
    </section>
  )
}

function TrendChart({ points, totals, measure }: { points: AnalyticsPoint[]; totals: AnalyticsTotals; measure: AnalyticsMeasure }) {
  const maximum = Math.max(...points.flatMap((point) => [measureValue(point, measure), measureValue(point, measure, true)]), 1)
  const current = totalValue(totals, measure)
  const previous = totalValue(totals, measure, true)
  const change = previous ? ((current - previous) / previous) * 100 : 0
  const labelInterval = Math.max(1, Math.ceil(points.length / 7))

  return (
    <div className='grid lg:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]'>
      <figure className='min-w-0 p-4 sm:p-6'>
        <figcaption className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <p className='text-xs font-medium text-muted-foreground'>{measure === 'requests' ? 'Requests' : measure === 'tokens' ? 'Tokens' : 'Cost'}</p>
            <p className='mt-1 font-mono text-2xl font-semibold'>{formatMeasure(current, measure, true)}</p>
          </div>
          <Badge variant='secondary' className='font-mono'>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</Badge>
        </figcaption>

        <div className='relative mt-6 h-64'>
          <div aria-hidden='true' className='absolute inset-0 grid grid-rows-4'>
            {Array.from({ length: 4 }, (_, index) => <div key={index} className='border-t border-dashed' />)}
          </div>
          <div className='relative z-10 grid h-full gap-1 sm:gap-2' style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
            {points.map((point, index) => {
              const present = measureValue(point, measure)
              const past = measureValue(point, measure, true)
              const showLabel = points.length <= 14 || index % labelInterval === 0 || index === points.length - 1
              return (
                <div key={point.label} className='grid min-w-0 grid-rows-[minmax(0,1fr)_1.25rem] gap-2'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        role='img'
                        aria-label={`${point.label}: ${formatMeasure(present, measure)} current, ${formatMeasure(past, measure)} previous`}
                        className='flex h-full min-w-0 items-end justify-center gap-px rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:gap-1'
                      >
                        <span className='block w-[35%] rounded-t-sm bg-muted-foreground/25 transition-opacity hover:opacity-80' style={{ height: `${Math.max(3, (past / maximum) * 100)}%` }} />
                        <span className='block w-[35%] rounded-t-sm bg-chart-2 transition-opacity hover:opacity-80' style={{ height: `${Math.max(3, (present / maximum) * 100)}%` }} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side='top'>
                      <p className='font-medium'>{point.label}</p>
                      <p>Current: {formatMeasure(present, measure)}</p>
                      <p>Previous: {formatMeasure(past, measure)}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className='truncate text-center text-2xs text-muted-foreground'>{showLabel ? point.shortLabel : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      </figure>

      <aside className='border-t p-4 lg:border-t-0 lg:border-s sm:p-6'>
        <p className='text-sm font-medium'>Period comparison</p>
        <p className='mt-1 text-sm text-muted-foreground'>Usage aggregates for the selected measure and the immediately preceding period.</p>
        <dl className='mt-6 space-y-4 text-sm'>
          <div className='flex items-center justify-between gap-4'>
            <dt className='flex items-center gap-2 text-muted-foreground'><span className='size-2 rounded-sm bg-chart-2' />Current period</dt>
            <dd className='font-mono font-medium'>{formatMeasure(current, measure, true)}</dd>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <dt className='flex items-center gap-2 text-muted-foreground'><span className='size-2 rounded-sm bg-muted-foreground/25' />Previous period</dt>
            <dd className='font-mono font-medium'>{formatMeasure(previous, measure, true)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}

function ModelRanking({ totals }: { totals: AnalyticsTotals }) {
  const models = [
    { name: 'gpt-4.1-mini', share: 0.42, success: '99.2%', latency: '612 ms' },
    { name: 'claude-3.7-sonnet', share: 0.31, success: '98.8%', latency: '1.1 s' },
    { name: 'gemini-2.5-flash', share: 0.18, success: '98.1%', latency: '734 ms' },
    { name: 'imagen-3', share: 0.09, success: '96.9%', latency: '3.8 s' },
  ]

  return (
    <div>
      <div className='hidden md:block'>
        <Table>
          <TableHeader><TableRow className='hover:bg-transparent'><TableHead className='ps-4'>Model</TableHead><TableHead>Share</TableHead><TableHead>Requests</TableHead><TableHead>Cost</TableHead><TableHead>Success</TableHead><TableHead>Median latency</TableHead></TableRow></TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.name}>
                <TableCell className='ps-4 font-medium'>{model.name}</TableCell>
                <TableCell><div className='flex min-w-36 items-center gap-3'><span className='h-1.5 flex-1 overflow-hidden rounded-full bg-muted'><span className='block h-full bg-chart-2' style={{ width: `${model.share * 100}%` }} /></span><span className='w-10 text-end font-mono text-xs'>{Math.round(model.share * 100)}%</span></div></TableCell>
                <TableCell className='font-mono text-xs'>{Math.round(totals.requests * model.share).toLocaleString('en-US')}</TableCell>
                <TableCell className='font-mono text-xs'>${(totals.cost * model.share).toFixed(2)}</TableCell>
                <TableCell>{model.success}</TableCell>
                <TableCell>{model.latency}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='divide-y md:hidden'>
        {models.map((model, index) => (
          <article key={model.name} className='space-y-4 p-4'>
            <div className='flex min-w-0 items-center justify-between gap-3'><div className='min-w-0'><p className='text-xs text-muted-foreground'>#{index + 1}</p><h3 className='truncate text-sm font-medium'>{model.name}</h3></div><Badge variant='secondary'>{Math.round(model.share * 100)}%</Badge></div>
            <div className='h-1.5 overflow-hidden rounded-full bg-muted'><span className='block h-full bg-chart-2' style={{ width: `${model.share * 100}%` }} /></div>
            <dl className='grid grid-cols-2 gap-3 text-sm'><div><dt className='text-xs text-muted-foreground'>Requests</dt><dd className='mt-1 font-mono text-xs'>{Math.round(totals.requests * model.share).toLocaleString('en-US')}</dd></div><div><dt className='text-xs text-muted-foreground'>Cost</dt><dd className='mt-1 font-mono text-xs'>${(totals.cost * model.share).toFixed(2)}</dd></div><div><dt className='text-xs text-muted-foreground'>Success</dt><dd className='mt-1'>{model.success}</dd></div><div><dt className='text-xs text-muted-foreground'>Median latency</dt><dd className='mt-1'>{model.latency}</dd></div></dl>
          </article>
        ))}
      </div>
    </div>
  )
}

function RequestFlow({ totals }: { totals: AnalyticsTotals }) {
  const flows = [
    { keyName: 'Production', group: 'default', model: 'gpt-4.1-mini', share: 0.49 },
    { keyName: 'Production', group: 'default', model: 'claude-3.7-sonnet', share: 0.29 },
    { keyName: 'Image studio', group: 'default', model: 'imagen-3', share: 0.14 },
    { keyName: 'Staging services', group: 'trial', model: 'gemini-2.5-flash', share: 0.08 },
  ]

  return (
    <div>
      <div className='hidden md:block'>
        <Table>
          <TableHeader><TableRow className='hover:bg-transparent'><TableHead className='ps-4'>API key</TableHead><TableHead>Group</TableHead><TableHead>Model route</TableHead><TableHead>Requests</TableHead><TableHead>Share</TableHead></TableRow></TableHeader>
          <TableBody>
            {flows.map((flow) => (
              <TableRow key={`${flow.keyName}-${flow.model}`}>
                <TableCell className='ps-4 font-medium'><span className='flex items-center gap-2'><KeyRound className='size-4 text-muted-foreground' />{flow.keyName}</span></TableCell>
                <TableCell><Badge variant='outline'>{flow.group}</Badge></TableCell>
                <TableCell><span className='flex items-center gap-2'><Bot className='size-4 text-muted-foreground' />{flow.model}</span></TableCell>
                <TableCell className='font-mono text-xs'>{Math.round(totals.requests * flow.share).toLocaleString('en-US')}</TableCell>
                <TableCell className='font-mono text-xs'>{Math.round(flow.share * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='divide-y md:hidden'>
        {flows.map((flow) => (
          <article key={`${flow.keyName}-${flow.model}`} className='space-y-3 p-4'>
            <div className='flex min-w-0 items-center gap-2 text-sm font-medium'><KeyRound className='size-4 shrink-0 text-muted-foreground' /><span className='truncate'>{flow.keyName}</span><Badge variant='outline' className='ms-auto'>{flow.group}</Badge></div>
            <div className='flex min-w-0 items-center gap-2 text-sm'><Route className='size-4 shrink-0 text-muted-foreground' /><span className='truncate'>{flow.model}</span></div>
            <div className='flex items-center justify-between text-xs text-muted-foreground'><span>{Math.round(totals.requests * flow.share).toLocaleString('en-US')} requests</span><span className='font-mono'>{Math.round(flow.share * 100)}%</span></div>
          </article>
        ))}
      </div>
    </div>
  )
}

function DataRows({ points }: { points: AnalyticsPoint[] }) {
  return (
    <>
      <div className='hidden sm:block'>
        <div className='max-h-[55vh] overflow-auto rounded-md border'>
          <Table>
            <TableHeader className='sticky top-0 bg-background'><TableRow className='hover:bg-transparent'><TableHead>Period</TableHead><TableHead>Requests</TableHead><TableHead>Tokens</TableHead><TableHead>Cost</TableHead><TableHead>Previous requests</TableHead></TableRow></TableHeader>
            <TableBody>{points.map((point) => <TableRow key={point.label}><TableCell className='font-medium'>{point.label}</TableCell><TableCell className='font-mono text-xs'>{point.requests.toLocaleString('en-US')}</TableCell><TableCell className='font-mono text-xs'>{point.tokens.toLocaleString('en-US')}</TableCell><TableCell className='font-mono text-xs'>${point.cost.toFixed(2)}</TableCell><TableCell className='font-mono text-xs'>{point.previousRequests.toLocaleString('en-US')}</TableCell></TableRow>)}</TableBody>
          </Table>
        </div>
      </div>
      <div className='divide-y rounded-md border sm:hidden'>
        {points.map((point) => <article key={point.label} className='space-y-3 p-3'><h3 className='text-sm font-medium'>{point.label}</h3><dl className='grid grid-cols-2 gap-3 text-sm'><div><dt className='text-xs text-muted-foreground'>Requests</dt><dd className='mt-1 font-mono text-xs'>{point.requests.toLocaleString('en-US')}</dd></div><div><dt className='text-xs text-muted-foreground'>Tokens</dt><dd className='mt-1 font-mono text-xs'>{point.tokens.toLocaleString('en-US')}</dd></div><div><dt className='text-xs text-muted-foreground'>Cost</dt><dd className='mt-1 font-mono text-xs'>${point.cost.toFixed(2)}</dd></div><div><dt className='text-xs text-muted-foreground'>Previous requests</dt><dd className='mt-1 font-mono text-xs'>{point.previousRequests.toLocaleString('en-US')}</dd></div></dl></article>)}
      </div>
    </>
  )
}

function AnalyticsDataDetails({
  points,
  period,
  onClose,
  onClosedAutoFocus,
}: {
  points: AnalyticsPoint[]
  period: string
  onClose: () => void
  onClosedAutoFocus: () => void
}) {
  const { isMobile } = useSidebar()
  const closeAutoFocus = (event: Event) => {
    event.preventDefault()
    onClosedAutoFocus()
  }

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent className='w-full sm:max-w-md' onCloseAutoFocus={closeAutoFocus}>
          <SheetHeader><SheetTitle>Aggregated usage data</SheetTitle><SheetDescription>{period}</SheetDescription></SheetHeader>
          <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4'><DataRows points={points} /></div>
          <SheetFooter className='border-t'><Button variant='outline' onClick={onClose}>Close</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-3xl' onCloseAutoFocus={closeAutoFocus}>
        <DialogHeader><DialogTitle>Aggregated usage data</DialogTitle><DialogDescription>{period}</DialogDescription></DialogHeader>
        <DataRows points={points} />
        <DialogFooter><Button variant='outline' onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SupportingSummary({ totals }: { totals: AnalyticsTotals }) {
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <section aria-labelledby='analytics-model-health' className='overflow-hidden rounded-md border'>
        <header className='border-b p-4'><h2 id='analytics-model-health' className='text-sm font-semibold'>Model health</h2><p className='mt-1 text-sm text-muted-foreground'>Availability and latency across models with recorded usage.</p></header>
        <dl className='grid grid-cols-3 divide-x p-4 text-center'><div><dt className='text-xs text-muted-foreground'>Models</dt><dd className='mt-1 font-mono text-lg font-semibold'>4</dd></div><div><dt className='text-xs text-muted-foreground'>Success</dt><dd className='mt-1 font-mono text-lg font-semibold'>98.7%</dd></div><div><dt className='text-xs text-muted-foreground'>Median</dt><dd className='mt-1 font-mono text-lg font-semibold'>842 ms</dd></div></dl>
      </section>
      <section aria-labelledby='analytics-routes' className='overflow-hidden rounded-md border'>
        <header className='border-b p-4'><h2 id='analytics-routes' className='text-sm font-semibold'>Request routes</h2><p className='mt-1 text-sm text-muted-foreground'>{totals.requests.toLocaleString('en-US')} requests grouped by compatible endpoint.</p></header>
        <div className='space-y-4 p-4'><div className='flex h-2 overflow-hidden rounded-full bg-muted'><span className='bg-chart-2' style={{ width: '76%' }} /><span className='bg-chart-3' style={{ width: '24%' }} /></div><div className='grid grid-cols-2 gap-4 text-sm'><div><p className='text-xs text-muted-foreground'>/v1/chat</p><p className='mt-1 font-mono font-medium'>76%</p></div><div><p className='text-xs text-muted-foreground'>/v1/images</p><p className='mt-1 font-mono font-medium'>24%</p></div></div></div>
      </section>
    </div>
  )
}

export function ShadcnAnalyticsScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  const [range, setRange] = useState<AnalyticsRange>('7')
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('day')
  const [appliedRange, setAppliedRange] = useState<AnalyticsRange>('7')
  const [appliedGranularity, setAppliedGranularity] = useState<AnalyticsGranularity>('day')
  const [measure, setMeasure] = useState<AnalyticsMeasure>('requests')
  const [view, setView] = useState<AnalyticsView>('trend')
  const [dataState, setDataState] = useState<DataState>('ready')
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('Updated at 10:43')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null)

  const points = useMemo(() => getAnalyticsPoints(appliedRange, appliedGranularity), [appliedGranularity, appliedRange])
  const totals = useMemo(() => getTotals(points), [points])
  const hasPendingFilters = range !== appliedRange || granularity !== appliedGranularity
  const periodLabel = `${rangeLabels[appliedRange]} - ${granularityLabels[appliedGranularity]} aggregates`

  const changeRange = (value: string) => {
    const nextRange = value as AnalyticsRange
    setRange(nextRange)
    if (nextRange === '1') setGranularity('hour')
    else if (nextRange === '90') setGranularity('week')
    else if (granularity === 'hour' || (nextRange === '7' && granularity === 'week')) setGranularity('day')
  }

  const applyFilters = () => {
    setAppliedRange(range)
    setAppliedGranularity(granularity)
    setDataState('ready')
    toast.success('Analytics filters applied', { description: `${rangeLabels[range]} with ${granularityLabels[granularity].toLowerCase()} aggregates.`, duration: 6000 })
  }

  const refresh = async () => {
    const toastId = toast.loading('Refreshing analytics...', { duration: Infinity })
    setRefreshing(true)
    await new Promise((resolve) => window.setTimeout(resolve, 1200))
    setRefreshing(false)
    setDataState('ready')
    setLastUpdated('Updated just now')
    toast.success('Analytics refreshed', { id: toastId, description: 'The latest usage aggregates are now shown.', duration: 6000 })
  }

  const changeDataState = (value: string) => {
    const nextState = value as DataState
    setDataState(nextState)
    if (nextState === 'error') toast.error('Analytics request failed', { description: 'The unavailable state is now shown.', duration: 6000 })
    else if (nextState === 'empty') toast.info('No usage returned', { description: 'The empty state is now shown.', duration: 6000 })
    else toast.success('Sample data restored', { duration: 6000 })
  }

  const exportData = (format: 'csv' | 'json') => {
    try {
      const csv = format === 'csv'
      downloadFile(
        `partokens-analytics-${appliedRange}d.${format}`,
        csv ? 'text/csv;charset=utf-8' : 'application/json',
        csv ? createAnalyticsCsv(points) : JSON.stringify(points, null, 2),
      )
      toast.success('Export ready', { description: `${points.length} aggregate rows downloaded as ${format.toUpperCase()}.`, duration: 6000 })
    } catch {
      toast.error('Export failed', { description: 'The analytics file could not be prepared. Try again.', duration: 6000 })
    }
  }

  const openDetails = (event: MouseEvent<HTMLButtonElement>) => {
    detailTriggerRef.current = event.currentTarget
    setDetailsOpen(true)
  }

  const viewTitles: Record<AnalyticsView, [string, string]> = {
    trend: ['Usage trend', 'Compare the selected measure with the immediately preceding period.'],
    ranking: ['Models by usage', 'Compare model share, cost, success rate, and median latency.'],
    flow: ['Key and model flow', 'Trace aggregate requests from API keys to model routes.'],
  }

  return (
    <ConsoleShell activeRoute='console-analytics' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-bold tracking-tight'>Analytics</h1>
          <p className='text-muted-foreground'>Inspect usage trends, model share, cost, and request routes.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' disabled={refreshing} onClick={() => void refresh()}>
            {refreshing ? <LoaderCircle className='animate-spin' /> : <RefreshCw />}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button disabled={refreshing || dataState !== 'ready'}><Download />Export<ChevronDown className='ms-1' /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'><DropdownMenuLabel>Aggregated usage</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => exportData('csv')}><Download />Export CSV</DropdownMenuItem><DropdownMenuItem onSelect={() => exportData('json')}><Download />Export JSON</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant='ghost' size='icon' disabled={refreshing} aria-label='Preview data state'><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuLabel>Preview data state</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={dataState} onValueChange={changeDataState}>
                <DropdownMenuRadioItem value='ready'>Sample data</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='empty'>No recorded usage</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='error'>Unavailable data</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <section aria-label='Analytics filters' className='flex flex-col gap-3 lg:flex-row lg:items-center'>
        <div className='grid grid-cols-2 gap-3 sm:flex sm:flex-wrap'>
          <Select value={range} onValueChange={changeRange} disabled={refreshing}>
            <SelectTrigger className='w-full sm:w-44' aria-label='Time range'><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value='1'>Last 24 hours</SelectItem><SelectItem value='7'>Last 7 days</SelectItem><SelectItem value='30'>Last 30 days</SelectItem><SelectItem value='90'>Last 90 days</SelectItem></SelectContent>
          </Select>
          <Select value={granularity} onValueChange={(value) => setGranularity(value as AnalyticsGranularity)} disabled={refreshing}>
            <SelectTrigger className='w-full sm:w-36' aria-label='Granularity'><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value='hour' disabled={range !== '1'}>Hourly</SelectItem><SelectItem value='day' disabled={range === '1' || range === '90'}>Daily</SelectItem><SelectItem value='week' disabled={range === '1' || range === '7'}>Weekly</SelectItem></SelectContent>
          </Select>
        </div>
        <Tabs value={measure} onValueChange={(value) => setMeasure(value as AnalyticsMeasure)} className='min-w-0 sm:w-auto'>
          <TabsList aria-label='Measure' className='grid w-full grid-cols-3 sm:w-auto'><TabsTrigger value='requests' disabled={refreshing}>Requests</TabsTrigger><TabsTrigger value='tokens' disabled={refreshing}>Tokens</TabsTrigger><TabsTrigger value='cost' disabled={refreshing}>Cost</TabsTrigger></TabsList>
        </Tabs>
        <Button variant='outline' disabled={!hasPendingFilters || refreshing} onClick={applyFilters}>Apply filters</Button>
        <span className='text-xs text-muted-foreground lg:ms-auto'>{lastUpdated}</span>
      </section>

      {refreshing ? <AnalyticsLoading /> : dataState === 'error' ? <AnalyticsError onRetry={() => void refresh()} /> : dataState === 'empty' ? <AnalyticsEmpty onRestore={() => changeDataState('ready')} /> : (
        <>
          <MetricSummary totals={totals} />

          <Tabs value={view} onValueChange={(value) => setView(value as AnalyticsView)}>
            <section aria-labelledby='analytics-workspace-title' className='overflow-hidden rounded-md border'>
              <header className='flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between'>
                <div className='min-w-0'><h2 id='analytics-workspace-title' className='text-sm font-semibold'>{viewTitles[view][0]}</h2><p className='mt-1 text-sm text-muted-foreground'>{viewTitles[view][1]}</p></div>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                  <TabsList className='grid w-full grid-cols-3 sm:w-auto'><TabsTrigger value='trend'>Trend</TabsTrigger><TabsTrigger value='ranking'>Models</TabsTrigger><TabsTrigger value='flow'>Routes</TabsTrigger></TabsList>
                  <Button ref={detailTriggerRef} variant='outline' size='sm' onClick={openDetails}>View data</Button>
                </div>
              </header>
              <TabsContent value='trend' className='mt-0'><TrendChart points={points} totals={totals} measure={measure} /></TabsContent>
              <TabsContent value='ranking' className='mt-0'><ModelRanking totals={totals} /></TabsContent>
              <TabsContent value='flow' className='mt-0'><RequestFlow totals={totals} /></TabsContent>
              <footer className='flex min-h-12 flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-sm text-muted-foreground'><span>{periodLabel}</span><div className='flex gap-2'><Button variant='outline' size='sm' disabled>Previous</Button><Button variant='outline' size='sm' disabled>Next</Button></div></footer>
            </section>
          </Tabs>

          <SupportingSummary totals={totals} />
        </>
      )}

      {detailsOpen ? <AnalyticsDataDetails points={points} period={periodLabel} onClose={() => setDetailsOpen(false)} onClosedAutoFocus={() => detailTriggerRef.current?.focus()} /> : null}
    </ConsoleShell>
  )
}
