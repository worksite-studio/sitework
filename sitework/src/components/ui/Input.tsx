import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

/** Port of legacy `A` — underline input: no box, 1px ink bottom border (pink on error). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full bg-transparent border-0 border-b px-0 py-[9px] text-[13px] text-sw-ink placeholder:text-sw-faint rounded-none focus:outline-none',
        invalid ? 'border-sw-neg' : 'border-sw-ink',
        className,
      )}
      {...rest}
    />
  )
})
