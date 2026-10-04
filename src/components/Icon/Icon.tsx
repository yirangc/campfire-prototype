import { iconUrl, type IconName, type IconSize } from '../../assets/manifest'
import styles from './Icon.module.css'

export interface IconProps {
  name: IconName
  /** Box size in px. Match the Figma instance: 16 nav/button, 14 dropdown, 12 chevrons and table actions, 10 trend. */
  size?: IconSize
  /** Accessible label. Omit for decorative icons; the parent control should carry the label. */
  label?: string
  className?: string
}

/**
 * Renders an exported Figma icon file unmodified (as an <img>), so geometry and stroke weight stay exactly
 * as drawn. When the file has not been exported yet, it renders a dashed placeholder at the same size.
 */
export function Icon({ name, size = 24, label, className }: IconProps) {
  const src = iconUrl(name, size)
  const cls = [styles.icon, className].filter(Boolean).join(' ')
  const box = { width: size, height: size }

  if (!src) {
    return (
      <span
        className={`${cls} ${styles.pending}`}
        style={box}
        data-icon={name}
        data-asset-status="pending"
        title={`${name} icon: Figma export pending`}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      />
    )
  }

  return (
    <img
      className={cls}
      src={src}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      data-icon={name}
      draggable={false}
    />
  )
}
