'use client'

import { Globe2, Monitor, Moon, Sun } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@partokens/design-system/components'

import { localeLabels, locales, type DocsLocale } from '@/lib/locales'

type ThemeMode = 'light' | 'dark' | 'system'

const menuCopy: Record<DocsLocale, { language: string; theme: string; light: string; dark: string; system: string }> = {
  'zh-CN': { language: '语言', theme: '主题', light: '浅色模式', dark: '深色模式', system: '跟随系统' },
  'zh-TW': { language: '語言', theme: '主題', light: '淺色模式', dark: '深色模式', system: '跟隨系統' },
  en: { language: 'Language', theme: 'Theme', light: 'Light mode', dark: 'Dark mode', system: 'System mode' },
  ja: { language: '言語', theme: 'テーマ', light: 'ライトモード', dark: 'ダークモード', system: 'システム設定' },
  ru: { language: 'Язык', theme: 'Тема', light: 'Светлая тема', dark: 'Тёмная тема', system: 'Системная тема' },
  fr: { language: 'Langue', theme: 'Thème', light: 'Mode clair', dark: 'Mode sombre', system: 'Mode système' },
  vi: { language: 'Ngôn ngữ', theme: 'Chủ đề', light: 'Chế độ sáng', dark: 'Chế độ tối', system: 'Theo hệ thống' },
}

function LanguageMenu({ locale }: { locale: DocsLocale }) {
  const pathname = usePathname()
  const copy = menuCopy[locale]

  const changeLocale = (nextLocale: DocsLocale) => {
    const segments = pathname.split('/')
    if (segments[1] && locales.includes(segments[1] as DocsLocale)) segments[1] = nextLocale
    window.localStorage.setItem('partokens-locale', nextLocale)
    window.location.assign(`${segments.join('/') || `/${nextLocale}/docs`}${window.location.search}${window.location.hash}`)
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={copy.language} title={copy.language}>
          <Globe2 aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="pt-interface-menu w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{copy.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => changeLocale(value as DocsLocale)}>
          {locales.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>{localeLabels[option]}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeMenu({ locale }: { locale: DocsLocale }) {
  const { theme, setTheme } = useTheme()
  const copy = menuCopy[locale]
  const selectedTheme: ThemeMode = theme === 'light' || theme === 'dark' ? theme : 'system'
  const options = [
    { value: 'light' as const, label: copy.light, icon: Sun },
    { value: 'dark' as const, label: copy.dark, icon: Moon },
    { value: 'system' as const, label: copy.system, icon: Monitor },
  ]

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={copy.theme} title={copy.theme}>
          <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="pt-interface-menu w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{copy.theme}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={selectedTheme} onValueChange={setTheme}>
          {options.map((option) => {
            const Icon = option.icon
            return <DropdownMenuRadioItem key={option.value} value={option.value}><Icon />{option.label}</DropdownMenuRadioItem>
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function InterfaceToolMenus({ locale }: { locale: DocsLocale }) {
  return <div className="flex items-center gap-1"><LanguageMenu locale={locale} /><ThemeMenu locale={locale} /></div>
}
