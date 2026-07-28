import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Fingerprint, KeyRound, Link2, LoaderCircle, LockKeyhole, Mail, RefreshCw, Settings2, ShieldCheck, Trash2, UserRound, X } from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
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
  getCheckinStatus,
  getOAuthBindings,
  getPasskeyStatus,
  getStatus,
  getTwoFactorStatus,
  performCheckin,
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
import { isAppLocale, localeLabels, locales, type AppLocale } from '@partokens/i18n'

import { Modal } from '@/components/modal'
import { PageHeader } from '@/components/ui'
import { quotaDollarsToUnits, quotaUnitsToDollars } from '@/lib/format'
import { buildAssertionResult, buildRegistrationResult, isPasskeySupported, prepareCredentialCreationOptions, prepareCredentialRequestOptions } from '@/lib/passkey'
import { useSessionStore } from '@/stores/session'
import { startOAuthAuthorization, TurnstileField } from './auth-pages'

type ProfileTab = 'account' | 'security' | 'preferences'
type SecurityAction = 'register-passkey' | 'delete-passkey' | null
type ParsedSettings = UserSettingsInput & { language?: string }

function parseSettings(value?: string): ParsedSettings {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed as ParsedSettings : {}
  } catch {
    return {}
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

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const prefix = (first.getDay() + 6) % 7
  return [...Array.from({ length: prefix }, () => null), ...Array.from({ length: count }, (_, index) => index + 1)]
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
  const { user, setUser, signOut } = useSessionStore()
  const client = useQueryClient()
  const settings = useMemo(() => parseSettings(user?.setting || user?.settings), [user?.setting, user?.settings])
  const [tab, setTab] = useState<ProfileTab>('account')
  const [message, setMessage] = useState(new URLSearchParams(window.location.search).get('binding') === 'success' ? t('Account connected') : '')
  const [error, setError] = useState('')
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailCooldown, setEmailCooldown] = useState(0)
  const [emailTurnstile, setEmailTurnstile] = useState('')
  const [month, setMonth] = useState(() => new Date())
  const [checkinTurnstile, setCheckinTurnstile] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [confirmAccessToken, setConfirmAccessToken] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [securityAction, setSecurityAction] = useState<SecurityAction>(null)
  const [securityCode, setSecurityCode] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)
  const [deletePhrase, setDeletePhrase] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [originalPassword, setOriginalPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [language, setLanguage] = useState<AppLocale>(isAppLocale(settings.language) ? settings.language : locale)
  const [notifyType, setNotifyType] = useState(settings.notify_type || 'email')
  const [warningQuota, setWarningQuota] = useState(quotaUnitsToDollars(settings.quota_warning_threshold || 500_000))
  const [notificationEmail, setNotificationEmail] = useState(settings.notification_email || '')
  const [webhookUrl, setWebhookUrl] = useState(settings.webhook_url || '')
  const [webhookSecret, setWebhookSecret] = useState(settings.webhook_secret || '')
  const [barkUrl, setBarkUrl] = useState(settings.bark_url || '')
  const [gotifyUrl, setGotifyUrl] = useState(settings.gotify_url || '')
  const [gotifyToken, setGotifyToken] = useState(settings.gotify_token || '')
  const [gotifyPriority, setGotifyPriority] = useState(settings.gotify_priority ?? 5)
  const [acceptUnsetRatio, setAcceptUnsetRatio] = useState(settings.accept_unset_model_ratio_model || false)
  const [recordIpLog, setRecordIpLog] = useState(settings.record_ip_log || false)

  const status = useQuery({ queryKey: ['status'], queryFn: getStatus, staleTime: 60_000 })
  const oauthBindings = useQuery({ queryKey: ['oauth-bindings'], queryFn: getOAuthBindings, retry: false })
  const twoFactor = useQuery({ queryKey: ['two-factor-status'], queryFn: getTwoFactorStatus, retry: false })
  const passkey = useQuery({ queryKey: ['passkey-status'], queryFn: getPasskeyStatus, retry: false })
  const checkin = useQuery({ queryKey: ['checkin', monthKey(month)], queryFn: () => getCheckinStatus(monthKey(month)), retry: false })
  const turnstileRequired = Boolean(status.data?.data.turnstile_check)

  useEffect(() => setDisplayName(user?.display_name || ''), [user?.display_name])
  useEffect(() => {
    if (emailCooldown <= 0) return
    const timer = window.setInterval(() => setEmailCooldown((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [emailCooldown])

  const resetFeedback = () => { setMessage(''); setError('') }
  const success = (value: string) => { setError(''); setMessage(value) }
  const failure = (cause: unknown, fallback: string) => { setMessage(''); setError(t(errorMessage(cause, fallback))) }

  const saveProfile = useMutation({
    mutationFn: async () => {
      const response = await updateProfile({ display_name: displayName.trim() })
      if (!response.success) throw new Error(response.message || t('Unable to save profile'))
    },
    onMutate: resetFeedback,
    onSuccess: () => { if (user) setUser({ ...user, display_name: displayName.trim() }); success(t('Profile updated')) },
    onError: (cause) => failure(cause, t('Unable to save profile')),
  })

  const sendBindCode = useMutation({
    mutationFn: async () => {
      const response = await sendEmailVerification({ email: email.trim(), turnstile: emailTurnstile || undefined })
      if (!response.success) throw new Error(response.message || t('Unable to send code'))
    },
    onMutate: resetFeedback,
    onSuccess: () => { setEmailCooldown(60); success(t('Verification code sent')) },
    onError: (cause) => failure(cause, t('Unable to send code')),
  })

  const bindEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await bindEmail(email.trim(), emailCode.trim())
      if (!response.success) throw new Error(response.message || t('Unable to bind email'))
    },
    onMutate: resetFeedback,
    onSuccess: () => { setEmail(''); setEmailCode(''); success(t('Email connected')); void client.invalidateQueries({ queryKey: ['self'] }) },
    onError: (cause) => failure(cause, t('Unable to bind email')),
  })

  const checkinMutation = useMutation({
    mutationFn: async () => {
      const response = await performCheckin(checkinTurnstile || undefined)
      if (!response.success) throw new Error(response.message || t('Check-in failed'))
      return response.data.quota_awarded
    },
    onMutate: resetFeedback,
    onSuccess: (quota) => { success(`${t('Checked in')}: ${quotaUnitsToDollars(quota).toFixed(2)} USD`); void checkin.refetch() },
    onError: (cause) => failure(cause, t('Check-in failed')),
  })

  const accessTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await getAccessToken()
      if (!response.success || !response.data) throw new Error(response.message || t('Unable to generate access token'))
      return response.data
    },
    onMutate: resetFeedback,
    onSuccess: (token) => { setAccessToken(token); setConfirmAccessToken(false) },
    onError: (cause) => failure(cause, t('Unable to generate access token')),
  })

  const setupTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const response = await setupTwoFactor()
      if (!response.success) throw new Error(response.message || t('Unable to set up 2FA'))
      return response.data
    },
    onMutate: resetFeedback,
    onSuccess: (data) => { setTwoFactorSetup(data); setBackupCodes(data.backup_codes); setTwoFactorCode('') },
    onError: (cause) => failure(cause, t('Unable to set up 2FA')),
  })

  const enableTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const response = await enableTwoFactor(twoFactorCode.trim())
      if (!response.success) throw new Error(response.message || t('Unable to enable 2FA'))
    },
    onSuccess: () => { success(t('2FA enabled')); void twoFactor.refetch() },
    onError: (cause) => failure(cause, t('Unable to enable 2FA')),
  })

  const disableTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const response = await disableTwoFactor(twoFactorCode.trim())
      if (!response.success) throw new Error(response.message || t('Unable to disable 2FA'))
    },
    onMutate: resetFeedback,
    onSuccess: () => { setTwoFactorCode(''); success(t('2FA disabled')); void twoFactor.refetch() },
    onError: (cause) => failure(cause, t('Unable to disable 2FA')),
  })

  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await regenerateBackupCodes(twoFactorCode.trim())
      if (!response.success) throw new Error(response.message || t('Unable to regenerate backup codes'))
      return response.data.backup_codes
    },
    onMutate: resetFeedback,
    onSuccess: (codes) => { setBackupCodes(codes); setTwoFactorCode(''); success(t('Backup codes regenerated')); void twoFactor.refetch() },
    onError: (cause) => failure(cause, t('Unable to regenerate backup codes')),
  })

  const passkeyMutation = useMutation({
    mutationFn: async (action: Exclude<SecurityAction, null>) => {
      if (action === 'register-passkey') {
        if (twoFactor.data?.data.enabled) {
          const verified = await verifySensitiveAction('2fa', securityCode.trim())
          if (!verified.success) throw new Error(verified.message || t('Security verification failed'))
        }
        await registerBrowserPasskey()
        return t('Passkey registered')
      }
      if (twoFactor.data?.data.enabled) {
        const verified = await verifySensitiveAction('2fa', securityCode.trim())
        if (!verified.success) throw new Error(verified.message || t('Security verification failed'))
      } else {
        await verifyBrowserPasskey()
      }
      const removed = await deletePasskey()
      if (!removed.success) throw new Error(removed.message || t('Unable to delete Passkey'))
      return t('Passkey deleted')
    },
    onMutate: resetFeedback,
    onSuccess: (value) => { setSecurityAction(null); setSecurityCode(''); success(value); void passkey.refetch() },
    onError: (cause) => failure(cause, t('Passkey operation failed')),
  })

  const savePassword = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) throw new Error(t('Password must contain at least 8 characters'))
      if (newPassword !== confirmPassword) throw new Error(t('Passwords do not match'))
      const response = await updateProfile({ original_password: originalPassword, password: newPassword })
      if (!response.success) throw new Error(response.message || t('Unable to change password'))
    },
    onMutate: resetFeedback,
    onSuccess: () => { setOriginalPassword(''); setNewPassword(''); setConfirmPassword(''); success(t('Password updated')) },
    onError: (cause) => failure(cause, t('Unable to change password')),
  })

  const savePreferences = useMutation({
    mutationFn: async () => {
      const payload: UserSettingsInput = { notify_type: notifyType, quota_warning_threshold: quotaDollarsToUnits(warningQuota), notification_email: notificationEmail.trim(), webhook_url: webhookUrl.trim(), webhook_secret: webhookSecret, bark_url: barkUrl.trim(), gotify_url: gotifyUrl.trim(), gotify_token: gotifyToken, gotify_priority: gotifyPriority, accept_unset_model_ratio_model: acceptUnsetRatio, record_ip_log: recordIpLog }
      const response = await updateUserSettings(payload)
      if (!response.success) throw new Error(response.message || t('Unable to save preferences'))
      if (language !== locale) {
        const languageResponse = await updateUserLanguage(language)
        if (!languageResponse.success) throw new Error(languageResponse.message || t('Unable to save language'))
      }
      return payload
    },
    onMutate: resetFeedback,
    onSuccess: (payload) => {
      if (user) setUser({ ...user, setting: JSON.stringify({ ...settings, ...payload, language }) })
      success(t('Preferences updated'))
      if (language !== locale) window.location.assign(`${window.location.pathname.replace(/^\/[^/]+/, `/${language}`)}${window.location.search}`)
    },
    onError: (cause) => failure(cause, t('Unable to save preferences')),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await deleteAccount(deletePassword)
      if (!response.success) throw new Error(response.message || t('Unable to delete account'))
    },
    onMutate: resetFeedback,
    onSuccess: async () => { await signOut(); window.location.assign(`/${locale}/`) },
    onError: (cause) => failure(cause, t('Unable to delete account')),
  })

  const customBindings = oauthBindings.data?.data || []
  const googleProvider = status.data?.data.custom_oauth_providers?.find((provider) => provider.name.toLowerCase().includes('google'))
  const builtInBindings: Array<[string, string, boolean, boolean]> = [
    ['GitHub', 'github', Boolean(user?.github_id), Boolean(status.data?.data.github_client_id)],
    ['LinuxDO', 'linuxdo', Boolean(user?.linux_do_id), Boolean(status.data?.data.linuxdo_client_id)],
    [
      'Google / OIDC',
      googleProvider?.slug || 'oidc',
      Boolean(user?.oidc_id || (googleProvider && customBindings.some((item) => item.provider_id === String(googleProvider.id)))),
      Boolean(googleProvider || status.data?.data.oidc_client_id),
    ],
  ]
  const checkedDates = new Set(checkin.data?.data.stats.records.map((record) => record.checkin_date) || [])
  const today = new Date()
  const weekdayLabels = useMemo(() => Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, index + 1))), [locale])

  const startBinding = async (provider: string) => {
    if (!status.data?.data) return
    resetFeedback()
    try {
      await startOAuthAuthorization({ provider, status: status.data.data, locale, intent: 'bind' })
      await oauthBindings.refetch()
      success(t('Account connected'))
    }
    catch (cause) { failure(cause, t('Unable to connect account')) }
  }

  return (
    <div className="console-page profile-page">
      <PageHeader eyebrow={t('Console account')} title={t('Profile')} description={t('Manage account details, connected services, preferences, and security.')} />
      <div className="profile-tabs" role="tablist">{([['account', UserRound, 'Account'], ['security', ShieldCheck, 'Security'], ['preferences', Settings2, 'Preferences']] as const).map(([value, Icon, label]) => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}><Icon size={16} />{t(label)}</button>)}</div>
      {message ? <div className="form-success profile-feedback"><Check size={15} />{message}</div> : null}
      {error ? <div className="form-error profile-feedback" role="alert">{error}</div> : null}

      {tab === 'account' ? <>
        <div className="profile-grid">
          <form className="panel profile-form" onSubmit={(event) => { event.preventDefault(); saveProfile.mutate() }}><div className="panel-heading"><div><span className="eyebrow">{t('Identity')}</span><h2>{t('Account profile')}</h2></div></div><label><span>{t('Display name')}</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label><span>{t('Username')}</span><input value={user?.username || ''} disabled /></label><label><span>{t('Email')}</span><input value={user?.email || t('Not bound')} disabled /></label><button className="button primary-button" disabled={saveProfile.isPending}>{saveProfile.isPending ? t('Saving') : t('Save profile')}</button></form>
          <section className="panel checkin-panel"><div className="panel-heading"><div><span className="eyebrow">{t('Daily credit')}</span><h2>{t('Daily check-in')}</h2></div><CalendarDays size={19} /></div>{checkin.data?.data.enabled === false ? <div className="data-state">{t('Check-in is unavailable')}</div> : <><div className="calendar-heading"><button className="icon-button" aria-label={t('Previous month')} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></button><strong>{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)}</strong><button className="icon-button" aria-label={t('Next month')} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></button></div><div className="checkin-calendar"><div className="calendar-weekdays">{weekdayLabels.map((day, index) => <span key={`${day}:${index}`}>{day}</span>)}</div><div className="calendar-days">{monthDays(month).map((day, index) => { const key = day ? `${monthKey(month)}-${String(day).padStart(2, '0')}` : ''; const isToday = day === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear(); return <span key={`${day}:${index}`} className={`${checkedDates.has(key) ? 'checked ' : ''}${isToday ? 'today' : ''}`}>{day || ''}{checkedDates.has(key) ? <Check size={10} /> : null}</span> })}</div></div><div className="checkin-summary"><span>{t('This month')}: {checkin.data?.data.stats.checkin_count || 0}</span><span>{t('Total earned')}: {quotaUnitsToDollars(checkin.data?.data.stats.total_quota || 0).toFixed(2)} USD</span></div>{turnstileRequired && !checkin.data?.data.stats.checked_in_today ? <TurnstileField siteKey={status.data?.data.turnstile_site_key} onToken={setCheckinTurnstile} /> : null}<button className="button primary-button" disabled={checkinMutation.isPending || checkin.data?.data.stats.checked_in_today || (turnstileRequired && !checkinTurnstile)} onClick={() => checkinMutation.mutate()}>{checkin.data?.data.stats.checked_in_today ? <Check size={16} /> : <CalendarDays size={16} />}{checkin.data?.data.stats.checked_in_today ? t('Checked in today') : t('Check in')}</button></>}</section>
        </div>
        <section className="panel bindings-panel">
          <div className="panel-heading"><div><span className="eyebrow">{t('Connected services')}</span><h2>{t('Account bindings')}</h2></div><Link2 size={19} /></div>
          <div className="binding-list">
            <div className="binding-row">
              <div><Mail size={18} /><span><strong>{t('Email')}</strong><small>{user?.email || t('Not connected')}</small></span></div>
              {user?.email ? <span className="status-badge healthy">{t('Connected')}</span> : (
                <div className="email-bind-form">
                  <input type="email" placeholder="mail@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                  <input inputMode="numeric" placeholder={t('Verification code')} value={emailCode} onChange={(event) => setEmailCode(event.target.value)} />
                  <button className="button secondary-button" disabled={!email || emailCooldown > 0 || sendBindCode.isPending || (turnstileRequired && !emailTurnstile)} onClick={() => sendBindCode.mutate()}>{emailCooldown > 0 ? `${emailCooldown}s` : t('Send code')}</button>
                  <button className="button primary-button" disabled={!email || !emailCode || bindEmailMutation.isPending} onClick={() => bindEmailMutation.mutate()}>{t('Connect')}</button>
                </div>
              )}
            </div>
            {!user?.email && turnstileRequired ? <TurnstileField siteKey={status.data?.data.turnstile_site_key} onToken={setEmailTurnstile} /> : null}
            {builtInBindings.map(([label, provider, connected, enabled]) => (
              <div className="binding-row" key={label}>
                <div><ExternalLink size={18} /><span><strong>{label}</strong><small>{connected ? t('Connected') : enabled ? t('Available to connect') : t('Unavailable')}</small></span></div>
                {connected ? <span className="status-badge healthy">{t('Connected')}</span> : <button className="button secondary-button" disabled={!enabled} onClick={() => void startBinding(provider)}>{t('Connect')}</button>}
              </div>
            ))}
            {customBindings.filter((binding) => !googleProvider || binding.provider_id !== String(googleProvider.id)).map((binding) => (
              <div className="binding-row" key={binding.provider_id}>
                <div><Link2 size={18} /><span><strong>{binding.provider_name}</strong><small>{binding.external_id || t('Connected')}</small></span></div>
                <button className="button secondary-button danger-text" onClick={() => { if (window.confirm(t('Disconnect this account?'))) void unbindOAuth(binding.provider_id).then(() => oauthBindings.refetch()) }}>{t('Disconnect')}</button>
              </div>
            ))}
          </div>
        </section>
      </> : null}

      {tab === 'security' ? <>
        <div className="security-grid">
          <section className="panel security-card"><div className="panel-heading"><div><span className="eyebrow">TOTP</span><h2>{t('Two-factor authentication')}</h2></div><LockKeyhole size={19} /></div><p>{t('Use an authenticator app and backup codes to protect account access.')}</p><div className="security-status"><span>{t('Status')}</span><strong className={twoFactor.data?.data.enabled ? 'available-text' : ''}>{twoFactor.data?.data.enabled ? t('Enabled') : t('Disabled')}</strong></div>{twoFactor.data?.data.enabled ? <><div className="security-status"><span>{t('Backup codes remaining')}</span><strong>{twoFactor.data.data.backup_codes_remaining ?? 0}</strong></div><label><span>{t('Authenticator or backup code')}</span><input value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" /></label><div className="security-actions"><button className="button secondary-button" disabled={!twoFactorCode || backupMutation.isPending} onClick={() => backupMutation.mutate()}><RefreshCw size={15} />{t('Regenerate backup codes')}</button><button className="button secondary-button danger-text" disabled={!twoFactorCode || disableTwoFactorMutation.isPending} onClick={() => disableTwoFactorMutation.mutate()}>{t('Disable 2FA')}</button></div></> : <button className="button primary-button" disabled={setupTwoFactorMutation.isPending} onClick={() => setupTwoFactorMutation.mutate()}><ShieldCheck size={16} />{t('Set up 2FA')}</button>}</section>
          <section className="panel security-card"><div className="panel-heading"><div><span className="eyebrow">WEBAUTHN</span><h2>{t('Passkey')}</h2></div><Fingerprint size={19} /></div><p>{t('Use your device biometrics or security key for phishing-resistant verification.')}</p><div className="security-status"><span>{t('Status')}</span><strong className={passkey.data?.data.enabled ? 'available-text' : ''}>{passkey.data?.data.enabled ? t('Enabled') : t('Disabled')}</strong></div>{passkey.data?.data.last_used_at ? <div className="security-status"><span>{t('Last used')}</span><strong>{passkey.data.data.last_used_at}</strong></div> : null}{passkey.data?.data.enabled ? <button className="button secondary-button danger-text" onClick={() => setSecurityAction('delete-passkey')}><Trash2 size={15} />{t('Delete Passkey')}</button> : <button className="button primary-button" disabled={!isPasskeySupported()} onClick={() => twoFactor.data?.data.enabled ? setSecurityAction('register-passkey') : passkeyMutation.mutate('register-passkey')}><Fingerprint size={16} />{t('Register Passkey')}</button>}</section>
        </div>
        <section className="panel access-token-panel"><div className="panel-heading"><div><span className="eyebrow">{t('System credential')}</span><h2>{t('System access token')}</h2></div><KeyRound size={19} /></div><p>{t('This token grants access to account-level system APIs. Generate it only when required.')}</p>{accessToken ? <div className="secret-value"><code>{accessToken}</code><button className="icon-button" aria-label={t('Copy')} onClick={() => void navigator.clipboard.writeText(accessToken)}><Copy size={16} /></button></div> : null}<button className="button secondary-button" onClick={() => setConfirmAccessToken(true)}>{accessToken ? t('Regenerate token') : t('Generate token')}</button></section>
        <form className="panel password-form" onSubmit={(event: FormEvent) => { event.preventDefault(); savePassword.mutate() }}><div className="panel-heading"><div><span className="eyebrow">{t('Password')}</span><h2>{t('Change password')}</h2></div><ShieldCheck size={19} /></div><div className="password-fields"><label><span>{t('Current password')}</span><input type="password" autoComplete="current-password" value={originalPassword} onChange={(event) => setOriginalPassword(event.target.value)} required /></label><label><span>{t('New password')}</span><input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label><label><span>{t('Confirm password')}</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label></div><div className="form-footer"><button className="button primary-button" disabled={savePassword.isPending}>{t('Update password')}</button></div></form>
        <section className="panel danger-zone"><div><span className="eyebrow">{t('Danger zone')}</span><h2>{t('Delete account')}</h2><p>{t('Permanently disable this account and revoke access. This action cannot be undone.')}</p></div><button className="button secondary-button danger-text" onClick={() => setDeleteConfirmation(true)}><Trash2 size={15} />{t('Delete account')}</button></section>
      </> : null}

      {tab === 'preferences' ? <form className="panel preferences-form" onSubmit={(event) => { event.preventDefault(); savePreferences.mutate() }}><div className="panel-heading"><div><span className="eyebrow">{t('Preferences')}</span><h2>{t('Notifications and behavior')}</h2></div><Settings2 size={19} /></div><div className="preferences-grid"><label><span>{t('Interface language')}</span><select value={language} onChange={(event) => setLanguage(event.target.value as AppLocale)}>{locales.map((item) => <option key={item} value={item}>{localeLabels[item]}</option>)}</select></label><label><span>{t('Notification method')}</span><select value={notifyType} onChange={(event) => setNotifyType(event.target.value)}><option value="email">Email</option><option value="webhook">Webhook</option><option value="bark">Bark</option><option value="gotify">Gotify</option></select></label><label><span>{t('Balance warning in USD')}</span><input type="number" min="0.01" step="0.01" value={warningQuota} onChange={(event) => setWarningQuota(Number(event.target.value))} /></label>{notifyType === 'email' ? <label><span>{t('Notification email')}</span><input type="email" value={notificationEmail} onChange={(event) => setNotificationEmail(event.target.value)} /></label> : null}{notifyType === 'webhook' ? <><label><span>{t('Webhook URL')}</span><input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} /></label><label><span>{t('Webhook secret')}</span><input type="password" value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} /></label></> : null}{notifyType === 'bark' ? <label><span>{t('Bark push URL')}</span><input type="url" value={barkUrl} onChange={(event) => setBarkUrl(event.target.value)} /></label> : null}{notifyType === 'gotify' ? <><label><span>{t('Gotify server URL')}</span><input type="url" value={gotifyUrl} onChange={(event) => setGotifyUrl(event.target.value)} /></label><label><span>{t('Gotify application token')}</span><input type="password" value={gotifyToken} onChange={(event) => setGotifyToken(event.target.value)} /></label><label><span>{t('Message priority')}</span><input type="number" min="0" max="10" value={gotifyPriority} onChange={(event) => setGotifyPriority(Number(event.target.value))} /></label></> : null}</div><div className="preference-switches"><label className="switch-row"><span><strong>{t('Allow models without configured pricing')}</strong><small>{t('Requests may use models whose price has not been set')}</small></span><input type="checkbox" checked={acceptUnsetRatio} onChange={(event) => setAcceptUnsetRatio(event.target.checked)} /></label><label className="switch-row"><span><strong>{t('Record request IP in logs')}</strong><small>{t('Store source IP addresses in your private usage logs')}</small></span><input type="checkbox" checked={recordIpLog} onChange={(event) => setRecordIpLog(event.target.checked)} /></label></div><div className="form-footer"><button className="button primary-button" disabled={savePreferences.isPending}>{t('Save preferences')}</button></div></form> : null}

      {twoFactorSetup ? <Modal className="dialog two-factor-dialog" label={t('Set up 2FA')} onClose={() => setTwoFactorSetup(null)}><button className="dialog-close icon-button" aria-label={t('Close')} onClick={() => setTwoFactorSetup(null)}><X size={17} /></button><span className="eyebrow">{t('Set up two-factor authentication')}</span><h2>{t('Set up 2FA')}</h2><p>{t('Scan the QR code, save the backup codes, then enter the current authenticator code.')}</p><div className="two-factor-setup"><div className="qr-frame"><QRCodeSVG value={twoFactorSetup.qr_code_data} size={164} level="M" /></div><div><span>{t('Manual setup key')}</span><div className="secret-value"><code>{twoFactorSetup.secret}</code><button className="icon-button" aria-label={t('Copy')} onClick={() => void navigator.clipboard.writeText(twoFactorSetup.secret)}><Copy size={16} /></button></div></div></div><div className="backup-codes"><div><strong>{t('Backup codes')}</strong><button className="text-button" onClick={() => void navigator.clipboard.writeText(backupCodes.join('\n'))}><Copy size={14} />{t('Copy all')}</button></div><code>{backupCodes.join('\n')}</code></div><label className="dialog-field"><span>{t('Authenticator code')}</span><input data-modal-initial-focus value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" /></label><div className="dialog-actions"><button className="button secondary-button" onClick={() => setTwoFactorSetup(null)}>{t('Close')}</button><button className="button primary-button" disabled={!twoFactorCode || enableTwoFactorMutation.isPending} onClick={() => enableTwoFactorMutation.mutate()}>{enableTwoFactorMutation.isPending ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />}{t('Enable 2FA')}</button></div></Modal> : null}
      {backupCodes.length && !twoFactorSetup && twoFactor.data?.data.enabled ? <Modal label={t('New backup codes')} onClose={() => setBackupCodes([])}><button className="dialog-close icon-button" aria-label={t('Close')} onClick={() => setBackupCodes([])}><X size={17} /></button><span className="eyebrow">{t('Backup codes')}</span><h2>{t('New backup codes')}</h2><p>{t('Each code can be used once. Store them somewhere secure.')}</p><div className="backup-codes"><code>{backupCodes.join('\n')}</code></div><div className="dialog-actions"><button className="button secondary-button" onClick={() => void navigator.clipboard.writeText(backupCodes.join('\n'))}><Copy size={15} />{t('Copy all')}</button><button className="button primary-button" onClick={() => setBackupCodes([])}>{t('Done')}</button></div></Modal> : null}
      {securityAction ? <Modal label={securityAction === 'delete-passkey' ? t('Delete Passkey') : t('Register Passkey')} onClose={() => setSecurityAction(null)}><span className="eyebrow">{t('Security verification')}</span><h2>{securityAction === 'delete-passkey' ? t('Delete Passkey') : t('Register Passkey')}</h2>{twoFactor.data?.data.enabled ? <label className="dialog-field"><span>{t('Authenticator or backup code')}</span><input data-modal-initial-focus value={securityCode} onChange={(event) => setSecurityCode(event.target.value)} autoComplete="one-time-code" /></label> : <p>{t('Your device will ask you to verify the existing Passkey.')}</p>}<div className="dialog-actions"><button className="button secondary-button" onClick={() => setSecurityAction(null)}>{t('Cancel')}</button><button className={securityAction === 'delete-passkey' ? 'button secondary-button danger-text' : 'button primary-button'} disabled={passkeyMutation.isPending || (Boolean(twoFactor.data?.data.enabled) && !securityCode)} onClick={() => passkeyMutation.mutate(securityAction)}>{passkeyMutation.isPending ? <LoaderCircle className="spin" size={16} /> : <Fingerprint size={16} />}{t('Verify and continue')}</button></div></Modal> : null}
      {confirmAccessToken ? <Modal label={accessToken ? t('Regenerate access token?') : t('Generate access token?')} onClose={() => setConfirmAccessToken(false)}><span className="eyebrow">{t('Confirm system credential')}</span><h2>{accessToken ? t('Regenerate access token?') : t('Generate access token?')}</h2><p>{t('Generating a new token invalidates the previous value. The full token is shown only in this window.')}</p><div className="dialog-actions"><button className="button secondary-button" onClick={() => setConfirmAccessToken(false)}>{t('Cancel')}</button><button className="button primary-button" onClick={() => accessTokenMutation.mutate()}>{t('Confirm')}</button></div></Modal> : null}
      {deleteConfirmation ? <Modal className="dialog delete-account-dialog" label={t('Delete account')} onClose={() => setDeleteConfirmation(false)}><span className="eyebrow">{t('Delete account')}</span><h2>{t('Delete account')}</h2><p>{t('This permanently disables your account. Enter your password and type your username to confirm.')}</p><label className="dialog-field"><span>{t('Password')}</span><input data-modal-initial-focus type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} /></label><label className="dialog-field"><span>{t('Type username to confirm')}: <code>{user?.username}</code></span><input value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} /></label><div className="dialog-actions"><button className="button secondary-button" onClick={() => setDeleteConfirmation(false)}>{t('Cancel')}</button><button className="button secondary-button danger-text" disabled={!deletePassword || deletePhrase !== user?.username || deleteMutation.isPending} onClick={() => deleteMutation.mutate()}><Trash2 size={15} />{t('Permanently delete')}</button></div></Modal> : null}
    </div>
  )
}
