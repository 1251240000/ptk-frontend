import { readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

function filesUnder(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

describe('canonical Console source boundaries', () => {
  const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const webRoot = resolve(srcRoot, '..')

  it('allows the compatibility path only in its route map and compatibility E2E', () => {
    const compatibilityPath = `/${['console', 'foundation'].join('-')}`
    const roots = [srcRoot, join(webRoot, 'e2e')]
    const references = roots.flatMap((root) => filesUnder(root)
      .filter((path) => ['.ts', '.tsx'].includes(extname(path)))
      .filter((path) => readFileSync(path, 'utf8').includes(compatibilityPath))
      .map((path) => relative(webRoot, path).replaceAll('\\\\', '/').replaceAll('\\', '/')))

    expect(references.sort()).toEqual(['e2e/console.spec.ts'])
    expect(readFileSync(join(srcRoot, 'lib/routes.ts'), 'utf8')).toContain(`'${compatibilityPath.slice(1)}'`)
  })

  it('loads each Console leaf from its own route chunk', () => {
    const router = readFileSync(join(srcRoot, 'router.tsx'), 'utf8')
    const modules = [
      ['console-overview-page', 'console-overview'],
      ['console-analytics-page', 'console-analytics'],
      ['console-keys-page', 'console-api-keys'],
      ['console-usage-logs-page', 'console-usage-logs'],
      ['wallet-page', 'console-wallet'],
      ['profile-page', 'console-profile'],
    ]

    for (const [module, chunk] of modules) {
      expect(router).toMatch(new RegExp(`lazyRouteComponent\\(\\(\\) => import\\(/\\* webpackChunkName: ["']${chunk}["'] \\*/ ["']@/pages/${module}["']\\)`))
      expect(router).not.toMatch(new RegExp(`^import .*${module}`, 'm'))
    }
    expect(readFileSync(join(srcRoot, 'pages/console-overview-page.tsx'), 'utf8')).not.toContain("@/pages/console-usage-logs-page")
  })

  it('keeps lazy route fallback, failure, retry, location, and focus recovery wired together', () => {
    const router = readFileSync(join(srcRoot, 'router.tsx'), 'utf8')
    const routeState = readFileSync(join(srcRoot, 'components/console-route-state.tsx'), 'utf8')
    const shell = readFileSync(join(srcRoot, 'components/console-shell.tsx'), 'utf8')

    expect(router.match(/\.\.\.consoleRouteAsyncOptions/g)).toHaveLength(14)
    expect(routeState).toContain('pendingComponent: ConsoleRoutePending')
    expect(routeState).toContain('errorComponent: ConsoleRouteError')
    expect(routeState).toContain('window.location.pathname}${window.location.search}')
    expect(routeState).toContain('window.location.reload()')
    expect(shell).toContain('window.sessionStorage.removeItem(consoleRouteRetryStorageKey)')
    expect(shell).toContain('mainRef.current?.focus()')
  })

  it('checks entry, initial JavaScript, and independent Console chunks during every web build', () => {
    const packageJson = JSON.parse(readFileSync(join(webRoot, 'package.json'), 'utf8')) as { scripts?: Record<string, string> }
    const budgets = JSON.parse(readFileSync(join(webRoot, 'bundle-budgets.json'), 'utf8')) as { entry?: unknown; routes?: Record<string, unknown> }
    const checker = readFileSync(join(webRoot, 'scripts/check-console-bundles.ts'), 'utf8')

    expect(packageJson.scripts?.build).toContain('check-console-bundles.ts')
    expect(budgets.entry).toBeTruthy()
    expect(Object.keys(budgets.routes || {}).sort()).toEqual(['console-analytics', 'console-api-keys', 'console-overview', 'console-usage-logs'])
    expect(checker).toContain('initial JavaScript')
    expect(checker).toContain('must emit exactly one independent async chunk')
    expect(checker).toContain('was included in the initial bundle')
  })

  it('does not retain the removed Legacy Console shell selectors', () => {
    const css = readFileSync(join(srcRoot, 'styles.css'), 'utf8')
    for (const selector of ['console-layout', 'console-sidebar', 'mobile-console-nav', 'mobile-console-sheet', 'quota-rail']) {
      expect(css).not.toContain(`.${selector}`)
    }
  })
})
