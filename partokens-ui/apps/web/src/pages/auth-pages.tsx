import { useQuery } from '@tanstack/react-query'
import { useLocation, useParams } from '@tanstack/react-router'
import { ArrowLeft, Check, Github, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  confirmPasswordReset,
  exchangeOAuth,
  getOAuthState,
  getSelf,
  getStatus,
  login,
  loginTwoFactor,
  register,
  sendEmailVerification,
  sendPasswordReset,
  type CurrentUser,
  type PartokensStatus,
} from '@partokens/api-client'
import { isAppLocale, resolvePreferredLocale, type AppLocale } from '@partokens/i18n'

import { Brand } from '@/components/brand'
import { useSessionStore } from '@/stores/session'

function useLocale(): AppLocale {
  const params = useParams({ strict: false }) as { locale?: string }
  return isAppLocale(params.locale) ? params.locale : resolvePreferredLocale()
}

function authDestination(locale: AppLocale, user: CurrentUser) {
  useSessionStore.getState().setUser(user)
  window.location.assign(user.role >= 10 ? '/channels' : `/${locale}/console/overview`)
}

function responseError(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data
    if (data?.message) return data.message
  }
  return error instanceof Error ? error.message : fallback
}

export async function startOAuthAuthorization(input: {
  provider: 'github' | 'linuxdo' | 'oidc' | string
  status: PartokensStatus
  locale: AppLocale
  intent?: 'login' | 'bind'
}) {
  let { provider } = input
  const google = input.status.custom_oauth_providers?.find((item) => item.name.toLowerCase().includes('google'))
  window.localStorage.setItem('partokens-oauth-locale', input.locale)
  window.localStorage.setItem('partokens-oauth-intent', input.intent || 'login')
  const state = await getOAuthState()
  if (!state) throw new Error('OAuth state unavailable')
  let target: URL
  if (provider === 'github' && input.status.github_client_id) {
    target = new URL('https://github.com/login/oauth/authorize')
    target.searchParams.set('client_id', input.status.github_client_id)
    target.searchParams.set('state', state)
    target.searchParams.set('scope', 'user:email')
  } else if (provider === 'linuxdo' && input.status.linuxdo_client_id) {
    target = new URL('https://connect.linux.do/oauth2/authorize')
    target.searchParams.set('client_id', input.status.linuxdo_client_id)
    target.searchParams.set('state', state)
    target.searchParams.set('response_type', 'code')
  } else {
    const custom = google ?? (input.status.oidc_authorization_endpoint && input.status.oidc_client_id ? {
      slug: 'oidc', client_id: input.status.oidc_client_id, authorization_endpoint: input.status.oidc_authorization_endpoint, scopes: 'openid profile email',
    } : undefined)
    if (!custom) throw new Error('Provider unavailable')
    provider = custom.slug
    target = new URL(custom.authorization_endpoint)
    target.searchParams.set('client_id', custom.client_id)
    target.searchParams.set('redirect_uri', `${window.location.origin}/oauth/${provider}`)
    target.searchParams.set('response_type', 'code')
    target.searchParams.set('scope', custom.scopes || 'openid profile email')
    target.searchParams.set('state', state)
  }
  window.location.assign(target.toString())
}

export function TurnstileField({ siteKey, onToken }: { siteKey?: string; onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let widgetId = ''
    let cancelled = false
    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetId) return
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': () => onToken(''),
      })
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-partokens-turnstile]')
    if (existing) {
      if (window.turnstile) render()
      else existing.addEventListener('load', render, { once: true })
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.partokensTurnstile = 'true'
      script.addEventListener('load', render, { once: true })
      document.head.appendChild(script)
    }
    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [onToken, siteKey])
  if (!siteKey) return null
  return <div ref={containerRef} className="turnstile-field" />
}

function AuthFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const status = useQuery({ queryKey: ['status'], queryFn: getStatus, staleTime: 60_000 })
  return (
    <main className="auth-page">
      <aside className="auth-signal">
        <a href={`/${locale}/`} className="brand-link"><Brand /></a>
        <div className="auth-signal-body">
          <span className="eyebrow">{t('Secure account access')}</span>
          <div className="auth-signal-mark"><KeyRound size={30} /></div>
          <h1>Partokens</h1>
          <p>{t('Model access, measured clearly.')}</p>
          <div className="auth-health"><span className={status.data?.success ? 'status-dot healthy' : 'status-dot pending'} />{status.data?.success ? t('Available') : t('Awaiting status')}</div>
        </div>
        <a className="auth-back" href={`/${locale}/`}><ArrowLeft size={15} />{t('Home')}</a>
      </aside>
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <header><span className="eyebrow">{t('Partokens account')}</span><h2>{title}</h2><p>{description}</p></header>
          {children}
        </div>
      </section>
    </main>
  )
}

function LegalConsent({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <label className="consent-field">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{t('I agree to the User Agreement, Terms of Service, and Privacy Policy.')}</span>
      <span className="consent-links">
        <a href={`/${locale}/legal/user-agreement`}>{t('User Agreement')}</a>
        <a href={`/${locale}/legal/service-agreement`}>{t('Terms of Service')}</a>
        <a href={`/${locale}/legal/privacy-policy`}>{t('Privacy Policy')}</a>
      </span>
    </label>
  )
}

function OAuthButtons({ status, allowed }: { status?: PartokensStatus; allowed: boolean }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const google = useMemo(() => status?.custom_oauth_providers?.find((provider) => provider.name.toLowerCase().includes('google')),
    [status?.custom_oauth_providers])

  const start = async (provider: 'github' | 'linuxdo' | 'oidc' | string) => {
    if (!allowed) return
    setBusy(provider)
    setError('')
    try {
      if (!status) throw new Error(t('Provider unavailable'))
      await startOAuthAuthorization({ provider, status, locale, intent: 'login' })
    } catch (cause) {
      setError(t(responseError(cause, t('OAuth unavailable'))))
      setBusy(null)
    }
  }

  return (
    <div className="oauth-wrap">
      <div className="form-divider"><span>{t('or')}</span></div>
      <div className="oauth-grid">
        <button type="button" className="button oauth-button" disabled={!allowed || !status?.github_client_id || busy != null} onClick={() => void start('github')}><Github size={17} />{t('Continue with GitHub')}</button>
        <button type="button" className="button oauth-button" disabled={!allowed || !status?.linuxdo_client_id || busy != null} onClick={() => void start('linuxdo')}><span className="provider-glyph">L</span>{t('Continue with LinuxDO')}</button>
        <button type="button" className="button oauth-button" disabled={!allowed || (!google && !status?.oidc_client_id) || busy != null} onClick={() => void start(google?.slug || 'oidc')}><span className="provider-glyph google-glyph">G</span>{t('Continue with Google')}</button>
      </div>
      {error ? <div className="form-error" role="alert">{error}</div> : null}
    </div>
  )
}

export function SignInPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const status = useQuery({ queryKey: ['status'], queryFn: getStatus, staleTime: 60_000 })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [turnstile, setTurnstile] = useState('')
  const turnstileRequired = Boolean(status.data?.data.turnstile_check)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!consent) return
    setBusy(true)
    setError('')
    try {
      const result = await login({ username, password, turnstile: turnstile || undefined })
      if (!result.success) throw new Error(result.message || t('Sign in failed'))
      if (result.data.require_2fa) {
        window.location.assign(`/${locale}/auth/otp`)
        return
      }
      if (result.data.id != null) {
        window.localStorage.setItem('partokens-user-id', String(result.data.id))
      }
      const self = await getSelf()
      if (!self.success || !self.data) throw new Error(self.message || t('Unable to load account'))
      authDestination(locale, self.data)
    } catch (cause) {
      setError(responseError(cause, t('Sign in failed')))
      setBusy(false)
    }
  }

  return (
    <AuthFrame title={t('Sign in')} description={t('Use your account credentials to continue.')}>
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label><span>{t('Username or email')}</span><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
        <label><span>{t('Password')}</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <div className="form-row"><a href={`/${locale}/auth/forgot-password`}>{t('Forgot password')}</a></div>
        <LegalConsent checked={consent} onChange={setConsent} />
        {turnstileRequired ? <TurnstileField siteKey={status.data?.data.turnstile_site_key} onToken={setTurnstile} /> : null}
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <button className="button primary-button auth-submit" disabled={!consent || busy || (turnstileRequired && !turnstile)} type="submit">{busy ? <LoaderCircle className="spin" size={17} /> : <LockKeyhole size={17} />}{t('Sign in')}</button>
      </form>
      <OAuthButtons status={status.data?.data} allowed={consent} />
      <p className="auth-switch">{t('Create account')} <a href={`/${locale}/auth/sign-up`}>{t('Sign up')}</a></p>
    </AuthFrame>
  )
}

export function SignUpPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const status = useQuery({ queryKey: ['status'], queryFn: getStatus, staleTime: 60_000 })
  const emailVerification = Boolean(status.data?.data.email_verification)
  const [fields, setFields] = useState({ username: '', email: '', password: '', confirm: '', verification_code: '' })
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [turnstile, setTurnstile] = useState('')
  const turnstileRequired = Boolean(status.data?.data.turnstile_check)

  useEffect(() => {
    const aff = new URLSearchParams(window.location.search).get('aff')
    if (aff) window.localStorage.setItem('aff', aff)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const sendCode = async () => {
    setError('')
    try {
      const result = await sendEmailVerification({ email: fields.email, turnstile: turnstile || undefined })
      if (!result.success) throw new Error(result.message || t('Unable to send code'))
      setMessage(t('Verification code sent'))
      setCooldown(60)
    } catch (cause) { setError(responseError(cause, t('Unable to send code'))) }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!consent || fields.password !== fields.confirm) {
      setError(fields.password !== fields.confirm ? t('Passwords do not match') : t('Consent is required'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload: Record<string, string> = { username: fields.username, password: fields.password }
      if (fields.email) payload.email = fields.email
      if (emailVerification) payload.verification_code = fields.verification_code
      const aff = window.localStorage.getItem('aff')
      if (aff) payload.aff_code = aff
      if (turnstile) payload.turnstile = turnstile
      const result = await register(payload)
      if (!result.success) throw new Error(result.message || t('Registration failed'))
      window.location.assign(`/${locale}/auth/sign-in`)
    } catch (cause) {
      setError(responseError(cause, t('Registration failed')))
      setBusy(false)
    }
  }

  if (status.data && status.data.data.register_enabled === false) {
    return <AuthFrame title={t('Sign up')} description={t('Registration is currently unavailable.')}><a className="button secondary-button" href={`/${locale}/auth/sign-in`}>{t('Sign in')}</a></AuthFrame>
  }

  return (
    <AuthFrame title={t('Create account')} description={t('Create a Partokens account with a verified contact address.')}>
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label><span>{t('Username')}</span><input autoComplete="username" value={fields.username} onChange={(event) => setFields({ ...fields, username: event.target.value })} required /></label>
        <label><span>{t('Email')}</span><input type="email" autoComplete="email" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} required={emailVerification} /></label>
        {emailVerification ? <label><span>{t('Verification code')}</span><div className="input-action"><input inputMode="numeric" value={fields.verification_code} onChange={(event) => setFields({ ...fields, verification_code: event.target.value })} required /><button type="button" disabled={!fields.email || cooldown > 0} onClick={() => void sendCode()}>{cooldown > 0 ? `${cooldown}s` : t('Send code')}</button></div></label> : null}
        <label><span>{t('Password')}</span><input type="password" autoComplete="new-password" minLength={8} value={fields.password} onChange={(event) => setFields({ ...fields, password: event.target.value })} required /></label>
        <label><span>{t('Confirm password')}</span><input type="password" autoComplete="new-password" value={fields.confirm} onChange={(event) => setFields({ ...fields, confirm: event.target.value })} required /></label>
        <LegalConsent checked={consent} onChange={setConsent} />
        {turnstileRequired ? <TurnstileField siteKey={status.data?.data.turnstile_site_key} onToken={setTurnstile} /> : null}
        {message ? <div className="form-success"><Check size={15} />{message}</div> : null}
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <button className="button primary-button auth-submit" disabled={!consent || busy || (turnstileRequired && !turnstile)} type="submit">{busy ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />}{t('Create account')}</button>
      </form>
      <p className="auth-switch">{t('Already registered?')} <a href={`/${locale}/auth/sign-in`}>{t('Sign in')}</a></p>
    </AuthFrame>
  )
}

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const status = useQuery({ queryKey: ['status'], queryFn: getStatus, staleTime: 60_000 })
  const [turnstile, setTurnstile] = useState('')
  const turnstileRequired = Boolean(status.data?.data.turnstile_check)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await sendPasswordReset(email, turnstile || undefined)
      if (!result.success) throw new Error(result.message || t('Unable to send reset email'))
      setMessage(t('If the account exists, a password reset link has been sent.'))
    } catch (cause) { setError(responseError(cause, t('Unable to send reset email'))) }
    finally { setBusy(false) }
  }
  return <AuthFrame title={t('Forgot password')} description={t('Request a one-time reset link for your account.')}><form className="auth-form" onSubmit={(event) => void submit(event)}><label><span>{t('Email')}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{turnstileRequired ? <TurnstileField siteKey={status.data?.data.turnstile_site_key} onToken={setTurnstile} /> : null}{message ? <div className="form-success"><Mail size={15} />{message}</div> : null}{error ? <div className="form-error">{error}</div> : null}<button className="button primary-button auth-submit" disabled={busy || (turnstileRequired && !turnstile)} type="submit">{busy ? <LoaderCircle className="spin" size={17} /> : <Mail size={17} />}{t('Send reset link')}</button></form><p className="auth-switch"><a href={`/${locale}/auth/sign-in`}>{t('Sign in')}</a></p></AuthFrame>
}

export function OtpPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await loginTwoFactor(code)
      if (!result.success || !result.data) throw new Error(result.message || t('Verification failed'))
      authDestination(locale, result.data)
    } catch (cause) { setError(responseError(cause, t('Verification failed'))); setBusy(false) }
  }
  return <AuthFrame title={t('Two-factor verification')} description={t('Enter an authenticator or backup code to finish signing in.')}><form className="auth-form" onSubmit={(event) => void submit(event)}><label><span>{t('Verification code')}</span><input autoFocus autoComplete="one-time-code" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} required /></label>{error ? <div className="form-error">{error}</div> : null}<button className="button primary-button auth-submit" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />}{t('Verify')}</button></form></AuthFrame>
}

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const search = new URLSearchParams(useLocation({ select: (state) => state.searchStr }))
  const email = search.get('email') || ''
  const token = search.get('token') || ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const confirm = async () => {
    setBusy(true); setError('')
    try {
      const result = await confirmPasswordReset({ email, token })
      if (!result.success) throw new Error(result.message || t('Reset failed'))
      setPassword(result.data)
    } catch (cause) { setError(responseError(cause, t('Reset failed'))) }
    finally { setBusy(false) }
  }
  return <AuthFrame title={t('Reset password')} description={t('Validate this reset link and issue a new account password.')}>{password ? <div className="generated-password"><span>{t('New password')}</span><code>{password}</code><button className="button secondary-button" onClick={() => void navigator.clipboard.writeText(password)}>{t('Copy password')}</button><a href={`/${locale}/auth/sign-in`}>{t('Return to sign in')}</a></div> : <div className="auth-form">{!email || !token ? <div className="form-error">{t('This reset link is incomplete or invalid.')}</div> : null}{error ? <div className="form-error">{error}</div> : null}<button className="button primary-button auth-submit" disabled={!email || !token || busy} onClick={() => void confirm()}>{busy ? <LoaderCircle className="spin" size={17} /> : <KeyRound size={17} />}{t('Reset password')}</button></div>}</AuthFrame>
}

export function OAuthCallbackPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { provider?: string }
  const search = new URLSearchParams(useLocation({ select: (state) => state.searchStr }))
  const localeValue = window.localStorage.getItem('partokens-oauth-locale')
  const locale: AppLocale = isAppLocale(localeValue ?? undefined) ? localeValue as AppLocale : resolvePreferredLocale()
  const [error, setError] = useState('')
  const exchangeStarted = useRef(false)
  useEffect(() => {
    if (exchangeStarted.current) return
    exchangeStarted.current = true
    const code = search.get('code')
    if (!params.provider || !code) { setError(t('OAuth callback is incomplete.')); return }
    void exchangeOAuth(params.provider, { code, state: search.get('state') || undefined })
      .then(async (result) => {
        if (!result.success) throw new Error(result.message || t('OAuth failed'))
        if (result.data && 'action' in result.data && result.data.action === 'bind') {
          window.localStorage.removeItem('partokens-oauth-intent')
          window.location.assign(`/${locale}/console/profile?binding=success`)
          return
        }
        const directUser = result.data && typeof (result.data as CurrentUser).id === 'number'
          ? result.data as CurrentUser
          : null
        const self = directUser ? { success: true, data: directUser } : await getSelf()
        if (!self.data) throw new Error(t('Unable to load account'))
        window.localStorage.removeItem('partokens-oauth-intent')
        authDestination(locale, self.data)
      })
      .catch((cause) => setError(responseError(cause, t('OAuth failed'))))
  }, [locale, params.provider, t])
  return <AuthFrame title={t('Completing sign in')} description={t('The provider response is being verified.')}>{error ? <><div className="form-error">{error}</div><a className="button secondary-button" href={`/${locale}/auth/sign-in`}>{t('Return to sign in')}</a></> : <div className="data-state"><LoaderCircle className="spin" size={19} />{t('Verifying provider response')}</div>}</AuthFrame>
}
