import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import styles from './Tabs.module.css'

export interface TabItem {
  value: string
  label: string
  /** Fixed width from the Figma instance (88, 96 and 132 px are used). Omit to hug the label with 12 px insets. */
  width?: CSSProperties['width']
  /** Proposed: Figma draws no disabled tab. */
  disabled?: boolean
  /** id of the tab panel this tab controls, when the page renders one. */
  panelId?: string
}

export interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  'aria-label': string
  /** 1 px border/default rule under the row, as in the Reconcile status tabs. The component specimen has none. */
  divider?: boolean
  /** Static specimens for the showcase: draws one tab in a given state without pointer or keyboard input. */
  visualState?: Partial<Record<string, 'hover' | 'focus'>>
  className?: string
}

/**
 * Figma: Campfire/Navigation/Tab (component set 31:926), State=Default, Active or Hover.
 * 36 px high, 12 px side insets, 4 px bottom inset, 12/18 semibold label. Default: secondary ink on white.
 * Active: primary ink with a 4 px accent lime underline. Hover (proposed in Figma): surface/subtle with primary ink.
 *
 * Keyboard (WAI-ARIA tabs, automatic activation): Left/Right move and select, Home/End jump, disabled tabs are skipped.
 */
export function Tabs({ items, value, onChange, divider = false, visualState, className, ...aria }: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0)

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const pos = enabled.indexOf(index)
    let next: number | undefined
    if (event.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length]
    else if (event.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length]
    else if (event.key === 'Home') next = enabled[0]
    else if (event.key === 'End') next = enabled[enabled.length - 1]
    if (next === undefined) return
    event.preventDefault()
    refs.current[next]?.focus()
    onChange(items[next].value)
  }

  const cls = [styles.tabs, divider && styles.divider, className].filter(Boolean).join(' ')
  return (
    <div className={cls} role="tablist" aria-label={aria['aria-label']}>
      {items.map((item, index) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="tab"
            id={item.panelId ? `${item.panelId}-tab` : undefined}
            aria-selected={selected}
            aria-controls={item.panelId}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            className={styles.tab}
            style={item.width !== undefined ? { width: item.width } : undefined}
            data-visual-state={visualState?.[item.value]}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
