import type { BoqTemplate } from './boqTemplate'
import type { Client } from './client'
import type { DiaryEntry } from './diaryEntry'
import type { Defect } from './defect'
import type { Estimate } from './estimate'
import type { Lead } from './lead'
import type { Material } from './material'
import type { Milestone } from './milestone'
import type { ScheduleTask } from './scheduleTask'
import type { PrimeCostItem } from './primeCostItem'
import type { ProgressClaim } from './progressClaim'
import type { Project } from './project'
import type { ProvisionalSum } from './provisionalSum'
import type { Purchase } from './purchase'
import type { Retention } from './retention'
import type { Rfi } from './rfi'
import type { Selection } from './selection'
import type { Settings } from './settings'
import type { Subcontractor } from './subcontractor'
import type { Supplier } from './supplier'
import type { Timesheet } from './timesheet'

/**
 * Per-project-keyed collection helper. The string key is a ProjectId
 * serialised back to plain string by JSON.stringify (TypeScript loses
 * brand info across Record keys, which is fine here — the lookup happens
 * by ProjectId at call sites).
 */
export type ByProject<T> = Record<string, T[] | undefined>

/**
 * Root state shape — the entire app's data, persisted to localStorage
 * under `sw_state_v2`.
 *
 * See ARCHITECTURE.md §7 for the storage-pattern rationale (top-level
 * arrays vs per-project-keyed dictionaries vs nested-in-Project).
 */
export interface RootState {
  // Top-level arrays
  projects: Project[]
  clients: Client[]
  subs: Subcontractor[]
  leads: Lead[]
  estimates: Estimate[]
  materials: Material[]
  suppliers: Supplier[]
  templates: BoqTemplate[]

  // Per-project-keyed dictionaries
  milestones: ByProject<Milestone>
  /** Programme-of-works tasks (4.7-O) — cost codes placed on the timeline. */
  scheduleTasks: ByProject<ScheduleTask>
  diary: ByProject<DiaryEntry>
  timesheets: ByProject<Timesheet>
  defects: ByProject<Defect>
  selections: ByProject<Selection>
  claims: ByProject<ProgressClaim>
  purchases: ByProject<Purchase>
  primeCostItems: ByProject<PrimeCostItem>
  provisionalSums: ByProject<ProvisionalSum>
  rfis: ByProject<Rfi>
  retention: Record<string, Retention | undefined>

  // Single record
  settings: Settings
}

// Re-export for convenience
export type {
  BoqTemplate,
  Client,
  DiaryEntry,
  Defect,
  Estimate,
  Lead,
  Material,
  Milestone,
  PrimeCostItem,
  ProgressClaim,
  Project,
  ProvisionalSum,
  Purchase,
  Retention,
  Rfi,
  ScheduleTask,
  Selection,
  Settings,
  Subcontractor,
  Supplier,
  Timesheet,
}
