import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import { Check, CheckCircle2, CircleDollarSign, Copy, CreditCard, Gift, LoaderCircle, ReceiptText, RefreshCw, Share2, WalletCards } from 'lucide-react'
import { type FormEvent, type MouseEvent, type RefObject, useEffect, useMemo, useRef, useState } from 'react'
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
  type UserSubscriptionRecord,
} from '@partokens/api-client'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@partokens/design-system/components'
import { isAppLocale } from '@partokens/i18n'

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

type SubscriptionMethod = {
  provider: SubscriptionProvider
  label: string
  paymentMethod?: string
}

type PurchaseIntent =
  | { kind: 'topup'; amount: number; method: TopupMethod | null }
  | { kind: 'subscription'; plan: SubscriptionPlan; method: SubscriptionMethod | null }

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

function subscriptionMethods(plan: SubscriptionPlan, info?: TopupInfo): SubscriptionMethod[] {
  const methods: SubscriptionMethod[] = []
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
  const singular = value === 1
  const unit = t(plan.duration_unit === 'month'
    ? singular ? 'month' : 'months'
    : plan.duration_unit === 'year'
      ? singular ? 'year' : 'years'
      : plan.duration_unit === 'hour'
        ? singular ? 'hour' : 'hours'
        : singular ? 'day' : 'days')
  return `${value} ${unit}`
}

function formatMoney(value: number, locale: string, currency = 'USD') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}

function timestampMilliseconds(value: number) {
  return value > 10_000_000_000 ? value : value * 1000
}

function formatSubscriptionDate(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(timestampMilliseconds(value))
}

function subscriptionDaysLeft(value: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((timestampMilliseconds(value) - today.getTime()) / 86_400_000))
}

function useCompactOverlay() {
  const query = '(max-width: 639px)'
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(query)
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return compact
}

function ActiveSubscriptionList({
  subscriptions,
  plans,
  locale,
  t,
}: {
  subscriptions: UserSubscriptionRecord[]
  plans: SubscriptionPlan[]
  locale: string
  t: TFunction
}) {
  if (!subscriptions.length) {
    return <div className="rounded-md border p-4 text-sm text-muted-foreground">{t('No active subscriptions')}</div>
  }

  return (
    <div className="divide-y overflow-hidden rounded-md border">
      {subscriptions.map(({ subscription }) => {
        const plan = plans.find((item) => item.id === subscription.plan_id)
        const total = subscription.amount_total || plan?.total_amount || 0
        const remaining = Math.max(0, total - subscription.amount_used)
        const usedPercent = total > 0 ? Math.max(0, Math.min(100, Math.round((subscription.amount_used / total) * 100))) : 0
        const daysLeft = subscriptionDaysLeft(subscription.end_time)
        const planName = plan?.title || t('Subscription')
        return (
          <article key={subscription.id} className="p-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{planName}</p>
                  <code className="text-xs text-muted-foreground">#{String(subscription.id).slice(-6)}</code>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t('Effective {{range}}', { range: `${formatSubscriptionDate(subscription.start_time, locale)} - ${formatSubscriptionDate(subscription.end_time, locale)}` })}</p>
              </div>
              <Badge variant="outline" className="shrink-0">{daysLeft === 1 ? t('1 day left') : t('{{count}} days left', { count: daysLeft })}</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-4">
              <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Total quota')}</dt><dd className="mt-1 font-mono text-sm font-semibold tabular-nums">{formatQuota(total, locale)}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Remaining')}</dt><dd className="mt-1 font-mono text-sm font-semibold tabular-nums">{formatQuota(remaining, locale)}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Used')}</dt><dd className="mt-1 font-mono text-sm font-semibold tabular-nums">{usedPercent}%</dd></div>
            </dl>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t('{{plan}} quota used', { plan: planName })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={usedPercent}>
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${usedPercent}%` }} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ActiveSubscriptionsOverlay({
  subscriptions,
  plans,
  locale,
  t,
  compact,
  triggerRef,
  onClose,
}: {
  subscriptions: UserSubscriptionRecord[]
  plans: SubscriptionPlan[]
  locale: string
  t: TFunction
  compact: boolean
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
}) {
  const description = subscriptions.length === 1
    ? t('1 active subscription with independent quota and validity.')
    : t('{{count}} active subscriptions with independent quota and validity.', { count: subscriptions.length })
  const closeAutoFocus = (event: Event) => { event.preventDefault(); triggerRef.current?.focus() }
  const changeOpen = (open: boolean) => { if (!open) onClose() }
  const body = <ActiveSubscriptionList subscriptions={subscriptions} plans={plans} locale={locale} t={t} />

  if (compact) {
    return (
      <Sheet open onOpenChange={changeOpen}>
        <SheetContent side="bottom" className="max-h-[90svh] overflow-y-auto" onCloseAutoFocus={closeAutoFocus}>
          <SheetHeader><SheetTitle>{t('Active subscriptions')}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
          <div className="px-4">{body}</div>
          <SheetFooter className="border-t"><Button type="button" variant="outline" onClick={onClose}>{t('Close')}</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl" onCloseAutoFocus={closeAutoFocus}>
        <DialogHeader><DialogTitle>{t('Active subscriptions')}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        {body}
        <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t('Close')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type PaymentOption = {
  id: string
  label: string
  method: TopupMethod | SubscriptionMethod
}

function PurchaseSummary({
  intent,
  paymentOptions,
  calculatedPayment,
  calculationLoading,
  calculationUnavailable,
  balance,
  info,
  locale,
  t,
  disabled,
  onPayment,
}: {
  intent: PurchaseIntent
  paymentOptions: PaymentOption[]
  calculatedPayment: string | null
  calculationLoading: boolean
  calculationUnavailable: boolean
  balance: number
  info?: TopupInfo
  locale: string
  t: TFunction
  disabled: boolean
  onPayment: (option: PaymentOption) => void
}) {
  const selectedId = intent.method
    ? intent.kind === 'topup'
      ? intent.method.id
      : `${intent.method.provider}:${intent.method.paymentMethod || ''}`
    : ''
  const paymentField = (
    <div className="space-y-2 border-t p-3">
      <Label htmlFor="purchase-payment-method">{t('Payment method')}</Label>
      <Select
        value={selectedId}
        disabled={disabled || paymentOptions.length === 0}
        onValueChange={(value) => {
          const option = paymentOptions.find((item) => item.id === value)
          if (option) onPayment(option)
        }}
      >
        <SelectTrigger id="purchase-payment-method" className="w-full"><CreditCard /><SelectValue placeholder={t('No payment method available')} /></SelectTrigger>
        <SelectContent>{paymentOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent>
      </Select>
      {paymentOptions.length === 0 ? <p className="text-xs text-muted-foreground">{t('No payment method available')}</p> : null}
    </div>
  )

  if (intent.kind === 'subscription') {
    return (
      <div className="overflow-hidden rounded-md border text-sm">
        <dl className="divide-y">
          <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Plan')}</dt><dd className="text-end font-medium">{intent.plan.title}</dd></div>
          <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Validity')}</dt><dd className="text-end">{formatDuration(intent.plan, t)}</dd></div>
          <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Included quota')}</dt><dd className="font-mono tabular-nums">{formatQuota(intent.plan.total_amount, locale)}</dd></div>
          <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Due today')}</dt><dd className="font-mono font-semibold tabular-nums">{formatMoney(intent.plan.price_amount, locale, intent.plan.currency || 'USD')}</dd></div>
        </dl>
        {paymentField}
      </div>
    )
  }

  const multiplier = Number(info?.discount[String(intent.amount)] ?? 1)
  const fallbackPayment = formatMoney(intent.amount * multiplier, locale)
  return (
    <div className="overflow-hidden rounded-md border text-sm">
      <dl className="divide-y">
        <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Amount')}</dt><dd className="font-mono tabular-nums">{formatMoney(intent.amount, locale)}</dd></div>
        <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Discount')}</dt><dd className="font-mono tabular-nums">{Math.round((1 - multiplier) * 100)}%</dd></div>
        <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('You pay')}</dt><dd className="font-mono font-semibold tabular-nums">{calculationLoading ? t('Calculating') : calculationUnavailable ? t('Unavailable') : calculatedPayment || fallbackPayment}</dd></div>
        <div className="flex justify-between gap-4 p-3"><dt className="text-muted-foreground">{t('Balance after')}</dt><dd className="font-mono font-semibold tabular-nums">{formatMoney(balance + intent.amount, locale)}</dd></div>
      </dl>
      {paymentField}
    </div>
  )
}

function PurchaseOverlay({
  intent,
  paymentOptions,
  calculatedPayment,
  calculationLoading,
  calculationUnavailable,
  balance,
  info,
  locale,
  t,
  processing,
  compact,
  triggerRef,
  onClose,
  onConfirm,
  onPayment,
}: {
  intent: PurchaseIntent
  paymentOptions: PaymentOption[]
  calculatedPayment: string | null
  calculationLoading: boolean
  calculationUnavailable: boolean
  balance: number
  info?: TopupInfo
  locale: string
  t: TFunction
  processing: boolean
  compact: boolean
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
  onPayment: (option: PaymentOption) => void
}) {
  const title = intent.kind === 'topup' ? t('Confirm top-up') : t('Confirm subscription')
  const description = intent.kind === 'topup'
    ? t('Review this payment before adding funds.')
    : t('Subscribe to {{plan}} for {{duration}}.', { plan: intent.plan.title, duration: formatDuration(intent.plan, t) })
  const confirmDisabled = processing || !intent.method || (intent.kind === 'topup' && (calculationLoading || calculationUnavailable))
  const closeAutoFocus = (event: Event) => { event.preventDefault(); triggerRef.current?.focus() }
  const changeOpen = (open: boolean) => { if (!open && !processing) onClose() }
  const body = (
    <PurchaseSummary
      intent={intent}
      paymentOptions={paymentOptions}
      calculatedPayment={calculatedPayment}
      calculationLoading={calculationLoading}
      calculationUnavailable={calculationUnavailable}
      balance={balance}
      info={info}
      locale={locale}
      t={t}
      disabled={processing}
      onPayment={onPayment}
    />
  )
  const footer = (
    <>
      <Button type="button" variant="outline" disabled={processing} onClick={onClose}>{t('Cancel')}</Button>
      <Button type="button" disabled={confirmDisabled} onClick={onConfirm}>
        {processing ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}
        {processing ? t('Processing...') : title}
      </Button>
    </>
  )

  if (compact) {
    return (
      <Sheet open onOpenChange={changeOpen}>
        <SheetContent
          side="bottom"
          className={`max-h-[90svh] overflow-y-auto ${processing ? '[&>button]:pointer-events-none [&>button]:opacity-50' : ''}`}
          onCloseAutoFocus={closeAutoFocus}
          onEscapeKeyDown={(event) => { if (processing) event.preventDefault() }}
          onInteractOutside={(event) => { if (processing) event.preventDefault() }}
        >
          <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
          <div className="px-4">{body}</div>
          <SheetFooter className="border-t">{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-md"
        showCloseButton={!processing}
        onCloseAutoFocus={closeAutoFocus}
        onEscapeKeyDown={(event) => { if (processing) event.preventDefault() }}
        onInteractOutside={(event) => { if (processing) event.preventDefault() }}
      >
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        {body}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WalletPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = getLocale(params.locale)
  const client = useQueryClient()
  const { user, resolve } = useSessionStore()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [intent, setIntent] = useState<PurchaseIntent | null>(null)
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [redemption, setRedemption] = useState('')
  const [billingPage, setBillingPage] = useState(1)
  const [billingSearch, setBillingSearch] = useState('')
  const compactOverlay = useCompactOverlay()
  const purchaseTriggerRef = useRef<HTMLElement | null>(null)
  const subscriptionsTriggerRef = useRef<HTMLElement | null>(null)

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
  const planRecords = Array.isArray(plans.data?.data) ? plans.data.data : []
  const availablePlans = planRecords.map(({ plan }) => plan)
  const activeSubscriptions = subscriptions.data?.data?.subscriptions || []
  const billingRecords = extractItems<TopupRecord>(billing.data?.data)
  const billingTotal = Number(billing.data?.data?.total || 0)
  const billingPages = Math.max(1, Math.ceil(billingTotal / 10))

  useEffect(() => {
    if (selectedAmount == null || !isConfiguredTopupAmount(options, selectedAmount)) {
      setSelectedAmount(options[0] ?? null)
    }
  }, [options, selectedAmount])

  const paymentOptions = useMemo<PaymentOption[]>(() => {
    if (!intent) return []
    if (intent.kind === 'topup') {
      return buildTopupMethods(info, intent.amount).map((method) => ({ id: method.id, label: method.label, method }))
    }
    return subscriptionMethods(intent.plan, info).map((method) => ({
      id: `${method.provider}:${method.paymentMethod || ''}`,
      label: method.label,
      method,
    }))
  }, [info, intent])

  const calculationAmount = intent?.kind === 'topup' ? intent.amount : null
  const calculationMethod = intent?.kind === 'topup' ? intent.method : null

  const calculated = useQuery({
    queryKey: ['topup-calculation', calculationAmount, calculationMethod?.provider],
    queryFn: () => calculateTopupAmount(calculationAmount!, calculationMethod!.provider as 'epay' | 'stripe' | 'waffo-pancake'),
    enabled: calculationAmount != null && Boolean(calculationMethod && ['epay', 'stripe', 'waffo-pancake'].includes(calculationMethod.provider)),
    retry: false,
  })

  const purchase = useMutation({
    mutationFn: async (nextIntent: PurchaseIntent) => {
      if (nextIntent.kind === 'topup') {
        if (!nextIntent.method) throw new Error(t('No payment method available'))
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
      if (!nextIntent.method) throw new Error(t('No payment method available'))
      const response = await requestSubscriptionPayment({
        provider: nextIntent.method.provider,
        plan_id: nextIntent.plan.id,
        payment_method: nextIntent.method.paymentMethod,
      })
      if (!response.success && response.message !== 'success') throw new Error(response.message || t('Payment request failed'))
      return { response, balance: nextIntent.method.provider === 'balance' }
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

  const calculationRequired = Boolean(calculationMethod && ['epay', 'stripe', 'waffo-pancake'].includes(calculationMethod.provider))
  const calculatedPayment = calculationRequired
    ? calculated.data?.success && calculated.data.data ? calculated.data.data : null
    : intent?.kind === 'topup' ? formatMoney(intent.amount * Number(info?.discount[String(intent.amount)] ?? 1), locale) : null
  const calculationUnavailable = calculationRequired && (calculated.isError || (!calculated.isLoading && !calculatedPayment))
  const affiliateLink = affiliate.data?.data
    ? `${window.location.origin}/${locale}/auth/sign-up?aff=${encodeURIComponent(affiliate.data.data)}`
    : ''

  const openActiveSubscriptions = (event: MouseEvent<HTMLButtonElement>) => {
    subscriptionsTriggerRef.current = event.currentTarget
    setSubscriptionsOpen(true)
  }

  const openSubscription = (plan: SubscriptionPlan, event: MouseEvent<HTMLButtonElement>) => {
    const methods = subscriptionMethods(plan, info)
    purchaseTriggerRef.current = event.currentTarget
    setIntent({ kind: 'subscription', plan, method: methods[0] || null })
  }

  const openTopup = (event: MouseEvent<HTMLButtonElement>) => {
    if (selectedAmount == null) return
    const methods = buildTopupMethods(info, selectedAmount)
    purchaseTriggerRef.current = event.currentTarget
    setIntent({ kind: 'topup', amount: selectedAmount, method: methods[0] || null })
  }

  const selectPayment = (option: PaymentOption) => {
    setIntent((current) => {
      if (!current) return current
      if (current.kind === 'topup') return { ...current, method: option.method as TopupMethod }
      return { ...current, method: option.method as SubscriptionMethod }
    })
  }

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
        <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border" aria-label={t('Choose a plan')}>
          <AccountSectionHeading
            eyebrow={t('Subscriptions').toUpperCase()}
            title={t('Choose a plan')}
            description={t('Each subscription adds its own quota and validity period.')}
            action={<Button type="button" variant="outline" size="sm" onClick={openActiveSubscriptions}><ReceiptText />{t('View active ({{count}})', { count: activeSubscriptions.length })}</Button>}
          />
          <AccountDataState
            loading={plans.isLoading || subscriptions.isLoading}
            error={(plans.isError && !plans.data) || (subscriptions.isError && !subscriptions.data) ? t('Interface data unavailable') : null}
            empty={!plans.isLoading && planRecords.length === 0}
            emptyTitle={t('No subscription plans available')}
            emptyDescription={t('Subscription plans will appear when configured by Partokens.')}
            retryLabel={t('Retry')}
            onRetry={() => void Promise.all([plans.refetch(), subscriptions.refetch()])}
          >
            <div className="flex flex-1 flex-col divide-y">
              {planRecords.map(({ plan }) => {
                const activeCount = activeSubscriptions.filter(({ subscription }) => subscription.plan_id === plan.id).length
                const available = subscriptionMethods(plan, info)
                return (
                  <article key={plan.id} className="grid flex-1 grid-cols-3 items-center gap-4 p-4 md:grid-cols-[minmax(150px,1.2fr)_repeat(3,minmax(82px,0.65fr))_auto]">
                    <div className="col-span-3 flex min-w-0 flex-wrap items-center gap-2 md:col-span-1">
                      <h3 className="text-sm font-semibold">{plan.title}</h3>
                      {activeCount > 0 ? <Badge variant="outline"><Check className="text-success" />{t('{{count}} active', { count: activeCount })}</Badge> : null}
                    </div>
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">{t('Price')}</p><p className="mt-1 font-mono text-sm font-semibold tabular-nums">{new Intl.NumberFormat(locale, { style: 'currency', currency: plan.currency || 'USD' }).format(plan.price_amount)}</p></div>
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">{t('Validity')}</p><p className="mt-1 text-sm font-medium">{formatDuration(plan, t)}</p></div>
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">{t('Plan quota')}</p><p className="mt-1 font-mono text-sm font-medium tabular-nums">{formatQuota(plan.total_amount, locale)}</p></div>
                    <Button type="button" variant="outline" size="sm" className="col-span-3 w-full md:col-span-1 md:w-auto" disabled={purchase.isPending || available.length === 0} onClick={(event) => openSubscription(plan, event)}><CreditCard />{t('Subscribe')}</Button>
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

        <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border" aria-label={t('Add funds')}>
          <AccountSectionHeading eyebrow={t('Balance top-up').toUpperCase()} title={t('Add funds')} description={t('Select an amount, then review the payment.')} />
          <AccountDataState
            loading={topup.isLoading}
            error={topup.isError && !topup.data ? t('Interface data unavailable') : null}
            empty={!topup.isLoading && options.length === 0}
            emptyTitle={t('No top-up amounts available')}
            emptyDescription={t('Top-up stays disabled until Partokens configures preset amounts.')}
            retryLabel={t('Retry')}
            onRetry={() => void topup.refetch()}
          >
            <fieldset role="radiogroup" aria-label={t('Preset amounts')} className="flex-1" disabled={purchase.isPending}>
              <legend className="sr-only">{t('Preset amounts')}</legend>
              <div className="flex h-full flex-col divide-y">
                {options.map((amount) => {
                  const multiplier = Number(info?.discount[String(amount)] ?? 1)
                  const selected = selectedAmount === amount
                  return (
                    <button key={amount} type="button" role="radio" aria-checked={selected} aria-label={t('Amount {{amount}}, discount {{discount}}%, pay {{payment}}', { amount: formatMoney(amount, locale), discount: Math.round((1 - multiplier) * 100), payment: formatMoney(amount * multiplier, locale) })} className={`grid w-full flex-1 grid-cols-[repeat(3,minmax(0,1fr))_auto] items-center gap-3 px-4 py-3 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selected ? 'bg-accent' : 'hover:bg-accent/60'}`} onClick={() => setSelectedAmount(amount)}>
                      <span className="min-w-0"><span className="block text-xs text-muted-foreground">{t('Amount')}</span><span className="mt-1 block font-mono text-sm font-semibold tabular-nums">{formatMoney(amount, locale)}</span></span>
                      <span className="min-w-0"><span className="block text-xs text-muted-foreground">{t('Discount')}</span><span className="mt-1 block text-sm font-medium">{Math.round((1 - multiplier) * 100)}%</span></span>
                      <span className="min-w-0"><span className="block text-xs text-muted-foreground">{t('Pay')}</span><span className="mt-1 block font-mono text-sm font-medium tabular-nums">{formatMoney(amount * multiplier, locale)}</span></span>
                      <CheckCircle2 className={selected ? 'size-4 text-success' : 'size-4 invisible'} />
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </AccountDataState>
          <div className="mt-auto border-t bg-muted/15 p-4">
            <Button type="button" className="w-full" disabled={selectedAmount == null || purchase.isPending} onClick={openTopup}><CreditCard />{t('Review top-up')}</Button>
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

      {subscriptionsOpen ? (
        <ActiveSubscriptionsOverlay
          subscriptions={activeSubscriptions}
          plans={availablePlans}
          locale={locale}
          t={t}
          compact={compactOverlay}
          triggerRef={subscriptionsTriggerRef}
          onClose={() => setSubscriptionsOpen(false)}
        />
      ) : null}

      {intent ? (
        <PurchaseOverlay
          intent={intent}
          paymentOptions={paymentOptions}
          calculatedPayment={calculatedPayment}
          calculationLoading={calculated.isLoading}
          calculationUnavailable={calculationUnavailable}
          balance={quotaUnitsToDollars(user?.quota)}
          info={info}
          locale={locale}
          t={t}
          processing={purchase.isPending}
          compact={compactOverlay}
          triggerRef={purchaseTriggerRef}
          onClose={() => setIntent(null)}
          onConfirm={() => purchase.mutate(intent)}
          onPayment={selectPayment}
        />
      ) : null}
    </div>
  )
}
