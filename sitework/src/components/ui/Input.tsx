import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-md border px-3 text-sm bg-sw-surface text-sw-text placeholder:text-sw-muted/70',
        'focus:outline-none focus:ring-2 focus:ring-sw-primary/40 focus:border-sw-primary',
        invalid ? 'border-sw-danger' : 'border-sw-border',
        className,
      )}
      {...rest}
    />
  )
})
