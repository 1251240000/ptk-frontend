import type { ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button, Skeleton } from '@partokens/design-system/components'

export const consoleRouteRetryStorageKey = 'partokens-console-route-retry'

export function ConsoleRoutePending() {
  const { t } = useTranslation()

  return (
    <div role="status" aria-live="polite" aria-label={t('Loading Console page')} className="space-y-6" data-console-route-pending>
      <span className="sr-only">{t('Loading Console page...')}</span>
      <div className="flex items-center gap-3">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        <Skeleton className="h-6 w-44" />
      </div>
      <Skeleton className="h-24 w-full rounded-md" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  )
}

export function ConsoleRouteError({ reset }: ErrorComponentProps) {
  const { t } = useTranslation()

  const retry = () => {
    window.sessionStorage.setItem(consoleRouteRetryStorageKey, `${window.location.pathname}${window.location.search}`)
    reset()
    window.location.reload()
  }

  return (
    <div role="alert" className="flex min-h-[min(32rem,70svh)] flex-col items-center justify-center px-6 py-12 text-center" data-console-route-error>
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10">
        <AlertTriangle className="size-5 text-destructive" />
      </div>
      <h1 className="text-base font-semibold">{t('Console page could not be loaded')}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('Check your connection, then retry. Your location and filters will be preserved.')}</p>
      <Button className="mt-5" variant="outline" onClick={retry}><RefreshCw />{t('Try again')}</Button>
    </div>
  )
}

export const consoleRouteAsyncOptions = {
  pendingComponent: ConsoleRoutePending,
  errorComponent: ConsoleRouteError,
  pendingMs: 150,
  pendingMinMs: 300,
} as const
