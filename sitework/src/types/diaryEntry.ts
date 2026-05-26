import type { DiaryEntryId } from './ids'

/**
 * Diary entry — per-project-keyed: `state.diary[projectId][]`.
 *
 * `subs[]` is a denormalised array of sub *names* (strings, not FKs).
 * Phase 5 may normalise to SubcontractorId references.
 */
export interface DiaryEntry {
  id: DiaryEntryId
  date: string
  weather: string
  workers: number
  subs: string[]
  hours: number
  notes: string
  incidents: boolean
}
