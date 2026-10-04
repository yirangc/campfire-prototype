import type { MouseEventHandler } from 'react'
import type { IconName } from '../../assets/manifest'
import { Icon } from '../Icon/Icon'
import styles from './Navigation.module.css'

/** Two selection recipes from Figma: lime (dashboard) and neutral (financial reporting). */
export type NavSelection = 'lime' | 'neutral'

export interface NavItemProps {
  label: string
  /** 16 px leading glyph. Parent rows have one; child rows omit it (Figma navigation guidance). */
  icon?: IconName
  /** Child rows indent to 20 px and drop the glyph. */
  level?: 'parent' | 'child'
  /** For rows that own a group: shows chevron-up (expanded) or chevron-down (collapsed). */
  expanded?: boolean
  /** id of the group this row controls, for aria-controls. */
  controls?: string
  /** Selected rows get the lime or neutral fill plus medium weight, and aria-current="page". */
  selected?: NavSelection | false
  href?: string
  onClick?: MouseEventHandler<HTMLElement>
}

/**
 * Figma: Campfire/Navigation/Item/* (Default, Expanded, Child lime selected, Child neutral selected).
 * 196 × 36, 4 px radius, 10 px inset and gap, 12/18 text.
 * Rows with a group render as <button aria-expanded>; leaf rows render as links.
 */
export function NavItem({ label, icon, level = 'parent', expanded, controls, selected = false, href, onClick }: NavItemProps) {
  const isGroup = expanded !== undefined
  const cls = [
    styles.item,
    level === 'child' && styles.child,
    selected === 'lime' && styles.selectedLime,
    selected === 'neutral' && styles.selectedNeutral,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {icon && level === 'parent' && <Icon name={icon} size={16} />}
      <span className={styles.label}>{label}</span>
      {isGroup && <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={12} />}
    </>
  )

  if (isGroup) {
    return (
      <button type="button" className={cls} aria-expanded={expanded} aria-controls={controls} onClick={onClick} title={label}>
        {content}
      </button>
    )
  }

  return (
    <a className={cls} href={href ?? '#'} aria-current={selected ? 'page' : undefined} onClick={onClick} title={label}>
      {content}
    </a>
  )
}
