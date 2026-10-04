import { useState } from 'react'
import { Breadcrumbs, NavItem, SideNav, Tabs, type TabItem } from '../../components'
import { DASHBOARD_NAV, REPORTING_NAV } from '../sampleData'
import { Chapter, FigmaLink, Section, Specimen, Tag } from '../parts'
import styles from '../Showcase.module.css'

/** Campfire Tab specimen row (31:909): labels and widths transcribed from Figma. */
const REVIEW_TABS: TabItem[] = [
  { value: 'pending', label: 'PENDING', width: 88 },
  { value: 'approved', label: 'APPROVED', width: 96 },
  { value: 'rejected', label: 'REJECTED', width: 96 },
]
/** Reconcile status tabs (28:8032): labels, counts and widths transcribed from Figma. */
const STATUS_TABS: TabItem[] = [
  { value: 'all', label: 'All (8)', width: 96 },
  { value: 'confirmed', label: 'Confirmed (5)', width: 132 },
  { value: 'suggested', label: 'Suggested (2)', width: 132 },
  { value: 'unmatched', label: 'Unmatched (1)', width: 132 },
]
const one = (label: string): TabItem[] => [{ value: 'x', label, width: 88 }]

export function NavigationSection() {
  const [reviewTab, setReviewTab] = useState('pending')
  const [statusTab, setStatusTab] = useState('all')
  const [dashCurrent, setDashCurrent] = useState('rev-dashboard')
  const [repCurrent, setRepCurrent] = useState('rep-income')

  return (
    <Chapter
      id="navigation"
      index="03"
      title="Side panels and navigation"
      nodeId="12:11289"
      description="One quiet shell, two selection recipes: neutral for financial reporting and lime for the dashboard. Parent rows expand with a chevron; child rows omit the leading glyph."
    >
      <Section
        title="Side panel"
        note="Both panels are live: expand groups with the chevron rows and pick a child to move the selection. 224 px width and 36 px rows are inferred."
        tags={<Tag kind="transcribed" />}
      >
        <div className={styles.sidePanels}>
          <Specimen label="Side panel / dashboard (lime)" note="Observed lime-selected Revenue → Dashboard">
            <div className={styles.sidePanelFrame}>
              <SideNav
                aria-label="Dashboard navigation example"
                items={DASHBOARD_NAV}
                selection="lime"
                currentId={dashCurrent}
                defaultExpanded={['revenue']}
                onNavigate={setDashCurrent}
              />
            </div>
          </Specimen>
          <Specimen label="Side panel / reporting (neutral)" note="Observed Reporting and Accounting expansion">
            <div className={styles.sidePanelFrameTall}>
              <SideNav
                aria-label="Reporting navigation example"
                items={REPORTING_NAV}
                selection="neutral"
                currentId={repCurrent}
                defaultExpanded={['reporting', 'accounting']}
                onNavigate={setRepCurrent}
              />
            </div>
          </Specimen>
          <div className={styles.specimen} style={{ gap: 24 }}>
            <Specimen label="Navigation item / default" note="16 px box / 12 px glyph · 10 px gap · 12/18 regular">
              <NavItem label="Home" icon="home" />
            </Specimen>
            <Specimen label="Navigation item / expanded">
              <NavItem label="Revenue" icon="revenue" expanded />
            </Specimen>
            <Specimen label="Navigation item / collapsed">
              <NavItem label="Accounting" icon="accounting" expanded={false} />
            </Specimen>
            <Specimen label="Navigation item / child default">
              <NavItem label="Contracts" level="child" />
            </Specimen>
            <Specimen label="Navigation item / lime selected">
              <NavItem label="Dashboard" level="child" selected="lime" />
            </Specimen>
            <Specimen label="Navigation item / neutral selected">
              <NavItem label="Income Statement" level="child" selected="neutral" />
            </Specimen>
            <Specimen label="Navigation item / hover" tags={<Tag kind="proposed" />} note="Hover a row to see it. Not documented in Figma.">
              <NavItem label="Customers" level="child" />
            </Specimen>
          </div>
        </div>
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>Selection, not decoration</p>
          <p className={styles.note}>
            Lime marks the active dashboard link. Financial reporting keeps the same neutral border and text vocabulary. Parent
            chevrons communicate expansion; child rows omit the leading glyph. Selected rows also carry aria-current="page" so the
            state is not conveyed by color alone.
          </p>
        </div>
      </Section>

      <Section
        title="Tabs"
        note="Shared Campfire/Navigation/Tab component (31:926). 36 px high, 12 px insets, 12/18 semibold. Default and Active are reference-matched; Hover is Figma's proposed extension. The rows are live: click a tab or use the arrow keys."
        tags={<Tag kind="transcribed" />}
      >
        <div className={styles.stack}>
          <div className={styles.row}>
            <Specimen label="Tab / Default" tags={<Tag kind="observed" />}>
              <Tabs aria-label="Default tab specimen" items={one('PENDING')} value="" onChange={() => {}} />
            </Specimen>
            <Specimen label="Tab / Active" tags={<Tag kind="observed" />}>
              <Tabs aria-label="Active tab specimen" items={one('PENDING')} value="x" onChange={() => {}} />
            </Specimen>
            <Specimen label="Tab / Hover" tags={<Tag kind="proposed" />}>
              <Tabs aria-label="Hover tab specimen" items={one('PENDING')} value="" onChange={() => {}} visualState={{ x: 'hover' }} />
            </Specimen>
            <Specimen label="Tab / Focus" tags={<Tag kind="proposed" />} note="Field/Focus recipe, shared with every control.">
              <Tabs aria-label="Focus tab specimen" items={one('PENDING')} value="x" onChange={() => {}} visualState={{ x: 'focus' }} />
            </Specimen>
            <Specimen label="Tab / Disabled" tags={<Tag kind="proposed" />} note="Not in Figma: muted ink, no hover.">
              <Tabs aria-label="Disabled tab specimen" items={[{ ...one('PENDING')[0], disabled: true }]} value="" onChange={() => {}} />
            </Specimen>
          </div>
          <Specimen label="Tab row / Pending, Approved, Rejected" note="16 px gap, no divider (31:909).">
            <Tabs aria-label="Review status" items={REVIEW_TABS} value={reviewTab} onChange={setReviewTab} />
            <FigmaLink nodeId="31:909" />
          </Specimen>
          <Specimen
            label="Tab row / Reconcile status tabs"
            note="Same component on the Reconcile screens, with a 1 px border/default rule under the row. Figma uses 12 px gaps on most screens and 20 px on one (see Flags); this uses the 16 px row spacing."
          >
            <div style={{ width: '100%', maxWidth: 640 }}>
              <Tabs aria-label="Reconciliation status" items={STATUS_TABS} value={statusTab} onChange={setStatusTab} divider />
            </div>
            <FigmaLink nodeId="28:8032" />
          </Specimen>
        </div>
      </Section>

      <Section title="Breadcrumbs" note="Both visible trails are preserved. The last item is the current page." tags={<Tag kind="transcribed" />}>
        <div className={styles.row}>
          <Specimen label="Breadcrumbs / dashboard reference">
            <Breadcrumbs variant="pill" homeHref="#" items={[{ label: 'Accounting', href: '#' }, { label: 'Chart of Accounts' }]} />
          </Specimen>
          <Specimen label="Breadcrumbs / financial reporting">
            <Breadcrumbs variant="plain" items={[{ label: 'Reporting', href: '#' }, { label: 'Income Statement' }]} />
          </Specimen>
          <Specimen label="Breadcrumbs / reporting page header" note="11/20 text, 10 px chevron, 8 px gap (see Flags: two sizes in Figma)">
            <Breadcrumbs variant="plain" compact items={[{ label: 'Reporting', href: '#' }, { label: 'Income Statement' }]} />
          </Specimen>
        </div>
      </Section>
    </Chapter>
  )
}
