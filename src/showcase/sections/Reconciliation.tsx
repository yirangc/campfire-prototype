import { useState } from 'react'
import { Button, InfoTip, MetricCard, Notice, Select, StatusPill, TextArea, TextField } from '../../components'
import { Chapter, FigmaLink, Section, Specimen, Tag } from '../parts'
import styles from '../Showcase.module.css'

const CATEGORIES = [
  { value: 'Bank Fees', label: 'Bank Fees' },
  { value: 'Office Supplies', label: 'Office Supplies' },
]

/**
 * Shared pieces added for the reconciliation prototype (prototype/). The prototype imports them from
 * src/components; this chapter shows them in isolation with their Figma sources and evidence tags.
 */
export function Reconciliation() {
  const [category, setCategory] = useState<string | null>(null)
  return (
    <Chapter
      id="reconciliation"
      index="07"
      title="Reconciliation components"
      nodeId="49:617"
      description="Status pills, notices, balance cards, info tips and form states from the Reconcile frames. The reconciliation prototype is a separate entry that imports these components and the shared tokens."
    >
      <p className={styles.docBody}>
        <a className={styles.figmaLink} href="./prototype/">
          Open the reconciliation prototype
        </a>
      </p>

      <Section title="Status pills" note="100 × 22, 4 px radius, 14 px glyph, 11/16 semibold. The label always names the status." tags={<Tag kind="observed" />}>
        <div className={styles.row}>
          <Specimen label="Confirmed" note={<FigmaLink nodeId="49:703" />}>
            <StatusPill status="confirmed" />
          </Specimen>
          <Specimen label="Suggested" note={<FigmaLink nodeId="49:962" />}>
            <StatusPill status="suggested" />
          </Specimen>
          <Specimen label="Unmatched" note={<FigmaLink nodeId="49:794" />}>
            <StatusPill status="unmatched" />
          </Specimen>
          <Specimen label="Outstanding" tags={<Tag kind="proposed" />} note="PRD status with no Figma pill: subtle fill, calendar icon.">
            <StatusPill status="outstanding" />
          </Specimen>
        </div>
      </Section>

      <Section title="Notices" note="6 px radius, 1 px stroke. Page size for the Next step banner, inline size inside an expanded row." tags={<Tag kind="observed" />}>
        <div className={styles.stack}>
          <Notice tone="info" size="page" title="14 records need attention">
            Review 3 suggested matches, then resolve 8 unmatched records.
          </Notice>
          <Notice tone="ai" title="Suggested match: 3 signals found">
            AI found an existing ledger entry that may match this bank transaction.
          </Notice>
          <Notice tone="info" title="Suggestion dismissed" action={<Button>Undo</Button>}>
            GL-1101 was not matched. This transaction remains unresolved.
          </Notice>
          <Notice tone="warning" title="No matching ledger entry found">
            This bank debit has not been recorded in the books.
          </Notice>
          <Notice tone="success" size="page" title="November reconciliation completed" aside="Maya · Nov 30, 2025, 5:42 PM">
            All 14 exception records are explained.
          </Notice>
        </div>
        <p className={styles.note}>
          Sources: <FigmaLink nodeId="38:7408" />, <FigmaLink nodeId="49:967" />, <FigmaLink nodeId="38:6668" />, <FigmaLink nodeId="51:1041" />,{' '}
          <FigmaLink nodeId="28:8917" />.
        </p>
      </Section>

      <Section title="Balance cards and info tips" note="90 px balance variant of the metric card, with a 14 px info button and its tooltip (49:800)." tags={<Tag kind="observed" />}>
        <div className={styles.grid4}>
          <MetricCard variant="balance" label="Statement closing" value="$109,650.00" info="Opening bank balance plus November bank activity." />
          <MetricCard variant="balance" label="Remaining difference" value="$0.00" tone="success" info="Must be exactly $0.00 to complete." />
        </div>
        <p className={styles.note}>
          Standalone: Opening balance <InfoTip topic="Opening balance">Bank balance at the start of the period.</InfoTip>
        </p>
      </Section>

      <Section
        title="Form fields in the expense form"
        note="34 px compact fields (38:7885, 38:7939, 38:8005), read-only with a lock. Errors and the multi-line field are proposed: warning ink, no new color."
        tags={
          <>
            <Tag kind="observed" />
            <Tag kind="proposed">Proposed: error, text area</Tag>
          </>
        }
      >
        <div className={styles.row}>
          <Select label="Expense category" size="compact" width={206} placeholder="Choose a category" options={CATEGORIES} value={category} onChange={setCategory} />
          <div style={{ width: 150 }}>
            <TextField label="Amount · USD" size="compact" readOnly value="$15.00" />
          </div>
          <div style={{ width: 180 }}>
            <TextField label="Posting date" size="compact" icon="calendar" defaultValue="Nov 30, 2025" />
          </div>
          <div style={{ width: 220 }}>
            <TextField label="Posting date (error)" size="compact" icon="calendar" defaultValue="Dec 1, 2025" error="The posting date must be in November 2025." />
          </div>
          <div style={{ width: 280 }}>
            <TextArea label="Explanation" rows={2} placeholder="Why this entry is not on the statement" />
          </div>
        </div>
      </Section>

      <Section title="Buttons on the Reconcile screens" note="Link actions (Leave Unresolved, Search existing entries) and the 35% disabled state drawn on Confirm match (38:6715)." tags={<Tag kind="observed" />}>
        <div className={styles.row}>
          <Button variant="link">Leave Unresolved</Button>
          <Button variant="primary">Confirm match</Button>
          <Button variant="primary" aria-disabled>
            Confirm match
          </Button>
        </div>
      </Section>
    </Chapter>
  )
}
