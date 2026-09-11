import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBlocker } from '@tanstack/react-router'
import axios from 'axios'
import { Check, CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { continueAdminChange, executeAdminRoute, previewAdminRoute, type AdminBootstrap, type AdminChange, type AdminLogicalChannel, type AdminRouteInput, type AdminRoutePreview } from '@partokens/api-client'
import { Badge, Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Popover, PopoverContent, PopoverTrigger, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Tooltip, TooltipContent, TooltipTrigger, toast } from '@partokens/design-system/components'
import { ChannelProviderIcon } from './channel-provider-icon'
import { compareBindings, draftDirty, integerValid, newRouteBinding, routeBindings, routeError, routeInput, type RouteDraft } from './route-draft'

const queryKey = ['admin-operations', 'bootstrap'] as const
const cost = (value?: number | null) => value == null ? '未登记' : `${value.toFixed(3)}x`
const errorText = (error: unknown) => axios.isAxiosError(error) ? String(error.response?.data?.message || error.message) : error instanceof Error ? error.message : '操作失败'

function ToolButton({ label, icon: Icon, onClick, disabled }: { label: string; icon: LucideIcon; onClick: () => void; disabled?: boolean }) {
  return <Tooltip><TooltipTrigger asChild><Button type="button" size="icon" variant="ghost" className="size-8 shrink-0" aria-label={label} disabled={disabled} onClick={onClick}><Icon className="size-4" /></Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

function Models({ channel }: { channel?: AdminLogicalChannel }) {
  const models = channel?.models ?? []
  const status = (model: string) => {
    const task = channel?.latest_model_test
    const pending = task && ['pending', 'running'].includes(task.status) ? task.results.find((item) => item.model_id === model) : undefined
    const result = pending ?? channel?.latest_model_results?.find((item) => item.model_id === model)
    if (pending && ['untested', 'running'].includes(pending.status)) return '测试中'
    return !result || result.status === 'untested' ? '未测试' : result.status === 'available' ? '可用' : result.status === 'running' ? '测试中' : '异常'
  }
  const counts = models.reduce<Record<string, number>>((all, model) => { const label = status(model); all[label] = (all[label] ?? 0) + 1; return all }, {})
  return <details className="min-w-0 text-xs"><summary className="cursor-pointer space-y-1"><span>{models.length} 个模型</span><span className="flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">{Object.entries(counts).map(([label, count]) => <span key={label} className={label === '异常' ? 'text-warning' : label === '可用' ? 'text-success' : ''}>{label} {count}</span>)}</span></summary><div className="mt-2 max-h-48 space-y-1 overflow-y-auto">{models.map((model) => <div key={model} className="flex items-start justify-between gap-2"><span className="min-w-0 break-all">{model}</span><span className="shrink-0 text-muted-foreground">{status(model)}</span></div>)}</div></details>
}

function unavailableReason(channel: AdminLogicalChannel) {
  if (!channel.enabled) return '渠道已停用'
  if (!channel.models.length) return '渠道没有模型'
  if (channel.state !== 'active') return '渠道尚未就绪'
  if (channel.credential_status === 'missing') return '请重新录入渠道凭据'
  return ''
}

function ChannelSelector({ channels, value, used, onSelect, autoFocus, disabled }: { channels: AdminLogicalChannel[]; value: string; used: Set<string>; onSelect: (id: string) => void; autoFocus: boolean; disabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const listId = useId()
  const channel = channels.find((item) => item.id === value)
  const candidates = channels.filter((item) => `${item.name} ${item.models.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()))
  const reason = (item: AdminLogicalChannel) => unavailableReason(item) || (used.has(item.id) ? '已在当前分组绑定或选中' : '')
  const selectable = candidates.filter((item) => !reason(item))
  useEffect(() => {
    if (autoFocus) { trigger.current?.closest('[data-route-row]')?.scrollIntoView({ block: 'nearest' }); trigger.current?.focus({ preventScroll: true }) }
  }, [autoFocus])
  useEffect(() => { list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }) }, [active])
  const select = (id: string) => { const item = channels.find((candidate) => candidate.id === id); if (!disabled && item && !reason(item)) { onSelect(id); setOpen(false) } }
  return <Popover modal open={open && !disabled} onOpenChange={(next) => { setOpen(next); setSearch(''); setActive(null) }}>
    <PopoverTrigger asChild><Button ref={trigger} type="button" variant="outline" disabled={disabled} aria-label={channel ? `重新选择渠道 ${channel.name}` : '选择渠道'} className="h-9 w-full min-w-0 justify-between px-2 text-start font-normal"><span className="min-w-0 truncate" title={channel?.name}>{channel?.name ?? '选择渠道'}</span><ChevronDown className="size-4 shrink-0" /></Button></PopoverTrigger>
    <PopoverContent container={trigger.current?.closest<HTMLElement>('[data-slot="sheet-content"]')} align="start" collisionPadding={12} onEscapeKeyDown={(event) => { event.preventDefault(); setOpen(false) }} className="flex max-h-[min(400px,var(--radix-popover-content-available-height))] w-[360px] max-w-[calc(100vw-24px)] flex-col gap-2 p-2" onKeyDown={(event) => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        if ((event.key === 'Home' || event.key === 'End') && event.target instanceof HTMLInputElement) return
        event.preventDefault()
        const index = selectable.findIndex((item) => item.id === active)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? selectable.length - 1 : event.key === 'ArrowDown' ? (index + 1) % selectable.length : (index <= 0 ? selectable.length : index) - 1
        setActive(selectable[next]?.id ?? null)
      } else if (event.key === 'Enter' && active) { event.preventDefault(); select(active) }
    }}>
      <Input role="combobox" aria-label="搜索渠道" aria-expanded="true" aria-controls={listId} aria-autocomplete="list" aria-activedescendant={active ? `${listId}-${active}` : undefined} placeholder="搜索渠道或模型" className="h-9 shrink-0" value={search} onChange={(event) => { setSearch(event.target.value); setActive(null) }} />
      <div ref={list} id={listId} role="listbox" aria-label="渠道选项" className="min-h-0 overflow-y-auto overscroll-contain">
        {candidates.map((item) => { const unavailable = reason(item); return <button type="button" role="option" id={`${listId}-${item.id}`} key={item.id} aria-selected={value === item.id} aria-disabled={Boolean(unavailable)} tabIndex={-1} data-active={active === item.id} onClick={() => select(item.id)} className="flex min-h-12 w-full min-w-0 items-center gap-2 rounded px-2 py-2 text-start hover:bg-accent data-[active=true]:bg-accent aria-disabled:cursor-not-allowed" onPointerMove={() => { if (!unavailable) setActive(item.id) }}>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm" title={item.name}>{item.name}</span><span className="block text-xs text-muted-foreground">{item.models.length} 个模型 · {cost(item.cost_ratio)}</span>{unavailable ? <span className="block text-xs text-warning">{unavailable}</span> : null}</span>{value === item.id ? <Check className="size-4 shrink-0" /> : null}
        </button> })}
        {!candidates.length ? <p className="p-3 text-sm text-muted-foreground">没有匹配的渠道</p> : null}
      </div>
    </PopoverContent>
  </Popover>
}

function ChannelEditor({ group, data, draft, update, busy, preview, reload }: { group: string; data: AdminBootstrap; draft: RouteDraft; update: (next: RouteDraft) => void; busy: boolean; preview: () => void; reload: () => void }) {
  const [search, setSearch] = useState('')
  const [focusRow, setFocusRow] = useState<string | null>(null)
  const find = (id: string) => data.channels.find((channel) => channel.id === id)
  const rows = draft.rows.filter((row) => !row.logical_id || `${find(row.logical_id)?.name ?? row.logical_id} ${find(row.logical_id)?.models.join(' ') ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  const invalidAddition = draft.rows.find((row) => row.draft_id && row.logical_id && (!find(row.logical_id) || unavailableReason(find(row.logical_id)!)))
  const error = routeError(draft.rows, data.retry_times) || (invalidAddition ? '新增渠道已不可用，请重新选择渠道或移除该行' : '')
  const revision = data.routes.find((route) => route.group_name === group)?.revision ?? 0
  const conflict = revision > draft.revision
  const patch = (id: string, field: 'logical_id' | 'priority' | 'weight', value: string) => update({ ...draft, rows: draft.rows.map((row) => (row.draft_id ?? row.logical_id) === id ? { ...row, [field]: value } : row) })
  const add = () => { const row = newRouteBinding(); setSearch(''); update({ ...draft, rows: [...draft.rows, row] }); setFocusRow(row.draft_id!) }
  return <fieldset disabled={busy} className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label={`${group} 渠道配置`}>
    <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
    <p className="text-xs text-muted-foreground">{draft.rows.length} 个渠道 · {new Set(draft.rows.map((row) => Number(row.priority))).size} 个优先级 · 全局重试 {data.retry_times} 次</p>
    <p className="text-xs text-muted-foreground">数字越大越优先；同级按权重分配，列表排序不代表调用顺序。重试按请求模型的可用优先级进行。</p>
    {conflict ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-warning">后台配置已更新，当前草稿保留。<Button size="sm" variant="outline" onClick={reload}><RefreshCw />核对最新配置</Button></div> : null}
    <div className="flex flex-wrap items-center gap-2"><Input aria-label="搜索已绑定渠道" placeholder="搜索已绑定渠道或模型" className="h-9 min-w-0 flex-1" value={search} onChange={(event) => setSearch(event.target.value)} /><Button type="button" variant="outline" size="sm" onClick={add}><Plus />添加渠道</Button></div>
    <div className="min-w-0 divide-y border-y">
      <div className="hidden grid-cols-[minmax(140px,2fr)_minmax(140px,2fr)_90px_108px_142px_32px] items-center gap-3 py-2 text-xs text-muted-foreground xl:grid"><span>渠道名称</span><span>模型及可用性</span><span>成本倍率</span><span>优先级</span><span>权重 / 同级占比</span><span /></div>
      {rows.map((row) => {
        const id = row.draft_id ?? row.logical_id
        const channel = find(row.logical_id)
        const label = channel?.name || row.logical_id || '未选择渠道'
        const peers = draft.rows.filter((item) => item.logical_id && Number(item.priority) === Number(row.priority))
        const validShare = Boolean(row.logical_id) && integerValid(row.priority, -2147483648, 2147483647) && peers.every((item) => integerValid(item.weight, 1, 1000000))
        const total = peers.reduce((sum, item) => sum + Number(item.weight), 0)
        return <div data-route-row={id} data-route-binding={row.logical_id} key={id} className="relative grid min-w-0 grid-cols-2 items-start gap-3 py-3 xl:grid-cols-[minmax(140px,2fr)_minmax(140px,2fr)_90px_108px_142px_32px]">
        <div className="col-span-2 flex min-w-0 items-start gap-2 pe-9 xl:col-span-1 xl:pe-0">{channel ? <span className="shrink-0"><ChannelProviderIcon type={channel.channel_type} /></span> : null}<div className="min-w-0 flex-1">{row.draft_id ? <ChannelSelector channels={data.channels} value={row.logical_id} used={new Set(draft.rows.filter((item) => item !== row).map((item) => item.logical_id))} autoFocus={focusRow === row.draft_id} disabled={busy} onSelect={(value) => patch(id, 'logical_id', value)} /> : <strong className="block break-all text-sm font-medium">{label}</strong>}{channel && unavailableReason(channel) ? <span className="text-xs text-warning">{unavailableReason(channel)}</span> : null}</div></div>
        {channel ? <Models key={channel.id} channel={channel} /> : <span className="text-xs text-muted-foreground">待选择渠道</span>}<div className="text-xs"><span className="mb-1 block text-muted-foreground xl:hidden">成本倍率</span><span className="font-mono">{channel ? cost(channel.cost_ratio) : '-'}</span></div>
        <label className="min-w-0 text-xs"><span className="mb-1 block text-muted-foreground xl:hidden">优先级</span><Input aria-label={`${label} 优先级`} type="number" step="1" min="-2147483648" max="2147483647" className="h-8 min-w-0 w-full font-mono" value={row.priority} onChange={(event) => patch(id, 'priority', event.target.value)} /></label>
        <label className="min-w-0 text-xs"><span className="mb-1 block text-muted-foreground xl:hidden">权重 / 同级占比</span><div className="flex items-center gap-1"><Input aria-label={`${label} 权重`} type="number" step="1" min="1" max="1000000" className="h-8 min-w-0 flex-1 font-mono" value={row.weight} onChange={(event) => patch(id, 'weight', event.target.value)} /><span className="w-12 shrink-0 text-end font-mono">{validShare && total > 0 ? `${(Number(row.weight) / total * 100).toFixed(1)}%` : '-'}</span></div></label>
        <div className="absolute end-0 top-2 flex justify-end xl:static"><ToolButton label={`移除绑定 ${label}`} icon={Trash2} onClick={() => update({ ...draft, rows: draft.rows.filter((item) => item !== row) })} /></div>
      </div> })}
      {!rows.length ? <p className="py-6 text-center text-sm text-muted-foreground">{search ? '没有匹配的绑定' : '尚未绑定渠道'}</p> : null}
    </div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-background p-4"><p className="text-xs text-muted-foreground">移除绑定不删除渠道，不影响其他分组。</p><Button disabled={Boolean(error) || conflict || (!draftDirty(draft) && !draft.rows.length)} onClick={preview}>{draftDirty(draft) ? <ClipboardCheck /> : <RefreshCw />}{draftDirty(draft) ? '预览变更' : '重建执行渠道'}</Button></div>
  </fieldset>
}

type PreviewState = { group: string; input: AdminRouteInput; preview: AdminRoutePreview }

export function GroupRoutesView({ data }: { data: AdminBootstrap }) {
  const client = useQueryClient()
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, RouteDraft>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string[]>([])
  const [leaving, setLeaving] = useState<{ next: string | null; reload?: boolean } | null>(null)
  const [emptyConfirm, setEmptyConfirm] = useState(false)
  const [review, setReview] = useState<PreviewState | null>(null)
  const [changeId, setChangeId] = useState<string | null>(null)
  const [result, setResult] = useState<AdminChange | null>(null)
  const [saveError, setSaveError] = useState('')
  const dirty = Object.values(drafts).some(draftDirty)
  const blocker = useBlocker({ shouldBlockFn: () => dirty, enableBeforeUnload: dirty, withResolver: true })
  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current }
      for (const [group, draft] of Object.entries(current)) {
        const stored = data.routes.find((route) => route.group_name === group)
        if (!draftDirty(draft) && (stored?.revision ?? 0) > draft.revision) { const rows = routeBindings(stored?.config.layers); next[group] = { ...draft, rows, baseline: structuredClone(rows), revision: stored?.revision ?? 0 } }
      }
      return next
    })
  }, [data.routes])
  const createDraft = (group: string): RouteDraft => { const stored = data.routes.find((route) => route.group_name === group); const rows = routeBindings(stored?.config.layers); return { rows, baseline: structuredClone(rows), revision: stored?.revision ?? 0 } }
  const openGroup = (group: string | null) => { if (group) setDrafts((current) => current[group] ? current : { ...current, [group]: createDraft(group) }); setEditing(group) }
  const requestGroup = (next: string | null) => { if (editing && drafts[editing] && draftDirty(drafts[editing])) setLeaving({ next }); else openGroup(next) }
  const complete = async (change: AdminChange) => {
    setResult(change); setChangeId(change.id)
    if (change.status === 'success') {
      const input = change.plan.route as AdminRouteInput | undefined
      const rows = routeBindings(input?.layers ?? review?.input.layers)
      setDrafts((current) => ({ ...current, [change.target]: { ...(current[change.target] ?? createDraft(change.target)), rows, baseline: structuredClone(rows), revision: change.revision ?? 0 } }))
      toast.success(`${change.target} 已保存并核对`)
    }
    await client.invalidateQueries({ queryKey })
  }
  const preview = useMutation({ mutationFn: async ({ group, confirmEmpty }: { group: string; confirmEmpty: boolean }) => {
    const input = routeInput(drafts[group]!, confirmEmpty)
    const response = await previewAdminRoute(group, input)
    if (!response.success) throw new Error(response.message || '预览失败')
    return { group, input: { ...input, preview_token: response.data.preview_token }, preview: response.data }
  }, onSuccess: (value) => { setReview(value); setResult(null); setChangeId(null); setSaveError(''); setEmptyConfirm(false) }, onError: (error) => { setSaveError(errorText(error)); toast.error(errorText(error)) } })
  const execute = useMutation({ mutationFn: async () => { const response = await executeAdminRoute(review!.group, review!.input); if (!response.success) throw new Error(response.message || '保存失败'); return response.data }, onSuccess: complete, onError: (error) => { setSaveError(errorText(error)); void client.invalidateQueries({ queryKey }) } })
  const resume = useMutation({ mutationFn: async () => { const response = await continueAdminChange(changeId!); if (!response.success) throw new Error(response.message || '继续执行失败'); return response.data }, onSuccess: complete, onError: (error) => setSaveError(errorText(error)) })
  const busy = execute.isPending || resume.isPending
  useEffect(() => { if (!busy) return; const timer = window.setInterval(() => { void client.invalidateQueries({ queryKey }) }, 1200); return () => window.clearInterval(timer) }, [busy, client])
  const live = data.changes.find((change) => change.id === changeId) ?? (execute.isPending ? data.changes.find((change) => change.kind === 'route_revision' && change.target === review?.group && change.revision === review.preview.revision) : undefined)
  const change = live && (!result || live.updated_at >= result.updated_at) ? live : result
  const groupChange = (group: string) => data.changes.find((change) => change.target === group && change.kind === 'route_revision' && !['success', 'cancelled'].includes(change.status))
  const renderEditor = (group: string) => <ChannelEditor key={group} group={group} data={data} draft={drafts[group]!} busy={busy || preview.isPending || Boolean(groupChange(group))} update={(draft) => setDrafts((current) => ({ ...current, [group]: draft }))} reload={() => setLeaving({ next: group, reload: true })} preview={() => { setSaveError(''); if (!drafts[group]!.rows.length) setEmptyConfirm(true); else preview.mutate({ group, confirmEmpty: false }) }} />
  const visible = data.groups.filter((group) => `${group} ${routeBindings(data.routes.find((route) => route.group_name === group)?.config.layers).map((row) => data.channels.find((channel) => channel.id === row.logical_id)?.name ?? '').join(' ')}`.toLowerCase().includes(search.toLowerCase()))
  const closeReview = () => { if (!busy) { setReview(null); setChangeId(null); setResult(null); setSaveError('') } }
  const steps = change?.steps ?? review?.preview.steps ?? []
  const finished = steps.filter((step) => step.status === 'success').length
  return <div className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">分组路由</h1><span className="text-sm text-muted-foreground">{data.groups.length} 个分组</span></header>
    <div className="relative max-w-md"><Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="搜索分组或渠道" placeholder="搜索分组或渠道" className="ps-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    <div role="table" aria-label="分组路由总览" className="min-w-0 border-y">
      <div role="row" className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_72px_36px] items-center gap-2 border-b py-2 text-xs text-muted-foreground sm:grid-cols-[minmax(120px,1fr)_minmax(0,4fr)_120px_64px] sm:gap-4"><span role="columnheader">分组名称</span><span role="columnheader">渠道</span><span role="columnheader">配置状态</span><span role="columnheader">操作</span></div>
      {visible.map((group) => {
        const route = data.routes.find((item) => item.group_name === group)
        const rows = routeBindings(route?.config.layers).sort(compareBindings)
        const pending = groupChange(group)
        const hasDraft = drafts[group] && draftDirty(drafts[group])
        const tags = expanded.includes(group) ? rows : rows.slice(0, 3)
        return <div key={group} role="row" data-route-group={group} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,2fr)_72px_36px] items-center gap-2 border-b py-3 text-sm sm:grid-cols-[minmax(120px,1fr)_minmax(0,4fr)_120px_64px] sm:gap-4">
          <div role="cell" className="break-all font-medium">{group}</div><div role="cell" className="flex min-w-0 flex-wrap items-center gap-1.5">{tags.map((row) => {
            const channel = data.channels.find((item) => item.id === row.logical_id)
            const name = channel?.name ?? row.logical_id
            return <Badge key={row.logical_id} variant="secondary" className="max-w-full min-w-0 flex-wrap gap-x-1 gap-y-0.5 rounded px-2 py-1 font-normal" title={`${name} · 成本倍率 ${cost(channel?.cost_ratio)} · 优先级 ${row.priority} · 权重 ${row.weight}`}><span className="min-w-0 truncate">{name}</span><span className="font-mono text-[10px] text-muted-foreground">{cost(channel?.cost_ratio)}</span><span className="font-mono text-[10px] text-muted-foreground">{row.priority}</span></Badge>
          })}{!rows.length ? <span className="text-xs text-muted-foreground">未绑定渠道</span> : null}{rows.length > 3 ? <Button variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={() => setExpanded((current) => current.includes(group) ? current.filter((item) => item !== group) : [...current, group])}>{expanded.includes(group) ? <ChevronUp /> : <ChevronDown />}{expanded.includes(group) ? '收起' : `更多 ${rows.length - 3}`}</Button> : null}</div>
          <div role="cell" className="min-w-0 text-xs">{pending ? <button className="text-start text-warning underline" onClick={() => { setReview(null); setResult(pending); setChangeId(pending.id); setSaveError('') }}>{pending.status === 'partial' ? '部分失败' : '执行中'}</button> : hasDraft ? <span className="text-warning">未保存</span> : <span className={rows.length ? 'text-success' : 'text-muted-foreground'}>{rows.length ? '已配置' : '未配置'}</span>}{route ? <span className="mt-1 block font-mono text-muted-foreground">r{route.revision}</span> : null}</div>
          <div role="cell"><ToolButton label={`配置 ${group}`} icon={Pencil} disabled={busy} onClick={() => requestGroup(group)} /></div>
        </div>
      })}
      {!visible.length ? <p className="py-10 text-center text-sm text-muted-foreground">{data.groups.length ? '没有匹配的分组' : '暂无分组'}</p> : null}
    </div>
    {saveError && !review && !changeId ? <p role="alert" className="break-all text-sm text-destructive">{saveError}</p> : null}
    <Sheet open={Boolean(editing)} onOpenChange={(open) => { if (!open && !busy) requestGroup(null) }}><SheetContent side="right" onEscapeKeyDown={(event) => { if (event.target instanceof Element && event.target.closest('[data-slot="popover-content"]')) event.preventDefault() }} className="w-full min-w-0 gap-0 overflow-hidden sm:max-w-[960px]"><SheetHeader className="shrink-0 border-b pe-12"><SheetTitle className="break-all">{editing} 渠道配置</SheetTitle><SheetDescription>更改在确认保存后生效</SheetDescription></SheetHeader>{saveError && !review && !changeId ? <p role="alert" className="break-all px-4 pt-3 text-sm text-destructive">{saveError}</p> : null}{editing && drafts[editing] ? renderEditor(editing) : null}</SheetContent></Sheet>
    <Dialog open={Boolean(leaving)} onOpenChange={(open) => { if (!open) setLeaving(null) }}><DialogContent><DialogHeader><DialogTitle>{leaving?.reload ? '核对最新配置' : '存在未保存内容'}</DialogTitle><DialogDescription>{leaving?.reload ? '重新载入最新配置将丢弃当前分组草稿。其他分组草稿不受影响。' : '可以保留此分组草稿，稍后继续编辑。'}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setLeaving(null)}>继续编辑</Button><Button variant="outline" onClick={() => { const next = leaving!.next; if (editing) setDrafts((current) => ({ ...current, [editing]: createDraft(editing) })); setLeaving(null); openGroup(next) }}>{leaving?.reload ? '载入最新配置' : '丢弃草稿'}</Button>{!leaving?.reload ? <Button onClick={() => { const next = leaving!.next; setLeaving(null); openGroup(next) }}>保留草稿并离开</Button> : null}</DialogFooter></DialogContent></Dialog>
    <Dialog open={blocker.status === 'blocked'} onOpenChange={(open) => { if (!open && blocker.status === 'blocked') blocker.reset() }}><DialogContent><DialogHeader><DialogTitle>离开分组路由？</DialogTitle><DialogDescription>尚有未保存的分组草稿，离开页面后将丢失。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => blocker.status === 'blocked' && blocker.reset()}>继续编辑</Button><Button variant="destructive" onClick={() => blocker.status === 'blocked' && blocker.proceed()}>丢弃并离开</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={emptyConfirm} onOpenChange={setEmptyConfirm}><DialogContent><DialogHeader><DialogTitle>确认清空渠道绑定</DialogTitle><DialogDescription className="break-words">该分组将没有受本系统管理的路由渠道。渠道本身和其他分组不受影响。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setEmptyConfirm(false)}>取消</Button><Button variant="destructive" disabled={preview.isPending} onClick={() => editing && preview.mutate({ group: editing, confirmEmpty: true })}>确认清空并预览</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(review || changeId)} onOpenChange={(open) => { if (!open) closeReview() }}><DialogContent className="max-h-[90svh] w-[calc(100%-2rem)] min-w-0 overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="break-all">{review?.group ?? change?.target} · {change ? change.status === 'success' ? '已保存' : '执行进度' : '保存预览'}</DialogTitle><DialogDescription>{change?.status === 'success' ? '实际路由字段已重新读取并核对成功。' : '确认渠道增减、优先级、权重和模型覆盖后执行。'}</DialogDescription></DialogHeader>
      {review && !change ? <div className="min-w-0 space-y-4 text-sm"><div className="max-h-52 divide-y overflow-y-auto border-y">{review.preview.changes?.map((item) => <div key={item.logical_id} className="py-2"><strong className="break-all font-medium">{data.channels.find((channel) => channel.id === item.logical_id)?.name ?? item.logical_id}</strong><p className="mt-1 text-xs text-muted-foreground">{!item.before ? '新增绑定' : !item.after ? '移除绑定' : '修改配置'} · {item.before ? `优先级 ${item.before.priority} / 权重 ${item.before.weight}` : '未绑定'} → {item.after ? `优先级 ${item.after.priority} / 权重 ${item.after.weight}` : '未绑定'}</p></div>)}</div>
        {!review.input.layers.length ? <p className="text-warning">该分组将没有受本系统管理的路由渠道。</p> : null}
        <details open={Boolean(review.preview.uncovered_models?.length)}><summary className="cursor-pointer text-sm">模型覆盖缺口 {Object.values(review.preview.model_coverage).filter((coverage) => !coverage.length || coverage.some((covered) => !covered)).length}</summary><div className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs">{Object.entries(review.preview.model_coverage).filter(([, coverage]) => !coverage.length || coverage.some((covered) => !covered)).map(([model, coverage]) => <p key={model} className="break-all"><span className="font-medium">{model}</span><span className="text-warning"> · {!coverage.some(Boolean) ? '保存后将无渠道覆盖' : `优先级 ${coverage.flatMap((covered, index) => covered ? [] : [review.input.layers[index]?.priority]).join('、')} 无覆盖`}</span></p>)}</div></details>
        {review.preview.nonstandard_channels.length ? <div className="space-y-2"><p className="text-warning">该分组有 {review.preview.nonstandard_channels.length} 条非标准物理渠道，将保持原状。</p><ul className="max-h-40 space-y-1 overflow-y-auto text-xs">{review.preview.nonstandard_channels.map((channel) => <li key={channel.id} className="break-all">#{channel.id} · {channel.name || '未命名渠道'} · {channel.status === 1 ? '启用' : channel.status === 3 ? '自动禁用' : '停用'}</li>)}</ul><label className="flex items-start gap-2 text-sm"><Checkbox disabled={busy} checked={review.input.acknowledge_nonstandard === true} onCheckedChange={(checked) => setReview((current) => current ? { ...current, input: { ...current.input, acknowledge_nonstandard: checked === true } } : current)} />我已核对并确认保留以上非标准物理渠道</label></div> : null}
      </div> : null}
      {change || busy ? <div><p className="mb-2 text-sm">{finished}/{steps.length} 步完成{change?.status === 'partial' ? ' · 部分失败' : ''}</p><progress className="h-2 w-full" value={finished} max={steps.length || 1} /></div> : null}
      <details open={Boolean(change || busy)}><summary className="cursor-pointer text-sm">执行步骤 ({steps.length})</summary><ol className="mt-2 max-h-52 space-y-2 overflow-y-auto">{steps.map((step, index) => <li key={index} className="flex items-start gap-2 text-xs">{step.status === 'success' ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <span className="w-4 shrink-0 text-muted-foreground">{index + 1}</span>}<span className="min-w-0 break-all">{step.label}{step.error ? <span className="block text-destructive">{step.error}</span> : null}</span></li>)}</ol></details>
      {saveError || change?.error ? <p role="alert" className="break-all text-sm text-destructive">{saveError || change?.error}</p> : null}
      <DialogFooter><Button variant="outline" disabled={busy} onClick={closeReview}>{change?.status === 'success' ? '完成' : '关闭'}</Button>{change?.status === 'partial' ? <Button disabled={busy} onClick={() => { setSaveError(''); resume.mutate() }}>{busy ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}继续执行</Button> : !change ? <Button disabled={busy || Boolean(saveError) || Boolean(review?.preview.nonstandard_channels.length && !review.input.acknowledge_nonstandard)} onClick={() => execute.mutate()}>{busy ? <LoaderCircle className="animate-spin" /> : <ClipboardCheck />}{busy ? '执行中' : '确认保存'}</Button> : null}</DialogFooter>
    </DialogContent></Dialog>
  </div>
}
