import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Columns3,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Home,
  Image as ImageIcon,
  KeyRound,
  Languages,
  LayoutDashboard,
  ListFilter,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { PartokensMark } from '@partokens/design-system/components'
import { localeLabels, locales, resources, type AppLocale } from '@partokens/i18n'

import { translateConsoleData } from './console-data-copy'
import { ConsoleAccountPage, type ConsoleAccountScreen } from './console-account-prototype'
import { useDialogBehavior } from './console-dialog-behavior'
import { ConsolePlaygroundPage } from './console-playground-prototype'
import { ConsoleStudioPage } from './console-studio-prototype'

export type ConsoleDataScreen = 'console' | 'console-analytics' | 'console-keys' | 'console-logs' | 'console-playground' | 'console-studio' | ConsoleAccountScreen

type Theme = 'light' | 'dark'
type ConsoleTarget = ConsoleDataScreen | 'home' | 'models' | 'docs' | 'about' | 'notices' | 'signin'

type ConsoleDataPrototypeProps = {
  screen: ConsoleDataScreen
  locale: AppLocale
  theme: Theme
  online: boolean | null
  version?: string
  onLocale: (locale: AppLocale) => void
  onTheme: () => void
  go: (target: ConsoleTarget) => void
}

type KeyRecord = {
  id: number
  name: string
  suffix: string
  active: boolean
  quota: string
  group: string
  modelCount: number | 'all'
  lastUsed: string
  expiry: string
}

type LogRecord = {
  id: string
  time: string
  type: 'Usage' | 'Login' | 'System' | 'Error'
  keyName: string
  model: string
  streaming: boolean | null
  tokens: string
  cost: string
  latency: string
  status: 'success' | 'danger' | 'info'
  group: 'default' | 'trial' | ''
}

const keysSeed: KeyRecord[] = [
  { id: 1, name: 'Production', suffix: 'A7K2', active: true, quota: '$50.00 / $100', group: 'default', modelCount: 3, lastUsed: '2 min', expiry: '2026-12-31' },
  { id: 2, name: 'Image studio', suffix: 'P3M8', active: true, quota: '$12.04 / $25', group: 'default', modelCount: 2, lastUsed: '1 h', expiry: '2026-09-30' },
  { id: 3, name: 'Legacy script', suffix: 'R9D1', active: false, quota: '$9.18 / $10', group: 'trial', modelCount: 'all', lastUsed: '18 d', expiry: '2026-08-01' },
]

const logsSeed: LogRecord[] = [
  { id: 'req_7D4A', time: '10:42:18', type: 'Usage', keyName: 'Production', model: 'gpt-4.1-mini', streaming: true, tokens: '1,842', cost: '$0.018', latency: '842 ms', status: 'success', group: 'default' },
  { id: 'req_4C21', time: '10:31:06', type: 'Usage', keyName: 'Production', model: 'claude-3.7-sonnet', streaming: true, tokens: '3,206', cost: '$0.064', latency: '1.2 s', status: 'success', group: 'default' },
  { id: 'evt_A91F', time: '10:08:44', type: 'Login', keyName: '', model: '', streaming: null, tokens: '', cost: '', latency: '', status: 'info', group: '' },
  { id: 'req_9B03', time: '09:58:27', type: 'Error', keyName: 'Image studio', model: 'imagen-3', streaming: false, tokens: '0', cost: '$0.000', latency: '418 ms', status: 'danger', group: 'trial' },
  { id: 'evt_11E8', time: '09:30:12', type: 'System', keyName: '', model: '', streaming: null, tokens: '', cost: '', latency: '', status: 'info', group: '' },
]

const chartData = [
  { label: '07/16', requests: 42, tokens: 72, cost: 38 },
  { label: '07/17', requests: 68, tokens: 61, cost: 54 },
  { label: '07/18', requests: 54, tokens: 48, cost: 42 },
  { label: '07/19', requests: 82, tokens: 86, cost: 72 },
  { label: '07/20', requests: 61, tokens: 58, cost: 61 },
  { label: '07/21', requests: 88, tokens: 94, cost: 88 },
  { label: '07/22', requests: 73, tokens: 79, cost: 68 },
]

function translate(locale: AppLocale, key: string) {
  const local = translateConsoleData(locale, key)
  return local === key ? (resources[locale].translation as Record<string, string>)[key] ?? key : local
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="r33-brand"><span><PartokensMark size={31} /></span>{compact ? null : <strong>Partokens</strong>}</span>
}

function ToolButton({ label, children, onClick, className = '' }: { label: string; children: ReactNode; onClick?: () => void; className?: string }) {
  return <button type="button" className={`pt-icon-button ${className}`} aria-label={label} title={label} onClick={onClick}>{children}</button>
}

function RouteButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" className="pt-button" data-variant="primary" onClick={onClick}><span>{children}</span><span className="pt-button-endcap"><ArrowRight size={16} /></span></button>
}

function LocaleSelect({ locale, onLocale }: Pick<ConsoleDataPrototypeProps, 'locale' | 'onLocale'>) {
  const t = (key: string) => translate(locale, key)
  return <label className="r33-locale"><Languages size={16} /><span className="sr-only">{t('Language')}</span><select value={locale} aria-label={t('Language')} onChange={(event) => onLocale(event.target.value as AppLocale)}>{locales.map((item) => <option value={item} key={item}>{localeLabels[item]}</option>)}</select><ChevronDown size={13} /></label>
}

function Status({ tone, children }: { tone: 'success' | 'info' | 'warning' | 'danger'; children: ReactNode }) {
  return <span className="pt-status" data-tone={tone}>{children}</span>
}

function PageHeading({ eyebrow, title, body, actions }: { eyebrow: string; title: string; body: string; actions?: ReactNode }) {
  return <header className="r33-page-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{body}</p></div>{actions ? <div className="r33-page-actions">{actions}</div> : null}</header>
}

function MetricStrip({ locale }: { locale: AppLocale }) {
  const t = (key: string) => translate(locale, key)
  const items = [
    [t('Account balance'), '$82.40', 'USD'],
    [t('Recent usage'), '$9.18', '30 d'],
    [t('Total usage'), '$126.54', 'USD'],
    [t('Requests'), '1,284', '+14.2%'],
  ]
  return <section className="r33-metric-strip" aria-label={t('Overview')}>{items.map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</section>
}

function OverviewPage({ locale, online, version, go, defer }: { locale: AppLocale; online: boolean | null; version?: string; go: (target: ConsoleTarget) => void; defer: () => void }) {
  const t = (key: string) => translate(locale, key)
  return <>
    <PageHeading eyebrow={`${t('Console')} / ${t('Overview')}`} title={t('Overview')} body={t('Account readiness, quota, and the next useful action in one view.')} actions={<><span className="r33-draft-label">{t('Draft content')}</span><button type="button" className="pt-button" data-variant="secondary" onClick={() => go('console-keys')}><KeyRound size={16} />{t('Create a key')}</button><RouteButton onClick={defer}><Plus size={16} />{t('New chat')}</RouteButton></>} />
    <MetricStrip locale={locale} />

    <div className="r33-overview-grid">
      <section className="r33-section r33-readiness">
        <header><div><span>READINESS</span><h2>{t('Request readiness')}</h2></div><Status tone="success">3 / 3</Status></header>
        <div className="r33-ready-steps">
          {[
            [t('Account ready'), CircleUserRound],
            [t('API key ready'), KeyRound],
            [t('First request'), CheckCircle2],
          ].map(([label, icon]) => { const Icon = icon as LucideIcon; return <div key={label as string}><span><Icon size={17} /></span><strong>{label as string}</strong><Check size={15} /></div> })}
        </div>
        <div className="r33-next-route"><div><small>{t('Available route')}</small><code>/v1/chat/completions</code></div><RouteButton onClick={defer}>{t('Open Playground')}</RouteButton></div>
      </section>

      <section className="r33-section r33-service-panel">
        <header><div><span>PLATFORM</span><h2>{t('Service readiness')}</h2></div><Status tone={online ? 'success' : 'warning'}>{online ? t('Available') : t('Awaiting status')}</Status></header>
        <div className="r33-service-line"><span className={online ? 'is-online' : ''}><i />API</span><strong>{version ?? 'v1.0.0-rc.21'}</strong></div>
        <p>{t('Availability and request state without guesswork.')}</p>
        <button type="button" className="pt-button" data-variant="quiet" onClick={() => go('notices')}>{t('Notices')}<ArrowRight size={14} /></button>
      </section>
    </div>

    <section className="r33-section r33-call-track">
      <header><div><span>REQUEST ROUTE</span><h2>{t('Live request trace')}</h2></div><button type="button" className="pt-button" data-variant="quiet" onClick={() => go('console-logs')}>{t('Inspect logs')}<ArrowRight size={14} /></button></header>
      <div className="r33-track" aria-label={t('Request routes')}>
        <div><span><BookOpen size={17} /></span><small>Client</small><strong>OpenAI SDK</strong></div><i />
        <div><span><Route size={17} /></span><small>{t('Available route')}</small><strong>POST /v1</strong></div><i />
        <div><span><Bot size={17} /></span><small>{t('Provider route')}</small><strong>Auto / default</strong></div><i />
        <div><span><Check size={17} /></span><small>{t('Status')}</small><strong>{t('Available')}</strong></div>
      </div>
    </section>

    <section className="r33-section r33-table-section">
      <header><div><span>RECENT</span><h2>{t('Recent usage')}</h2></div><button type="button" className="pt-button" data-variant="quiet" onClick={() => go('console-logs')}>{t('View all')}<ArrowRight size={14} /></button></header>
      <div className="r33-table-wrap"><table className="pt-table"><thead><tr><th>{t('Time')}</th><th>{t('Model')}</th><th>{t('Key')}</th><th>{t('Status')}</th><th>{t('Cost')}</th><th>{t('Latency')}</th></tr></thead><tbody>{logsSeed.slice(0, 3).map((row) => <tr key={row.id}><td className="r33-mono">{row.time}</td><td>{row.model || '—'}</td><td>{row.keyName || '—'}</td><td><Status tone={row.status}>{row.status === 'success' ? t('Available') : t(row.type)}</Status></td><td className="r33-mono">{row.cost || '—'}</td><td className="r33-mono">{row.latency || '—'}</td></tr>)}</tbody></table></div>
    </section>
  </>
}

type AnalyticsMeasure = 'requests' | 'tokens' | 'cost'
type AnalyticsView = 'trend' | 'ranking' | 'flow'

function AnalyticsPage({ locale }: { locale: AppLocale }) {
  const t = (key: string) => translate(locale, key)
  const [measure, setMeasure] = useState<AnalyticsMeasure>('requests')
  const [view, setView] = useState<AnalyticsView>('trend')
  const [range, setRange] = useState('7')
  const labelForMeasure = measure === 'requests' ? t('Requests') : measure === 'tokens' ? t('Tokens') : t('Cost')
  const viewLabel = view === 'trend' ? t('Trend') : view === 'ranking' ? t('Ranking') : t('Key and model flow')
  return <>
    <PageHeading eyebrow={`${t('Console')} / ${t('Analytics')}`} title={t('Analytics')} body={t('Inspect usage trends, model ranking, and request routes from backend aggregates.')} actions={<><span className="r33-draft-label">{t('Draft content')}</span><button type="button" className="pt-button" data-variant="secondary"><RefreshCw size={16} />{t('Refresh')}</button></>} />

    <section className="r33-filter-bar" aria-label={t('Filters')}>
      <label className="pt-field"><span>{t('Time range')}</span><span className="pt-field-control"><Filter className="pt-field-leading" size={16} /><select value={range} onChange={(event) => setRange(event.target.value)}><option value="7">7 d</option><option value="30">30 d</option><option value="90">90 d</option></select></span></label>
      <label className="pt-field"><span>{t('Granularity')}</span><span className="pt-field-control"><SlidersHorizontal className="pt-field-leading" size={16} /><select defaultValue="day"><option value="hour">1 h</option><option value="day">1 d</option><option value="week">1 w</option></select></span></label>
      <div className="r33-filter-measure"><span>{t('Measure')}</span><div className="pt-segmented">{(['requests', 'tokens', 'cost'] as AnalyticsMeasure[]).map((item) => <button type="button" key={item} aria-pressed={measure === item} onClick={() => setMeasure(item)}>{item === 'requests' ? t('Requests') : item === 'tokens' ? t('Tokens') : t('Cost')}</button>)}</div></div>
      <button type="button" className="pt-button" data-variant="secondary">{t('Apply filters')}</button>
    </section>

    <section className="r33-section r33-analytics-stage">
      <header><div><span>ANALYTICS</span><h2>{viewLabel}</h2></div><div className="pt-segmented">{(['trend', 'ranking', 'flow'] as AnalyticsView[]).map((item) => <button type="button" key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item === 'trend' ? t('Trend') : item === 'ranking' ? t('Ranking') : t('Key and model flow')}</button>)}</div></header>
      {view === 'trend' ? <div className="r33-chart-layout"><figure className="r33-bar-chart"><figcaption><span>{labelForMeasure}</span><strong>{measure === 'requests' ? '468' : measure === 'tokens' ? '18.6K' : '$12.42'}</strong><small>{range} d</small></figcaption><div aria-hidden="true">{chartData.map((item) => <span key={item.label}><i style={{ height: `${item[measure]}%` }} /><small>{item.label.slice(3)}</small></span>)}</div></figure><div className="r33-chart-summary"><span>{t('Usage over time')}</span><strong>+14.2%</strong><p>{t('Usage and logs tied back to the request.')}</p><div><i data-tone="blue" />{t('Current period')}</div><div><i data-tone="gray" />{t('Previous period')}</div></div></div> : null}
      {view === 'ranking' ? <div className="r33-ranking">{[['gpt-4.1-mini', '42%', '$4.82'], ['claude-3.7-sonnet', '31%', '$3.91'], ['gemini-2.5-flash', '18%', '$2.14'], ['imagen-3', '9%', '$1.55']].map(([name, share, cost], index) => <div key={name}><span>0{index + 1}</span><strong>{name}</strong><i><b style={{ width: share }} /></i><small>{share}</small><code>{cost}</code></div>)}</div> : null}
      {view === 'flow' ? <div className="r33-flow-list">{[['Production', 'gpt-4.1-mini', '642'], ['Production', 'claude-3.7-sonnet', '388'], ['Image studio', 'imagen-3', '94']].map(([keyName, model, requests]) => <div key={`${keyName}-${model}`}><span><KeyRound size={16} />{keyName}</span><ArrowRight size={15} /><strong><Bot size={16} />{model}</strong><code>{requests}</code></div>)}</div> : null}
      <details className="r33-data-details"><summary>{t('View chart data')}</summary><div className="r33-table-wrap"><table className="pt-table"><thead><tr><th>{t('Time')}</th><th>{t('Requests')}</th><th>{t('Tokens')}</th><th>{t('Cost')}</th></tr></thead><tbody>{chartData.map((item) => <tr key={item.label}><td>{item.label}</td><td>{Math.round(item.requests * 1.8)}</td><td>{Math.round(item.tokens * 320)}</td><td>${(item.cost / 24).toFixed(2)}</td></tr>)}</tbody></table></div></details>
    </section>

    <div className="r33-analytics-foot">
      <section className="r33-section"><header><div><span>MODELS</span><h2>{t('Models by usage')}</h2></div></header><div className="r33-mini-stats"><div><span>{t('Model')}</span><strong>4</strong></div><div><span>{t('Success rate')}</span><strong>98.7%</strong></div><div><span>{t('Latency')}</span><strong>842 ms</strong></div></div></section>
      <section className="r33-section"><header><div><span>ROUTES</span><h2>{t('Request routes')}</h2></div></header><div className="r33-route-split"><span><i style={{ width: '76%' }} /></span><div><strong>/v1/chat</strong><small>76%</small></div><div><strong>/v1/images</strong><small>24%</small></div></div></section>
    </div>
  </>
}

type KeyDialog = { kind: 'reveal' | 'revealed' | 'delete'; key: KeyRecord } | { kind: 'batch' } | null
type KeyColumn = 'quota' | 'models' | 'lastUsed'

function KeysPage({ locale, go, notify }: { locale: AppLocale; go: (target: ConsoleTarget) => void; notify: (message: string) => void }) {
  const t = (key: string) => translate(locale, key)
  const [keys, setKeys] = useState(keysSeed)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<number[]>([])
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Record<KeyColumn, boolean>>({ quota: true, models: true, lastUsed: true })
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit'; key?: KeyRecord } | null>(null)
  const [dialog, setDialog] = useState<KeyDialog>(null)
  const [copied, setCopied] = useState(false)
  const [draftName, setDraftName] = useState('')
  const dialogRef = useDialogBehavior<HTMLElement>(Boolean(dialog), () => setDialog(null))
  const filtered = keys.filter((key) => (!search || key.name.toLowerCase().includes(search.toLowerCase()) || key.suffix.toLowerCase().includes(search.toLowerCase())) && (status === 'all' || String(key.active) === status))
  const keyTableColumnCount = 7 + Object.values(visibleColumns).filter(Boolean).length

  const openDrawer = (mode: 'create' | 'edit', key?: KeyRecord) => { setDraftName(key?.name ?? ''); setDrawer({ mode, key }) }
  const saveKey = () => {
    if (!draftName.trim()) return
    if (drawer?.mode === 'edit' && drawer.key) setKeys((current) => current.map((item) => item.id === drawer.key?.id ? { ...item, name: draftName.trim() } : item))
    else setKeys((current) => [{ id: Date.now(), name: draftName.trim(), suffix: 'N4X8', active: true, quota: '$0.00 / $25', group: 'default', modelCount: 2, lastUsed: '—', expiry: '2026-12-31' }, ...current])
    setDrawer(null)
    notify(t(drawer?.mode === 'edit' ? 'Changes saved' : 'Key created'))
  }
  const removeKey = (key: KeyRecord) => { setKeys((current) => current.filter((item) => item.id !== key.id)); setSelected((current) => current.filter((id) => id !== key.id)); setDialog(null); notify(t('Deleted key')) }
  const removeSelected = () => { setKeys((current) => current.filter((item) => !selected.includes(item.id))); setSelected([]); setDialog(null); notify(t('Deleted key')) }
  const copyRevealed = async () => {
    try { await navigator.clipboard.writeText('sk-pt-demo-R7Q4-A7K2') } catch { /* Prototype browsers may deny clipboard permission. */ }
    setCopied(true)
  }

  return <>
    <PageHeading eyebrow={`${t('Console')} / ${t('API keys')}`} title={t('API keys')} body={t('Create and inspect scoped credentials. Full keys are never shown by default.')} actions={<><span className="r33-draft-label">{t('Draft content')}</span><RouteButton onClick={() => openDrawer('create')}><Plus size={16} />{t('Create a key')}</RouteButton></>} />

    <section className="r33-key-toolbar">
      <label className="r33-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label={t('Search keys')} placeholder={t('Search keys')} /></label>
      <label className="r33-compact-select"><ListFilter size={16} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={t('Status')}><option value="all">{t('All types')}</option><option value="true">{t('Active')}</option><option value="false">{t('Disabled')}</option></select><ChevronDown size={14} /></label>
      <div className="r33-column-menu"><button type="button" className="pt-button" data-variant="secondary" aria-expanded={columnsOpen} onClick={() => setColumnsOpen((value) => !value)}><Columns3 size={16} />{t('Columns')}</button>{columnsOpen ? <div className="pt-menu">{([['quota', 'Quota'], ['models', 'ModelsAllowed'], ['lastUsed', 'LastUsed']] as Array<[KeyColumn, string]>).map(([column, label]) => <label className="pt-check" key={column}><input type="checkbox" checked={visibleColumns[column]} onChange={() => setVisibleColumns((current) => ({ ...current, [column]: !current[column] }))} /><span>{t(label)}</span></label>)}</div> : null}</div>
      {selected.length ? <div className="r33-batch-bar"><strong>{selected.length}</strong><span>{t('Records')}</span><button type="button" className="pt-button" data-variant="danger" onClick={() => setDialog({ kind: 'batch' })}><Trash2 size={15} />{t('Delete')}</button></div> : null}
    </section>

    <section className="r33-section r33-table-section">
      <header><div><span>CREDENTIALS</span><h2>{t('API keys')}</h2></div><span>{filtered.length} {t('Records')}</span></header>
      <div className="r33-table-wrap">
        <table className="pt-table r33-responsive-table r33-keys-table">
          <thead><tr><th><span className="sr-only">{t('Select')}</span></th><th>{t('Name')}</th><th>{t('Status')}</th><th>{t('Key')}</th>{visibleColumns.quota ? <th>{t('Quota')}</th> : null}<th>{t('Group')}</th>{visibleColumns.models ? <th>{t('ModelsAllowed')}</th> : null}{visibleColumns.lastUsed ? <th>{t('LastUsed')}</th> : null}<th>{t('Expiry')}</th><th>{t('Actions')}</th></tr></thead>
          <tbody>
            {filtered.map((key) => <tr key={key.id}><td data-label={t('Select')}><input type="checkbox" checked={selected.includes(key.id)} aria-label={`${t('Select')} ${key.name}`} onChange={(event) => setSelected((current) => event.target.checked ? [...current, key.id] : current.filter((id) => id !== key.id))} /></td><td data-label={t('Name')}><strong>{key.name}</strong></td><td data-label={t('Status')}><button type="button" className="pt-switch" role="switch" aria-checked={key.active} aria-label={`${key.name} ${t('Status')}`} onClick={() => setKeys((current) => current.map((item) => item.id === key.id ? { ...item, active: !item.active } : item))}><span /></button></td><td data-label={t('Key')}><code>sk-••••{key.suffix}</code></td>{visibleColumns.quota ? <td data-label={t('Quota')} className="r33-mono">{key.quota}</td> : null}<td data-label={t('Group')}><span className="pt-tag">{key.group}</span></td>{visibleColumns.models ? <td data-label={t('ModelsAllowed')}>{key.modelCount === 'all' ? t('All types') : `${key.modelCount} ${t('Model')}`}</td> : null}{visibleColumns.lastUsed ? <td data-label={t('LastUsed')} className="r33-mono">{key.lastUsed}</td> : null}<td data-label={t('Expiry')} className="r33-mono">{key.expiry}</td><td data-label={t('Actions')}><div className="r33-row-actions"><ToolButton label={t('Reveal full key?')} onClick={() => { setCopied(false); setDialog({ kind: 'reveal', key }) }}><Eye size={16} /></ToolButton><ToolButton label={t('Edit API key')} onClick={() => openDrawer('edit', key)}><Pencil size={16} /></ToolButton><ToolButton label={t('Delete')} className="r33-danger-tool" onClick={() => setDialog({ kind: 'delete', key })}><Trash2 size={16} /></ToolButton></div></td></tr>)}
            {!filtered.length ? <tr><td className="r33-empty-row" colSpan={keyTableColumnCount}>{t('No data')}</td></tr> : null}
          </tbody>
        </table>
      </div>
      <footer className="r33-table-pagination"><span>1–{filtered.length} / {filtered.length}</span><div><button type="button" className="pt-button" data-variant="quiet" disabled>{t('Previous')}</button><button type="button" className="pt-button" data-variant="quiet" disabled>{t('Next')}</button></div></footer>
    </section>

    {drawer ? <KeyDrawer locale={locale} mode={drawer.mode} name={draftName} onName={setDraftName} onClose={() => setDrawer(null)} onSave={saveKey} /> : null}
    {dialog ? <div className="r33-dialog-layer"><button type="button" tabIndex={-1} className="r33-scrim" aria-label={t('Close')} onClick={() => setDialog(null)} /><section ref={dialogRef} tabIndex={-1} className="r33-dialog" role="dialog" aria-modal="true" aria-labelledby="r33-key-dialog-title"><header><h2 id="r33-key-dialog-title">{dialog.kind === 'reveal' ? t('Reveal full key?') : dialog.kind === 'revealed' ? t('Key revealed') : dialog.kind === 'batch' ? t('Delete selected keys?') : t('Delete this key?')}</h2><ToolButton label={t('Close')} onClick={() => setDialog(null)}><X size={17} /></ToolButton></header><div>{dialog.kind === 'reveal' ? <p>{t('Anyone with this value can use your quota. Confirm that nobody else can see your screen.')}</p> : null}{dialog.kind === 'revealed' ? <div className="r33-revealed-key"><code>sk-pt-demo-R7Q4-A7K2</code><button type="button" className="pt-button" data-variant="secondary" onClick={() => void copyRevealed()}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? t('Copied') : t('Copy')}</button><small>{t('Close this window when you have stored the key securely.')}</small></div> : null}{dialog.kind === 'delete' ? <p><strong>{dialog.key.name}</strong><br />{t('This action cannot be undone.')}</p> : null}{dialog.kind === 'batch' ? <p>{t('Delete selected keys?')} ({selected.length})</p> : null}</div><footer><button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog(null)}>{t('Cancel')}</button>{dialog.kind === 'reveal' ? <button type="button" className="pt-button" data-variant="primary" onClick={() => setDialog({ kind: 'revealed', key: dialog.key })}>{t('Confirm reveal')}</button> : null}{dialog.kind === 'delete' ? <button type="button" className="pt-button" data-variant="danger" onClick={() => removeKey(dialog.key)}>{t('Delete')}</button> : null}{dialog.kind === 'batch' ? <button type="button" className="pt-button" data-variant="danger" onClick={removeSelected}>{t('Delete')}</button> : null}</footer></section></div> : null}
  </>
}

function KeyDrawer({ locale, mode, name, onName, onClose, onSave }: { locale: AppLocale; mode: 'create' | 'edit'; name: string; onName: (value: string) => void; onClose: () => void; onSave: () => void }) {
  const t = (key: string) => translate(locale, key)
  const drawerRef = useDialogBehavior<HTMLElement>(true, onClose)
  return <div className="r33-drawer-layer"><button type="button" tabIndex={-1} className="r33-scrim" aria-label={t('Close')} onClick={onClose} /><aside ref={drawerRef} tabIndex={-1} className="r33-drawer" role="dialog" aria-modal="true" aria-labelledby="r33-key-drawer-title"><header><div><span>CREDENTIAL</span><h2 id="r33-key-drawer-title">{mode === 'create' ? t('Configure your new key') : t('Edit API key')}</h2></div><button type="button" className="pt-icon-button" aria-label={t('Close')} title={t('Close')} onClick={onClose}><X size={17} /></button></header><div className="r33-drawer-body"><label className="pt-field"><span>{t('Name')}</span><span className="pt-field-control"><KeyRound className="pt-field-leading" size={16} /><input value={name} onChange={(event) => onName(event.target.value)} /></span></label><label className="pt-field"><span>{t('Group')}</span><span className="pt-field-control"><CircleUserRound className="pt-field-leading" size={16} /><select defaultValue="default"><option value="default">default</option><option value="trial">trial</option></select></span></label><label className="pt-field"><span>{t('Quota in USD')}</span><span className="pt-field-control"><CreditCard className="pt-field-leading" size={16} /><input type="number" defaultValue="25" min="0" /></span><small>{t('Finite quota is the safer default')}</small></label><label className="pt-field"><span>{t('Allowed models')}</span><span className="pt-field-control"><Bot className="pt-field-leading" size={16} /><select defaultValue="restricted"><option value="restricted">gpt-4.1-mini, imagen-3</option><option value="all">{t('All types')}</option></select></span></label><label className="pt-field"><span>{t('Expiry')}</span><span className="pt-field-control"><FileText className="pt-field-leading" size={16} /><input type="date" defaultValue="2026-12-31" /></span></label><label className="pt-check"><input type="checkbox" defaultChecked /><span>{t('Allow this credential to make requests')}</span></label></div><footer><button type="button" className="pt-button" data-variant="secondary" onClick={onClose}>{t('Cancel')}</button><RouteButton onClick={onSave}>{mode === 'create' ? t('Create a key') : t('Save changes')}</RouteButton></footer></aside></div>
}

function LogsPage({ locale }: { locale: AppLocale }) {
  const t = (key: string) => translate(locale, key)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [model, setModel] = useState('all')
  const [group, setGroup] = useState('all')
  const [keyName, setKeyName] = useState('')
  const [detail, setDetail] = useState<LogRecord | null>(null)
  const detailRef = useDialogBehavior<HTMLElement>(Boolean(detail), () => setDetail(null))
  const filtered = logsSeed.filter((row) => (type === 'all' || row.type === type) && (model === 'all' || row.model === model) && (group === 'all' || row.group === group) && (!keyName || row.keyName.toLowerCase().includes(keyName.toLowerCase())) && (!search || row.id.toLowerCase().includes(search.toLowerCase()) || row.keyName.toLowerCase().includes(search.toLowerCase())))
  return <>
    <PageHeading eyebrow={`${t('Console')} / ${t('Usage logs')}`} title={t('Usage logs')} body={t('Trace model calls, billing, latency, and account events.')} actions={<><span className="r33-draft-label">{t('Draft content')}</span><button type="button" className="pt-button" data-variant="secondary"><RefreshCw size={16} />{t('Refresh')}</button></>} />

    <section className="r33-log-filters" aria-label={t('Filters')}>
      <label className="r33-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label={t('Request ID')} placeholder={t('Request ID')} /></label>
      <label className="r33-compact-select"><ListFilter size={16} /><select value={type} onChange={(event) => setType(event.target.value)} aria-label={t('Type')}><option value="all">{t('All types')}</option><option value="Usage">{t('Usage')}</option><option value="Login">{t('Login')}</option><option value="System">{t('System')}</option><option value="Error">{t('Error')}</option></select><ChevronDown size={14} /></label>
      <label className="r33-compact-select"><Bot size={16} /><select value={model} onChange={(event) => setModel(event.target.value)} aria-label={t('Model')}><option value="all">{t('All types')}</option><option>gpt-4.1-mini</option><option>claude-3.7-sonnet</option><option>imagen-3</option></select><ChevronDown size={14} /></label>
      <label className="r33-compact-select"><Filter size={16} /><select defaultValue="today" aria-label={t('Time range')}><option value="today">24 h</option><option value="7">7 d</option><option value="30">30 d</option></select><ChevronDown size={14} /></label>
      <details className="r33-more-filters"><summary><SlidersHorizontal size={16} />{t('Filters')}</summary><div><label className="pt-field"><span>{t('Group')}</span><span className="pt-field-control"><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">{t('All types')}</option><option>default</option><option>trial</option></select></span></label><label className="pt-field"><span>{t('Key name')}</span><span className="pt-field-control"><input value={keyName} onChange={(event) => setKeyName(event.target.value)} /></span></label></div></details>
    </section>

    <section className="r33-log-summary"><div><span>{t('Filtered cost')}</span><strong>$0.082</strong></div><div><span>{t('Records')}</span><strong>{filtered.length}</strong></div><div><span>{t('Prompt tokens')}</span><strong>3.8K</strong></div><div><span>{t('Completion tokens')}</span><strong>1.2K</strong></div></section>

    <section className="r33-section r33-table-section">
      <header><div><span>TRACE</span><h2>{t('Usage logs')}</h2></div><span>{filtered.length} {t('Records')}</span></header>
      <div className="r33-table-wrap"><table className="pt-table r33-responsive-table r33-logs-table"><thead><tr><th>{t('Time')}</th><th>{t('Type')}</th><th>{t('Key name')}</th><th>{t('Model')}</th><th>{t('Streaming')}</th><th>{t('Tokens')}</th><th>{t('Cost')}</th><th>{t('Latency')}</th><th>{t('Details')}</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td data-label={t('Time')} className="r33-mono">{row.time}</td><td data-label={t('Type')}><Status tone={row.status}>{t(row.type)}</Status></td><td data-label={t('Key name')}>{row.keyName || '—'}</td><td data-label={t('Model')}>{row.model || '—'}</td><td data-label={t('Streaming')}>{row.streaming === null ? '—' : row.streaming ? t('Yes') : t('No')}</td><td data-label={t('Tokens')} className="r33-mono">{row.tokens || '—'}</td><td data-label={t('Cost')} className="r33-mono">{row.cost || '—'}</td><td data-label={t('Latency')} className="r33-mono">{row.latency || '—'}</td><td data-label={t('Details')}><ToolButton label={t('View details')} onClick={() => setDetail(row)}><ChevronRight size={16} /></ToolButton></td></tr>)}{!filtered.length ? <tr><td className="r33-empty-row" colSpan={9}>{t('No data')}</td></tr> : null}</tbody></table></div>
      <footer className="r33-table-pagination"><span>1–{filtered.length} / {filtered.length}</span><div><button type="button" className="pt-button" data-variant="quiet" disabled>{t('Previous')}</button><button type="button" className="pt-button" data-variant="quiet" disabled>{t('Next')}</button></div></footer>
    </section>

    {detail ? <div className="r33-drawer-layer"><button type="button" tabIndex={-1} className="r33-scrim" aria-label={t('Close')} onClick={() => setDetail(null)} /><aside ref={detailRef} tabIndex={-1} className="r33-drawer r33-log-drawer" role="dialog" aria-modal="true" aria-labelledby="r33-log-title"><header><div><span>REQUEST TRACE</span><h2 id="r33-log-title">{t('Log details')}</h2></div><ToolButton label={t('Close')} onClick={() => setDetail(null)}><X size={17} /></ToolButton></header><div className="r33-drawer-body"><dl className="r33-detail-list"><div><dt>{t('Request ID')}</dt><dd><code>{detail.id}</code></dd></div><div><dt>{t('Type')}</dt><dd><Status tone={detail.status}>{t(detail.type)}</Status></dd></div><div><dt>{t('Model')}</dt><dd>{detail.model || '—'}</dd></div><div><dt>{t('Key name')}</dt><dd>{detail.keyName || '—'}</dd></div><div><dt>{t('Streaming')}</dt><dd>{detail.streaming === null ? '—' : detail.streaming ? t('Yes') : t('No')}</dd></div><div><dt>{t('Prompt tokens')}</dt><dd>{detail.tokens || '—'}</dd></div><div><dt>{t('Cost')}</dt><dd>{detail.cost || '—'}</dd></div><div><dt>{t('Latency')}</dt><dd>{detail.latency || '—'}</dd></div><div><dt>{t('Upstream request ID')}</dt><dd><code>{detail.type === 'Usage' ? 'up_93ac2' : '—'}</code></dd></div></dl>{detail.type === 'Error' ? <div className="pt-feedback" data-tone="danger"><Activity size={17} /><span><strong>{t('Error')}</strong><br />rate_limit_exceeded</span></div> : null}</div><footer><button type="button" className="pt-button" data-variant="secondary" onClick={() => setDetail(null)}>{t('Close')}</button></footer></aside></div> : null}
  </>
}

const consoleNav: Array<{ group: 'Chat' | 'General' | 'Personal'; items: Array<{ label: string; icon: LucideIcon; target?: ConsoleTarget }> }> = [
  { group: 'Chat', items: [{ label: 'Playground', icon: MessageSquare, target: 'console-playground' }, { label: 'Image studio', icon: ImageIcon, target: 'console-studio' }] },
  { group: 'General', items: [{ label: 'Overview', icon: LayoutDashboard, target: 'console' }, { label: 'Analytics', icon: BarChart3, target: 'console-analytics' }, { label: 'API keys', icon: KeyRound, target: 'console-keys' }, { label: 'Usage logs', icon: ReceiptText, target: 'console-logs' }] },
  { group: 'Personal', items: [{ label: 'Wallet', icon: WalletCards, target: 'console-wallet' }, { label: 'Profile', icon: UserRound, target: 'console-profile' }] },
]

export function ConsoleDataPrototype({ screen, locale, theme, online, version, onLocale, onTheme, go }: ConsoleDataPrototypeProps) {
  const t = (key: string) => translate(locale, key)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [toast, setToast] = useState('')
  const mobileSidebarRef = useDialogBehavior<HTMLElement>(mobileOpen, () => setMobileOpen(false))
  const accountScreens: ConsoleAccountScreen[] = ['console-wallet', 'console-profile', 'console-security', 'console-connections', 'console-notifications']
  const activeLabel = screen === 'console' ? 'Overview' : screen === 'console-analytics' ? 'Analytics' : screen === 'console-keys' ? 'API keys' : screen === 'console-logs' ? 'Usage logs' : screen === 'console-playground' ? 'Playground' : screen === 'console-studio' ? 'Image studio' : screen === 'console-wallet' ? 'Wallet' : 'Profile'
  const defer = () => setToast(t('Draft content'))

  useEffect(() => { setMobileOpen(false); setUserOpen(false) }, [screen])

  const page = useMemo(() => {
    if (screen === 'console-analytics') return <AnalyticsPage locale={locale} />
    if (screen === 'console-keys') return <KeysPage locale={locale} go={go} notify={setToast} />
    if (screen === 'console-logs') return <LogsPage locale={locale} />
    if (screen === 'console-playground') return <ConsolePlaygroundPage locale={locale} notify={setToast} />
    if (screen === 'console-studio') return <ConsoleStudioPage locale={locale} notify={setToast} />
    if (accountScreens.includes(screen as ConsoleAccountScreen)) return <ConsoleAccountPage screen={screen as ConsoleAccountScreen} locale={locale} go={(target) => go(target)} notify={setToast} />
    return <OverviewPage locale={locale} online={online} version={version} go={go} defer={defer} />
  }, [screen, locale, online, version])

  return <div className={`r33-shell ${collapsed ? 'is-collapsed' : ''}`}>
    <header className="r33-topbar">
      <button type="button" className="r33-brand-button" aria-label="Partokens" onClick={() => go('home')}><Brand compact={collapsed} /></button>
      <nav className="r33-global-nav" aria-label={t('Console')}><button type="button" onClick={() => go('home')}><Home size={15} />{t('Home')}</button><button type="button" className="active" onClick={() => go('console')}><LayoutDashboard size={15} />{t('Console')}</button><button type="button" onClick={() => go('models')}>{t('Models')}</button><button type="button" onClick={() => go('docs')}>{t('Docs')}</button><button type="button" onClick={() => go('about')}>{t('About')}</button></nav>
      <div className="r33-top-tools"><span className={online ? 'r33-service is-online' : 'r33-service'}><i />{online ? t('Available') : t('Awaiting status')}</span><ToolButton label={t('Notices')} onClick={() => go('notices')}><Bell size={17} /><b /></ToolButton><LocaleSelect locale={locale} onLocale={onLocale} /><ToolButton label={t(theme === 'dark' ? 'Light mode' : 'Dark mode')} onClick={onTheme}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</ToolButton><div className="r33-user-wrap"><button type="button" className="r33-user" aria-expanded={userOpen} onClick={() => setUserOpen((value) => !value)}><CircleUserRound size={18} /><span>Mika Chen</span><ChevronDown size={13} /></button>{userOpen ? <div className="pt-menu r33-user-menu"><button type="button" onClick={() => go('console-profile')}><UserRound size={16} />{t('Profile')}</button><button type="button" onClick={() => go('console-wallet')}><WalletCards size={16} />{t('Wallet')}</button><button type="button" onClick={() => go('signin')}><ArrowRight size={16} />{t('Sign out')}</button></div> : null}</div><ToolButton label={t('Menu')} className="r33-mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={18} /></ToolButton></div>
    </header>

    <aside ref={mobileSidebarRef} tabIndex={-1} className={`r33-sidebar ${mobileOpen ? 'is-open' : ''}`}>
      <div className="r33-mobile-sidebar-head"><Brand /><button type="button" className="pt-icon-button" aria-label={t('Close')} title={t('Close')} onClick={() => setMobileOpen(false)}><X size={17} /></button></div>
      <div className="r33-workspace-label"><span>{t('Console')}</span><strong>{t(activeLabel)}</strong></div>
      <nav>{consoleNav.map((group) => <div className="r33-nav-group" key={group.group}><span>{t(group.group)}</span>{group.items.map(({ label, icon: Icon, target }) => <button type="button" className={label === activeLabel ? 'active' : ''} key={label} onClick={target ? () => go(target) : defer}><Icon size={17} /><strong>{t(label)}</strong>{label === activeLabel ? <i /> : null}</button>)}</div>)}</nav>
      <div className="r33-mobile-sidebar-tools"><LocaleSelect locale={locale} onLocale={onLocale} /><button type="button" className="pt-button" data-variant="secondary" onClick={onTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}{t(theme === 'dark' ? 'Light mode' : 'Dark mode')}</button></div>
      <div className="r33-sidebar-usage"><div><span>{t('Remaining')}</span><strong>$82.40</strong></div><div><span>{t('30-day use')}</span><strong>$9.18</strong></div><span><i style={{ width: '11.1%' }} /></span></div>
      <button type="button" className="pt-icon-button r33-collapse" aria-label={t(collapsed ? 'Expand sidebar' : 'Collapse sidebar')} title={t(collapsed ? 'Expand sidebar' : 'Collapse sidebar')} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
    </aside>

    {mobileOpen ? <button type="button" className="r33-mobile-scrim" aria-label={t('Close')} onClick={() => setMobileOpen(false)} /> : null}
    <main className={`r33-main ${screen === 'console-playground' ? 'r35-main' : ''} ${screen === 'console-studio' ? 'r36-main' : ''}`}>{page}</main>

    <nav className="r33-mobile-bottom" aria-label={t('General')}>{[
      ['Overview', LayoutDashboard, 'console'],
      ['Playground', MessageSquare, 'console-playground'],
      ['Image studio', ImageIcon, 'console-studio'],
      ['Wallet', WalletCards, 'console-wallet'],
    ].map(([label, icon, target]) => { const Icon = icon as LucideIcon; return <button type="button" className={label === activeLabel ? 'active' : ''} key={label as string} onClick={() => go(target as ConsoleTarget)}><Icon size={18} /><span>{t(label === 'Usage logs' ? 'Logs' : label as string)}</span></button> })}<button type="button" onClick={() => setMobileOpen(true)}><MoreHorizontal size={18} /><span>{t('Menu')}</span></button></nav>

    {toast ? <div className="r33-toast" role="status"><CheckCircle2 size={17} /><span>{toast}</span><ToolButton label={t('Close')} onClick={() => setToast('')}><X size={15} /></ToolButton></div> : null}
  </div>
}
