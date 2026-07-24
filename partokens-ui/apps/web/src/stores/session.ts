import { create } from 'zustand'

import { getSelf, logout, type CurrentUser } from '@partokens/api-client'
import { clearStudioCredential } from '@partokens/studio'

type SessionState = {
  user: CurrentUser | null
  resolved: boolean
  loading: boolean
  setUser: (user: CurrentUser | null) => void
  resolve: () => Promise<CurrentUser | null>
  signOut: () => Promise<void>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  resolved: false,
  loading: false,
  setUser: (user) => {
    if (user?.id != null) window.localStorage.setItem('partokens-user-id', String(user.id))
    if (!user) window.localStorage.removeItem('partokens-user-id')
    set({ user, resolved: true })
  },
  resolve: async () => {
    if (get().resolved) return get().user
    set({ loading: true })
    try {
      const response = await getSelf()
      if (!response.success || !response.data) {
        set({ user: null, resolved: true, loading: false })
        return null
      }
      get().setUser(response.data)
      set({ loading: false })
      return response.data
    } catch {
      set({ user: null, resolved: true, loading: false })
      return null
    }
  },
  signOut: async () => {
    try {
      await logout()
    } finally {
      clearStudioCredential()
      window.localStorage.removeItem('partokens-user-id')
      set({ user: null, resolved: true })
    }
  },
}))
