import type { BoqTemplateId } from './ids'
import type { BoqTemplateCategory } from './enums'

export interface BoqTemplateCode {
  /** Template codes carry a percentage of total, not an absolute budget. */
  code: string
  desc: string
  pct: number
}

/**
 * Reusable BOQ skeleton — fed into Estimating (CREATE_ESTIMATE_FROM_TEMPLATE)
 * and project BOQ (IMPORT_TEMPLATE_INTO_BOQ, Phase 1.5-C).
 *
 * Top-level: `state.templates[]`.
 */
export interface BoqTemplate {
  id: BoqTemplateId
  name: string
  desc: string
  icon: string
  type: BoqTemplateCategory
  codes: BoqTemplateCode[]
}
