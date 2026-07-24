import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Check, CircleDollarSign, Copy, CreditCard, Gift, History, LoaderCircle, RefreshCw, Share2, WalletCards, X } from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  calculateTopupAmount,
  getAffiliateCode,
  getBillingHistory,
  getSelfSubscriptions,
  getSubscriptionPlans,
  getTopupInfo,
  redeemTopupCode,
  requestSubscriptionPayment,
  requestTopupPayment,
  transferAffiliateQuota,
  updateSubscriptionPreference,
  type CheckoutEnvelope,
  type SubscriptionPlan,
  type TopupInfo,
  type TopupRecord,
} from '@partokens/api-client'
import { isAppLocale } from '@partokens/i18n'

import { Modal } from '@/components/modal'
import { DataState, Metric, PageHeader } from '@/components/ui'
import { extractItems, formatDate, formatInteger, formatQuota, quotaUnitsToDollars } from '@/lib/format'
import { isConfiguredTopupAmount } from '@/lib/wallet'
import { useSessionStore } from '@/stores/session'

type TopupProvider = 'epay' | 'stripe' | 'creem' | 'waffo' | 'waffo-pancake'
type SubscriptionProvider = 'balance' | 'epay' | 'stripe' | 'creem' | 'waffo-pancake'

type TopupMethod = {
  id: string
  label: string
  provider: TopupProvider
  paymentMethod?: string
  productId?: string
  payMethodIndex?: number
  minimum?: number
}

type PurchaseIntent =
  | { kind: 'topup'; amount: number; method: TopupMethod }
  | { kind: 'subscription'; plan: SubscriptionPlan; provider: SubscriptionProvider; paymentMethod?: string }

function getLocale(value?: string) {
  return isAppLocale(value) ? value : 'zh-CN'
}

function responseMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data
    if (data?.message) return data.message
  }
  return error instanceof Error ? error.message : fallback
}

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const target = new URL(value)
    return target.protocol === 'http:' || target.protocol === 'https:' ? target.toString() : null
  } catch {
    return null
  }
}

function checkoutUrl(response: CheckoutEnvelope): string | null {
  if (typeof response.data === 'string') return safeHttpUrl(response.data)
  return safeHttpUrl(response.data?.pay_link)
    || safeHttpUrl(response.data?.checkout_url)
    || safeHttpUrl(response.data?.payment_url)
    || safeHttpUrl(response.url)
}

function continueCheckout(response: CheckoutEnvelope) {
  const target = checkoutUrl(response)
  if (!target) return false
  if (response.url && typeof response.data === 'object' && response.data) {
    const form = document.createElement('form')
    form.action = target
    form.method = 'POST'
    for (const [key, value] of Object.entries(response.data)) {
      if (value == null || typeof value === 'object') continue
      const field = document.createElement('input')
      field.type = 'hidden'
      field.name = key
      field.value = String(value)
      form.appendChild(field)
    }
    document.body.appendChild(form)
    form.submit()
    form.remove()
    return true
  }
  window.location.assign(target)
  return true
}

function buildTopupMethods(info: TopupInfo | undefined, amount: number | null): TopupMethod[] {
  if (!info || amount == null) return []
  const methods: TopupMethod[] = []
  if (info.enable_online_topup) {
    for (const method of info.pay_methods || []) {
      methods.push({ id: `epay:${method.type}`, label: method.name, provider: 'epay', paymentMethod: method.type, minimum: method.min_topup })
    }
  }
  if (info.enable_stripe_topup) methods.push({ id: 'stripe', label: 'Stripe', provider: 'stripe', minimum: info.stripe_min_topup })
  if (info.enable_creem_topup) {
    for (const product of info.creem_products || []) {
      if (Number(product.price) === amount) methods.push({ id: `creem:${product.productId}`, label: product.name, provider: 'creem', productId: product.productId })
    }
  }
  if (info.enable_waffo_topup) {
    const configured = info.waffo_pay_methods || []
    if (configured.length) configured.forEach((method, index) => methods.push({ id: `waffo:${index}`, label: method.name, provider: 'waffo', payMethodIndex: index, minimum: info.waffo_min_topup }))
    else methods.push({ id: 'waffo', label: 'Waffo', provider: 'waffo', minimum: info.waffo_min_topup })
  }
  if (info.enable_waffo_pancake_topup) methods.push({ id: 'waffo-pancake', label: 'Waffo Pancake', provider: 'waffo-pancake', minimum: info.waffo_pancake_min_topup })
  return methods.filter((method) => !method.minimum || amount >= method.minimum)
}

function subscriptionMethods(plan: SubscriptionPlan, info?: TopupInfo) {
  const methods: Array<{ provider: SubscriptionProvider; label: string; paymentMethod?: string }> = []
  if (plan.allow_balance_pay !== false) methods.push({ provider: 'balance', label: 'Balance' })
  if (info?.enable_stripe_topup && plan.stripe_price_id) methods.push({ provider: 'stripe', label: 'Stripe' })
  if (info?.enable_creem_topup && plan.creem_product_id) methods.push({ provider: 'creem', label: 'Creem' })
  if (info?.enable_waffo_pancake_topup && plan.waffo_pancake_product_id) methods.push({ provider: 'waffo-pancake', label: 'Waffo Pancake' })
  if (info?.enable_online_topup) {
    for (const method of info.pay_methods || []) methods.push({ provider: 'epay', label: method.name, paymentMethod: method.type })
  }
  return methods
}

function formatDuration(plan: SubscriptionPlan, t: (key: string) => string) {
  const value = plan.duration_value || 1
  const unit = t(plan.duration_unit === 'month' ? 'months' : plan.duration_unit === 'year' ? 'years' : plan.duration_unit === 'hour' ? 'hours' : 'days')
  return `${value} ${unit}`
}

export function WalletPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = getLocale(params.locale)
  const client = useQueryClient()
  const { user, resolve } = useSessionStore()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [methodId, setMethodId] = useState('')
  const [intent, setIntent] = useState<PurchaseIntent | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [redemption, setRedemption] = useState('')
  const [billingPage, setBillingPage] = useState(1)
  const [billingSearch, setBillingSearch] = useState('')

  const topup = useQuery({ queryKey: ['topup-info'], queryFn: getTopupInfo, retry: false })
  const plans = useQuery({ queryKey: ['subscription-plans'], queryFn: getSubscriptionPlans, retry: false })
  const subscriptions = useQuery({ queryKey: ['self-subscriptions'], queryFn: getSelfSubscriptions, retry: false })
  const affiliate = useQuery({ queryKey: ['affiliate-code'], queryFn: getAffiliateCode, retry: false })
  const billing = useQuery({
    queryKey: ['billing-history', billingPage, billingSearch],
    queryFn: () => getBillingHistory({ p: billingPage, page_size: 10, keyword: billingSearch.trim() || undefined }),
    retry: false,
  })
  const info = topup.data?.data
  const options = info?.amount_options || []
  const methods = useMemo(() => buildTopupMethods(info, selectedAmount), [info, selectedAmount])
  const selectedMethod = methods.find((item) => item.id === methodId) || null
  const planRecords = Array.isArray(plans.data?.data) ? plans.data.data : []
  const activeSubscriptions = subscriptions.data?.data?.subscriptions || []
  const billingRecords = extractItems<TopupRecord>(billing.data?.data)
  const billingTotal = Number(billing.data?.data?.total || 0)
  const billingPages = Math.max(1, Math.ceil(billingTotal / 10))

  useEffect(() => {
    if (selectedAmount == null || !isConfiguredTopupAmount(options, selectedAmount)) {
      setSelectedAmount(options[0] ?? null)
    }
  }, [options, selectedAmount])
  useEffect(() => {
    if (!methods.some((method) => method.id === methodId)) setMethodId(methods[0]?.id || '')
  }, [methodId, methods])

  const calculated = useQuery({
    queryKey: ['topup-calculation', selectedAmount, selectedMethod?.provider],
    queryFn: () => calculateTopupAmount(selectedAmount!, selectedMethod!.provider as 'epay' | 'stripe' | 'waffo-pancake'),
    enabled: selectedAmount != null && Boolean(selectedMethod && ['epay', 'stripe', 'waffo-pancake'].includes(selectedMethod.provider)),
    retry: false,
  })

  const purchase = useMutation({
    mutationFn: async (nextIntent: PurchaseIntent) => {
      if (nextIntent.kind === 'topup') {
        const currentOptions = topup.data?.data?.amount_options || []
        if (!isConfiguredTopupAmount(currentOptions, nextIntent.amount)) {
          throw new Error(t('Only preset amounts configured by Partokens can be selected.'))
        }
        const response = await requestTopupPayment({
          provider: nextIntent.method.provider,
          amount: nextIntent.method.provider === 'creem' ? undefined : Math.floor(nextIntent.amount),
          payment_method: nextIntent.method.provider === 'stripe' ? 'stripe' : nextIntent.method.paymentMethod,
          product_id: nextIntent.method.productId,
          pay_method_index: nextIntent.method.payMethodIndex,
        })
        if (!response.success && response.message !== 'success') throw new Error(response.message || t('Payment request failed'))
        return { response, balance: false }
      }
      const response = await requestSubscriptionPayment({
        provider: nextIntent.provider,
        plan_id: nextIntent.plan.id,
        payment_method: nextIntent.paymentMethod,
      })
      if (!response.success && response.message !== 'success') throw new Error(response.message || t('Payment request failed'))
      return { response, balance: nextIntent.provider === 'balance' }
    },
    onMutate: () => { setError(''); setNotice('') },
    onSuccess: ({ response, balance }) => {
      setIntent(null)
      if (balance) {
        setNotice(t('Subscription purchased'))
        void Promise.all([subscriptions.refetch(), resolve()])
        return
      }
      if (!continueCheckout(response)) setError(t('Payment destination unavailable'))
    },
    onError: (cause) => {
      setIntent(null)
      setError(responseMessage(cause, t('Payment request failed')))
    },
  })

  const redeem = useMutation({
    mutationFn: async () => {
      const response = await redeemTopupCode(redemption.trim())
      if (!response.success) throw new Error(response.message || t('Redemption failed'))
      return response
    },
    onMutate: () => { setError(''); setNotice('') },
    onSuccess: (response) => {
      setRedemption('')
      setNotice(`${t('Redemption successful')}: ${formatQuota(response.data, locale)}`)
      void Promise.all([billing.refetch(), resolve()])
    },
    onError: (cause) => setError(responseMessage(cause, t('Redemption failed'))),
  })

  const transfer = useMutation({
    mutationFn: async () => {
      const amount = user?.aff_quota || 0
      if (amount <= 0) throw new Error(t('No rewards available'))
      const response = await transferAffiliateQuota(amount)
      if (!response.success) throw new Error(response.message || t('Transfer failed'))
      return response
    },
    onMutate: () => { setError(''); setNotice('') },
    onSuccess: () => { setNotice(t('Rewards transferred')); void Promise.all([affiliate.refetch(), resolve()]) },
    onError: (cause) => setError(responseMessage(cause, t('Transfer failed'))),
  })

  const preference = useMutation({
    mutationFn: updateSubscriptionPreference,
    onSuccess: (response) => {
      if (!response.success) { setError(response.message || t('Unable to save preference')); return }
      setNotice(t('Billing preference updated'))
      void subscriptions.refetch()
    },
    onError: (cause) => setError(responseMessage(cause, t('Unable to save preference'))),
  })

  const discount = selectedAmount == null ? 1 : Number(info?.discount[String(selectedAmount)] ?? 1)
  const estimatedCharge = selectedAmount == null ? 0 : selectedAmount * discount
  const affiliateLink = affiliate.data?.data
    ? `${window.location.origin}/${locale}/auth/sign-up?aff=${encodeURIComponent(affiliate.data.data)}`
    : ''

  return (
    <div className="console-page wallet-page">
      <PageHeader eyebrow={t('Console billing')} title={t('Wallet')} description={t('Manage balance, subscriptions, payments, and account rewards.')} />
      <section className="wallet-balance">
        <div><span>{t('Account balance')}</span><strong>{formatQuota(user?.quota, locale)}</strong><small>{t('Total usage')}: {formatQuota(user?.used_quota, locale)}</small></div>
        <WalletCards size={34} />
      </section>
      {notice ? <div className="form-success wallet-message"><Check size={15} />{notice}</div> : null}
      {error ? <div className="form-error wallet-message" role="alert">{error}</div> : null}

      <section className="wallet-section">
        <div className="section-heading-row"><div><span className="eyebrow">{t('Subscriptions')}</span><h2>{t('Plans and billing order')}</h2></div><label className="inline-select"><span>{t('Usage billing preference')}</span><select value={subscriptions.data?.data?.billing_preference || 'subscription_first'} disabled={preference.isPending || !activeSubscriptions.length} onChange={(event) => preference.mutate(event.target.value)}><option value="subscription_first">{t('Subscription first')}</option><option value="wallet_first">{t('Balance first')}</option><option value="subscription_only">{t('Subscription only')}</option><option value="wallet_only">{t('Balance only')}</option></select></label></div>
        <DataState loading={plans.isLoading || subscriptions.isLoading} error={plans.isError ? t('Interface data unavailable') : null} empty={!plans.isLoading && planRecords.length === 0} onRetry={() => void plans.refetch()}>
          <div className="subscription-plans">
            {planRecords.map(({ plan }) => {
              const current = activeSubscriptions.find(({ subscription }) => subscription.plan_id === plan.id)
              const available = subscriptionMethods(plan, info)
              return <article className="subscription-plan" key={plan.id}><div><span className={current ? 'status-badge healthy' : 'status-badge'}>{current ? t('Active') : t('Available')}</span><h3>{plan.title}</h3><p>{plan.subtitle || formatDuration(plan, t)}</p></div><div className="plan-quota"><strong>{formatQuota(plan.total_amount, locale)}</strong><span>{t('Included quota')}</span></div><div className="plan-price"><strong>{new Intl.NumberFormat(locale, { style: 'currency', currency: plan.currency || 'USD' }).format(plan.price_amount)}</strong><span>{formatDuration(plan, t)}</span></div>{current ? <small>{t('Renews or expires')}: {formatDate(current.subscription.end_time, locale)}</small> : <div className="plan-actions">{available.map((method) => <button key={`${method.provider}:${method.paymentMethod || ''}`} className="button secondary-button" onClick={() => setIntent({ kind: 'subscription', plan, provider: method.provider, paymentMethod: method.paymentMethod })}>{method.label}</button>)}</div>}</article>
            })}
          </div>
        </DataState>
      </section>

      <div className="wallet-grid">
        <section className="panel">
          <div className="panel-heading"><div><span className="eyebrow">{t('Top up')}</span><h2>{t('Preset amounts')}</h2></div><CircleDollarSign size={19} /></div>
          <DataState loading={topup.isLoading} error={topup.isError ? t('Interface data unavailable') : null} empty={!topup.isLoading && options.length === 0} onRetry={() => void topup.refetch()}>
            <div className="amount-options">{options.map((amount) => <button key={amount} className={selectedAmount === amount ? 'active' : ''} onClick={() => setSelectedAmount(amount)}><strong>${amount}</strong>{Number(info?.discount[String(amount)] ?? 1) < 1 ? <small>{Math.round((1 - Number(info?.discount[String(amount)])) * 100)}% {t('off')}</small> : null}</button>)}</div>
            <label className="payment-method-field"><span>{t('Payment method')}</span><select value={methodId} onChange={(event) => setMethodId(event.target.value)}>{methods.map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}</select></label>
            <div className="payment-summary"><span>{t('Selected amount')}</span><strong>{selectedAmount == null ? '—' : `$${selectedAmount}`}</strong><span>{t('Estimated payment')}</span><strong>{calculated.data?.success && calculated.data.data ? calculated.data.data : `$${estimatedCharge.toFixed(2)}`}</strong></div>
            <button className="button primary-button" disabled={!selectedMethod || selectedAmount == null || purchase.isPending} onClick={() => selectedMethod && selectedAmount != null && setIntent({ kind: 'topup', amount: selectedAmount, method: selectedMethod })}><CreditCard size={16} />{t('Continue to payment')}</button>
            <p className="field-help">{t('Only preset amounts configured by Partokens can be selected.')}</p>
          </DataState>
        </section>

        <section className="panel redemption-panel">
          <div className="panel-heading"><div><span className="eyebrow">{t('Redemption')}</span><h2>{t('Redeem a code')}</h2></div><Gift size={19} /></div>
          {info?.enable_redemption === false ? <div className="data-state">{t('Redemption is unavailable')}</div> : <form onSubmit={(event: FormEvent) => { event.preventDefault(); redeem.mutate() }}><label><span>{t('Redemption code')}</span><input value={redemption} onChange={(event) => setRedemption(event.target.value)} autoComplete="off" required /></label><button className="button secondary-button" disabled={!redemption.trim() || redeem.isPending}>{redeem.isPending ? <LoaderCircle className="spin" size={16} /> : <Gift size={16} />}{t('Redeem')}</button></form>}
        </section>
      </div>

      <section className="wallet-section affiliate-section">
        <div className="section-heading-row"><div><span className="eyebrow">{t('Referrals')}</span><h2>{t('Affiliate rewards')}</h2></div><Share2 size={19} /></div>
        <div className="affiliate-layout"><div className="affiliate-metrics"><Metric label={t('Pending rewards')} value={formatQuota(user?.aff_quota, locale)} /><Metric label={t('Total earned')} value={formatQuota(user?.aff_history_quota, locale)} /><Metric label={t('Invites')} value={formatInteger(user?.aff_count, locale)} /></div><div className="affiliate-link"><label><span>{t('Referral link')}</span><div className="secret-value"><code>{affiliateLink || '—'}</code><button className="icon-button" disabled={!affiliateLink} aria-label={t('Copy')} onClick={() => void navigator.clipboard.writeText(affiliateLink)}><Copy size={16} /></button></div></label><button className="button secondary-button" disabled={!user?.aff_quota || transfer.isPending} onClick={() => { if (window.confirm(t('Transfer all pending rewards to balance?'))) transfer.mutate() }}>{t('Transfer to balance')}</button></div></div>
      </section>

      <section className="wallet-section billing-section">
        <div className="section-heading-row"><div><span className="eyebrow">{t('History')}</span><h2>{t('Billing history')}</h2></div><button className="icon-button" aria-label={t('Refresh')} onClick={() => void billing.refetch()}><RefreshCw size={17} /></button></div>
        <div className="filter-bar"><label className="search-field"><History size={16} /><input value={billingSearch} onChange={(event) => { setBillingSearch(event.target.value); setBillingPage(1) }} placeholder={t('Search order number')} /></label></div>
        <DataState loading={billing.isLoading} error={billing.isError ? t('Interface data unavailable') : null} empty={!billing.isLoading && billingRecords.length === 0} onRetry={() => void billing.refetch()}>
          <div className="responsive-table"><table><thead><tr><th>{t('Order')}</th><th>{t('Time')}</th><th>{t('Payment method')}</th><th>{t('Amount')}</th><th>{t('Paid')}</th><th>{t('Status')}</th></tr></thead><tbody>{billingRecords.map((record) => <tr key={record.id}><td><code>{record.trade_no}</code></td><td>{formatDate(record.create_time, locale)}</td><td>{record.payment_method || '—'}</td><td>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(Number(record.amount || 0))}</td><td>${Number(record.money || 0).toFixed(2)}</td><td><span className={record.status === 'success' ? 'status-badge healthy' : 'status-badge'}>{t(record.status)}</span></td></tr>)}</tbody></table></div>
          <div className="pagination-bar"><span>{t('Page')} {billingPage} / {billingPages}</span><div><button className="button secondary-button" disabled={billingPage <= 1} onClick={() => setBillingPage((page) => page - 1)}>{t('Previous')}</button><button className="button secondary-button" disabled={billingPage >= billingPages} onClick={() => setBillingPage((page) => page + 1)}>{t('Next')}</button></div></div>
        </DataState>
      </section>

      {intent ? <Modal className="dialog payment-dialog" label={intent.kind === 'topup' ? t('Confirm top-up') : t('Confirm subscription')} onClose={purchase.isPending ? undefined : () => setIntent(null)}><button className="dialog-close icon-button" aria-label={t('Close')} onClick={() => setIntent(null)}><X size={17} /></button><span className="eyebrow">{t('Confirm payment')}</span><h2>{intent.kind === 'topup' ? t('Confirm top-up') : t('Confirm subscription')}</h2><dl className="confirmation-list"><div><dt>{t('Item')}</dt><dd>{intent.kind === 'topup' ? `$${intent.amount} ${t('balance')}` : intent.plan.title}</dd></div><div><dt>{t('Payment method')}</dt><dd>{intent.kind === 'topup' ? intent.method.label : intent.provider === 'balance' ? t('Balance') : intent.provider}</dd></div>{intent.kind === 'topup' ? <div><dt>{t('Estimated payment')}</dt><dd>{calculated.data?.success && calculated.data.data ? calculated.data.data : `$${estimatedCharge.toFixed(2)}`}</dd></div> : <div><dt>{t('Price')}</dt><dd>{new Intl.NumberFormat(locale, { style: 'currency', currency: intent.plan.currency || 'USD' }).format(intent.plan.price_amount)}</dd></div>}</dl><p>{intent.kind === 'topup' || intent.provider !== 'balance' ? t('A payment page will open after confirmation.') : t('The plan price will be deducted from your balance immediately.')}</p><div className="dialog-actions"><button className="button secondary-button" disabled={purchase.isPending} onClick={() => setIntent(null)}>{t('Cancel')}</button><button className="button primary-button" disabled={purchase.isPending} onClick={() => purchase.mutate(intent)}>{purchase.isPending ? <LoaderCircle className="spin" size={16} /> : <CreditCard size={16} />}{t('Confirm and continue')}</button></div></Modal> : null}
    </div>
  )
}
