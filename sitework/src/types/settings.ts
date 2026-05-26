/**
 * Builder business settings.
 *
 * Schema is light in the legacy app — name, ABN, licence, Xero connection
 * metadata. Phase 4 keeps the shape loose to match; Phase 5 formalises
 * during the multi-builder backend port.
 */
export interface Settings {
  businessName?: string
  abn?: string
  licence?: string
  userName?: string
  /** Xero connection metadata — placeholder for Phase 6+ integration. */
  xero?: {
    connected: boolean
    tenantName?: string
  }
  [key: string]: unknown
}
