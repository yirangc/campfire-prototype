import { useState } from 'react'
import { Breadcrumbs, Button, FinancialTable, PageHeader, Panel, Select } from '../../components'
import { CADENCE, DATE_RANGES, FILTERS, INCOME_STATEMENT, PERIODS, REPORT_VIEWS } from '../sampleData'
import { Chapter, Section, Specimen, Tag } from '../parts'
import styles from '../Showcase.module.css'

const ALL_EXPANDABLE = INCOME_STATEMENT.filter((r) => r.expandable).map((r) => r.id)

export function Reporting() {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [range, setRange] = useState<string | null>('q4-2025')
  const [cadence, setCadence] = useState<string | null>('monthly')
  const [filter, setFilter] = useState<string | null>('none')
  const [view, setView] = useState<string | null>(null)
  const allOpen = expanded.size === ALL_EXPANDABLE.length

  return (
    <Chapter
      id="reporting"
      index="05"
      title="Financial tables and reporting"
      nodeId="12:11621"
      description="The neutral reporting register: restrained hierarchy, compact filters, pale rules and right-aligned amounts. Screenshot numbers are kept without recalculation."
    >
      <Section
        title="Income Statement / assembled specimen"
        note="All three periods and Total are transcribed. Row chevrons and Expand All are live. Expanding a row with no child data only flips its chevron, as in Figma; REVENUE has two sample child rows to show the proposed child-row anatomy."
        tags={
          <>
            <Tag kind="transcribed" />
            <Tag kind="sample">Sample child rows</Tag>
          </>
        }
      >
        <Panel className={styles.reportStack}>
          <PageHeader
            breadcrumbs={<Breadcrumbs variant="plain" compact items={[{ label: 'Reporting', href: '#' }, { label: 'Income Statement' }]} />}
            title="Income Statement"
            actions={<Button>Download</Button>}
            description="Revenue, expenses, gains, and losses during a particular period."
          />
          <div className={styles.rowTight}>
            <Select label="Date Range" options={DATE_RANGES} value={range} onChange={setRange} width={296} />
            <Select label="Cadence" options={CADENCE} value={cadence} onChange={setCadence} width={130} />
            <Select label="Filters" options={FILTERS} value={filter} onChange={setFilter} width={130} />
            <Select label="Report View" options={REPORT_VIEWS} value={view} onChange={setView} placeholder="Select a view" width={190} />
            <Button iconOnly icon="save" aria-label="Save report" />
            <Button variant="ghost" iconOnly icon="trash" aria-label="Delete report" />
          </div>
          <div className={styles.toolbar}>
            <Button
              icon="arrow-up-right"
              aria-pressed={allOpen}
              onClick={() => setExpanded(allOpen ? new Set() : new Set(ALL_EXPANDABLE))}
            >
              {allOpen ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
          <FinancialTable
            caption="Income Statement, Oct to Dec 2025"
            columns={PERIODS}
            rows={INCOME_STATEMENT}
            expanded={expanded}
            onExpandedChange={setExpanded}
          />
        </Panel>
        <p className={styles.note}>
          <Tag kind="proposed" /> "Collapse All" as the pressed label of Expand All is not in Figma.
        </p>
      </Section>

      <Section
        title="Expandable rows / state anatomy"
        note="Collapsed and expanded use the same account and amount; child detail is not fabricated where the source crop does not reveal it."
      >
        <div className={styles.row} style={{ alignItems: 'stretch' }}>
          <Specimen label="Row / collapsed" className={styles.grow}>
            <FinancialTable caption="Collapsed row example" columns={['Oct 2025']} rows={[{ ...INCOME_STATEMENT[0], values: INCOME_STATEMENT[0].values.slice(0, 1), children: undefined }]} />
          </Specimen>
          <Specimen label="Row / expanded" className={styles.grow}>
            <FinancialTable
              caption="Expanded row example"
              columns={['Oct 2025']}
              rows={[{ ...INCOME_STATEMENT[0], values: INCOME_STATEMENT[0].values.slice(0, 1), children: undefined }]}
              expanded={new Set(['revenue'])}
            />
          </Specimen>
        </div>
      </Section>

      <div className={styles.callout}>
        <p className={styles.calloutTitle}>Table alignment contract</p>
        <p className={styles.note}>
          Account labels align left; period headings and amounts share a right edge. Use parentheses for negative amounts and a
          dash for empty values. 40 px body rows, 42 px header, 16 px cell insets and 1 px rules.
        </p>
      </div>
    </Chapter>
  )
}
