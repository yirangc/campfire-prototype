import { useState } from 'react'
import { Icon, StatusPill } from '../../../src/components'
import { BACKGROUND_PAIRS } from '../domain/fixture'
import { shortDate, signed } from '../domain/format'
import registerStyles from './Register.module.css'
import styles from './Summary.module.css'

/**
 * PRD 3: the five already-matched pairs stay out of the exception tabs and progress. Shown collapsed under the
 * register with the same table recipe (49:687). Figma draws these rows inside the main register instead.
 */
export function BackgroundPairs() {
  const [open, setOpen] = useState(false)
  return (
    <section className={styles.section} aria-labelledby="background-title">
      <h2 className={styles.sectionHeading}>
        <button
          id="background-title"
          type="button"
          className={styles.disclosure}
          aria-expanded={open}
          aria-controls="background-pairs"
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
          Already matched: {BACKGROUND_PAIRS.length} pairs
        </button>
        <span className={styles.sectionNote}>Matched before this review. Not counted in exceptions or progress.</span>
      </h2>
      {open && (
        <table id="background-pairs" className={registerStyles.table}>
          <caption className="cf-visually-hidden">Already-matched background activity</caption>
          <colgroup>
            <col className={registerStyles.colTransaction} />
            <col />
            <col />
            <col />
            <col className={registerStyles.colStatus} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Transaction</th>
              <th scope="col">Bank amount</th>
              <th scope="col">Ledger amount</th>
              <th scope="col">Ledger entry / date</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {BACKGROUND_PAIRS.map(({ bank, ledger }) => (
              <tr key={bank.id} className={registerStyles.row}>
                <th scope="row" className={registerStyles.transaction}>
                  {shortDate(bank.date)} · {bank.description}
                </th>
                <td>{signed(bank.amount)}</td>
                <td>{signed(ledger.amount)}</td>
                <td className={registerStyles.entry}>
                  {ledger.entryId} · {shortDate(ledger.date)}
                </td>
                <td>
                  <StatusPill status="confirmed" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
