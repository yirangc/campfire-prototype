/*
 * Accounting actions. Each action is a pure function of (state, action) and either returns the next state
 * or a rejection with a reason (and field errors for forms). A rejected action never changes state.
 */
import { ACCOUNT, DECEMBER_ACTIVITY, EXPENSE_CATEGORIES, FIRST_GENERATED_ENTRY, PERIOD, PROPOSALS, USER } from './fixture'
import { longDate, money, parseDate } from './format'
import {
  bankRecord,
  completionBlockers,
  eligibleCandidates,
  findRecord,
  generatedEntryFor,
  isExplained,
  ledgerRecord,
  matchFor,
  matchProblem,
  outstandingFor,
  recordLabel,
} from './selectors'
import type {
  CaseDraft,
  HistoryEntry,
  HistoryType,
  LedgerEntry,
  MatchSource,
  ReconState,
  TimingCategory,
  UndoEntry,
} from './types'

export const initialState = (): ReconState => ({
  version: 1,
  generated: [],
  matches: [],
  dismissed: [],
  outstanding: [],
  notes: {},
  drafts: {},
  history: [],
  undoStack: [],
  completion: { status: 'in_progress' },
  nextEntryNumber: FIRST_GENERATED_ENTRY,
  seq: 0,
})

export type Action =
  | { type: 'confirm-match'; bankId: string; ledgerId: string; source: MatchSource }
  | { type: 'dismiss-suggestion'; suggestionId: string }
  | { type: 'restore-suggestion'; suggestionId: string }
  | { type: 'create-expense'; bankId: string; category: string | null; date: string; description: string; acknowledgedSeparate: boolean }
  | {
      type: 'document-outstanding'
      ledgerId: string
      category: TimingCategory | null
      explanation: string
      evidenceId: string | null
    }
  | { type: 'leave-unresolved'; recordId: string; note: string }
  /** Without recordId, undoes the latest accounting action; with it, the latest one on that record. */
  | { type: 'undo'; recordId?: string }
  | { type: 'complete' }
  | { type: 'reopen' }
  | { type: 'set-draft'; key: string; draft: CaseDraft | null }

export type FieldErrors = Record<string, string>

export type Result =
  | { ok: true; state: ReconState; message?: string }
  | { ok: false; state: ReconState; reason: string; fieldErrors?: FieldErrors }

const LOCKED = 'This reconciliation is completed. Reopen it to make changes.'

const reject = (state: ReconState, reason: string, fieldErrors?: FieldErrors): Result => ({ ok: false, state, reason, fieldErrors })

function record(
  state: ReconState,
  at: string,
  type: HistoryType,
  recordIds: string[],
  summary: string,
  undo?: Omit<UndoEntry, 'historyId'>,
): ReconState {
  const seq = state.seq + 1
  const entry: HistoryEntry = { id: `H${seq}`, at, type, recordIds, summary }
  return {
    ...state,
    seq,
    history: [...state.history, entry],
    undoStack: undo ? [...state.undoStack, { ...undo, historyId: entry.id }] : state.undoStack,
  }
}

export function validateExpense(
  state: ReconState,
  input: { bankId: string; category: string | null; date: string; description: string; acknowledgedSeparate: boolean },
): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.category || !EXPENSE_CATEGORIES.some((c) => c.value === input.category)) {
    errors.category = 'Choose the expense category that records this cost.'
  }
  const date = parseDate(input.date)
  if (!input.date.trim()) errors.date = 'Enter a posting date.'
  else if (!date) errors.date = 'Enter a real date, for example Nov 30, 2025.'
  else if (date < PERIOD.start || date > PERIOD.end) errors.date = 'The posting date must be in November 2025.'
  if (!input.description.trim()) errors.description = 'Enter a description.'
  const others = eligibleCandidates(state, input.bankId)
  if (others.length > 0 && !input.acknowledgedSeparate) {
    errors.acknowledgedSeparate = `${others.length} existing ${others.length === 1 ? 'entry has' : 'entries have'} the same amount. Review ${others.length === 1 ? 'it' : 'them'}, or confirm this is a separate expense.`
  }
  return errors
}

export function validateOutstanding(
  state: ReconState,
  input: { ledgerId: string; category: TimingCategory | null; explanation: string; evidenceId: string | null },
): FieldErrors {
  const errors: FieldErrors = {}
  const ledger = ledgerRecord(state, input.ledgerId)
  if (!ledger) return { form: 'This ledger entry no longer exists.' }
  if (!input.category) errors.category = 'Choose a timing category.'
  else if (input.category === 'deposit-in-transit' && ledger.amount < 0)
    errors.category = 'A deposit in transit must increase cash. This entry is a withdrawal.'
  else if (input.category !== 'deposit-in-transit' && ledger.amount > 0)
    errors.category = 'This entry increases cash, so it can only be a deposit in transit.'
  if (!input.explanation.trim()) errors.explanation = 'Explain why this entry is not on the November statement.'
  const evidence = DECEMBER_ACTIVITY.find((item) => item.id === input.evidenceId)
  if (!input.evidenceId) errors.evidenceId = 'Choose the later bank activity that supports this item.'
  else if (!evidence) errors.evidenceId = 'That evidence could not be found.'
  else {
    const problems: string[] = []
    if (evidence.amount !== ledger.amount) problems.push(`its amount is ${money(evidence.amount, { sign: 'always' })}, not ${money(ledger.amount, { sign: 'always' })}`)
    if (evidence.reference !== ledger.reference) problems.push(`its reference is ${evidence.reference}, not ${ledger.reference ?? 'blank'}`)
    if (evidence.accountId !== ledger.accountId) problems.push('it is from a different account')
    if (evidence.date <= PERIOD.end) problems.push('it is not after the statement period')
    if (problems.length) errors.evidenceId = `This activity doesn't support ${ledger.entryId}: ${problems.join(' and ')}.`
  }
  return errors
}

export function reduce(state: ReconState, action: Action, at: string): Result {
  const locked = state.completion.status === 'completed'

  switch (action.type) {
    case 'set-draft': {
      const drafts = { ...state.drafts }
      if (action.draft) drafts[action.key] = action.draft
      else delete drafts[action.key]
      return { ok: true, state: { ...state, drafts } }
    }

    case 'confirm-match': {
      if (locked) return reject(state, LOCKED)
      const problem = matchProblem(state, action.bankId, action.ledgerId)
      if (problem) return reject(state, problem)
      const ledger = ledgerRecord(state, action.ledgerId)!
      const suggestion = PROPOSALS.find(
        (s) => s.bankId === action.bankId && s.ledgerId === action.ledgerId && !state.dismissed.includes(s.id),
      )
      const seq = state.seq + 1
      const matchId = `M${seq}`
      const next: ReconState = {
        ...state,
        seq,
        matches: [
          ...state.matches,
          { id: matchId, bankId: action.bankId, ledgerId: action.ledgerId, source: action.source, suggestionId: suggestion?.id, at },
        ],
      }
      const summary = `Matched bank transaction ${action.bankId} with ${ledger.entryId} (${action.ledgerId})`
      const ids = [action.bankId, action.ledgerId]
      return { ok: true, state: record(next, at, 'confirm-match', ids, summary, { label: summary, recordIds: ids, op: { type: 'match', matchId } }) }
    }

    case 'dismiss-suggestion': {
      if (locked) return reject(state, LOCKED)
      const suggestion = PROPOSALS.find((s) => s.id === action.suggestionId)
      if (!suggestion) return reject(state, 'That suggestion no longer exists.')
      if (state.dismissed.includes(suggestion.id)) return reject(state, 'That suggestion is already dismissed.')
      if (isExplained(state, suggestion.bankId) || isExplained(state, suggestion.ledgerId))
        return reject(state, 'One of these records is already explained.')
      const ledger = ledgerRecord(state, suggestion.ledgerId)!
      const next = { ...state, dismissed: [...state.dismissed, suggestion.id] }
      return {
        ok: true,
        state: record(next, at, 'dismiss-suggestion', [suggestion.bankId, suggestion.ledgerId], `Dismissed ${suggestion.kind === 'auto' ? 'auto-match' : 'suggestion'} ${suggestion.bankId} → ${ledger.entryId}; both records are unmatched`),
      }
    }

    case 'restore-suggestion': {
      if (locked) return reject(state, LOCKED)
      const suggestion = PROPOSALS.find((s) => s.id === action.suggestionId)
      if (!suggestion || !state.dismissed.includes(suggestion.id)) return reject(state, 'There is no dismissed suggestion to restore.')
      const ledger = ledgerRecord(state, suggestion.ledgerId)!
      const taken = [suggestion.bankId, suggestion.ledgerId].filter((id) => isExplained(state, id))
      if (taken.length) {
        const which = taken.map((id) => recordLabel(findRecord(state, id)!)).join(' and ')
        return reject(state, `Can't restore the suggestion: ${which} ${taken.length > 1 ? 'have' : 'has'} since been explained. Undo that action first if it was a mistake.`)
      }
      const next = { ...state, dismissed: state.dismissed.filter((id) => id !== suggestion.id) }
      return {
        ok: true,
        state: record(next, at, 'restore-suggestion', [suggestion.bankId, suggestion.ledgerId], `Restored ${suggestion.kind === 'auto' ? 'auto-match' : 'suggestion'} ${suggestion.bankId} → ${ledger.entryId}`),
      }
    }

    case 'create-expense': {
      if (locked) return reject(state, LOCKED)
      const bank = bankRecord(action.bankId)
      if (!bank) return reject(state, 'That bank transaction no longer exists.')
      // Duplicate guard keyed on the originating bank record: a repeated submit, retry or refresh is a no-op.
      const existing = generatedEntryFor(state, bank.id)
      if (existing) return reject(state, `${existing.entryId} was already created for ${bank.id}. Nothing new was posted.`)
      if (isExplained(state, bank.id)) return reject(state, `Bank transaction ${bank.id} is already explained.`)
      if (bank.amount >= 0) return reject(state, 'Only bank debits can be recorded as a missing expense.')
      const fieldErrors = validateExpense(state, action)
      if (Object.keys(fieldErrors).length) return reject(state, 'Fix the highlighted fields.', fieldErrors)
      const amount = Math.abs(bank.amount)
      const entry: LedgerEntry = {
        kind: 'ledger',
        id: `N-${bank.id}`,
        entryId: `GL-${state.nextEntryNumber}`,
        date: parseDate(action.date)!,
        description: action.description.trim(),
        counterparty: action.category!,
        amount: bank.amount,
        currency: bank.currency,
        accountId: ACCOUNT.id,
        generatedFrom: bank.id,
        category: action.category!,
        lines: [
          { account: action.category!, debit: amount, credit: 0 },
          { account: ACCOUNT.name, debit: 0, credit: amount },
        ],
      }
      const seq = state.seq + 1
      const matchId = `M${seq}`
      const next: ReconState = {
        ...state,
        seq,
        nextEntryNumber: state.nextEntryNumber + 1,
        generated: [...state.generated, entry],
        matches: [...state.matches, { id: matchId, bankId: bank.id, ledgerId: entry.id, source: 'created', at }],
      }
      const summary = `Created ${entry.entryId} (${money(amount)} ${entry.category}, posted ${longDate(entry.date)}) and matched it to ${bank.id}`
      const ids = [bank.id, entry.entryId]
      return {
        ok: true,
        state: record(next, at, 'create-expense', ids, summary, { label: summary, recordIds: ids, op: { type: 'create', matchId, ledgerId: entry.id } }),
      }
    }

    case 'document-outstanding': {
      if (locked) return reject(state, LOCKED)
      const ledger = ledgerRecord(state, action.ledgerId)
      if (!ledger || ledger.generatedFrom) return reject(state, 'Only original ledger entries can be documented as outstanding.')
      if (matchFor(state, ledger.id)) return reject(state, `${ledger.entryId} is already matched.`)
      if (outstandingFor(state, ledger.id)) return reject(state, `${ledger.entryId} is already documented as outstanding.`)
      const fieldErrors = validateOutstanding(state, action)
      if (Object.keys(fieldErrors).length) return reject(state, 'This outstanding claim is not supported yet. The entry stays unresolved.', fieldErrors)
      const next: ReconState = {
        ...state,
        outstanding: [
          ...state.outstanding,
          { ledgerId: ledger.id, category: action.category!, explanation: action.explanation.trim(), evidenceId: action.evidenceId!, at },
        ],
      }
      const summary = `Documented ${ledger.entryId} (${ledger.id}) as outstanding with evidence ${action.evidenceId}`
      return {
        ok: true,
        state: record(next, at, 'document-outstanding', [ledger.id], summary, { label: summary, recordIds: [ledger.id], op: { type: 'outstanding', ledgerId: ledger.id } }),
      }
    }

    case 'leave-unresolved': {
      if (locked) return reject(state, LOCKED)
      const target = findRecord(state, action.recordId)
      if (!target) return reject(state, 'That record no longer exists.')
      const notes = { ...state.notes }
      const text = action.note.trim()
      const had = !!notes[action.recordId]
      if (text) notes[action.recordId] = { text, at }
      else delete notes[action.recordId]
      const summary = had
        ? text
          ? `Edited the note on ${action.recordId}`
          : `Removed the note on ${action.recordId}`
        : text
          ? `Left ${action.recordId} unresolved with a note`
          : `Left ${action.recordId} unresolved`
      return { ok: true, state: record({ ...state, notes }, at, 'leave-unresolved', [action.recordId], summary) }
    }

    case 'undo': {
      if (locked) return reject(state, 'Reopen the reconciliation before undoing accounting actions.')
      // Each record belongs to at most one live action, so any row's own action can be undone on its own
      // (Yirang, 2026-10-05: Undo lives in each reviewed row's banner, not only on the latest action).
      const index = action.recordId
        ? state.undoStack.findLastIndex((u) => u.recordIds.includes(action.recordId!))
        : state.undoStack.length - 1
      const last = state.undoStack[index]
      if (!last) return reject(state, 'There is nothing to undo.')
      let next: ReconState = { ...state, undoStack: state.undoStack.filter((_, i) => i !== index) }
      if (last.op.type === 'match') {
        const { matchId } = last.op
        next = { ...next, matches: next.matches.filter((m) => m.id !== matchId) }
      } else if (last.op.type === 'create') {
        const { matchId, ledgerId } = last.op
        next = {
          ...next,
          matches: next.matches.filter((m) => m.id !== matchId),
          generated: next.generated.filter((g) => g.id !== ledgerId),
        }
      } else {
        const { ledgerId } = last.op
        next = { ...next, outstanding: next.outstanding.filter((o) => o.ledgerId !== ledgerId) }
      }
      return { ok: true, state: record(next, at, 'undo', last.recordIds, `Undid: ${last.label}`), message: `Undid: ${last.label}` }
    }

    case 'complete': {
      if (locked) return reject(state, 'This reconciliation is already completed.')
      const blockers = completionBlockers(state)
      if (blockers.length) return reject(state, blockers.join(' '))
      const next: ReconState = { ...state, completion: { status: 'completed', completedAt: at, completedBy: USER.name } }
      return { ok: true, state: record(next, at, 'complete', [], 'Completed the November 2025 reconciliation') }
    }

    case 'reopen': {
      if (!locked) return reject(state, 'This reconciliation is already open.')
      const next: ReconState = { ...state, completion: { status: 'in_progress' } }
      return { ok: true, state: record(next, at, 'reopen', [], 'Reopened the November 2025 reconciliation') }
    }
  }
}
