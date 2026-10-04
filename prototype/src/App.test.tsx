import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { STORAGE_KEY } from './domain/persistence'

const metric = (label: string) => screen.getByText(label).closest('div[class*=card], section, article')?.textContent ?? ''
const row = (text: RegExp) => screen.getByRole('button', { name: text })
const detail = () => screen.getByRole('button', { name: /Leave Unresolved/ }).closest('td') as HTMLElement

beforeEach(() => {
  localStorage.clear()
})

describe('Reconciliation prototype', () => {
  it('starts with 14 exception records in 11 cases and the background pairs kept apart', async () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: 'All (14)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Suggested (6)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Unmatched (14)' })).toBeInTheDocument()
    expect(screen.getByText(/7 bank transactions \/ 7 ledger entries · 11 review cases/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Already matched: 5 pairs/ })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Unmatched (14)' }))
    expect(screen.getByText(/Showing 11 of 11 review cases/)).toBeInTheDocument()
    expect(metric('Remaining difference')).toContain('$320.00')
  })

  it('confirms a suggestion from the keyboard and offers Undo in the row', async () => {
    const user = userEvent.setup()
    render(<App />)
    row(/Nov 04 · ACH NORTH/).focus()
    await user.keyboard('{Enter}')
    await user.click(within(detail()).getByRole('button', { name: 'Confirm match' }))
    expect(screen.getByRole('tab', { name: 'Confirmed (2)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Unmatched (12)' })).toBeInTheDocument()
    expect(metric('Book balance')).toContain('$109,970.00')
    expect(metric('Cleared balance')).toContain('$107,470.00')
    await user.click(screen.getByRole('button', { name: /Undo the last action on B01/ }))
    expect(screen.getByRole('tab', { name: 'Confirmed (0)' })).toBeInTheDocument()
    expect(metric('Cleared balance')).toContain('$109,870.00')
  })

  it('dismisses a suggestion without changing balances and restores it from the notice', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(row(/Nov 18 · ALDER SUPPLY/))
    await user.click(within(detail()).getByRole('button', { name: 'Dismiss suggestion' }))
    expect(screen.getByRole('tab', { name: 'Suggested (4)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Unmatched (14)' })).toBeInTheDocument()
    expect(screen.getByText('Suggestion dismissed')).toBeInTheDocument()
    expect(metric('Remaining difference')).toContain('$320.00')
    await user.click(screen.getByRole('button', { name: /Undo dismissing GL-1108/ }))
    expect(screen.getByRole('tab', { name: 'Suggested (6)' })).toBeInTheDocument()
  })

  it('searches with the keyboard, then confirms the selected entry', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(row(/Nov 18 · ALDER SUPPLY/))
    await user.click(within(detail()).getByRole('button', { name: 'Dismiss suggestion' }))
    const combo = within(detail()).getByRole('combobox')
    await user.click(combo)
    await user.type(combo, 'ald-17')
    expect(within(detail()).getAllByRole('option')).toHaveLength(1)
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByText('Selected ledger entry')).toBeInTheDocument()
    await user.click(within(detail()).getByRole('button', { name: 'Confirm match' }))
    expect(screen.getByRole('tab', { name: 'Confirmed (2)' })).toBeInTheDocument()
    expect(row(/Nov 18 · ALDER SUPPLY/)).toHaveFocus()
  })

  it('finds entries by date in the single search field', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(row(/Nov 18 · ALDER SUPPLY/))
    await user.click(within(detail()).getByRole('button', { name: 'Dismiss suggestion' }))
    expect(within(detail()).queryByText(/Required for a match/)).not.toBeInTheDocument()
    expect(within(detail()).queryByRole('button', { name: /Add a date filter/ })).not.toBeInTheDocument()
    const combo = within(detail()).getByPlaceholderText('Search by keywords or date')
    await user.click(combo)
    expect(within(detail()).getAllByRole('option')).toHaveLength(2)
    await user.type(combo, 'Nov 19')
    expect(within(detail()).getAllByRole('option').map((o) => o.textContent)).toEqual([expect.stringContaining('GL-1108')])
    await user.clear(combo)
    await user.type(combo, '11/17')
    expect(within(detail()).getAllByRole('option').map((o) => o.textContent)).toEqual([expect.stringContaining('GL-1107')])
  })

  it('keeps expense input after a rejected submit and creates the entry once', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(row(/Monthly bank service fee/))
    await user.click(within(detail()).getByRole('button', { name: 'Create entry…' }))
    const date = within(detail()).getByLabelText('Posting date')
    await user.clear(date)
    await user.type(date, 'Dec 1, 2025')
    await user.click(within(detail()).getByRole('button', { name: 'Create and match' }))
    expect(within(detail()).getByText('The posting date must be in November 2025.')).toBeInTheDocument()
    expect(within(detail()).getByText('Choose the expense category that records this cost.')).toBeInTheDocument()
    expect(date).toHaveValue('Dec 1, 2025')
    await user.clear(date)
    await user.type(date, 'Nov 30, 2025')
    await user.click(within(detail()).getByRole('button', { name: /Expense category/ }))
    await user.click(screen.getByRole('option', { name: 'Bank Fees' }))
    await user.dblClick(within(detail()).getByRole('button', { name: 'Create and match' }))
    expect(screen.getAllByText(/GL-1115/).length).toBeGreaterThan(0)
    expect(metric('Book balance')).toContain('$109,955.00')
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(saved.state?.generated ?? saved.generated).toHaveLength(1)
  })

  it('expands and collapses a case when any part of its row is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = row(/Nov 04 · ACH NORTH/)
    await user.click(within(button.closest('tr')!).getByText('GL-1101 · Nov 03'))
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await user.click(within(button.closest('tr')!).getByText('Suggested'))
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('resets the demo to the original data and clears saved actions', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(row(/Nov 04 · ACH NORTH/))
    await user.click(within(detail()).getByRole('button', { name: 'Confirm match' }))
    expect(screen.getByRole('tab', { name: 'Confirmed (2)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset demo' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset demo' }))
    expect(screen.getByRole('tab', { name: 'Confirmed (0)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Unmatched (14)' })).toBeInTheDocument()
    expect(metric('Cleared balance')).toContain('$109,870.00')
    expect(screen.getByRole('button', { name: /History \(0\)/ })).toBeInTheDocument()
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    const state = saved?.state ?? saved
    expect(state?.matches ?? []).toHaveLength(0)
  })

  it('leaves a case unresolved by collapsing it, with nothing else changed', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(row(/Outgoing wire fee/))
    await user.click(within(detail()).getByRole('button', { name: 'Leave Unresolved' }))
    expect(row(/Outgoing wire fee/)).toHaveAttribute('aria-expanded', 'false')
    expect(row(/Outgoing wire fee/)).toHaveFocus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(row(/Outgoing wire fee/).closest('tr')!).getByText('Unmatched')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Unmatched (14)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /History \(0\)/ })).toBeInTheDocument()
    expect(metric('Remaining difference')).toContain('$320.00')
    await user.click(row(/Outgoing wire fee/))
    expect(row(/Outgoing wire fee/)).toHaveAttribute('aria-expanded', 'true')
  })

  it('blocks completion and lists the reasons', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Complete reconciliation/ }))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('14 of 14 exception records are still unmatched (6 of them have a suggested match)')
    expect(alert).toHaveTextContent('The remaining difference is $320.00')
  })

  it('shows a recovery screen for unreadable saved data instead of discarding it', () => {
    localStorage.setItem(STORAGE_KEY, '{')
    render(<App />)
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{')
  })
})
