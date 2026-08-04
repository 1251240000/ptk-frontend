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
import { useEffect, useRef, useState, type MouseEvent } from 'react'

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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  ConsoleShell,
  type ConsoleScreenProps,
  type ConsoleTarget,
} from './shadcn-console-shell'

type OverviewDataState = 'ready' | 'empty' | 'error'
type ServiceState = 'checking' | 'available' | 'unavailable'

type UsageRecord = {
  id: string
  time: string
  model: string
  keyName: string
  status: 'success' | 'error'
  tokens: string
  cost: string
  latency: string
  endpoint: string
}

type ShadcnOverviewScreenProps = Omit<ConsoleScreenProps, 'onNavigate'> & {
  online: boolean | null
  version?: string
  onNavigate: (target: ConsoleTarget) => void
}

const recentUsage: UsageRecord[] = [
  {
    id: 'req_7D4A',
    time: 'Today, 10:42:18',
    model: 'gpt-4.1-mini',
    keyName: 'Production',
    status: 'success',
    tokens: '1,842',
    cost: '$0.018',
    latency: '842 ms',
    endpoint: '/v1/chat/completions',
  },
  {
    id: 'req_4C21',
    time: 'Today, 10:31:06',
    model: 'claude-3.7-sonnet',
    keyName: 'Production',
    status: 'success',
    tokens: '3,206',
    cost: '$0.064',
    latency: '1.2 s',
    endpoint: '/v1/chat/completions',
  },
  {
    id: 'req_9B03',
    time: 'Today, 09:58:27',
    model: 'imagen-3',
    keyName: 'Image studio',
    status: 'error',
    tokens: '0',
    cost: '$0.000',
    latency: '418 ms',
    endpoint: '/v1/images/generations',
  },
]

const metrics = [
  { label: 'Account balance', value: '$82.40', note: 'USD' },
  { label: 'Recent usage', value: '$9.18', note: 'Last 30 days' },
  { label: 'Total usage', value: '$126.54', note: 'All time' },
  { label: 'Requests', value: '1,284', note: '+14.2%' },
]

function UsageStatus({ status }: { status: UsageRecord['status'] }) {
  if (status === 'error') return <Badge variant='destructive'>Error</Badge>
  return <Badge variant='outline' className='gap-1.5'><span className='size-1.5 rounded-full bg-emerald-500' />Succeeded</Badge>
}

function UsageDetails({ record }: { record: UsageRecord }) {
  const fields = [
    ['Request ID', record.id],
    ['Time', record.time],
    ['Model', record.model],
    ['API key', record.keyName],
    ['Endpoint', record.endpoint],
    ['Tokens', record.tokens],
    ['Cost', record.cost],
    ['Latency', record.latency],
    ['Status', record.status === 'success' ? 'Succeeded' : 'Error'],
  ]

  return (
    <dl className='divide-y rounded-md border'>
      {fields.map(([label, value]) => (
        <div key={label} className='grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-4 px-3 py-2.5 text-sm'>
          <dt className='text-muted-foreground'>{label}</dt>
          <dd className='min-w-0 break-words text-end font-medium'>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function UsageDetailOverlay({
  record,
  onClose,
  onClosedAutoFocus,
}: {
  record: UsageRecord
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
          <SheetHeader>
            <SheetTitle>Request details</SheetTitle>
            <SheetDescription>{record.id} at {record.time}</SheetDescription>
          </SheetHeader>
          <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4'>
            <UsageDetails record={record} />
          </div>
          <SheetFooter className='border-t'>
            <Button variant='outline' onClick={onClose}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-xl' onCloseAutoFocus={closeAutoFocus}>
        <DialogHeader>
          <DialogTitle>Request details</DialogTitle>
          <DialogDescription>{record.id} at {record.time}</DialogDescription>
        </DialogHeader>
        <UsageDetails record={record} />
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MetricSummary() {
  return (
    <section aria-label='Account usage summary' className='grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4'>
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`min-w-0 p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : 'lg:border-e-0'}`}
        >
          <p className='text-xs text-muted-foreground'>{metric.label}</p>
          <div className='mt-1 flex min-w-0 items-baseline gap-2'>
            <p className='min-w-0 font-mono text-xl font-semibold'>{metric.value}</p>
            <span className='truncate text-xs text-muted-foreground'>{metric.note}</span>
          </div>
        </div>
      ))}
    </section>
  )
}

function OverviewLoading() {
  return (
    <div role='status' aria-label='Loading overview' className='space-y-6'>
      <section className='grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4'>
        {metrics.map((metric, index) => (
          <div key={metric.label} className={`p-4 ${index % 2 === 0 ? 'border-e' : ''} ${index < 2 ? 'border-b' : ''} lg:border-b-0 ${index < 3 ? 'lg:border-e' : 'lg:border-e-0'}`}>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='mt-2 h-6 w-28' />
          </div>
        ))}
      </section>
      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]'>
        <Skeleton className='h-64 rounded-md' />
        <Skeleton className='h-64 rounded-md' />
      </div>
      <Skeleton className='h-56 rounded-md' />
      <Skeleton className='h-72 rounded-md' />
      <span className='sr-only'>Refreshing account and usage data...</span>
    </div>
  )
}

function RequestReadiness({ onNavigate }: Pick<ShadcnOverviewScreenProps, 'onNavigate'>) {
  const steps = [
    { label: 'Account ready', icon: CircleUserRound },
    { label: 'API key ready', icon: KeyRound },
    { label: 'First request', icon: CheckCircle2 },
  ]

  return (
    <section aria-labelledby='request-readiness-title' className='overflow-hidden rounded-md border'>
      <header className='flex items-start justify-between gap-4 border-b p-4'>
        <div className='min-w-0'>
          <h2 id='request-readiness-title' className='text-sm font-semibold'>Request readiness</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Everything required to send an authenticated request.</p>
        </div>
        <Badge variant='outline' className='shrink-0 gap-1.5'><Check className='size-3.5' />3 / 3</Badge>
      </header>
      <div className='grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
        {steps.map(({ label, icon: Icon }, index) => (
          <div key={label} className='flex min-w-0 items-center gap-3 p-4'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-muted'><Icon className='size-4' /></div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>Step {index + 1}</p>
              <p className='break-words text-sm font-medium'>{label}</p>
            </div>
            <Check className='ms-auto size-4 shrink-0 text-emerald-500' />
          </div>
        ))}
      </div>
      <footer className='flex flex-col gap-3 border-t bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <p className='text-xs text-muted-foreground'>Available endpoint</p>
          <code className='mt-1 block break-all font-mono text-xs font-medium'>/v1/chat/completions</code>
        </div>
        <Button size='sm' onClick={() => onNavigate('console-playground')}><Play />Open Playground</Button>
      </footer>
    </section>
  )
}

function ServiceReadiness({
  state,
  version,
  onNavigate,
}: {
  state: ServiceState
  version?: string
  onNavigate: ShadcnOverviewScreenProps['onNavigate']
}) {
  const available = state === 'available'
  const checking = state === 'checking'

  return (
    <section aria-labelledby='service-readiness-title' className='flex min-h-full flex-col overflow-hidden rounded-md border'>
      <header className='flex items-start justify-between gap-4 border-b p-4'>
        <div className='min-w-0'>
          <h2 id='service-readiness-title' className='text-sm font-semibold'>API service</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Current availability and deployed version.</p>
        </div>
        {checking ? (
          <Badge variant='secondary' className='shrink-0 gap-1.5'><LoaderCircle className='size-3.5 animate-spin' />Checking</Badge>
        ) : available ? (
          <Badge variant='outline' className='shrink-0 gap-1.5'><span className='size-1.5 rounded-full bg-emerald-500' />Available</Badge>
        ) : (
          <Badge variant='destructive' className='shrink-0'>Unavailable</Badge>
        )}
      </header>
      <dl className='divide-y px-4'>
        <div className='flex items-center justify-between gap-4 py-3 text-sm'>
          <dt className='text-muted-foreground'>Service</dt>
          <dd className='font-medium'>Partokens API</dd>
        </div>
        <div className='flex items-center justify-between gap-4 py-3 text-sm'>
          <dt className='text-muted-foreground'>Version</dt>
          <dd><code className='font-mono text-xs'>{version ?? 'v1.0.0-rc.21'}</code></dd>
        </div>
        <div className='flex items-center justify-between gap-4 py-3 text-sm'>
          <dt className='text-muted-foreground'>Compatibility</dt>
          <dd className='font-medium'>OpenAI API</dd>
        </div>
      </dl>
      <footer className='mt-auto border-t p-3'>
        <Button variant='ghost' size='sm' className='w-full justify-between' onClick={() => onNavigate('notices')}>
          Notices<ArrowRight />
        </Button>
      </footer>
    </section>
  )
}

function RequestTrace({ onNavigate }: Pick<ShadcnOverviewScreenProps, 'onNavigate'>) {
  const stages = [
    { label: 'Client', value: 'OpenAI SDK', icon: Server },
    { label: 'Available endpoint', value: 'POST /v1/chat/completions', icon: Route },
    { label: 'Provider route', value: 'Auto / default', icon: Bot },
    { label: 'Response', value: 'Available', icon: CheckCircle2 },
  ]

  return (
    <section aria-labelledby='request-trace-title' className='overflow-hidden rounded-md border'>
      <header className='flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <h2 id='request-trace-title' className='text-sm font-semibold'>Request route</h2>
          <p className='mt-1 text-sm text-muted-foreground'>The active path from compatible client to provider response.</p>
        </div>
        <Button variant='outline' size='sm' className='self-start sm:self-auto' onClick={() => onNavigate('console-logs')}>
          Inspect logs<ArrowRight />
        </Button>
      </header>
      <ol className='grid divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0'>
        {stages.map(({ label, value, icon: Icon }, index) => (
          <li key={label} className='flex min-w-0 items-center gap-3 p-4'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/30'><Icon className='size-4' /></div>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>{index + 1}. {label}</p>
              <p className='mt-1 break-words text-sm font-medium'>{value}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function RecentUsageSection({
  state,
  onState,
  onNavigate,
  onOpenDetails,
}: {
  state: OverviewDataState
  onState: (state: OverviewDataState) => void
  onNavigate: ShadcnOverviewScreenProps['onNavigate']
  onOpenDetails: (record: UsageRecord, event: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <section aria-labelledby='recent-usage-title' className='overflow-hidden rounded-md border'>
      <header className='flex items-center justify-between gap-4 border-b p-4'>
        <div className='min-w-0'>
          <h2 id='recent-usage-title' className='text-sm font-semibold'>Recent usage</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Latest model requests across active API keys.</p>
        </div>
        <Button variant='ghost' size='sm' className='shrink-0' onClick={() => onNavigate('console-logs')}>View all<ArrowRight /></Button>
      </header>

      {state === 'error' ? (
        <div role='alert' className='flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center'>
          <div className='mb-4 flex size-10 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10'>
            <AlertTriangle className='size-5 text-destructive' />
          </div>
          <h3 className='text-sm font-semibold'>Recent usage is unavailable</h3>
          <p className='mt-1 max-w-sm text-sm text-muted-foreground'>The latest request records could not be loaded. Retry the data request.</p>
          <Button variant='outline' size='sm' className='mt-4' onClick={() => onState('ready')}><RefreshCw />Retry</Button>
        </div>
      ) : state === 'empty' ? (
        <div className='flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center'>
          <div className='mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/40'>
            <ReceiptText className='size-5 text-muted-foreground' />
          </div>
          <h3 className='text-sm font-semibold'>No recent usage</h3>
          <p className='mt-1 max-w-sm text-sm text-muted-foreground'>Requests will appear here after an API key sends its first model call.</p>
          <Button variant='outline' size='sm' className='mt-4' onClick={() => onState('ready')}>Restore sample records</Button>
        </div>
      ) : (
        <>
          <div className='hidden md:block'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='ps-4'>Time</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>API key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead><span className='sr-only'>Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsage.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className='ps-4 text-muted-foreground'>{record.time}</TableCell>
                    <TableCell className='font-medium'>{record.model}</TableCell>
                    <TableCell>{record.keyName}</TableCell>
                    <TableCell><UsageStatus status={record.status} /></TableCell>
                    <TableCell className='font-mono text-xs'>{record.tokens}</TableCell>
                    <TableCell className='font-mono text-xs'>{record.cost}</TableCell>
                    <TableCell className='font-mono text-xs'>{record.latency}</TableCell>
                    <TableCell className='text-end'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant='ghost' size='icon' aria-label={`View ${record.id} details`} onClick={(event) => onOpenDetails(record, event)}><Eye /></Button>
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='divide-y md:hidden'>
            {recentUsage.map((record) => (
              <article key={record.id} className='p-4'>
                <div className='flex min-w-0 items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{record.model}</p>
                    <code className='mt-1 block truncate font-mono text-xs text-muted-foreground'>{record.id}</code>
                  </div>
                  <UsageStatus status={record.status} />
                </div>
                <dl className='mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm'>
                  <div className='min-w-0'><dt className='text-xs text-muted-foreground'>Time</dt><dd className='mt-1 break-words'>{record.time}</dd></div>
                  <div className='min-w-0'><dt className='text-xs text-muted-foreground'>API key</dt><dd className='mt-1 break-words'>{record.keyName}</dd></div>
                  <div className='min-w-0'><dt className='text-xs text-muted-foreground'>Tokens</dt><dd className='mt-1 font-mono text-xs'>{record.tokens}</dd></div>
                  <div className='min-w-0'><dt className='text-xs text-muted-foreground'>Cost / latency</dt><dd className='mt-1 font-mono text-xs'>{record.cost} / {record.latency}</dd></div>
                </dl>
                <Button variant='outline' size='sm' className='mt-4 w-full' onClick={(event) => onOpenDetails(record, event)}><Eye />View details</Button>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export function ShadcnOverviewScreen({
  theme,
  online,
  version: initialVersion,
  onTheme,
  onNavigate,
}: ShadcnOverviewScreenProps) {
  const [dataState, setDataState] = useState<OverviewDataState>('ready')
  const [serviceState, setServiceState] = useState<ServiceState>(online === null ? 'checking' : online ? 'available' : 'unavailable')
  const [version, setVersion] = useState(initialVersion)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('Updated at 10:43')
  const [detail, setDetail] = useState<UsageRecord | null>(null)
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setServiceState(online === null ? 'checking' : online ? 'available' : 'unavailable')
  }, [online])

  useEffect(() => {
    if (initialVersion) setVersion(initialVersion)
  }, [initialVersion])

  const refresh = async () => {
    const toastId = toast.loading('Refreshing overview...', { duration: Infinity })
    setRefreshing(true)
    setServiceState('checking')

    try {
      const [response] = await Promise.all([
        fetch('/api/status'),
        new Promise((resolve) => window.setTimeout(resolve, 1200)),
      ])
      const body = await response.json() as { success?: boolean; data?: { version?: string } }
      if (!response.ok || !body.success) throw new Error('Service unavailable')
      setServiceState('available')
      setVersion(body.data?.version ?? version)
      setDataState('ready')
      setLastUpdated('Updated just now')
      toast.success('Overview refreshed', {
        id: toastId,
        description: 'Account usage and API service status are up to date.',
        duration: 6000,
      })
    } catch {
      setServiceState('unavailable')
      setLastUpdated('Service check failed just now')
      toast.error('Service check failed', {
        id: toastId,
        description: 'Account data remains available. Try the status check again.',
        duration: 6000,
      })
    } finally {
      setRefreshing(false)
    }
  }

  const changeDataState = (nextState: OverviewDataState) => {
    setDataState(nextState)
    if (nextState === 'error') toast.error('Recent usage request failed', { description: 'The unavailable state is now shown.', duration: 6000 })
    else if (nextState === 'empty') toast.info('No recent usage returned', { description: 'The empty state is now shown.', duration: 6000 })
    else toast.success('Recent usage restored', { duration: 6000 })
  }

  const openDetails = (record: UsageRecord, event: MouseEvent<HTMLButtonElement>) => {
    detailTriggerRef.current = event.currentTarget
    setDetail(record)
  }

  return (
    <ConsoleShell activeRoute='console' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-bold tracking-tight'>Overview</h1>
          <p className='text-muted-foreground'>Account readiness, usage, and the next useful action in one view.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' disabled={refreshing} onClick={() => onNavigate('console-keys')}><KeyRound />Create a key</Button>
          <Button disabled={refreshing} onClick={() => onNavigate('console-playground')}><Play />Open Playground</Button>
          <Button variant='outline' disabled={refreshing} onClick={() => void refresh()}>
            {refreshing ? <LoaderCircle className='animate-spin' /> : <RefreshCw />}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' disabled={refreshing} aria-label='Preview recent usage state'><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuLabel>Preview recent usage</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={dataState} onValueChange={(value) => changeDataState(value as OverviewDataState)}>
                <DropdownMenuRadioItem value='ready'>Sample records</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='empty'>No recent usage</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='error'>Unavailable data</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {refreshing ? <OverviewLoading /> : (
        <>
          <MetricSummary />
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]'>
            <RequestReadiness onNavigate={onNavigate} />
            <ServiceReadiness state={serviceState} version={version} onNavigate={onNavigate} />
          </div>
          <RequestTrace onNavigate={onNavigate} />
          <RecentUsageSection state={dataState} onState={changeDataState} onNavigate={onNavigate} onOpenDetails={openDetails} />
          <p className='text-end text-xs text-muted-foreground'>{lastUpdated}</p>
        </>
      )}

      {detail ? (
        <UsageDetailOverlay
          record={detail}
          onClose={() => setDetail(null)}
          onClosedAutoFocus={() => detailTriggerRef.current?.focus()}
        />
      ) : null}
    </ConsoleShell>
  )
}
