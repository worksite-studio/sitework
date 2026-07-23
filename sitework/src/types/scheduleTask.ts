import type { CostCodeId, ScheduleTaskId } from './ids'
import type { MilestoneStatus } from './enums'

/**
 * Precedence relationship between two tasks (4.7-P scheduling engine):
 *  - FS finish-to-start  — successor starts after predecessor finishes (default)
 *  - SS start-to-start    — successor starts after predecessor starts
 *  - FF finish-to-finish  — successor finishes after predecessor finishes
 *  - SF start-to-finish   — successor finishes after predecessor starts (rare)
 */
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF'

/** A predecessor link with lead/lag, measured in WORKING days (may be negative for a lead). */
export interface TaskDependency {
  /** The predecessor task. */
  id: ScheduleTaskId
  type: DependencyType
  lag: number
}

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
  /**
   * The BOQ cost code this leaf task schedules. Optional (4.7-Q2): a summary /
   * parent row is a pure grouping heading with no code — its dates roll up
   * from its children.
   */
  ccId?: CostCodeId
  /** Parent task id for the WBS tree (4.7-Q2). Absent = top-level row. */
  parentId?: ScheduleTaskId
  /** Task/summary name. Defaults to the cost code's description when left blank. */
  name: string
  /**
   * ISO date (yyyy-mm-dd) the task starts. Acts as a "start no earlier than"
   * anchor — the scheduling engine (4.7-P) may push a dependent task later, and
   * the Gantt renders the engine's computed dates.
   */
  start: string
  /** ISO date (yyyy-mm-dd) the task ends — inclusive. Snapshot of the last save;
   *  the engine derives the displayed end from `durationDays` + predecessors. */
  end: string
  /** Duration in WORKING days. Optional for back-compat — derived from
   *  start/end when absent (4.7-P). */
  durationDays?: number
  status: MilestoneStatus
  /** Optional grouping band, e.g. "Site & Sub-structure", "Lockup". */
  phase?: string
  notes?: string
  /** Predecessor links (4.7-P) — typed, with lead/lag in working days. */
  deps?: TaskDependency[]
}
