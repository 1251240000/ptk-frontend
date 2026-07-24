import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const focusableSelector = [
  '[data-modal-initial-focus]',
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function Modal({
  label,
  children,
  className = 'dialog',
  backdropClassName = 'dialog-backdrop',
  onClose,
}: {
  label: string
  children: ReactNode
  className?: string
  backdropClassName?: string
  onClose?: () => void
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(
    typeof document === 'undefined' ? null : document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const application = document.getElementById('root')
    const previousAriaHidden = application?.getAttribute('aria-hidden')
    application?.setAttribute('inert', '')
    application?.setAttribute('aria-hidden', 'true')

    const dialog = dialogRef.current
    const initialFocus = dialog?.querySelector<HTMLElement>('[data-modal-initial-focus]')
      || dialog?.querySelector<HTMLElement>(focusableSelector)
      || dialog
    initialFocus?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeRef.current) {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true')
      if (!focusable.length) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }
      const first = focusable[0]!
      const last = focusable.at(-1)!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      application?.removeAttribute('inert')
      if (previousAriaHidden == null) application?.removeAttribute('aria-hidden')
      else application?.setAttribute('aria-hidden', previousAriaHidden)
      returnFocusRef.current?.focus()
    }
  }, [])

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closeRef.current?.()
  }

  return createPortal(
    <div className={backdropClassName} role="presentation" onMouseDown={closeFromBackdrop}>
      <section ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </section>
    </div>,
    document.body,
  )
}
