import { Icon } from '../Icon/Icon'
import { StatusGlyph } from '../StatusGlyph/StatusGlyph'
import styles from './StatusPill.module.css'

export type ReconStatus = 'auto-matched' | 'confirmed' | 'suggested' | 'unmatched' | 'outstanding'

const LABEL: Record<ReconStatus, string> = {
  'auto-matched': 'Auto-matched',
  confirmed: 'Confirmed',
  suggested: 'Suggested',
  unmatched: 'Unmatched',
  outstanding: 'Outstanding',
}

export interface StatusPillProps {
  status: ReconStatus
  className?: string
}

/**
 * Figma: "Status pill" in the Reconcile register (49:703, 49:962, 49:794). 100 × 22, 4 px radius, 8 px inset,
 * 6 px gap, 14 px glyph, 11/16 semibold label. The label always carries the status, so color is never the only cue.
 * Outstanding is a design addition (PRD): Figma draws no pill for it. Proposed: subtle surface, primary ink,
 * calendar icon for timing.
 * Auto-matched follows Yirang's design (2026-10-04): link-blue ink on a light blue fill. The design's link glyph
 * is not in the Figma icon set, so the pill shows its label only until that icon is supplied.
 */
export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span className={[styles.pill, styles[status === 'auto-matched' ? 'autoMatched' : status], className].filter(Boolean).join(' ')} data-status={status}>
      {status === 'confirmed' && <StatusGlyph name="check-14" />}
      {status === 'suggested' && <StatusGlyph name="sparkle-14" />}
      {status === 'unmatched' && <StatusGlyph name="warning-14" />}
      {status === 'outstanding' && <Icon name="calendar" size={14} className={styles.outstandingIcon} />}
      {LABEL[status]}
    </span>
  )
}
