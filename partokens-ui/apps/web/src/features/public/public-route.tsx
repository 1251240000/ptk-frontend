import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

import { getPricingCatalog, getStatusWithSignal } from '@partokens/api-client'
import { loadPublicContent, type PublicContentSnapshot } from '@partokens/content/public-config'
import { isAppLocale, type AppLocale } from '@partokens/i18n'

import { canonicalConsolePath } from '@/lib/routes'
import { usePreferenceStore } from '@/stores/preferences'
import { useSessionStore } from '@/stores/session'
import { PublicPrototype, type PublicPrototypeScreen, type PublicTarget } from './public-pages'

function resolvedDocumentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

const publicContentStateCopy: Record<AppLocale, { loading: string; error: string; retry: string }> = {
  'zh-CN': { loading: '正在加载公开内容', error: '暂时无法加载公开内容。', retry: '重试' },
  'zh-TW': { loading: '正在載入公開內容', error: '暫時無法載入公開內容。', retry: '重試' },
  en: { loading: 'Loading public content', error: 'Public content is temporarily unavailable.', retry: 'Try again' },
  ja: { loading: '公開コンテンツを読み込み中', error: '公開コンテンツを一時的に読み込めません。', retry: '再試行' },
  ru: { loading: 'Загрузка публичных материалов', error: 'Публичные материалы временно недоступны.', retry: 'Повторить' },
  fr: { loading: 'Chargement du contenu public', error: 'Le contenu public est temporairement indisponible.', retry: 'Réessayer' },
  vi: { loading: 'Đang tải nội dung công khai', error: 'Nội dung công khai tạm thời không khả dụng.', retry: 'Thử lại' },
}

export function PublicRoute(props: { screen: PublicPrototypeScreen }) {
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const pathname = useLocation({ select: (location) => location.pathname })
  const navigate = useNavigate()
  const themeMode = usePreferenceStore((state) => state.theme)
  const setTheme = usePreferenceStore((state) => state.setTheme)
  const resolveSession = useSessionStore((state) => state.resolve)
  const user = useSessionStore((state) => state.user)
  const sessionResolved = useSessionStore((state) => state.resolved)
  const [theme, setResolvedTheme] = useState(resolvedDocumentTheme)
  const publicContent = useQuery<PublicContentSnapshot>({
    queryKey: ['public-content'],
    queryFn: ({ signal }) => loadPublicContent('/public-content', signal),
    initialData: undefined,
    staleTime: 60_000,
    retry: 1,
  })
  const status = useQuery({
    queryKey: ['public', 'status'],
    queryFn: ({ signal }) => getStatusWithSignal(signal),
    enabled: props.screen === 'status',
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

  if (!publicContent.data) {
    const copy = publicContentStateCopy[locale]
    return <main className={`r3-public-screen shadcn-admin public-shadcn ${theme}`}>
      <section className="r3-page r3-page-intro" role="status" aria-live="polite">
        <div><span>PARTOKENS</span><h1>{publicContent.isError ? copy.error : copy.loading}</h1>
          {publicContent.isError ? <button type="button" className="pt-button" data-variant="secondary" onClick={() => void publicContent.refetch()}>{copy.retry}</button> : null}
        </div>
      </section>
    </main>
  }

  return (
    <PublicPrototype
      screen={props.screen}
      locale={locale}
      publicContent={publicContent.data}
      theme={theme}
      themeMode={themeMode}
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
      onThemeChange={setTheme}
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
