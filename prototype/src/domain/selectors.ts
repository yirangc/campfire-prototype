/*
 * Everything Maya sees (statuses, cases, counts, balances, completion blockers) is derived here from the
 * fixture plus ReconState. Nothing derived is stored, so persistence and undo cannot drift from it.
 */
import {
  ACCOUNT,
  BACKGROUND_PAIRS,
  BANK_EXCEPTIONS,
  DECEMBER_ACTIVITY,
  LEDGER_EXCEPTIONS,
  OPENING_BALANCE,
  ORIGINAL_EXCEPTION_IDS,
  SUGGESTIONS,
} from './fixture'
import { daysBetween, money } from './format'
import type {
  BankRecord,
  Cents,
  DateFilter,
  FinancialRecord,
  LedgerEntry,
  Match,
  OutstandingDoc,
  ReconState,
  SearchDraft,
  Suggestion,
} from './types'

export type RecordStatus = 'suggested' | 'unmatched' | 'confirmed' | 'outstanding'

const bankById = new Map(BANK_EXCEPTIONS.map((r) => [r.id, r]))
const ledgerById = new Map(LEDGER_EXCEPTIONS.map((r) => [r.id, r]))

export const bankRecord = (id: string): BankRecord | undefined => bankById.get(id)

export function ledgerRecord(state: ReconState, id: string): LedgerEntry | undefined {
  return ledgerById.get(id) ?? state.generated.find((entry) => entry.id === id)
}

export function findRecord(state: ReconState, id: string): FinancialRecord | undefined {
  return bankRecord(id) ?? ledgerRecord(state, id)
}

export const evidenceItem = (id: string) => DECEMBER_ACTIVITY.find((item) => item.id === id)

export const matchFor = (state: ReconState, id: string): Match | undefined =>
  state.matches.find((m) => m.bankId === id || m.ledgerId === id)

export const outstandingFor = (state: ReconState, id: string): OutstandingDoc | undefined =>
  state.outstanding.find((o) => o.ledgerId === id)

export const isExplained = (state: ReconState, id: string) => !!matchFor(state, id) || !!outstandingFor(state, id)

/** Suggestions that are still proposed: not dismissed, and neither record explained elsewhere. */
export function activeSuggestions(state: ReconState): Suggestion[] {
  return SUGGESTIONS.filter(
    (s) => !state.dismissed.includes(s.id) && !isExplained(state, s.bankId) && !isExplained(state, s.ledgerId),
  )
}

export function recordStatus(state: ReconState, id: string): RecordStatus {
  if (matchFor(state, id)) return 'confirmed'
  if (outstandingFor(state, id)) return 'outstanding'
  if (activeSuggestions(state).some((s) => s.bankId === id || s.ledgerId === id)) return 'suggested'
  return 'unmatched'
}

export interface StatusCounts {
  /** Unmatched records that have an active suggested match (a subset of `unmatched`). */
  suggested: number
  /** Every record not yet confirmed or documented as outstanding, suggested pairs included. */
  unmatched: number
  confirmed: number
  outstanding: number
  all: number
  unresolved: number
  explained: number
}

/**
 * Record-based counts over the 14 original exception records. Generated entries are never counted.
 * Each transaction counts once: a suggested pair is two unmatched records until it is confirmed,
 * so `unmatched` includes the suggested records (Yirang's request; the PRD splits them 6 / 8).
 */
export function statusCounts(state: ReconState): StatusCounts {
  const counts = { suggested: 0, unmatched: 0, confirmed: 0, outstanding: 0 }
  for (const id of ORIGINAL_EXCEPTION_IDS) counts[recordStatus(state, id)] += 1
  const unresolved = counts.suggested + counts.unmatched
  return { ...counts, unmatched: unresolved, all: ORIGINAL_EXCEPTION_IDS.length, unresolved, explained: ORIGINAL_EXCEPTION_IDS.length - unresolved }
}

export type CaseStatus = RecordStatus

export interface ReviewCase {
  /** Stable key: the bank record id when the case has one, otherwise the ledger record id. */
  key: string
  status: CaseStatus
  bank?: BankRecord
  ledger?: LedgerEntry
  suggestion?: Suggestion
  match?: Match
  outstanding?: OutstandingDoc
  /** Original exception records in this case (a generated entry is linked but not counted). */
  recordIds: string[]
  date: string
}

/** Groups the 14 records into review cases. Each record appears in exactly one case. */
export function reviewCases(state: ReconState): ReviewCase[] {
  const cases: ReviewCase[] = []
  const used = new Set<string>()

  for (const match of state.matches) {
    const bank = bankRecord(match.bankId)!
    const ledger = ledgerRecord(state, match.ledgerId)!
    const recordIds = [bank.id, ...(ledger.generatedFrom ? [] : [ledger.id])]
    recordIds.forEach((id) => used.add(id))
    cases.push({ key: bank.id, status: 'confirmed', bank, ledger, match, recordIds, date: bank.date })
  }
  for (const suggestion of activeSuggestions(state)) {
    const bank = bankRecord(suggestion.bankId)!
    const ledger = ledgerRecord(state, suggestion.ledgerId)!
    used.add(bank.id)
    used.add(ledger.id)
    cases.push({ key: bank.id, status: 'suggested', bank, ledger, suggestion, recordIds: [bank.id, ledger.id], date: bank.date })
  }
  for (const doc of state.outstanding) {
    const ledger = ledgerRecord(state, doc.ledgerId)!
    used.add(ledger.id)
    cases.push({ key: ledger.id, status: 'outstanding', ledger, outstanding: doc, recordIds: [ledger.id], date: ledger.date })
  }
  for (const bank of BANK_EXCEPTIONS) {
    if (used.has(bank.id)) continue
    cases.push({ key: bank.id, status: 'unmatched', bank, recordIds: [bank.id], date: bank.date })
  }
  for (const ledger of LEDGER_EXCEPTIONS) {
    if (used.has(ledger.id)) continue
    cases.push({ key: ledger.id, status: 'unmatched', ledger, recordIds: [ledger.id], date: ledger.date })
  }
  return cases.sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key))
}

export interface Balances {
  statementClosing: Cents
  book: Cents
  cleared: Cents
  outstandingDeposits: Cents
  outstandingWithdrawals: Cents
  outstandingNet: Cents
  difference: Cents
  netBankMovement: Cents
}

const sum = (values: Cents[]) => values.reduce((total, value) => total + value, 0)

export function balances(state: ReconState): Balances {
  const backgroundBank = sum(BACKGROUND_PAIRS.map((p) => p.bank.amount))
  const backgroundLedger = sum(BACKGROUND_PAIRS.map((p) => p.ledger.amount))
  const netBankMovement = backgroundBank + sum(BANK_EXCEPTIONS.map((r) => r.amount))
  const statementClosing = OPENING_BALANCE + netBankMovement
  const book =
    OPENING_BALANCE + backgroundLedger + sum(LEDGER_EXCEPTIONS.map((r) => r.amount)) + sum(state.generated.map((r) => r.amount))
  const cleared = OPENING_BALANCE + backgroundBank + sum(state.matches.map((m) => bankRecord(m.bankId)!.amount))
  const outstandingAmounts = state.outstanding.map((o) => ledgerRecord(state, o.ledgerId)!.amount)
  const outstandingDeposits = sum(outstandingAmounts.filter((a) => a > 0))
  const outstandingWithdrawals = sum(outstandingAmounts.filter((a) => a < 0))
  const outstandingNet = outstandingDeposits + outstandingWithdrawals
  return {
    statementClosing,
    book,
    cleared,
    outstandingDeposits,
    outstandingWithdrawals,
    outstandingNet,
    difference: book - statementClosing - outstandingNet,
    netBankMovement,
  }
}

export function completionBlockers(state: ReconState): string[] {
  const counts = statusCounts(state)
  const { difference } = balances(state)
  const blockers: string[] = []
  if (counts.unresolved > 0) {
    const suggested = counts.suggested ? ` (${counts.suggested} of them ${counts.suggested === 1 ? 'has' : 'have'} a suggested match)` : ''
    blockers.push(
      `${counts.unresolved} of ${counts.all} exception records are still unmatched${suggested}. Every record needs a match or documented outstanding evidence.`,
    )
  }
  if (difference !== 0) {
    blockers.push(`The remaining difference is ${money(difference)}. It must be exactly $0.00.`)
  }
  return blockers
}

/** Mandatory criteria for a match: identical signed amount, currency and bank account, and both records available. */
export function matchProblem(state: ReconState, bankId: string, ledgerId: string): string | null {
  const bank = bankRecord(bankId)
  const ledger = ledgerRecord(state, ledgerId)
  if (!bank || !ledger) return 'One of these records no longer exists.'
  if (bank.amount !== ledger.amount)
    return `The amounts differ (${money(bank.amount, { sign: 'always' })} vs ${money(ledger.amount, { sign: 'always' })}). A match needs the same signed amount.`
  if (bank.currency !== ledger.currency) return `The currencies differ (${bank.currency} vs ${ledger.currency}).`
  if (bank.accountId !== ledger.accountId || bank.accountId !== ACCOUNT.id) return 'These records are in different bank accounts.'
  const bankMatch = matchFor(state, bankId)
  if (bankMatch) return `Bank transaction ${bankId} is already matched to ${ledgerRecord(state, bankMatch.ledgerId)?.entryId}.`
  const ledgerMatch = matchFor(state, ledgerId)
  if (ledgerMatch) return `${ledger.entryId} is already matched to bank transaction ${ledgerMatch.bankId}.`
  if (outstandingFor(state, ledgerId)) return `${ledger.entryId} is documented as an outstanding item.`
  return null
}

/** Unexplained records on the other side with the same signed amount, currency and account. */
export function eligibleCandidates(state: ReconState, recordId: string): FinancialRecord[] {
  const bank = bankRecord(recordId)
  if (bank) {
    return LEDGER_EXCEPTIONS.filter((l) => matchProblem(state, bank.id, l.id) === null)
  }
  const ledger = ledgerRecord(state, recordId)
  if (!ledger) return []
  return BANK_EXCEPTIONS.filter((b) => matchProblem(state, b.id, ledger.id) === null)
}

export const recordDescription = (record: FinancialRecord) => record.description
export const recordCounterparty = (record: FinancialRecord) =>
  record.kind === 'ledger' ? record.counterparty : record.description
export const recordLabel = (record: FinancialRecord) => (record.kind === 'ledger' ? record.entryId : record.id)

const DATE_WINDOW: Record<DateFilter, number> = { 'same-day': 0, 'within-3': 3, 'within-7': 7 }
export const DATE_FILTER_LABEL: Record<DateFilter, string> = {
  'same-day': 'Same day',
  'within-3': 'Within 3 days',
  'within-7': 'Within 7 days',
}

/**
 * Case-insensitive search over eligible candidates: description, counterparty, reference and entry id.
 * An empty query lists every eligible candidate; optional filters narrow the list.
 */
export function searchCandidates(state: ReconState, recordId: string, search: SearchDraft): FinancialRecord[] {
  const origin = findRecord(state, recordId)
  if (!origin) return []
  const terms = search.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return eligibleCandidates(state, recordId).filter((candidate) => {
    const haystack = [
      candidate.description,
      recordCounterparty(candidate),
      candidate.reference ?? '',
      candidate.id,
      candidate.kind === 'ledger' ? candidate.entryId : '',
    ]
      .join(' ')
      .toLowerCase()
    if (!terms.every((term) => haystack.includes(term))) return false
    if (search.dateFilter && Math.abs(daysBetween(origin.date, candidate.date)) > DATE_WINDOW[search.dateFilter]) return false
    if (search.counterpartyFilter && recordCounterparty(candidate) !== search.counterpartyFilter) return false
    return true
  })
}

/** Keyword suggestions taken from the origin record's description and reference. */
export function keywordSuggestions(state: ReconState, recordId: string): string[] {
  const origin = findRecord(state, recordId)
  if (!origin) return []
  const words = `${origin.description} ${origin.reference ?? ''}`
    .split(/[\s·]+/)
    .map((w) => w.replace(/[^\w-]/g, ''))
    .filter((w) => w.length >= 3 && !/^(the|and|for|fee)$/i.test(w))
  return [...new Set(words.map((w) => (/\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())))]
}

export function counterpartyOptions(state: ReconState, recordId: string): string[] {
  return [...new Set(eligibleCandidates(state, recordId).map(recordCounterparty))].sort()
}

export function generatedEntryFor(state: ReconState, bankId: string): LedgerEntry | undefined {
  return state.generated.find((g) => g.generatedFrom === bankId)
}
