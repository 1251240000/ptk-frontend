import { useParams } from '@tanstack/react-router'
import { FileCheck2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getLegalDocument, getLocaleContent, type LegalKind } from '@partokens/content'
import { isAppLocale } from '@partokens/i18n'

import { PageHeader } from '@/components/ui'

export function AboutPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const content = getLocaleContent(locale)
  return (
    <main className="content-page prose-page">
      <PageHeader eyebrow={t('About Partokens')} title={content.aboutTitle} description={content.aboutLead} />
      <section className="prose-band"><p>{content.aboutBody}</p></section>
      <section className="about-principles">
        <div><span>01</span><h2>{t('Visible state')}</h2><p>{t('Availability, quota, and billing belong beside the action they affect.')}</p></div>
        <div><span>02</span><h2>{t('Compatible access')}</h2><p>{t('Existing clients work through one consistent API boundary.')}</p></div>
        <div><span>03</span><h2>{t('Independent UI')}</h2><p>{t('User experience can evolve without modifying the New API source.')}</p></div>
      </section>
    </main>
  )
}

export function LegalPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string; kind?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const allowed: LegalKind[] = ['user-agreement', 'service-agreement', 'privacy-policy']
  const kind = allowed.includes(params.kind as LegalKind) ? params.kind as LegalKind : 'service-agreement'
  const document = getLegalDocument(locale, kind)

  return (
    <main className="content-page prose-page legal-page">
      <PageHeader eyebrow={t('Legal draft')} title={document.title} description={document.summary} />
      <div className="legal-meta"><span><FileCheck2 size={15} />{t('Draft content')}</span><span>{t('Effective date')}: {document.effectiveDate}</span><span>{t('Owner review required')}</span></div>
      <article className="legal-document">
        {document.sections.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      </article>
    </main>
  )
}
