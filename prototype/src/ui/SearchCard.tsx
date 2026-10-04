import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Button, Icon, Select } from '../../../src/components'
import { ACCOUNT } from '../domain/fixture'
import { longDate, signed } from '../domain/format'
import {
  counterpartyOptions,
  DATE_FILTER_LABEL,
  findRecord,
  keywordSuggestions,
  recordCounterparty,
  searchCandidates,
} from '../domain/selectors'
import type { DateFilter, FinancialRecord, ReconState, SearchDraft } from '../domain/types'
import { Card } from './RecordCard'
import styles from './Detail.module.css'

type Option = { kind: 'keyword'; value: string } | { kind: 'result'; record: FinancialRecord }

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
 * "Find another ledger entry" (38:6696) with the proposed results menu (38:7275, 38:7320). Design addition (PRD):
 * keyword suggestions, removable date and counterparty filters, empty results and full keyboard support.
 * Keyboard: the input is a combobox. Down/Up move through keywords and results, Enter fills a keyword or selects a
 * result, Escape closes the menu and keeps the query.
 */
export function SearchCard({ state, originId, search, onSearchChange, onSelect, headerAction, autoFocus }: SearchCardProps) {
  const origin = findRecord(state, originId)!
  const otherSide = origin.kind === 'bank' ? 'ledger entry' : 'bank transaction'
  const baseId = useId()
  const listId = `${baseId}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(!!autoFocus)
  const [active, setActive] = useState(-1)

  const results = useMemo(() => searchCandidates(state, originId, search), [state, originId, search])
  const keywords = useMemo(
    () => keywordSuggestions(state, originId).filter((k) => k.toLowerCase() !== search.query.trim().toLowerCase()),
    [state, originId, search.query],
  )
  const counterparties = counterpartyOptions(state, originId)
  const hasFilters = !!search.dateFilter || !!search.counterpartyFilter

  const options: Option[] = [
    ...(search.query.trim() ? [] : keywords.map((value) => ({ kind: 'keyword' as const, value }))),
    ...results.map((record) => ({ kind: 'result' as const, record })),
  ]

  const update = (patch: Partial<SearchDraft>) => {
    onSearchChange({ ...search, ...patch })
    setActive(-1)
  }

  const choose = (option: Option) => {
    if (option.kind === 'keyword') {
      update({ query: option.value })
      setOpen(true)
      inputRef.current?.focus()
    } else {
      setOpen(false)
      onSelect(option.record.id)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && active >= 0 && options[active]) {
        e.preventDefault()
        choose(options[active])
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
      <p className={styles.criteria} id={`${baseId}-criteria`}>
        Required for a match: same signed amount <strong>{signed(origin.amount)}</strong>, <strong>{ACCOUNT.currency}</strong>,{' '}
        <strong>{ACCOUNT.name}</strong>. Only unmatched, available {origin.kind === 'bank' ? 'entries' : 'transactions'} qualify.
      </p>
      <div className={styles.combo}>
        <div className={styles.searchBox}>
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            role="combobox"
            aria-label={`Search ${otherSide === 'ledger entry' ? 'ledger entries' : 'bank transactions'} by keyword, reference or entry ID`}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            aria-describedby={`${baseId}-criteria ${baseId}-count`}
            autoFocus={autoFocus}
            value={search.query}
            placeholder="Search by keywords, reference or entry ID"
            onChange={(e) => {
              update({ query: e.target.value })
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
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
                update({ query: '' })
                inputRef.current?.focus()
              }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <p id={`${baseId}-count`} className="cf-visually-hidden" aria-live="polite">
          {results.length} eligible {results.length === 1 ? 'result' : 'results'}
        </p>
        {open && (
          <ul id={listId} role="listbox" aria-label="Eligible matches" className={styles.popover} onMouseDown={(e) => e.preventDefault()}>
            {options.some((o) => o.kind === 'keyword') && (
              <li role="presentation" className={styles.groupLabel}>
                Keywords from the {origin.kind === 'bank' ? 'bank description' : 'ledger entry'}
              </li>
            )}
            {options.map((option, i) =>
              option.kind === 'keyword' ? (
                <li
                  key={`k-${option.value}`}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  className={`${styles.keyword} ${i === active ? styles.optionActive : ''}`}
                  onPointerMove={() => setActive(i)}
                  onClick={() => choose(option)}
                >
                  <Icon name="search" size={12} />
                  {option.value}
                </li>
              ) : (
                <li
                  key={option.record.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  className={`${styles.option} ${i === active ? styles.optionActive : ''}`}
                  onPointerMove={() => setActive(i)}
                  onClick={() => choose(option)}
                >
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{option.record.description}</span>
                    <span className={styles.optionMeta}>
                      {option.record.kind === 'ledger' ? option.record.entryId : option.record.id} · {longDate(option.record.date)}
                      {option.record.reference ? ` · ${option.record.reference}` : ''}
                    </span>
                  </span>
                  <span className={styles.optionAmount}>{signed(option.record.amount)}</span>
                </li>
              ),
            )}
            {results.length === 0 && (
              <li role="presentation" className={styles.noResults}>
                <p>
                  No eligible {otherSide === 'ledger entry' ? 'entries' : 'transactions'} match
                  {search.query.trim() ? ` “${search.query.trim()}”` : ''}
                  {hasFilters ? ' with these filters' : ''}. Only unmatched records with the same signed amount, currency and account
                  are listed.
                </p>
                <div className={styles.noResultsActions}>
                  {search.query && (
                    <Button variant="link" onClick={() => update({ query: '' })}>
                      Clear search
                    </Button>
                  )}
                  {hasFilters && (
                    <Button variant="link" onClick={() => update({ dateFilter: null, counterpartyFilter: null })}>
                      Clear filters
                    </Button>
                  )}
                </div>
              </li>
            )}
          </ul>
        )}
      </div>
      <div className={styles.filters} aria-label="Optional filters" role="group">
        {search.dateFilter && (
          <span className={styles.chipFilter}>
            Date: {DATE_FILTER_LABEL[search.dateFilter]} of {longDate(origin.date)}
            <button type="button" aria-label="Remove date filter" onClick={() => update({ dateFilter: null })}>
              <Icon name="x" size={12} />
            </button>
          </span>
        )}
        {search.counterpartyFilter && (
          <span className={styles.chipFilter}>
            Counterparty: {search.counterpartyFilter}
            <button type="button" aria-label="Remove counterparty filter" onClick={() => update({ counterpartyFilter: null })}>
              <Icon name="x" size={12} />
            </button>
          </span>
        )}
        {!search.dateFilter && (
          <Select
            aria-label="Add a date filter"
            placeholder="Add date filter"
            width={160}
            value={null}
            options={(Object.keys(DATE_FILTER_LABEL) as DateFilter[]).map((v) => ({ value: v, label: DATE_FILTER_LABEL[v] }))}
            onChange={(v) => update({ dateFilter: v as DateFilter })}
          />
        )}
        {!search.counterpartyFilter && counterparties.length > 0 && (
          <Select
            aria-label="Add a counterparty filter"
            placeholder="Add counterparty filter"
            width={200}
            value={null}
            options={counterparties.map((v) => ({ value: v, label: v }))}
            onChange={(v) => update({ counterpartyFilter: v })}
          />
        )}
        {hasFilters && (
          <Button variant="link" onClick={() => update({ dateFilter: null, counterpartyFilter: null })}>
            Clear filters
          </Button>
        )}
      </div>
      {!open && (
        <p className={styles.resultSummary}>
          {results.length} eligible {results.length === 1 ? otherSide : otherSide === 'ledger entry' ? 'entries' : 'transactions'}
          {results.length > 0 && `: ${results.map((r) => `${r.kind === 'ledger' ? r.entryId : r.id} (${recordCounterparty(r)})`).join(', ')}`}
          . Focus the search field to browse them.
        </p>
      )}
    </Card>
  )
}
