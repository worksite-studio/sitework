import type { DefectId } from './ids'
import type { DefectStatus } from './enums'

/**
 * Defect — per-project-keyed: `state.defects[projectId][]`.
 *
 * Surfaced in: Defects tab; Calendar tab (warranty expiry calcs, Phase 1.5-D).
 */
export interface Defect {
  id: DefectId
  item: string
  location: string
  trade: string
  dateLogged: string
  dateRectified: string | null
  status: DefectStatus
  notes: string
}
