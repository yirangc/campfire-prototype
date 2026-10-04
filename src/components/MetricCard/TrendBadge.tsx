import { Icon } from '../Icon/Icon'
import styles from './MetricCard.module.css'

export interface TrendBadgeProps {
  /** Display value, e.g. "11%". */
  value: string
  /** Screen reader wording; the arrow and green tint alone do not convey direction. */
  srPrefix?: string
}

/**
 * Figma: Campfire/Badge/Positive trend. 22 px pill, 6 px inset, 3 px gap, 10 px arrow-up, 11/16 success ink.
 * Only the positive state exists in Figma; a negative or neutral trend is not documented.
 */
export function TrendBadge({ value, srPrefix = 'Up' }: TrendBadgeProps) {
  return (
    <span className={styles.badge}>
      <Icon name="arrow-up" size={10} />
      <span className="cf-visually-hidden">{srPrefix} </span>
      {value}
    </span>
  )
}
