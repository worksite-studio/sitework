/**
 * Enum-like string literal unions. Values match the legacy app's seed data
 * verbatim so the seed object types check without transformation.
 *
 * Note on casing: the legacy app uses kebab-case for contractType
 * ("cost-plus", "fixed-price") while CONTRACTS_REFERENCE.md §10 specifies
 * PascalCase ("CostPlus", "FixedPrice"). Phase 5 standardises during the
 * Postgres migration; Phase 4 preserves the kebab-case status quo.
 */

export type ContractType = 'cost-plus' | 'fixed-price'

export type ContractForm =
  | 'HIA'
  | 'MBA'
  | 'FairTradingNSW'
  | 'QBCCL1'
  | 'QBCCL2'
  | 'ABICMW'
  | 'ABICSW'
  | 'AS4000'
  | 'AS4902'
  | 'Custom'

export type ContractClassification = 'Domestic' | 'Commercial'

export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT'

export type ProjectStatus = 'live' | 'quoted' | 'complete' | 'on-hold' | 'cancelled'

export type LeadStage = 'prospect' | 'tendering' | 'won' | 'lost'

export type EstimateStatus = 'draft' | 'sent' | 'won' | 'lost'

export type VariationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Disputed'

export type VariationReasonCategory =
  | 'OwnerRequested'
  | 'LatentCondition'
  | 'Regulatory'
  | 'DesignClarification'
  | 'BuilderFault'

export type InvoiceStatus = 'Pending' | 'Approved' | 'Paid' | 'Disputed'

/**
 * Legacy baseline statuses are 'ordered' | 'received' | 'cancelled' (the
 * seed data uses 'ordered'/'received'). 'draft' / 'sent' are port-era values
 * kept only until the R2 PO-table rebuild retires them (PARITY.md).
 */
export type PurchaseStatus = 'draft' | 'sent' | 'ordered' | 'received' | 'cancelled'

export type ProgressClaimStatus = 'Draft' | 'Issued' | 'Pending' | 'Approved' | 'Paid' | 'Disputed'

export type MilestoneStatus = 'upcoming' | 'in-progress' | 'complete' | 'delayed'

export type SelectionStatus = 'pending' | 'approved' | 'declined'

export type DefectStatus = 'Open' | 'Rectified' | 'Disputed'

export type RfiStatus = 'Open' | 'Closed' | 'Overdue'

export type PrimeCostItemStatus = 'Pending' | 'Selected' | 'Procured' | 'Reconciled'

export type ProvisionalSumStatus = 'Pending' | 'InProgress' | 'Complete' | 'Reconciled'

export type CertificateType = 'PL' | 'WC' | 'PI' | 'Licence' | 'Other'

export type SopActState = '' | AustralianState

export type BoqTemplateCategory = 'residential' | 'commercial'
