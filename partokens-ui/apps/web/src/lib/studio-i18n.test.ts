import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { locales, resources, studioTranslationRows } from '@partokens/i18n'

describe('Studio translations', () => {
  it('provides every new Studio key in all seven locales', () => {
    for (const row of studioTranslationRows) {
      const [key, ...values] = row
      expect(values).toHaveLength(locales.length)
      locales.forEach((locale, index) => {
        const translation = resources[locale].translation as Record<string, string>
        expect(translation[key]).toBe(values[index])
        expect(translation[key]?.trim()).not.toBe('')
      })
    }
  })

  it('resolves every static Studio source key', () => {
    const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
    const files = [
      resolve(sourceRoot, 'pages/studio-page.tsx'),
      resolve(sourceRoot, 'features/studio/studio-ui.tsx'),
    ]
    const keys = [...new Set(files.flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/\bt\('([^']+)'/g)].map((match) => match[1]!)))]

    for (const locale of locales) {
      const dictionary = resources[locale].translation as Record<string, string>
      expect(keys.filter((key) => !dictionary[key]?.trim()), locale).toEqual([])
    }
  })
})
