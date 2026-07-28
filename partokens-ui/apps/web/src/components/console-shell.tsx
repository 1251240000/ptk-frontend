import { Link, Outlet, useLocation, useParams } from '@tanstack/react-router'
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Check,
  ChevronsUpDown,
  CircleUserRound,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Link2,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  ReceiptText,
  ShieldCheck,
  Sun,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
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
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  Toaster,
  useSidebar,
} from '@partokens/design-system/components'
import { isAppLocale } from '@partokens/i18n'

import { consoleRouteRetryStorageKey } from '@/components/console-route-state'
import { canonicalConsoleRoute, consolePageFromPathname, type CanonicalConsolePage } from '@/lib/routes'
import { usePreferenceStore, type ThemeMode } from '@/stores/preferences'
import { useSessionStore } from '@/stores/session'

type ConsolePage = CanonicalConsolePage

type NavigationItem = {
  label: string
  icon: typeof KeyRound
  page?: ConsolePage
  unavailable?: boolean
}

const consoleNavigation: Array<{ label: string; items: NavigationItem[] }> = [
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
    label: 'Workspace',
    items: [
      { label: 'Playground', page: 'playground', icon: MessageSquare },
      { label: 'Image studio', page: 'studio', icon: ImageIcon },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Wallet', page: 'wallet', icon: WalletCards },
      { label: 'Profile', page: 'profile', icon: CircleUserRound },
      { label: 'Security', icon: ShieldCheck, unavailable: true },
      { label: 'Connections', icon: Link2, unavailable: true },
      { label: 'Notifications', icon: Bell, unavailable: true },
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
  const { isMobile } = useSidebar()
  const closeMobileNavigation = useConsoleNavigation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <KeyRound className="size-4" />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">Partokens</span>
                <span className="truncate text-xs">{t('Developer console')}</span>
              </div>
              <ChevronsUpDown className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">{t('Workspace')}</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <Link to={canonicalConsoleRoute('overview')} params={{ locale }} onClick={closeMobileNavigation}>
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <LayoutDashboard className="size-4" />
                </div>
                {t('Developer console')}
                <Check className="ms-auto size-4" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" disabled aria-label={`${t('Component lab')} - ${t('Unavailable')}`}>
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <BadgeCheck className="size-4" />
              </div>
              {t('Component lab')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                {item.page ? (
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
                ) : (
                  <SidebarMenuButton
                    disabled={item.unavailable}
                    tooltip={`${t(item.label)} - ${t('Unavailable')}`}
                    aria-label={`${t(item.label)} - ${t('Unavailable')}`}
                  >
                    {content}
                  </SidebarMenuButton>
                )}
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
              <ChevronsUpDown className="ms-auto size-4" />
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
                <Link to={canonicalConsoleRoute('profile')} params={{ locale }}><CircleUserRound />{t('Profile')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled aria-label={`${t('Notifications')} - ${t('Unavailable')}`}>
                <Bell />{t('Notifications')}
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
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={t('Change theme')}>
          <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
  const name = user?.display_name || user?.username || t('Account')

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('Account menu')}>
          <CircleUserRound />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={canonicalConsoleRoute('profile')} params={{ locale }}><CircleUserRound />{t('Profile')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled aria-label={`${t('Notifications')} - ${t('Unavailable')}`}>
          <Bell />{t('Notifications')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConsoleHeader({ activePage }: { activePage: ConsolePage }) {
  const { t } = useTranslation()
  const { isMobile, openMobile } = useSidebar()
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
        <SidebarTrigger ref={triggerRef} variant="outline" className="max-md:scale-110" data-console-sidebar-trigger />
        <Separator orientation="vertical" className="h-6" />
        <div className="min-w-0 text-sm">
          <span className="hidden text-muted-foreground sm:inline">{t('Console')} / </span>
          <span className="font-medium">{t(pageLabels[activePage])}</span>
        </div>
        <div className="ms-auto flex items-center gap-1">
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
  const toasterTheme = useMemo(() => {
    if (theme !== 'system') return theme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [theme])

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
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader><BrandMenu /></SidebarHeader>
          <SidebarContent><ConsoleNavigation activePage={activePage} /></SidebarContent>
          <SidebarFooter><UserMenu /></SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="@container/content min-w-0">
          <ConsoleHeader activePage={activePage} />
          <main ref={mainRef} className="w-full px-4 py-6 sm:px-6" tabIndex={-1} aria-label={t('Console content')}>
            <div className="mx-auto w-full max-w-7xl space-y-6"><Outlet /></div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster theme={toasterTheme} position="bottom-right" richColors closeButton />
    </div>
  )
}
