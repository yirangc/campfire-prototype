import type { ReactNode } from 'react'
import { figmaNodeUrl } from '../assets/manifest'
import styles from './Showcase.module.css'

export type TagKind = 'observed' | 'inferred' | 'suggested' | 'proposed' | 'sample' | 'transcribed' | 'pending'

const TAG_TEXT: Record<TagKind, string> = {
  observed: 'Observed',
  inferred: 'Inferred',
  suggested: 'Suggested',
  proposed: 'Proposed',
  sample: 'Sample data',
  transcribed: 'Transcribed from Figma',
  pending: 'Asset pending',
}

export function Tag({ kind, children }: { kind: TagKind; children?: ReactNode }) {
  return <span className={`${styles.tag} ${styles[`tag_${kind}`]}`}>{children ?? TAG_TEXT[kind]}</span>
}

export function FigmaLink({ nodeId, label }: { nodeId: string; label?: string }) {
  return (
    <a className={styles.figmaLink} href={figmaNodeUrl(nodeId)} target="_blank" rel="noreferrer">
      {label ?? `Figma ${nodeId}`}
    </a>
  )
}

export function Chapter({ id, index, title, description, nodeId, children }: {
  id: string
  index: string
  title: string
  description: string
  nodeId?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={styles.chapter} aria-labelledby={`${id}-title`}>
      <header className={styles.docHeader}>
        <p className="cf-text-overline cf-text-secondary">Campfire design system / {index}</p>
        <h2 id={`${id}-title`} className={styles.docTitle}>
          {title}
        </h2>
        <p className={styles.docBody}>{description}</p>
        {nodeId && <FigmaLink nodeId={nodeId} label={`Figma reference ${nodeId}`} />}
      </header>
      {children}
    </section>
  )
}

export function Section({ title, note, tags, children }: { title: string; note?: ReactNode; tags?: ReactNode; children?: ReactNode }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeading}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        {note && <p className={styles.note}>{note}</p>}
        {tags && <div className={styles.rowTight}>{tags}</div>}
      </div>
      {children}
    </div>
  )
}

export function Specimen({ label, tags, note, children, className }: {
  label: string
  tags?: ReactNode
  note?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <figure className={[styles.specimen, className].filter(Boolean).join(' ')}>
      <figcaption className={styles.specimenLabel}>
        {label}
        {tags}
      </figcaption>
      {children}
      {note && <p className={styles.specimenNote}>{note}</p>}
    </figure>
  )
}

