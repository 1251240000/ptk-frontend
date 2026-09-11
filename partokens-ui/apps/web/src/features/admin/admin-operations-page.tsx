import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  CircleDashed,
  Clock3,
  Eye,
  Pencil,
  Power,
  FlaskConical,
  Layers3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import {
  continueAdminChange,
  cancelAdminModelTest,
  copyAdminChannel,
  createAdminChannel,
  deleteAdminChannel,
  discoverAdminChannelModels,
  executeAdminModelRemoval,
  executeAdminModelUpdate,
  getAdminModelTest,
  getAdminBootstrap,
  previewAdminModelRemoval,
  previewAdminModelUpdate,
  refreshAdminMonitor,
  setAdminChannelStatus,
  startAdminModelTest,
  updateAdminChannel,
  discoverAdminChannelModelsPreview,
  type AdminBootstrap,
  type AdminChange,
  type AdminLogicalChannel,
  type AdminModelDiscovery,
  type AdminModelDiscoveryPreview,
  type AdminModelRemovePreview,
  type AdminModelTestTask,
  type AdminModelTestResult,
  type AdminMonitorSnapshot,
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
import { ChannelProviderIcon } from './channel-provider-icon'
import { GroupRoutesView } from './group-routes-view'

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
  if (status === 'untested') return '未测试'
  if (status === 'running' || status === 'pending') return '测试中'
  if (status === 'available') return '可用'
  return '异常'
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] font-semibold text-muted-foreground">{eyebrow}</span><Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary"><ShieldCheck />仅 Root</Badge></div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {description ? <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
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

function IconButton({ label, icon: Icon, onClick, disabled, className = '' }: { label: string; icon: LucideIcon; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className={`size-8 ${className}`} aria-label={label} disabled={disabled} onClick={onClick}><Icon /></Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
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
    refetchInterval: (query) => query.state.data?.channels.some((channel) => ['pending', 'running'].includes(channel.latest_model_test?.status ?? '')) ? 2000 : 60_000,
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
  preview, open, onOpenChange, onExecute, executing, change, error,
}: {
  preview: AdminModelRemovePreview | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onExecute: () => void
  executing: boolean
  change?: AdminChange | null
  error: string
}) {
  const adding = Boolean(preview?.add_models?.length)
  return <Dialog open={open} onOpenChange={(next) => { if (!executing) onOpenChange(next) }}>
    <DialogContent className="flex max-h-[calc(100svh-2rem)] max-w-[calc(100%-2rem)] flex-col sm:max-w-3xl">
      <DialogHeader className="shrink-0"><DialogTitle>{adding ? '确认更新模型' : '移除不可用模型'}</DialogTitle><DialogDescription>{adding ? '将选中的新模型加入渠道配置，并同步已绑定的渠道记录。已有模型会保留。' : '将移除以下异常模型，包括超时、限流、认证失败及其他异常。可用、未测试和测试中的模型会保留。'}</DialogDescription></DialogHeader>
      {preview ? <div className="min-h-0 max-h-[60svh] space-y-4 overflow-y-auto text-xs">
        <p>{adding ? `将新增 ${preview.add_models!.length} 个，更新后共 ${preview.retain_models.length} 个模型。` : `将移除 ${preview.remove_models.length} 个，保留 ${preview.retain_models.length} 个模型。`}</p>
        {adding ? <div className="divide-y border-y">{preview.add_models!.map((model) => <p key={model} className="break-all py-2 font-mono">{model}</p>)}</div> : null}
        <div className="divide-y border-y">{preview.failure_reasons.map((item) => <div key={item.model} className="grid gap-1 py-2"><code className="break-all font-medium">{item.model}</code><span className="text-muted-foreground">{item.reason}</span></div>)}</div>
        <details><summary className="cursor-pointer font-medium">配置影响与执行步骤</summary>
          <p className="mt-2 break-all text-muted-foreground">保留：{preview.retain_models.join('、') || '无'}</p>
          <p className="mt-2">模型清单{preview.modifies_models ? '会修改' : '不变'}，模型映射{preview.modifies_model_mapping ? '会修改' : '不变'}</p>
          <div className="mt-2 divide-y">{preview.physical_records.map((record) => <div key={record.channel_id} className="py-2"><strong className="break-all">{record.name}</strong><p className="mt-1 text-muted-foreground">#{record.channel_id} · {record.before_models.length} → {record.after_models.length} 个模型 · 映射{record.mapping_changed ? '会更新' : '不变'}</p></div>)}</div>
          <ol className="mt-2 space-y-1">{(change?.steps ?? preview.steps).map((step, index) => <li key={index} className="break-words">{index + 1}. {step.label} · {step.status === 'success' ? '已完成' : step.status === 'failed' ? '失败' : step.status === 'running' ? '执行中' : '待执行'}</li>)}</ol>
        </details>
        <p className="text-warning">变更记录保留修改前的配置。部分失败时可继续执行，全部核对通过后才会完成{adding ? '更新' : '移除'}。</p>
        {change?.status === 'partial' ? <p role="status" className="break-words text-warning">{adding ? '更新' : '移除'}部分完成：{change.error || '部分记录尚未更新'}。渠道模型配置尚未确认同步。</p> : null}
        {error ? <p role="alert" className="break-words text-destructive">{error}</p> : null}
      </div> : null}
      <DialogFooter className="shrink-0"><Button variant="outline" disabled={executing} onClick={() => onOpenChange(false)}>取消</Button><Button variant={adding ? 'default' : 'destructive'} onClick={onExecute} disabled={!preview || executing || Boolean(error && !change)}>{executing ? <LoaderCircle className="animate-spin" /> : adding ? <Check /> : <Trash2 />}{executing ? '执行中' : change ? '重试未完成步骤' : adding ? '确认更新' : '确认移除'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}

function ModelOperationsPanel({ channel }: { channel: AdminLogicalChannel }) {
  const queryClient = useQueryClient()
  const [discovery, setDiscovery] = useState<AdminModelDiscovery | null>(channel.model_discovery ?? null)
  const [selectedModels, setSelectedModels] = useState<string[]>(channel.models)
  const [modelFilter, setModelFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [task, setTask] = useState<AdminModelTestTask | null>(null)
  const [submittingModels, setSubmittingModels] = useState<string[]>([])
  const [preview, setPreview] = useState<AdminModelRemovePreview | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeError, setRemoveError] = useState('')
  const [removal, setRemoval] = useState<AdminChange | null>(null)
  const [hiddenModels, setHiddenModels] = useState<string[]>([])
  const taskId = task?.id ?? channel.latest_model_test?.id
  const taskQuery = useQuery({
    queryKey: ['admin-model-test', taskId],
    queryFn: async ({ signal }) => {
      const response = await getAdminModelTest(taskId!, signal)
      if (!response.success) throw new Error(response.message || '测试任务不可用')
      return response.data
    },
    enabled: Boolean(taskId),
    refetchInterval: (query) => ['pending', 'running'].includes(query.state.data?.status ?? 'pending') ? 1000 : false,
  })
  const currentTask = taskQuery.data ?? task ?? channel.latest_model_test
  useEffect(() => {
    if (task && channel.latest_model_test?.id === task.id) setTask(null)
  }, [channel.latest_model_test?.id, task])
  useEffect(() => {
    if (taskQuery.data && !['pending', 'running'].includes(taskQuery.data.status)) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }, [taskQuery.data, queryClient])
  const discoveredModels = useMemo(() => [...new Set([...channel.models, ...(discovery?.models ?? []).map((item) => item.id)])].filter((model) => !hiddenModels.includes(model)), [channel.models, discovery, hiddenModels])
  const results = channelModelResults(channel, currentTask)
  for (const model of submittingModels) results.set(model, { model_id: model, name: model, status: 'running' })
  const running = ['pending', 'running'].includes(currentTask?.status ?? channel.latest_model_test?.status ?? '')
  const pendingRemoval = (removal && !['success', 'cancelled'].includes(removal.status) ? removal : null) ?? queryClient.getQueryData<AdminBootstrap>(queryKey)?.changes.find((change) => ['model_remove', 'model_update'].includes(change.kind) && change.target === channel.id && !['success', 'cancelled'].includes(change.status))
  const activeRemoval = pendingRemoval && !['success', 'cancelled'].includes(pendingRemoval.status) ? pendingRemoval : undefined
  const visibleModels = discoveredModels.filter((model) => {
    const status = modelTagState(results.get(model)).tone
    return model.toLowerCase().includes(search.toLowerCase()) && (modelFilter === 'all' || status === modelFilter)
  })
  const selected = selectedModels.filter((model) => discoveredModels.includes(model))
  const candidates = discoveredModels.filter((model) => modelTagState(results.get(model)).tone === 'failed')
  const additions = selected.filter((model) => !channel.models.includes(model) && results.get(model)?.status !== 'unavailable')
  const [modelNotice, setModelNotice] = useState('')
  const discover = useMutation({
    mutationFn: () => discoverAdminChannelModels(channel.id),
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || '获取模型失败')
      setDiscovery(response.data)
      setHiddenModels([])
      setSelectedModels((current) => [...new Set([...current, ...response.data.models.map((item) => item.id)])])
      setModelNotice('')
      if (response.data.status === 'success') toast.success(`已获取 ${response.data.models.length} 个模型`)
      else toast.warning(modelDiscoveryStatusLabel(response.data.status))
      await queryClient.invalidateQueries({ queryKey })
    },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const test = useMutation({
    mutationFn: (models: string[]) => startAdminModelTest(channel.id, models),
    onMutate: (models) => { setSubmittingModels(models); setModelNotice('') },
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || '测试任务创建失败')
      await queryClient.cancelQueries({ queryKey })
      setTask(response.data)
      queryClient.setQueryData(['admin-model-test', response.data.id], response.data)
      queryClient.setQueryData<AdminBootstrap>(queryKey, (current) => current ? { ...current, channels: current.channels.map((item) => item.id === channel.id ? { ...item, latest_model_test: response.data } : item) } : current)
      setPreview(null)
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (cause) => {
      setModelNotice(errorMessage(cause))
      toast.error(errorMessage(cause))
      void queryClient.invalidateQueries({ queryKey })
    },
    onSettled: () => setSubmittingModels([]),
  })
  const cancel = useMutation({
    mutationFn: () => cancelAdminModelTest(currentTask!.id),
    onSuccess: (response) => {
      if (!response.success) throw new Error(response.message || '取消测试失败')
      setTask(response.data)
      queryClient.setQueryData(['admin-model-test', response.data.id], response.data)
      void queryClient.invalidateQueries({ queryKey: ['admin-model-test', response.data.id] })
    },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const previewMutation = useMutation({
    mutationFn: (models: string[]) => previewAdminModelRemoval(channel.id, models),
    onSuccess: (response) => {
      if (!response.success) throw new Error(response.message || '预览失败')
      setPreview(response.data)
      setRemoveError('')
      setRemoveOpen(true)
    },
    onError: (cause) => { setModelNotice(errorMessage(cause)); toast.error(errorMessage(cause)) },
  })
  const updatePreview = useMutation({
    mutationFn: () => previewAdminModelUpdate(channel.id, additions),
    onSuccess: (response) => {
      if (!response.success) throw new Error(response.message || '更新预览失败')
      setPreview(response.data)
      setRemoveError('')
      setRemoveOpen(true)
    },
    onError: (cause) => { setModelNotice(errorMessage(cause)); toast.error(errorMessage(cause)) },
  })
  const executeMutation = useMutation({
    mutationFn: () => preview?.add_models?.length ? executeAdminModelUpdate(channel.id, preview.add_models, preview.preview_token, activeRemoval?.id) : executeAdminModelRemoval(channel.id, preview?.remove_models, activeRemoval?.id, preview?.preview_token),
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || '移除失败')
      setRemoval(response.data)
      if (response.data.status === 'success') {
        const removed = preview?.remove_models ?? []
        await queryClient.cancelQueries({ queryKey })
        queryClient.setQueryData<AdminBootstrap>(queryKey, (current) => current ? { ...current, changes: current.changes.filter((item) => item.id !== response.data.id), channels: current.channels.map((item) => item.id === channel.id ? { ...item, models: preview?.retain_models ?? item.models.filter((model) => !removed.includes(model)) } : item) } : current)
        setHiddenModels((current) => [...new Set([...current, ...removed])])
        setSelectedModels((current) => current.filter((model) => !removed.includes(model)))
        setRemoveOpen(false)
        toast.success(preview?.add_models?.length ? '渠道模型已更新' : '不可用模型已移除')
      } else toast.warning('变更部分完成，请重试未完成步骤')
      await queryClient.invalidateQueries({ queryKey })
    },
    onError: (cause) => {
      setRemoveError(errorMessage(cause))
      void queryClient.invalidateQueries({ queryKey })
    },
  })
  const busy = test.isPending || running || executeMutation.isPending || previewMutation.isPending || updatePreview.isPending || removeOpen || discover.isPending
  const toggleAll = (checked: boolean) => setSelectedModels((current) => checked ? [...new Set([...current, ...visibleModels])] : current.filter((model) => !visibleModels.includes(model)))
  return <section className="min-w-0 border-t pt-3" aria-label="模型列表">
    <div className="flex flex-wrap gap-2" role="toolbar" aria-label="模型批量操作">
      <Button variant="outline" size="sm" onClick={() => discover.mutate()} disabled={discover.isPending || busy}>{discover.isPending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}获取模型</Button>
      <Button size="sm" onClick={() => test.mutate(selected)} disabled={!selected.length || selected.length > 100 || busy}>{test.isPending || running ? <LoaderCircle className="animate-spin" /> : <FlaskConical />}{test.isPending || running ? '测试中' : '批量测试'}{selected.length ? ` (${selected.length})` : ''}</Button>
      {running ? <Button variant="outline" size="sm" onClick={() => cancel.mutate()} disabled={!currentTask || cancel.isPending || currentTask.cancel_requested}><X />{currentTask?.cancel_requested ? '取消中' : '取消测试'}</Button> : null}
      <Button variant="outline" size="sm" onClick={() => { setModelNotice(''); if (activeRemoval) { setPreview(activeRemoval.plan as AdminModelRemovePreview); setRemoveError(''); setRemoveOpen(true) } else if (candidates.length) previewMutation.mutate(candidates); else setModelNotice('暂无可移除的异常模型。') }} disabled={busy}><Trash2 />移除不可用模型{candidates.length ? ` (${candidates.length})` : ''}</Button>
      <Button size="sm" variant="outline" onClick={() => { if (additions.length) updatePreview.mutate(); else setModelNotice('没有待更新的模型。获取模型后，勾选需要加入渠道的新模型。') }} disabled={busy || Boolean(activeRemoval)}><Check />确认更新模型{additions.length ? ` (${additions.length})` : ''}</Button>
      {activeRemoval ? <Button variant="outline" size="sm" disabled={busy} onClick={() => { setPreview(activeRemoval.plan as AdminModelRemovePreview); setRemoveError(''); setRemoveOpen(true) }}><RefreshCw />{activeRemoval.kind === 'model_update' ? '继续更新' : '继续移除'}</Button> : null}
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Input aria-label="搜索模型" placeholder="搜索模型" value={search} onChange={(event) => setSearch(event.target.value)} className="h-8 min-w-24 flex-1 text-xs" />
      <Select value={modelFilter} onValueChange={setModelFilter}><SelectTrigger className="h-8 w-28 text-xs" aria-label="模型状态筛选"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部模型</SelectItem><SelectItem value="untested">未测试</SelectItem><SelectItem value="running">测试中</SelectItem><SelectItem value="failed">异常</SelectItem><SelectItem value="available">可用</SelectItem></SelectContent></Select>
    </div>
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground"><span>{discoveredModels.length} 个模型 · 已选 {selected.length}</span><span>{modelDiscoveryStatusLabel(discovery?.status)} · {formatTime(discovery?.fetched_at)}</span><span>来源：{modelDiscoverySourceLabel(discovery?.source)}</span></div>
    {selected.length > 100 ? <p className="mt-2 text-xs text-warning">每次最多测试 100 个模型，请减少选择。</p> : null}
    {discovery?.error ? <p role="alert" className="mt-2 break-words text-xs text-warning">{discovery.error}</p> : null}
    {modelNotice ? <p role="status" className="mt-2 break-words text-xs text-warning">{modelNotice}</p> : null}
    {taskQuery.isError ? <p role="alert" className="mt-2 flex items-center gap-2 text-xs text-destructive">测试状态读取失败<IconButton label="重试读取测试状态" icon={RefreshCw} onClick={() => { void taskQuery.refetch() }} /></p> : null}
    {activeRemoval ? <p role="status" className="mt-2 break-words text-xs text-warning">模型{activeRemoval.kind === 'model_update' ? '更新' : '移除'}尚未完成，渠道配置待核对。{activeRemoval.error}</p> : null}
    {test.isPending ? <p role="status" className="mt-3 text-xs text-muted-foreground">测试中 · 正在提交 {submittingModels.length} 个模型</p> : currentTask ? <div className="mt-3 text-xs" role="status"><div className="flex flex-wrap justify-between gap-1"><span>测试进度：{currentTask.completed}/{currentTask.total} · 可用 {currentTask.available_count} · 异常 {currentTask.failed_count}</span><span>{currentTask.status === 'cancelled' ? '已取消' : running ? '测试中' : currentTask.completed < currentTask.total ? '已中断' : '已完成'}</span></div><div role="progressbar" aria-label="模型测试进度" aria-valuenow={currentTask.total ? Math.round(currentTask.completed / currentTask.total * 100) : 0} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-1 overflow-hidden bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${currentTask.total ? currentTask.completed / currentTask.total * 100 : 0}%` }} /></div></div> : null}
    <div role="table" aria-label="模型配置列表" className="mt-3 text-xs">
      <div role="row" className="grid grid-cols-[20px_minmax(0,1fr)_64px] items-center gap-x-2 border-y py-2 text-[10px] text-muted-foreground sm:grid-cols-[20px_minmax(0,1fr)_76px_60px_64px]">
        <span role="columnheader"><Checkbox aria-label="选择当前筛选模型" checked={visibleModels.length > 0 && visibleModels.every((model) => selected.includes(model)) ? true : visibleModels.some((model) => selected.includes(model)) ? 'indeterminate' : false} onCheckedChange={(value) => toggleAll(value === true)} disabled={!visibleModels.length} /></span>
        <span role="columnheader">模型名<span className="sm:hidden"> / 状态 / 延迟</span></span><span role="columnheader" className="hidden sm:block">状态</span><span role="columnheader" className="hidden sm:block">延迟</span><span role="columnheader" className="text-end">操作</span>
      </div>
      {visibleModels.map((model) => {
        const result = results.get(model)
        const state = modelTagState(result)
        const waiting = state.tone === 'running'
        const canRemove = state.tone === 'failed'
        const latency = result?.latency_ms != null ? `${result.latency_ms} ms` : '-'
        return <div role="row" key={model} data-model-row={model} className="grid grid-cols-[20px_minmax(0,1fr)_64px] items-center gap-x-2 gap-y-1 border-b py-2 sm:grid-cols-[20px_minmax(0,1fr)_76px_60px_64px]">
          <span role="cell" className="row-span-2 sm:row-span-1"><Checkbox aria-label={`选择 ${model}`} checked={selected.includes(model)} onCheckedChange={(value) => setSelectedModels((current) => value === true ? [...new Set([...current, model])] : current.filter((item) => item !== model))} /></span>
          <div role="cell" className="min-w-0"><code className="break-all text-[11px]">{model}</code>{!channel.models.includes(model) ? <span className="ml-1 text-[10px] text-muted-foreground">未配置</span> : null}{result?.error ? <p className="mt-1 break-words text-[10px] text-muted-foreground">{result.error}</p> : null}</div>
          <div role="cell" className="col-start-2 row-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto sm:row-start-auto"><span className={`inline-flex items-center gap-1 text-[10px] ${waiting ? 'text-muted-foreground' : (modelTagColors[state.tone] ?? '').split(' ').filter((item) => item.includes('text-')).join(' ')}`}>{waiting ? <LoaderCircle className="size-3 animate-spin" /> : <state.icon className="size-3" />}{waiting ? '测试中' : modelStatusLabel(result?.status ?? 'untested')}</span><span className="font-mono text-[10px] text-muted-foreground sm:hidden">{latency}</span></div>
          <span role="cell" className="hidden font-mono text-[10px] text-muted-foreground sm:block">{latency}</span>
          <div role="cell" className="col-start-3 row-span-2 row-start-1 flex justify-end sm:col-start-auto sm:row-span-1 sm:row-start-auto">
            <IconButton label={`${result && result.status !== 'untested' ? '重试' : '测试'} ${model}`} icon={result && result.status !== 'untested' ? RefreshCw : FlaskConical} onClick={() => test.mutate([model])} disabled={busy} />
            <IconButton label={canRemove ? `移除 ${model}` : `${model} 无异常结果，不能移除`} icon={Trash2} className="text-destructive" onClick={() => previewMutation.mutate([model])} disabled={!canRemove || busy || Boolean(activeRemoval)} />
          </div>
        </div>
      })}
    </div>
    {!visibleModels.length ? <p className="py-6 text-center text-xs text-muted-foreground">{discoveredModels.length ? '当前筛选没有匹配模型。' : '暂无模型'}</p> : null}
    <ModelRemovalDialog preview={preview} open={removeOpen} onOpenChange={setRemoveOpen} onExecute={() => { setRemoveError(''); executeMutation.mutate() }} executing={executeMutation.isPending} change={activeRemoval} error={removeError} />
  </section>
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
        const response = await updateAdminChannel(channel.id, { name: name.trim(), cost_ratio: costRatio ? Number(costRatio) : null, note: note.trim(), ...(apiKey ? { api_key: apiKey } : {}), ...(baseUrl.trim() !== channel.base_url ? { base_url: baseUrl.trim() } : {}), ...(Number(channelType) !== channel.channel_type ? { channel_type: Number(channelType) } : {}) })
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
      if (channel) toast.success('渠道配置已保存，请核对关联分组路由')
      else if (copying && !testStarted && !testError) toast.success('渠道副本已创建')
      else if (testError) toast.warning(`渠道已创建，但模型测试未启动：${testError}`)
      else if (testStarted) toast.success('渠道已创建，模型测试已开始')
      else toast.success('渠道已创建')
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
    if (channel?.credential_status === 'missing' && !apiKey) return setError('请重新录入 API 密钥。')
    if (!channel && (!apiKey || !models.split(',').some((item) => item.trim()))) return setError('请填写 API 密钥和至少一个模型。')
    mutation.mutate(runTest)
  }
  return <Sheet open={open} onOpenChange={(next) => { if (!next) setApiKey(''); onOpenChange(next) }}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader className="border-b"><SheetTitle>{channel ? '编辑渠道' : copying ? '复制渠道' : '新建渠道'}</SheetTitle><SheetDescription>{channel ? '渠道配置' : copying ? '已复制渠道配置，请输入新密钥。' : '创建后可在分组路由中绑定渠道。'}</SheetDescription></SheetHeader><form className="grid gap-5 px-4 py-5" onSubmit={submit}>
    <div className="grid gap-2"><Label htmlFor="admin-channel-name">显示名称</Label><Input id="admin-channel-name" value={name} onChange={(event) => setName(event.target.value)} /></div>
    <><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>渠道类型</Label><Select value={channelType} onValueChange={setChannelType}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{channelTypes.map((type) => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="admin-channel-ratio">成本倍率</Label><Input id="admin-channel-ratio" type="number" min="0" step="0.001" value={costRatio} onChange={(event) => setCostRatio(event.target.value)} placeholder="例如 1.125" /></div></div>
    <div className="grid gap-2"><Label htmlFor="admin-channel-url">API 地址</Label><Input id="admin-channel-url" type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} autoComplete="url" /><p className="text-xs text-muted-foreground">New API 会自动补充 <code>/v1/models</code>，地址不要以 <code>/v1</code> 结尾。</p></div>
    <div className="grid gap-2"><Label htmlFor="admin-channel-key">API 密钥</Label><Input id="admin-channel-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="new-password" placeholder={channel ? channel.credential_status === 'missing' ? '请重新录入凭据' : '留空保留现有凭据' : undefined} /><p className="text-xs text-muted-foreground">仅在本次提交内存中使用，不写入浏览器存储。</p></div>
    <div className="grid gap-2"><Label htmlFor="admin-channel-models">模型范围</Label><div className="flex min-w-0 flex-col gap-2 sm:flex-row"><Input id="admin-channel-models" disabled={!!channel} value={models} onChange={(event) => { setModels(event.target.value); setModelFetchSummary('') }} placeholder="先获取模型，或使用英文逗号分隔" /><Button type="button" variant="outline" className="shrink-0" onClick={() => discover.mutate()} disabled={!!channel || discover.isPending || mutation.isPending || !apiKey.trim() || !baseUrl.trim()}>{discover.isPending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}从渠道获取</Button></div><p className="text-xs text-muted-foreground"> </p>{modelFetchSummary ? <p className="text-xs text-success">{modelFetchSummary}</p> : null}</div></>
    <div className="grid gap-2"><Label htmlFor="admin-channel-note">备注</Label><Textarea id="admin-channel-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={255} /></div>
    {error ? <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>{!channel ? <Button type="button" variant="outline" onClick={() => submit(undefined, true)} disabled={mutation.isPending || discover.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <FlaskConical />}{copying ? '创建副本并测试' : '创建并测试'}</Button> : null}<Button type="submit" disabled={mutation.isPending || discover.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Check />}{channel ? '保存配置' : copying ? '创建副本' : '创建渠道'}</Button></div>
  </form></SheetContent></Sheet>
}

export function modelTagState(result?: AdminModelTestResult) {
  if (!result || result.status === 'untested') return { tone: 'untested', label: '未测试', icon: CircleDashed }
  if (result.status === 'running') return { tone: 'running', label: '测试中', icon: LoaderCircle }
  if (result.status === 'available') return { tone: 'available', label: '可用', icon: CheckCircle2 }
  return { tone: 'failed', label: '异常', icon: TriangleAlert }
}

export function channelModelResults(channel: AdminLogicalChannel, task = channel.latest_model_test) {
  const results = new Map((channel.latest_model_results ?? []).map((result) => [result.model_id, result]))
  const running = task && ['pending', 'running'].includes(task.status)
  for (const result of task?.results ?? []) {
    results.set(result.model_id, running && result.status === 'untested' ? { ...result, status: 'running', latency_ms: null, error: null } : result)
  }
  return results
}

export function channelGroupNames(channel: AdminLogicalChannel, routes: AdminBootstrap['routes']) {
  return [...new Set(routes.filter((route) => route.config.layers.some((layer) => layer.members.some((member) => member.logical_id === channel.id))).map((route) => route.group_name))]
}

const modelTagColors: Record<string, string> = {
  available: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700! dark:text-emerald-400!',
  failed: 'border-red-600/25 bg-red-500/10 text-red-700! dark:text-red-400!',
  running: 'border-blue-600/25 bg-blue-500/10 text-blue-700! dark:text-blue-400!',
  untested: 'border-border bg-muted/50 text-muted-foreground!',
}

function ChannelModels({ channel, showLatency, onConfigure }: { channel: AdminLogicalChannel; showLatency: boolean; onConfigure: () => void }) {
  const results = channelModelResults(channel)
  return <div className="flex flex-wrap gap-1.5">{channel.models.map((model) => {
    const result = results.get(model)
    const state = modelTagState(result)
    const Icon = state.icon
    return <Tooltip key={model}><TooltipTrigger asChild><button type="button" onClick={onConfigure} data-model-status={state.tone} aria-label={`${model}：${state.label}，配置模型`} className={`inline-flex max-w-full cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-start text-[10px] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-ring ${modelTagColors[state.tone]} border`}>
      <Icon className={`size-3 shrink-0 ${state.tone === 'running' ? 'animate-spin' : ''}`} /><span className="min-w-0 break-all whitespace-normal">{model}</span>
      {showLatency && result?.latency_ms != null ? <span className="shrink-0 font-mono text-[10px]">{result.latency_ms} ms</span> : null}
    </button></TooltipTrigger><TooltipContent className="max-w-72 break-words"><p>{state.label}{result?.tested_at ? ` · ${formatTime(result.tested_at)}` : ''} · 配置模型</p>{result?.error ? <p>{result.error}</p> : null}</TooltipContent></Tooltip>
  })}{!channel.models.length ? <button type="button" onClick={onConfigure} aria-label="配置渠道模型" className="rounded border border-dashed px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground">未配置</button> : null}</div>
}

function ChannelField({ channel, field, disabled }: { channel: AdminLogicalChannel; field: 'name' | 'cost_ratio'; disabled: boolean }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const label = field === 'name' ? '渠道名' : '倍率'
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await updateAdminChannel(channel.id, field === 'name' ? { name: value.trim() } : { cost_ratio: value.trim() ? Number(value) : null })
      if (!response.success) throw new Error(response.message || '保存失败')
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); setEditing(false); toast.success(`${label}已保存`) },
    onError: (cause) => setError(errorMessage(cause)),
  })
  const save = (event: FormEvent) => {
    event.preventDefault()
    if (mutation.isPending) return
    if (field === 'name' && !value.trim()) return setError('请填写渠道名。')
    if (field === 'cost_ratio' && value.trim() && !/^\d+(?:\.\d{1,3})?$/.test(value.trim())) return setError('倍率必须为非负数，最多三位小数。')
    setError('')
    mutation.mutate()
  }
  if (editing) return <form onSubmit={save} className="grid min-w-0 gap-1" onKeyDown={(event) => { if (event.key === 'Escape' && !mutation.isPending) { event.stopPropagation(); setEditing(false) } }}>
    <Input autoFocus aria-label={`编辑${label}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${channel.id}-${field}-error` : undefined} value={value} onChange={(event) => setValue(event.target.value)} disabled={mutation.isPending} maxLength={field === 'name' ? 80 : undefined} inputMode={field === 'cost_ratio' ? 'decimal' : undefined} className="h-8 min-w-0 px-1.5 text-sm" />
    <div className="flex items-center gap-1"><Tooltip><TooltipTrigger asChild><Button type="submit" size="icon" variant="ghost" className="size-8 text-success" aria-label={`保存${label}`} disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Check />}</Button></TooltipTrigger><TooltipContent>保存{label}</TooltipContent></Tooltip><IconButton label={`取消编辑${label}`} icon={X} onClick={() => setEditing(false)} disabled={mutation.isPending} /></div>
    {error ? <p id={`${channel.id}-${field}-error`} role="alert" className="break-words text-xs text-destructive">{error}</p> : null}
  </form>
  return <Tooltip><TooltipTrigger asChild><button type="button" aria-label={`编辑${label}：${field === 'name' ? channel.name : formatCostRatio(channel.cost_ratio)}`} disabled={disabled} onClick={() => { setValue(field === 'name' ? channel.name : channel.cost_ratio?.toString() ?? ''); setError(''); setEditing(true) }} className="max-w-full cursor-pointer rounded text-start focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50">
    {field === 'name' ? <span className="break-all font-medium hover:underline">{channel.name}</span> : <Badge variant="outline" className="max-w-full break-all whitespace-normal rounded border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">{formatCostRatio(channel.cost_ratio)}</Badge>}
  </button></TooltipTrigger><TooltipContent>编辑{label}</TooltipContent></Tooltip>
}

export function ChannelsView({ data }: { data: AdminBootstrap }) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [showLatency, setShowLatency] = useState(false)
  const [modelChannelId, setModelChannelId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [copying, setCopying] = useState<AdminLogicalChannel | null>(null)
  const [editingChannel, setEditingChannel] = useState<AdminLogicalChannel | null>(null)
  const [deleting, setDeleting] = useState<AdminLogicalChannel | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const modelChannel = data.channels.find((channel) => channel.id === modelChannelId)
  const visible = useMemo(() => data.channels.filter((channel) => {
    const matchesStatus = status === 'all' || (status === 'enabled' ? channel.enabled : !channel.enabled)
    const text = [channel.name, channel.base_url, channelTypeName(channel.channel_type), ...channel.models, ...channelGroupNames(channel, data.routes)].join(' ').toLowerCase()
    return matchesStatus && text.includes(query.trim().toLowerCase())
  }), [data.channels, data.routes, query, status])
  const operation = useMutation({
    mutationFn: async (channel: AdminLogicalChannel) => {
      const response = await setAdminChannelStatus(channel.id, !channel.enabled)
      if (!response.success) throw new Error(response.message || '状态更新失败')
      return response
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); toast.success('渠道状态已更新') },
    onError: (cause) => toast.error(errorMessage(cause)),
  })
  const remove = useMutation({
    mutationFn: async (channel: AdminLogicalChannel) => {
      const response = await deleteAdminChannel(channel.id)
      if (!response.success) throw new Error(response.message || '删除失败')
    },
    onSuccess: async () => { setDeleting(null); await queryClient.invalidateQueries({ queryKey }); toast.success('渠道已删除') },
    onError: (cause) => setDeleteError(errorMessage(cause)),
  })
  const deleteGroups = deleting ? channelGroupNames(deleting, data.routes) : []
  return <div className="min-w-0 space-y-4">
    <PageHeading eyebrow="ADMIN / CHANNELS" title="渠道" action={<Button onClick={() => { setEditingChannel(null); setCopying(null); setFormOpen(true) }}><Plus />新建渠道</Button>} />
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-48 flex-1"><Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="搜索渠道" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索渠道、地址、模型或分组" className="ps-9" /></label>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-32" aria-label="渠道状态"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="enabled">已启用</SelectItem><SelectItem value="disabled">已禁用</SelectItem></SelectContent></Select>
      <div className="flex items-center gap-2"><Switch id="channel-model-latency" checked={showLatency} onCheckedChange={setShowLatency} /><Label htmlFor="channel-model-latency" className="whitespace-nowrap text-xs">显示延迟 ms</Label></div>
      <IconButton label="刷新渠道" icon={RefreshCw} onClick={() => { void queryClient.invalidateQueries({ queryKey }) }} />
    </div>
    <div className="min-w-0 border-y">
      <Table className="w-full min-w-[1080px] table-fixed">
        <colgroup><col className="w-[14%]" /><col className="w-[7%]" /><col className="w-[14%]" /><col className="w-[13%]" /><col className="w-[10%]" /><col className="w-[23%]" /><col className="w-[9%]" /><col className="w-[10%]" /></colgroup>
        <TableHeader><TableRow>{['渠道名', '渠道类型', '地址', '密钥', '倍率', '模型配置', '绑定分组', '操作'].map((label) => <TableHead key={label} className={label === '操作' ? 'text-end' : ''}>{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{visible.map((channel) => {
          const groups = channelGroupNames(channel, data.routes)
          const busy = operation.isPending || remove.isPending
          return <TableRow key={channel.id} className="align-top">
            <TableCell className="whitespace-normal"><ChannelField channel={channel} field="name" disabled={busy} /><span className={`mt-1.5 flex items-center gap-1.5 text-xs ${channel.enabled ? 'text-muted-foreground' : 'text-destructive'}`}><span className={`size-1.5 rounded-full ${channel.enabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />{channel.enabled ? '已启用' : '已禁用'}</span></TableCell>
            <TableCell><Tooltip><TooltipTrigger asChild><span tabIndex={0} role="img" aria-label={channelTypeName(channel.channel_type)} className="inline-flex size-8 items-center justify-center"><ChannelProviderIcon type={channel.channel_type} /></span></TooltipTrigger><TooltipContent>{channelTypeName(channel.channel_type)}</TooltipContent></Tooltip></TableCell>
            <TableCell><Tooltip><TooltipTrigger asChild><span tabIndex={0} className="block truncate font-mono text-xs text-muted-foreground">{channel.base_url}</span></TooltipTrigger><TooltipContent className="max-w-80 break-all">{channel.base_url}</TooltipContent></Tooltip></TableCell>
            <TableCell><span aria-label="脱敏密钥" className="font-mono text-xs text-muted-foreground">{channel.credential_status === 'missing' ? '待录入凭据' : channel.masked_key ?? '暂不可用'}</span></TableCell>
            <TableCell className="whitespace-normal"><ChannelField channel={channel} field="cost_ratio" disabled={busy} /></TableCell>
            <TableCell className="whitespace-normal"><ChannelModels channel={channel} showLatency={showLatency} onConfigure={() => setModelChannelId(channel.id)} /></TableCell>
            <TableCell className="whitespace-normal"><div className="flex flex-wrap gap-1">{groups.map((group) => <Badge key={group} variant="secondary" className="max-w-full break-all whitespace-normal rounded">{group}</Badge>)}{!groups.length ? <span className="text-xs text-muted-foreground">未绑定</span> : null}</div></TableCell>
            <TableCell><div className="grid grid-cols-[repeat(2,2rem)] justify-end gap-0.5">
              <IconButton label="编辑渠道" icon={Pencil} onClick={() => { setEditingChannel(channel); setCopying(null); setFormOpen(true) }} disabled={busy} />
              <IconButton label="复制渠道" icon={Copy} className="text-blue-600! hover:bg-blue-500/10 hover:text-blue-700! dark:text-blue-400!" onClick={() => { setEditingChannel(null); setCopying(channel); setFormOpen(true) }} disabled={busy} />
              <IconButton label={channel.enabled ? '禁用渠道' : '启用渠道'} icon={Power} className={channel.enabled ? 'text-yellow-600! hover:bg-yellow-500/10 hover:text-yellow-700! dark:text-yellow-400!' : 'text-emerald-600! hover:bg-emerald-500/10 hover:text-emerald-700! dark:text-emerald-400!'} onClick={() => operation.mutate(channel)} disabled={busy} />
              <IconButton label="删除渠道" icon={Trash2} className="text-red-600! hover:bg-red-500/10 hover:text-red-700! dark:text-red-400!" onClick={() => { setDeleteError(''); setDeleting(channel) }} disabled={busy} />
            </div></TableCell>
          </TableRow>
        })}{!visible.length ? <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">{query || status !== 'all' ? '没有匹配的渠道' : '暂无渠道'}</TableCell></TableRow> : null}</TableBody>
      </Table>
    </div>
    <ChannelForm channel={editingChannel} copyFrom={copying} open={formOpen} onOpenChange={setFormOpen} onCreated={() => setCopying(null)} />
    <Sheet open={Boolean(modelChannel)} onOpenChange={(open) => { if (!open) setModelChannelId(null) }}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader><SheetTitle>{modelChannel?.name} · 模型配置</SheetTitle><SheetDescription>{modelChannel?.base_url}</SheetDescription></SheetHeader><div className="px-4 pb-5">{modelChannel ? <ModelOperationsPanel key={modelChannel.id} channel={modelChannel} /> : null}</div></SheetContent></Sheet>
    <Dialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null) }}><DialogContent><DialogHeader><DialogTitle>删除渠道</DialogTitle><DialogDescription>{deleteGroups.length ? `请先在分组路由中解除 ${deleteGroups.join('、')} 的绑定，再删除「${deleting?.name}」。` : `删除「${deleting?.name}」及其关联渠道记录？此操作无法撤销。`}</DialogDescription></DialogHeader>{deleteError ? <p role="alert" className="text-sm text-destructive">{deleteError}</p> : null}<DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setDeleting(null)}>取消</Button><Button variant="destructive" disabled={Boolean(deleteGroups.length) || remove.isPending} onClick={() => deleting && remove.mutate(deleting)}>{remove.isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}确认删除</Button></DialogFooter></DialogContent></Dialog>
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
    <section className="overflow-hidden border bg-card">{data.changes.length ? <div className="divide-y">{data.changes.map((change) => <article key={change.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start"><span className="mt-0.5">{change.status === 'success' ? <CheckCircle2 className="size-5 text-success" /> : change.status === 'cancelled' ? <CircleDashed className="size-5 text-muted-foreground" /> : change.status === 'partial' ? <TriangleAlert className="size-5 text-warning" /> : <LoaderCircle className="size-5 animate-spin" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><code className="text-xs text-muted-foreground">{change.id.slice(0, 14)}</code><h2 className="font-semibold">{change.target} · r{change.revision ?? '-'}</h2><Badge variant="outline" className={change.status === 'success' ? 'border-success/30 text-success' : 'border-warning/30 text-warning'}>{change.status === 'success' ? '已完成' : change.status === 'cancelled' ? '已迁移' : change.status === 'partial' ? '部分失败' : '执行中'}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{formatTime(change.created_at)} · {change.actor_name} · {change.steps.filter((step) => step.status === 'success').length}/{change.steps.length} 步完成</p></div><Button variant="outline" size="sm" onClick={() => { setSelected(change); setOpen(true) }}><Eye />查看步骤</Button></article>)}</div> : <p className="p-10 text-center text-sm text-muted-foreground">还没有管理员渠道变更。</p>}</section>
    <ChangeDialog change={selected} open={open} onOpenChange={setOpen} />
  </div>
}

export function AdminOperationsPage({ page }: { page: AdminPage }) {
  const query = useAdminBootstrap()
  if (query.isPending) return <AdminLoading />
  if (query.isError || !query.data) return <AdminUnavailable retry={() => void query.refetch()} message={errorMessage(query.error)} />
  if (page === 'channels') return <ChannelsView data={query.data} />
  if (page === 'routes') return <GroupRoutesView data={query.data} />
  if (page === 'monitoring') return <MonitoringView data={query.data} />
  return <ChangesView data={query.data} />
}

export function AdminChannelsPage() { return <AdminOperationsPage page="channels" /> }
export function AdminRoutesPage() { return <AdminOperationsPage page="routes" /> }
export function AdminMonitoringPage() { return <AdminOperationsPage page="monitoring" /> }
export function AdminChangesPage() { return <AdminOperationsPage page="changes" /> }
