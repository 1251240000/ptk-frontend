import { z } from 'zod'

import type { PlaygroundCompletionInput, PlaygroundRequestError } from '@partokens/api-client'

import {
  defaultPlaygroundParameters,
  type LocalConversation,
  type LocalMessage,
  type PlaygroundParameters,
} from '@/db'

const genericPlaygroundErrors = [
  'the model request failed',
  'model request failed',
  'request failed',
  'network error',
  'empty-response',
  'the streaming response could not be parsed',
  'the streaming response had no body',
  'authentication required',
]
const playgroundSecretPatterns = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /\bsk-[A-Za-z0-9_-]{8,}/gi,
  /\b(pk|rk|sess|fixture-access)-[A-Za-z0-9_-]{8,}/gi,
  /\b(api[-_\s]?key|access[_-\s]?token|refresh[_-\s]?token|authorization|bearer|secret|password)\s*[:=]\s*["']?[^"'\s,;}]+/gi,
  /"(api[-_\s]?key|access[_-\s]?token|refresh[_-\s]?token|authorization|bearer|secret|password)"\s*:\s*"[^"]+"/gi,
]

const parametersSchema = z.object({
  stream: z.boolean().optional(),
  temperature: z.number().finite().min(0).max(2).optional(),
  topP: z.number().finite().min(0).max(1).optional(),
  maxTokens: z.number().int().min(1).max(200_000).optional(),
  frequencyPenalty: z.number().finite().min(-2).max(2).optional(),
  presencePenalty: z.number().finite().min(-2).max(2).optional(),
  seed: z.number().int().min(0).max(2_147_483_647).nullable().optional(),
})

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(2_000_000),
  reasoning: z.string().max(2_000_000).optional(),
  status: z.enum(['streaming', 'complete', 'stopped', 'error']).optional(),
  error: z.string().max(10_000).optional(),
  createdAt: z.number().finite().nonnegative(),
})

const conversationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  createdAt: z.number().finite().nonnegative(),
  updatedAt: z.number().finite().nonnegative(),
  model: z.string().max(300),
  group: z.string().max(200),
  pinned: z.boolean().optional(),
  parameters: parametersSchema.optional(),
  messages: z.array(messageSchema).max(2_000),
})

const exportSchema = z.object({
  format: z.literal('partokens-playground'),
  version: z.literal(1),
  conversations: z.array(conversationSchema).max(500),
})

export type PlaygroundExport = z.infer<typeof exportSchema> & { exportedAt: string }

export function normalizePlaygroundParameters(input?: Partial<PlaygroundParameters>): PlaygroundParameters {
  const parsed = parametersSchema.safeParse(input || {})
  return { ...defaultPlaygroundParameters, ...(parsed.success ? parsed.data : {}) }
}

export function normalizeStoredConversation(conversation: LocalConversation): LocalConversation {
  return {
    ...conversation,
    pinned: Boolean(conversation.pinned),
    parameters: normalizePlaygroundParameters(conversation.parameters),
    schemaVersion: 2,
    messages: conversation.messages.map((message) => ({
      ...message,
      status: message.status === 'streaming' ? 'stopped' : message.status,
    })),
  }
}

export function createPlaygroundExport(conversations: LocalConversation[]): PlaygroundExport {
  return {
    format: 'partokens-playground',
    version: 1,
    exportedAt: new Date().toISOString(),
    conversations: conversations.map((conversation) => ({
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      model: conversation.model,
      group: conversation.group,
      pinned: Boolean(conversation.pinned),
      parameters: normalizePlaygroundParameters(conversation.parameters),
      messages: conversation.messages.map(({ role, content, reasoning, status, error, createdAt }) => ({
        role,
        content,
        reasoning,
        status: status === 'streaming' ? 'stopped' : status,
        error,
        createdAt,
      })),
    })),
  }
}

export function parsePlaygroundImport(input: unknown, ownerNamespace: string): LocalConversation[] {
  const parsed = exportSchema.parse(input)
  return parsed.conversations.map((conversation) => ({
    id: crypto.randomUUID(),
    ownerNamespace,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: Date.now(),
    model: conversation.model,
    group: conversation.group || 'default',
    pinned: Boolean(conversation.pinned),
    parameters: normalizePlaygroundParameters(conversation.parameters),
    schemaVersion: 2,
    messages: conversation.messages.map((message): LocalMessage => ({
      id: crypto.randomUUID(),
      role: message.role,
      content: message.content,
      reasoning: message.reasoning,
      status: message.status === 'streaming' ? 'stopped' : message.status,
      error: message.error,
      createdAt: message.createdAt,
    })),
  }))
}

export function buildPlaygroundCompletionInput(
  conversation: Pick<LocalConversation, 'model' | 'group' | 'parameters'>,
  messages: LocalMessage[],
): PlaygroundCompletionInput {
  const parameters = normalizePlaygroundParameters(conversation.parameters)
  return {
    model: conversation.model,
    group: conversation.group,
    messages: messages.map(({ role, content }) => ({ role, content })),
    temperature: parameters.temperature,
    top_p: parameters.topP,
    max_tokens: parameters.maxTokens,
    frequency_penalty: parameters.frequencyPenalty,
    presence_penalty: parameters.presencePenalty,
    ...(parameters.seed == null ? {} : { seed: parameters.seed }),
  }
}

export function formatLocalBytes(bytes: number, locale: string): string {
  if (bytes < 1_024) return `${new Intl.NumberFormat(locale).format(bytes)} B`
  if (bytes < 1_048_576) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1_024)} KB`
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1_048_576)} MB`
}

export function resolvePlaygroundTitle(
  currentTitle: string,
  newConversationLabel: string,
  firstMessage: string,
  hasMessages: boolean,
): string {
  if (hasMessages || currentTitle !== newConversationLabel) return currentTitle
  return firstMessage.trim().slice(0, 72)
}

export function playgroundRequestCategory(error: unknown): 'session' | 'quota' | 'model' | 'rate' | 'other' {
  const requestError = error as PlaygroundRequestError & {
    response?: { status?: number; data?: { error?: { code?: string } } }
  }
  const status = requestError.status ?? requestError.response?.status
  const code = (requestError.code || requestError.response?.data?.error?.code || '').toLowerCase()
  const message = requestError.message?.toLowerCase() || ''
  if (status === 401) return 'session'
  if (status === 429) return 'rate'
  if (code.includes('quota') || message.includes('quota') || message.includes('余额')) return 'quota'
  if (code.includes('model') || message.includes('model') || message.includes('模型')) return 'model'
  return 'other'
}

function sanitizePlaygroundErrorDetail(value: string): string {
  let detail = value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  for (const pattern of playgroundSecretPatterns) detail = detail.replace(pattern, (match) => {
    const separator = match.match(/\s*[:=]\s*/)
    if (separator?.index != null) return `${match.slice(0, separator.index)}${separator[0]}[redacted]`
    if (match.startsWith('"')) return match.replace(/:\s*"[^"]+"/, ': "[redacted]"')
    return '[redacted]'
  })
  return detail.length > 320 ? `${detail.slice(0, 317).trimEnd()}...` : detail
}

export function playgroundRequestErrorDetail(error: unknown): string | null {
  const requestError = error as PlaygroundRequestError & {
    response?: { data?: { message?: string; error?: { message?: string } } }
  }
  const candidates = [
    requestError.response?.data?.error?.message,
    requestError.response?.data?.message,
    requestError.message,
  ]
  const raw = candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)
  if (!raw) return null
  const detail = sanitizePlaygroundErrorDetail(raw)
  if (!detail) return null
  const normalized = detail.toLowerCase()
  if (genericPlaygroundErrors.some((message) => normalized === message || normalized.startsWith(`${message} with http`))) return null
  return detail
}
