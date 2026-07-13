import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

/** Port of legacy `Q` — square, padding-sized, black primary / pink danger. */
const VARIANT: Record<Variant, string> = {
  primary: 'bg-sw-ink text-white',
  secondary: 'bg-white text-sw-ink border border-sw-rule',
  ghost: 'bg-white text-sw-ink border border-sw-rule',
  danger: 'bg-sw-neg text-white',
}

const SIZE: Record<Size, string> = {
  sm: 'px-3 py-[5px] text-[11px]',
  md: 'px-[18px] py-2 text-[12px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[1px] font-semibold tracking-[0.02em] whitespace-nowrap cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    />
  )
}
