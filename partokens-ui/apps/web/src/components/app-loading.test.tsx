// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { act, render } from '@testing-library/react'
import React from 'react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppLoadingBoundary, useAppBootPending } from './app-loading'

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) => select({
    isLoading: false,
    location: { pathname: '/zh-CN/' },
  }),
}))

vi.mock('@/stores/session', () => ({
  useSessionStore: (select: (state: { resolved: boolean }) => unknown) => select({ resolved: true }),
}))

beforeAll(() => vi.stubGlobal('React', React))

function PublicContentGate({ pending }: { pending: boolean }) {
  useAppBootPending(pending)
  return null
}

describe('app loading boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="partokens-boot-loader" data-started-at="0"></div>'
  })

  it('keeps the main loader mounted until initial public content is ready', () => {
    const view = render(<AppLoadingBoundary><PublicContentGate pending /></AppLoadingBoundary>)

    act(() => vi.runAllTimers())
    expect(document.getElementById('partokens-boot-loader')).toBeInTheDocument()

    view.rerender(<AppLoadingBoundary><PublicContentGate pending={false} /></AppLoadingBoundary>)
    act(() => vi.runAllTimers())
    expect(document.getElementById('partokens-boot-loader')).not.toBeInTheDocument()
  })
})
