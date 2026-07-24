import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, redirect, useLocation, useParams } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { isAppLocale, resolvePreferredLocale } from '@partokens/i18n'

import { ConsoleShell } from '@/components/console-shell'
import { TopNav } from '@/components/top-nav'
import { i18n } from '@/lib/i18n'
import { AboutPage, LegalPage } from '@/pages/content-pages'
import { KeysPage, OverviewPage, UsageLogsPage } from '@/pages/console-pages'
import { AnalyticsPage } from '@/pages/analytics-page'
import { DocsPage } from '@/pages/docs-page'
import { HomePage } from '@/pages/home-page'
import { ModelsPage } from '@/pages/models-page'
import { ForgotPasswordPage, OAuthCallbackPage, OtpPage, ResetPasswordPage, SignInPage, SignUpPage } from '@/pages/auth-pages'
import { ProfilePage } from '@/pages/profile-page'
import { WalletPage } from '@/pages/wallet-page'
import { useSessionStore } from '@/stores/session'

const rootRoute = createRootRoute({ component: () => <Outlet /> })

const rootIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/$locale', params: { locale: resolvePreferredLocale() } }) },
})

function LocaleBoundary() {
  const params = useParams({ strict: false }) as { locale?: string }
  const pathname = useLocation({ select: (state) => state.pathname })
  const locale = isAppLocale(params.locale) ? params.locale : null
  useEffect(() => {
    if (!locale) { window.location.replace(`/${resolvePreferredLocale()}/`); return }
    document.documentElement.lang = locale
    window.localStorage.setItem('partokens-locale', locale)
    void i18n.changeLanguage(locale)
  }, [locale])
  if (!locale) return null
  const isAuth = pathname.includes('/auth/')
  return <>{isAuth ? null : <TopNav />}<Outlet /></>
}

const localeRoute = createRoute({ getParentRoute: () => rootRoute, path: '$locale', component: LocaleBoundary })
const homeRoute = createRoute({ getParentRoute: () => localeRoute, path: '/', component: HomePage })
const modelsRoute = createRoute({ getParentRoute: () => localeRoute, path: 'models', component: ModelsPage })
const docsRoute = createRoute({ getParentRoute: () => localeRoute, path: 'docs', component: DocsPage })
const aboutRoute = createRoute({ getParentRoute: () => localeRoute, path: 'about', component: AboutPage })
const legalRoute = createRoute({ getParentRoute: () => localeRoute, path: 'legal/$kind', component: LegalPage })
const signInRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/sign-in', component: SignInPage })
const signUpRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/sign-up', component: SignUpPage })
const forgotRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/forgot-password', component: ForgotPasswordPage })
const localizedResetRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/reset', component: ResetPasswordPage })
const otpRoute = createRoute({ getParentRoute: () => localeRoute, path: 'auth/otp', component: OtpPage })

function ConsoleGuard() {
  const { t } = useTranslation()
  const { user, resolved, resolve } = useSessionStore()
  const params = useParams({ strict: false }) as { locale?: string }
  useEffect(() => { void resolve() }, [resolve])
  useEffect(() => {
    if (!resolved) return
    if (!user) window.location.assign(`/${isAppLocale(params.locale) ? params.locale : resolvePreferredLocale()}/auth/sign-in`)
    else if (user.role >= 10) window.location.assign('/channels')
  }, [params.locale, resolved, user])
  if (!resolved || !user || user.role >= 10) return <div className="route-loader"><LoaderCircle className="spin" size={22} />{t('Loading account')}</div>
  return <ConsoleShell />
}

const consoleRoute = createRoute({ getParentRoute: () => localeRoute, path: 'console', component: ConsoleGuard })
const consoleIndexRoute = createRoute({ getParentRoute: () => consoleRoute, path: '/', beforeLoad: ({ params }) => { throw redirect({ to: '/$locale/console/overview', params: { locale: params.locale } }) } })
const overviewRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'overview', component: OverviewPage })
const analyticsRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'analytics', component: AnalyticsPage })
const keysRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'keys', component: KeysPage })
const logsRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'usage-logs', component: UsageLogsPage })
const walletRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'wallet', component: WalletPage })
const profileRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'profile', component: ProfilePage })
const playgroundComponent = lazyRouteComponent(() => import('@/pages/workbench-pages'), 'PlaygroundPage')
const playgroundRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'playground', component: playgroundComponent })
const playgroundDetailRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'playground/$chatId', component: playgroundComponent })
const studioComponent = lazyRouteComponent(() => import('@/pages/studio-page'), 'StudioPage')
const studioRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'studio', component: studioComponent })
const studioDetailRoute = createRoute({ getParentRoute: () => consoleRoute, path: 'studio/$projectId', component: studioComponent })

const oauthRoute = createRoute({ getParentRoute: () => rootRoute, path: 'oauth/$provider', component: OAuthCallbackPage })
const technicalResetRoute = createRoute({ getParentRoute: () => rootRoute, path: 'user/reset', component: ResetPasswordPage })

const consoleTree = consoleRoute.addChildren([consoleIndexRoute, overviewRoute, analyticsRoute, keysRoute, logsRoute, walletRoute, profileRoute, playgroundRoute, playgroundDetailRoute, studioRoute, studioDetailRoute])
const localeTree = localeRoute.addChildren([homeRoute, modelsRoute, docsRoute, aboutRoute, legalRoute, signInRoute, signUpRoute, forgotRoute, localizedResetRoute, otpRoute, consoleTree])
const routeTree = rootRoute.addChildren([rootIndexRoute, localeTree, oauthRoute, technicalResetRoute])

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
