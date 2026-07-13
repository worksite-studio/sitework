import type { LeadId } from './ids'
import type { LeadStage } from './enums'

/**
 * Lead — pre-project pipeline. Converted to Project + Client via the
 * CONVERT_LEAD_TO_PROJECT reducer action.
 *
 * Top-level: `state.leads[]`.
 */
export interface Lead {
  id: LeadId
  name: string
  clientName: string
  value: number
  stage: LeadStage
  source: string
  followUp: string
  notes: string
  created: string
  /** Set by CONVERT_LEAD_TO_PROJECT — shows the ✓ converted banner (legacy). */
  convertedToProjectId?: string
}
