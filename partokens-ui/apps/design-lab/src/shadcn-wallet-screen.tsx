import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  CreditCard,
  Ellipsis,
  Eye,
  Gift,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Star,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from 'react'

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@partokens/design-system/components'

import { ConsoleShell, type ConsoleScreenProps } from './shadcn-console-shell'

type TopUpAmount = 10 | 25 | 50 | 100
type PaymentMethod = 'Stripe' | 'Alipay' | 'WeChat Pay'
type BillingState = 'ready' | 'loading' | 'empty' | 'error'
type ProcessingKind = 'topup' | 'transfer' | 'subscription' | null
type SubscriptionPlanId = 'builder' | 'pro' | 'scale'

type SubscriptionPlan = {
  id: SubscriptionPlanId
  name: string
  price: number
  validityDays: number
  quota: number
  featured: boolean
}

type ActiveSubscription = {
  id: string
  planId: SubscriptionPlanId
  startsOn: string
  endsOn: string
  remainingQuota: number
}

type BillingRecord = {
  id: string
  time: string
  type: 'Balance top-up' | 'Affiliate transfer' | 'Redemption' | 'Subscription'
  paymentMethod: PaymentMethod | 'Affiliate rewards' | 'Redemption code'
  amount: number
  paid: number
  status: 'Success'
}

type TopUpSnapshot = {
  operationId: string
  amount: TopUpAmount
  discount: number
  method: PaymentMethod
  paid: number
  resultingBalance: number
}

type Overlay =
  | { kind: 'topup'; snapshot: TopUpSnapshot }
  | { kind: 'transfer'; operationId: string; amount: number }
  | { kind: 'subscription'; operationId: string; plan: SubscriptionPlan; method: PaymentMethod }
  | { kind: 'detail'; record: BillingRecord }
  | null

const amountOptions: TopUpAmount[] = [10, 25, 50, 100]
const paymentMethods: PaymentMethod[] = ['Stripe', 'Alipay', 'WeChat Pay']
const referralLink = 'https://partokens.com/invite/mika-7H2K'
const discounts: Record<TopUpAmount, number> = { 10: 1, 25: 0.96, 50: 0.92, 100: 0.88 }
const subscriptionPlans: SubscriptionPlan[] = [
  { id: 'builder', name: 'Builder', price: 20, validityDays: 30, quota: 25, featured: false },
  { id: 'pro', name: 'Pro', price: 49, validityDays: 30, quota: 70, featured: true },
  { id: 'scale', name: 'Scale', price: 99, validityDays: 30, quota: 160, featured: false },
]
const initialActiveSubscriptions: ActiveSubscription[] = [
  { id: 'SUB-BUILDER-20260716', planId: 'builder', startsOn: '2026-07-16', endsOn: '2026-08-15', remainingQuota: 16.5 },
]

function getSubscriptionPlan(id: SubscriptionPlanId) {
  return subscriptionPlans.find((plan) => plan.id === id) ?? subscriptionPlans[0]!
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createActiveSubscription(plan: SubscriptionPlan, id: string): ActiveSubscription {
  const startsOn = new Date()
  startsOn.setHours(0, 0, 0, 0)
  const endsOn = new Date(startsOn)
  endsOn.setDate(endsOn.getDate() + plan.validityDays)
  return { id, planId: plan.id, startsOn: localDateKey(startsOn), endsOn: localDateKey(endsOn), remainingQuota: plan.quota }
}

function formatDateRange(startsOn: string, endsOn: string) {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${formatter.format(new Date(`${startsOn}T00:00:00`))} - ${formatter.format(new Date(`${endsOn}T00:00:00`))}`
}

function remainingDays(endsOn: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((new Date(`${endsOn}T00:00:00`).getTime() - today.getTime()) / 86_400_000))
}

const initialBillingHistory: BillingRecord[] = [
  { id: 'PT-20260718-4821', time: '2026-07-18 14:32', type: 'Balance top-up', paymentMethod: 'Stripe', amount: 50, paid: 46, status: 'Success' },
  { id: 'PT-20260628-1934', time: '2026-06-28 09:16', type: 'Balance top-up', paymentMethod: 'Alipay', amount: 25, paid: 24, status: 'Success' },
  { id: 'PT-20260602-7790', time: '2026-06-02 18:40', type: 'Balance top-up', paymentMethod: 'Stripe', amount: 10, paid: 10, status: 'Success' },
]

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function operationId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

function billingTimestamp() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
}

function billingDateKey() {
  return billingTimestamp().slice(0, 10).replaceAll('-', '')
}

function useCompactOverlay() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 639px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return compact
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className='flex min-w-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='min-w-0'>
        <p className='text-xs font-medium text-muted-foreground'>{eyebrow}</p>
        <h2 className='mt-0.5 text-base font-semibold'>{title}</h2>
        {description ? <p className='mt-1 text-sm text-muted-foreground'>{description}</p> : null}
      </div>
      {action ? <div className='shrink-0'>{action}</div> : null}
    </header>
  )
}

function BalanceSummary({ balance, pendingRewards, activeSubscriptions }: { balance: number; pendingRewards: number; activeSubscriptions: ActiveSubscription[] }) {
  const totalQuota = activeSubscriptions.reduce((total, subscription) => total + getSubscriptionPlan(subscription.planId).quota, 0)
  const totalRemaining = activeSubscriptions.reduce((total, subscription) => total + subscription.remainingQuota, 0)
  const metrics = [
    { label: 'Account balance', value: money(balance), detail: 'USD account', icon: WalletCards },
    { label: 'Total usage', value: '$126.54', detail: 'USD account', icon: CircleDollarSign },
    { label: 'Pending rewards', value: money(pendingRewards), detail: 'USD account', icon: Gift },
    { label: 'Active subscriptions', value: String(activeSubscriptions.length), detail: `${money(totalRemaining)} of ${money(totalQuota)} remaining`, icon: ReceiptText },
  ]

  return (
    <section aria-label='Balance summary' className='grid overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4 lg:divide-x'>
      {metrics.map(({ label, value, detail, icon: Icon }, index) => (
        <div key={label} className={`min-w-0 p-4 ${index > 0 ? 'border-t sm:border-t-0' : ''} ${index > 1 ? 'sm:border-t' : ''} lg:border-t-0`}>
          <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground'><Icon className='size-4' />{label}</div>
          <p className='mt-2 font-mono text-xl font-semibold tabular-nums'>{value}</p>
          <p className='mt-1 text-xs text-muted-foreground'>{detail}</p>
        </div>
      ))}
    </section>
  )
}

function ActiveSubscriptionList({ subscriptions }: { subscriptions: ActiveSubscription[] }) {
  return (
    <div className='divide-y overflow-hidden rounded-md border'>
      {subscriptions.map((subscription) => {
        const plan = getSubscriptionPlan(subscription.planId)
        const usedPercent = Math.max(0, Math.min(100, Math.round(((plan.quota - subscription.remainingQuota) / plan.quota) * 100)))
        const daysLeft = remainingDays(subscription.endsOn)
        return (
          <article key={subscription.id} className='p-4'>
            <div className='flex min-w-0 items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='flex min-w-0 flex-wrap items-center gap-2'>
                  <p className='text-sm font-semibold'>{plan.name}</p>
                  <code className='text-xs text-muted-foreground'>#{subscription.id.replaceAll('-', '').slice(-6)}</code>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>Effective {formatDateRange(subscription.startsOn, subscription.endsOn)}</p>
              </div>
              <Badge variant='outline' className='shrink-0'>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</Badge>
            </div>
            <dl className='mt-4 grid grid-cols-3 gap-4'>
              <div className='min-w-0'><dt className='text-xs text-muted-foreground'>Total quota</dt><dd className='mt-1 font-mono text-sm font-semibold tabular-nums'>{money(plan.quota)}</dd></div>
              <div className='min-w-0'><dt className='text-xs text-muted-foreground'>Remaining</dt><dd className='mt-1 font-mono text-sm font-semibold tabular-nums'>{money(subscription.remainingQuota)}</dd></div>
              <div className='min-w-0'><dt className='text-xs text-muted-foreground'>Used</dt><dd className='mt-1 font-mono text-sm font-semibold tabular-nums'>{usedPercent}%</dd></div>
            </dl>
            <div className='mt-3 h-2 overflow-hidden rounded-full bg-muted' role='progressbar' aria-label={`${plan.name} quota used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={usedPercent}>
              <div className='h-full rounded-full bg-primary transition-[width]' style={{ width: `${usedPercent}%` }} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function SubscriptionSection({
  activeSubscriptions,
  preference,
  disabled,
  onPreference,
  onSubscribe,
  onViewActive,
}: {
  activeSubscriptions: ActiveSubscription[]
  preference: string
  disabled: boolean
  onPreference: (value: string) => void
  onSubscribe: (plan: SubscriptionPlan, event: MouseEvent<HTMLButtonElement>) => void
  onViewActive: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const planCounts: Record<SubscriptionPlanId, number> = { builder: 0, pro: 0, scale: 0 }
  activeSubscriptions.forEach((subscription) => { planCounts[subscription.planId] += 1 })

  return (
    <section className='flex h-full flex-col overflow-hidden rounded-lg border'>
      <SectionHeading
        eyebrow='SUBSCRIPTIONS'
        title='Choose a plan'
        description='Each subscription adds its own quota and validity period.'
        action={<Button variant='outline' size='sm' onClick={onViewActive}><ReceiptText />View active ({activeSubscriptions.length})</Button>}
      />
      <div className='flex flex-1 flex-col divide-y'>
        {subscriptionPlans.map((plan) => {
          const activeCount = planCounts[plan.id]
          return (
            <article key={plan.id} className={`grid flex-1 grid-cols-3 items-center gap-4 p-4 md:grid-cols-[minmax(150px,1.2fr)_repeat(3,minmax(82px,0.65fr))_auto] ${plan.featured ? 'bg-muted/25' : ''}`}>
              <div className='col-span-3 flex min-w-0 flex-wrap items-center gap-2 md:col-span-1'>
                <p className='text-sm font-semibold'>{plan.name}</p>
                {plan.featured ? <Badge variant='outline'><Star className='fill-warning-signal text-warning' />Featured</Badge> : null}
                {activeCount > 0 ? <Badge variant='outline'><Check className='text-success' />{activeCount} active</Badge> : null}
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-muted-foreground'>Price</p>
                <p className='mt-1 font-mono text-sm font-semibold tabular-nums'>{money(plan.price)}</p>
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-muted-foreground'>Validity</p>
                <p className='mt-1 text-sm font-medium'>{plan.validityDays} days</p>
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-muted-foreground'>Quota</p>
                <p className='mt-1 font-mono text-sm font-medium tabular-nums'>{money(plan.quota)}</p>
              </div>
              <Button
                variant={plan.featured ? 'default' : 'outline'}
                size='sm'
                className='col-span-3 w-full md:col-span-1 md:w-auto'
                disabled={disabled}
                onClick={(event) => onSubscribe(plan, event)}
              >
                <CreditCard />Subscribe
              </Button>
            </article>
          )
        })}
        <div className='grid gap-3 bg-muted/15 p-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)] md:items-end'>
          <div>
            <Label htmlFor='billing-preference'>Usage billing preference</Label>
            <p className='mt-1 text-xs text-muted-foreground'>Choose which funding source is used first for model usage.</p>
          </div>
          <Select disabled={disabled} value={preference} onValueChange={onPreference}>
            <SelectTrigger id='billing-preference' className='w-full'><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value='subscription_first'>Subscription first</SelectItem>
              <SelectItem value='wallet_first'>Balance first</SelectItem>
              <SelectItem value='subscription_only'>Subscription only</SelectItem>
              <SelectItem value='wallet_only'>Balance only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  )
}

function ActiveSubscriptionsOverlay({
  subscriptions,
  compact,
  triggerRef,
  onClose,
}: {
  subscriptions: ActiveSubscription[]
  compact: boolean
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
}) {
  const description = `${subscriptions.length} active ${subscriptions.length === 1 ? 'subscription' : 'subscriptions'} with independent quota and validity.`
  const closeAutoFocus = (event: Event) => { event.preventDefault(); triggerRef.current?.focus() }
  const changeOpen = (open: boolean) => { if (!open) onClose() }

  if (compact) {
    return (
      <Sheet open onOpenChange={changeOpen}>
        <SheetContent side='bottom' className='max-h-[90svh] overflow-y-auto' onCloseAutoFocus={closeAutoFocus}>
          <SheetHeader><SheetTitle>Active subscriptions</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
          <div className='px-4'><ActiveSubscriptionList subscriptions={subscriptions} /></div>
          <SheetFooter className='border-t'><Button variant='outline' onClick={onClose}>Close</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-2xl' onCloseAutoFocus={closeAutoFocus}>
        <DialogHeader><DialogTitle>Active subscriptions</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <ActiveSubscriptionList subscriptions={subscriptions} />
        <DialogFooter><Button variant='outline' onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TopUpSection({
  amount,
  disabled,
  onAmount,
  onContinue,
}: {
  amount: TopUpAmount
  disabled: boolean
  onAmount: (amount: TopUpAmount) => void
  onContinue: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <section className='flex h-full flex-col overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='BALANCE TOP-UP' title='Add funds' description='Select an amount, then review the payment.' />
      <fieldset disabled={disabled} className='flex-1'>
        <legend className='sr-only'>Top-up amount</legend>
        <div className='flex h-full flex-col divide-y'>
          {amountOptions.map((option) => {
            const discountPercent = Math.round((1 - discounts[option]) * 100)
            const paid = option * discounts[option]
            const selected = amount === option
            return (
              <button
                key={option}
                type='button'
                role='radio'
                aria-checked={selected}
                aria-label={`Amount ${money(option)}, discount ${discountPercent}%, pay ${money(paid)}`}
                disabled={disabled}
                onClick={() => onAmount(option)}
                className={`grid w-full flex-1 grid-cols-[repeat(3,minmax(0,1fr))_auto] items-center gap-3 px-4 py-3 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'bg-accent' : 'hover:bg-accent/60'}`}
              >
                <span className='min-w-0'>
                  <span className='block text-xs text-muted-foreground'>Amount</span>
                  <span className='mt-1 block font-mono text-sm font-semibold tabular-nums'>{money(option)}</span>
                </span>
                <span className='min-w-0'>
                  <span className='block text-xs text-muted-foreground'>Discount</span>
                  <span className='mt-1 block text-sm font-medium'>{discountPercent}%</span>
                </span>
                <span className='min-w-0'>
                  <span className='block text-xs text-muted-foreground'>Pay</span>
                  <span className='mt-1 block font-mono text-sm font-medium tabular-nums'>{money(paid)}</span>
                </span>
                <CheckCircle2 className={selected ? 'size-4 text-success' : 'size-4 invisible'} />
              </button>
            )
          })}
        </div>
      </fieldset>
      <div className='border-t bg-muted/15 p-4'>
        <Button className='w-full' disabled={disabled} onClick={onContinue}><CreditCard />Review top-up</Button>
      </div>
    </section>
  )
}

function RedemptionSection({
  code,
  error,
  busy,
  onCode,
  onSubmit,
}: {
  code: string
  error: string
  busy: boolean
  onCode: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <section className='flex h-full flex-col overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='REDEMPTION' title='Redeem a code' />
      <form className='flex flex-1 flex-col gap-3 p-4' onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
        <div className='space-y-2'>
          <Input
            id='redemption-code'
            value={code}
            disabled={busy}
            aria-invalid={Boolean(error)}
            aria-label='Redemption code'
            aria-describedby={error ? 'redemption-error' : undefined}
            autoComplete='off'
            placeholder='xxxxxxxx'
            onChange={(event) => onCode(event.target.value)}
          />
          {error ? <p id='redemption-error' role='alert' className='flex items-center gap-2 text-xs text-destructive'><AlertCircle className='size-4' />{error}</p> : <p className='text-xs text-muted-foreground'>Codes are applied directly to your account balance.</p>}
        </div>
        <Button type='submit' variant='outline' className='mt-auto w-full sm:w-auto sm:self-start' disabled={!code.trim() || busy}>
          {busy ? <LoaderCircle className='animate-spin' /> : <CircleDollarSign />}{busy ? 'Redeeming...' : 'Redeem code'}
        </Button>
      </form>
    </section>
  )
}

function RewardsSection({ rewards, disabled, onTransfer, onCopy }: { rewards: number; disabled: boolean; onTransfer: (event: MouseEvent<HTMLButtonElement>) => void; onCopy: () => void }) {
  return (
    <section className='flex h-full flex-col overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='REWARDS' title='Affiliate rewards' />
      <div className='grid gap-4 p-4 sm:grid-cols-3'>
        <div><p className='text-xs text-muted-foreground'>Pending rewards</p><p className='mt-1 font-mono text-lg font-semibold tabular-nums'>{money(rewards)}</p></div>
        <div><p className='text-xs text-muted-foreground'>Total earned</p><p className='mt-1 font-mono text-lg font-semibold tabular-nums'>$68.20</p></div>
        <div><p className='text-xs text-muted-foreground'>Invites</p><p className='mt-1 font-mono text-lg font-semibold tabular-nums'>14</p></div>
      </div>
      <div className='mt-auto border-t p-4'>
        <div className='flex items-end gap-2'>
          <div className='min-w-0 flex-1 space-y-2'>
            <Label htmlFor='referral-link'>Referral link</Label>
            <Input id='referral-link' value={referralLink} readOnly className='min-w-0 font-mono text-xs' />
          </div>
          <Button type='button' variant='outline' size='icon' className='shrink-0' aria-label='Copy referral link' title='Copy referral link' onClick={onCopy}><Copy /></Button>
          <Button variant='outline' className='shrink-0 px-3' disabled={disabled || rewards <= 0} onClick={onTransfer} aria-label='Transfer rewards to balance' title='Transfer rewards to balance'><WalletCards /><span className='hidden sm:inline'>Transfer to balance</span></Button>
        </div>
        {rewards <= 0 ? <p className='mt-2 text-xs text-muted-foreground'>All available rewards have been transferred.</p> : null}
      </div>
    </section>
  )
}

function BillingSkeleton() {
  return (
    <div className='space-y-3 p-4' aria-label='Loading billing history'>
      {[0, 1, 2].map((item) => <div key={item} className='grid grid-cols-[1.2fr_1fr_0.8fr] gap-4'><Skeleton className='h-9' /><Skeleton className='h-9' /><Skeleton className='h-9' /></div>)}
    </div>
  )
}

function BillingHistory({
  state,
  records,
  refreshing,
  disabled,
  onRefresh,
  onDetails,
}: {
  state: BillingState
  records: BillingRecord[]
  refreshing: boolean
  disabled: boolean
  onRefresh: () => void
  onDetails: (record: BillingRecord, event: MouseEvent<HTMLButtonElement>) => void
}) {
  const action = (
    <Button variant='outline' size='sm' disabled={disabled && !refreshing} onClick={onRefresh}>
      {refreshing ? <X /> : <RefreshCw className={state === 'loading' && !refreshing ? 'animate-spin' : ''} />}
      {refreshing ? 'Cancel refresh' : 'Refresh'}
    </Button>
  )

  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='HISTORY' title='Billing history' action={action} />
      {state === 'loading' ? <BillingSkeleton /> : null}
      {state === 'empty' ? (
        <div className='flex min-h-48 flex-col items-center justify-center px-4 py-10 text-center'>
          <ReceiptText className='size-8 text-muted-foreground' />
          <h3 className='mt-3 text-sm font-semibold'>No billing records</h3>
          <p className='mt-1 max-w-sm text-sm text-muted-foreground'>Completed top-ups and balance transfers will appear here.</p>
        </div>
      ) : null}
      {state === 'error' ? (
        <div className='flex min-h-48 flex-col items-center justify-center px-4 py-10 text-center'>
          <AlertCircle className='size-8 text-destructive' />
          <h3 className='mt-3 text-sm font-semibold'>Billing history unavailable</h3>
          <p className='mt-1 max-w-sm text-sm text-muted-foreground'>The simulated request could not be completed.</p>
          <Button variant='outline' className='mt-4' disabled={disabled} onClick={onRefresh}><RotateCcw />Retry</Button>
        </div>
      ) : null}
      {state === 'ready' ? (
        <>
          <div className='hidden md:block'>
            <Table>
              <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Time</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead><TableHead>Paid</TableHead><TableHead>Status</TableHead><TableHead><span className='sr-only'>Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>{records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell><code className='font-mono text-xs'>{record.id}</code><span className='mt-0.5 block text-xs text-muted-foreground'>{record.type}</span></TableCell>
                  <TableCell className='whitespace-nowrap text-xs'>{record.time}</TableCell>
                  <TableCell>{record.paymentMethod}</TableCell>
                  <TableCell className='font-mono text-xs tabular-nums'>{money(record.amount)}</TableCell>
                  <TableCell className='font-mono text-xs tabular-nums'>{money(record.paid)}</TableCell>
                  <TableCell><Badge variant='outline'><Check className='text-success' />{record.status}</Badge></TableCell>
                  <TableCell className='text-end'><Button variant='ghost' size='icon' aria-label={`View ${record.id}`} onClick={(event) => onDetails(record, event)}><Eye /></Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
          <div className='divide-y md:hidden'>
            {records.map((record) => (
              <article key={record.id} className='p-4'>
                <div className='flex min-w-0 items-start justify-between gap-3'>
                  <div className='min-w-0'><p className='text-sm font-medium'>{record.type}</p><code className='mt-1 block break-all font-mono text-xs text-muted-foreground'>{record.id}</code></div>
                  <Badge variant='outline'><Check className='text-success' />{record.status}</Badge>
                </div>
                <dl className='mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm'>
                  <div><dt className='text-xs text-muted-foreground'>Amount</dt><dd className='mt-1 font-mono tabular-nums'>{money(record.amount)}</dd></div>
                  <div><dt className='text-xs text-muted-foreground'>Paid</dt><dd className='mt-1 font-mono tabular-nums'>{money(record.paid)}</dd></div>
                  <div><dt className='text-xs text-muted-foreground'>Method</dt><dd className='mt-1'>{record.paymentMethod}</dd></div>
                  <div><dt className='text-xs text-muted-foreground'>Time</dt><dd className='mt-1 text-xs'>{record.time}</dd></div>
                </dl>
                <Button variant='outline' size='sm' className='mt-4 w-full' onClick={(event) => onDetails(record, event)}><Eye />View details</Button>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

function PaymentMethodField({ method, disabled, onMethod }: { method: PaymentMethod; disabled: boolean; onMethod: (method: PaymentMethod) => void }) {
  return (
    <div className='space-y-2 border-t p-3'>
      <Label htmlFor='overlay-payment-method'>Payment method</Label>
      <Select disabled={disabled} value={method} onValueChange={(value) => onMethod(value as PaymentMethod)}>
        <SelectTrigger id='overlay-payment-method' className='w-full'><CreditCard /><SelectValue /></SelectTrigger>
        <SelectContent>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )
}

function ConfirmationBody({
  overlay,
  disabled,
  onPaymentMethod,
}: {
  overlay: Exclude<Overlay, null | { kind: 'detail' }>
  disabled: boolean
  onPaymentMethod: (method: PaymentMethod) => void
}) {
  if (overlay.kind === 'transfer') {
    return (
      <dl className='divide-y rounded-md border text-sm'>
        <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Pending rewards</dt><dd className='font-mono tabular-nums'>{money(overlay.amount)}</dd></div>
        <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Account balance credit</dt><dd className='font-mono font-semibold tabular-nums'>+{money(overlay.amount)}</dd></div>
      </dl>
    )
  }

  if (overlay.kind === 'subscription') {
    return (
      <div className='overflow-hidden rounded-md border text-sm'>
        <dl className='divide-y'>
          <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Plan</dt><dd className='font-medium'>{overlay.plan.name}</dd></div>
          <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Validity</dt><dd>{overlay.plan.validityDays} days</dd></div>
          <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Included quota</dt><dd className='font-mono tabular-nums'>{money(overlay.plan.quota)}</dd></div>
          <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Due today</dt><dd className='font-mono font-semibold tabular-nums'>{money(overlay.plan.price)}</dd></div>
        </dl>
        <PaymentMethodField method={overlay.method} disabled={disabled} onMethod={onPaymentMethod} />
      </div>
    )
  }

  const { snapshot } = overlay
  return (
    <div className='overflow-hidden rounded-md border text-sm'>
      <dl className='divide-y'>
        <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Amount</dt><dd className='font-mono tabular-nums'>{money(snapshot.amount)}</dd></div>
        <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Discount</dt><dd className='font-mono tabular-nums'>{Math.round((1 - snapshot.discount) * 100)}%</dd></div>
        <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>You pay</dt><dd className='font-mono font-semibold tabular-nums'>{money(snapshot.paid)}</dd></div>
        <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Balance after</dt><dd className='font-mono font-semibold tabular-nums'>{money(snapshot.resultingBalance)}</dd></div>
      </dl>
      <PaymentMethodField method={snapshot.method} disabled={disabled} onMethod={onPaymentMethod} />
    </div>
  )
}

function BillingDetail({ record }: { record: BillingRecord }) {
  return (
    <dl className='divide-y rounded-md border text-sm'>
      <div className='p-3'><dt className='text-xs text-muted-foreground'>Order</dt><dd className='mt-1 break-all font-mono text-xs'>{record.id}</dd></div>
      <div className='p-3'><dt className='text-xs text-muted-foreground'>Type</dt><dd className='mt-1'>{record.type}</dd></div>
      <div className='p-3'><dt className='text-xs text-muted-foreground'>Time</dt><dd className='mt-1'>{record.time}</dd></div>
      <div className='grid grid-cols-2 gap-4 p-3'><div><dt className='text-xs text-muted-foreground'>Amount</dt><dd className='mt-1 font-mono tabular-nums'>{money(record.amount)}</dd></div><div><dt className='text-xs text-muted-foreground'>Paid</dt><dd className='mt-1 font-mono tabular-nums'>{money(record.paid)}</dd></div></div>
      <div className='grid grid-cols-2 gap-4 p-3'><div><dt className='text-xs text-muted-foreground'>Payment method</dt><dd className='mt-1'>{record.paymentMethod}</dd></div><div><dt className='text-xs text-muted-foreground'>Status</dt><dd className='mt-1'><Badge variant='outline'><Check className='text-success' />{record.status}</Badge></dd></div></div>
    </dl>
  )
}

function WalletOverlay({
  overlay,
  processing,
  compact,
  triggerRef,
  onClose,
  onConfirm,
  onPaymentMethod,
}: {
  overlay: Exclude<Overlay, null>
  processing: ProcessingKind
  compact: boolean
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
  onPaymentMethod: (method: PaymentMethod) => void
}) {
  const isDetail = overlay.kind === 'detail'
  const title = isDetail
    ? 'Billing details'
    : overlay.kind === 'topup'
      ? 'Confirm top-up'
      : overlay.kind === 'subscription'
        ? 'Confirm subscription'
        : 'Transfer rewards'
  const description = isDetail
    ? `${overlay.record.type} · ${overlay.record.time}`
    : overlay.kind === 'topup'
      ? 'Review this simulated payment before adding funds.'
      : overlay.kind === 'subscription'
        ? `Subscribe to ${overlay.plan.name} for ${overlay.plan.validityDays} days.`
        : 'Move all pending affiliate rewards into the account balance.'
  const busy = processing !== null
  const body = isDetail ? <BillingDetail record={overlay.record} /> : <ConfirmationBody overlay={overlay} disabled={busy} onPaymentMethod={onPaymentMethod} />
  const footer = isDetail ? (
    <Button variant='outline' onClick={onClose}>Close</Button>
  ) : (
    <>
      <Button variant='outline' disabled={busy} onClick={onClose}>Cancel</Button>
      <Button disabled={busy} onClick={onConfirm}>
        {busy ? <LoaderCircle className='animate-spin' /> : <CheckCircle2 />}
        {busy ? 'Processing...' : overlay.kind === 'topup' ? 'Confirm top-up' : overlay.kind === 'subscription' ? 'Confirm subscription' : 'Confirm transfer'}
      </Button>
    </>
  )
  const closeAutoFocus = (event: Event) => { event.preventDefault(); triggerRef.current?.focus() }
  const changeOpen = (open: boolean) => { if (!open && !busy) onClose() }

  if (compact) {
    return (
      <Sheet open onOpenChange={changeOpen}>
        <SheetContent
          side='bottom'
          className={`max-h-[90svh] overflow-y-auto ${busy ? '[&>button]:pointer-events-none [&>button]:opacity-50' : ''}`}
          onCloseAutoFocus={closeAutoFocus}
          onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
          onInteractOutside={(event) => { if (busy) event.preventDefault() }}
        >
          <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
          <div className='px-4'>{body}</div>
          <SheetFooter className='border-t'>{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent
        className='max-h-[90svh] overflow-y-auto sm:max-w-md'
        showCloseButton={!busy}
        onCloseAutoFocus={closeAutoFocus}
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
      >
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        {body}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ShadcnWalletScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  const [balance, setBalance] = useState(82.4)
  const [pendingRewards, setPendingRewards] = useState(12.8)
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSubscription[]>(initialActiveSubscriptions)
  const [amount, setAmount] = useState<TopUpAmount>(50)
  const [method, setMethod] = useState<PaymentMethod>('Stripe')
  const [preference, setPreference] = useState('subscription_first')
  const [redemption, setRedemption] = useState('')
  const [redemptionError, setRedemptionError] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [billingHistory, setBillingHistory] = useState(initialBillingHistory)
  const [billingState, setBillingState] = useState<BillingState>('ready')
  const [refreshing, setRefreshing] = useState(false)
  const [processing, setProcessing] = useState<ProcessingKind>(null)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false)
  const compactOverlay = useCompactOverlay()
  const overlayTriggerRef = useRef<HTMLElement | null>(null)
  const activeSubscriptionsTriggerRef = useRef<HTMLElement | null>(null)
  const operationTimerRef = useRef<number | null>(null)
  const redemptionTimerRef = useRef<number | null>(null)
  const refreshTimerRef = useRef<number | null>(null)
  const previousBillingStateRef = useRef<BillingState>('ready')
  const processedOperationsRef = useRef(new Set<string>())

  const clearTimer = (timer: { current: number | null }) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => () => {
    clearTimer(operationTimerRef)
    clearTimer(redemptionTimerRef)
    clearTimer(refreshTimerRef)
  }, [])

  const busy = processing !== null || redeeming

  const updatePreference = (value: string) => {
    setPreference(value)
    toast.success('Billing preference updated', { description: 'New usage will follow the selected funding order.', duration: 5000 })
  }

  const copyReferralLink = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(referralLink)
      toast.success('Referral link copied', { duration: 4000 })
    } catch {
      toast.error('Referral link could not be copied', { duration: 5000 })
    }
  }

  const updateOverlayPaymentMethod = (nextMethod: PaymentMethod) => {
    setMethod(nextMethod)
    setOverlay((current) => {
      if (current?.kind === 'topup') return { ...current, snapshot: { ...current.snapshot, method: nextMethod } }
      if (current?.kind === 'subscription') return { ...current, method: nextMethod }
      return current
    })
  }

  const openSubscription = (plan: SubscriptionPlan, event: MouseEvent<HTMLButtonElement>) => {
    clearTimer(operationTimerRef)
    setProcessing(null)
    overlayTriggerRef.current = event.currentTarget
    setOverlay({ kind: 'subscription', operationId: operationId('SUBSCRIPTION'), plan, method })
  }

  const openActiveSubscriptions = (event: MouseEvent<HTMLButtonElement>) => {
    activeSubscriptionsTriggerRef.current = event.currentTarget
    setSubscriptionsOpen(true)
  }

  const openTopUp = (event: MouseEvent<HTMLButtonElement>) => {
    clearTimer(operationTimerRef)
    setProcessing(null)
    overlayTriggerRef.current = event.currentTarget
    const discount = discounts[amount]
    setOverlay({
      kind: 'topup',
      snapshot: {
        operationId: operationId('TOPUP'),
        amount,
        discount,
        method,
        paid: amount * discount,
        resultingBalance: balance + amount,
      },
    })
  }

  const openTransfer = (event: MouseEvent<HTMLButtonElement>) => {
    if (pendingRewards <= 0) return
    clearTimer(operationTimerRef)
    setProcessing(null)
    overlayTriggerRef.current = event.currentTarget
    setOverlay({ kind: 'transfer', operationId: operationId('REWARD'), amount: pendingRewards })
  }

  const closeOverlay = () => {
    clearTimer(operationTimerRef)
    setProcessing(null)
    setOverlay(null)
  }

  const confirmOverlay = () => {
    if (!overlay || overlay.kind === 'detail' || processing) return
    clearTimer(operationTimerRef)
    const current = overlay
    setProcessing(current.kind)
    operationTimerRef.current = window.setTimeout(() => {
      const id = current.kind === 'topup' ? current.snapshot.operationId : current.operationId
      if (processedOperationsRef.current.has(id)) return
      processedOperationsRef.current.add(id)

      if (current.kind === 'topup') {
        const { snapshot } = current
        setBalance((value) => value + snapshot.amount)
        setBillingHistory((records) => [{
          id: `PT-${billingDateKey()}-${Math.floor(1000 + Math.random() * 9000)}`,
          time: billingTimestamp(),
          type: 'Balance top-up',
          paymentMethod: snapshot.method,
          amount: snapshot.amount,
          paid: snapshot.paid,
          status: 'Success',
        }, ...records])
        setBillingState('ready')
        toast.success('Balance top-up complete', { description: `${money(snapshot.amount)} added via ${snapshot.method}.`, duration: 6000 })
      } else if (current.kind === 'subscription') {
        setActiveSubscriptions((subscriptions) => [...subscriptions, createActiveSubscription(current.plan, current.operationId)])
        setBillingHistory((records) => [{
          id: `SP-${billingDateKey()}-${Math.floor(1000 + Math.random() * 9000)}`,
          time: billingTimestamp(),
          type: 'Subscription',
          paymentMethod: current.method,
          amount: current.plan.price,
          paid: current.plan.price,
          status: 'Success',
        }, ...records])
        setBillingState('ready')
        toast.success(`${current.plan.name} subscription added`, { description: `${money(current.plan.quota)} quota added for ${current.plan.validityDays} days.`, duration: 6000 })
      } else {
        setBalance((value) => value + current.amount)
        setPendingRewards((value) => Math.max(0, value - current.amount))
        setBillingHistory((records) => [{
          id: `RW-${billingDateKey()}-${Math.floor(1000 + Math.random() * 9000)}`,
          time: billingTimestamp(),
          type: 'Affiliate transfer',
          paymentMethod: 'Affiliate rewards',
          amount: current.amount,
          paid: current.amount,
          status: 'Success',
        }, ...records])
        setBillingState('ready')
        toast.success('Rewards transferred', { description: `${money(current.amount)} added to the account balance.`, duration: 6000 })
      }

      operationTimerRef.current = null
      setProcessing(null)
      setOverlay(null)
    }, 900)
  }

  const submitRedemption = () => {
    clearTimer(redemptionTimerRef)
    const normalized = redemption.trim().toUpperCase()
    if (!normalized) return
    if (normalized !== 'PT-DEMO-2026') {
      setRedemptionError('This redemption code is not valid.')
      toast.error('Redemption failed', { description: 'Check the code and try again.', duration: 6000 })
      return
    }

    setRedemptionError('')
    setRedeeming(true)
    const id = operationId('REDEEM')
    redemptionTimerRef.current = window.setTimeout(() => {
      if (processedOperationsRef.current.has(id)) return
      processedOperationsRef.current.add(id)
      setBalance((value) => value + 10)
      setBillingHistory((records) => [{
        id: `RC-${billingDateKey()}-${Math.floor(1000 + Math.random() * 9000)}`,
        time: billingTimestamp(),
        type: 'Redemption',
        paymentMethod: 'Redemption code',
        amount: 10,
        paid: 0,
        status: 'Success',
      }, ...records])
      setBillingState('ready')
      setRedemption('')
      setRedeeming(false)
      redemptionTimerRef.current = null
      toast.success('Code redeemed', { description: '$10.00 added to the account balance.', duration: 6000 })
    }, 600)
  }

  const refreshBilling = () => {
    if (refreshing) {
      clearTimer(refreshTimerRef)
      setRefreshing(false)
      setBillingState(previousBillingStateRef.current)
      toast.info('Refresh cancelled', { duration: 4000 })
      return
    }
    clearTimer(refreshTimerRef)
    previousBillingStateRef.current = billingState === 'loading' ? 'ready' : billingState
    setRefreshing(true)
    setBillingState('loading')
    refreshTimerRef.current = window.setTimeout(() => {
      setBillingState('ready')
      setRefreshing(false)
      refreshTimerRef.current = null
      toast.success('Billing history refreshed', { duration: 4000 })
    }, 800)
  }

  const previewBillingState = (state: BillingState) => {
    clearTimer(refreshTimerRef)
    setRefreshing(false)
    setBillingState(state)
    if (state === 'error') toast.error('Billing history unavailable', { description: 'Error preview is active.', duration: 5000 })
    if (state === 'empty') toast.info('Empty billing history', { description: 'Empty preview is active.', duration: 5000 })
  }

  const openDetails = (record: BillingRecord, event: MouseEvent<HTMLButtonElement>) => {
    overlayTriggerRef.current = event.currentTarget
    setOverlay({ kind: 'detail', record })
  }

  return (
    <ConsoleShell activeRoute='console-wallet' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-bold tracking-tight'>Wallet</h1>
          <p className='mt-1 text-muted-foreground'>Manage account funds, billing order, and rewards.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant='outline' size='icon' aria-label='More wallet actions' disabled={busy || refreshing}><Ellipsis /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>Preview billing state</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={billingState} onValueChange={(value) => previewBillingState(value as BillingState)}>
              <DropdownMenuRadioItem value='ready'>Sample records</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='loading'>Loading</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='empty'>Empty</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='error'>Error</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <BalanceSummary balance={balance} pendingRewards={pendingRewards} activeSubscriptions={activeSubscriptions} />

      <div className='grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]'>
        <SubscriptionSection activeSubscriptions={activeSubscriptions} preference={preference} disabled={busy} onPreference={updatePreference} onSubscribe={openSubscription} onViewActive={openActiveSubscriptions} />
        <TopUpSection amount={amount} disabled={busy} onAmount={setAmount} onContinue={openTopUp} />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <RedemptionSection code={redemption} error={redemptionError} busy={busy} onCode={(value) => { setRedemption(value); setRedemptionError('') }} onSubmit={submitRedemption} />
        <RewardsSection rewards={pendingRewards} disabled={busy} onTransfer={openTransfer} onCopy={() => void copyReferralLink()} />
      </div>

      <BillingHistory state={billingState} records={billingHistory} refreshing={refreshing} disabled={busy} onRefresh={refreshBilling} onDetails={openDetails} />

      {subscriptionsOpen ? <ActiveSubscriptionsOverlay subscriptions={activeSubscriptions} compact={compactOverlay} triggerRef={activeSubscriptionsTriggerRef} onClose={() => setSubscriptionsOpen(false)} /> : null}

      {overlay ? (
        <WalletOverlay
          overlay={overlay}
          processing={processing}
          compact={compactOverlay}
          triggerRef={overlayTriggerRef}
          onClose={closeOverlay}
          onConfirm={confirmOverlay}
          onPaymentMethod={updateOverlayPaymentMethod}
        />
      ) : null}
    </ConsoleShell>
  )
}
