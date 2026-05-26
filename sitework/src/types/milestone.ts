import type { MilestoneId } from './ids'
import type { MilestoneStatus } from './enums'

/**
 * Milestone — per-project-keyed: `state.milestones[projectId][]`.
 *
 * Surfaced in: Milestones tab; Calendar tab (Phase 1.5-D).
 *
 * ARCHITECTURE.md §6.13 notes no dedicated reducer actions for this entity
 * yet — Phase 4 introduces ADD_MILESTONE / UPDATE_MILESTONE in Session 3.
 */
export interface Milestone {
  id: MilestoneId
  name: string
  date: string
  status: MilestoneStatus
  notes: string
}
