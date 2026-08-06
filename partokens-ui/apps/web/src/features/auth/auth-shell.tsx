import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleUserRound,
  Eye,
  EyeOff,
  Github,
  LoaderCircle,
  LockKeyhole,
  type LucideIcon,
} from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'

import { getStatus, type PartokensStatus } from '@partokens/api-client'
import { PartokensMark } from '@partokens/design-system/components'
import { isAppLocale, resolvePreferredLocale, type AppLocale } from '@partokens/i18n'

import { InterfaceLanguageMenu, InterfaceThemeMenu } from '@/features/public/interface-tool-menus'
import { i18n } from '@/lib/i18n'
import { usePreferenceStore } from '@/stores/preferences'

import { startOAuthAuthorization } from './oauth'

type Translate = (key: string) => string

export function useAuthLocale(): AppLocale {
  const params = useParams({ strict: false }) as { locale?: string }
  return isAppLocale(params.locale) ? params.locale : resolvePreferredLocale()
}

export function useAuthStatus() {
  return useQuery({ queryKey: ['status'], queryFn: getStatus, staleTime: 60_000 })
}

export function authErrorMessage(error: unknown, t: Translate, fallback: string): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return t('You appear to be offline. Check your connection and try again.')
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string } } }).response
    if (response?.status === 429) return t('Too many attempts. Wait a moment and try again.')
    if (response?.status && response.status >= 500) return t('The authentication service is temporarily unavailable. Try again.')
    if (response?.data?.message) return t(response.data.message)
  }
  return error instanceof Error && error.message ? t(error.message) : fallback
}

function AuthBrand() {
  return <span className="r32-auth-brand"><span><PartokensMark size={17} /></span><strong>Partokens</strong></span>
}

function AuthRail(props: { locale: AppLocale; onHome: () => void; theme: 'light' | 'dark' }) {
  const { t } = useTranslation()
  const status = useAuthStatus()
  const available = status.data?.success === true
  return <aside className="r32-auth-rail">
    <img className="r32-auth-rail-background" src={`/auth/auth-routing-${props.theme}.jpg`} alt="" />
    <button type="button" className="r32-auth-brand-button" aria-label="Partokens" onClick={props.onHome}><AuthBrand /></button>
    <div className="r32-auth-rail-art" aria-hidden="true" />
    <footer>
      <div className="r32-auth-rail-story">
        <span>MODEL GATEWAY</span>
        <h2>{t('One entry point for every model request.')}</h2>
        <p>{t('Partokens gives developers one entry point for model access, with pricing, status, quota, and request history in the same operational interface.')}</p>
        <div className="r32-auth-rail-status" role="status" aria-live="polite">
          <i data-available={available || undefined} />
          {status.isPending ? t('Awaiting status') : available ? t('Available') : t('Interface data unavailable')}
        </div>
        <small>{t('Contact support if you cannot access your account.')}</small>
      </div>
    </footer>
  </aside>
}

export function AuthFrame(props: { children: ReactNode; screen: string; locale?: AppLocale }) {
  const { t } = useTranslation()
  const routeLocale = useAuthLocale()
  const locale = props.locale || routeLocale
  const preferenceTheme = usePreferenceStore((state) => state.theme)
  const setTheme = usePreferenceStore((state) => state.setTheme)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const theme = preferenceTheme === 'system' ? (systemDark ? 'dark' : 'light') : preferenceTheme

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.body.classList.add('shadcn-admin-portal')
    return () => document.body.classList.remove('shadcn-admin-portal')
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    if (i18n.resolvedLanguage !== locale) void i18n.changeLanguage(locale)
  }, [locale])

  const changeLocale = (nextLocale: AppLocale) => {
    window.localStorage.setItem('partokens-locale', nextLocale)
    void i18n.changeLanguage(nextLocale)
    const localizedPrefix = `/${locale}/`
    if (window.location.pathname.startsWith(localizedPrefix)) {
      window.location.assign(`/${nextLocale}/${window.location.pathname.slice(localizedPrefix.length)}${window.location.search}${window.location.hash}`)
    } else if (window.location.pathname === '/user/reset') {
      window.location.assign(`/${nextLocale}/auth/reset${window.location.search}`)
    }
  }

  return <div className={`r32-auth-screen shadcn-admin ${theme}`} data-auth-screen={props.screen}>
    <main className="r32-auth-layout">
      <AuthRail locale={locale} theme={theme} onHome={() => window.location.assign(`/${locale}/`)} />
      <section className="r32-auth-task">
        <div className="r32-auth-tools">
          <InterfaceLanguageMenu locale={locale} onLocale={changeLocale} t={t} buttonClassName="r32-auth-tool-button" contentClassName="r32-auth-tool-menu" />
          <InterfaceThemeMenu theme={theme} onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} t={t} buttonClassName="r32-auth-tool-button" contentClassName="r32-auth-tool-menu" />
        </div>
        <div className="r32-auth-form-shell">{props.children}</div>
      </section>
    </main>
  </div>
}

export function PageHeading(props: { eyebrow: string; title: string; body: string; backLabel?: string; onBack?: () => void }) {
  return <header className="r32-auth-page-heading">
    {props.backLabel && props.onBack ? <button type="button" className="r32-auth-back" onClick={props.onBack}><ArrowLeft size={15} />{props.backLabel}</button> : null}
    <span>{props.eyebrow}</span>
    <h1>{props.title}</h1>
    <p>{props.body}</p>
  </header>
}

export function RouteButton(props: { children: ReactNode; disabled?: boolean; type?: 'button' | 'submit'; onClick?: () => void; className?: string }) {
  return <button
    type={props.type || 'button'}
    className={`pt-button r32-auth-route-button auth-submit ${props.className || ''}`}
    data-variant="primary"
    disabled={props.disabled}
    onClick={props.onClick}
  >
    <span>{props.children}</span><span className="pt-button-endcap"><ArrowRight size={16} /></span>
  </button>
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
  disabled?: boolean
  hint?: string
  error?: string
  action?: ReactNode
  autoFocus?: boolean
  maxLength?: number
  pattern?: string
  name?: string
}

export function AuthField(props: AuthFieldProps) {
  const generatedId = useId()
  const id = `auth-${props.name || generatedId.replaceAll(':', '')}`
  const hintId = props.hint ? `${id}-hint` : undefined
  const errorId = props.error ? `${id}-error` : undefined
  const Icon = props.icon
  return <label className="pt-field r32-auth-field" htmlFor={id}>
    <span>{props.label}</span>
    <span className="pt-field-control">
      <Icon className="pt-field-leading" size={17} aria-hidden="true" />
      <input
        id={id}
        name={props.name}
        type={props.type || 'text'}
        value={props.value}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        required={props.required}
        readOnly={props.readOnly}
        disabled={props.disabled}
        autoFocus={props.autoFocus}
        maxLength={props.maxLength}
        pattern={props.pattern}
        aria-invalid={Boolean(props.error) || undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        onChange={props.onChange ? (event) => props.onChange?.(event.target.value) : undefined}
      />
      {props.action ? <span className="r32-field-action">{props.action}</span> : null}
    </span>
    {props.hint ? <small id={hintId}>{props.hint}</small> : null}
    {props.error ? <small id={errorId} className="r32-auth-field-error">{props.error}</small> : null}
  </label>
}

export function PasswordField(props: { label: string; value: string; onChange: (value: string) => void; autoComplete: string; hint?: string; name?: string }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const label = visible ? t('Hide password') : t('Show password')
  return <AuthField
    label={props.label}
    value={props.value}
    onChange={props.onChange}
    icon={LockKeyhole}
    type={visible ? 'text' : 'password'}
    autoComplete={props.autoComplete}
    required
    hint={props.hint}
    name={props.name}
    action={<button type="button" className="pt-icon-button" data-size="small" aria-label={label} title={label} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
  />
}

export function LegalConsent(props: { checked: boolean; onChange: (value: boolean) => void }) {
  const { t } = useTranslation()
  const locale = useAuthLocale()
  return <div className="r32-auth-consent">
    <label className="pt-check"><input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} /><span>{t('I have read and agree to:')}</span></label>
    <div>
      <a href={`/${locale}/legal/user-agreement`}>{t('User Agreement')}</a>
      <a href={`/${locale}/legal/service-agreement`}>{t('Terms of Service')}</a>
      <a href={`/${locale}/legal/privacy-policy`}>{t('Privacy Policy')}</a>
    </div>
  </div>
}

export function AccountSwitch(props: { prompt: string; action: string; href: string }) {
  return <div className="r32-auth-switch"><span>{props.prompt}</span><a href={props.href}>{props.action}<ArrowRight size={14} /></a></div>
}

export function TextAction(props: { children: ReactNode; onClick: () => void; alignStart?: boolean }) {
  return <button type="button" className={`r32-auth-text-action${props.alignStart ? ' is-start' : ''}`} onClick={props.onClick}>{props.children}<ChevronRight size={14} /></button>
}

export function InlineStatus(props: { children: ReactNode; error?: boolean; action?: ReactNode }) {
  return <div className={props.error ? 'r32-form-error' : 'r32-form-success'} role={props.error ? 'alert' : 'status'} aria-live={props.error ? 'assertive' : 'polite'}>
    {props.error ? null : <Check size={15} aria-hidden="true" />}{props.children}{props.action}
  </div>
}

export function TurnstileField(props: { siteKey?: string; onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!props.siteKey || !containerRef.current) return
    const siteKey = props.siteKey
    let widgetId = ''
    let cancelled = false
    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetId) return
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: props.onToken,
        'expired-callback': () => props.onToken(''),
        'error-callback': () => props.onToken(''),
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
  }, [props.onToken, props.siteKey])
  if (!props.siteKey) return null
  return <div ref={containerRef} className="r32-turnstile-field" />
}

type ProviderOption = { slug: string; label: string; available: boolean; icon: ReactNode }

export function OAuthButtons(props: { status?: PartokensStatus; allowed: boolean; registration?: boolean }) {
  const { t } = useTranslation()
  const locale = useAuthLocale()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const google = useMemo(
    () => props.status?.custom_oauth_providers?.find((provider) => provider.name.toLowerCase().includes('google')),
    [props.status?.custom_oauth_providers],
  )
  const registrationAllowed = !props.registration || props.status?.oauth_register_enabled !== false
  const providers: ProviderOption[] = [
    {
      slug: 'github',
      label: 'GitHub',
      available: registrationAllowed && props.status?.github_oauth !== false && Boolean(props.status?.github_client_id),
      icon: <Github size={17} aria-hidden="true" />,
    },
    {
      slug: 'linuxdo',
      label: 'LinuxDO',
      available: registrationAllowed && props.status?.linuxdo_oauth !== false && Boolean(props.status?.linuxdo_client_id),
      icon: <span className="r32-provider-glyph" aria-hidden="true">L</span>,
    },
    {
      slug: google?.slug || 'oidc',
      label: 'Google',
      available: registrationAllowed && Boolean(google || (props.status?.oidc_enabled !== false && props.status?.oidc_client_id)),
      icon: <span className="r32-provider-glyph" aria-hidden="true">G</span>,
    },
  ]
  const visibleProviders = providers.filter((provider) => provider.available)

  if (props.status && visibleProviders.length === 0) return null

  const start = async (provider: ProviderOption) => {
    if (!props.allowed || !props.status || !provider.available) return
    setBusy(provider.slug)
    setError('')
    try {
      await startOAuthAuthorization({ provider: provider.slug, status: props.status, locale, intent: 'login' })
    } catch (cause) {
      setError(authErrorMessage(cause, t, t('OAuth unavailable')))
      setBusy(null)
    }
  }

  return <div className="r32-oauth-wrap">
    <div className="r32-auth-divider"><span>{t('or')}</span></div>
    <div className="r32-oauth-grid" aria-busy={busy != null}>
      {(props.status ? visibleProviders : providers).map((provider) => <button
        key={provider.label}
        type="button"
        className="pt-button"
        data-variant="secondary"
        disabled={!props.allowed || !provider.available || busy != null}
        aria-label={t(`Continue with ${provider.label}`)}
        onClick={() => void start(provider)}
      >
        {busy === provider.slug ? <LoaderCircle className="r32-spin" size={17} aria-hidden="true" /> : provider.icon}{provider.label}
      </button>)}
    </div>
    {error ? <InlineStatus error>{error}</InlineStatus> : null}
  </div>
}

export { CircleUserRound, LoaderCircle, LockKeyhole }
