import { useCallback, useEffect, useRef, useState } from 'react'
import { Breadcrumbs, Button, SideNav, type NavGroup } from '../../src/components'
import { USER } from './domain/fixture'
import { ReconcilePage } from './ui/ReconcilePage'
import { RecoveryScreen } from './ui/RecoveryScreen'
import { useRecon } from './useRecon'
import styles from './App.module.css'

/** Persistent sidebar of the Reconcile frames (49:622). Revenue is collapsed in Figma; its child is a sample label. */
const NAV: NavGroup[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  {
    id: 'reporting',
    label: 'Reporting',
    icon: 'chart',
    children: [
      { id: 'rep-income', label: 'Income Statement' },
      { id: 'rep-balance', label: 'Balance Sheet' },
      { id: 'rep-cash-flow', label: 'Cash Flow' },
      { id: 'rep-trial', label: 'Trial Balance' },
      { id: 'rep-budgets', label: 'Budgets' },
      { id: 'rep-reports', label: 'Reports' },
    ],
  },
  { id: 'revenue', label: 'Revenue', icon: 'revenue', children: [{ id: 'rev-dashboard', label: 'Dashboard' }] },
  {
    id: 'accounting',
    label: 'Accounting',
    icon: 'accounting',
    children: [
      { id: 'acc-je', label: 'New Journal Entry' },
      { id: 'acc-reconcile', label: 'Reconcile' },
      { id: 'acc-invoices', label: 'Invoices' },
      { id: 'acc-bills', label: 'Bills' },
      { id: 'acc-vendors', label: 'Vendors' },
      { id: 'acc-credit', label: 'Credit Memos' },
      { id: 'acc-debit', label: 'Debit Memos' },
      { id: 'acc-amort', label: 'Amortizations' },
      { id: 'acc-fixed', label: 'Fixed Assets' },
    ],
  },
]

/** Viewport width at which the persistent sidebar fits beside the page. Keep in sync with App.module.css. */
const SIDEBAR_MIN = 1100

export function App() {
  const recon = useRecon()
  const [announcement, setAnnouncement] = useState('')
  const announce = useCallback((message: string) => {
    // Clear first so repeating the same message is announced again.
    setAnnouncement('')
    requestAnimationFrame(() => setAnnouncement(message))
  }, [])

  // Below the sidebar breakpoint the sidebar becomes a menu drawer over the page (design addition, no Figma frame).
  const [navOpen, setNavOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const drawer = useRef<HTMLDivElement>(null)
  const closeNav = useCallback(() => {
    setNavOpen(false)
    menuButton.current?.focus()
  }, [])
  useEffect(() => {
    if (!navOpen) return
    drawer.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNav()
    }
    // Widening past the breakpoint shows the sidebar again, so the drawer state is dropped.
    const wide = window.matchMedia?.(`(min-width: ${SIDEBAR_MIN}px)`)
    const onWide = () => wide?.matches && setNavOpen(false)
    document.addEventListener('keydown', onKey)
    wide?.addEventListener?.('change', onWide)
    return () => {
      document.removeEventListener('keydown', onKey)
      wide?.removeEventListener?.('change', onWide)
    }
  }, [navOpen, closeNav])

  return (
    <div className={styles.app}>
      {navOpen && <div className={styles.scrim} aria-hidden="true" onClick={closeNav} />}
      <div ref={drawer} id="app-sidebar" className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ''}`}>
        <SideNav
          layout="app"
          items={NAV}
          currentId="acc-reconcile"
          selection="neutral"
          defaultExpanded={['reporting', 'accounting']}
          workspace={{ company: USER.company, user: USER.name }}
          onNavigate={(id) => {
            if (id !== 'acc-reconcile') announce('Only the Reconcile page is part of this prototype.')
            if (navOpen) closeNav()
          }}
        />
      </div>
      <div className={styles.content}>
        <header className={styles.topNav}>
          <Button
            ref={menuButton}
            className={styles.menuButton}
            icon="panel"
            aria-expanded={navOpen}
            aria-controls="app-sidebar"
            onClick={() => (navOpen ? closeNav() : setNavOpen(true))}
          >
            <span className={styles.menuLabel}>Menu</span>
          </Button>
          <Breadcrumbs variant="pill" homeHref="#" items={[{ label: 'Accounting', href: '#' }, { label: 'Reconcile' }]} />
        </header>
        {recon.unreadable ? (
          <RecoveryScreen problem={recon.unreadable} onReset={recon.resetDemo} onRetry={recon.retryLoad} />
        ) : (
          <ReconcilePage recon={recon} announce={announce} />
        )}
      </div>
      <p className="cf-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
