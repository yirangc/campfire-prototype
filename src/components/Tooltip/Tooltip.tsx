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
 * The tip ignores the pointer and the trigger has no click action, so a click on the trigger reaches its container
 * (such as a table row that toggles). The trigger carries data-tooltip-trigger for tests.
 */
export function Tooltip({ content, children, align = 'center', className }: TooltipProps) {
  const id = useId()
  // Hover and focus are tracked apart, so a click that moves focus elsewhere keeps the tip while the pointer is on it.
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const open = hovered || focused
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setHovered(false)
      setFocused(false)
    }
  }
  return (
    <span
      className={[styles.wrap, className].filter(Boolean).join(' ')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        // A focusable, non-interactive trigger: the tooltip is its description, not an action.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className={styles.trigger}
        aria-describedby={id}
        data-tooltip-trigger=""
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
