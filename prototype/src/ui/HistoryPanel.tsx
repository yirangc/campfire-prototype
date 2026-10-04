import { useState } from 'react'
import { Button, Icon } from '../../../src/components'
import { timestamp } from '../domain/format'
import type { ReconState } from '../domain/types'
import styles from './Summary.module.css'

/**
 * Design addition (PRD 7): the reconciliation history, newest first. Undo applies to the most recent accounting
 * action only (reverse order); history entries are never removed, so an undo is recorded as its own entry.
 */
export function HistoryPanel({ state, onUndo }: { state: ReconState; onUndo: () => void }) {
  const [open, setOpen] = useState(false)
  const lastUndo = state.undoStack.at(-1)
  const locked = state.completion.status === 'completed'
  const entries = [...state.history].reverse()
  return (
    <section className={styles.section} aria-labelledby="history-title">
      <h2 className={styles.sectionHeading}>
        <button
          id="history-title"
          type="button"
          className={styles.disclosure}
          aria-expanded={open}
          aria-controls="history-list"
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
          History ({state.history.length})
        </button>
        {lastUndo && !locked && (
          <span className={styles.sectionNote}>
            Next undo: {lastUndo.label}
            <Button variant="link" className={styles.inlineLink} onClick={onUndo}>
              Undo
            </Button>
          </span>
        )}
      </h2>
      {open && (
        <ol id="history-list" className={styles.history}>
          {entries.length === 0 && <li className={styles.historyEmpty}>No actions yet.</li>}
          {entries.map((h) => (
            <li key={h.id} className={styles.historyItem}>
              <time dateTime={h.at} className={styles.historyTime}>
                {timestamp(h.at)}
              </time>
              <span>{h.summary}</span>
              {lastUndo?.historyId === h.id && !locked && <span className={styles.historyTag}>Undo available</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
