import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  embeddedPublicContent,
  getCurrentNotice,
  getLegalDocument,
  getLocaleContent,
  getNoticePolicy,
} from '@partokens/content/public'
import { loadPublicContent } from '@partokens/content/public-config'
import { locales } from '@partokens/i18n'

describe('public content configuration', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('provides configured about, notice, policy, and legal content for every locale', () => {
    for (const locale of locales) {
      expect(getLocaleContent(locale).aboutTitle).toBe(embeddedPublicContent.about.locales[locale].title)
      expect(getCurrentNotice(locale).title).toBe(embeddedPublicContent.notices.notices[0]?.locales[locale].title)
      expect(getNoticePolicy(locale, embeddedPublicContent).title).toBe(embeddedPublicContent.notices.policy[locale].title)
      expect(getLegalDocument(locale, 'privacy-policy').title).toBe(embeddedPublicContent.legal['privacy-policy'].locales[locale].title)
    }
  })

  it('loads a complete runtime snapshot from manifest-relative JSON files', async () => {
    const responses = new Map<string, unknown>([
      ['/public-content/manifest.json', embeddedPublicContent.manifest],
      ['/public-content/system.json', embeddedPublicContent.system],
      ['/public-content/about.json', embeddedPublicContent.about],
      ['/public-content/notices.json', embeddedPublicContent.notices],
      ['/public-content/legal/user-agreement.json', embeddedPublicContent.legal['user-agreement']],
      ['/public-content/legal/service-agreement.json', embeddedPublicContent.legal['service-agreement']],
      ['/public-content/legal/privacy-policy.json', embeddedPublicContent.legal['privacy-policy']],
    ])
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : new URL(input.url).pathname
      const body = responses.get(url)
      return new Response(body ? JSON.stringify(body) : null, { status: body ? 200 : 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const loaded = await loadPublicContent()

    expect(loaded.manifest.revision).toBe(embeddedPublicContent.manifest.revision)
    expect(fetchMock).toHaveBeenCalledTimes(7)
    expect(fetchMock).toHaveBeenCalledWith('/public-content/manifest.json', expect.objectContaining({ cache: 'no-store' }))
  })

  it('rejects paths that escape the public-content directory', async () => {
    const manifest = structuredClone(embeddedPublicContent.manifest)
    manifest.files.about = '../about.json'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(manifest))))

    await expect(loadPublicContent()).rejects.toThrow('Invalid public-content path')
  })
})
