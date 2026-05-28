/**
 * Root reducer. Port of the legacy `Z1` reducer from the single-file app.
 *
 * 53 actions handled — see actions.ts for the discriminated union. Every
 * action is immutable (returns a new top-level state object). Per-project
 * keyed dicts are updated via small helpers below to keep the switch arms
 * readable.
 */

import type { ProjectId, ProgressClaim, Rfi, RootState } from '@/types'
import { asId } from '@/types'
import { type Action, assertNever } from './actions'

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Update a value in an array by predicate, returning a new array. */
function updateWhere<T>(arr: T[], pred: (item: T) => boolean, patch: Partial<T>): T[] {
  return arr.map((item) => (pred(item) ? { ...item, ...patch } : item))
}

/** Append to a per-project-keyed dict, creating the key if absent. */
function pushByProject<T>(
  dict: Record<string, T[] | undefined>,
  projectId: ProjectId,
  item: T,
): Record<string, T[] | undefined> {
  const existing = dict[projectId as string] ?? []
  return { ...dict, [projectId as string]: [...existing, item] }
}

/** Patch a value in a per-project-keyed dict array by predicate. */
function patchByProject<T>(
  dict: Record<string, T[] | undefined>,
  projectId: ProjectId,
  pred: (item: T) => boolean,
  patch: Partial<T>,
): Record<string, T[] | undefined> {
  const existing = dict[projectId as string] ?? []
  return { ...dict, [projectId as string]: updateWhere(existing, pred, patch) }
}

/** Filter a per-project-keyed dict array. */
function filterByProject<T>(
  dict: Record<string, T[] | undefined>,
  projectId: ProjectId,
  pred: (item: T) => boolean,
): Record<string, T[] | undefined> {
  const existing = dict[projectId as string] ?? []
  return { ...dict, [projectId as string]: existing.filter(pred) }
}

/** Update the project whose id matches. */
function updateProject(
  state: RootState,
  projectId: ProjectId,
  fn: (p: RootState['projects'][number]) => RootState['projects'][number],
): RootState {
  return {
    ...state,
    projects: state.projects.map((p) => (p.id === projectId ? fn(p) : p)),
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────

export function reducer(state: RootState, action: Action): RootState {
  switch (action.type) {
    // ─── Projects ─────────────────────────────────────────────────────────
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.project] }

    case 'UPDATE_PROJECT':
      return updateProject(state, action.projectId, (p) => ({ ...p, ...action.patch }))

    case 'DUPLICATE_PROJECT': {
      const src = state.projects.find((p) => p.id === action.projectId)
      if (!src) return state
      const newId = asId<ProjectId>(`PRJ-DUP-${Date.now()}`)
      const clone: typeof src = { ...src, id: newId, name: action.newName }
      return { ...state, projects: [...state.projects, clone] }
    }

    // ─── Cost codes (nested in Project) ───────────────────────────────────
    case 'ADD_CODE':
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        codes: [...p.codes, action.code],
      }))

    case 'UPDATE_CODE':
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        codes: updateWhere(p.codes, (c) => c.id === action.codeId, action.patch),
      }))

    case 'DELETE_CODE':
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        codes: p.codes.filter((c) => c.id !== action.codeId),
      }))

    case 'MOVE_CODE_UP':
    case 'MOVE_CODE_DOWN':
      return updateProject(state, action.projectId, (p) => {
        const idx = p.codes.findIndex((c) => c.id === action.codeId)
        if (idx < 0) return p
        const target = action.type === 'MOVE_CODE_UP' ? idx - 1 : idx + 1
        if (target < 0 || target >= p.codes.length) return p
        const next = [...p.codes]
        const a = next[idx]
        const b = next[target]
        if (!a || !b) return p
        next[idx] = b
        next[target] = a
        return { ...p, codes: next }
      })

    case 'IMPORT_TEMPLATE_INTO_BOQ': {
      const tpl = state.templates.find((t) => t.id === action.templateId)
      if (!tpl) return state
      return updateProject(state, action.projectId, (p) => {
        const existing = new Set(p.codes.map((c) => c.code))
        const newCodes = tpl.codes
          .filter((tc) => !existing.has(tc.code))
          .map((tc, i) => ({
            id: asId<(typeof p.codes)[number]['id']>(`CC-${Date.now()}-${i}`),
            code: tc.code,
            desc: tc.desc,
            budget: 0,
            committed: 0,
            actual: 0,
            vars: 0,
          }))
        return { ...p, codes: [...p.codes, ...newCodes] }
      })
    }

    // ─── Line items ───────────────────────────────────────────────────────
    case 'ADD_LINE_ITEM':
      return updateProject(state, action.projectId, (p) => {
        const ccKey = action.ccId as string
        const existing = p.lineItems[ccKey] ?? []
        return {
          ...p,
          lineItems: { ...p.lineItems, [ccKey]: [...existing, action.lineItem] },
        }
      })

    // ─── Variations ───────────────────────────────────────────────────────
    case 'ADD_VARIATION':
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        variations: [...p.variations, action.variation],
      }))

    case 'UPDATE_VARIATION':
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        variations: updateWhere(p.variations, (v) => v.id === action.variationId, action.patch),
      }))

    // ─── Invoices ─────────────────────────────────────────────────────────
    case 'ADD_INVOICE':
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        invoices: [...p.invoices, action.invoice],
      }))

    case 'UPDATE_INVOICE':
      return updateProject(state, action.projectId, (p) => ({
        ...p,
        invoices: updateWhere(p.invoices, (i) => i.id === action.invoiceId, action.patch),
      }))

    // ─── Purchases / POs ──────────────────────────────────────────────────
    case 'ADD_PURCHASE':
      return {
        ...state,
        purchases: pushByProject(state.purchases, action.projectId, action.purchase),
      }

    case 'RECEIVE_PURCHASE':
      return {
        ...state,
        purchases: patchByProject(
          state.purchases,
          action.projectId,
          (po) => po.id === action.purchaseId,
          { status: 'received', receivedDate: action.receivedDate },
        ),
      }

    // ─── Progress claims ──────────────────────────────────────────────────
    case 'ADD_CLAIM': {
      // Auto-fill claimNo if missing (session 28 — see WORKFLOW §8 scope note).
      const existing = state.claims[action.projectId as string] ?? []
      const nextNo = existing.reduce((max, c) => Math.max(max, c.claimNo || 0), 0) + 1
      const claim: ProgressClaim = { ...action.claim, claimNo: action.claim.claimNo || nextNo }
      return { ...state, claims: pushByProject(state.claims, action.projectId, claim) }
    }

    case 'UPDATE_CLAIM':
      return {
        ...state,
        claims: patchByProject(
          state.claims,
          action.projectId,
          (c) => c.id === action.claimId,
          action.patch,
        ),
      }

    // ─── PC / PS items ────────────────────────────────────────────────────
    case 'ADD_PC_ITEM':
      return {
        ...state,
        primeCostItems: pushByProject(state.primeCostItems, action.projectId, action.item),
      }

    case 'UPDATE_PC_ITEM':
      return {
        ...state,
        primeCostItems: patchByProject(
          state.primeCostItems,
          action.projectId,
          (pc) => pc.id === action.itemId,
          action.patch,
        ),
      }

    case 'DELETE_PC_ITEM':
      return {
        ...state,
        primeCostItems: filterByProject(
          state.primeCostItems,
          action.projectId,
          (pc) => pc.id !== action.itemId,
        ),
      }

    case 'ADD_PS_ITEM':
      return {
        ...state,
        provisionalSums: pushByProject(state.provisionalSums, action.projectId, action.item),
      }

    case 'UPDATE_PS_ITEM':
      return {
        ...state,
        provisionalSums: patchByProject(
          state.provisionalSums,
          action.projectId,
          (ps) => ps.id === action.itemId,
          action.patch,
        ),
      }

    case 'DELETE_PS_ITEM':
      return {
        ...state,
        provisionalSums: filterByProject(
          state.provisionalSums,
          action.projectId,
          (ps) => ps.id !== action.itemId,
        ),
      }

    // ─── Retention ────────────────────────────────────────────────────────
    case 'UPDATE_RETENTION': {
      const key = action.projectId as string
      const existing = state.retention[key] ?? { rate: 0.05 }
      return {
        ...state,
        retention: { ...state.retention, [key]: { ...existing, ...action.patch } },
      }
    }

    // ─── Diary / Defects / Selections / Timesheets ────────────────────────
    case 'ADD_DIARY_ENTRY':
      return { ...state, diary: pushByProject(state.diary, action.projectId, action.entry) }

    case 'ADD_DEFECT':
      return { ...state, defects: pushByProject(state.defects, action.projectId, action.defect) }

    case 'UPDATE_DEFECT':
      return {
        ...state,
        defects: patchByProject(
          state.defects,
          action.projectId,
          (d) => d.id === action.defectId,
          action.patch,
        ),
      }

    case 'ADD_SELECTION':
      return {
        ...state,
        selections: pushByProject(state.selections, action.projectId, action.selection),
      }

    case 'APPROVE_SELECTION':
      return {
        ...state,
        selections: patchByProject(
          state.selections,
          action.projectId,
          (s) => s.id === action.selectionId,
          { status: 'approved', approvedOption: action.approvedOption },
        ),
      }

    case 'ADD_TIMESHEET':
      return {
        ...state,
        timesheets: pushByProject(state.timesheets, action.projectId, action.timesheet),
      }

    case 'DELETE_TIMESHEET':
      return {
        ...state,
        timesheets: filterByProject(
          state.timesheets,
          action.projectId,
          (t) => t.id !== action.timesheetId,
        ),
      }

    // ─── Milestones (new in Phase 4) ──────────────────────────────────────
    case 'ADD_MILESTONE':
      return {
        ...state,
        milestones: pushByProject(state.milestones, action.projectId, action.milestone),
      }

    case 'UPDATE_MILESTONE':
      return {
        ...state,
        milestones: patchByProject(
          state.milestones,
          action.projectId,
          (m) => m.id === action.milestoneId,
          action.patch,
        ),
      }

    // ─── RFIs (new in Phase 4) ────────────────────────────────────────────
    case 'ADD_RFI': {
      // Auto-fill rfiNo if missing — same pattern as ADD_CLAIM.
      const existing = state.rfis[action.projectId as string] ?? []
      const nextNo = existing.reduce((max, r) => Math.max(max, r.rfiNo || 0), 0) + 1
      const rfi: Rfi = { ...action.rfi, rfiNo: action.rfi.rfiNo || nextNo }
      return { ...state, rfis: pushByProject(state.rfis, action.projectId, rfi) }
    }

    case 'UPDATE_RFI':
      return {
        ...state,
        rfis: patchByProject(
          state.rfis,
          action.projectId,
          (r) => r.id === action.rfiId,
          action.patch,
        ),
      }

    // ─── Subs / Clients / Leads ───────────────────────────────────────────
    case 'ADD_SUB':
      return { ...state, subs: [...state.subs, action.sub] }

    case 'UPDATE_SUB':
      return { ...state, subs: updateWhere(state.subs, (s) => s.id === action.subId, action.patch) }

    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.client] }

    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: updateWhere(state.clients, (c) => c.id === action.clientId, action.patch),
      }

    case 'ADD_LEAD':
      return { ...state, leads: [...state.leads, action.lead] }

    case 'UPDATE_LEAD':
      return {
        ...state,
        leads: updateWhere(state.leads, (l) => l.id === action.leadId, action.patch),
      }

    case 'CONVERT_LEAD_TO_PROJECT': {
      const nextLeads = updateWhere(state.leads, (l) => l.id === action.leadId, { stage: 'won' })
      const nextProjects = [...state.projects, action.project]
      const nextClients = action.client ? [...state.clients, action.client] : state.clients
      return { ...state, leads: nextLeads, projects: nextProjects, clients: nextClients }
    }

    // ─── Materials / Suppliers (new in Phase 4) ───────────────────────────
    case 'ADD_MATERIAL':
      return { ...state, materials: [...state.materials, action.material] }

    case 'UPDATE_MATERIAL':
      return {
        ...state,
        materials: updateWhere(state.materials, (m) => m.id === action.materialId, action.patch),
      }

    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.supplier] }

    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: updateWhere(state.suppliers, (s) => s.id === action.supplierId, action.patch),
      }

    // ─── Estimates ────────────────────────────────────────────────────────
    case 'ADD_ESTIMATE':
      return { ...state, estimates: [...state.estimates, action.estimate] }

    case 'UPDATE_ESTIMATE':
      return {
        ...state,
        estimates: updateWhere(state.estimates, (e) => e.id === action.estimateId, action.patch),
      }

    case 'ADD_EST_CODE':
      return {
        ...state,
        estimates: state.estimates.map((e) =>
          e.id === action.estimateId ? { ...e, codes: [...e.codes, action.code] } : e,
        ),
      }

    case 'CREATE_ESTIMATE_FROM_TEMPLATE': {
      const tpl = state.templates.find((t) => t.id === action.templateId)
      if (!tpl) return state
      const newEst: (typeof state.estimates)[number] = {
        id: asId(`EST-${Date.now()}`),
        name: action.name,
        clientId: asId(''),
        address: '',
        status: 'draft',
        createdDate: new Date().toISOString().slice(0, 10),
        margin: 0,
        codes: tpl.codes.map((tc, i) => ({
          id: asId(`EC-${Date.now()}-${i}`),
          code: tc.code,
          desc: tc.desc,
          budget: Math.round((action.contractValue * tc.pct) / 100),
        })),
      }
      return { ...state, estimates: [...state.estimates, newEst] }
    }

    case 'PROMOTE_ESTIMATE': {
      const est = state.estimates.find((e) => e.id === action.estimateId)
      if (!est) return state
      const newProject: (typeof state.projects)[number] = {
        id: asId(`PRJ-${Date.now()}`),
        name: action.projectName,
        clientId: est.clientId,
        address: est.address,
        status: 'live',
        startDate: new Date().toISOString().slice(0, 10),
        margin: est.margin,
        contractType: 'cost-plus',
        state: 'NSW',
        contractForm: 'HIA',
        contractClassification: 'Domestic',
        estimatedValue: 0,
        isRenovationWithUnknownCost: false,
        qldHwsAcknowledged: false,
        codes: est.codes.map((ec, i) => ({
          id: asId(`CC-${Date.now()}-${i}`),
          code: ec.code,
          desc: ec.desc,
          budget: ec.budget,
          committed: 0,
          actual: 0,
          vars: 0,
        })),
        variations: [],
        invoices: [],
        lineItems: {},
      }
      return { ...state, projects: [...state.projects, newProject] }
    }

    // ─── Settings (new in Phase 4) ────────────────────────────────────────
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    default:
      return assertNever(action)
  }
}
