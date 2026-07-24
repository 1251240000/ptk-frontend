import { defineI18n } from 'fumadocs-core/i18n'

export const locales = ['zh-CN', 'zh-TW', 'en', 'ja', 'ru', 'fr', 'vi'] as const
export type DocsLocale = (typeof locales)[number]

export const defaultLocale: DocsLocale = 'zh-CN'

export const i18n = defineI18n({
  defaultLanguage: defaultLocale,
  languages: [...locales],
  parser: 'dir',
})

export const localeLabels: Record<DocsLocale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  en: 'English',
  ja: '日本語',
  ru: 'Русский',
  fr: 'Français',
  vi: 'Tiếng Việt',
}

export function isDocsLocale(value: string): value is DocsLocale {
  return locales.includes(value as DocsLocale)
}

export function docsPath(locale: DocsLocale, slug = ''): string {
  const suffix = slug ? `/${slug.replace(/^\//, '')}` : ''
  return `/${locale}/docs${suffix}`
}
