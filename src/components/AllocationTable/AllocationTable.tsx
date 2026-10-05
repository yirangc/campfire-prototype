import { Select, type SelectOption } from '../Select/Select'
import { Icon } from '../Icon/Icon'
import styles from './AllocationTable.module.css'

export interface AllocationLine {
  id: string
  account: string
  /** Raw percentage text as typed, e.g. "40". */
  percentage: string
  department: string | null
  tag: string | null
  market: string | null
  productTeams: string | null
}

export type AllocationField = 'percentage' | 'department' | 'tag' | 'market' | 'productTeams'

export interface AllocationTableProps {
  caption: string
  lines: AllocationLine[]
  /** Pre-formatted total, e.g. "100.00%". The table does not calculate it. */
  total: string
  options: {
    department: SelectOption[]
    tag: SelectOption[]
    market: SelectOption[]
    productTeams: SelectOption[]
  }
  onChange: (id: string, field: AllocationField, value: string | null) => void
  onEditAccount?: (id: string) => void
  onRemoveLine?: (id: string) => void
  className?: string
}

/**
 * Figma: Campfire/Table/Editable Cost Allocation, Campfire/Table/Cell/* dropdown and
 * Campfire/Table/Allocation total/Complete.
 * 36 px white header, 44 px rows with 1 px cell rules, columns 240 / 90 / 150 / flex / flex / 200,
 * 38 px total row on the sidebar fill, 8 px horizontal scroll track.
 */
export function AllocationTable({
  caption,
  lines,
  total,
  options,
  onChange,
  onEditAccount,
  onRemoveLine,
  className,
}: AllocationTableProps) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      {/* Figma draws this track permanently, so it keeps its own scrollbar and never fades (see index.css). */}
      <div className={styles.scroller} data-scrollbar="figma">
        <table className={styles.table}>
          <caption className="cf-visually-hidden">{caption}</caption>
          <colgroup>
            <col style={{ width: 240 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 150 }} />
            <col />
            <col />
            <col style={{ width: 200 }} />
          </colgroup>
          <thead>
            <tr className={styles.head}>
              <th scope="col">Account</th>
              <th scope="col" className={styles.percentHead}>
                Percentage
              </th>
              <th scope="col">Department</th>
              <th scope="col">Tag</th>
              <th scope="col">Market</th>
              <th scope="col">Product Teams</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const n = index + 1
              return (
                <tr key={line.id} className={styles.row}>
                  <th scope="row" className={styles.textCell}>
                    <div className={styles.accountInner}>
                    <span className={styles.cellText}>{line.account}</span>
                    <button
                      type="button"
                      className={styles.iconAction}
                      aria-label={`Edit account for line ${n}`}
                      onClick={() => onEditAccount?.(line.id)}
                    >
                      <Icon name="edit" size={12} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconAction}
                      aria-label={`Remove line ${n}`}
                      onClick={() => onRemoveLine?.(line.id)}
                    >
                      <Icon name="x" size={12} />
                    </button>
                    </div>
                  </th>
                  <td className={styles.percentCell}>
                    <input
                      className={styles.percentInput}
                      inputMode="decimal"
                      aria-label={`Percentage for line ${n}`}
                      value={line.percentage}
                      onChange={(e) => onChange(line.id, 'percentage', e.target.value)}
                    />
                  </td>
                  <td className={line.department ? styles.textCell : styles.selectCell}>
                    {line.department ? (
                      <div className={styles.departmentInner}>
                        <span className={styles.cellText}>{line.department}</span>
                        <button
                          type="button"
                          className={styles.iconAction}
                          aria-label={`Clear department for line ${n}`}
                          onClick={() => onChange(line.id, 'department', null)}
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </div>
                    ) : (
                      <Select
                        variant="cell"
                        aria-label={`Department for line ${n}`}
                        placeholder="Select Department"
                        options={options.department}
                        value={null}
                        onChange={(v) => onChange(line.id, 'department', v)}
                      />
                    )}
                  </td>
                  <td className={styles.selectCell}>
                    <Select
                      variant="cell"
                      aria-label={`Tag for line ${n}`}
                      placeholder="Select Tag"
                      options={options.tag}
                      value={line.tag}
                      onChange={(v) => onChange(line.id, 'tag', v)}
                    />
                  </td>
                  <td className={styles.selectCell}>
                    <Select
                      variant="cell"
                      aria-label={`Market for line ${n}`}
                      placeholder="Select Market"
                      options={options.market}
                      value={line.market}
                      onChange={(v) => onChange(line.id, 'market', v)}
                    />
                  </td>
                  <td className={styles.selectCell}>
                    <Select
                      variant="cell"
                      aria-label={`Product Teams for line ${n}`}
                      placeholder="Select Product Teams"
                      options={options.productTeams}
                      value={line.productTeams}
                      onChange={(v) => onChange(line.id, 'productTeams', v)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className={styles.total}>
              <td colSpan={6}>
                <span className={styles.totalInner}>
                  <span>Total</span>
                  <output aria-live="polite">{total}</output>
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export interface AllocationTotalProps {
  label?: string
  value: string
}

/** Figma: Campfire/Table/Allocation total/Complete as a standalone 44 px specimen. Only the complete state exists. */
export function AllocationTotal({ label = 'Total', value }: AllocationTotalProps) {
  return (
    <div className={styles.totalSpecimen}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

/** Figma: Campfire/Table/Cell/* dropdown as a standalone bordered 300 × 44 cell. */
export function DropdownCell(props: React.ComponentProps<typeof Select>) {
  return (
    <div className={styles.cellSpecimen}>
      <Select {...props} variant="cell" />
    </div>
  )
}
