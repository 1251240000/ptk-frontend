import { create } from 'zustand'

import {
  clearAuthentication,
  configureAuthRuntime,
  installAuthentication,
  logout,
  refreshAuthentication,
  type AuthBundle,
  type CurrentUser,
  type LoginSession,
  type TwoFactorChallenge,
} from '@partokens/api-client'
import { clearStudioCredential } from '@partokens/studio'
import { isAppLocale, resolvePreferredLocale } from '@partokens/i18n'

type SessionState = {
  user: CurrentUser | null
  session: LoginSession | null
  accessToken: string | null
  accessExpiresAt: number | null
  pendingTwoFactor: TwoFactorChallenge | null
  revision: number
  resolved: boolean
  loading: boolean
  establish: (bundle: AuthBundle) => void
  setPendingTwoFactor: (challenge: TwoFactorChallenge | null) => void
  setUser: (user: CurrentUser | null) => void
  resolve: () => Promise<CurrentUser | null>
  signOut: () => Promise<void>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  session: null,
  accessToken: null,
  accessExpiresAt: null,
  pendingTwoFactor: null,
  revision: 0,
  resolved: false,
  loading: false,
  establish: (bundle) => { installAuthentication(bundle) },
  setPendingTwoFactor: (pendingTwoFactor) => {
    if (pendingTwoFactor) clearAuthentication(false)
    set({ pendingTwoFactor, resolved: !pendingTwoFactor })
  },
  setUser: (user) => {
    if (!user) {
      clearAuthentication()
      return
    }
    set({ user, resolved: true })
  },
  resolve: async () => {
    if (get().resolved) return get().user
    set({ loading: true })
    const outcome = await refreshAuthentication()
    const user = outcome.kind === 'authenticated' ? outcome.bundle.user : get().user
    set({ loading: false, resolved: true })
    return user
  },
  signOut: async () => {
    try {
      await logout()
    } catch {
      // Local logout must complete even when server-side revocation is unavailable.
    } finally {
      clearStudioCredential()
      clearAuthentication()
    }
  },
}))

function redirectToLocalizedSignIn() {
  if (typeof window === 'undefined' || window.location.pathname.includes('/auth/sign-in')) return
  const localeSegment = window.location.pathname.split('/')[1]
  const locale = isAppLocale(localeSegment) ? localeSegment : resolvePreferredLocale()
  const returnTo = `${window.location.pathname}${window.location.search}`
  window.location.replace(`/${locale}/auth/sign-in?redirect=${encodeURIComponent(returnTo)}`)
}

configureAuthRuntime({
  getSnapshot: () => {
    const state = useSessionStore.getState()
    return {
      accessToken: state.accessToken,
      accessExpiresAt: state.accessExpiresAt,
      session: state.session,
      user: state.user,
      revision: state.revision,
    }
  },
  install: (bundle) => {
    useSessionStore.setState((state) => ({
      user: bundle.user,
      session: bundle.session,
      accessToken: bundle.access_token,
      accessExpiresAt: bundle.access_expires_at,
      pendingTwoFactor: null,
      revision: state.revision + 1,
      resolved: true,
      loading: false,
    }))
  },
  clear: (resolved) => {
    useSessionStore.setState((state) => ({
      user: null,
      session: null,
      accessToken: null,
      accessExpiresAt: null,
      pendingTwoFactor: null,
      revision: state.revision + 1,
      resolved,
      loading: false,
    }))
  },
  onInvalidated: redirectToLocalizedSignIn,
})

if (typeof window !== 'undefined' && typeof window.localStorage?.removeItem === 'function') {
  window.localStorage.removeItem('partokens-user-id')
}
