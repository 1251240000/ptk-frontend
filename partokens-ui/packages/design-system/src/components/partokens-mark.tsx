import { forwardRef } from 'react'
import type { LucideProps } from 'lucide-react'

export const PartokensMark = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, className, strokeWidth: _strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, children, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      className={['partokens-mark', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M5.2 2.8h9.5c3.8 0 6.5 2.8 6.5 6.5 0 3.8-2.7 6.4-6.5 6.4h-3.3c-.8 0-1.3.5-1.5 1.2L8 23.8H4.4L7 14.9c.4-1.5 2-2.5 4-2.5h3.7c2 0 3.3-1.2 3.3-3.1s-1.3-3.1-3.3-3.1H4.3l.9-3.4Z" />
      {children}
    </svg>
  ),
)

PartokensMark.displayName = 'PartokensMark'
