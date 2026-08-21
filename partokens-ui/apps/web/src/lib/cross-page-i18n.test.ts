import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { crossPageTranslationRows, locales, resources } from '@partokens/i18n'

describe('cross-page translations', () => {
  it('provides reviewed labels in all seven locales', () => {
    const legitimateMatches = new Set(['fr:Route'])
    for (const row of crossPageTranslationRows) {
      const [key, ...values] = row
      expect(values).toHaveLength(locales.length)
      locales.forEach((locale, index) => {
        const translation = resources[locale].translation as Record<string, string>
        expect(translation[key]).toBe(values[index])
        expect(translation[key]?.trim()).not.toBe('')
        if (locale !== 'en' && !legitimateMatches.has(`${locale}:${key}`)) expect(translation[key]).not.toBe(key)
      })
    }
  })

  it('does not restore localized public and authentication labels as English literals', () => {
    const sourceRoot = resolveSourceRoot()
    const publicPages = readFileSync(join(sourceRoot, 'features/public/public-pages.tsx'), 'utf8')
    const authShell = readFileSync(join(sourceRoot, 'features/auth/auth-shell.tsx'), 'utf8')
    const authPages = readFileSync(join(sourceRoot, 'features/auth/auth-pages.tsx'), 'utf8')
    const docsPage = readFileSync(join(sourceRoot, 'features/public/public-docs-page.tsx'), 'utf8')
    const consoleShell = readFileSync(join(sourceRoot, 'components/console-shell.tsx'), 'utf8')

    for (const literal of ['>API ROUTES<', '>SERVICE BOUNDARY<', 'eyebrow="RELEASE NOTES"', '>CURRENT<', '>Prompt<', '>Route<', '>Result<']) {
      expect(publicPages).not.toContain(literal)
    }
    expect(authShell).not.toContain('>MODEL GATEWAY<')
    expect(authPages).not.toContain('eyebrow="RECOVERY"')
    expect(authPages).not.toContain('eyebrow="EMAIL"')
    expect(authPages).not.toContain('eyebrow="SECURITY"')
    expect(docsPage).not.toContain('aria-label="Code language"')
    expect(consoleShell).toContain("label={t('Toggle sidebar')}")
    expect(consoleShell).toContain("containerAriaLabel={t('Notifications')}")
    expect(authShell).toContain("containerAriaLabel={t('Notifications')}")
  })
})

function resolveSourceRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '..')
}
