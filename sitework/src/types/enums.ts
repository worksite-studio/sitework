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

/** 'planning' is what legacy `Z1` assigns to a DUPLICATE_PROJECT copy. */
export type ProjectStatus = 'live' | 'quoted' | 'planning' | 'complete' | 'on-hold' | 'cancelled'

/** Legacy `G1` pipeline columns — 'quoted' restored in R5 (PARITY gap 15). */
export type LeadStage = 'prospect' | 'tendering' | 'quoted' | 'won' | 'lost'

export type EstimateStatus = 'draft' | 'sent' | 'won' | 'lost'

export type VariationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Disputed'

/** 'Other' restored in R6 — legacy `v1` offers it with a conditional comment. */
export type VariationReasonCategory =
  | 'OwnerRequested'
  | 'LatentCondition'
  | 'Regulatory'
  | 'DesignClarification'
  | 'BuilderFault'
  | 'Other'

/** Legacy `v1` Requested By options (default Owner) — PARITY gap 4. */
export type VariationRequestedBy = 'Owner' | 'Builder' | 'Architect' | 'Other'

export type InvoiceStatus = 'Pending' | 'Approved' | 'Paid' | 'Disputed'

/**
 * Legacy baseline statuses: new POs start 'pending' (`POFormV2` has no status
 * field), seed carries 'ordered'/'received', RECEIVE shows on anything that
 * isn't received/cancelled. 'draft' / 'sent' are deprecated port-era values
 * retained only so persisted pre-R2 state still typechecks.
 */
export type PurchaseStatus = 'pending' | 'ordered' | 'received' | 'cancelled' | 'draft' | 'sent'

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
