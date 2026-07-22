/**
 * Branded ID types. Phase 4 keeps the legacy `{PREFIX}-{NNN}` string format
 * (e.g. "PRJ-001", "INV-042"). Phase 5 swaps to UUIDs but keeps the human
 * display prefix in a `display_id` column.
 *
 * Branding gives us type safety without runtime cost — TypeScript prevents
 * passing a ClientId where a ProjectId is expected.
 */
type Brand<T, B> = T & { readonly __brand: B }

export type ProjectId = Brand<string, 'ProjectId'>
export type ClientId = Brand<string, 'ClientId'>
export type LeadId = Brand<string, 'LeadId'>
export type EstimateId = Brand<string, 'EstimateId'>
export type EstimateCodeId = Brand<string, 'EstimateCodeId'>
export type BoqTemplateId = Brand<string, 'BoqTemplateId'>
export type SubcontractorId = Brand<string, 'SubcontractorId'>
export type MaterialId = Brand<string, 'MaterialId'>
export type SupplierId = Brand<string, 'SupplierId'>
export type CostCodeId = Brand<string, 'CostCodeId'>
export type LineItemId = Brand<string, 'LineItemId'>
export type VariationId = Brand<string, 'VariationId'>
export type InvoiceId = Brand<string, 'InvoiceId'>
export type PurchaseId = Brand<string, 'PurchaseId'>
export type ProgressClaimId = Brand<string, 'ProgressClaimId'>
export type MilestoneId = Brand<string, 'MilestoneId'>
export type ScheduleTaskId = Brand<string, 'ScheduleTaskId'>
export type DiaryEntryId = Brand<string, 'DiaryEntryId'>
export type SelectionId = Brand<string, 'SelectionId'>
export type TimesheetId = Brand<string, 'TimesheetId'>
export type DefectId = Brand<string, 'DefectId'>
export type RfiId = Brand<string, 'RfiId'>
export type PrimeCostItemId = Brand<string, 'PrimeCostItemId'>
export type ProvisionalSumId = Brand<string, 'ProvisionalSumId'>
export type CertificateId = Brand<string, 'CertificateId'>

/**
 * Cast a raw string to a typed ID. Use at the boundary — when loading from
 * localStorage, parsing seed data, or constructing a fresh ID. Internal app
 * code should never need this; types flow through.
 */
export const asId = <T extends string>(raw: string): T => raw as T
