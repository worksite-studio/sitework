import type { CostCodeId, TimesheetId } from './ids'

/**
 * Timesheet — per-project-keyed: `state.timesheets[projectId][]`.
 */
export interface Timesheet {
  id: TimesheetId
  date: string
  worker: string
  role: string
  ccId: CostCodeId
  hours: number
  rate: number
  notes: string
}
