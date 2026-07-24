import { describe, expect, it } from 'vitest'

import { localizedUserPath } from './routes'

describe('localized user routes', () => {
  it('keeps console links inside the active locale prefix', () => {
    expect(localizedUserPath('fr', '/console/keys')).toBe('/fr/console/keys')
  })

  it('falls back to the canonical simplified Chinese prefix', () => {
    expect(localizedUserPath(undefined, '/console/keys')).toBe('/zh-CN/console/keys')
  })
})
