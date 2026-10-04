import type { ElementType, HTMLAttributes } from 'react'
import styles from './Panel.module.css'

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** Inner spacing. 24 matches Figma's reporting panel; 16 matches metric cards. */
  padding?: 0 | 16 | 20 | 24
  /** Adds the card elevation (0 2 5 / 5%). */
  elevated?: boolean
  as?: ElementType
}

/** White surface with a 1 px border and 8 px radius: the shared container recipe across the references. */
export function Panel({ padding = 24, elevated = false, as: Tag = 'div', className, ...rest }: PanelProps) {
  const cls = [styles.panel, styles[`p${padding}`], elevated && styles.elevated, className].filter(Boolean).join(' ')
  return <Tag className={cls} {...rest} />
}
