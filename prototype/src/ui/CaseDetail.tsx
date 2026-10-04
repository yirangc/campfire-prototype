import { useEffect, useRef, useState } from 'react'
import { Button, Icon, Notice, TextArea } from '../../../src/components'
import type { FieldErrors, Result } from '../domain/engine'
import { ACCOUNT, PERIOD, SUGGESTIONS, TIMING_CATEGORIES } from '../domain/fixture'
import { longDate, money, signed } from '../domain/format'
import {
  eligibleCandidates,
  evidenceItem,
  findRecord,
  ledgerRecord,
  recordLabel,
  type ReviewCase,
} from '../domain/selectors'
import type { CaseDraft, FinancialRecord, LedgerEntry } from '../domain/types'
import { defaultDraft, emptySearch, expenseDefaults, outstandingDefaults } from '../drafts'
import type { Recon } from '../useRecon'
import { ExpenseForm } from './ExpenseForm'
import { expenseFieldIds, outstandingFieldIds } from './fieldIds'
import { OutstandingForm } from './OutstandingForm'
import { Amount, Card, Fields } from './RecordCard'
import { recordFields } from './recordFields'
import { SearchCard } from './SearchCard'
import styles from './Detail.module.css'

export interface CaseDetailProps {
  recon: Recon
  reviewCase: ReviewCase
  onCollapse: () => void
  announce: (message: string) => void
}

const SOURCE_LABEL = { suggestion: 'from the suggestion', search: 'from search', created: 'by creating the entry' } as const

/**
 * Expanded detail inside the register row (49:952, 38:6667, 38:7064, 51:1040): 20 px top and bottom, 16 px sides,
 * 20 px between the notice, the comparison and the action footer. The comparison is two 612 px cards with a 32 px
 * arrow column and 12 px gaps; the footer right-aligns Leave Unresolved (link) and the primary action.
 */
export function CaseDetail({ recon, reviewCase: c, onCollapse, announce }: CaseDetailProps) {
  const { state, dispatch, setDraft } = recon
  const draft = state.drafts[c.key] ?? defaultDraft(state, c)
  const locked = state.completion.status === 'completed'
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [noteOpen, setNoteOpen] = useState(false)
  const busy = useRef(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const focusConfirm = useRef(false)
  const idPrefix = `case-${c.key}`

  useEffect(() => {
    if (focusConfirm.current && draft.mode === 'selected') {
      focusConfirm.current = false
      confirmRef.current?.focus()
    }
  }, [draft.mode])

  const update = (patch: Partial<CaseDraft>) => setDraft(c.key, { ...draft, ...patch })
  const fail = (result: Extract<Result, { ok: false }>) => {
    setError(result.reason)
    announce(result.reason)
  }
  const succeed = (message: string, collapse = true) => {
    setError(null)
    setFieldErrors({})
    announce(message)
    if (collapse) {
      setDraft(c.key, null)
      onCollapse()
    }
  }

  const origin: FinancialRecord = c.bank ?? c.ledger!
  const candidates = c.status === 'unmatched' ? eligibleCandidates(state, origin.id) : []
  const lastUndo = state.undoStack[state.undoStack.length - 1]
  const canUndoHere =
    !locked && !!lastUndo && lastUndo.recordIds.some((id) => c.recordIds.includes(id) || id === c.ledger?.entryId)
  const dismissed = draft.dismissedSuggestionId ? SUGGESTIONS.find((s) => s.id === draft.dismissedSuggestionId) : undefined
  const showDismissed = c.status === 'unmatched' && !!dismissed && state.dismissed.includes(dismissed.id)

  // ----- actions -----

  const undo = () => {
    const result = dispatch({ type: 'undo' })
    if (!result.ok) return fail(result)
    succeed(result.message ?? 'Undone.')
  }

  const confirmPair = (bankId: string, ledgerId: string, source: 'suggestion' | 'search') => {
    const result = dispatch({ type: 'confirm-match', bankId, ledgerId, source })
    const ledger = ledgerRecord(state, ledgerId)
    if (!result.ok) {
      if (source === 'search') {
        // Revalidated at confirmation: explain, then return to search with the query and filters kept.
        update({ mode: 'search', selectedId: null })
      }
      return fail(result)
    }
    succeed(`Matched ${bankId} with ${ledger?.entryId ?? ledgerId}. Both records are confirmed; the book balance is unchanged.`)
  }

  const dismissSuggestion = () => {
    const s = c.suggestion!
    const result = dispatch({ type: 'dismiss-suggestion', suggestionId: s.id })
    if (!result.ok) return fail(result)
    setDraft(c.key, {
      mode: 'search',
      search: emptySearch(),
      selectedId: null,
      expense: null,
      outstanding: null,
      note: draft.note,
      dismissedSuggestionId: s.id,
    })
    succeed(`Suggestion dismissed. ${s.bankId} and ${c.ledger!.entryId} remain unresolved.`, false)
  }

  const restoreSuggestion = () => {
    if (!dismissed) return
    const result = dispatch({ type: 'restore-suggestion', suggestionId: dismissed.id })
    if (!result.ok) return fail(result)
    setDraft(c.key, null)
    succeed(`Suggestion restored: ${dismissed.bankId} and ${ledgerRecord(state, dismissed.ledgerId)?.entryId} are suggested again.`, false)
  }

  const focusFirstInvalid = (errors: FieldErrors, ids: Record<string, string>) => {
    const first = Object.keys(ids).find((k) => errors[k])
    if (first) requestAnimationFrame(() => document.getElementById(ids[first])?.focus())
  }

  const createExpense = () => {
    if (busy.current || !c.bank) return
    busy.current = true
    const expense = draft.expense ?? expenseDefaults(c)
    const result = dispatch({ type: 'create-expense', bankId: c.bank.id, ...expense })
    busy.current = false
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {})
      if (result.fieldErrors) {
        // The fields carry the messages; focus moves to the first one and the count is announced.
        setError(null)
        focusFirstInvalid(result.fieldErrors, expenseFieldIds(idPrefix))
        const n = Object.keys(result.fieldErrors).length
        return announce(`Nothing was created. ${n} ${n === 1 ? 'field needs' : 'fields need'} attention.`)
      }
      return fail(result)
    }
    const entry = result.state.generated.find((g) => g.generatedFrom === c.bank!.id)
    succeed(`Created ${entry?.entryId} for ${money(Math.abs(c.bank.amount))} in ${entry?.category} and matched it to ${c.bank.id}.`)
  }

  const documentOutstanding = () => {
    if (busy.current || !c.ledger) return
    busy.current = true
    const doc = draft.outstanding ?? outstandingDefaults()
    const result = dispatch({ type: 'document-outstanding', ledgerId: c.ledger.id, ...doc })
    busy.current = false
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {})
      if (result.fieldErrors) focusFirstInvalid(result.fieldErrors, outstandingFieldIds(idPrefix))
      return fail(result)
    }
    succeed(`Documented ${c.ledger.entryId} as outstanding. It is explained by later bank activity; the book balance is unchanged.`)
  }

  const leaveUnresolved = () => {
    const result = dispatch({ type: 'leave-unresolved', recordId: c.key, note: draft.note })
    if (!result.ok) return fail(result)
    setNoteOpen(false)
    succeed(
      draft.note.trim()
        ? `Left ${recordLabel(origin)} unresolved with a note. Balances and progress are unchanged.`
        : `Left ${recordLabel(origin)} unresolved. Balances and progress are unchanged.`,
    )
  }

  const switchMode = (mode: CaseDraft['mode']) => {
    setError(null)
    setFieldErrors({})
    const patch: Partial<CaseDraft> = { mode, previousMode: draft.mode }
    if (mode === 'create' && !draft.expense) patch.expense = expenseDefaults(c)
    if (mode === 'outstanding' && !draft.outstanding) patch.outstanding = outstandingDefaults()
    update(patch)
  }

  const cancelForm = () => {
    setError(null)
    setFieldErrors({})
    const back = draft.previousMode && draft.previousMode !== draft.mode ? draft.previousMode : 'search'
    update({ mode: back, expense: draft.mode === 'create' ? null : draft.expense, outstanding: draft.mode === 'outstanding' ? null : draft.outstanding })
  }

  // ----- notices -----

  const otherNoun = origin.kind === 'bank' ? 'ledger entry' : 'bank transaction'
  const notices: React.ReactNode[] = []
  if (locked) {
    notices.push(
      <Notice key="locked" tone="info" title="Reconciliation completed">
        This case is read-only. Reopen the reconciliation to change it.
      </Notice>,
    )
  }
  if (error) {
    notices.push(
      <Notice key="error" tone="warning" title="Nothing was changed" role="alert">
        {error}
      </Notice>,
    )
  }
  if (c.status === 'suggested' && c.suggestion) {
    notices.push(
      <Notice key="ai" tone="ai" title={c.suggestion.headline}>
        <p>{c.suggestion.detail}</p>
      </Notice>,
    )
  } else if (showDismissed && dismissed) {
    const ledger = ledgerRecord(state, dismissed.ledgerId)
    notices.push(
      <Notice
        key="dismissed"
        tone="info"
        title="Suggestion dismissed"
        action={
          !locked && (
            <Button onClick={restoreSuggestion} aria-label={`Undo dismissing ${ledger?.entryId}`}>
              Undo
            </Button>
          )
        }
      >
        {ledger?.entryId} was not matched. This transaction remains unresolved.
      </Notice>,
    )
  } else if (c.status === 'unmatched' && !locked) {
    if (origin.kind === 'bank') {
      notices.push(
        candidates.length === 0 ? (
          <Notice key="none" tone="warning" title="No matching ledger entry found">
            {origin.amount < 0
              ? 'No unmatched entry has this amount. Search to double-check, or record the missing expense entry below.'
              : 'No unmatched entry has this amount. Search to double-check, or leave it unresolved with a note.'}
          </Notice>
        ) : (
          <Notice key="nosuggest" tone="info" title="No suggestion for this transaction">
            {candidates.length} unmatched {candidates.length === 1 ? 'entry has' : 'entries have'} the same amount. No suggestion
            doesn’t mean the entry is missing; search before creating one.
          </Notice>
        ),
      )
    } else {
      notices.push(
        <Notice key="ledger" tone="warning" title="Not on the November statement">
          {candidates.length > 0
            ? `${candidates.length} unmatched bank ${candidates.length === 1 ? 'transaction has' : 'transactions have'} this amount. Search them, or document the entry as outstanding with later bank evidence.`
            : 'No bank transaction in November has this amount. If it cleared later, document it as outstanding with that evidence.'}
        </Notice>,
      )
    }
  }
  if (c.status === 'confirmed' && c.ledger && c.match) {
    const created = !!c.ledger.generatedFrom
    notices.push(
      <Notice
        key="confirmed"
        tone="success"
        title={created ? `Created ${c.ledger.entryId} and matched it` : 'Match confirmed'}
        action={canUndoHere && <Button onClick={undo}>Undo</Button>}
      >
        {created
          ? `${c.bank!.id} is explained by the new entry. The book balance decreased by ${money(Math.abs(c.ledger.amount))}.`
          : `${c.bank!.id} and ${c.ledger.entryId} are explained, matched ${SOURCE_LABEL[c.match.source]}. The book balance is unchanged.`}
      </Notice>,
    )
  }
  if (c.status === 'outstanding' && c.ledger && c.outstanding) {
    notices.push(
      <Notice key="outstanding" tone="info" title="Documented as outstanding" action={canUndoHere && <Button onClick={undo}>Undo</Button>}>
        {c.ledger.entryId} is explained by later bank activity. The book balance is unchanged; the reconciliation adjusts by{' '}
        {signed(c.ledger.amount)}.
      </Notice>,
    )
  }
  const savedNote = state.notes[c.key]
  if (savedNote && (c.status === 'unmatched' || c.status === 'suggested') && !noteOpen) {
    notices.push(
      <Notice key="note" tone="info" title={`Left unresolved · ${longDate(savedNote.at.slice(0, 10))}`}>
        {savedNote.text}
      </Notice>,
    )
  }

  // ----- cards -----

  const leftCard =
    origin.kind === 'bank' ? (
      <Card labelledBy={`${idPrefix}-bank`} title="Bank transaction" chip={ACCOUNT.name}>
        <Amount value={origin.amount} />
        <Fields fields={recordFields(origin, undefined)} />
      </Card>
    ) : (
      <Card labelledBy={`${idPrefix}-ledger`} title="Ledger entry" chip={origin.entryId}>
        <Amount value={origin.amount} />
        <Fields fields={recordFields(origin, undefined, [{ label: 'Counterparty', value: origin.counterparty }])} />
      </Card>
    )

  let rightCard: React.ReactNode = null
  if (c.status === 'suggested' && c.ledger) {
    rightCard = (
      <Card labelledBy={`${idPrefix}-suggested`} title="Suggested ledger entry" chip={c.ledger.entryId} chipTone="ai">
        <Amount value={c.ledger.amount} />
        <Fields fields={recordFields(c.ledger, c.bank, [{ label: 'Match status', value: 'Suggested · not confirmed' }])} />
      </Card>
    )
  } else if (c.status === 'confirmed' && c.ledger) {
    rightCard = <MatchedCard idPrefix={idPrefix} ledger={c.ledger} bank={c.bank!} />
  } else if (c.status === 'outstanding' && c.ledger && c.outstanding) {
    const evidence = evidenceItem(c.outstanding.evidenceId)
    const category = TIMING_CATEGORIES.find((t) => t.value === c.outstanding!.category)?.label
    rightCard = (
      <Card labelledBy={`${idPrefix}-evidence`} title="Outstanding evidence" chip={evidence?.reference}>
        <Amount value={evidence?.amount ?? 0} />
        <Fields
          fields={[
            { label: 'Timing category', value: category },
            { label: 'Cleared', value: evidence ? longDate(evidence.date) : '—', note: `After the ${longDate(PERIOD.end)} statement` },
            { label: 'Bank description', value: evidence?.description ?? '—' },
          ]}
        />
        <Fields fields={[{ label: 'Explanation', value: c.outstanding.explanation }]} />
      </Card>
    )
  } else if (c.status === 'unmatched') {
    const selected = draft.selectedId ? findRecord(state, draft.selectedId) : undefined
    const createAction =
      origin.kind === 'bank' && origin.amount < 0 ? (
        <Button onClick={() => switchMode('create')}>Create entry…</Button>
      ) : origin.kind === 'ledger' && !origin.generatedFrom ? (
        <Button onClick={() => switchMode('outstanding')}>Document as outstanding</Button>
      ) : undefined
    const backToSearch = (
      <Button variant="link" className={styles.headerLink} onClick={() => switchMode('search')}>
        {origin.kind === 'bank' ? 'Search existing entries' : 'Search bank transactions'}
      </Button>
    )
    if (draft.mode === 'selected' && selected) {
      rightCard = (
        <Card
          labelledBy={`${idPrefix}-selected`}
          title={`Selected ${otherNoun}`}
          headerAction={
            <Button variant="link" className={styles.headerLink} onClick={() => update({ mode: 'search', selectedId: null })}>
              Dismiss selection
              <Icon name="x" size={16} />
            </Button>
          }
        >
          <Amount value={selected.amount} />
          <Fields fields={recordFields(selected, origin.kind === 'bank' ? origin : undefined)} />
        </Card>
      )
    } else if (draft.mode === 'create' && c.bank) {
      rightCard = (
        <ExpenseForm
          idPrefix={idPrefix}
          bank={c.bank}
          draft={draft.expense ?? expenseDefaults(c)}
          onChange={(expense) => {
            setFieldErrors(clearChanged(fieldErrors, draft.expense ?? expenseDefaults(c), expense))
            update({ expense })
          }}
          errors={fieldErrors}
          others={candidates}
          headerAction={backToSearch}
        />
      )
    } else if (draft.mode === 'outstanding' && c.ledger) {
      rightCard = (
        <OutstandingForm
          idPrefix={idPrefix}
          ledger={c.ledger}
          draft={draft.outstanding ?? outstandingDefaults()}
          onChange={(outstanding) => {
            setFieldErrors(clearChanged(fieldErrors, draft.outstanding ?? outstandingDefaults(), outstanding))
            update({ outstanding })
          }}
          errors={fieldErrors}
          headerAction={backToSearch}
        />
      )
    } else {
      rightCard = (
        <SearchCard
          state={state}
          originId={origin.id}
          search={draft.search}
          onSearchChange={(search) => update({ search })}
          onSelect={(id) => {
            focusConfirm.current = true
            setError(null)
            update({ mode: 'selected', selectedId: id })
          }}
          headerAction={createAction}
        />
      )
    }
  }

  // ----- footer -----

  let primary: React.ReactNode = null
  let secondary: React.ReactNode = null
  if (!locked && c.status === 'suggested' && c.suggestion) {
    secondary = <Button size="compact" onClick={dismissSuggestion}>Dismiss suggestion</Button>
    primary = (
      <Button variant="primary" size="compact" onClick={() => confirmPair(c.suggestion!.bankId, c.suggestion!.ledgerId, 'suggestion')}>
        Confirm match
      </Button>
    )
  } else if (!locked && c.status === 'unmatched') {
    if (draft.mode === 'create') {
      secondary = <Button size="compact" onClick={cancelForm}>Cancel</Button>
      primary = (
        <Button variant="primary" size="compact" onClick={createExpense}>
          Create and match
        </Button>
      )
    } else if (draft.mode === 'outstanding') {
      secondary = candidates.length > 0 || draft.previousMode ? <Button size="compact" onClick={cancelForm}>Cancel</Button> : null
      primary = (
        <Button variant="primary" size="compact" onClick={documentOutstanding}>
          Document as outstanding
        </Button>
      )
    } else {
      const selectedId = draft.mode === 'selected' ? draft.selectedId : null
      primary = (
        <Button
          ref={confirmRef}
          variant="primary"
          size="compact"
          aria-disabled={!selectedId}
          aria-describedby={!selectedId ? `${idPrefix}-confirm-hint` : undefined}
          onClick={() => {
            if (!selectedId) {
              setError(`Select a ${otherNoun} from the search results first. Only Confirm match creates a match.`)
              return
            }
            if (origin.kind === 'bank') confirmPair(origin.id, selectedId, 'search')
            else confirmPair(selectedId, origin.id, 'search')
          }}
        >
          Confirm match
        </Button>
      )
    }
  }
  const canLeave = !locked && (c.status === 'unmatched' || c.status === 'suggested')

  return (
    <div className={styles.detail}>
      {notices.length > 0 && <div className={styles.notices}>{notices}</div>}
      <div className={styles.comparison}>
        {leftCard}
        <div className={styles.arrow} aria-hidden="true">
          <Icon name="chevron-right" size={24} />
        </div>
        {rightCard}
      </div>
      {noteOpen && canLeave && (
        <div className={styles.notePanel}>
          <TextArea
            label="Note (optional)"
            hint="Leaving a record unresolved changes no balance and doesn’t count as explained."
            rows={2}
            autoFocus
            value={draft.note}
            onChange={(e) => update({ note: e.target.value })}
          />
          <div className={styles.noteActions}>
            <Button onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={leaveUnresolved}>
              Save and leave unresolved
            </Button>
          </div>
        </div>
      )}
      {(primary || secondary || canLeave) && !noteOpen && (
        <div className={styles.footer}>
          {draft.mode === 'search' && c.status === 'unmatched' && (
            <p id={`${idPrefix}-confirm-hint`} className={styles.footerHint}>
              Select a {otherNoun} to confirm a match.
            </p>
          )}
          {canLeave && (
            <Button variant="link" onClick={() => setNoteOpen(true)}>
              Leave Unresolved
            </Button>
          )}
          {secondary}
          {primary}
        </div>
      )}
    </div>
  )
}

/** Drops the error of every field Maya has just edited, so a corrected field stops reading as wrong. */
function clearChanged<T extends object>(errors: FieldErrors, before: T, after: T): FieldErrors {
  const next = { ...errors }
  for (const key of Object.keys(after) as (keyof T & string)[]) if (before[key] !== after[key]) delete next[key]
  return next
}

function MatchedCard({ idPrefix, ledger, bank }: { idPrefix: string; ledger: LedgerEntry; bank: FinancialRecord }) {
  const created = !!ledger.generatedFrom
  const amount = Math.abs(ledger.amount)
  return (
    <Card labelledBy={`${idPrefix}-matched`} title={created ? 'Created ledger entry' : 'Matched ledger entry'} chip={ledger.entryId}>
      <Amount value={ledger.amount} />
      <Fields fields={recordFields(ledger, bank, created ? [] : [{ label: 'Match status', value: 'Confirmed' }])} />
      {created && (
        <Fields
          fields={[
            { label: 'Debit', value: `${ledger.category} · ${money(amount)}` },
            { label: 'Credit', value: `${ACCOUNT.name} · ${money(amount)}` },
            { label: 'Created from', value: `Bank transaction ${ledger.generatedFrom}` },
          ]}
        />
      )}
    </Card>
  )
}
