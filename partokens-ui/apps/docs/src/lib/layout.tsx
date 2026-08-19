import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { BookOpen, CircleUserRound, House, Layers3, LayoutDashboard } from 'lucide-react'
import { PartokensAvatar } from '@partokens/design-system/partokens-avatar'

import { uiCopy } from '@/content/catalog'
import { docsPath, type DocsLocale } from './locales'

export function baseOptions(locale: DocsLocale): BaseLayoutProps {
  const ui = uiCopy[locale]
  return {
    themeSwitch: { enabled: false },
    searchToggle: { enabled: false },
    nav: {
      title: (
        <span className="docs-brand">
          <span className="docs-brand-mark"><PartokensAvatar size={28} alt="" /></span>
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
