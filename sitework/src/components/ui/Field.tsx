import { Children, cloneElement, isValidElement, useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface FieldProps {
  label: string
  /** Explicit id for the control. Auto-generated if omitted. */
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

/**
 * Form field wrapper — label + control slot + optional inline error.
 *
 * If `htmlFor` is omitted, generates a stable id via `useId()` and injects
 * it onto the single child element so screen readers (and React Testing
 * Library's `getByLabelText`) can associate them. Consumers don't have to
 * thread an id through every form.
 */
export function Field({ label, htmlFor, required, error, hint, children, className }: FieldProps) {
  const autoId = useId()
  const id = htmlFor ?? autoId

  const child = Children.only(children)
  const controlWithId = isValidElement<{ id?: string }>(child)
    ? cloneElement(child, { id: child.props.id ?? id })
    : child

  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="block text-xs font-medium text-sw-muted">
        {label}
        {required && <span className="text-sw-danger ml-0.5">*</span>}
      </label>
      {controlWithId}
      {error ? (
        <p className="text-xs text-sw-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-sw-muted">{hint}</p>
      ) : null}
    </div>
  )
}
