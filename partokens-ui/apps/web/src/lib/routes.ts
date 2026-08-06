import { isAppLocale } from '@partokens/i18n'

export const consoleBaseSegment = 'console'
export const consoleCompatibilityBaseSegment = 'console-foundation'

function defineConsoleRoute<const Segment extends string>(segment: Segment): {
  segment: Segment
  path: `/console/${Segment}`
  route: `/$locale/console/${Segment}`
  compatibilitySegment: undefined
}
function defineConsoleRoute<const Segment extends string, const CompatibilitySegment extends string>(segment: Segment, compatibilitySegment: CompatibilitySegment): {
  segment: Segment
  path: `/console/${Segment}`
  route: `/$locale/console/${Segment}`
  compatibilitySegment: CompatibilitySegment
}
function defineConsoleRoute(segment: string, compatibilitySegment?: string) {
  return {
    segment,
    path: `/${consoleBaseSegment}/${segment}` as const,
    route: `/$locale/${consoleBaseSegment}/${segment}` as const,
    compatibilitySegment,
  }
}

export const consoleRouteMap = {
  overview: defineConsoleRoute('overview', 'overview'),
  analytics: defineConsoleRoute('analytics', 'analytics'),
  keys: defineConsoleRoute('keys', 'keys'),
  usageLogs: defineConsoleRoute('usage-logs', 'logs'),
  playground: defineConsoleRoute('playground'),
  studio: defineConsoleRoute('studio'),
  wallet: defineConsoleRoute('wallet'),
  profile: defineConsoleRoute('profile'),
} as const

export type CanonicalConsolePage = keyof typeof consoleRouteMap

export function canonicalConsoleSegment(page: CanonicalConsolePage) {
  return consoleRouteMap[page].segment
}

export function canonicalConsoleRoute(page: CanonicalConsolePage) {
  return consoleRouteMap[page].route
}

export function canonicalConsolePath(locale: string | undefined, page: CanonicalConsolePage): string {
  return localizedUserPath(locale, consoleRouteMap[page].path)
}

export function consolePageFromPathname(pathname: string): CanonicalConsolePage {
  const segment = pathname.match(/\/console\/([^/?#]+)/)?.[1]
  const page = (Object.keys(consoleRouteMap) as CanonicalConsolePage[]).find(
    (candidate) => consoleRouteMap[candidate].segment === segment,
  )
  return page ?? 'overview'
}

export function isConsoleViewportSection(section: string | undefined): boolean {
  return section === consoleBaseSegment || section === consoleCompatibilityBaseSegment
}

export function localizedUserPath(locale: string | undefined, path: `/${string}`): string {
  const safeLocale = isAppLocale(locale) ? locale : 'zh-CN'
  return `/${safeLocale}${path}`
}

export function localizedLocation(pathname: string, locale: string | undefined, search = '', hash = ''): string {
  const safeLocale = isAppLocale(locale) ? locale : 'zh-CN'
  const path = pathname.replace(/^\/[^/]+(?=\/|$)/, `/${safeLocale}`)
  return `${path === pathname && !pathname.startsWith(`/${safeLocale}`) ? `/${safeLocale}${pathname}` : path}${search}${hash}`
}
