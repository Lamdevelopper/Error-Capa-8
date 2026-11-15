import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

export function Modal({
  eyebrow,
  title,
  onClose,
  children,
  footer,
  tone = 'default',
}: {
  eyebrow: string
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  tone?: 'default' | 'danger' | 'calm'
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="modal-backdrop"
      onPointerDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`modal modal--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal__head">
          <div>
            <span className="kicker">{eyebrow}</span>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" size={22} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function ModalActions({
  children,
}: {
  children: ReactNode
}) {
  return <div className="modal-actions">{children}</div>
}
