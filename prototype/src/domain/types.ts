/** Money is stored as integer cents. Positive amounts increase cash; negative amounts decrease it. */
export type Cents = number

/** ISO calendar date, YYYY-MM-DD. */
export type IsoDate = string

export interface Account {
  id: string
  name: string
  currency: string
}

export interface BankRecord {
  kind: 'bank'
  id: string
  date: IsoDate
  description: string
  amount: Cents
  currency: string
  accountId: string
  reference?: string
}

export interface JournalLine {
  account: string
  debit: Cents
  credit: Cents
}

export interface LedgerEntry {
  kind: 'ledger'
  /** Record id from the PRD fixture (L01) or the generated id (N-B05). */
  id: string
  /** Journal entry number shown to Maya (GL-1104). */
  entryId: string
  date: IsoDate
  description: string
  counterparty: string
  reference?: string
  amount: Cents
  currency: string
  accountId: string
  /** Set on entries created in the prototype: the bank record they were created from. */
  generatedFrom?: string
  category?: string
  lines?: JournalLine[]
}

export type FinancialRecord = BankRecord | LedgerEntry

export interface Signal {
  label: string
  /** "match": evidence for the pair. "differs": evidence against it, shown so Maya can judge. */
  tone: 'match' | 'differs'
}

export interface Suggestion {
  id: string
  /**
   * "suggested": a simulated AI suggestion. "auto": a pair the bank feed matched automatically, which still
   * needs Maya's review (Yirang, 2026-10-04). Both use the same review actions.
   */
  kind: 'suggested' | 'auto'
  bankId: string
  ledgerId: string
  headline: string
  detail: string
  signals: Signal[]
}

/** Fictional December bank activity outside the November statement, used as outstanding-item evidence. */
export interface EvidenceItem {
  id: string
  date: IsoDate
  description: string
  amount: Cents
  reference: string
  accountId: string
}

export type MatchSource = 'suggestion' | 'search' | 'created'

export interface Match {
  id: string
  bankId: string
  ledgerId: string
  source: MatchSource
  suggestionId?: string
  at: string
}

export type TimingCategory = 'outstanding-check' | 'deposit-in-transit' | 'outstanding-withdrawal'

export interface OutstandingDoc {
  ledgerId: string
  category: TimingCategory
  explanation: string
  evidenceId: string
  at: string
}

export interface Note {
  text: string
  at: string
}

export type HistoryType =
  | 'confirm-match'
  | 'dismiss-suggestion'
  | 'restore-suggestion'
  | 'create-expense'
  | 'document-outstanding'
  | 'leave-unresolved'
  | 'undo'
  | 'complete'
  | 'reopen'

export interface HistoryEntry {
  id: string
  at: string
  type: HistoryType
  recordIds: string[]
  summary: string
}

export type UndoOp =
  | { type: 'match'; matchId: string }
  | { type: 'create'; matchId: string; ledgerId: string }
  | { type: 'outstanding'; ledgerId: string }

export interface UndoEntry {
  historyId: string
  label: string
  recordIds: string[]
  op: UndoOp
}

export interface ExpenseDraft {
  category: string | null
  date: string
  description: string
  acknowledgedSeparate: boolean
}

export interface OutstandingDraft {
  category: TimingCategory | null
  explanation: string
  evidenceId: string | null
}

export interface SearchDraft {
  query: string
  dateFilter: DateFilter | null
  counterpartyFilter: string | null
}

export type DateFilter = 'same-day' | 'within-3' | 'within-7'

/** What the right-hand card of an expanded case shows. */
export type CardMode = 'default' | 'search' | 'selected' | 'create' | 'outstanding'

export interface CaseDraft {
  mode: CardMode
  /** The mode to return to when a create or outstanding form is cancelled. */
  previousMode?: CardMode
  search: SearchDraft
  selectedId: string | null
  expense: ExpenseDraft | null
  outstanding: OutstandingDraft | null
  note: string
  /** The suggestion dismissed from this case, while its compact notice is showing. */
  dismissedSuggestionId: string | null
}

export interface Completion {
  status: 'in_progress' | 'completed'
  completedAt?: string
  completedBy?: string
}

export interface ReconState {
  version: 1
  generated: LedgerEntry[]
  matches: Match[]
  dismissed: string[]
  outstanding: OutstandingDoc[]
  notes: Record<string, Note>
  drafts: Record<string, CaseDraft>
  history: HistoryEntry[]
  undoStack: UndoEntry[]
  completion: Completion
  /** Next journal number for generated entries. */
  nextEntryNumber: number
  /** Monotonic counter for history and match ids. */
  seq: number
}
