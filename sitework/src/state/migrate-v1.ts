import { LEGACY_KEY, STATE_KEY, type PersistedStorage } from './persistence'

/**
 * One-time importer from the legacy single-file app's `sw_state_v1` key
 * into the new `sw_state_v2` shape.
 *
 * Strategy:
 *   1. If `sw_state_v2` already exists, do nothing (the user has already
 *      migrated or has fresh new-app state).
 *   2. If `sw_state_v1` exists, parse it, apply small shape fixes, write
 *      to `sw_state_v2`. Leave `sw_state_v1` in place for one release
 *      cycle as a safety net.
 *   3. If neither exists, do nothing (fresh user — seed will populate).
 *
 * Shape fixes applied during migration are intentionally minimal in
 * Phase 4; the legacy shape is preserved verbatim. Phase 5 handles
 * substantive transformations (enum casing, FK normalisation).
 */
export interface MigrationResult {
  /** 'migrated' if we wrote new state, 'skipped' if no work was needed. */
  status: 'migrated' | 'skipped'
  /** Diagnostic reason ('already-migrated', 'no-legacy', 'parse-error'). */
  reason?: string
}

const browserStorage: PersistedStorage | null =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? window.localStorage
    : null

export function migrateLegacyState(storage: PersistedStorage | null = browserStorage): MigrationResult {
  if (!storage) return { status: 'skipped', reason: 'no-storage' }

  // Already migrated?
  if (storage.getItem(STATE_KEY) !== null) {
    return { status: 'skipped', reason: 'already-migrated' }
  }

  const legacy = storage.getItem(LEGACY_KEY)
  if (!legacy) return { status: 'skipped', reason: 'no-legacy' }

  let parsed: unknown
  try {
    parsed = JSON.parse(legacy)
  } catch {
    return { status: 'skipped', reason: 'parse-error' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { status: 'skipped', reason: 'parse-error' }
  }

  // Phase 4 migration is a passthrough — we keep the legacy shape verbatim.
  // Phase 5 lands the real transformations (enum casing, FK rewires).
  storage.setItem(STATE_KEY, JSON.stringify(parsed))
  return { status: 'migrated' }
}
