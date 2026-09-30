import { useQuery } from '@tanstack/react-query'
import { Activity, LoaderCircle, RefreshCw, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import { getAdminChannelTraffic, type AdminBootstrap, type AdminChannelTraffic, type AdminTrafficPeriod } from '@partokens/api-client'
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@partokens/design-system/components'

import { ChannelProviderIcon } from './channel-provider-icon'

const periods: Array<{ id: AdminTrafficPeriod; label: string }> = [{ id: 'requests_60', label: '最近 60 次请求' }, { id: '6h', label: '近 6 小时' }, { id: '7d', label: '近 7 天' }]
type Metric = 'first_token_ms' | 'cache_rate' | 'success_rate'
const colors = { good: '#059669', medium: '#d97706', bad: '#e11d48' }
function color(value: number, metric: Metric) {
  if (metric === 'first_token_ms') return value <= 1000 ? colors.good : value <= 3000 ? colors.medium : colors.bad
  if (metric === 'cache_rate') return value >= 50 ? colors.good : value >= 20 ? colors.medium : colors.bad
  return value >= 99 ? colors.good : value >= 95 ? colors.medium : colors.bad
}
function time(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(timestamp * 1000)
}
function percent(value?: number | null) { return value == null ? '暂无数据' : `${value.toFixed(1)}%` }
function latency(value?: number | null) { return value == null ? '暂无数据' : `${(value / 1000).toFixed(2)} s` }
function amount(value: number | null | undefined, currency: 'USD' | 'CNY') {
  return value == null ? '待补全' : new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 4, maximumFractionDigits: 6 }).format(value)
}
function integer(value?: number) { return (value ?? 0).toLocaleString('zh-CN') }

function Trend({ data, metric, title }: { data: AdminChannelTraffic; metric: Metric; title: string }) {
  const gradientId = useId()
  const [hovered, setHovered] = useState<number | null>(null)
  const series = data.series
  const values = series.map((point) => point[metric])
  const maximum = metric === 'first_token_ms' ? Math.max(1000, ...values.filter((value): value is number => value != null)) * 1.15 : 100
  const x = (index: number) => series.length < 2 ? 300 : 12 + index / (series.length - 1) * 576
  const y = (value: number) => 160 - value / maximum * 144
  const boundaries = metric === 'first_token_ms' ? [3000, 1000] : metric === 'cache_rate' ? [50, 20] : [99, 95]
  const stops = boundaries.map((value) => Math.max(0, Math.min(1, 1 - value / maximum)))
  const palette = metric === 'first_token_ms' ? [colors.bad, colors.medium, colors.good] : [colors.good, colors.medium, colors.bad]
  const valueText = (value: number | null) => metric === 'first_token_ms' ? latency(value) : percent(value)
  const active = hovered === null ? undefined : series[hovered]
  const legends = metric === 'first_token_ms' ? ['≤ 1 s', '1–3 s', '> 3 s'] : metric === 'cache_rate' ? ['≥ 50%', '20–50%', '< 20%'] : ['≥ 99%', '95–99%', '< 95%']
  return <section className="min-w-0 py-4" aria-label={title}>
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">{title}</h2><span className="font-mono text-sm" style={{ color: data.summary[metric] == null ? undefined : color(data.summary[metric]!, metric) }}>{valueText(data.summary[metric])}</span></div>
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">{legends.map((label, index) => <span key={label} className="inline-flex items-center gap-1.5"><i className="size-1.5 rounded-full" style={{ backgroundColor: [colors.good, colors.medium, colors.bad][index] }} />{label}</span>)}</div>
    <div className="relative mt-3 h-[180px]">
      <div className="absolute inset-y-0 left-0 flex w-10 flex-col justify-between pb-5 text-[10px] tabular-nums text-muted-foreground"><span>{metric === 'first_token_ms' ? `${(maximum / 1000).toFixed(1)} s` : '100%'}</span><span>{metric === 'first_token_ms' ? `${(maximum / 2000).toFixed(1)} s` : '50%'}</span><span>0</span></div>
      <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="ml-10 h-full w-[calc(100%-2.5rem)] overflow-visible" role="img" aria-label={`${title}趋势图`} onPointerLeave={() => setHovered(null)}>
        <defs><linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="16" y2="160"><stop offset="0" stopColor={palette[0]} /><stop offset={stops[0]} stopColor={palette[0]} /><stop offset={stops[0]} stopColor={palette[1]} /><stop offset={stops[1]} stopColor={palette[1]} /><stop offset={stops[1]} stopColor={palette[2]} /><stop offset="1" stopColor={palette[2]} /></linearGradient></defs>
        {[16, 88, 160].map((level) => <line key={level} x1="0" x2="600" y1={level} y2={level} className="stroke-border" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />)}
        {series.map((point, index) => {
          const value = point[metric]
          const previous = series[index - 1]?.[metric]
          if (value == null) return null
          return <g key={index}>
            {previous != null ? <line x1={x(index - 1)} y1={y(previous)} x2={x(index)} y2={y(value)} stroke={`url(#${gradientId})`} strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
            <circle cx={x(index)} cy={y(value)} r={hovered === index ? 4 : 2.5} fill={color(value, metric)} vectorEffect="non-scaling-stroke" />
            <rect x={x(index) - 6} y="0" width="12" height="180" fill="transparent" tabIndex={0} role="button" aria-label={`${time(point.created_at)} ${valueText(value)}，${point.requests} 次请求`} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onPointerEnter={() => setHovered(index)} onClick={() => setHovered(index)}><title>{`${time(point.created_at)} · ${valueText(value)} · ${point.requests} 次请求`}</title></rect>
          </g>
        })}
      </svg>
      {!values.some((value) => value != null) ? <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">{metric === 'first_token_ms' ? '暂无流式首字延迟记录' : '暂无记录'}</p> : null}
    </div>
    <div className="flex justify-between pl-10 text-[10px] text-muted-foreground"><span>{series[0] ? time(series[0].created_at) : ''}</span><span>{series.at(-1) ? time(series.at(-1)!.created_at) : ''}</span></div>
    <p className="mt-3 h-4 truncate text-[11px] text-muted-foreground" role="status">{active ? `${time(active.created_at)} · ${valueText(active[metric])} · ${active.requests} 次请求` : data.period === 'requests_60' ? '逐请求' : data.period === '6h' ? '每 6 分钟汇总' : '每 2 小时 48 分钟汇总'}</p>
  </section>
}

function Summary({ data }: { data: AdminChannelTraffic }) {
  const m = data.summary
  const items = [
    { label: '实际请求', value: integer(m.requests), detail: `${integer(m.successes)} 成功 · ${integer(m.errors)} 失败` },
    { label: '平均首字延迟', value: latency(m.first_token_ms), detail: `P95 ${latency(m.p95_first_token_ms)} · ${integer(m.latency_samples)} 样本` },
    { label: '缓存命中率', value: percent(m.cache_rate), detail: `${integer(m.cached_tokens)} 缓存 token · ${integer(m.cache_samples)} 样本` },
    { label: '请求成功率', value: percent(m.success_rate), detail: `${integer(m.successes)} / ${integer(m.requests)}` },
    { label: 'Token 用量', value: integer(m.total_tokens), detail: `输入 ${integer(m.input_tokens)} · 输出 ${integer(m.output_tokens)}` },
    { label: '原价 · USD', value: amount(m.original_usd, 'USD'), detail: m.unpriced_requests ? `${integer(m.unpriced_requests)} 次缺少原价数据` : '美元' },
    { label: '成本 · CNY', value: amount(m.cost_cny, 'CNY'), detail: data.cost_ratio == null ? '渠道倍率未登记' : `原价 × ${data.cost_ratio.toFixed(3)}` },
  ]
  return <div className="grid grid-cols-2 border-y sm:grid-cols-4 xl:grid-cols-7">{items.map((item) => <div key={item.label} className="min-w-0 py-4 pr-3"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 break-all font-mono text-lg font-semibold tabular-nums">{item.value}</p><p className="mt-1 break-words text-[11px] text-muted-foreground">{item.detail}</p></div>)}</div>
}

function Rate({ value, metric }: { value: number | null; metric: Metric }) {
  return <span className="whitespace-nowrap font-mono text-xs" style={{ color: value == null ? undefined : color(value, metric) }}>{metric === 'first_token_ms' ? latency(value) : percent(value)}</span>
}

function Models({ data, onSelect }: { data: AdminChannelTraffic; onSelect: (model: string) => void }) {
  const [search, setSearch] = useState('')
  const rows = data.models.filter((row) => row.model.toLowerCase().includes(search.toLowerCase()))
  return <section className="min-w-0 border-t">
    <header className="flex flex-wrap items-center justify-between gap-3 py-4"><h2 className="text-sm font-semibold">模型访问汇总 <span className="ml-2 text-xs font-normal text-muted-foreground">{data.models.length}</span></h2><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="搜索监控模型" placeholder="搜索模型" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div></header>
    <div className="max-h-[420px] overflow-auto"><Table aria-label="模型访问汇总"><TableHeader className="sticky top-0 z-10 bg-background"><TableRow><TableHead>模型</TableHead><TableHead>请求</TableHead><TableHead>首字延迟</TableHead><TableHead>缓存率</TableHead><TableHead>成功率</TableHead><TableHead>Token</TableHead><TableHead>原价 USD</TableHead><TableHead>成本 CNY</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.model}><TableCell className="min-w-40 max-w-72"><button className="block w-full break-all text-left font-mono text-xs hover:underline focus-visible:outline-2" onClick={() => onSelect(row.model)} aria-label={`查看 ${row.model} 的请求`}>{row.model}</button></TableCell><TableCell className="font-mono text-xs">{integer(row.requests)}</TableCell><TableCell><Rate value={row.first_token_ms} metric="first_token_ms" /></TableCell><TableCell><Rate value={row.cache_rate} metric="cache_rate" /></TableCell><TableCell><Rate value={row.success_rate} metric="success_rate" /></TableCell><TableCell className="font-mono text-xs">{integer(row.total_tokens)}</TableCell><TableCell className="whitespace-nowrap font-mono text-xs">{amount(row.original_usd, 'USD')}</TableCell><TableCell className="whitespace-nowrap font-mono text-xs">{amount(row.cost_cny, 'CNY')}</TableCell></TableRow>)}{!rows.length ? <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">没有匹配的模型</TableCell></TableRow> : null}</TableBody></Table></div>
  </section>
}

export function ChannelMonitoringView({ data }: { data: AdminBootstrap }) {
  const [selected, setSelected] = useState('')
  const [model, setModel] = useState<string | undefined>()
  const [period, setPeriod] = useState<AdminTrafficPeriod>('requests_60')
  const channel = data.channels.find((item) => item.id === selected) ?? data.channels[0]
  const query = useQuery({ queryKey: ['admin-channel-traffic', channel?.id, period, model], enabled: Boolean(channel), queryFn: async () => (await getAdminChannelTraffic(channel!.id, period, model)).data, staleTime: 30_000, retry: 1 })
  const traffic = query.data
  const models = useMemo(() => [...new Set([...(channel?.models ?? []), ...(traffic?.models.map((row) => row.model) ?? []), ...(model ? [model] : [])])].sort(), [channel, traffic, model])
  return <div className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">ADMIN / CHANNEL MONITORING</p><h1 className="mt-1 text-2xl font-semibold">渠道监控</h1></div><Button variant="outline" disabled={!channel || query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}刷新</Button></header>
    {!channel ? <div className="border-y py-16 text-center"><Activity className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">暂无渠道</p></div> : <>
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:items-end">
        <div className="grid min-w-0 flex-1 gap-1.5 sm:max-w-72"><label className="text-xs text-muted-foreground" htmlFor="monitor-channel">渠道</label><Select value={channel.id} onValueChange={(value) => { setSelected(value); setModel(undefined) }}><SelectTrigger id="monitor-channel" className="w-full min-w-0 [&>span]:truncate"><SelectValue /></SelectTrigger><SelectContent>{data.channels.map((item) => <SelectItem key={item.id} value={item.id}><span className="block max-w-64 truncate">{item.name}</span></SelectItem>)}</SelectContent></Select></div>
        <div className="grid min-w-0 flex-1 gap-1.5 sm:max-w-72"><label className="text-xs text-muted-foreground" htmlFor="monitor-model">模型</label><Select value={model ? `model:${model}` : 'all'} onValueChange={(value) => setModel(value === 'all' ? undefined : value.slice(6))}><SelectTrigger id="monitor-model" className="w-full min-w-0 [&>span]:truncate"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部模型</SelectItem>{models.map((item) => <SelectItem key={item} value={`model:${item}`}><span className="block max-w-64 truncate">{item}</span></SelectItem>)}</SelectContent></Select></div>
        <div className="col-span-2 flex max-w-full flex-wrap gap-1 rounded-md bg-muted p-1" role="group" aria-label="统计周期">{periods.map((item) => <Button key={item.id} size="sm" variant={period === item.id ? 'secondary' : 'ghost'} className={period === item.id ? 'bg-background shadow-sm' : ''} aria-pressed={period === item.id} onClick={() => setPeriod(item.id)}>{item.label}</Button>)}</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><div className="flex min-w-0 items-center gap-2"><ChannelProviderIcon type={channel.channel_type} /><span className="min-w-0 break-all font-medium text-foreground">{channel.name}</span><Badge variant="outline" className="shrink-0">{channel.enabled ? '启用' : '停用'}</Badge></div><span>{traffic ? `更新于 ${time(traffic.observed_at)}` : '等待数据'}</span></div>
      {query.isError ? <div role="alert" className="border-y border-destructive/30 py-6 text-sm text-destructive">渠道请求数据读取失败{query.error instanceof Error ? `：${query.error.message}` : ''}<Button variant="outline" size="sm" className="ml-3" onClick={() => void query.refetch()}><RefreshCw />重试</Button></div> : query.isPending ? <div role="status" aria-label="正在读取渠道请求数据" className="space-y-5"><Skeleton className="h-28 w-full" /><Skeleton className="h-64 w-full" /></div> : traffic ? <>
        <Summary data={traffic} />
        {!traffic.summary.requests ? <p role="status" className="py-3 text-center text-sm text-muted-foreground">所选渠道与模型在此周期内没有实际请求。</p> : null}
        <div className="grid min-w-0 gap-x-6 lg:grid-cols-3"><Trend key={`${channel.id}-${model}-${period}-latency`} data={traffic} metric="first_token_ms" title="首字延迟" /><Trend key={`${channel.id}-${model}-${period}-cache`} data={traffic} metric="cache_rate" title="缓存命中率" /><Trend key={`${channel.id}-${model}-${period}-success`} data={traffic} metric="success_rate" title="请求成功率" /></div>
        {model == null ? <Models data={traffic} onSelect={setModel} /> : null}
        <section className="min-w-0 border-t"><header className="flex flex-wrap items-center justify-between gap-2 py-4"><h2 className="text-sm font-semibold">近期请求</h2><span className="text-xs text-muted-foreground">最近 {traffic.recent_requests.length} 条</span></header><div className="max-h-[480px] overflow-auto"><Table aria-label="近期实际请求"><TableHeader className="sticky top-0 z-10 bg-background"><TableRow><TableHead>时间</TableHead><TableHead>模型</TableHead><TableHead>结果</TableHead><TableHead>首字延迟</TableHead><TableHead>缓存率</TableHead><TableHead>Token</TableHead><TableHead>原价 USD</TableHead><TableHead>成本 CNY</TableHead></TableRow></TableHeader><TableBody>{traffic.recent_requests.map((row, index) => <TableRow key={`${row.channel_id}-${row.id}-${index}`}><TableCell className="whitespace-nowrap text-xs">{time(row.created_at)}</TableCell><TableCell className="min-w-32 max-w-64 break-all font-mono text-xs">{row.model}</TableCell><TableCell><Badge variant="outline" className={row.success ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive'}>{row.success ? '成功' : '失败'}</Badge></TableCell><TableCell><Rate value={row.first_token_ms} metric="first_token_ms" /></TableCell><TableCell><Rate value={row.cache_rate} metric="cache_rate" /></TableCell><TableCell className="font-mono text-xs">{integer(row.total_tokens)}</TableCell><TableCell className="whitespace-nowrap font-mono text-xs">{amount(row.original_usd, 'USD')}</TableCell><TableCell className="whitespace-nowrap font-mono text-xs">{amount(row.cost_cny, 'CNY')}</TableCell></TableRow>)}{!traffic.recent_requests.length ? <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">暂无请求记录</TableCell></TableRow> : null}</TableBody></Table></div></section>
        <details className="border-t pt-4 text-xs text-muted-foreground"><summary className="cursor-pointer">统计口径</summary><div className="mt-3 space-y-2 leading-relaxed"><p>同一请求在此渠道的重试合并计数，成功率为渠道成功请求数 / 实际请求数。流式中断计为失败；请求在其他渠道重试成功，不会改变本渠道的结果。</p><p>首字延迟仅统计流式请求日志中有效的首响应时间。缓存率为缓存读取 token / 总输入 token，按 token 加权；缺失缓存字段的记录不计入缓存率。</p><p>原价为日志消费额度剔除用户分组计费倍率后的美元金额。成本按当前渠道登记倍率计算，单位人民币。未登记倍率或缺失计费信息时，金额显示待补全。</p><p>时间周期统计全量日志，图表按时间段汇总；最近 60 次请求按当前渠道与模型筛选取最近 60 个请求。历史范围受上游日志保留时间限制。</p></div></details>
      </> : null}
    </>}
  </div>
}
