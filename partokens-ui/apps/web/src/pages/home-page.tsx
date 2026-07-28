import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Braces, CircleDollarSign, Gauge, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getStatus } from '@partokens/api-client'
import { isAppLocale } from '@partokens/i18n'
import { useParams } from '@tanstack/react-router'

import { RequestTrace } from '@/components/request-trace'
import { canonicalConsolePath } from '@/lib/routes'

export function HomePage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const status = useQuery({ queryKey: ['status'], queryFn: getStatus, staleTime: 60_000 })
  const online = Boolean(status.data?.success)
  const version = status.data?.data.version

  return (
    <main className="public-page">
      <section className="home-hero">
        <RequestTrace online={online} version={version} />
        <div className="hero-content">
          <div className="hero-status"><span className={online ? 'status-dot healthy' : 'status-dot pending'} />{online ? t('Available') : t('Awaiting status')}</div>
          <h1>Partokens</h1>
          <p className="hero-thesis">{t('Model access, measured clearly.')}</p>
          <p className="hero-copy">{t('One endpoint for the models you use, with cost, status, and quota visible before every request.')}</p>
          <div className="hero-actions">
            <a className="button primary-button" href={canonicalConsolePath(locale, 'overview')}>{t('Enter console')}<ArrowRight size={17} /></a>
            <a className="button secondary-button" href={`/${locale}/models`}>{t('Browse models')}</a>
          </div>
        </div>
        <a className="hero-next" href="#readiness"><span>{t('Explore')}</span><ArrowRight size={15} /></a>
      </section>

      <section id="readiness" className="home-band readiness-band">
        <div className="band-heading"><span>{t('Request readiness')}</span><h2>{t('Know the state before the call.')}</h2></div>
        <div className="readiness-steps">
          <div><KeyRound size={19} /><span>01</span><strong>{t('Key')}</strong><p>{t('Scoped access with visible quota and expiry.')}</p></div>
          <div><CircleDollarSign size={19} /><span>02</span><strong>{t('Cost')}</strong><p>{t('Model pricing and multipliers in context.')}</p></div>
          <div><Gauge size={19} /><span>03</span><strong>{t('Route')}</strong><p>{t('Availability and request state without guesswork.')}</p></div>
          <div><Braces size={19} /><span>04</span><strong>{t('Result')}</strong><p>{t('Usage and logs tied back to the request.')}</p></div>
        </div>
      </section>

      <section className="home-band code-band">
        <div className="band-heading"><span>{t('OpenAI compatible')}</span><h2>{t('Change the base URL. Keep your tools.')}</h2></div>
        <pre className="code-surface"><code><span>curl</span> https://partokens.com/v1/chat/completions \
  -H <em>"Authorization: Bearer $PARTOKENS_API_KEY"</em> \
  -H <em>"Content-Type: application/json"</em> \
  -d <em>'{'{"model":"your-model","messages":[{"role":"user","content":"Hello"}]}'}</em></code></pre>
      </section>
    </main>
  )
}
