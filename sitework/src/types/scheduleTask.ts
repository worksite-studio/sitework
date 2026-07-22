import type { CostCodeId, ScheduleTaskId } from './ids'
import type { MilestoneStatus } from './enums'

/**
 * Programme-of-works task — per-project-keyed: `state.scheduleTasks[projectId]`.
 *
 * Phase 4.7-O. The Gantt's rows are BOQ cost codes placed on a timeline, but
 * the dates live here rather than on `CostCode` so that:
 *  - a code can carry several work periods (e.g. two framing windows),
 *  - programme data stays out of the cost entity, and
 *  - it normalises to its own table in the Phase 5 schema.
 *
 * A code only appears on the programme once a task gives it dates — the
 * programme is deliberate, not every cost code.
 *
 * `deps` is reserved for the critical-path pass; the first cut ships
 * dependency-free.
 */
export interface ScheduleTask {
  id: ScheduleTaskId
  /** The BOQ cost code this task schedules. */
  ccId: CostCodeId
  /** Defaults to the cost code's description when left blank. */
  name: string
  /** ISO date (yyyy-mm-dd) the task starts. */
  start: string
  /** ISO date (yyyy-mm-dd) the task ends — inclusive. */
  end: string
  status: MilestoneStatus
  /** Optional grouping band, e.g. "Site & Sub-structure", "Lockup". */
  phase?: string
  notes?: string
  /** Reserved — predecessor task ids for the later critical-path pass. */
  deps?: ScheduleTaskId[]
}
