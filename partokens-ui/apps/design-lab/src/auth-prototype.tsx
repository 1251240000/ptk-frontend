import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  ChevronRight,
  CircleUserRound,
  Copy,
  Eye,
  EyeOff,
  Github,
  KeyRound,
  Languages,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Moon,
  Route,
  ShieldCheck,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'

import { brandLogoUrl } from '@partokens/content'
import { localeLabels, locales, resources, type AppLocale } from '@partokens/i18n'
import { authPrototypeCopy } from './auth-prototype-copy'

export type AuthPrototypeScreen =
  | 'signin'
  | 'signup'
  | 'verify-email'
  | 'forgot-password'
  | 'reset-password'
  | 'oauth-callback'
  | 'auth-otp'

type AuthTarget = AuthPrototypeScreen | 'home' | 'console' | 'legal-user' | 'legal-service' | 'legal-privacy'
type Theme = 'light' | 'dark'

type AuthPrototypeProps = {
  screen: AuthPrototypeScreen
  locale: AppLocale
  theme: Theme
  online: boolean | null
  version?: string
  onLocale: (locale: AppLocale) => void
  onTheme: () => void
  go: (target: AuthTarget) => void
}

function translate(locale: AppLocale, key: string) {
  return (resources[locale].translation as Record<string, string>)[key] ?? key
}

function AuthBrand() {
  return <span className="r32-auth-brand"><span><img src={brandLogoUrl} alt="" /></span><strong>Partokens</strong></span>
}

function RouteButton({ children, disabled = false, type = 'button', onClick }: { children: ReactNode; disabled?: boolean; type?: 'button' | 'submit'; onClick?: () => void }) {
  return <button type={type} className="pt-button r32-auth-route-button" data-variant="primary" disabled={disabled} onClick={onClick}><span>{children}</span><span className="pt-button-endcap"><ArrowRight size={16} /></span></button>
}

type AuthFieldProps = {
  label: string
  value: string
  onChange?: (value: string) => void
  icon: LucideIcon
  type?: HTMLInputTypeAttribute
  autoComplete?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  required?: boolean
  readOnly?: boolean
  hint?: string
  action?: ReactNode
}

function AuthField({ label, value, onChange, icon: Icon, type = 'text', autoComplete, inputMode, required, readOnly, hint, action }: AuthFieldProps) {
  return <label className="pt-field r32-auth-field">
    <span>{label}</span>
    <span className="pt-field-control">
      <Icon className="pt-field-leading" size={17} />
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        readOnly={readOnly}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
      {action ? <span className="r32-field-action">{action}</span> : null}
    </span>
    {hint ? <small>{hint}</small> : null}
  </label>
}

function PageHeading({ eyebrow, title, body, backLabel, onBack }: { eyebrow: string; title: string; body: string; backLabel?: string; onBack?: () => void }) {
  return <header className="r32-auth-page-heading">
    {backLabel && onBack ? <button type="button" className="r32-auth-back" onClick={onBack}><ArrowLeft size={15} />{backLabel}</button> : null}
    <span>{eyebrow}</span>
    <h1>{title}</h1>
    <p>{body}</p>
  </header>
}

function LegalConsent({ locale, checked, onChange, go }: Pick<AuthPrototypeProps, 'locale' | 'go'> & { checked: boolean; onChange: (value: boolean) => void }) {
  const copy = authPrototypeCopy[locale]
  const t = (key: string) => translate(locale, key)
  const openLegal = (event: MouseEvent, target: 'legal-user' | 'legal-service' | 'legal-privacy') => {
    event.preventDefault()
    go(target)
  }
  return <div className="r32-auth-consent">
    <label className="pt-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{copy.consentLead}</span></label>
    <div><button type="button" onClick={(event) => openLegal(event, 'legal-user')}>{t('User Agreement')}</button><button type="button" onClick={(event) => openLegal(event, 'legal-service')}>{t('Terms of Service')}</button><button type="button" onClick={(event) => openLegal(event, 'legal-privacy')}>{t('Privacy Policy')}</button></div>
  </div>
}

function PasswordField({ locale, label, value, onChange, autoComplete, hint }: { locale: AppLocale; label: string; value: string; onChange: (value: string) => void; autoComplete: string; hint?: string }) {
  const copy = authPrototypeCopy[locale]
  const [visible, setVisible] = useState(false)
  return <AuthField
    label={label}
    value={value}
    onChange={onChange}
    icon={LockKeyhole}
    type={visible ? 'text' : 'password'}
    autoComplete={autoComplete}
    required
    hint={hint}
    action={<button type="button" className="pt-icon-button" data-size="small" aria-label={visible ? copy.hidePassword : copy.showPassword} title={visible ? copy.hidePassword : copy.showPassword} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
  />
}

function AccountSwitch({ children }: { children: ReactNode }) {
  return <div className="r32-auth-switch">{children}</div>
}

function SignInForm({ locale, go }: Pick<AuthPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const copy = authPrototypeCopy[locale]
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!consent || !username || !password) return
    setBusy(true)
    window.setTimeout(() => go('console'), 420)
  }
  const oauth = (provider: string) => {
    if (!consent) return
    window.sessionStorage.setItem('partokens-prototype-oauth-provider', provider)
    go('oauth-callback')
  }
  return <>
    <PageHeading eyebrow="PARTOKENS ID" title={t('Sign in')} body={copy.signinBody} />
    <form className="r32-auth-form" onSubmit={submit}>
      <AuthField label={t('Username or email')} value={username} onChange={setUsername} icon={CircleUserRound} autoComplete="username" required />
      <PasswordField locale={locale} label={t('Password')} value={password} onChange={setPassword} autoComplete="current-password" />
      <button type="button" className="r32-auth-text-action" onClick={() => go('forgot-password')}>{t('Forgot password')}<ChevronRight size={14} /></button>
      <LegalConsent locale={locale} checked={consent} onChange={setConsent} go={go} />
      <RouteButton type="submit" disabled={!consent || !username || !password || busy}>{busy ? <LoaderCircle className="r32-spin" size={16} /> : <LockKeyhole size={16} />}{t('Sign in')}</RouteButton>
    </form>
    <div className="r32-auth-divider"><span>{t('or')}</span></div>
    <div className="r32-oauth-grid">
      <button type="button" className="pt-button" data-variant="secondary" disabled={!consent} aria-label={t('Continue with GitHub')} onClick={() => oauth('GitHub')}><Github size={17} />GitHub</button>
      <button type="button" className="pt-button" data-variant="secondary" disabled={!consent} aria-label={t('Continue with LinuxDO')} onClick={() => oauth('LinuxDO')}><span className="r32-provider-glyph">L</span>LinuxDO</button>
      <button type="button" className="pt-button" data-variant="secondary" disabled={!consent} aria-label={t('Continue with Google')} onClick={() => oauth('Google')}><span className="r32-provider-glyph">G</span>Google</button>
    </div>
    <AccountSwitch><span>{t('Create account')}</span><button type="button" onClick={() => go('signup')}>{t('Sign up')}<ArrowRight size={14} /></button></AccountSwitch>
  </>
}

function SignUpForm({ locale, go }: Pick<AuthPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const copy = authPrototypeCopy[locale]
  const [fields, setFields] = useState({ username: '', email: '', code: '', password: '', confirm: '' })
  const [consent, setConsent] = useState(false)
  const [sent, setSent] = useState(false)
  const update = (key: keyof typeof fields) => (value: string) => setFields((current) => ({ ...current, [key]: value }))
  const sendCode = () => {
    if (!fields.email) return
    window.sessionStorage.setItem('partokens-prototype-email', fields.email)
    setSent(true)
  }
  const valid = consent && fields.username && fields.email && fields.code && fields.password.length >= 8 && fields.password === fields.confirm
  const submit = (event: FormEvent) => { event.preventDefault(); if (valid) go('signin') }
  return <>
    <PageHeading eyebrow="PARTOKENS ID" title={t('Create account')} body={copy.signupBody} backLabel={t('Return to sign in')} onBack={() => go('signin')} />
    <form className="r32-auth-form" onSubmit={submit}>
      <AuthField label={t('Username')} value={fields.username} onChange={update('username')} icon={CircleUserRound} autoComplete="username" required />
      <AuthField label={t('Email')} value={fields.email} onChange={update('email')} icon={AtSign} type="email" autoComplete="email" required />
      <AuthField label={t('Verification code')} value={fields.code} onChange={update('code')} icon={ShieldCheck} inputMode="numeric" autoComplete="one-time-code" required action={<button type="button" className="pt-button r32-send-code" data-variant="quiet" data-size="small" disabled={!fields.email || sent} onClick={sendCode}>{sent ? '60s' : t('Send code')}</button>} />
      {sent ? <div className="r32-form-success" role="status"><Check size={15} />{copy.verifySent}<button type="button" onClick={() => go('verify-email')}>{t('Verify')}<ArrowRight size={13} /></button></div> : null}
      <div className="r32-auth-field-grid">
        <PasswordField locale={locale} label={t('Password')} value={fields.password} onChange={update('password')} autoComplete="new-password" hint={copy.passwordHint} />
        <PasswordField locale={locale} label={t('Confirm password')} value={fields.confirm} onChange={update('confirm')} autoComplete="new-password" />
      </div>
      {fields.confirm && fields.password !== fields.confirm ? <div className="r32-form-error" role="alert">{t('Passwords do not match')}</div> : null}
      <LegalConsent locale={locale} checked={consent} onChange={setConsent} go={go} />
      <RouteButton type="submit" disabled={!valid}><ShieldCheck size={16} />{t('Create account')}</RouteButton>
    </form>
    <AccountSwitch><span>{t('Already registered?')}</span><button type="button" onClick={() => go('signin')}>{t('Sign in')}<ArrowRight size={14} /></button></AccountSwitch>
  </>
}

function VerifyEmailForm({ locale, go }: Pick<AuthPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const copy = authPrototypeCopy[locale]
  const email = window.sessionStorage.getItem('partokens-prototype-email') || 'name@example.com'
  const [code, setCode] = useState('')
  const [resent, setResent] = useState(false)
  return <>
    <PageHeading eyebrow="EMAIL" title={copy.verifyTitle} body={copy.verifyBody} backLabel={t('Sign up')} onBack={() => go('signup')} />
    <form className="r32-auth-form" onSubmit={(event) => { event.preventDefault(); if (code) go('signup') }}>
      <AuthField label={t('Email')} value={email} icon={Mail} type="email" readOnly />
      <AuthField label={t('Verification code')} value={code} onChange={setCode} icon={ShieldCheck} inputMode="numeric" autoComplete="one-time-code" required />
      <div className="r32-form-success" role="status"><Check size={15} />{resent ? copy.verifySent : copy.verifySent}</div>
      <RouteButton type="submit" disabled={!code}><ShieldCheck size={16} />{t('Verify')}</RouteButton>
      <button type="button" className="pt-button r32-auth-secondary-command" data-variant="secondary" onClick={() => setResent(true)}><Mail size={16} />{t('Send code')}</button>
    </form>
  </>
}

function ForgotPasswordForm({ locale, go }: Pick<AuthPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const copy = authPrototypeCopy[locale]
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  return <>
    <PageHeading eyebrow="RECOVERY" title={t('Forgot password')} body={copy.forgotBody} backLabel={t('Return to sign in')} onBack={() => go('signin')} />
    <form className="r32-auth-form" onSubmit={(event) => { event.preventDefault(); if (email) setSent(true) }}>
      <AuthField label={t('Email')} value={email} onChange={setEmail} icon={Mail} type="email" autoComplete="email" required />
      {sent ? <div className="r32-form-success" role="status"><Check size={15} />{t('If the account exists, a password reset link has been sent.')}</div> : null}
      <RouteButton type="submit" disabled={!email || sent}><Mail size={16} />{t('Send reset link')}</RouteButton>
    </form>
  </>
}

function ResetPasswordForm({ locale, go }: Pick<AuthPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const copy = authPrototypeCopy[locale]
  const [complete, setComplete] = useState(false)
  const [copied, setCopied] = useState(false)
  const generatedPassword = 'pt_demo_8R4K'
  const copyPassword = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
    } catch {
      const input = document.createElement('textarea')
      input.value = generatedPassword
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      const copiedWithFallback = document.execCommand('copy')
      input.remove()
      setCopied(copiedWithFallback)
    }
  }
  return <>
    <PageHeading eyebrow="RECOVERY" title={t('Reset password')} body={complete ? copy.resetResultBody : copy.resetBody} backLabel={t('Return to sign in')} onBack={() => go('signin')} />
    {complete ? <div className="r32-generated-password">
      <span><Check size={16} />{t('New password')}</span>
      <div><code>{generatedPassword}</code><button type="button" className="pt-icon-button" aria-label={copied ? copy.passwordCopied : t('Copy password')} title={copied ? copy.passwordCopied : t('Copy password')} onClick={() => void copyPassword()}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
      <small role={copied ? 'status' : undefined} data-copied={copied || undefined}>{copied ? copy.passwordCopied : copy.resetResultBody}</small>
      <button type="button" className="pt-button r32-auth-secondary-command" data-variant="secondary" onClick={() => go('signin')}>{t('Return to sign in')}<ArrowRight size={15} /></button>
    </div> : <div className="r32-reset-confirm">
      <div><Mail size={17} /><span><small>{t('Email')}</small><strong>mi***@example.com</strong></span></div>
      <RouteButton type="button" onClick={() => setComplete(true)}><KeyRound size={16} />{t('Reset password')}</RouteButton>
    </div>}
  </>
}

function OAuthCallbackForm({ locale, go }: Pick<AuthPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const copy = authPrototypeCopy[locale]
  const provider = window.sessionStorage.getItem('partokens-prototype-oauth-provider') || 'OAuth'
  const [complete, setComplete] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setComplete(true), 1200)
    return () => window.clearTimeout(timer)
  }, [])
  return <>
    <PageHeading eyebrow="OAUTH" title={complete ? copy.oauthReadyTitle : t('Completing sign in')} body={complete ? copy.oauthReadyBody : copy.oauthBody} backLabel={t('Return to sign in')} onBack={() => go('signin')} />
    <div className="r32-oauth-route" data-complete={complete || undefined} aria-live="polite">
      <div><span className="r32-provider-glyph">{provider.charAt(0)}</span><small>{t('Selected provider')}</small><strong>{provider}</strong></div>
      <span><i /><Route size={18} /></span>
      <div><span>{complete ? <Check size={19} /> : <LoaderCircle className="r32-spin" size={19} />}</span><small>{complete ? copy.oauthRouteLabel : t('Verifying provider response')}</small><strong>{complete ? copy.oauthRouteValue : 'Partokens ID'}</strong></div>
    </div>
    <p className={complete ? 'r32-auth-process-note is-complete' : 'r32-auth-process-note'}><LockKeyhole size={15} />{complete ? copy.oauthReadyStatus : t('The provider response is being verified.')}</p>
    {complete ? <RouteButton type="button" onClick={() => go('console')}><ShieldCheck size={16} />{copy.oauthContinue}</RouteButton> : null}
  </>
}

function OtpForm({ locale, go }: Pick<AuthPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const copy = authPrototypeCopy[locale]
  const [backup, setBackup] = useState(false)
  const [code, setCode] = useState('')
  return <>
    <PageHeading eyebrow="SECURITY" title={t('Two-factor verification')} body={backup ? copy.backupBody : copy.otpBody} backLabel={t('Return to sign in')} onBack={() => go('signin')} />
    <form className="r32-auth-form" onSubmit={(event) => { event.preventDefault(); if (code) go('console') }}>
      <AuthField label={backup ? copy.backupLabel : t('Authenticator code')} value={code} onChange={setCode} icon={backup ? KeyRound : ShieldCheck} inputMode={backup ? 'text' : 'numeric'} autoComplete="one-time-code" required />
      <button type="button" className="r32-auth-text-action is-start" onClick={() => { setBackup((current) => !current); setCode('') }}>{backup ? copy.useAuthenticator : copy.useBackup}<ChevronRight size={14} /></button>
      <RouteButton type="submit" disabled={!code}><ShieldCheck size={16} />{t('Verify')}</RouteButton>
    </form>
  </>
}

function AuthRail({ locale, screen, online, version }: Pick<AuthPrototypeProps, 'locale' | 'screen' | 'online' | 'version'>) {
  const t = (key: string) => translate(locale, key)
  const copy = authPrototypeCopy[locale]
  const activeStep = screen === 'oauth-callback' || screen === 'auth-otp' ? 1 : 0
  return <aside className="r32-auth-rail">
    <div className="r32-auth-rail-intro"><span>{t('Secure account access')}</span><h2>Partokens ID</h2><p>{copy.rail.body}</p></div>
    <div className="r32-auth-path" aria-label={t('Secure account access')}>
      {copy.rail.path.map((label, index) => <div key={label} data-current={activeStep === index || undefined} data-complete={activeStep > index || undefined}><span>{index === 0 ? <CircleUserRound size={17} /> : index === 1 ? <ShieldCheck size={17} /> : <Route size={17} />}</span><small>0{index + 1}</small><strong>{label}</strong>{index < 2 ? <i /> : null}</div>)}
    </div>
    <div className="r32-auth-facts">
      <div><KeyRound size={18} /><p><strong>{copy.rail.accountTitle}</strong><small>{copy.rail.pricingBody}</small></p></div>
      <div><ShieldCheck size={18} /><p><strong>{t('Local history')}</strong><small>{copy.rail.privacyBody}</small></p></div>
    </div>
    <footer><div><span className={online ? 'r32-auth-service is-online' : 'r32-auth-service'}><i />{online ? t('Available') : t('Awaiting status')}</span>{version ? <code>{version}</code> : null}</div><p>{copy.rail.support}</p><a href="mailto:admin@partokens.com"><Mail size={14} />admin@partokens.com</a></footer>
  </aside>
}

export function AuthPrototype(props: AuthPrototypeProps) {
  const { screen, locale, theme, online, version, onLocale, onTheme, go } = props
  const t = (key: string) => translate(locale, key)
  let form: ReactNode
  if (screen === 'signin') form = <SignInForm locale={locale} go={go} />
  else if (screen === 'signup') form = <SignUpForm locale={locale} go={go} />
  else if (screen === 'verify-email') form = <VerifyEmailForm locale={locale} go={go} />
  else if (screen === 'forgot-password') form = <ForgotPasswordForm locale={locale} go={go} />
  else if (screen === 'reset-password') form = <ResetPasswordForm locale={locale} go={go} />
  else if (screen === 'oauth-callback') form = <OAuthCallbackForm locale={locale} go={go} />
  else form = <OtpForm locale={locale} go={go} />
  return <div className="r32-auth-screen">
    <header className="r32-auth-header">
      <button type="button" className="r32-auth-brand-button" aria-label="Partokens" onClick={() => go('home')}><AuthBrand /></button>
      <div>
        <label className="r32-auth-locale"><Languages size={17} /><span className="sr-only">{t('Language')}</span><select value={locale} aria-label={t('Language')} onChange={(event) => onLocale(event.target.value as AppLocale)}>{locales.map((item) => <option value={item} key={item}>{localeLabels[item]}</option>)}</select></label>
        <button type="button" className="pt-icon-button" aria-label={t(theme === 'dark' ? 'Light mode' : 'Dark mode')} title={t(theme === 'dark' ? 'Light mode' : 'Dark mode')} onClick={onTheme}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      </div>
    </header>
    <main className="r32-auth-layout">
      <AuthRail locale={locale} screen={screen} online={online} version={version} />
      <section className="r32-auth-task"><div className="r32-auth-form-shell">{form}</div></section>
    </main>
  </div>
}
