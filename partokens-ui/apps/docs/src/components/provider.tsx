'use client'

import { RootProvider } from 'fumadocs-ui/provider/next'
import { defineI18nUI } from 'fumadocs-ui/i18n'
import { useEffect, type ReactNode } from 'react'

import { i18n, localeLabels, type DocsLocale } from '@/lib/locales'

const { provider } = defineI18nUI(i18n, {
  translations: {
    'zh-CN': { displayName: localeLabels['zh-CN'], search: '搜索文档', toc: '本页内容', chooseLanguage: '选择语言' },
    'zh-TW': { displayName: localeLabels['zh-TW'], search: '搜尋文件', toc: '本頁內容', chooseLanguage: '選擇語言' },
    en: { displayName: localeLabels.en, search: 'Search docs', toc: 'On this page', chooseLanguage: 'Choose language' },
    ja: { displayName: localeLabels.ja, search: 'ドキュメントを検索', toc: 'このページの内容', chooseLanguage: '言語を選択' },
    ru: { displayName: localeLabels.ru, search: 'Поиск', toc: 'На этой странице', chooseLanguage: 'Выбрать язык' },
    fr: { displayName: localeLabels.fr, search: 'Rechercher', toc: 'Sur cette page', chooseLanguage: 'Choisir la langue' },
    vi: { displayName: localeLabels.vi, search: 'Tìm kiếm', toc: 'Trong trang này', chooseLanguage: 'Chọn ngôn ngữ' },
  },
})

const controlLabels: Record<DocsLocale, { search: string; theme: string; collapse: string; openSidebar: string; closeSidebar: string; navigation: string }> = {
  'zh-CN': { search: '打开搜索', theme: '切换主题', collapse: '折叠侧边栏', openSidebar: '打开侧边栏', closeSidebar: '关闭侧边栏', navigation: '文档导航' },
  'zh-TW': { search: '開啟搜尋', theme: '切換主題', collapse: '收合側邊欄', openSidebar: '開啟側邊欄', closeSidebar: '關閉側邊欄', navigation: '文件導覽' },
  en: { search: 'Open search', theme: 'Toggle theme', collapse: 'Collapse sidebar', openSidebar: 'Open sidebar', closeSidebar: 'Close sidebar', navigation: 'Documentation navigation' },
  ja: { search: '検索を開く', theme: 'テーマを切り替える', collapse: 'サイドバーを折りたたむ', openSidebar: 'サイドバーを開く', closeSidebar: 'サイドバーを閉じる', navigation: 'ドキュメントナビゲーション' },
  ru: { search: 'Открыть поиск', theme: 'Переключить тему', collapse: 'Свернуть боковую панель', openSidebar: 'Открыть боковую панель', closeSidebar: 'Закрыть боковую панель', navigation: 'Навигация по документации' },
  fr: { search: 'Ouvrir la recherche', theme: 'Changer de thème', collapse: 'Réduire la barre latérale', openSidebar: 'Ouvrir la barre latérale', closeSidebar: 'Fermer la barre latérale', navigation: 'Navigation de la documentation' },
  vi: { search: 'Mở tìm kiếm', theme: 'Đổi giao diện', collapse: 'Thu gọn thanh bên', openSidebar: 'Mở thanh bên', closeSidebar: 'Đóng thanh bên', navigation: 'Điều hướng tài liệu' },
}

const sidebarTriggerLabels = ['Open Sidebar', ...Object.values(controlLabels).flatMap((labels) => [labels.openSidebar, labels.closeSidebar])]

function LocalizedFrameworkLabels({ locale }: { locale: DocsLocale }) {
  useEffect(() => {
    const labels = controlLabels[locale]
    let wasOpen = false
    let opener: HTMLElement | null = null
    const apply = () => {
      document.querySelectorAll<HTMLElement>('[data-search]').forEach((element) => element.setAttribute('aria-label', labels.search))
      document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((element) => element.setAttribute('aria-label', labels.theme))
      document.querySelectorAll<HTMLElement>('button[data-collapsed]').forEach((element) => element.setAttribute('aria-label', labels.collapse))
      const selector = sidebarTriggerLabels.map((label) => `button[aria-label="${label}"]`).join(',')
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => element.setAttribute('aria-label', labels.openSidebar))
      const mobileSidebar = document.querySelector<HTMLElement>('#nd-sidebar-mobile')
      const isOpen = mobileSidebar?.dataset.state === 'open'
      const page = document.querySelector<HTMLElement>('#nd-page')
      const subnav = document.querySelector<HTMLElement>('#nd-subnav')
      if (mobileSidebar && isOpen) {
        mobileSidebar.setAttribute('role', 'dialog')
        mobileSidebar.setAttribute('aria-modal', 'true')
        mobileSidebar.setAttribute('aria-label', labels.navigation)
        mobileSidebar.querySelectorAll<HTMLElement>(selector).forEach((element) => element.setAttribute('aria-label', labels.closeSidebar))
        if (page) page.inert = true
        if (subnav) subnav.inert = true
        if (!wasOpen) {
          opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
          window.requestAnimationFrame(() => mobileSidebar.querySelector<HTMLElement>('a, button')?.focus())
        }
      } else {
        if (page) page.inert = false
        if (subnav) subnav.inert = false
        if (wasOpen) window.requestAnimationFrame(() => opener?.focus())
      }
      wasOpen = Boolean(isOpen)
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-state'], childList: true, subtree: true })
    return () => observer.disconnect()
  }, [locale])
  return null
}

export function DocsProvider({
  children,
  locale,
}: {
  children: ReactNode
  locale: DocsLocale
}) {
  return (
    <RootProvider
      i18n={provider(locale)}
      theme={{ attribute: ['class', 'data-theme'], storageKey: 'partokens-theme', defaultTheme: 'system', enableSystem: true }}
    >
      <LocalizedFrameworkLabels locale={locale} />
      {children}
    </RootProvider>
  )
}
