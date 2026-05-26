import type { MaterialId, SupplierId } from './ids'

/**
 * Material catalogue entry.
 *
 * Top-level: `state.materials[]`.
 */
export interface Material {
  id: MaterialId
  name: string
  cat: string
  unit: string
  price: number
  supId: SupplierId
  sku: string
}
