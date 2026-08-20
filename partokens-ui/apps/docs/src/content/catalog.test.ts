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

  it('keeps every guide substantive and structurally complete', () => {
    for (const locale of locales) {
      for (const page of pageDefinitions.filter((candidate) => candidate.kind === 'guide')) {
        const copy = getPageCopy(locale, page.id)
        expect(copy.sections.length).toBeGreaterThanOrEqual(3)
        expect(new Set(copy.sections.map((section) => section.id)).size).toBe(copy.sections.length)
        for (const section of copy.sections) {
          expect(section.id.trim()).not.toBe('')
          expect(section.title.trim()).not.toBe('')
          expect(section.paragraphs.length).toBeGreaterThan(0)
          expect(section.paragraphs.every((paragraph) => paragraph.trim() !== '')).toBe(true)
        }
      }
    }
  })

  it('keeps documentation slugs unique', () => {
    const slugs = pageDefinitions.map((page) => page.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('publishes the Studio and Usage logs guides from the production catalog', () => {
    expect(pageDefinitions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'image-studio', slug: 'guides/image-studio' }),
      expect.objectContaining({ id: 'usage-logs', slug: 'guides/usage-logs' }),
    ]))
  })

  it('does not ship prototype language in published page content', () => {
    const publishedContent = JSON.stringify({
      pages: locales.flatMap((locale) => pageDefinitions.map((page) => getPageCopy(locale, page.id))),
      uiCopy,
    }).toLowerCase()
    const forbiddenTerms = [
      'design-lab',
      '设计样例',
      '設計樣例',
      'prototype',
      'mock',
      '后续补齐',
      '後續補齊',
      '待审核',
      '待審核',
      'pending review',
      'レビュー待ち',
      'ожидает проверки',
      'en attente de validation',
      'chờ duyệt',
    ]

    for (const term of forbiddenTerms) expect(publishedContent).not.toContain(term)
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
