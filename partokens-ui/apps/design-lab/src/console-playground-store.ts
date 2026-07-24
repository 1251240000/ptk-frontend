import Dexie, { type EntityTable } from 'dexie'

export type PrototypeChatParameters = {
  stream: boolean
  temperature: number
  topP: number
  maxTokens: number
  frequencyPenalty: number
  presencePenalty: number
  seed: number | null
}

export type PrototypeChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  copyKey?: string
  reasoningKey?: string
  status: 'complete' | 'streaming' | 'stopped' | 'error'
  createdAt: number
}

export type PrototypeConversation = {
  id: string
  ownerNamespace: string
  title: string
  titleKey?: string
  createdAt: number
  updatedAt: number
  model: string
  group: string
  parameters: PrototypeChatParameters
  messages: PrototypeChatMessage[]
  schemaVersion: 1
}

type PrototypeMetadata = {
  key: string
  value: boolean
}

export const prototypeOwnerNamespace = 'prototype:mika'

export const defaultPrototypeParameters: PrototypeChatParameters = {
  stream: true,
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
  frequencyPenalty: 0,
  presencePenalty: 0,
  seed: null,
}

class PlaygroundPrototypeDatabase extends Dexie {
  conversations!: EntityTable<PrototypeConversation, 'id'>
  metadata!: EntityTable<PrototypeMetadata, 'key'>

  constructor() {
    super('partokens-design-lab-r35')
    this.version(1).stores({
      conversations: 'id, ownerNamespace, updatedAt, [ownerNamespace+updatedAt]',
    })
    this.version(2).stores({
      conversations: 'id, ownerNamespace, updatedAt, [ownerNamespace+updatedAt]',
      metadata: 'key',
    })
  }
}

export const playgroundPrototypeDatabase = new PlaygroundPrototypeDatabase()

function seedConversations(): PrototypeConversation[] {
  const now = Date.now()
  return [
    {
      id: 'prototype-chat-launch',
      ownerNamespace: prototypeOwnerNamespace,
      title: 'API launch checklist',
      titleKey: 'API launch checklist',
      createdAt: now - 46 * 60_000,
      updatedAt: now - 8 * 60_000,
      model: 'gpt-4.1-mini',
      group: 'default',
      parameters: { ...defaultPrototypeParameters },
      schemaVersion: 1,
      messages: [
        { id: 'prototype-message-1', role: 'user', content: '', copyKey: 'Draft a pre-launch checklist for an AI API product.', status: 'complete', createdAt: now - 10 * 60_000 },
        { id: 'prototype-message-2', role: 'assistant', content: '', copyKey: 'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.', reasoningKey: 'I grouped the checks by the decision they unlock instead of by engineering team.', status: 'complete', createdAt: now - 8 * 60_000 },
      ],
    },
    {
      id: 'prototype-chat-cost',
      ownerNamespace: prototypeOwnerNamespace,
      title: 'Model cost comparison',
      titleKey: 'Model cost comparison',
      createdAt: now - 22 * 60 * 60_000,
      updatedAt: now - 21 * 60 * 60_000,
      model: 'claude-3.7-sonnet',
      group: 'default',
      parameters: { ...defaultPrototypeParameters, temperature: 0.4 },
      schemaVersion: 1,
      messages: [],
    },
    {
      id: 'prototype-chat-release',
      ownerNamespace: prototypeOwnerNamespace,
      title: 'French release notes',
      titleKey: 'French release notes',
      createdAt: now - 4 * 24 * 60 * 60_000,
      updatedAt: now - 4 * 24 * 60 * 60_000,
      model: 'gemini-2.5-flash',
      group: 'trial',
      parameters: { ...defaultPrototypeParameters, temperature: 0.2 },
      schemaVersion: 1,
      messages: [],
    },
  ]
}

export async function loadPrototypeConversations() {
  const existing = await playgroundPrototypeDatabase.conversations.where('ownerNamespace').equals(prototypeOwnerNamespace).toArray()
  if (existing.length) {
    await playgroundPrototypeDatabase.metadata.put({ key: 'initialized', value: true })
    const interrupted = existing.map((conversation) => {
      if (!conversation.messages.some((message) => message.status === 'streaming')) return conversation
      return {
        ...conversation,
        messages: conversation.messages.map((message) => message.status === 'streaming' ? { ...message, status: 'stopped' as const } : message),
      }
    })
    const recovered = interrupted.filter((conversation, index) => conversation !== existing[index])
    if (recovered.length) await playgroundPrototypeDatabase.conversations.bulkPut(recovered)
    return interrupted.sort((a, b) => b.updatedAt - a.updatedAt)
  }
  const initialized = await playgroundPrototypeDatabase.metadata.get('initialized')
  if (initialized?.value) return []
  const seeded = seedConversations()
  await playgroundPrototypeDatabase.transaction('rw', playgroundPrototypeDatabase.conversations, playgroundPrototypeDatabase.metadata, async () => {
    await playgroundPrototypeDatabase.conversations.bulkPut(seeded)
    await playgroundPrototypeDatabase.metadata.put({ key: 'initialized', value: true })
  })
  return seeded
}

export async function savePrototypeConversation(conversation: PrototypeConversation) {
  await playgroundPrototypeDatabase.conversations.put(conversation)
}

export async function deletePrototypeConversation(id: string) {
  await playgroundPrototypeDatabase.conversations.delete(id)
}

export async function clearPrototypeConversations() {
  const keys = await playgroundPrototypeDatabase.conversations.where('ownerNamespace').equals(prototypeOwnerNamespace).primaryKeys()
  await playgroundPrototypeDatabase.conversations.bulkDelete(keys)
}

export async function importPrototypeConversations(conversations: PrototypeConversation[]) {
  await playgroundPrototypeDatabase.conversations.bulkPut(conversations.map((conversation) => ({
    ...conversation,
    id: crypto.randomUUID(),
    ownerNamespace: prototypeOwnerNamespace,
    updatedAt: Date.now(),
    schemaVersion: 1 as const,
    parameters: { ...defaultPrototypeParameters, ...conversation.parameters },
    messages: conversation.messages.map((message) => ({ ...message, id: crypto.randomUUID(), status: message.status === 'streaming' ? 'stopped' : message.status })),
  })))
}

export function prototypeConversationBytes(conversations: PrototypeConversation[]) {
  return new TextEncoder().encode(JSON.stringify(conversations)).byteLength
}
