import { Check, CircleDotDashed, Route, Server, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function RequestTrace({ online, version }: { online: boolean; version?: string }) {
  const { t } = useTranslation()
  return (
    <div className="request-trace" aria-label={t('Live request trace')}>
      <div className="trace-grid" />
      <div className="trace-meta trace-meta-left">
        <span className={online ? 'status-dot healthy' : 'status-dot pending'} />
        {online ? t('API connected') : t('Status pending')}
      </div>
      <div className="trace-meta trace-meta-right">{version || 'NEW API'}</div>
      <div className="trace-path trace-path-main">
        <span className="trace-pulse" />
      </div>
      <div className="trace-path trace-path-branch-a" />
      <div className="trace-path trace-path-branch-b" />
      <div className="trace-node trace-node-client">
        <CircleDotDashed size={17} />
        <div><small>{t('Request')}</small><strong>{t('OpenAI client')}</strong></div>
      </div>
      <div className="trace-node trace-node-gateway">
        <Route size={17} />
        <div><small>{t('Route')}</small><strong>{t('Partokens gateway')}</strong></div>
      </div>
      <div className="trace-node trace-node-model-a">
        <Sparkles size={17} />
        <div><small>{t('Model')}</small><strong>{t('Selected provider')}</strong></div>
      </div>
      <div className="trace-node trace-node-model-b">
        <Server size={17} />
        <div><small>{t('Fallback')}</small><strong>{t('Available route')}</strong></div>
      </div>
      <div className="trace-node trace-node-response">
        <Check size={17} />
        <div><small>{t('Result')}</small><strong>{t('Usage recorded')}</strong></div>
      </div>
    </div>
  )
}
