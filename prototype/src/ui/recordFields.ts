import type { ReactNode } from 'react'
import { daysBetween, longDate } from '../domain/format'
import type { FinancialRecord } from '../domain/types'

export interface Field {
  label: string
  value: ReactNode
  note?: ReactNode
}

/** "1 day before the bank date" — the date difference the PRD asks to surface. */
export function dateNote(record: FinancialRecord, other?: FinancialRecord): string | undefined {
  if (!other) return undefined
  const days = daysBetween(other.date, record.date)
  if (days === 0) return 'Same day as the bank transaction'
  const n = Math.abs(days)
  const otherSide = other.kind === 'bank' ? 'bank transaction' : 'ledger entry'
  return `${n} ${n === 1 ? 'day' : 'days'} ${days < 0 ? 'before' : 'after'} the ${otherSide}`
}

export function recordFields(record: FinancialRecord, other?: FinancialRecord, extra: Field[] = []): Field[] {
  const base: Field[] = [{ label: 'Date', value: longDate(record.date), note: dateNote(record, other) }]
  if (record.kind === 'bank') {
    base.push({ label: 'Description', value: record.description })
    base.push({ label: 'Type', value: record.amount < 0 ? 'Debit' : 'Credit' })
    if (record.reference) base.push({ label: 'Reference', value: record.reference })
  } else {
    base.push({ label: 'Description', value: record.description })
    base.push({ label: record.category ? 'Category' : 'Reference', value: record.category ?? record.reference ?? '—' })
  }
  return [...base, ...extra]
}
