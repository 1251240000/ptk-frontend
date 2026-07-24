import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { BookOpen, CircleUserRound, House, Layers3, LayoutDashboard } from 'lucide-react'

import { uiCopy } from '@/content/catalog'
import { docsPath, i18n, type DocsLocale } from './locales'

export function baseOptions(locale: DocsLocale): BaseLayoutProps {
  const ui = uiCopy[locale]
  return {
    i18n,
    searchToggle: { enabled: false },
    nav: {
      title: (
        <span className="docs-brand">
          <img src="https://oss.partokens.com/assets/icons/favicon-96x96.png" alt="" width={25} height={25} />
          <span>{ui.brand}</span>
        </span>
      ),
      url: docsPath(locale),
    },
    links: [
      { text: ui.home, url: `/${locale}/`, icon: <House /> },
      { text: ui.console, url: `/${locale}/console/overview`, icon: <LayoutDashboard /> },
      { text: ui.models, url: `/${locale}/models`, icon: <Layers3 /> },
      { text: ui.about, url: `/${locale}/about`, icon: <CircleUserRound /> },
      { type: 'icon', label: ui.brand, text: ui.brand, url: docsPath(locale), icon: <BookOpen /> },
    ],
  }
}
