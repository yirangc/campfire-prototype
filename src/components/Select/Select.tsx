import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { IconName } from '../../assets/manifest'
import { Icon } from '../Icon/Icon'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  /** Shown when value is null. Placeholders render in muted ink. */
  placeholder?: string
  /**
   * "control": Figma Campfire/Dropdown/* (36 px, bordered, 14 px chevron-down).
   * "cell": Figma Campfire/Table/Cell/* dropdown (40 px inside a table cell, no border, 12 px select indicator).
   */
  variant?: 'control' | 'cell'
  /** Optional 16 px leading icon, e.g. calendar for Date Range. */
  icon?: IconName
  /** Visible label above the control (12/18 medium, secondary). When omitted, pass aria-label. */
  label?: string
  'aria-label'?: string
  width?: CSSProperties['width']
  disabled?: boolean
  id?: string
  className?: string
}

/**
 * Single-select listbox. The closed states are observed in Figma; the open menu is Figma's
 * "proposed open state" (Campfire/Dropdown/Cadence/Open menu/Proposed).
 *
 * Keyboard: Enter, Space, ArrowDown or ArrowUp open the menu. In the menu, arrows move, Home/End jump,
 * Enter or Space select, Escape closes and returns focus, Tab closes.
 */
export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select',
  variant = 'control',
  icon,
  label,
  'aria-label': ariaLabel,
  width,
  disabled,
  id,
  className,
}: SelectProps) {
  const autoId = useId()
  const baseId = id ?? autoId
  const labelId = `${baseId}-label`
  const listId = `${baseId}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  useEffect(() => {
    if (!open) return
    listRef.current?.focus()
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const openMenu = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActive(index)
    setOpen(true)
  }

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const choose = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    close(true)
  }

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      openMenu()
    }
  }

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const last = options.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(i + 1, last))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(last)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        e.preventDefault()
        close(true)
        break
      case 'Tab':
        close(false)
        break
    }
  }

  const isCell = variant === 'cell'
  const rootCls = [styles.root, isCell && styles.rootCell, className].filter(Boolean).join(' ')

  return (
    <div ref={rootRef} className={rootCls} style={{ width }}>
      {label && (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        id={baseId}
        type="button"
        className={`${styles.trigger} ${isCell ? styles.cell : styles.control}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={label ? `${labelId} ${baseId}` : undefined}
        aria-label={label ? undefined : ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
      >
        {icon && <Icon name={icon} size={16} />}
        <span className={`${styles.value} ${selected ? '' : styles.placeholder}`}>
          {selected ? selected.label : placeholder}
        </span>
        {isCell ? <Icon name="chevrons-up-down" size={12} /> : <Icon name="chevron-down" size={14} />}
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={styles.menu}
          aria-labelledby={label ? labelId : undefined}
          aria-label={label ? undefined : ariaLabel}
          aria-activedescendant={`${baseId}-opt-${active}`}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, i) => {
            const isSelected = i === selectedIndex
            return (
              <li
                key={option.value}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                className={`${styles.option} ${i === active ? styles.active : ''}`}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(i)}
              >
                <span>{option.label}</span>
                {isSelected && <Icon name="check" size={14} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
