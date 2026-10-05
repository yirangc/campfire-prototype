import { Fragment, useEffect, useRef, useState, type MouseEvent } from 'react'
import { Icon, StatusPill, Tooltip } from '../../../src/components'
import { shortDate, signed } from '../domain/format'
import type { CaseStatus, ReviewCase } from '../domain/selectors'
import type { Recon } from '../useRecon'
import { CaseDetail } from './CaseDetail'
import styles from './Register.module.css'

/**
 * What each status pill means, shown in its tooltip on hover or keyboard focus. Yirang's wording (2026-10-05),
 * checked against the case statuses in selectors.ts; Outstanding is a proposed addition in the same voice.
 */
const STATUS_TIPS: Record<CaseStatus, string> = {
  suggested: 'A possible match is ready for your review.',
  unmatched: 'This transaction still needs a match or an explanation.',
  confirmed: 'You’ve reviewed and confirmed this transaction’s resolution.',
  'auto-matched': 'The system found a match. Review the details to confirm it.',
  outstanding: 'You’ve documented this as a timing difference that clears after the statement period.',
}

export interface RegisterProps {
  recon: Recon
  cases: ReviewCase[]
  expanded: string | null
  onToggle: (key: string) => void
  onCollapse: () => void
  announce: (message: string) => void
  emptyLabel: string
}

/**
 * Reconciliation register (49:687): 42 px header on surface/subtle, 40 px rows, 16 px insets, 24 px column gaps,
 * a 230 px transaction column and equal amount, entry and status columns. Each row is one bank transaction or ledger
 * entry (Yirang, 2026-10-05), so a pair takes two rows with the same status; the
 * expanded detail opens inside the table (49:952). The Action column of 28:8442 is removed at Yirang's request
 * (2026-10-05): Undo sits at the right of the expanded row's banner instead.
 */
export function Register({ recon, cases, expanded, onToggle, onCollapse, announce, emptyLabel }: RegisterProps) {
  // The row Maya last opened or closed keeps focus and the focus ring after it collapses, so she can see where she was.
  const [lastRow, setLastRow] = useState<string | null>(null)
  const refocus = useRef(false)
  const buttons = useRef(new Map<string, HTMLButtonElement>())

  const toggle = (key: string) => {
    setLastRow(key)
    refocus.current = expanded === key
    onToggle(key)
  }
  const collapse = () => {
    setLastRow(expanded)
    refocus.current = true
    onCollapse()
  }
  // A confirmed match merges a ledger-only row into its bank row, so follow the record to the row that now holds it.
  const lastKey = lastRow ? (cases.find((c) => c.key === lastRow) ?? cases.find((c) => c.recordIds.includes(lastRow)))?.key : undefined

  // Runs after every render: collapsing after Undo can leave both the expanded row and lastKey unchanged.
  useEffect(() => {
    if (expanded !== null || !refocus.current || !lastKey) return
    refocus.current = false
    const button = buttons.current.get(lastKey)
    button?.focus({ preventScroll: true })
    button?.scrollIntoView?.({ block: 'nearest' })
  })

  return (
    <table className={styles.table}>
      <caption className="cf-visually-hidden">Exception review cases. Expand a row to review its records.</caption>
      <colgroup>
        <col className={styles.colTransaction} />
        <col />
        <col />
        <col />
        <col className={styles.colStatus} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">
            Transaction
          </th>
          <th scope="col">Bank amount</th>
          <th scope="col">Ledger amount</th>
          <th scope="col">Ledger entry / date</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {cases.length === 0 && (
          <tr>
            <td colSpan={5} className={styles.empty}>
              {emptyLabel}
            </td>
          </tr>
        )}
        {cases.map((c) => {
          const open = expanded === c.key
          const primary = c.record
          const detailId = `case-${c.key}`
          return (
            <Fragment key={c.key}>
              <tr
                className={open ? styles.rowOpen : `${styles.row} ${lastKey === c.key ? styles.rowLast : ''}`}
                onClick={(e) => rowClick(e, () => toggle(c.key))}
              >
                <th scope="row" className={styles.transaction} data-label="Transaction">
                  <button
                    type="button"
                    className={styles.disclosure}
                    aria-expanded={open}
                    aria-controls={open ? detailId : undefined}
                    ref={(el) => {
                      if (el) buttons.current.set(c.key, el)
                      else buttons.current.delete(c.key)
                    }}
                    onClick={() => toggle(c.key)}
                  >
                    <Icon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
                    <span className={styles.label}>
                      <span className="cf-visually-hidden">{c.side === 'bank' ? 'Bank transaction,' : 'Ledger entry,'}</span>{' '}
                      {shortDate(primary.date)} · {primary.description}
                    </span>
                  </button>
                </th>
                <td className={styles.amountCell} data-label="Bank amount">
                  {c.side === 'bank' ? signed(c.record.amount) : <Dash />}
                </td>
                <td className={styles.amountCell} data-label="Ledger amount">
                  {c.side === 'ledger' ? signed(c.record.amount) : <Dash />}
                </td>
                <td className={styles.entry} data-label="Ledger entry / date">
                  {c.side === 'ledger' && c.ledger ? (
                    <>
                      {c.ledger.entryId} · {shortDate(c.ledger.date)}
                      {c.ledger.generatedFrom && <span className={styles.created}>Created</span>}
                    </>
                  ) : (
                    <Dash />
                  )}
                </td>
                <td className={styles.statusCell}>
                  <Tooltip content={STATUS_TIPS[c.status]} align="end">
                    <StatusPill status={c.status} />
                  </Tooltip>
                </td>
              </tr>
              {open && (
                <tr className={styles.detailRow}>
                  <td colSpan={5} id={detailId}>
                    <CaseDetail recon={recon} reviewCase={c} onCollapse={collapse} announce={announce} />
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}

/**
 * A click anywhere on a case row toggles its detail. The disclosure button stays the keyboard and
 * screen-reader control; clicks on buttons or links in the row, and text selections, are left alone.
 * The status pill's tooltip trigger is not a control, so a click on the pill toggles the row like any other cell.
 */
function rowClick(e: MouseEvent<HTMLTableRowElement>, toggle: () => void) {
  if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return
  if (window.getSelection()?.toString()) return
  toggle()
}

function Dash() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="cf-visually-hidden">None</span>
    </>
  )
}
