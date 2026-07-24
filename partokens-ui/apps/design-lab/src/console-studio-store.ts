import Dexie, { type EntityTable } from 'dexie'

export type PrototypeStudioNodeType = 'prompt' | 'source' | 'result' | 'note'
export type PrototypeStudioNodeStatus = 'idle' | 'generating' | 'ready' | 'failed' | 'cancelled'

export type PrototypeStudioNode = {
  id: string
  type: PrototypeStudioNodeType
  title: string
  content: string
  x: number
  y: number
  width: number
  height: number
  status: PrototypeStudioNodeStatus
  assetId?: string
  visual?: 'architecture' | 'garden' | 'uploaded'
  error?: string
  createdAt: number
}

export type PrototypeStudioConnection = {
  id: string
  fromNodeId: string
  toNodeId: string
}

export type PrototypeStudioSettings = {
  model: string
  group: string
  tokenId: number
  tokenName: string
  size: string
  count: number
  quality: string
  background: string
  simulateFailure: boolean
}

export type PrototypeStudioHistory = {
  id: string
  createdAt: number
  prompt: string
  model: string
  status: 'completed' | 'failed' | 'cancelled'
}

export type PrototypeStudioProject = {
  id: string
  ownerNamespace: string
  title: string
  createdAt: number
  updatedAt: number
  schemaVersion: 1
  nodes: PrototypeStudioNode[]
  connections: PrototypeStudioConnection[]
  viewport: { x: number; y: number; zoom: number }
  settings: PrototypeStudioSettings
  history: PrototypeStudioHistory[]
}

export type PrototypeStudioAsset = {
  id: string
  ownerNamespace: string
  projectId: string
  mimeType: string
  bytes: number
  blob: Blob
  createdAt: number
}

type PrototypeStudioMetadata = { key: string; value: boolean }

export const prototypeStudioOwner = 'prototype:mika'

export const defaultStudioSettings: PrototypeStudioSettings = {
  model: 'gpt-image-1',
  group: 'default',
  tokenId: 2,
  tokenName: 'Image studio · P3M8',
  size: '1024x1024',
  count: 1,
  quality: 'high',
  background: 'auto',
  simulateFailure: false,
}

class StudioPrototypeDatabase extends Dexie {
  projects!: EntityTable<PrototypeStudioProject, 'id'>
  assets!: EntityTable<PrototypeStudioAsset, 'id'>
  metadata!: EntityTable<PrototypeStudioMetadata, 'key'>

  constructor() {
    super('partokens-design-lab-r36')
    this.version(1).stores({
      projects: 'id, ownerNamespace, updatedAt, [ownerNamespace+updatedAt]',
      assets: 'id, projectId, ownerNamespace, [projectId+createdAt]',
      metadata: 'key',
    })
  }
}

export const studioPrototypeDatabase = new StudioPrototypeDatabase()

function node(input: Omit<PrototypeStudioNode, 'createdAt' | 'status'> & Partial<Pick<PrototypeStudioNode, 'createdAt' | 'status'>>): PrototypeStudioNode {
  return { status: 'idle', createdAt: Date.now(), ...input }
}

function seedProjects(): PrototypeStudioProject[] {
  const now = Date.now()
  const campaignNodes: PrototypeStudioNode[] = [
    node({ id: 'studio-source-1', type: 'source', title: 'Source image', content: 'Material study · warm concrete', x: 110, y: 410, width: 230, height: 250, visual: 'architecture' }),
    node({ id: 'studio-prompt-1', type: 'prompt', title: 'Image prompt', content: 'A quiet modular pavilion after rain, translucent glass, wet concrete, soft morning light, editorial architecture photography.', x: 410, y: 240, width: 300, height: 238 }),
    node({ id: 'studio-result-1', type: 'result', title: 'Generated image', content: 'gpt-image-1 · 1024 × 1024', x: 820, y: 170, width: 340, height: 390, status: 'ready', visual: 'garden' }),
    node({ id: 'studio-note-1', type: 'note', title: 'Art direction', content: 'Keep the structure centered. Reduce foliage density on the next variation.', x: 820, y: 620, width: 260, height: 170 }),
  ]
  return [
    {
      id: 'studio-project-pavilion', ownerNamespace: prototypeStudioOwner, title: 'Rain pavilion study', createdAt: now - 52 * 60_000, updatedAt: now - 4 * 60_000, schemaVersion: 1,
      nodes: campaignNodes,
      connections: [
        { id: 'studio-link-source-prompt', fromNodeId: 'studio-source-1', toNodeId: 'studio-prompt-1' },
        { id: 'studio-link-prompt-result', fromNodeId: 'studio-prompt-1', toNodeId: 'studio-result-1' },
        { id: 'studio-link-result-note', fromNodeId: 'studio-result-1', toNodeId: 'studio-note-1' },
      ],
      viewport: { x: -18, y: 72, zoom: 0.58 },
      settings: { ...defaultStudioSettings },
      history: [{ id: 'studio-history-1', createdAt: now - 4 * 60_000, prompt: campaignNodes[1]!.content, model: 'gpt-image-1', status: 'completed' }],
    },
    {
      id: 'studio-project-packaging', ownerNamespace: prototypeStudioOwner, title: 'Packaging directions', createdAt: now - 24 * 60 * 60_000, updatedAt: now - 22 * 60 * 60_000, schemaVersion: 1,
      nodes: [
        node({ id: 'studio-prompt-2', type: 'prompt', title: 'Image prompt', content: 'Minimal technical packaging for an AI infrastructure product, crisp typography, cobalt accents.', x: 300, y: 260, width: 300, height: 230 }),
        node({ id: 'studio-note-2', type: 'note', title: 'Constraints', content: 'No gradients. Keep all labels legible at thumbnail size.', x: 700, y: 300, width: 250, height: 160 }),
      ],
      connections: [{ id: 'studio-link-prompt-note', fromNodeId: 'studio-prompt-2', toNodeId: 'studio-note-2' }],
      viewport: { x: 40, y: 40, zoom: 0.86 }, settings: { ...defaultStudioSettings, quality: 'medium' }, history: [],
    },
    {
      id: 'studio-project-portraits', ownerNamespace: prototypeStudioOwner, title: 'Portrait lighting', createdAt: now - 5 * 24 * 60 * 60_000, updatedAt: now - 4 * 24 * 60 * 60_000, schemaVersion: 1,
      nodes: [node({ id: 'studio-prompt-3', type: 'prompt', title: 'Image prompt', content: 'Studio portrait with a single hard side light and quiet neutral backdrop.', x: 360, y: 280, width: 300, height: 220 })],
      connections: [], viewport: { x: 80, y: 40, zoom: 0.9 }, settings: { ...defaultStudioSettings, size: '1024x1536' }, history: [],
    },
  ]
}

export function createPrototypeStudioProject(title: string): PrototypeStudioProject {
  const now = Date.now()
  return {
    id: crypto.randomUUID(), ownerNamespace: prototypeStudioOwner, title, createdAt: now, updatedAt: now, schemaVersion: 1,
    nodes: [node({ id: crypto.randomUUID(), type: 'prompt', title: 'Image prompt', content: '', x: 420, y: 280, width: 300, height: 230 })],
    connections: [], viewport: { x: 0, y: 0, zoom: 0.86 }, settings: { ...defaultStudioSettings }, history: [],
  }
}

export async function loadPrototypeStudioProjects() {
  const existing = await studioPrototypeDatabase.projects.where('ownerNamespace').equals(prototypeStudioOwner).toArray()
  if (existing.length) {
    await studioPrototypeDatabase.metadata.put({ key: 'initialized', value: true })
    const recovered = existing.map((project) => ({
      ...project,
      nodes: project.nodes.map((item) => item.status === 'generating' ? { ...item, status: 'cancelled' as const } : item),
    })).sort((a, b) => b.updatedAt - a.updatedAt)
    await studioPrototypeDatabase.projects.bulkPut(recovered)
    return recovered
  }
  if ((await studioPrototypeDatabase.metadata.get('initialized'))?.value) return []
  const seeded = seedProjects()
  await studioPrototypeDatabase.transaction('rw', studioPrototypeDatabase.projects, studioPrototypeDatabase.metadata, async () => {
    await studioPrototypeDatabase.projects.bulkPut(seeded)
    await studioPrototypeDatabase.metadata.put({ key: 'initialized', value: true })
  })
  return seeded
}

export async function savePrototypeStudioProject(project: PrototypeStudioProject) {
  await studioPrototypeDatabase.projects.put(project)
}

export async function deletePrototypeStudioProject(id: string) {
  await studioPrototypeDatabase.transaction('rw', studioPrototypeDatabase.projects, studioPrototypeDatabase.assets, async () => {
    await studioPrototypeDatabase.projects.delete(id)
    const assetIds = await studioPrototypeDatabase.assets.where('projectId').equals(id).primaryKeys()
    await studioPrototypeDatabase.assets.bulkDelete(assetIds)
  })
}

export async function savePrototypeStudioAsset(asset: PrototypeStudioAsset) {
  await studioPrototypeDatabase.assets.put(asset)
}

export async function loadPrototypeStudioAssets(projectId: string) {
  return studioPrototypeDatabase.assets.where('projectId').equals(projectId).toArray()
}

export async function deletePrototypeStudioAssets(projectId: string) {
  const ids = await studioPrototypeDatabase.assets.where('projectId').equals(projectId).primaryKeys()
  await studioPrototypeDatabase.assets.bulkDelete(ids)
}

export function prototypeStudioBytes(projects: PrototypeStudioProject[], assets: PrototypeStudioAsset[]) {
  return new TextEncoder().encode(JSON.stringify(projects)).byteLength + assets.reduce((total, asset) => total + asset.bytes, 0)
}
