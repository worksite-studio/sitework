import type { FileAttachment, Project } from '@/types'

/**
 * Phase 1.5-A substantiation guard. For cost-plus projects, every invoice
 * and every progress claim must carry at least one supporting document
 * before save is allowed.
 *
 * Fixed-price projects don't gate on docs — milestone verification covers it.
 *
 * Pulled into src/lib so the Invoice + Claim forms share the rule, and a
 * unit test pins the exact behaviour against the CONTRACTS_REFERENCE.md §7.4
 * spec without going through the UI.
 */
export interface SubstantiationCheck {
  blocked: boolean
  reason?: string
}

export function checkSubstantiation(
  project: Project,
  docs: FileAttachment[] | undefined,
): SubstantiationCheck {
  if (project.contractType !== 'cost-plus') return { blocked: false }
  const count = docs?.length ?? 0
  if (count > 0) return { blocked: false }
  return {
    blocked: true,
    reason: 'Cost-plus projects require at least one supporting document before save.',
  }
}
