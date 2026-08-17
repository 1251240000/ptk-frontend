import type { QueryClient, QueryKey } from '@tanstack/react-query'

const consoleQueryRoot = ['console'] as const
const overviewQueryRoot = [...consoleQueryRoot, 'overview'] as const
const analyticsQueryRoot = [...consoleQueryRoot, 'analytics'] as const
const apiKeysQueryRoot = [...consoleQueryRoot, 'keys'] as const
const usageLogsQueryRoot = [...consoleQueryRoot, 'usage-logs'] as const

export const consoleQueryKeys = {
  all: consoleQueryRoot,
  overview: {
    all: overviewQueryRoot,
    status: () => [...overviewQueryRoot, 'status'] as const,
    subscriptions: () => [...overviewQueryRoot, 'subscriptions'] as const,
    tokens: () => [...overviewQueryRoot, 'tokens'] as const,
    pricing: () => [...overviewQueryRoot, 'pricing'] as const,
    stats: (range: unknown) => [...overviewQueryRoot, 'stats', range] as const,
    recentUsage: (range: unknown) => [...overviewQueryRoot, 'recent-usage', range] as const,
  },
  analytics: {
    all: analyticsQueryRoot,
    usage: (range: string, granularity: string) => [...analyticsQueryRoot, 'usage', range, granularity] as const,
    flow: (range: string, granularity: string) => [...analyticsQueryRoot, 'flow', range, granularity] as const,
  },
  apiKeys: {
    all: apiKeysQueryRoot,
    list: (keyword: string) => [...apiKeysQueryRoot, 'list', keyword] as const,
    detail: (id: number | undefined) => [...apiKeysQueryRoot, 'detail', id] as const,
    groups: () => [...apiKeysQueryRoot, 'groups'] as const,
    models: (group: string) => [...apiKeysQueryRoot, 'models', group] as const,
  },
  usageLogs: {
    all: usageLogsQueryRoot,
    list: (params: unknown) => [...usageLogsQueryRoot, 'list', params] as const,
    stats: (params: unknown) => [...usageLogsQueryRoot, 'stats', params] as const,
    tokenTotals: (params: unknown) => [...usageLogsQueryRoot, 'token-totals', params] as const,
  },
} as const

export class ConsoleContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConsoleContractError'
  }
}

export class ConsoleRequestError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ConsoleRequestError'
    this.status = status
  }
}

export type ConsoleErrorCategory = 'authentication' | 'authorization' | 'contract' | 'availability'

export function consoleErrorStatus(error: unknown): number | undefined {
  if (error instanceof ConsoleRequestError) return error.status
  const status = (error as { response?: { status?: unknown } } | null)?.response?.status
  return typeof status === 'number' && Number.isInteger(status) ? status : undefined
}

export function asConsoleRequestError(error: unknown, safeMessage: string): ConsoleContractError | ConsoleRequestError {
  if (error instanceof ConsoleContractError || error instanceof ConsoleRequestError) return error
  return new ConsoleRequestError(safeMessage, consoleErrorStatus(error))
}

export function classifyConsoleError(error: unknown): ConsoleErrorCategory {
  if (error instanceof ConsoleContractError) return 'contract'
  const status = consoleErrorStatus(error)
  if (status === 401) return 'authentication'
  if (status === 403) return 'authorization'
  return 'availability'
}

export function consoleErrorMessage(error: unknown, messages: {
  authentication: string
  authorization: string
  availability: string
  contract?: string
}): string {
  const category = classifyConsoleError(error)
  if (category === 'contract') return messages.contract ?? (error as ConsoleContractError).message
  return messages[category]
}

const refreshes = new WeakMap<QueryClient, Map<string, Promise<void>>>()
const invalidations = new WeakMap<QueryClient, Map<string, Promise<void>>>()

function operationMap(store: WeakMap<QueryClient, Map<string, Promise<void>>>, client: QueryClient) {
  const current = store.get(client)
  if (current) return current
  const created = new Map<string, Promise<void>>()
  store.set(client, created)
  return created
}

function serializedKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey)
}

export async function refreshConsoleQueries(client: QueryClient, queryKey: QueryKey): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ConsoleRequestError('Console refresh is unavailable while offline')
  }
  const operations = operationMap(refreshes, client)
  const key = serializedKey(queryKey)
  const active = operations.get(key)
  if (active) return active

  const operation = (async () => {
    await client.cancelQueries({ queryKey, type: 'active' }, { silent: true })
    await client.refetchQueries({ queryKey, type: 'active' }, { throwOnError: true })
  })().finally(() => operations.delete(key))
  operations.set(key, operation)
  return operation
}

export async function invalidateConsoleQueries(client: QueryClient, ...queryKeys: QueryKey[]): Promise<void> {
  const uniqueKeys = [...new Map(queryKeys.map((queryKey) => [serializedKey(queryKey), queryKey])).values()]
  const operations = operationMap(invalidations, client)
  const key = uniqueKeys.map(serializedKey).sort().join('|')
  const active = operations.get(key)
  if (active) return active

  const operation = (async () => {
    await Promise.all(uniqueKeys.map((queryKey) => client.cancelQueries({ queryKey, type: 'active' }, { silent: true })))
    await Promise.all(uniqueKeys.map((queryKey) => client.invalidateQueries({ queryKey, refetchType: 'active' })))
  })().finally(() => operations.delete(key))
  operations.set(key, operation)
  return operation
}
