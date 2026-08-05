import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

import { getPricingCatalog, getStatusWithSignal } from '@partokens/api-client'
import { isAppLocale, type AppLocale } from '@partokens/i18n'

import { canonicalConsolePath } from '@/lib/routes'
import { usePreferenceStore } from '@/stores/preferences'
import { useSessionStore } from '@/stores/session'
import { PublicPrototype, type PublicPrototypeScreen, type PublicTarget } from './public-pages'

function resolvedDocumentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function PublicRoute(props: { screen: PublicPrototypeScreen }) {
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const pathname = useLocation({ select: (location) => location.pathname })
  const navigate = useNavigate()
  const setTheme = usePreferenceStore((state) => state.setTheme)
  const resolveSession = useSessionStore((state) => state.resolve)
  const user = useSessionStore((state) => state.user)
  const sessionResolved = useSessionStore((state) => state.resolved)
  const [theme, setResolvedTheme] = useState(resolvedDocumentTheme)
  const status = useQuery({
    queryKey: ['public', 'status'],
    queryFn: ({ signal }) => getStatusWithSignal(signal),
    enabled: props.screen === 'home' || props.screen === 'notices' || props.screen === 'status',
    staleTime: 60_000,
    retry: false,
  })
  const pricing = useQuery({
    queryKey: ['public', 'pricing'],
    queryFn: ({ signal }) => getPricingCatalog(signal),
    enabled: props.screen === 'models' && Boolean(user),
    staleTime: 60_000,
    retry: false,
  })

  useEffect(() => {
    if (props.screen === 'models' && !sessionResolved) void resolveSession()
  }, [props.screen, resolveSession, sessionResolved])

  useEffect(() => {
    const observer = new MutationObserver(() => setResolvedTheme(resolvedDocumentTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const changeLocale = useCallback(async (nextLocale: AppLocale) => {
    window.localStorage.setItem('partokens-locale', nextLocale)
    const segments = pathname.split('/').filter(Boolean)
    if (isAppLocale(segments[0])) segments[0] = nextLocale
    else segments.unshift(nextLocale)
    const hash = window.location.hash.replace(/^#/, '')
    await navigate(hash ? { to: `/${segments.join('/')}` as never, hash: hash as never } : { to: `/${segments.join('/')}` as never })
  }, [navigate, pathname])

  const go = useCallback((target: PublicTarget) => {
    const publicPaths: Partial<Record<PublicTarget, string>> = {
      home: `/${locale}/`,
      models: `/${locale}/models`,
      docs: `/${locale}/docs`,
      about: `/${locale}/about`,
      notices: `/${locale}/notices`,
      status: `/${locale}/status`,
      'legal-user': `/${locale}/legal/user-agreement`,
      'legal-service': `/${locale}/legal/service-agreement`,
      'legal-privacy': `/${locale}/legal/privacy-policy`,
      signin: `/${locale}/auth/sign-in`,
      console: canonicalConsolePath(locale, 'overview'),
      'console-playground': canonicalConsolePath(locale, 'playground'),
      'console-studio': canonicalConsolePath(locale, 'studio'),
      'console-keys': canonicalConsolePath(locale, 'keys'),
    }
    const destination = publicPaths[target]
    if (destination) void navigate({ to: destination as never })
  }, [locale, navigate])

  return (
    <PublicPrototype
      screen={props.screen}
      locale={locale}
      theme={theme}
      online={status.isPending ? null : Boolean(status.data?.success && !status.isError)}
      version={status.data?.data.version}
      startTime={status.data?.data.start_time}
      statusCheckedAt={status.dataUpdatedAt || undefined}
      statusChecking={status.isFetching}
      authenticated={Boolean(user)}
      pricingModels={pricing.data?.data}
      pricingLoading={pricing.isPending}
      pricingError={pricing.isError || pricing.data?.success === false}
      pricingPartial={pricing.data?.partial}
      onPricingRetry={() => void pricing.refetch()}
      refreshStatus={async () => {
        const result = await status.refetch()
        return result.data ?? { success: false }
      }}
      onLocale={(nextLocale) => void changeLocale(nextLocale)}
      onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      go={go}
    />
  )
}

export function PublicHomeRoute() { return <PublicRoute screen="home" /> }
export function PublicModelsRoute() { return <PublicRoute screen="models" /> }
export function PublicDocsRoute() { return <PublicRoute screen="docs" /> }
export function PublicAboutRoute() { return <PublicRoute screen="about" /> }
export function PublicNoticesRoute() { return <PublicRoute screen="notices" /> }
export function PublicStatusRoute() { return <PublicRoute screen="status" /> }
export function PublicUserAgreementRoute() { return <PublicRoute screen="legal-user" /> }
export function PublicServiceAgreementRoute() { return <PublicRoute screen="legal-service" /> }
export function PublicPrivacyPolicyRoute() { return <PublicRoute screen="legal-privacy" /> }
