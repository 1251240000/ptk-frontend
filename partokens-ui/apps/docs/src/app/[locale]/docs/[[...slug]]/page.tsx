import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page'

import { isDocsLocale } from '@/lib/locales'
import { source } from '@/lib/source'

export default async function DocumentationPage({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
  const { locale, slug } = await params
  if (!isDocsLocale(locale)) notFound()
  const page = source.getPage(slug, locale)
  if (!page) notFound()
  const MDX = page.data.body
  return (
    <DocsPage toc={[]} footer={{ enabled: false }} tableOfContent={{ enabled: false }}>
      <header className="docs-page-header">
        <span className="docs-page-kicker">PARTOKENS API</span>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
      </header>
      <MDX />
    </DocsPage>
  )
}

export const dynamicParams = false

export function generateStaticParams() {
  return source.generateParams().map((params) => ({ locale: params.lang, slug: params.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug?: string[] }> }): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isDocsLocale(locale)) notFound()
  const page = source.getPage(slug, locale)
  if (!page) notFound()
  return { title: page.data.title, description: page.data.description }
}
