/*
 * Sample data for the showcase only. Nothing here is product data or business logic.
 * "Transcribed" sets copy the visible text and numbers from the Figma references without recalculation.
 * "Sample" sets are invented to demonstrate a state Figma does not show, and are labelled as such in the UI.
 */
import type { AllocationLine, FinancialRow, NavGroup, SelectOption } from '../components'

/** Transcribed: Campfire/Navigation/Side panel/Dashboard */
export const DASHBOARD_NAV: NavGroup[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  {
    id: 'financial-statements',
    label: 'Financial Statements',
    icon: 'chart',
    children: [
      { id: 'fs-income', label: 'Income Statement' },
      { id: 'fs-balance', label: 'Balance Sheet' },
    ],
  },
  {
    id: 'revenue',
    label: 'Revenue',
    icon: 'revenue',
    children: [
      { id: 'rev-dashboard', label: 'Dashboard' },
      { id: 'rev-contracts', label: 'Contracts' },
      { id: 'rev-customers', label: 'Customers' },
      { id: 'rev-transactions', label: 'Transactions' },
    ],
  },
  { id: 'accounting', label: 'Accounting', icon: 'accounting', children: [{ id: 'acc-coa', label: 'Chart of Accounts' }] },
  { id: 'cash', label: 'Cash Management', icon: 'wallet', children: [{ id: 'cash-overview', label: 'Overview' }] },
  { id: 'ember', label: 'Ember AI', icon: 'ember' },
]
/* Note: the children of Financial Statements, Accounting and Cash Management are collapsed in Figma.
 * The child labels above (Income Statement, Balance Sheet, Chart of Accounts, Overview) are sample labels
 * so the groups can expand; Income Statement, Balance Sheet and Chart of Accounts appear elsewhere in the references. */

/** Transcribed: Campfire/Navigation/Side panel/Reporting */
export const REPORTING_NAV: NavGroup[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  {
    id: 'reporting',
    label: 'Reporting',
    icon: 'chart',
    children: [
      { id: 'rep-income', label: 'Income Statement' },
      { id: 'rep-balance', label: 'Balance Sheet' },
      { id: 'rep-cash-flow', label: 'Cash Flow' },
      { id: 'rep-trial', label: 'Trial Balance' },
      { id: 'rep-budgets', label: 'Budgets' },
      { id: 'rep-reports', label: 'Reports' },
    ],
  },
  { id: 'revenue', label: 'Revenue', icon: 'revenue', children: [{ id: 'rev-dashboard', label: 'Dashboard' }] },
  {
    id: 'accounting',
    label: 'Accounting',
    icon: 'accounting',
    children: [
      { id: 'acc-je', label: 'New Journal Entry' },
      { id: 'acc-ije', label: 'New Intercompany Journal Entry' },
      { id: 'acc-invoices', label: 'Invoices' },
      { id: 'acc-bills', label: 'Bills' },
      { id: 'acc-vendors', label: 'Vendors' },
      { id: 'acc-credit', label: 'Credit Memos' },
      { id: 'acc-debit', label: 'Debit Memos' },
      { id: 'acc-amort', label: 'Amortizations' },
      { id: 'acc-fixed', label: 'Fixed Assets' },
    ],
  },
]
/* "New Intercompany Journ..." is truncated in Figma; the full label is an assumption and the row truncates with an ellipsis. */

/** Transcribed: Campfire/Card/Metric/* */
export const METRICS = [
  { label: 'Total Revenue', value: '$3.13M', trend: '11%' },
  { label: 'Recurring Revenue', value: '$2.9M', trend: '8%' },
  { label: 'Customers', value: '27', trend: '7%' },
  { label: 'ARR', value: '$501K', trend: '9%' },
]

export const PERIODS = ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Total']

/** Transcribed: Campfire/Table/Income Statement. REVENUE's child rows are sample data. */
export const INCOME_STATEMENT: FinancialRow[] = [
  {
    id: 'revenue',
    label: 'REVENUE',
    expandable: true,
    values: ['$3,720,002.30', '$1,576,860.25', '$83,179.03', '$5,380,041.58'],
    children: [
      { id: 'revenue-sample-a', label: 'Sample account A', values: ['$1,000.00', '$1,000.00', '$1,000.00', '$3,000.00'] },
      { id: 'revenue-sample-b', label: 'Sample account B', values: ['$500.00', '–', '$250.00', '$750.00'] },
    ],
  },
  { id: 'cogs', label: 'COGS', expandable: true, values: ['($12,534.06)', '$25,500.00', '$1,112.00', '$14,077.94'] },
  { id: 'gross-profit', label: 'GROSS PROFIT', kind: 'subtotal', expandable: true, values: ['$3,732,536.36', '$1,551,360.25', '$82,067.03', '$5,365,963.64'] },
  { id: 'opex', label: 'OPERATING EXPENSES', expandable: true, values: ['($228,845.33)', '$225,752.93', '$894,693.18', '$891,600.78'] },
  { id: 'operating-income', label: 'OPERATING INCOME', kind: 'subtotal', expandable: true, values: ['$3,961,381.69', '$1,325,607.32', '($812,626.15)', '$4,474,362.86'] },
  { id: 'other-income', label: 'OTHER INCOME', expandable: true, values: ['–', '–', '–', '–'] },
  { id: 'other-expense', label: 'OTHER EXPENSE', expandable: true, values: ['$194,196.52', '$20,270.02', '$1,214,896.86', '$1,429,342.60'] },
  { id: 'net-income', label: 'NET INCOME', kind: 'subtotal', expandable: true, values: ['$3,767,186.17', '$1,305,337.30', '($2,027,523.01)', '$3,045,020.46'] },
]

export const CADENCE: SelectOption[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

/** Sample: Figma only shows "None". */
export const FILTERS: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'sample-a', label: 'Sample filter A' },
]

/** Sample: Figma only shows the unselected "Select a view". */
export const REPORT_VIEWS: SelectOption[] = [
  { value: 'sample-view-a', label: 'Sample view A' },
  { value: 'sample-view-b', label: 'Sample view B' },
]

/** Transcribed values plus one sample option. */
export const DATE_RANGES: SelectOption[] = [
  { value: 'q4-2025', label: 'Oct 01, 2025 – Dec 31, 2025' },
  { value: 'all-time', label: 'All Time' },
]

/** Transcribed: Campfire/Table/Editable Cost Allocation */
export const ALLOCATION_LINES: AllocationLine[] = [
  { id: 'l1', account: 'Software & Web Services', percentage: '40', department: 'COGS', tag: null, market: null, productTeams: null },
  { id: 'l2', account: 'Software & Web Services', percentage: '35', department: 'Engineering', tag: null, market: null, productTeams: null },
  { id: 'l3', account: 'Software & Web Services', percentage: '25', department: 'HR', tag: null, market: null, productTeams: null },
]

/** Department values are transcribed; Tag, Market and Product Teams options are sample data. */
export const ALLOCATION_OPTIONS = {
  department: [
    { value: 'COGS', label: 'COGS' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'HR', label: 'HR' },
  ],
  tag: [
    { value: 'sample-tag-a', label: 'Sample tag A' },
    { value: 'sample-tag-b', label: 'Sample tag B' },
  ],
  market: [
    { value: 'sample-market-a', label: 'Sample market A' },
    { value: 'sample-market-b', label: 'Sample market B' },
  ],
  productTeams: [
    { value: 'sample-team-a', label: 'Sample team A' },
    { value: 'sample-team-b', label: 'Sample team B' },
  ],
}
