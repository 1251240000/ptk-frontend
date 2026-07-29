import {
  AlertCircle,
  BellRing,
  Check,
  CheckCircle2,
  CircleUserRound,
  Fingerprint,
  Github,
  Globe2,
  KeyRound,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MailCheck,
  MonitorCheck,
  Radio,
  Save,
  ShieldCheck,
  Unplug,
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@partokens/design-system/components'

import { ConsoleShell, consoleLanguageOptions, useConsoleLanguage, type ConsoleLanguage, type ConsoleScreenProps } from './shadcn-console-shell'

type ProfileTab = 'profile' | 'security' | 'connections' | 'notifications'
type Profile = {
  displayName: string
  email: string
  username: string
  timezone: string
  language: string
  createdAt: string
}
type ProfileField = Exclude<keyof Profile, 'createdAt'>
type SaveOperation = {
  id: string
  profile: Profile
  changes: Array<{ label: string; next: string }>
}
type ProviderId = 'github' | 'linuxdo' | 'google'
type NotificationChannel = 'email' | 'webhook' | 'bark' | 'gotify'
type NotificationPreferences = {
  deliveryEnabled: boolean
  channel: NotificationChannel
  destination: string
  balanceEnabled: boolean
  balanceThreshold: string
  allowUnpriced: boolean
  recordRequestIp: boolean
}

const sampleProfile: Profile = {
  displayName: 'Mika Chen',
  email: 'mika@partokens.com',
  username: 'mika',
  timezone: 'Asia/Shanghai',
  language: 'English',
  createdAt: '2024-11-08',
}

const editableFields: Array<{ key: ProfileField; label: string }> = [
  { key: 'displayName', label: 'Display name' },
  { key: 'email', label: 'Email' },
  { key: 'username', label: 'Username' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'language', label: 'Interface language' },
]

const timezones = ['Asia/Shanghai', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'UTC']
const languages = consoleLanguageOptions.map((option) => option.label)
const channelLabels: Record<NotificationChannel, string> = {
  email: 'Email',
  webhook: 'Webhook',
  bark: 'Bark',
  gotify: 'Gotify',
}
const channelDestinations: Record<NotificationChannel, string> = {
  email: sampleProfile.email,
  webhook: 'https://hooks.example.invalid/notify',
  bark: 'https://bark.example.invalid/device',
  gotify: 'https://gotify.example.invalid/message',
}
const initialNotifications: NotificationPreferences = {
  deliveryEnabled: true,
  channel: 'email',
  destination: sampleProfile.email,
  balanceEnabled: true,
  balanceThreshold: '10.00',
  allowUnpriced: false,
  recordRequestIp: false,
}

function SectionHeading({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon?: typeof CircleUserRound }) {
  return (
    <header className='flex items-start gap-3 border-b px-4 py-3'>
      {Icon ? <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40'><Icon className='size-4' /></span> : null}
      <div className='min-w-0'>
        <p className='text-xs font-medium text-muted-foreground'>{eyebrow}</p>
        <h2 className='mt-0.5 text-base font-semibold'>{title}</h2>
        <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      </div>
    </header>
  )
}

function FieldMessage({ id, children }: { id: string; children: string }) {
  return <p id={id} role='alert' className='flex items-start gap-1.5 text-xs text-destructive'><AlertCircle className='mt-0.5 size-3.5 shrink-0' />{children}</p>
}

function ProfileForm({ profile, draft, processing, onDraft, onSave }: {
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
      <SectionHeading eyebrow='PROFILE DETAILS' title='Personal information' description='Update the identity and locale shown across your account.' icon={CircleUserRound} />
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
            <SelectTrigger id='profile-language' className='w-full sm:max-w-[calc(50%-0.5rem)]'><Globe2 /><SelectValue /></SelectTrigger>
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

function AccountSummary({ profile }: { profile: Profile }) {
  const rows = [
    { label: 'Email', value: 'Verified', detail: profile.email, icon: MailCheck },
    { label: 'Session', value: 'Current', detail: 'Secure browser session', icon: MonitorCheck },
    { label: 'API access', value: 'Active', detail: 'Account API enabled', icon: KeyRound },
  ]

  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='ACCOUNT' title='Account status' description={`Member since ${profile.createdAt}.`} icon={ShieldCheck} />
      <div className='divide-y'>
        {rows.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className='flex min-w-0 items-start gap-3 px-4 py-3'>
            <Icon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
            <div className='min-w-0 flex-1'><p className='text-sm font-medium'>{label}</p><p className='mt-0.5 truncate text-xs text-muted-foreground'>{detail}</p></div>
            <Badge variant='outline' className='shrink-0'><Check className='text-emerald-600' />{value}</Badge>
          </div>
        ))}
      </div>
    </section>
  )
}

function SecuritySettings({ twoFactor, passkey, onTwoFactor, onPasskey, onPassword }: {
  twoFactor: boolean
  passkey: boolean
  onTwoFactor: (checked: boolean) => void
  onPasskey: () => void
  onPassword: () => void
}) {
  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='SIGN-IN & RECOVERY' title='Account security' description='Manage the sign-in methods used to protect this account.' icon={ShieldCheck} />
      <div className='divide-y'>
        <div className='grid min-w-0 gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
          <div className='flex min-w-0 items-start gap-3'><KeyRound className='mt-0.5 size-4 shrink-0 text-muted-foreground' /><div><Label>Password</Label><p className='mt-1 text-xs text-muted-foreground'>Last changed June 18, 2026.</p></div></div>
          <Button variant='outline' onClick={onPassword}><KeyRound />Change password</Button>
        </div>
        <div className='flex min-w-0 items-start gap-4 px-4 py-4'>
          <LockKeyhole className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
          <div className='min-w-0 flex-1'><Label htmlFor='profile-two-factor'>Two-factor authentication</Label><p className='mt-1 text-xs text-muted-foreground'>Require an authenticator code after your password.</p></div>
          <Switch id='profile-two-factor' className='shrink-0' checked={twoFactor} onCheckedChange={onTwoFactor} />
        </div>
        <div className='grid min-w-0 gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
          <div className='flex min-w-0 items-start gap-3'><Fingerprint className='mt-0.5 size-4 shrink-0 text-muted-foreground' /><div><Label>Passkey</Label><p className='mt-1 text-xs text-muted-foreground'>{passkey ? 'A passkey is registered on this device.' : 'Use a device-bound credential for faster sign-in.'}</p></div></div>
          <Button variant='outline' onClick={onPasskey}><Fingerprint />{passkey ? 'Remove passkey' : 'Add passkey'}</Button>
        </div>
        <div className='flex min-w-0 items-start gap-3 px-4 py-4'>
          <MonitorCheck className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
          <div className='min-w-0 flex-1'><Label>Current session</Label><p className='mt-1 text-xs text-muted-foreground'>Shanghai, China · Active now</p></div>
          <Badge variant='outline' className='shrink-0'><Check className='text-emerald-600' />Current</Badge>
        </div>
      </div>
    </section>
  )
}

function ConnectedAccounts({ connected, onToggle }: { connected: Record<ProviderId, boolean>; onToggle: (provider: ProviderId) => void }) {
  const providers: Array<{ id: 'email' | ProviderId; name: string; description: string; icon: typeof Mail }> = [
    { id: 'email', name: 'Email', description: sampleProfile.email, icon: Mail },
    { id: 'github', name: 'GitHub', description: 'Use your GitHub identity to sign in.', icon: Github },
    { id: 'linuxdo', name: 'LinuxDO', description: 'Connect your LinuxDO community account.', icon: Globe2 },
    { id: 'google', name: 'Google', description: 'Use Google or a configured OIDC provider.', icon: Link2 },
  ]

  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='CONNECTED ACCOUNTS' title='Sign-in connections' description='Keep only the identity providers you use to access Partokens.' icon={Link2} />
      <div className='divide-y'>
        {providers.map(({ id, name, description, icon: Icon }) => {
          const isEmail = id === 'email'
          const isConnected = isEmail || connected[id]
          return (
            <div key={id} className='grid min-w-0 gap-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center'>
              <span className='flex size-9 items-center justify-center rounded-md border bg-muted/40'><Icon className='size-4' /></span>
              <div className='min-w-0'><div className='flex flex-wrap items-center gap-2'><p className='text-sm font-medium'>{name}</p><Badge variant='outline'>{isConnected ? <Check className='text-emerald-600' /> : null}{isEmail ? 'Primary' : isConnected ? 'Connected' : 'Available'}</Badge></div><p className='mt-1 text-xs text-muted-foreground'>{description}</p></div>
              {isEmail ? null : <Button variant='outline' onClick={() => onToggle(id)}>{isConnected ? <Unplug /> : <Link2 />}{isConnected ? 'Disconnect' : 'Connect'}</Button>}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function NotificationsSettings({ saved, draft, onDraft, onSave }: {
  saved: NotificationPreferences
  draft: NotificationPreferences
  onDraft: (patch: Partial<NotificationPreferences>) => void
  onSave: () => void
}) {
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft)
  const threshold = Number(draft.balanceThreshold)
  const thresholdInvalid = draft.balanceEnabled && (!Number.isFinite(threshold) || threshold < 0.01)
  const destinationInvalid = draft.deliveryEnabled && (draft.channel === 'email'
    ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.destination.trim())
    : (() => { try { return !new URL(draft.destination).hostname } catch { return true } })())
  const invalid = thresholdInvalid || destinationInvalid

  return (
    <form className='overflow-hidden rounded-lg border' onSubmit={(event) => { event.preventDefault(); if (!invalid && dirty) onSave() }}>
      <SectionHeading eyebrow='NOTIFICATIONS' title='Alerts and request preferences' description='Choose where account alerts go and how private request metadata is handled.' icon={BellRing} />
      <div className='divide-y'>
        <div className='flex min-w-0 items-start gap-4 px-4 py-4'>
          <BellRing className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
          <div className='min-w-0 flex-1'><Label htmlFor='profile-notifications-enabled'>Account notifications</Label><p className='mt-1 text-xs text-muted-foreground'>Send security and balance alerts through the selected channel.</p></div>
          <Switch id='profile-notifications-enabled' className='shrink-0' checked={draft.deliveryEnabled} onCheckedChange={(deliveryEnabled) => onDraft({ deliveryEnabled })} />
        </div>
        <fieldset disabled={!draft.deliveryEnabled} className='grid min-w-0 gap-4 px-4 py-4 sm:grid-cols-[14rem_minmax(0,1fr)]'>
          <div className='space-y-2'>
            <Label htmlFor='profile-notification-channel'>Delivery channel</Label>
            <Select value={draft.channel} onValueChange={(value) => { const channel = value as NotificationChannel; onDraft({ channel, destination: channelDestinations[channel] }) }}>
              <SelectTrigger id='profile-notification-channel' className='w-full'><Radio /><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(channelLabels) as NotificationChannel[]).map((channel) => <SelectItem key={channel} value={channel}>{channelLabels[channel]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='profile-notification-destination'>{draft.channel === 'email' ? 'Email address' : 'Endpoint URL'}</Label>
            <Input id='profile-notification-destination' type={draft.channel === 'email' ? 'email' : 'url'} value={draft.destination} aria-invalid={destinationInvalid} aria-describedby={destinationInvalid ? 'profile-notification-destination-error' : undefined} onChange={(event) => onDraft({ destination: event.target.value })} />
            {destinationInvalid ? <FieldMessage id='profile-notification-destination-error'>{draft.channel === 'email' ? 'Enter a valid email address.' : 'Enter a valid endpoint URL.'}</FieldMessage> : null}
          </div>
        </fieldset>
        <div className='grid min-w-0 gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)] sm:items-start'>
          <div className='flex min-w-0 items-start gap-3'><BellRing className='mt-0.5 size-4 shrink-0 text-muted-foreground' /><div className='min-w-0 flex-1'><Label htmlFor='profile-balance-alert'>Low balance alert</Label><p className='mt-1 text-xs text-muted-foreground'>Notify when the available USD balance reaches this amount.</p></div><Switch id='profile-balance-alert' checked={draft.balanceEnabled} onCheckedChange={(balanceEnabled) => onDraft({ balanceEnabled })} /></div>
          <div className='space-y-2'><div className='relative'><span className='pointer-events-none absolute inset-y-0 start-3 flex items-center font-mono text-sm text-muted-foreground'>$</span><Input className='ps-7 font-mono tabular-nums' type='number' min='0.01' step='0.01' disabled={!draft.balanceEnabled} value={draft.balanceThreshold} aria-label='Low balance threshold in USD' aria-invalid={thresholdInvalid} aria-describedby={thresholdInvalid ? 'profile-balance-threshold-error' : undefined} onChange={(event) => onDraft({ balanceThreshold: event.target.value })} /></div>{thresholdInvalid ? <FieldMessage id='profile-balance-threshold-error'>Enter an amount of at least 0.01.</FieldMessage> : null}</div>
        </div>
        <div className='flex min-w-0 items-start gap-4 px-4 py-4'>
          <ShieldCheck className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
          <div className='min-w-0 flex-1'><Label htmlFor='profile-unpriced-models'>Allow models without configured pricing</Label><p className='mt-1 text-xs text-muted-foreground'>Permit requests whose cost cannot be calculated in advance.</p></div>
          <Switch id='profile-unpriced-models' className='shrink-0' checked={draft.allowUnpriced} onCheckedChange={(allowUnpriced) => onDraft({ allowUnpriced })} />
        </div>
        <div className='flex min-w-0 items-start gap-4 px-4 py-4'>
          <Radio className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
          <div className='min-w-0 flex-1'><Label htmlFor='profile-request-ip'>Record request IP in logs</Label><p className='mt-1 text-xs text-muted-foreground'>Attach request-origin metadata to future usage log entries.</p></div>
          <Switch id='profile-request-ip' className='shrink-0' checked={draft.recordRequestIp} onCheckedChange={(recordRequestIp) => onDraft({ recordRequestIp })} />
        </div>
      </div>
      <footer className='flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-xs text-muted-foreground'>{dirty ? 'Unsaved notification changes.' : 'Notification preferences are up to date.'}</p>
        <Button type='submit' className='w-full sm:w-auto' disabled={!dirty || invalid}><Save />Save preferences</Button>
      </footer>
    </form>
  )
}

function SaveConfirmation({ operation, processing, triggerRef, onClose, onConfirm }: {
  operation: SaveOperation
  processing: boolean
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !processing) onClose() }}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-md' showCloseButton={!processing} onCloseAutoFocus={(event) => { event.preventDefault(); triggerRef.current?.focus() }} onEscapeKeyDown={(event) => { if (processing) event.preventDefault() }} onInteractOutside={(event) => { if (processing) event.preventDefault() }}>
        <DialogHeader><DialogTitle>Review profile changes</DialogTitle><DialogDescription>Confirm the fields to update in this local preview.</DialogDescription></DialogHeader>
        <div className='divide-y rounded-md border'>{operation.changes.map((change) => <div key={change.label} className='grid min-w-0 gap-1 px-3 py-2 text-sm'><span className='text-xs text-muted-foreground'>{change.label}</span><span className='break-words font-medium'>{change.next}</span></div>)}</div>
        <DialogFooter>
          <Button variant='outline' disabled={processing} onClick={onClose}>Cancel</Button>
          <Button disabled={processing} onClick={onConfirm}>{processing ? <LoaderCircle className='animate-spin' /> : <CheckCircle2 />}{processing ? 'Saving...' : 'Confirm and save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const valid = Boolean(current) && next.length >= 12 && next === confirm
  const close = () => { setCurrent(''); setNext(''); setConfirm(''); onOpenChange(false) }
  const save = () => { if (!valid) return; close(); toast.success('Password updated', { description: 'The sample password change is complete.', duration: 5000 }) }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) close() }}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader><DialogTitle>Change password</DialogTitle><DialogDescription>Use at least 12 characters for the new password.</DialogDescription></DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'><Label htmlFor='profile-current-password'>Current password</Label><Input id='profile-current-password' type='password' autoComplete='current-password' value={current} onChange={(event) => setCurrent(event.target.value)} /></div>
          <div className='space-y-2'><Label htmlFor='profile-new-password'>New password</Label><Input id='profile-new-password' type='password' autoComplete='new-password' value={next} aria-invalid={Boolean(next) && next.length < 12} onChange={(event) => setNext(event.target.value)} /><p className='text-xs text-muted-foreground'>Minimum 12 characters.</p></div>
          <div className='space-y-2'><Label htmlFor='profile-confirm-password'>Confirm new password</Label><Input id='profile-confirm-password' type='password' autoComplete='new-password' value={confirm} aria-invalid={Boolean(confirm) && next !== confirm} aria-describedby={confirm && next !== confirm ? 'profile-confirm-password-error' : undefined} onChange={(event) => setConfirm(event.target.value)} />{confirm && next !== confirm ? <FieldMessage id='profile-confirm-password-error'>Passwords do not match.</FieldMessage> : null}</div>
        </div>
        <DialogFooter><Button variant='outline' onClick={close}>Cancel</Button><Button disabled={!valid} onClick={save}><ShieldCheck />Update password</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ShadcnProfileScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  const { language: consoleLanguage, setLanguage: setConsoleLanguage } = useConsoleLanguage()
  const initialLanguageLabel = consoleLanguageOptions.find((option) => option.value === consoleLanguage)?.label ?? 'English'
  const initialProfile = { ...sampleProfile, language: initialLanguageLabel }
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [draft, setDraft] = useState<Profile>(initialProfile)
  const [processing, setProcessing] = useState(false)
  const [operation, setOperation] = useState<SaveOperation | null>(null)
  const [twoFactor, setTwoFactor] = useState(false)
  const [passkey, setPasskey] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [connections, setConnections] = useState<Record<ProviderId, boolean>>({ github: true, linuxdo: false, google: false })
  const [savedNotifications, setSavedNotifications] = useState(initialNotifications)
  const [notificationDraft, setNotificationDraft] = useState(initialNotifications)
  const saveTriggerRef = useRef<HTMLElement | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const inFlightRef = useRef(false)
  const processedOperationsRef = useRef(new Set<string>())

  useEffect(() => () => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
    inFlightRef.current = false
  }, [])

  useEffect(() => {
    const languageLabel = consoleLanguageOptions.find((option) => option.value === consoleLanguage)?.label ?? 'English'
    setProfile((current) => current.language === languageLabel ? current : { ...current, language: languageLabel })
    setDraft((current) => current.language === languageLabel ? current : { ...current, language: languageLabel })
  }, [consoleLanguage])

  const openSaveConfirmation = (event: MouseEvent<HTMLButtonElement>) => {
    if (processing || inFlightRef.current) return
    saveTriggerRef.current = event.currentTarget
    const changes = editableFields.filter(({ key }) => draft[key] !== profile[key]).map(({ key, label }) => ({ label, next: draft[key] }))
    if (changes.length) setOperation({ id: `PROFILE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, profile: { ...draft }, changes })
  }

  const confirmSave = () => {
    if (!operation || processing || inFlightRef.current || processedOperationsRef.current.has(operation.id)) return
    const current = operation
    inFlightRef.current = true
    setProcessing(true)
    saveTimerRef.current = window.setTimeout(() => {
      if (processedOperationsRef.current.has(current.id)) return
      processedOperationsRef.current.add(current.id)
      setProfile(current.profile)
      setDraft(current.profile)
      const selectedLanguage = consoleLanguageOptions.find((option) => option.label === current.profile.language)
      if (selectedLanguage) setConsoleLanguage(selectedLanguage.value as ConsoleLanguage)
      setOperation(null)
      setProcessing(false)
      inFlightRef.current = false
      saveTimerRef.current = null
      toast.success('Profile updated', { description: `${current.changes.length} ${current.changes.length === 1 ? 'field' : 'fields'} saved.`, duration: 5000 })
    }, 700)
  }

  const updateTwoFactor = (checked: boolean) => {
    setTwoFactor(checked)
    toast.success(checked ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled', { duration: 4000 })
  }

  const togglePasskey = () => {
    setPasskey((current) => {
      toast.success(current ? 'Passkey removed' : 'Passkey added', { duration: 4000 })
      return !current
    })
  }

  const toggleConnection = (provider: ProviderId) => {
    setConnections((current) => {
      const connected = !current[provider]
      toast.success(`${provider === 'linuxdo' ? 'LinuxDO' : provider === 'github' ? 'GitHub' : 'Google'} ${connected ? 'connected' : 'disconnected'}`, { duration: 4000 })
      return { ...current, [provider]: connected }
    })
  }

  const saveNotifications = () => {
    setSavedNotifications({ ...notificationDraft })
    toast.success('Notification preferences saved', { duration: 4000 })
  }

  return (
    <ConsoleShell activeRoute='console-profile' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <div className='min-w-0'>
        <h1 className='text-2xl font-bold tracking-tight'>Profile</h1>
        <p className='mt-1 text-muted-foreground'>Manage personal details, sign-in methods, connected accounts, and alerts.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProfileTab)} className='min-w-0 space-y-5'>
        <div>
          <TabsList className='grid h-auto w-full grid-cols-2 sm:inline-flex sm:h-10 sm:w-auto'>
            <TabsTrigger value='profile'><CircleUserRound />Profile</TabsTrigger>
            <TabsTrigger value='security'><ShieldCheck />Security</TabsTrigger>
            <TabsTrigger value='connections'><Link2 />Connections</TabsTrigger>
            <TabsTrigger value='notifications'><BellRing />Notifications</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='profile' className='mt-0'>
          <div className='grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]'>
            <ProfileForm profile={profile} draft={draft} processing={processing} onDraft={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} onSave={openSaveConfirmation} />
            <AccountSummary profile={profile} />
          </div>
        </TabsContent>
        <TabsContent value='security' className='mt-0'><SecuritySettings twoFactor={twoFactor} passkey={passkey} onTwoFactor={updateTwoFactor} onPasskey={togglePasskey} onPassword={() => setPasswordOpen(true)} /></TabsContent>
        <TabsContent value='connections' className='mt-0'><ConnectedAccounts connected={connections} onToggle={toggleConnection} /></TabsContent>
        <TabsContent value='notifications' className='mt-0'><NotificationsSettings saved={savedNotifications} draft={notificationDraft} onDraft={(patch) => setNotificationDraft((current) => ({ ...current, ...patch }))} onSave={saveNotifications} /></TabsContent>
      </Tabs>

      {operation ? <SaveConfirmation operation={operation} processing={processing} triggerRef={saveTriggerRef} onClose={() => { if (!processing) setOperation(null) }} onConfirm={confirmSave} /> : null}
      <PasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </ConsoleShell>
  )
}
