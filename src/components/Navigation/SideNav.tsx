import { useState } from 'react'
import type { IconName } from '../../assets/manifest'
import { Icon } from '../Icon/Icon'
import { Logo } from '../Logo/Logo'
import { NavItem, type NavSelection } from './NavItem'
import styles from './Navigation.module.css'

export interface NavLeaf {
  id: string
  label: string
  href?: string
}

export interface NavGroup extends NavLeaf {
  icon: IconName
  children?: NavLeaf[]
}

export interface SideNavProps {
  items: NavGroup[]
  /** id of the current page (a group or a child). */
  currentId?: string
  /** Lime on the dashboard, neutral in financial reporting. */
  selection?: NavSelection
  /** Groups open on first render. */
  defaultExpanded?: string[]
  onNavigate?: (id: string) => void
  'aria-label'?: string
  /**
   * "panel": the Side panel components (12:12171, 12:12172). "app": the Reconcile persistent sidebar (49:619):
   * full height, 80 px brand header, and the workspace identity (Settings, company, user) pinned to the bottom.
   */
  layout?: 'panel' | 'app'
  workspace?: { company: string; user: string; settingsHref?: string }
  className?: string
}

/**
 * Figma: Campfire/Navigation/Side panel/* (Dashboard, Reporting).
 * 224 px wide, sidebar surface, 1 px right rule, 20 × 14 px insets, 12 px gap,
 * 48 px brand header with the logo, 2 px between rows.
 */
export function SideNav({
  items,
  currentId,
  selection = 'neutral',
  defaultExpanded = [],
  onNavigate,
  'aria-label': ariaLabel = 'Main',
  layout = 'panel',
  workspace,
  className,
}: SideNavProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded))

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const go = (id: string) => (e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(id)
    }
  }

  return (
    <nav className={[styles.panel, layout === 'app' && styles.app, className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      <div className={styles.brand}>
        <Logo />
      </div>
      <ul className={styles.list}>
        {items.map((item) => {
          const groupId = `nav-group-${item.id}`
          const hasChildren = !!item.children?.length
          const isOpen = expanded.has(item.id)
          return (
            <li key={item.id}>
              {hasChildren ? (
                <NavItem label={item.label} icon={item.icon} expanded={isOpen} controls={groupId} onClick={() => toggle(item.id)} />
              ) : (
                <NavItem
                  label={item.label}
                  icon={item.icon}
                  href={item.href}
                  selected={currentId === item.id && selection}
                  onClick={go(item.id)}
                />
              )}
              {hasChildren && (
                <ul id={groupId} className={styles.list} hidden={!isOpen}>
                  {item.children!.map((child) => (
                    <li key={child.id}>
                      <NavItem
                        label={child.label}
                        level="child"
                        href={child.href}
                        selected={currentId === child.id && selection}
                        onClick={go(child.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      {workspace && (
        <div className={styles.workspace}>
          <a className={styles.settings} href={workspace.settingsHref ?? '#'} onClick={go('settings')}>
            <Icon name="settings" size={12} />
            Settings
          </a>
          <hr className={styles.workspaceRule} />
          <p className={styles.workspaceText}>
            <span className={styles.company}>{workspace.company}</span>
            <span>{workspace.user}</span>
          </p>
        </div>
      )}
    </nav>
  )
}
