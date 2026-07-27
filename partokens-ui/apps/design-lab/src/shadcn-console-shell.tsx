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
  Moon,
  ReceiptText,
  ShieldCheck,
  Sun,
  WalletCards,
} from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

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

export type Theme = 'light' | 'dark'
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

export type ConsoleScreenProps = {
  theme: Theme
  onTheme: () => void
  onNavigate: (target: ConsoleRoute | 'system') => void
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
    label: 'General',
    items: [
      { label: 'Overview', target: 'console', icon: LayoutDashboard },
      { label: 'Analytics', target: 'console-analytics', icon: BarChart3 },
      { label: 'API keys', target: 'console-keys', icon: KeyRound },
      { label: 'Usage logs', target: 'console-logs', icon: ReceiptText },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Playground', target: 'console-playground', icon: MessageSquare },
      { label: 'Image studio', target: 'console-studio', icon: ImageIcon },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Wallet', target: 'console-wallet', icon: WalletCards },
      { label: 'Profile', target: 'console-profile', icon: CircleUserRound },
      { label: 'Security', target: 'console-security', icon: ShieldCheck },
      { label: 'Connections', target: 'console-connections', icon: Link2 },
      { label: 'Notifications', target: 'console-notifications', icon: Bell },
    ],
  },
]

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

  return (target: ConsoleRoute | 'system') => {
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

function BrandMenu({ onNavigate }: Pick<ConsoleScreenProps, 'onNavigate'>) {
  const { isMobile } = useSidebar()
  const navigate = useConsoleNavigation(onNavigate)
  const selectRoute = (target: ConsoleRoute | 'system') => {
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
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <KeyRound className='size-4' />
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>Partokens</span>
                <span className='truncate text-xs'>Developer console</span>
              </div>
              <ChevronsUpDown className='ms-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-xs text-muted-foreground'>Workspace</DropdownMenuLabel>
            <DropdownMenuItem className='gap-2 p-2' onSelect={() => selectRoute('console')}>
              <div className='flex size-6 items-center justify-center rounded-sm border'>
                <LayoutDashboard className='size-4' />
              </div>
              Developer console
              <Check className='ms-auto size-4' />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-2 p-2' onSelect={() => selectRoute('system')}>
              <div className='flex size-6 items-center justify-center rounded-sm border'>
                <BadgeCheck className='size-4' />
              </div>
              Component lab
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
              <ChevronsUpDown className='ms-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
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
              <DropdownMenuItem onSelect={() => selectRoute('console-profile')}>
                <CircleUserRound />Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => selectRoute('console-notifications')}>
                <Bell />Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem><LogOut />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
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
      <DropdownMenuContent align='end'>
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
        <SidebarTrigger ref={triggerRef} variant='outline' className='max-md:scale-110' data-console-sidebar-trigger />
        <Separator orientation='vertical' className='h-6' />
        <div className='min-w-0 text-sm'>
          <span className='hidden text-muted-foreground sm:inline'>Console / </span>
          <span className='font-medium'>{routeLabels[activeRoute]}</span>
        </div>
        <div className='ms-auto flex items-center gap-1'>
          <ThemeMenu theme={theme} onTheme={onTheme} />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='rounded-full' aria-label='Account menu'>
                <CircleUserRound />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuLabel>Mika Chen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onNavigate('console-profile')}><CircleUserRound />Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onNavigate('console-notifications')}><Bell />Notifications</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export function ConsoleShell({ activeRoute, theme, onTheme, onNavigate, children }: ConsoleShellProps) {
  useEffect(() => {
    const body = document.body
    body.classList.add('shadcn-admin-portal', theme)
    return () => body.classList.remove('shadcn-admin-portal', 'light', 'dark')
  }, [theme])

  return (
    <div className={`shadcn-admin ${theme === 'dark' ? 'dark' : 'light'}`} lang='en'>
      <SidebarProvider defaultOpen>
        <Sidebar variant='inset' collapsible='icon'>
          <SidebarHeader><BrandMenu onNavigate={onNavigate} /></SidebarHeader>
          <SidebarContent><ConsoleNavigation activeRoute={activeRoute} onNavigate={onNavigate} /></SidebarContent>
          <SidebarFooter><UserMenu onNavigate={onNavigate} /></SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className='@container/content min-w-0'>
          <ConsoleHeader activeRoute={activeRoute} theme={theme} onTheme={onTheme} onNavigate={onNavigate} />
          <main className='w-full px-4 py-6 sm:px-6'>
            <div className='mx-auto w-full max-w-7xl space-y-6'>{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster theme={theme} position='bottom-right' richColors closeButton />
    </div>
  )
}
