import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { defaultLocale, isAppLocale, resolvePreferredLocale, resources } from '@partokens/i18n'

const pathLocale = typeof window === 'undefined' ? undefined : window.location.pathname.split('/').filter(Boolean)[0]
let initialLocale = defaultLocale
if (isAppLocale(pathLocale)) initialLocale = pathLocale
else {
  try { initialLocale = resolvePreferredLocale() }
  catch { initialLocale = defaultLocale }
}

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
  debug: false,
  showSupportNotice: false,
})

export { i18n }
