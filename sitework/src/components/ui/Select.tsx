import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

/** Port of legacy `zt` — underline select matching the Input treatment. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full bg-transparent border-0 border-b px-1 py-[9px] text-[13px] text-sw-ink rounded-none cursor-pointer focus:outline-none',
        invalid ? 'border-sw-neg' : 'border-sw-ink',
        className,
      )}
      {...rest}
    />
  )
})
