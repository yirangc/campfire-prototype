import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import styles from './TextField.module.css'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
}

/**
 * Figma: Campfire/Field/Labelled (Default, Focus). Label 12/18 medium, 6 px gap, 38 px input,
 * 12 px inset, 1 px border. Focus: 2 px lime border (observed) plus 2 px soft ring (proposed).
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, id, className, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input ref={ref} id={inputId} className={styles.input} {...rest} />
    </div>
  )
})
