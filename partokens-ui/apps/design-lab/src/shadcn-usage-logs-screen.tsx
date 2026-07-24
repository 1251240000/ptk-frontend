import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  LoaderCircle,
  RefreshCw,
  ReceiptText,
  Search,
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

import { ConsoleShell, type ConsoleScreenProps } from './shadcn-console-shell'

type LogType = 'usage' | 'login' | 'system' | 'error'
type LogGroup = 'default' | 'trial' | ''

type LogRecord = {
  id: string
  time: string
  ageHours: number
  type: LogType
  keyName: string
  model: string
  streaming: boolean | null
  promptTokens: number | null
  completionTokens: number | null
  cost: number | null
  latency: string
  group: LogGroup
  upstreamId: string
  errorCode?: string
}

const usageLogs: LogRecord[] = [
  {
    id: 'req_7D4A',
    time: 'Jul 23, 10:42:18',
    ageHours: 0.2,
    type: 'usage',
    keyName: 'Production',
    model: 'gpt-4.1-mini',
    streaming: true,
    promptTokens: 1184,
    completionTokens: 658,
    cost: 0.018,
    latency: '842 ms',
    group: 'default',
    upstreamId: 'up_93ac2',
  },
  {
    id: 'req_4C21',
    time: 'Jul 23, 10:31:06',
    ageHours: 0.4,
    type: 'usage',
    keyName: 'Production',
    model: 'claude-3.7-sonnet',
    streaming: true,
    promptTokens: 2470,
    completionTokens: 736,
    cost: 0.064,
    latency: '1.2 s',
    group: 'default',
    upstreamId: 'up_2e71b',
  },
  {
    id: 'evt_A91F',
    time: 'Jul 23, 10:08:44',
    ageHours: 0.8,
    type: 'login',
    keyName: '',
    model: '',
    streaming: null,
    promptTokens: null,
    completionTokens: null,
    cost: null,
    latency: '',
    group: '',
    upstreamId: '',
  },
  {
    id: 'req_9B03',
    time: 'Jul 23, 09:58:27',
    ageHours: 1,
    type: 'error',
    keyName: 'Image studio',
    model: 'imagen-3',
    streaming: false,
    promptTokens: 0,
    completionTokens: 0,
    cost: 0,
    latency: '418 ms',
    group: 'trial',
    upstreamId: 'up_6d009',
    errorCode: 'rate_limit_exceeded',
  },
  {
    id: 'evt_11E8',
    time: 'Jul 23, 09:30:12',
    ageHours: 1.5,
    type: 'system',
    keyName: '',
    model: '',
    streaming: null,
    promptTokens: null,
    completionTokens: null,
    cost: null,
    latency: '',
    group: '',
    upstreamId: '',
  },
  {
    id: 'req_82FE',
    time: 'Jul 22, 06:14:09',
    ageHours: 29,
    type: 'usage',
    keyName: 'Staging services',
    model: 'gpt-4.1-mini',
    streaming: false,
    promptTokens: 714,
    completionTokens: 206,
    cost: 0.009,
    latency: '536 ms',
    group: 'trial',
    upstreamId: 'up_a817e',
  },
  {
    id: 'req_1AD7',
    time: 'Jul 20, 14:08:51',
    ageHours: 69,
    type: 'usage',
    keyName: 'Usage exporter',
    model: 'claude-3.7-sonnet',
    streaming: false,
    promptTokens: 398,
    completionTokens: 92,
    cost: 0.006,
    latency: '704 ms',
    group: 'default',
    upstreamId: 'up_17c3f',
  },
  {
    id: 'req_C058',
    time: 'Jul 12, 18:42:03',
    ageHours: 255,
    type: 'usage',
    keyName: 'Production',
    model: 'gpt-4.1-mini',
    streaming: true,
    promptTokens: 6210,
    completionTokens: 1284,
    cost: 0.081,
    latency: '1.7 s',
    group: 'default',
    upstreamId: 'up_5fb1a',
  },
]

const typeLabels: Record<LogType, string> = {
  usage: 'Usage',
  login: 'Login',
  system: 'System',
  error: 'Error',
}

function TypeBadge({ type }: { type: LogType }) {
  if (type === 'error') return <Badge variant='destructive'>Error</Badge>
  if (type === 'usage') return <Badge variant='outline'>Usage</Badge>
  return <Badge variant='secondary'>{typeLabels[type]}</Badge>
}

function displayTokens(record: LogRecord) {
  if (record.promptTokens === null || record.completionTokens === null) return '-'
  return (record.promptTokens + record.completionTokens).toLocaleString('en-US')
}

function displayCost(cost: number | null) {
  return cost === null ? '-' : `$${cost.toFixed(3)}`
}

function DetailList({ record }: { record: LogRecord }) {
  const rows = [
    ['Request ID', record.id],
    ['Type', typeLabels[record.type]],
    ['Model', record.model || '-'],
    ['API key', record.keyName || '-'],
    ['Group', record.group || '-'],
    ['Streaming', record.streaming === null ? '-' : record.streaming ? 'Yes' : 'No'],
    ['Prompt tokens', record.promptTokens?.toLocaleString('en-US') ?? '-'],
    ['Completion tokens', record.completionTokens?.toLocaleString('en-US') ?? '-'],
    ['Cost', displayCost(record.cost)],
    ['Latency', record.latency || '-'],
    ['Upstream request ID', record.upstreamId || '-'],
  ]

  return (
    <div className='space-y-4'>
      <dl className='divide-y rounded-md border'>
        {rows.map(([label, value]) => (
          <div key={label} className='grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 px-3 py-2.5 text-sm'>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd className='min-w-0 break-words text-end font-medium'>{value}</dd>
          </div>
        ))}
      </dl>
      {record.errorCode ? (
        <div role='alert' className='flex gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
          <AlertTriangle className='mt-0.5 size-4 shrink-0' />
          <div className='min-w-0'>
            <p className='font-medium'>Request failed</p>
            <code className='mt-1 block break-all text-xs'>{record.errorCode}</code>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LogDetails({
  record,
  onClose,
  onClosedAutoFocus,
}: {
  record: LogRecord
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
            <DetailList record={record} />
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
        <DetailList record={record} />
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className='flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center'>
      <div className='mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/40'>
        <ReceiptText className='size-5 text-muted-foreground' />
      </div>
      <h2 className='text-sm font-semibold'>No matching usage logs</h2>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>Try another request ID or clear the current filters.</p>
      <Button variant='outline' size='sm' className='mt-4' onClick={onClear}>Clear filters</Button>
    </div>
  )
}

function downloadFile(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function createCsv(records: LogRecord[]) {
  const fields = ['Request ID', 'Time', 'Type', 'Key name', 'Model', 'Streaming', 'Tokens', 'Cost', 'Latency', 'Group']
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`
  const rows = records.map((record) => [
    record.id,
    record.time,
    typeLabels[record.type],
    record.keyName,
    record.model,
    record.streaming === null ? '' : record.streaming ? 'Yes' : 'No',
    displayTokens(record),
    displayCost(record.cost),
    record.latency,
    record.group,
  ].map((value) => escape(value)).join(','))
  return [fields.map(escape).join(','), ...rows].join('\n')
}

export function ShadcnUsageLogsScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [model, setModel] = useState('all')
  const [timeRange, setTimeRange] = useState('24')
  const [group, setGroup] = useState('all')
  const [detail, setDetail] = useState<LogRecord | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('Updated at 10:43')
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null)

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    const maximumAge = Number(timeRange)
    return usageLogs.filter((record) => {
      const matchesSearch = !query || [record.id, record.keyName, record.model, record.upstreamId]
        .some((value) => value.toLowerCase().includes(query))
      const matchesType = type === 'all' || record.type === type
      const matchesModel = model === 'all' || record.model === model
      const matchesGroup = group === 'all' || record.group === group
      return matchesSearch && matchesType && matchesModel && matchesGroup && record.ageHours <= maximumAge
    })
  }, [group, model, search, timeRange, type])

  const totals = useMemo(() => filteredLogs.reduce((current, record) => ({
    cost: current.cost + (record.cost ?? 0),
    promptTokens: current.promptTokens + (record.promptTokens ?? 0),
    completionTokens: current.completionTokens + (record.completionTokens ?? 0),
  }), { cost: 0, promptTokens: 0, completionTokens: 0 }), [filteredLogs])

  const hasFilters = Boolean(search.trim()) || type !== 'all' || model !== 'all' || timeRange !== '24' || group !== 'all'
  const clearFilters = () => {
    setSearch('')
    setType('all')
    setModel('all')
    setTimeRange('24')
    setGroup('all')
  }

  const refresh = async () => {
    const toastId = toast.loading('Refreshing usage logs...', { duration: Infinity })
    setRefreshing(true)
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    setRefreshing(false)
    setLastUpdated('Updated just now')
    toast.success('Usage logs refreshed', {
      id: toastId,
      description: 'The latest account activity is now shown.',
      duration: 6000,
    })
  }

  const exportLogs = (format: 'csv' | 'json') => {
    try {
      const isCsv = format === 'csv'
      const content = isCsv ? createCsv(filteredLogs) : JSON.stringify(filteredLogs, null, 2)
      downloadFile(
        `partokens-usage-logs.${format}`,
        isCsv ? 'text/csv;charset=utf-8' : 'application/json',
        content,
      )
      toast.success('Export ready', {
        description: `${filteredLogs.length} records downloaded as ${format.toUpperCase()}.`,
        duration: 6000,
      })
    } catch {
      toast.error('Export failed', {
        description: 'The file could not be prepared. Try again.',
        duration: 6000,
      })
    }
  }

  const openDetails = (record: LogRecord, event: MouseEvent<HTMLButtonElement>) => {
    detailTriggerRef.current = event.currentTarget
    setDetail(record)
  }

  return (
    <ConsoleShell activeRoute='console-logs' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-bold tracking-tight'>Usage logs</h1>
          <p className='text-muted-foreground'>Inspect model calls, account events, cost, and request latency.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' disabled={refreshing} onClick={() => void refresh()}>
            {refreshing ? <LoaderCircle className='animate-spin' /> : <RefreshCw />}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download />Export<ChevronDown className='ms-1' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuLabel>Filtered records</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => exportLogs('csv')}><Download />Export CSV</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportLogs('json')}><Download />Export JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <section aria-label='Usage log filters' className='flex flex-col gap-3 lg:flex-row lg:items-center'>
        <div className='relative min-w-0 flex-1 lg:max-w-xs'>
          <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search request ID, key, or model...'
            aria-label='Search usage logs'
            className='ps-9'
          />
        </div>
        <div className='grid grid-cols-2 gap-3 sm:flex sm:flex-wrap'>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className='w-full sm:w-36' aria-label='Filter by event type'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              <SelectItem value='usage'>Usage</SelectItem>
              <SelectItem value='login'>Login</SelectItem>
              <SelectItem value='system'>System</SelectItem>
              <SelectItem value='error'>Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className='w-full sm:w-44' aria-label='Filter by model'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All models</SelectItem>
              <SelectItem value='gpt-4.1-mini'>gpt-4.1-mini</SelectItem>
              <SelectItem value='claude-3.7-sonnet'>claude-3.7-sonnet</SelectItem>
              <SelectItem value='imagen-3'>imagen-3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-full sm:w-40' aria-label='Filter by time range'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='24'>Last 24 hours</SelectItem>
              <SelectItem value='168'>Last 7 days</SelectItem>
              <SelectItem value='720'>Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className='w-full sm:w-36' aria-label='Filter by key group'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All groups</SelectItem>
              <SelectItem value='default'>default</SelectItem>
              <SelectItem value='trial'>trial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters ? <Button variant='ghost' size='sm' className='self-start lg:self-auto' onClick={clearFilters}>Clear</Button> : null}
      </section>

      <section aria-label='Filtered usage summary' className='grid grid-cols-2 overflow-hidden rounded-md border lg:grid-cols-4'>
        <div className='border-e border-b p-4 lg:border-b-0'>
          <p className='text-xs text-muted-foreground'>Filtered cost</p>
          <p className='mt-1 font-mono text-xl font-semibold'>${totals.cost.toFixed(3)}</p>
        </div>
        <div className='border-b p-4 lg:border-e lg:border-b-0'>
          <p className='text-xs text-muted-foreground'>Records</p>
          <p className='mt-1 font-mono text-xl font-semibold'>{filteredLogs.length}</p>
        </div>
        <div className='border-e p-4'>
          <p className='text-xs text-muted-foreground'>Prompt tokens</p>
          <p className='mt-1 font-mono text-xl font-semibold'>{totals.promptTokens.toLocaleString('en-US')}</p>
        </div>
        <div className='p-4'>
          <p className='text-xs text-muted-foreground'>Completion tokens</p>
          <p className='mt-1 font-mono text-xl font-semibold'>{totals.completionTokens.toLocaleString('en-US')}</p>
        </div>
      </section>

      <section aria-label='Usage logs' className='overflow-hidden rounded-md border'>
        {filteredLogs.length ? (
          <>
            <div className='hidden lg:block'>
              <Table className='min-w-[1040px]'>
                <TableHeader>
                  <TableRow className='hover:bg-transparent'>
                    <TableHead className='ps-4'>Time / request</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>API key</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Streaming</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead><span className='sr-only'>Details</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className='ps-4'>
                        <div className='font-medium'>{record.time}</div>
                        <code className='mt-0.5 block font-mono text-xs text-muted-foreground'>{record.id}</code>
                      </TableCell>
                      <TableCell><TypeBadge type={record.type} /></TableCell>
                      <TableCell>{record.keyName || '-'}</TableCell>
                      <TableCell>{record.model || '-'}</TableCell>
                      <TableCell>{record.streaming === null ? '-' : record.streaming ? 'Yes' : 'No'}</TableCell>
                      <TableCell className='font-mono text-xs'>{displayTokens(record)}</TableCell>
                      <TableCell className='font-mono text-xs'>{displayCost(record.cost)}</TableCell>
                      <TableCell className='font-mono text-xs'>{record.latency || '-'}</TableCell>
                      <TableCell className='pe-3 text-end'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant='ghost' size='icon' className='size-8' aria-label={`View details for ${record.id}`} onClick={(event) => openDetails(record, event)}>
                              <ChevronRight />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className='divide-y lg:hidden'>
              {filteredLogs.map((record) => (
                <article key={record.id} className='space-y-4 p-4'>
                  <div className='flex min-w-0 items-start gap-3'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <TypeBadge type={record.type} />
                        <span className='text-xs text-muted-foreground'>{record.time}</span>
                      </div>
                      <code className='mt-2 block break-all font-mono text-xs'>{record.id}</code>
                    </div>
                    <Button variant='ghost' size='icon' className='size-8 shrink-0' aria-label={`View details for ${record.id}`} onClick={(event) => openDetails(record, event)}>
                      <ChevronRight />
                    </Button>
                  </div>
                  <dl className='grid grid-cols-2 gap-x-4 gap-y-3 text-sm'>
                    <div className='min-w-0'>
                      <dt className='text-xs text-muted-foreground'>API key</dt>
                      <dd className='mt-1 break-words'>{record.keyName || '-'}</dd>
                    </div>
                    <div className='min-w-0'>
                      <dt className='text-xs text-muted-foreground'>Model</dt>
                      <dd className='mt-1 break-words'>{record.model || '-'}</dd>
                    </div>
                    <div className='min-w-0'>
                      <dt className='text-xs text-muted-foreground'>Tokens</dt>
                      <dd className='mt-1 font-mono text-xs'>{displayTokens(record)}</dd>
                    </div>
                    <div className='min-w-0'>
                      <dt className='text-xs text-muted-foreground'>Cost / latency</dt>
                      <dd className='mt-1 font-mono text-xs'>{displayCost(record.cost)} / {record.latency || '-'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState onClear={clearFilters} />
        )}

        <footer className='flex min-h-12 flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-sm text-muted-foreground'>
          <span>{filteredLogs.length} of {usageLogs.length} records - {lastUpdated}</span>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' disabled>Previous</Button>
            <Button variant='outline' size='sm' disabled>Next</Button>
          </div>
        </footer>
      </section>

      {detail ? (
        <LogDetails
          record={detail}
          onClose={() => setDetail(null)}
          onClosedAutoFocus={() => detailTriggerRef.current?.focus()}
        />
      ) : null}
    </ConsoleShell>
  )
}
