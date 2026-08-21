import { Link, Outlet, useLocation, useParams } from '@tanstack/react-router'
import {
  BarChart3,
  Bell,
  BookOpen,
  CircleUserRound,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  ReceiptText,
  Sun,
  WalletCards,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  PartokensAvatar,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  Toaster,
  useSidebar,
} from '@partokens/design-system/components'
import { isAppLocale, localeLabels, locales, type AppLocale } from '@partokens/i18n'

import { consoleRouteRetryStorageKey } from '@/components/console-route-state'
import { canonicalConsoleRoute, consolePageFromPathname, localizedLocation, type CanonicalConsolePage } from '@/lib/routes'
import { usePreferenceStore, type ThemeMode } from '@/stores/preferences'
import { useSessionStore } from '@/stores/session'

type ConsolePage = CanonicalConsolePage

type NavigationItem = {
  label: string
  icon: typeof KeyRound
  page: ConsolePage
}

const consoleNavigation: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: 'Workspace',
    items: [
      { label: 'Playground', page: 'playground', icon: MessageSquare },
      { label: 'Image studio', page: 'studio', icon: ImageIcon },
    ],
  },
  {
    label: 'General',
    items: [
      { label: 'Overview', page: 'overview', icon: LayoutDashboard },
      { label: 'Analytics', page: 'analytics', icon: BarChart3 },
      { label: 'API keys', page: 'keys', icon: KeyRound },
      { label: 'Usage logs', page: 'usageLogs', icon: ReceiptText },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Wallet', page: 'wallet', icon: WalletCards },
      { label: 'Profile', page: 'profile', icon: CircleUserRound },
    ],
  },
]

const pageLabels: Record<ConsolePage, string> = {
  overview: 'Overview',
  analytics: 'Analytics',
  keys: 'API keys',
  usageLogs: 'Usage logs',
  playground: 'Playground',
  studio: 'Image studio',
  wallet: 'Wallet',
  profile: 'Profile',
}

function userInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'U'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0] ?? ''}${words.at(-1)?.[0] ?? ''}`.toUpperCase()
}

function useConsoleNavigation() {
  const { isMobile, setOpenMobile } = useSidebar()

  return () => {
    if (!isMobile) return
    setOpenMobile(false)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLButtonElement>('[data-console-sidebar-trigger]')?.focus()
      })
    })
  }
}

function BrandMenu() {
  const { t } = useTranslation()

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex h-12 items-center gap-2 rounded-md p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
        <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-muted group-data-[collapsible=icon]:hidden">
          <PartokensAvatar size={28} alt="" />
        </div>
        <div className="grid min-w-0 flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-semibold">Partokens</span>
          <span className="truncate text-xs">{t('Developer console')}</span>
        </div>
        <SidebarTrigger className="ms-auto size-8 shrink-0" data-console-sidebar-trigger label={t('Toggle sidebar')} />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function ConsoleNavigation({ activePage }: { activePage: ConsolePage }) {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const closeMobileNavigation = useConsoleNavigation()

  return consoleNavigation.map((group) => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            const Icon = item.icon
            const isActive = item.page === activePage
            const content = <><Icon /><span>{t(item.label)}</span></>

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.label)}>
                  <Link
                    to={canonicalConsoleRoute(item.page)}
                    params={{ locale }}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={closeMobileNavigation}
                  >
                    {content}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}

function UserMenu() {
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const user = useSessionStore((state) => state.user)
  const signOut = useSessionStore((state) => state.signOut)
  const name = user?.display_name || user?.username || t('Account')
  const email = user?.email || user?.username || ''

  const handleSignOut = async () => {
    await signOut()
    window.location.assign(`/${locale}/auth/sign-in`)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                {userInitials(name)}
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to={canonicalConsoleRoute('wallet')} params={{ locale }}><WalletCards />{t('Wallet')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={canonicalConsoleRoute('profile')} params={{ locale }}><CircleUserRound />{t('Profile')}</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void handleSignOut()}><LogOut />{t('Sign out')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function ThemeMenu() {
  const { t } = useTranslation()
  const theme = usePreferenceStore((state) => state.theme)
  const setTheme = usePreferenceStore((state) => state.setTheme)
  const options: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Light mode', icon: Sun },
    { value: 'dark', label: 'Dark mode', icon: Moon },
    { value: 'system', label: 'System mode', icon: Monitor },
  ]

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={t('Theme')} title={t('Theme')}>
          <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="pt-interface-menu w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t('Theme')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
          {options.map((option) => {
            const Icon = option.icon
            return <DropdownMenuRadioItem key={option.value} value={option.value}><Icon />{t(option.label)}</DropdownMenuRadioItem>
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function HeaderAccountMenu() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const user = useSessionStore((state) => state.user)
  const signOut = useSessionStore((state) => state.signOut)
  const name = user?.display_name || user?.username || t('Account')
  const email = user?.email || user?.username || ''

  const handleSignOut = async () => {
    await signOut()
    window.location.assign(`/${locale}/auth/sign-in`)
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('Account menu')}>
          <CircleUserRound />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-lg">
        <DropdownMenuLabel className="font-normal">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to={canonicalConsoleRoute('wallet')} params={{ locale }}><WalletCards />{t('Wallet')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={canonicalConsoleRoute('profile')} params={{ locale }}><CircleUserRound />{t('Profile')}</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}><LogOut />{t('Sign out')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const pageSections: Record<ConsolePage, string> = {
  overview: 'General',
  analytics: 'General',
  keys: 'General',
  usageLogs: 'General',
  playground: 'Workspace',
  studio: 'Workspace',
  wallet: 'Account',
  profile: 'Account',
}

function LanguageMenu() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'en'
  const pathname = useLocation({ select: (state) => state.pathname })
  const replaceLocale = (nextLocale: AppLocale) => {
    window.location.assign(localizedLocation(pathname, nextLocale, window.location.search, window.location.hash))
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('Language')} title={t('Language')}>
          <Globe2 aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="pt-interface-menu w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t('Language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => isAppLocale(value) && replaceLocale(value)}>
          {locales.map((option) => <DropdownMenuRadioItem key={option} value={option}>{localeLabels[option]}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConsoleHeader({ activePage }: { activePage: ConsolePage }) {
  const { t } = useTranslation()
  const { isMobile, openMobile } = useSidebar()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'en'
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(openMobile)

  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = openMobile
    if (!isMobile || !wasOpen || openMobile) return

    const timeout = window.setTimeout(() => triggerRef.current?.focus(), 350)
    return () => window.clearTimeout(timeout)
  }, [isMobile, openMobile])

  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-3 p-4 sm:gap-4">
        <SidebarTrigger ref={triggerRef} variant="outline" className="max-md:scale-110 md:hidden" data-console-sidebar-trigger label={t('Toggle sidebar')} />
        <Separator orientation="vertical" className="h-6 md:hidden" />
        <div data-console-breadcrumb className="min-w-0 text-sm max-[340px]:hidden">
          <span className="hidden text-muted-foreground sm:inline">{t(pageSections[activePage])} / </span>
          <span className="font-medium">{t(pageLabels[activePage])}</span>
        </div>
        <div className="ms-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="rounded-full" aria-label={t('Notifications')} title={t('Notifications')}>
            <Link to="/$locale/notices" params={{ locale }}><Bell /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="rounded-full" aria-label={t('Docs')} title={t('Docs')}>
            <Link to="/$locale/docs" params={{ locale }}><BookOpen /></Link>
          </Button>
          <LanguageMenu />
          <ThemeMenu />
          <HeaderAccountMenu />
        </div>
      </div>
    </header>
  )
}

export function ConsoleShell() {
  const { t } = useTranslation()
  const pathname = useLocation({ select: (state) => state.pathname })
  const mainRef = useRef<HTMLElement>(null)
  const theme = usePreferenceStore((state) => state.theme)
  const sidebarCollapsed = usePreferenceStore((state) => state.sidebarCollapsed)
  const toggleSidebar = usePreferenceStore((state) => state.toggleSidebar)
  const activePage = consolePageFromPathname(pathname)

  useEffect(() => {
    document.body.classList.add('console-portal')
    return () => document.body.classList.remove('console-portal')
  }, [])

  useEffect(() => {
    const currentLocation = `${window.location.pathname}${window.location.search}`
    if (window.sessionStorage.getItem(consoleRouteRetryStorageKey) !== currentLocation) return
    window.sessionStorage.removeItem(consoleRouteRetryStorageKey)
    window.requestAnimationFrame(() => mainRef.current?.focus())
  }, [pathname])

  return (
    <div className="console-root" data-console-root lang={document.documentElement.lang}>
      <SidebarProvider
        open={!sidebarCollapsed}
        onOpenChange={(open) => {
          if (open === sidebarCollapsed) toggleSidebar()
          window.queueMicrotask(() => {
            document.cookie = 'sidebar_state=; path=/; max-age=0'
          })
        }}
      >
        <Sidebar variant="inset" collapsible="icon" mobileTitle={t('Console navigation')} mobileDescription={t('Displays console navigation on mobile.')}>
          <SidebarHeader><BrandMenu /></SidebarHeader>
          <SidebarContent><ConsoleNavigation activePage={activePage} /></SidebarContent>
          <SidebarFooter><UserMenu /></SidebarFooter>
          <SidebarRail label={t('Toggle sidebar')} />
        </Sidebar>

        <div className="@container/content relative flex min-w-0 w-full flex-1 flex-col bg-background">
          <ConsoleHeader activePage={activePage} />
          <main ref={mainRef} className="w-full px-4 py-6 sm:px-6" tabIndex={-1} aria-label={t('Console content')}>
            <div className="mx-auto w-full max-w-7xl space-y-6"><Outlet /></div>
          </main>
        </div>
      </SidebarProvider>
      <Toaster theme={theme} position="top-right" richColors closeButton containerAriaLabel={t('Notifications')} />
    </div>
  )
}
