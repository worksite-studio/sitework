import type { ClientId } from './ids'

/**
 * Client — property owner (residential) or principal (commercial).
 *
 * Top-level: `state.clients[]`.
 */
export interface Client {
  id: ClientId
  name: string
  abn: string
  contact: string
  phone: string
  email: string
  address: string
}
