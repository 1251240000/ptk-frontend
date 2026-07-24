import { isAppLocale } from '@partokens/i18n'

export function localizedUserPath(locale: string | undefined, path: `/${string}`): string {
  const safeLocale = isAppLocale(locale) ? locale : 'zh-CN'
  return `/${safeLocale}${path}`
}
