/**
 * File attachment shape used by supportingDocs (substantiation, Phase 1.5-A)
 * and certificates (insurance certs on subcontractors, Phase 1.5-E).
 *
 * Phase 4 keeps the dataUrl-in-state pattern for parity. Phase 5 replaces
 * dataUrl with a signed URL pointing at S3 / Supabase Storage; name + size
 * stay as denormalised metadata for fast list rendering.
 */
export interface FileAttachment {
  name: string
  dataUrl: string
  size: number
}
