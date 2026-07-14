import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
  /** Boxed variant (bordered box) instead of the default underline — for boxed
   *  forms like Settings. Keeps every `<select>` routed through one primitive. */
  box?: boolean
}

/** Port of legacy `zt` — underline select matching the Input treatment; the
 *  `box` variant matches the bordered Settings inputs. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, box, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        box
          ? 'cursor-pointer border bg-white px-2.5 py-2 text-[14px] text-sw-ink outline-none'
          : 'w-full cursor-pointer rounded-none border-0 border-b bg-transparent px-1 py-[9px] text-[13px] text-sw-ink focus:outline-none',
        box
          ? invalid
            ? 'border-sw-neg'
            : 'border-sw-rule focus:border-sw-ink'
          : invalid
            ? 'border-sw-neg'
            : 'border-sw-ink',
        className,
      )}
      {...rest}
    />
  )
})
