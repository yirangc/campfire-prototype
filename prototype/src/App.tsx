import { useCallback, useState } from 'react'
import { Breadcrumbs, SideNav, type NavGroup } from '../../src/components'
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

export function App() {
  const recon = useRecon()
  const [announcement, setAnnouncement] = useState('')
  const announce = useCallback((message: string) => {
    // Clear first so repeating the same message is announced again.
    setAnnouncement('')
    requestAnimationFrame(() => setAnnouncement(message))
  }, [])

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <SideNav
          layout="app"
          items={NAV}
          currentId="acc-reconcile"
          selection="neutral"
          defaultExpanded={['reporting', 'accounting']}
          workspace={{ company: USER.company, user: USER.name }}
          onNavigate={(id) => {
            if (id !== 'acc-reconcile') announce('Only the Reconcile page is part of this prototype.')
          }}
        />
      </div>
      <div className={styles.content}>
        <header className={styles.topNav}>
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
