import {
  BadgeCheck,
  Bell,
  Blocks,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CircleUserRound,
  Component,
  Copy,
  ExternalLink,
  FileSliders,
  FormInput,
  LayoutGrid,
  LoaderCircle,
  LogOut,
  Menu,
  Moon,
  Palette,
  PanelRightOpen,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  Trash2,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar,
} from '@partokens/design-system/components'

type Theme = 'light' | 'dark'
type SectionId = 'foundations' | 'buttons' | 'forms' | 'selection' | 'overlays'

type ShadcnSystemScreenProps = {
  theme: Theme
  onTheme: () => void
  onExit: () => void
}

const sections: { id: SectionId; label: string; icon: typeof Palette }[] = [
  { id: 'foundations', label: 'Foundations', icon: Palette },
  { id: 'buttons', label: 'Buttons', icon: Component },
  { id: 'forms', label: 'Form controls', icon: FormInput },
  { id: 'selection', label: 'Selection', icon: FileSliders },
  { id: 'overlays', label: 'Overlays', icon: Blocks },
]

function BrandMenu() {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size='lg' className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <LayoutGrid className='size-4' />
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>Partokens</span>
                <span className='truncate text-xs'>Component lab</span>
              </div>
              <ChevronsUpDown className='ms-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg' align='start' side={isMobile ? 'bottom' : 'right'} sideOffset={4}>
            <DropdownMenuLabel className='text-xs text-muted-foreground'>Workspace</DropdownMenuLabel>
            <DropdownMenuItem className='gap-2 p-2'>
              <div className='flex size-6 items-center justify-center rounded-sm border'><LayoutGrid className='size-4' /></div>
              Component lab
              <DropdownMenuShortcut>⌘1</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className='gap-2 p-2'>API key management</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function UserMenu() {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size='lg' className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
              <div className='flex size-8 items-center justify-center rounded-lg bg-muted text-sm font-medium'>PT</div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>Design review</span>
                <span className='truncate text-xs'>shadcn-admin 2.2.1</span>
              </div>
              <ChevronsUpDown className='ms-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg' side={isMobile ? 'bottom' : 'right'} align='end' sideOffset={4}>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col gap-1'><p className='text-sm font-medium'>Design review</p><p className='text-xs text-muted-foreground'>System acceptance</p></div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem><BadgeCheck />UI baseline</DropdownMenuItem>
              <DropdownMenuItem><Bell />Notifications</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive'><LogOut />Leave workspace</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function CatalogMenu({ activeSection, onNavigate }: { activeSection: SectionId; onNavigate: (id: SectionId) => void }) {
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarMenu>
      {sections.map(({ id, label, icon: Icon }) => (
        <SidebarMenuItem key={id}>
          <SidebarMenuButton
            isActive={activeSection === id}
            tooltip={label}
            onClick={() => {
              onNavigate(id)
              setOpenMobile(false)
            }}
          >
            <Icon /><span>{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

function CatalogSearch({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='group relative hidden h-8 w-40 justify-start bg-muted/25 text-sm font-normal text-muted-foreground shadow-none hover:bg-accent sm:flex lg:w-64'>
          <Search className='absolute start-2' /><span className='ms-4'>Search components</span><kbd className='pointer-events-none absolute end-1.5 hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-2xs font-medium lg:flex'>⌘ K</kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className='gap-0 overflow-hidden p-0 sm:max-w-lg'>
        <DialogHeader className='sr-only'><DialogTitle>Search components</DialogTitle><DialogDescription>Jump to a component group.</DialogDescription></DialogHeader>
        <div className='flex items-center border-b px-3'><Search className='size-4 text-muted-foreground' /><Input autoFocus placeholder='Search components...' className='h-12 border-0 bg-transparent shadow-none focus-visible:ring-0' /></div>
        <div className='grid gap-1 p-2'>
          <p className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>Component catalog</p>
          {sections.map(({ id, label, icon: Icon }) => <DialogClose asChild key={id}><Button variant='ghost' className='justify-start' onClick={() => onNavigate(id)}><Icon />{label}</Button></DialogClose>)}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ThemeMenu({ theme, onTheme }: { theme: Theme; onTheme: () => void }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative rounded-full' aria-label='切换主题'>
          <Sun className='size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
          <Moon className='absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => theme === 'dark' && onTheme()}>Light <Check className={theme === 'light' ? 'ms-auto' : 'ms-auto invisible'} /></DropdownMenuItem>
        <DropdownMenuItem onClick={() => theme === 'light' && onTheme()}>Dark <Check className={theme === 'dark' ? 'ms-auto' : 'ms-auto invisible'} /></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Specimen({ title, description, children, className = '' }: { title: string; description: string; children: ReactNode; className?: string }) {
  return (
    <Card className={`gap-5 py-5 ${className}`}>
      <CardHeader className='gap-1 px-5'>
        <CardTitle className='text-base'>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='px-5'>{children}</CardContent>
    </Card>
  )
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className='space-y-1'><h2 className='text-lg font-semibold'>{title}</h2><p className='text-sm text-muted-foreground'>{description}</p></div>
}

function FormField({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return <div className='grid gap-2'><Label htmlFor={htmlFor}>{label}</Label>{children}{hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}</div>
}

export function ShadcnSystemScreen({ theme, onTheme, onExit }: ShadcnSystemScreenProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('foundations')

  useEffect(() => {
    const body = document.body
    body.classList.add('shadcn-admin-portal', theme)
    return () => body.classList.remove('shadcn-admin-portal', 'light', 'dark')
  }, [theme])

  useEffect(() => {
    const elements = sections.map(({ id }) => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element))
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (current) setActiveSection(current.target.id as SectionId)
    }, { rootMargin: '-20% 0px -65% 0px' })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  const navigateTo = (id: SectionId) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`shadcn-admin ${theme === 'dark' ? 'dark' : 'light'}`} lang='zh-CN'>
      <SidebarProvider defaultOpen>
        <Sidebar variant='inset' collapsible='icon'>
          <SidebarHeader><BrandMenu /></SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Component catalog</SidebarGroupLabel>
              <SidebarGroupContent>
                <CatalogMenu activeSection={activeSection} onNavigate={navigateTo} />
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Next validation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu><SidebarMenuItem><SidebarMenuButton disabled tooltip='API keys'><ShieldCheck /><span>API keys</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter><UserMenu /></SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className='@container/content min-w-0'>
          <header className='sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='flex h-full items-center gap-3 p-4 sm:gap-4'>
              <SidebarTrigger variant='outline' className='max-md:scale-110' />
              <Separator orientation='vertical' className='h-6' />
              <CatalogSearch onNavigate={navigateTo} />
              <div className='ms-auto flex items-center gap-1'>
                <ThemeMenu theme={theme} onTheme={onTheme} />
                <Tooltip><TooltipTrigger asChild><Button variant='ghost' size='icon' className='rounded-full' aria-label='返回原型' onClick={onExit}><ExternalLink /></Button></TooltipTrigger><TooltipContent>返回原型</TooltipContent></Tooltip>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant='ghost' size='icon' className='rounded-full' aria-label='账户'><CircleUserRound /></Button></DropdownMenuTrigger><DropdownMenuContent align='end' className='w-48'><DropdownMenuLabel>Design review</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem><BadgeCheck />UI baseline</DropdownMenuItem><DropdownMenuItem><Bell />Notifications</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
              </div>
            </div>
          </header>

          <main className='w-full px-4 py-6 sm:px-6'>
            <div className='mx-auto w-full max-w-7xl space-y-10'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div><h1 className='text-2xl font-bold tracking-tight'>Components</h1><p className='text-muted-foreground'>shadcn-admin UI acceptance catalog</p></div>
                <div className='flex items-center gap-2'><Badge variant='outline'>New York</Badge><Badge variant='secondary'>Tailwind 4</Badge><Badge>v2.2.1</Badge></div>
              </div>

              <section id='foundations' className='scroll-mt-24 space-y-4'>
                <SectionHeading title='Foundations' description='Upstream semantic colors, type scale, radius, and elevation.' />
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Specimen title='Semantic color' description='The original shadcn-admin light and dark token set.'>
                    <div className='grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4'>
                      {[['Background', 'bg-background'], ['Foreground', 'bg-foreground'], ['Primary', 'bg-primary'], ['Secondary', 'bg-secondary'], ['Muted', 'bg-muted'], ['Accent', 'bg-accent'], ['Border', 'bg-border'], ['Destructive', 'bg-destructive']].map(([label, color]) => <div className='space-y-2' key={label}><div className={`h-12 rounded-md border ${color}`} /><span className='text-xs text-muted-foreground'>{label}</span></div>)}
                    </div>
                  </Specimen>
                  <Specimen title='Typography & shape' description='Inter, Manrope, and the upstream 10px base radius.'>
                    <div className='space-y-5'><div><p className='font-manrope text-2xl font-bold'>Dashboard heading</p><p className='mt-1 text-sm text-muted-foreground'>Interface copy uses Inter with a compact 14px default.</p></div><Separator /><div className='flex items-end gap-3'>{[['rounded-sm', 'size-10'], ['rounded-md', 'size-12'], ['rounded-lg', 'size-14'], ['rounded-xl', 'size-16']].map(([radius, size], index) => <div key={radius} className={`grid place-items-center border bg-muted ${radius} ${size}`}><span className='text-2xs'>{index + 1}</span></div>)}</div></div>
                  </Specimen>
                </div>
              </section>

              <section id='buttons' className='scroll-mt-24 space-y-4'>
                <SectionHeading title='Buttons' description='Native shadcn-admin variants and 32 / 36 / 40px control heights.' />
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Specimen title='Hierarchy' description='Default, secondary, outline, ghost, link, and destructive.'>
                    <div className='flex flex-wrap gap-2'><Button>Default</Button><Button variant='secondary'>Secondary</Button><Button variant='outline'>Outline</Button><Button variant='ghost'>Ghost</Button><Button variant='link'>Link</Button><Button variant='destructive'>Delete</Button></div>
                  </Specimen>
                  <Specimen title='Size & state' description='Real hover, focus-visible, disabled, loading, and icon states.'>
                    <div className='flex flex-wrap items-center gap-2'><Button size='sm'>Small</Button><Button>Default</Button><Button size='lg'>Large</Button><Button disabled>Disabled</Button><Button variant='outline' disabled><LoaderCircle className='animate-spin' />Loading</Button><Tooltip><TooltipTrigger asChild><Button variant='outline' size='icon'><Copy /></Button></TooltipTrigger><TooltipContent>Copy</TooltipContent></Tooltip></div>
                  </Specimen>
                </div>
              </section>

              <section id='forms' className='scroll-mt-24 space-y-4'>
                <SectionHeading title='Form controls' description='Input, textarea, select, validation, and disabled states.' />
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Specimen title='Input' description='A simple field surface with one shared focus treatment.'>
                    <div className='grid gap-5'>
                      <FormField label='Key name' htmlFor='key-name'><Input id='key-name' defaultValue='Production key' /></FormField>
                      <FormField label='Endpoint' htmlFor='endpoint' hint='Requests use the OpenAI-compatible base URL.'><Input id='endpoint' defaultValue='https://api.partokens.com/v1' /></FormField>
                      <FormField label='Error state' htmlFor='error-input'><Input id='error-input' aria-invalid defaultValue='Invalid value' /></FormField>
                      <FormField label='Disabled' htmlFor='disabled-input'><Input id='disabled-input' disabled defaultValue='Managed by workspace' /></FormField>
                    </div>
                  </Specimen>
                  <Specimen title='Select & textarea' description='Radix Select replaces the browser-native dropdown.'>
                    <div className='grid gap-5'>
                      <FormField label='Model access' htmlFor='model-access'>
                        <Select defaultValue='restricted'><SelectTrigger id='model-access' className='w-full'><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectLabel>Permissions</SelectLabel><SelectItem value='restricted'>Selected models</SelectItem><SelectItem value='all'>All available models</SelectItem><SelectSeparator /><SelectItem value='none' disabled>No access</SelectItem></SelectGroup></SelectContent></Select>
                      </FormField>
                      <FormField label='Description' htmlFor='description'><Textarea id='description' placeholder='What will this key be used for?' /></FormField>
                      <Select disabled><SelectTrigger className='w-full'><SelectValue placeholder='Disabled select' /></SelectTrigger><SelectContent><SelectItem value='none'>No access</SelectItem></SelectContent></Select>
                    </div>
                  </Specimen>
                </div>
              </section>

              <section id='selection' className='scroll-mt-24 space-y-4'>
                <SectionHeading title='Selection' description='Checkbox, switch, tabs, and business status.' />
                <div className='grid gap-4 lg:grid-cols-2'>
                  <Specimen title='Checkbox & switch' description='Compact controls with labels outside the primitive.'>
                    <div className='grid gap-5'><label className='flex items-center gap-3 text-sm'><Checkbox defaultChecked />Allow streaming responses</label><label className='flex items-center gap-3 text-sm'><Checkbox />Restrict by IP address</label><label className='flex items-center gap-3 text-sm text-muted-foreground'><Checkbox disabled />Managed by organization</label><Separator /><div className='flex items-center justify-between gap-4'><Label htmlFor='audit-switch'>Request audit log</Label><Switch id='audit-switch' defaultChecked /></div><div className='flex items-center justify-between gap-4'><Label htmlFor='alert-switch'>Usage alerts</Label><Switch id='alert-switch' /></div></div>
                  </Specimen>
                  <Specimen title='Tabs & status' description='Keyboard navigation and semantic status badges.'>
                    <Tabs defaultValue='overview'><TabsList><TabsTrigger value='overview'>Overview</TabsTrigger><TabsTrigger value='limits'>Limits</TabsTrigger><TabsTrigger value='logs'>Logs</TabsTrigger></TabsList><TabsContent value='overview' className='pt-3'><div className='flex flex-wrap gap-2'><Badge>Active</Badge><Badge variant='secondary'>Processing</Badge><Badge variant='outline'>Draft</Badge><Badge variant='destructive'>Failed</Badge></div></TabsContent><TabsContent value='limits' className='pt-3 text-sm text-muted-foreground'>Monthly limit: $100.00</TabsContent><TabsContent value='logs' className='pt-3 text-sm text-muted-foreground'>No recent errors.</TabsContent></Tabs>
                  </Specimen>
                </div>
              </section>

              <section id='overlays' className='scroll-mt-24 space-y-4 pb-8'>
                <SectionHeading title='Overlays' description='Dropdown menu, dialog, sheet, tooltip, and Sonner toast.' />
                <Specimen title='Overlay triggers' description='Portal placement, Escape handling, focus trap, and focus return.'>
                  <div className='flex flex-wrap gap-2'>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant='outline'><Settings2 />Actions<ChevronDown /></Button></DropdownMenuTrigger><DropdownMenuContent align='start'><DropdownMenuLabel>API key</DropdownMenuLabel><DropdownMenuGroup><DropdownMenuItem onSelect={() => toast.success('Key name copied')}><Copy />Copy name</DropdownMenuItem><DropdownMenuItem><ShieldCheck />View permissions</DropdownMenuItem></DropdownMenuGroup><DropdownMenuSeparator /><DropdownMenuItem variant='destructive'><Trash2 />Delete key</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                    <Dialog><DialogTrigger asChild><Button variant='destructive'><Trash2 />Delete key</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Delete this API key?</DialogTitle><DialogDescription>Requests using this key will fail immediately. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant='outline'>Cancel</Button></DialogClose><DialogClose asChild><Button variant='destructive' onClick={() => toast.success('API key deleted')}>Delete</Button></DialogClose></DialogFooter></DialogContent></Dialog>
                    <Sheet><SheetTrigger asChild><Button variant='outline'><PanelRightOpen />Request details</Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>Request details</SheetTitle><SheetDescription>req_7D4A</SheetDescription></SheetHeader><div className='grid gap-4 px-4 text-sm'><div className='grid grid-cols-2 gap-2 border-b pb-3'><span className='text-muted-foreground'>Model</span><span className='text-end'>gpt-4.1-mini</span></div><div className='grid grid-cols-2 gap-2 border-b pb-3'><span className='text-muted-foreground'>Latency</span><span className='text-end'>842 ms</span></div><div className='grid grid-cols-2 gap-2'><span className='text-muted-foreground'>Status</span><span className='text-end'>Success</span></div></div><SheetFooter><SheetClose asChild><Button variant='outline'>Close</Button></SheetClose></SheetFooter></SheetContent></Sheet>
                    <Button onClick={() => toast.success('Settings saved', { description: 'New permissions apply to the next request.', duration: Infinity })}>Show toast</Button>
                  </div>
                </Specimen>
              </section>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster theme={theme} position='bottom-right' richColors closeButton />
    </div>
  )
}
