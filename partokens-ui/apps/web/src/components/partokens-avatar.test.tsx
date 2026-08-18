// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { PartokensAvatar } from '@partokens/design-system/components'

beforeAll(() => vi.stubGlobal('React', React))
afterEach(cleanup)
afterAll(() => vi.unstubAllGlobals())

describe('PartokensAvatar', () => {
  it('uses fixed dimensions and local light and dark brand assets', () => {
    render(<PartokensAvatar size={28} alt="Partokens assistant" />)

    const avatar = screen.getByRole('img', { name: 'Partokens assistant' })
    const images = avatar.querySelectorAll('img')

    expect(avatar.getAttribute('style')).toContain('width: 28px')
    expect(avatar.getAttribute('style')).toContain('height: 28px')
    expect(images).toHaveLength(2)
    expect(images[0]?.getAttribute('src')).toBe('/brand/partokens-avatar-monochrome-light-transparent-64.png')
    expect(images[1]?.getAttribute('src')).toBe('/brand/partokens-avatar-monochrome-dark-transparent-64.png')
    images.forEach((image) => {
      expect(image.getAttribute('width')).toBe('28')
      expect(image.getAttribute('height')).toBe('28')
      expect(image.getAttribute('alt')).toBe('')
    })
  })

  it('stays decorative when adjacent text supplies the accessible name', () => {
    const { container } = render(<PartokensAvatar size={30} alt="" />)

    expect(container.querySelector('.partokens-avatar')?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.queryByRole('img')).toBeNull()
  })
})
