import type { ReactNode } from 'react'
import { Select, TextField } from '../../../src/components'
import { ACCOUNT, EXPENSE_CATEGORIES } from '../domain/fixture'
import { money } from '../domain/format'
import type { FieldErrors } from '../domain/engine'
import type { BankRecord, ExpenseDraft, FinancialRecord } from '../domain/types'
import { Card } from './RecordCard'
import { expenseFieldIds } from './fieldIds'
import styles from './Detail.module.css'

export interface ExpenseFormProps {
  idPrefix: string
  bank: BankRecord
  draft: ExpenseDraft
  onChange: (draft: ExpenseDraft) => void
  errors: FieldErrors
  /** Eligible existing entries with the same amount. When any remain, Maya must acknowledge a separate expense. */
  others: FinancialRecord[]
  headerAction?: ReactNode
}

/**
 * Create ledger entry inside the ledger card (38:7841 to 38:7905): a "Draft" chip, expense category dropdown
 * (206 px), read-only Amount · USD (150 px) and payment account (200 px), posting date with a calendar icon
 * (180 px) and description. All 34 px. Figma labels the account "Payment account"; the PRD's "Paid from" is used.
 * The summary sentence and the separate-expense acknowledgement are PRD design additions.
 */
export function ExpenseForm({ idPrefix, bank, draft, onChange, errors, others, headerAction }: ExpenseFormProps) {
  const ids = expenseFieldIds(idPrefix)
  const amount = Math.abs(bank.amount)
  const set = (patch: Partial<ExpenseDraft>) => onChange({ ...draft, ...patch })
  const titleId = `${idPrefix}-title`
  return (
    <Card labelledBy={titleId} title="Create ledger entry" chip="Draft" headerAction={headerAction}>
      <div className={styles.formRowTop}>
        <Select
          id={ids.category}
          label="Expense category"
          size="compact"
          placeholder="Choose a category"
          value={draft.category}
          options={EXPENSE_CATEGORIES}
          onChange={(category) => set({ category })}
          error={errors.category}
        />
        <TextField label={`Amount · ${ACCOUNT.currency}`} size="compact" readOnly value={money(amount)} />
        <TextField label="Paid from" size="compact" readOnly value={ACCOUNT.name} />
      </div>
      <div className={styles.formRowBottom}>
        <TextField
          id={ids.date}
          label="Posting date"
          size="compact"
          icon="calendar"
          value={draft.date}
          placeholder="Nov 30, 2025"
          onChange={(e) => set({ date: e.target.value })}
          error={errors.date}
          autoComplete="off"
        />
        <TextField
          id={ids.description}
          label="Description"
          size="compact"
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
          error={errors.description}
        />
      </div>
      <p className={styles.summary} aria-live="polite">
        {draft.category
          ? `Create a ${money(amount)} expense in ${draft.category}, reduce ${ACCOUNT.name} by ${money(amount)}, and match this bank transaction.`
          : `Choose a category. The entry will debit that expense account and credit ${ACCOUNT.name} by ${money(amount)}, then match this bank transaction.`}
      </p>
      {others.length > 0 && (
        <div className={styles.ack}>
          <label>
            <input
              id={ids.acknowledgedSeparate}
              type="checkbox"
              checked={draft.acknowledgedSeparate}
              onChange={(e) => set({ acknowledgedSeparate: e.target.checked })}
              aria-invalid={errors.acknowledgedSeparate ? true : undefined}
              aria-describedby={`${ids.acknowledgedSeparate}-hint`}
            />
            This is a separate expense
          </label>
          <p id={`${ids.acknowledgedSeparate}-hint`} className={errors.acknowledgedSeparate ? styles.fieldError : styles.fieldHint}>
            {errors.acknowledgedSeparate ??
              `${others.length} existing ${others.length === 1 ? 'entry has' : 'entries have'} the same amount (${others
                .map((o) => (o.kind === 'ledger' ? o.entryId : o.id))
                .join(', ')}). Search them first, or confirm this cost is not already recorded.`}
          </p>
        </div>
      )}
    </Card>
  )
}
