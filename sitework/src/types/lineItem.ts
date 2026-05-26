import type { LineItemId, MaterialId, SupplierId } from './ids'

/**
 * Line item — nested under a cost code. Granular breakdown of CC scope.
 *
 * Stored on the project as `{[ccId]: LineItem[]}` map (legacy shape).
 * Phase 5 flattens to a `line_items` table with a `cost_code_id` FK column.
 */
export interface LineItem {
  id: LineItemId
  desc: string
  qty: number
  unit: string
  rate: number
  matId: MaterialId | null
  supId: SupplierId | null
}
