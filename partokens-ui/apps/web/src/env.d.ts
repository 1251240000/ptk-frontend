/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  readonly PUBLIC_PARTOKENS_SOURCE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  turnstile?: {
    render: (container: HTMLElement, options: { sitekey: string; size?: 'normal' | 'flexible' | 'compact'; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback'?: () => void }) => string
    remove: (widgetId: string) => void
  }
}
