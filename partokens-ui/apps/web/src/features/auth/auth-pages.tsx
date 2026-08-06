import { useLocation, useNavigate, useParams } from '@tanstack/react-router'
import {
  AtSign,
  Check,
  Copy,
  KeyRound,
  Mail,
  Route,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import {
  confirmPasswordReset,
  exchangeOAuth,
  getSelf,
  login,
  loginTwoFactor,
  register,
  sendEmailVerification,
  sendPasswordReset,
  type CurrentUser,
} from '@partokens/api-client'
import { isAppLocale, resolvePreferredLocale, type AppLocale } from '@partokens/i18n'

import { canonicalConsolePath } from '@/lib/routes'
import { useSessionStore } from '@/stores/session'

import { useAuthFlowStore } from './auth-flow-store'
import {
  AccountSwitch,
  AuthField,
  AuthFrame,
  InlineStatus,
  LegalConsent,
  LoaderCircle,
  LockKeyhole,
  OAuthButtons,
  PageHeading,
  PasswordField,
  RouteButton,
  TextAction,
  TurnstileField,
  authErrorMessage,
  useAuthLocale,
  useAuthStatus,
} from './auth-shell'
import {
  cleanBackupCode,
  clearOAuthBindContext,
  clearOAuthLoginContext,
  formatBackupCode,
  isOAuthBindCallback,
  maskEmail,
  readOAuthLoginContext,
  readRegistrationContext,
  resolveAuthReturnPath,
  saveRegistrationContext,
} from './auth-utils'

async function authDestination(locale: AppLocale, fallbackUser: CurrentUser, returnTo?: string | null): Promise<void> {
  let user = fallbackUser
  try {
    const self = await getSelf()
    if (self.success && self.data) user = self.data
  } catch {
    // The validated login bundle is sufficient when the follow-up read is temporarily unavailable.
  }

  if (user.role >= 10) {
    window.location.assign('/channels')
    return
  }

  const queryReturn = new URLSearchParams(window.location.search).get('redirect')
  const safeReturn = resolveAuthReturnPath(returnTo || queryReturn, locale)
  window.location.assign(safeReturn || canonicalConsolePath(locale, 'overview'))
}

function StatusFailure(props: { retry: () => void }) {
  const { t } = useTranslation()
  return <InlineStatus error>
    <span>{t('The authentication service is temporarily unavailable. Try again.')}</span>
    <button type="button" onClick={props.retry}>{t('Retry')}</button>
  </InlineStatus>
}

export function SignInPage() {
  const { t } = useTranslation()
  const locale = useAuthLocale()
  const navigate = useNavigate()
  const status = useAuthStatus()
  const setPendingTwoFactor = useSessionStore((state) => state.setPendingTwoFactor)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [turnstile, setTurnstile] = useState('')
  const turnstileRequired = Boolean(status.data?.data.turnstile_check)
  const passwordLoginEnabled = status.data?.data.password_login_enabled !== false

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!consent || !username.trim() || !password || busy || !passwordLoginEnabled) return
    setBusy(true)
    setError('')
    try {
      const result = await login({ username: username.trim(), password, turnstile: turnstile || undefined })
      if (!result.success || !result.data) throw new Error(result.message || t('Sign in failed'))
      if ('require_2fa' in result.data) {
        setPendingTwoFactor(result.data)
        await navigate({ to: '/$locale/auth/otp', params: { locale }, search: true })
        return
      }
      await authDestination(locale, result.data.user)
    } catch (cause) {
      setError(authErrorMessage(cause, t, t('Sign in failed')))
      setBusy(false)
    }
  }

  return <AuthFrame screen="sign-in">
    <PageHeading eyebrow="PARTOKENS ID" title={t('Sign in')} body={t('Continue with your account password. Email codes are only for registration and account binding.')} />
    {status.isError ? <StatusFailure retry={() => void status.refetch()} /> : null}
    {passwordLoginEnabled ? <form className="r32-auth-form" onSubmit={(event) => void submit(event)}>
      <AuthField label={t('Username or email')} value={username} onChange={setUsername} icon={AtSign} autoComplete="username" required autoFocus name="username" />
      <PasswordField label={t('Password')} value={password} onChange={setPassword} autoComplete="current-password" name="password" />
      <TextAction onClick={() => void navigate({ to: '/$locale/auth/forgot-password', params: { locale } })}>{t('Forgot password')}</TextAction>
      <LegalConsent checked={consent} onChange={setConsent} />
      {turnstileRequired ? <TurnstileField siteKey={status.data?.data.turnstile_site_key} onToken={setTurnstile} /> : null}
      {turnstileRequired && !status.data?.data.turnstile_site_key ? <InlineStatus error>{t('Security verification is unavailable. Try again later.')}</InlineStatus> : null}
      {error ? <InlineStatus error>{error}</InlineStatus> : null}
      <RouteButton type="submit" disabled={!consent || !username.trim() || !password || busy || status.isPending || (turnstileRequired && !turnstile)}>
        {busy ? <LoaderCircle className="r32-spin" size={16} /> : <LockKeyhole size={16} />}{t('Sign in')}
      </RouteButton>
    </form> : <InlineStatus error>{t('Password sign-in is currently unavailable.')}</InlineStatus>}
    <OAuthButtons status={status.data?.data} allowed={consent} />
    <AccountSwitch prompt={t('Create account')} action={t('Sign up')} href={`/${locale}/auth/sign-up`} />
  </AuthFrame>
}

export function SignUpPage() {
  const { t } = useTranslation()
  const locale = useAuthLocale()
  const navigate = useNavigate()
  const status = useAuthStatus()
  const fields = useAuthFlowStore((state) => state.registration)
  const updateFields = useAuthFlowStore((state) => state.updateRegistration)
  const clearRegistration = useAuthFlowStore((state) => state.clearRegistration)
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [turnstile, setTurnstile] = useState('')
  const [turnstileEpoch, setTurnstileEpoch] = useState(0)
  const [cooldown, setCooldown] = useState(() => Math.max(0, Math.ceil((readRegistrationContext().sentAt + 60_000 - Date.now()) / 1000)))
  const emailVerification = Boolean(status.data?.data.email_verification)
  const turnstileRequired = Boolean(status.data?.data.turnstile_check)
  const registrationEnabled = status.data?.data.register_enabled !== false && status.data?.data.password_register_enabled !== false

  useEffect(() => {
    const affiliate = new URLSearchParams(window.location.search).get('aff')
    if (affiliate && affiliate.length <= 32) window.localStorage.setItem('aff', affiliate)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const sendCode = async () => {
    if (!fields.email || sending || cooldown > 0 || (turnstileRequired && !turnstile)) return
    setSending(true)
    setError('')
    try {
      const result = await sendEmailVerification({ email: fields.email.trim(), turnstile: turnstile || undefined })
      if (!result.success) throw new Error(result.message || t('Unable to send code'))
      saveRegistrationContext(fields.email.trim())
      setMessage(t('Verification code sent. Check your inbox.'))
      setCooldown(60)
      if (turnstileRequired) {
        setTurnstile('')
        setTurnstileEpoch((value) => value + 1)
      }
    } catch (cause) {
      setError(authErrorMessage(cause, t, t('Unable to send code')))
    } finally {
      setSending(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !registrationEnabled) return
    if (!fields.consent || fields.password !== fields.confirm || fields.password.length < 8) {
      if (!fields.consent) setError(t('Consent is required'))
      else if (fields.password !== fields.confirm) setError(t('Passwords do not match'))
      else setError(t('Use at least 8 characters and a password unique to this account.'))
      return
    }
    if (emailVerification && !fields.verificationCode) {
      setError(t('Enter the verification code sent to your email.'))
      return
    }

    setBusy(true)
    setError('')
    try {
      const payload: Record<string, string> = {
        username: fields.username.trim(),
        password: fields.password,
      }
      if (fields.email.trim()) payload.email = fields.email.trim()
      if (emailVerification) payload.verification_code = fields.verificationCode
      const affiliate = window.localStorage.getItem('aff')
      if (affiliate) payload.aff_code = affiliate
      if (turnstile) payload.turnstile = turnstile
      const result = await register(payload)
      if (!result.success) throw new Error(result.message || t('Registration failed'))
      clearRegistration()
      window.location.assign(`/${locale}/auth/sign-in`)
    } catch (cause) {
      setError(authErrorMessage(cause, t, t('Registration failed')))
      setBusy(false)
    }
  }

  if (status.data && !registrationEnabled) {
    return <AuthFrame screen="sign-up-unavailable">
      <PageHeading eyebrow="PARTOKENS ID" title={t('Sign up')} body={t('Registration is currently unavailable.')} />
      <RouteButton onClick={() => window.location.assign(`/${locale}/auth/sign-in`)}><LockKeyhole size={16} />{t('Sign in')}</RouteButton>
    </AuthFrame>
  }

  return <AuthFrame screen="sign-up">
    <PageHeading eyebrow="PARTOKENS ID" title={t('Create account')} body={t('Create an account and verify your email when the service requires it.')} />
    {status.isError ? <StatusFailure retry={() => void status.refetch()} /> : null}
    <form className="r32-auth-form" onSubmit={(event) => void submit(event)}>
      <AuthField label={t('Username')} value={fields.username} onChange={(username) => updateFields({ username })} icon={AtSign} autoComplete="username" required autoFocus name="username" />
      <AuthField label={t('Email')} value={fields.email} onChange={(email) => updateFields({ email, verificationCode: email === fields.email ? fields.verificationCode : '' })} icon={AtSign} type="email" autoComplete="email" required={emailVerification} name="email" />
      {emailVerification ? <>
        <AuthField
          label={t('Verification code')}
          value={fields.verificationCode}
          onChange={(verificationCode) => updateFields({ verificationCode })}
          icon={ShieldCheck}
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          name="verification-code"
          action={<button type="button" className="pt-button r32-send-code" data-variant="quiet" data-size="small" disabled={!fields.email || sending || cooldown > 0 || (turnstileRequired && !turnstile)} onClick={() => void sendCode()}>{sending ? <LoaderCircle className="r32-spin" size={14} /> : cooldown > 0 ? `${cooldown}s` : t('Send code')}</button>}
        />
        {message ? <InlineStatus action={<button type="button" onClick={() => void navigate({ to: '/$locale/auth/verify-email', params: { locale } })}>{t('Verify')}</button>}>{message}</InlineStatus> : null}
      </> : null}
      <div className="r32-auth-field-grid">
        <PasswordField label={t('Password')} value={fields.password} onChange={(password) => updateFields({ password })} autoComplete="new-password" name="new-password" />
        <PasswordField label={t('Confirm password')} value={fields.confirm} onChange={(confirm) => updateFields({ confirm })} autoComplete="new-password" name="confirm-password" />
      </div>
      <p className="r32-auth-password-hint">{t('Use at least 8 characters and a password unique to this account.')}</p>
      {fields.confirm && fields.password !== fields.confirm ? <InlineStatus error>{t('Passwords do not match')}</InlineStatus> : null}
      <LegalConsent checked={fields.consent} onChange={(consent) => updateFields({ consent })} />
      {turnstileRequired ? <TurnstileField key={turnstileEpoch} siteKey={status.data?.data.turnstile_site_key} onToken={setTurnstile} /> : null}
      {error ? <InlineStatus error>{error}</InlineStatus> : null}
      <RouteButton type="submit" disabled={busy || status.isPending || !fields.username.trim() || !fields.password || !fields.confirm || !fields.consent || (emailVerification && (!fields.email || !fields.verificationCode)) || (turnstileRequired && !turnstile)}>
        {busy ? <LoaderCircle className="r32-spin" size={16} /> : <ShieldCheck size={16} />}{t('Create account')}
      </RouteButton>
    </form>
    <OAuthButtons status={status.data?.data} allowed={fields.consent} registration />
    <AccountSwitch prompt={t('Already registered?')} action={t('Sign in')} href={`/${locale}/auth/sign-in`} />
  </AuthFrame>
}

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const locale = useAuthLocale()
  const navigate = useNavigate()
  const status = useAuthStatus()
  const registration = useAuthFlowStore((state) => state.registration)
  const updateRegistration = useAuthFlowStore((state) => state.updateRegistration)
  const context = readRegistrationContext()
  const email = registration.email || context.email
  const [code, setCode] = useState(registration.verificationCode)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(email ? t('Verification code sent. Check your inbox.') : '')
  const [turnstile, setTurnstile] = useState('')
  const [cooldown, setCooldown] = useState(() => Math.max(0, Math.ceil((context.sentAt + 60_000 - Date.now()) / 1000)))
  const turnstileRequired = Boolean(status.data?.data.turnstile_check)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const resend = async () => {
    if (!email || sending || cooldown > 0 || (turnstileRequired && !turnstile)) return
    setSending(true)
    setError('')
    try {
      const result = await sendEmailVerification({ email, turnstile: turnstile || undefined })
      if (!result.success) throw new Error(result.message || t('Unable to send code'))
      saveRegistrationContext(email)
      setMessage(t('Verification code sent. Check your inbox.'))
      setCooldown(60)
    } catch (cause) {
      setError(authErrorMessage(cause, t, t('Unable to send code')))
    } finally {
      setSending(false)
    }
  }

  const verify = (event: FormEvent) => {
    event.preventDefault()
    if (!email || !code.trim()) return
    updateRegistration({ email, verificationCode: code.trim() })
    void navigate({ to: '/$locale/auth/sign-up', params: { locale } })
  }

  return <AuthFrame screen="verify-email">
    <PageHeading eyebrow="EMAIL" title={t('Verify your email')} body={t('Enter the code sent to your email to verify the contact address for registration.')} backLabel={t('Sign up')} onBack={() => void navigate({ to: '/$locale/auth/sign-up', params: { locale } })} />
    <form className="r32-auth-form" onSubmit={verify}>
      <AuthField label={t('Email')} value={email} icon={Mail} type="email" readOnly name="email" />
      <AuthField label={t('Verification code')} value={code} onChange={setCode} icon={ShieldCheck} inputMode="numeric" autoComplete="one-time-code" required autoFocus name="verification-code" />
      {message ? <InlineStatus>{message}</InlineStatus> : null}
      {error ? <InlineStatus error>{error}</InlineStatus> : null}
      {!email ? <InlineStatus error>{t('Start registration before verifying an email address.')}</InlineStatus> : null}
      <RouteButton type="submit" disabled={!email || !code.trim()}><ShieldCheck size={16} />{t('Verify')}</RouteButton>
      {turnstileRequired ? <TurnstileField siteKey={status.data?.data.turnstile_site_key} onToken={setTurnstile} /> : null}
      <button type="button" className="pt-button r32-auth-secondary-command" data-variant="secondary" disabled={!email || sending || cooldown > 0 || (turnstileRequired && !turnstile)} onClick={() => void resend()}>
        {sending ? <LoaderCircle className="r32-spin" size={16} /> : <Mail size={16} />}{cooldown > 0 ? t('Send again in {{seconds}}s', { seconds: cooldown }) : t('Send code')}
      </button>
    </form>
  </AuthFrame>
}

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const locale = useAuthLocale()
  const status = useAuthStatus()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [turnstile, setTurnstile] = useState('')
  const turnstileRequired = Boolean(status.data?.data.turnstile_check)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || sent || !email) return
    setBusy(true)
    setError('')
    try {
      const result = await sendPasswordReset(email.trim(), turnstile || undefined)
      if (!result.success) throw new Error(result.message || t('Unable to send reset email'))
      setSent(true)
    } catch (cause) {
      setError(authErrorMessage(cause, t, t('Unable to send reset email')))
    } finally {
      setBusy(false)
    }
  }

  return <AuthFrame screen="forgot-password">
    <PageHeading eyebrow="RECOVERY" title={t('Forgot password')} body={t('Enter the registered email to receive a one-time password reset link.')} backLabel={t('Return to sign in')} onBack={() => window.location.assign(`/${locale}/auth/sign-in`)} />
    <form className="r32-auth-form" onSubmit={(event) => void submit(event)}>
      <AuthField label={t('Email')} value={email} onChange={setEmail} icon={Mail} type="email" autoComplete="email" required autoFocus name="email" />
      {turnstileRequired ? <TurnstileField siteKey={status.data?.data.turnstile_site_key} onToken={setTurnstile} /> : null}
      {sent ? <InlineStatus>{t('If the account exists, a password reset link has been sent.')}</InlineStatus> : null}
      {error ? <InlineStatus error>{error}</InlineStatus> : null}
      <RouteButton type="submit" disabled={!email || busy || sent || status.isPending || (turnstileRequired && !turnstile)}>
        {busy ? <LoaderCircle className="r32-spin" size={16} /> : <Mail size={16} />}{t('Send reset link')}
      </RouteButton>
    </form>
  </AuthFrame>
}

export function OtpPage() {
  const { t } = useTranslation()
  const locale = useAuthLocale()
  const pendingTwoFactor = useSessionStore((state) => state.pendingTwoFactor)
  const setPendingTwoFactor = useSessionStore((state) => state.setPendingTwoFactor)
  const [backup, setBackup] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const expired = !pendingTwoFactor || pendingTwoFactor.expires_at <= Math.floor(Date.now() / 1000)
  const valid = backup ? cleanBackupCode(code).length === 8 : /^\d{6}$/.test(code)

  useEffect(() => {
    if (pendingTwoFactor && expired) setPendingTwoFactor(null)
  }, [expired, pendingTwoFactor, setPendingTwoFactor])

  const cancel = () => {
    setPendingTwoFactor(null)
    window.location.assign(`/${locale}/auth/sign-in`)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (expired || !pendingTwoFactor || !valid || busy) return
    setBusy(true)
    setError('')
    try {
      const submittedCode = backup ? cleanBackupCode(code) : code
      const result = await loginTwoFactor(submittedCode, pendingTwoFactor.flow_token)
      if (!result.success || !result.data) throw new Error(result.message || t('Verification failed'))
      await authDestination(locale, result.data.user)
    } catch (cause) {
      setError(authErrorMessage(cause, t, t('Verification failed')))
      setBusy(false)
    }
  }

  return <AuthFrame screen="two-factor">
    <PageHeading eyebrow="SECURITY" title={t('Two-factor verification')} body={backup ? t('Each backup code works once and becomes invalid after verification.') : t('Enter an authenticator code or backup code to finish signing in.')} backLabel={t('Return to sign in')} onBack={cancel} />
    {expired ? <>
      <InlineStatus error>{t('Login flow expired. Please sign in again.')}</InlineStatus>
      <RouteButton onClick={cancel}><LockKeyhole size={16} />{t('Return to sign in')}</RouteButton>
    </> : <form className="r32-auth-form" onSubmit={(event) => void submit(event)}>
      <AuthField
        label={backup ? t('Backup code') : t('Authenticator code')}
        value={code}
        onChange={(value) => setCode(backup ? formatBackupCode(value) : value.replace(/\D/g, '').slice(0, 6))}
        icon={backup ? KeyRound : ShieldCheck}
        inputMode={backup ? 'text' : 'numeric'}
        autoComplete="one-time-code"
        required
        autoFocus
        maxLength={backup ? 9 : 6}
        name="verification-code"
      />
      <TextAction alignStart onClick={() => { setBackup((current) => !current); setCode(''); setError('') }}>{backup ? t('Use an authenticator code') : t('Use a backup code')}</TextAction>
      {error ? <InlineStatus error>{error}</InlineStatus> : null}
      <RouteButton type="submit" disabled={!valid || busy}>{busy ? <LoaderCircle className="r32-spin" size={16} /> : <ShieldCheck size={16} />}{t('Verify')}</RouteButton>
    </form>}
  </AuthFrame>
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    const input = document.createElement('textarea')
    input.value = value
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    return copied
  }
}

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const locale = useAuthLocale()
  const search = new URLSearchParams(useLocation({ select: (state) => state.searchStr }))
  const email = search.get('email') || ''
  const token = search.get('token') || ''
  const validLink = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && token.length > 0
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [retryAt, setRetryAt] = useState(0)
  const retryBlocked = retryAt > Date.now()

  useEffect(() => {
    if (!retryAt) return
    const timer = window.setTimeout(() => setRetryAt(0), Math.max(0, retryAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [retryAt])

  const confirm = async () => {
    if (!validLink || busy || retryBlocked) return
    setBusy(true)
    setError('')
    try {
      const result = await confirmPasswordReset({ email, token })
      if (!result.success || typeof result.data !== 'string' || !result.data) throw new Error(result.message || t('Reset failed'))
      setPassword(result.data)
      window.history.replaceState(window.history.state, '', window.location.pathname)
    } catch (cause) {
      setError(authErrorMessage(cause, t, t('This reset link is invalid or has expired. Request a new one.')))
      setRetryAt(Date.now() + 30_000)
    } finally {
      setBusy(false)
    }
  }

  const copyPassword = async () => setCopied(await copyText(password))

  return <AuthFrame screen="reset-password">
    <PageHeading eyebrow="RECOVERY" title={t('Reset password')} body={password ? t('The full new password is shown only once on this page. Store it now.') : t('After the reset link is confirmed, the service will issue a new account password.')} backLabel={t('Return to sign in')} onBack={() => window.location.assign(`/${locale}/auth/sign-in`)} />
    {password ? <div className="r32-generated-password">
      <span><Check size={16} />{t('New password')}</span>
      <div><code>{password}</code><button type="button" className="pt-icon-button" aria-label={copied ? t('Password copied.') : t('Copy password')} title={copied ? t('Password copied.') : t('Copy password')} onClick={() => void copyPassword()}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
      <small role="status" aria-live="polite" data-copied={copied || undefined}>{copied ? t('Password copied.') : t('The full new password is shown only once on this page. Store it now.')}</small>
      <button type="button" className="pt-button r32-auth-secondary-command" data-variant="secondary" onClick={() => window.location.assign(`/${locale}/auth/sign-in`)}>{t('Return to sign in')}</button>
    </div> : <div className="r32-reset-confirm">
      {validLink ? <div><Mail size={17} /><span><small>{t('Email')}</small><strong>{maskEmail(email)}</strong></span></div> : <InlineStatus error>{t('This reset link is incomplete or invalid.')}</InlineStatus>}
      {error ? <InlineStatus error>{error}</InlineStatus> : null}
      <RouteButton disabled={!validLink || busy || retryBlocked} onClick={() => void confirm()}>{busy ? <LoaderCircle className="r32-spin" size={16} /> : <KeyRound size={16} />}{t('Reset password')}</RouteButton>
      {!validLink || error ? <a className="pt-button r32-auth-secondary-command" data-variant="secondary" href={`/${locale}/auth/forgot-password`}>{t('Request a new reset link')}</a> : null}
    </div>}
  </AuthFrame>
}

type OAuthView = 'loading' | 'ready' | 'binding' | 'error'

export function OAuthCallbackPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { provider?: string }
  const search = new URLSearchParams(useLocation({ select: (state) => state.searchStr }))
  const provider = params.provider || ''
  const context = readOAuthLoginContext(provider)
  const locale: AppLocale = isAppLocale(context.locale || undefined) ? context.locale as AppLocale : resolvePreferredLocale()
  const [view, setView] = useState<OAuthView>('loading')
  const [error, setError] = useState('')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const exchangeStarted = useRef(false)

  useEffect(() => {
    if (exchangeStarted.current) return
    exchangeStarted.current = true
    const state = search.get('state') || ''
    const code = search.get('code') || undefined
    const providerError = search.get('error') || undefined
    const providerErrorDescription = search.get('error_description') || undefined
    const validProvider = /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(provider)
    const binding = validProvider && isOAuthBindCallback(provider, state)

    if (!validProvider || !state || (!code && !providerError)) {
      setError(t('OAuth callback is incomplete.'))
      setView('error')
      return
    }
    window.history.replaceState({}, '', `/oauth/${encodeURIComponent(provider)}`)

    if (binding) {
      if (!window.opener) {
        setError(t('OAuth callback is incomplete.'))
        setView('error')
        clearOAuthBindContext(provider)
        return
      }
      setView('binding')
      window.opener.postMessage({ source: 'partokens-oauth-bind', provider, code, state, error: providerError, error_description: providerErrorDescription }, window.location.origin)
      clearOAuthBindContext(provider)
      return
    }

    if (context.state !== state) {
      clearOAuthLoginContext(provider)
      setError(t('OAuth state is invalid or has expired.'))
      setView('error')
      return
    }

    void exchangeOAuth(provider, { code, state, error: providerError, error_description: providerErrorDescription }, 'login')
      .then((result) => {
        if (!result.success) throw new Error(result.message || t('OAuth failed'))
        if (!result.data || 'action' in result.data) throw new Error(t('Unable to load account'))
        setUser(result.data.user)
        setView('ready')
      })
      .catch((cause) => {
        setError(authErrorMessage(cause, t, t('OAuth failed')))
        setView('error')
        clearOAuthLoginContext(provider)
      })
  }, [context.state, provider, search, t])

  useEffect(() => {
    if (view !== 'ready' || !user) return
    const timer = window.setTimeout(() => {
      const returnTo = context.returnTo
      clearOAuthLoginContext(provider)
      void authDestination(locale, user, returnTo)
    }, 420)
    return () => window.clearTimeout(timer)
  }, [context.returnTo, locale, provider, user, view])

  const ready = view === 'ready'
  return <AuthFrame screen="oauth-callback" locale={locale}>
    <PageHeading eyebrow="OAUTH" title={ready ? t('Sign-in confirmed') : view === 'binding' ? t('Completing account connection') : t('Completing sign in')} body={ready ? t('The provider response and account route are confirmed. The workspace is ready.') : view === 'binding' ? t('Return to the account window to finish the connection.') : t('The provider response is being verified before the account role is resolved.')} backLabel={view === 'error' ? t('Return to sign in') : undefined} onBack={view === 'error' ? () => window.location.assign(`/${locale}/auth/sign-in`) : undefined} />
    <div className="r32-oauth-route" data-complete={ready || undefined} aria-live="polite">
      <div><span className="r32-provider-glyph">{provider.charAt(0).toUpperCase() || 'O'}</span><small>{t('Selected provider')}</small><strong>{provider || 'OAuth'}</strong></div>
      <span><i /><Route size={18} /></span>
      <div><span>{ready || view === 'binding' ? <Check size={19} /> : view === 'error' ? <LockKeyhole size={19} /> : <LoaderCircle className="r32-spin" size={19} />}</span><small>{ready ? t('Account route') : view === 'binding' ? t('Account connection') : view === 'error' ? t('Verification failed') : t('Verifying provider response')}</small><strong>{ready ? t('User workspace') : 'Partokens ID'}</strong></div>
    </div>
    {error ? <InlineStatus error>{error}</InlineStatus> : <p className={`r32-auth-process-note${ready ? ' is-complete' : ''}`}><LockKeyhole size={15} />{ready ? t('The sign-in response is confirmed and the account session can continue.') : view === 'binding' ? t('The provider response was returned to the account window.') : t('The provider response is being verified.')}</p>}
    {ready ? <RouteButton disabled><ShieldCheck size={16} />{t('Entering workspace')}</RouteButton> : null}
    {view === 'error' ? <button type="button" className="pt-button r32-auth-secondary-command" data-variant="secondary" onClick={() => window.location.assign(`/${locale}/auth/sign-in`)}>{t('Return to sign in')}</button> : null}
  </AuthFrame>
}
