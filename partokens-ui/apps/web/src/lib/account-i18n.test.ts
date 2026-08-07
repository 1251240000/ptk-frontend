import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { accountTranslationRows, locales, resources } from '@partokens/i18n'

describe('account translations', () => {
  it('provides every Account key in all seven locales', () => {
    for (const row of accountTranslationRows) {
      const [key, ...values] = row
      expect(values).toHaveLength(locales.length)
      locales.forEach((locale, index) => {
        const translation = resources[locale].translation as Record<string, string>
        expect(translation[key]).toBe(values[index])
        expect(translation[key]?.trim()).not.toBe('')
      })
    }
  })

  it('does not use whole English fallback values on Account surfaces', () => {
    const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
    const files = [
      resolve(sourceRoot, 'pages/wallet-page.tsx'),
      resolve(sourceRoot, 'pages/profile-page.tsx'),
      resolve(sourceRoot, 'features/account/account-ui.tsx'),
    ]
    const keys = [...new Set(files.flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/\bt\('([^']+)'/g)].map((match) => match[1]!)))]
    const english = resources.en.translation as Record<string, string>

    for (const locale of locales.filter((value) => value !== 'en')) {
      const dictionary = resources[locale].translation as Record<string, string>
      expect(keys.filter((key) => dictionary[key] === english[key]), locale).toEqual([])
    }
  })
})
