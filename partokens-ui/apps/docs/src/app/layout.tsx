import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: { default: 'Partokens Docs', template: '%s | Partokens Docs' },
  description: 'Partokens API guides and reference documentation.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f9fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0f12' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
