import { useId, useState, type KeyboardEvent } from 'react'
import { StatusGlyph } from '../StatusGlyph/StatusGlyph'
import styles from './InfoTip.module.css'

export interface InfoTipProps {
  /** What the tooltip explains, e.g. "Statement closing". Used in the button's accessible name. */
  topic: string
  children: string
  className?: string
}

/**
 * Figma: 14 px info glyph (I28:8871;38:5420) with the hidden "Opening balance tooltip" (49:800):
 * primary ink fill, 4 px radius, 8 × 12 px insets, 12/18 white text. Showing it on hover and keyboard focus,
 * and hiding it with Escape, is proposed: Figma keeps the tooltip hidden and has no interaction.
 */
export function InfoTip({ topic, children, className }: InfoTipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }
  return (
    <span
      className={[styles.wrap, className].filter(Boolean).join(' ')}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.trigger}
        aria-label={`About ${topic}`}
        aria-describedby={id}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      >
        <StatusGlyph name="info-14" />
      </button>
      <span id={id} role="tooltip" className={styles.tip} hidden={!open}>
        {children}
      </span>
    </span>
  )
}
