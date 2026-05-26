import type { ClientId, ProjectId } from './ids'
import type {
  AustralianState,
  ContractClassification,
  ContractForm,
  ContractType,
  ProjectStatus,
} from './enums'
import type { CostCode } from './costCode'
import type { LineItem } from './lineItem'
import type { Variation } from './variation'
import type { Invoice } from './invoice'

/**
 * Project — the central entity. Everything attaches to a project either
 * by FK (top-level entities like Subcontractor.projects[]) or by being
 * nested directly (codes, variations, invoices, lineItems) or by being
 * per-project-keyed (claims, purchases, milestones, etc. — see RootState).
 *
 * state / contractForm / contractClassification / estimatedValue /
 * isRenovationWithUnknownCost / qldHwsAcknowledged added Phase 0-H.
 *
 * Phase 5 schema additions (CONTRACTS_REFERENCE.md §10) tracked as TODOs.
 */
export interface Project {
  id: ProjectId
  name: string
  clientId: ClientId
  address: string
  status: ProjectStatus
  startDate: string
  /** Builder's target margin, percent. */
  margin: number
  contractType: ContractType
  state: AustralianState
  contractForm: ContractForm
  contractClassification: ContractClassification
  /** Cost-plus only — the fair-and-reasonable estimate. */
  estimatedValue: number
  /** VIC s.13 exemption flag. */
  isRenovationWithUnknownCost: boolean
  /** QBCC home warranty scheme consequence acknowledged. */
  qldHwsAcknowledged: boolean

  // Nested collections
  codes: CostCode[]
  variations: Variation[]
  invoices: Invoice[]
  /** Line items keyed by CostCodeId. Sparse — only CCs with line items appear. */
  lineItems: Record<string, LineItem[]>

  // TODO: Phase 5 — add contractValue, completionDate, practicalCompletionDate,
  //                  defectsLiabilityPeriod, retentionRate, retentionCap,
  //                  hbcfCertificateNumber, hbcfProvidedDate
}
