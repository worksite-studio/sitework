import type { AustralianState, ContractType } from '@/types'

/**
 * Statutory rules for project creation/editing — port of the legacy `I0`
 * form's inline logic (Phase 0-H, session 23). Pure functions in the
 * `substantiation.ts` mould so the rules are testable and the form can't
 * drift from them. All user-facing copy is verbatim from the baseline
 * (`legacy/index.html`) — see CONTRACTS_REFERENCE.md for the legal source.
 *
 * WA note: the baseline stores WA as a state and shows its deposit-cap
 * text; the s.14 contract-title injection was deferred to the PDF layer
 * in the legacy app too, so there is deliberately no WA gate here.
 */

export interface StatutoryInputs {
  state: AustralianState
  contractType: ContractType
  /** Parsed estimated value in dollars (cost-plus only; 0 when blank). */
  estimatedValue: number
  isRenovationWithUnknownCost: boolean
  qldHwsAcknowledged: boolean
}

export const VIC_S13_THRESHOLD = 1_000_000

/**
 * VIC DBCA s.13: cost-plus domestic building contracts under $1m are
 * prohibited unless the renovation/unknown-cost exemption applies.
 * A blocked project cannot be saved.
 */
export function vicS13Blocked(
  p: Pick<
    StatutoryInputs,
    'state' | 'contractType' | 'estimatedValue' | 'isRenovationWithUnknownCost'
  >,
): boolean {
  return (
    p.state === 'VIC' &&
    p.contractType === 'cost-plus' &&
    (p.estimatedValue || 0) < VIC_S13_THRESHOLD &&
    !p.isRenovationWithUnknownCost
  )
}

/**
 * QLD: cost-plus disqualifies the owner from QBCC HWS non-completion
 * protection — the builder must acknowledge on the owner's behalf before
 * the project can be saved.
 */
export function qldHwsAckRequired(
  p: Pick<StatutoryInputs, 'state' | 'contractType' | 'qldHwsAcknowledged'>,
): boolean {
  return p.state === 'QLD' && p.contractType === 'cost-plus' && !p.qldHwsAcknowledged
}

const DEPOSIT_CAP_TEXT: Record<AustralianState, string> = {
  NSW: 'NSW: max 10% of contract or $20,000, whichever is less (HBA 1989)',
  VIC: 'VIC: max 10% if contract under $20k, 5% if $20k or more (DBCA 1995)',
  WA: 'WA: max 6.5% of total contract value as deposit (before work begins, HBCA s.13)',
  QLD: 'QLD: max 5% if contract $20k+, 10% if under (QBCC Act Sch 1B)',
  SA: 'SA: standard 5% deposit convention (Building Work Contractors Act 1995)',
  TAS: 'TAS: confirm deposit cap with Consumer Building and Occupational Services (Residential Building Work Contracts Act 2016)',
  ACT: 'ACT: confirm deposit cap with Construction Occupations Registrar (Building Act 2004)',
  NT: 'NT: confirm deposit cap with NT Consumer Affairs (Building Act 1993); non-uniform SOP regime applies',
}

/** Per-state deposit-cap helper line shown under the state select. */
export function depositCapText(state: string): string {
  return DEPOSIT_CAP_TEXT[state as AustralianState] || 'Confirm against current state regulation'
}

// ─── Verbatim baseline copy ────────────────────────────────────────────────

export const VIC_S13_BANNER =
  'VIC cost-plus restriction (DBCA s.13): only permitted for contracts ≥ $1m, OR renovation where cost cannot be calculated without doing some of the work. Increase estimated value, switch contract type, or tick the renovation flag.'

export const VIC_RENO_LABEL =
  'This is a renovation/restoration where cost cannot be calculated without doing some of the work (VIC DBCA s.13 exemption)'

export const QLD_HWS_WARNING =
  'QLD: cost-plus contracts disqualify the owner from QBCC Home Warranty Scheme non-completion protection.'

export const QLD_HWS_ACK_LABEL = 'I acknowledge this consequence on behalf of the owner.'
