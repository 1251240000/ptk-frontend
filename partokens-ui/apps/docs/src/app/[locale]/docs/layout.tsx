import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { baseOptions } from '@/lib/layout'
import { isDocsLocale } from '@/lib/locales'
import { source } from '@/lib/source'

export default async function DocumentationLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isDocsLocale(locale)) notFound()
  return (
    <DocsLayout
      {...baseOptions(locale)}
      tree={source.pageTree[locale]}
      sidebar={{ defaultOpenLevel: 2 }}
      tabMode="auto"
    >
      {children}
    </DocsLayout>
  )
}
