import { Fragment, useState } from 'react'
import { Icon } from '../Icon/Icon'
import styles from './FinancialTable.module.css'

export interface FinancialRow {
  id: string
  /** Account label as shown in the source (Figma uses uppercase account names). */
  label: string
  /** Pre-formatted amounts, one per column. Use parentheses for negatives and "–" for empty values. */
  values: string[]
  /** "subtotal" rows (Gross Profit, Operating Income, Net Income) use the sidebar fill and heavier weights. */
  kind?: 'line' | 'subtotal'
  /** Shows the expansion chevron. Figma shows it on every row. */
  expandable?: boolean
  /** Child rows revealed when expanded. Child row styling is not documented in Figma (proposed). */
  children?: FinancialRow[]
}

export interface FinancialTableProps {
  /** Accessible table name, e.g. "Income Statement". */
  caption: string
  /** Period headings plus Total, right-aligned. */
  columns: string[]
  rows: FinancialRow[]
  /** Controlled expansion. Omit both to let the table manage it. */
  expanded?: ReadonlySet<string>
  onExpandedChange?: (next: Set<string>) => void
  className?: string
}

/**
 * Figma: Campfire/Table/Income Statement and Campfire/Table/Row/* (Collapsed, Expanded).
 * 42 px subtle header, 40 px rows, 16 px insets, 24 px column gap, 230 px account column, 1 px rules.
 * Account labels align left; headings and amounts share a right edge.
 */
export function FinancialTable({ caption, columns, rows, expanded, onExpandedChange, className }: FinancialTableProps) {
  const [internal, setInternal] = useState<Set<string>>(() => new Set())
  const open = expanded ?? internal

  const toggle = (id: string) => {
    const next = new Set(open)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    if (onExpandedChange) onExpandedChange(next)
    if (!expanded) setInternal(next)
  }

  const renderRow = (row: FinancialRow, depth: number) => {
    const isOpen = open.has(row.id)
    const isSubtotal = row.kind === 'subtotal'
    const rowCls = [styles.row, isSubtotal && styles.subtotal, depth > 0 && styles.childRow].filter(Boolean).join(' ')
    return (
      <Fragment key={row.id}>
        <tr className={rowCls}>
          <th scope="row" className={styles.account}>
            {row.expandable ? (
              <button
                type="button"
                className={styles.toggle}
                aria-expanded={isOpen}
                onClick={() => toggle(row.id)}
              >
                <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={12} />
                <span>{row.label}</span>
              </button>
            ) : (
              <span className={styles.toggle}>
                <span className={styles.chevronSpace} aria-hidden="true" />
                <span>{row.label}</span>
              </span>
            )}
          </th>
          {row.values.map((v, i) => (
            <td key={i} className={styles.amount}>
              {v}
            </td>
          ))}
        </tr>
        {isOpen && row.children?.map((child) => renderRow(child, depth + 1))}
      </Fragment>
    )
  }

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <table className={styles.table}>
        <caption className="cf-visually-hidden">{caption}</caption>
        <thead>
          <tr className={styles.head}>
            <th scope="col" className={styles.account}>
              <span className="cf-visually-hidden">Account</span>
            </th>
            {columns.map((c) => (
              <th key={c} scope="col" className={styles.amountHead}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map((row) => renderRow(row, 0))}</tbody>
      </table>
    </div>
  )
}
