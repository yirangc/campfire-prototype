import { iconSvg, type IconName, type IconSize } from '../../assets/manifest'
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
 * Renders the icon's SVG inline so strokes can draw past the frame where Figma's do (download) and take
 * their color from CSS (color/text/secondary by default). When the file is missing, it renders a dashed
 * placeholder at the same size.
 */
export function Icon({ name, size = 24, label, className }: IconProps) {
  const svg = iconSvg(name, size)
  const cls = [styles.icon, !svg && styles.pending, className].filter(Boolean).join(' ')

  return (
    <span
      className={cls}
      style={{ width: size, height: size }}
      data-icon={name}
      data-asset-status={svg ? undefined : 'pending'}
      title={svg ? undefined : `${name} icon: Figma export pending`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // Static files generated from Figma geometry by scripts/figma/build-icons.mjs, not user content.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  )
}
