import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  asConsoleRequestError,
  classifyConsoleError,
  ConsoleContractError,
  consoleErrorMessage,
  consoleQueryKeys,
  invalidateConsoleQueries,
  refreshConsoleQueries,
} from './console-query'

describe('canonical Console query contract', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps every page under one canonical root with stable resource segments', () => {
    expect(consoleQueryKeys.overview.tokens()).toEqual(['console', 'overview', 'tokens'])
    expect(consoleQueryKeys.analytics.usage('7', 'day')).toEqual(['console', 'analytics', 'usage', '7', 'day'])
    expect(consoleQueryKeys.apiKeys.list('studio')).toEqual(['console', 'keys', 'list', 'studio'])
    expect(consoleQueryKeys.usageLogs.stats({ group: 'default' })).toEqual(['console', 'usage-logs', 'stats', { group: 'default' }])
    expect(consoleQueryKeys.usageLogs.tokenTotals({ group: 'default' })).toEqual(['console', 'usage-logs', 'token-totals', { group: 'default' }])
  })

  it('classifies 401, 403, contract, and availability failures without exposing response data', () => {
    const unauthorized = asConsoleRequestError({ response: { status: 401, data: { key: 'private-value' } } }, 'Safe failure')
    const forbidden = asConsoleRequestError({ response: { status: 403, data: { token: 'private-value' } } }, 'Safe failure')

    expect(classifyConsoleError(unauthorized)).toBe('authentication')
    expect(classifyConsoleError(forbidden)).toBe('authorization')
    expect(classifyConsoleError(new ConsoleContractError('Safe contract message'))).toBe('contract')
    expect(classifyConsoleError(new Error('private backend detail'))).toBe('availability')

    const visible = consoleErrorMessage(forbidden, {
      authentication: 'Sign in again.',
      authorization: 'Access denied.',
      availability: 'Unavailable.',
    })
    expect(visible).toBe('Access denied.')
    expect(visible).not.toContain('private-value')
  })

  it('coalesces matching refreshes and cancels the active request before refetching', async () => {
    let releaseCancel = () => {}
    const cancelGate = new Promise<void>((resolve) => { releaseCancel = resolve })
    const calls: string[] = []
    const client = {
      cancelQueries: () => { calls.push('cancel'); return cancelGate },
      refetchQueries: () => { calls.push('refetch'); return Promise.resolve() },
    }

    const first = refreshConsoleQueries(client as never, consoleQueryKeys.analytics.all)
    const second = refreshConsoleQueries(client as never, consoleQueryKeys.analytics.all)
    expect(calls).toEqual(['cancel'])
    releaseCancel()
    await Promise.all([first, second])
    expect(calls).toEqual(['cancel', 'refetch'])
  })

  it('reports an offline refresh as unavailable without discarding cached queries', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const client = {
      cancelQueries: vi.fn(),
      refetchQueries: vi.fn(),
    }

    await expect(refreshConsoleQueries(client as never, consoleQueryKeys.overview.all)).rejects.toMatchObject({
      name: 'ConsoleRequestError',
    })
    expect(client.cancelQueries).not.toHaveBeenCalled()
    expect(client.refetchQueries).not.toHaveBeenCalled()
  })

  it('deduplicates invalidation keys and coalesces a matching mutation invalidation', async () => {
    let releaseCancel = () => {}
    const cancelGate = new Promise<void>((resolve) => { releaseCancel = resolve })
    const calls: string[] = []
    const client = {
      cancelQueries: ({ queryKey }: { queryKey: readonly unknown[] }) => {
        calls.push(`cancel:${JSON.stringify(queryKey)}`)
        return cancelGate
      },
      invalidateQueries: ({ queryKey }: { queryKey: readonly unknown[] }) => {
        calls.push(`invalidate:${JSON.stringify(queryKey)}`)
        return Promise.resolve()
      },
    }
    const keys = [consoleQueryKeys.apiKeys.all, consoleQueryKeys.overview.tokens(), consoleQueryKeys.apiKeys.all] as const

    const first = invalidateConsoleQueries(client as never, ...keys)
    const second = invalidateConsoleQueries(client as never, ...keys)
    expect(calls.filter((call) => call.startsWith('cancel:'))).toHaveLength(2)
    releaseCancel()
    await Promise.all([first, second])
    expect(calls.filter((call) => call.startsWith('invalidate:'))).toHaveLength(2)
    expect(calls.slice(0, 2).every((call) => call.startsWith('cancel:'))).toBe(true)
  })
})
