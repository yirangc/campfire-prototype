import { useId } from 'react'
import { InfoTip } from '../InfoTip/InfoTip'
import { TrendBadge } from './TrendBadge'
import styles from './MetricCard.module.css'

export interface MetricCardProps {
  label: string
  value: string
  /** Positive trend, e.g. "11%". Omit to hide the badge. */
  trend?: string
  /** Definition shown from a 14 px info glyph after the label (Reconcile balance metrics). */
  info?: string
  /**
   * "metric": Campfire/Card/Metric/* (100 px, 28/34 value with −0.8 px tracking).
   * "balance": the Reconcile "Balance metric" (28:8871): 90 px, 20/28 semibold value.
   */
  variant?: 'metric' | 'balance'
  /** "success" draws the value in success ink, as the $0.00 remaining difference (28:8904). */
  tone?: 'default' | 'success'
  className?: string
}

/**
 * Figma: Campfire/Card/Metric/*. 252 × 100 in Figma (fills its grid cell here), white, 1 px border,
 * 8 px radius, card elevation, 16 px inset, 8 px gap. Label 12/18; value 28/34 semibold, -0.8 px tracking.
 */
export function MetricCard({ label, value, trend, info, variant = 'metric', tone = 'default', className }: MetricCardProps) {
  const labelId = useId()
  const valueCls = [
    styles.value,
    variant === 'balance' ? 'cf-text-page-title' : 'cf-text-metric',
    tone === 'success' && styles.success,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <section className={[styles.card, styles[variant], className].filter(Boolean).join(' ')} aria-labelledby={labelId}>
      <div className={styles.labelRow}>
        <p id={labelId} className={styles.label}>
          {label}
        </p>
        {info && <InfoTip topic={label}>{info}</InfoTip>}
      </div>
      <div className={styles.row}>
        <p className={valueCls}>{value}</p>
        {trend && <TrendBadge value={trend} />}
      </div>
    </section>
  )
}
