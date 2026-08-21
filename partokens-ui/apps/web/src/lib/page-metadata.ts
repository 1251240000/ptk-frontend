import { useEffect } from 'react'

import { locales, type AppLocale } from '@partokens/i18n'

const defaultTitle = 'Partokens'
const defaultDescription = 'Partokens model access, usage, and account console'
const managedAttribute = 'data-partokens-page-metadata'

export type PageMetadata = {
  locale: AppLocale
  title: string
  description: string
  pathname?: string
  indexable?: boolean
}

export function pageDocumentTitle(title: string) {
  return title === defaultTitle ? defaultTitle : `${title} | ${defaultTitle}`
}

export function localizedAlternatePath(pathname: string, locale: AppLocale) {
  const segments = pathname.split('/').filter(Boolean)
  if (!locales.includes(segments[0] as AppLocale)) return null
  segments[0] = locale
  const path = `/${segments.join('/')}`
  return segments.length === 1 ? `${path}/` : path
}

function removeManagedMetadata() {
  document.head.querySelectorAll(`[${managedAttribute}]`).forEach((element) => element.remove())
}

function appendLink(attributes: Record<string, string>) {
  const link = document.createElement('link')
  link.setAttribute(managedAttribute, '')
  Object.entries(attributes).forEach(([name, value]) => link.setAttribute(name, value))
  document.head.append(link)
}

function applyPageMetadata(metadata: PageMetadata) {
  const pathname = metadata.pathname ?? window.location.pathname
  const description = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')

  document.title = pageDocumentTitle(metadata.title)
  document.documentElement.lang = metadata.locale
  if (description) description.content = metadata.description
  removeManagedMetadata()

  if (metadata.indexable === false) {
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    robots.setAttribute(managedAttribute, '')
    document.head.append(robots)
    return
  }

  const canonicalPath = localizedAlternatePath(pathname, metadata.locale)
  if (!canonicalPath) return
  appendLink({ rel: 'canonical', href: new URL(canonicalPath, window.location.origin).toString() })
  for (const locale of locales) {
    const alternatePath = localizedAlternatePath(pathname, locale)
    if (alternatePath) appendLink({ rel: 'alternate', hreflang: locale, href: new URL(alternatePath, window.location.origin).toString() })
  }
  const defaultPath = localizedAlternatePath(pathname, 'en')
  if (defaultPath) appendLink({ rel: 'alternate', hreflang: 'x-default', href: new URL(defaultPath, window.location.origin).toString() })
}

function resetPageMetadata() {
  const description = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
  document.title = defaultTitle
  if (description) description.content = defaultDescription
  removeManagedMetadata()
}

export function usePageMetadata(metadata: PageMetadata | null) {
  useEffect(() => {
    if (!metadata) return
    applyPageMetadata(metadata)
    return resetPageMetadata
  }, [metadata?.description, metadata?.indexable, metadata?.locale, metadata?.pathname, metadata?.title])
}
