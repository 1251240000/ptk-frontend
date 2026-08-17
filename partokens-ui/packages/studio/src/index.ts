export type StudioNodeType = 'prompt' | 'source' | 'result' | 'note'
export type StudioNodeStatus = 'idle' | 'generating' | 'ready' | 'error'

export type StudioNode = {
  id: string
  type: StudioNodeType
  title: string
  x: number
  y: number
  width: number
  height: number
  content: string
  assetId?: string
  remoteUrl?: string
  revisedPrompt?: string
  status: StudioNodeStatus
  error?: string
  createdAt: number
}

export type StudioConnection = {
  id: string
  fromNodeId: string
  toNodeId: string
}

export type StudioViewport = { x: number; y: number; zoom: number }

export type StudioGenerationSettings = {
  model: string
  group: string
  tokenId?: number
  size: string
  quality: string
  background: string
  count: number
}

export type StudioGenerationRecord = {
  id: string
  createdAt: number
  prompt: string
  model: string
  size?: string
  quality?: string
  count?: number
  nodeIds: string[]
  status: 'completed' | 'cancelled' | 'failed'
  error?: string
}

export type StudioProject = {
  id: string
  ownerNamespace: string
  title: string
  createdAt: number
  updatedAt: number
  schemaVersion: 1
  nodes: StudioNode[]
  connections: StudioConnection[]
  viewport: StudioViewport
  settings: StudioGenerationSettings
  history: StudioGenerationRecord[]
}

export type StudioAsset = {
  id: string
  ownerNamespace: string
  projectId: string
  mimeType: string
  bytes: number
  blob: Blob
  createdAt: number
}

export type StudioModelCapabilities = {
  sizes: string[]
  qualities: string[]
  backgrounds: string[]
  maxCount: number
  supportsEdit: boolean
  supportsCustomSize: boolean
}

export type StudioImageInput = {
  model: string
  prompt: string
  size: string
  quality: string
  background: string
  count: number
  sourceImages?: Blob[]
}

export type StudioImageResult = {
  blob?: Blob
  remoteUrl?: string
  revisedPrompt?: string
}

export const studioGroup = 'Image'

export const studioCustomImageDimension = {
  min: 480,
  max: 3840,
  step: 16,
  minPixels: 655_360,
  maxPixels: 8_294_400,
  maxAspectRatio: 3,
} as const

export type StudioImageSizeValidationCode =
  | 'invalid-format'
  | 'unsupported-size'
  | 'dimension-range'
  | 'dimension-step'
  | 'pixel-area'
  | 'aspect-ratio'

export type StudioImageSizeValidation = {
  ok: boolean
  code?: StudioImageSizeValidationCode
}

function parseStudioImageSize(value: string): { width: number; height: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(value.trim())
  if (!match) return null
  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height)) return null
  return { width, height }
}

export function validateStudioImageSize(value: string, model = ''): StudioImageSizeValidation {
  if (value === 'auto') return { ok: true }
  const capabilities = model ? studioModelCapabilities(model) : null
  if (capabilities?.sizes.includes(value)) return { ok: true }
  if (capabilities && !capabilities.supportsCustomSize) return { ok: false, code: 'unsupported-size' }

  const dimensions = parseStudioImageSize(value)
  if (!dimensions) return { ok: false, code: 'invalid-format' }
  const { width, height } = dimensions
  const {
    min,
    max,
    step,
    minPixels,
    maxPixels,
    maxAspectRatio,
  } = studioCustomImageDimension

  if (width < min || height < min || width > max || height > max) return { ok: false, code: 'dimension-range' }
  if (width % step !== 0 || height % step !== 0) return { ok: false, code: 'dimension-step' }
  const pixels = width * height
  if (pixels < minPixels || pixels > maxPixels) return { ok: false, code: 'pixel-area' }
  if (Math.max(width, height) / Math.min(width, height) > maxAspectRatio) return { ok: false, code: 'aspect-ratio' }
  return { ok: true }
}

export function isValidStudioImageSize(value: string, model = ''): boolean {
  return validateStudioImageSize(value, model).ok
}

type StudioNodeBounds = Pick<StudioNode, 'x' | 'y' | 'width' | 'height'>

export function findStudioNodePosition(
  nodes: readonly StudioNodeBounds[],
  width: number,
  height: number,
  origin: { x: number; y: number },
  gap = 32,
): { x: number; y: number } {
  const candidates = [origin]
  for (const node of nodes) {
    candidates.push(
      { x: node.x, y: node.y + node.height + gap },
      { x: node.x + node.width + gap, y: node.y },
    )
  }
  candidates.sort((left, right) => {
    const leftDistance = Math.abs(left.y - origin.y) + Math.abs(left.x - origin.x) * 2
    const rightDistance = Math.abs(right.y - origin.y) + Math.abs(right.x - origin.x) * 2
    return leftDistance - rightDistance
  })

  const overlaps = (candidate: { x: number; y: number }, node: StudioNodeBounds) => (
    candidate.x < node.x + node.width + gap
    && candidate.x + width + gap > node.x
    && candidate.y < node.y + node.height + gap
    && candidate.y + height + gap > node.y
  )
  const available = candidates.find((candidate) => !nodes.some((node) => overlaps(candidate, node)))
  if (available) return available

  const bottom = nodes.reduce((maximum, node) => Math.max(maximum, node.y + node.height), origin.y)
  return { x: origin.x, y: bottom + gap }
}

type StudioCredential = { tokenId: number; tokenName: string; key: string }

let activeCredential: StudioCredential | null = null

export function setStudioCredential(credential: StudioCredential): void {
  const key = credential.key.trim()
  if (!key) throw new Error('The API key is empty')
  activeCredential = { ...credential, key }
}

export function getStudioCredential(): Readonly<StudioCredential> | null {
  return activeCredential
}

export function clearStudioCredential(): void {
  activeCredential = null
}

export function createStudioProject(
  ownerNamespace: string,
  title = 'Untitled canvas',
  promptTitle = 'Image prompt',
): StudioProject {
  const now = Date.now()
  const promptId = crypto.randomUUID()
  return {
    id: crypto.randomUUID(),
    ownerNamespace,
    title,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    nodes: [{
      id: promptId,
      type: 'prompt',
      title: promptTitle,
      x: 96,
      y: 96,
      width: 250,
      height: 170,
      content: '',
      status: 'idle',
      createdAt: now,
    }],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    settings: {
      model: '',
      group: studioGroup,
      size: '1024x1024',
      quality: 'standard',
      background: 'auto',
      count: 1,
    },
    history: [],
  }
}

export function studioModelCapabilities(model: string): StudioModelCapabilities {
  const name = model.toLowerCase()
  if (name.includes('dall-e-2')) {
    return {
      sizes: ['256x256', '512x512', '1024x1024'],
      qualities: ['standard'],
      backgrounds: ['auto'],
      maxCount: 10,
      supportsEdit: true,
      supportsCustomSize: false,
    }
  }
  if (name.includes('dall-e-3')) {
    return {
      sizes: ['1024x1024', '1024x1792', '1792x1024'],
      qualities: ['standard', 'hd'],
      backgrounds: ['auto'],
      maxCount: 1,
      supportsEdit: false,
      supportsCustomSize: false,
    }
  }
  if (name.includes('gpt-image')) {
    return {
      sizes: ['auto', '1024x1024', '1536x1024', '1024x1536', '1792x1024', '1024x1792', '2048x1152', '1152x2048'],
      qualities: ['auto', 'low', 'medium', 'high'],
      backgrounds: ['auto', 'opaque', 'transparent'],
      maxCount: 10,
      supportsEdit: true,
      supportsCustomSize: true,
    }
  }
  return {
    sizes: ['auto'],
    qualities: ['auto'],
    backgrounds: ['auto'],
    maxCount: 1,
    supportsEdit: false,
    supportsCustomSize: false,
  }
}

export function studioImageSizeErrorMessage(validation: StudioImageSizeValidation): string {
  if (validation.code === 'unsupported-size') return 'Choose a size supported by the selected model'
  return 'Enter a valid image size that follows the image model limits'
}

function appendOptional(form: FormData, key: string, value: string): void {
  if (value && value !== 'auto') form.append(key, value)
}

function imageErrorMessage(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const input = payload as { error?: { message?: unknown }; message?: unknown }
    if (typeof input.error?.message === 'string') return input.error.message
    if (typeof input.message === 'string') return input.message
  }
  if (status === 401 || status === 403) return 'The selected API key cannot use this model'
  if (status === 429) return 'The request was rate limited or the key quota is insufficient'
  return 'The image service could not complete this request.'
}

function base64Blob(value: string): Blob {
  const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
  return new Blob([bytes], { type: 'image/png' })
}

async function parseImageResponse(response: Response, fetcher: typeof fetch): Promise<StudioImageResult[]> {
  const payload = await response.json() as {
    data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>
    error?: { message?: string }
    message?: string
  }
  if (!response.ok) throw new Error(imageErrorMessage(response.status, payload))
  const items = payload.data || []
  if (!items.length) throw new Error('The image endpoint returned no results')

  return Promise.all(items.map(async (item) => {
    if (item.b64_json) return { blob: base64Blob(item.b64_json), revisedPrompt: item.revised_prompt }
    if (!item.url) throw new Error('The image endpoint returned an invalid result')
    try {
      const image = await fetcher(item.url)
      if (!image.ok) throw new Error(String(image.status))
      return { blob: await image.blob(), revisedPrompt: item.revised_prompt }
    } catch {
      return { remoteUrl: item.url, revisedPrompt: item.revised_prompt }
    }
  }))
}

export async function generateStudioImages(
  input: StudioImageInput,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<StudioImageResult[]> {
  const credential = getStudioCredential()
  if (!credential) throw new Error('Unlock an API key for this studio session')
  if (!input.prompt.trim()) throw new Error('Enter an image prompt')
  if (!input.model) throw new Error('Choose an image model')
  const sizeValidation = validateStudioImageSize(input.size, input.model)
  if (!sizeValidation.ok) throw new Error(studioImageSizeErrorMessage(sizeValidation))

  const capabilities = studioModelCapabilities(input.model)
  const count = Math.max(1, Math.min(Math.trunc(input.count), capabilities.maxCount))
  const headers = { Authorization: `Bearer ${credential.key}` }

  let response: Response
  if (input.sourceImages?.length) {
    if (!capabilities.supportsEdit) throw new Error('The selected model does not support image editing')
    const body = new FormData()
    body.append('model', input.model)
    body.append('prompt', input.prompt.trim())
    body.append('n', String(count))
    appendOptional(body, 'size', input.size)
    appendOptional(body, 'quality', input.quality)
    appendOptional(body, 'background', input.background)
    body.append('response_format', 'b64_json')
    input.sourceImages.forEach((blob, index) => body.append('image', blob, `source-${index + 1}.${blob.type.split('/')[1] || 'png'}`))
    response = await fetcher('/v1/images/edits', { method: 'POST', headers, body, signal })
  } else {
    const body: Record<string, unknown> = {
      model: input.model,
      prompt: input.prompt.trim(),
      n: count,
      response_format: 'b64_json',
    }
    if (input.size !== 'auto') body.size = input.size
    if (input.quality !== 'auto') body.quality = input.quality
    if (input.background !== 'auto') body.background = input.background
    response = await fetcher('/v1/images/generations', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  }
  return parseImageResponse(response, fetcher)
}
