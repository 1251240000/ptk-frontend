import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Box, LogIn, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getPricing } from '@partokens/api-client'
import { isAppLocale } from '@partokens/i18n'

import { DataState, PageHeader } from '@/components/ui'
import { extractItems } from '@/lib/format'

type PricingModel = {
  model_name?: string
  model?: string
  vendor_name?: string
  quota_type?: number
  model_ratio?: number
  model_price?: number
  supported_endpoint_types?: string[]
  [key: string]: unknown
}

function responseStatus(error: unknown) {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  return (error as { response?: { status?: number } }).response?.status
}

export function ModelsPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const [query, setQuery] = useState('')
  const [billing, setBilling] = useState('all')
  const [endpoint, setEndpoint] = useState('all')
  const pricing = useQuery({ queryKey: ['pricing'], queryFn: getPricing, retry: false })
  const models = extractItems<PricingModel>(pricing.data?.data)
  const endpoints = useMemo(() => [...new Set(models.flatMap((model) => model.supported_endpoint_types || []))].sort(), [models])
  const pricingRequiresAuth = pricing.isError && responseStatus(pricing.error) === 401
  const filtered = models.filter((item) => {
    const matchesQuery = (item.model_name || item.model || '').toLowerCase().includes(query.toLowerCase())
    const matchesBilling = billing === 'all' || (billing === 'fixed' ? item.quota_type === 1 : item.quota_type !== 1)
    const matchesEndpoint = endpoint === 'all' || item.supported_endpoint_types?.includes(endpoint)
    return matchesQuery && matchesBilling && matchesEndpoint
  })

  return (
    <main className="content-page public-content-page">
      <PageHeader eyebrow={t('Model catalog')} title={t('Models')} description={t('Compare available model routes, capabilities, and billing modes.')} />
      <div className="filter-bar">
        <label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search models')} /></label>
        <div className="model-filter-controls">
          <label><span>{t('Billing')}</span><select aria-label={t('Billing')} value={billing} onChange={(event) => setBilling(event.target.value)}><option value="all">{t('All billing modes')}</option><option value="token">{t('Token based')}</option><option value="fixed">{t('Per call')}</option></select></label>
          <label><span>{t('Endpoint')}</span><select aria-label={t('Endpoint')} value={endpoint} onChange={(event) => setEndpoint(event.target.value)}><option value="all">{t('All endpoints')}</option>{endpoints.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        </div>
      </div>
      {pricingRequiresAuth ? <section className="model-access-state"><LogIn size={20} /><div><h2>{t('Sign in to view model pricing')}</h2><p>{t('This deployment requires an account before showing model pricing.')}</p></div><a className="button primary-button" href={`/${locale}/auth/sign-in`}>{t('Sign in')}</a></section> : <DataState loading={pricing.isLoading} error={pricing.isError ? t('Interface data unavailable') : null} empty={!pricing.isLoading && !pricing.isError && filtered.length === 0} onRetry={() => void pricing.refetch()}>
        <div className="model-list">
          {filtered.map((model, index) => {
            const name = model.model_name || model.model || `Model ${index + 1}`
            return (
              <article className="model-row" key={name}>
                <div className="model-icon"><Box size={18} /></div>
                <div><h2>{name}</h2><p>{model.vendor_name || t('Provider route')}</p></div>
                <div><span>{t('Billing')}</span><strong>{model.quota_type === 1 ? t('Per call') : t('Token based')}</strong></div>
                <div><span>{t('Ratio')}</span><strong>{model.model_ratio ?? model.model_price ?? '—'}</strong></div>
                <div><span>{t('Endpoints')}</span><strong>{model.supported_endpoint_types?.join(', ') || t('Compatible API')}</strong></div>
              </article>
            )
          })}
        </div>
      </DataState>}
    </main>
  )
}
