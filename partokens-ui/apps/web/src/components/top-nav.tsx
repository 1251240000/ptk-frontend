import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from '@tanstack/react-router'
import { Bell, Code2, Languages, Menu, Monitor, Moon, Sun, UserCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getCurrentNotice } from '@partokens/content'
import { isAppLocale, localeLabels, locales, type AppLocale } from '@partokens/i18n'

import { usePreferenceStore, type ThemeMode } from '@/stores/preferences'
import { publicSourceUrl } from '@/lib/release'
import { useSessionStore } from '@/stores/session'
import { Brand } from './brand'
import { IconButton } from './ui'

function localizedPath(locale: AppLocale, path = '') {
  return `/${locale}${path}`
}

const themeOptions: Array<{ value: ThemeMode; icon: typeof Sun; label: string }> = [
  { value: 'light', icon: Sun, label: 'Light mode' },
  { value: 'dark', icon: Moon, label: 'Dark mode' },
  { value: 'system', icon: Monitor, label: 'System mode' },
]

export function TopNav() {
  const { t, i18n } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const pathname = useLocation({ select: (state) => state.pathname })
  const navigate = useNavigate()
  const { theme, setTheme, noticeOpen, setNoticeOpen } = usePreferenceStore()
  const { user } = useSessionStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const notice = getCurrentNotice(locale)

  useEffect(() => setMobileOpen(false), [pathname])

  const links = useMemo(() => [
    { label: t('Home'), href: localizedPath(locale, '/') },
    { label: t('Console'), href: localizedPath(locale, '/console/overview') },
    { label: t('Models'), href: localizedPath(locale, '/models') },
    { label: t('Docs'), href: localizedPath(locale, '/docs') },
    { label: t('About'), href: localizedPath(locale, '/about') },
  ], [locale, t])

  const currentTheme = themeOptions.find((option) => option.value === theme) ?? themeOptions[2]!
  const ThemeIcon = currentTheme.icon

  const cycleTheme = () => {
    const index = themeOptions.findIndex((option) => option.value === theme)
    setTheme(themeOptions[(index + 1) % themeOptions.length]?.value ?? 'system')
  }

  const changeLocale = async (nextLocale: AppLocale) => {
    window.localStorage.setItem('partokens-locale', nextLocale)
    await i18n.changeLanguage(nextLocale)
    const segments = pathname.split('/').filter(Boolean)
    if (isAppLocale(segments[0])) segments[0] = nextLocale
    else segments.unshift(nextLocale)
    await navigate({ to: `/${segments.join('/')}` as never })
  }

  return (
    <>
      <header className="top-nav">
        <a href={localizedPath(locale, '/')} className="brand-link" aria-label={`Partokens - ${t('Home')}`}><Brand /></a>
        <nav className="top-nav-links" aria-label={t('Primary navigation')}>
          {links.map((link) => (
            <a key={link.href} href={link.href} className={pathname === link.href || (link.href !== `/${locale}/` && pathname.startsWith(link.href)) ? 'active' : ''}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="top-nav-actions">
          <div className="select-control compact-select">
            <Languages size={16} aria-hidden="true" />
            <select aria-label={t('Language')} value={locale} onChange={(event) => void changeLocale(event.target.value as AppLocale)}>
              {locales.map((id) => <option key={id} value={id}>{localeLabels[id]}</option>)}
            </select>
          </div>
          <IconButton label={t(currentTheme.label)} onClick={cycleTheme}><ThemeIcon size={18} /></IconButton>
          <IconButton label={t('Notices')} aria-expanded={noticeOpen} aria-controls="notice-panel" onClick={() => setNoticeOpen(!noticeOpen)} className={noticeOpen ? 'active' : ''}>
            <Bell size={18} />
            <span className="notification-dot" />
          </IconButton>
          {publicSourceUrl ? <a className="source-code-button" href={publicSourceUrl} target="_blank" rel="noopener noreferrer" aria-label={t('Source code')} title={t('Source code')}><Code2 size={18} /></a> : null}
          <a className="account-button" href={user ? localizedPath(locale, '/console/profile') : localizedPath(locale, '/auth/sign-in')}>
            <UserCircle size={18} />
            <span>{user?.display_name || user?.username || t('Sign in')}</span>
          </a>
          <IconButton label={t('Menu')} aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="mobile-menu-button" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </IconButton>
        </div>
      </header>
      {mobileOpen ? (
        <nav id="mobile-navigation" className="mobile-nav-sheet" aria-label={t('Mobile navigation')}>
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          {publicSourceUrl ? <a href={publicSourceUrl} target="_blank" rel="noopener noreferrer"><Code2 size={16} />{t('Source code')}</a> : null}
          <a href={user ? localizedPath(locale, '/console/profile') : localizedPath(locale, '/auth/sign-in')}>{user?.display_name || user?.username || t('Sign in')}</a>
        </nav>
      ) : null}
      {noticeOpen ? (
        <aside id="notice-panel" className="notice-panel" aria-label={t('Notices')}>
          <div className="notice-panel-header">
            <div><span className="eyebrow">{notice.version}</span><h2>{notice.title}</h2></div>
            <IconButton label={t('Close')} onClick={() => setNoticeOpen(false)}><X size={18} /></IconButton>
          </div>
          <p>{notice.body}</p>
          <time dateTime="2026-07-20">2026-07-20</time>
        </aside>
      ) : null}
    </>
  )
}
