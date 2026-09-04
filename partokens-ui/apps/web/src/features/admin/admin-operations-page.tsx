import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  Eye,
  FlaskConical,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import {
  continueAdminChange,
  cancelAdminModelTest,
  copyAdminChannel,
  createAdminChannel,
  discoverAdminChannelModels,
  executeAdminModelRemoval,
  executeAdminRoute,
  getAdminModelTest,
  getAdminBootstrap,
  previewAdminRoute,
  previewAdminModelRemoval,
  refreshAdminMonitor,
  setAdminChannelStatus,
  startAdminModelTest,
  testAdminChannel,
  updateAdminChannel,
  discoverAdminChannelModelsPreview,
  type AdminBootstrap,
  type AdminChange,
  type AdminLogicalChannel,
  type AdminModelDiscovery,
  type AdminModelDiscoveryPreview,
  type AdminModelRemovePreview,
  type AdminModelTestTask,
  type AdminMonitorSnapshot,
  type AdminRouteInput,
  type AdminRouteLayer,
  type AdminRoutePreview,
} from '@partokens/api-client'
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from '@partokens/design-system/components'

import { adminCopy } from './admin-copy'

type AdminPage = 'channels' | 'routes' | 'monitoring' | 'changes'

const queryKey = ['admin-operations', 'bootstrap'] as const
const copy = adminCopy()
const channelTypes = [
  { id: 1, name: 'OpenAI' },
  { id: 3, name: 'Azure OpenAI' },
  { id: 14, name: 'Anthropic' },
  { id: 24, name: 'Gemini' },
  { id: 43, name: 'DeepSeek' },
  { id: 60, name: 'New API' },
] as const

function channelTypeName(type: number) {
  return channelTypes.find((item) => item.id === type)?.name ?? `类型 ${type}`
}

function errorMessage(cause: unknown) {
  if (axios.isAxiosError(cause)) {
    const message = cause.response?.data && typeof cause.response.data === 'object'
      ? (cause.response.data as { message?: unknown; detail?: unknown }).message || (cause.response.data as { detail?: unknown }).detail
      : undefined
    if (typeof message === 'string' && message) return message
  }
  return cause instanceof Error ? cause.message : '操作未完成，请稍后重试。'
}

function formatTime(timestamp?: number | null) {
  if (!timestamp) return '暂无数据'
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(timestamp * 1000)
}

export function formatCostRatio(value?: number | null) {
  return value == null ? '未登记' : `${value.toFixed(3)}x`
}

export function modelStatusLabel(status: string) {
  const labels: Record<string, string> = {
    available: '可用',
    unavailable: '不可用',
    timeout: '超时',
    rate_limited: '限流',
    unauthorized: '认证失败',
    server_error: '渠道异常',
    unknown: '未知',
    untested: '未测试',
  }
  return labels[status] || '未测试'
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] font-semibold text-muted-foreground">{eyebrow}</span><Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary"><ShieldCheck />仅 Root</Badge></div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
}

function MetricBelt({ items }: { items: Array<{ label: string; value: string; detail: string; tone?: 'success' | 'warning' }> }) {
  return <dl className="grid overflow-hidden border-y bg-card sm:grid-cols-2 lg:grid-cols-5">{items.map((item, index) => <div key={item.label} className={`min-h-24 border-b p-4 sm:border-e lg:border-b-0 ${index === items.length - 1 ? 'sm:border-e-0' : ''}`}><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className={`mt-1 font-mono text-xl font-semibold ${item.tone === 'success' ? 'text-success' : item.tone === 'warning' ? 'text-warning' : ''}`}>{item.value}</dd><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div>)}</dl>
}

function StatusBadge({ status }: { status: AdminLogicalChannel['status'] }) {
  if (status === 'available') return <Badge variant="outline" className="border-success/30 bg-success/10 text-success"><CheckCircle2 />可用</Badge>
  if (status === 'partial') return <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning"><TriangleAlert />部分异常</Badge>
  if (status === 'unavailable') return <Badge variant="destructive"><TriangleAlert />不可用</Badge>
  if (status === 'disabled') return <Badge variant="secondary"><CircleDashed />已停用</Badge>
  return <Badge variant="outline" className="text-muted-foreground"><Clock3 />未知</Badge>
}

function HealthDot({ status }: { status: 'healthy' | 'warning' | 'unknown' }) {
  return <span className={`inline-block size-2 shrink-0 rounded-full ${status === 'healthy' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-muted-foreground/50'}`} aria-hidden="true" />
}

function IconButton({ label, icon: Icon, onClick, disabled }: { label: string; icon: LucideIcon; onClick?: () => void; disabled?: boolean }) {
  return <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="size-8" aria-label={label} disabled={disabled} onClick={onClick}><Icon /></Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

function AdminLoading() {
  return <div className="space-y-6"><Skeleton className="h-24 w-full rounded-md" /><Skeleton className="h-24 w-full rounded-md" /><Skeleton className="h-80 w-full rounded-md" /></div>
}

function AdminUnavailable({ retry, message }: { retry: () => void; message: string }) {
  return <div role="alert" className="flex min-h-[28rem] flex-col items-center justify-center border px-6 text-center"><TriangleAlert className="size-6 text-destructive" /><h1 className="mt-4 font-semibold">管理员服务暂不可用</h1><p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p><Button variant="outline" className="mt-5" onClick={retry}><RefreshCw />重试</Button></div>
}

function useAdminBootstrap() {
  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await getAdminBootstrap(signal)
      if (!response.success) throw new Error(response.message || '管理员数据不可用')
      return response.data
    },
    refetchInterval: 60_000,
    staleTime: 15_000,
  })
}

function modelDiscoveryStatusLabel(status?: string) {
  return ({
    success: '获取成功',
    partial: '部分获取成功',
    empty: '返回空列表',
    timeout: '获取超时',
    unauthorized: '渠道认证失败',
    rate_limited: '渠道限流',
    server_error: '渠道服务异常',
    not_found: '渠道不支持模型接口',
    unsupported: '渠道返回格式不支持',
    unknown: '获取失败',
  } as Record<string, string>)[status || ''] || '尚未获取'
}

function modelDiscoverySourceLabel(source?: string | null) {
  if (!source) return '尚未获取'
  return source === 'new-api channel model endpoint' ? 'new-api 渠道模型接口' : '管理员服务'
}

function ModelRemovalDialog({
  preview,
  open,
  onOpenChange,
  onExecute,
  executing,
}: {
  preview: AdminModelRemovePreview | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onExecute: () => void
  executing: boolean
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>移除不可用模型</DialogTitle><DialogDescription>仅会移除测试结果明确为“不可用”的模型。超时、限流和渠道异常会保留。</DialogDescription></DialogHeader>{preview ? <div className="max-h-[62svh] space-y-5 overflow-y-auto"><div className="grid gap-3 sm:grid-cols-3"><div className="border p-3"><p className="text-xs text-muted-foreground">将移除</p><p className="mt-1 font-mono text-lg font-semibold">{preview.remove_models.length}</p><p className="mt-1 break-words text-xs">{preview.remove_models.join('、')}</p></div><div className="border p-3"><p className="text-xs text-muted-foreground">保留模型</p><p className="mt-1 font-mono text-lg font-semibold">{preview.retain_models.length}</p><p className="mt-1 break-words text-xs">{preview.retain_models.join('、') || '无'}</p></div><div className="border p-3"><p className="text-xs text-muted-foreground">预计步骤</p><p className="mt-1 font-mono text-lg font-semibold">{preview.expected_steps}</p><p className="mt-1 text-xs">模型清单 {preview.modifies_models ? '会' : '不会'}修改，模型映射 {preview.modifies_model_mapping ? '会' : '不会'}修改</p></div></div><section><h3 className="text-sm font-semibold">失败原因</h3><div className="mt-2 divide-y border-y">{preview.failure_reasons.map((item) => <div key={item.model} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><code>{item.model}</code><span className="text-muted-foreground">{item.reason}</span></div>)}</div></section><section><h3 className="text-sm font-semibold">物理记录范围</h3><div className="mt-2 divide-y border-y">{preview.physical_records.map((record) => <div key={record.channel_id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto]"><div><strong>{record.name}</strong><p className="mt-1 text-xs text-muted-foreground">new-api #{record.channel_id} · {record.kind} · {record.before_models.length} → {record.after_models.length} 个模型</p></div><span className="text-xs text-muted-foreground">映射 {record.mapping_changed ? '会更新' : '不变'}</span></div>)}</div></section><section><h3 className="text-sm font-semibold">执行步骤</h3><div className="mt-2 divide-y border-y">{preview.steps.map((step, index) => <div key={`${step.action}-${index}`} className="flex gap-3 py-2 text-sm"><span className="font-mono text-muted-foreground">{index + 1}</span><span>{step.label}</span></div>)}</div></section><p className="border border-warning/30 bg-warning/5 p-3 text-sm text-warning">修改前的模型清单和模型映射会保存在变更记录中；执行是非原子的，失败后可以继续。</p></div> : null}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button variant="destructive" onClick={onExecute} disabled={!preview || executing}>{executing ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{executing ? '执行中' : '确认移除'}</Button></DialogFooter></DialogContent></Dialog>
}

function ModelOperationsPanel({ channel }: { channel: AdminLogicalChannel }) {
  const queryClient = useQueryClient()
  const [discovery, setDiscovery] = useState<AdminModelDiscovery | null>(channel.model_discovery ?? null)
  const [selectedModels, setSelectedModels] = useState<string[]>(channel.models)
  const [modelFilter, setModelFilter] = useState('all')
  const [taskId, setTaskId] = useState<string | null>(channel.latest_model_test?.id ?? null)
  const [task, setTask] = useState<AdminModelTestTask | null>(null)
  const [preview, setPreview] = useState<AdminModelRemovePreview | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)
  useEffect(() => {
    setDiscovery(channel.model_discovery ?? null)
    setSelectedModels(channel.models)
    setModelFilter('all')
    setTaskId(channel.latest_model_test?.id ?? null)
    setTask(null)
  }, [channel.id, channel.model_discovery, channel.latest_model_test?.id, channel.models])
  const taskQuery = useQuery({
    queryKey: ['admin-model-test', taskId],
    queryFn: async ({ signal }) => {
      const response = await getAdminModelTest(taskId!, signal)
      if (!response.success) throw new Error(response.message || '测试任务不可用')
      return response.data
    },
    enabled: Boolean(taskId),
    refetchInterval: (query) => ['pending', 'running'].includes((query.state.data as AdminModelTestTask | undefined)?.status ?? 'pending') ? 1000 : false,
  })
  useEffect(() => { if (taskQuery.data) setTask(taskQuery.data) }, [taskQuery.data])
  const currentTask = taskQuery.data ?? task
  const discoveredModels = useMemo(() => {
    const ids = new Set(channel.models)
    const entries = (discovery?.models ?? []).map((item) => item.id)
    return [...new Set([...entries, ...ids])]
  }, [channel.models, discovery?.models])
  const testResults = currentTask?.results ?? []
  const visibleModels = useMemo(() => discoveredModels.filter((model) => {
    if (modelFilter === 'all') return true
    const status = testResults.find((item) => item.model_id === model)?.status ?? 'untested'
    if (modelFilter === 'failed') return !['available', 'unavailable', 'untested'].includes(status)
    return status === modelFilter
  }), [discoveredModels, modelFilter, testResults])
  const discover = useMutation({
    mutationFn: () => discoverAdminChannelModels(channel.id),
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || '获取模型失败')
      setDiscovery(response.data)
      setSelectedModels((current) => current.length ? current : response.data.models.map((item) => item.id))
      await queryClient.invalidateQueries({ queryKey })
      toast.success(response.data.status === 'success' ? `已获取 ${response.data.models.length} 个模型` : modelDiscoveryStatusLabel(response.data.status))
    },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const test = useMutation({
    mutationFn: () => startAdminModelTest(channel.id, selectedModels.slice(0, 100)),
    onSuccess: (response) => {
      if (!response.success) throw new Error(response.message || '测试任务创建失败')
      setTaskId(response.data.id)
      setTask(response.data)
      toast.success('模型测试已开始')
    },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const cancel = useMutation({
    mutationFn: () => cancelAdminModelTest(currentTask!.id),
    onSuccess: (response) => { if (response.success) setTask(response.data) },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const previewMutation = useMutation({
    mutationFn: () => previewAdminModelRemoval(channel.id),
    onSuccess: (response) => { if (!response.success) throw new Error(response.message || '预览失败'); setPreview(response.data); setRemoveOpen(true) },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const executeMutation = useMutation({
    mutationFn: () => executeAdminModelRemoval(channel.id, preview?.remove_models),
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || '移除失败')
      await queryClient.invalidateQueries({ queryKey })
      if (response.data.status === 'success') { toast.success('不可用模型已移除'); setRemoveOpen(false) } else toast.warning('移除部分完成，可在变更记录中继续执行')
    },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const unavailableCount = testResults.filter((item) => item.status === 'unavailable' && channel.models.includes(item.model_id)).length
  return <section className="border-t pt-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-sm font-semibold">模型运营</h2><p className="mt-1 text-xs text-muted-foreground">模型获取和测试由管理员服务执行；只展示脱敏状态。</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => discover.mutate()} disabled={discover.isPending}>{discover.isPending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}从渠道获取模型</Button><Button size="sm" onClick={() => test.mutate()} disabled={!selectedModels.length || test.isPending || Boolean(currentTask && ['pending', 'running'].includes(currentTask.status))}>{test.isPending ? <LoaderCircle className="animate-spin" /> : <FlaskConical />}测试选中模型</Button></div></div><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>来源：{modelDiscoverySourceLabel(discovery?.source)}</span><span>刷新：{formatTime(discovery?.fetched_at)}</span><span>状态：{modelDiscoveryStatusLabel(discovery?.status)}</span><Select value={modelFilter} onValueChange={setModelFilter}><SelectTrigger className="h-8 w-32" aria-label="模型状态筛选"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部模型</SelectItem><SelectItem value="available">可用</SelectItem><SelectItem value="unavailable">不可用</SelectItem><SelectItem value="untested">未测试</SelectItem><SelectItem value="failed">其他异常</SelectItem></SelectContent></Select></div>{discovery?.error ? <p className="mt-3 border border-warning/30 bg-warning/5 p-3 text-sm text-warning">{discovery.error}</p> : null}<div className="mt-4 grid gap-2 sm:grid-cols-2">{visibleModels.map((model) => { const result = testResults.find((item) => item.model_id === model); const checked = selectedModels.includes(model); return <label key={model} className="flex min-w-0 items-start gap-3 border p-3 text-sm"><Checkbox checked={checked} onCheckedChange={(value) => setSelectedModels((current) => value === true ? [...new Set([...current, model])] : current.filter((item) => item !== model))} /><span className="min-w-0 flex-1"><code className="block truncate">{model}</code><span className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{result ? modelStatusLabel(result.status) : '未测试'}</span>{result?.latency_ms ? <span>{result.latency_ms} ms</span> : null}{result?.error ? <span className="text-warning">{result.error}</span> : null}</span></span></label> })}</div>{discoveredModels.length > 0 && !visibleModels.length ? <p className="mt-4 border border-dashed p-6 text-center text-sm text-muted-foreground">当前筛选没有匹配模型。</p> : null}{!discoveredModels.length ? <p className="mt-4 border border-dashed p-6 text-center text-sm text-muted-foreground">还没有模型清单。点击“从渠道获取模型”开始。</p> : null}{currentTask ? <div className="mt-4 border-y py-3"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>测试进度：{currentTask.completed}/{currentTask.total} · 可用 {currentTask.available_count} · 失败 {currentTask.failed_count}</span><span className="font-mono">{currentTask.progress}% · {currentTask.status === 'cancelled' ? '已取消' : currentTask.status === 'running' || currentTask.status === 'pending' ? '进行中' : currentTask.status === 'success' ? '全部可用' : '部分结果'}</span></div><div className="mt-2 h-2 overflow-hidden bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${currentTask.progress}%` }} /></div>{currentTask.status === 'running' || currentTask.status === 'pending' ? <Button variant="ghost" size="sm" className="mt-2" onClick={() => cancel.mutate()} disabled={cancel.isPending}>取消测试</Button> : null}</div> : null}<div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">{unavailableCount ? `只有明确判定为“不可用”的模型可以移除；当前 ${unavailableCount} 个。` : '当前没有可移除的不可用模型。请先完成模型测试。'}</p><Button variant="outline" size="sm" onClick={() => previewMutation.mutate()} disabled={!unavailableCount || previewMutation.isPending}>{previewMutation.isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}移除不可用模型</Button></div><ModelRemovalDialog preview={preview} open={removeOpen} onOpenChange={setRemoveOpen} onExecute={() => executeMutation.mutate()} executing={executeMutation.isPending} /></section>
}

function ChannelSheet({ channel, open, onOpenChange, onEdit, onCopy, onTest, onToggle }: { channel: AdminLogicalChannel | null; open: boolean; onOpenChange: (open: boolean) => void; onEdit: () => void; onCopy: () => void; onTest: () => void; onToggle: () => void }) {
  if (!channel) return null
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader className="border-b"><SheetTitle>{channel.name}</SheetTitle><SheetDescription>{channelTypeName(channel.channel_type)} · {channel.base_url}</SheetDescription></SheetHeader><div className="space-y-6 px-4 py-5">
    <section><h2 className="text-sm font-semibold">密钥变体</h2><p className="mt-1 text-xs text-muted-foreground">同一上游地址可以保留多个独立密钥；每个变体单独维护渠道类型、倍率、模型和健康状态。</p><dl className="mt-3 divide-y border-y text-sm">{[
      ['逻辑 ID', channel.id], ['API 密钥', `已登记 · ${channel.credential_fingerprint}`], ['成本倍率', `${formatCostRatio(channel.cost_ratio)} · 仅展示参考`], ['模型范围', channel.models.join('、') || '无'], ['备注', channel.note || '无'],
    ].map(([label, value]) => <div key={label} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-all font-medium">{value}</dd></div>)}</dl></section>
    <section><h2 className="text-sm font-semibold">底层记录</h2><div className="mt-3 divide-y border-y">{channel.physical_records.map((record) => <div key={record.channel_id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto]"><div><strong>{record.kind === 'template' ? '凭据模板' : record.group_name ? `${record.group_name} · 尝试层 ${record.attempt}` : record.kind}</strong><code className="mt-1 block text-xs text-muted-foreground">new-api #{record.channel_id}{record.route_revision ? ` · r${record.route_revision}` : ''}</code></div><span className="text-xs text-muted-foreground">{record.status === 1 ? '启用' : record.status === 3 ? '自动禁用' : '停用'} · {formatTime(record.test_time)}</span></div>)}</div></section>
    <p className="flex items-start gap-2 border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"><LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-primary" />服务只保存不可逆指纹，明文密钥不会进入浏览器存储、查询缓存或变更记录。</p>
    <ModelOperationsPanel channel={channel} />
  </div><SheetFooter className="border-t sm:flex-row sm:justify-between"><Button variant="outline" onClick={onToggle}>{channel.enabled ? '停用逻辑渠道' : '启用逻辑渠道'}</Button><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onCopy}><Copy />复制渠道</Button><Button variant="outline" onClick={onTest}><FlaskConical />测试模板</Button><Button onClick={onEdit}>编辑元数据</Button></div></SheetFooter></SheetContent></Sheet>
}

function ChannelForm({ channel, copyFrom, open, onOpenChange, onCreated }: { channel: AdminLogicalChannel | null; copyFrom?: AdminLogicalChannel | null; open: boolean; onOpenChange: (open: boolean) => void; onCreated?: (channel: AdminLogicalChannel) => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [channelType, setChannelType] = useState('1')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com')
  const [apiKey, setApiKey] = useState('')
  const [costRatio, setCostRatio] = useState('')
  const [models, setModels] = useState('gpt-4o')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [modelFetchSummary, setModelFetchSummary] = useState('')
  const source = copyFrom ?? channel
  const copying = Boolean(copyFrom)
  useEffect(() => {
    if (!open) return
    setName(copyFrom ? `${copyFrom.name} · 副本` : channel?.name ?? '')
    setChannelType(String(source?.channel_type ?? 1))
    setBaseUrl(source?.base_url ?? 'https://api.openai.com')
    setApiKey('')
    setCostRatio(source?.cost_ratio?.toString() ?? '')
    setModels(source?.models.join(', ') ?? 'gpt-4o')
    setNote(source?.note ?? '')
    setError('')
    setModelFetchSummary('')
  }, [channel, copyFrom, open, source])
  const discover = useMutation({
    mutationFn: () => discoverAdminChannelModelsPreview({ channel_type: Number(channelType), base_url: baseUrl.trim(), api_key: apiKey }),
    onSuccess: (response: { success: boolean; message?: string; data: AdminModelDiscoveryPreview }) => {
      if (!response.success) throw new Error(response.message || '获取模型失败')
      const nextModels = response.data.models.map((item) => item.id)
      setModels(nextModels.join(', '))
      setModelFetchSummary(response.data.status === 'partial' ? `已获取 ${nextModels.length} 个模型（上游返回部分结果）` : `已获取 ${nextModels.length} 个模型`)
      toast.success(response.data.status === 'partial' ? `已获取 ${nextModels.length} 个模型（部分结果）` : `已获取 ${nextModels.length} 个模型`)
    },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const mutation = useMutation({
    mutationFn: async (runTest: boolean) => {
      if (channel) {
        const response = await updateAdminChannel(channel.id, { name: name.trim(), cost_ratio: costRatio ? Number(costRatio) : null, note: note.trim() })
        return { response, testStarted: false, testError: null }
      }
      const inputModels = models.split(',').map((item) => item.trim()).filter(Boolean)
      const response = copying && copyFrom
        ? await copyAdminChannel(copyFrom.id, { name: name.trim(), channel_type: Number(channelType), base_url: baseUrl.trim(), api_key: apiKey, cost_ratio: costRatio ? Number(costRatio) : null, models: inputModels, note: note.trim() })
        : await createAdminChannel({ name: name.trim(), channel_type: Number(channelType), base_url: baseUrl.trim(), api_key: apiKey, cost_ratio: costRatio ? Number(costRatio) : null, models: inputModels, note: note.trim() })
      if (!response.success) throw new Error(response.message || '保存失败')
      let createdChannel = response.data
      let testStarted = false
      let testError: string | null = null
      if (runTest) {
        try {
          const testResponse = await startAdminModelTest(response.data.id, inputModels.slice(0, 100))
          if (testResponse.success) {
            testStarted = true
            createdChannel = { ...response.data, latest_model_test: testResponse.data }
          } else {
            testError = testResponse.message || '模型测试未启动'
          }
        } catch (cause) {
          testError = errorMessage(cause)
        }
      }
      return { response: { ...response, data: createdChannel }, testStarted, testError }
    },
    onSuccess: async ({ response, testStarted, testError }) => {
      if (!response.success) throw new Error(response.message || '保存失败')
      setApiKey('')
      await queryClient.invalidateQueries({ queryKey })
      if (channel) toast.success('渠道元数据已保存')
      else if (copying && !testStarted && !testError) toast.success('渠道副本已创建')
      else if (testError) toast.warning(`渠道已创建，但模型测试未启动：${testError}`)
      else if (testStarted) toast.success('渠道已创建，模型测试已开始')
      else toast.success('逻辑渠道与禁用模板已创建')
      if (!channel) onCreated?.(response.data)
      onOpenChange(false)
    },
    onError: (cause) => setError(errorMessage(cause)),
  })
  const submit = (event: FormEvent | undefined, runTest = false) => {
    event?.preventDefault()
    setError('')
    if (!name.trim()) return setError('请填写显示名称。')
    if (costRatio && !/^\d+(?:\.\d{1,3})?$/.test(costRatio.trim())) return setError('成本倍率必须是非负数，最多三位小数。')
    if (!channel && (!apiKey || !models.split(',').some((item) => item.trim()))) return setError('请填写 API 密钥和至少一个模型。')
    mutation.mutate(runTest)
  }
  return <Sheet open={open} onOpenChange={(next) => { if (!next) setApiKey(''); onOpenChange(next) }}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader className="border-b"><SheetTitle>{channel ? '编辑渠道元数据' : copying ? '复制渠道' : '新建逻辑渠道'}</SheetTitle><SheetDescription>{channel ? '身份、凭据和模型变更需要单独轮换，本表单只修改非敏感元数据。' : copying ? '已复制非敏感配置；请输入新密钥。新副本会作为独立密钥变体保存。' : '保存后创建不参与用户路由的禁用凭据模板。'}</SheetDescription></SheetHeader><form className="grid gap-5 px-4 py-5" onSubmit={submit}>
    <div className="grid gap-2"><Label htmlFor="admin-channel-name">显示名称</Label><Input id="admin-channel-name" value={name} onChange={(event) => setName(event.target.value)} /></div>
    {!channel ? <><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>渠道类型</Label><Select value={channelType} onValueChange={setChannelType}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{channelTypes.map((type) => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="admin-channel-ratio">成本倍率</Label><Input id="admin-channel-ratio" type="number" min="0" step="0.001" value={costRatio} onChange={(event) => setCostRatio(event.target.value)} placeholder="例如 1.125" /></div></div>
    <div className="grid gap-2"><Label htmlFor="admin-channel-url">API 地址</Label><Input id="admin-channel-url" type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} autoComplete="url" /><p className="text-xs text-muted-foreground">New API 会自动补充 <code>/v1/models</code>，地址不要以 <code>/v1</code> 结尾。</p></div>
    <div className="grid gap-2"><Label htmlFor="admin-channel-key">API 密钥</Label><Input id="admin-channel-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="new-password" /><p className="text-xs text-muted-foreground">仅在本次提交内存中使用，不写入浏览器存储。</p></div>
    <div className="grid gap-2"><Label htmlFor="admin-channel-models">模型范围</Label><div className="flex min-w-0 flex-col gap-2 sm:flex-row"><Input id="admin-channel-models" value={models} onChange={(event) => { setModels(event.target.value); setModelFetchSummary('') }} placeholder="先获取模型，或使用英文逗号分隔" /><Button type="button" variant="outline" className="shrink-0" onClick={() => discover.mutate()} disabled={discover.isPending || mutation.isPending || !apiKey.trim() || !baseUrl.trim()}>{discover.isPending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}从渠道获取</Button></div><p className="text-xs text-muted-foreground">模型密钥仅转发给 Admin API，用于调用 New API 的模型获取接口，不会保存。</p>{modelFetchSummary ? <p className="text-xs text-success">{modelFetchSummary}</p> : null}</div></> : <div className="grid gap-2"><Label htmlFor="admin-channel-ratio">成本倍率</Label><Input id="admin-channel-ratio" type="number" min="0" step="0.001" value={costRatio} onChange={(event) => setCostRatio(event.target.value)} placeholder="例如 1.125" /></div>}
    <div className="grid gap-2"><Label htmlFor="admin-channel-note">备注</Label><Textarea id="admin-channel-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={255} /></div>
    {error ? <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>{!channel ? <Button type="button" variant="outline" onClick={() => submit(undefined, true)} disabled={mutation.isPending || discover.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <FlaskConical />}{copying ? '创建副本并测试' : '创建并测试'}</Button> : null}<Button type="submit" disabled={mutation.isPending || discover.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Check />}{channel ? '保存元数据' : copying ? '创建副本' : '创建渠道'}</Button></div>
  </form></SheetContent></Sheet>
}

function ChannelsView({ data }: { data: AdminBootstrap }) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<AdminLogicalChannel | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminLogicalChannel | null>(null)
  const [copying, setCopying] = useState<AdminLogicalChannel | null>(null)
  const [expandedUpstreams, setExpandedUpstreams] = useState<Record<string, boolean>>({})
  useEffect(() => {
    if (!selected) return
    const refreshed = data.channels.find((channel) => channel.id === selected.id)
    if (refreshed) setSelected(refreshed)
  }, [data.channels, selected?.id])
  const visible = useMemo(() => data.channels.filter((channel) => {
    const matchesStatus = status === 'all' || channel.status === status
    const text = `${channel.name} ${channel.id} ${channel.base_url} ${channelTypeName(channel.channel_type)}`.toLowerCase()
    return matchesStatus && text.includes(query.trim().toLowerCase())
  }), [data.channels, query, status])
  const upstreamGroups = useMemo(() => {
    const groups = new Map<string, { key: string; baseUrl: string; channels: AdminLogicalChannel[] }>()
    for (const channel of visible) {
      const key = channel.upstream_key || channel.base_url
      const group = groups.get(key) || { key, baseUrl: channel.base_url, channels: [] }
      group.channels.push(channel)
      groups.set(key, group)
    }
    return [...groups.values()]
  }, [visible])
  const allUpstreamCount = useMemo(() => new Set(data.channels.map((channel) => channel.upstream_key || channel.base_url)).size, [data.channels])
  const groupStateKey = upstreamGroups.map((group) => group.key).join('|')
  useEffect(() => {
    setExpandedUpstreams((current) => {
      const next = { ...current }
      let changed = false
      for (const group of upstreamGroups) {
        if (!(group.key in next)) {
          next[group.key] = true
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [groupStateKey])
  const operation = useMutation({
    mutationFn: async (input: { channel: AdminLogicalChannel; kind: 'test' | 'status' }) => input.kind === 'test' ? testAdminChannel(input.channel.id) : setAdminChannelStatus(input.channel.id, !input.channel.enabled),
    onSuccess: async (_, input) => { await queryClient.invalidateQueries({ queryKey }); toast.success(input.kind === 'test' ? '渠道测试已完成' : '逻辑渠道状态已更新'); setSheetOpen(false) },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  return <div className="space-y-6"><PageHeading eyebrow="ADMIN / CHANNELS" title="渠道" description="按上游地址归组查看，每个密钥仍作为独立渠道维护倍率、类型、模型和路由。明文密钥只在创建请求内存中出现。" action={<Button onClick={() => { setEditing(null); setCopying(null); setFormOpen(true) }}><Plus />新建逻辑渠道</Button>} />
    <MetricBelt items={[{ label: '上游地址', value: String(allUpstreamCount), detail: '按规范化地址归组' }, { label: '密钥变体', value: String(data.channels.length), detail: '每个变体独立路由' }, { label: '可用', value: String(data.channels.filter((item) => item.status === 'available').length), detail: '配置一致且路由启用', tone: 'success' }, { label: '底层记录', value: String(data.channels.reduce((sum, item) => sum + item.record_count, 0)), detail: '模板、路由与归档' }, { label: '倍率未登记', value: String(data.channels.filter((item) => item.cost_ratio == null).length), detail: '不影响现有计费' }]} />
    <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="搜索渠道" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称、逻辑 ID 或 API 地址" className="ps-9" /></label><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-40" aria-label="渠道状态"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="available">可用</SelectItem><SelectItem value="partial">部分异常</SelectItem><SelectItem value="unavailable">不可用</SelectItem><SelectItem value="disabled">已停用</SelectItem><SelectItem value="unknown">未知</SelectItem></SelectContent></Select></div>
    <section className="overflow-hidden border bg-card"><div className="hidden overflow-x-auto md:block"><Table><TableHeader><TableRow><TableHead>状态</TableHead><TableHead>密钥变体</TableHead><TableHead>API 地址</TableHead><TableHead>成本倍率</TableHead><TableHead>路由</TableHead><TableHead>最近测试</TableHead><TableHead className="text-end">操作</TableHead></TableRow></TableHeader><TableBody>{upstreamGroups.flatMap((group) => {
      const expanded = expandedUpstreams[group.key] ?? true
      const types = [...new Set(group.channels.map((channel) => channelTypeName(channel.channel_type)))]
      const ratios = [...new Set(group.channels.map((channel) => formatCostRatio(channel.cost_ratio)))]
      const header = <TableRow key={`upstream-${group.key}`} className="bg-muted/30"><TableCell colSpan={7} className="p-0"><button type="button" className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-start" aria-expanded={expanded} onClick={() => setExpandedUpstreams((current) => ({ ...current, [group.key]: !expanded }))}><ChevronRight className={`size-4 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} /><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">上游</span><code className="min-w-0 max-w-full truncate text-sm font-medium">{group.baseUrl}</code><Badge variant="secondary">{group.channels.length} 个密钥</Badge><span className="text-xs text-muted-foreground">{types.join(' / ')} · 倍率 {ratios.join(' / ')}</span></button></TableCell></TableRow>
      const rows = expanded ? group.channels.map((channel) => <TableRow key={channel.id} className="cursor-pointer" onClick={() => { setSelected(channel); setSheetOpen(true) }}><TableCell><StatusBadge status={channel.status} /></TableCell><TableCell><div className="ps-5"><strong>{channel.name}</strong><code className="mt-1 block max-w-44 truncate text-xs text-muted-foreground">{channel.id}</code><span className="mt-1 block text-xs text-muted-foreground">{channelTypeName(channel.channel_type)} · {channel.models.length} 个模型</span></div></TableCell><TableCell className="max-w-72 truncate text-muted-foreground">{channel.base_url}</TableCell><TableCell className="font-mono">{formatCostRatio(channel.cost_ratio)}</TableCell><TableCell>{channel.groups} 组 · {channel.attempt_layers} 层 · {channel.record_count} 条</TableCell><TableCell><span className="block">{formatTime(channel.latest_test_time)}</span><span className="text-xs text-muted-foreground">{channel.response_time ? `${channel.response_time} ms` : '无延迟数据'}</span></TableCell><TableCell className="text-end" onClick={(event) => event.stopPropagation()}><div className="flex justify-end gap-1"><IconButton label="查看详情" icon={Eye} onClick={() => { setSelected(channel); setSheetOpen(true) }} /><IconButton label="复制渠道" icon={Copy} onClick={() => { setCopying(channel); setEditing(null); setFormOpen(true) }} /></div></TableCell></TableRow>) : []
      return [header, ...rows]
    })}</TableBody></Table></div>
      <div className="divide-y md:hidden">{upstreamGroups.flatMap((group) => { const expanded = expandedUpstreams[group.key] ?? true; const header = <button key={`upstream-mobile-${group.key}`} type="button" className="flex w-full min-w-0 items-center gap-2 bg-muted/30 px-4 py-3 text-start" aria-expanded={expanded} onClick={() => setExpandedUpstreams((current) => ({ ...current, [group.key]: !expanded }))}><ChevronRight className={`size-4 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} /><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-muted-foreground">上游 · {group.channels.length} 个密钥</span><code className="mt-1 block truncate text-xs">{group.baseUrl}</code></span></button>; const rows = expanded ? group.channels.map((channel) => <button key={channel.id} type="button" className="flex w-full min-w-0 items-start gap-3 p-4 ps-8 text-start" onClick={() => { setSelected(channel); setSheetOpen(true) }}><HealthDot status={channel.status === 'available' ? 'healthy' : channel.status === 'partial' || channel.status === 'unavailable' ? 'warning' : 'unknown'} /><span className="min-w-0 flex-1"><strong className="block truncate">{channel.name}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">{channelTypeName(channel.channel_type)} · {channel.models.length} 个模型 · {formatCostRatio(channel.cost_ratio)}</span><span className="mt-1 block text-xs text-muted-foreground">{channel.groups} 组 · {channel.record_count} 条记录</span></span><ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" /></button>) : []; return [header, ...rows] })}</div>{!visible.length ? <p className="p-10 text-center text-sm text-muted-foreground">没有匹配的逻辑渠道。</p> : null}</section>
    <ChannelSheet channel={selected} open={sheetOpen} onOpenChange={setSheetOpen} onEdit={() => { setEditing(selected); setCopying(null); setSheetOpen(false); setFormOpen(true) }} onCopy={() => { setCopying(selected); setEditing(null); setSheetOpen(false); setFormOpen(true) }} onTest={() => selected && operation.mutate({ channel: selected, kind: 'test' })} onToggle={() => selected && operation.mutate({ channel: selected, kind: 'status' })} />
    <ChannelForm channel={editing} copyFrom={copying} open={formOpen} onOpenChange={setFormOpen} onCreated={(created) => { setCopying(null); setSelected(created); setSheetOpen(true) }} />
  </div>
}

function defaultLayers(): AdminRouteLayer[] {
  return [{ members: [] }]
}

function RoutePreviewDialog({ preview, input, open, onOpenChange, group }: { preview: AdminRoutePreview | null; input: AdminRouteInput; open: boolean; onOpenChange: (open: boolean) => void; group: string }) {
  const queryClient = useQueryClient()
  const execute = useMutation({
    mutationFn: () => executeAdminRoute(group, input),
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || '执行失败')
      await queryClient.invalidateQueries({ queryKey })
      if (response.data.status === 'success') { toast.success(`路由 r${response.data.revision} 已完成`); onOpenChange(false) } else toast.warning('路由变更部分失败，已保留续跑记录')
    },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>保存 {group} 路由</DialogTitle><DialogDescription>新记录先在禁用状态下配置和核对，再启用新修订并停用旧修订。提交过程不是数据库事务。</DialogDescription></DialogHeader>{preview ? <div className="space-y-5"><MetricBelt items={[{ label: '新建并配置', value: String(preview.summary.create_and_configure), detail: '禁用状态准备' }, { label: '启用新记录', value: String(preview.summary.enable_new), detail: `修订 r${preview.revision}` }, { label: '停用旧记录', value: String(preview.summary.disable_old), detail: '随后标记归档' }, { label: '非标准记录', value: String(preview.summary.nonstandard_untouched), detail: '保持原状', tone: preview.summary.nonstandard_untouched ? 'warning' : undefined }, { label: '执行步骤', value: String(preview.steps.length), detail: '失败后可续跑' }]} /><div className="max-h-60 divide-y overflow-y-auto border-y">{preview.steps.map((step, index) => <div key={`${step.action}-${index}`} className="flex items-center gap-3 py-3 text-sm"><span className="flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs">{index + 1}</span><span>{step.label}</span></div>)}</div>{preview.nonstandard_channels.length ? <p className="border border-warning/30 bg-warning/5 p-3 text-sm text-warning"><TriangleAlert className="me-2 inline size-4" />目标分组中有 {preview.nonstandard_channels.length} 条非标准记录，本次不会修改它们。</p> : null}</div> : null}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button onClick={() => execute.mutate()} disabled={!preview || execute.isPending}>{execute.isPending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}{execute.isPending ? '执行中' : '开始执行'}</Button></DialogFooter></DialogContent></Dialog>
}

function RoutesView({ data }: { data: AdminBootstrap }) {
  const firstGroup = data.routes.find((route) => data.groups.includes(route.group_name))?.group_name ?? data.groups[0] ?? ''
  const [group, setGroup] = useState(firstGroup)
  const [layers, setLayers] = useState<AdminRouteLayer[]>(defaultLayers)
  const [acknowledge, setAcknowledge] = useState(false)
  const [preview, setPreview] = useState<AdminRoutePreview | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  useEffect(() => { if (!group && firstGroup) setGroup(firstGroup) }, [firstGroup, group])
  const storedRoute = data.routes.find((route) => route.group_name === group)
  useEffect(() => { setLayers(storedRoute?.config.layers?.length ? structuredClone(storedRoute.config.layers) : defaultLayers()); setAcknowledge(false) }, [group, storedRoute?.revision])
  const used = new Set(layers.flatMap((layer) => layer.members.map((member) => member.logical_id)))
  const input: AdminRouteInput = { layers, acknowledge_nonstandard: acknowledge }
  const dirty = JSON.stringify(layers) !== JSON.stringify(storedRoute?.config.layers ?? defaultLayers())
  const previewMutation = useMutation({
    mutationFn: () => previewAdminRoute(group, input),
    onSuccess: (response) => { if (!response.success) throw new Error(response.message || '预览失败'); setPreview(response.data); setPreviewOpen(true) },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const setWeight = (attempt: number, logicalId: string, value: string) => setLayers((current) => current.map((layer, index) => index === attempt ? { members: layer.members.map((member) => member.logical_id === logicalId ? { ...member, weight: Math.max(1, Number(value) || 1) } : member) } : layer))
  const addMember = (attempt: number, logicalId: string) => { if (!logicalId || used.has(logicalId)) return; setLayers((current) => current.map((layer, index) => index === attempt ? { members: [...layer.members, { logical_id: logicalId, weight: 100 }] } : layer)) }
  const removeMember = (attempt: number, logicalId: string) => setLayers((current) => current.map((layer, index) => index === attempt ? { members: layer.members.filter((member) => member.logical_id !== logicalId) } : layer))
  const valid = Boolean(group) && layers.length > 0 && layers.every((layer) => layer.members.length > 0)
  const nonstandard = data.monitor?.summary.nonstandard_records ?? 0
  return <div className="space-y-6"><PageHeading eyebrow="ADMIN / ROUTING" title="分组路由" description="每个尝试层是按相对权重选择的候选池。失败后进入下一层，不承诺同层渠道之间的固定顺序。" action={<Button disabled={!dirty || !valid || previewMutation.isPending} onClick={() => previewMutation.mutate()}>{previewMutation.isPending ? <LoaderCircle className="animate-spin" /> : <ClipboardCheck />}预览变更</Button>} />
    <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between"><div><Label>目标分组</Label><p className="mt-1 text-xs text-muted-foreground">分组及倍率继续由 new-api 其他页面维护。</p></div><Select value={group} onValueChange={setGroup}><SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="选择分组" /></SelectTrigger><SelectContent>{data.groups.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
    <MetricBelt items={[{ label: '当前分组', value: group || '无', detail: '单个 new-api 实例' }, { label: '尝试层', value: String(layers.length), detail: `最多 ${data.retry_times + 1} 层` }, { label: '候选渠道', value: String(used.size), detail: '不可跨层重复' }, { label: '当前修订', value: storedRoute ? `r${storedRoute.revision}` : '未配置', detail: storedRoute ? formatTime(storedRoute.updated_at) : '保存后生成 r1' }, { label: '状态', value: dirty ? '有未保存变更' : '已同步', detail: dirty ? '预览后执行' : storedRoute?.updated_by || '无' }]} />
    <div className="space-y-4">{layers.map((layer, attempt) => { const total = layer.members.reduce((sum, member) => sum + member.weight, 0); return <section key={attempt} className="border bg-card"><header className="flex items-center justify-between border-b p-4"><div><span className="font-mono text-xs text-muted-foreground">P{1000 - attempt * 100}</span><h2 className="font-semibold">{attempt === 0 ? '初次尝试' : `第 ${attempt} 次重试`}</h2></div>{layers.length > 1 ? <IconButton label="移除尝试层" icon={Trash2} onClick={() => setLayers((current) => current.filter((_, index) => index !== attempt))} /> : null}</header><div className="divide-y">{layer.members.map((member) => { const channel = data.channels.find((item) => item.id === member.logical_id); return <div key={member.logical_id} className="flex flex-wrap items-center gap-3 p-4"><div className="flex min-w-0 flex-1 items-center gap-3"><StatusBadge status={channel?.status ?? 'unknown'} /><span className="min-w-0 truncate text-sm font-medium">{channel?.name ?? member.logical_id}</span></div><label className="flex items-center gap-2 text-xs text-muted-foreground">权重 <Input type="number" min="1" max="1000000" value={member.weight} className="h-8 w-24 font-mono" onChange={(event) => setWeight(attempt, member.logical_id, event.target.value)} /><span className="w-12 text-end font-mono text-foreground">{total ? Math.round(member.weight / total * 100) : 0}%</span></label><IconButton label="移除渠道" icon={Trash2} onClick={() => removeMember(attempt, member.logical_id)} /></div>})}</div><div className="border-t bg-muted/20 p-3"><Select value="" onValueChange={(value) => addMember(attempt, value)}><SelectTrigger className="w-full"><SelectValue placeholder="添加逻辑渠道" /></SelectTrigger><SelectContent>{data.channels.filter((channel) => channel.enabled && !used.has(channel.id)).map((channel) => <SelectItem key={channel.id} value={channel.id}>{channel.name} · {channel.models.length} 个模型</SelectItem>)}</SelectContent></Select></div></section> })}</div>
    <div className="flex flex-col gap-3 border-y py-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-sm">非标准记录</strong><p className="mt-1 text-xs text-muted-foreground">当前实例检测到 {nonstandard} 条非标准物理记录，目标分组命中时预览会再次确认。</p></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={acknowledge} onCheckedChange={(checked) => setAcknowledge(checked === true)} />我已核对并保留非标准记录</label></div>
    <div className="flex justify-end"><Button variant="outline" disabled={layers.length >= data.retry_times + 1} onClick={() => setLayers((current) => [...current, { members: [] }])}><Plus />添加重试层</Button></div>
    <RoutePreviewDialog preview={preview} input={input} group={group} open={previewOpen} onOpenChange={setPreviewOpen} />
  </div>
}

function MonitoringView({ data }: { data: AdminBootstrap }) {
  const queryClient = useQueryClient()
  const monitor = data.monitor
  const summary = monitor?.summary
  const refresh = useMutation({ mutationFn: refreshAdminMonitor, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); toast.success('监控快照已刷新') }, onError: (cause) => toast.error(errorMessage(cause)) })
  const records = monitor?.details.physical_records ?? []
  const issues = monitor?.details.issues ?? []
  return <div className="space-y-6"><PageHeading eyebrow="ADMIN / MONITORING" title="监控" description="持续核对物理渠道状态、路由字段和最近 24 小时渠道尝试。测试延迟只是最近快照，不是实时 SLA。" action={<Button variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending}>{refresh.isPending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}刷新</Button>} />
    <MetricBelt items={[{ label: '最近同步', value: monitor ? formatTime(monitor.observed_at) : '未同步', detail: monitor?.status === 'healthy' ? '后台监控正常' : monitor?.error || '等待首个快照', tone: monitor?.status === 'healthy' ? 'success' : 'warning' }, { label: '路由记录', value: String(summary?.route_records ?? 0), detail: `${summary?.enabled_route_records ?? 0} 条启用` }, { label: '自动禁用', value: String(summary?.auto_disabled_records ?? 0), detail: '需要人工处理', tone: summary?.auto_disabled_records ? 'warning' : undefined }, { label: '24h 尝试', value: summary?.attempts_24h?.toLocaleString('zh-CN') ?? '暂无数据', detail: '消费 + 错误日志' }, { label: '尝试成功率', value: summary?.success_rate_24h == null ? '暂无数据' : `${summary.success_rate_24h}%`, detail: '不等于最终请求成功率', tone: summary?.success_rate_24h != null && summary.success_rate_24h >= 98 ? 'success' : 'warning' }]} />
    <section className="border bg-card"><header className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">问题队列</h2><p className="mt-1 text-xs text-muted-foreground">监控只报告问题，不自动修改逻辑身份或路由。</p></div><Badge variant="outline" className={issues.length ? 'border-warning/30 text-warning' : 'border-success/30 text-success'}>{issues.length} 项</Badge></header>{issues.length ? <div className="divide-y">{issues.map((issue, index) => <div key={`${issue.kind}-${issue.channel_id}-${index}`} className="flex items-start gap-3 p-4"><HealthDot status="warning" /><div><strong>new-api #{issue.channel_id}</strong><p className="mt-1 text-sm">{issue.message}</p><code className="mt-1 block text-xs text-muted-foreground">{issue.kind}</code></div></div>)}</div> : <p className="p-8 text-center text-sm text-muted-foreground">当前快照没有需要处理的问题。</p>}</section>
    <section className="overflow-hidden border bg-card"><header className="border-b p-4"><h2 className="font-semibold">底层执行记录</h2><p className="mt-1 text-xs text-muted-foreground">包含 Partokens 管理记录和非标准物理渠道。</p></header><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>物理 ID</TableHead><TableHead>类型</TableHead><TableHead>路由实例</TableHead><TableHead>状态</TableHead><TableHead>最近测试</TableHead><TableHead>延迟</TableHead><TableHead>一致性</TableHead></TableRow></TableHeader><TableBody>{records.map((record) => <TableRow key={record.channel_id}><TableCell className="font-mono text-xs">#{record.channel_id}</TableCell><TableCell>{record.kind}</TableCell><TableCell>{record.group_name ? `${record.group_name} · 层 ${record.attempt}` : record.name}</TableCell><TableCell>{record.status === 1 ? '启用' : record.status === 3 ? '自动禁用' : '停用'}</TableCell><TableCell>{formatTime(record.test_time)}</TableCell><TableCell className="font-mono text-xs">{record.response_time ? `${record.response_time} ms` : '暂无数据'}</TableCell><TableCell className={record.drift ? 'text-warning' : 'text-success'}>{record.drift ? '漂移' : record.kind === 'nonstandard' ? '非标准' : '一致'}</TableCell></TableRow>)}</TableBody></Table></div></section>
  </div>
}

function ChangeDialog({ change, open, onOpenChange }: { change: AdminChange | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({ mutationFn: () => continueAdminChange(change!.id), onSuccess: async (response) => { await queryClient.invalidateQueries({ queryKey }); if (response.data.status === 'success') { toast.success('变更已继续并完成'); onOpenChange(false) } else toast.warning('变更仍有未完成步骤') }, onError: (cause) => toast.error(errorMessage(cause)) })
  if (!change) return null
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{change.target} · r{change.revision ?? '-'}</DialogTitle><DialogDescription>{change.actor_name} · {formatTime(change.created_at)} · 多 API 非原子执行</DialogDescription></DialogHeader><div className="max-h-[55svh] divide-y overflow-y-auto border-y">{change.steps.map((step, index) => <div key={`${step.action}-${index}`} className="flex items-start gap-3 py-3"><span className="mt-0.5">{step.status === 'success' ? <CheckCircle2 className="size-4 text-success" /> : step.status === 'failed' ? <TriangleAlert className="size-4 text-warning" /> : step.status === 'running' ? <LoaderCircle className="size-4 animate-spin" /> : <CircleDashed className="size-4 text-muted-foreground" />}</span><div><strong className="text-sm">{step.label}</strong><p className="mt-1 text-xs text-muted-foreground">{step.error || copy.stepStatus[step.status]}</p></div></div>)}</div>{change.error ? <p role="alert" className="border border-warning/30 bg-warning/5 p-3 text-sm text-warning">{change.error}</p> : null}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>{change.status === 'partial' ? <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}继续执行</Button> : null}</DialogFooter></DialogContent></Dialog>
}

function ChangesView({ data }: { data: AdminBootstrap }) {
  const [selected, setSelected] = useState<AdminChange | null>(null)
  const [open, setOpen] = useState(false)
  return <div className="space-y-6"><PageHeading eyebrow="ADMIN / CHANGES" title="变更记录" description="每个底层步骤在执行前持久化。失败后保留结果并从未完成步骤继续，不保存密钥明文。" />
    <MetricBelt items={[{ label: '全部变更', value: String(data.changes.length), detail: '最近 50 条' }, { label: '执行成功', value: String(data.changes.filter((item) => item.status === 'success').length), detail: '全部步骤完成', tone: 'success' }, { label: '部分失败', value: String(data.changes.filter((item) => item.status === 'partial').length), detail: '可继续执行', tone: 'warning' }, { label: '执行中', value: String(data.changes.filter((item) => item.status === 'running').length), detail: '后台步骤状态' }, { label: '最新修订', value: data.routes.length ? `r${Math.max(...data.routes.map((route) => route.revision))}` : '无', detail: '按分组独立递增' }]} />
    <section className="overflow-hidden border bg-card">{data.changes.length ? <div className="divide-y">{data.changes.map((change) => <article key={change.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start"><span className="mt-0.5">{change.status === 'success' ? <CheckCircle2 className="size-5 text-success" /> : change.status === 'partial' ? <TriangleAlert className="size-5 text-warning" /> : <LoaderCircle className="size-5 animate-spin" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><code className="text-xs text-muted-foreground">{change.id.slice(0, 14)}</code><h2 className="font-semibold">{change.target} · r{change.revision ?? '-'}</h2><Badge variant="outline" className={change.status === 'success' ? 'border-success/30 text-success' : 'border-warning/30 text-warning'}>{change.status === 'success' ? '已完成' : change.status === 'partial' ? '部分失败' : '执行中'}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{formatTime(change.created_at)} · {change.actor_name} · {change.steps.filter((step) => step.status === 'success').length}/{change.steps.length} 步完成</p></div><Button variant="outline" size="sm" onClick={() => { setSelected(change); setOpen(true) }}><Eye />查看步骤</Button></article>)}</div> : <p className="p-10 text-center text-sm text-muted-foreground">还没有管理员渠道变更。</p>}</section>
    <ChangeDialog change={selected} open={open} onOpenChange={setOpen} />
  </div>
}

export function AdminOperationsPage({ page }: { page: AdminPage }) {
  const query = useAdminBootstrap()
  if (query.isPending) return <AdminLoading />
  if (query.isError || !query.data) return <AdminUnavailable retry={() => void query.refetch()} message={errorMessage(query.error)} />
  if (page === 'channels') return <ChannelsView data={query.data} />
  if (page === 'routes') return <RoutesView data={query.data} />
  if (page === 'monitoring') return <MonitoringView data={query.data} />
  return <ChangesView data={query.data} />
}

export function AdminChannelsPage() { return <AdminOperationsPage page="channels" /> }
export function AdminRoutesPage() { return <AdminOperationsPage page="routes" /> }
export function AdminMonitoringPage() { return <AdminOperationsPage page="monitoring" /> }
export function AdminChangesPage() { return <AdminOperationsPage page="changes" /> }
