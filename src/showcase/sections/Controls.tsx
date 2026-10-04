import { useState } from 'react'
import { Button, MetricCard, Select, TextField, TrendBadge } from '../../components'
import { CADENCE, DATE_RANGES, FILTERS, METRICS, REPORT_VIEWS } from '../sampleData'
import { Chapter, Section, Specimen, Tag } from '../parts'
import styles from '../Showcase.module.css'

export function Controls() {
  const [cadence, setCadence] = useState<string | null>('monthly')
  const [filter, setFilter] = useState<string | null>('none')
  const [view, setView] = useState<string | null>(null)
  const [range, setRange] = useState<string | null>('q4-2025')
  const [allTime, setAllTime] = useState<string | null>('all-time')
  const [clicks, setClicks] = useState(0)

  return (
    <Chapter
      id="controls"
      index="04"
      title="Controls, fields and metric cards"
      nodeId="12:11464"
      description="Compact controls, low-contrast outlines and soft card elevation. Positive trend tints are used sparingly, as in the references. Keyboard focus follows Figma's Labelled inputs: a 2 px lime stroke inside the control and a soft lime ring outside it."
    >
      <Section
        title="Buttons"
        note="36 px height · 12/18 medium · 6 px radius. Toolbar outline icons are observed; full primary and secondary actions are Figma's proposed completion."
      >
        <div className={styles.row}>
          <Specimen label="Primary / neutral">
            <Button variant="primary" onClick={() => setClicks((c) => c + 1)}>
              Save
            </Button>
          </Specimen>
          <Specimen label="Secondary / outlined">
            <Button>Cancel</Button>
          </Specimen>
          <Specimen label="Secondary / add line">
            <Button>Add Line</Button>
          </Specimen>
          <Specimen label="Secondary / leading icon">
            <Button icon="arrow-up-right">Expand All</Button>
          </Specimen>
          <Specimen label="Icon only / save">
            <Button iconOnly icon="save" aria-label="Save report" />
          </Specimen>
          <Specimen label="Icon only / delete" note="Ghost">
            <Button variant="ghost" iconOnly icon="trash" aria-label="Delete report" />
          </Specimen>
          <Specimen label="Icon only / close" note="Ghost">
            <Button variant="ghost" iconOnly icon="x" aria-label="Close" />
          </Specimen>
        </div>
        <p className={styles.status} aria-live="polite">
          Primary button pressed {clicks} {clicks === 1 ? 'time' : 'times'}.
        </p>
      </Section>

      <Section title="Button states" note="Only the resting state is drawn in Figma. Focus uses the Field/Focus recipe from Labelled inputs (2 px focus lime inside, 2 px lime ring at 50% outside). Secondary and ghost hover reuse surface/subtle, like the Tab hover variant. Figma has no token for a primary hover, so primary hover shows no change. Disabled is 35% opacity, as drawn on the Reconcile screens (49:639)." tags={<Tag kind="proposed" />}>
        <div className={styles.row}>
          {(['primary', 'secondary', 'ghost'] as const).map((variant) => (
            <div key={variant} className={styles.specimen}>
              <span className={styles.specimenLabel}>{variant}</span>
              <div className={styles.rowTight}>
                <Button variant={variant}>Rest</Button>
                <Button variant={variant} data-visual-state="hover">
                  Hover
                </Button>
                <Button variant={variant} data-visual-state="focus">
                  Focus
                </Button>
                <Button variant={variant} disabled>
                  Disabled
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Labelled inputs"
        note="Name / IT Allocation and Number / 12345 are transcribed. Focus is Figma's 2 px focus lime border with the proposed soft lime ring outside it. Label gap 6 px · input inset 12 px · 1 px border, 2 px on focus · 38 px height."
        tags={<Tag kind="transcribed" />}
      >
        <div className={styles.row}>
          <Specimen label="Input / default">
            <div style={{ width: 280 }}>
              <TextField label="Number" defaultValue="12345" />
            </div>
          </Specimen>
          <Specimen label="Input / focus" note="Static specimen; click any input to see live focus.">
            <div style={{ width: 280 }}>
              <TextField label="Name" defaultValue="IT Allocation" data-visual-state="focus" />
            </div>
          </Specimen>
          <Specimen label="Input / placeholder" tags={<Tag kind="proposed" />} note="Placeholder uses muted ink, as in the dropdown cells.">
            <div style={{ width: 280 }}>
              <TextField label="Name" placeholder="Allocation name" />
            </div>
          </Specimen>
        </div>
      </Section>

      <Section
        title="Dropdowns and date range"
        note="Closed states are observed. The open menu is Figma's proposed extension. All dropdowns here are live: use the mouse, or Enter / arrow keys, then arrows, Enter and Escape."
      >
        <div className={styles.row}>
          <Select label="Cadence" options={CADENCE} value={cadence} onChange={setCadence} width={160} />
          <Select label="Filters" options={FILTERS} value={filter} onChange={setFilter} width={160} />
          <Select label="Report View" options={REPORT_VIEWS} value={view} onChange={setView} placeholder="Select a view" width={200} />
        </div>
        <div className={styles.row}>
          <Select label="Date Range / reporting" icon="calendar" options={DATE_RANGES} value={range} onChange={setRange} width={300} />
          <Select label="Date Range / allocation context" icon="calendar" options={DATE_RANGES} value={allTime} onChange={setAllTime} width={180} />
        </div>
        <p className={styles.note}>
          <Tag kind="sample" /> Filter and Report View options beyond "None" and "Select a view" are sample labels.
        </p>
      </Section>

      <Section
        title="Metric cards and trend badge"
        note="Four fully readable dashboard metrics are retained. Right-hand cards clipped by the screenshot are not invented."
        tags={<Tag kind="transcribed" />}
      >
        <div className={styles.metricGrid}>
          {METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
        <Specimen label="Trend badge / positive" note="11/16 regular · pale green tint · upward cue. Only the positive state exists in Figma.">
          <span>
            <TrendBadge value="11%" />
          </span>
        </Specimen>
      </Section>
    </Chapter>
  )
}
