import type { AppLocale } from '@partokens/i18n'
import { docsCatalog, type DocsItemId } from './public-docs-copy'

export type { DocsItemId } from './public-docs-copy'

export type DocsCalloutTone = 'info' | 'warning' | 'success'

export type DocsCodeSample = {
  language: 'shell' | 'javascript' | 'python'
  label: string
  code: string
}

export type DocsContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'steps'; items: Array<{ title: string; body: string }> }
  | { type: 'callout'; tone: DocsCalloutTone; title: string; body: string }
  | { type: 'endpoint'; method?: string; path: string; label: string }
  | { type: 'links'; items: Array<{ label: string; href: string }> }
  | { type: 'code-samples'; samples: DocsCodeSample[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'faq'; items: Array<{ question: string; answer: string }> }

export type DocsContentSection = {
  id: string
  title: string
  blocks: DocsContentBlock[]
}

export type DocsDocument = {
  id: DocsItemId
  summary: string
  prerequisites?: string[]
  sections: DocsContentSection[]
}

export type DocsDocuments = Partial<Record<DocsItemId, DocsDocument>>
export type DocsLocaleLoader = (locale: AppLocale) => Promise<DocsDocuments>

export const completedDocsOrder: DocsItemId[] = docsCatalog.flatMap((group) => group.items.map((item) => item.id))

const localeLoaders: Record<AppLocale, () => Promise<DocsDocuments>> = {
  'zh-CN': async () => (await import(/* webpackChunkName: "docs-zh-CN" */ './docs-locales/zh-CN')).zhCNDocsDocuments,
  'zh-TW': async () => (await import(/* webpackChunkName: "docs-zh-TW" */ './docs-locales/zh-TW')).zhTWDocsDocuments,
  en: async () => (await import(/* webpackChunkName: "docs-en" */ './docs-locales/en')).enDocsDocuments,
  ja: async () => (await import(/* webpackChunkName: "docs-ja" */ './docs-locales/ja')).jaDocsDocuments,
  ru: async () => (await import(/* webpackChunkName: "docs-ru" */ './docs-locales/ru')).ruDocsDocuments,
  fr: async () => (await import(/* webpackChunkName: "docs-fr" */ './docs-locales/fr')).frDocsDocuments,
  vi: async () => (await import(/* webpackChunkName: "docs-vi" */ './docs-locales/vi')).viDocsDocuments,
}

const localeCache = new Map<AppLocale, Promise<DocsDocuments>>()

export function loadDocsLocale(locale: AppLocale): Promise<DocsDocuments> {
  const cached = localeCache.get(locale)
  if (cached) return cached
  const pending = localeLoaders[locale]().catch((error) => {
    localeCache.delete(locale)
    throw error
  })
  localeCache.set(locale, pending)
  return pending
}

export function clearDocsLocaleCache() {
  localeCache.clear()
}

export async function hasLocalizedDocsDocument(id: DocsItemId, locale: AppLocale, loader: DocsLocaleLoader = loadDocsLocale) {
  return Boolean((await loader(locale))[id])
}

export async function getDocsDocument(id: DocsItemId, locale: AppLocale = 'zh-CN', loader: DocsLocaleLoader = loadDocsLocale) {
  const localized = (await loader(locale))[id]
  if (localized) return localized
  const fallback = locale === 'en' ? undefined : (await loader('en'))[id]
  if (!fallback) throw new Error(`Missing published documentation: ${locale}/${id}`)
  return fallback
}

export function getDocsSearchText(document: DocsDocument) {
  return [
    document.summary,
    ...(document.prerequisites ?? []),
    ...document.sections.flatMap((section) => [
      section.title,
      ...section.blocks.flatMap((block) => {
        if (block.type === 'paragraph') return [block.text]
        if (block.type === 'list') return block.items
        if (block.type === 'steps') return block.items.flatMap((item) => [item.title, item.body])
        if (block.type === 'callout') return [block.title, block.body]
        if (block.type === 'endpoint') return [block.label, block.path]
        if (block.type === 'links') return block.items.flatMap((item) => [item.label, item.href])
        if (block.type === 'table') return [...block.columns, ...block.rows.flat()]
        if (block.type === 'faq') return block.items.flatMap((item) => [item.question, item.answer])
        return block.samples.flatMap((sample) => [sample.label, sample.code])
      }),
    ]),
  ].join(' ')
}
