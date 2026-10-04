import { STATUS_GLYPHS, statusGlyphSvg, type StatusGlyphName } from '../../assets/manifest'
import styles from '../Icon/Icon.module.css'

export interface StatusGlyphProps {
  name: StatusGlyphName
  /** Accessible label. Omit when the glyph sits next to text that says the same thing. */
  label?: string
  className?: string
}

/** A status glyph from the Reconcile mockups, inline at its drawn size and colors. */
export function StatusGlyph({ name, label, className }: StatusGlyphProps) {
  const svg = statusGlyphSvg(name)
  const size = STATUS_GLYPHS[name].size
  return (
    <span
      className={[styles.icon, !svg && styles.pending, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      data-glyph={name}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // Static files exported from Figma (src/assets/status), not user content.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  )
}
