import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, redirect, useParams } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { isAppLocale, resolvePreferredLocale } from '@partokens/i18n'

import { ConsoleShell } from '@/components/console-shell'
import { consoleRouteAsyncOptions } from '@/components/console-route-state'
import { i18n } from '@/lib/i18n'
import {
  canonicalConsoleRoute,
  consoleBaseSegment,
  consoleCompatibilityBaseSegment,
  consoleRouteMap,
} from '@/lib/routes'
import { useSessionStore } from '@/stores/session'

const rootRoute = createRootRoute({ component: () => <Outlet /> })

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

const localeRoute = createRoute({ getParentRoute: () => rootRoute, path: '$locale', component: LocaleBoundary })
const publicHomeComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicHomeRoute')
const publicModelsComponent = lazyRouteComponent(() => import('@/features/public/public-route'), 'PublicModelsRoute')
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
const modelsRoute = createRoute({ getParentRoute: () => localeRoute, path: 'models', component: publicModelsComponent })
const docsRoute = createRoute({ getParentRoute: () => localeRoute, path: 'docs', component: publicDocsComponent })
const aboutRoute = createRoute({ getParentRoute: () => localeRoute, path: 'about', component: publicAboutComponent })
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
  const { user, resolved, resolve } = useSessionStore()
  const params = useParams({ strict: false }) as { locale?: string }
  useEffect(() => { void resolve() }, [resolve])
  useEffect(() => {
    if (!resolved) return
    if (!user) {
      const locale = isAppLocale(params.locale) ? params.locale : resolvePreferredLocale()
      const returnTo = `${window.location.pathname}${window.location.search}`
      window.location.assign(`/${locale}/auth/sign-in?redirect=${encodeURIComponent(returnTo)}`)
    }
    else if (user.role >= 10) window.location.assign('/channels')
  }, [params.locale, resolved, user])
  if (!resolved || !user || user.role >= 10) return <div className="route-loader"><LoaderCircle className="spin" size={22} />{t('Loading account')}</div>
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
const localeTree = localeRoute.addChildren([homeRoute, modelsRoute, docsRoute, aboutRoute, noticesRoute, statusRoute, userAgreementRoute, serviceAgreementRoute, privacyPolicyRoute, signInRoute, signUpRoute, verifyEmailRoute, forgotRoute, localizedResetRoute, otpRoute, consoleTree, consoleCompatibilityTree, legacyProfileSecurityRoute, legacyProfileConnectionsRoute, legacyProfileNotificationsRoute])
const routeTree = rootRoute.addChildren([rootIndexRoute, localeTree, oauthRoute, technicalResetRoute])

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
