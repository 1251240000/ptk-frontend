import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

type PreferenceState = {
  theme: ThemeMode
  sidebarCollapsed: boolean
  noticeOpen: boolean
  setTheme: (theme: ThemeMode) => void
  toggleSidebar: () => void
  setNoticeOpen: (open: boolean) => void
}

function applyTheme(theme: ThemeMode) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#0d0f12' : '#f7f9fb')
}

const initialTheme = (window.localStorage.getItem('partokens-theme') as ThemeMode | null) ?? 'system'

export const usePreferenceStore = create<PreferenceState>((set) => ({
  theme: initialTheme,
  sidebarCollapsed: false,
  noticeOpen: false,
  setTheme: (theme) => {
    window.localStorage.setItem('partokens-theme', theme)
    applyTheme(theme)
    set({ theme })
  },
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setNoticeOpen: (noticeOpen) => set({ noticeOpen }),
}))

applyTheme(initialTheme)

