import { useEffect, useRef } from 'react'

export function TurnstileField({
  label,
  siteKey,
  onToken,
}: {
  label?: string
  siteKey?: string
  onToken: (token: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let widgetId = ''
    let cancelled = false
    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetId) return
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size: 'flexible',
        callback: onToken,
        'error-callback': () => onToken(''),
        'expired-callback': () => onToken(''),
      })
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-partokens-turnstile]')
    if (existing) {
      if (window.turnstile) render()
      else existing.addEventListener('load', render, { once: true })
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.partokensTurnstile = 'true'
      script.addEventListener('load', render, { once: true })
      document.head.appendChild(script)
    }
    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [onToken, siteKey])

  if (!siteKey) return null
  return <div ref={containerRef} className="turnstile-field" role={label ? 'group' : undefined} aria-label={label} />
}
