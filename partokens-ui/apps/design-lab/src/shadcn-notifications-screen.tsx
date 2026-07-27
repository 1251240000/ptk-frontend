import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Ellipsis,
  LoaderCircle,
  Mail,
  Radio,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Webhook,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode, type RefObject } from 'react'

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
  Input,
  Label,
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
  Switch,
  toast,
} from '@partokens/design-system/components'

import { ConsoleShell, type ConsoleScreenProps } from './shadcn-console-shell'

type PageState = 'ready' | 'loading' | 'empty' | 'error'
type Channel = 'email' | 'webhook' | 'bark' | 'gotify'
type SensitiveSetting = 'allowUnpriced' | 'recordRequestIp'
type ProcessingKind = 'retry' | 'save' | 'test' | 'sensitive'
type TimerRef = { current: number | null }

type NotificationConfig = {
  channel: Channel
  email: string
  webhookUrl: string
  webhookSecret: string
  barkUrl: string
  barkToken: string
  gotifyUrl: string
  gotifyToken: string
  balanceThreshold: string
  allowUnpriced: boolean
  recordRequestIp: boolean
}

type ValidationErrors = Partial<Record<'email' | 'endpoint' | 'credential' | 'balanceThreshold', string>>

type Operation =
  | { id: string; kind: 'save'; config: NotificationConfig }
  | { id: string; kind: 'test'; config: NotificationConfig }
  | { id: string; kind: 'sensitive'; setting: SensitiveSetting }

const channelMeta: Record<Channel, { label: string; detail: string; icon: typeof Mail }> = {
  email: { label: 'Email', detail: 'Demo inbox delivery', icon: Mail },
  webhook: { label: 'Webhook', detail: 'Signed HTTP callback', icon: Webhook },
  bark: { label: 'Bark', detail: 'Device push endpoint', icon: BellRing },
  gotify: { label: 'Gotify', detail: 'Self-hosted push endpoint', icon: Radio },
}

const initialConfig: NotificationConfig = {
  channel: 'email',
  email: 'alerts@example.invalid',
  webhookUrl: 'https://hooks.example.invalid/notify',
  webhookSecret: '',
  barkUrl: 'https://bark.example.invalid',
  barkToken: '',
  gotifyUrl: 'https://gotify.example.invalid',
  gotifyToken: '',
  balanceThreshold: '10.00',
  allowUnpriced: false,
  recordRequestIp: false,
}

function cloneConfig(config: NotificationConfig): NotificationConfig {
  return { ...config }
}

function configsMatch(left: NotificationConfig, right: NotificationConfig) {
  return (Object.keys(left) as (keyof NotificationConfig)[]).every((key) => left[key] === right[key])
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

function validateConfig(config: NotificationConfig): ValidationErrors {
  const errors: ValidationErrors = {}
  const threshold = Number(config.balanceThreshold)

  if (!config.balanceThreshold.trim()) errors.balanceThreshold = 'Balance warning is required.'
  else if (!Number.isFinite(threshold) || threshold < 0.01) errors.balanceThreshold = 'Enter an amount of at least 0.01.'

  if (config.channel === 'email') {
    if (!config.email.trim()) errors.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email.trim())) errors.email = 'Enter a valid email address.'
  } else {
    const endpoint = config.channel === 'webhook' ? config.webhookUrl : config.channel === 'bark' ? config.barkUrl : config.gotifyUrl
    const credential = config.channel === 'webhook' ? config.webhookSecret : config.channel === 'bark' ? config.barkToken : config.gotifyToken
    if (!endpoint.trim()) errors.endpoint = 'Endpoint URL is required.'
    else if (!validHttpUrl(endpoint.trim())) errors.endpoint = 'Enter a valid HTTP or HTTPS URL.'
    if (!credential) errors.credential = `${config.channel === 'webhook' ? 'Secret' : 'Token'} is required.`
    else if (credential.length < 8) errors.credential = `${config.channel === 'webhook' ? 'Secret' : 'Token'} must contain at least 8 characters.`
  }

  return errors
}

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

function NotificationsLoading() {
  return (
    <div aria-label='Loading notification preferences' aria-busy='true' className='space-y-4'>
      <section className='overflow-hidden rounded-lg border'>
        <div className='space-y-2 border-b px-4 py-3'><Skeleton className='h-3 w-36' /><Skeleton className='h-5 w-52' /></div>
        <div className='grid sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }, (_, index) => <div key={index} className='space-y-3 border-t p-4 first:border-t-0 sm:border-s sm:first:border-s-0 sm:[&:nth-child(-n+2)]:border-t-0 xl:border-t-0'><Skeleton className='h-4 w-32' /><Skeleton className='h-6 w-24' /><Skeleton className='h-3 w-28' /></div>)}
        </div>
      </section>
      {Array.from({ length: 2 }, (_, section) => <section key={section} className='overflow-hidden rounded-lg border'><div className='space-y-2 border-b px-4 py-3'><Skeleton className='h-3 w-28' /><Skeleton className='h-5 w-44' /></div><div className='space-y-5 p-4'><Skeleton className='h-10 w-full' /><Skeleton className='h-10 w-full' /><Skeleton className='h-10 w-full' /></div></section>)}
    </div>
  )
}

function NotificationsUnavailable({ state, retrying, onRetry, onRestore }: { state: 'empty' | 'error'; retrying: boolean; onRetry: () => void; onRestore: () => void }) {
  const isError = state === 'error'
  return (
    <section className='flex min-h-72 flex-col items-center justify-center rounded-lg border px-4 py-12 text-center'>
      <span className='flex size-10 items-center justify-center rounded-md border bg-muted/40'>{isError ? <AlertCircle className='size-5 text-destructive' /> : <BellRing className='size-5 text-muted-foreground' />}</span>
      <h2 className='mt-4 text-base font-semibold'>{isError ? 'Preferences unavailable' : 'No notification preferences'}</h2>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>{isError ? 'The notification preferences could not be loaded. Retry the simulated request.' : 'This preview represents an account without notification configuration.'}</p>
      <Button className='mt-4' variant='outline' disabled={retrying} onClick={isError ? onRetry : onRestore}>
        {retrying ? <LoaderCircle className='animate-spin' /> : <RefreshCw />}
        {retrying ? 'Retrying...' : isError ? 'Retry' : 'Restore sample'}
      </Button>
    </section>
  )
}

function NotificationsOverview({ config, lastSaved }: { config: NotificationConfig; lastSaved: string }) {
  const statuses = [
    { label: 'Active delivery channel', value: channelMeta[config.channel].label, detail: 'Saved notification route', icon: Send },
    { label: 'Balance warning threshold', value: `$${Number(config.balanceThreshold).toFixed(2)}`, detail: 'USD available balance', icon: BellRing, mono: true },
    { label: 'Pricing fallback', value: config.allowUnpriced ? 'Allowed' : 'Blocked', detail: 'Models without configured pricing', icon: ShieldCheck },
    { label: 'Request IP logging', value: config.recordRequestIp ? 'Enabled' : 'Disabled', detail: lastSaved, icon: Radio, mono: true },
  ]

  return (
    <section className='overflow-hidden rounded-lg border'>
      <header className='border-b px-4 py-3'><p className='text-xs font-medium text-muted-foreground'>NOTIFICATIONS OVERVIEW</p><h2 className='mt-0.5 text-base font-semibold'>Committed delivery status</h2></header>
      <div className='grid sm:grid-cols-2 xl:grid-cols-4'>
        {statuses.map(({ label, value, detail, icon: Icon, mono }, index) => (
          <div key={label} className={`min-w-0 p-4 ${index === 1 ? 'border-t sm:border-s sm:border-t-0' : ''} ${index === 2 ? 'border-t xl:border-s xl:border-t-0' : ''} ${index === 3 ? 'border-t sm:border-s xl:border-t-0' : ''}`}>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground'><Icon className='size-4 shrink-0' /><span className='break-words'>{label}</span></div>
            <p className={`mt-3 break-words text-lg font-semibold ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
            <p className={`mt-1 break-words text-xs text-muted-foreground ${index === 3 ? 'font-mono tabular-nums' : ''}`}>{detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null
  return <p id={id} role='alert' className='flex items-start gap-1.5 text-xs text-destructive'><AlertCircle className='mt-0.5 size-3.5 shrink-0' />{children}</p>
}

function ChannelFields({ draft, errors, onChange }: { draft: NotificationConfig; errors: ValidationErrors; onChange: (patch: Partial<NotificationConfig>) => void }) {
  if (draft.channel === 'email') {
    return (
      <div className='grid min-w-0 gap-2'>
        <Label htmlFor='notification-email'>Demo email address</Label>
        <Input id='notification-email' type='email' autoComplete='off' value={draft.email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'notification-email-error' : 'notification-email-note'} onChange={(event) => onChange({ email: event.target.value })} />
        <p id='notification-email-note' className='text-xs text-muted-foreground'>Use the explicit <span className='font-mono'>example.invalid</span> inbox for this local preview.</p>
        <FieldError id='notification-email-error'>{errors.email}</FieldError>
      </div>
    )
  }

  const endpointKey = draft.channel === 'webhook' ? 'webhookUrl' : draft.channel === 'bark' ? 'barkUrl' : 'gotifyUrl'
  const credentialKey = draft.channel === 'webhook' ? 'webhookSecret' : draft.channel === 'bark' ? 'barkToken' : 'gotifyToken'
  const endpointLabel = `${channelMeta[draft.channel].label} demo endpoint`
  const credentialLabel = draft.channel === 'webhook' ? 'Signing secret' : draft.channel === 'bark' ? 'Device token' : 'Application token'

  return (
    <div className='grid min-w-0 gap-5 sm:grid-cols-2'>
      <div className='grid min-w-0 gap-2'>
        <Label htmlFor='notification-endpoint'>{endpointLabel}</Label>
        <Input id='notification-endpoint' className='min-w-0 font-mono text-xs tabular-nums' type='url' inputMode='url' autoComplete='off' spellCheck={false} value={String(draft[endpointKey])} aria-invalid={Boolean(errors.endpoint)} aria-describedby={errors.endpoint ? 'notification-endpoint-error' : undefined} onChange={(event) => onChange({ [endpointKey]: event.target.value })} />
        <FieldError id='notification-endpoint-error'>{errors.endpoint}</FieldError>
      </div>
      <div className='grid min-w-0 gap-2'>
        <Label htmlFor='notification-credential'>{credentialLabel}</Label>
        <Input id='notification-credential' type='password' autoComplete='new-password' value={String(draft[credentialKey])} placeholder='At least 8 characters' aria-invalid={Boolean(errors.credential)} aria-describedby={errors.credential ? 'notification-credential-error' : 'notification-credential-note'} onChange={(event) => onChange({ [credentialKey]: event.target.value })} />
        <p id='notification-credential-note' className='text-xs text-muted-foreground'>Always masked. The value stays in component memory and is never sent or echoed.</p>
        <FieldError id='notification-credential-error'>{errors.credential}</FieldError>
      </div>
    </div>
  )
}

function ChangeSummary({ current, next }: { current: NotificationConfig; next: NotificationConfig }) {
  const rows: { label: string; value: string; mono?: boolean }[] = []
  if (current.channel !== next.channel) rows.push({ label: 'Delivery channel', value: `${channelMeta[current.channel].label} to ${channelMeta[next.channel].label}` })
  if (current.balanceThreshold !== next.balanceThreshold) rows.push({ label: 'Balance warning', value: `$${Number(next.balanceThreshold).toFixed(2)} USD`, mono: true })
  if (next.channel === 'email' && current.email !== next.email) rows.push({ label: 'Email destination', value: 'Updated' })
  if (next.channel !== 'email') {
    const endpointKey = next.channel === 'webhook' ? 'webhookUrl' : next.channel === 'bark' ? 'barkUrl' : 'gotifyUrl'
    const credentialKey = next.channel === 'webhook' ? 'webhookSecret' : next.channel === 'bark' ? 'barkToken' : 'gotifyToken'
    if (current[endpointKey] !== next[endpointKey]) rows.push({ label: `${channelMeta[next.channel].label} endpoint`, value: 'Updated' })
    if (current[credentialKey] !== next[credentialKey]) rows.push({ label: next.channel === 'webhook' ? 'Signing secret' : 'Access token', value: 'Updated and masked' })
  }
  if (current.allowUnpriced !== next.allowUnpriced) rows.push({ label: 'Pricing fallback', value: next.allowUnpriced ? 'Allow' : 'Block' })
  if (current.recordRequestIp !== next.recordRequestIp) rows.push({ label: 'Request IP logging', value: next.recordRequestIp ? 'Enable' : 'Disable' })

  return (
    <dl className='divide-y overflow-hidden rounded-md border'>
      {rows.map(({ label, value, mono }) => <div key={label} className='grid min-w-0 gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4'><dt className='text-xs text-muted-foreground'>{label}</dt><dd className={`break-words text-sm font-medium sm:text-end ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</dd></div>)}
    </dl>
  )
}

type OverlayProps = {
  compact: boolean
  title: string
  description: string
  processing: boolean
  confirmLabel: string
  processingLabel: string
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
  children: ReactNode
}

function NotificationOverlay({ compact, title, description, processing, confirmLabel, processingLabel, triggerRef, onClose, onConfirm, children }: OverlayProps) {
  const closeAutoFocus = (event: Event) => { event.preventDefault(); triggerRef.current?.focus() }
  const changeOpen = (open: boolean) => { if (!open && !processing) onClose() }
  const footer = (
    <>
      <Button variant='outline' disabled={processing} onClick={onClose}>Cancel</Button>
      <Button disabled={processing} onClick={onConfirm}>{processing ? <LoaderCircle className='animate-spin' /> : <CheckCircle2 />}{processing ? processingLabel : confirmLabel}</Button>
    </>
  )

  if (compact) {
    return (
      <Sheet open onOpenChange={changeOpen}>
        <SheetContent side='bottom' className={`max-h-[92svh] overflow-y-auto ${processing ? '[&>button]:pointer-events-none [&>button]:opacity-50' : ''}`} onCloseAutoFocus={closeAutoFocus} onEscapeKeyDown={(event) => { if (processing) event.preventDefault() }} onInteractOutside={(event) => { if (processing) event.preventDefault() }}>
          <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
          <div className='px-4'>{children}</div>
          <SheetFooter className='border-t'>{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-md' showCloseButton={!processing} onCloseAutoFocus={closeAutoFocus} onEscapeKeyDown={(event) => { if (processing) event.preventDefault() }} onInteractOutside={(event) => { if (processing) event.preventDefault() }}>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        {children}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ShadcnNotificationsScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  const [pageState, setPageState] = useState<PageState>('ready')
  const [committed, setCommitted] = useState<NotificationConfig>(() => cloneConfig(initialConfig))
  const [draft, setDraft] = useState<NotificationConfig>(() => cloneConfig(initialConfig))
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [lastSaved, setLastSaved] = useState('2026-07-26 16:12 UTC+8')
  const [operation, setOperation] = useState<Operation | null>(null)
  const [processing, setProcessing] = useState<ProcessingKind | null>(null)
  const compactOverlay = useCompactOverlay()

  const triggerRef = useRef<HTMLElement | null>(null)
  const retryTimerRef = useRef<number | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const testTimerRef = useRef<number | null>(null)
  const sensitiveTimerRef = useRef<number | null>(null)
  const guardsRef = useRef<Record<ProcessingKind, boolean>>({ retry: false, save: false, test: false, sensitive: false })
  const processedOperationsRef = useRef(new Set<string>())
  const mountedRef = useRef(true)

  const clearTimer = (timer: TimerRef) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  const clearAllTimers = () => {
    clearTimer(retryTimerRef)
    clearTimer(saveTimerRef)
    clearTimer(testTimerRef)
    clearTimer(sensitiveTimerRef)
    Object.keys(guardsRef.current).forEach((key) => { guardsRef.current[key as ProcessingKind] = false })
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearAllTimers()
    }
  }, [])

  const busy = processing !== null
  const dirty = !configsMatch(draft, committed)
  const newOperationId = (kind: Operation['kind'] | 'retry') => `NOTIFICATION-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const updateDraft = (patch: Partial<NotificationConfig>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setErrors({})
  }

  const previewState = (state: PageState) => {
    clearAllTimers()
    setProcessing(null)
    setOperation(null)
    setErrors({})
    setPageState(state)
  }

  const restoreSample = () => {
    clearAllTimers()
    const sample = cloneConfig(initialConfig)
    setCommitted(sample)
    setDraft(cloneConfig(sample))
    setErrors({})
    setOperation(null)
    setProcessing(null)
    setLastSaved('2026-07-26 16:12 UTC+8')
    setPageState('ready')
  }

  const retry = () => {
    if (busy || guardsRef.current.retry) return
    clearTimer(retryTimerRef)
    guardsRef.current.retry = true
    setProcessing('retry')
    const operationId = newOperationId('retry')
    retryTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current || processedOperationsRef.current.has(operationId)) return
      processedOperationsRef.current.add(operationId)
      setPageState('ready')
      setProcessing(null)
      guardsRef.current.retry = false
      retryTimerRef.current = null
      toast.success('Notification preferences loaded', { description: 'The local sample is ready.', id: operationId, duration: 5000 })
    }, 800)
  }

  const validate = (config: NotificationConfig) => {
    const nextErrors = validateConfig(config)
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const openSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !dirty || !validate(draft)) return
    const button = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null
    triggerRef.current = button instanceof HTMLElement ? button : null
    setOperation({ id: newOperationId('save'), kind: 'save', config: cloneConfig(draft) })
  }

  const openTest = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy || !validate(draft)) return
    triggerRef.current = event.currentTarget
    setOperation({ id: newOperationId('test'), kind: 'test', config: cloneConfig(draft) })
  }

  const changeSensitive = (setting: SensitiveSetting, checked: boolean, event: MouseEvent<HTMLButtonElement>) => {
    if (busy) return
    if (!checked) {
      updateDraft({ [setting]: false })
      return
    }
    triggerRef.current = event.currentTarget
    setOperation({ id: newOperationId('sensitive'), kind: 'sensitive', setting })
  }

  const closeOperation = () => {
    if (busy) return
    setOperation(null)
  }

  const startOperation = (kind: Exclude<ProcessingKind, 'retry'>, timer: TimerRef, complete: (current: Operation) => void) => {
    if (!operation || busy || guardsRef.current[kind] || processedOperationsRef.current.has(operation.id)) return
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
    }, kind === 'sensitive' ? 650 : 900)
  }

  const confirmOperation = () => {
    if (!operation) return
    if (operation.kind === 'save') {
      startOperation('save', saveTimerRef, (current) => {
        if (current.kind !== 'save') return
        const normalized = { ...current.config, email: current.config.email.trim(), webhookUrl: current.config.webhookUrl.trim(), barkUrl: current.config.barkUrl.trim(), gotifyUrl: current.config.gotifyUrl.trim(), balanceThreshold: Number(current.config.balanceThreshold).toFixed(2) }
        setCommitted(normalized)
        setDraft(cloneConfig(normalized))
        setLastSaved('2026-07-26 16:47 UTC+8')
        setErrors({})
        setOperation(null)
        toast.success('Notification preferences saved', { description: 'Overview and delivery settings now match.', id: current.id, duration: 5000 })
      })
      return
    }
    if (operation.kind === 'test') {
      startOperation('test', testTimerRef, (current) => {
        if (current.kind !== 'test') return
        setOperation(null)
        toast.success('Test notification simulated', { description: `No ${channelMeta[current.config.channel].label} message was sent.`, id: current.id, duration: 5000 })
      })
      return
    }
    startOperation('sensitive', sensitiveTimerRef, (current) => {
      if (current.kind !== 'sensitive') return
      setDraft((value) => ({ ...value, [current.setting]: true }))
      setOperation(null)
      toast.info('Sensitive setting added to draft', { description: 'Save preferences to commit this change.', id: current.id, duration: 5000 })
    })
  }

  let overlay: ReactNode = null
  if (operation) {
    if (operation.kind === 'save') {
      overlay = <NotificationOverlay compact={compactOverlay} title='Save notification preferences?' description='Review the changed settings before updating the committed overview.' processing={processing === 'save'} confirmLabel='Save preferences' processingLabel='Saving...' triggerRef={triggerRef} onClose={closeOperation} onConfirm={confirmOperation}><ChangeSummary current={committed} next={operation.config} /></NotificationOverlay>
    } else if (operation.kind === 'test') {
      overlay = <NotificationOverlay compact={compactOverlay} title='Send test notification?' description='This is a local design-lab simulation. No external service will be contacted.' processing={processing === 'test'} confirmLabel='Simulate test' processingLabel='Testing...' triggerRef={triggerRef} onClose={closeOperation} onConfirm={confirmOperation}><div className='flex items-start gap-3 rounded-md border bg-muted/30 p-3'><Send className='mt-0.5 size-4 shrink-0' /><div><p className='text-sm font-medium'>{channelMeta[operation.config.channel].label} delivery</p><p className='mt-1 text-sm text-muted-foreground'>The endpoint and any credential remain hidden and in memory only.</p></div></div></NotificationOverlay>
    } else {
      const isIp = operation.setting === 'recordRequestIp'
      overlay = <NotificationOverlay compact={compactOverlay} title={isIp ? 'Enable request IP logging?' : 'Allow models without pricing?'} description={isIp ? 'Request IP addresses can be sensitive account data. Confirm before adding this setting to the draft.' : 'Requests may use models whose cost cannot be calculated. Confirm before adding this setting to the draft.'} processing={processing === 'sensitive'} confirmLabel='Enable in draft' processingLabel='Enabling...' triggerRef={triggerRef} onClose={closeOperation} onConfirm={confirmOperation}><div className='flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3'><ShieldCheck className='mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400' /><p className='text-sm text-muted-foreground'>{isIp ? 'Logs may contain request-origin metadata. This preview never records an IP address.' : 'Usage can continue without a configured price. This preview never sends a model request.'}</p></div></NotificationOverlay>
    }
  }

  return (
    <ConsoleShell activeRoute='console-notifications' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'><h1 className='text-2xl font-bold tracking-tight'>Notifications</h1><p className='mt-1 text-muted-foreground'>Configure delivery, balance warnings, and private request behavior.</p></div>
        <fieldset disabled={busy} className='m-0 shrink-0 border-0 p-0'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant='outline' size='icon' aria-label='More notification actions'><Ellipsis /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuLabel>Preview notification state</DropdownMenuLabel>
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

      {pageState === 'loading' ? <NotificationsLoading /> : null}
      {pageState === 'empty' || pageState === 'error' ? <NotificationsUnavailable state={pageState} retrying={processing === 'retry'} onRetry={retry} onRestore={restoreSample} /> : null}
      {pageState === 'ready' ? (
        <form noValidate onSubmit={openSave} className='space-y-4'>
          <fieldset disabled={busy} className='m-0 min-w-0 space-y-4 border-0 p-0'>
            <NotificationsOverview config={committed} lastSaved={lastSaved} />

            <section className='overflow-hidden rounded-lg border'>
              <header className='border-b px-4 py-3'><p className='text-xs font-medium text-muted-foreground'>DELIVERY PREFERENCES</p><h2 className='mt-0.5 text-base font-semibold'>Notification destination</h2><p className='mt-1 text-sm text-muted-foreground'>Choose one active channel. Test actions remain local to this screen.</p></header>
              <div className='space-y-5 p-4'>
                <div className='grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,20rem)] sm:items-center'>
                  <div><Label htmlFor='notification-channel'>Delivery channel</Label><p className='mt-1 text-xs text-muted-foreground'>{channelMeta[draft.channel].detail}</p></div>
                  <Select value={draft.channel} onValueChange={(value) => updateDraft({ channel: value as Channel })}>
                    <SelectTrigger id='notification-channel' className='w-full'><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(channelMeta) as Channel[]).map((channel) => { const Icon = channelMeta[channel].icon; return <SelectItem key={channel} value={channel}><Icon />{channelMeta[channel].label}</SelectItem> })}</SelectContent>
                  </Select>
                </div>

                <div className='border-t pt-5'><ChannelFields draft={draft} errors={errors} onChange={updateDraft} /></div>

                <div className='grid min-w-0 gap-2 border-t pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,20rem)] sm:items-start'>
                  <div><Label htmlFor='balance-threshold'>Balance warning</Label><p className='mt-1 text-xs text-muted-foreground'>Notify when available USD balance reaches this amount.</p></div>
                  <div className='grid min-w-0 gap-2'><div className='relative'><span className='pointer-events-none absolute inset-y-0 start-3 flex items-center font-mono text-sm text-muted-foreground'>$</span><Input id='balance-threshold' className='ps-7 font-mono tabular-nums' type='number' min='0.01' step='0.01' inputMode='decimal' value={draft.balanceThreshold} aria-invalid={Boolean(errors.balanceThreshold)} aria-describedby={errors.balanceThreshold ? 'balance-threshold-error' : undefined} onChange={(event) => updateDraft({ balanceThreshold: event.target.value })} /></div><FieldError id='balance-threshold-error'>{errors.balanceThreshold}</FieldError></div>
                </div>
              </div>
            </section>

            <section className='overflow-hidden rounded-lg border border-amber-500/30'>
              <header className='border-b border-amber-500/20 bg-amber-500/5 px-4 py-3'><div className='flex items-start gap-3'><ShieldCheck className='mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400' /><div><p className='text-xs font-medium text-muted-foreground'>PRIVATE BEHAVIOR</p><h2 className='mt-0.5 text-base font-semibold'>Request handling</h2><p className='mt-1 text-sm text-muted-foreground'>Sensitive options require confirmation before they enter the draft.</p></div></div></header>
              <div className='divide-y'>
                <div className='flex min-w-0 items-start gap-4 p-4'><div className='min-w-0 flex-1'><Label htmlFor='allow-unpriced'>Allow models without configured pricing</Label><p className='mt-1 text-xs text-muted-foreground'>Permit requests when a model does not have a calculable price.</p></div><Switch id='allow-unpriced' className='mt-0.5 shrink-0' checked={draft.allowUnpriced} onClick={(event) => changeSensitive('allowUnpriced', !draft.allowUnpriced, event)} aria-label='Allow models without configured pricing' /></div>
                <div className='flex min-w-0 items-start gap-4 p-4'><div className='min-w-0 flex-1'><Label htmlFor='record-request-ip'>Record request IP in logs</Label><p className='mt-1 text-xs text-muted-foreground'>Attach request-origin metadata to future log entries.</p></div><Switch id='record-request-ip' className='mt-0.5 shrink-0' checked={draft.recordRequestIp} onClick={(event) => changeSensitive('recordRequestIp', !draft.recordRequestIp, event)} aria-label='Record request IP in logs' /></div>
              </div>
            </section>

            <div className='flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end'>
              <div className='me-auto text-xs text-muted-foreground'>{dirty ? <Badge variant='outline'>Unsaved changes</Badge> : 'All preferences are saved.'}</div>
              <Button type='button' variant='outline' onClick={openTest}><Send />Send test notification</Button>
              <Button type='submit' disabled={!dirty}><Save />Save preferences</Button>
            </div>
          </fieldset>
        </form>
      ) : null}

      {overlay}
    </ConsoleShell>
  )
}
