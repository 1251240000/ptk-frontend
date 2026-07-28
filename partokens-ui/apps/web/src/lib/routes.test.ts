import { describe, expect, it } from 'vitest'

import {
  canonicalConsolePath,
  canonicalConsoleRoute,
  canonicalConsoleSegment,
  consoleCompatibilityBaseSegment,
  consolePageFromPathname,
  consoleRouteMap,
  isConsoleViewportSection,
  localizedUserPath,
} from './routes'

describe('localized user routes', () => {
  it('keeps console links inside the active locale prefix', () => {
    expect(localizedUserPath('fr', '/console/keys')).toBe('/fr/console/keys')
  })

  it('falls back to the canonical simplified Chinese prefix', () => {
    expect(localizedUserPath(undefined, '/console/keys')).toBe('/zh-CN/console/keys')
  })

  it.each([
    ['overview', 'overview'],
    ['analytics', 'analytics'],
    ['keys', 'keys'],
    ['usageLogs', 'usage-logs'],
    ['playground', 'playground'],
    ['studio', 'studio'],
    ['wallet', 'wallet'],
    ['profile', 'profile'],
  ] as const)('maps the %s page to its canonical console segment', (page, segment) => {
    expect(canonicalConsoleSegment(page)).toBe(segment)
  })

  it('derives canonical templates and localized paths from the route map', () => {
    expect(canonicalConsoleRoute('usageLogs')).toBe('/$locale/console/usage-logs')
    expect(canonicalConsolePath('fr', 'usageLogs')).toBe('/fr/console/usage-logs')
    expect(consoleRouteMap.usageLogs.compatibilitySegment).toBe('logs')
  })

  it.each([
    ['/en/console/overview', 'overview'],
    ['/fr/console/usage-logs', 'usageLogs'],
    ['/zh-CN/console/playground/thread-1', 'playground'],
    ['/en/console', 'overview'],
  ] as const)('resolves %s to the %s page', (pathname, page) => {
    expect(consolePageFromPathname(pathname)).toBe(page)
  })

  it('keeps the compatibility base isolated from canonical link generation', () => {
    expect(consoleCompatibilityBaseSegment).toBe(['console', 'foundation'].join('-'))
    expect(isConsoleViewportSection('console')).toBe(true)
    expect(isConsoleViewportSection(consoleCompatibilityBaseSegment)).toBe(true)
    expect(isConsoleViewportSection('docs')).toBe(false)
    expect(Object.values(consoleRouteMap).every((route) => !route.path.includes(consoleCompatibilityBaseSegment))).toBe(true)
  })
})
