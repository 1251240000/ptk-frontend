import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Check, CheckCircle2, CircleDollarSign, Copy, CreditCard, Gift, LoaderCircle, ReceiptText, RefreshCw, Share2, WalletCards, X } from 'lucide-react'
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
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@partokens/design-system/components'
import { isAppLocale } from '@partokens/i18n'

import { Modal } from '@/components/modal'
import { AccountDataState, AccountFeedback, AccountPageHeader, AccountSectionHeading, PendingLabel } from '@/features/account/account-ui'
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
    queryFn: ({ signal }) => getBillingHistory({ p: billingPage, page_size: 10, keyword: billingSearch.trim() || undefined }, signal),
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
  const calculationRequired = Boolean(selectedMethod && ['epay', 'stripe', 'waffo-pancake'].includes(selectedMethod.provider))
  const calculatedPayment = calculationRequired
    ? calculated.data?.success && calculated.data.data ? calculated.data.data : null
    : selectedAmount == null ? null : new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(selectedAmount * discount)
  const calculationUnavailable = calculationRequired && (calculated.isError || (!calculated.isLoading && !calculatedPayment))
  const affiliateLink = affiliate.data?.data
    ? `${window.location.origin}/${locale}/auth/sign-up?aff=${encodeURIComponent(affiliate.data.data)}`
    : ''

  return (
    <div className="space-y-6" data-account-page="wallet">
      <AccountPageHeader title={t('Wallet')} description={t('Manage balance, subscriptions, payments, and account rewards.')} />

      {notice ? <AccountFeedback kind="success">{notice}</AccountFeedback> : null}
      {error ? <AccountFeedback kind="error">{error}</AccountFeedback> : null}

      <section aria-label={t('Account balance')} className="grid overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
        {[
          [t('Account balance'), formatQuota(user?.quota, locale), t('Balance'), WalletCards],
          [t('Total usage'), formatQuota(user?.used_quota, locale), t('Usage billing preference'), CircleDollarSign],
          [t('Pending rewards'), formatQuota(user?.aff_quota, locale), t('Affiliate rewards'), Gift],
          [t('Subscriptions'), formatInteger(activeSubscriptions.length, locale), t('Active'), ReceiptText],
        ].map(([label, value, detail, Icon], index) => {
          const MetricIcon = Icon as typeof WalletCards
          return (
            <div key={String(label)} className={`min-w-0 p-4 ${index > 0 ? 'border-t sm:border-t-0' : ''} ${index > 1 ? 'sm:border-t' : ''} lg:border-t-0`}>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><MetricIcon className="size-4" />{label as string}</div>
              <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{value as string}</p>
              <p className="mt-1 text-xs text-muted-foreground">{detail as string}</p>
            </div>
          )
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border" aria-label={t('Plans and billing order')}>
          <AccountSectionHeading eyebrow={t('Subscriptions').toUpperCase()} title={t('Plans and billing order')} description={t('Manage balance, subscriptions, payments, and account rewards.')} />
          <AccountDataState
            loading={plans.isLoading || subscriptions.isLoading}
            error={(plans.isError && !plans.data) || (subscriptions.isError && !subscriptions.data) ? t('Interface data unavailable') : null}
            empty={!plans.isLoading && planRecords.length === 0}
            emptyTitle={t('No subscription plans available')}
            emptyDescription={t('Subscription plans will appear when configured by Partokens.')}
            retryLabel={t('Retry')}
            onRetry={() => void Promise.all([plans.refetch(), subscriptions.refetch()])}
          >
            <div className="divide-y">
              {planRecords.map(({ plan }) => {
                const current = activeSubscriptions.find(({ subscription }) => subscription.plan_id === plan.id)
                const available = subscriptionMethods(plan, info)
                return (
                  <article key={plan.id} className="grid min-w-0 grid-cols-2 gap-4 p-4 md:grid-cols-[minmax(150px,1.2fr)_minmax(90px,.6fr)_minmax(90px,.6fr)_minmax(0,1fr)] md:items-center">
                    <div className="col-span-2 min-w-0 md:col-span-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{plan.title}</h3><Badge variant="outline">{current ? <Check className="text-success" /> : null}{current ? t('Active') : t('Available')}</Badge></div>
                      <p className="mt-1 text-xs text-muted-foreground">{plan.subtitle || formatDuration(plan, t)}</p>
                    </div>
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">{t('Included quota')}</p><p className="mt-1 font-mono text-sm font-semibold tabular-nums">{formatQuota(plan.total_amount, locale)}</p></div>
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">{t('Price')}</p><p className="mt-1 font-mono text-sm font-semibold tabular-nums">{new Intl.NumberFormat(locale, { style: 'currency', currency: plan.currency || 'USD' }).format(plan.price_amount)}</p></div>
                    <div className="col-span-2 flex min-w-0 flex-wrap justify-stretch gap-2 md:col-span-1 md:justify-end">
                      {current ? <p className="w-full text-xs text-muted-foreground md:text-end">{t('Renews or expires')}: {formatDate(current.subscription.end_time, locale)}</p> : available.map((method) => <Button key={`${method.provider}:${method.paymentMethod || ''}`} type="button" variant="outline" size="sm" className="flex-1 md:flex-none" disabled={purchase.isPending} onClick={() => setIntent({ kind: 'subscription', plan, provider: method.provider, paymentMethod: method.paymentMethod })}><CreditCard />{method.label}</Button>)}
                      {!current && available.length === 0 ? <span className="text-xs text-muted-foreground">{t('No payment method available')}</span> : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </AccountDataState>
          <div className="grid gap-3 border-t bg-muted/15 p-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,.8fr)] md:items-end">
            <div><Label htmlFor="billing-preference">{t('Usage billing preference')}</Label><p className="mt-1 text-xs text-muted-foreground">{t('Choose which funding source is used first for model usage.')}</p></div>
            <Select value={subscriptions.data?.data?.billing_preference || 'subscription_first'} disabled={preference.isPending || !activeSubscriptions.length} onValueChange={(value) => preference.mutate(value)}>
              <SelectTrigger id="billing-preference" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="subscription_first">{t('Subscription first')}</SelectItem><SelectItem value="wallet_first">{t('Balance first')}</SelectItem><SelectItem value="subscription_only">{t('Subscription only')}</SelectItem><SelectItem value="wallet_only">{t('Balance only')}</SelectItem></SelectContent>
            </Select>
          </div>
        </section>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border" aria-label={t('Preset amounts')}>
          <AccountSectionHeading eyebrow={t('Top up').toUpperCase()} title={t('Preset amounts')} description={t('Only preset amounts configured by Partokens can be selected.')} />
          <AccountDataState
            loading={topup.isLoading}
            error={topup.isError && !topup.data ? t('Interface data unavailable') : null}
            empty={!topup.isLoading && options.length === 0}
            emptyTitle={t('No top-up amounts available')}
            emptyDescription={t('Top-up stays disabled until Partokens configures preset amounts.')}
            retryLabel={t('Retry')}
            onRetry={() => void topup.refetch()}
          >
            <fieldset role="radiogroup" aria-label={t('Preset amounts')} className="divide-y" disabled={purchase.isPending}>
              <legend className="sr-only">{t('Preset amounts')}</legend>
              {options.map((amount) => {
                const multiplier = Number(info?.discount[String(amount)] ?? 1)
                const selected = selectedAmount === amount
                return (
                  <button key={amount} type="button" role="radio" aria-checked={selected} className={`grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selected ? 'bg-accent' : 'hover:bg-accent/60'}`} onClick={() => setSelectedAmount(amount)}>
                    <span><span className="block text-xs text-muted-foreground">{t('Amount')}</span><span className="mt-1 block font-mono text-sm font-semibold tabular-nums">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(amount)}</span></span>
                    <span><span className="block text-xs text-muted-foreground">{t('Discount')}</span><span className="mt-1 block text-sm font-medium">{Math.round((1 - multiplier) * 100)}%</span></span>
                    <CheckCircle2 className={selected ? 'size-4 text-success' : 'size-4 invisible'} />
                  </button>
                )
              })}
            </fieldset>
          </AccountDataState>
          <div className="mt-auto space-y-3 border-t bg-muted/15 p-4">
            <div className="space-y-2"><Label htmlFor="topup-method">{t('Payment method')}</Label><Select value={methodId} disabled={!methods.length || purchase.isPending} onValueChange={setMethodId}><SelectTrigger id="topup-method" className="w-full"><SelectValue placeholder={t('No payment method available')} /></SelectTrigger><SelectContent>{methods.map((method) => <SelectItem key={method.id} value={method.id}>{method.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm"><span className="text-muted-foreground">{t('Estimated payment')}</span><strong className="font-mono tabular-nums">{calculated.isLoading ? t('Calculating') : calculationUnavailable ? t('Unavailable') : calculatedPayment || '—'}</strong></div>
            <Button type="button" className="w-full" disabled={!selectedMethod || selectedAmount == null || purchase.isPending || calculated.isLoading || calculationUnavailable} onClick={() => selectedMethod && selectedAmount != null && setIntent({ kind: 'topup', amount: selectedAmount, method: selectedMethod })}><CreditCard />{t('Continue to payment')}</Button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border">
          <AccountSectionHeading eyebrow={t('Redemption').toUpperCase()} title={t('Redeem a code')} icon={Gift} />
          {info?.enable_redemption === false ? <div className="flex min-h-32 items-center p-4 text-sm text-muted-foreground">{t('Redemption is unavailable')}</div> : (
            <form className="flex min-h-32 flex-col gap-3 p-4" onSubmit={(event: FormEvent) => { event.preventDefault(); redeem.mutate() }}>
              <div className="space-y-2"><Label htmlFor="redemption-code">{t('Redemption code')}</Label><Input id="redemption-code" value={redemption} onChange={(event) => setRedemption(event.target.value)} autoComplete="off" required /></div>
              <Button type="submit" variant="outline" className="mt-auto w-full sm:w-auto sm:self-end" disabled={!redemption.trim() || redeem.isPending}><PendingLabel pending={redeem.isPending} pendingText={t('Saving')}>{t('Redeem')}</PendingLabel></Button>
            </form>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border">
          <AccountSectionHeading eyebrow={t('Referrals').toUpperCase()} title={t('Affiliate rewards')} icon={Share2} />
          <div className="grid grid-cols-3 divide-x border-b">
            {[[t('Pending rewards'), formatQuota(user?.aff_quota, locale)], [t('Total earned'), formatQuota(user?.aff_history_quota, locale)], [t('Invites'), formatInteger(user?.aff_count, locale)]].map(([label, value]) => <div key={label} className="min-w-0 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words font-mono text-sm font-semibold tabular-nums">{value}</p></div>)}
          </div>
          <div className="space-y-3 p-4"><Label>{t('Referral link')}</Label><div className="flex min-w-0 items-center rounded-md border bg-muted/20"><code className="min-w-0 flex-1 truncate px-3 py-2 text-xs">{affiliateLink || '—'}</code><Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={!affiliateLink} aria-label={t('Copy')} onClick={() => void navigator.clipboard.writeText(affiliateLink)}><Copy /></Button></div><Button type="button" variant="outline" className="w-full sm:w-auto" disabled={!user?.aff_quota || transfer.isPending} onClick={() => { if (window.confirm(t('Transfer all pending rewards to balance?'))) transfer.mutate() }}>{t('Transfer to balance')}</Button></div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border">
        <AccountSectionHeading eyebrow={t('History').toUpperCase()} title={t('Billing history')} icon={ReceiptText} action={<Button type="button" variant="outline" size="icon" aria-label={t('Refresh')} disabled={billing.isFetching} onClick={() => void billing.refetch()}><RefreshCw className={billing.isFetching ? 'animate-spin' : ''} /></Button>} />
        <div className="border-b p-4"><Label htmlFor="billing-search" className="sr-only">{t('Search order number')}</Label><Input id="billing-search" className="max-w-sm" value={billingSearch} onChange={(event) => { setBillingSearch(event.target.value); setBillingPage(1) }} placeholder={t('Search order number')} /></div>
        <AccountDataState loading={billing.isLoading} error={billing.isError && !billing.data ? t('Interface data unavailable') : null} empty={!billing.isLoading && billingRecords.length === 0} emptyTitle={t('No billing history')} emptyDescription={t('Completed top-ups and payments will appear here.')} retryLabel={t('Retry')} onRetry={() => void billing.refetch()}>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t('Order')}</TableHead><TableHead>{t('Time')}</TableHead><TableHead>{t('Payment method')}</TableHead><TableHead>{t('Amount')}</TableHead><TableHead>{t('Paid')}</TableHead><TableHead>{t('Status')}</TableHead></TableRow></TableHeader><TableBody>{billingRecords.map((record) => <TableRow key={record.id}><TableCell><code className="break-all text-xs">{record.trade_no}</code></TableCell><TableCell className="whitespace-nowrap">{formatDate(record.create_time, locale)}</TableCell><TableCell>{record.payment_method || '—'}</TableCell><TableCell className="font-mono tabular-nums">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(Number(record.amount || 0))}</TableCell><TableCell className="font-mono tabular-nums">{new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(Number(record.money || 0))}</TableCell><TableCell><Badge variant="outline">{record.status === 'success' ? <Check className="text-success" /> : null}{t(record.status)}</Badge></TableCell></TableRow>)}</TableBody></Table></div>
          <footer className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-muted-foreground">{t('Page')} {billingPage} / {billingPages}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={billingPage <= 1} onClick={() => setBillingPage((page) => page - 1)}>{t('Previous')}</Button><Button type="button" variant="outline" size="sm" disabled={billingPage >= billingPages} onClick={() => setBillingPage((page) => page + 1)}>{t('Next')}</Button></div></footer>
        </AccountDataState>
      </section>

      {intent ? (
        <Modal
          className="relative max-h-[90svh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border bg-background p-5 text-foreground shadow-xl"
          backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
          label={intent.kind === 'topup' ? t('Confirm top-up') : t('Confirm subscription')}
          onClose={purchase.isPending ? undefined : () => setIntent(null)}
        >
          <Button type="button" variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t('Close')} disabled={purchase.isPending} onClick={() => setIntent(null)}><X /></Button>
          <p className="pe-10 text-xs font-medium text-muted-foreground">{t('Confirm payment').toUpperCase()}</p>
          <h2 className="mt-1 pe-10 text-lg font-semibold">{intent.kind === 'topup' ? t('Confirm top-up') : t('Confirm subscription')}</h2>
          <dl className="mt-4 divide-y rounded-md border text-sm"><div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Item')}</dt><dd className="text-end font-medium">{intent.kind === 'topup' ? `${new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(intent.amount)} ${t('balance')}` : intent.plan.title}</dd></div><div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Payment method')}</dt><dd className="text-end">{intent.kind === 'topup' ? intent.method.label : intent.provider === 'balance' ? t('Balance') : intent.provider}</dd></div>{intent.kind === 'topup' ? <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Estimated payment')}</dt><dd className="font-mono font-semibold tabular-nums">{calculatedPayment || t('Unavailable')}</dd></div> : <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Price')}</dt><dd className="font-mono font-semibold tabular-nums">{new Intl.NumberFormat(locale, { style: 'currency', currency: intent.plan.currency || 'USD' }).format(intent.plan.price_amount)}</dd></div>}</dl>
          <p className="mt-4 text-sm text-muted-foreground">{intent.kind === 'topup' || intent.provider !== 'balance' ? t('A payment page will open after confirmation.') : t('The plan price will be deducted from your balance immediately.')}</p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={purchase.isPending} onClick={() => setIntent(null)}>{t('Cancel')}</Button><Button type="button" disabled={purchase.isPending} onClick={() => purchase.mutate(intent)}><PendingLabel pending={purchase.isPending} pendingText={t('Saving')}>{t('Confirm and continue')}</PendingLabel></Button></div>
        </Modal>
      ) : null}
    </div>
  )
}
