import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  getPricingCatalog,
  getTokens,
  getUserModels,
  revealToken,
  type TokenSummary,
} from '@partokens/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@partokens/design-system/components'
import { isAppLocale } from '@partokens/i18n'
import {
  clearStudioCredential,
  createStudioProject,
  generateStudioImages,
  getStudioCredential,
  setStudioCredential,
  studioModelCapabilities,
  type StudioAsset,
  type StudioNode,
  type StudioProject,
} from '@partokens/studio'

import {
  StudioEmpty,
  StudioError,
  StudioLoading,
  StudioReferenceImage,
  StudioResultGrid,
  studioSizeLabel,
  type StudioGenerationSnapshot,
  type StudioResultView,
} from '@/features/studio/studio-ui'
import { database, ownerNamespace } from '@/db'
import { extractItems } from '@/lib/format'
import { canonicalConsoleRoute } from '@/lib/routes'
import { useSessionStore } from '@/stores/session'

type StudioStatus = 'idle' | 'loading' | 'success' | 'error'

const supportedReferenceTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])

function modelItems(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
  return extractItems<string>(value).filter((item) => typeof item === 'string' && Boolean(item.trim()))
}

function tokenModels(token: TokenSummary): string[] {
  const value = token.model_limits || token.models || ''
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function tokenCanUseModel(token: TokenSummary, model: string): boolean {
  if (token.status !== 1) return false
  if (token.expired_time && token.expired_time !== -1 && token.expired_time * 1000 <= Date.now()) return false
  if (!token.unlimited_quota && token.remain_quota !== undefined && token.remain_quota <= 0) return false
  const limits = tokenModels(token)
  return !token.model_limits_enabled || !limits.length || limits.includes(model)
}

function promptNode(project: StudioProject): StudioNode | undefined {
  return project.nodes.find((node) => node.type === 'prompt')
}

function currentResultNodes(project: StudioProject): StudioNode[] {
  const latest = project.history.find((record) => record.status === 'completed' && record.nodeIds.length)
  const ids = new Set(latest?.nodeIds || project.nodes.filter((node) => node.type === 'result').map((node) => node.id))
  return project.nodes.filter((node) => node.type === 'result' && ids.has(node.id))
}

function selectedSourceNode(project: StudioProject): StudioNode | undefined {
  const prompt = promptNode(project)
  if (!prompt) return project.nodes.find((node) => node.type === 'source' && node.assetId)
  const sourceIds = new Set(project.connections.filter((connection) => connection.toNodeId === prompt.id).map((connection) => connection.fromNodeId))
  return project.nodes.find((node) => node.type === 'source' && node.assetId && sourceIds.has(node.id))
    || project.nodes.find((node) => node.type === 'source' && node.assetId)
}

function normalizeInterruptedProject(project: StudioProject): StudioProject {
  const interrupted = project.nodes.some((node) => node.status === 'generating')
  if (!interrupted) return project
  return {
    ...project,
    nodes: project.nodes.map((node) => node.status === 'generating' ? { ...node, status: 'idle', error: undefined } : node),
    updatedAt: Date.now(),
  }
}

async function validateReferenceImage(file: File): Promise<void> {
  if (!supportedReferenceTypes.has(file.type) || file.size <= 0) throw new Error('Unsupported reference image')
  const url = URL.createObjectURL(file)
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new window.Image()
      image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error('Unreadable image'))
      image.onerror = () => reject(new Error('Unreadable image'))
      image.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function StudioPage() {
  const { t } = useTranslation()
  const translate = useCallback((key: string, values?: Record<string, string | number>) => t(key, values), [t])
  const params = useParams({ strict: false }) as { locale?: string; projectId?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const user = useSessionStore((state) => state.user)
  const revision = useSessionStore((state) => state.revision)
  const [project, setProjectState] = useState<StudioProject | null>(null)
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('')
  const [quality, setQuality] = useState('standard')
  const [size, setSize] = useState('1024x1024')
  const [count, setCount] = useState(1)
  const [status, setStatus] = useState<StudioStatus>('loading')
  const [results, setResults] = useState<StudioResultView[]>([])
  const [resultSettings, setResultSettings] = useState<StudioGenerationSnapshot | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')
  const [failureScope, setFailureScope] = useState<'local' | 'generation'>('local')
  const [referenceBlob, setReferenceBlob] = useState<Blob | null>(null)
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [selectedTokenId, setSelectedTokenId] = useState('')
  const [credentialBusy, setCredentialBusy] = useState(false)
  const [credentialError, setCredentialError] = useState('')
  const [credentialRevision, setCredentialRevision] = useState(0)
  const projectRef = useRef<StudioProject | null>(null)
  const referenceInputRef = useRef<HTMLInputElement>(null)
  const referenceUrlRef = useRef<string | null>(null)
  const resultUrlsRef = useRef<string[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const hydratedRef = useRef(false)
  const loadRequestRef = useRef(0)

  const group = project?.settings.group || user?.group || 'default'
  const modelsQuery = useQuery({
    queryKey: ['user-models', group],
    queryFn: ({ signal }) => getUserModels(group, signal),
    enabled: Boolean(user),
    retry: false,
  })
  const pricingQuery = useQuery({
    queryKey: ['pricing'],
    queryFn: ({ signal }) => getPricingCatalog(signal),
    enabled: Boolean(user),
    retry: false,
  })
  const tokensQuery = useQuery({
    queryKey: ['studio-tokens'],
    queryFn: ({ signal }) => getTokens({ p: 1, size: 100 }, signal),
    enabled: Boolean(user),
    retry: false,
  })

  const models = useMemo(() => {
    const available = modelItems(modelsQuery.data?.data)
    const imageHints = new Set((pricingQuery.data?.data || [])
      .filter((item) => item.supported_endpoint_types?.some((type) => type.toLowerCase().includes('image')))
      .map((item) => item.model_name))
    return [...available].sort((left, right) => Number(imageHints.has(right)) - Number(imageHints.has(left)) || left.localeCompare(right))
  }, [modelsQuery.data, pricingQuery.data])
  const activeTokens = useMemo(
    () => extractItems<TokenSummary>(tokensQuery.data?.data).filter((token) => tokenCanUseModel(token, model)),
    [model, tokensQuery.data],
  )
  const selectedToken = activeTokens.find((token) => String(token.id) === selectedTokenId)
  const capabilities = useMemo(() => studioModelCapabilities(model), [model])
  const activeCredential = getStudioCredential()
  const credentialReady = Boolean(activeCredential && tokenCanUseModel(
    extractItems<TokenSummary>(tokensQuery.data?.data).find((token) => token.id === activeCredential.tokenId)
      || { id: activeCredential.tokenId, name: activeCredential.tokenName, status: 1, unlimited_quota: true },
    model,
  ))

  const revokeReferenceUrl = useCallback(() => {
    if (!referenceUrlRef.current) return
    URL.revokeObjectURL(referenceUrlRef.current)
    referenceUrlRef.current = null
  }, [])

  const revokeResultUrls = useCallback(() => {
    resultUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    resultUrlsRef.current = []
  }, [])

  const setLocalReference = useCallback((blob: Blob | null) => {
    revokeReferenceUrl()
    const url = blob ? URL.createObjectURL(blob) : null
    referenceUrlRef.current = url
    setReferenceBlob(blob)
    setReferenceUrl(url)
  }, [revokeReferenceUrl])

  const loadProject = useCallback(async () => {
    const requestId = ++loadRequestRef.current
    if (!user) return
    hydratedRef.current = false
    setStatus('loading')
    setError('')
    setFailureScope('local')
    const namespace = ownerNamespace(user.id)
    try {
      const next = await database.transaction('rw', database.studioProjects, async () => {
        let stored = params.projectId ? await database.studioProjects.get(params.projectId) : undefined
        if (stored?.ownerNamespace !== namespace) stored = undefined
        if (!stored) {
          const projects = await database.studioProjects.where('ownerNamespace').equals(namespace).reverse().sortBy('updatedAt')
          stored = projects[0]
        }
        if (!stored) {
          stored = createStudioProject(namespace, t('Image studio'), t('Image prompt'))
          await database.studioProjects.add(stored)
        }
        const normalized = normalizeInterruptedProject(stored)
        await database.studioProjects.put(normalized)
        return normalized
      })
      if (requestId !== loadRequestRef.current) return

      const assets = await database.studioAssets.where('projectId').equals(next.id).toArray()
      if (requestId !== loadRequestRef.current) return
      const ownedAssets = new Map(assets.filter((asset) => asset.ownerNamespace === namespace).map((asset) => [asset.id, asset]))
      const source = selectedSourceNode(next)
      const sourceAsset = source?.assetId ? ownedAssets.get(source.assetId) : undefined
      const nextPrompt = promptNode(next)?.content || ''
      const nodes = currentResultNodes(next)

      revokeResultUrls()
      const restoredResults = nodes.flatMap((node) => {
        const asset = node.assetId ? ownedAssets.get(node.assetId) : undefined
        if (!asset) return []
        const sourceUrl = URL.createObjectURL(asset.blob)
        resultUrlsRef.current.push(sourceUrl)
        return [{ id: node.id, source: sourceUrl, revisedPrompt: node.revisedPrompt, retained: true }]
      })
      setLocalReference(sourceAsset?.blob || null)
      projectRef.current = next
      setProjectState(next)
      setPrompt(nextPrompt)
      setModel(next.settings.model)
      setQuality(next.settings.quality)
      setSize(next.settings.size)
      setCount(next.settings.count)
      setResults(restoredResults)
      setResultSettings(restoredResults.length ? {
        prompt: nextPrompt,
        model: next.settings.model,
        quality: next.settings.quality,
        size: next.settings.size,
        count: restoredResults.length,
      } : null)
      setStatus(restoredResults.length ? 'success' : 'idle')
      setCancelled(false)
      hydratedRef.current = true
    } catch {
      if (requestId !== loadRequestRef.current) return
      setStatus('error')
      setError(t('Local image results could not be loaded.'))
    }
  }, [params.projectId, revokeResultUrls, setLocalReference, t, user])

  useEffect(() => { void loadProject() }, [loadProject])

  useEffect(() => () => {
    loadRequestRef.current += 1
    abortRef.current?.abort()
    clearStudioCredential()
    revokeReferenceUrl()
    revokeResultUrls()
  }, [revokeReferenceUrl, revokeResultUrls])

  useEffect(() => {
    clearStudioCredential()
    setCredentialRevision((value) => value + 1)
  }, [revision])

  useEffect(() => {
    if (!modelsQuery.isSuccess || !models.length) return
    if (!model || !models.includes(model)) setModel(models[0]!)
  }, [model, models, modelsQuery.isSuccess])

  useEffect(() => {
    const nextSize = capabilities.sizes.includes(size) ? size : capabilities.sizes[0]!
    const nextQuality = capabilities.qualities.includes(quality) ? quality : capabilities.qualities[0]!
    const nextCount = Math.max(1, Math.min(count, capabilities.maxCount))
    if (nextSize !== size) setSize(nextSize)
    if (nextQuality !== quality) setQuality(nextQuality)
    if (nextCount !== count) setCount(nextCount)
  }, [capabilities, count, quality, size])

  useEffect(() => {
    const current = projectRef.current
    if (!current || !hydratedRef.current) return
    const promptId = promptNode(current)?.id
    const next: StudioProject = {
      ...current,
      nodes: current.nodes.map((node) => node.id === promptId ? { ...node, content: prompt } : node),
      settings: { ...current.settings, model, quality, size, count },
      updatedAt: Date.now(),
    }
    projectRef.current = next
    setProjectState(next)
    const timer = window.setTimeout(() => {
      const latest = projectRef.current
      if (latest) void database.studioProjects.put(latest)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [count, model, prompt, quality, size])

  useEffect(() => {
    if (!unlockOpen || !activeTokens.length) return
    const persisted = projectRef.current?.settings.tokenId
    const preferred = activeTokens.find((token) => token.id === persisted) || activeTokens[0]
    if (!activeTokens.some((token) => String(token.id) === selectedTokenId)) setSelectedTokenId(String(preferred!.id))
  }, [activeTokens, selectedTokenId, unlockOpen])

  const pickReference = () => {
    if (referenceInputRef.current) referenceInputRef.current.value = ''
    referenceInputRef.current?.click()
  }

  const changeReference = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user || !projectRef.current) return
    const replacing = Boolean(referenceBlob)
    try {
      await validateReferenceImage(file)
      const current = projectRef.current
      const currentSourceNodes = current.nodes.filter((node) => node.type === 'source')
      const currentAssetIds = currentSourceNodes.flatMap((node) => node.assetId ? [node.assetId] : [])
      const prompt = promptNode(current)
      const asset: StudioAsset = {
        id: crypto.randomUUID(),
        ownerNamespace: ownerNamespace(user.id),
        projectId: current.id,
        mimeType: file.type,
        bytes: file.size,
        blob: file,
        createdAt: Date.now(),
      }
      const sourceNode: StudioNode = {
        id: crypto.randomUUID(),
        type: 'source',
        title: file.name,
        x: 0,
        y: 0,
        width: 240,
        height: 210,
        content: '',
        assetId: asset.id,
        status: 'ready',
        createdAt: Date.now(),
      }
      const sourceIds = new Set(currentSourceNodes.map((node) => node.id))
      const next: StudioProject = {
        ...current,
        nodes: [...current.nodes.filter((node) => !sourceIds.has(node.id)), sourceNode],
        connections: [
          ...current.connections.filter((connection) => !sourceIds.has(connection.fromNodeId) && !sourceIds.has(connection.toNodeId)),
          ...(prompt ? [{ id: crypto.randomUUID(), fromNodeId: sourceNode.id, toNodeId: prompt.id }] : []),
        ],
        updatedAt: Date.now(),
      }
      await database.transaction('rw', database.studioProjects, database.studioAssets, async () => {
        if (currentAssetIds.length) await database.studioAssets.bulkDelete(currentAssetIds)
        await database.studioAssets.add(asset)
        await database.studioProjects.put(next)
      })
      projectRef.current = next
      setProjectState(next)
      setLocalReference(file)
      toast.success(t(replacing ? 'Reference image replaced' : 'Reference image added'))
    } catch {
      toast.error(t('Unsupported or unreadable reference image'), { description: t('Choose a PNG, JPG, or WebP image.') })
    }
  }

  const removeReference = async () => {
    const current = projectRef.current
    if (!current) return
    const sourceNodes = current.nodes.filter((node) => node.type === 'source')
    const sourceIds = new Set(sourceNodes.map((node) => node.id))
    const assetIds = sourceNodes.flatMap((node) => node.assetId ? [node.assetId] : [])
    const next: StudioProject = {
      ...current,
      nodes: current.nodes.filter((node) => !sourceIds.has(node.id)),
      connections: current.connections.filter((connection) => !sourceIds.has(connection.fromNodeId) && !sourceIds.has(connection.toNodeId)),
      updatedAt: Date.now(),
    }
    await database.transaction('rw', database.studioProjects, database.studioAssets, async () => {
      if (assetIds.length) await database.studioAssets.bulkDelete(assetIds)
      await database.studioProjects.put(next)
    })
    projectRef.current = next
    setProjectState(next)
    setLocalReference(null)
    toast.success(t('Reference image removed'))
  }

  const runGeneration = async () => {
    const current = projectRef.current
    const cleanPrompt = prompt.trim()
    if (!current || !cleanPrompt || !model || status === 'loading') return
    const settings: StudioGenerationSnapshot = { prompt: cleanPrompt, model, quality, size, count }
    const controller = new AbortController()
    abortRef.current = controller
    revokeResultUrls()
    setResults([])
    setResultSettings(settings)
    setCancelled(false)
    setError('')
    setFailureScope('generation')
    setStatus('loading')
    try {
      const generated = await generateStudioImages({
        model,
        prompt: cleanPrompt,
        quality,
        size,
        background: current.settings.background,
        count,
        sourceImages: referenceBlob ? [referenceBlob] : undefined,
      }, controller.signal)
      const now = Date.now()
      const views: StudioResultView[] = []
      const assets: StudioAsset[] = []
      const nodes: StudioNode[] = []
      for (const [index, item] of generated.entries()) {
        const nodeId = crypto.randomUUID()
        if (item.blob) {
          const assetId = crypto.randomUUID()
          const source = URL.createObjectURL(item.blob)
          resultUrlsRef.current.push(source)
          assets.push({
            id: assetId,
            ownerNamespace: current.ownerNamespace,
            projectId: current.id,
            mimeType: item.blob.type || 'image/png',
            bytes: item.blob.size,
            blob: item.blob,
            createdAt: now,
          })
          nodes.push({
            id: nodeId,
            type: 'result',
            title: t('Variation {{number}}', { number: index + 1 }),
            x: 0,
            y: 0,
            width: 260,
            height: 225,
            content: cleanPrompt,
            assetId,
            revisedPrompt: item.revisedPrompt,
            status: 'ready',
            createdAt: now,
          })
          views.push({ id: nodeId, source, revisedPrompt: item.revisedPrompt, retained: true })
        } else if (item.remoteUrl) {
          views.push({ id: nodeId, source: item.remoteUrl, revisedPrompt: item.revisedPrompt, retained: false })
        }
      }

      const oldResults = current.nodes.filter((node) => node.type === 'result')
      const oldResultIds = new Set(oldResults.map((node) => node.id))
      const oldAssetIds = oldResults.flatMap((node) => node.assetId ? [node.assetId] : [])
      const promptId = promptNode(current)?.id
      const next: StudioProject = {
        ...current,
        nodes: [...current.nodes.filter((node) => node.type !== 'result'), ...nodes],
        connections: [
          ...current.connections.filter((connection) => !oldResultIds.has(connection.fromNodeId) && !oldResultIds.has(connection.toNodeId)),
          ...(promptId ? nodes.map((node) => ({ id: crypto.randomUUID(), fromNodeId: promptId, toNodeId: node.id })) : []),
        ],
        settings: { ...current.settings, model, quality, size, count },
        history: [{ id: crypto.randomUUID(), createdAt: now, prompt: cleanPrompt, model, nodeIds: nodes.map((node) => node.id), status: 'completed' }],
        updatedAt: now,
      }

      let persisted = true
      try {
        await database.transaction('rw', database.studioProjects, database.studioAssets, async () => {
          if (oldAssetIds.length) await database.studioAssets.bulkDelete(oldAssetIds)
          if (assets.length) await database.studioAssets.bulkAdd(assets)
          await database.studioProjects.put(next)
        })
        projectRef.current = next
        setProjectState(next)
      } catch {
        persisted = false
      }

      setResults(views)
      setStatus('success')
      if (!persisted || views.some((item) => !item.retained)) {
        toast.warning(t('Images generated'), { description: t('Some remote results could not be saved and will disappear after reload.') })
      } else {
        toast.success(t('Images generated'), { description: t('The new result set was saved in this browser.') })
      }
    } catch (cause) {
      if (controller.signal.aborted) {
        setCancelled(true)
        setStatus('idle')
        toast.info(t('Generation cancelled'))
      } else {
        const message = cause instanceof Error ? t(cause.message) : t('The image service could not complete this request.')
        setError(message)
        setStatus('error')
        toast.error(t('Image generation failed'), { description: message })
      }
    } finally {
      abortRef.current = null
    }
  }

  const requestGeneration = () => {
    if (!prompt.trim() || !model) return
    if (credentialReady) {
      void runGeneration()
      return
    }
    setCredentialError('')
    setUnlockOpen(true)
  }

  const unlockAndGenerate = async () => {
    if (!selectedToken) return
    setCredentialBusy(true)
    setCredentialError('')
    try {
      const response = await revealToken(selectedToken.id)
      if (!response.success || !response.data?.key) throw new Error(response.message || t('Unable to reveal key'))
      setStudioCredential({ tokenId: selectedToken.id, tokenName: selectedToken.name, key: response.data.key })
      const current = projectRef.current
      if (current) {
        const next = { ...current, settings: { ...current.settings, tokenId: selectedToken.id }, updatedAt: Date.now() }
        projectRef.current = next
        setProjectState(next)
        await database.studioProjects.put(next)
      }
      setCredentialRevision((value) => value + 1)
      setUnlockOpen(false)
      toast.success(t('API key unlocked for this session'))
      await runGeneration()
    } catch (cause) {
      clearStudioCredential()
      setCredentialRevision((value) => value + 1)
      setCredentialError(cause instanceof Error ? cause.message : t('Unable to reveal key'))
    } finally {
      setCredentialBusy(false)
    }
  }

  const cancel = () => abortRef.current?.abort()
  const busy = status === 'loading'
  const loadingLocal = !project && busy
  const tokenRestriction = selectedToken ? tokenModels(selectedToken) : []
  void locale
  void credentialRevision

  return (
    <>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{t('Image studio')}</h1>
        <p className="mt-1 text-muted-foreground">{t('Create a focused set of images from a prompt and an optional reference.')}</p>
      </div>

      <div className="grid min-w-0 overflow-hidden rounded-md border bg-background lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]" data-studio-page>
        <section className="min-w-0 p-4 sm:p-5 lg:border-e" aria-labelledby="generation-settings-title">
          <div className="mb-5">
            <h2 id="generation-settings-title" className="text-sm font-semibold">{t('Generation settings')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('Adjust the inputs for the next result set.')}</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="studio-prompt">{t('Prompt')}</Label>
              <Textarea
                id="studio-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={t('Describe the image you want to create...')}
                className="min-h-28 resize-y"
                maxLength={1200}
                disabled={busy}
              />
              <p className="text-end text-xs text-muted-foreground">{prompt.length}/1200</p>
            </div>

            <div className="space-y-2">
              <Label>{t('Reference image')}</Label>
              <StudioReferenceImage url={referenceUrl} disabled={busy} onPick={pickReference} onRemove={() => void removeReference()} t={translate} />
              <input ref={referenceInputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void changeReference(event)} />
            </div>

            <div className="grid gap-4 min-[380px]:grid-cols-2 lg:grid-cols-1">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="studio-model">{t('Model')}</Label>
                <Select value={model} onValueChange={setModel} disabled={busy || !models.length}>
                  <SelectTrigger id="studio-model" className="w-full"><SelectValue placeholder={modelsQuery.isLoading ? t('Loading models') : t('Models unavailable')} /></SelectTrigger>
                  <SelectContent>{models.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-2">
                <Label htmlFor="studio-quality">{t('Quality')}</Label>
                <Select value={quality} onValueChange={setQuality} disabled={busy}>
                  <SelectTrigger id="studio-quality" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{capabilities.qualities.map((item) => <SelectItem key={item} value={item}>{item === 'auto' ? t('Automatic') : t(item[0]!.toUpperCase() + item.slice(1))}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studio-size">{t('Image size')}</Label>
              <Select value={size} onValueChange={setSize} disabled={busy}>
                <SelectTrigger id="studio-size" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{capabilities.sizes.map((item) => <SelectItem key={item} value={item}>{studioSizeLabel(item, translate)}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t('Number of images')}</legend>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: Math.min(4, capabilities.maxCount) }, (_, index) => index + 1).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={count === value ? 'secondary' : 'outline'}
                    className={count === value ? 'border border-foreground/15' : ''}
                    aria-pressed={count === value}
                    disabled={busy}
                    onClick={() => setCount(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t pt-5">
              <Button type="button" onClick={requestGeneration} disabled={busy || !prompt.trim() || !model}>
                {busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                {busy ? t('Generating...') : t('Generate')}
              </Button>
              <Button type="button" variant="outline" onClick={cancel} disabled={!busy || loadingLocal}>{t('Cancel')}</Button>
            </div>
          </div>
        </section>

        <section className="min-w-0 border-t bg-muted/10 p-4 sm:p-5 lg:border-t-0" aria-labelledby="generation-results-title">
          <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="generation-results-title" className="text-sm font-semibold">{t('Results')}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t('Each generation replaces the current result set. Saved results stay in this browser.')}</p>
            </div>
            {status === 'success' && resultSettings ? <span className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">{t('{{visible}} of {{total}}', { visible: results.length, total: resultSettings.count })}</span> : null}
          </div>

          {status === 'idle' ? <StudioEmpty cancelled={cancelled} t={translate} /> : null}
          {status === 'loading' ? <StudioLoading count={resultSettings?.count || 2} size={resultSettings?.size || size} t={translate} /> : null}
          {status === 'error' ? <StudioError message={error} onRetry={() => failureScope === 'generation' ? void runGeneration() : void loadProject()} t={translate} /> : null}
          {status === 'success' && resultSettings ? <StudioResultGrid results={results} settings={resultSettings} t={translate} /> : null}
        </section>
      </div>

      <Dialog open={unlockOpen} onOpenChange={(open) => { if (!credentialBusy) setUnlockOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('API key required')}</DialogTitle>
            <DialogDescription>{t('Choose an active key to generate images. The full key stays in memory only for this Studio session.')}</DialogDescription>
          </DialogHeader>
          {tokensQuery.isError ? <p className="text-sm text-destructive" role="alert">{t('Unable to load API keys')}</p> : null}
          {tokensQuery.isLoading ? <div className="flex min-h-20 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />{t('Loading')}</div> : null}
          {tokensQuery.isSuccess && activeTokens.length ? <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="studio-token">{t('API key')}</Label>
              <Select value={selectedTokenId} onValueChange={setSelectedTokenId} disabled={credentialBusy}>
                <SelectTrigger id="studio-token" className="w-full"><SelectValue placeholder={t('Choose a key')} /></SelectTrigger>
                <SelectContent>{activeTokens.map((token) => <SelectItem key={token.id} value={String(token.id)}>{token.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedToken ? <p className="text-xs text-muted-foreground">{tokenRestriction.length
              ? t('This key is restricted to {{models}}.', { models: tokenRestriction.join(', ') })
              : t('This key can use the models available to its group.')}</p> : null}
            {referenceBlob ? <p className="text-xs text-muted-foreground">{t('The reference image is sent through Partokens to the selected model provider when you generate.')}</p> : null}
            <p className="text-xs text-muted-foreground">{t('The server does not require password or 2FA confirmation when revealing the selected key.')}</p>
          </div> : null}
          {tokensQuery.isSuccess && !activeTokens.length ? <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t('No compatible active API keys')}</p>
            <Button asChild variant="outline"><Link to={canonicalConsoleRoute('keys')} params={{ locale }}>{t('Open API keys')}</Link></Button>
          </div> : null}
          {credentialError ? <p className="text-sm text-destructive" role="alert">{credentialError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUnlockOpen(false)} disabled={credentialBusy}>{t('Cancel')}</Button>
            <Button type="button" onClick={() => void unlockAndGenerate()} disabled={credentialBusy || !selectedToken}>
              {credentialBusy ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
              {t('Unlock and generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
