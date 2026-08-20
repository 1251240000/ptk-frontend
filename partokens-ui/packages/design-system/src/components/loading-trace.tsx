import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../cn'

type LoadingTraceProps = HTMLAttributes<HTMLDivElement> & {
  label?: string
  compact?: boolean
  decorative?: boolean
}

function LoadingTrace({ label, compact = false, decorative = false, className, ...props }: LoadingTraceProps) {
  const accessible = !decorative && Boolean(label)

  return (
    <div
      data-slot="loading-trace"
      data-compact={compact || undefined}
      className={cn('pt-loading-trace', className)}
      role={accessible ? 'status' : undefined}
      aria-live={accessible ? 'polite' : undefined}
      aria-label={accessible ? label : undefined}
      aria-hidden={decorative || undefined}
      {...props}
    >
      <span className="pt-loading-trace__rail" aria-hidden="true">
        <span className="pt-loading-trace__node pt-loading-trace__node--client" />
        <span className="pt-loading-trace__node pt-loading-trace__node--router" />
        <span className="pt-loading-trace__node pt-loading-trace__node--model" />
        <span className="pt-loading-trace__packet" />
      </span>
      {label && !compact ? <span className="pt-loading-trace__label">{label}</span> : null}
    </div>
  )
}

type LoadingRegionProps = HTMLAttributes<HTMLDivElement> & {
  label: string
  description?: string
  children?: ReactNode
}

function LoadingRegion({ label, description, children, className, ...props }: LoadingRegionProps) {
  return (
    <div
      data-slot="loading-region"
      className={cn('pt-loading-region', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      {...props}
    >
      <div className="pt-loading-region__status">
        <LoadingTrace compact decorative />
        <span>{label}</span>
        {description ? <small>{description}</small> : null}
      </div>
      {children ? <div className="pt-loading-region__content" aria-hidden="true">{children}</div> : null}
    </div>
  )
}

function RouteProgress({ active, className, ...props }: HTMLAttributes<HTMLDivElement> & { active: boolean }) {
  return (
    <div
      data-slot="route-progress"
      data-active={active || undefined}
      className={cn('pt-route-progress', className)}
      aria-hidden="true"
      {...props}
    >
      <span />
    </div>
  )
}

export { LoadingRegion, LoadingTrace, RouteProgress }
export type { LoadingRegionProps, LoadingTraceProps }
