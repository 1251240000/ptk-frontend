import {
  BarChart3,
  Bell,
  BookOpen,
  Check,
  CircleUserRound,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  ReceiptText,
  Sun,
  WalletCards,
} from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  Toaster,
  useSidebar,
} from '@partokens/design-system/components'
import { PartokensMark } from './partokens-mark'

export type Theme = 'light' | 'dark'
export type ConsoleLanguage = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ru' | 'fr'

export const consoleLanguageOptions: ReadonlyArray<{ value: ConsoleLanguage; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ru', label: 'Русский' },
  { value: 'fr', label: 'Français' },
]

type ConsoleLanguageContextValue = {
  language: ConsoleLanguage
  setLanguage: (language: ConsoleLanguage) => void
}

const ConsoleLanguageContext = createContext<ConsoleLanguageContextValue | null>(null)

export function ConsoleLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<ConsoleLanguage>(() => {
    const saved = window.localStorage.getItem('partokens-console-language')
    return consoleLanguageOptions.some((option) => option.value === saved) ? saved as ConsoleLanguage : 'en'
  })

  useEffect(() => {
    window.localStorage.setItem('partokens-console-language', language)
  }, [language])

  return <ConsoleLanguageContext.Provider value={{ language, setLanguage }}>{children}</ConsoleLanguageContext.Provider>
}

export function useConsoleLanguage() {
  const value = useContext(ConsoleLanguageContext)
  if (!value) throw new Error('useConsoleLanguage must be used within ConsoleLanguageProvider')
  return value
}

export type ConsoleRoute =
  | 'console'
  | 'console-analytics'
  | 'console-keys'
  | 'console-logs'
  | 'console-playground'
  | 'console-studio'
  | 'console-wallet'
  | 'console-profile'
  | 'console-security'
  | 'console-connections'
  | 'console-notifications'

export type ConsoleTarget = ConsoleRoute | 'system' | 'docs' | 'notices'

export type ConsoleScreenProps = {
  theme: Theme
  onTheme: () => void
  onNavigate: (target: ConsoleTarget) => void
}

type ConsoleShellProps = ConsoleScreenProps & {
  activeRoute: ConsoleRoute
  children: ReactNode
}

const consoleNavigation: {
  label: string
  items: { label: string; target: ConsoleRoute; icon: typeof KeyRound }[]
}[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Playground', target: 'console-playground', icon: MessageSquare },
      { label: 'Image studio', target: 'console-studio', icon: ImageIcon },
    ],
  },
  {
    label: 'General',
    items: [
      { label: 'Overview', target: 'console', icon: LayoutDashboard },
      { label: 'Analytics', target: 'console-analytics', icon: BarChart3 },
      { label: 'API keys', target: 'console-keys', icon: KeyRound },
      { label: 'Usage logs', target: 'console-logs', icon: ReceiptText },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Wallet', target: 'console-wallet', icon: WalletCards },
      { label: 'Profile', target: 'console-profile', icon: CircleUserRound },
    ],
  },
]

const routeSections: Record<ConsoleRoute, 'Workspace' | 'General' | 'Account'> = {
  console: 'General',
  'console-analytics': 'General',
  'console-keys': 'General',
  'console-logs': 'General',
  'console-playground': 'Workspace',
  'console-studio': 'Workspace',
  'console-wallet': 'Account',
  'console-profile': 'Account',
  'console-security': 'Account',
  'console-connections': 'Account',
  'console-notifications': 'Account',
}

const routeLabels: Record<ConsoleRoute, string> = {
  console: 'Overview',
  'console-analytics': 'Analytics',
  'console-keys': 'API keys',
  'console-logs': 'Usage logs',
  'console-playground': 'Playground',
  'console-studio': 'Image studio',
  'console-wallet': 'Wallet',
  'console-profile': 'Profile',
  'console-security': 'Security',
  'console-connections': 'Connections',
  'console-notifications': 'Notifications',
}

function useConsoleNavigation(onNavigate: ConsoleScreenProps['onNavigate']) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (target: ConsoleTarget) => {
    if (isMobile) setOpenMobile(false)
    onNavigate(target)

    if (isMobile) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.querySelector<HTMLButtonElement>('[data-console-sidebar-trigger]')?.focus()
        })
      })
    }
  }
}

function BrandMenu() {
  return (
    <SidebarMenu>
      <SidebarMenuItem className='flex h-12 items-center gap-2 rounded-md p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0'>
        <div className='flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden'>
          <PartokensMark className='size-4' />
        </div>
        <div className='grid min-w-0 flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden'>
          <span className='truncate font-semibold'>Partokens</span>
          <span className='truncate text-xs'>Developer console</span>
        </div>
        <SidebarTrigger className='ms-auto size-8 shrink-0' />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function ConsoleNavigation({ activeRoute, onNavigate }: Pick<ConsoleShellProps, 'activeRoute' | 'onNavigate'>) {
  const navigate = useConsoleNavigation(onNavigate)

  return consoleNavigation.map((group) => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map(({ label, target, icon: Icon }) => (
            <SidebarMenuItem key={target}>
              <SidebarMenuButton
                isActive={target === activeRoute}
                tooltip={label}
                onClick={() => navigate(target)}
              >
                <Icon />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}

function AccountMenuContent({ onSelectRoute, side = 'bottom' }: { onSelectRoute: (target: ConsoleRoute) => void; side?: 'bottom' | 'right' }) {
  return (
    <DropdownMenuContent
      className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
      side={side}
      align='end'
      sideOffset={4}
    >
      <DropdownMenuLabel className='font-normal'>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-medium'>Mika Chen</p>
          <p className='text-xs text-muted-foreground'>mika@partokens.com</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onSelect={() => onSelectRoute('console-wallet')}>
          <WalletCards />Wallet
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSelectRoute('console-profile')}>
          <CircleUserRound />Profile
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem><LogOut />Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  )
}

function UserMenu({ onNavigate }: Pick<ConsoleScreenProps, 'onNavigate'>) {
  const { isMobile } = useSidebar()
  const navigate = useConsoleNavigation(onNavigate)
  const selectRoute = (target: ConsoleRoute) => {
    window.requestAnimationFrame(() => navigate(target))
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex size-8 items-center justify-center rounded-lg bg-muted text-sm font-medium'>MC</div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>Mika Chen</span>
                <span className='truncate text-xs'>mika@partokens.com</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <AccountMenuContent onSelectRoute={selectRoute} side={isMobile ? 'bottom' : 'right'} />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function ThemeMenu({ theme, onTheme }: Pick<ConsoleScreenProps, 'theme' | 'onTheme'>) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative rounded-full' aria-label='Change theme'>
          <Sun className='size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
          <Moon className='absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44'>
        <DropdownMenuLabel className='text-xs text-muted-foreground'>Interface theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => theme === 'dark' && onTheme()}>
          Light <Check className={theme === 'light' ? 'ms-auto' : 'ms-auto invisible'} />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => theme === 'light' && onTheme()}>
          Dark <Check className={theme === 'dark' ? 'ms-auto' : 'ms-auto invisible'} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LanguageMenu() {
  const { language, setLanguage } = useConsoleLanguage()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='rounded-full' aria-label='Change interface language'>
          <Globe2 />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44'>
        <DropdownMenuLabel className='text-xs text-muted-foreground'>Interface language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {consoleLanguageOptions.map((option) => (
          <DropdownMenuItem key={option.value} onSelect={() => setLanguage(option.value)}>
            {option.label}
            <Check className={language === option.value ? 'ms-auto' : 'ms-auto invisible'} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConsoleHeader({ activeRoute, theme, onTheme, onNavigate }: Omit<ConsoleShellProps, 'children'>) {
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
    <header className='sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex h-full items-center gap-3 p-4 sm:gap-4'>
        <SidebarTrigger ref={triggerRef} variant='outline' className='max-md:scale-110 md:hidden' data-console-sidebar-trigger />
        <Separator orientation='vertical' className='h-6 md:hidden' />
        <div className='min-w-0 truncate text-sm max-[340px]:hidden'>
          <span className='hidden text-muted-foreground sm:inline'>{routeSections[activeRoute]} / </span>
          <span className='font-medium'>{routeLabels[activeRoute]}</span>
        </div>
        <div className='ms-auto flex items-center gap-1'>
          <Button variant='ghost' size='icon' className='rounded-full' aria-label='Notifications' title='Notifications' onClick={() => onNavigate('notices')}>
            <Bell />
          </Button>
          <Button variant='ghost' size='icon' className='rounded-full' aria-label='Documentation' title='Documentation' onClick={() => onNavigate('docs')}>
            <BookOpen />
          </Button>
          <LanguageMenu />
          <ThemeMenu theme={theme} onTheme={onTheme} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='rounded-full' aria-label='Account menu'>
                <CircleUserRound />
              </Button>
            </DropdownMenuTrigger>
            <AccountMenuContent onSelectRoute={onNavigate} />
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export function ConsoleShell({ activeRoute, theme, onTheme, onNavigate, children }: ConsoleShellProps) {
  const { language } = useConsoleLanguage()

  useEffect(() => {
    const body = document.body
    body.classList.add('shadcn-admin-portal', theme)
    return () => body.classList.remove('shadcn-admin-portal', 'light', 'dark')
  }, [theme])

  return (
    <div className={`shadcn-admin ${theme === 'dark' ? 'dark' : 'light'}`} lang={language}>
      <SidebarProvider defaultOpen>
        <Sidebar variant='inset' collapsible='icon'>
          <SidebarHeader><BrandMenu /></SidebarHeader>
          <SidebarContent><ConsoleNavigation activeRoute={activeRoute} onNavigate={onNavigate} /></SidebarContent>
          <SidebarFooter><UserMenu onNavigate={onNavigate} /></SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <div className='@container/content relative flex min-w-0 w-full flex-1 flex-col bg-background'>
          <ConsoleHeader activeRoute={activeRoute} theme={theme} onTheme={onTheme} onNavigate={onNavigate} />
          <main className='w-full px-4 py-6 sm:px-6'>
            <div className='mx-auto w-full max-w-7xl space-y-6'>{children}</div>
          </main>
        </div>
      </SidebarProvider>
      <Toaster theme={theme} position='bottom-right' richColors closeButton />
    </div>
  )
}
