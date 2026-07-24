import { AlertTriangle, ArrowLeft, ArrowRight, CircleCheck, KeyRound, Layers3 } from 'lucide-react'
import Link from 'next/link'

import {
  apiDefinitions,
  getFieldDescription,
  getPageCopy,
  getPageDefinition,
  pageDefinitions,
  uiCopy,
  type ApiPageId,
  type PageId,
} from '@/content/catalog'
import { docsPath, type DocsLocale } from '@/lib/locales'
import { CopyCode } from './copy-code'

function CodeBlock({ code, locale }: { code: string; locale: DocsLocale }) {
  const ui = uiCopy[locale]
  return (
    <div className="docs-code-block">
      <div className="docs-code-toolbar">
        <span>HTTPS</span>
        <CopyCode code={code} label={ui.copy} copiedLabel={ui.copied} />
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}

function OnThisPage({ locale, sections }: { locale: DocsLocale; sections: Array<{ id: string; title: string }> }) {
  return (
    <aside className="docs-page-rail" aria-label={uiCopy[locale].onThisPage}>
      <span>{uiCopy[locale].onThisPage}</span>
      {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
    </aside>
  )
}

function PageFooter({ locale, pageId }: { locale: DocsLocale; pageId: PageId }) {
  const index = pageDefinitions.findIndex((page) => page.id === pageId)
  const previous = pageDefinitions[index - 1]
  const next = pageDefinitions[index + 1]
  const ui = uiCopy[locale]
  return (
    <footer className="docs-page-footer">
      <span className="docs-review-state">{ui.translationStatus}</span>
      <nav aria-label={`${ui.previous} / ${ui.next}`}>
        {previous ? <Link href={docsPath(locale, previous.slug)}><ArrowLeft size={15} /><span><small>{ui.previous}</small>{getPageCopy(locale, previous.id).title}</span></Link> : <span />}
        {next ? <Link href={docsPath(locale, next.slug)}><span><small>{ui.next}</small>{getPageCopy(locale, next.id).title}</span><ArrowRight size={15} /></Link> : null}
      </nav>
    </footer>
  )
}

function GuideDocument({ locale, pageId }: { locale: DocsLocale; pageId: Exclude<PageId, `api-${string}`> }) {
  const copy = getPageCopy(locale, pageId)
  const ui = uiCopy[locale]
  return (
    <div className="docs-document-grid">
      <div className="docs-document-body">
        {pageId === 'overview' ? (
          <div className="request-track" aria-label={copy.sections[0]?.title}>
            <span><b>01</b><KeyRound size={17} />{ui.createKey}</span>
            <span><b>02</b><Layers3 size={17} />{ui.openModels}</span>
            <span><b>03</b><CircleCheck size={17} />HTTPS 200</span>
          </div>
        ) : null}
        {copy.sections.map((section) => (
          <section key={section.id} id={section.id} className={`docs-prose-section ${section.tone ? `is-${section.tone}` : ''}`}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
            {section.code ? <CodeBlock code={section.code} locale={locale} /> : null}
          </section>
        ))}
        <PageFooter locale={locale} pageId={pageId} />
      </div>
      <OnThisPage locale={locale} sections={copy.sections} />
    </div>
  )
}

function ApiDocument({ locale, pageId }: { locale: DocsLocale; pageId: ApiPageId }) {
  const api = apiDefinitions[pageId]
  const ui = uiCopy[locale]
  const sections = [
    { id: 'endpoint', title: ui.endpoint },
    ...(api.fields.length ? [{ id: 'request-fields', title: ui.requestFields }] : []),
    { id: 'example-request', title: ui.exampleRequest },
    { id: 'example-response', title: ui.exampleResponse },
    { id: 'response-notes', title: ui.responseNotes },
  ]

  return (
    <div className="docs-document-grid">
      <div className="docs-document-body">
        <section id="endpoint" className="api-route-panel">
          <div><span>{ui.method}</span><strong className={`http-method method-${api.method.toLowerCase()}`}>{api.method}</strong></div>
          <div><span>{ui.endpoint}</span><code>{api.path}</code></div>
          <div><span>{ui.authentication}</span><strong>{ui.bearerKey}</strong></div>
        </section>

        {api.fields.length ? (
          <section id="request-fields" className="docs-prose-section">
            <h2>{ui.requestFields}</h2>
            <div className="api-field-table" role="table" aria-label={ui.requestFields}>
              <div className="api-field-row api-field-head" role="row">
                <span role="columnheader">{ui.field}</span><span role="columnheader">{ui.type}</span><span role="columnheader">{ui.required}</span><span role="columnheader">{ui.description}</span>
              </div>
              {api.fields.map((field) => (
                <div key={field.name} className="api-field-row" role="row">
                  <code role="cell">{field.name}</code><span role="cell">{field.type}</span><span role="cell">{field.required ? ui.yes : ui.no}</span><p role="cell">{getFieldDescription(locale, field.descriptionId)}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section id="example-request" className="docs-prose-section"><h2>{ui.exampleRequest}</h2><CodeBlock code={api.requestExample} locale={locale} /></section>
        <section id="example-response" className="docs-prose-section"><h2>{ui.exampleResponse}</h2><CodeBlock code={api.responseExample} locale={locale} /></section>
        <section id="response-notes" className="docs-prose-section is-note"><h2>{ui.responseNotes}</h2><p>{api.responseNotes[locale]}</p><p>{ui.availabilityNote}</p></section>
        <PageFooter locale={locale} pageId={pageId} />
      </div>
      <OnThisPage locale={locale} sections={sections} />
    </div>
  )
}

export function DocumentContent({ locale, pageId }: { locale: DocsLocale; pageId: PageId }) {
  const page = getPageDefinition(pageId)
  const ui = uiCopy[locale]
  return (
    <>
      {locale === 'zh-CN' ? null : (
        <div className="translation-review-note" role="note">
          <AlertTriangle size={16} />
          <span><strong>{ui.sourceDraft}</strong>{ui.sourceDraftDescription}</span>
        </div>
      )}
      {page.kind === 'api' ? <ApiDocument locale={locale} pageId={pageId as ApiPageId} /> : <GuideDocument locale={locale} pageId={pageId as Exclude<PageId, `api-${string}`>} />}
    </>
  )
}
