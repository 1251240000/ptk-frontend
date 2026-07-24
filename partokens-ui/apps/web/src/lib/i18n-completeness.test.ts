import { readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { locales, resources } from '@partokens/i18n'

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return ['.ts', '.tsx'].includes(extname(path)) && !path.endsWith('.test.ts') && !path.endsWith('.test.tsx') ? [path] : []
  })
}

function literalTranslationKeys(root: string) {
  const keys = new Set<string>()
  for (const path of sourceFiles(root)) {
    const source = ts.createSourceFile(
      path,
      readFileSync(path, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node)
        && ts.isIdentifier(node.expression)
        && node.expression.text === 't'
        && node.arguments[0]
        && ts.isStringLiteralLike(node.arguments[0])
      ) keys.add(node.arguments[0].text)
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return [...keys].sort()
}

describe('UI translation completeness', () => {
  it('defines every literal UI translation key in all seven dictionaries', () => {
    const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
    const keys = literalTranslationKeys(webRoot)
    expect(keys.length).toBeGreaterThan(600)
    for (const locale of locales) {
      const dictionary = resources[locale].translation as Record<string, string>
      expect(keys.filter((key) => !(key in dictionary)), locale).toEqual([])
    }
  })

  it('keeps dictionary key parity across locales', () => {
    const baseline = Object.keys(resources.en.translation).sort()
    for (const locale of locales) {
      expect(Object.keys(resources[locale].translation).sort(), locale).toEqual(baseline)
    }
  })
})
