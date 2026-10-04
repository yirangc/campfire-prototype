import type { Cents, IsoDate } from './types'

const MINUS = '−'
const grouped = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** $1,234.56. Negative values use a true minus sign, as in Figma (−$120.00). */
export function money(cents: Cents, opts: { sign?: 'auto' | 'always' | 'never' } = {}): string {
  const sign = opts.sign ?? 'auto'
  const abs = `$${grouped.format(Math.abs(cents) / 100)}`
  if (sign === 'never' || cents === 0) return abs
  if (cents < 0) return `${MINUS}${abs}`
  return sign === 'always' ? `+${abs}` : abs
}

/** Signed amount for tables and cards: +$3,200.00 / −$450.00. */
export const signed = (cents: Cents) => money(cents, { sign: 'always' })

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const parts = (iso: IsoDate) => {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

/** Nov 04 */
export function shortDate(iso: IsoDate): string {
  const { m, d } = parts(iso)
  return `${MONTHS[m - 1]} ${String(d).padStart(2, '0')}`
}

/** Nov 4, 2025 */
export function longDate(iso: IsoDate): string {
  const { y, m, d } = parts(iso)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

/** Whole days between two ISO dates (b − a). */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

const isValidYmd = (y: number, m: number, d: number) => {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false
  if (m < 1 || m > 12 || d < 1) return false
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate()
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/**
 * Accepts "Nov 30, 2025", "November 30 2025", "2025-11-30" and "11/30/2025".
 * Returns null when the text is not a real calendar date.
 */
export function parseDate(input: string): IsoDate | null {
  const text = input.trim()
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  if (match) {
    const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
    return isValidYmd(y, m, d) ? iso(y, m, d) : null
  }
  match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text)
  if (match) {
    const [m, d, y] = [Number(match[1]), Number(match[2]), Number(match[3])]
    return isValidYmd(y, m, d) ? iso(y, m, d) : null
  }
  match = /^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(text)
  if (match) {
    const m = MONTHS.findIndex((name) => match![1].toLowerCase().startsWith(name.toLowerCase())) + 1
    const [d, y] = [Number(match[2]), Number(match[3])]
    return m > 0 && isValidYmd(y, m, d) ? iso(y, m, d) : null
  }
  return null
}

/** 8:42 AM, Oct 4 */
export function timestamp(isoDateTime: string): string {
  const date = new Date(isoDateTime)
  if (Number.isNaN(date.getTime())) return isoDateTime
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
