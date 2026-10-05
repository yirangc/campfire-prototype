/*
 * Everything Maya sees (statuses, cases, counts, balances, completion blockers) is derived here from the
 * fixture plus ReconState. Nothing derived is stored, so persistence and undo cannot drift from it.
 */
import {
  ACCOUNT,
  BANK_EXCEPTIONS,
  DECEMBER_ACTIVITY,
  LEDGER_EXCEPTIONS,
  OPENING_BALANCE,
  ORIGINAL_EXCEPTION_IDS,
  PROPOSALS,
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

export type RecordStatus = 'auto-matched' | 'suggested' | 'unmatched' | 'confirmed' | 'outstanding'

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
  return PROPOSALS.filter(
    (s) => !state.dismissed.includes(s.id) && !isExplained(state, s.bankId) && !isExplained(state, s.ledgerId),
  )
}

export function recordStatus(state: ReconState, id: string): RecordStatus {
  if (matchFor(state, id)) return 'confirmed'
  if (outstandingFor(state, id)) return 'outstanding'
  const proposal = activeSuggestions(state).find((s) => s.bankId === id || s.ledgerId === id)
  if (proposal) return proposal.kind === 'auto' ? 'auto-matched' : 'suggested'
  return 'unmatched'
}

export interface StatusCounts {
  /** Records in an automatic match awaiting review. Not counted as unmatched, but still unresolved. */
  autoMatched: number
  /** Records in a suggested match awaiting review. Not counted as unmatched, but still unresolved. */
  suggested: number
  /** Records with no match, no active suggestion and no outstanding documentation. */
  unmatched: number
  confirmed: number
  outstanding: number
  all: number
  unresolved: number
  explained: number
}

/**
 * Record-based counts over the 24 original records (14 PRD exceptions and the 10 records in auto-matched pairs).
 * Generated entries are never counted. Each record counts once, under its own status: suggested and auto-matched
 * records are not unmatched (Yirang, 2026-10-05, as the PRD's 6 / 8 split), but they block completion until reviewed.
 */
export function statusCounts(state: ReconState): StatusCounts {
  const counts = { 'auto-matched': 0, suggested: 0, unmatched: 0, confirmed: 0, outstanding: 0 }
  for (const id of ORIGINAL_EXCEPTION_IDS) counts[recordStatus(state, id)] += 1
  const { 'auto-matched': autoMatched, ...rest } = counts
  const unresolved = counts.suggested + counts.unmatched + autoMatched
  return {
    ...rest,
    autoMatched,
    all: ORIGINAL_EXCEPTION_IDS.length,
    unresolved,
    explained: ORIGINAL_EXCEPTION_IDS.length - unresolved,
  }
}

export type CaseStatus = RecordStatus

export interface ReviewCase {
  /** Stable key: the id of the record this row shows. */
  key: string
  status: CaseStatus
  /** Which record the row shows. Paired records get one row each, carrying the same pair details. */
  side: 'bank' | 'ledger'
  record: FinancialRecord
  bank?: BankRecord
  ledger?: LedgerEntry
  suggestion?: Suggestion
  match?: Match
  outstanding?: OutstandingDoc
  /** Original exception records the row's action covers (both records of a pair; a generated entry is linked but not counted). */
  recordIds: string[]
  date: string
}

/**
 * One row per record (Yirang, 2026-10-05): every bank transaction and ledger entry has its own row, including the
 * entries created from a bank line. A suggested, auto-matched or confirmed pair gives two rows with the same status and
 * pair details, so expanding either one shows the match. Rows sort by their own record's date.
 */
export function reviewCases(state: ReconState): ReviewCase[] {
  const cases: ReviewCase[] = []
  const used = new Set<string>()
  const pair = (base: Omit<ReviewCase, 'key' | 'side' | 'record' | 'date'> & { bank: BankRecord; ledger: LedgerEntry }) => {
    used.add(base.bank.id)
    used.add(base.ledger.id)
    cases.push({ ...base, key: base.bank.id, side: 'bank', record: base.bank, date: base.bank.date })
    cases.push({ ...base, key: base.ledger.id, side: 'ledger', record: base.ledger, date: base.ledger.date })
  }

  for (const match of state.matches) {
    const bank = bankRecord(match.bankId)!
    const ledger = ledgerRecord(state, match.ledgerId)!
    pair({ status: 'confirmed', bank, ledger, match, recordIds: [bank.id, ...(ledger.generatedFrom ? [] : [ledger.id])] })
  }
  for (const suggestion of activeSuggestions(state)) {
    const bank = bankRecord(suggestion.bankId)!
    const ledger = ledgerRecord(state, suggestion.ledgerId)!
    pair({ status: suggestion.kind === 'auto' ? 'auto-matched' : 'suggested', bank, ledger, suggestion, recordIds: [bank.id, ledger.id] })
  }
  for (const doc of state.outstanding) {
    const ledger = ledgerRecord(state, doc.ledgerId)!
    used.add(ledger.id)
    cases.push({ key: ledger.id, status: 'outstanding', side: 'ledger', record: ledger, ledger, outstanding: doc, recordIds: [ledger.id], date: ledger.date })
  }
  for (const bank of BANK_EXCEPTIONS) {
    if (used.has(bank.id)) continue
    cases.push({ key: bank.id, status: 'unmatched', side: 'bank', record: bank, bank, recordIds: [bank.id], date: bank.date })
  }
  for (const ledger of LEDGER_EXCEPTIONS) {
    if (used.has(ledger.id)) continue
    cases.push({ key: ledger.id, status: 'unmatched', side: 'ledger', record: ledger, ledger, recordIds: [ledger.id], date: ledger.date })
  }
  // Same date: the two rows of a pair sit together, bank row first.
  const group = (c: ReviewCase) => c.bank?.id ?? c.key
  return cases.sort((a, b) => a.date.localeCompare(b.date) || group(a).localeCompare(group(b)) || a.side.localeCompare(b.side))
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
  // Every November record is in the register once: the auto-matched pairs are no longer added separately.
  const netBankMovement = sum(BANK_EXCEPTIONS.map((r) => r.amount))
  const statementClosing = OPENING_BALANCE + netBankMovement
  const book = OPENING_BALANCE + sum(LEDGER_EXCEPTIONS.map((r) => r.amount)) + sum(state.generated.map((r) => r.amount))
  // Only confirmed matches clear. An auto-matched pair clears when Maya confirms it, so cleared starts at the
  // opening balance ($100,000.00) instead of the PRD's $109,870.00, and still ends at $109,650.00.
  const cleared = OPENING_BALANCE + sum(state.matches.map((m) => bankRecord(m.bankId)!.amount))
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
  if (counts.autoMatched > 0) {
    blockers.push(
      `${counts.autoMatched} of ${counts.all} records are auto-matched and still need your review. Confirm or dismiss each auto-matched pair.`,
    )
  }
  if (counts.suggested > 0) {
    blockers.push(
      `${counts.suggested} of ${counts.all} records have a suggested match that still needs your review. Confirm or dismiss each suggestion.`,
    )
  }
  if (counts.unmatched > 0) {
    blockers.push(
      `${counts.unmatched} of ${counts.all} records are still unmatched. Every record needs a match or documented outstanding evidence.`,
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
 * Every record on the other side that is still unexplained (not matched, not documented as outstanding), whatever
 * its amount, with the eligible ones (same signed amount, currency and account) first. At Yirang's request
 * (2026-10-04) search lists them all; Confirm match still enforces the match rules and explains a refusal.
 */
export function searchPool(state: ReconState, recordId: string): FinancialRecord[] {
  const origin = findRecord(state, recordId)
  if (!origin) return []
  const others: FinancialRecord[] = origin.kind === 'bank' ? LEDGER_EXCEPTIONS : BANK_EXCEPTIONS
  const open = others.filter((r) => !isExplained(state, r.id) && r.currency === origin.currency && r.accountId === origin.accountId)
  const eligible = new Set(eligibleCandidates(state, recordId).map((r) => r.id))
  return [...open.filter((r) => eligible.has(r.id)), ...open.filter((r) => !eligible.has(r.id))]
}

/**
 * Case-insensitive search over the unexplained records on the other side: description, counterparty, reference,
 * entry id, date and amount ("12,500", "12500", "$12,500.00", "-450"). An empty query lists them all; optional
 * filters narrow the list.
 */
export function searchCandidates(state: ReconState, recordId: string, search: SearchDraft): FinancialRecord[] {
  const origin = findRecord(state, recordId)
  if (!origin) return []
  const terms = search.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return searchPool(state, recordId).filter((candidate) => {
    const haystack = [
      candidate.description,
      recordCounterparty(candidate),
      candidate.reference ?? '',
      candidate.id,
      candidate.kind === 'ledger' ? candidate.entryId : '',
      dateTokens(candidate.date),
      amountTokens(candidate.amount),
    ]
      .join(' ')
      .toLowerCase()
    if (!terms.every((term) => haystack.includes(term))) return false
    if (search.dateFilter && Math.abs(daysBetween(origin.date, candidate.date)) > DATE_WINDOW[search.dateFilter]) return false
    if (search.counterpartyFilter && recordCounterparty(candidate) !== search.counterpartyFilter) return false
    return true
  })
}

/** Ways an amount can be typed: "12,500", "12500", "12,500.00", "$12,500.00", "+12,500.00", "-450", "−$450.00". */
export function amountTokens(cents: number): string {
  const abs = Math.abs(cents)
  const plain = (abs / 100).toFixed(2)
  const grouped = money(abs, { sign: 'never' }).slice(1)
  const sign = cents < 0 ? '-' : '+'
  const forms = [plain, grouped, `$${plain}`, `$${grouped}`, `${sign}${plain}`, `${sign}${grouped}`, `${sign}$${plain}`, `${sign}$${grouped}`, money(cents, { sign: 'always' })]
  return forms.join(' ')
}

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

/**
 * Ways a date can be typed into the single search field: "Nov 17", "November 17", "Nov 17, 2025", "11/17",
 * "11/17/2025" and "2025-11-17". Each word of the query must appear, so "Nov 17" matches only the 17th.
 */
export function dateTokens(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const month = MONTH_NAMES[m - 1]
  return [`${month.slice(0, 3)} ${d}, ${y}`, `${month} ${d}`, `${m}/${d}`, `${m}/${d}/${y}`, `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`, iso].join(' ')
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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * The line above the register (Yirang, 2026-10-05): "Showing 16 rows · 12 bank transactions · 12 ledger entries".
 * All three counts come from the rows on screen after the tab and the search, created entries included.
 */
export function registerSummary(rows: ReviewCase[]): string {
  const bank = rows.filter((c) => c.side === 'bank').length
  const ledger = rows.length - bank
  return `Showing ${plural(rows.length, 'row', 'rows')} · ${plural(bank, 'bank transaction', 'bank transactions')} · ${plural(ledger, 'ledger entry', 'ledger entries')}`
}
