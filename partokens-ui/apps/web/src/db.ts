import Dexie, { type EntityTable } from 'dexie'

import type { StudioAsset, StudioProject } from '@partokens/studio'

export type LocalMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  status?: 'streaming' | 'complete' | 'stopped' | 'error'
  error?: string
  createdAt: number
}

export type PlaygroundParameters = {
  stream: boolean
  temperature: number
  topP: number
  maxTokens: number
  frequencyPenalty: number
  presencePenalty: number
  seed: number | null
}

export const defaultPlaygroundParameters: PlaygroundParameters = {
  stream: true,
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
  frequencyPenalty: 0,
  presencePenalty: 0,
  seed: null,
}

export type LocalConversation = {
  id: string
  ownerNamespace: string
  title: string
  createdAt: number
  updatedAt: number
  model: string
  group: string
  pinned?: boolean
  parameters: PlaygroundParameters
  schemaVersion: number
  messages: LocalMessage[]
}

class PartokensDatabase extends Dexie {
  conversations!: EntityTable<LocalConversation, 'id'>
  studioProjects!: EntityTable<StudioProject, 'id'>
  studioAssets!: EntityTable<StudioAsset, 'id'>

  constructor() {
    super('partokens-local')
    this.version(1).stores({
      conversations: 'id, ownerNamespace, updatedAt, [ownerNamespace+updatedAt]',
    })
    this.version(2).stores({
      conversations: 'id, ownerNamespace, updatedAt, [ownerNamespace+updatedAt]',
      studioProjects: 'id, ownerNamespace, updatedAt, [ownerNamespace+updatedAt]',
      studioAssets: 'id, ownerNamespace, projectId, createdAt, [projectId+createdAt]',
    })
  }
}

export const database = new PartokensDatabase()

export function ownerNamespace(userId: number): string {
  return `user:${userId}`
}

export async function createConversation(userId: number): Promise<LocalConversation> {
  const now = Date.now()
  const conversation: LocalConversation = {
    id: crypto.randomUUID(),
    ownerNamespace: ownerNamespace(userId),
    title: 'New conversation',
    createdAt: now,
    updatedAt: now,
    model: '',
    group: 'default',
    parameters: { ...defaultPlaygroundParameters },
    schemaVersion: 2,
    messages: [],
  }
  await database.conversations.add(conversation)
  return conversation
}
