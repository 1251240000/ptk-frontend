import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { QRCodeSVG } from 'qrcode.react'
import { BellRing, Check, Copy, ExternalLink, Fingerprint, Globe2, KeyRound, Link2, LockKeyhole, Mail, MonitorCheck, Radio, RefreshCw, Save, ShieldCheck, Trash2, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  beginPasskeyRegistration,
  beginPasskeyVerification,
  bindEmail,
  deleteAccount,
  deletePasskey,
  disableTwoFactor,
  enableTwoFactor,
  finishPasskeyRegistration,
  finishPasskeyVerification,
  getAccessToken,
  getOAuthBindings,
  getPasskeyStatus,
  getStatus,
  getTwoFactorStatus,
  regenerateBackupCodes,
  sendEmailVerification,
  setupTwoFactor,
  unbindOAuth,
  updateProfile,
  updateUserLanguage,
  updateUserSettings,
  verifySensitiveAction,
  type TwoFactorSetup,
  type UserSettingsInput,
} from '@partokens/api-client'
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@partokens/design-system/components'
import { isAppLocale, localeLabels, locales, type AppLocale } from '@partokens/i18n'

import { Modal } from '@/components/modal'
import { AccountDataState, AccountPageHeader, AccountSectionHeading, PendingLabel } from '@/features/account/account-ui'
import { resolveProfileTask, type ProfileTask } from '@/lib/account-routes'
import { quotaDollarsToUnits, quotaUnitsToDollars } from '@/lib/format'
import { buildAssertionResult, buildRegistrationResult, isPasskeySupported, prepareCredentialCreationOptions, prepareCredentialRequestOptions } from '@/lib/passkey'
import { useSessionStore } from '@/stores/session'
import { startOAuthAuthorization, TurnstileField } from './auth-pages'

type ProfileTab = ProfileTask
type SecurityAction = 'register-passkey' | 'delete-passkey' | null
type ConnectionIntent = { kind: 'connect'; provider: string; label: string } | { kind: 'disconnect'; providerId: string; label: string }
type ConnectionProvider = { key: string; label: string; provider: string; connected: boolean; enabled: boolean; detail: string; providerId?: string }
type ParsedSettings = UserSettingsInput & { language?: string }

function profileTabFromLocation(): ProfileTab {
  const searchValue = new URLSearchParams(window.location.search).get('tab')
  return resolveProfileTask(searchValue, window.location.hash)
}

function parseSettings(value?: string): ParsedSettings {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed as ParsedSettings : {}
  } catch {
    return {}
  }
}

function isRedactedSecret(value: unknown): boolean {
  return typeof value === 'string' && (value.includes('***') || value.toLowerCase() === 'configured')
}

function validHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
    if (message) return message
  }
  if (error instanceof DOMException && error.name === 'NotAllowedError') return 'Passkey operation was cancelled or timed out'
  return error instanceof Error ? error.message : fallback
}

async function registerBrowserPasskey() {
  if (!isPasskeySupported()) throw new Error('Passkey is not supported in this browser')
  const begin = await beginPasskeyRegistration()
  if (!begin.success) throw new Error(begin.message || 'Unable to start Passkey registration')
  const publicKey = prepareCredentialCreationOptions(begin.data)
  const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential | null
  const result = buildRegistrationResult(credential)
  if (!result) throw new Error('Passkey registration was cancelled')
  const finish = await finishPasskeyRegistration(result)
  if (!finish.success) throw new Error(finish.message || 'Unable to register Passkey')
}

async function verifyBrowserPasskey() {
  if (!isPasskeySupported()) throw new Error('Passkey is not supported in this browser')
  const begin = await beginPasskeyVerification()
  if (!begin.success) throw new Error(begin.message || 'Unable to start Passkey verification')
  const publicKey = prepareCredentialRequestOptions(begin.data)
  const credential = await navigator.credentials.get({ publicKey }) as PublicKeyCredential | null
  const result = buildAssertionResult(credential)
  if (!result) throw new Error('Passkey verification was cancelled')
  const finish = await finishPasskeyVerification(result)
  if (!finish.success) throw new Error(finish.message || 'Unable to verify Passkey')
  const verified = await verifySensitiveAction('passkey')
  if (!verified.success) throw new Error(verified.message || 'Unable to complete security verification')
}

export function ProfilePage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale: AppLocale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const { user, session, revision, setUser, signOut } = useSessionStore()
  const client = useQueryClient()
  const settings = useMemo(() => parseSettings(user?.setting || user?.settings), [user?.setting, user?.settings])
  const [tab, setTab] = useState<ProfileTab>(profileTabFromLocation)
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailCooldown, setEmailCooldown] = useState(0)
  const [emailTurnstile, setEmailTurnstile] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [confirmAccessToken, setConfirmAccessToken] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null)
  const [twoFactorAction, setTwoFactorAction] = useState<'regenerate' | 'disable' | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [securityAction, setSecurityAction] = useState<SecurityAction>(null)
  const [securityCode, setSecurityCode] = useState('')
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [connectionIntent, setConnectionIntent] = useState<ConnectionIntent | null>(null)
  const [connectionPending, setConnectionPending] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)
  const [deletePhrase, setDeletePhrase] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [originalPassword, setOriginalPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [language, setLanguage] = useState<AppLocale>(isAppLocale(settings.language) ? settings.language : locale)
  const [notifyType, setNotifyType] = useState(settings.notify_type || 'email')
  const [warningQuota, setWarningQuota] = useState(quotaUnitsToDollars(settings.quota_warning_threshold || 500_000))
  const [notificationEmail, setNotificationEmail] = useState(settings.notification_email || '')
  const [webhookUrl, setWebhookUrl] = useState(settings.webhook_url || '')
  const webhookSecretConfigured = Boolean(settings.webhook_secret)
  const storedWebhookSecret = typeof settings.webhook_secret === 'string' && !isRedactedSecret(settings.webhook_secret) ? settings.webhook_secret : ''
  const [webhookSecret, setWebhookSecret] = useState('')
  const [barkUrl, setBarkUrl] = useState(settings.bark_url || '')
  const [gotifyUrl, setGotifyUrl] = useState(settings.gotify_url || '')
  const gotifyTokenConfigured = Boolean(settings.gotify_token)
  const storedGotifyToken = typeof settings.gotify_token === 'string' && !isRedactedSecret(settings.gotify_token) ? settings.gotify_token : ''
  const [gotifyToken, setGotifyToken] = useState('')
  const [gotifyPriority, setGotifyPriority] = useState(settings.gotify_priority ?? 5)

  const status = useQuery({ queryKey: ['status'], queryFn: getStatus, staleTime: 60_000 })
  const oauthBindings = useQuery({ queryKey: ['oauth-bindings'], queryFn: getOAuthBindings, retry: false })
  const twoFactor = useQuery({ queryKey: ['two-factor-status'], queryFn: getTwoFactorStatus, retry: false })
  const passkey = useQuery({ queryKey: ['passkey-status'], queryFn: getPasskeyStatus, retry: false })
  const statusData = status.data?.data
  const twoFactorData = twoFactor.data?.data
  const passkeyData = passkey.data?.data
  const turnstileRequired = Boolean(statusData?.turnstile_check)

  useEffect(() => setDisplayName(user?.display_name || ''), [user?.display_name])
  useEffect(() => {
    const target = new URL(window.location.href)
    if (target.searchParams.get('binding') !== 'success') return
    toast.success(t('Account connected'), { id: 'profile-account-connected', duration: 6000 })
    target.searchParams.delete('binding')
    window.history.replaceState(window.history.state, '', target)
  }, [t])
  useEffect(() => {
    const syncTab = () => setTab(profileTabFromLocation())
    window.addEventListener('popstate', syncTab)
    return () => window.removeEventListener('popstate', syncTab)
  }, [])
  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#/, '')
    if (!rawHash) return
    const next = profileTabFromLocation()
    const target = new URL(window.location.href)
    if (next === 'profile') target.searchParams.delete('tab')
    else target.searchParams.set('tab', next)
    target.hash = ''
    window.history.replaceState(window.history.state, '', target)
    setTab(next)
  }, [])
  useEffect(() => {
    if (tab === 'security') return
    setAccessToken('')
    setConfirmAccessToken(false)
    setTwoFactorSetup(null)
    setTwoFactorAction(null)
    setTwoFactorCode('')
    setBackupCodes([])
    setSecurityAction(null)
    setSecurityCode('')
    setPasswordDialog(false)
    setOriginalPassword('')
    setNewPassword('')
    setDeleteConfirmation(false)
    setDeletePhrase('')
    setDeletePassword('')
  }, [tab])
  useEffect(() => {
    setAccessToken('')
    setConfirmAccessToken(false)
    setTwoFactorSetup(null)
    setTwoFactorAction(null)
    setBackupCodes([])
    setSecurityAction(null)
  }, [revision])
  useEffect(() => {
    if (emailCooldown <= 0) return
    const timer = window.setInterval(() => setEmailCooldown((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [emailCooldown])

  const success = (value: string) => toast.success(value, { duration: 6000 })
  const failure = (cause: unknown, fallback: string) => toast.error(t(errorMessage(cause, fallback)), { duration: 6000 })

  const saveProfile = useMutation({
    mutationFn: async () => {
      const response = await updateProfile({ display_name: displayName.trim() })
      if (!response.success) throw new Error(response.message || t('Unable to save profile'))
      if (language !== locale) {
        const languageResponse = await updateUserLanguage(language)
        if (!languageResponse.success) throw new Error(languageResponse.message || t('Unable to save language'))
      }
    },
    onSuccess: () => {
      if (user) setUser({ ...user, display_name: displayName.trim(), setting: JSON.stringify({ ...settings, language }) })
      success(t('Profile updated'))
      if (language !== locale) window.location.assign(`${window.location.pathname.replace(/^\/[^/]+/, `/${language}`)}${window.location.search}`)
    },
    onError: (cause) => failure(cause, t('Unable to save profile')),
  })

  const sendBindCode = useMutation({
    mutationFn: async () => {
      const response = await sendEmailVerification({ email: email.trim(), turnstile: emailTurnstile || undefined })
      if (!response.success) throw new Error(response.message || t('Unable to send code'))
    },
    onSuccess: () => { setEmailCooldown(60); success(t('Verification code sent')) },
    onError: (cause) => failure(cause, t('Unable to send code')),
  })

  const bindEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await bindEmail(email.trim(), emailCode.trim())
      if (!response.success) throw new Error(response.message || t('Unable to bind email'))
    },
    onSuccess: () => { setEmail(''); setEmailCode(''); success(t('Email connected')); void client.invalidateQueries({ queryKey: ['self'] }) },
    onError: (cause) => failure(cause, t('Unable to bind email')),
  })

  const accessTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await getAccessToken()
      if (!response.success || !response.data) throw new Error(response.message || t('Unable to generate access token'))
      return response.data
    },
    onSuccess: (token) => setAccessToken(token),
    onError: (cause) => failure(cause, t('Unable to generate access token')),
  })

  const setupTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const response = await setupTwoFactor()
      if (!response.success) throw new Error(response.message || t('Unable to set up 2FA'))
      return response.data
    },
    onSuccess: (data) => { setTwoFactorSetup(data); setBackupCodes(data.backup_codes); setTwoFactorCode('') },
    onError: (cause) => failure(cause, t('Unable to set up 2FA')),
  })

  const enableTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const response = await enableTwoFactor(twoFactorCode.trim())
      if (!response.success) throw new Error(response.message || t('Unable to enable 2FA'))
    },
    onSuccess: () => { setTwoFactorSetup(null); setTwoFactorAction(null); setTwoFactorCode(''); success(t('2FA enabled')); void twoFactor.refetch() },
    onError: (cause) => failure(cause, t('Unable to enable 2FA')),
  })

  const disableTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const response = await disableTwoFactor(twoFactorCode.trim())
      if (!response.success) throw new Error(response.message || t('Unable to disable 2FA'))
    },
    onSuccess: () => { setTwoFactorAction(null); setTwoFactorCode(''); success(t('2FA disabled')); void twoFactor.refetch() },
    onError: (cause) => failure(cause, t('Unable to disable 2FA')),
  })

  const backupMutation = useMutation({
    mutationFn: async () => {
      if (!/^\d{6}$/.test(twoFactorCode.trim())) throw new Error(t('Enter a 6-digit authenticator code.'))
      const response = await regenerateBackupCodes(twoFactorCode.trim())
      if (!response.success) throw new Error(response.message || t('Unable to regenerate backup codes'))
      return response.data.backup_codes
    },
    onSuccess: (codes) => { setTwoFactorAction(null); setBackupCodes(codes); setTwoFactorCode(''); success(t('Backup codes regenerated')); void twoFactor.refetch() },
    onError: (cause) => failure(cause, t('Unable to regenerate backup codes')),
  })

  const passkeyMutation = useMutation({
    mutationFn: async (action: Exclude<SecurityAction, null>) => {
      if (action === 'register-passkey') {
        if (twoFactorData?.enabled) {
          const verified = await verifySensitiveAction('2fa', securityCode.trim())
          if (!verified.success) throw new Error(verified.message || t('Security verification failed'))
        }
        await registerBrowserPasskey()
        return t('Passkey registered')
      }
      if (twoFactorData?.enabled) {
        const verified = await verifySensitiveAction('2fa', securityCode.trim())
        if (!verified.success) throw new Error(verified.message || t('Security verification failed'))
      } else {
        await verifyBrowserPasskey()
      }
      const removed = await deletePasskey()
      if (!removed.success) throw new Error(removed.message || t('Unable to delete Passkey'))
      return t('Passkey deleted')
    },
    onSuccess: (value) => { setSecurityAction(null); setSecurityCode(''); success(value); void passkey.refetch() },
    onError: (cause) => failure(cause, t('Passkey operation failed')),
  })

  const savePassword = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) throw new Error(t('Password must contain at least 8 characters'))
      const response = await updateProfile({ original_password: originalPassword, password: newPassword })
      if (!response.success) throw new Error(response.message || t('Unable to change password'))
    },
    onSuccess: () => { setPasswordDialog(false); setOriginalPassword(''); setNewPassword(''); success(t('Password updated')) },
    onError: (cause) => failure(cause, t('Unable to change password')),
  })

  const copyAccessToken = async () => {
    try {
      await navigator.clipboard.writeText(accessToken)
      toast.success(t('Access token copied.'), { id: 'profile-access-token-copied', duration: 6000 })
    } catch {
      toast.error(t('Unable to copy access token.'), { id: 'profile-access-token-copy-failed', duration: 6000 })
    }
  }

  const savePreferences = useMutation({
    mutationFn: async () => {
      if (!Number.isFinite(warningQuota) || warningQuota < 0.01) throw new Error(t('Enter an amount of at least 0.01.'))
      if (notifyType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail.trim())) throw new Error(t('Enter a valid email address.'))
      if (notifyType === 'webhook' && !validHttpUrl(webhookUrl.trim())) throw new Error(t('Enter a valid endpoint URL.'))
      if (notifyType === 'webhook' && !webhookSecretConfigured && webhookSecret.length < 8) throw new Error(t('Enter a secret with at least 8 characters.'))
      if (notifyType === 'bark' && !validHttpUrl(barkUrl.trim())) throw new Error(t('Enter a valid endpoint URL.'))
      if (notifyType === 'gotify' && !validHttpUrl(gotifyUrl.trim())) throw new Error(t('Enter a valid endpoint URL.'))
      if (notifyType === 'gotify' && !gotifyTokenConfigured && gotifyToken.length < 8) throw new Error(t('Enter a token with at least 8 characters.'))
      if (!Number.isInteger(gotifyPriority) || gotifyPriority < 0 || gotifyPriority > 10) throw new Error(t('Enter a priority from 0 to 10.'))
      const payload: UserSettingsInput = {
        notify_type: notifyType,
        quota_warning_threshold: quotaDollarsToUnits(warningQuota),
        notification_email: notificationEmail.trim(),
        webhook_url: webhookUrl.trim(),
        bark_url: barkUrl.trim(),
        gotify_url: gotifyUrl.trim(),
        gotify_priority: gotifyPriority,
        ...(notifyType === 'webhook' && (webhookSecret || storedWebhookSecret) ? { webhook_secret: webhookSecret || storedWebhookSecret } : {}),
        ...(notifyType === 'gotify' && (gotifyToken || storedGotifyToken) ? { gotify_token: gotifyToken || storedGotifyToken } : {}),
      }
      const response = await updateUserSettings(payload)
      if (!response.success) throw new Error(response.message || t('Unable to save preferences'))
      return payload
    },
    onSuccess: (payload) => {
      if (user) setUser({ ...user, setting: JSON.stringify({ ...settings, ...payload, language }) })
      setWebhookSecret('')
      setGotifyToken('')
      success(t('Preferences updated'))
    },
    onError: (cause) => failure(cause, t('Unable to save preferences')),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await deleteAccount(deletePassword)
      if (!response.success) throw new Error(response.message || t('Unable to delete account'))
    },
    onSuccess: async () => { await signOut(); window.location.assign(`/${locale}/`) },
    onError: (cause) => failure(cause, t('Unable to delete account')),
  })

  const customBindings = oauthBindings.data?.data || []
  const customProviders = statusData?.custom_oauth_providers || []
  const configuredProviderIds = new Set(customProviders.map((provider) => String(provider.id)))
  const connectionProviders: ConnectionProvider[] = [
    {
      key: 'github',
      label: 'GitHub',
      provider: 'github',
      connected: Boolean(user?.github_id),
      enabled: statusData?.github_oauth !== false && Boolean(statusData?.github_client_id),
      detail: user?.github_id ? t('Connected') : t('Available to connect'),
    },
    {
      key: 'linuxdo',
      label: 'LinuxDO',
      provider: 'linuxdo',
      connected: Boolean(user?.linux_do_id),
      enabled: statusData?.linuxdo_oauth !== false && Boolean(statusData?.linuxdo_client_id),
      detail: user?.linux_do_id ? t('Connected') : t('Available to connect'),
    },
    ...(statusData?.oidc_client_id ? [{
      key: 'oidc',
      label: 'OIDC',
      provider: 'oidc',
      connected: Boolean(user?.oidc_id),
      enabled: statusData.oidc_enabled !== false,
      detail: user?.oidc_id ? t('Connected') : t('Available to connect'),
    }] : []),
    ...customProviders.map((provider) => {
      const binding = customBindings.find((item) => item.provider_id === String(provider.id))
      return {
        key: `custom:${provider.id}`,
        label: provider.name,
        provider: provider.slug,
        connected: Boolean(binding),
        enabled: true,
        detail: binding?.external_id || (binding ? t('Connected') : t('Available to connect')),
        providerId: binding?.provider_id,
      }
    }),
    ...customBindings.filter((binding) => !configuredProviderIds.has(binding.provider_id)).map((binding) => ({
      key: `orphan:${binding.provider_id}`,
      label: binding.provider_name,
      provider: '',
      connected: true,
      enabled: false,
      detail: binding.external_id || t('Connected'),
      providerId: binding.provider_id,
    })),
  ]
  const startBinding = async (provider: string) => {
    if (!statusData) return
    setConnectionPending(true)
    try {
      await startOAuthAuthorization({ provider, status: statusData, locale, intent: 'bind' })
      await oauthBindings.refetch()
      setConnectionIntent(null)
      success(t('Account connected'))
    }
    catch (cause) { failure(cause, t('Unable to connect account')) }
    finally { setConnectionPending(false) }
  }

  const disconnectBinding = useMutation({
    mutationFn: async (providerId: string) => {
      const response = await unbindOAuth(providerId)
      if (!response.success) throw new Error(response.message || t('Unable to disconnect account'))
    },
    onSuccess: () => { setConnectionIntent(null); success(t('Account disconnected')); void oauthBindings.refetch() },
    onError: (cause) => failure(cause, t('Unable to disconnect account')),
  })

  const selectTab = (next: ProfileTab) => {
    if (next === tab) return
    const target = new URL(window.location.href)
    if (next === 'profile') target.searchParams.delete('tab')
    else target.searchParams.set('tab', next)
    target.hash = ''
    window.history.pushState(window.history.state, '', target)
    setTab(next)
  }

  const profileDirty = displayName.trim() !== (user?.display_name || '') || language !== locale
  const securityLoading = twoFactor.isLoading || passkey.isLoading
  const securityError = twoFactor.isError || passkey.isError
  const authenticatorCodeValid = /^\d{6}$/.test(twoFactorCode.trim())
  const notificationDirty = notifyType !== (settings.notify_type || 'email')
    || quotaDollarsToUnits(warningQuota) !== Number(settings.quota_warning_threshold || 500_000)
    || notificationEmail.trim() !== (settings.notification_email || '')
    || webhookUrl.trim() !== (settings.webhook_url || '')
    || barkUrl.trim() !== (settings.bark_url || '')
    || gotifyUrl.trim() !== (settings.gotify_url || '')
    || gotifyPriority !== (settings.gotify_priority ?? 5)
    || Boolean(webhookSecret)
    || Boolean(gotifyToken)

  return (
    <div className="space-y-6" data-account-page="profile">
      <AccountPageHeader title={t('Profile')} description={t('Manage account details, connected services, preferences, and security.')} />

      <Tabs value={tab} onValueChange={(value) => selectTab(value as ProfileTab)} className="min-w-0 space-y-5">
        <div>
          <TabsList className="analytics-segmented grid h-auto w-full grid-cols-2 sm:inline-flex sm:h-10 sm:w-auto">
            <TabsTrigger value="profile"><UserRound />{t('Profile')}</TabsTrigger>
            <TabsTrigger value="security"><ShieldCheck />{t('Security')}</TabsTrigger>
            <TabsTrigger value="connections"><Link2 />{t('Connections')}</TabsTrigger>
            <TabsTrigger value="notifications"><BellRing />{t('Notifications')}</TabsTrigger>
          </TabsList>
        </div>

      <TabsContent value="profile" className="mt-0 space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
          <form className="overflow-hidden rounded-lg border" onSubmit={(event) => { event.preventDefault(); saveProfile.mutate() }}>
            <AccountSectionHeading eyebrow={t('Identity').toUpperCase()} title={t('Account profile')} description={t('Update the supported identity and interface fields for this account.')} icon={UserRound} />
            <fieldset className="grid gap-4 p-4 sm:grid-cols-2" disabled={saveProfile.isPending}>
              <div className="space-y-2"><Label htmlFor="profile-username">{t('Username')}</Label><Input id="profile-username" value={user?.username || ''} disabled /><p className="text-xs text-muted-foreground">{t('Username is managed by Partokens and cannot be changed here.')}</p></div>
              <div className="space-y-2"><Label htmlFor="profile-email">{t('Email')}</Label><Input id="profile-email" value={user?.email || t('Not bound')} disabled /><p className="text-xs text-muted-foreground">{t('Manage email verification from Connections.')}</p></div>
              <div className="space-y-2"><Label htmlFor="profile-display-name">{t('Display name')}</Label><Input id="profile-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" /></div>
              <div className="space-y-2"><Label htmlFor="profile-language">{t('Interface language')}</Label><Select value={language} disabled={saveProfile.isPending} onValueChange={(value) => setLanguage(value as AppLocale)}><SelectTrigger id="profile-language" className="w-full"><Globe2 /><SelectValue /></SelectTrigger><SelectContent>{locales.map((item) => <SelectItem key={item} value={item}>{localeLabels[item]}</SelectItem>)}</SelectContent></Select></div>
            </fieldset>
            <footer className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">{profileDirty ? t('Unsaved changes are ready to save.') : t('Profile is up to date.')}</p><Button type="submit" className="w-full sm:w-auto" disabled={!profileDirty || saveProfile.isPending}><Save /><PendingLabel pending={saveProfile.isPending} pendingText={t('Saving')}>{t('Save profile')}</PendingLabel></Button></footer>
          </form>
          <section className="overflow-hidden rounded-lg border" aria-label={t('Account Trust')}>
            <AccountSectionHeading eyebrow={t('Account Trust').toUpperCase()} title={t('Account status')} description={t('Identity, session, and API access signals for this account.')} icon={ShieldCheck} />
            <div className="divide-y">
              {[
                [t('Email'), user?.email ? t('Verified') : t('Not bound'), user?.email || t('Add a recovery email in Connections.'), Mail],
                [t('Current session'), session?.current ? t('Current') : t('Unavailable'), session?.login_method || t('Secure browser session'), MonitorCheck],
                [t('API access'), user?.status === 0 ? t('Disabled') : t('Active'), user?.group || t('Account API enabled'), KeyRound],
              ].map(([label, value, detail, Icon]) => {
                const StatusIcon = Icon as typeof Mail
                return <div key={String(label)} className="flex min-w-0 items-start gap-3 p-4"><StatusIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{label as string}</p><p className="mt-1 break-words text-xs text-muted-foreground">{detail as string}</p></div><Badge variant="outline" className="shrink-0">{value === t('Verified') || value === t('Current') || value === t('Active') ? <Check className="text-success" /> : null}{value as string}</Badge></div>
              })}
            </div>
          </section>
        </div>
      </TabsContent>

      <TabsContent value="connections" className="mt-0">
        <section className="overflow-hidden rounded-lg border">
          <AccountSectionHeading eyebrow={t('Connected services').toUpperCase()} title={t('Account bindings')} description={t('Connect the identity providers available on this deployment.')} icon={Link2} />
          <AccountDataState loading={status.isLoading || oauthBindings.isLoading} error={(status.isError && !status.data) || (oauthBindings.isError && !oauthBindings.data) ? t('Interface data unavailable') : null} empty={false} emptyTitle={t('Account bindings')} retryLabel={t('Retry')} onRetry={() => void Promise.all([status.refetch(), oauthBindings.refetch()])}>
          <div className="divide-y">
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,1.1fr)] lg:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40"><Mail className="size-4" /></span>
                <div className="min-w-0"><p className="text-sm font-medium">{t('Email')}</p><p className="mt-1 break-words text-xs text-muted-foreground">{user?.email || t('Not connected')}</p></div>
              </div>
              {user?.email ? <Badge variant="outline" className="justify-self-start lg:justify-self-end"><Check className="text-success" />{t('Connected')}</Badge> : (
                <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto_auto]">
                  <Input type="email" aria-label={t('Email')} placeholder="mail@example.com" value={email} disabled={sendBindCode.isPending || bindEmailMutation.isPending} onChange={(event) => setEmail(event.target.value)} />
                  <Input inputMode="numeric" aria-label={t('Verification code')} placeholder={t('Verification code')} value={emailCode} disabled={bindEmailMutation.isPending} onChange={(event) => setEmailCode(event.target.value)} />
                  <Button type="button" variant="outline" disabled={!email || emailCooldown > 0 || sendBindCode.isPending || (turnstileRequired && !emailTurnstile)} onClick={() => sendBindCode.mutate()}><PendingLabel pending={sendBindCode.isPending} pendingText={t('Saving')}>{emailCooldown > 0 ? `${emailCooldown}s` : t('Send code')}</PendingLabel></Button>
                  <Button type="button" disabled={!email || !emailCode || bindEmailMutation.isPending} onClick={() => bindEmailMutation.mutate()}><PendingLabel pending={bindEmailMutation.isPending} pendingText={t('Saving')}>{t('Connect')}</PendingLabel></Button>
                </div>
              )}
            </div>
            {!user?.email && turnstileRequired ? <div className="p-4"><TurnstileField siteKey={statusData?.turnstile_site_key} onToken={setEmailTurnstile} /></div> : null}
            {connectionProviders.map(({ key, label, provider, connected, enabled, detail, providerId }) => (
              <article aria-label={label} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={key}>
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40"><ExternalLink className="size-4" /></span>
                  <div className="min-w-0"><p className="text-sm font-medium">{label}</p><p className="mt-1 break-words text-xs text-muted-foreground">{enabled || connected ? detail : t('Unavailable')}</p></div>
                </div>
                {connected && providerId ? <Button type="button" variant="outline" className="w-full text-destructive sm:w-auto" disabled={disconnectBinding.isPending || connectionPending} onClick={() => setConnectionIntent({ kind: 'disconnect', providerId, label })}>{t('Disconnect')}</Button> : connected ? <Badge variant="outline" className="justify-self-start sm:justify-self-end"><Check className="text-success" />{t('Connected')}</Badge> : <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={!enabled || connectionPending} onClick={() => setConnectionIntent({ kind: 'connect', provider, label })}><Link2 />{t('Connect')}</Button>}
              </article>
            ))}
          </div>
          </AccountDataState>
        </section>
      </TabsContent>

      <TabsContent value="security" className="mt-0 space-y-4">
        <AccountDataState loading={securityLoading} error={securityError && (!twoFactor.data || !passkey.data) ? t('Interface data unavailable') : null} empty={false} emptyTitle={t('Security settings unavailable')} retryLabel={t('Retry')} onRetry={() => void Promise.all([twoFactor.refetch(), passkey.refetch()])}>
        <div className="space-y-4">
          <section className="overflow-hidden rounded-lg border">
            <AccountSectionHeading eyebrow={t('Sign-in and recovery').toUpperCase()} title={t('Account security')} description={t('Manage the sign-in methods used to protect this account.')} icon={ShieldCheck} />
            <div className="divide-y">
              <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="flex min-w-0 items-start gap-3"><KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><Label>{t('Change password')}</Label><p className="mt-1 text-xs text-muted-foreground">{t('Use the current password before choosing a new one.')}</p></div></div><Button type="button" variant="outline" onClick={() => setPasswordDialog(true)}><KeyRound />{t('Change password')}</Button></div>

              <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="flex min-w-0 items-start gap-3"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Label>{t('Two-factor authentication')}</Label><Badge variant="outline">{twoFactorData?.enabled ? <Check className="text-success" /> : null}{twoFactorData?.enabled ? t('Enabled') : t('Disabled')}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{t('Use an authenticator app and backup codes to protect account access.')}</p></div></div>
                {twoFactorData?.enabled ? <div className="flex flex-wrap gap-2 sm:justify-end"><Button type="button" variant="outline" disabled={backupMutation.isPending || disableTwoFactorMutation.isPending} onClick={() => { setTwoFactorCode(''); setTwoFactorAction('regenerate') }}><RefreshCw />{t('Regenerate backup codes')}</Button><Button type="button" variant="outline" className="text-destructive" disabled={backupMutation.isPending || disableTwoFactorMutation.isPending} onClick={() => { setTwoFactorCode(''); setTwoFactorAction('disable') }}>{t('Disable 2FA')}</Button></div> : <Button type="button" variant="outline" disabled={setupTwoFactorMutation.isPending} onClick={() => setupTwoFactorMutation.mutate()}><ShieldCheck /><PendingLabel pending={setupTwoFactorMutation.isPending} pendingText={t('Saving')}>{t('Set up 2FA')}</PendingLabel></Button>}
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="flex min-w-0 items-start gap-3"><Fingerprint className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Label>{t('Passkey')}</Label><Badge variant="outline">{passkeyData?.enabled ? <Check className="text-success" /> : null}{passkeyData?.enabled ? t('Enabled') : t('Disabled')}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{t('Use your device biometrics or security key for phishing-resistant verification.')}</p>{passkeyData?.last_used_at ? <p className="mt-1 text-xs text-muted-foreground">{t('Last used')}: {passkeyData.last_used_at}</p> : null}</div></div>{passkeyData?.enabled ? <Button type="button" variant="outline" className="text-destructive" onClick={() => setSecurityAction('delete-passkey')}><Trash2 />{t('Delete Passkey')}</Button> : <Button type="button" variant="outline" disabled={!isPasskeySupported()} onClick={() => setSecurityAction('register-passkey')}><Fingerprint />{t('Register Passkey')}</Button>}</div>

              <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="flex min-w-0 items-start gap-3"><KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><Label>{t('System access token')}</Label><p className="mt-1 text-xs text-muted-foreground">{t('This token grants access to account-level system APIs. Generate it only when required.')}</p></div></div><Button type="button" variant="outline" onClick={() => { setAccessToken(''); setConfirmAccessToken(true) }}>{t('Generate token')}</Button></div>

              <div className="flex min-w-0 items-start gap-3 p-4"><MonitorCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><Label>{t('Current session')}</Label><p className="mt-1 text-xs text-muted-foreground">{session?.login_method || t('Secure browser session')}</p></div><Badge variant="outline" className="shrink-0"><Check className="text-success" />{t('Current')}</Badge></div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-medium text-destructive">{t('Danger zone').toUpperCase()}</p><h2 className="mt-1 text-base font-semibold">{t('Delete account')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('Permanently disable this account and revoke access. This action cannot be undone.')}</p></div><Button type="button" variant="outline" className="shrink-0 text-destructive" onClick={() => setDeleteConfirmation(true)}><Trash2 />{t('Delete account')}</Button></section>
        </div>
        </AccountDataState>
      </TabsContent>

      <TabsContent value="notifications" className="mt-0">
        <form className="overflow-hidden rounded-lg border" onSubmit={(event) => { event.preventDefault(); savePreferences.mutate() }}>
          <AccountSectionHeading eyebrow={t('Notifications').toUpperCase()} title={t('Notifications and behavior')} description={t('Choose an alert channel and balance warning threshold.')} icon={BellRing} />
          <div className="divide-y">
            <div className="grid gap-4 p-4 sm:grid-cols-[14rem_minmax(0,1fr)]">
              <div className="space-y-2"><Label htmlFor="notification-method">{t('Notification method')}</Label><Select value={notifyType} disabled={savePreferences.isPending} onValueChange={setNotifyType}><SelectTrigger id="notification-method" className="w-full"><Radio /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="webhook">Webhook</SelectItem><SelectItem value="bark">Bark</SelectItem><SelectItem value="gotify">Gotify</SelectItem></SelectContent></Select></div>
              {notifyType === 'email' ? <div className="space-y-2"><Label htmlFor="notification-email">{t('Notification email')}</Label><Input id="notification-email" type="email" value={notificationEmail} disabled={savePreferences.isPending} onChange={(event) => setNotificationEmail(event.target.value)} /></div> : null}
              {notifyType === 'webhook' ? <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="webhook-url">{t('Webhook URL')}</Label><Input id="webhook-url" type="url" value={webhookUrl} disabled={savePreferences.isPending} onChange={(event) => setWebhookUrl(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="webhook-secret">{t('Webhook secret')}</Label><Input id="webhook-secret" type="password" value={webhookSecret} disabled={savePreferences.isPending} placeholder={webhookSecretConfigured ? t('Configured') : ''} onChange={(event) => setWebhookSecret(event.target.value)} /></div></div> : null}
              {notifyType === 'bark' ? <div className="space-y-2"><Label htmlFor="bark-url">{t('Bark push URL')}</Label><Input id="bark-url" type="url" value={barkUrl} disabled={savePreferences.isPending} onChange={(event) => setBarkUrl(event.target.value)} /></div> : null}
              {notifyType === 'gotify' ? <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2 sm:col-span-2"><Label htmlFor="gotify-url">{t('Gotify server URL')}</Label><Input id="gotify-url" type="url" value={gotifyUrl} disabled={savePreferences.isPending} onChange={(event) => setGotifyUrl(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="gotify-priority">{t('Message priority')}</Label><Input id="gotify-priority" type="number" min="0" max="10" value={gotifyPriority} disabled={savePreferences.isPending} onChange={(event) => setGotifyPriority(Number(event.target.value))} /></div><div className="space-y-2 sm:col-span-3"><Label htmlFor="gotify-token">{t('Gotify application token')}</Label><Input id="gotify-token" type="password" value={gotifyToken} disabled={savePreferences.isPending} placeholder={gotifyTokenConfigured ? t('Configured') : ''} onChange={(event) => setGotifyToken(event.target.value)} /></div></div> : null}
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)] sm:items-center"><div className="flex min-w-0 items-start gap-3"><BellRing className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><Label htmlFor="balance-warning">{t('Balance warning in USD')}</Label><p className="mt-1 text-xs text-muted-foreground">{t('Notify when the available balance reaches this amount.')}</p></div></div><Input id="balance-warning" type="number" min="0.01" step="0.01" value={warningQuota} disabled={savePreferences.isPending} onChange={(event) => setWarningQuota(Number(event.target.value))} /></div>
          </div>
          <footer className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">{notificationDirty ? t('Unsaved notification changes.') : t('Notification preferences are up to date.')}</p><Button type="submit" className="w-full sm:w-auto" disabled={!notificationDirty || savePreferences.isPending}><Save /><PendingLabel pending={savePreferences.isPending} pendingText={t('Saving')}>{t('Save preferences')}</PendingLabel></Button></footer>
        </form>
      </TabsContent>
      </Tabs>

      {connectionIntent ? (
        <Modal className="relative max-h-[90svh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border bg-background p-5 text-foreground shadow-xl" backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" label={connectionIntent.kind === 'connect' ? t('Connect account') : t('Disconnect account')} onClose={connectionPending || disconnectBinding.isPending ? undefined : () => setConnectionIntent(null)}>
          <Button type="button" variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t('Close')} disabled={connectionPending || disconnectBinding.isPending} onClick={() => setConnectionIntent(null)}><X /></Button>
          <p className="pe-10 text-xs font-medium text-muted-foreground">{t('Selected provider').toUpperCase()}</p>
          <h2 className="mt-1 pe-10 text-lg font-semibold">{connectionIntent.kind === 'connect' ? t('Connect account') : t('Disconnect account')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{connectionIntent.kind === 'connect' ? t('A provider window will open to complete this account connection.') : t('Disconnecting removes this sign-in provider from the account.')}</p>
          <div className={`mt-4 flex items-start gap-3 rounded-md border p-3 ${connectionIntent.kind === 'disconnect' ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/30'}`}>{connectionIntent.kind === 'disconnect' ? <Trash2 className="mt-0.5 size-4 shrink-0 text-destructive" /> : <Link2 className="mt-0.5 size-4 shrink-0" />}<p className="min-w-0 break-words text-sm font-medium">{connectionIntent.label}</p></div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={connectionPending || disconnectBinding.isPending} onClick={() => setConnectionIntent(null)}>{t('Cancel')}</Button><Button type="button" variant={connectionIntent.kind === 'disconnect' ? 'destructive' : 'default'} disabled={connectionPending || disconnectBinding.isPending} onClick={() => connectionIntent.kind === 'connect' ? void startBinding(connectionIntent.provider) : disconnectBinding.mutate(connectionIntent.providerId)}>{connectionIntent.kind === 'disconnect' ? <Trash2 /> : <ExternalLink />}<PendingLabel pending={connectionPending || disconnectBinding.isPending} pendingText={t('Saving')}>{connectionIntent.kind === 'connect' ? t('Connect') : t('Disconnect')}</PendingLabel></Button></div>
        </Modal>
      ) : null}
      {passwordDialog ? (
        <Modal className="relative max-h-[90svh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border bg-background p-5 text-foreground shadow-xl" backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" label={t('Change password')} onClose={savePassword.isPending ? undefined : () => { setPasswordDialog(false); setOriginalPassword(''); setNewPassword('') }}>
          <Button type="button" variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t('Close')} disabled={savePassword.isPending} onClick={() => { setPasswordDialog(false); setOriginalPassword(''); setNewPassword('') }}><X /></Button>
          <p className="pe-10 text-xs font-medium text-muted-foreground">{t('Account security').toUpperCase()}</p>
          <h2 className="mt-1 pe-10 text-lg font-semibold">{t('Change password')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('Use the current password before choosing a new one.')}</p>
          <form onSubmit={(event) => { event.preventDefault(); savePassword.mutate() }}>
            <div className="mt-4 space-y-2"><Label htmlFor="current-password">{t('Current password')}</Label><Input id="current-password" data-modal-initial-focus type="password" autoComplete="current-password" value={originalPassword} disabled={savePassword.isPending} onChange={(event) => setOriginalPassword(event.target.value)} required /></div>
            <div className="mt-4 space-y-2"><Label htmlFor="new-password">{t('New password')}</Label><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} disabled={savePassword.isPending} onChange={(event) => setNewPassword(event.target.value)} required /></div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={savePassword.isPending} onClick={() => { setPasswordDialog(false); setOriginalPassword(''); setNewPassword('') }}>{t('Cancel')}</Button><Button type="submit" disabled={savePassword.isPending || !originalPassword || !newPassword}><KeyRound /><PendingLabel pending={savePassword.isPending} pendingText={t('Saving')}>{t('Update password')}</PendingLabel></Button></div>
          </form>
        </Modal>
      ) : null}
      {twoFactorSetup ? (
        <Modal
          className="relative max-h-[90svh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg border bg-background p-5 text-foreground shadow-xl"
          backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
          label={t('Set up 2FA')}
          onClose={enableTwoFactorMutation.isPending ? undefined : () => setTwoFactorSetup(null)}
        >
          <Button type="button" variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t('Close')} disabled={enableTwoFactorMutation.isPending} onClick={() => setTwoFactorSetup(null)}><X /></Button>
          <p className="pe-10 text-xs font-medium text-muted-foreground">{t('Set up two-factor authentication').toUpperCase()}</p>
          <h2 className="mt-1 pe-10 text-lg font-semibold">{t('Set up 2FA')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('Scan the QR code, save the backup codes, then enter the current authenticator code.')}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)] md:items-center">
            <div className="flex min-h-48 items-center justify-center rounded-md border bg-white p-3"><QRCodeSVG value={twoFactorSetup.qr_code_data} size={164} level="M" /></div>
            <div className="min-w-0 space-y-2"><Label>{t('Manual setup key')}</Label><div className="flex min-w-0 items-center rounded-md border bg-muted/20"><code className="min-w-0 flex-1 break-all px-3 py-2 text-xs">{twoFactorSetup.secret}</code><Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label={t('Copy')} onClick={() => void navigator.clipboard.writeText(twoFactorSetup.secret)}><Copy /></Button></div></div>
          </div>
          <div className="mt-4 rounded-md border bg-muted/20 p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{t('Backup codes')}</p><Button type="button" variant="ghost" size="sm" onClick={() => void navigator.clipboard.writeText(backupCodes.join('\n'))}><Copy />{t('Copy all')}</Button></div><code className="mt-2 block whitespace-pre-wrap break-all text-xs leading-6">{backupCodes.join('\n')}</code></div>
          <div className="mt-4 space-y-2"><Label htmlFor="setup-two-factor-code">{t('Authenticator code')}</Label><Input id="setup-two-factor-code" data-modal-initial-focus value={twoFactorCode} disabled={enableTwoFactorMutation.isPending} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" /></div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={enableTwoFactorMutation.isPending} onClick={() => setTwoFactorSetup(null)}>{t('Close')}</Button><Button type="button" disabled={!twoFactorCode || enableTwoFactorMutation.isPending} onClick={() => enableTwoFactorMutation.mutate()}><ShieldCheck /><PendingLabel pending={enableTwoFactorMutation.isPending} pendingText={t('Saving')}>{t('Enable 2FA')}</PendingLabel></Button></div>
        </Modal>
      ) : null}
      {twoFactorAction ? (
        <Modal className="relative max-h-[90svh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border bg-background p-5 text-foreground shadow-xl" backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" label={twoFactorAction === 'regenerate' ? t('Regenerate backup codes') : t('Disable 2FA')} onClose={backupMutation.isPending || disableTwoFactorMutation.isPending ? undefined : () => { setTwoFactorAction(null); setTwoFactorCode('') }}>
          <Button type="button" variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t('Close')} disabled={backupMutation.isPending || disableTwoFactorMutation.isPending} onClick={() => { setTwoFactorAction(null); setTwoFactorCode('') }}><X /></Button>
          <p className="pe-10 text-xs font-medium text-muted-foreground">{t('Security verification').toUpperCase()}</p>
          <h2 className="mt-1 pe-10 text-lg font-semibold">{twoFactorAction === 'regenerate' ? t('Regenerate backup codes') : t('Disable 2FA')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{twoFactorAction === 'regenerate' ? t('Enter the 6-digit code from your authenticator app. Backup codes cannot be used here.') : t('Use an authenticator app and backup codes to protect account access.')}</p>
          <div className="mt-4 space-y-2"><Label htmlFor="two-factor-code">{twoFactorAction === 'regenerate' ? t('Authenticator code') : t('Authenticator or backup code')}</Label><Input id="two-factor-code" data-modal-initial-focus value={twoFactorCode} disabled={backupMutation.isPending || disableTwoFactorMutation.isPending} onChange={(event) => setTwoFactorCode(twoFactorAction === 'regenerate' ? event.target.value.replace(/\D/g, '').slice(0, 6) : event.target.value)} inputMode={twoFactorAction === 'regenerate' ? 'numeric' : 'text'} pattern={twoFactorAction === 'regenerate' ? '\\d{6}' : undefined} maxLength={twoFactorAction === 'regenerate' ? 6 : undefined} autoComplete="one-time-code" /><p className="text-xs text-muted-foreground">{t('Backup codes remaining')}: {twoFactorData?.backup_codes_remaining ?? 0}</p></div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={backupMutation.isPending || disableTwoFactorMutation.isPending} onClick={() => { setTwoFactorAction(null); setTwoFactorCode('') }}>{t('Cancel')}</Button><Button type="button" variant={twoFactorAction === 'disable' ? 'destructive' : 'default'} disabled={(twoFactorAction === 'regenerate' ? !authenticatorCodeValid : !twoFactorCode.trim()) || backupMutation.isPending || disableTwoFactorMutation.isPending} onClick={() => twoFactorAction === 'regenerate' ? backupMutation.mutate() : disableTwoFactorMutation.mutate()}>{twoFactorAction === 'regenerate' ? <RefreshCw /> : <ShieldCheck />}<PendingLabel pending={backupMutation.isPending || disableTwoFactorMutation.isPending} pendingText={t('Saving')}>{twoFactorAction === 'regenerate' ? t('Regenerate backup codes') : t('Disable 2FA')}</PendingLabel></Button></div>
        </Modal>
      ) : null}
      {backupCodes.length && !twoFactorSetup && twoFactorData?.enabled ? (
        <Modal className="relative max-h-[90svh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border bg-background p-5 text-foreground shadow-xl" backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" label={t('New backup codes')} onClose={() => setBackupCodes([])}>
          <Button type="button" variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t('Close')} onClick={() => setBackupCodes([])}><X /></Button>
          <p className="pe-10 text-xs font-medium text-muted-foreground">{t('Backup codes').toUpperCase()}</p>
          <h2 className="mt-1 pe-10 text-lg font-semibold">{t('New backup codes')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('Each code can be used once. Store them somewhere secure.')}</p>
          <code className="mt-4 block whitespace-pre-wrap break-all rounded-md border bg-muted/20 p-3 text-xs leading-6">{backupCodes.join('\n')}</code>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => void navigator.clipboard.writeText(backupCodes.join('\n'))}><Copy />{t('Copy all')}</Button><Button type="button" onClick={() => setBackupCodes([])}>{t('Done')}</Button></div>
        </Modal>
      ) : null}
      {securityAction ? (
        <Modal className="relative max-h-[90svh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border bg-background p-5 text-foreground shadow-xl" backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" label={securityAction === 'delete-passkey' ? t('Delete Passkey') : t('Register Passkey')} onClose={passkeyMutation.isPending ? undefined : () => setSecurityAction(null)}>
          <Button type="button" variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t('Close')} disabled={passkeyMutation.isPending} onClick={() => setSecurityAction(null)}><X /></Button>
          <p className="pe-10 text-xs font-medium text-muted-foreground">{t('Security verification').toUpperCase()}</p>
          <h2 className="mt-1 pe-10 text-lg font-semibold">{securityAction === 'delete-passkey' ? t('Delete Passkey') : t('Register Passkey')}</h2>
          {twoFactorData?.enabled ? <div className="mt-4 space-y-2"><Label htmlFor="security-verification-code">{t('Authenticator or backup code')}</Label><Input id="security-verification-code" data-modal-initial-focus value={securityCode} disabled={passkeyMutation.isPending} onChange={(event) => setSecurityCode(event.target.value)} autoComplete="one-time-code" /></div> : <p className="mt-2 text-sm text-muted-foreground">{securityAction === 'delete-passkey' ? t('Your device will ask you to verify the existing Passkey.') : t('Use your device biometrics or security key for phishing-resistant verification.')}</p>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={passkeyMutation.isPending} onClick={() => setSecurityAction(null)}>{t('Cancel')}</Button><Button type="button" variant={securityAction === 'delete-passkey' ? 'destructive' : 'default'} disabled={passkeyMutation.isPending || (Boolean(twoFactorData?.enabled) && !securityCode)} onClick={() => passkeyMutation.mutate(securityAction)}><Fingerprint /><PendingLabel pending={passkeyMutation.isPending} pendingText={t('Saving')}>{t('Verify and continue')}</PendingLabel></Button></div>
        </Modal>
      ) : null}
      {confirmAccessToken ? (
        <Modal className="relative max-h-[90svh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border bg-background p-5 text-foreground shadow-xl" backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" label={accessToken ? t('System access token') : t('Generate access token?')} onClose={accessTokenMutation.isPending ? undefined : () => { setConfirmAccessToken(false); setAccessToken('') }}>
          <Button type="button" variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t('Close')} disabled={accessTokenMutation.isPending} onClick={() => { setConfirmAccessToken(false); setAccessToken('') }}><X /></Button>
          <p className="pe-10 text-xs font-medium text-muted-foreground">{t('Confirm system credential').toUpperCase()}</p>
          <h2 className="mt-1 pe-10 text-lg font-semibold">{accessToken ? t('System access token') : t('Generate access token?')}</h2>
          {accessToken ? <><p className="mt-2 text-sm text-muted-foreground">{t('The full token is shown only in this window.')}</p><div className="mt-4 flex min-w-0 items-center rounded-md border bg-muted/20"><code className="min-w-0 flex-1 break-all px-3 py-2 text-xs">{accessToken}</code><Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label={t('Copy')} onClick={() => void copyAccessToken()}><Copy /></Button></div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => void copyAccessToken()}><Copy />{t('Copy')}</Button><Button type="button" onClick={() => { setConfirmAccessToken(false); setAccessToken('') }}>{t('Done')}</Button></div></> : <><p className="mt-2 text-sm text-muted-foreground">{t('Generating a new token invalidates the previous value. The full token is shown only in this window.')}</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={accessTokenMutation.isPending} onClick={() => setConfirmAccessToken(false)}>{t('Cancel')}</Button><Button type="button" disabled={accessTokenMutation.isPending} onClick={() => accessTokenMutation.mutate()}><PendingLabel pending={accessTokenMutation.isPending} pendingText={t('Saving')}>{t('Confirm')}</PendingLabel></Button></div></>}
        </Modal>
      ) : null}
      {deleteConfirmation ? (
        <Modal className="relative max-h-[90svh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border border-destructive/30 bg-background p-5 text-foreground shadow-xl" backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" label={t('Delete account')} onClose={deleteMutation.isPending ? undefined : () => setDeleteConfirmation(false)}>
          <Button type="button" variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t('Close')} disabled={deleteMutation.isPending} onClick={() => setDeleteConfirmation(false)}><X /></Button>
          <p className="pe-10 text-xs font-medium text-destructive">{t('Delete account').toUpperCase()}</p>
          <h2 className="mt-1 pe-10 text-lg font-semibold">{t('Delete account')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('This permanently disables your account. Enter your password and type your username to confirm.')}</p>
          <div className="mt-4 space-y-2"><Label htmlFor="delete-account-password">{t('Password')}</Label><Input id="delete-account-password" data-modal-initial-focus type="password" value={deletePassword} disabled={deleteMutation.isPending} onChange={(event) => setDeletePassword(event.target.value)} /></div>
          <div className="mt-4 space-y-2"><Label htmlFor="delete-account-username">{t('Type username to confirm')}: <code>{user?.username}</code></Label><Input id="delete-account-username" value={deletePhrase} disabled={deleteMutation.isPending} onChange={(event) => setDeletePhrase(event.target.value)} /></div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteConfirmation(false)}>{t('Cancel')}</Button><Button type="button" variant="destructive" disabled={!deletePassword || deletePhrase !== user?.username || deleteMutation.isPending} onClick={() => deleteMutation.mutate()}><Trash2 /><PendingLabel pending={deleteMutation.isPending} pendingText={t('Saving')}>{t('Permanently delete')}</PendingLabel></Button></div>
        </Modal>
      ) : null}
    </div>
  )
}
