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

  it('keeps headings, prose, code blocks, and tables visually separated', () => {
    const { container } = render(
      <PlaygroundMessageContent content={'# Title\n\nBody\n\n```ts\nconst answer = 42\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |'} />,
    )
    const content = container.firstElementChild

    expect(content).toHaveClass('playground-markdown')
    expect(content).toHaveClass('leading-7')
    expect(content?.className).toContain('[&_h1]:mt-9')
    expect(content?.className).toContain('[&_h1]:mb-5')
    expect(content?.className).toContain('[&_h1]:pb-2.5')
    expect(content?.className).toContain('[&_h2]:mt-8')
    expect(content?.className).toContain('[&_h2]:mb-4')
    expect(content?.className).toContain('[&_pre]:my-6')
    expect(content?.className).toContain('[&_p]:leading-7')
    expect(container.querySelector('table')?.parentElement).toHaveClass('my-6')
    expect(container.querySelector('table')).toHaveClass('min-w-max')
    expect(container.querySelector('table')).toHaveClass('border-separate')
    expect(container.querySelector('tbody')).toHaveClass('[&>tr:last-child>td]:border-b-0')
    expect(container.querySelector('th')).toHaveClass('border-border')
    expect(container.querySelector('th')).toHaveClass('bg-muted/70')
    expect(container.querySelector('th')).toHaveClass('dark:bg-muted/80')
    expect(container.querySelector('th')).toHaveClass('text-foreground')
    expect(container.querySelector('th')).toHaveClass('font-semibold')
    expect(container.querySelector('td')).toHaveClass('border-border')
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
