import { useRouterState } from '@tanstack/react-router'
import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'

import { RouteProgress } from '@partokens/design-system/components'

import { consoleBaseSegment, consoleCompatibilityBaseSegment } from '@/lib/routes'
import { useSessionStore } from '@/stores/session'

const bootRevealDelay = 160
const bootMinimumVisible = 320
const bootExitDuration = 180
const AppBootPendingContext = createContext<(pending: boolean) => void>(() => undefined)

function isConsolePath(pathname: string): boolean {
  const section = pathname.split('/').filter(Boolean)[1]
  return section === consoleBaseSegment || section === consoleCompatibilityBaseSegment
}

function AppLoading({ contentPending }: { contentPending: boolean }) {
  const routeState = useRouterState({
    select: (state) => ({ isLoading: state.isLoading, pathname: state.location.pathname }),
  })
  const sessionResolved = useSessionStore((state) => state.resolved)

  useEffect(() => {
    if (routeState.isLoading || contentPending || (isConsolePath(routeState.pathname) && !sessionResolved)) return

    const loader = document.getElementById('partokens-boot-loader')
    if (!loader) return

    const startedAt = Number(loader.dataset.startedAt || window.performance.now())
    const elapsed = window.performance.now() - startedAt
    const wasVisible = elapsed >= bootRevealDelay
    const delay = wasVisible ? Math.max(0, bootRevealDelay + bootMinimumVisible - elapsed) : 0
    let removeTimer = 0
    const exitTimer = window.setTimeout(() => {
      loader.classList.add('is-exiting')
      loader.setAttribute('aria-hidden', 'true')
      removeTimer = window.setTimeout(() => loader.remove(), bootExitDuration)
    }, delay)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(removeTimer)
    }
  }, [contentPending, routeState.isLoading, routeState.pathname, sessionResolved])

  return <RouteProgress active={routeState.isLoading} />
}

export function useAppBootPending(pending: boolean) {
  const setContentPending = useContext(AppBootPendingContext)

  useLayoutEffect(() => {
    setContentPending(pending)
    return () => setContentPending(false)
  }, [pending, setContentPending])
}

export function AppLoadingBoundary({ children }: { children: ReactNode }) {
  const [contentPending, setContentPending] = useState(false)

  return (
    <AppBootPendingContext.Provider value={setContentPending}>
      <AppLoading contentPending={contentPending} />
      {children}
    </AppBootPendingContext.Provider>
  )
}
