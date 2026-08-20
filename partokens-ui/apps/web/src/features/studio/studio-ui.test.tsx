/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StudioEmpty, StudioResultGrid, studioImageDimensionsLabel, studioSizeLabel } from './studio-ui'

const t = (key: string, values?: Record<string, string | number>) => (
  Object.entries(values || {}).reduce((output, [name, value]) => output.replace(`{{${name}}}`, String(value)), key)
)

describe('Studio presentation', () => {
  it('keeps the approved empty-state hierarchy', () => {
    render(<StudioEmpty cancelled={false} t={t} />)
    expect(screen.getByRole('heading', { name: 'No images yet' })).toBeVisible()
    expect(screen.getByText('Set your prompt and generation options, then create your first image set.')).toBeVisible()
  })

  it('renders a stable result grid with accessible variation labels', () => {
    render(<StudioResultGrid
      results={[{ id: 'one', source: 'data:image/png;base64,AQID', dimensions: { width: 1536, height: 1024 }, retained: true }]}
      settings={{ prompt: 'A precise image', model: 'gpt-image-1', quality: 'high', size: '1536x1024', count: 1 }}
      t={t}
      onUseAsReference={() => undefined}
    />)
    expect(screen.getByRole('img', { name: 'A precise image, Variation 1' })).toBeVisible()
    expect(screen.getByText('Landscape · 1536 x 1024')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Download image' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Use as reference' })).toBeVisible()
    expect(studioSizeLabel('auto', t)).toBe('Automatic')
    expect(studioImageDimensionsLabel({ width: 1, height: 1 }, t)).toBe('Square · 1 x 1')
    expect(studioImageDimensionsLabel(undefined, t)).toBe('Size unavailable')
  })
})
