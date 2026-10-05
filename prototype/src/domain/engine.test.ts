import { describe, expect, it } from 'vitest'
import { initialState, reduce, type Action } from './engine'
import { checkState, load, save, STORAGE_KEY } from './persistence'
import {
  activeSuggestions,
  balances,
  completionBlockers,
  eligibleCandidates,
  keywordSuggestions,
  recordStatus,
  registerSummary,
  reviewCases,
  searchCandidates,
  statusCounts,
} from './selectors'
import type { ReconState } from './types'

const AT = '2026-10-04T09:00:00.000Z'

function run(state: ReconState, ...actions: Action[]): ReconState {
  return actions.reduce((s, action) => {
    const result = reduce(s, action, AT)
    if (!result.ok) throw new Error(`${action.type} rejected: ${result.reason} ${JSON.stringify(result.fieldErrors ?? {})}`)
    return result.state
  }, state)
}

const expense = (bankId: string, date: string, description: string): Action => ({
  type: 'create-expense',
  bankId,
  category: 'Bank Fees',
  date,
  description,
  acknowledgedSeparate: false,
})

const AUTO_CONFIRMS: Action[] = (['08', '09', '10', '11', '12'] as const).map((n) => ({
  type: 'confirm-match',
  bankId: `B${n}`,
  ledgerId: `L${n}`,
  source: 'suggestion',
}))

const FINISH: Action[] = [
  { type: 'confirm-match', bankId: 'B01', ledgerId: 'L01', source: 'suggestion' },
  { type: 'confirm-match', bankId: 'B02', ledgerId: 'L02', source: 'suggestion' },
  { type: 'dismiss-suggestion', suggestionId: 'S3' },
  { type: 'confirm-match', bankId: 'B03', ledgerId: 'L04', source: 'search' },
  { type: 'confirm-match', bankId: 'B04', ledgerId: 'L03', source: 'search' },
  expense('B05', 'Nov 30, 2025', 'Monthly bank service fee'),
  expense('B06', 'Nov 25, 2025', 'Outgoing wire fee'),
  expense('B07', 'Nov 27, 2025', 'Account service charge'),
  { type: 'document-outstanding', ledgerId: 'L05', category: 'outstanding-check', explanation: 'Check cleared Dec 2', evidenceId: 'D02' },
  { type: 'document-outstanding', ledgerId: 'L06', category: 'deposit-in-transit', explanation: 'Deposited Nov 30, credited Dec 1', evidenceId: 'D01' },
  { type: 'document-outstanding', ledgerId: 'L07', category: 'outstanding-withdrawal', explanation: 'Transfer posted Dec 3', evidenceId: 'D03' },
  ...AUTO_CONFIRMS,
]

describe('initial fixture', () => {
  const state = initialState()

  it('counts 24 records in 24 rows, one per record, with pairs sharing a status', () => {
    expect(statusCounts(state)).toMatchObject({ all: 24, autoMatched: 10, suggested: 6, unmatched: 8, confirmed: 0, outstanding: 0, unresolved: 24, explained: 0 })
    const cases = reviewCases(state)
    expect(cases).toHaveLength(24)
    expect(cases.filter((c) => c.status === 'auto-matched')).toHaveLength(10)
    expect(cases.filter((c) => c.recordIds.length === 2)).toHaveLength(16)
    expect(cases.filter((c) => c.side === 'bank')).toHaveLength(12)
    const ids = cases.map((c) => c.record.id)
    expect(new Set(ids).size).toBe(24)
    // Both rows of a pair show the same status and pair.
    const stripe = cases.filter((c) => c.suggestion?.id === 'A1')
    expect(stripe.map((c) => [c.side, c.status, c.record.amount])).toEqual([
      ['bank', 'auto-matched', 1_250_000],
      ['ledger', 'auto-matched', 1_250_000],
    ])
  })

  it('derives the initial balances from the PRD', () => {
    expect(balances(state)).toMatchObject({
      statementClosing: 10_965_000,
      book: 10_997_000,
      // Unconfirmed auto-matched pairs do not clear, so cleared starts at the opening balance (PRD: $109,870.00).
      cleared: 10_000_000,
      difference: 32_000,
      outstandingNet: 0,
    })
  })

  it('offers the three initial suggestions, including the wrong Alder/Birch pair', () => {
    expect(activeSuggestions(state).filter((s) => s.kind === 'suggested').map((s) => `${s.bankId}-${s.ledgerId}`)).toEqual(['B01-L01', 'B02-L02', 'B03-L03'])
    expect(activeSuggestions(state).filter((s) => s.kind === 'auto').map((s) => `${s.bankId}-${s.ledgerId}`)).toEqual(['B08-L08', 'B09-L09', 'B10-L10', 'B11-L11', 'B12-L12'])
  })
})

describe('finishing the fixture', () => {
  const finished = run(initialState(), ...FINISH)

  it('ends at 21 confirmed, 3 outstanding, 0 unresolved and a zero difference', () => {
    expect(statusCounts(finished)).toMatchObject({ confirmed: 21, outstanding: 3, autoMatched: 0, unresolved: 0, explained: 24 })
    expect(balances(finished)).toMatchObject({
      statementClosing: 10_965_000,
      book: 10_985_000,
      cleared: 10_965_000,
      outstandingDeposits: 100_000,
      outstandingWithdrawals: -80_000,
      outstandingNet: 20_000,
      difference: 0,
    })
    expect(completionBlockers(finished)).toEqual([])
  })

  it('creates balanced generated entries linked to their bank records, outside the original counts', () => {
    expect(finished.generated).toHaveLength(3)
    for (const entry of finished.generated) {
      const debit = entry.lines!.reduce((t, l) => t + l.debit, 0)
      const credit = entry.lines!.reduce((t, l) => t + l.credit, 0)
      expect(debit).toBe(credit)
      expect(entry.generatedFrom).toMatch(/^B0[567]$/)
    }
    expect(statusCounts(finished).all).toBe(24)
  })

  it('completes, locks accounting actions, and reopens with resolutions and history preserved', () => {
    const completed = run(finished, { type: 'complete' })
    expect(completed.completion.status).toBe('completed')
    expect(reduce(completed, { type: 'undo' }, AT)).toMatchObject({ ok: false, reason: expect.stringContaining('Reopen') })
    expect(reduce(completed, { type: 'leave-unresolved', recordId: 'B01', note: '' }, AT).ok).toBe(false)
    const reopened = run(completed, { type: 'reopen' })
    expect(reopened.completion.status).toBe('in_progress')
    expect(reopened.outstanding).toHaveLength(3)
    expect(reopened.history.map((h) => h.type).slice(-2)).toEqual(['complete', 'reopen'])
    expect(statusCounts(reopened).explained).toBe(24)
  })
})

describe('balances only move for the right actions', () => {
  it('search, dismissal, deferral and drafts change no balance or explained count', () => {
    const start = initialState()
    const before = { ...balances(start), explained: statusCounts(start).explained }
    let s = run(start, { type: 'dismiss-suggestion', suggestionId: 'S3' }, { type: 'leave-unresolved', recordId: 'B04', note: 'Waiting on Birch invoice' })
    s = run(s, { type: 'set-draft', key: 'B04', draft: { mode: 'search', search: { query: 'birch', dateFilter: null, counterpartyFilter: null }, selectedId: 'L03', expense: null, outstanding: null, note: '', dismissedSuggestionId: null } })
    searchCandidates(s, 'B04', { query: 'birch', dateFilter: null, counterpartyFilter: null })
    expect({ ...balances(s), explained: statusCounts(s).explained }).toEqual(before)
    expect(s.notes.B04.text).toBe('Waiting on Birch invoice')
  })

  it('matches change cleared balance but not book balance', () => {
    const s = run(initialState(), FINISH[0])
    expect(balances(s).book).toBe(balances(initialState()).book)
    expect(balances(s).cleared).toBe(balances(initialState()).cleared - 240_000)
  })

  it('outstanding documentation changes the adjustment, not book balance', () => {
    const s = run(initialState(), FINISH[8])
    expect(balances(s).book).toBe(balances(initialState()).book)
    expect(balances(s).outstandingNet).toBe(-60_000)
  })
})

describe('match rules', () => {
  it('a record cannot belong to two matches', () => {
    const s = run(initialState(), { type: 'confirm-match', bankId: 'B04', ledgerId: 'L03', source: 'search' })
    const again = reduce(s, { type: 'confirm-match', bankId: 'B03', ledgerId: 'L03', source: 'suggestion' }, AT)
    expect(again).toMatchObject({ ok: false, reason: expect.stringContaining('already matched') })
    expect(recordStatus(s, 'B03')).toBe('unmatched')
  })

  it('blocks different amounts', () => {
    expect(reduce(initialState(), { type: 'confirm-match', bankId: 'B01', ledgerId: 'L02', source: 'search' }, AT)).toMatchObject({
      ok: false,
      reason: expect.stringContaining('amounts differ'),
    })
  })

  it('search only offers unmatched entries with the same signed amount', () => {
    expect(eligibleCandidates(initialState(), 'B04').map((r) => r.id)).toEqual(['L03', 'L04'])
    const s = run(initialState(), { type: 'confirm-match', bankId: 'B04', ledgerId: 'L03', source: 'search' })
    expect(eligibleCandidates(s, 'B03').map((r) => r.id)).toEqual(['L04'])
    expect(eligibleCandidates(initialState(), 'B05')).toEqual([])
  })

  it('searches descriptions, counterparties, references and entry ids case-insensitively', () => {
    const s = initialState()
    const q = (query: string) => searchCandidates(s, 'B04', { query, dateFilter: null, counterpartyFilter: null }).map((r) => r.id)
    // Every unexplained ledger entry, the same-amount ones first; Confirm match still enforces the amount rule.
    expect(q('')).toEqual(['L03', 'L04', 'L01', 'L02', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12'])
    expect(q('12,500')).toEqual(['L08'])
    expect(q('12500')).toEqual(['L08'])
    expect(q('$12,500.00')).toEqual(['L08'])
    expect(q('-450')).toEqual(['L03', 'L04'])
    expect(q('BIRCH')).toEqual(['L03'])
    expect(q('ald-17')).toEqual(['L04'])
    expect(q('gl-1108')).toEqual(['L03'])
    expect(q('nothing')).toEqual([])
    expect(searchCandidates(s, 'B04', { query: '', dateFilter: 'same-day', counterpartyFilter: null })).toEqual([])
    expect(searchCandidates(s, 'B04', { query: '-450', dateFilter: 'within-3', counterpartyFilter: null }).map((r) => r.id)).toEqual(['L03', 'L04'])
    expect(searchCandidates(s, 'B04', { query: '', dateFilter: null, counterpartyFilter: 'Alder Supply' }).map((r) => r.id)).toEqual(['L04'])
    expect(keywordSuggestions(s, 'B04')).toEqual(['Birch', 'Studio', 'BIR-19'])
  })

  it('confirming a different pair retires the stale suggestion and leaves its partner unmatched', () => {
    const s = run(initialState(), { type: 'confirm-match', bankId: 'B04', ledgerId: 'L03', source: 'search' })
    expect(activeSuggestions(s).map((x) => x.id)).toEqual(['S1', 'S2', 'A1', 'A2', 'A3', 'A4', 'A5'])
    expect(recordStatus(s, 'B03')).toBe('unmatched')
    expect(statusCounts(s)).toMatchObject({ suggested: 4, unmatched: 8, confirmed: 2 })
  })
})

describe('dismissal and its undo', () => {
  it('dismissing makes both records unmatched and restores only when both remain eligible', () => {
    let s = run(initialState(), { type: 'dismiss-suggestion', suggestionId: 'S3' })
    expect(recordStatus(s, 'B03')).toBe('unmatched')
    expect(recordStatus(s, 'L03')).toBe('unmatched')
    expect(reviewCases(s)).toHaveLength(24)
    const restored = run(s, { type: 'restore-suggestion', suggestionId: 'S3' })
    expect(recordStatus(restored, 'B03')).toBe('suggested')
    s = run(s, { type: 'confirm-match', bankId: 'B04', ledgerId: 'L03', source: 'search' })
    expect(reduce(s, { type: 'restore-suggestion', suggestionId: 'S3' }, AT)).toMatchObject({
      ok: false,
      reason: expect.stringContaining('GL-1108'),
    })
  })
})

describe('auto-matched pairs', () => {
  it('confirming moves both records to Confirmed, clears the bank amount and undoes like any match', () => {
    const start = initialState()
    const s = run(start, AUTO_CONFIRMS[0])
    expect(recordStatus(s, 'B08')).toBe('confirmed')
    expect(recordStatus(s, 'L08')).toBe('confirmed')
    expect(statusCounts(s)).toMatchObject({ autoMatched: 8, confirmed: 2, explained: 2 })
    expect(balances(s).cleared).toBe(balances(start).cleared + 1_250_000)
    expect(balances(s).book).toBe(balances(start).book)
    const undone = run(s, { type: 'undo' })
    expect(recordStatus(undone, 'B08')).toBe('auto-matched')
    expect(statusCounts(undone)).toEqual(statusCounts(start))
    expect(balances(undone)).toEqual(balances(start))
  })

  it('dismissing returns both records to Unmatched, searchable, and restorable', () => {
    const start = initialState()
    const s = run(start, { type: 'dismiss-suggestion', suggestionId: 'A3' })
    expect(recordStatus(s, 'B10')).toBe('unmatched')
    expect(recordStatus(s, 'L10')).toBe('unmatched')
    expect(statusCounts(s)).toMatchObject({ autoMatched: 8, unmatched: 10, all: 24 })
    expect(balances(s)).toEqual(balances(start))
    expect(eligibleCandidates(s, 'B10').map((r) => r.id)).toEqual(['L10'])
    expect(s.history.at(-1)?.summary).toContain('auto-match')
    const restored = run(s, { type: 'restore-suggestion', suggestionId: 'A3' })
    expect(recordStatus(restored, 'B10')).toBe('auto-matched')
    const searched = run(s, { type: 'confirm-match', bankId: 'B10', ledgerId: 'L10', source: 'search' })
    expect(recordStatus(searched, 'L10')).toBe('confirmed')
  })

  it('blocks completion until every auto-matched pair is reviewed', () => {
    const almost = run(initialState(), ...FINISH.slice(0, -1))
    expect(balances(almost).difference).toBe(0)
    expect(completionBlockers(almost)).toEqual([expect.stringContaining('2 of 24 records are auto-matched')])
    expect(reduce(almost, { type: 'complete' }, AT).ok).toBe(false)
    expect(reduce(run(almost, FINISH.at(-1)!), { type: 'complete' }, AT).ok).toBe(true)
  })
})

describe('expense creation', () => {
  it('identifies invalid fields without posting', () => {
    const result = reduce(initialState(), { type: 'create-expense', bankId: 'B05', category: null, date: 'Dec 1, 2025', description: '  ', acknowledgedSeparate: false }, AT)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual(['category', 'date', 'description'])
    expect(result.state.generated).toHaveLength(0)
    expect(reduce(initialState(), { ...expense('B05', 'Feb 30, 2025', 'x') }, AT)).toMatchObject({ ok: false, fieldErrors: { date: expect.stringContaining('real date') } })
  })

  it('cannot create a duplicate for the same bank record', () => {
    const s = run(initialState(), expense('B05', 'Nov 30, 2025', 'Fee'))
    const again = reduce(s, expense('B05', 'Nov 30, 2025', 'Fee'), AT)
    expect(again).toMatchObject({ ok: false, reason: expect.stringContaining('already created') })
    expect(again.state.generated).toHaveLength(1)
  })

  it('requires acknowledgement when eligible existing entries remain', () => {
    const blocked = reduce(initialState(), { type: 'create-expense', bankId: 'B04', category: 'Office Supplies', date: 'Nov 20, 2025', description: 'Birch', acknowledgedSeparate: false }, AT)
    expect(blocked).toMatchObject({ ok: false, fieldErrors: { acknowledgedSeparate: expect.stringContaining('2 existing entries') } })
  })

  it('undo removes the generated entry and its match together, restoring balances and counts', () => {
    const before = initialState()
    const s = run(before, expense('B05', 'Nov 30, 2025', 'Fee'))
    expect(balances(s).book).toBe(balances(before).book - 1_500)
    const undone = run(s, { type: 'undo' })
    expect(undone.generated).toEqual([])
    expect(undone.matches).toEqual([])
    expect(balances(undone)).toEqual(balances(before))
    expect(statusCounts(undone)).toEqual(statusCounts(before))
    expect(undone.history.at(-1)?.type).toBe('undo')
  })
})

describe('outstanding items', () => {
  it('unsupported claims stay unresolved', () => {
    const wrongEvidence = reduce(initialState(), { type: 'document-outstanding', ledgerId: 'L05', category: 'outstanding-check', explanation: 'Mailed', evidenceId: 'D04' }, AT)
    expect(wrongEvidence).toMatchObject({ ok: false, fieldErrors: { evidenceId: expect.stringContaining("doesn't support") } })
    const noEvidence = reduce(initialState(), { type: 'document-outstanding', ledgerId: 'L03', category: 'outstanding-check', explanation: 'Probably timing', evidenceId: null }, AT)
    expect(noEvidence.ok).toBe(false)
    const wrongSign = reduce(initialState(), { type: 'document-outstanding', ledgerId: 'L06', category: 'outstanding-check', explanation: 'x', evidenceId: 'D01' }, AT)
    expect(wrongSign).toMatchObject({ ok: false, fieldErrors: { category: expect.any(String) } })
    expect(recordStatus(initialState(), 'L05')).toBe('unmatched')
  })
})

describe('undo order and completion blockers', () => {
  it('undoes accounting actions in reverse order', () => {
    const s = run(initialState(), FINISH[0], FINISH[1])
    const once = run(s, { type: 'undo' })
    expect(once.matches.map((m) => m.bankId)).toEqual(['B01'])
    expect(recordStatus(once, 'B02')).toBe('suggested')
    const twice = run(once, { type: 'undo' })
    expect(twice.matches).toEqual([])
    expect(reduce(twice, { type: 'undo' }, AT).ok).toBe(false)
  })

  it('undoes the action on a given record even when later actions exist', () => {
    const s = run(initialState(), FINISH[0], FINISH[1])
    const undone = run(s, { type: 'undo', recordId: 'B01' })
    expect(undone.matches.map((m) => m.bankId)).toEqual(['B02'])
    expect(undone.undoStack.map((u) => u.recordIds[0])).toEqual(['B02'])
    expect(reduce(undone, { type: 'undo', recordId: 'B01' }, AT).ok).toBe(false)
  })

  it('a zero difference with unresolved records is blocked', () => {
    // Expenses plus outstanding items bring the difference to zero while the Alder/Birch and suggested pairs remain open.
    const s = run(initialState(), ...FINISH.slice(5, 11))
    expect(balances(s).difference).toBe(0)
    // One blocker each for the unreviewed auto-matched pairs, the suggested pairs and the unmatched records.
    expect(completionBlockers(s)).toHaveLength(3)
    expect(reduce(s, { type: 'complete' }, AT).ok).toBe(false)
  })

  it('all records explained with a nonzero difference is blocked', () => {
    // The canonical actions can't reach this state, so shift one generated entry by $1 to emulate a book error.
    const finished = run(initialState(), ...FINISH)
    const broken: ReconState = { ...finished, generated: finished.generated.map((g, i) => (i === 0 ? { ...g, amount: g.amount - 100 } : g)) }
    expect(statusCounts(broken).unresolved).toBe(0)
    expect(balances(broken).difference).not.toBe(0)
    expect(completionBlockers(broken)).toEqual([expect.stringContaining('remaining difference')])
    expect(reduce(broken, { type: 'complete' }, AT).ok).toBe(false)
  })
})

describe('persistence', () => {
  const memory = () => {
    const data = new Map<string, string>()
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
      data,
    }
  }

  it('round-trips state, so refresh preserves progress and cannot duplicate entries', () => {
    const storage = memory()
    const s = run(initialState(), expense('B05', 'Nov 30, 2025', 'Fee'))
    expect(save(s, AT, storage)).toEqual({ ok: true, at: AT })
    const loaded = load(storage)
    expect(loaded.kind).toBe('ok')
    if (loaded.kind !== 'ok') return
    expect(reduce(loaded.state, expense('B05', 'Nov 30, 2025', 'Fee'), AT).ok).toBe(false)
  })

  it('reopens a save completed before the auto-matched pairs needed review, keeping every decision', () => {
    const storage = memory()
    // A save from before this change: the PRD's 14 records resolved and the reconciliation completed.
    const old: ReconState = { ...run(initialState(), ...FINISH.slice(0, 11)), completion: { status: 'completed', completedAt: AT, completedBy: 'Maya' } }
    save(old, AT, storage)
    const loaded = load(storage)
    expect(loaded.kind).toBe('ok')
    if (loaded.kind !== 'ok') return
    expect(loaded.state.completion.status).toBe('in_progress')
    expect(loaded.state.matches).toEqual(old.matches)
    expect(loaded.state.outstanding).toEqual(old.outstanding)
    expect(loaded.state.history.at(-1)).toMatchObject({ type: 'reopen', summary: expect.stringContaining('auto-matched') })
    expect(statusCounts(loaded.state)).toMatchObject({ confirmed: 11, outstanding: 3, autoMatched: 10 })
  })

  it('reports save failures instead of claiming success', () => {
    const failing = { setItem: () => { throw new Error('QuotaExceededError') } }
    expect(save(initialState(), AT, failing)).toEqual({ ok: false, error: 'QuotaExceededError' })
  })

  it('flags unreadable data without discarding it', () => {
    const storage = memory()
    storage.setItem(STORAGE_KEY, '{not json')
    expect(load(storage)).toMatchObject({ kind: 'unreadable', raw: '{not json' })
    expect(storage.data.get(STORAGE_KEY)).toBe('{not json')
    expect(checkState({ ...initialState(), matches: [{ bankId: 'B01', ledgerId: 'L01' }, { bankId: 'B02', ledgerId: 'L01' }] })).toMatch(/two matches/)
  })
})

describe('registerSummary', () => {
  const rows = reviewCases(initialState())
  const stripe = rows.filter((c) => c.bank?.description === 'Stripe payout')
  const unmatchedLedger = rows.filter((c) => c.status === 'unmatched' && c.side === 'ledger')

  it('counts the rows it is given: pairs, single records and each side', () => {
    expect(registerSummary(stripe, 'auto-matched')).toBe('Showing 1 auto-matched pair · 1 bank transaction / 1 ledger entry')
    expect(registerSummary(stripe.slice(0, 1))).toBe('Showing 1 bank transaction')
    expect(registerSummary(unmatchedLedger.slice(0, 1), 'unmatched')).toBe('Showing 1 unmatched ledger entry')
    expect(registerSummary(unmatchedLedger, 'unmatched')).toBe(`Showing ${unmatchedLedger.length} unmatched ledger entries`)
    // One row of a pair (search matched only that record) is a single record.
    expect(registerSummary([...stripe, unmatchedLedger[0], rows.find((c) => c.status === 'suggested' && c.side === 'ledger')!])).toBe(
      'Showing 1 pair and 2 single records · 1 bank transaction / 3 ledger entries',
    )
    expect(registerSummary([], 'confirmed', ' acme ')).toBe('No confirmed records matching “acme”')
    expect(registerSummary([])).toBe('No records')
  })
})
