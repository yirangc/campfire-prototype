import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import styles from './Tooltip.module.css'

export interface TooltipProps {
  /** The short explanation shown in the tooltip. */
  content: string
  /** The element the tooltip explains, such as a StatusPill. It becomes keyboard-focusable. */
  children: ReactNode
  /** Where the tooltip lines up with its trigger. "end" keeps it inside a right-hand column. */
  align?: 'center' | 'end'
  className?: string
}

/**
 * The tooltip recipe of the hidden "Opening balance tooltip" (49:800), shared with InfoTip: primary ink fill,
 * 4 px radius, 8 × 12 px insets, white text. It wraps a non-interactive element (such as a status pill), which takes
 * keyboard focus so the explanation can be read without a pointer. Showing it on hover and focus, hiding it with
 * Escape, and the "end" alignment are proposed: Figma keeps the tooltip hidden and has no interaction.
 * The trigger carries data-tooltip-trigger so containers that act on clicks (such as a table row) can ignore it.
 */
export function Tooltip({ content, children, align = 'center', className }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
    }
  }
  return (
    <span
      className={[styles.wrap, className].filter(Boolean).join(' ')}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        // A focusable, non-interactive trigger: the tooltip is its description, not an action.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className={styles.trigger}
        aria-describedby={id}
        data-tooltip-trigger=""
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      >
        {children}
      </span>
      <span id={id} role="tooltip" className={[styles.tip, align === 'end' && styles.end].filter(Boolean).join(' ')} hidden={!open}>
        {content}
      </span>
    </span>
  )
}
