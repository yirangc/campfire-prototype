import { Logo } from './components'
import { Allocation } from './showcase/sections/Allocation'
import { Assets } from './showcase/sections/Assets'
import { Controls } from './showcase/sections/Controls'
import { Flags } from './showcase/sections/Flags'
import { Foundations } from './showcase/sections/Foundations'
import { NavigationSection } from './showcase/sections/NavigationSection'
import { Reconciliation } from './showcase/sections/Reconciliation'
import { Reporting } from './showcase/sections/Reporting'
import styles from './showcase/Showcase.module.css'

const CHAPTERS = [
  ['foundations', 'Foundations'],
  ['assets', 'Logo and icons'],
  ['navigation', 'Navigation'],
  ['controls', 'Controls and metrics'],
  ['reporting', 'Financial reporting'],
  ['allocation', 'Cost allocation'],
  ['reconciliation', 'Reconciliation'],
  ['flags', 'Flags'],
] as const

export default function App() {
  return (
    <div className={styles.layout}>
      <nav className={styles.toc} aria-label="Showcase sections">
        <div className={styles.tocTitle}>
          <Logo />
          <p className="cf-text-caption cf-text-secondary">Design system showcase</p>
        </div>
        <ol>
          {CHAPTERS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ol>
      </nav>
      <main className={styles.main}>
        <header className={styles.docHeader}>
          <p className="cf-text-overline cf-text-secondary">Campfire / design system / phase 1</p>
          <h1 className={styles.docTitle}>Campfire design system</h1>
          <p className={styles.docBody}>
            Tokens, assets and reusable components built from the six Campfire Figma references. Sample data is labelled. The
            reconciliation prototype is a separate entry at <a href="./prototype/">prototype/</a> built from these components.
          </p>
        </header>
        <Foundations />
        <Assets />
        <NavigationSection />
        <Controls />
        <Reporting />
        <Allocation />
        <Reconciliation />
        <Flags />
      </main>
    </div>
  )
}
