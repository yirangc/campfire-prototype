import { useState } from 'react'
import { Button, Modal, Notice } from '../../../src/components'
import type { LoadResult } from '../domain/persistence'
import styles from './Page.module.css'

/**
 * Design addition (PRD 7): shown instead of the workspace when saved progress can't be read.
 * Nothing is discarded until Maya explicitly resets.
 */
export function RecoveryScreen({
  problem,
  onReset,
  onRetry,
}: {
  problem: Extract<LoadResult, { kind: 'unreadable' }>
  onReset: () => void
  onRetry: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <h1 className="cf-text-page-title">Reconcile</h1>
      </div>
      <Notice
        tone="warning"
        size="page"
        role="alert"
        title="Your saved reconciliation progress couldn't be read"
        action={
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
            <Button variant="primary" onClick={() => setConfirming(true)}>
              Reset to the November data…
            </Button>
          </div>
        }
      >
        {problem.reason} The saved data has been left untouched. Resetting replaces it with the original November fixture and
        clears your matches, entries, evidence, notes and history.
      </Notice>
      {problem.raw && (
        <details className={styles.raw}>
          <summary>Show the saved data</summary>
          <pre>{problem.raw.slice(0, 2000)}</pre>
        </details>
      )}
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Reset the reconciliation?"
        width={480}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onReset}>
              Reset and discard saved data
            </Button>
          </>
        }
      >
        <p className="cf-text-body">The unreadable saved data will be deleted and the original November data restored. This can't be undone.</p>
      </Modal>
    </main>
  )
}
