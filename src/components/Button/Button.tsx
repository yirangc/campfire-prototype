import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { IconName } from '../../assets/manifest'
import { Icon } from '../Icon/Icon'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'

interface BaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  /** "compact": the 34 px actions in the Reconcile row footer (28:8753, Dismiss suggestion and Confirm match in 49:952). */
  size?: 'default' | 'compact'
}

interface TextButtonProps extends BaseProps {
  children: React.ReactNode
  /** Optional 16 px leading icon (Figma: Expand All). */
  icon?: IconName
  iconOnly?: false
}

interface IconButtonProps extends BaseProps {
  icon: IconName
  /** Icon-only buttons are 36 × 36 with a 16 px icon and must carry an accessible label. */
  iconOnly: true
  'aria-label': string
  children?: never
}

export type ButtonProps = TextButtonProps | IconButtonProps

/**
 * Figma: Campfire/Button/*. 36 px high, 12/18 medium, 6 px radius, 12 px inset, 8 px icon gap.
 * Primary = accent lime fill with primary ink. Secondary = white with 1 px border. Ghost = white, no visible border.
 * Link = the blue 12/18 medium text actions on the Reconcile screens (Leave Unresolved 38:7881, Search existing
 * entries 38:7842, Dismiss selection), no fill or border, same 36 px target.
 *
 * Disabled: 35% opacity, as drawn on the unavailable Complete reconciliation (49:639) and Confirm match (38:6715).
 * Pass aria-disabled instead of disabled to keep a button focusable and clickable (for example to explain why).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'default', icon, iconOnly, className, children, type = 'button', ...rest },
  ref,
) {
  const cls = [styles.button, styles[variant], size === 'compact' && styles.compact, iconOnly && styles.iconOnly, className].filter(Boolean).join(' ')
  return (
    <button ref={ref} type={type} className={cls} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {!iconOnly && children}
    </button>
  )
})
