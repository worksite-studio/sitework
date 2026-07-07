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
 * Form field wrapper — port of legacy `x`. Label 11px/500/muted over the
 * underline control.
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
    <div className={cn('space-y-0', className)}>
      <label htmlFor={id} className="block text-[11px] font-medium text-sw-muted mb-[5px]">
        {label}
        {required && <span className="text-sw-neg ml-0.5">*</span>}
      </label>
      {controlWithId}
      {error ? (
        <p className="text-[11px] text-sw-neg mt-1">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-sw-muted mt-1">{hint}</p>
      ) : null}
    </div>
  )
}
