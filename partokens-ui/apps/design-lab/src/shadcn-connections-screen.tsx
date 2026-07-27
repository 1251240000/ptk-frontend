import {
  AlertCircle,
  Check,
  CheckCircle2,
  Chrome,
  Disc3,
  Ellipsis,
  Eye,
  Github,
  Link2,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  Unplug,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from 'react'

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
  toast,
} from '@partokens/design-system/components'

import { ConsoleShell, type ConsoleScreenProps } from './shadcn-console-shell'

type PageState = 'ready' | 'loading' | 'empty' | 'error'
type ProviderId = 'email' | 'github' | 'linuxdo' | 'google'
type ProcessingKind = 'connect' | 'disconnect' | 'primary' | 'retry'
type OperationKind = 'details' | 'connect' | 'disconnect' | 'primary'
type TimerRef = { current: number | null }

type Provider = {
  id: ProviderId
  name: string
  description: string
  icon: LucideIcon
  connected: boolean
  providerId: string | null
  connectedAt: string | null
  permissions: string[]
}

type ConnectionOperation = {
  id: string
  kind: OperationKind
  providerId: ProviderId
}

const initialProviders: Provider[] = [
  {
    id: 'email',
    name: 'Email',
    description: 'Password and recovery sign-in',
    icon: Mail,
    connected: true,
    providerId: 'email_demo_primary_01',
    connectedAt: '2024-11-08 10:24 UTC+8',
    permissions: ['Sign in', 'Account recovery'],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Developer identity provider',
    icon: Github,
    connected: true,
    providerId: 'github_demo_7K2P9M',
    connectedAt: '2026-07-20 11:08 UTC+8',
    permissions: ['Sign in', 'Public profile'],
  },
  {
    id: 'linuxdo',
    name: 'LinuxDO',
    description: 'Community identity provider',
    icon: Disc3,
    connected: false,
    providerId: null,
    connectedAt: null,
    permissions: ['Sign in', 'Basic profile'],
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Google account sign-in',
    icon: Chrome,
    connected: false,
    providerId: null,
    connectedAt: null,
    permissions: ['Sign in', 'Basic profile'],
  },
]

function useCompactOverlay() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 639px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return compact
}

function ConnectionsLoading() {
  return (
    <div aria-label='Loading connections' aria-busy='true' className='space-y-4'>
      <section className='overflow-hidden rounded-lg border'>
        <div className='space-y-2 border-b px-4 py-3'><Skeleton className='h-3 w-32' /><Skeleton className='h-5 w-48' /></div>
        <div className='grid sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }, (_, index) => <div key={index} className='space-y-3 border-t p-4 first:border-t-0 sm:border-s sm:first:border-s-0 sm:[&:nth-child(-n+2)]:border-t-0 xl:border-t-0'><Skeleton className='h-4 w-28' /><Skeleton className='h-6 w-20' /><Skeleton className='h-3 w-32' /></div>)}
        </div>
      </section>
      <section className='overflow-hidden rounded-lg border'>
        <div className='space-y-2 border-b px-4 py-3'><Skeleton className='h-3 w-28' /><Skeleton className='h-5 w-40' /></div>
        <div className='divide-y'>{Array.from({ length: 4 }, (_, index) => <div key={index} className='grid gap-4 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]'><Skeleton className='size-9' /><div className='space-y-2'><Skeleton className='h-4 w-28' /><Skeleton className='h-3 w-48' /></div><Skeleton className='h-9 w-40' /></div>)}</div>
      </section>
    </div>
  )
}

function ConnectionsUnavailable({ state, retrying, onRetry, onRestore }: { state: 'empty' | 'error'; retrying: boolean; onRetry: () => void; onRestore: () => void }) {
  const isError = state === 'error'
  return (
    <section className='flex min-h-72 flex-col items-center justify-center rounded-lg border px-4 py-12 text-center'>
      <span className='flex size-10 items-center justify-center rounded-md border bg-muted/40'>{isError ? <AlertCircle className='size-5 text-destructive' /> : <Unplug className='size-5 text-muted-foreground' />}</span>
      <h2 className='mt-4 text-base font-semibold'>{isError ? 'Connections unavailable' : 'No sign-in providers'}</h2>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>{isError ? 'The provider list could not be loaded. Retry the simulated request.' : 'This preview represents an account without connection data.'}</p>
      <Button className='mt-4' variant='outline' disabled={retrying} onClick={isError ? onRetry : onRestore}>
        {retrying ? <LoaderCircle className='animate-spin' /> : isError ? <RefreshCw /> : <Link2 />}
        {retrying ? 'Retrying...' : isError ? 'Retry' : 'Restore sample'}
      </Button>
    </section>
  )
}

function ConnectionsOverview({ providers, primary, lastUpdated }: { providers: Provider[]; primary: ProviderId; lastUpdated: string }) {
  const connected = providers.filter((provider) => provider.connected).length
  const available = providers.length - connected
  const primaryProvider = providers.find((provider) => provider.id === primary)
  const statuses = [
    { label: 'Connected providers', value: String(connected), detail: `${providers.length} providers configured`, icon: Link2 },
    { label: 'Available providers', value: String(available), detail: available ? 'Ready for local simulation' : 'All providers connected', icon: CheckCircle2 },
    { label: 'Primary sign-in', value: primaryProvider?.name ?? 'None', detail: 'Used as the default method', icon: Star },
    { label: 'Last connection update', value: 'Current', detail: lastUpdated, icon: RefreshCw, mono: true },
  ]

  return (
    <section className='overflow-hidden rounded-lg border'>
      <header className='border-b px-4 py-3'><p className='text-xs font-medium text-muted-foreground'>CONNECTIONS OVERVIEW</p><h2 className='mt-0.5 text-base font-semibold'>Sign-in provider status</h2></header>
      <div className='grid sm:grid-cols-2 xl:grid-cols-4'>
        {statuses.map(({ label, value, detail, icon: Icon, mono }, index) => (
          <div key={label} className={`min-w-0 p-4 ${index === 1 ? 'border-t sm:border-s sm:border-t-0' : ''} ${index === 2 ? 'border-t xl:border-s xl:border-t-0' : ''} ${index === 3 ? 'border-t sm:border-s xl:border-t-0' : ''}`}>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground'><Icon className='size-4 shrink-0' /><span className='break-words'>{label}</span></div>
            <p className='mt-3 text-lg font-semibold'>{value}</p>
            <p className={`mt-1 break-words text-xs text-muted-foreground ${mono ? 'font-mono tabular-nums' : ''}`}>{detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

type OverlayProps = {
  compact: boolean
  title: string
  description: string
  processing: boolean
  destructive?: boolean
  detailMode?: boolean
  confirmLabel?: string
  processingLabel?: string
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
  children: ReactNode
}

function ConnectionOverlay({ compact, title, description, processing, destructive, detailMode, confirmLabel = 'Confirm', processingLabel = 'Processing...', triggerRef, onClose, onConfirm, children }: OverlayProps) {
  const closeAutoFocus = (event: Event) => { event.preventDefault(); triggerRef.current?.focus() }
  const changeOpen = (open: boolean) => { if (!open && !processing) onClose() }
  const footer = detailMode ? <Button onClick={onClose}>Close</Button> : (
    <>
      <Button variant='outline' disabled={processing} onClick={onClose}>Cancel</Button>
      <Button variant={destructive ? 'destructive' : 'default'} disabled={processing} onClick={onConfirm}>
        {processing ? <LoaderCircle className='animate-spin' /> : destructive ? <Trash2 /> : <CheckCircle2 />}
        {processing ? processingLabel : confirmLabel}
      </Button>
    </>
  )

  if (compact) {
    return (
      <Sheet open onOpenChange={changeOpen}>
        <SheetContent
          side='bottom'
          className={`max-h-[92svh] overflow-y-auto ${processing ? '[&>button]:pointer-events-none [&>button]:opacity-50' : ''}`}
          onCloseAutoFocus={closeAutoFocus}
          onEscapeKeyDown={(event) => { if (processing) event.preventDefault() }}
          onInteractOutside={(event) => { if (processing) event.preventDefault() }}
        >
          <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
          <div className='px-4'>{children}</div>
          <SheetFooter className='border-t'>{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent
        className='max-h-[90svh] overflow-y-auto sm:max-w-md'
        showCloseButton={!processing}
        onCloseAutoFocus={closeAutoFocus}
        onEscapeKeyDown={(event) => { if (processing) event.preventDefault() }}
        onInteractOutside={(event) => { if (processing) event.preventDefault() }}
      >
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        {children}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProviderRow({ provider, primary, processing, inlineError, onDetails, onConnect, onDisconnect, onPrimary }: {
  provider: Provider
  primary: boolean
  processing: ProcessingKind | null
  inlineError?: string
  onDetails: (event: MouseEvent<HTMLButtonElement>) => void
  onConnect: (event: MouseEvent<HTMLButtonElement>) => void
  onDisconnect: (event: MouseEvent<HTMLButtonElement>) => void
  onPrimary: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const Icon = provider.icon
  const busy = processing !== null

  return (
    <article className='min-w-0 px-4 py-4'>
      <div className='grid min-w-0 gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center'>
        <span className='flex size-9 items-center justify-center rounded-md border bg-muted/40'><Icon className='size-4' /></span>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'><h3 className='text-sm font-semibold'>{provider.name}</h3>{primary ? <Badge><Star />Primary</Badge> : <Badge variant='outline'>{provider.connected ? <Check /> : null}{provider.connected ? 'Connected' : 'Available'}</Badge>}</div>
          <p className='mt-1 text-xs text-muted-foreground'>{provider.description}</p>
          <p className='mt-2 break-all font-mono text-xs tabular-nums text-muted-foreground'>{provider.connected ? provider.providerId : 'No provider ID · Not connected'}</p>
        </div>
        <div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap md:max-w-72 md:justify-end'>
          <Button variant='outline' disabled={busy} aria-label={`View ${provider.name} details`} onClick={onDetails}><Eye />Details</Button>
          {provider.connected ? (
            <>
              <Button variant='outline' disabled={busy || primary} onClick={onPrimary}>{primary ? <Check /> : <Star />}{primary ? 'Primary' : 'Make primary'}</Button>
              <Button variant='destructive' disabled={busy} onClick={onDisconnect}><Unplug />Disconnect</Button>
            </>
          ) : <Button disabled={busy} onClick={onConnect}><Link2 />Connect</Button>}
        </div>
      </div>
      {inlineError ? <p role='alert' className='mt-3 flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive md:ms-13'><AlertCircle className='mt-0.5 size-3.5 shrink-0' />{inlineError}</p> : null}
    </article>
  )
}

function ProviderDetails({ provider, primary }: { provider: Provider; primary: boolean }) {
  const rows = [
    ['Status', provider.connected ? primary ? 'Connected · Primary' : 'Connected' : 'Available'],
    ['Demo provider ID', provider.providerId ?? 'Not assigned'],
    ['Connected at', provider.connectedAt ?? 'Not connected'],
  ]

  return (
    <div className='space-y-4'>
      <dl className='divide-y overflow-hidden rounded-md border'>
        {rows.map(([label, value]) => <div key={label} className='grid min-w-0 gap-1 px-3 py-2.5'><dt className='text-xs text-muted-foreground'>{label}</dt><dd className={`break-all text-sm font-medium ${label !== 'Status' ? 'font-mono tabular-nums' : ''}`}>{value}</dd></div>)}
      </dl>
      <div><p className='text-xs font-medium text-muted-foreground'>Permission summary</p><div className='mt-2 flex flex-wrap gap-2'>{provider.permissions.map((permission) => <Badge key={permission} variant='outline'><ShieldCheck />{permission}</Badge>)}</div></div>
      <p className='text-xs text-muted-foreground'>All identifiers and permissions shown here are inert design-lab examples.</p>
    </div>
  )
}

export function ShadcnConnectionsScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  const [pageState, setPageState] = useState<PageState>('ready')
  const [providers, setProviders] = useState<Provider[]>(initialProviders)
  const [primary, setPrimary] = useState<ProviderId>('email')
  const [lastUpdated, setLastUpdated] = useState('2026-07-20 11:08 UTC+8')
  const [operation, setOperation] = useState<ConnectionOperation | null>(null)
  const [processing, setProcessing] = useState<ProcessingKind | null>(null)
  const [inlineErrors, setInlineErrors] = useState<Partial<Record<ProviderId, string>>>({})
  const compactOverlay = useCompactOverlay()

  const triggerRef = useRef<HTMLElement | null>(null)
  const retryTimerRef = useRef<number | null>(null)
  const connectTimerRef = useRef<number | null>(null)
  const disconnectTimerRef = useRef<number | null>(null)
  const primaryTimerRef = useRef<number | null>(null)
  const guardsRef = useRef<Record<ProcessingKind, boolean>>({ connect: false, disconnect: false, primary: false, retry: false })
  const processedOperationsRef = useRef(new Set<string>())
  const mountedRef = useRef(true)

  const clearTimer = (timer: TimerRef) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  const clearAllTimers = () => {
    clearTimer(retryTimerRef)
    clearTimer(connectTimerRef)
    clearTimer(disconnectTimerRef)
    clearTimer(primaryTimerRef)
    Object.keys(guardsRef.current).forEach((key) => { guardsRef.current[key as ProcessingKind] = false })
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearAllTimers()
    }
  }, [])

  const getProvider = (id: ProviderId) => providers.find((provider) => provider.id === id)
  const newOperation = (kind: OperationKind, providerId: ProviderId): ConnectionOperation => ({ id: `CONNECTION-${kind}-${providerId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind, providerId })

  const previewState = (state: PageState) => {
    clearAllTimers()
    setProcessing(null)
    setOperation(null)
    setInlineErrors({})
    setPageState(state)
  }

  const restoreSample = () => {
    clearAllTimers()
    setProviders(initialProviders)
    setPrimary('email')
    setLastUpdated('2026-07-20 11:08 UTC+8')
    setInlineErrors({})
    setPageState('ready')
  }

  const retry = () => {
    if (processing || guardsRef.current.retry) return
    clearTimer(retryTimerRef)
    guardsRef.current.retry = true
    setProcessing('retry')
    retryTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return
      setPageState('ready')
      setProcessing(null)
      guardsRef.current.retry = false
      retryTimerRef.current = null
      toast.success('Connections loaded', { description: 'The sample provider list is ready.', duration: 5000, id: 'connections-retry' })
    }, 800)
  }

  const openOperation = (kind: OperationKind, providerId: ProviderId, event: MouseEvent<HTMLButtonElement>) => {
    if (processing || guardsRef.current.connect || guardsRef.current.disconnect || guardsRef.current.primary) return
    if (kind === 'disconnect' && providerId === primary) {
      setInlineErrors({ [providerId]: `Choose another primary sign-in method before disconnecting ${getProvider(providerId)?.name ?? 'this provider'}.` })
      return
    }
    if (kind === 'primary' && providerId === primary) return
    setInlineErrors({})
    triggerRef.current = event.currentTarget
    setOperation(newOperation(kind, providerId))
  }

  const closeOperation = () => {
    if (processing) return
    setOperation(null)
  }

  const startOperation = (kind: Exclude<ProcessingKind, 'retry'>, timer: TimerRef, complete: (current: ConnectionOperation) => void) => {
    if (!operation || processing || guardsRef.current[kind] || processedOperationsRef.current.has(operation.id)) return
    const current = operation
    clearTimer(timer)
    guardsRef.current[kind] = true
    setProcessing(kind)
    timer.current = window.setTimeout(() => {
      if (!mountedRef.current || processedOperationsRef.current.has(current.id)) return
      processedOperationsRef.current.add(current.id)
      complete(current)
      setProcessing(null)
      guardsRef.current[kind] = false
      timer.current = null
    }, 900)
  }

  const confirmOperation = () => {
    if (!operation || operation.kind === 'details') return
    const provider = getProvider(operation.providerId)
    if (!provider) return
    if (operation.kind === 'connect') {
      startOperation('connect', connectTimerRef, (current) => {
        setProviders((items) => items.map((item) => item.id === current.providerId ? { ...item, connected: true, providerId: `${current.providerId}_demo_R46_CONNECTED`, connectedAt: '2026-07-26 15:06 UTC+8' } : item))
        setLastUpdated('2026-07-26 15:06 UTC+8')
        setOperation(null)
        toast.success(`${provider.name} connected`, { description: 'A local demo connection was added without OAuth.', duration: 5000, id: current.id })
      })
      return
    }
    if (operation.kind === 'disconnect') {
      startOperation('disconnect', disconnectTimerRef, (current) => {
        setProviders((items) => items.map((item) => item.id === current.providerId ? { ...item, connected: false, providerId: null, connectedAt: null } : item))
        setLastUpdated('2026-07-26 15:06 UTC+8')
        setOperation(null)
        toast.success(`${provider.name} disconnected`, { description: 'Only the component-local sample state changed.', duration: 5000, id: current.id })
      })
      return
    }
    startOperation('primary', primaryTimerRef, (current) => {
      setPrimary(current.providerId)
      setLastUpdated('2026-07-26 15:06 UTC+8')
      setOperation(null)
      toast.success('Primary sign-in updated', { description: `${provider.name} is now the primary demo sign-in method.`, duration: 5000, id: current.id })
    })
  }

  const activeProvider = operation ? getProvider(operation.providerId) : undefined
  let overlay: ReactNode = null
  if (operation && activeProvider) {
    const detailMode = operation.kind === 'details'
    const destructive = operation.kind === 'disconnect'
    const titles: Record<OperationKind, string> = {
      details: `${activeProvider.name} connection details`,
      connect: `Connect ${activeProvider.name}?`,
      disconnect: `Disconnect ${activeProvider.name}?`,
      primary: `Make ${activeProvider.name} primary?`,
    }
    const descriptions: Record<OperationKind, string> = {
      details: 'Review the local demo identifier, connection time, and permission summary.',
      connect: 'This simulates an account connection without opening OAuth or creating credentials.',
      disconnect: 'This removes only the component-local demo connection and identifier.',
      primary: 'Future demo sign-ins will show this provider as the default method.',
    }
    const labels: Record<OperationKind, string> = { details: 'Close', connect: `Connect ${activeProvider.name}`, disconnect: `Disconnect ${activeProvider.name}`, primary: 'Make primary' }
    const processingLabels: Record<OperationKind, string> = { details: 'Closing...', connect: 'Connecting...', disconnect: 'Disconnecting...', primary: 'Updating...' }

    overlay = (
      <ConnectionOverlay compact={compactOverlay} title={titles[operation.kind]} description={descriptions[operation.kind]} processing={processing !== null} destructive={destructive} detailMode={detailMode} confirmLabel={labels[operation.kind]} processingLabel={processingLabels[operation.kind]} triggerRef={triggerRef} onClose={closeOperation} onConfirm={confirmOperation}>
        {detailMode ? <ProviderDetails provider={activeProvider} primary={activeProvider.id === primary} /> : (
          <div className={`flex items-start gap-3 rounded-md border p-3 ${destructive ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/30'}`}>
            {destructive ? <AlertCircle className='mt-0.5 size-4 shrink-0 text-destructive' /> : operation.kind === 'primary' ? <Star className='mt-0.5 size-4 shrink-0' /> : <Link2 className='mt-0.5 size-4 shrink-0' />}
            <div className='min-w-0'><p className='text-sm font-medium'>{activeProvider.name}</p><p className='mt-1 text-sm text-muted-foreground'>{descriptions[operation.kind]}</p></div>
          </div>
        )}
      </ConnectionOverlay>
    )
  }

  return (
    <ConsoleShell activeRoute='console-connections' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'><h1 className='text-2xl font-bold tracking-tight'>Connections</h1><p className='mt-1 text-muted-foreground'>Review and manage the sign-in providers attached to this account.</p></div>
        <fieldset disabled={processing !== null} className='m-0 shrink-0 border-0 p-0'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant='outline' size='icon' aria-label='More connection actions'><Ellipsis /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuLabel>Preview connection state</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={pageState} onValueChange={(value) => previewState(value as PageState)}>
                <DropdownMenuRadioItem value='ready'>Sample</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='loading'>Loading</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='empty'>Empty</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='error'>Error</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </fieldset>
      </div>

      {pageState === 'loading' ? <ConnectionsLoading /> : null}
      {pageState === 'empty' || pageState === 'error' ? <ConnectionsUnavailable state={pageState} retrying={processing === 'retry'} onRetry={retry} onRestore={restoreSample} /> : null}
      {pageState === 'ready' ? (
        <>
          <ConnectionsOverview providers={providers} primary={primary} lastUpdated={lastUpdated} />
          <section className='overflow-hidden rounded-lg border'>
            <header className='border-b px-4 py-3'><p className='text-xs font-medium text-muted-foreground'>SIGN-IN METHODS</p><h2 className='mt-0.5 text-base font-semibold'>Provider connections</h2><p className='mt-1 text-sm text-muted-foreground'>Keep at least one connected primary method. All actions below are local simulations.</p></header>
            <div className='divide-y'>{providers.map((provider) => <ProviderRow key={provider.id} provider={provider} primary={provider.id === primary} processing={processing} inlineError={inlineErrors[provider.id]} onDetails={(event) => openOperation('details', provider.id, event)} onConnect={(event) => openOperation('connect', provider.id, event)} onDisconnect={(event) => openOperation('disconnect', provider.id, event)} onPrimary={(event) => openOperation('primary', provider.id, event)} />)}</div>
          </section>
        </>
      ) : null}

      {overlay}
    </ConsoleShell>
  )
}
