import type { SupplierId } from './ids'

/**
 * Supplier catalogue entry. Currently referenced by Material.supId (true FK)
 * and Invoice.supplier / Purchase.supplier (string name — Phase 5 normalises).
 *
 * Top-level: `state.suppliers[]`.
 */
export interface Supplier {
  id: SupplierId
  name: string
  abn: string
  contact: string
  phone: string
  email: string
  address: string
}
