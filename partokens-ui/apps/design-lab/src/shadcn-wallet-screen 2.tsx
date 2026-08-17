import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Ellipsis,
  Eye,
  Gift,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  RotateCcw,
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
type ProcessingKind = 'topup' | 'transfer' | null

type BillingRecord = {
  id: string
  time: string
  type: 'Balance top-up' | 'Affiliate transfer' | 'Redemption'
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
  | { kind: 'detail'; record: BillingRecord }
  | null

const amountOptions: TopUpAmount[] = [10, 25, 50, 100]
const paymentMethods: PaymentMethod[] = ['Stripe', 'Alipay', 'WeChat Pay']
const discounts: Record<TopUpAmount, number> = { 10: 1, 25: 0.96, 50: 0.92, 100: 0.88 }

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

function BalanceSummary({ balance, pendingRewards }: { balance: number; pendingRewards: number }) {
  const metrics = [
    { label: 'Account balance', value: money(balance), icon: WalletCards },
    { label: 'Total usage', value: '$126.54', icon: CircleDollarSign },
    { label: 'Pending rewards', value: money(pendingRewards), icon: Gift },
    { label: 'Active plan', value: 'Builder', icon: ReceiptText },
  ]

  return (
    <section aria-label='Balance summary' className='grid overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4 lg:divide-x'>
      {metrics.map(({ label, value, icon: Icon }, index) => (
        <div key={label} className={`min-w-0 p-4 ${index > 0 ? 'border-t sm:border-t-0' : ''} ${index > 1 ? 'sm:border-t' : ''} lg:border-t-0`}>
          <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground'><Icon className='size-4' />{label}</div>
          <p className='mt-2 font-mono text-xl font-semibold tabular-nums'>{value}</p>
          <p className='mt-1 text-xs text-muted-foreground'>{label === 'Active plan' ? 'Renews Aug 15, 2026' : 'USD account'}</p>
        </div>
      ))}
    </section>
  )
}

function SubscriptionSection({ preference, disabled, onPreference }: { preference: string; disabled: boolean; onPreference: (value: string) => void }) {
  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='SUBSCRIPTION' title='Current plan' action={<Badge variant='outline'><Check className='text-emerald-600' />Active</Badge>} />
      <div className='divide-y'>
        <div className='grid gap-4 p-4 sm:grid-cols-2'>
          <div><p className='text-sm font-medium'>Builder</p><p className='mt-1 text-sm text-muted-foreground'>$20.00 included quota / 30 days</p></div>
          <div><p className='text-xs text-muted-foreground'>Renews on</p><p className='mt-1 font-mono text-sm font-medium tabular-nums'>2026-08-15</p></div>
        </div>
        <div className='space-y-2 p-4'>
          <Label htmlFor='billing-preference'>Usage billing preference</Label>
          <Select disabled={disabled} value={preference} onValueChange={onPreference}>
            <SelectTrigger id='billing-preference' className='w-full'><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value='subscription_first'>Subscription first</SelectItem>
              <SelectItem value='wallet_first'>Balance first</SelectItem>
              <SelectItem value='subscription_only'>Subscription only</SelectItem>
              <SelectItem value='wallet_only'>Balance only</SelectItem>
            </SelectContent>
          </Select>
          <p className='text-xs text-muted-foreground'>Controls which available funding source is used for model usage.</p>
        </div>
      </div>
    </section>
  )
}

function TopUpSection({
  amount,
  balance,
  method,
  disabled,
  onAmount,
  onMethod,
  onContinue,
}: {
  amount: TopUpAmount
  balance: number
  method: PaymentMethod
  disabled: boolean
  onAmount: (amount: TopUpAmount) => void
  onMethod: (method: PaymentMethod) => void
  onContinue: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const discount = discounts[amount]
  const paid = amount * discount
  const discountPercent = Math.round((1 - discount) * 100)

  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='BALANCE TOP-UP' title='Add funds' description='Choose a configured amount and payment method.' />
      <div className='grid divide-y lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] lg:divide-x lg:divide-y-0'>
        <div className='space-y-5 p-4'>
          <fieldset disabled={disabled}>
            <legend className='text-sm font-medium'>Amount</legend>
            <div className='mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2'>
              {amountOptions.map((option) => {
                const optionDiscount = Math.round((1 - discounts[option]) * 100)
                const selected = amount === option
                return (
                  <button
                    key={option}
                    type='button'
                    role='radio'
                    aria-checked={selected}
                    disabled={disabled}
                    onClick={() => onAmount(option)}
                    className={`min-w-0 rounded-md border px-3 py-3 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-foreground bg-accent' : 'hover:bg-accent/60'}`}
                  >
                    <span className='block font-mono text-base font-semibold tabular-nums'>${option}</span>
                    <span className='mt-1 block text-xs text-muted-foreground'>{optionDiscount ? `${optionDiscount}% off` : 'No discount'}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
          <div className='space-y-2'>
            <Label htmlFor='payment-method'>Payment method</Label>
            <Select disabled={disabled} value={method} onValueChange={(value) => onMethod(value as PaymentMethod)}>
              <SelectTrigger id='payment-method' className='w-full'><CreditCard /><SelectValue /></SelectTrigger>
              <SelectContent>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className='flex min-w-0 flex-col bg-muted/20 p-4'>
          <p className='text-sm font-medium'>Payment preview</p>
          <dl className='mt-3 divide-y text-sm'>
            <div className='flex justify-between gap-4 py-2'><dt className='text-muted-foreground'>Top-up amount</dt><dd className='font-mono tabular-nums'>{money(amount)}</dd></div>
            <div className='flex justify-between gap-4 py-2'><dt className='text-muted-foreground'>Discount</dt><dd className='font-mono tabular-nums'>{discountPercent}%</dd></div>
            <div className='flex justify-between gap-4 py-2'><dt className='text-muted-foreground'>You pay</dt><dd className='font-mono font-semibold tabular-nums'>{money(paid)}</dd></div>
            <div className='flex justify-between gap-4 py-2'><dt className='text-muted-foreground'>Balance after</dt><dd className='font-mono font-semibold tabular-nums'>{money(balance + amount)}</dd></div>
          </dl>
          <p className='mt-3 flex items-center gap-2 text-xs text-muted-foreground'><CheckCircle2 className='size-4 text-emerald-600' />{method} · simulated payment</p>
          <Button className='mt-4 w-full' disabled={disabled} onClick={onContinue}><CreditCard />Review top-up</Button>
        </div>
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
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='REDEMPTION' title='Redeem a code' />
      <form className='space-y-3 p-4' onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
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
        <Button type='submit' variant='outline' className='w-full sm:w-auto' disabled={!code.trim() || busy}>
          {busy ? <LoaderCircle className='animate-spin' /> : <CircleDollarSign />}{busy ? 'Redeeming...' : 'Redeem code'}
        </Button>
      </form>
    </section>
  )
}

function RewardsSection({ rewards, disabled, onTransfer }: { rewards: number; disabled: boolean; onTransfer: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <section className='overflow-hidden rounded-lg border'>
      <SectionHeading eyebrow='REWARDS' title='Affiliate rewards' />
      <div className='grid gap-4 p-4 sm:grid-cols-3'>
        <div><p className='text-xs text-muted-foreground'>Pending rewards</p><p className='mt-1 font-mono text-lg font-semibold tabular-nums'>{money(rewards)}</p></div>
        <div><p className='text-xs text-muted-foreground'>Total earned</p><p className='mt-1 font-mono text-lg font-semibold tabular-nums'>$68.20</p></div>
        <div><p className='text-xs text-muted-foreground'>Invites</p><p className='mt-1 font-mono text-lg font-semibold tabular-nums'>14</p></div>
      </div>
      <div className='border-t p-4'>
        <Button variant='outline' className='w-full sm:w-auto' disabled={disabled || rewards <= 0} onClick={onTransfer}><WalletCards />Transfer to balance</Button>
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
                  <TableCell><Badge variant='outline'><Check className='text-emerald-600' />{record.status}</Badge></TableCell>
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
                  <Badge variant='outline'><Check className='text-emerald-600' />{record.status}</Badge>
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

function ConfirmationBody({ overlay }: { overlay: Exclude<Overlay, null | { kind: 'detail' }> }) {
  if (overlay.kind === 'transfer') {
    return (
      <dl className='divide-y rounded-md border text-sm'>
        <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Pending rewards</dt><dd className='font-mono tabular-nums'>{money(overlay.amount)}</dd></div>
        <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Account balance credit</dt><dd className='font-mono font-semibold tabular-nums'>+{money(overlay.amount)}</dd></div>
      </dl>
    )
  }

  const { snapshot } = overlay
  return (
    <dl className='divide-y rounded-md border text-sm'>
      <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Amount</dt><dd className='font-mono tabular-nums'>{money(snapshot.amount)}</dd></div>
      <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Discount</dt><dd className='font-mono tabular-nums'>{Math.round((1 - snapshot.discount) * 100)}%</dd></div>
      <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Payment method</dt><dd>{snapshot.method}</dd></div>
      <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>You pay</dt><dd className='font-mono font-semibold tabular-nums'>{money(snapshot.paid)}</dd></div>
      <div className='flex justify-between gap-4 p-3'><dt className='text-muted-foreground'>Balance after</dt><dd className='font-mono font-semibold tabular-nums'>{money(snapshot.resultingBalance)}</dd></div>
    </dl>
  )
}

function BillingDetail({ record }: { record: BillingRecord }) {
  return (
    <dl className='divide-y rounded-md border text-sm'>
      <div className='p-3'><dt className='text-xs text-muted-foreground'>Order</dt><dd className='mt-1 break-all font-mono text-xs'>{record.id}</dd></div>
      <div className='p-3'><dt className='text-xs text-muted-foreground'>Type</dt><dd className='mt-1'>{record.type}</dd></div>
      <div className='p-3'><dt className='text-xs text-muted-foreground'>Time</dt><dd className='mt-1'>{record.time}</dd></div>
      <div className='grid grid-cols-2 gap-4 p-3'><div><dt className='text-xs text-muted-foreground'>Amount</dt><dd className='mt-1 font-mono tabular-nums'>{money(record.amount)}</dd></div><div><dt className='text-xs text-muted-foreground'>Paid</dt><dd className='mt-1 font-mono tabular-nums'>{money(record.paid)}</dd></div></div>
      <div className='grid grid-cols-2 gap-4 p-3'><div><dt className='text-xs text-muted-foreground'>Payment method</dt><dd className='mt-1'>{record.paymentMethod}</dd></div><div><dt className='text-xs text-muted-foreground'>Status</dt><dd className='mt-1'><Badge variant='outline'><Check className='text-emerald-600' />{record.status}</Badge></dd></div></div>
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
}: {
  overlay: Exclude<Overlay, null>
  processing: ProcessingKind
  compact: boolean
  triggerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
}) {
  const isDetail = overlay.kind === 'detail'
  const title = isDetail ? 'Billing details' : overlay.kind === 'topup' ? 'Confirm top-up' : 'Transfer rewards'
  const description = isDetail
    ? `${overlay.record.type} · ${overlay.record.time}`
    : overlay.kind === 'topup'
      ? 'Review this simulated payment before adding funds.'
      : 'Move all pending affiliate rewards into the account balance.'
  const busy = processing !== null
  const body = isDetail ? <BillingDetail record={overlay.record} /> : <ConfirmationBody overlay={overlay} />
  const footer = isDetail ? (
    <Button variant='outline' onClick={onClose}>Close</Button>
  ) : (
    <>
      <Button variant='outline' disabled={busy} onClick={onClose}>Cancel</Button>
      <Button disabled={busy} onClick={onConfirm}>
        {busy ? <LoaderCircle className='animate-spin' /> : <CheckCircle2 />}
        {busy ? 'Processing...' : overlay.kind === 'topup' ? 'Confirm top-up' : 'Confirm transfer'}
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
  const compactOverlay = useCompactOverlay()
  const overlayTriggerRef = useRef<HTMLElement | null>(null)
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

      <BalanceSummary balance={balance} pendingRewards={pendingRewards} />

      <div className='grid items-start gap-4 xl:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)]'>
        <SubscriptionSection preference={preference} disabled={busy} onPreference={updatePreference} />
        <TopUpSection amount={amount} balance={balance} method={method} disabled={busy} onAmount={setAmount} onMethod={setMethod} onContinue={openTopUp} />
      </div>

      <div className='grid items-start gap-4 lg:grid-cols-2'>
        <RedemptionSection code={redemption} error={redemptionError} busy={busy} onCode={(value) => { setRedemption(value); setRedemptionError('') }} onSubmit={submitRedemption} />
        <RewardsSection rewards={pendingRewards} disabled={busy} onTransfer={openTransfer} />
      </div>

      <BillingHistory state={billingState} records={billingHistory} refreshing={refreshing} disabled={busy} onRefresh={refreshBilling} onDetails={openDetails} />

      {overlay ? (
        <WalletOverlay
          overlay={overlay}
          processing={processing}
          compact={compactOverlay}
          triggerRef={overlayTriggerRef}
          onClose={closeOverlay}
          onConfirm={confirmOverlay}
        />
      ) : null}
    </ConsoleShell>
  )
}
