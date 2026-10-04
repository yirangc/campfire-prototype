import { longDate } from './domain/format'
import { eligibleCandidates } from './domain/selectors'
import type { ReviewCase } from './domain/selectors'
import type { CaseDraft, ExpenseDraft, OutstandingDraft, ReconState, SearchDraft } from './domain/types'

export const emptySearch = (): SearchDraft => ({ query: '', dateFilter: null, counterpartyFilter: null })

export function expenseDefaults(c: ReviewCase): ExpenseDraft {
  return { category: null, date: c.bank ? longDate(c.bank.date) : '', description: c.bank?.description ?? '', acknowledgedSeparate: false }
}

export const outstandingDefaults = (): OutstandingDraft => ({ category: null, explanation: '', evidenceId: null })

/** The card a case opens with, when Maya has no draft for it yet. */
export function defaultDraft(state: ReconState, c: ReviewCase): CaseDraft {
  let mode: CaseDraft['mode'] = 'default'
  if (c.status === 'unmatched') {
    const hasCandidates = eligibleCandidates(state, c.key).length > 0
    mode = c.bank || hasCandidates ? 'search' : 'outstanding'
  }
  return {
    mode,
    search: emptySearch(),
    selectedId: null,
    expense: null,
    outstanding: null,
    note: state.notes[c.key]?.text ?? '',
    dismissedSuggestionId: null,
  }
}
