import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, redirect, useParams } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { LoadingRegion, PartokensAvatar } from '@partokens/design-system/components'
import { isAppLocale, resolvePreferredLocale } from '@partokens/i18n'

import { AppLoadingBoundary } from '@/components/app-loading'
import { ConsoleShell } from '@/components/console-shell'
import { consoleRouteAsyncOptions } from '@/components/console-route-state'
import { i18n } from '@/lib/i18n'
import { usePageMetadata } from '@/lib/page-metadata'
import {
  canonicalConsoleRoute,
  consoleBaseSegment,
  consoleCompatibilityBaseSegment,
  consoleRouteMap,
} from '@/lib/routes'
import { useSessionStore } from '@/stores/session'

function GlobalRoutePending() {
  const { t } = useTranslation()
  return <LoadingRegion className="global-route-pending" label={t('Loading page')} />
}

function RootLayout() {
  return <AppLoadingBoundary><Outlet /></AppLoadingBoundary>
}

function LocalizedNotFound() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const routeLocale = isAppLocale(params.locale) ? params.locale : window.location.pathname.split('/').filter(Boolean)[0]
  const locale = isAppLocale(routeLocale) ? routeLocale : resolvePreferredLocale()
  const title = t('Page not found')

  useEffect(() => {
    document.documentElement.lang = locale
    if (i18n.resolvedLanguage !== locale) void i18n.changeLanguage(locale)
  }, [locale])
  usePageMetadata({ locale, title, description: title, indexable: false })

  return <main className="r3-public-screen r3-not-found">
    <a className="r3-not-found-brand" href={`/${locale}/`} aria-label="Partokens"><PartokensAvatar size={30} alt="" /><strong>Partokens</strong></a>
    <section><span>404</span><h1>{title}</h1><a className="pt-button" data-variant="primary" href={`/${locale}/`}>{t('Home')}</a></section>
  </main>
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: LocalizedNotFound,
  pendingComponent: GlobalRoutePending,
  pendingMs: 150,
  pendingMinMs: 300,
})

const rootIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/$locale', params: { locale: resolvePreferredLocale() } }) },
})

function LocaleBoundary() {
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : null
  useEffect(() => {
    if (!locale) { window.location.replace(`/${resolvePreferredLocale()}/`); return }
    document.documentElement.lang = locale
    window.localStorage.setItem('partokens-locale', locale)
    void i18n.changeLanguage(locale)
  }, [locale])
  if (!locale) return null
  return <Outlet />
}

const localeRoute = createRoute({ getParentRoute: () => rootRoute, path: '$locale', component: LocaleBoundary, notFoundComponent: LocalizedNotFound })
const publicHomeComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicHomeRoute')
const publicDocsComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicDocsRoute')
const publicAboutComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicAboutRoute')
const publicNoticesComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicNoticesRoute')
const publicStatusComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicStatusRoute')
const publicUserAgreementComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicUserAgreementRoute')
const publicServiceAgreementComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicServiceAgreementRoute')
const publicPrivacyPolicyComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicPrivacyPolicyRoute')
const signInComponent = lazyRouteComponent(() => import('@/pages/auth-pages'), 'SignInPage')
const signUpComponent = lazyRouteComponent(() => import('@/pages/auth-pages'), 'SignUpPage')
const verifyEmailComponent = lazyRouteComponent(() => import('@/pages/auth-pages'), 'VerifyEmailPage')
const forgotPasswordComponent = lazyRouteComponent(() => import('@/pages/auth-pages'), 'ForgotPasswordPage')
const resetPasswordComponent = lazyRouteComponent(() => import('@/pages/auth-pages'), 'ResetPasswordPage')
const otpComponent = lazyRouteComponent(() => import('@/pages/auth-pages'), 'OtpPage')
const oauthCallbackComponent = lazyRouteComponent(() => import('@/pages/auth-pages'), 'OAuthCallbackPage')
const homeRoute = createRoute({ getParentRoute: () => localeRoute, path: '/', component: publicHomeComponent })
const docsRoute = createRoute({ getParentRoute: () => localeRoute, path: 'docs', component: publicDocsComponent })
const aboutRoute = createRoute({ getParentRoute: () => localeRoute, path: 'about', component: publicAboutComponent })

const docsCompatibilityTargets = {
  'getting-started/authentication': 'api-keys',
  'getting-started/first-request': 'first-request',
  'guides/models-and-groups': 'models-pricing',
  'guides/chat': 'chat-completions',
  'guides/images': 'image-api',
  'guides/image-studio': 'image-studio',
  'guides/usage-logs': 'usage-logs',
  'guides/errors-and-limits': 'troubleshooting',
  'api/chat-completions': 'chat-completions',
  'api/responses': 'api-basics',
  'api/embeddings': 'api-basics',
  'api/image-generations': 'image-api',
  'api/image-edits': 'image-api',
  'api/audio-transcriptions': 'api-basics',
  'api/models': 'models-api',
} as const

const docsCompatibilityRoutes = Object.entries(docsCompatibilityTargets).map(([path, document]) => createRoute({
  getParentRoute: () => localeRoute,
  path: `docs/${path}`,
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$locale/docs',
      params: { locale: params.locale },
      search: true,
      hash: `docs/${document}`,
      replace: true,
    })
  },
}))
const noticesRoute = createRoute({ getParentRoute: () => localeRoute, path: 'notices', component: publicNoticesComponent })
const statusRoute = createRoute({ getParentRoute: () => localeRoute, path: 'status', component: publicStatusComponent })
const userAgreementRoute = createRoute({ getParentRoute: () => localeRoute, path: 'legal/user-agreement', component: publicUserAgreementComponent })
const serviceAgreementRoute = createRoute({ getParentRoute: () => localeRoute, path: 'legal/service-agreement', component: publicServiceAgreementComponent })
const privacyPolicyRoute = createRoute({ getParentRoute: () => localeRoute, path: 'legal/privacy-policy', component: publicPrivacyPolicyComponent })
const signInRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/sign-in', component: signInComponent })
const signUpRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/sign-up', component: signUpComponent })
const verifyEmailRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/verify-email', component: verifyEmailComponent })
const forgotRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/forgot-password', component: forgotPasswordComponent })
const localizedResetRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/reset', component: resetPasswordComponent })
const otpRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/otp', component: otpComponent })

function AuthenticatedUserBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user, resolved, resolve, refreshUser } = useSessionStore()
  const params = useParams({ strict: false }) as { locale?: string }
  useEffect(() => { void resolve() }, [resolve])
  useEffect(() => {
    if (!resolved || !user) return
    const refreshWhenActive = () => {
      if (document.visibilityState === 'visible') void refreshUser().catch(() => undefined)
    }
    const interval = window.setInterval(refreshWhenActive, 60_000)
    window.addEventListener('focus', refreshWhenActive)
    document.addEventListener('visibilitychange', refreshWhenActive)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshWhenActive)
      document.removeEventListener('visibilitychange', refreshWhenActive)
    }
  }, [refreshUser, resolved, user])
  useEffect(() => {
    if (!resolved) return
    if (!user) {
      const locale = isAppLocale(params.locale) ? params.locale : resolvePreferredLocale()
      const returnTo = `${window.location.pathname}${window.location.search}`
      window.location.assign(`/${locale}/auth/sign-in?redirect=${encodeURIComponent(returnTo)}`)
    }
  }, [params.locale, resolved, user])
  if (!resolved || !user) return <LoadingRegion className="route-loader" label={t('Loading account')} />
  return children
}

function ConsoleGuard() {
  return <AuthenticatedUserBoundary><ConsoleShell /></AuthenticatedUserBoundary>
}

const consoleRoute = createRoute({ getParentRoute: () => localeRoute, path: consoleBaseSegment, component: ConsoleGuard })
const consoleIndexRoute = createRoute({ getParentRoute: () => consoleRoute, path: '/', beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('overview'), params: { locale: params.locale } }) } })
const overviewComponent = lazyRouteComponent(() => import(/* webpackChunkName: "console-overview" */ '@/pages/console-overview-page'), 'ConsoleOverviewPage')
const overviewRoute = createRoute({ getParentRoute: () => consoleRoute, path: consoleRouteMap.overview.segment, component: overviewComponent, ...consoleRouteAsyncOptions })
const analyticsComponent = lazyRouteComponent(() => import(/* webpackChunkName: "console-analytics" */ '@/pages/console-analytics-page'), 'ConsoleAnalyticsPage')
const analyticsRoute = createRoute({ getParentRoute: () => consoleRoute, path: consoleRouteMap.analytics.segment, component: analyticsComponent, ...consoleRouteAsyncOptions })
const keysComponent = lazyRouteComponent(() => import(/* webpackChunkName: "console-api-keys" */ '@/pages/console-keys-page'), 'ConsoleKeysPage')
const keysRoute = createRoute({ getParentRoute: () => consoleRoute, path: consoleRouteMap.keys.segment, component: keysComponent, ...consoleRouteAsyncOptions })
const usageLogsComponent = lazyRouteComponent(() => import(/* webpackChunkName: "console-usage-logs" */ '@/pages/console-usage-logs-page'), 'ConsoleUsageLogsPage')
const usageLogsRoute = createRoute({ getParentRoute: () => consoleRoute, path: consoleRouteMap.usageLogs.segment, component: usageLogsComponent, ...consoleRouteAsyncOptions })
const walletComponent = lazyRouteComponent(() => import(/* webpackChunkName: "console-wallet" */ '@/pages/wallet-page'), 'WalletPage')
const walletRoute = createRoute({ getParentRoute: () => consoleRoute, path: consoleRouteMap.wallet.segment, component: walletComponent, ...consoleRouteAsyncOptions })
const profileComponent = lazyRouteComponent(() => import(/* webpackChunkName: "console-profile" */ '@/pages/profile-page'), 'ProfilePage')
const profileRoute = createRoute({ getParentRoute: () => consoleRoute, path: consoleRouteMap.profile.segment, component: profileComponent, ...consoleRouteAsyncOptions })
const profileSecurityRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'security', beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('profile'), params: { locale: params.locale }, search: { tab: 'security' }, replace: true }) } })
const profileConnectionsRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'connections', beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('profile'), params: { locale: params.locale }, search: { tab: 'connections' }, replace: true }) } })
const profileNotificationsRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'notifications', beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('profile'), params: { locale: params.locale }, search: { tab: 'notifications' }, replace: true }) } })
const playgroundComponent = lazyRouteComponent(() => import(/* webpackChunkName: "console-playground" */ '@/pages/workbench-pages'), 'PlaygroundPage')
const playgroundRoute = createRoute({ getParentRoute: () => consoleRoute, path: consoleRouteMap.playground.segment, component: playgroundComponent, ...consoleRouteAsyncOptions })
const playgroundDetailRoute = createRoute({ getParentRoute: () => consoleRoute, path: `${consoleRouteMap.playground.segment}/$chatId`, component: playgroundComponent, ...consoleRouteAsyncOptions })
const studioComponent = lazyRouteComponent(() => import(/* webpackChunkName: "console-studio" */ '@/pages/studio-page'), 'StudioPage')
const studioRoute = createRoute({ getParentRoute: () => consoleRoute, path: consoleRouteMap.studio.segment, component: studioComponent, ...consoleRouteAsyncOptions })
const studioDetailRoute = createRoute({ getParentRoute: () => consoleRoute, path: `${consoleRouteMap.studio.segment}/$projectId`, component: studioComponent, ...consoleRouteAsyncOptions })

const consoleCompatibilityRoute = createRoute({ getParentRoute: () => localeRoute, path: consoleCompatibilityBaseSegment })
const consoleCompatibilityIndexRoute = createRoute({ getParentRoute: () => consoleCompatibilityRoute, path: '/', beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('overview'), params: { locale: params.locale }, search: true, replace: true }) } })
const consoleCompatibilityOverviewRoute = createRoute({ getParentRoute: () => consoleCompatibilityRoute, path: consoleRouteMap.overview.compatibilitySegment, beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('overview'), params: { locale: params.locale }, search: true, replace: true }) } })
const consoleCompatibilityAnalyticsRoute = createRoute({ getParentRoute: () => consoleCompatibilityRoute, path: consoleRouteMap.analytics.compatibilitySegment, beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('analytics'), params: { locale: params.locale }, search: true, replace: true }) } })
const consoleCompatibilityKeysRoute = createRoute({ getParentRoute: () => consoleCompatibilityRoute, path: consoleRouteMap.keys.compatibilitySegment, beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('keys'), params: { locale: params.locale }, search: true, replace: true }) } })
const consoleCompatibilityUsageLogsRoute = createRoute({ getParentRoute: () => consoleCompatibilityRoute, path: consoleRouteMap.usageLogs.compatibilitySegment, beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('usageLogs'), params: { locale: params.locale }, search: true, replace: true }) } })

const legacyProfileSecurityRoute = createRoute({ getParentRoute: () => localeRoute, path: 'console-security', beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('profile'), params: { locale: params.locale }, search: { tab: 'security' }, replace: true }) } })
const legacyProfileConnectionsRoute = createRoute({ getParentRoute: () => localeRoute, path: 'console-connections', beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('profile'), params: { locale: params.locale }, search: { tab: 'connections' }, replace: true }) } })
const legacyProfileNotificationsRoute = createRoute({ getParentRoute: () => localeRoute, path: 'console-notifications', beforeLoad: ({ params }) => { throw redirect({ to: canonicalConsoleRoute('profile'), params: { locale: params.locale }, search: { tab: 'notifications' }, replace: true }) } })

const oauthRoute = createRoute({ getParentRoute: () => rootRoute, path: 'oauth/$provider', component: oauthCallbackComponent })
const technicalResetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'user/reset',
  beforeLoad: ({ location }) => {
    const locale = resolvePreferredLocale()
    throw redirect({
      to: '/$locale/auth/reset',
      params: { locale },
      search: location.search,
      replace: true,
    })
  },
})

const consoleTree = consoleRoute.addChildren([consoleIndexRoute, overviewRoute, analyticsRoute, keysRoute, usageLogsRoute, walletRoute, profileRoute, profileSecurityRoute, profileConnectionsRoute, profileNotificationsRoute, playgroundRoute, playgroundDetailRoute, studioRoute, studioDetailRoute])
const consoleCompatibilityTree = consoleCompatibilityRoute.addChildren([consoleCompatibilityIndexRoute, consoleCompatibilityOverviewRoute, consoleCompatibilityAnalyticsRoute, consoleCompatibilityKeysRoute, consoleCompatibilityUsageLogsRoute])
const localeTree = localeRoute.addChildren([homeRoute, docsRoute, ...docsCompatibilityRoutes, aboutRoute, noticesRoute, statusRoute, userAgreementRoute, serviceAgreementRoute, privacyPolicyRoute, signInRoute, signUpRoute, verifyEmailRoute, forgotRoute, localizedResetRoute, otpRoute, consoleTree, consoleCompatibilityTree, legacyProfileSecurityRoute, legacyProfileConnectionsRoute, legacyProfileNotificationsRoute])
const routeTree = rootRoute.addChildren([rootIndexRoute, localeTree, oauthRoute, technicalResetRoute])

export const router = createRouter({ routeTree, defaultPreload: 'intent', defaultPendingComponent: GlobalRoutePending, scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
