import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

export interface PageHeaderProps {
  title: string
  /** Breadcrumbs element shown above the title. */
  breadcrumbs?: ReactNode
  /** Right-aligned actions on the title row, e.g. a Download button. */
  actions?: ReactNode
  description?: string
  className?: string
}

/** Figma: "Reporting header" in Campfire financial reporting. 6 px gap; title 20/28 semibold; description 12/18 secondary. */
export function PageHeader({ title, breadcrumbs, actions, description, className }: PageHeaderProps) {
  return (
    <header className={[styles.header, className].filter(Boolean).join(' ')}>
      {breadcrumbs}
      <div className={styles.titleRow}>
        <h1 className="cf-text-page-title">{title}</h1>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {description && <p className={styles.description}>{description}</p>}
    </header>
  )
}
