import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button className={twMerge('icon-button', className)} aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-heading-action">{action}</div> : null}
    </header>
  )
}

export function DataState({
  loading,
  error,
  empty,
  onRetry,
  children,
}: {
  loading: boolean
  error?: string | null
  empty?: boolean
  onRetry?: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  if (loading) {
    return (
      <div className="data-state" aria-live="polite">
        <LoaderCircle className="spin" size={18} />
        <span>{t('Loading')}</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="data-state data-state-error" role="alert">
        <AlertCircle size={18} />
        <span>{error}</span>
        {onRetry ? (
          <button className="text-button" type="button" onClick={onRetry}>
            <RefreshCw size={14} /> {t('Retry')}
          </button>
        ) : null}
      </div>
    )
  }
  if (empty) return <div className="data-state">{t('No data')}</div>
  return <>{children}</>
}

export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  )
}
