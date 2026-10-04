import { useMemo, useState } from 'react'
import {
  AllocationTable,
  AllocationTotal,
  Button,
  DropdownCell,
  Modal,
  TextField,
  type AllocationField,
  type AllocationLine,
} from '../../components'
import { ALLOCATION_LINES, ALLOCATION_OPTIONS } from '../sampleData'
import { Chapter, Section, Specimen, Tag } from '../parts'
import styles from '../Showcase.module.css'

let nextId = 100

/** Showcase-only state. Validation and save behaviour wait for the PRD. */
function useAllocationLines() {
  const [lines, setLines] = useState<AllocationLine[]>(ALLOCATION_LINES)
  const [message, setMessage] = useState('')
  const total = useMemo(() => {
    const sum = lines.reduce((acc, l) => acc + (Number.parseFloat(l.percentage) || 0), 0)
    return `${sum.toFixed(2)}%`
  }, [lines])

  const onChange = (id: string, field: AllocationField, value: string | null) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: field === 'percentage' ? (value ?? '') : value } : l)))

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: `l${nextId++}`, account: 'Software & Web Services', percentage: '0', department: null, tag: null, market: null, productTeams: null },
    ])
    setMessage('Line added (sample).')
  }

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id))
    setMessage('Line removed (sample).')
  }

  const editAccount = () => setMessage('Edit account pressed. The account picker waits for the PRD.')

  return { lines, total, onChange, addLine, removeLine, editAccount, message }
}

function LinesBlock({ state }: { state: ReturnType<typeof useAllocationLines> }) {
  return (
    <div className={styles.section} style={{ gap: 12 }}>
      <div className={styles.linesHeader}>
        <h4 className={styles.linesTitle}>Lines</h4>
        <Button onClick={state.addLine}>Add Line</Button>
      </div>
      <AllocationTable
        caption="Cost allocation lines"
        lines={state.lines}
        total={state.total}
        options={ALLOCATION_OPTIONS}
        onChange={state.onChange}
        onRemoveLine={state.removeLine}
        onEditAccount={state.editAccount}
      />
    </div>
  )
}

export function Allocation() {
  const tableState = useAllocationLines()
  const modalState = useAllocationLines()
  const [open, setOpen] = useState(false)
  const [cell, setCell] = useState<Record<string, string | null>>({ tag: null, market: null, productTeams: null })

  return (
    <Chapter
      id="allocation"
      index="06"
      title="Editable allocation and modal"
      nodeId="12:11783"
      description="The allocation pattern keeps Software & Web Services, the department split, Tag, Market, Product Teams, IT Allocation and the 100.00% total."
    >
      <Section
        title="Cost-allocation table / editable specimen"
        note="Observed rows: 40 / COGS, 35 / Engineering, 25 / HR. Percentages are editable; account edit, row remove, department clear, the dropdown cells and Add Line are live."
        tags={
          <>
            <Tag kind="transcribed" />
            <Tag kind="sample">Sample dropdown options</Tag>
          </>
        }
      >
        <LinesBlock state={tableState} />
        <p className={styles.status} aria-live="polite">
          {tableState.message}
        </p>
        <p className={styles.note}>
          <Tag kind="proposed" /> After a department is cleared, the cell becomes a dropdown cell ("Select Department"). Figma does
          not show the cleared state, and has no styling for a total other than 100.00%.
        </p>
      </Section>

      <Section title="Dropdown cells and total" note="A cell's placeholder uses muted ink with a compact two-way select indicator.">
        <div className={styles.row}>
          <Specimen label="Dropdown cell / Tag">
            <div style={{ width: 300 }}>
              <DropdownCell aria-label="Tag" placeholder="Select Tag" options={ALLOCATION_OPTIONS.tag} value={cell.tag} onChange={(v) => setCell((c) => ({ ...c, tag: v }))} />
            </div>
          </Specimen>
          <Specimen label="Dropdown cell / Market">
            <div style={{ width: 300 }}>
              <DropdownCell aria-label="Market" placeholder="Select Market" options={ALLOCATION_OPTIONS.market} value={cell.market} onChange={(v) => setCell((c) => ({ ...c, market: v }))} />
            </div>
          </Specimen>
          <Specimen label="Dropdown cell / Product Teams">
            <div style={{ width: 300 }}>
              <DropdownCell
                aria-label="Product Teams"
                placeholder="Select Product Teams"
                options={ALLOCATION_OPTIONS.productTeams}
                value={cell.productTeams}
                onChange={(v) => setCell((c) => ({ ...c, productTeams: v }))}
              />
            </div>
          </Specimen>
        </div>
        <Specimen label="Percentage total / complete">
          <div style={{ width: 300 }}>
            <AllocationTotal value="100.00%" />
          </div>
        </Specimen>
      </Section>

      <Section
        title="Edit Cost Allocation / modal"
        note="Title, Name, Number, Lines and cell content are observed. The Save / Cancel footer is inferred beyond the crop. The modal opens with focus in Name, traps Tab, closes on Escape and returns focus to the button."
      >
        <div>
          <Button variant="primary" onClick={() => setOpen(true)}>
            Open Edit Cost Allocation
          </Button>
        </div>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Edit Cost Allocation"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Save
              </Button>
            </>
          }
        >
          <div className={styles.fieldsRow}>
            <TextField label="Name" defaultValue="IT Allocation" autoFocus />
            <TextField label="Number" defaultValue="12345" />
          </div>
          <LinesBlock state={modalState} />
        </Modal>
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>Overlay and dialog recipe</p>
          <p className={styles.note}>
            1040 px dialog · 24 px insets · 10 px corners · 0 12 32 shadow at 15% black. The source backdrop appears heavily
            dimmed; Figma proposes a #000000B8 scrim outside the reusable modal.
          </p>
        </div>
      </Section>
    </Chapter>
  )
}
