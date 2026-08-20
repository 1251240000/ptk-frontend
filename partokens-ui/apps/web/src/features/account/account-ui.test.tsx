// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { AccountDataState } from './account-ui'

beforeAll(() => vi.stubGlobal('React', React))

describe('account data state', () => {
  it('uses static card placeholders without a request trace', () => {
    const { container } = render(
      <AccountDataState loading loadingLabel="Loading subscription plans" emptyTitle="Subscription plans" retryLabel="Retry">
        <div>content</div>
      </AccountDataState>,
    )

    expect(container.querySelector('[aria-label="Loading subscription plans"]')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelector('[data-slot="loading-trace"]')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-slot="skeleton"]')[0]).toHaveClass('animate-none')
  })
})
