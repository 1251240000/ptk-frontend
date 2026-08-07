import { AlertCircle, LoaderCircle, RefreshCw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button, Skeleton } from '@partokens/design-system/components'

export function AccountPageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function AccountSectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <header className="flex min-w-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40"><Icon className="size-4" /></span> : null}
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-0.5 text-base font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function AccountFeedback({ kind, children }: { kind: 'success' | 'error'; children: ReactNode }) {
  return (
    <div
      className={kind === 'success'
        ? 'flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground'
        : 'flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-foreground'}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <AlertCircle className={kind === 'success' ? 'mt-0.5 size-4 shrink-0 text-success' : 'mt-0.5 size-4 shrink-0 text-destructive'} />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

export function AccountDataState({
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  retryLabel,
  onRetry,
  children,
}: {
  loading: boolean
  error?: string | null
  empty?: boolean
  emptyTitle: string
  emptyDescription?: string
  retryLabel: string
  onRetry?: () => void
  children: ReactNode
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-4" aria-busy="true" aria-label={emptyTitle}>
        {[0, 1, 2].map((item) => <Skeleton key={item} className="h-14 w-full" />)}
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex min-h-40 flex-col items-start justify-center gap-3 p-4" role="alert">
        <div className="flex items-start gap-2 text-sm"><AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" /><span>{error}</span></div>
        {onRetry ? <Button type="button" variant="outline" size="sm" onClick={onRetry}><RefreshCw />{retryLabel}</Button> : null}
      </div>
    )
  }
  if (empty) {
    return (
      <div className="flex min-h-40 flex-col items-start justify-center p-4">
        <p className="text-sm font-medium">{emptyTitle}</p>
        {emptyDescription ? <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p> : null}
      </div>
    )
  }
  return children
}

export function PendingLabel({ pending, pendingText, children }: { pending: boolean; pendingText: string; children: ReactNode }) {
  return <>{pending ? <LoaderCircle className="animate-spin" /> : null}{pending ? pendingText : children}</>
}
