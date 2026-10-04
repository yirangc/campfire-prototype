import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import type { IconName } from '../../assets/manifest'
import { Icon } from '../Icon/Icon'
import styles from './TextField.module.css'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  /** Field error. Sets aria-invalid, links the message with aria-describedby and draws the proposed error border. */
  error?: string
  /** Supporting text under the field. */
  hint?: string
  /** 16 px leading icon, e.g. calendar on the posting date (38:8005) or search. */
  icon?: IconName
  /**
   * "default": Field/Default (38 px, inferred). "compact": the 34 px inputs inside the Reconcile
   * expense form (38:7939, 38:8005), where Figma draws the same field 4 px shorter.
   */
  size?: 'default' | 'compact'
}

/**
 * Figma: Campfire/Field/Labelled (Default, Focus). Label 12/18 medium, 6 px gap, 38 px input,
 * 12 px inset, 1 px border. Focus: 2 px lime border (observed) plus 2 px soft ring (proposed).
 * Read-only (38:7939): surface/subtle fill with a 16 px lock, as in the Reconcile expense form.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, id, className, error, hint, icon, size = 'default', readOnly, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = [error && `${inputId}-error`, hint && `${inputId}-hint`].filter(Boolean).join(' ') || undefined
  const boxCls = [styles.box, size === 'compact' && styles.compact, readOnly && styles.readOnly, error && styles.invalid]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={boxCls}>
        {icon && <Icon name={icon} size={16} className={styles.leading} />}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {readOnly && <Icon name="lock" size={16} className={styles.trailing} label="Read only" />}
      </div>
      {hint && (
        <p id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
})
