import type { CostCodeId } from './ids'

/**
 * Cost code — nested in Project.codes[]. Bill-of-quantities line.
 */
export interface CostCode {
  id: CostCodeId
  code: string
  desc: string
  budget: number
  /** Sum of POs raised against this code. */
  committed: number
  /** Sum of invoices paid against this code. */
  actual: number
  /** Sum of approved variations on this code. */
  vars: number
}
