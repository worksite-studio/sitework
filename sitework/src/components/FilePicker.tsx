import { useRef, type ChangeEvent } from 'react'
import { Button } from './ui/Button'
import { cn } from '@/lib/cn'
import type { FileAttachment } from '@/types'

interface FilePickerProps {
  value: FileAttachment[]
  onChange: (next: FileAttachment[]) => void
  /** Show a red border / "required" affordance when the parent says so. */
  invalid?: boolean
  /** Accept attribute for the underlying <input>. */
  accept?: string
  className?: string
}

/**
 * Supporting docs file picker — port of the Phase 1.5-A pattern. Reads
 * selected files as base64 dataURLs and appends them to the value array.
 * Same dataURL approach as the legacy app (ARCHITECTURE.md §11) — Phase 5
 * swaps to object storage; this picker's interface stays the same.
 *
 * The dataURL is stored verbatim so a user re-opening the dialog later can
 * still download / preview the doc.
 */
export function FilePicker({
  value,
  onChange,
  invalid,
  accept = '.pdf,.png,.jpg,.jpeg',
  className,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const next: FileAttachment[] = [...value]
    for (const f of files) {
      const dataUrl = await readAsDataUrl(f)
      next.push({ name: f.name, dataUrl, size: f.size })
    }
    onChange(next)
    if (inputRef.current) inputRef.current.value = ''
  }

  function remove(idx: number) {
    const next = [...value]
    next.splice(idx, 1)
    onChange(next)
  }

  return (
    <div
      className={cn(
        'rounded-md border p-2 space-y-1',
        invalid ? 'border-sw-danger bg-sw-danger/5' : 'border-sw-border bg-sw-surface',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-sw-muted">
          {value.length === 0 ? 'No documents attached.' : `${value.length} attached`}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={onPick}
          className="hidden"
          aria-label="Attach supporting document"
        />
        <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
          + Attach
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((d, idx) => (
            <li
              key={`${d.name}-${idx}`}
              className="flex items-center justify-between text-xs bg-sw-bg rounded px-2 py-1"
            >
              <span className="truncate">
                {d.name}
                {d.size > 0 && (
                  <span className="text-sw-muted ml-2">({Math.round(d.size / 1024)} KB)</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label={`Remove ${d.name}`}
                className="text-sw-muted hover:text-sw-danger transition px-1"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function readAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(f)
  })
}
