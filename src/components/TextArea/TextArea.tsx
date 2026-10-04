import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import fieldStyles from '../TextField/TextField.module.css'
import styles from './TextArea.module.css'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  /** Field error. Sets aria-invalid and is announced with the field. */
  error?: string
  hint?: string
}

/**
 * Proposed: Figma has no multi-line field. Same label, border, radius, inset and focus recipe as
 * Field/Default and Field/Focus (12:12183, 12:12184), with 8 px vertical insets and a 3-line minimum.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, id, className, error, hint, rows = 3, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = [error && `${inputId}-error`, hint && `${inputId}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div className={[fieldStyles.field, className].filter(Boolean).join(' ')}>
      <label className={fieldStyles.label} htmlFor={inputId}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`${fieldStyles.input} ${styles.textarea}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && (
        <p id={`${inputId}-hint`} className={fieldStyles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className={fieldStyles.error}>
          {error}
        </p>
      )}
    </div>
  )
})
