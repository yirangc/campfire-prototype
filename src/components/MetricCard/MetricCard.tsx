import { useId } from 'react'
import { TrendBadge } from './TrendBadge'
import styles from './MetricCard.module.css'

export interface MetricCardProps {
  label: string
  value: string
  /** Positive trend, e.g. "11%". Omit to hide the badge. */
  trend?: string
  className?: string
}

/**
 * Figma: Campfire/Card/Metric/*. 252 × 100 in Figma (fills its grid cell here), white, 1 px border,
 * 8 px radius, card elevation, 16 px inset, 8 px gap. Label 12/18; value 28/34 semibold, -0.8 px tracking.
 */
export function MetricCard({ label, value, trend, className }: MetricCardProps) {
  const labelId = useId()
  return (
    <section className={[styles.card, className].filter(Boolean).join(' ')} aria-labelledby={labelId}>
      <p id={labelId} className={styles.label}>
        {label}
      </p>
      <div className={styles.row}>
        <p className={`${styles.value} cf-text-metric`}>{value}</p>
        {trend && <TrendBadge value={trend} />}
      </div>
    </section>
  )
}
