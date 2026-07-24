import { describe, expect, it } from 'vitest'

import { apiDefinitions, getPageCopy, pageDefinitions, uiCopy } from './catalog'
import { locales } from '@/lib/locales'

describe('documentation catalog', () => {
  it('contains every page in every locale', () => {
    for (const locale of locales) {
      for (const page of pageDefinitions) {
        const copy = getPageCopy(locale, page.id)
        expect(copy.title.trim()).not.toBe('')
        expect(copy.description.trim()).not.toBe('')
      }
    }
  })

  it('keeps API methods and paths unique', () => {
    const routes = Object.values(apiDefinitions).map((api) => `${api.method} ${api.path}`)
    expect(new Set(routes).size).toBe(routes.length)
  })

  it('has complete shell copy for all locales', () => {
    const baseline = Object.keys(uiCopy['zh-CN']).sort()
    for (const locale of locales) expect(Object.keys(uiCopy[locale]).sort()).toEqual(baseline)
  })
})
