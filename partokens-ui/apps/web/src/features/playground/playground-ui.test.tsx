/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PlaygroundMessageContent } from './playground-ui'

describe('PlaygroundMessageContent', () => {
  it('renders structured Markdown and fenced code', () => {
    const { container } = render(
      <PlaygroundMessageContent content={'## Result\n\n- one\n- two\n\n```ts\nconst answer = 42\n```'} />,
    )

    expect(screen.getByRole('heading', { name: 'Result', level: 2 })).toBeVisible()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(container.querySelector('pre code')).toHaveTextContent('const answer = 42')
  })

  it('does not execute or inject raw model HTML', () => {
    const { container } = render(
      <PlaygroundMessageContent content={'Before<script>window.__unsafe = true</script><img src=x onerror="window.__unsafe = true">After'} />,
    )

    expect(container.querySelector('script')).not.toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect((window as Window & { __unsafe?: boolean }).__unsafe).toBeUndefined()
  })
})
