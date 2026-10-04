import { Fragment } from 'react'
import { Icon } from '../Icon/Icon'
import styles from './Navigation.module.css'

export interface Crumb {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: Crumb[]
  /**
   * "pill": dashboard trail, primary ink, current page on a subtle pill, optional leading home link.
   * "plain": financial reporting trail, secondary ink throughout.
   */
  variant?: 'pill' | 'plain'
  /** Prepend a 16 px home link (dashboard reference). */
  homeHref?: string
  /** Reporting page header size (11/20 text, 10 px chevron, 8 px gap). Only applies to "plain". */
  compact?: boolean
  className?: string
}

/** Figma: Campfire/Navigation/Breadcrumbs/* (Accounting, Reporting). The last item is the current page. */
export function Breadcrumbs({ items, variant = 'plain', homeHref, compact = false, className }: BreadcrumbsProps) {
  const chevronSize = variant === 'plain' && compact ? 10 : 12
  const cls = [
    styles.breadcrumbs,
    variant === 'pill' ? styles.crumbPill : styles.crumbPlain,
    variant === 'plain' && compact && styles.crumbCompact,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <nav aria-label="Breadcrumb" className={cls}>
      <ol>
        {homeHref !== undefined && (
          <li>
            <a className={styles.crumbLink} href={homeHref} aria-label="Home">
              <Icon name="home" size={16} />
            </a>
          </li>
        )}
        {items.map((item, i) => {
          const isCurrent = i === items.length - 1
          const showChevron = i > 0 || homeHref !== undefined
          return (
            <li key={`${item.label}-${i}`}>
              {showChevron && <Icon name="chevron-right" size={chevronSize} />}
              {isCurrent ? (
                <span aria-current="page" className={variant === 'pill' ? styles.crumbCurrentPill : undefined}>
                  {item.label}
                </span>
              ) : item.href ? (
                <a className={styles.crumbLink} href={item.href}>
                  {item.label}
                </a>
              ) : (
                <Fragment>{item.label}</Fragment>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
