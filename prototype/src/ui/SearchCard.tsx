import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from '../../../src/components'
import { longDate, signed } from '../domain/format'
import { findRecord, searchCandidates } from '../domain/selectors'
import type { ReconState, SearchDraft } from '../domain/types'
import { Card } from './RecordCard'
import styles from './Detail.module.css'

export interface SearchCardProps {
  state: ReconState
  originId: string
  search: SearchDraft
  onSearchChange: (search: SearchDraft) => void
  onSelect: (id: string) => void
  /** Header action, e.g. "Create entry…" or "Document as outstanding". */
  headerAction?: React.ReactNode
  autoFocus?: boolean
}

/**
 * "Find another ledger entry" (38:6512) with its results menu (38:7275, 38:7320): heading, subtitle, header action
 * and one search field for keywords or dates. Matching rules (same signed amount, currency and account, unmatched
 * only) apply behind the scenes; results show while the field has focus. At Yirang's request this replaces the PRD's
 * visible filters and matching-criteria text.
 * Keyboard: the input is a combobox. Down/Up move through results, Enter selects one, Escape closes the menu and
 * keeps the query.
 */
export function SearchCard({ state, originId, search, onSearchChange, onSelect, headerAction, autoFocus }: SearchCardProps) {
  const origin = findRecord(state, originId)!
  const otherSide = origin.kind === 'bank' ? 'ledger entry' : 'bank transaction'
  const otherPlural = origin.kind === 'bank' ? 'ledger entries' : 'bank transactions'
  const baseId = useId()
  const listId = `${baseId}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(!!autoFocus)
  const [active, setActive] = useState(-1)

  // Only the query is used; date and counterparty filters are no longer offered.
  const results = useMemo(
    () => searchCandidates(state, originId, { query: search.query, dateFilter: null, counterpartyFilter: null }),
    [state, originId, search.query],
  )

  const update = (query: string) => {
    onSearchChange({ ...search, query, dateFilter: null, counterpartyFilter: null })
    setActive(-1)
  }

  const choose = (id: string) => {
    setOpen(false)
    onSelect(id)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && active >= 0 && results[active]) {
        e.preventDefault()
        choose(results[active].id)
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setActive(-1)
      }
    }
  }

  const optionId = (i: number) => `${baseId}-opt-${i}`
  const titleId = `${baseId}-title`

  return (
    <Card
      labelledBy={titleId}
      rule={false}
      title={
        <div>
          <h3 id={titleId} className={styles.cardTitleStrong}>
            Find another {otherSide}
          </h3>
          <p className={styles.cardSubtitle}>
            Search unmatched {origin.kind === 'bank' ? 'entries' : 'bank transactions'} in this account with the same amount and currency.
          </p>
        </div>
      }
      headerAction={headerAction}
    >
      <div className={styles.combo}>
        <div className={styles.searchBox}>
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            role="combobox"
            aria-label={`Search ${otherPlural} by keywords or date`}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            aria-describedby={`${baseId}-count`}
            autoFocus={autoFocus}
            value={search.query}
            placeholder="Search by keywords or date"
            onChange={(e) => {
              update(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
          />
          {search.query && (
            <button
              type="button"
              className={styles.clearQuery}
              aria-label="Clear search"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                update('')
                inputRef.current?.focus()
              }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <p id={`${baseId}-count`} className="cf-visually-hidden" aria-live="polite">
          {results.length} matching {results.length === 1 ? otherSide : otherPlural}
        </p>
        {open && (
          <ul id={listId} role="listbox" aria-label={`Matching ${otherPlural}`} className={styles.popover} onMouseDown={(e) => e.preventDefault()}>
            {results.map((record, i) => (
              <li
                key={record.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                className={`${styles.option} ${i === active ? styles.optionActive : ''}`}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(record.id)}
              >
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>{record.description}</span>
                  <span className={styles.optionMeta}>
                    {record.kind === 'ledger' ? record.entryId : record.id} · {longDate(record.date)}
                    {record.reference ? ` · ${record.reference}` : ''}
                  </span>
                </span>
                <span className={styles.optionAmount}>{signed(record.amount)}</span>
              </li>
            ))}
            {results.length === 0 && (
              <li role="presentation" className={styles.noResults}>
                No matching {otherPlural}
              </li>
            )}
          </ul>
        )}
      </div>
    </Card>
  )
}
