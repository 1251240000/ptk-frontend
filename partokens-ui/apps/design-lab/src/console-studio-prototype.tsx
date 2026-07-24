import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  Copy,
  Download,
  FileImage,
  FolderOpen,
  Image as ImageIcon,
  Info,
  KeyRound,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Trash2,
  Undo2,
  Unlink,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent,
} from 'react'

import { resources, type AppLocale } from '@partokens/i18n'

import { useDialogBehavior } from './console-dialog-behavior'
import { translateConsoleStudio } from './console-studio-copy'
import {
  createPrototypeStudioProject,
  deletePrototypeStudioProject,
  loadPrototypeStudioAssets,
  loadPrototypeStudioProjects,
  prototypeStudioBytes,
  prototypeStudioOwner,
  savePrototypeStudioAsset,
  savePrototypeStudioProject,
  type PrototypeStudioAsset,
  type PrototypeStudioNode,
  type PrototypeStudioNodeType,
  type PrototypeStudioProject,
} from './console-studio-store'

type Props = { locale: AppLocale; notify: (message: string) => void }
type Translate = (key: string) => string
type DialogState = 'rename' | 'delete-project' | 'unlock' | 'dedicated' | 'local-data' | null
type Interaction =
  | { kind: 'node'; nodeId: string; startX: number; startY: number; nodeX: number; nodeY: number; before: PrototypeStudioProject }
  | { kind: 'pan'; startX: number; startY: number; x: number; y: number }
  | null

function translate(locale: AppLocale, key: string) {
  const local = translateConsoleStudio(locale, key)
  if (local !== key) return local
  return (resources[locale].translation as Record<string, string>)[key] ?? key
}

function IconButton({ label, children, onClick, disabled = false, active = false, className = '' }: { label: string; children: ReactNode; onClick?: () => void; disabled?: boolean; active?: boolean; className?: string }) {
  return <button type="button" className={`pt-icon-button r36-icon-button ${active ? 'active' : ''} ${className}`} aria-label={label} title={label} disabled={disabled} onClick={onClick}>{children}</button>
}

function Modal({ active, title, kicker, t, onClose, children, footer }: { active: boolean; title: string; kicker: string; t: Translate; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  const ref = useDialogBehavior<HTMLElement>(active, onClose)
  if (!active) return null
  return <div className="r33-dialog-layer"><button type="button" tabIndex={-1} className="r33-scrim" aria-label={t('Close')} onClick={onClose} /><section ref={ref} tabIndex={-1} className="r33-dialog r36-dialog" role="dialog" aria-modal="true" aria-labelledby="r36-dialog-title"><header><div><span>{kicker}</span><h2 id="r36-dialog-title">{title}</h2></div><IconButton label={t('Close')} onClick={onClose}><X size={17} /></IconButton></header><div className="r36-dialog-body">{children}</div><footer>{footer}</footer></section></div>
}

function projectDate(value: number, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(value)
}

function storageSize(bytes: number, locale: AppLocale) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`
}

function nodeIcon(type: PrototypeStudioNodeType): LucideIcon {
  if (type === 'prompt') return Sparkles
  if (type === 'source') return FileImage
  if (type === 'result') return ImageIcon
  return StickyNote
}

function findOpenNodePosition(nodes: PrototypeStudioNode[], width: number, height: number) {
  const candidates = [
    { x: 410, y: 500 }, { x: 150, y: 180 }, { x: 740, y: 500 }, { x: 1080, y: 180 },
    { x: 150, y: 760 }, { x: 500, y: 800 }, { x: 900, y: 840 }, { x: 1240, y: 520 },
  ]
  const gap = 26
  const overlaps = (position: { x: number; y: number }, node: PrototypeStudioNode) => (
    position.x < node.x + node.width + gap
    && position.x + width + gap > node.x
    && position.y < node.y + node.height + gap
    && position.y + height + gap > node.y
  )
  return candidates.find((position) => !nodes.some((item) => overlaps(position, item)))
    ?? { x: 260, y: Math.max(180, ...nodes.map((item) => item.y + item.height)) + gap }
}

function compactProjectViewport(project: PrototypeStudioProject) {
  const promptAndResults = project.nodes.filter((item) => item.type === 'prompt' || item.type === 'result')
  const focusNodes = promptAndResults.some((item) => item.type === 'result') ? promptAndResults : project.nodes
  if (!focusNodes.length) return { x: 0, y: 80, zoom: .72 }
  const minX = Math.min(...focusNodes.map((item) => item.x))
  const minY = Math.min(...focusNodes.map((item) => item.y))
  const maxX = Math.max(...focusNodes.map((item) => item.x + item.width))
  const maxY = Math.max(...focusNodes.map((item) => item.y + item.height))
  const availableWidth = Math.max(260, window.innerWidth - 32)
  const availableHeight = Math.max(330, window.innerHeight - 250)
  const zoom = Math.max(.32, Math.min(.72, Math.min(availableWidth / (maxX - minX), availableHeight / (maxY - minY))))
  return { x: 16 - minX * zoom, y: 92 - minY * zoom, zoom }
}

function resultStatus(node: PrototypeStudioNode, t: Translate) {
  if (node.status === 'generating') return t('Generation in progress')
  if (node.status === 'failed') return t('Simulated provider timeout')
  if (node.status === 'cancelled') return t('Generation cancelled')
  return t('Generation complete')
}

function Visual({ node, url }: { node: PrototypeStudioNode; url?: string }) {
  if (url) return <div className="r36-node-visual uploaded" style={{ backgroundImage: `url(${url})` }} />
  return <div className="r36-node-visual" data-visual={node.visual || 'architecture'} aria-hidden="true"><span className="r36-visual-sky" /><span className="r36-visual-frame" /><span className="r36-visual-ground" /><span className="r36-visual-accent" /></div>
}

function ProjectsPanel({ projects, currentId, locale, t, mobile = false, onNew, onSelect, onDuplicate, onRename, onDelete, onLocal }: {
  projects: PrototypeStudioProject[]; currentId: string | null; locale: AppLocale; t: Translate; mobile?: boolean
  onNew: () => void; onSelect: (id: string) => void; onDuplicate: (id: string) => void; onRename: (id: string) => void; onDelete: (id: string) => void; onLocal: () => void
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  return <aside className={`r36-projects ${mobile ? 'mobile' : ''}`} aria-label={t('Local projects')}>
    <header><div><span>LOCAL</span><strong>{t('Projects')}</strong></div><IconButton label={t('New project')} onClick={onNew}><Plus size={16} /></IconButton></header>
    <div className="r36-project-list">{projects.map((item, index) => <article className={`${item.id === currentId ? 'active' : ''} ${openMenuId === item.id ? 'menu-open' : ''}`} key={item.id}><button type="button" onClick={() => { setOpenMenuId(null); onSelect(item.id) }}><span className="r36-project-index">{String(index + 1).padStart(2, '0')}</span><span><strong>{item.title}</strong><small>{item.nodes.length} {t('nodes')} · {projectDate(item.updatedAt, locale)}</small></span></button><div><IconButton label={t('Project actions')} active={openMenuId === item.id} onClick={() => setOpenMenuId((value) => value === item.id ? null : item.id)}><MoreHorizontal size={14} /></IconButton><div className={`r36-project-actions ${openMenuId === item.id ? 'is-open' : ''}`}><button type="button" onClick={() => { setOpenMenuId(null); onRename(item.id) }}><RotateCcw size={14} />{t('Rename')}</button><button type="button" onClick={() => { setOpenMenuId(null); onDuplicate(item.id) }}><Copy size={14} />{t('Duplicate')}</button><button type="button" data-tone="danger" onClick={() => { setOpenMenuId(null); onDelete(item.id) }}><Trash2 size={14} />{t('Delete')}</button></div></div></article>)}</div>
    <button type="button" className="r36-local-summary" onClick={onLocal}><span><ShieldCheck size={16} /></span><span><strong>{t('Saved on this device')}</strong><small>{t('Projects and image assets stay in this browser.')}</small></span><ArrowRight size={14} /></button>
  </aside>
}

function InspectorPanel({ project, selected, t, credentialReady, mobile = false, onUpdateNode, onUpdateSettings, onConnect, onDisconnect, onDelete, onUnlock, onDedicated, onLock, onGenerate, onCancel, onRetry }: {
  project: PrototypeStudioProject; selected: PrototypeStudioNode | null; t: Translate; credentialReady: boolean; mobile?: boolean
  onUpdateNode: (patch: Partial<PrototypeStudioNode>) => void; onUpdateSettings: (patch: Partial<PrototypeStudioProject['settings']>) => void
  onConnect: () => void; onDisconnect: () => void; onDelete: () => void; onUnlock: () => void; onDedicated: () => void; onLock: () => void; onGenerate: () => void; onCancel: () => void; onRetry: () => void
}) {
  const hasConnections = selected ? project.connections.some((item) => item.fromNodeId === selected.id || item.toNodeId === selected.id) : false
  return <aside className={`r36-inspector ${mobile ? 'mobile' : ''}`} aria-label={t('Inspector')}>
    <header><span>INSPECT</span><strong>{t('Inspector')}</strong></header>
    <div className="r36-inspector-scroll">
      <section className="r36-inspector-section"><h3>{t('Selected node')}</h3>{selected ? <><div className="r36-selected-type"><span data-type={selected.type}>{(() => { const Icon = nodeIcon(selected.type); return <Icon size={15} /> })()}</span><div><strong>{t(selected.type === 'prompt' ? 'Prompt' : selected.type === 'source' ? 'Source' : selected.type === 'result' ? 'Result' : 'Note')}</strong><small>{Math.round(selected.width)} × {Math.round(selected.height)}</small></div></div><label className="pt-field"><span>{t('Node title')}</span><span className="pt-field-control"><input value={t(selected.title) === selected.title ? selected.title : t(selected.title)} onChange={(event) => onUpdateNode({ title: event.target.value })} /></span></label>{selected.type !== 'result' ? <label className="pt-field"><span>{t('Content')}</span><span className="pt-field-control"><textarea rows={4} value={selected.content} onChange={(event) => onUpdateNode({ content: event.target.value })} /></span></label> : <div className="r36-result-status" data-status={selected.status}><CircleDot size={14} /><span>{resultStatus(selected, t)}</span></div>}<div className="r36-node-actions"><button type="button" className="pt-button" data-variant="secondary" onClick={onConnect}><Link2 size={15} />{t('Connect node')}</button><IconButton label={t('Disconnect node')} disabled={!hasConnections} onClick={onDisconnect}><Unlink size={15} /></IconButton><IconButton label={t('Delete node')} onClick={onDelete}><Trash2 size={15} /></IconButton></div></> : <div className="r36-empty-inspector"><CircleDot size={18} /><span>{t('Select a node to inspect it')}</span></div>}</section>

      <section className="r36-inspector-section"><h3>{t('Generation setup')}</h3><label className="pt-field"><span>{t('Choose an image model')}</span><span className="pt-field-control"><select value={project.settings.model} onChange={(event) => onUpdateSettings({ model: event.target.value })}><option>gpt-image-1</option><option>imagen-3</option><option>dall-e-3</option></select><ChevronDown size={14} /></span></label><div className="r36-field-grid"><label className="pt-field"><span>{t('Group')}</span><span className="pt-field-control"><select value={project.settings.group} onChange={(event) => onUpdateSettings({ group: event.target.value })}><option>default</option><option>trial</option></select><ChevronDown size={14} /></span></label><label className="pt-field"><span>{t('Size')}</span><span className="pt-field-control"><select value={project.settings.size} onChange={(event) => onUpdateSettings({ size: event.target.value })}><option>1024x1024</option><option>1024x1536</option><option>1536x1024</option></select><ChevronDown size={14} /></span></label><label className="pt-field"><span>{t('Quality')}</span><span className="pt-field-control"><select value={project.settings.quality} onChange={(event) => onUpdateSettings({ quality: event.target.value })}><option value="medium">{t('medium')}</option><option value="high">{t('high')}</option><option value="standard">{t('standard')}</option></select><ChevronDown size={14} /></span></label><label className="pt-field"><span>{t('Count')}</span><span className="pt-field-control"><select value={project.settings.count} onChange={(event) => onUpdateSettings({ count: Number(event.target.value) })}><option>1</option><option>2</option><option>3</option><option>4</option></select><ChevronDown size={14} /></span></label></div><label className="r36-check"><input type="checkbox" checked={project.settings.simulateFailure} onChange={(event) => onUpdateSettings({ simulateFailure: event.target.checked })} /><span><Check size={12} /></span>{t('Simulate next request failure')}</label></section>

      <section className="r36-inspector-section"><div className="r36-section-title"><h3>{t('Key access')}</h3><span className={credentialReady ? 'is-ready' : ''}><i />{t(credentialReady ? 'Unlocked' : 'Locked')}</span></div><div className="r36-key-line"><span><KeyRound size={16} /></span><div><strong>{project.settings.tokenName}</strong><small>{credentialReady ? t('API key stays in memory') : t('Key locked')}</small></div></div>{credentialReady ? <button type="button" className="pt-button r36-wide-button" data-variant="secondary" onClick={onLock}><LockKeyhole size={15} />{t('Lock key')}</button> : <div className="r36-key-actions"><button type="button" className="pt-button" data-variant="secondary" onClick={onUnlock}>{t('Use this key')}</button><button type="button" className="pt-button" data-variant="quiet" onClick={onDedicated}>{t('Create restricted key')}</button></div>}<p className="r36-security-note"><ShieldCheck size={14} />{t('The full key stays in memory only and is cleared when you leave the studio or sign out.')}</p></section>

      <section className="r36-inspector-section"><h3>{t('History')}</h3><div className="r36-history">{project.history.length ? project.history.slice(0, 4).map((item) => <div key={item.id} data-status={item.status}><span><i />{new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(item.createdAt)}</span><strong>{item.model}</strong><small>{item.status}</small></div>) : <span>{t('No generations yet')}</span>}</div></section>
    </div>
    <div className="r36-generate-dock">{project.nodes.some((item) => item.status === 'generating') ? <button type="button" className="pt-button r36-generate" data-variant="danger" onClick={onCancel}><X size={16} />{t('Cancel generation')}</button> : project.nodes.some((item) => item.status === 'failed') ? <button type="button" className="pt-button r36-generate" data-variant="primary" onClick={onRetry}><RotateCcw size={16} />{t('Retry generation')}</button> : <button type="button" className="pt-button r36-generate" data-variant="primary" onClick={onGenerate}><Sparkles size={16} />{t('Generate images')}<span className="pt-button-endcap"><ArrowRight size={16} /></span></button>}<small>{t('Generation requests are simulated in this prototype.')}</small></div>
  </aside>
}

export function ConsoleStudioPage({ locale, notify }: Props) {
  const t = (key: string) => translate(locale, key)
  const [projects, setProjects] = useState<PrototypeStudioProject[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [dialogProjectId, setDialogProjectId] = useState<string | null>(null)
  const [unlockedTokenId, setUnlockedTokenId] = useState<number | null>(null)
  const [budget, setBudget] = useState(5)
  const [assets, setAssets] = useState<PrototypeStudioAsset[]>([])
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const projectsRef = useRef<PrototypeStudioProject[]>([])
  const interactionRef = useRef<Interaction>(null)
  const undoRef = useRef<PrototypeStudioProject[]>([])
  const redoRef = useRef<PrototypeStudioProject[]>([])
  const generationTimer = useRef<number | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const projectsSheetRef = useDialogBehavior<HTMLElement>(projectsOpen, () => setProjectsOpen(false))
  const inspectorSheetRef = useDialogBehavior<HTMLElement>(inspectorOpen, () => setInspectorOpen(false))
  const project = projects.find((item) => item.id === currentId) ?? null
  const selected = project?.nodes.find((item) => item.id === selectedId) ?? null
  const credentialReady = Boolean(project && unlockedTokenId === project.settings.tokenId)

  const syncProjects = (next: PrototypeStudioProject[]) => {
    projectsRef.current = next
    setProjects(next)
  }

  useEffect(() => {
    let active = true
    void loadPrototypeStudioProjects().then((items) => {
      if (!active) return
      const displayItems = window.innerWidth <= 820 && items[0]
        ? items.map((item, index) => index === 0 ? { ...item, viewport: compactProjectViewport(item) } : item)
        : items
      syncProjects(displayItems)
      setCurrentId(displayItems[0]?.id ?? null)
      setSelectedId(displayItems[0]?.nodes.find((node) => node.type === 'result')?.id ?? displayItems[0]?.nodes[0]?.id ?? null)
      setLoaded(true)
    })
    const clearCredential = () => setUnlockedTokenId(null)
    window.addEventListener('pagehide', clearCredential)
    return () => {
      active = false
      window.removeEventListener('pagehide', clearCredential)
      if (generationTimer.current) window.clearTimeout(generationTimer.current)
      setUnlockedTokenId(null)
    }
  }, [])

  useEffect(() => {
    Object.values(assetUrls).forEach((url) => URL.revokeObjectURL(url))
    setAssetUrls({})
    setAssets([])
    if (!currentId) return
    let active = true
    void loadPrototypeStudioAssets(currentId).then((items) => {
      if (!active) return
      setAssets(items)
      setAssetUrls(Object.fromEntries(items.map((item) => [item.id, URL.createObjectURL(item.blob)])))
    })
    return () => { active = false }
  }, [currentId])

  useEffect(() => {
    if (!project || !loaded) return
    const timer = window.setTimeout(() => void savePrototypeStudioProject(project), 260)
    return () => window.clearTimeout(timer)
  }, [project, loaded])

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const interaction = interactionRef.current
      const current = projectsRef.current.find((item) => item.id === currentId)
      if (!interaction || !current) return
      if (interaction.kind === 'node') {
        const zoom = current.viewport.zoom
        const dx = (event.clientX - interaction.startX) / zoom
        const dy = (event.clientY - interaction.startY) / zoom
        const next = { ...current, updatedAt: Date.now(), nodes: current.nodes.map((item) => item.id === interaction.nodeId ? { ...item, x: interaction.nodeX + dx, y: interaction.nodeY + dy } : item) }
        syncProjects(projectsRef.current.map((item) => item.id === current.id ? next : item))
      } else {
        const next = { ...current, viewport: { ...current.viewport, x: interaction.x + event.clientX - interaction.startX, y: interaction.y + event.clientY - interaction.startY } }
        syncProjects(projectsRef.current.map((item) => item.id === current.id ? next : item))
      }
    }
    const onUp = () => {
      const interaction = interactionRef.current
      if (interaction?.kind === 'node') {
        undoRef.current = [...undoRef.current.slice(-39), interaction.before]
        redoRef.current = []
      }
      interactionRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [currentId])

  const updateProject = (updater: (current: PrototypeStudioProject) => PrototypeStudioProject, record = true) => {
    if (!project) return
    if (record) { undoRef.current = [...undoRef.current.slice(-39), structuredClone(project)]; redoRef.current = [] }
    const next = { ...updater(project), updatedAt: Date.now() }
    syncProjects(projectsRef.current.map((item) => item.id === project.id ? next : item))
  }

  const openProject = (id: string) => {
    const next = projectsRef.current.find((item) => item.id === id)
    if (!next) return
    if (window.innerWidth <= 820) {
      const compact = { ...next, viewport: compactProjectViewport(next) }
      syncProjects(projectsRef.current.map((item) => item.id === id ? compact : item))
    }
    setCurrentId(id)
    setSelectedId(next.nodes[0]?.id ?? null)
    setConnectingFrom(null)
    setProjectsOpen(false)
    undoRef.current = []
    redoRef.current = []
  }

  const createProject = () => {
    const created = createPrototypeStudioProject(`${t('Untitled canvas')} ${projectsRef.current.length + 1}`)
    const next = window.innerWidth <= 820 ? { ...created, viewport: compactProjectViewport(created) } : created
    syncProjects([next, ...projectsRef.current])
    setCurrentId(next.id)
    setSelectedId(next.nodes[0]?.id ?? null)
    setProjectsOpen(false)
    void savePrototypeStudioProject(next)
    notify(t('Project created'))
  }

  const duplicateProject = (id: string) => {
    const source = projectsRef.current.find((item) => item.id === id)
    if (!source) return
    const nodeIds = new Map(source.nodes.map((item) => [item.id, crypto.randomUUID()]))
    const now = Date.now()
    const next: PrototypeStudioProject = { ...structuredClone(source), id: crypto.randomUUID(), title: `${source.title} · ${t('Duplicate')}`, createdAt: now, updatedAt: now, nodes: source.nodes.map((item) => ({ ...item, id: nodeIds.get(item.id)! })), connections: source.connections.map((item) => ({ id: crypto.randomUUID(), fromNodeId: nodeIds.get(item.fromNodeId)!, toNodeId: nodeIds.get(item.toNodeId)! })) }
    syncProjects([next, ...projectsRef.current])
    void savePrototypeStudioProject(next)
    notify(t('Project duplicated'))
  }

  const askRename = (id: string) => {
    const item = projectsRef.current.find((projectItem) => projectItem.id === id)
    if (!item) return
    setDialogProjectId(id); setRenameDraft(item.title); setDialog('rename')
  }

  const saveRename = () => {
    if (!dialogProjectId || !renameDraft.trim()) return
    const next = projectsRef.current.map((item) => item.id === dialogProjectId ? { ...item, title: renameDraft.trim(), updatedAt: Date.now() } : item)
    syncProjects(next)
    const renamed = next.find((item) => item.id === dialogProjectId)
    if (renamed) void savePrototypeStudioProject(renamed)
    setDialog(null); notify(t('Project renamed'))
  }

  const askDeleteProject = (id: string) => { setDialogProjectId(id); setDialog('delete-project') }
  const confirmDeleteProject = async () => {
    if (!dialogProjectId) return
    await deletePrototypeStudioProject(dialogProjectId)
    const next = projectsRef.current.filter((item) => item.id !== dialogProjectId)
    syncProjects(next)
    if (currentId === dialogProjectId) { setCurrentId(next[0]?.id ?? null); setSelectedId(next[0]?.nodes[0]?.id ?? null) }
    setDialog(null); notify(t('Project deleted'))
  }

  const addNode = (type: PrototypeStudioNodeType) => {
    if (!project) return
    if (type === 'source') { uploadRef.current?.click(); return }
    const width = type === 'prompt' ? 300 : 250
    const height = type === 'prompt' ? 230 : 170
    const position = findOpenNodePosition(project.nodes, width, height)
    const next: PrototypeStudioNode = { id: crypto.randomUUID(), type, title: type === 'prompt' ? 'Image prompt' : 'Note', content: '', ...position, width, height, status: 'idle', createdAt: Date.now() }
    updateProject((item) => ({ ...item, nodes: [...item.nodes, next] }))
    setSelectedId(next.id)
  }

  const addSource = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!project || !file || !file.type.startsWith('image/')) return
    const asset: PrototypeStudioAsset = { id: crypto.randomUUID(), ownerNamespace: prototypeStudioOwner, projectId: project.id, mimeType: file.type, bytes: file.size, blob: file, createdAt: Date.now() }
    await savePrototypeStudioAsset(asset)
    const position = findOpenNodePosition(project.nodes, 240, 260)
    const next: PrototypeStudioNode = { id: crypto.randomUUID(), type: 'source', title: 'Source image', content: file.name, ...position, width: 240, height: 260, status: 'ready', assetId: asset.id, visual: 'uploaded', createdAt: Date.now() }
    setAssets((items) => [...items, asset])
    setAssetUrls((items) => ({ ...items, [asset.id]: URL.createObjectURL(file) }))
    updateProject((item) => ({ ...item, nodes: [...item.nodes, next] }))
    setSelectedId(next.id); event.target.value = ''; notify(t('Local image added'))
  }

  const updateNode = (patch: Partial<PrototypeStudioNode>) => {
    if (!selected) return
    updateProject((item) => ({ ...item, nodes: item.nodes.map((node) => node.id === selected.id ? { ...node, ...patch } : node) }))
  }
  const updateSettings = (patch: Partial<PrototypeStudioProject['settings']>) => updateProject((item) => ({ ...item, settings: { ...item.settings, ...patch } }))

  const beginConnect = () => {
    if (!selected) return
    setConnectingFrom(selected.id)
    notify(t('Select another node to finish the connection.'))
  }

  const selectNode = (id: string) => {
    if (connectingFrom && connectingFrom !== id && project) {
      const exists = project.connections.some((item) => item.fromNodeId === connectingFrom && item.toNodeId === id)
      if (!exists) updateProject((item) => ({ ...item, connections: [...item.connections, { id: crypto.randomUUID(), fromNodeId: connectingFrom, toNodeId: id }] }))
      setConnectingFrom(null); setSelectedId(id); notify(t('Node connected')); return
    }
    setSelectedId(id)
  }

  const disconnectNode = () => {
    if (!selected) return
    updateProject((item) => ({ ...item, connections: item.connections.filter((connection) => connection.fromNodeId !== selected.id && connection.toNodeId !== selected.id) }))
  }

  const deleteNode = () => {
    if (!selected) return
    updateProject((item) => ({ ...item, nodes: item.nodes.filter((node) => node.id !== selected.id), connections: item.connections.filter((connection) => connection.fromNodeId !== selected.id && connection.toNodeId !== selected.id) }))
    setSelectedId(null); notify(t('Node removed'))
  }

  const undo = () => {
    if (!project || !undoRef.current.length) return
    const previous = undoRef.current.pop()!
    redoRef.current.push(structuredClone(project))
    syncProjects(projectsRef.current.map((item) => item.id === project.id ? previous : item))
  }
  const redo = () => {
    if (!project || !redoRef.current.length) return
    const next = redoRef.current.pop()!
    undoRef.current.push(structuredClone(project))
    syncProjects(projectsRef.current.map((item) => item.id === project.id ? next : item))
  }

  const setZoom = (zoom: number) => updateProject((item) => ({ ...item, viewport: { ...item.viewport, zoom: Math.max(.38, Math.min(1.5, zoom)) } }), false)
  const fitCanvas = () => {
    if (!project || !canvasRef.current || !project.nodes.length) return
    const minX = Math.min(...project.nodes.map((item) => item.x)); const minY = Math.min(...project.nodes.map((item) => item.y))
    const maxX = Math.max(...project.nodes.map((item) => item.x + item.width)); const maxY = Math.max(...project.nodes.map((item) => item.y + item.height))
    const bounds = canvasRef.current.getBoundingClientRect(); const zoom = Math.max(.38, Math.min(1.05, Math.min((bounds.width - 100) / (maxX - minX), (bounds.height - 100) / (maxY - minY))))
    updateProject((item) => ({ ...item, viewport: { zoom, x: (bounds.width - (maxX - minX) * zoom) / 2 - minX * zoom, y: (bounds.height - (maxY - minY) * zoom) / 2 - minY * zoom } }), false)
  }

  const scheduleResult = (nodeId: string, fail: boolean) => {
    if (generationTimer.current) window.clearTimeout(generationTimer.current)
    generationTimer.current = window.setTimeout(() => {
      const current = projectsRef.current.find((item) => item.id === currentId)
      if (!current) return
      const prompt = current.nodes.find((item) => item.type === 'prompt')?.content || ''
      const status = fail ? 'failed' as const : 'ready' as const
      const next = { ...current, updatedAt: Date.now(), settings: { ...current.settings, simulateFailure: false }, nodes: current.nodes.map((item) => item.id === nodeId ? { ...item, status, visual: 'garden' as const, error: fail ? 'Simulated provider timeout' : undefined } : item), history: [{ id: crypto.randomUUID(), createdAt: Date.now(), prompt, model: current.settings.model, status: fail ? 'failed' as const : 'completed' as const }, ...current.history] }
      syncProjects(projectsRef.current.map((item) => item.id === current.id ? next : item))
      notify(t(fail ? 'Image generation failed' : 'Images added to the local canvas'))
      generationTimer.current = null
    }, 1500)
  }

  const generate = () => {
    if (!project) return
    if (!credentialReady) { setDialog('unlock'); return }
    const prompt = project.nodes.find((item) => item.type === 'prompt')
    if (!prompt?.content.trim()) { notify(t('Enter an image prompt')); return }
    const resultCount = project.nodes.filter((item) => item.type === 'result').length
    const result: PrototypeStudioNode = { id: crypto.randomUUID(), type: 'result', title: 'Generated image', content: `${project.settings.model} · ${project.settings.size}`, x: prompt.x + 410, y: prompt.y - 70 + resultCount * 38, width: 340, height: 390, status: 'generating', visual: 'garden', createdAt: Date.now() }
    updateProject((item) => ({ ...item, nodes: [...item.nodes, result], connections: [...item.connections, { id: crypto.randomUUID(), fromNodeId: prompt.id, toNodeId: result.id }] }))
    setSelectedId(result.id)
    scheduleResult(result.id, project.settings.simulateFailure)
  }

  const cancelGeneration = () => {
    if (!project) return
    if (generationTimer.current) window.clearTimeout(generationTimer.current)
    generationTimer.current = null
    const prompt = project.nodes.find((item) => item.type === 'prompt')?.content || ''
    updateProject((item) => ({ ...item, nodes: item.nodes.map((node) => node.status === 'generating' ? { ...node, status: 'cancelled' as const } : node), history: [{ id: crypto.randomUUID(), createdAt: Date.now(), prompt, model: item.settings.model, status: 'cancelled' as const }, ...item.history] }))
    notify(t('Generation cancelled'))
  }

  const retryGeneration = () => {
    if (!project) return
    if (!credentialReady) { setDialog('unlock'); return }
    const failed = project.nodes.find((item) => item.status === 'failed' || item.status === 'cancelled')
    if (!failed) return
    updateProject((item) => ({ ...item, nodes: item.nodes.map((node) => node.id === failed.id ? { ...node, status: 'generating' as const, error: undefined } : node) }))
    setSelectedId(failed.id); scheduleResult(failed.id, false)
  }

  const unlock = () => { if (!project) return; setUnlockedTokenId(project.settings.tokenId); setDialog(null); notify(t('API key unlocked for this session')) }
  const createDedicated = () => {
    if (!project) return
    const id = Math.floor(Date.now() / 1000)
    updateProject((item) => ({ ...item, settings: { ...item.settings, tokenId: id, tokenName: `Studio · ${item.settings.model} · $${budget}` } }))
    setUnlockedTokenId(id); setDialog(null); notify(t('Dedicated studio key created'))
  }
  const lock = () => { setUnlockedTokenId(null); notify(t('Studio key locked')) }

  const exportProject = () => {
    if (!project) return
    const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'partokens-studio-prototype', version: 1, project }, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${project.title.replace(/[^a-z0-9-]+/gi, '-') || 'canvas'}.json`; anchor.click(); URL.revokeObjectURL(url); notify(t('Project exported'))
  }

  const importProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as { format?: string; project?: PrototypeStudioProject }
      if (parsed.format !== 'partokens-studio-prototype' || !parsed.project?.nodes) throw new Error('Unsupported')
      const nodeIds = new Map(parsed.project.nodes.map((item) => [item.id, crypto.randomUUID()]))
      const baseImported: PrototypeStudioProject = { ...parsed.project, id: crypto.randomUUID(), ownerNamespace: prototypeStudioOwner, title: `${t('Imported canvas')} · ${parsed.project.title}`, createdAt: Date.now(), updatedAt: Date.now(), nodes: parsed.project.nodes.map((item) => ({ ...item, id: nodeIds.get(item.id)!, assetId: undefined, visual: item.visual === 'uploaded' ? 'architecture' : item.visual })), connections: parsed.project.connections.map((item) => ({ id: crypto.randomUUID(), fromNodeId: nodeIds.get(item.fromNodeId)!, toNodeId: nodeIds.get(item.toNodeId)! })) }
      const imported = window.innerWidth <= 820 ? { ...baseImported, viewport: compactProjectViewport(baseImported) } : baseImported
      syncProjects([imported, ...projectsRef.current]); setCurrentId(imported.id); setSelectedId(imported.nodes[0]?.id ?? null); await savePrototypeStudioProject(imported); notify(t('Canvas imported'))
    } catch { notify(t('Unsupported canvas file')) }
    event.target.value = ''
  }

  const onNodePointerDown = (event: ReactPointerEvent, node: PrototypeStudioNode) => {
    if (!project || event.button !== 0) return
    event.stopPropagation(); selectNode(node.id)
    interactionRef.current = { kind: 'node', nodeId: node.id, startX: event.clientX, startY: event.clientY, nodeX: node.x, nodeY: node.y, before: structuredClone(project) }
  }
  const onCanvasPointerDown = (event: ReactPointerEvent) => {
    if (!project || event.button !== 0 || event.target !== event.currentTarget) return
    setSelectedId(null); interactionRef.current = { kind: 'pan', startX: event.clientX, startY: event.clientY, x: project.viewport.x, y: project.viewport.y }
  }
  const onWheel = (event: WheelEvent) => {
    if (!project) return
    event.preventDefault(); setZoom(project.viewport.zoom * (event.deltaY > 0 ? .92 : 1.08))
  }

  const sceneConnections = useMemo(() => project ? project.connections.map((connection) => {
    const from = project.nodes.find((item) => item.id === connection.fromNodeId); const to = project.nodes.find((item) => item.id === connection.toNodeId)
    if (!from || !to) return null
    const x1 = from.x + from.width; const y1 = from.y + from.height / 2; const x2 = to.x; const y2 = to.y + to.height / 2; const curve = Math.max(70, Math.abs(x2 - x1) * .42)
    const generating = to.status === 'generating'
    return <g className={generating ? 'is-generating' : ''} key={connection.id}><path className="r36-link-halo" d={`M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`} /><path className="r36-link" d={`M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`} /><circle cx={x1} cy={y1} r="5" /><circle cx={x2} cy={y2} r="5" /></g>
  }) : [], [project])

  if (!loaded) return <div className="r36-loading"><LoaderCircle size={22} /><span>{t('Loading canvas')}</span></div>
  if (!project) return <div className="r36-no-project"><FolderOpen size={28} /><h2>{t('No generations yet')}</h2><button type="button" className="pt-button" data-variant="primary" onClick={createProject}><Plus size={16} />{t('New project')}</button></div>

  const panelProps = { project, selected, t, credentialReady, onUpdateNode: updateNode, onUpdateSettings: updateSettings, onConnect: beginConnect, onDisconnect: disconnectNode, onDelete: deleteNode, onUnlock: () => setDialog('unlock'), onDedicated: () => setDialog('dedicated'), onLock: lock, onGenerate: generate, onCancel: cancelGeneration, onRetry: retryGeneration }
  const projectsProps = { projects, currentId, locale, t, onNew: createProject, onSelect: openProject, onDuplicate: duplicateProject, onRename: askRename, onDelete: askDeleteProject, onLocal: () => setDialog('local-data') }

  return <div className="r36-studio">
    <header className="r36-toolbar"><div className="r36-toolbar-title"><span><ImageIcon size={16} /></span><div><input aria-label={t('Canvas name')} value={project.title} onChange={(event) => updateProject((item) => ({ ...item, title: event.target.value }))} /><small><i />{t('Saved locally')}</small></div></div><div className="r36-toolbar-cluster mobile-panels"><IconButton label={t('Open projects')} onClick={() => setProjectsOpen(true)}><PanelLeft size={17} /></IconButton><IconButton label={t('Open inspector')} onClick={() => setInspectorOpen(true)}><PanelRight size={17} /></IconButton></div><div className="r36-toolbar-cluster add-tools"><span>{t('Add to canvas')}</span><IconButton label={t('Add prompt')} onClick={() => addNode('prompt')}><Sparkles size={17} /></IconButton><IconButton label={t('Add source image')} onClick={() => addNode('source')}><FileImage size={17} /></IconButton><IconButton label={t('Add note')} onClick={() => addNode('note')}><StickyNote size={17} /></IconButton></div><div className="r36-toolbar-cluster edit-tools"><IconButton label={t('Undo')} disabled={!undoRef.current.length} onClick={undo}><Undo2 size={17} /></IconButton><IconButton label={t('Redo')} disabled={!redoRef.current.length} onClick={redo}><Redo2 size={17} /></IconButton><IconButton label={t('Delete node')} disabled={!selected} onClick={deleteNode}><Trash2 size={17} /></IconButton></div><div className="r36-toolbar-cluster file-tools"><IconButton label={t('Import project')} onClick={() => importRef.current?.click()}><Upload size={17} /></IconButton><IconButton label={t('Export project')} onClick={exportProject}><Download size={17} /></IconButton></div></header>

    <div className="r36-workspace"><ProjectsPanel {...projectsProps} /><section className="r36-canvas-wrap"><div className="r36-canvas-meta"><span>CANVAS / {t('Generation path')}</span><strong>{t('Move nodes to shape the generation path')}</strong><small>{t('Drag the canvas to pan. Use the wheel or controls to zoom.')}</small></div>{connectingFrom ? <button type="button" className="r36-connection-banner" onClick={() => setConnectingFrom(null)}><Link2 size={15} /><span><strong>{t('Connection mode')}</strong>{t('Select another node to finish the connection.')}</span><X size={14} /></button> : null}<div ref={canvasRef} className="r36-canvas" onPointerDown={onCanvasPointerDown} onWheel={onWheel}><div className="r36-scene" style={{ transform: `translate(${project.viewport.x}px, ${project.viewport.y}px) scale(${project.viewport.zoom})` }}><svg className="r36-links" viewBox="0 0 1600 1000" aria-hidden="true">{sceneConnections}</svg>{project.nodes.map((node) => { const Icon = nodeIcon(node.type); return <article className={`r36-node ${selectedId === node.id ? 'selected' : ''} ${connectingFrom === node.id ? 'connecting' : ''}`} data-type={node.type} data-status={node.status} key={node.id} style={{ left: node.x, top: node.y, width: node.width, height: node.height }} onPointerDown={(event) => onNodePointerDown(event, node)}><header><span><Icon size={14} />{t(node.type === 'prompt' ? 'Prompt' : node.type === 'source' ? 'Source' : node.type === 'result' ? 'Result' : 'Note')}</span><CircleDot size={13} /></header><div className="r36-node-body">{node.type === 'source' || node.type === 'result' ? <Visual node={node} url={node.assetId ? assetUrls[node.assetId] : undefined} /> : null}{node.type === 'prompt' ? <p>{node.content || t('Enter an image prompt')}</p> : null}{node.type === 'note' ? <p>{node.content || t('Write a note')}</p> : null}{node.type === 'source' ? <p>{node.content}</p> : null}{node.type === 'result' ? <div className="r36-node-result-copy"><strong>{resultStatus(node, t)}</strong><small>{node.content}</small>{node.status === 'generating' ? <span><i /></span> : null}{node.status === 'failed' ? <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={retryGeneration}>{t('Retry')}</button> : null}</div> : null}</div><span className="r36-node-port in" /><span className="r36-node-port out" /></article> })}</div></div><div className="r36-zoom"><IconButton label={t('Zoom out')} onClick={() => setZoom(project.viewport.zoom - .1)}><ZoomOut size={16} /></IconButton><span>{Math.round(project.viewport.zoom * 100)}%</span><IconButton label={t('Zoom in')} onClick={() => setZoom(project.viewport.zoom + .1)}><ZoomIn size={16} /></IconButton><IconButton label={t('Fit canvas')} onClick={fitCanvas}><Maximize2 size={16} /></IconButton></div><div className="r36-status"><span><ShieldCheck size={14} />{t('Local canvas')}</span><span className={credentialReady ? 'ready' : ''}><i />{t(credentialReady ? 'Key ready' : 'Key locked')}</span><span>{project.settings.model}</span></div></section><InspectorPanel {...panelProps} /></div>

    <input ref={uploadRef} className="sr-only" type="file" accept="image/*" onChange={addSource} />
    <input ref={importRef} className="sr-only" type="file" accept="application/json" onChange={importProject} />

    {projectsOpen ? <div className="r36-sheet-layer"><button type="button" tabIndex={-1} className="r33-scrim" aria-label={t('Close')} onClick={() => setProjectsOpen(false)} /><section ref={projectsSheetRef} tabIndex={-1} className="r36-sheet projects" role="dialog" aria-modal="true" aria-label={t('Projects')}><div className="r36-sheet-head"><strong>{t('Projects')}</strong><div><IconButton label={t('New project')} onClick={createProject}><Plus size={16} /></IconButton><IconButton label={t('Close')} onClick={() => setProjectsOpen(false)}><X size={17} /></IconButton></div></div><ProjectsPanel {...projectsProps} mobile /></section></div> : null}
    {inspectorOpen ? <div className="r36-sheet-layer"><button type="button" tabIndex={-1} className="r33-scrim" aria-label={t('Close')} onClick={() => setInspectorOpen(false)} /><section ref={inspectorSheetRef} tabIndex={-1} className="r36-sheet inspector" role="dialog" aria-modal="true" aria-label={t('Inspector')}><div className="r36-sheet-head"><strong>{t('Inspector')}</strong><IconButton label={t('Close')} onClick={() => setInspectorOpen(false)}><X size={17} /></IconButton></div><InspectorPanel {...panelProps} mobile /></section></div> : null}

    <Modal active={dialog === 'rename'} title={t('Rename')} kicker="PROJECT" t={t} onClose={() => setDialog(null)} footer={<><button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog(null)}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="primary" disabled={!renameDraft.trim()} onClick={saveRename}>{t('Confirm')}</button></>}><label className="pt-field"><span>{t('Project name')}</span><span className="pt-field-control"><input autoFocus value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} /></span></label></Modal>
    <Modal active={dialog === 'delete-project'} title={t('Delete canvas')} kicker="LOCAL DATA" t={t} onClose={() => setDialog(null)} footer={<><button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog(null)}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="danger" onClick={() => void confirmDeleteProject()}>{t('Delete')}</button></>}><div className="pt-feedback" data-tone="danger"><Trash2 size={17} /><span>{t('Delete this local canvas and its image assets?')}</span></div></Modal>
    <Modal active={dialog === 'unlock'} title={t('Confirm session unlock')} kicker="MEMORY ONLY" t={t} onClose={() => setDialog(null)} footer={<><button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog(null)}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="primary" onClick={unlock}><LockKeyhole size={15} />{t('Unlock for session')}</button></>}><div className="r36-confirm-key"><span><KeyRound size={18} /></span><div><strong>{project.settings.tokenName}</strong><small>{t('Existing API key')}</small></div></div><p>{t('Reveal this key for the current studio session? The server does not require password or 2FA step-up.')}</p><div className="pt-feedback" data-tone="warning"><Info size={17} /><span>{t('No password or 2FA confirmation is available from the current server.')}</span></div><p className="r36-memory-note"><ShieldCheck size={15} />{t('The full key stays in memory only and is cleared when you leave the studio or sign out.')}</p></Modal>
    <Modal active={dialog === 'dedicated'} title={t('Create restricted key')} kicker="FINITE ACCESS" t={t} onClose={() => setDialog(null)} footer={<><button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog(null)}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="primary" onClick={createDedicated}>{t('Confirm key creation')}</button></>}><p>{t('This creates a finite-quota key restricted to the selected image model.')}</p><dl className="r36-key-scope"><div><dt>{t('Model')}</dt><dd>{project.settings.model}</dd></div><div><dt>{t('Group')}</dt><dd>{project.settings.group}</dd></div></dl><label className="pt-field"><span>{t('Key quota')} (USD)</span><span className="pt-field-control"><input type="number" min="1" max="100" value={budget} onChange={(event) => setBudget(Number(event.target.value))} /></span></label></Modal>
    <Modal active={dialog === 'local-data'} title={t('Local data')} kicker="BROWSER STORAGE" t={t} onClose={() => setDialog(null)} footer={<button type="button" className="pt-button" data-variant="primary" onClick={() => setDialog(null)}>{t('Close')}</button>}><div className="r36-storage-metric"><span>{t('Saved on this device')}</span><strong>{storageSize(prototypeStudioBytes(projects, assets), locale)}</strong><small>{projects.length} {t('Projects')} · {assets.length} {t('Image')}</small></div><div className="r36-local-facts"><p><ShieldCheck size={16} />{t('Studio data never leaves this browser in the prototype.')}</p><p><KeyRound size={16} />{t('API key stays in memory')}</p><p><Sparkles size={16} />{t('Generation requests are simulated in this prototype.')}</p></div></Modal>
  </div>
}
