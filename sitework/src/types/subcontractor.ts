import type { CertificateId, ProjectId, SubcontractorId } from './ids'
import type { CertificateType } from './enums'
import type { FileAttachment } from './file'

/**
 * Certificate attached to a subcontractor (Phase 1.5-E).
 * Expiry chip rendering: amber within 30 days, red if expired, green otherwise.
 */
export interface Certificate {
  id: CertificateId
  type: CertificateType
  file: FileAttachment
  expiry: string
  uploadedAt: string
}

/**
 * Subcontractor record.
 *
 * Top-level: `state.subs[]`.
 *
 * `projects[]` is currently a denormalised array on the sub. Phase 5
 * normalises to a `project_subcontractors` join table.
 */
export interface Subcontractor {
  id: SubcontractorId
  name: string
  trade: string
  contact: string
  phone: string
  email: string
  abn: string
  licence: string
  liabilityExp: string
  liabilityAmt: number
  wcExp: string
  swms: boolean
  rating: number
  notes: string
  projects: ProjectId[]
  /** Added Phase 1.5-E. Older subs in localStorage may not have this field. */
  certificates?: Certificate[]
}
