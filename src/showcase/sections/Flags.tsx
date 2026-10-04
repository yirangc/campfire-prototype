import { ACCESSIBILITY, CONFLICTS, UNDOCUMENTED, UNVERIFIED } from '../flags'
import { Chapter, Section } from '../parts'
import styles from '../Showcase.module.css'

function List({ items }: { items: string[] }) {
  return (
    <ul className={styles.flagList}>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

export function Flags() {
  return (
    <Chapter
      id="flags"
      index="08"
      title="Flags"
      description="Conflicts between references, choices Figma does not document, accessibility concerns in the supplied designs, and what could not be verified."
    >
      <Section title="Conflicting references">
        <List items={CONFLICTS} />
      </Section>
      <Section title="Undocumented choices (proposed)">
        <List items={UNDOCUMENTED} />
      </Section>
      <Section title="Accessibility concerns in the designs">
        <List items={ACCESSIBILITY} />
      </Section>
      <Section title="Not verified">
        <List items={UNVERIFIED} />
      </Section>
    </Chapter>
  )
}
