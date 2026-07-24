import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { BarChart3, GitBranch, LineChart, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getFlowQuotaData, getQuotaData, type FlowQuotaDataPoint, type QuotaDataPoint } from '@partokens/api-client'
import { isAppLocale } from '@partokens/i18n'

import { DataState, Metric, PageHeader } from '@/components/ui'
import { formatInteger, formatQuota } from '@/lib/format'

type MetricKey = 'quota' | 'tokens' | 'requests'
type ViewMode = 'chart' | 'table'

function pointValue(point: QuotaDataPoint, metric: MetricKey) {
  if (metric === 'quota') return Number(point.quota || 0)
  if (metric === 'tokens') return Number(point.token_used || 0)
  return Number(point.request_count || (point as { count?: number }).count || 0)
}

function flowValue(point: FlowQuotaDataPoint, metric: MetricKey) {
  if (metric === 'quota') return Number(point.quota || 0)
  if (metric === 'tokens') return Number(point.token_used || 0)
  return Number(point.count || 0)
}

function bucketLabel(timestamp: number, granularity: 'hour' | 'day', locale: string) {
  const date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat(locale, granularity === 'hour'
    ? { month: 'short', day: '2-digit', hour: '2-digit' }
    : { month: 'short', day: '2-digit' }).format(date)
}

function formatMetric(value: number, metric: MetricKey, locale: string) {
  return metric === 'quota' ? formatQuota(value, locale) : formatInteger(value, locale)
}

function TrendChart({ data, metric, locale }: { data: Array<{ label: string; value: number }>; metric: MetricKey; locale: string }) {
  const { t } = useTranslation()
  const width = 760
  const height = 250
  const inset = { top: 18, right: 18, bottom: 34, left: 18 }
  const max = Math.max(...data.map((item) => item.value), 1)
  const usableWidth = width - inset.left - inset.right
  const usableHeight = height - inset.top - inset.bottom
  const points = data.map((item, index) => {
    const x = inset.left + (data.length <= 1 ? usableWidth / 2 : (index / (data.length - 1)) * usableWidth)
    const y = inset.top + usableHeight - (item.value / max) * usableHeight
    return { ...item, x, y }
  })
  const polyline = points.map(({ x, y }) => `${x},${y}`).join(' ')
  const labelIndexes = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])
  return <div className="trend-chart"><svg role="img" aria-label={t('Usage trend')} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><g className="chart-grid"><line x1={inset.left} x2={width - inset.right} y1={inset.top} y2={inset.top} /><line x1={inset.left} x2={width - inset.right} y1={inset.top + usableHeight / 2} y2={inset.top + usableHeight / 2} /><line x1={inset.left} x2={width - inset.right} y1={inset.top + usableHeight} y2={inset.top + usableHeight} /></g><polyline className="trend-line" points={polyline} />{points.map((point, index) => <g key={`${point.label}:${index}`}><circle className="trend-point" cx={point.x} cy={point.y} r="3"><title>{point.label}: {formatMetric(point.value, metric, locale)}</title></circle>{labelIndexes.has(index) ? <text x={point.x} y={height - 9} textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}>{point.label}</text> : null}</g>)}</svg></div>
}

export function AnalyticsPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const [days, setDays] = useState(30)
  const [granularity, setGranularity] = useState<'hour' | 'day'>('day')
  const [metric, setMetric] = useState<MetricKey>('quota')
  const [view, setView] = useState<ViewMode>('chart')
  const range = useMemo(() => {
    const end = Math.floor(Date.now() / 1000)
    return { start_timestamp: end - days * 86400, end_timestamp: end, default_time: granularity }
  }, [days, granularity])
  const query = useQuery({ queryKey: ['quota-data', days, granularity], queryFn: () => getQuotaData(range), retry: false })
  const flow = useQuery({ queryKey: ['flow-quota-data', days, granularity], queryFn: () => getFlowQuotaData(range), retry: false })
  const points: QuotaDataPoint[] = Array.isArray(query.data?.data) ? query.data.data : []
  const flowPoints: FlowQuotaDataPoint[] = Array.isArray(flow.data?.data) ? flow.data.data : []

  const summary = useMemo(() => points.reduce<{ quota: number; tokens: number; requests: number }>((acc, point) => ({ quota: acc.quota + Number(point.quota || 0), tokens: acc.tokens + Number(point.token_used || 0), requests: acc.requests + Number(point.request_count || (point as { count?: number }).count || 0) }), { quota: 0, tokens: 0, requests: 0 }), [points])
  const trend = useMemo(() => {
    const buckets = new Map<string, { timestamp: number; value: number }>()
    for (const point of points) {
      const timestamp = Number(point.created_at || 0)
      const date = new Date(timestamp * 1000)
      if (granularity === 'day') date.setHours(0, 0, 0, 0)
      else date.setMinutes(0, 0, 0)
      const key = String(date.getTime())
      const current = buckets.get(key) || { timestamp: Math.floor(date.getTime() / 1000), value: 0 }
      current.value += pointValue(point, metric)
      buckets.set(key, current)
    }
    return [...buckets.values()].sort((a, b) => a.timestamp - b.timestamp).map((item) => ({ label: bucketLabel(item.timestamp, granularity, locale), value: item.value }))
  }, [granularity, locale, metric, points])
  const ranking = useMemo(() => {
    const models = new Map<string, { quota: number; tokens: number; requests: number }>()
    for (const point of points) {
      const name = point.model_name || t('Other')
      const current = models.get(name) || { quota: 0, tokens: 0, requests: 0 }
      current.quota += Number(point.quota || 0)
      current.tokens += Number(point.token_used || 0)
      current.requests += Number(point.request_count || (point as { count?: number }).count || 0)
      models.set(name, current)
    }
    return [...models.entries()].sort((a, b) => b[1][metric] - a[1][metric]).slice(0, 10)
  }, [metric, points, t])
  const maxRank = Math.max(...ranking.map(([, values]) => values[metric]), 1)
  const routes = useMemo(() => {
    const groups = new Map<string, FlowQuotaDataPoint>()
    for (const point of flowPoints) {
      const key = `${point.token_name || t('Deleted key')}|${point.use_group || 'default'}|${point.model_name || t('Other')}`
      const current = groups.get(key) || { token_name: point.token_name || t('Deleted key'), use_group: point.use_group || 'default', model_name: point.model_name || t('Other'), quota: 0, token_used: 0, count: 0 }
      current.quota = Number(current.quota || 0) + Number(point.quota || 0)
      current.token_used = Number(current.token_used || 0) + Number(point.token_used || 0)
      current.count = Number(current.count || 0) + Number(point.count || 0)
      groups.set(key, current)
    }
    return [...groups.values()].sort((a, b) => flowValue(b, metric) - flowValue(a, metric)).slice(0, 12)
  }, [flowPoints, metric, t])

  return <div className="console-page analytics-page">
    <PageHeader eyebrow={t('Console analytics')} title={t('Analytics')} description={t('Inspect usage trends, model ranking, and request routes from backend aggregates.')} action={<div className="analytics-controls"><div className="segmented-control">{[7, 30, 90].map((value) => <button key={value} className={days === value ? 'active' : ''} onClick={() => setDays(value)}>{value}{t('days short')}</button>)}</div><div className="segmented-control"><button className={granularity === 'hour' ? 'active' : ''} onClick={() => setGranularity('hour')}>{t('Hourly')}</button><button className={granularity === 'day' ? 'active' : ''} onClick={() => setGranularity('day')}>{t('Daily')}</button></div></div>} />
    <section className="metric-strip"><Metric label={t('Cost')} value={formatQuota(summary.quota, locale)} /><Metric label={t('Tokens')} value={formatInteger(summary.tokens, locale)} /><Metric label={t('Requests')} value={formatInteger(summary.requests, locale)} /><Metric label={t('Models')} value={formatInteger(ranking.length, locale)} /></section>
    <div className="analytics-toolbar"><div className="segmented-control">{([['quota', 'Cost'], ['tokens', 'Tokens'], ['requests', 'Requests']] as const).map(([value, label]) => <button key={value} className={metric === value ? 'active' : ''} onClick={() => setMetric(value)}>{t(label)}</button>)}</div><div className="segmented-control"><button className={view === 'chart' ? 'active' : ''} aria-label={t('Chart view')} onClick={() => setView('chart')}><LineChart size={15} /></button><button className={view === 'table' ? 'active' : ''} aria-label={t('Table view')} onClick={() => setView('table')}><Table2 size={15} /></button></div></div>
    <DataState loading={query.isLoading} error={query.isError ? t('Interface data unavailable') : null} empty={!query.isLoading && points.length === 0} onRetry={() => void query.refetch()}>
      <section className="analytics-grid"><div className="panel trend-panel"><div className="panel-heading"><div><span className="eyebrow">{t('Trend')}</span><h2>{t('Usage over time')}</h2></div><LineChart size={18} /></div>{view === 'chart' ? <TrendChart data={trend} metric={metric} locale={locale} /> : <div className="responsive-table"><table><thead><tr><th>{t('Period')}</th><th>{t(metric === 'quota' ? 'Cost' : metric === 'tokens' ? 'Tokens' : 'Requests')}</th></tr></thead><tbody>{trend.map((item) => <tr key={item.label}><td>{item.label}</td><td>{formatMetric(item.value, metric, locale)}</td></tr>)}</tbody></table></div>}</div><div className="panel ranking-panel"><div className="panel-heading"><div><span className="eyebrow">{t('Ranking')}</span><h2>{t('Models by usage')}</h2></div><BarChart3 size={18} /></div><div className="bar-chart">{ranking.map(([name, values], index) => <div className="rank-row" key={name}><span>{index + 1}</span><div><strong title={name}>{name}</strong><i><b style={{ width: `${Math.max((values[metric] / maxRank) * 100, 2)}%` }} /></i></div><code>{formatMetric(values[metric], metric, locale)}</code></div>)}</div></div></section>
    </DataState>
    <section className="panel flow-panel"><div className="panel-heading"><div><span className="eyebrow">{t('Request routes')}</span><h2>{t('Key and model flow')}</h2></div><GitBranch size={18} /></div><DataState loading={flow.isLoading} error={flow.isError ? t('Flow data unavailable') : null} empty={!flow.isLoading && routes.length === 0} onRetry={() => void flow.refetch()}><div className="flow-list"><div className="flow-list-heading"><span>{t('Key')}</span><span>{t('Group')}</span><span>{t('Model')}</span><span>{t(metric === 'quota' ? 'Cost' : metric === 'tokens' ? 'Tokens' : 'Requests')}</span></div>{routes.map((route, index) => <div className="flow-row" key={`${route.token_name}:${route.use_group}:${route.model_name}:${index}`}><span>{route.token_name}</span><span>{route.use_group}</span><span>{route.model_name}</span><strong>{formatMetric(flowValue(route, metric), metric, locale)}</strong></div>)}</div></DataState></section>
  </div>
}
