import type { SelectionId } from './ids'
import type { SelectionStatus } from './enums'

/**
 * Client selection — per-project-keyed: `state.selections[projectId][]`.
 *
 * Tracks finishes / fixtures the client chooses from a list of options.
 */
export interface Selection {
  id: SelectionId
  category: string
  item: string
  options: string
  notes: string
  status: SelectionStatus
  approvedOption: string | null
  amount: number
}
