import type { AustralianState, ContractType } from './enums'

/**
 * Builder business settings — full legacy `St1` field set (R4, PARITY
 * gap 2): business identity, project defaults (seed the project form the
 * way legacy `I0` read `sw_ct`/`sw_state`), state-keyed builder licences
 * and the nine insurance-scheme registration numbers.
 */
export interface Settings {
  businessName?: string
  userName?: string
  abn?: string
  /** Pre-R4 single licence field — superseded by `licences`, kept for old data. */
  licence?: string
  /** Default contract type for new projects — legacy `sw_ct`. */
  defaultContractType?: ContractType
  /** Default margin %, legacy `sw_margin` (display default 15). */
  defaultMarginPct?: number
  /** Legacy `sw_gst` — "Registered for GST" (default true). */
  gstRegistered?: boolean
  /** Home state for new projects — legacy `sw_state` (default NSW). */
  homeState?: AustralianState
  /** Builder licence numbers keyed by state — legacy `sw_licence_*`. */
  licences?: Partial<Record<AustralianState, string>>
  /**
   * Insurance registration numbers — legacy `sw_hbcf` … `sw_ntins`.
   * TAS/NT have no mandatory scheme; fields exist for voluntary cover.
   */
  insurance?: {
    hbcf?: string
    dbi?: string
    vba?: string
    qbcc?: string
    hii?: string
    bii?: string
    actf?: string
    tasins?: string
    ntins?: string
  }
  /** Xero connection metadata — placeholder for Phase 6+ integration. */
  xero?: {
    connected: boolean
    tenantName?: string
  }
  [key: string]: unknown
}
