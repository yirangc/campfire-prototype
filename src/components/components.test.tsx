import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AllocationTable, FinancialTable, Modal, Select, SideNav, Button, type AllocationLine } from '.'

// All data in this file is test fixture data, not product data.
const OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

function ControlledSelect() {
  const [value, setValue] = useState<string | null>('monthly')
  return <Select label="Cadence" options={OPTIONS} value={value} onChange={setValue} />
}

describe('Select', () => {
  it('opens with the keyboard, moves the active option and selects with Enter', async () => {
    const user = userEvent.setup()
    render(<ControlledSelect />)
    const trigger = screen.getByRole('button', { name: /Cadence/ })
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    const list = screen.getByRole('listbox')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(list).toHaveFocus()
    expect(list).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-opt-0$/))
    await user.keyboard('{End}')
    expect(list).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-opt-2$/))
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger).toHaveTextContent('Yearly')
    expect(trigger).toHaveFocus()
  })

  it('closes on Escape without changing the value and returns focus', async () => {
    const user = userEvent.setup()
    render(<ControlledSelect />)
    const trigger = screen.getByRole('button', { name: /Cadence/ })
    await user.click(trigger)
    await user.keyboard('{ArrowDown}{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger).toHaveTextContent('Monthly')
    expect(trigger).toHaveFocus()
  })

  it('marks the selected option and selects by click', async () => {
    const user = userEvent.setup()
    render(<ControlledSelect />)
    await user.click(screen.getByRole('button', { name: /Cadence/ }))
    expect(screen.getByRole('option', { name: 'Monthly' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('option', { name: 'Quarterly' }))
    expect(screen.getByRole('button', { name: /Cadence/ })).toHaveTextContent('Quarterly')
  })
})

describe('SideNav', () => {
  const items = [
    { id: 'home', label: 'Home', icon: 'home' as const, href: '#home' },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'chart' as const,
      children: [
        { id: 'pl', label: 'Profit and Loss', href: '#pl' },
        { id: 'bs', label: 'Balance Sheet', href: '#bs' },
      ],
    },
  ]

  it('expands a group and marks the current page', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<SideNav items={items} currentId="home" onNavigate={onNavigate} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    const group = screen.getByRole('button', { name: 'Reports' })
    expect(group).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Profit and Loss' })).not.toBeInTheDocument()
    await user.click(group)
    expect(group).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('link', { name: 'Profit and Loss' }))
    expect(onNavigate).toHaveBeenCalledWith('pl')
  })
})

describe('FinancialTable', () => {
  it('toggles child rows from the row header button', async () => {
    const user = userEvent.setup()
    render(
      <FinancialTable
        caption="Fixture statement"
        columns={['Jan', 'Feb']}
        rows={[
          { id: 'rev', label: 'Revenue', values: ['1', '2'], expandable: true, children: [{ id: 'a', label: 'Child account', values: ['1', '1'] }] },
          { id: 'tot', label: 'Total', values: ['1', '2'], kind: 'subtotal' },
        ]}
      />,
    )
    expect(screen.getByRole('table', { name: 'Fixture statement' })).toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: /Revenue/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Child account')).not.toBeInTheDocument()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Child account')).toBeInTheDocument()
  })
})

describe('AllocationTable', () => {
  const lines: AllocationLine[] = [
    { id: 'l1', account: 'Fixture account', percentage: '40', department: 'cogs', tag: null, market: null, productTeams: null },
  ]
  const opts = [{ value: 'cogs', label: 'COGS' }, { value: 'eng', label: 'Engineering' }]
  const options = { department: opts, tag: opts, market: opts, productTeams: opts }

  it('reports edits, clears and removals with labelled controls', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onRemoveLine = vi.fn()
    const onEditAccount = vi.fn()
    render(
      <AllocationTable
        caption="Fixture lines"
        lines={lines}
        total="100.00%"
        options={options}
        onChange={onChange}
        onRemoveLine={onRemoveLine}
        onEditAccount={onEditAccount}
      />,
    )
    await user.type(screen.getByRole('textbox', { name: 'Percentage for line 1' }), '5')
    expect(onChange).toHaveBeenLastCalledWith('l1', 'percentage', '405')
    await user.click(screen.getByRole('button', { name: 'Clear department for line 1' }))
    expect(onChange).toHaveBeenLastCalledWith('l1', 'department', null)
    await user.click(screen.getByRole('button', { name: 'Tag for line 1' }))
    await user.click(screen.getByRole('option', { name: 'Engineering' }))
    expect(onChange).toHaveBeenLastCalledWith('l1', 'tag', 'eng')
    await user.click(screen.getByRole('button', { name: 'Edit account for line 1' }))
    expect(onEditAccount).toHaveBeenCalledWith('l1')
    await user.click(screen.getByRole('button', { name: 'Remove line 1' }))
    expect(onRemoveLine).toHaveBeenCalledWith('l1')
    expect(screen.getByText('100.00%').tagName).toBe('OUTPUT')
  })
})

describe('Modal', () => {
  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Fixture dialog">
          <p>Body</p>
        </Modal>
      </>
    )
  }

  it('opens labelled, closes on cancel (Escape) and from the close button, and returns focus', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await user.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Fixture dialog' })
    expect(dialog).toHaveAttribute('open')
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }))
    await vi.waitFor(() => expect(dialog).not.toHaveAttribute('open'))
    expect(opener).toHaveFocus()
    await user.click(opener)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(dialog).not.toHaveAttribute('open')
    expect(opener).toHaveFocus()
  })
})
