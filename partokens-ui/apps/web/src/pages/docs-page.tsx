import { Check, Clipboard, ExternalLink, KeyRound, TerminalSquare } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from '@tanstack/react-router'

import { PageHeader } from '@/components/ui'
import { localizedUserPath } from '@/lib/routes'

const requestExample = `curl https://partokens.com/v1/chat/completions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-model","messages":[{"role":"user","content":"Hello"}]}'`

export function DocsPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(requestExample)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="content-page public-content-page docs-layout">
      <aside className="docs-sidebar">
        <strong>{t('Quick start')}</strong>
        <a href="#base-url">{t('Base URL')}</a>
        <a href="#authentication">{t('Authentication')}</a>
        <a href="#first-request">{t('First request')}</a>
        <span>{t('API reference')}</span>
        <a href="#chat">{t('Chat completions')}</a>
        <a href="#images">{t('Images')}</a>
      </aside>
      <article className="docs-article">
        <PageHeader eyebrow={t('Partokens API')} title={t('Docs')} description={t('Start with an API key and one compatible request.')} />
        <section id="base-url" className="docs-section"><span className="docs-step">01</span><div><h2>{t('Base URL')}</h2><p>{t('Use the Partokens compatible endpoint in clients that support a custom OpenAI base URL.')}</p><code className="inline-code">https://partokens.com/v1</code></div></section>
        <section id="authentication" className="docs-section"><span className="docs-step">02</span><div><h2>{t('Authentication')}</h2><p>{t('Create a scoped API key in the console and send it as a Bearer token.')}</p><a className="text-link" href={localizedUserPath(params.locale, '/console/keys')}><KeyRound size={15} />{t('Create a key')}<ExternalLink size={13} /></a></div></section>
        <section id="first-request" className="docs-section"><span className="docs-step">03</span><div className="docs-code-wrap"><h2>{t('First request')}</h2><p>{t('Replace the model name with one available to your account group.')}</p><button className="code-copy" type="button" onClick={() => void copy()} aria-label={t('Copy request')}>{copied ? <Check size={16} /> : <Clipboard size={16} />}</button><pre className="code-surface"><code>{requestExample}</code></pre></div></section>
        <section className="docs-section docs-reference"><TerminalSquare size={20} /><div><h2>{t('Full reference')}</h2><p>{t('API response fields follow the OpenAI-compatible schema for each endpoint.')}</p></div></section>
      </article>
    </main>
  )
}
