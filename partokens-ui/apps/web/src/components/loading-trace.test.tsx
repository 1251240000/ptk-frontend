// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { LoadingRegion, LoadingTrace, RouteProgress } from '@partokens/design-system/components'

beforeAll(() => vi.stubGlobal('React', React))

describe('loading trace', () => {
  it('announces a labeled loading region once', () => {
    render(<LoadingRegion label="Loading security settings"><div>placeholder</div></LoadingRegion>)

    const status = screen.getByRole('status', { name: 'Loading security settings' })
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status.querySelectorAll('[role="status"]')).toHaveLength(0)
  })

  it('keeps decorative and route progress animations out of the accessibility tree', () => {
    const { container } = render(<><LoadingTrace decorative /><RouteProgress active /></>)

    expect(container.querySelector('[data-slot="loading-trace"]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[data-slot="route-progress"]')).toHaveAttribute('aria-hidden', 'true')
  })
})
