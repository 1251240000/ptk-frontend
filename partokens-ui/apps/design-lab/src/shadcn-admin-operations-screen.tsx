import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  Copy,
  Ellipsis,
  Eye,
  FlaskConical,
  KeyRound,
  ListFilter,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
  useSidebar,
} from '@partokens/design-system/components'

import { ConsoleShell, type ConsoleRoute, type ConsoleScreenProps } from './shadcn-console-shell'

export type AdminOperationsRoute = Extract<
  ConsoleRoute,
  'console-admin-channels' | 'console-admin-routes' | 'console-admin-monitoring' | 'console-admin-changes'
>

type ChannelStatus = 'available' | 'partial' | 'disabled' | 'readonly'
type DetailTab = 'overview' | 'instances' | 'monitoring' | 'changes'
type ExecutionState = 'preview' | 'running' | 'partial' | 'success'

type LogicalChannel = {
  id: string
  name: string
  type: string
  host: string
  address: string
  costRatio?: number
  status: ChannelStatus
  groups: number
  layers: number
  records: number
  testedAt: string
  latency?: number
  attempts?: number
  successRate?: number
  fingerprint?: string
  readonly?: boolean
  note?: string
  models: string[]
}

type RouteLayer = {
  id: string
  label: string
  priority: number
  channels: Array<{ id: string; weight: number }>
}

const seedChannels: LogicalChannel[] = [
  { id: 'A', name: 'OpenAI A', type: 'OpenAI', host: 'api.openai.com', address: 'https://api.openai.com/v1', costRatio: 0.08, status: 'available', groups: 1, layers: 1, records: 2, testedAt: '今天 10:42', latency: 842, attempts: 12840, successRate: 98.7, fingerprint: 'sha256: 4a9c…e12f', models: ['gpt-4o', 'gpt-4.1', 'o3'] },
  { id: 'B', name: 'OpenAI B', type: 'OpenAI', host: 'api.openai.com', address: 'https://api.openai.com/v1', costRatio: 0.08, status: 'available', groups: 1, layers: 1, records: 2, testedAt: '今天 10:41', latency: 776, attempts: 10320, successRate: 99.1, fingerprint: 'sha256: 8f21…c047', models: ['gpt-4o', 'gpt-4.1', 'o3'] },
  { id: 'C', name: 'OpenAI C', type: 'OpenAI', host: 'api.openai.com', address: 'https://api.openai.com/v1', costRatio: 0.09, status: 'partial', groups: 2, layers: 2, records: 3, testedAt: '今天 09:18', latency: 1240, attempts: 3860, successRate: 96.2, fingerprint: 'sha256: 9dd0…a621', note: 'plus 重试层最近一次测试超时', models: ['gpt-4o'] },
  { id: 'D', name: 'OpenAI D', type: 'OpenAI', host: 'api.openai.com', address: 'https://api.openai.com/v1', costRatio: 0.12, status: 'available', groups: 1, layers: 1, records: 1, testedAt: '今天 10:02', latency: 932, attempts: 2120, successRate: 98.1, fingerprint: 'sha256: 0c4b…733a', models: ['gpt-4o', 'gpt-4.1'] },
  { id: 'E', name: 'OpenAI E', type: 'OpenAI', host: 'api.openai.com', address: 'https://api.openai.com/v1', costRatio: 0.16, status: 'disabled', groups: 0, layers: 0, records: 1, testedAt: '昨天 18:22', fingerprint: 'sha256: 1ac7…f90d', note: '管理员手动停用', models: ['gpt-4o', 'gpt-4.1'] },
  { id: 'legacy-1', name: 'GPT mirror / legacy', type: 'OpenAI', host: 'legacy.example.net', address: 'https://legacy.example.net/openai', status: 'readonly', groups: 0, layers: 0, records: 1, testedAt: '暂无数据', readonly: true, note: '缺少完整 Partokens 元数据，仅只读展示基本属性', models: [] },
]

const initialRoutes: Record<'plus' | 'pro', RouteLayer[]> = {
  plus: [
    { id: 'first', label: '初次尝试', priority: 1000, channels: [{ id: 'A', weight: 60 }, { id: 'B', weight: 40 }] },
    { id: 'retry-1', label: '第 1 次重试', priority: 900, channels: [{ id: 'C', weight: 100 }] },
  ],
  pro: [
    { id: 'first', label: '初次尝试', priority: 1000, channels: [{ id: 'C', weight: 100 }] },
    { id: 'retry-1', label: '第 1 次重试', priority: 900, channels: [{ id: 'D', weight: 100 }] },
  ],
}

function StatusBadge({ status }: { status: ChannelStatus }) {
  if (status === 'available') return <Badge variant='outline' className='border-success/30 bg-success/10 text-success'><CheckCircle2 />可用</Badge>
  if (status === 'partial') return <Badge variant='outline' className='border-warning/30 bg-warning/10 text-warning'><TriangleAlert />部分异常</Badge>
  if (status === 'disabled') return <Badge variant='secondary'><CircleDashed />已停用</Badge>
  return <Badge variant='outline' className='text-muted-foreground'><LockKeyhole />只读</Badge>
}

function IconButton({ label, icon: Icon, onClick, disabled }: { label: string; icon: LucideIcon; onClick?: () => void; disabled?: boolean }) {
  return <Tooltip><TooltipTrigger asChild><Button type='button' variant='ghost' size='icon' className='size-8' aria-label={label} disabled={disabled} onClick={onClick}><Icon /></Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

function RootBadge() {
  return <Badge variant='outline' className='gap-1.5 border-primary/30 bg-primary/5 text-primary'><ShieldCheck />仅 Root</Badge>
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'><div className='min-w-0'><div className='mb-2 flex flex-wrap items-center gap-2'><span className='font-mono text-[10px] font-semibold text-muted-foreground'>{eyebrow}</span><RootBadge /></div><h1 className='text-2xl font-bold tracking-tight'>{title}</h1><p className='mt-1 max-w-3xl text-sm text-muted-foreground'>{description}</p></div>{action ? <div className='shrink-0'>{action}</div> : null}</div>
}

function MetricBelt({ items }: { items: Array<{ label: string; value: string; detail: string; tone?: 'success' | 'warning' }> }) {
  return <dl className='grid overflow-hidden border-y bg-card sm:grid-cols-2 lg:grid-cols-5'>{items.map((item, index) => <div key={item.label} className={`min-h-24 border-b p-4 sm:border-e lg:border-b-0 ${index === items.length - 1 ? 'sm:border-e-0' : ''}`}><dt className='text-xs text-muted-foreground'>{item.label}</dt><dd className={`mt-1 font-mono text-xl font-semibold ${item.tone === 'success' ? 'text-success' : item.tone === 'warning' ? 'text-warning' : ''}`}>{item.value}</dd><p className='mt-1 text-xs text-muted-foreground'>{item.detail}</p></div>)}</dl>
}

function SheetFrame({ open, onOpenChange, title, description, children, footer, width = 'sm:max-w-xl' }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode; footer?: ReactNode; width?: string }) {
  const { isMobile } = useSidebar()
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side={isMobile ? 'bottom' : 'right'} className={isMobile ? 'max-h-[92svh] w-full' : `w-full ${width}`}><SheetHeader className='border-b'><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader><div className='min-h-0 flex-1 overflow-y-auto px-4 py-2'>{children}</div>{footer ? <SheetFooter className='border-t sm:flex-row sm:justify-end'>{footer}</SheetFooter> : null}</SheetContent></Sheet>
}

function ChannelDetails({ channel, open, onOpenChange, onEdit, onCopy, onTest }: { channel: LogicalChannel | null; open: boolean; onOpenChange: (open: boolean) => void; onEdit: () => void; onCopy: () => void; onTest: () => void }) {
  const [tab, setTab] = useState<DetailTab>('overview')
  useEffect(() => { if (open) setTab('overview') }, [open, channel?.id])
  if (!channel) return null

  if (channel.readonly) {
    return <SheetFrame open={open} onOpenChange={onOpenChange} title={channel.name} description='非标准物理渠道 · 仅展示基本属性'><div className='space-y-5 py-2'><div className='flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm'><LockKeyhole className='mt-0.5 size-4 shrink-0 text-warning' /><p>缺少完整 Partokens 元数据，不允许编辑、测试、启停或绑定。页面上线后应使用新功能重建。</p></div><dl className='divide-y border-y text-sm'>{[['物理 ID', 'new-api #918'], ['渠道类型', channel.type], ['API 地址', channel.address], ['最近测试', channel.testedAt], ['只读原因', channel.note ?? '元数据不完整']].map(([label, value]) => <div key={label} className='grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3'><dt className='text-muted-foreground'>{label}</dt><dd className='min-w-0 break-all font-medium'>{value}</dd></div>)}</dl></div></SheetFrame>
  }

  return <SheetFrame open={open} onOpenChange={onOpenChange} title={`${channel.id} · ${channel.name}`} description={`${channel.type} · ${channel.address}`} footer={<><Button variant='outline' onClick={onCopy}><Copy />复制渠道</Button><Button variant='outline' onClick={onTest}><FlaskConical />测试连接</Button><Button onClick={onEdit}><Pencil />编辑渠道</Button></>}>
    <Tabs value={tab} onValueChange={(value) => setTab(value as DetailTab)} className='py-2'>
      <TabsList className='grid w-full grid-cols-4'><TabsTrigger value='overview'>概览</TabsTrigger><TabsTrigger value='instances'>路由实例</TabsTrigger><TabsTrigger value='monitoring'>监控</TabsTrigger><TabsTrigger value='changes'>变更</TabsTrigger></TabsList>
      <TabsContent value='overview' className='space-y-5 pt-3'>
        <section><h3 className='text-sm font-semibold'>身份与凭据</h3><dl className='mt-3 divide-y border-y text-sm'><div className='grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3'><dt className='text-muted-foreground'>逻辑 ID</dt><dd className='flex min-w-0 items-center gap-2'><code className='truncate'>lc_pt_{channel.id.toLowerCase()}_01k8</code><IconButton label='复制逻辑 ID' icon={Copy} /></dd></div><div className='grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3'><dt className='text-muted-foreground'>API 密钥</dt><dd className='flex items-center gap-2'><span className='font-mono'>••••••••••••••••</span><Badge variant='secondary'>已登记</Badge></dd></div><div className='grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3'><dt className='text-muted-foreground'>密钥指纹</dt><dd><code>{channel.fingerprint}</code></dd></div></dl><p className='mt-3 flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground'><LockKeyhole className='mt-0.5 size-3.5 shrink-0 text-primary' />明文密钥不持久化、不写入日志，也不会出现在截图中。</p></section>
        <section><h3 className='text-sm font-semibold'>管理元数据</h3><dl className='mt-3 divide-y border-y text-sm'><div className='grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3'><dt className='text-muted-foreground'>成本倍率</dt><dd><span className='font-mono font-semibold'>{channel.costRatio?.toFixed(2)}x</span><span className='ms-2 text-xs text-muted-foreground'>仅展示参考</span></dd></div><div className='grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3'><dt className='text-muted-foreground'>模型范围</dt><dd>{channel.models.join('、')}</dd></div><div className='grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3'><dt className='text-muted-foreground'>备注</dt><dd>{channel.note ?? '主用 OpenAI 兼容入口'}</dd></div></dl></section>
      </TabsContent>
      <TabsContent value='instances' className='pt-3'><div className='divide-y border-y'>{Array.from({ length: channel.records }, (_, index) => <div key={index} className='grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto]'><div><div className='flex items-center gap-2'><span className={`size-2 rounded-full ${index === channel.records - 1 && channel.status === 'partial' ? 'bg-warning' : 'bg-success'}`} /><strong>{index === 0 ? 'plus · 初次尝试' : index === 1 ? 'plus · 第 1 次重试' : 'pro · 初次尝试'}</strong></div><code className='mt-1 block text-xs text-muted-foreground'>new-api #{1042 + index} · r7</code></div><span className='text-xs text-muted-foreground'>{index === channel.records - 1 && channel.status === 'partial' ? '自动禁用 · 测试超时' : '启用 · 最近同步 10:42'}</span></div>)}</div></TabsContent>
      <TabsContent value='monitoring' className='space-y-4 pt-3'><MetricBelt items={[{ label: '24h 尝试', value: channel.attempts?.toLocaleString() ?? '暂无数据', detail: '按底层记录聚合' }, { label: '尝试成功率', value: channel.successRate ? `${channel.successRate}%` : '暂无数据', detail: '消费 /（消费 + 错误）', tone: channel.successRate && channel.successRate < 98 ? 'warning' : 'success' }]} /><p className='text-xs text-muted-foreground'>该指标衡量渠道尝试，不等于用户请求最终成功率；日志条件不满足时显示“暂无数据”。</p></TabsContent>
      <TabsContent value='changes' className='pt-3'><div className='divide-y border-y text-sm'><div className='flex items-start gap-3 py-4'><CheckCircle2 className='mt-0.5 size-4 text-success' /><div><strong>路由修订 r7 已完成</strong><p className='mt-1 text-xs text-muted-foreground'>今天 09:14 · Root / Mika</p></div></div><div className='flex items-start gap-3 py-4'><RefreshCw className='mt-0.5 size-4 text-muted-foreground' /><div><strong>凭据模板已核对</strong><p className='mt-1 text-xs text-muted-foreground'>昨天 18:22 · 复制来源</p></div></div></div></TabsContent>
    </Tabs>
  </SheetFrame>
}

function ChannelForm({ channel, copyFrom, open, onOpenChange, onSave }: { channel: LogicalChannel | null; copyFrom?: LogicalChannel | null; open: boolean; onOpenChange: (open: boolean) => void; onSave: (channel: LogicalChannel) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('OpenAI')
  const [address, setAddress] = useState('https://api.openai.com/v1')
  const [ratio, setRatio] = useState('0.08')
  const [models, setModels] = useState('gpt-4o, gpt-4.1')
  const [credentialState, setCredentialState] = useState<'empty' | 'registered'>('empty')
  const [error, setError] = useState('')
  const source = copyFrom ?? channel
  const copying = Boolean(copyFrom)

  useEffect(() => {
    if (!open) return
    setName(copyFrom ? `${copyFrom.name} · 副本` : channel?.name ?? '')
    setType(source?.type ?? 'OpenAI')
    setAddress(source?.address ?? 'https://api.openai.com/v1')
    setRatio(source?.costRatio?.toString() ?? '0.08')
    setModels(source?.models.join(', ') ?? 'gpt-4o, gpt-4.1')
    setCredentialState(channel && !copying ? 'registered' : 'empty')
    setError('')
  }, [channel, copyFrom, copying, open, source])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) return setError('请填写渠道名称。')
    if (!address.startsWith('https://')) return setError('API 地址必须使用 https://。')
    if (credentialState !== 'registered') return setError('请先完成敏感凭据登记状态。')
    const nextModels = models.split(',').map((item) => item.trim()).filter(Boolean)
    if (!nextModels.length) return setError('至少填写一个模型。')
    let host = address
    try { host = new URL(address).host } catch { return setError('API 地址格式无效。') }
    onSave({ id: channel?.id ?? `copy-${Date.now()}`, name: name.trim(), type, address, host, costRatio: Number(ratio) || undefined, status: channel?.status ?? 'available', groups: channel?.groups ?? 0, layers: channel?.layers ?? 0, records: channel?.records ?? 1, testedAt: channel?.testedAt ?? '未测试', fingerprint: channel?.fingerprint ?? '将在安全保存后生成', models: nextModels })
  }

  return <SheetFrame open={open} onOpenChange={onOpenChange} title={channel ? `编辑 ${channel.name}` : copying ? '复制渠道' : '新建逻辑渠道'} description={copying ? '已复制非敏感配置；请完成新密钥的安全登记。副本会作为独立密钥变体保存。' : '只保存原型状态，不接生产 API。敏感凭据不会被记录。'} width='sm:max-w-2xl'>
    <form id='logical-channel-form' className='grid gap-5 py-2' onSubmit={submit}>
      <div className='grid gap-2'><Label htmlFor='channel-name'>显示名称</Label><Input id='channel-name' value={name} onChange={(event) => setName(event.target.value)} placeholder='例如 OpenAI A' /></div>
      <div className='grid gap-4 sm:grid-cols-2'><div className='grid gap-2'><Label htmlFor='channel-type'>渠道类型</Label><Select value={type} onValueChange={setType}><SelectTrigger id='channel-type' className='w-full'><SelectValue /></SelectTrigger><SelectContent><SelectItem value='OpenAI'>OpenAI</SelectItem><SelectItem value='Azure OpenAI'>Azure OpenAI</SelectItem><SelectItem value='Anthropic'>Anthropic</SelectItem></SelectContent></Select></div><div className='grid gap-2'><Label htmlFor='channel-ratio'>成本倍率</Label><Input id='channel-ratio' type='number' min='0' step='0.01' value={ratio} onChange={(event) => setRatio(event.target.value)} /><p className='text-xs text-muted-foreground'>仅展示参考，不参与计费或路由。</p></div></div>
      <div className='grid gap-2'><Label htmlFor='channel-address'>规范化 API 地址</Label><Input id='channel-address' value={address} onChange={(event) => setAddress(event.target.value)} /><p className='text-xs text-muted-foreground'>协议和主机名会标准化，路径不会擅自合并。</p></div>
      <div className='grid gap-2'><Label htmlFor='channel-models'>模型覆盖</Label><Input id='channel-models' value={models} onChange={(event) => setModels(event.target.value)} /><p className='text-xs text-muted-foreground'>使用英文逗号分隔，保存路由前会再次校验覆盖。</p></div>
      <fieldset className='grid gap-3 rounded-md border p-4'><legend className='px-1 text-sm font-semibold'>API 密钥</legend><div className='flex min-h-9 flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-3'><KeyRound className='size-4 text-muted-foreground' /><span className='font-mono text-sm'>{credentialState === 'registered' ? '••••••••••••••••' : '未登记'}</span><Badge variant={credentialState === 'registered' ? 'secondary' : 'outline'} className='ms-auto'>{credentialState === 'registered' ? '已登记' : '待登记'}</Badge></div><Button type='button' variant='outline' onClick={() => setCredentialState('registered')}><ShieldCheck />标记为已完成安全登记（原型）</Button><p className='text-xs text-muted-foreground'>原型不接收真实密钥。正式流程仅在当前内存中处理密钥，并由后端保存禁用凭据模板。</p></fieldset>
      {error ? <div role='alert' className='flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'><TriangleAlert className='mt-0.5 size-4 shrink-0' />{error}</div> : null}
      <div className='sticky bottom-0 -mx-4 mt-2 flex flex-col-reverse gap-2 border-t bg-background px-4 py-4 sm:flex-row sm:justify-end'><Button type='button' variant='outline' onClick={() => onOpenChange(false)}>取消</Button><Button type='submit'><Check />保存渠道</Button></div>
    </form>
  </SheetFrame>
}

function HealthDot({ status }: { status: ChannelStatus | 'healthy' | 'warning' | 'unknown' }) {
  const tone = status === 'healthy' || status === 'available' ? 'bg-success' : status === 'warning' || status === 'partial' ? 'bg-warning' : 'bg-muted-foreground/50'
  return <span className={`inline-block size-2 shrink-0 rounded-full ${tone}`} aria-hidden='true' />
}

function ExecutionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [state, setState] = useState<ExecutionState>('preview')
  const [step, setStep] = useState(0)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (open) {
      setState('preview')
      setStep(0)
      setRetrying(false)
    }
  }, [open])

  useEffect(() => {
    if (state !== 'running') return
    if (retrying) {
      const retryTimer = window.setTimeout(() => {
        setStep(3)
        setState('success')
      }, 900)
      return () => window.clearTimeout(retryTimer)
    }
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= 3) {
          window.clearInterval(timer)
          setState('partial')
          return 3
        }
        return current + 1
      })
    }, 650)
    return () => window.clearInterval(timer)
  }, [retrying, state])

  const statusLabel = state === 'preview' ? '待执行' : state === 'running' ? '执行中' : state === 'partial' ? '部分失败' : '已完成'
  const run = () => { setRetrying(false); setState('running') }
  const retry = () => { setRetrying(true); setState('running'); setStep(2) }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className='max-w-2xl'>
      <DialogHeader>
        <div className='flex items-center gap-2'><DialogTitle>保存路由变更</DialogTitle><Badge variant={state === 'partial' ? 'outline' : 'secondary'} className={state === 'partial' ? 'border-warning/30 text-warning' : ''}>{statusLabel}</Badge></div>
        <DialogDescription>底层渠道将按顺序执行，多 API 操作不保证原子性。不会修改官方 new-api 代码。</DialogDescription>
      </DialogHeader>
      <div className='space-y-4'>
        <div className='grid gap-3 border-y py-4 sm:grid-cols-2'>
          {[['new-api #1042', 'plus · 初次尝试 A 64%'], ['new-api #1043', 'plus · 初次尝试 B 36%'], ['new-api #1044', 'plus · 第 1 次重试 C 100%'], ['new-api #1062', 'pro · 第 1 次重试 D 100%']].map(([record, detail], index) => <div key={record} className='flex gap-3 text-sm'><span className='flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs'>{state === 'running' && index <= step ? <Check className='size-3.5 text-success' /> : index < step ? <Check className='size-3.5 text-success' /> : index === step && state === 'partial' ? <TriangleAlert className='size-3.5 text-warning' /> : index + 1}</span><div className='min-w-0'><strong className='block font-mono text-xs'>{record}</strong><span className='text-xs text-muted-foreground'>{detail}</span></div></div>)}
        </div>
        {state === 'partial' ? <div className='flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm'><TriangleAlert className='mt-0.5 size-4 shrink-0 text-warning' /><div><strong>第 4 步未完成</strong><p className='mt-1 text-xs text-muted-foreground'>plus 的底层记录已更新，pro 的重试层响应超时。可以继续执行或先重新核对差异。</p></div></div> : null}
        {state === 'success' ? <div className='flex items-start gap-2 rounded-md border border-success/30 bg-success/5 p-3 text-sm'><CheckCircle2 className='mt-0.5 size-4 shrink-0 text-success' /><div><strong>全部步骤已完成</strong><p className='mt-1 text-xs text-muted-foreground'>逻辑路由已与 3 条底层记录重新核对。</p></div></div> : null}
        <dl className='grid gap-3 text-sm sm:grid-cols-3'><div><dt className='text-xs text-muted-foreground'>将更新</dt><dd className='mt-1 font-mono'>4 条记录</dd></div><div><dt className='text-xs text-muted-foreground'>操作者</dt><dd className='mt-1'>Root / Mika Chen</dd></div><div><dt className='text-xs text-muted-foreground'>修订号</dt><dd className='mt-1 font-mono'>r8</dd></div></dl>
      </div>
      <DialogFooter className='flex-col-reverse gap-2 sm:flex-row sm:justify-between'>
        <Button variant='outline' onClick={() => onOpenChange(false)}>关闭</Button>
        <div className='flex flex-col gap-2 sm:flex-row'>{state === 'partial' ? <><Button variant='outline' onClick={() => toast.info('已生成重新核对任务') }><RefreshCw />重新核对</Button><Button onClick={retry}><ArrowRight />继续执行</Button></> : state === 'success' ? <Button onClick={() => onOpenChange(false)}><Check />完成</Button> : <Button onClick={run} disabled={state === 'running'}>{state === 'running' ? <><LoaderCircle className='animate-spin' />执行中</> : <><ArrowRight />开始执行</>}</Button>}</div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

function ChannelsView({ channels, onOpenDetails, onEdit, onCopy, onCreate }: { channels: LogicalChannel[]; onOpenDetails: (channel: LogicalChannel) => void; onEdit: (channel: LogicalChannel) => void; onCopy: (channel: LogicalChannel) => void; onCreate: () => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | ChannelStatus>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [standardFilter, setStandardFilter] = useState<'all' | 'standard' | 'readonly'>('all')
  const visible = useMemo(() => channels.filter((channel) => {
    const text = `${channel.id} ${channel.name} ${channel.address} ${channel.type}`.toLowerCase()
    const standardMatches = standardFilter === 'all' || (standardFilter === 'readonly' ? channel.readonly : !channel.readonly)
    return (filter === 'all' || channel.status === filter) && (typeFilter === 'all' || channel.type === typeFilter) && standardMatches && text.includes(query.trim().toLowerCase())
  }), [channels, filter, query, standardFilter, typeFilter])
  const upstreamGroups = useMemo(() => {
    const grouped = new Map<string, LogicalChannel[]>()
    visible.forEach((channel) => grouped.set(channel.address, [...(grouped.get(channel.address) ?? []), channel]))
    return [...grouped.entries()].map(([address, items]) => ({ address, items }))
  }, [visible])
  return <div className='space-y-6'>
    <PageHeading eyebrow='ADMIN / CHANNELS' title='渠道' description='按上游地址归组查看，每个密钥仍作为独立渠道维护倍率、类型、模型和路由。只有 Root 可以操作，API 密钥始终保持遮罩。' action={<Button onClick={onCreate}><Plus />新建逻辑渠道</Button>} />
    <MetricBelt items={[{ label: '上游地址', value: `${new Set(channels.map((item) => item.address)).size}`, detail: '按规范化地址归组' }, { label: '密钥变体', value: `${channels.filter((item) => !item.readonly).length}`, detail: '每个变体独立路由' }, { label: '可用', value: `${channels.filter((item) => item.status === 'available').length}`, detail: '可用于绑定', tone: 'success' }, { label: '部分异常', value: `${channels.filter((item) => item.status === 'partial').length}`, detail: '需要关注', tone: 'warning' }, { label: '密钥暴露', value: '0', detail: '原型不采集明文' }]} />
    <section className='overflow-hidden border bg-card'>
      <div className='grid gap-3 border-b p-4 lg:grid-cols-[minmax(16rem,1fr)_auto_auto_auto] lg:items-center'><div className='relative min-w-0'><Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='搜索名称、地址或逻辑 ID' className='ps-9' aria-label='搜索渠道' /></div><label className='flex min-w-0 items-center gap-2'><ListFilter className='size-4 shrink-0 text-muted-foreground' /><span className='sr-only'>状态</span><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label='筛选渠道状态' className='h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm'><option value='all'>全部状态</option><option value='available'>可用</option><option value='partial'>部分异常</option><option value='disabled'>已停用</option><option value='readonly'>只读</option></select></label><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label='筛选渠道类型' className='h-9 min-w-0 rounded-md border bg-background px-3 text-sm'><option value='all'>全部类型</option><option value='OpenAI'>OpenAI</option><option value='Azure OpenAI'>Azure OpenAI</option><option value='Anthropic'>Anthropic</option></select><select value={standardFilter} onChange={(event) => setStandardFilter(event.target.value as typeof standardFilter)} aria-label='筛选标准状态' className='h-9 min-w-0 rounded-md border bg-background px-3 text-sm'><option value='all'>全部记录</option><option value='standard'>标准逻辑渠道</option><option value='readonly'>非标准只读</option></select></div>
      <div className='border-b bg-muted/10 p-4'><div className='mb-3 flex flex-wrap items-baseline justify-between gap-2'><div><h2 className='text-sm font-semibold'>按上游地址查看</h2><p className='mt-1 text-xs text-muted-foreground'>地址相同只在界面归组；每个密钥仍是独立路由变体。</p></div><span className='font-mono text-xs text-muted-foreground'>{upstreamGroups.length} 个上游 · {visible.filter((item) => !item.readonly).length} 个密钥</span></div><div className='divide-y border-y'>{upstreamGroups.map((group) => <details key={group.address} open><summary className='flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-3 text-sm'><ChevronRight className='size-4 transition-transform [details[open]>&]:rotate-90' /><code className='min-w-0 flex-1 truncate'>{group.address}</code><Badge variant='secondary'>{group.items.length} 个密钥</Badge></summary><div className='divide-y border-t'>{group.items.map((channel) => <div key={channel.id} className='flex flex-wrap items-center gap-3 px-3 py-3 ps-10'><HealthDot status={channel.status} /><div className='min-w-0 flex-1'><button type='button' className='truncate text-start text-sm font-medium hover:underline' onClick={() => onOpenDetails(channel)}>{channel.name}</button><p className='mt-1 text-xs text-muted-foreground'>{channel.type} · {channel.models.length} 个模型 · 成本倍率 {channel.costRatio ? `${channel.costRatio.toFixed(2)}x` : '未登记'}</p></div><Button variant='outline' size='sm' disabled={channel.readonly} onClick={() => onCopy(channel)}><Copy />复制</Button></div>)}</div></details>)}</div></div>
      <div className='hidden overflow-x-auto md:block'><Table><TableHeader><TableRow><TableHead>渠道</TableHead><TableHead>规范化地址</TableHead><TableHead>成本倍率</TableHead><TableHead>分组 / 层</TableHead><TableHead>24h 尝试成功率</TableHead><TableHead>状态</TableHead><TableHead className='w-20'><span className='sr-only'>操作</span></TableHead></TableRow></TableHeader><TableBody>{visible.map((channel) => <TableRow key={channel.id} className='cursor-pointer' onClick={() => onOpenDetails(channel)}><TableCell><div className='flex items-start gap-3'><HealthDot status={channel.status} /><div className='min-w-0'><div className='flex items-center gap-2'><span className='font-mono font-semibold'>{channel.id}</span><span className='truncate font-medium'>{channel.name}</span></div><span className='text-xs text-muted-foreground'>{channel.type} · {channel.models.length ? `${channel.models.length} 个模型` : '模型未知'}</span></div></div></TableCell><TableCell><code className='block max-w-48 truncate text-xs text-muted-foreground'>{channel.address}</code></TableCell><TableCell className='font-mono'>{channel.costRatio ? `${channel.costRatio.toFixed(2)}x` : '—'}</TableCell><TableCell className='font-mono text-xs'>{channel.groups} / {channel.layers}</TableCell><TableCell>{channel.successRate ? <span className={channel.successRate < 98 ? 'text-warning' : 'text-success'}>{channel.successRate}%</span> : <span className='text-muted-foreground'>暂无数据</span>}</TableCell><TableCell><StatusBadge status={channel.status} /></TableCell><TableCell onClick={(event) => event.stopPropagation()}><DropdownMenu><DropdownMenuTrigger asChild><Button variant='ghost' size='icon' aria-label={`打开 ${channel.name} 操作`}><Ellipsis /></Button></DropdownMenuTrigger><DropdownMenuContent align='end'><DropdownMenuLabel>{channel.readonly ? '只读渠道' : channel.name}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onOpenDetails(channel)}><Eye />查看详情</DropdownMenuItem><DropdownMenuItem disabled={channel.readonly} onSelect={() => onEdit(channel)}><Pencil />编辑元数据</DropdownMenuItem><DropdownMenuItem disabled={channel.readonly} onSelect={() => onCopy(channel)}><Copy />复制渠道</DropdownMenuItem><DropdownMenuItem disabled={channel.readonly}><FlaskConical />测试连接</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div>
      <div className='divide-y md:hidden'>{visible.map((channel) => <button key={channel.id} type='button' onClick={() => onOpenDetails(channel)} className='flex w-full min-w-0 items-start gap-3 p-4 text-start'><HealthDot status={channel.status} /><span className='min-w-0 flex-1'><span className='flex items-center gap-2'><strong className='font-mono'>{channel.id}</strong><span className='truncate font-medium'>{channel.name}</span></span><span className='mt-1 block truncate text-xs text-muted-foreground'>{channel.address}</span><span className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'><span>{channel.costRatio ? `${channel.costRatio.toFixed(2)}x` : '倍率未登记'}</span><span>{channel.groups} 个分组</span>{channel.successRate ? <span className='text-success'>{channel.successRate}%</span> : <span>暂无数据</span>}</span></span><ChevronRight className='mt-1 size-4 shrink-0 text-muted-foreground' /></button>)}</div>
      {!visible.length ? <div className='p-10 text-center text-sm text-muted-foreground'>没有匹配的逻辑渠道。</div> : null}
    </section>
    <p className='text-xs text-muted-foreground'>提示：成本倍率只用于展示参考；24h 指标是渠道尝试成功率，不代表用户请求最终成功率。</p>
  </div>
}

function RouteLayerEditor({ group, routes, channels, model, onModelChange, onChange }: { group: 'plus' | 'pro'; routes: RouteLayer[]; channels: LogicalChannel[]; model: string; onModelChange: (model: string) => void; onChange: (routes: RouteLayer[]) => void }) {
  const addChannel = (layerId: string, channelId: string) => {
    if (!channelId) return
    const duplicate = routes.some((layer) => layer.id !== layerId && layer.channels.some((channel) => channel.id === channelId))
    if (duplicate) { toast.error('同一逻辑渠道不能出现在同一分组的多个尝试层。'); return }
    onChange(routes.map((layer) => layer.id === layerId ? { ...layer, channels: [...layer.channels, { id: channelId, weight: 100 }] } : layer))
  }
  const removeChannel = (layerId: string, channelId: string) => onChange(routes.map((layer) => layer.id === layerId ? { ...layer, channels: layer.channels.filter((channel) => channel.id !== channelId) } : layer))
  const setWeight = (layerId: string, channelId: string, value: string) => onChange(routes.map((layer) => layer.id === layerId ? { ...layer, channels: layer.channels.map((channel) => channel.id === channelId ? { ...channel, weight: Math.max(1, Number(value) || 1) } : channel) } : layer))
  return <div className='space-y-4'>
    <div className='flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between'><div><Label htmlFor='route-model'>模型覆盖校验</Label><p className='mt-1 text-xs text-muted-foreground'>切换模型查看每层是否有可用覆盖。</p></div><select id='route-model' value={model} onChange={(event) => onModelChange(event.target.value)} className='h-9 rounded-md border bg-background px-3 text-sm sm:w-52'><option>gpt-4o</option><option>gpt-4.1</option><option>o3</option><option>claude-3.7-sonnet</option></select></div>
    {routes.map((layer) => { const total = layer.channels.reduce((sum, channel) => sum + channel.weight, 0); return <section key={layer.id} className='border bg-card'><header className='flex flex-wrap items-center justify-between gap-3 border-b p-4'><div className='flex items-center gap-2'><span className='font-mono text-xs text-muted-foreground'>P{layer.priority}</span><div><h3 className='font-semibold'>{layer.label}</h3><p className='text-xs text-muted-foreground'>{layer.channels.length ? `${layer.channels.length} 个候选 · 同层按相对权重分配` : '尚未添加渠道'}</p></div></div><Badge variant='outline'>{layer.channels.some((item) => channels.find((channel) => channel.id === item.id)?.models.includes(model)) ? '模型可用' : '无覆盖'}</Badge></header><div className='divide-y'>{layer.channels.map((entry) => { const channel = channels.find((item) => item.id === entry.id); const supported = channel?.models.includes(model); return <div key={entry.id} className='flex flex-wrap items-center gap-3 p-4'><div className='flex min-w-0 flex-1 items-center gap-3'><HealthDot status={channel?.status ?? 'unknown'} /><span className='font-mono font-semibold'>{entry.id}</span><span className='min-w-0 truncate text-sm'>{channel?.name}</span>{!supported ? <Badge variant='outline' className='border-warning/30 text-warning'>不覆盖 {model}</Badge> : null}</div><label className='flex items-center gap-2 text-xs text-muted-foreground'>权重 <Input type='number' min='1' value={entry.weight} onChange={(event) => setWeight(layer.id, entry.id, event.target.value)} className='h-8 w-20 font-mono' /><span className='w-12 text-end font-mono text-foreground'>{Math.round(entry.weight / total * 100)}%</span></label><IconButton label={`从 ${layer.label} 移除 ${entry.id}`} icon={Trash2} onClick={() => removeChannel(layer.id, entry.id)} /></div>})}</div><div className='flex flex-col gap-2 border-t bg-muted/20 p-3 sm:flex-row sm:items-center'><span className='text-xs text-muted-foreground'>添加逻辑渠道</span><select value='' onChange={(event) => addChannel(layer.id, event.target.value)} aria-label={`向 ${layer.label} 添加渠道`} className='h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm'><option value=''>选择渠道…</option>{channels.filter((channel) => !channel.readonly && !layer.channels.some((item) => item.id === channel.id)).map((channel) => <option key={channel.id} value={channel.id} disabled={routes.some((other) => other.id !== layer.id && other.channels.some((item) => item.id === channel.id))}>{channel.id} · {channel.name}</option>)}</select></div></section> })}
    <div className='flex items-start gap-2 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground'><Route className='mt-0.5 size-4 shrink-0 text-primary' /><p><strong className='text-foreground'>路由语义：</strong>{group} 初次尝试会在同层候选中按权重选择，失败后进入下一尝试层；不承诺 A → B → C 的固定顺序。</p></div>
  </div>
}

function RoutesView({ channels }: { channels: LogicalChannel[] }) {
  const [group, setGroup] = useState<'plus' | 'pro'>('plus')
  const [routes, setRoutes] = useState(initialRoutes)
  const [model, setModel] = useState('gpt-4o')
  const [previewOpen, setPreviewOpen] = useState(false)
  const activeRoutes = routes[group]
  const dirty = JSON.stringify(routes[group]) !== JSON.stringify(initialRoutes[group])
  return <div className='space-y-6'>
    <PageHeading eyebrow='ADMIN / ROUTING' title='分组路由' description='维护现有分组绑定哪些逻辑渠道。分组及倍率由其他页面维护，本页只管理尝试层与相对权重。' action={<div className='flex items-center gap-2'><Badge variant='outline' className='border-primary/30 bg-primary/5 text-primary'><ShieldCheck />Root 会话</Badge><Button onClick={() => setPreviewOpen(true)} disabled={!dirty}><ClipboardCheck />预览变更</Button></div>} />
    <div className='flex flex-wrap items-center gap-2 border-b'><Button variant={group === 'plus' ? 'secondary' : 'ghost'} onClick={() => setGroup('plus')}>plus <span className='ms-1 text-xs text-muted-foreground'>2 层 · A/B → C</span></Button><Button variant={group === 'pro' ? 'secondary' : 'ghost'} onClick={() => setGroup('pro')}>pro <span className='ms-1 text-xs text-muted-foreground'>2 层 · C → D</span></Button></div>
    <MetricBelt items={[{ label: '当前分组', value: group, detail: '逻辑路由' }, { label: '尝试层', value: `${activeRoutes.length}`, detail: '优先级递减' }, { label: '候选渠道', value: `${new Set(activeRoutes.flatMap((layer) => layer.channels.map((item) => item.id))).size}`, detail: '不可跨层重复' }, { label: '模型校验', value: activeRoutes.every((layer) => layer.channels.some((item) => channels.find((channel) => channel.id === item.id)?.models.includes(model))) ? '通过' : '需处理', detail: `当前模型 ${model}`, tone: activeRoutes.every((layer) => layer.channels.some((item) => channels.find((channel) => channel.id === item.id)?.models.includes(model))) ? 'success' : 'warning' }, { label: '状态', value: dirty ? '有未保存变更' : '已同步', detail: dirty ? '请预览后执行' : 'r7' }]} />
    <RouteLayerEditor group={group} routes={activeRoutes} channels={channels} model={model} onModelChange={setModel} onChange={(next) => setRoutes((current) => ({ ...current, [group]: next }))} />
    <ExecutionDialog open={previewOpen} onOpenChange={setPreviewOpen} />
  </div>
}

function MonitoringView({ channels }: { channels: LogicalChannel[] }) {
  const executionRows = [
    { id: '#1042', route: 'plus · 初次尝试 · A', status: 'healthy' as const, tested: '今天 10:42', latency: '842 ms', reason: '配置与 r7 一致' },
    { id: '#1043', route: 'plus · 初次尝试 · B', status: 'healthy' as const, tested: '今天 10:41', latency: '776 ms', reason: '配置与 r7 一致' },
    { id: '#1044', route: 'plus · 第 1 次重试 · C', status: 'warning' as const, tested: '今天 09:18', latency: '超时', reason: '最近测试失败，等待复测' },
    { id: '#1061', route: 'pro · 初次尝试 · C', status: 'healthy' as const, tested: '今天 09:20', latency: '1,240 ms', reason: '配置与 r7 一致' },
    { id: '#1062', route: 'pro · 第 1 次重试 · D', status: 'warning' as const, tested: '今天 10:02', latency: '932 ms', reason: '底层修订等待重新核对' },
  ]
  return <div className='space-y-6'>
    <PageHeading eyebrow='ADMIN / MONITORING' title='监控' description='从逻辑渠道和底层执行记录两个层面查看健康状态。24h 指标只统计渠道尝试日志。' action={<Button variant='outline' onClick={() => toast.success('监控数据已刷新')}><RefreshCw />刷新</Button>} />
    <MetricBelt items={[{ label: '逻辑渠道健康', value: '4 / 5', detail: 'A / B / D / E 可观测', tone: 'success' }, { label: '底层执行记录', value: '7 / 8', detail: '1 条需重新核对', tone: 'warning' }, { label: '24h 尝试', value: '29,140', detail: '消费 + 错误日志' }, { label: '平均成功率', value: '98.4%', detail: '不是最终请求成功率', tone: 'success' }, { label: '暂无数据', value: '1', detail: '日志条件不足' }]} />
    <div className='grid gap-6 lg:grid-cols-[1.2fr_.8fr]'><section className='border bg-card'><header className='flex items-center justify-between border-b p-4'><div><h2 className='font-semibold'>问题队列</h2><p className='mt-1 text-xs text-muted-foreground'>按需处理，不自动改变逻辑身份。</p></div><Badge variant='outline' className='border-warning/30 text-warning'>3 项</Badge></header><div className='divide-y'>{[['C', 'plus · 第 1 次重试', '最近一次测试超时', 'warning'], ['legacy-1', '历史物理渠道', '缺少完整 Partokens 元数据', 'unknown'], ['D', 'pro · 第 1 次重试', '底层记录等待重新核对', 'warning']].map(([id, scope, issue, tone]) => <div key={`${id}-${scope}`} className='flex items-start gap-3 p-4'><HealthDot status={tone === 'warning' ? 'warning' : 'unknown'} /><div className='min-w-0 flex-1'><div className='flex flex-wrap items-center gap-2'><strong>{id}</strong><span className='text-xs text-muted-foreground'>{scope}</span></div><p className='mt-1 text-sm'>{issue}</p><p className='mt-1 text-xs text-muted-foreground'>建议：查看详情并重新核对底层状态。</p></div><Button size='sm' variant='outline' onClick={() => toast.info(`已打开 ${id} 的核对任务`)}>处理</Button></div>)}</div></section><section className='border bg-card'><header className='border-b p-4'><h2 className='font-semibold'>逻辑渠道健康</h2><p className='mt-1 text-xs text-muted-foreground'>最近 24h 尝试成功率</p></header><div className='divide-y'>{channels.filter((channel) => !channel.readonly).map((channel) => <div key={channel.id} className='flex items-center gap-3 p-4'><HealthDot status={channel.status} /><span className='w-6 font-mono font-semibold'>{channel.id}</span><span className='min-w-0 flex-1 truncate text-sm'>{channel.name}</span><span className='font-mono text-sm'>{channel.successRate ? `${channel.successRate}%` : '暂无数据'}</span></div>)}</div></section></div>
    <section className='overflow-hidden border bg-card'><header className='border-b p-4'><h2 className='font-semibold'>路由就绪矩阵</h2><p className='mt-1 text-xs text-muted-foreground'>分组 × 尝试层 × 模型覆盖，帮助在执行前发现空层。</p></header><div className='overflow-x-auto'><Table><TableHeader><TableRow><TableHead>分组</TableHead><TableHead>初次尝试</TableHead><TableHead>第 1 次重试</TableHead><TableHead>gpt-4o</TableHead><TableHead>gpt-4.1</TableHead><TableHead>最近修订</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className='font-semibold'>plus</TableCell><TableCell><Badge variant='outline' className='border-success/30 text-success'>A / B · 就绪</Badge></TableCell><TableCell><Badge variant='outline' className='border-success/30 text-success'>C · 就绪</Badge></TableCell><TableCell className='text-success'>覆盖</TableCell><TableCell className='text-warning'>部分</TableCell><TableCell className='font-mono text-xs'>r7 · 09:14</TableCell></TableRow><TableRow><TableCell className='font-semibold'>pro</TableCell><TableCell><Badge variant='outline' className='border-success/30 text-success'>C · 就绪</Badge></TableCell><TableCell><Badge variant='outline' className='border-success/30 text-success'>D · 就绪</Badge></TableCell><TableCell className='text-success'>覆盖</TableCell><TableCell className='text-success'>覆盖</TableCell><TableCell className='font-mono text-xs'>r7 · 09:14</TableCell></TableRow></TableBody></Table></div></section>
    <section className='overflow-hidden border bg-card'><header className='border-b p-4'><h2 className='font-semibold'>底层执行记录健康</h2><p className='mt-1 text-xs text-muted-foreground'>测试时间与延迟均为最近一次快照，不代表实时 SLA。</p></header><div className='overflow-x-auto'><Table><TableHeader><TableRow><TableHead>物理 ID</TableHead><TableHead>路由实例</TableHead><TableHead>健康</TableHead><TableHead>最近测试</TableHead><TableHead>测试延迟</TableHead><TableHead>原因</TableHead></TableRow></TableHeader><TableBody>{executionRows.map((record) => <TableRow key={record.id}><TableCell className='font-mono text-xs'>new-api {record.id}</TableCell><TableCell className='font-medium'>{record.route}</TableCell><TableCell><span className='inline-flex items-center gap-2'><HealthDot status={record.status} /><span className={record.status === 'warning' ? 'text-warning' : 'text-success'}>{record.status === 'warning' ? '需核对' : '健康'}</span></span></TableCell><TableCell className='text-muted-foreground'>{record.tested}</TableCell><TableCell className={`font-mono text-xs ${record.latency === '超时' ? 'text-warning' : ''}`}>{record.latency}</TableCell><TableCell className='min-w-48 text-xs text-muted-foreground'>{record.reason}</TableCell></TableRow>)}</TableBody></Table></div></section>
  </div>
}

function ChangesView({ onPreview }: { onPreview: () => void }) {
  const records = [{ id: 'r7', title: '重建正式渠道路由', status: '已完成', detail: 'plus A/B → C · pro C → D', time: '今天 09:14', icon: CheckCircle2 }, { id: 'r6', title: '停用 OpenAI E', status: '部分失败', detail: '逻辑渠道已停用，1 条底层记录待核对', time: '昨天 18:22', icon: TriangleAlert }, { id: 'r5', title: '登记渠道 C 元数据', status: '已完成', detail: '模型覆盖 gpt-4o · 成本倍率 0.09x', time: '昨天 16:08', icon: ShieldCheck }]
  return <div className='space-y-6'>
    <PageHeading eyebrow='ADMIN / CHANGES' title='变更记录' description='查看 Root 发起的逻辑渠道和路由变更，以及多 API 非原子执行的每一步结果。' action={<Button onClick={onPreview}><ClipboardCheck />查看执行示例</Button>} />
    <MetricBelt items={[{ label: '本周变更', value: '7', detail: '逻辑渠道与路由' }, { label: '成功', value: '5', detail: '全部步骤完成', tone: 'success' }, { label: '部分失败', value: '2', detail: '需要继续或核对', tone: 'warning' }, { label: '当前修订', value: 'r7', detail: '正式路由基线' }, { label: '操作者', value: 'Root', detail: 'Mika Chen' }]} />
    <section className='overflow-hidden border bg-card'><div className='divide-y'>{records.map((record) => { const Icon = record.icon; return <article key={record.id} className='flex flex-col gap-4 p-4 sm:flex-row sm:items-start'><Icon className={`mt-0.5 size-5 shrink-0 ${record.status === '部分失败' ? 'text-warning' : 'text-success'}`} /><div className='min-w-0 flex-1'><div className='flex flex-wrap items-center gap-2'><span className='font-mono text-xs text-muted-foreground'>{record.id}</span><h2 className='font-semibold'>{record.title}</h2><Badge variant='outline' className={record.status === '部分失败' ? 'border-warning/30 text-warning' : 'border-success/30 text-success'}>{record.status}</Badge></div><p className='mt-2 text-sm text-muted-foreground'>{record.detail}</p><p className='mt-2 text-xs text-muted-foreground'>{record.time} · Root / Mika Chen · 不含敏感凭据</p></div><Button variant='outline' size='sm' onClick={onPreview}><Eye />查看步骤</Button></article>})}</div></section>
    <div className='flex items-start gap-2 border border-primary/20 bg-primary/5 p-4 text-sm'><LockKeyhole className='mt-0.5 size-4 shrink-0 text-primary' /><p><strong>审计边界：</strong>变更记录只保存逻辑渠道 ID、底层记录 ID、模型覆盖和执行结果，不保存 API 密钥或其明文内容。</p></div>
  </div>
}

export function ShadcnAdminOperationsScreen({ activeRoute, theme, onTheme, onNavigate }: ConsoleScreenProps & { activeRoute: AdminOperationsRoute }) {
  const [channels, setChannels] = useState(seedChannels)
  const [detail, setDetail] = useState<LogicalChannel | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LogicalChannel | null>(null)
  const [copying, setCopying] = useState<LogicalChannel | null>(null)
  const [executionOpen, setExecutionOpen] = useState(false)
  const openDetails = (channel: LogicalChannel) => { setDetail(channel); setDetailOpen(true) }
  const editChannel = (channel: LogicalChannel) => { if (channel.readonly) return; setDetailOpen(false); setEditing(channel); setFormOpen(true) }
  const copyChannel = (channel: LogicalChannel) => { if (channel.readonly) return; setDetailOpen(false); setEditing(null); setCopying(channel); setFormOpen(true) }
  const saveChannel = (channel: LogicalChannel) => { setChannels((current) => current.some((item) => item.id === channel.id) ? current.map((item) => item.id === channel.id ? channel : item) : [...current, channel]); setFormOpen(false); toast.success(`${channel.name} 已保存（原型）`) }
  return <ConsoleShell activeRoute={activeRoute} theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
    {activeRoute === 'console-admin-channels' ? <ChannelsView channels={channels} onOpenDetails={openDetails} onEdit={editChannel} onCopy={copyChannel} onCreate={() => { setEditing(null); setCopying(null); setFormOpen(true) }} /> : null}
    {activeRoute === 'console-admin-routes' ? <RoutesView channels={channels} /> : null}
    {activeRoute === 'console-admin-monitoring' ? <MonitoringView channels={channels} /> : null}
    {activeRoute === 'console-admin-changes' ? <ChangesView onPreview={() => setExecutionOpen(true)} /> : null}
    <ChannelDetails channel={detail} open={detailOpen} onOpenChange={setDetailOpen} onEdit={() => detail && editChannel(detail)} onCopy={() => detail && copyChannel(detail)} onTest={() => toast.success('连接测试已加入执行队列（原型）')} />
    <ChannelForm channel={editing} copyFrom={copying} open={formOpen} onOpenChange={setFormOpen} onSave={(channel) => { saveChannel(channel); setCopying(null) }} />
    <ExecutionDialog open={executionOpen} onOpenChange={setExecutionOpen} />
  </ConsoleShell>
}
