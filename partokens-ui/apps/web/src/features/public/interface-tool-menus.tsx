import { Check, Globe2, Moon, Sun } from 'lucide-react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@partokens/design-system/components'
import { localeLabels, locales, type AppLocale } from '@partokens/i18n'

export type InterfaceTheme = 'light' | 'dark'

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
  onTheme: () => void
  t: (key: string) => string
}

export function InterfaceLanguageMenu({ locale, onLocale, t, buttonClassName = '', contentClassName = '' }: LanguageMenuProps) {
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className={`${buttonClassName} rounded-full`} aria-label={t('Language')} title={t('Language')}><Globe2 /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={`w-44 ${contentClassName}`}>
      <DropdownMenuLabel className="text-xs text-muted-foreground">{t('Language')}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {locales.map((item) => <DropdownMenuItem key={item} onSelect={() => onLocale(item)}>{localeLabels[item]}<Check className={locale === item ? 'ms-auto' : 'ms-auto invisible'} /></DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>
}

export function InterfaceThemeMenu({ theme, onTheme, t, buttonClassName = '', contentClassName = '' }: ThemeMenuProps) {
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className={`${buttonClassName} relative rounded-full`} aria-label={t('Theme')} title={t('Theme')}>
        <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={`w-44 ${contentClassName}`}>
      <DropdownMenuLabel className="text-xs text-muted-foreground">{t('Theme')}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => theme === 'dark' && onTheme()}>{t('Light mode')}<Check className={theme === 'light' ? 'ms-auto' : 'ms-auto invisible'} /></DropdownMenuItem>
      <DropdownMenuItem onSelect={() => theme === 'light' && onTheme()}>{t('Dark mode')}<Check className={theme === 'dark' ? 'ms-auto' : 'ms-auto invisible'} /></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
}
