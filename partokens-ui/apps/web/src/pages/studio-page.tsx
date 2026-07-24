import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import {
  Check,
  CopyPlus,
  Download,
  FileImage,
  FolderOpen,
  Image,
  KeyRound,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  Sparkles,
  StickyNote,
  Trash2,
  Undo2,
  Unlink,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import {
  createToken,
  getTokens,
  getUserGroups,
  getUserModels,
  revealToken,
  type TokenSummary,
} from '@partokens/api-client'
import { isAppLocale } from '@partokens/i18n'
import {
  clearStudioCredential,
  createStudioProject,
  findStudioNodePosition,
  generateStudioImages,
  getStudioCredential,
  setStudioCredential,
  studioModelCapabilities,
  type StudioAsset,
  type StudioConnection,
  type StudioNode,
  type StudioNodeType,
  type StudioProject,
} from '@partokens/studio'

import { IconButton } from '@/components/ui'
import { database, ownerNamespace } from '@/db'
import { extractItems, quotaDollarsToUnits } from '@/lib/format'
import { localizedUserPath } from '@/lib/routes'
import { useSessionStore } from '@/stores/session'

const MAX_UNDO = 50

type CanvasInteraction =
  | { kind: 'pan'; startX: number; startY: number; x: number; y: number }
  | { kind: 'move'; nodeId: string; startX: number; startY: number; x: number; y: number; before: StudioProject; moved: boolean }
  | { kind: 'resize'; nodeId: string; startX: number; startY: number; width: number; height: number; before: StudioProject; moved: boolean }

type StudioExport = {
  format: 'partokens-studio'
  version: 1
  project: StudioProject
  assets: Array<{ id: string; mimeType: string; dataUrl: string }>
}

function stringItems(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return extractItems<string>(value)
}

function groupItems(value: unknown): string[] {
  return value && typeof value === 'object' ? Object.keys(value as Record<string, unknown>) : ['default']
}

function nodeTitle(type: StudioNodeType): string {
  if (type === 'prompt') return 'Image prompt'
  if (type === 'source') return 'Source image'
  if (type === 'result') return 'Generated image'
  return 'Note'
}

function cloneProject(project: StudioProject): StudioProject {
  return structuredClone(project)
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('Unable to read image'))
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(value: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(value)
  if (!match) throw new Error('Invalid embedded image')
  const bytes = match[2]
    ? Uint8Array.from(atob(match[3] || ''), (character) => character.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(match[3] || ''))
  return new Blob([bytes], { type: match[1] || 'application/octet-stream' })
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function safeFilename(value: string): string {
  return value.trim().replace(/[^a-z0-9\u4e00-\u9fff-]+/gi, '-').replace(/^-|-$/g, '') || 'canvas'
}

export function StudioPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string; projectId?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const { user } = useSessionStore()
  const [projects, setProjects] = useState<StudioProject[]>([])
  const [project, setProjectState] = useState<StudioProject | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})
  const [storageLabel, setStorageLabel] = useState('')
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [credentialBusy, setCredentialBusy] = useState(false)
  const [credentialVersion, setCredentialVersion] = useState(0)
  const [budget, setBudget] = useState(5)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const projectRef = useRef<StudioProject | null>(null)
  const assetUrlsRef = useRef<Record<string, string>>({})
  const interactionRef = useRef<CanvasInteraction | null>(null)
  const editBeforeRef = useRef<StudioProject | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const undoRef = useRef<StudioProject[]>([])
  const redoRef = useRef<StudioProject[]>([])
  const importRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const groupsQuery = useQuery({ queryKey: ['user-groups'], queryFn: getUserGroups, retry: false })
  const group = project?.settings.group || 'default'
  const modelsQuery = useQuery({ queryKey: ['user-models', group], queryFn: () => getUserModels(group), retry: false })
  const tokensQuery = useQuery({ queryKey: ['studio-tokens'], queryFn: () => getTokens({ p: 1, size: 100 }), retry: false })
  const groups = groupItems(groupsQuery.data?.data)
  const models = stringItems(modelsQuery.data?.data)
  const tokens = extractItems<TokenSummary>(tokensQuery.data?.data).filter((item) => item.status === 1)
  const selectedNode = project?.nodes.find((node) => node.id === selectedId) || null
  const selectedPrompt = selectedNode?.type === 'prompt' ? selectedNode : project?.nodes.find((node) => node.type === 'prompt') || null
  const capabilities = studioModelCapabilities(project?.settings.model || '')
  const activeCredential = getStudioCredential()
  const credentialReady = Boolean(project?.settings.tokenId && activeCredential?.tokenId === project.settings.tokenId)

  const setProject = useCallback((next: StudioProject | ((current: StudioProject) => StudioProject)) => {
    setProjectState((current) => {
      if (!current) return current
      const resolved = typeof next === 'function' ? next(current) : next
      const stamped = { ...resolved, updatedAt: Date.now() }
      projectRef.current = stamped
      return stamped
    })
  }, [])

  const pushUndo = useCallback((before: StudioProject) => {
    undoRef.current = [...undoRef.current.slice(-(MAX_UNDO - 1)), before]
    redoRef.current = []
  }, [])

  const commit = useCallback((update: (current: StudioProject) => StudioProject) => {
    setProjectState((current) => {
      if (!current) return current
      pushUndo(cloneProject(current))
      const next = { ...update(current), updatedAt: Date.now() }
      projectRef.current = next
      return next
    })
  }, [pushUndo])

  const replaceAssetUrls = useCallback((next: Record<string, string>) => {
    Object.values(assetUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
    assetUrlsRef.current = next
    setAssetUrls(next)
  }, [])

  const loadAssets = useCallback(async (projectId: string) => {
    const assets = await database.studioAssets.where('projectId').equals(projectId).toArray()
    replaceAssetUrls(Object.fromEntries(assets.map((asset) => [asset.id, URL.createObjectURL(asset.blob)])))
  }, [replaceAssetUrls])

  const openProject = useCallback(async (next: StudioProject) => {
    if (projectRef.current) await database.studioProjects.put(projectRef.current)
    projectRef.current = next
    setProjectState(next)
    setSelectedId(next.nodes[0]?.id || null)
    setConnectingFrom(null)
    setProjectsOpen(false)
    undoRef.current = []
    redoRef.current = []
    await loadAssets(next.id)
  }, [loadAssets])

  const refreshProjects = useCallback(async (preferredId?: string) => {
    if (!user) return
    const namespace = ownerNamespace(user.id)
    let items = await database.studioProjects.where('ownerNamespace').equals(namespace).reverse().sortBy('updatedAt')
    if (!items.length) {
      const first = await database.transaction('rw', database.studioProjects, async () => {
        const existing = await database.studioProjects.where('ownerNamespace').equals(namespace).first()
        if (existing) return existing
        const created = createStudioProject(namespace, t('Untitled canvas'), t('Image prompt'))
        await database.studioProjects.add(created)
        return created
      })
      items = [first]
    }
    setProjects(items)
    const preferred = items.find((item) => item.id === (preferredId || params.projectId)) || items[0]
    if (preferred) await openProject(preferred)
  }, [openProject, params.projectId, t, user])

  useEffect(() => { void refreshProjects() }, [refreshProjects])

  useEffect(() => {
    if (!project) return
    const timer = window.setTimeout(() => {
      void database.studioProjects.put(project).then(() => {
        setSavedAt(Date.now())
        setProjects((items) => items.map((item) => item.id === project.id ? project : item).sort((a, b) => b.updatedAt - a.updatedAt))
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [project])

  useEffect(() => {
    void navigator.storage?.estimate().then((estimate) => {
      const used = estimate.usage || 0
      const quota = estimate.quota || 0
      setStorageLabel(quota ? `${(used / 1024 / 1024).toFixed(1)} / ${(quota / 1024 / 1024).toFixed(0)} MB` : `${(used / 1024 / 1024).toFixed(1)} MB`)
    })
  }, [projects.length, assetUrls])

  useEffect(() => () => {
    if (projectRef.current) void database.studioProjects.put(projectRef.current)
    abortRef.current?.abort()
    clearStudioCredential()
    Object.values(assetUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const interaction = interactionRef.current
      const current = projectRef.current
      if (!interaction || !current) return
      if (interaction.kind === 'pan') {
        setProject((value) => ({
          ...value,
          viewport: {
            ...value.viewport,
            x: interaction.x + event.clientX - interaction.startX,
            y: interaction.y + event.clientY - interaction.startY,
          },
        }))
        return
      }
      const zoom = current.viewport.zoom
      const dx = (event.clientX - interaction.startX) / zoom
      const dy = (event.clientY - interaction.startY) / zoom
      interaction.moved ||= Math.abs(dx) > 2 || Math.abs(dy) > 2
      setProject((value) => ({
        ...value,
        nodes: value.nodes.map((node) => {
          if (node.id !== interaction.nodeId) return node
          if (interaction.kind === 'move') return { ...node, x: interaction.x + dx, y: interaction.y + dy }
          return { ...node, width: Math.max(180, interaction.width + dx), height: Math.max(120, interaction.height + dy) }
        }),
      }))
    }
    const up = () => {
      const interaction = interactionRef.current
      if (interaction && interaction.kind !== 'pan' && interaction.moved) pushUndo(interaction.before)
      interactionRef.current = null
      document.body.style.cursor = ''
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [pushUndo, setProject])

  useEffect(() => {
    if (!project || !models.length || models.includes(project.settings.model)) return
    setProject((current) => ({ ...current, settings: { ...current.settings, model: models[0] || '' } }))
  }, [models, project, setProject])

  useEffect(() => {
    if (!project) return
    const next = studioModelCapabilities(project.settings.model)
    const patch = {
      size: next.sizes.includes(project.settings.size) ? project.settings.size : next.sizes[0]!,
      quality: next.qualities.includes(project.settings.quality) ? project.settings.quality : next.qualities[0]!,
      background: next.backgrounds.includes(project.settings.background) ? project.settings.background : next.backgrounds[0]!,
      count: Math.min(project.settings.count, next.maxCount),
    }
    if (patch.size !== project.settings.size || patch.quality !== project.settings.quality || patch.background !== project.settings.background || patch.count !== project.settings.count) {
      setProject((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
    }
  }, [project?.settings.model, project?.settings.size, project?.settings.quality, project?.settings.background, project?.settings.count, setProject])

  const createProject = async () => {
    if (!user) return
    const next = createStudioProject(ownerNamespace(user.id), t('Untitled canvas'), t('Image prompt'))
    await database.studioProjects.add(next)
    setProjects((items) => [next, ...items])
    await openProject(next)
  }

  const duplicateProject = async (source: StudioProject) => {
    const next = cloneProject(source)
    next.id = crypto.randomUUID()
    next.title = `${source.title} ${t('Copy')}`
    next.createdAt = Date.now()
    next.updatedAt = next.createdAt
    const assets = await database.studioAssets.where('projectId').equals(source.id).toArray()
    const assetIds = new Map<string, string>()
    for (const asset of assets) {
      const id = crypto.randomUUID()
      assetIds.set(asset.id, id)
      await database.studioAssets.add({ ...asset, id, projectId: next.id, createdAt: Date.now() })
    }
    next.nodes = next.nodes.map((node) => node.assetId ? { ...node, assetId: assetIds.get(node.assetId) } : node)
    await database.studioProjects.add(next)
    setProjects((items) => [next, ...items])
    await openProject(next)
  }

  const deleteProject = async (target: StudioProject) => {
    if (!window.confirm(t('Delete this local canvas and its image assets?'))) return
    await database.transaction('rw', database.studioProjects, database.studioAssets, async () => {
      await database.studioProjects.delete(target.id)
      await database.studioAssets.where('projectId').equals(target.id).delete()
    })
    await refreshProjects(project?.id === target.id ? undefined : project?.id)
  }

  const updateTitle = (title: string) => setProject((current) => ({ ...current, title }))

  const addTextNode = (type: 'prompt' | 'note') => {
    if (!project) return
    const id = crypto.randomUUID()
    commit((current) => {
      const width = type === 'prompt' ? 250 : 220
      const height = type === 'prompt' ? 170 : 145
      const position = findStudioNodePosition(current.nodes, width, height, {
        x: (96 - current.viewport.x) / current.viewport.zoom,
        y: (96 - current.viewport.y) / current.viewport.zoom,
      })
      return {
        ...current,
        nodes: [...current.nodes, {
          id,
          type,
          title: t(nodeTitle(type)),
          ...position,
          width,
          height,
          content: '',
          status: 'idle',
          createdAt: Date.now(),
        }],
      }
    })
    setSelectedId(id)
  }

  const addSourceImage = async (file: File) => {
    const current = projectRef.current
    if (!current || !user || !file.type.startsWith('image/')) return
    const asset: StudioAsset = {
      id: crypto.randomUUID(),
      ownerNamespace: ownerNamespace(user.id),
      projectId: current.id,
      mimeType: file.type,
      bytes: file.size,
      blob: file,
      createdAt: Date.now(),
    }
    await database.studioAssets.add(asset)
    const id = crypto.randomUUID()
    const url = URL.createObjectURL(file)
    assetUrlsRef.current = { ...assetUrlsRef.current, [asset.id]: url }
    setAssetUrls(assetUrlsRef.current)
    commit((value) => {
      const position = findStudioNodePosition(value.nodes, 240, 210, {
        x: (96 - value.viewport.x) / value.viewport.zoom,
        y: (96 - value.viewport.y) / value.viewport.zoom,
      })
      return {
        ...value,
        nodes: [...value.nodes, {
          id,
          type: 'source',
          title: file.name,
          ...position,
          width: 240,
          height: 210,
          content: '',
          assetId: asset.id,
          status: 'ready',
          createdAt: Date.now(),
        }],
      }
    })
    setSelectedId(id)
  }

  const deleteNode = async (node: StudioNode) => {
    if (node.assetId) await database.studioAssets.delete(node.assetId)
    commit((current) => ({
      ...current,
      nodes: current.nodes.filter((item) => item.id !== node.id),
      connections: current.connections.filter((item) => item.fromNodeId !== node.id && item.toNodeId !== node.id),
    }))
    setSelectedId(null)
  }

  const connectTo = (targetId: string) => {
    if (!project || !connectingFrom || connectingFrom === targetId) return
    const exists = project.connections.some((item) => item.fromNodeId === connectingFrom && item.toNodeId === targetId)
    if (!exists) {
      const from = connectingFrom
      commit((current) => ({ ...current, connections: [...current.connections, { id: crypto.randomUUID(), fromNodeId: from, toNodeId: targetId }] }))
    }
    setConnectingFrom(null)
  }

  const disconnectNode = (nodeId: string) => commit((current) => ({
    ...current,
    connections: current.connections.filter((item) => item.fromNodeId !== nodeId && item.toNodeId !== nodeId),
  }))

  const undo = () => {
    const current = projectRef.current
    const previous = undoRef.current.pop()
    if (!current || !previous) return
    redoRef.current.push(cloneProject(current))
    projectRef.current = previous
    setProjectState(previous)
  }

  const redo = () => {
    const current = projectRef.current
    const next = redoRef.current.pop()
    if (!current || !next) return
    undoRef.current.push(cloneProject(current))
    projectRef.current = next
    setProjectState(next)
  }

  const exportProject = async () => {
    const current = projectRef.current
    if (!current) return
    const assets = await database.studioAssets.where('projectId').equals(current.id).toArray()
    const output: StudioExport = {
      format: 'partokens-studio',
      version: 1,
      project: current,
      assets: await Promise.all(assets.map(async (asset) => ({ id: asset.id, mimeType: asset.mimeType, dataUrl: await blobToDataUrl(asset.blob) }))),
    }
    downloadBlob(new Blob([JSON.stringify(output)], { type: 'application/json' }), `${safeFilename(current.title)}.partokens.json`)
  }

  const importProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) return
    try {
      const input = JSON.parse(await file.text()) as StudioExport
      if (input.format !== 'partokens-studio' || input.version !== 1 || !input.project || !Array.isArray(input.project.nodes)) throw new Error(t('Unsupported canvas file'))
      const now = Date.now()
      const projectId = crypto.randomUUID()
      const nodeIds = new Map(input.project.nodes.map((node) => [node.id, crypto.randomUUID()]))
      const assetIds = new Map(input.assets.map((asset) => [asset.id, crypto.randomUUID()]))
      const next: StudioProject = {
        id: projectId,
        ownerNamespace: ownerNamespace(user.id),
        title: input.project.title || t('Imported canvas'),
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
        nodes: input.project.nodes.map((node) => ({
          ...node,
          id: nodeIds.get(node.id)!,
          assetId: node.assetId ? assetIds.get(node.assetId) : undefined,
          remoteUrl: undefined,
        })),
        connections: input.project.connections.map((connection) => ({
          ...connection,
          id: crypto.randomUUID(),
          fromNodeId: nodeIds.get(connection.fromNodeId)!,
          toNodeId: nodeIds.get(connection.toNodeId)!,
        })).filter((connection) => connection.fromNodeId && connection.toNodeId),
        viewport: input.project.viewport || { x: 0, y: 0, zoom: 1 },
        settings: { ...input.project.settings, tokenId: undefined },
        history: input.project.history || [],
      }
      await database.transaction('rw', database.studioProjects, database.studioAssets, async () => {
        await database.studioProjects.add(next)
        for (const asset of input.assets) {
          const blob = dataUrlToBlob(asset.dataUrl)
          await database.studioAssets.add({
            id: assetIds.get(asset.id)!,
            ownerNamespace: next.ownerNamespace,
            projectId,
            mimeType: asset.mimeType || blob.type,
            bytes: blob.size,
            blob,
            createdAt: now,
          })
        }
      })
      setProjects((items) => [next, ...items])
      await openProject(next)
      setNotice(t('Canvas imported'))
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Unable to import canvas'))
    }
  }

  const unlockKey = async () => {
    const tokenId = project?.settings.tokenId
    const token = tokens.find((item) => item.id === tokenId)
    if (!token || !window.confirm(t('Reveal this key for the current studio session? The server does not require password or 2FA step-up.'))) return
    setCredentialBusy(true)
    setError('')
    try {
      const response = await revealToken(token.id)
      if (!response.success || !response.data?.key) throw new Error(response.message || t('Unable to reveal key'))
      setStudioCredential({ tokenId: token.id, tokenName: token.name, key: response.data.key })
      setCredentialVersion((value) => value + 1)
      setNotice(t('API key unlocked for this session'))
    } catch (cause) {
      clearStudioCredential()
      setError(cause instanceof Error ? cause.message : t('Unable to reveal key'))
    } finally {
      setCredentialBusy(false)
    }
  }

  const createDedicatedKey = async () => {
    const current = projectRef.current
    if (!current?.settings.model || !window.confirm(t('Create a finite-quota key restricted to the selected image model?'))) return
    setCredentialBusy(true)
    setError('')
    try {
      const created = await createToken({
        name: `Studio ${new Intl.DateTimeFormat('en-CA').format(new Date())}`,
        remain_quota: quotaDollarsToUnits(Math.max(0.01, budget)),
        expired_time: -1,
        unlimited_quota: false,
        model_limits_enabled: true,
        model_limits: current.settings.model,
        allow_ips: '',
        group: current.settings.group,
        cross_group_retry: false,
      })
      if (!created.success || !created.data?.id) throw new Error(created.message || t('Unable to create key'))
      const revealed = await revealToken(created.data.id)
      if (!revealed.success || !revealed.data?.key) throw new Error(revealed.message || t('Unable to reveal key'))
      setStudioCredential({ tokenId: created.data.id, tokenName: created.data.name || 'Studio', key: revealed.data.key })
      setProject((value) => ({ ...value, settings: { ...value.settings, tokenId: created.data.id } }))
      setCredentialVersion((value) => value + 1)
      await tokensQuery.refetch()
      setNotice(t('Dedicated studio key created'))
    } catch (cause) {
      clearStudioCredential()
      setError(cause instanceof Error ? cause.message : t('Unable to create key'))
    } finally {
      setCredentialBusy(false)
    }
  }

  const lockKey = () => {
    clearStudioCredential()
    setCredentialVersion((value) => value + 1)
    setNotice(t('Studio key locked'))
  }

  const generate = async () => {
    const current = projectRef.current
    const promptNode = current?.nodes.find((node) => node.id === selectedPrompt?.id)
    if (!current || !promptNode || busy) return
    if (!credentialReady) { setError(t('Unlock the selected API key before generating')); return }
    const sourceNodeIds = current.connections.filter((connection) => connection.toNodeId === promptNode.id).map((connection) => connection.fromNodeId)
    const sourceNodes = current.nodes.filter((node) => sourceNodeIds.includes(node.id) && node.type === 'source' && node.assetId)
    const sourceAssets = (await Promise.all(sourceNodes.map((node) => database.studioAssets.get(node.assetId!)))).filter((asset): asset is StudioAsset => Boolean(asset))
    const before = cloneProject(current)
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError('')
    setNotice('')
    setProject((value) => ({ ...value, nodes: value.nodes.map((node) => node.id === promptNode.id ? { ...node, status: 'generating', error: undefined } : node) }))
    try {
      const results = await generateStudioImages({
        model: current.settings.model,
        prompt: promptNode.content,
        size: current.settings.size,
        quality: current.settings.quality,
        background: current.settings.background,
        count: current.settings.count,
        sourceImages: sourceAssets.map((asset) => asset.blob),
      }, controller.signal)
      const newNodes: StudioNode[] = []
      const newConnections: StudioConnection[] = []
      for (const [index, result] of results.entries()) {
        let assetId: string | undefined
        if (result.blob) {
          assetId = crypto.randomUUID()
          const asset: StudioAsset = {
            id: assetId,
            ownerNamespace: current.ownerNamespace,
            projectId: current.id,
            mimeType: result.blob.type || 'image/png',
            bytes: result.blob.size,
            blob: result.blob,
            createdAt: Date.now(),
          }
          await database.studioAssets.add(asset)
          const url = URL.createObjectURL(result.blob)
          assetUrlsRef.current = { ...assetUrlsRef.current, [assetId]: url }
        }
        const nodeId = crypto.randomUUID()
        const position = findStudioNodePosition(
          [...current.nodes, ...newNodes],
          260,
          225,
          { x: promptNode.x + promptNode.width + 80, y: promptNode.y },
        )
        newNodes.push({
          id: nodeId,
          type: 'result',
          title: `${t('Generated image')} ${index + 1}`,
          ...position,
          width: 260,
          height: 225,
          content: promptNode.content,
          assetId,
          remoteUrl: result.remoteUrl,
          revisedPrompt: result.revisedPrompt,
          status: 'ready',
          createdAt: Date.now(),
        })
        newConnections.push({ id: crypto.randomUUID(), fromNodeId: promptNode.id, toNodeId: nodeId })
      }
      setAssetUrls(assetUrlsRef.current)
      const completed: StudioProject = {
        ...projectRef.current!,
        nodes: [...projectRef.current!.nodes.map((node) => node.id === promptNode.id ? { ...node, status: 'ready' as const } : node), ...newNodes],
        connections: [...projectRef.current!.connections, ...newConnections],
        history: [{
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          prompt: promptNode.content,
          model: current.settings.model,
          nodeIds: newNodes.map((node) => node.id),
          status: 'completed' as const,
        }, ...projectRef.current!.history].slice(0, 50),
        updatedAt: Date.now(),
      }
      pushUndo(before)
      await database.studioProjects.put(completed)
      projectRef.current = completed
      setProjectState(completed)
      setSavedAt(Date.now())
      setSelectedId(newNodes[0]?.id || promptNode.id)
      setNotice(t('Images added to the local canvas'))
    } catch (cause) {
      const cancelled = controller.signal.aborted
      const message = cancelled ? t('Generation cancelled') : cause instanceof Error ? t(cause.message) : t('Image generation failed')
      const failed: StudioProject = {
        ...projectRef.current!,
        nodes: projectRef.current!.nodes.map((node) => node.id === promptNode.id ? { ...node, status: cancelled ? 'idle' : 'error', error: cancelled ? undefined : message } : node),
        history: [{
          id: crypto.randomUUID(), createdAt: Date.now(), prompt: promptNode.content, model: current.settings.model, nodeIds: [], status: cancelled ? 'cancelled' as const : 'failed' as const, error: cancelled ? undefined : message,
        }, ...projectRef.current!.history].slice(0, 50),
        updatedAt: Date.now(),
      }
      projectRef.current = failed
      setProjectState(failed)
      if (!cancelled) setError(message)
      else setNotice(message)
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  }

  const updateSettings = <K extends keyof StudioProject['settings']>(key: K, value: StudioProject['settings'][K]) => {
    setProject((current) => ({ ...current, settings: { ...current.settings, [key]: value } }))
  }

  const startNodeEdit = () => { if (projectRef.current) editBeforeRef.current = cloneProject(projectRef.current) }
  const finishNodeEdit = () => {
    if (editBeforeRef.current) pushUndo(editBeforeRef.current)
    editBeforeRef.current = null
  }

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('[data-node-id], [data-canvas-control]'))) return
    const current = projectRef.current
    if (!current) return
    setSelectedId(null)
    setConnectingFrom(null)
    interactionRef.current = { kind: 'pan', startX: event.clientX, startY: event.clientY, x: current.viewport.x, y: current.viewport.y }
    document.body.style.cursor = 'grabbing'
  }

  const onNodePointerDown = (event: ReactPointerEvent, node: StudioNode) => {
    event.stopPropagation()
    const current = projectRef.current
    if (!current || event.button !== 0) return
    setSelectedId(node.id)
    interactionRef.current = { kind: 'move', nodeId: node.id, startX: event.clientX, startY: event.clientY, x: node.x, y: node.y, before: cloneProject(current), moved: false }
    document.body.style.cursor = 'grabbing'
  }

  const onResizePointerDown = (event: ReactPointerEvent, node: StudioNode) => {
    event.stopPropagation()
    const current = projectRef.current
    if (!current) return
    interactionRef.current = { kind: 'resize', nodeId: node.id, startX: event.clientX, startY: event.clientY, width: node.width, height: node.height, before: cloneProject(current), moved: false }
    document.body.style.cursor = 'nwse-resize'
  }

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const current = projectRef.current
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!current || !rect) return
    const zoom = Math.min(2.5, Math.max(0.3, current.viewport.zoom * Math.pow(1.1, -event.deltaY / 100)))
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const worldX = (mouseX - current.viewport.x) / current.viewport.zoom
    const worldY = (mouseY - current.viewport.y) / current.viewport.zoom
    setProject((value) => ({ ...value, viewport: { x: mouseX - worldX * zoom, y: mouseY - worldY * zoom, zoom } }))
  }

  const setZoom = (zoom: number) => setProject((current) => ({ ...current, viewport: { ...current.viewport, zoom: Math.min(2.5, Math.max(0.3, zoom)) } }))

  const connectionPath = (connection: StudioConnection) => {
    const from = project?.nodes.find((node) => node.id === connection.fromNodeId)
    const to = project?.nodes.find((node) => node.id === connection.toNodeId)
    if (!from || !to) return ''
    const x1 = from.x + from.width
    const y1 = from.y + from.height / 2
    const x2 = to.x
    const y2 = to.y + to.height / 2
    const bend = Math.max(60, Math.abs(x2 - x1) * 0.42)
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
  }

  if (!project) return <div className="route-loader"><LoaderCircle className="spin" size={22} />{t('Loading canvas')}</div>

  return (
    <div className="studio-layout studio-v2">
      <header className="studio-toolbar">
        <div className="studio-title-field">
          <Image size={16} />
          <input value={project.title} aria-label={t('Canvas name')} onChange={(event) => updateTitle(event.target.value)} onBlur={() => void database.studioProjects.put(project)} />
          <span>{savedAt ? t('Saved locally') : t('Local canvas')}</span>
        </div>
        <div className="studio-tools" aria-label={t('Canvas tools')}>
          <button onClick={() => addTextNode('prompt')} title={t('Add prompt')}><Sparkles size={16} /><span>{t('Prompt')}</span></button>
          <button onClick={() => imageRef.current?.click()} title={t('Add source image')}><FileImage size={16} /><span>{t('Image')}</span></button>
          <button onClick={() => addTextNode('note')} title={t('Add note')}><StickyNote size={16} /><span>{t('Note')}</span></button>
          <span className="toolbar-divider" />
          <button onClick={undo} disabled={!undoRef.current.length} title={t('Undo')}><Undo2 size={16} /></button>
          <button onClick={redo} disabled={!redoRef.current.length} title={t('Redo')}><Redo2 size={16} /></button>
          {selectedNode ? <button onClick={() => void deleteNode(selectedNode)} title={t('Delete node')}><Trash2 size={16} /></button> : null}
        </div>
        <div className="studio-toolbar-actions">
          <IconButton label={t('Projects')} onClick={() => setProjectsOpen((value) => !value)}><PanelLeft size={17} /></IconButton>
          <IconButton label={t('Import project')} onClick={() => importRef.current?.click()}><Upload size={17} /></IconButton>
          <IconButton label={t('Export project')} onClick={() => void exportProject()}><Download size={17} /></IconButton>
          <IconButton label={t('Inspector')} onClick={() => setInspectorOpen((value) => !value)}><PanelRight size={17} /></IconButton>
        </div>
        <input ref={imageRef} hidden type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void addSourceImage(file) }} />
        <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importProject(event)} />
      </header>

      <aside className={`studio-projects ${projectsOpen ? 'open' : ''}`}>
        <div className="studio-panel-heading"><span className="eyebrow">{t('Local projects')}</span><IconButton label={t('Close')} onClick={() => setProjectsOpen(false)}><X size={16} /></IconButton></div>
        <button className="button primary-button" onClick={() => void createProject()}><Plus size={15} />{t('New canvas')}</button>
        <div className="project-list">
          {projects.map((item) => <div className={item.id === project.id ? 'project-row active' : 'project-row'} key={item.id}>
            <button className="project-open" onClick={() => void openProject(item)}>
              <span className="project-thumbnail"><Image size={13} /></span>
              <span><strong>{item.title}</strong><small>{item.nodes.length} {t('nodes')}</small></span>
            </button>
            <div className="project-actions">
              <IconButton label={t('Duplicate canvas')} onClick={() => void duplicateProject(item)}><CopyPlus size={14} /></IconButton>
              <IconButton label={t('Delete canvas')} onClick={() => void deleteProject(item)}><Trash2 size={14} /></IconButton>
            </div>
          </div>)}
        </div>
        <div className="local-disclosure studio-storage"><span className="local-icon">LOCAL</span><p>{t('Projects and image assets stay in this browser.')}</p>{storageLabel ? <code>{storageLabel}</code> : null}</div>
        <a className="studio-attribution" href="https://github.com/basketikun/infinite-canvas" target="_blank" rel="noreferrer">infinite-canvas / AGPL-3.0</a>
      </aside>

      <main ref={canvasRef} className="canvas-surface" onPointerDown={onCanvasPointerDown} onWheel={onWheel}>
        <div className="canvas-grid" style={{
          backgroundSize: `${48 * project.viewport.zoom}px ${48 * project.viewport.zoom}px`,
          backgroundPosition: `${project.viewport.x}px ${project.viewport.y}px`,
        }} />
        <div className="canvas-world" style={{ transform: `translate(${project.viewport.x}px, ${project.viewport.y}px) scale(${project.viewport.zoom})` }}>
          <svg className="canvas-links" aria-hidden="true">
            {project.connections.map((connection) => <path key={connection.id} d={connectionPath(connection)} />)}
          </svg>
          {project.nodes.map((node) => {
            const imageUrl = node.assetId ? assetUrls[node.assetId] : node.remoteUrl
            return <article
              key={node.id}
              data-node-id={node.id}
              className={`canvas-node ${node.type} ${selectedId === node.id ? 'selected' : ''} ${node.status}`}
              style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
              onClick={(event) => { event.stopPropagation(); setSelectedId(node.id) }}
            >
              <button className="node-input-port" data-canvas-control aria-label={`${t('Connect to')} ${node.title}`} onClick={(event) => { event.stopPropagation(); connectTo(node.id) }} />
              <header onPointerDown={(event) => onNodePointerDown(event, node)}>
                <span>{node.type === 'prompt' ? <Sparkles size={14} /> : node.type === 'note' ? <StickyNote size={14} /> : <Image size={14} />}{t(node.type === 'result' ? 'Result' : node.type === 'source' ? 'Source' : node.type === 'prompt' ? 'Prompt' : 'Note')}</span>
                {node.status === 'generating' ? <LoaderCircle className="spin" size={14} /> : node.status === 'ready' ? <Check size={14} /> : null}
              </header>
              <strong>{node.title}</strong>
              {imageUrl ? <img src={imageUrl} alt={node.title} draggable={false} /> : node.type === 'source' || node.type === 'result' ? <div className="image-placeholder"><Image size={26} /></div> : <p>{node.content || t(node.type === 'prompt' ? 'Enter an image prompt' : 'Write a note')}</p>}
              {node.error ? <small className="node-error">{node.error}</small> : null}
              <button className={connectingFrom === node.id ? 'node-output-port active' : 'node-output-port'} data-canvas-control aria-label={`${t('Connect from')} ${node.title}`} onClick={(event) => { event.stopPropagation(); setConnectingFrom(node.id) }} />
              {selectedId === node.id ? <button className="node-resize-handle" data-canvas-control aria-label={t('Resize node')} onPointerDown={(event) => onResizePointerDown(event, node)}><Maximize2 size={11} /></button> : null}
            </article>
          })}
        </div>
        <div className="zoom-control" data-canvas-control>
          <IconButton label={t('Zoom out')} onClick={() => setZoom(project.viewport.zoom - 0.1)}><ZoomOut size={16} /></IconButton>
          <span>{Math.round(project.viewport.zoom * 100)}%</span>
          <IconButton label={t('Zoom in')} onClick={() => setZoom(project.viewport.zoom + 0.1)}><ZoomIn size={16} /></IconButton>
        </div>
        <div className="studio-statusbar" data-canvas-control>
          <span className={credentialReady ? 'status-dot healthy' : 'status-dot pending'} />
          <span>{credentialReady ? t('Key ready') : t('Key locked')}</span>
          <code>{project.settings.model || t('No model selected')}</code>
          {connectingFrom ? <button onClick={() => setConnectingFrom(null)}><Unlink size={13} />{t('Cancel connection')}</button> : null}
        </div>
      </main>

      <aside className={`studio-inspector ${inspectorOpen ? 'open' : ''}`}>
        <div className="studio-panel-heading"><span className="eyebrow">{t('Inspector')}</span><IconButton label={t('Close')} onClick={() => setInspectorOpen(false)}><X size={16} /></IconButton></div>
        {selectedNode ? <>
          <div className="inspector-title"><div><span>{t(nodeTitle(selectedNode.type))}</span><h2>{selectedNode.title}</h2></div>{project.connections.some((connection) => connection.fromNodeId === selectedNode.id || connection.toNodeId === selectedNode.id) ? <IconButton label={t('Remove node connections')} onClick={() => disconnectNode(selectedNode.id)}><Unlink size={16} /></IconButton> : null}</div>
          {selectedNode.type === 'prompt' || selectedNode.type === 'note' ? <label>
            <span>{t(selectedNode.type === 'prompt' ? 'Prompt' : 'Note')}</span>
            <textarea rows={selectedNode.type === 'prompt' ? 6 : 4} value={selectedNode.content} onFocus={startNodeEdit} onBlur={finishNodeEdit} onChange={(event) => setProject((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode.id ? { ...node, content: event.target.value } : node) }))} />
          </label> : null}
          {selectedNode.type === 'source' ? <div className="inspector-media"><img src={selectedNode.assetId ? assetUrls[selectedNode.assetId] : ''} alt={selectedNode.title} /><p>{t('Connect this source to a prompt node to use image editing.')}</p></div> : null}
          {selectedNode.type === 'result' ? <div className="inspector-media"><img src={selectedNode.assetId ? assetUrls[selectedNode.assetId] : selectedNode.remoteUrl} alt={selectedNode.title} />{selectedNode.revisedPrompt ? <p>{selectedNode.revisedPrompt}</p> : null}<a className="text-link" href={localizedUserPath(locale, `/console/usage-logs?model=${encodeURIComponent(project.settings.model)}`)}>{t('Open usage logs')}</a></div> : null}
        </> : <div className="data-state">{t('Select a node to inspect it')}</div>}

        <section className="inspector-section generation-settings">
          <div className="inspector-section-heading"><Sparkles size={16} /><strong>{t('Generation')}</strong></div>
          <label><span>{t('Group')}</span><select value={project.settings.group} onChange={(event) => updateSettings('group', event.target.value)}>{groups.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>{t('Model')}</span><select value={project.settings.model} onChange={(event) => updateSettings('model', event.target.value)}><option value="">{t('Choose an image model')}</option>{models.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="two-fields"><label><span>{t('Size')}</span><select value={project.settings.size} onChange={(event) => updateSettings('size', event.target.value)}>{capabilities.sizes.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>{t('Count')}</span><select value={project.settings.count} onChange={(event) => updateSettings('count', Number(event.target.value))}>{Array.from({ length: capabilities.maxCount }, (_, index) => index + 1).map((item) => <option key={item}>{item}</option>)}</select></label></div>
          <div className="two-fields"><label><span>{t('Quality')}</span><select value={project.settings.quality} onChange={(event) => updateSettings('quality', event.target.value)}>{capabilities.qualities.map((item) => <option key={item}>{t(item)}</option>)}</select></label><label><span>{t('Background')}</span><select value={project.settings.background} onChange={(event) => updateSettings('background', event.target.value)}>{capabilities.backgrounds.map((item) => <option key={item}>{t(item)}</option>)}</select></label></div>
        </section>

        <section className="inspector-section credential-section">
          <div className="inspector-section-heading"><KeyRound size={16} /><strong>{t('Session API key')}</strong><span className={credentialReady ? 'status-badge healthy' : 'status-badge'}>{credentialReady ? t('Unlocked') : t('Locked')}</span></div>
          <label><span>{t('Existing key')}</span><select value={project.settings.tokenId || ''} onChange={(event) => { clearStudioCredential(); setCredentialVersion((value) => value + 1); updateSettings('tokenId', Number(event.target.value) || undefined) }}><option value="">{t('Choose a key')}</option>{tokens.map((token) => <option key={token.id} value={token.id}>{token.name} · {token.group || 'default'}</option>)}</select></label>
          <div className="credential-actions">{credentialReady ? <button className="button secondary-button" onClick={lockKey}><LockKeyhole size={15} />{t('Lock key')}</button> : <button className="button secondary-button" disabled={credentialBusy || !project.settings.tokenId} onClick={() => void unlockKey()}><KeyRound size={15} />{credentialBusy ? t('Loading') : t('Unlock for session')}</button>}</div>
          <div className="dedicated-key-row"><label><span>{t('Key budget in USD')}</span><input type="number" min="0.01" step="0.01" value={budget} onChange={(event) => setBudget(Number(event.target.value))} /></label><button className="button secondary-button" disabled={credentialBusy || !project.settings.model} onClick={() => void createDedicatedKey()}><Plus size={15} />{t('Create dedicated key')}</button></div>
          <p className="field-help">{t('The full key stays in memory only and is cleared when you leave the studio or sign out.')}</p>
        </section>

        {error ? <div className="form-error" role="alert">{error}</div> : null}
        {notice ? <div className="form-success" role="status">{notice}</div> : null}
        <div className="studio-generate-actions">
          {busy ? <button className="button secondary-button" onClick={() => abortRef.current?.abort()}><X size={16} />{t('Cancel generation')}</button> : <button className="button primary-button" disabled={!selectedPrompt?.content.trim() || !project.settings.model || !credentialReady} onClick={() => void generate()}><Sparkles size={16} />{t(selectedPrompt?.status === 'error' ? 'Retry generation' : 'Generate images')}</button>}
        </div>

        {project.history.length ? <section className="inspector-section generation-history"><div className="inspector-section-heading"><FolderOpen size={16} /><strong>{t('Local result history')}</strong></div>{project.history.slice(0, 5).map((item) => <button key={item.id} onClick={() => { const node = item.nodeIds[0]; if (node) setSelectedId(node) }}><span className={`status-dot ${item.status === 'completed' ? 'healthy' : 'pending'}`} /><span><strong>{item.model}</strong><small>{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(item.createdAt)}</small></span><code>{item.nodeIds.length}</code></button>)}</section> : null}
      </aside>
    </div>
  )
}
