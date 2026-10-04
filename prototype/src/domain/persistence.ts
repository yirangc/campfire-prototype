/*
 * Local persistence. Progress is saved to localStorage after every change and restored on refresh.
 * Unreadable data is never discarded silently: load() reports it and the UI offers an explicit reset.
 */
import { BANK_EXCEPTIONS, DECEMBER_ACTIVITY, LEDGER_EXCEPTIONS, SUGGESTIONS } from './fixture'
import type { ReconState } from './types'

export const STORAGE_KEY = 'campfire.reconciliation.chase-4821.2025-11.v1'

export type LoadResult =
  | { kind: 'empty' }
  | { kind: 'ok'; state: ReconState }
  | { kind: 'unreadable'; reason: string; raw: string }

export type SaveResult = { ok: true; at: string } | { ok: false; error: string }

const bankIds = new Set(BANK_EXCEPTIONS.map((r) => r.id))
const ledgerIds = new Set(LEDGER_EXCEPTIONS.map((r) => r.id))
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Structural check: enough to be sure every derived view can be computed without throwing. */
export function checkState(value: unknown): string | null {
  if (!isObject(value)) return 'The saved data is not an object.'
  if (value.version !== 1) return `Unsupported save version ${String(value.version)}.`
  for (const key of ['generated', 'matches', 'dismissed', 'outstanding', 'history', 'undoStack'] as const) {
    if (!Array.isArray(value[key])) return `"${key}" is missing or not a list.`
  }
  if (!isObject(value.notes) || !isObject(value.drafts)) return 'Notes or drafts are missing.'
  if (!isObject(value.completion) || !['in_progress', 'completed'].includes(value.completion.status as string))
    return 'The completion status is missing.'
  if (typeof value.nextEntryNumber !== 'number' || typeof value.seq !== 'number') return 'Counters are missing.'
  const generatedIds = new Set((value.generated as Array<Record<string, unknown>>).map((g) => g?.id))
  const seen = new Set<string>()
  for (const m of value.matches as Array<Record<string, unknown>>) {
    if (!isObject(m) || !bankIds.has(m.bankId as string)) return 'A match refers to an unknown bank record.'
    if (!ledgerIds.has(m.ledgerId as string) && !generatedIds.has(m.ledgerId)) return 'A match refers to an unknown ledger entry.'
    for (const id of [m.bankId, m.ledgerId] as string[]) {
      if (seen.has(id)) return `Record ${id} appears in two matches.`
      seen.add(id)
    }
  }
  for (const o of value.outstanding as Array<Record<string, unknown>>) {
    if (!isObject(o) || !ledgerIds.has(o.ledgerId as string)) return 'An outstanding item refers to an unknown ledger entry.'
    if (seen.has(o.ledgerId as string)) return `Record ${String(o.ledgerId)} is both matched and outstanding.`
    if (!DECEMBER_ACTIVITY.some((e) => e.id === o.evidenceId)) return 'An outstanding item refers to unknown evidence.'
  }
  for (const id of value.dismissed as unknown[]) {
    if (!SUGGESTIONS.some((s) => s.id === id)) return 'A dismissed suggestion is unknown.'
  }
  return null
}

export function load(storage: Pick<Storage, 'getItem'> = localStorage): LoadResult {
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch (error) {
    return { kind: 'unreadable', reason: `The browser refused access to saved data (${(error as Error).message}).`, raw: '' }
  }
  if (raw === null) return { kind: 'empty' }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { kind: 'unreadable', reason: 'The saved data is not valid JSON.', raw }
  }
  const problem = checkState(parsed)
  if (problem) return { kind: 'unreadable', reason: problem, raw }
  return { kind: 'ok', state: parsed as ReconState }
}

export function save(state: ReconState, at: string, storage: Pick<Storage, 'setItem'> = localStorage): SaveResult {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return { ok: true, at }
  } catch (error) {
    return { ok: false, error: (error as Error).message || 'Unknown storage error' }
  }
}

export function clear(storage: Pick<Storage, 'removeItem'> = localStorage) {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Reset continues with the fixture in memory; the next save reports any storage problem.
  }
}
