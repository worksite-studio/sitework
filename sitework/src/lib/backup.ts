import type { RootState } from '@/types'
import { STATE_KEY, mergeSeedWithStored } from '@/state/persistence'

/**
 * JSON backup export / restore. The export is a plain snapshot of the root
 * state — the same shape persisted under sw_state_v2 — so a backup taken
 * from the error screen (raw localStorage) and one taken from Settings
 * (live state) are interchangeable on restore.
 */

export function backupFileName(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `sitework-backup-${y}-${m}-${d}.json`
}

function triggerDownload(json: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFileName()
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Download the live state as a JSON file. */
export function exportStateFile(state: RootState) {
  triggerDownload(JSON.stringify(state, null, 2))
}

/**
 * Download whatever is persisted under sw_state_v2, without parsing it.
 * Used by the crash screen and the save-failure banner, where the React
 * tree (or the state object itself) may be unusable but storage is intact.
 * Returns false when there is nothing stored to download.
 */
export function exportRawStoredState(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  const raw = storage.getItem(STATE_KEY)
  if (!raw) return false
  triggerDownload(raw)
  return true
}

/**
 * Parse a backup file's text into a full RootState, coerced onto the seed
 * shape via the same merge used when loading persisted state. Returns null
 * when the file isn't a plausible SITEWORK backup.
 */
export function parseBackupFile(text: string, seed: RootState): RootState | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  const record = parsed as Record<string, unknown>
  if (!Array.isArray(record.projects)) return null
  return mergeSeedWithStored(seed, parsed)
}
