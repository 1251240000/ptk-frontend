import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { defaultLocale, resources } from '@partokens/i18n'

void i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
  debug: false,
  showSupportNotice: false,
})

export { i18n }
