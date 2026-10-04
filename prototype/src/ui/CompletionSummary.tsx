import { ACCOUNT, OPENING_BALANCE, TIMING_CATEGORIES } from '../domain/fixture'
import { longDate, money, shortDate, signed } from '../domain/format'
import { balances, evidenceItem, ledgerRecord, statusCounts } from '../domain/selectors'
import type { ReconState } from '../domain/types'
import styles from './Summary.module.css'

/**
 * Reconciliation summary (28:8924): 16 px inset card, three columns 394.67 px wide with 48 px gaps, 12/20 semibold
 * headings, 8 px between 11/16 label and 12/18 value rows. Updated per the PRD: record counts out of 14, created
 * entries and the outstanding adjustment with its evidence, which Figma's eight-row version does not have.
 */
export function CompletionSummary({ state }: { state: ReconState }) {
  const totals = balances(state)
  const counts = statusCounts(state)
  return (
    <section className={styles.summary} aria-label="Reconciliation summary">
      <div className={styles.summaryColumns}>
        <Column title="Statement summary">
          <Row label="Opening balance" value={money(OPENING_BALANCE)} />
          <Row label="Net statement movement" value={signed(totals.netBankMovement)} />
          <Row label="Statement closing" value={money(totals.statementClosing)} />
          <Row label="Book balance" value={money(totals.book)} />
        </Column>
        <Column title="Reconciled activity">
          <Row label="Confirmed" value={`${counts.confirmed} of ${counts.all} records`} />
          <Row label="Outstanding" value={`${counts.outstanding} of ${counts.all} records`} />
          <Row label="Suggested / unmatched" value={`${counts.suggested} / ${counts.unmatched}`} />
          <Row label="Remaining difference" value={money(totals.difference)} />
        </Column>
        <Column title="Recorded adjustments">
          {state.generated.map((g) => (
            <Row key={g.id} label={`${g.entryId} · ${g.category} · ${shortDate(g.date)}`} value={money(Math.abs(g.amount))} />
          ))}
          <Row label="Outstanding deposits" value={signed(totals.outstandingDeposits)} />
          <Row label="Outstanding withdrawals" value={signed(totals.outstandingWithdrawals)} />
          <Row label="Net outstanding adjustment" value={signed(totals.outstandingNet)} />
        </Column>
      </div>
      {state.outstanding.length > 0 && (
        <div className={styles.outstandingList}>
          <h3 className={styles.summaryHeading}>Outstanding items and evidence</h3>
          <ul>
            {state.outstanding.map((o) => {
              const ledger = ledgerRecord(state, o.ledgerId)!
              const evidence = evidenceItem(o.evidenceId)
              const category = TIMING_CATEGORIES.find((t) => t.value === o.category)?.label
              return (
                <li key={o.ledgerId} className={styles.outstandingItem}>
                  <span>
                    <strong>{ledger.entryId}</strong> · {ledger.description} · {category}
                  </span>
                  <span className={styles.outstandingEvidence}>
                    Cleared {evidence ? `${longDate(evidence.date)} as ${evidence.description} (${evidence.reference}) on ${ACCOUNT.name}` : o.evidenceId}
                    . {o.explanation}
                  </span>
                  <span className={styles.rowValue}>{signed(ledger.amount)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.summaryColumn}>
      <h3 className={styles.summaryHeading}>{title}</h3>
      <dl className={styles.rows}>{children}</dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={styles.rowValue}>{value}</dd>
    </div>
  )
}
