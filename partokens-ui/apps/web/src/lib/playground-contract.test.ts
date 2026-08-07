import { describe, expect, it, vi } from 'vitest'

import {
  consumePlaygroundSseBuffer,
  parsePlaygroundSseEvent,
} from '@partokens/api-client'

import { defaultPlaygroundParameters, type LocalConversation } from '@/db'
import {
  buildPlaygroundCompletionInput,
  createPlaygroundExport,
  normalizeStoredConversation,
  parsePlaygroundImport,
  resolvePlaygroundTitle,
} from './playground'

describe('Playground contracts', () => {
  it('parses fragmented SSE events and completion markers', () => {
    const first = consumePlaygroundSseBuffer('data: {"choices":[{"delta":{"content":"Hel')
    expect(first.events).toEqual([])
    const second = consumePlaygroundSseBuffer(`${first.remainder}lo"}}]}\r\n\r\ndata: [DONE]\n\n`)
    expect(second.events).toHaveLength(2)
    expect(parsePlaygroundSseEvent(second.events[0]!)).toEqual({
      done: false,
      updates: [{ type: 'content', chunk: 'Hello' }],
    })
    expect(parsePlaygroundSseEvent(second.events[1]!)).toEqual({ done: true, updates: [] })
  })

  it('normalizes interrupted local messages after reload', () => {
    const conversation = {
      id: 'chat-1', ownerNamespace: 'user:1', title: 'Chat', createdAt: 1, updatedAt: 2,
      model: 'gpt-test', group: 'default', schemaVersion: 1,
      messages: [{ id: 'message-1', role: 'assistant', content: 'Partial', status: 'streaming', createdAt: 2 }],
    } as LocalConversation
    const normalized = normalizeStoredConversation(conversation)
    expect(normalized.schemaVersion).toBe(2)
    expect(normalized.parameters).toEqual(defaultPlaygroundParameters)
    expect(normalized.messages[0]?.status).toBe('stopped')
  })

  it('exports no account namespace and imports with fresh local identifiers', () => {
    vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValueOnce('new-chat').mockReturnValueOnce('new-message') })
    const source: LocalConversation = {
      id: 'old-chat', ownerNamespace: 'user:17', title: 'Portable', createdAt: 1, updatedAt: 2,
      model: 'gpt-test', group: 'default', parameters: defaultPlaygroundParameters, schemaVersion: 2,
      messages: [{ id: 'old-message', role: 'user', content: 'Hello', createdAt: 2 }],
    }
    const exported = createPlaygroundExport([source])
    expect(JSON.stringify(exported)).not.toContain('user:17')
    expect(JSON.stringify(exported)).not.toContain('old-message')
    const imported = parsePlaygroundImport(exported, 'user:42')
    expect(imported[0]).toMatchObject({ id: 'new-chat', ownerNamespace: 'user:42', title: 'Portable' })
    expect(imported[0]?.messages[0]).toMatchObject({ id: 'new-message', content: 'Hello' })
    vi.unstubAllGlobals()
  })

  it('only derives the first-message title while the conversation is still unnamed', () => {
    expect(resolvePlaygroundTitle('New conversation', 'New conversation', '  First prompt  ', false)).toBe('First prompt')
    expect(resolvePlaygroundTitle('My saved title', 'New conversation', 'First prompt', false)).toBe('My saved title')
    expect(resolvePlaygroundTitle('Existing chat', 'New conversation', 'Later prompt', true)).toBe('Existing chat')
  })

  it('omits an unset seed while preserving explicit zero-valued parameters', () => {
    const conversation: Pick<LocalConversation, 'model' | 'group' | 'parameters'> = {
      model: 'gpt-test',
      group: 'default',
      parameters: {
        ...defaultPlaygroundParameters,
        temperature: 0,
        topP: 0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        seed: null,
      },
    }
    const message = { id: 'message-1', role: 'user' as const, content: 'Hello', createdAt: 1 }

    const withoutSeed = buildPlaygroundCompletionInput(conversation, [message])
    expect(withoutSeed).toMatchObject({ temperature: 0, top_p: 0, frequency_penalty: 0, presence_penalty: 0 })
    expect(withoutSeed).not.toHaveProperty('seed')

    conversation.parameters.seed = 0
    expect(buildPlaygroundCompletionInput(conversation, [message])).toHaveProperty('seed', 0)
  })
})
