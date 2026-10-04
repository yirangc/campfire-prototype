import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '../Button/Button'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Footer actions, right-aligned above a 1 px rule (Figma marks the footer as inferred). */
  footer?: ReactNode
  /** Dialog width; Figma reconstructs 1040 px. Capped to the viewport. */
  width?: number
  className?: string
}

/**
 * Figma: Campfire/Modal/Edit Cost Allocation. White, 24 px insets and section gap, 10 px radius,
 * modal elevation (0 12 32 / 15%). Title 20/28 semibold with a ghost icon-only close button.
 * Scrim #000000B8 is Figma's proposed backdrop.
 *
 * Built on the native <dialog>: focus moves inside on open, Tab stays inside, Escape closes,
 * and focus returns to the element that opened it.
 */
export function Modal({ open, onClose, title, children, footer, width = 1040, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
      opener.current?.focus()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={[styles.dialog, className].filter(Boolean).join(' ')}
      style={{ width }}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div className={styles.header}>
        <h2 id={titleId} className="cf-text-page-title">
          {title}
        </h2>
        <Button variant="ghost" iconOnly icon="x" aria-label="Close" onClick={onClose} />
      </div>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </dialog>
  )
}
