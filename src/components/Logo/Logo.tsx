import { BRAND, brandUrl } from '../../assets/manifest'
import styles from './Logo.module.css'

export interface LogoProps {
  /** "logo" is the full lockup (138 × 32). "mark" is the five-ray mark alone (26 × 32). */
  variant?: 'logo' | 'mark'
  className?: string
}

/** The supplied Campfire artwork at its Figma display size. Proportions come from the source PNG. */
export function Logo({ variant = 'logo', className }: LogoProps) {
  const spec = BRAND[variant]
  const src = brandUrl(variant)
  const cls = [styles.logo, className].filter(Boolean).join(' ')
  const box = { width: spec.width, height: spec.height }

  if (!src) {
    return (
      <span
        className={`${cls} ${styles.pending}`}
        style={box}
        role="img"
        aria-label="Campfire"
        data-asset-status="pending"
        title={`Campfire ${variant}: Figma export pending`}
      >
        {variant === 'logo' && <span aria-hidden="true">logo pending</span>}
      </span>
    )
  }

  return <img className={`${cls} ${styles.image}`} src={src} style={box} alt="Campfire" draggable={false} />
}
