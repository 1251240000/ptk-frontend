import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { Ban, CalendarClock, CheckCircle2, CircleHelp, Clock3, LoaderCircle, RefreshCw, WalletCards, XCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getBillingHistory, type TopupRecord } from '@partokens/api-client'
import { Badge, Button, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@partokens/design-system/components'
import { isAppLocale } from '@partokens/i18n'

import { AccountPageHeader, AccountSectionHeading } from '@/features/account/account-ui'
import { extractItems, formatCurrency, formatDate } from '@/lib/format'
import {
  clearPaymentReturnContextIfMatched,
  matchPaymentOrder,
  matchRecentPaymentOrder,
  normalizePaymentReturnParams,
  normalizeServerPaymentStatus,
  readPaymentReturnContext,
  type PaymentReturnParams,
  type PaymentReturnStatus,
} from '@/lib/payment-return'
import { canonicalConsoleRoute } from '@/lib/routes'

const pollWindowMs = 45_000

type DisplayStatus = PaymentReturnStatus | 'network_error' | 'loading'

function statusTitle(status: DisplayStatus, t: (key: string) => string): string {
  if (status === 'success') return t('Recharge successful')
  if (status === 'pending') return t('Payment processing')
  if (status === 'failed') return t('Recharge failed')
  if (status === 'expired') return t('Payment expired')
  if (status === 'cancelled') return t('Payment cancelled')
  if (status === 'network_error') return t('Unable to confirm payment status')
  if (status === 'loading') return t('Payment status')
  return t('Payment status')
}

function statusDescription(status: DisplayStatus, timedOut: boolean, t: (key: string) => string): string {
  if (status === 'success') return t('Balance updated. The server has confirmed this top-up.')
  if (status === 'pending') return timedOut ? t('The payment is still processing. We will keep your order linked while the provider confirms it.') : t('The payment provider has returned, but the final result is still being confirmed.')
  if (status === 'failed') return t('This payment failed and no balance was added.')
  if (status === 'expired') return t('This payment session has expired. Start a new top-up from your wallet.')
  if (status === 'cancelled') return t('This payment was cancelled. You can start a new top-up from your wallet.')
  if (status === 'network_error') return t('We could not confirm this payment yet. Please try again.')
  return t('Payment result could not be matched to an order yet.')
}

function statusIcon(status: DisplayStatus) {
  if (status === 'success') return CheckCircle2
  if (status === 'pending') return Clock3
  if (status === 'failed') return XCircle
  if (status === 'expired') return CalendarClock
  if (status === 'cancelled') return Ban
  if (status === 'network_error') return RefreshCw
  if (status === 'loading') return LoaderCircle
  return CircleHelp
}

function statusClasses(status: DisplayStatus): string {
  if (status === 'success') return 'border-l-success bg-success/5 text-success'
  if (status === 'pending') return 'border-l-warning bg-warning/5 text-warning'
  if (status === 'failed') return 'border-l-destructive bg-destructive/5 text-destructive'
  if (status === 'expired') return 'border-l-warning bg-warning/5 text-warning'
  if (status === 'cancelled') return 'border-l-muted-foreground bg-muted/40 text-muted-foreground'
  if (status === 'network_error') return 'border-l-destructive bg-destructive/5 text-destructive'
  return 'border-l-muted-foreground bg-muted/40 text-muted-foreground'
}

function statusLabel(status: DisplayStatus, t: (key: string) => string): string {
  if (status === 'network_error') return t('Unable to confirm payment status')
  if (status === 'loading') return t('Payment status')
  return t(status)
}

function PaymentLoadingState({ label }: { label: string }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={label}>
      <AccountPageHeader title={label} description={label} />
      <section className="border-l-4 border-l-muted-foreground rounded-lg border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-full max-w-xl" /></div>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      </section>
    </div>
  )
}

export function PaymentReturnPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)
  const [pollTimedOut, setPollTimedOut] = useState(false)
  const pollStartedAt = useRef<number | null>(null)
  const pollAttempt = useRef(0)
  const payment = useMemo(() => {
    const query = normalizePaymentReturnParams(window.location.search)
    const context = readPaymentReturnContext()
    const hasQueryIdentifier = Boolean(query.order_id || query.trade_no || query.session_id)
    const merged: PaymentReturnParams = {
      status: query.status,
      order_id: query.order_id || (!hasQueryIdentifier ? context?.order_id : undefined),
      trade_no: query.trade_no || (!hasQueryIdentifier ? context?.trade_no : undefined),
      session_id: query.session_id,
      provider: query.provider || (!hasQueryIdentifier ? context?.provider : undefined),
    }
    return { context, request: merged }
  }, [])
  const { context, request } = payment
  const identifier = request.trade_no || request.order_id || request.session_id
  const billing = useQuery({
    queryKey: ['payment-return-billing', identifier || 'recent'],
    queryFn: ({ signal }) => getBillingHistory({ p: 1, page_size: 50, keyword: identifier }, signal),
    retry: false,
  })
  const records = extractItems<TopupRecord>(billing.data?.data)
  const order = matchPaymentOrder(records, request) || (!identifier && context ? matchRecentPaymentOrder(records, context) : null)
  const serverStatus = order ? normalizeServerPaymentStatus(order.status) : null
  const requestFailed = billing.isError || billing.data?.success === false
  const displayStatus: DisplayStatus = requestFailed ? 'network_error' : billing.isLoading ? 'loading' : serverStatus || 'unknown'

  useEffect(() => {
    if (billing.dataUpdatedAt || billing.errorUpdatedAt) setLastCheckedAt(Date.now())
  }, [billing.dataUpdatedAt, billing.errorUpdatedAt])

  useEffect(() => {
    if (displayStatus === 'success' || displayStatus === 'failed' || displayStatus === 'expired' || displayStatus === 'cancelled') {
      clearPaymentReturnContextIfMatched(request)
    }
  }, [displayStatus, request])

  useEffect(() => {
    const shouldPoll = !requestFailed && (displayStatus === 'pending' || displayStatus === 'unknown')
    if (!shouldPoll || pollTimedOut) return
    if (pollStartedAt.current == null) pollStartedAt.current = Date.now()
    const elapsed = Date.now() - pollStartedAt.current
    if (elapsed >= pollWindowMs) {
      setPollTimedOut(true)
      return
    }
    const delay = Math.min(1000 * (2 ** pollAttempt.current), 8000)
    const timer = window.setTimeout(() => {
      pollAttempt.current += 1
      void billing.refetch()
    }, Math.min(delay, pollWindowMs - elapsed))
    return () => window.clearTimeout(timer)
  }, [billing.dataUpdatedAt, billing.refetch, displayStatus, identifier, pollTimedOut, requestFailed])

  const Icon = statusIcon(displayStatus)
  const orderNumber = order?.trade_no || request.trade_no || request.order_id || request.session_id || '—'
  const statusText = statusLabel(displayStatus, t)
  const links = {
    wallet: canonicalConsoleRoute('wallet'),
  }

  if (displayStatus === 'loading') return <PaymentLoadingState label={t('Confirming your top-up with the server.')} />

  return (
    <div className="space-y-6" data-payment-return>
      <AccountPageHeader title={t('Payment return')} description={t('Confirming your top-up with the server.')} />

      <section className={`rounded-lg border border-l-4 p-5 sm:p-7 ${statusClasses(displayStatus)}`} aria-live="polite">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full border bg-background/80" aria-hidden="true">
            <Icon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{statusText}</Badge>{displayStatus === 'pending' && !pollTimedOut ? <LoaderCircle className="size-4 animate-spin" aria-label={t('Payment processing')} /> : null}</div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{statusTitle(displayStatus, t)}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{statusDescription(displayStatus, pollTimedOut, t)}</p>
          </div>
        </div>

        <dl className="mt-7 grid gap-x-6 gap-y-5 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Recharge amount')}</dt><dd className="mt-1 break-words font-mono text-sm font-semibold tabular-nums">{order ? formatCurrency(Number(order.amount), locale) : '—'}</dd></div>
          <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Paid amount')}</dt><dd className="mt-1 break-words font-mono text-sm font-semibold tabular-nums">{order ? formatCurrency(Number(order.money), locale) : '—'}</dd></div>
          <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Payment method')}</dt><dd className="mt-1 break-words text-sm font-medium text-foreground">{order?.payment_method || request.provider || '—'}</dd></div>
          <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Order number')}</dt><dd className="mt-1 break-all font-mono text-sm font-semibold text-foreground">{orderNumber}</dd></div>
          <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Created at')}</dt><dd className="mt-1 break-words text-sm text-foreground">{order ? formatDate(order.create_time, locale) : '—'}</dd></div>
          <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Completed at')}</dt><dd className="mt-1 break-words text-sm text-foreground">{order?.complete_time ? formatDate(order.complete_time, locale) : '—'}</dd></div>
          {lastCheckedAt ? <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Last checked')}</dt><dd className="mt-1 break-words text-sm text-foreground">{formatDate(lastCheckedAt, locale)}</dd></div> : null}
        </dl>
      </section>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('Payment status')}>
        {(displayStatus === 'pending' || displayStatus === 'unknown' || displayStatus === 'network_error') ? <Button type="button" variant="default" onClick={() => { setPollTimedOut(false); pollStartedAt.current = Date.now(); pollAttempt.current = 0; void billing.refetch() }}><RefreshCw />{displayStatus === 'network_error' ? t('Try again') : t('Refresh status')}</Button> : null}
        {(displayStatus === 'failed' || displayStatus === 'expired' || displayStatus === 'cancelled') ? <Button asChild variant="default"><Link to={links.wallet} params={{ locale }}><WalletCards />{t('Try again')}</Link></Button> : null}
        <Button asChild variant="outline"><Link to={links.wallet} params={{ locale }}><WalletCards />{t('Return to wallet')}</Link></Button>
        <Button asChild variant="outline"><Link to={links.wallet} params={{ locale }} hash="wallet-billing-history"><WalletCards />{t('View billing history')}</Link></Button>
        {(displayStatus === 'success' || displayStatus === 'unknown' || displayStatus === 'network_error') ? <Button asChild variant="ghost"><Link to={links.wallet} params={{ locale }}><WalletCards />{t('Continue topping up')}</Link></Button> : null}
      </div>

      <section className="overflow-hidden rounded-lg border" aria-label={t('View billing history')}>
        <AccountSectionHeading eyebrow={t('Billing history').toUpperCase()} title={t('View billing history')} description={t('The server remains authoritative for billing and routing.')} />
        {records.length === 0 ? <div className="p-5 text-sm text-muted-foreground">{t('Payment result could not be matched to an order yet.')}</div> : (
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t('Order')}</TableHead><TableHead>{t('Time')}</TableHead><TableHead>{t('Payment method')}</TableHead><TableHead>{t('Amount')}</TableHead><TableHead>{t('Paid')}</TableHead><TableHead>{t('Status')}</TableHead></TableRow></TableHeader><TableBody>{records.slice(0, 5).map((record) => <TableRow key={record.id}><TableCell><code className="break-all text-xs">{record.trade_no}</code></TableCell><TableCell className="whitespace-nowrap">{formatDate(record.create_time, locale)}</TableCell><TableCell>{record.payment_method || '—'}</TableCell><TableCell className="font-mono font-semibold tabular-nums">{formatCurrency(Number(record.amount), locale)}</TableCell><TableCell className="font-mono font-semibold tabular-nums">{formatCurrency(Number(record.money), locale)}</TableCell><TableCell><Badge variant="outline">{t(normalizeServerPaymentStatus(record.status))}</Badge></TableCell></TableRow>)}</TableBody></Table></div>
        )}
      </section>
    </div>
  )
}
