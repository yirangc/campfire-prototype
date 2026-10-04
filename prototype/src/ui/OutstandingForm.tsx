import type { ReactNode } from 'react'
import { Select, TextArea } from '../../../src/components'
import { DECEMBER_ACTIVITY, PERIOD, TIMING_CATEGORIES } from '../domain/fixture'
import { daysBetween, longDate, shortDate, signed } from '../domain/format'
import type { FieldErrors } from '../domain/engine'
import { evidenceItem } from '../domain/selectors'
import type { LedgerEntry, OutstandingDraft, TimingCategory } from '../domain/types'
import { Card, Fields } from './RecordCard'
import { outstandingFieldIds } from './fieldIds'
import styles from './Detail.module.css'

export interface OutstandingFormProps {
  idPrefix: string
  ledger: LedgerEntry
  draft: OutstandingDraft
  onChange: (draft: OutstandingDraft) => void
  errors: FieldErrors
  headerAction?: ReactNode
}

/**
 * Design addition (PRD): document a ledger-only case as outstanding. Figma has no frame for it, so it reuses the
 * Create ledger entry card (38:7841): "Draft" chip, 34 px fields, header link back to search.
 */
export function OutstandingForm({ idPrefix, ledger, draft, onChange, errors, headerAction }: OutstandingFormProps) {
  const ids = outstandingFieldIds(idPrefix)
  const set = (patch: Partial<OutstandingDraft>) => onChange({ ...draft, ...patch })
  const evidence = draft.evidenceId ? evidenceItem(draft.evidenceId) : undefined
  const titleId = `${idPrefix}-title`
  return (
    <Card labelledBy={titleId} title="Document outstanding item" chip="Draft" headerAction={headerAction}>
      <p className={styles.summary}>
        A missing bank match alone doesn’t prove a timing difference. Choose the later bank activity that shows {ledger.entryId}{' '}
        clearing after {longDate(PERIOD.end)}.
      </p>
      <div className={styles.formRowHalf}>
        <Select
          id={ids.category}
          label="Timing category"
          size="compact"
          placeholder="Choose a category"
          value={draft.category}
          options={TIMING_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          onChange={(category) => set({ category: category as TimingCategory })}
          error={errors.category}
        />
        <Select
          id={ids.evidenceId}
          label="Evidence: later bank activity"
          size="compact"
          placeholder="Choose bank activity"
          value={draft.evidenceId}
          options={DECEMBER_ACTIVITY.map((d) => ({
            value: d.id,
            label: `${shortDate(d.date)} · ${d.description} · ${signed(d.amount)}`,
          }))}
          onChange={(evidenceId) => set({ evidenceId })}
          error={errors.evidenceId}
        />
      </div>
      {evidence && (
        <Fields
          fields={[
            { label: 'Cleared', value: longDate(evidence.date), note: `${daysBetween(PERIOD.end, evidence.date)} days after the statement ends` },
            { label: 'Bank description', value: evidence.description },
            { label: 'Reference', value: evidence.reference },
            { label: 'Amount', value: signed(evidence.amount) },
          ]}
        />
      )}
      <TextArea
        id={ids.explanation}
        label="Explanation"
        rows={2}
        value={draft.explanation}
        placeholder="Why this entry is not on the November statement"
        onChange={(e) => set({ explanation: e.target.value })}
        error={errors.explanation}
      />
      {errors.form && <p className={styles.fieldError}>{errors.form}</p>}
    </Card>
  )
}
