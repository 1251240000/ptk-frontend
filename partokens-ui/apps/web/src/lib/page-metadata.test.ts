import { describe, expect, it } from 'vitest'

import { localizedAlternatePath, pageDocumentTitle } from './page-metadata'

describe('localized page metadata', () => {
  it('keeps the product title compact and qualifies page titles', () => {
    expect(pageDocumentTitle('Partokens')).toBe('Partokens')
    expect(pageDocumentTitle('Privacy Policy')).toBe('Privacy Policy | Partokens')
  })

  it('builds locale alternates without carrying query strings or hashes', () => {
    expect(localizedAlternatePath('/en/legal/privacy-policy', 'ja')).toBe('/ja/legal/privacy-policy')
    expect(localizedAlternatePath('/zh-CN/', 'fr')).toBe('/fr/')
    expect(localizedAlternatePath('/oauth/github', 'vi')).toBeNull()
  })
})
