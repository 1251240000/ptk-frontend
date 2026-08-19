import type { AppLocale } from '@partokens/i18n'

export type ReviewState = 'draft' | 'reviewed'
export type LegalKind = 'user-agreement' | 'service-agreement' | 'privacy-policy'
export type LegalSection = { title: string; paragraphs: string[] }
export type LegalDocument = {
  kind: LegalKind
  version: string
  title: string
  summary: string
  effectiveDate: string
  reviewState: ReviewState
  sections: LegalSection[]
}
export type LocaleContent = { aboutTitle: string; aboutLead: string; aboutBody: string }
export type PublicNotice = {
  id: string
  version: string
  publishedAt: string
  releaseLabel: string
  enabled: boolean
  title: string
  body: string
  highlights: string[]
}

type LocalizedAbout = { title: string; lead: string; body: string }
type LocalizedNotice = { title: string; body: string; highlights: string[] }
type LocalizedPolicy = { title: string; body: string }
type LocalizedLegal = { title: string; summary: string; sections: LegalSection[] }

export type PublicContentManifest = {
  schemaVersion: 1
  revision: string
  updatedAt: string
  files: Record<'system' | 'about' | 'notices' | LegalKind, string>
}
export type PublicContentSystem = {
  schemaVersion: 1
  brandName: string
  brandLogoUrl: string
  defaultLocale: AppLocale
  supportedLocales: AppLocale[]
  contentFallbackLocale: AppLocale
}
export type PublicContentAbout = { schemaVersion: 1; locales: Record<AppLocale, LocalizedAbout> }
export type PublicContentNotices = {
  schemaVersion: 1
  currentNoticeId: string
  notices: Array<{
    id: string
    version: string
    publishedAt: string
    releaseLabel: string
    enabled: boolean
    locales: Record<AppLocale, LocalizedNotice>
  }>
  policy: Record<AppLocale, LocalizedPolicy>
}
export type PublicContentLegal = {
  schemaVersion: 1
  kind: LegalKind
  version: string
  effectiveDate: string
  reviewState: ReviewState
  locales: Record<AppLocale, LocalizedLegal>
}
export type PublicContentSnapshot = {
  manifest: PublicContentManifest
  system: PublicContentSystem
  about: PublicContentAbout
  notices: PublicContentNotices
  legal: Record<LegalKind, PublicContentLegal>
}

function localeValue<T>(values: Record<AppLocale, T>, locale: AppLocale, source: PublicContentSnapshot): T {
  return values[locale] ?? values[source.system.contentFallbackLocale]
}

export function getLocaleContent(locale: AppLocale, source: PublicContentSnapshot): LocaleContent {
  const about = localeValue(source.about.locales, locale, source)
  return { aboutTitle: about.title, aboutLead: about.lead, aboutBody: about.body }
}

export function getLegalDocument(locale: AppLocale, kind: LegalKind, source: PublicContentSnapshot): LegalDocument {
  const config = source.legal[kind]
  return {
    kind,
    version: config.version,
    effectiveDate: config.effectiveDate,
    reviewState: config.reviewState,
    ...localeValue(config.locales, locale, source),
  }
}

export function getCurrentNotice(locale: AppLocale, source: PublicContentSnapshot): PublicNotice {
  const notice = source.notices.notices.find((item) => item.id === source.notices.currentNoticeId && item.enabled)
  if (!notice) throw new Error('Public content does not define an enabled current notice')
  return { ...notice, ...localeValue(notice.locales, locale, source) }
}

export function getNoticePolicy(locale: AppLocale, source: PublicContentSnapshot): LocalizedPolicy {
  return localeValue(source.notices.policy, locale, source)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertRuntimeSnapshot(source: PublicContentSnapshot): PublicContentSnapshot {
  if (source.manifest.schemaVersion !== 1 || source.system.schemaVersion !== 1 || source.about.schemaVersion !== 1 || source.notices.schemaVersion !== 1) {
    throw new Error('Unsupported public-content schema version')
  }
  if (!source.system.supportedLocales.includes(source.system.contentFallbackLocale)) throw new Error('Invalid public-content fallback locale')
  for (const locale of source.system.supportedLocales) {
    if (!source.about.locales[locale] || !source.notices.policy[locale]) throw new Error(`Public content is missing locale ${locale}`)
  }
  for (const kind of ['user-agreement', 'service-agreement', 'privacy-policy'] as const) {
    const legal = source.legal[kind]
    if (legal.schemaVersion !== 1 || legal.kind !== kind) throw new Error(`Invalid public-content legal document: ${kind}`)
  }
  getCurrentNotice(source.system.contentFallbackLocale, source)
  return source
}

function contentUrl(baseUrl: string, relativePath: string): string {
  if (!/^(?:legal\/)?[a-z0-9-]+\.json$/.test(relativePath)) throw new Error(`Invalid public-content path: ${relativePath}`)
  return `${baseUrl.replace(/\/$/, '')}/${relativePath}`
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', signal })
  if (!response.ok) throw new Error(`Unable to load public content (${response.status}): ${url}`)
  return response.json() as Promise<T>
}

export async function loadPublicContent(baseUrl = '/public-content', signal?: AbortSignal): Promise<PublicContentSnapshot> {
  const manifest = await fetchJson<PublicContentManifest>(`${baseUrl.replace(/\/$/, '')}/manifest.json`, signal)
  if (!isObject(manifest.files)) throw new Error('Public-content manifest has no file map')
  const [system, about, notices, userAgreement, serviceAgreement, privacyPolicy] = await Promise.all([
    fetchJson<PublicContentSystem>(contentUrl(baseUrl, manifest.files.system), signal),
    fetchJson<PublicContentAbout>(contentUrl(baseUrl, manifest.files.about), signal),
    fetchJson<PublicContentNotices>(contentUrl(baseUrl, manifest.files.notices), signal),
    fetchJson<PublicContentLegal>(contentUrl(baseUrl, manifest.files['user-agreement']), signal),
    fetchJson<PublicContentLegal>(contentUrl(baseUrl, manifest.files['service-agreement']), signal),
    fetchJson<PublicContentLegal>(contentUrl(baseUrl, manifest.files['privacy-policy']), signal),
  ])
  return assertRuntimeSnapshot({
    manifest,
    system,
    about,
    notices,
    legal: { 'user-agreement': userAgreement, 'service-agreement': serviceAgreement, 'privacy-policy': privacyPolicy },
  })
}
