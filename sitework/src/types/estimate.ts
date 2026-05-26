import type { ClientId, EstimateCodeId, EstimateId } from './ids'
import type { EstimateStatus } from './enums'

export interface EstimateCode {
  id: EstimateCodeId
  code: string
  desc: string
  budget: number
}

/**
 * Estimate — pre-contract pricing exercise. Promoted to Project via the
 * PROMOTE_ESTIMATE reducer action (copies codes across).
 *
 * Top-level: `state.estimates[]`.
 */
export interface Estimate {
  id: EstimateId
  name: string
  clientId: ClientId
  address: string
  status: EstimateStatus
  createdDate: string
  margin: number
  codes: EstimateCode[]
}
