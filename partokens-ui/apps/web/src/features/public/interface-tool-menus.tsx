import { Globe2, Monitor, Moon, Sun } from 'lucide-react'

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
import { localeLabels, locales, type AppLocale } from '@partokens/i18n'

export type InterfaceTheme = 'light' | 'dark' | 'system'

type MenuStyleProps = {
  buttonClassName?: string
  contentClassName?: string
}

type LanguageMenuProps = MenuStyleProps & {
  locale: AppLocale
  onLocale: (locale: AppLocale) => void
  t: (key: string) => string
}

type ThemeMenuProps = MenuStyleProps & {
  theme: InterfaceTheme
  onTheme?: () => void
  onThemeChange?: (theme: InterfaceTheme) => void
  includeSystem?: boolean
  t: (key: string) => string
}

export function InterfaceLanguageMenu({ locale, onLocale, t, buttonClassName = '', contentClassName = '' }: LanguageMenuProps) {
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className={`${buttonClassName} rounded-full`} aria-label={t('Language')} title={t('Language')}><Globe2 /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={`pt-interface-menu w-44 ${contentClassName}`}>
      <DropdownMenuLabel className="text-xs text-muted-foreground">{t('Language')}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={locale} onValueChange={(value) => { if (locales.includes(value as AppLocale)) onLocale(value as AppLocale) }}>
        {locales.map((item) => <DropdownMenuRadioItem key={item} value={item}>{localeLabels[item]}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
}

export function InterfaceThemeMenu({ theme, onTheme, onThemeChange, includeSystem = false, t, buttonClassName = '', contentClassName = '' }: ThemeMenuProps) {
  const options: Array<{ value: InterfaceTheme; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Light mode', icon: Sun },
    { value: 'dark', label: 'Dark mode', icon: Moon },
    ...(includeSystem ? [{ value: 'system' as const, label: 'System mode', icon: Monitor }] : []),
  ]
  const selectTheme = (nextTheme: InterfaceTheme) => {
    if (nextTheme === theme) return
    if (onThemeChange) onThemeChange(nextTheme)
    else onTheme?.()
  }

  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className={`${buttonClassName} relative rounded-full`} aria-label={t('Theme')} title={t('Theme')}>
        <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={`pt-interface-menu w-44 ${contentClassName}`}>
      <DropdownMenuLabel className="text-xs text-muted-foreground">{t('Theme')}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={theme} onValueChange={(value) => selectTheme(value as InterfaceTheme)}>
        {options.map((option) => {
          const Icon = option.icon
          return <DropdownMenuRadioItem key={option.value} value={option.value}><Icon />{t(option.label)}</DropdownMenuRadioItem>
        })}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
}
