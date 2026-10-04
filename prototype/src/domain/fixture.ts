/*
 * Canonical November 2025 dataset from the PRD (section 5). All names, references and evidence are fictional.
 * Journal numbers (GL-…) and statement descriptions not given in the PRD are sample values. The GL-1101 and GL-1105
 * memos are closer to the bank text than the PRD's ("Northstar hosting", "Delta receipt"), at Yirang's request.
 */
import type { Account, BankRecord, EvidenceItem, LedgerEntry, Suggestion } from './types'

export const ACCOUNT: Account = { id: 'chase-4821', name: 'Chase Operating ••4821', currency: 'USD' }

export const PERIOD = { start: '2025-11-01', end: '2025-11-30', label: 'Nov 01, 2025 – Nov 30, 2025' }
export const STATEMENT_IMPORTED = '2025-11-30'

/** Opening bank and book balances, with no prior outstanding items. */
export const OPENING_BALANCE = 10_000_000

export const USER = { name: 'Maya', role: 'Staff accountant', company: 'Campfire Software' }

const bank = (id: string, date: string, description: string, amount: number, reference?: string): BankRecord => ({
  kind: 'bank',
  id,
  date,
  description,
  amount,
  currency: 'USD',
  accountId: ACCOUNT.id,
  reference,
})

const ledger = (
  id: string,
  entryId: string,
  date: string,
  description: string,
  counterparty: string,
  amount: number,
  reference?: string,
): LedgerEntry => ({
  kind: 'ledger',
  id,
  entryId,
  date,
  description,
  counterparty,
  amount,
  currency: 'USD',
  accountId: ACCOUNT.id,
  reference,
})

/**
 * Bank exceptions: the PRD's seven (B01–B07) plus the five auto-matched bank records (B08–B12). The PRD treated
 * those five pairs as already reviewed; Yirang moved them into the register as Auto-matched items that still need
 * review (2026-10-04), so they now count toward progress and completion.
 */
export const BANK_EXCEPTIONS: BankRecord[] = [
  bank('B01', '2025-11-04', 'ACH NORTH', -240_000, 'NS-1103'),
  bank('B02', '2025-11-12', 'DELTA PAY', 320_000, 'DEL-1111'),
  bank('B03', '2025-11-18', 'ALDER SUPPLY', -45_000, 'ALD-17'),
  bank('B04', '2025-11-20', 'BIRCH STUDIO', -45_000, 'BIR-19'),
  bank('B05', '2025-11-30', 'Monthly bank service fee', -1_500),
  bank('B06', '2025-11-25', 'Outgoing wire fee', -2_500),
  bank('B07', '2025-11-27', 'Account service charge', -8_000),
  bank('B08', '2025-11-03', 'Stripe payout', 1_250_000),
  bank('B09', '2025-11-08', 'Acme payment', 840_000),
  bank('B10', '2025-11-10', 'AWS', -125_000),
  bank('B11', '2025-11-15', 'Gusto payroll', -960_000),
  bank('B12', '2025-11-22', 'Figma subscription', -18_000),
]

/** Ledger exceptions: the PRD's seven (L01–L07) plus the five auto-matched ledger entries (L08–L12). */
export const LEDGER_EXCEPTIONS: LedgerEntry[] = [
  ledger('L01', 'GL-1101', '2025-11-03', 'ACH Northstar Hosting', 'Northstar Hosting', -240_000, 'NS-1103'),
  ledger('L02', 'GL-1105', '2025-11-11', 'DELTA PAY receipt', 'Delta Corp', 320_000, 'DEL-1111'),
  ledger('L03', 'GL-1108', '2025-11-19', 'Birch Studio design invoice', 'Birch Studio', -45_000, 'BIR-19'),
  ledger('L04', 'GL-1107', '2025-11-17', 'Alder Supply office supplies', 'Alder Supply', -45_000, 'ALD-17'),
  ledger('L05', 'GL-1112', '2025-11-28', 'Check 1042 · Riverside Janitorial', 'Riverside Janitorial', -60_000, 'CHK-1042'),
  ledger('L06', 'GL-1113', '2025-11-30', 'Deposit DEP-1130 · Orbit Labs payment', 'Orbit Labs', 100_000, 'DEP-1130'),
  ledger('L07', 'GL-1114', '2025-11-30', 'Transfer TR-1130 to Chase Savings ••7710', 'Chase Savings ••7710', -20_000, 'TR-1130'),
  ledger('L08', 'GL-1100', '2025-11-03', 'Stripe payout', 'Stripe', 1_250_000),
  ledger('L09', 'GL-1103', '2025-11-08', 'Acme payment', 'Acme Inc.', 840_000),
  ledger('L10', 'GL-1104', '2025-11-10', 'AWS', 'Amazon Web Services', -125_000),
  ledger('L11', 'GL-1106', '2025-11-15', 'Gusto payroll', 'Gusto', -960_000),
  ledger('L12', 'GL-1109', '2025-11-22', 'Figma subscription', 'Figma', -18_000),
]

/** Simulated AI suggestions. B03–L03 is deliberately wrong: the correct pairs are B03–L04 and B04–L03. */
export const SUGGESTIONS: Suggestion[] = [
  {
    id: 'S1',
    kind: 'suggested',
    bankId: 'B01',
    ledgerId: 'L01',
    headline: 'Suggested match: 3 signals found',
    detail: 'Same amount and shared reference NS-1103, posted 1 day apart. The bank shortened the payee to “ACH NORTH”.',
    signals: [
      { label: 'Same amount', tone: 'match' },
      { label: 'Shared reference NS-1103', tone: 'match' },
      { label: 'Dates 1 day apart', tone: 'match' },
      { label: 'Description differs: “ACH NORTH” vs “ACH Northstar Hosting”', tone: 'differs' },
    ],
  },
  {
    id: 'S2',
    kind: 'suggested',
    bankId: 'B02',
    ledgerId: 'L02',
    headline: 'Suggested match: 3 signals found',
    detail: 'Same amount and shared reference DEL-1111, posted 1 day apart. The ledger memo only adds “receipt”.',
    signals: [
      { label: 'Same amount', tone: 'match' },
      { label: 'Shared reference DEL-1111', tone: 'match' },
      { label: 'Dates 1 day apart', tone: 'match' },
      { label: 'Description differs: “DELTA PAY” vs “DELTA PAY receipt”', tone: 'differs' },
    ],
  },
  {
    id: 'S3',
    kind: 'suggested',
    bankId: 'B03',
    ledgerId: 'L03',
    headline: 'Suggested match: 2 signals found',
    detail: 'Same amount and close dates, but the reference and counterparty differ. Review the evidence before confirming.',
    signals: [
      { label: 'Same amount', tone: 'match' },
      { label: 'Dates 1 day apart', tone: 'match' },
      { label: 'Reference differs: ALD-17 vs BIR-19', tone: 'differs' },
      { label: 'Counterparty differs: Alder vs Birch', tone: 'differs' },
    ],
  },
]

/** The five pairs the bank feed matched automatically (formerly "Already matched"). Each still needs Maya's review. */
export const AUTO_MATCHES: Suggestion[] = (
  [
    ['A1', 'B08', 'L08'],
    ['A2', 'B09', 'L09'],
    ['A3', 'B10', 'L10'],
    ['A4', 'B11', 'L11'],
    ['A5', 'B12', 'L12'],
  ] as const
).map(([id, bankId, ledgerId]) => ({
  id,
  kind: 'auto',
  bankId,
  ledgerId,
  headline: 'Automatically matched · Awaiting your review',
  detail: 'The amount, date, and description match. Review the details below, then confirm.',
  signals: [],
}))

/** Every proposed pairing Maya reviews: simulated AI suggestions and automatic matches. */
export const PROPOSALS: Suggestion[] = [...SUGGESTIONS, ...AUTO_MATCHES]

/** Corresponding December activity outside the November statement, plus one unrelated item. */
export const DECEMBER_ACTIVITY: EvidenceItem[] = [
  { id: 'D01', date: '2025-12-01', description: 'DEPOSIT DEP-1130', amount: 100_000, reference: 'DEP-1130', accountId: ACCOUNT.id },
  { id: 'D02', date: '2025-12-02', description: 'CHECK 1042 PAID', amount: -60_000, reference: 'CHK-1042', accountId: ACCOUNT.id },
  { id: 'D03', date: '2025-12-03', description: 'ONLINE TRANSFER TR-1130', amount: -20_000, reference: 'TR-1130', accountId: ACCOUNT.id },
  { id: 'D04', date: '2025-12-04', description: 'CHECK 1047 PAID', amount: -35_000, reference: 'CHK-1047', accountId: ACCOUNT.id },
]

export const EXPENSE_CATEGORIES = [
  { value: 'Bank Fees', label: 'Bank Fees' },
  { value: 'Software Subscriptions', label: 'Software Subscriptions' },
  { value: 'Office Supplies', label: 'Office Supplies' },
  { value: 'Professional Services', label: 'Professional Services' },
]

export const TIMING_CATEGORIES = [
  { value: 'outstanding-check', label: 'Outstanding check' },
  { value: 'deposit-in-transit', label: 'Deposit in transit' },
  { value: 'outstanding-withdrawal', label: 'Outstanding transfer or withdrawal' },
] as const

export const FIRST_GENERATED_ENTRY = 1115

export const ORIGINAL_EXCEPTION_IDS = [...BANK_EXCEPTIONS, ...LEDGER_EXCEPTIONS].map((r) => r.id)
