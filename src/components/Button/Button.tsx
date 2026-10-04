import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { IconName } from '../../assets/manifest'
import { Icon } from '../Icon/Icon'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface BaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
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
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', icon, iconOnly, className, children, type = 'button', ...rest },
  ref,
) {
  const cls = [styles.button, styles[variant], iconOnly && styles.iconOnly, className].filter(Boolean).join(' ')
  return (
    <button ref={ref} type={type} className={cls} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {!iconOnly && children}
    </button>
  )
})
