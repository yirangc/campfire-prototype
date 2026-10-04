import type { ReactNode } from 'react'
import { Icon } from '../Icon/Icon'
import { StatusGlyph } from '../StatusGlyph/StatusGlyph'
import styles from './Notice.module.css'

export type NoticeTone = 'info' | 'ai' | 'warning' | 'success'

export interface NoticeProps {
  tone: NoticeTone
  title: ReactNode
  children?: ReactNode
  /** Right-aligned action, such as an Undo button. */
  action?: ReactNode
  /** Right-aligned caption, such as the completion attribution. */
  aside?: ReactNode
  /**
   * "page": the 55 px Next step banner (12/20 title, 3 px gap, 20 px info glyph).
   * "inline": the compact notices inside an expanded row (12/18 title, 2 px gap).
   */
  size?: 'page' | 'inline'
  /** "status" announces changes politely; "alert" interrupts (save failures, rejected actions). */
  role?: 'status' | 'alert'
  className?: string
}

/**
 * Figma notices on the Reconcile screens, all 6 px radius with a 1 px stroke:
 * - info: Next step (38:7408) and Suggestion dismissed (38:6668). #F5F6F7 fill, #E2E5E7 stroke, info glyph.
 * - ai: Suggestion rationale (49:967). AI tint and stroke, sparkle glyph, AI ink.
 * - warning: Exception rationale (51:1041). Warning tint and stroke, warning glyph, warning ink.
 * - success: Completed banner (28:8917). Success tint, border/default stroke, green check (12:12164).
 */
export function Notice({ tone, title, children, action, aside, size = 'inline', role, className }: NoticeProps) {
  const cls = [styles.notice, styles[tone], styles[size], className].filter(Boolean).join(' ')
  return (
    <div className={cls} role={role}>
      {tone === 'info' && <StatusGlyph name="info-20" />}
      {tone === 'ai' && <StatusGlyph name="sparkle-16" />}
      {tone === 'warning' && <StatusGlyph name="warning-16" />}
      {tone === 'success' && <Icon name="check" size={16} className={styles.successIcon} />}
      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        {children && <div className={styles.detail}>{children}</div>}
      </div>
      {aside && <p className={styles.aside}>{aside}</p>}
      {action}
    </div>
  )
}
