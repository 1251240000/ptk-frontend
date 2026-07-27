import {
  AlertCircle,
  Check,
  CheckCircle2,
  Ellipsis,
  KeyRound,
  Languages,
  LoaderCircle,
  MailCheck,
  MonitorCheck,
  RefreshCw,
  Save,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'

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
  toast,
} from '@partokens/design-system/components'

import { ConsoleShell, type ConsoleScreenProps } from './shadcn-console-shell'

type ProfileState = 'ready' | 'loading' | 'empty' | 'error'

type Profile = {
  displayName: string
  email: string
  username: string
  timezone: string
  language: string
  createdAt: string
  accountId: string
}

type ProfileField = Exclude<keyof Profile, 'createdAt' | 'accountId'>

type SaveOperation = {
  id: string
  profile: Profile
  changes: Array<{ label: string; previous: string; next: string }>
}

const sampleProfile: Profile = {
  displayName: 'Mika Chen',
  email: 'mika@partokens.com',
  username: 'mika',
  timezone: 'Asia/Shanghai',
  language: 'English',
  createdAt: '2024-11-08',
  accountId: 'acct_01JBY7M6VX2R8P3KTZ9A4H1QNE',
}

const editableFields: Array<{ key: ProfileField; label: string }> = [
  { key: 'displayName', label: 'Display name' },
  { key: 'email', label: 'Email' },
  { key: 'username', label: 'Username' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'language', label: 'Interface language' },
]

const timezones = ['Asia/Shanghai', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'UTC']
const languages = ['English', '简体中文', 'Français', '日本語', 'Русский']

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

function ProfileLoading() {
  return (
    <div aria-label='Loading profile' aria-busy='true' className='space-y-4'>
      <section className='overflow-hidden rounded-lg border'>
        <div className='space-y-2 border-b px-4 py-3'><Skeleton className='h-3 w-24' /><Skeleton className='h-5 w-44' /></div>
        <div className='grid gap-4 p-4 sm:grid-cols-2'>
          {Array.from({ length: 6 }, (_, index) => <div key={index} className='space-y-2'><Skeleton className='h-4 w-28' /><Skeleton className='h-9 w-full' /></div>)}
        </div>
        <div className='flex justify-end border-t p-4'><Skeleton className='h-9 w-32' /></div>
      </section>
      <section className='overflow-hidden rounded-lg border'>
        <div className='space-y-2 border-b px-4 py-3'><Skeleton className='h-3 w-28' /><Skeleton className='h-5 w-36' /></div>
        <div className='grid sm:grid-cols-3'>{Array.from({ length: 3 }, (_, index) => <div key={index} className='space-y-2 border-t p-4 first:border-t-0 sm:border-s sm:border-t-0 sm:first:border-s-0'><Skeleton className='h-4 w-28' /><Skeleton className='h-6 w-20' /></div>)}</div>
      </section>
    </div>
  )
}

function ProfileUnavailable({ state, retrying, onRetry, onRestore }: { state: 'empty' | 'error'; retrying: boolean; onRetry: () => void; onRestore: () => void }) {
  const isError = state === 'error'
  return (
    <section className='flex min-h-72 flex-col items-center justify-center rounded-lg border px-4 py-12 text-center'>
      <span className='flex size-10 items-center justify-center rounded-md border bg-muted/40'>{isError ? <AlertCircle className='size-5 text-destructive' /> : <UserRound className='size-5 text-muted-foreground' />}</span>
      <h2 className='mt-4 text-base font-semibold'>{isError ? 'Profile unavailable' : 'No profile details'}</h2>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>{isError ? 'The account profile could not be loaded. Retry the simulated request.' : 'This preview represents an account without profile details.'}</p>
      <Button className='mt-4' variant='outline' disabled={retrying} onClick={isError ? onRetry : onRestore}>
        {retrying ? <LoaderCircle className='animate-spin' /> : isError ? <RefreshCw /> : <UserRound />}
        {retrying ? 'Retrying...' : isError ? 'Retry' : 'Restore sample'}
      </Button>
    </section>
  )
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className='border-b px-4 py-3'>
      <p className='text-xs font-medium text-muted-foreground'>{eyebrow}</p>
      <h2 className='mt-0.5 text-base font-semibold'>{title}</h2>
      {description ? <p className='mt-1 text-sm text-muted-foreground'>{description}</p> : null}
    </header>
  )
}

function FieldMessage({ id, children }: { id: string; children: string }) {
  return <p id={id} role='alert' className='flex items-center gap-1.5 text-xs text-destructive'><AlertCircle className='size-3.5' />{children}</p>
}

function ProfileForm({
  profile,
  draft,
  processing,
  onDraft,
  onSave,
}: {
  profile: Profile
  draft: Profile
  processing: boolean
  onDraft: (field: ProfileField, value: string) => void
  onSave: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const displayNameError = draft.displayName.trim().length < 2 ? 'Enter at least 2 characters.' : ''
  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) ? '' : 'Enter a valid email address.'
  const usernameError = /^[a-z0-9_]{3,24}$/.test(draft.username) ? '' : 'Use 3-24 lowercase letters, numbers, or underscores.'
  const invalid = Boolean(displayNameError || emailError || usernameError)
  const changed = editableFields.some(({ key }) => draft[key] !== profile[key])

  return (
    <form className='overflow-hidden rounded-lg border' onSubmit={(event) => event.preventDefault()}>
      <SectionHeading eyebrow='PROFILE DETAILS' title='Personal information' description='Update the identity and locale shown across your account.' />
      <fieldset disabled={processing} className='grid gap-4 p-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='profile-display-name'>Display name</Label>
          <Input id='profile-display-name' autoComplete='name' value={draft.displayName} aria-invalid={Boolean(displayNameError)} aria-describedby={displayNameError ? 'display-name-error' : undefined} onChange={(event) => onDraft('displayName', event.target.value)} />
          {displayNameError ? <FieldMessage id='display-name-error'>{displayNameError}</FieldMessage> : <p className='text-xs text-muted-foreground'>Used in the console and account menus.</p>}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='profile-email'>Email</Label>
          <Input id='profile-email' type='email' autoComplete='email' value={draft.email} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? 'email-error' : undefined} onChange={(event) => onDraft('email', event.target.value)} />
          {emailError ? <FieldMessage id='email-error'>{emailError}</FieldMessage> : <p className='text-xs text-muted-foreground'>Used for account notices and recovery.</p>}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='profile-username'>Username</Label>
          <Input id='profile-username' autoComplete='username' spellCheck={false} value={draft.username} aria-invalid={Boolean(usernameError)} aria-describedby={usernameError ? 'username-error' : undefined} onChange={(event) => onDraft('username', event.target.value.toLowerCase())} />
          {usernameError ? <FieldMessage id='username-error'>{usernameError}</FieldMessage> : <p className='text-xs text-muted-foreground'>Your unique account handle.</p>}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='profile-timezone'>Timezone</Label>
          <Select disabled={processing} value={draft.timezone} onValueChange={(value) => onDraft('timezone', value)}>
            <SelectTrigger id='profile-timezone' className='w-full'><SelectValue /></SelectTrigger>
            <SelectContent>{timezones.map((timezone) => <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>)}</SelectContent>
          </Select>
          <p className='text-xs text-muted-foreground'>Controls dates shown in account activity.</p>
        </div>
        <div className='space-y-2 sm:col-span-2'>
          <Label htmlFor='profile-language'>Interface language</Label>
          <Select disabled={processing} value={draft.language} onValueChange={(value) => onDraft('language', value)}>
            <SelectTrigger id='profile-language' className='w-full sm:max-w-[calc(50%-0.5rem)]'><Languages /><SelectValue /></SelectTrigger>
            <SelectContent>{languages.map((language) => <SelectItem key={language} value={language}>{language}</SelectItem>)}</SelectContent>
          </Select>
          <p className='text-xs text-muted-foreground'>Applies to product interface copy in this preview.</p>
        </div>
      </fieldset>
      <footer className='flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-xs text-muted-foreground'>{processing ? 'Saving the confirmed profile...' : changed ? 'Unsaved changes are ready to review.' : 'Profile is up to date.'}</p>
        <Button type='button' className='w-full sm:w-auto' disabled={processing || invalid || !changed} onClick={onSave}>
          {processing ? <LoaderCircle className='animate-spin' /> : <Save />}{processing ? 'Saving...' : 'Save changes'}
        </Button>
      </footer>
    </form>
  )
}

function AccountMetadata({ profile }: { profile: Profile }) {
  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='ACCOUNT' title='Account record' description='Stable identifiers and account lifecycle details.' />
      <dl className='divide-y text-sm'>
        <div className='grid gap-1 px-4 py-3'><dt className='text-xs text-muted-foreground'>Account creation date</dt><dd className='font-mono font-medium tabular-nums'>{profile.createdAt}</dd></div>
        <div className='grid min-w-0 gap-1 px-4 py-3'><dt className='text-xs text-muted-foreground'>Account ID</dt><dd className='break-all font-mono text-xs font-medium tabular-nums'>{profile.accountId}</dd></div>
      </dl>
    </section>
  )
}

function AccountStatus() {
  const statuses = [
    { label: 'Email verification', value: 'Verified', detail: 'Primary email confirmed', icon: MailCheck },
    { label: 'Session status', value: 'Current', detail: 'Secure browser session', icon: MonitorCheck },
    { label: 'API access', value: 'Active', detail: 'Account API enabled', icon: KeyRound },
  ]

  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='ACCOUNT STATUS' title='Access and verification' description='Current identity, session, and API availability.' />
      <div className='grid sm:grid-cols-3'>
        {statuses.map(({ label, value, detail, icon: Icon }, index) => (
          <div key={label} className={`min-w-0 p-4 ${index ? 'border-t sm:border-s sm:border-t-0' : ''}`}>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground'><Icon className='size-4' />{label}</div>
            <Badge variant='outline' className='mt-3'><Check className='text-emerald-600' />{value}</Badge>
            <p className='mt-2 text-xs text-muted-foreground'>{detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function SaveConfirmation({
  operation,
  processing,
  compact,
  triggerRef,
  onClose,
  onConfirm,
}: {
  operation: SaveOperation
  processing: boolean
  compact: boolean
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
}) {
  const body = (
    <div className='divide-y rounded-md border'>
      {operation.changes.map((change) => (
        <div key={change.label} className='grid min-w-0 gap-1 px-3 py-2 text-sm'>
          <span className='text-xs text-muted-foreground'>{change.label}</span>
          <span className='break-words font-medium'>{change.next}</span>
        </div>
      ))}
    </div>
  )
  const footer = (
    <>
      <Button variant='outline' disabled={processing} onClick={onClose}>Cancel</Button>
      <Button disabled={processing} onClick={onConfirm}>
        {processing ? <LoaderCircle className='animate-spin' /> : <CheckCircle2 />}{processing ? 'Saving...' : 'Confirm and save'}
      </Button>
    </>
  )
  const closeAutoFocus = (event: Event) => { event.preventDefault(); triggerRef.current?.focus() }
  const changeOpen = (open: boolean) => { if (!open && !processing) onClose() }

  if (compact) {
    return (
      <Sheet open onOpenChange={changeOpen}>
        <SheetContent
          side='bottom'
          className={`max-h-[90svh] overflow-y-auto ${processing ? '[&>button]:pointer-events-none [&>button]:opacity-50' : ''}`}
          onCloseAutoFocus={closeAutoFocus}
          onEscapeKeyDown={(event) => { if (processing) event.preventDefault() }}
          onInteractOutside={(event) => { if (processing) event.preventDefault() }}
        >
          <SheetHeader><SheetTitle>Review profile changes</SheetTitle><SheetDescription>Confirm the fields to update in this local preview.</SheetDescription></SheetHeader>
          <div className='px-4'>{body}</div>
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
        <DialogHeader><DialogTitle>Review profile changes</DialogTitle><DialogDescription>Confirm the fields to update in this local preview.</DialogDescription></DialogHeader>
        {body}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ShadcnProfileScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  const [profile, setProfile] = useState(sampleProfile)
  const [draft, setDraft] = useState(sampleProfile)
  const [profileState, setProfileState] = useState<ProfileState>('ready')
  const [retrying, setRetrying] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [operation, setOperation] = useState<SaveOperation | null>(null)
  const compactOverlay = useCompactOverlay()
  const saveTriggerRef = useRef<HTMLElement | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const retryTimerRef = useRef<number | null>(null)
  const inFlightRef = useRef(false)
  const processedOperationsRef = useRef(new Set<string>())

  const clearTimer = (timer: { current: number | null }) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => () => {
    clearTimer(saveTimerRef)
    clearTimer(retryTimerRef)
    inFlightRef.current = false
  }, [])

  const updateDraft = (field: ProfileField, value: string) => setDraft((current) => ({ ...current, [field]: value }))

  const previewState = (state: ProfileState) => {
    clearTimer(retryTimerRef)
    setRetrying(false)
    setProfileState(state)
  }

  const retry = () => {
    if (retrying) return
    clearTimer(retryTimerRef)
    setRetrying(true)
    retryTimerRef.current = window.setTimeout(() => {
      setProfileState('ready')
      setRetrying(false)
      retryTimerRef.current = null
      toast.success('Profile loaded', { description: 'Sample account details are ready.', duration: 5000 })
    }, 800)
  }

  const openSaveConfirmation = (event: MouseEvent<HTMLButtonElement>) => {
    if (processing || inFlightRef.current) return
    clearTimer(saveTimerRef)
    saveTriggerRef.current = event.currentTarget
    const changes = editableFields
      .filter(({ key }) => draft[key] !== profile[key])
      .map(({ key, label }) => ({ label, previous: profile[key], next: draft[key] }))
    if (!changes.length) return
    setOperation({ id: `PROFILE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, profile: { ...draft }, changes })
  }

  const closeConfirmation = () => {
    if (processing || inFlightRef.current) return
    clearTimer(saveTimerRef)
    setOperation(null)
  }

  const confirmSave = () => {
    if (!operation || processing || inFlightRef.current || processedOperationsRef.current.has(operation.id)) return
    const current = operation
    clearTimer(saveTimerRef)
    inFlightRef.current = true
    setProcessing(true)
    saveTimerRef.current = window.setTimeout(() => {
      if (processedOperationsRef.current.has(current.id)) return
      processedOperationsRef.current.add(current.id)
      setProfile(current.profile)
      setDraft(current.profile)
      setOperation(null)
      setProcessing(false)
      inFlightRef.current = false
      saveTimerRef.current = null
      toast.success('Profile updated', { description: `${current.changes.length} ${current.changes.length === 1 ? 'field' : 'fields'} saved for this preview.`, duration: 6000 })
    }, 900)
  }

  return (
    <ConsoleShell activeRoute='console-profile' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <div className='flex flex-row items-start justify-between gap-4'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-bold tracking-tight'>Profile</h1>
          <p className='mt-1 text-muted-foreground'>Manage account identity, locale, and access status.</p>
        </div>
        <fieldset disabled={processing || retrying} className='m-0 shrink-0 border-0 p-0'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant='outline' size='icon' aria-label='More profile actions'><Ellipsis /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuLabel>Preview profile state</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={profileState} onValueChange={(value) => previewState(value as ProfileState)}>
                <DropdownMenuRadioItem value='ready'>Sample</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='loading'>Loading</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='empty'>Empty</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='error'>Error</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </fieldset>
      </div>

      {profileState === 'loading' ? <ProfileLoading /> : null}
      {profileState === 'empty' || profileState === 'error' ? <ProfileUnavailable state={profileState} retrying={retrying} onRetry={retry} onRestore={() => previewState('ready')} /> : null}
      {profileState === 'ready' ? (
        <>
          <div className='grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]'>
            <ProfileForm profile={profile} draft={draft} processing={processing} onDraft={updateDraft} onSave={openSaveConfirmation} />
            <AccountMetadata profile={profile} />
          </div>
          <AccountStatus />
        </>
      ) : null}

      {operation ? <SaveConfirmation operation={operation} processing={processing} compact={compactOverlay} triggerRef={saveTriggerRef} onClose={closeConfirmation} onConfirm={confirmSave} /> : null}
    </ConsoleShell>
  )
}
