import type { ReactNode } from 'react'
import { signed } from '../domain/format'
import type { Field } from './recordFields'
import styles from './Detail.module.css'

/**
 * Bank transaction / ledger entry card (49:974, 49:996): white, 1 px border, 6 px radius, card elevation,
 * 16 px inset, 12 px gap. Header 12/18 medium secondary with an 11/16 chip, a 1 px rule, the amount
 * (11/16 label, 28/34 semibold value) and a row of 11/16 labels over 12/18 values.
 */
export function Card({
  title,
  chip,
  chipTone = 'neutral',
  headerAction,
  children,
  labelledBy,
  rule = true,
  record = false,
}: {
  title: ReactNode
  chip?: ReactNode
  chipTone?: 'neutral' | 'ai'
  headerAction?: ReactNode
  children: ReactNode
  labelledBy?: string
  /** The 1 px rule under the header. The search card (38:6696) has none. */
  rule?: boolean
  /** A record card (header, rule, amount, fields): side by side, its rows line up with the other card's. */
  record?: boolean
}) {
  return (
    <section className={[styles.card, record && styles.recordCard].filter(Boolean).join(' ')} aria-labelledby={labelledBy}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          {typeof title === 'string' ? (
            <h3 id={labelledBy} className={styles.cardTitle}>
              {title}
            </h3>
          ) : (
            title
          )}
          {/* With a header action the chip sits beside the title ("Draft", 38:7838); otherwise it is right-aligned (51:1053). */}
          {chip && (
            <span className={[chipTone === 'ai' ? styles.chipAi : styles.chip, !headerAction && styles.chipEnd].filter(Boolean).join(' ')}>
              {chip}
            </span>
          )}
        </div>
        {headerAction}
      </div>
      {rule && <hr className={styles.rule} />}
      {children}
    </section>
  )
}

export function Amount({ value }: { value: number }) {
  return (
    <div className={styles.amount}>
      <p className={styles.fieldLabel}>Amount</p>
      <p className="cf-text-metric">{signed(value)}</p>
    </div>
  )
}

export function Fields({ fields }: { fields: Field[] }) {
  return (
    <dl className={styles.fields}>
      {fields.map((f) => (
        <div key={f.label} className={styles.field}>
          <dt className={styles.fieldLabel}>{f.label}</dt>
          <dd className={styles.fieldValue}>
            {f.value}
            {f.note && <span className={styles.fieldNote}>{f.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
