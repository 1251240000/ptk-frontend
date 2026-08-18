import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { DocsProvider } from '@/components/provider'
import { isDocsLocale, locales } from '@/lib/locales'
import './global.css'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isDocsLocale(locale)) notFound()
  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <head><script src="/_ui/theme-init.v2.js" /></head>
      <body><DocsProvider locale={locale}>{children}</DocsProvider></body>
    </html>
  )
}
