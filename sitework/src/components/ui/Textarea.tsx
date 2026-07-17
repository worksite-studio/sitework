import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

/** Underline textarea matching the `Input` treatment — for notes/comments. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full resize-y bg-transparent border-0 border-b px-0 py-[9px] text-[13px] text-sw-ink placeholder:text-sw-faint rounded-none focus:outline-none',
        invalid ? 'border-sw-neg' : 'border-sw-ink',
        className,
      )}
      {...rest}
    />
  )
})
