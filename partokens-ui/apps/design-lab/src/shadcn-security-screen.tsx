import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clipboard,
  Ellipsis,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  MonitorCheck,
  RefreshCw,
  ShieldCheck,
  Trash2,
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
  Input,
  Label,
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
type ProcessingKind = 'two-factor' | 'passkey' | 'password' | 'token' | 'retry'
type OperationKind =
  | 'setup-two-factor'
  | 'recovery-codes'
  | 'disable-two-factor'
  | 'register-passkey'
  | 'remove-passkey'
  | 'change-password'
  | 'generate-token'
  | 'regenerate-token'
  | 'revoke-token'

type SecurityOperation = { id: string; kind: OperationKind }
type PasswordDraft = { current: string; next: string; confirm: string }
type PasswordErrors = Partial<Record<keyof PasswordDraft, string>>
type TimerRef = { current: number | null }

const emptyPasswords: PasswordDraft = { current: '', next: '', confirm: '' }
const setupSecret = 'DEMO-TOTP-JBSW-Y3DP-EHPK-3PXP'
const initialPasswordUpdatedAt = '2026-06-18 09:42 UTC+8'
const recoveryCodeSample = [
  'DEMO-RCVR-7K2P',
  'DEMO-RCVR-4H9M',
  'DEMO-RCVR-8Q3D',
  'DEMO-RCVR-2N6X',
  'DEMO-RCVR-5T1W',
  'DEMO-RCVR-9C4J',
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

function SectionHeading({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon: typeof ShieldCheck }) {
  return (
    <header className='flex items-start gap-3 border-b px-4 py-3'>
      <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40'><Icon className='size-4' /></span>
      <div className='min-w-0'>
        <p className='text-xs font-medium text-muted-foreground'>{eyebrow}</p>
        <h2 className='mt-0.5 text-base font-semibold'>{title}</h2>
        <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      </div>
    </header>
  )
}

function InlineError({ id, children }: { id: string; children: string }) {
  return <p id={id} role='alert' className='flex items-start gap-1.5 text-xs text-destructive'><AlertCircle className='mt-0.5 size-3.5 shrink-0' />{children}</p>
}

function SecurityLoading() {
  return (
    <div aria-label='Loading security settings' aria-busy='true' className='space-y-4'>
      <section className='overflow-hidden rounded-lg border'>
        <div className='space-y-2 border-b px-4 py-3'><Skeleton className='h-3 w-28' /><Skeleton className='h-5 w-44' /></div>
        <div className='grid sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }, (_, index) => <div key={index} className='space-y-3 border-t p-4 first:border-t-0 sm:border-s sm:first:border-s-0 sm:[&:nth-child(-n+2)]:border-t-0 xl:border-t-0'><Skeleton className='h-4 w-28' /><Skeleton className='h-6 w-20' /><Skeleton className='h-3 w-32' /></div>)}
        </div>
      </section>
      <div className='grid gap-4 lg:grid-cols-2'>
        {Array.from({ length: 4 }, (_, index) => <section key={index} className='overflow-hidden rounded-lg border'><div className='space-y-2 border-b p-4'><Skeleton className='h-4 w-32' /><Skeleton className='h-3 w-full' /></div><div className='space-y-3 p-4'><Skeleton className='h-9 w-full' /><Skeleton className='h-9 w-32' /></div></section>)}
      </div>
    </div>
  )
}

function SecurityUnavailable({ state, retrying, onRetry, onRestore }: { state: 'empty' | 'error'; retrying: boolean; onRetry: () => void; onRestore: () => void }) {
  const isError = state === 'error'
  return (
    <section className='flex min-h-72 flex-col items-center justify-center rounded-lg border px-4 py-12 text-center'>
      <span className='flex size-10 items-center justify-center rounded-md border bg-muted/40'>{isError ? <AlertCircle className='size-5 text-destructive' /> : <ShieldCheck className='size-5 text-muted-foreground' />}</span>
      <h2 className='mt-4 text-base font-semibold'>{isError ? 'Security settings unavailable' : 'No security settings'}</h2>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>{isError ? 'The security summary could not be loaded. Retry the simulated request.' : 'This preview represents an account with no security configuration.'}</p>
      <Button className='mt-4' variant='outline' disabled={retrying} onClick={isError ? onRetry : onRestore}>
        {retrying ? <LoaderCircle className='animate-spin' /> : isError ? <RefreshCw /> : <ShieldCheck />}
        {retrying ? 'Retrying...' : isError ? 'Retry' : 'Restore sample'}
      </Button>
    </section>
  )
}

function SecurityOverview({ twoFactor, passkey, passwordUpdatedAt }: { twoFactor: boolean; passkey: boolean; passwordUpdatedAt: string }) {
  const statuses = [
    { label: 'Two-factor authentication', value: twoFactor ? 'Enabled' : 'Disabled', detail: twoFactor ? 'Authenticator verified' : 'Additional sign-in step off', icon: LockKeyhole, active: twoFactor },
    { label: 'Passkey', value: passkey ? 'Registered' : 'Not registered', detail: passkey ? 'Demo device credential' : 'No passkey on account', icon: Fingerprint, active: passkey },
    { label: 'Password', value: 'Current', detail: passwordUpdatedAt, icon: KeyRound, active: true, mono: true },
    { label: 'Current session', value: 'Active', detail: 'device_demo_7F3A · 26 Jul 14:18', icon: MonitorCheck, active: true, mono: true },
  ]

  return (
    <section className='overflow-hidden rounded-lg border'>
      <header className='border-b px-4 py-3'>
        <p className='text-xs font-medium text-muted-foreground'>SECURITY OVERVIEW</p>
        <h2 className='mt-0.5 text-base font-semibold'>Account protection status</h2>
      </header>
      <div className='grid sm:grid-cols-2 xl:grid-cols-4'>
        {statuses.map(({ label, value, detail, icon: Icon, active, mono }, index) => (
          <div key={label} className={`min-w-0 p-4 ${index === 1 ? 'border-t sm:border-s sm:border-t-0' : ''} ${index === 2 ? 'border-t xl:border-s xl:border-t-0' : ''} ${index === 3 ? 'border-t sm:border-s xl:border-t-0' : ''}`}>
            <div className='flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground'><Icon className='size-4 shrink-0' /><span className='break-words'>{label}</span></div>
            <Badge variant='outline' className='mt-3 max-w-full'><Check className={active ? 'text-success' : 'text-muted-foreground'} /><span className='break-words'>{value}</span></Badge>
            <p className={`mt-2 break-words text-xs text-muted-foreground ${mono ? 'font-mono tabular-nums' : ''}`}>{detail}</p>
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
  confirmLabel?: string
  processingLabel?: string
  hideFooter?: boolean
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
  children: ReactNode
}

function SecurityOverlay({ compact, title, description, processing, destructive, confirmLabel = 'Confirm', processingLabel = 'Processing...', hideFooter, triggerRef, onClose, onConfirm, children }: OverlayProps) {
  const closeAutoFocus = (event: Event) => { event.preventDefault(); triggerRef.current?.focus() }
  const changeOpen = (open: boolean) => { if (!open && !processing) onClose() }
  const footer = hideFooter ? null : (
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
          {footer ? <SheetFooter className='border-t'>{footer}</SheetFooter> : null}
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
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}

function TwoFactorSection({ enabled, processing, onSetup, onDisable }: { enabled: boolean; processing: boolean; onSetup: (event: MouseEvent<HTMLButtonElement>) => void; onDisable: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <section className='flex flex-col overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='AUTHENTICATOR' title='Two-factor authentication' description='Require a six-digit authenticator code when signing in.' icon={LockKeyhole} />
      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='flex items-center justify-between gap-3 rounded-md border px-3 py-2.5'>
          <div className='min-w-0'><p className='text-sm font-medium'>Authenticator app</p><p className='text-xs text-muted-foreground'>{enabled ? 'Protected with a demo TOTP setup.' : 'No authenticator is configured.'}</p></div>
          <Badge variant='outline' className='shrink-0'>{enabled ? 'Enabled' : 'Disabled'}</Badge>
        </div>
        <div className='mt-auto flex justify-end'>
          <Button variant={enabled ? 'outline' : 'default'} disabled={processing} onClick={enabled ? onDisable : onSetup}>
            {processing ? <LoaderCircle className='animate-spin' /> : <LockKeyhole />}{processing ? 'Processing...' : enabled ? 'Disable 2FA' : 'Set up 2FA'}
          </Button>
        </div>
      </div>
    </section>
  )
}

function PasskeySection({ registered, processing, onRegister, onRemove }: { registered: boolean; processing: boolean; onRegister: (event: MouseEvent<HTMLButtonElement>) => void; onRemove: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <section className='flex flex-col overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='DEVICE SIGN-IN' title='Passkey' description='Simulate a device-bound sign-in method without creating a credential.' icon={Fingerprint} />
      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='flex items-center justify-between gap-3 rounded-md border px-3 py-2.5'>
          <div className='min-w-0'><p className='text-sm font-medium'>This device</p><p className='break-words font-mono text-xs tabular-nums text-muted-foreground'>{registered ? 'passkey_demo_device_01 · Registered' : 'No credential registered'}</p></div>
          <Badge variant='outline' className='shrink-0'>{registered ? 'Ready' : 'Available'}</Badge>
        </div>
        <div className='mt-auto flex justify-end'>
          <Button variant={registered ? 'outline' : 'default'} disabled={processing} onClick={registered ? onRemove : onRegister}>
            {processing ? <LoaderCircle className='animate-spin' /> : <Fingerprint />}{processing ? 'Processing...' : registered ? 'Remove passkey' : 'Register passkey'}
          </Button>
        </div>
      </div>
    </section>
  )
}

function PasswordSection({ draft, errors, processing, onDraft, onSubmit, onCancel }: { draft: PasswordDraft; errors: PasswordErrors; processing: boolean; onDraft: (field: keyof PasswordDraft, value: string) => void; onSubmit: (event: MouseEvent<HTMLButtonElement>) => void; onCancel: () => void }) {
  const hasDraft = Boolean(draft.current || draft.next || draft.confirm)
  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='PASSWORD' title='Change password' description='Use at least 12 characters and choose a password not used here.' icon={ShieldCheck} />
      <form onSubmit={(event) => event.preventDefault()}>
        <fieldset disabled={processing} className='space-y-4 p-4'>
          <div className='space-y-2'>
            <Label htmlFor='security-current-password'>Current password</Label>
            <Input id='security-current-password' type='password' autoComplete='current-password' value={draft.current} aria-invalid={Boolean(errors.current)} aria-describedby={errors.current ? 'current-password-error' : undefined} onChange={(event) => onDraft('current', event.target.value)} />
            {errors.current ? <InlineError id='current-password-error'>{errors.current}</InlineError> : null}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='security-new-password'>New password</Label>
            <Input id='security-new-password' type='password' autoComplete='new-password' value={draft.next} aria-invalid={Boolean(errors.next)} aria-describedby={errors.next ? 'new-password-error' : undefined} onChange={(event) => onDraft('next', event.target.value)} />
            {errors.next ? <InlineError id='new-password-error'>{errors.next}</InlineError> : <p className='text-xs text-muted-foreground'>Minimum 12 characters.</p>}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='security-confirm-password'>Confirm new password</Label>
            <Input id='security-confirm-password' type='password' autoComplete='new-password' value={draft.confirm} aria-invalid={Boolean(errors.confirm)} aria-describedby={errors.confirm ? 'confirm-password-error' : undefined} onChange={(event) => onDraft('confirm', event.target.value)} />
            {errors.confirm ? <InlineError id='confirm-password-error'>{errors.confirm}</InlineError> : null}
          </div>
        </fieldset>
        <footer className='flex flex-col-reverse gap-2 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:justify-end'>
          <Button type='button' variant='outline' disabled={processing || !hasDraft} onClick={onCancel}>Cancel</Button>
          <Button type='button' disabled={processing} onClick={onSubmit}>{processing ? <LoaderCircle className='animate-spin' /> : <ShieldCheck />}{processing ? 'Updating...' : 'Update password'}</Button>
        </footer>
      </form>
    </section>
  )
}

function TokenSection({ token, processing, onGenerate, onRegenerate, onRevoke, onCopy }: { token: string | null; processing: boolean; onGenerate: (event: MouseEvent<HTMLButtonElement>) => void; onRegenerate: (event: MouseEvent<HTMLButtonElement>) => void; onRevoke: (event: MouseEvent<HTMLButtonElement>) => void; onCopy: () => void }) {
  return (
    <section className='overflow-hidden rounded-lg border border-destructive/30'>
      <div className='border-b border-destructive/20 bg-destructive/5'>
        <SectionHeading eyebrow='SENSITIVE CREDENTIAL' title='System access token' description='Demo-only account token controls. Values exist only in component memory.' icon={KeyRound} />
      </div>
      <div className='space-y-4 p-4'>
        <div className='min-w-0 rounded-md border bg-muted/20 p-3'>
          <div className='flex items-center justify-between gap-3'><p className='text-sm font-medium'>Token value</p><Badge variant='outline'>{token ? 'Demo active' : 'Masked'}</Badge></div>
          {token ? <code data-testid='demo-token-value' className='mt-3 block break-all font-mono text-xs tabular-nums'>{token}</code> : <code className='mt-3 block font-mono text-sm tracking-normal text-muted-foreground'>•••• •••• •••• ••••</code>}
        </div>
        <div className='flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end'>
          {token ? <Button variant='outline' disabled={processing} onClick={onCopy}><Clipboard />Copy</Button> : null}
          {token ? <Button variant='outline' disabled={processing} onClick={onRegenerate}><RefreshCw />Regenerate</Button> : <Button disabled={processing} onClick={onGenerate}><KeyRound />Generate token</Button>}
          {token ? <Button variant='destructive' disabled={processing} onClick={onRevoke}><Trash2 />Revoke</Button> : null}
        </div>
      </div>
    </section>
  )
}

export function ShadcnSecurityScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  const [pageState, setPageState] = useState<PageState>('ready')
  const [twoFactor, setTwoFactor] = useState(false)
  const [passkey, setPasskey] = useState(false)
  const [passwordUpdatedAt, setPasswordUpdatedAt] = useState(initialPasswordUpdatedAt)
  const [passwords, setPasswords] = useState<PasswordDraft>(emptyPasswords)
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [token, setToken] = useState<string | null>(null)
  const [operation, setOperation] = useState<SecurityOperation | null>(null)
  const [processing, setProcessing] = useState<ProcessingKind | null>(null)
  const [authenticatorCode, setAuthenticatorCode] = useState('')
  const [authenticatorError, setAuthenticatorError] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const compactOverlay = useCompactOverlay()

  const triggerRef = useRef<HTMLElement | null>(null)
  const retryTimerRef = useRef<number | null>(null)
  const twoFactorTimerRef = useRef<number | null>(null)
  const passkeyTimerRef = useRef<number | null>(null)
  const passwordTimerRef = useRef<number | null>(null)
  const tokenTimerRef = useRef<number | null>(null)
  const guardsRef = useRef<Record<ProcessingKind, boolean>>({ 'two-factor': false, passkey: false, password: false, token: false, retry: false })
  const processedOperationsRef = useRef(new Set<string>())
  const copyInFlightRef = useRef(false)
  const mountedRef = useRef(true)
  const tokenSequenceRef = useRef(0)

  const clearTimer = (timer: TimerRef) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  const clearAllTimers = () => {
    clearTimer(retryTimerRef)
    clearTimer(twoFactorTimerRef)
    clearTimer(passkeyTimerRef)
    clearTimer(passwordTimerRef)
    clearTimer(tokenTimerRef)
    Object.keys(guardsRef.current).forEach((key) => { guardsRef.current[key as ProcessingKind] = false })
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearAllTimers()
      copyInFlightRef.current = false
    }
  }, [])

  const newOperation = (kind: OperationKind): SecurityOperation => ({ id: `SECURITY-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind })

  const previewState = (state: PageState) => {
    clearAllTimers()
    setProcessing(null)
    setOperation(null)
    setAuthenticatorCode('')
    setAuthenticatorError('')
    setRecoveryCodes([])
    setPageState(state)
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
      toast.success('Security settings loaded', { description: 'The sample security workspace is ready.', duration: 5000, id: 'security-retry' })
    }, 800)
  }

  const openOperation = (kind: OperationKind, event: MouseEvent<HTMLButtonElement>) => {
    if (processing || guardsRef.current['two-factor'] || guardsRef.current.passkey || guardsRef.current.password || guardsRef.current.token) return
    triggerRef.current = event.currentTarget
    if (kind === 'setup-two-factor') {
      setAuthenticatorCode('')
      setAuthenticatorError('')
      setRecoveryCodes([])
    }
    setOperation(newOperation(kind))
  }

  const closeOperation = () => {
    if (processing) return
    setOperation(null)
    setAuthenticatorCode('')
    setAuthenticatorError('')
    setRecoveryCodes([])
  }

  const startOperation = (kind: Exclude<ProcessingKind, 'retry'>, timer: TimerRef, complete: (current: SecurityOperation) => void) => {
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

  const confirmTwoFactor = () => {
    if (!operation) return
    if (operation.kind === 'setup-two-factor') {
      if (!/^\d{6}$/.test(authenticatorCode)) {
        setAuthenticatorError('Enter the six-digit code from your authenticator.')
        return
      }
      if (authenticatorCode !== '246810') {
        setAuthenticatorError('That code is not valid. Use 246810 for this demo.')
        return
      }
      setAuthenticatorError('')
      startOperation('two-factor', twoFactorTimerRef, (current) => {
        setTwoFactor(true)
        setRecoveryCodes(recoveryCodeSample)
        setAuthenticatorCode('')
        setOperation({ ...current, kind: 'recovery-codes' })
        toast.success('Two-factor authentication enabled', { description: 'Store the demo recovery codes before closing.', duration: 6000, id: current.id })
      })
      return
    }
    if (operation.kind === 'disable-two-factor') {
      startOperation('two-factor', twoFactorTimerRef, (current) => {
        setTwoFactor(false)
        setRecoveryCodes([])
        setOperation(null)
        toast.success('Two-factor authentication disabled', { description: 'The sample account no longer requires an authenticator code.', duration: 5000, id: current.id })
      })
    }
  }

  const confirmPasskey = () => {
    if (!operation || (operation.kind !== 'register-passkey' && operation.kind !== 'remove-passkey')) return
    const registering = operation.kind === 'register-passkey'
    startOperation('passkey', passkeyTimerRef, (current) => {
      setPasskey(registering)
      setOperation(null)
      toast.success(registering ? 'Passkey registered' : 'Passkey removed', { description: registering ? 'A demo passkey is now shown for this device.' : 'No real credential was changed.', duration: 5000, id: current.id })
    })
  }

  const validatePasswords = () => {
    const errors: PasswordErrors = {}
    if (!passwords.current) errors.current = 'Enter your current password.'
    if (!passwords.next) errors.next = 'Enter a new password.'
    else if (passwords.next.length < 12) errors.next = 'Use at least 12 characters.'
    else if (passwords.next === passwords.current) errors.next = 'Choose a password different from the current password.'
    if (!passwords.confirm) errors.confirm = 'Confirm your new password.'
    else if (passwords.confirm !== passwords.next) errors.confirm = 'The new passwords do not match.'
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitPassword = (event: MouseEvent<HTMLButtonElement>) => {
    if (processing || guardsRef.current.password || !validatePasswords()) return
    triggerRef.current = event.currentTarget
    setOperation(newOperation('change-password'))
  }

  const updatePasswordDraft = (field: keyof PasswordDraft, value: string) => {
    setPasswords((current) => ({ ...current, [field]: value }))
    setPasswordErrors((current) => ({ ...current, [field]: undefined }))
  }

  const cancelPasswordDraft = () => {
    if (processing) return
    setPasswords(emptyPasswords)
    setPasswordErrors({})
  }

  const confirmPassword = () => {
    if (!operation || operation.kind !== 'change-password' || !validatePasswords()) return
    startOperation('password', passwordTimerRef, (current) => {
      setPasswordUpdatedAt('2026-07-26 14:24 UTC+8')
      setPasswords(emptyPasswords)
      setPasswordErrors({})
      setOperation(null)
      toast.success('Password updated', { description: 'All password fields were cleared after the demo update.', duration: 5000, id: current.id })
    })
  }

  const createDemoToken = () => {
    tokenSequenceRef.current += 1
    return `pt_sys_demo_R45_${String(tokenSequenceRef.current).padStart(2, '0')}_TEMPORARY`
  }

  const confirmToken = () => {
    if (!operation || !['generate-token', 'regenerate-token', 'revoke-token'].includes(operation.kind)) return
    const kind = operation.kind
    startOperation('token', tokenTimerRef, (current) => {
      const revoking = kind === 'revoke-token'
      setToken(revoking ? null : createDemoToken())
      setOperation(null)
      toast.success(revoking ? 'Demo token revoked' : kind === 'regenerate-token' ? 'Demo token regenerated' : 'Demo token generated', { description: revoking ? 'The temporary value was removed from component memory.' : 'The temporary demo value exists only until this page reloads.', duration: 6000, id: current.id })
    })
  }

  const copyText = async (value: string, label: string) => {
    if (copyInFlightRef.current || processing) return
    copyInFlightRef.current = true
    try {
      await navigator.clipboard.writeText(value)
      if (mountedRef.current) toast.success(`${label} copied`, { description: 'Copied from this local demo only.', duration: 4000, id: `security-copy-${label}` })
    } catch {
      if (mountedRef.current) toast.error(`Could not copy ${label.toLowerCase()}`, { description: 'Clipboard access was not available.', duration: 5000, id: `security-copy-${label}` })
    } finally {
      copyInFlightRef.current = false
    }
  }

  let overlay: ReactNode = null
  if (operation) {
    const isProcessing = processing !== null
    if (operation.kind === 'setup-two-factor') {
      overlay = (
        <SecurityOverlay compact={compactOverlay} title='Set up two-factor authentication' description='Enter the demo secret in an authenticator, then verify the six-digit code.' processing={isProcessing} confirmLabel='Enable 2FA' processingLabel='Enabling...' triggerRef={triggerRef} onClose={closeOperation} onConfirm={confirmTwoFactor}>
          <div className='space-y-4'>
            <div className='flex items-start gap-3 rounded-md border bg-muted/30 p-3'><KeyRound className='mt-0.5 size-4 shrink-0' /><div className='min-w-0'><p className='text-xs text-muted-foreground'>Demo manual setup key</p><code className='mt-1 block break-all font-mono text-xs tabular-nums'>{setupSecret}</code><p className='mt-2 text-xs text-muted-foreground'>This is inert sample text, not a working TOTP secret.</p></div></div>
            <div className='space-y-2'><Label htmlFor='security-authenticator-code'>Authenticator code</Label><Input id='security-authenticator-code' inputMode='numeric' autoComplete='one-time-code' maxLength={6} placeholder='000000' className='font-mono tabular-nums' value={authenticatorCode} disabled={isProcessing} aria-invalid={Boolean(authenticatorError)} aria-describedby={authenticatorError ? 'authenticator-code-error' : 'authenticator-code-help'} onChange={(event) => { setAuthenticatorCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setAuthenticatorError('') }} />{authenticatorError ? <InlineError id='authenticator-code-error'>{authenticatorError}</InlineError> : <p id='authenticator-code-help' className='text-xs text-muted-foreground'>Use <code className='font-mono'>246810</code> for this preview.</p>}</div>
          </div>
        </SecurityOverlay>
      )
    } else if (operation.kind === 'recovery-codes') {
      overlay = (
        <SecurityOverlay compact={compactOverlay} title='Save recovery codes' description='These one-time demo codes are held only in this component and disappear when this layer closes.' processing={false} hideFooter triggerRef={triggerRef} onClose={closeOperation} onConfirm={() => undefined}>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border'>{recoveryCodes.map((code) => <code key={code} className='min-w-0 break-all bg-background px-2 py-2 text-center font-mono text-xs tabular-nums'>{code}</code>)}</div>
            <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'><Button variant='outline' onClick={() => void copyText(recoveryCodes.join('\n'), 'Recovery codes')}><Clipboard />Copy codes</Button><Button onClick={closeOperation}><Check />I saved them</Button></div>
          </div>
        </SecurityOverlay>
      )
    } else {
      const details: Record<Exclude<OperationKind, 'setup-two-factor' | 'recovery-codes'>, { title: string; description: string; label: string; processingLabel: string; destructive?: boolean }> = {
        'disable-two-factor': { title: 'Disable two-factor authentication?', description: 'Future demo sign-ins will no longer require an authenticator code.', label: 'Disable 2FA', processingLabel: 'Disabling...', destructive: true },
        'register-passkey': { title: 'Register a demo passkey?', description: 'This only simulates registration. No WebAuthn request or credential will be created.', label: 'Register passkey', processingLabel: 'Registering...' },
        'remove-passkey': { title: 'Remove the demo passkey?', description: 'The passkey status will be cleared from this component.', label: 'Remove passkey', processingLabel: 'Removing...', destructive: true },
        'change-password': { title: 'Update password?', description: 'This local simulation will clear all password fields. No value is sent or stored.', label: 'Update password', processingLabel: 'Updating...' },
        'generate-token': { title: 'Generate a demo access token?', description: 'A clearly marked temporary value will be created only in component memory.', label: 'Generate token', processingLabel: 'Generating...' },
        'regenerate-token': { title: 'Regenerate the demo token?', description: 'The current temporary value will be replaced and cannot be recovered.', label: 'Regenerate token', processingLabel: 'Regenerating...', destructive: true },
        'revoke-token': { title: 'Revoke the demo token?', description: 'The temporary value will be removed from component memory.', label: 'Revoke token', processingLabel: 'Revoking...', destructive: true },
      }
      const detail = details[operation.kind]
      const confirm = operation.kind === 'disable-two-factor' ? confirmTwoFactor : operation.kind.includes('passkey') ? confirmPasskey : operation.kind === 'change-password' ? confirmPassword : confirmToken
      overlay = (
        <SecurityOverlay compact={compactOverlay} title={detail.title} description={detail.description} processing={isProcessing} destructive={detail.destructive} confirmLabel={detail.label} processingLabel={detail.processingLabel} triggerRef={triggerRef} onClose={closeOperation} onConfirm={confirm}>
          <div className={`flex items-start gap-3 rounded-md border p-3 ${detail.destructive ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/30'}`}><AlertCircle className={`mt-0.5 size-4 shrink-0 ${detail.destructive ? 'text-destructive' : 'text-muted-foreground'}`} /><p className='text-sm text-muted-foreground'>{detail.description}</p></div>
        </SecurityOverlay>
      )
    }
  }

  return (
    <ConsoleShell activeRoute='console-security' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'><h1 className='text-2xl font-bold tracking-tight'>Security</h1><p className='mt-1 text-muted-foreground'>Manage sign-in protection, password, and sensitive account access.</p></div>
        <fieldset disabled={processing !== null} className='m-0 shrink-0 border-0 p-0'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant='outline' size='icon' aria-label='More security actions'><Ellipsis /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuLabel>Preview security state</DropdownMenuLabel>
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

      {pageState === 'loading' ? <SecurityLoading /> : null}
      {pageState === 'empty' || pageState === 'error' ? <SecurityUnavailable state={pageState} retrying={processing === 'retry'} onRetry={retry} onRestore={() => previewState('ready')} /> : null}
      {pageState === 'ready' ? (
        <>
          <SecurityOverview twoFactor={twoFactor} passkey={passkey} passwordUpdatedAt={passwordUpdatedAt} />
          <div className='grid items-stretch gap-4 lg:grid-cols-2'>
            <TwoFactorSection enabled={twoFactor} processing={processing === 'two-factor'} onSetup={(event) => openOperation('setup-two-factor', event)} onDisable={(event) => openOperation('disable-two-factor', event)} />
            <PasskeySection registered={passkey} processing={processing === 'passkey'} onRegister={(event) => openOperation('register-passkey', event)} onRemove={(event) => openOperation('remove-passkey', event)} />
            <PasswordSection draft={passwords} errors={passwordErrors} processing={processing === 'password'} onDraft={updatePasswordDraft} onSubmit={submitPassword} onCancel={cancelPasswordDraft} />
            <TokenSection token={token} processing={processing === 'token'} onGenerate={(event) => openOperation('generate-token', event)} onRegenerate={(event) => openOperation('regenerate-token', event)} onRevoke={(event) => openOperation('revoke-token', event)} onCopy={() => { if (token) void copyText(token, 'Demo token') }} />
          </div>
        </>
      ) : null}

      {overlay}
    </ConsoleShell>
  )
}
