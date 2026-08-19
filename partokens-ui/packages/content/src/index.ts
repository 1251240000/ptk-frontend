import type { AppLocale } from '@partokens/i18n'

import aboutConfig from '../../../config/public-content/about.json'
import manifestConfig from '../../../config/public-content/manifest.json'
import noticesConfig from '../../../config/public-content/notices.json'
import privacyPolicyConfig from '../../../config/public-content/legal/privacy-policy.json'
import serviceAgreementConfig from '../../../config/public-content/legal/service-agreement.json'
import systemConfig from '../../../config/public-content/system.json'
import userAgreementConfig from '../../../config/public-content/legal/user-agreement.json'
import {
  getCurrentNotice as getConfiguredCurrentNotice,
  getLegalDocument as getConfiguredLegalDocument,
  getLocaleContent as getConfiguredLocaleContent,
  type LegalKind,
  type PublicContentAbout,
  type PublicContentLegal,
  type PublicContentManifest,
  type PublicContentNotices,
  type PublicContentSnapshot,
  type PublicContentSystem,
} from './public-config'

export type { LegalDocument, LegalKind, LegalSection, LocaleContent, PublicNotice, ReviewState } from './public-config'

export const embeddedPublicContent: PublicContentSnapshot = {
  manifest: manifestConfig as PublicContentManifest,
  system: systemConfig as PublicContentSystem,
  about: aboutConfig as PublicContentAbout,
  notices: noticesConfig as PublicContentNotices,
  legal: {
    'user-agreement': userAgreementConfig as PublicContentLegal,
    'service-agreement': serviceAgreementConfig as PublicContentLegal,
    'privacy-policy': privacyPolicyConfig as PublicContentLegal,
  },
}

export const brandLogoUrl = embeddedPublicContent.system.brandLogoUrl

export function getLocaleContent(locale: AppLocale) {
  return getConfiguredLocaleContent(locale, embeddedPublicContent)
}

export function getLegalDocument(locale: AppLocale, kind: LegalKind) {
  return getConfiguredLegalDocument(locale, kind, embeddedPublicContent)
}

export function getCurrentNotice(locale: AppLocale) {
  return getConfiguredCurrentNotice(locale, embeddedPublicContent)
}
