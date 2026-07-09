import { describe, it, expect } from 'vitest'
import { reducer } from './reducer'
import type { Action } from './actions'
import { asId } from '@/types'
import type {
  Client,
  ClientId,
  CostCode,
  CostCodeId,
  Defect,
  DiaryEntry,
  Estimate,
  EstimateId,
  Invoice,
  Lead,
  LeadId,
  LineItem,
  Material,
  MaterialId,
  Milestone,
  PrimeCostItem,
  ProgressClaim,
  Project,
  ProjectId,
  ProvisionalSum,
  Purchase,
  Rfi,
  RootState,
  Selection,
  Subcontractor,
  SubcontractorId,
  Supplier,
  SupplierId,
  Timesheet,
  Variation,
} from '@/types'

// ─── Test fixtures ──────────────────────────────────────────────────────

const P1 = asId<ProjectId>('PRJ-001')
const CC1 = asId<CostCodeId>('CC-001')
const CC2 = asId<CostCodeId>('CC-002')

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: P1,
    name: 'Test Project',
    clientId: asId<ClientId>('CLI-001'),
    address: '1 Test St',
    status: 'live',
    startDate: '2026-01-01',
    margin: 15,
    contractType: 'cost-plus',
    state: 'NSW',
    contractForm: 'HIA',
    contractClassification: 'Domestic',
    estimatedValue: 0,
    isRenovationWithUnknownCost: false,
    qldHwsAcknowledged: false,
    codes: [
      { id: CC1, code: '001', desc: 'First', budget: 1000, committed: 0, actual: 0, vars: 0 },
      { id: CC2, code: '002', desc: 'Second', budget: 2000, committed: 0, actual: 0, vars: 0 },
    ],
    variations: [],
    invoices: [],
    lineItems: {},
    ...overrides,
  }
}

function emptyState(overrides: Partial<RootState> = {}): RootState {
  return {
    projects: [],
    clients: [],
    subs: [],
    leads: [],
    estimates: [],
    materials: [],
    suppliers: [],
    templates: [],
    milestones: {},
    diary: {},
    timesheets: {},
    defects: {},
    selections: {},
    claims: {},
    purchases: {},
    primeCostItems: {},
    provisionalSums: {},
    rfis: {},
    retention: {},
    settings: {},
    ...overrides,
  }
}

function stateWithProject(overrides: Partial<Project> = {}): RootState {
  return emptyState({ projects: [makeProject(overrides)] })
}

// Reducer must never mutate its input.
function expectImmutable(before: RootState, action: Action) {
  const snapshot = JSON.stringify(before)
  reducer(before, action)
  expect(JSON.stringify(before)).toBe(snapshot)
}

// ─── Projects ─────────────────────────────────────────────────────────────

describe('projects', () => {
  it('ADD_PROJECT appends', () => {
    const s = reducer(emptyState(), { type: 'ADD_PROJECT', project: makeProject() })
    expect(s.projects).toHaveLength(1)
    expect(s.projects[0]!.id).toBe(P1)
  })

  it('UPDATE_PROJECT merges patch', () => {
    const s = reducer(stateWithProject(), {
      type: 'UPDATE_PROJECT',
      projectId: P1,
      patch: { name: 'Renamed', margin: 20 },
    })
    expect(s.projects[0]!.name).toBe('Renamed')
    expect(s.projects[0]!.margin).toBe(20)
    expect(s.projects[0]!.address).toBe('1 Test St') // untouched
  })

  it('UPDATE_PROJECT on missing id is a no-op', () => {
    const s = reducer(stateWithProject(), {
      type: 'UPDATE_PROJECT',
      projectId: asId<ProjectId>('PRJ-999'),
      patch: { name: 'X' },
    })
    expect(s.projects[0]!.name).toBe('Test Project')
  })

  it('DUPLICATE_PROJECT clones with new id + name', () => {
    const s = reducer(stateWithProject(), {
      type: 'DUPLICATE_PROJECT',
      projectId: P1,
      newName: 'Copy',
    })
    expect(s.projects).toHaveLength(2)
    expect(s.projects[1]!.name).toBe('Copy')
    expect(s.projects[1]!.id).not.toBe(P1)
  })

  it('DUPLICATE_PROJECT copy starts at planning with money history cleared (legacy Z1)', () => {
    const s = reducer(stateWithProject(), {
      type: 'DUPLICATE_PROJECT',
      projectId: P1,
      newName: 'Copy',
    })
    const copy = s.projects[1]!
    expect(copy.status).toBe('planning')
    expect(copy.invoices).toEqual([])
    expect(copy.variations).toEqual([])
    // Codes / budgets carry over untouched.
    expect(copy.codes).toEqual(s.projects[0]!.codes)
  })

  it('ADD_PROJECT does not mutate input', () => {
    expectImmutable(emptyState(), { type: 'ADD_PROJECT', project: makeProject() })
  })
})

// ─── Cost codes ─────────────────────────────────────────────────────────

describe('cost codes', () => {
  const newCode: CostCode = {
    id: asId<CostCodeId>('CC-003'),
    code: '003',
    desc: 'Third',
    budget: 500,
    committed: 0,
    actual: 0,
    vars: 0,
  }

  it('ADD_CODE appends to project.codes', () => {
    const s = reducer(stateWithProject(), { type: 'ADD_CODE', projectId: P1, code: newCode })
    expect(s.projects[0]!.codes).toHaveLength(3)
  })

  it('UPDATE_CODE patches a code', () => {
    const s = reducer(stateWithProject(), {
      type: 'UPDATE_CODE',
      projectId: P1,
      codeId: CC1,
      patch: { budget: 9999 },
    })
    expect(s.projects[0]!.codes.find((c) => c.id === CC1)!.budget).toBe(9999)
  })

  it('DELETE_CODE removes a code', () => {
    const s = reducer(stateWithProject(), { type: 'DELETE_CODE', projectId: P1, codeId: CC1 })
    expect(s.projects[0]!.codes.map((c) => c.id)).toEqual([CC2])
  })

  it('MOVE_CODE_UP swaps with predecessor', () => {
    const s = reducer(stateWithProject(), { type: 'MOVE_CODE_UP', projectId: P1, codeId: CC2 })
    expect(s.projects[0]!.codes.map((c) => c.id)).toEqual([CC2, CC1])
  })

  it('MOVE_CODE_UP on first code is a no-op', () => {
    const s = reducer(stateWithProject(), { type: 'MOVE_CODE_UP', projectId: P1, codeId: CC1 })
    expect(s.projects[0]!.codes.map((c) => c.id)).toEqual([CC1, CC2])
  })

  it('MOVE_CODE_DOWN swaps with successor', () => {
    const s = reducer(stateWithProject(), { type: 'MOVE_CODE_DOWN', projectId: P1, codeId: CC1 })
    expect(s.projects[0]!.codes.map((c) => c.id)).toEqual([CC2, CC1])
  })

  it('MOVE_CODE_DOWN on last code is a no-op', () => {
    const s = reducer(stateWithProject(), { type: 'MOVE_CODE_DOWN', projectId: P1, codeId: CC2 })
    expect(s.projects[0]!.codes.map((c) => c.id)).toEqual([CC1, CC2])
  })
})

describe('IMPORT_TEMPLATE_INTO_BOQ', () => {
  const baseTemplate = {
    id: asId<import('@/types').BoqTemplateId>('TPL-001'),
    name: 'Resi',
    desc: '',
    icon: 'new',
    type: 'residential' as const,
    codes: [
      { code: '001', desc: 'Prelims', pct: 5 },
      { code: '999', desc: 'New code', pct: 10 },
    ],
  }

  it('appends only codes whose code string is not already present (dedupe)', () => {
    const s = reducer(stateWithProject({}), {
      type: 'IMPORT_TEMPLATE_INTO_BOQ',
      projectId: P1,
      templateId: baseTemplate.id,
    })
    // No templates in state → no-op
    expect(s.projects[0]!.codes).toHaveLength(2)
  })

  it('imports new codes from a template present in state', () => {
    const base = stateWithProject({})
    const withTpl: RootState = { ...base, templates: [baseTemplate] }
    const s = reducer(withTpl, {
      type: 'IMPORT_TEMPLATE_INTO_BOQ',
      projectId: P1,
      templateId: baseTemplate.id,
    })
    // '001' already exists, '999' is new → one added
    expect(s.projects[0]!.codes).toHaveLength(3)
    expect(s.projects[0]!.codes.some((c) => c.code === '999')).toBe(true)
  })
})

// ─── Line items ───────────────────────────────────────────────────────────

describe('ADD_LINE_ITEM', () => {
  it('creates the cc bucket and appends', () => {
    const li: LineItem = {
      id: asId('LI-001'),
      desc: 'Labour',
      qty: 1,
      unit: 'allow',
      rate: 500,
      matId: null,
      supId: null,
    }
    const s = reducer(stateWithProject(), {
      type: 'ADD_LINE_ITEM',
      projectId: P1,
      ccId: CC1,
      lineItem: li,
    })
    expect(s.projects[0]!.lineItems[CC1 as string]).toHaveLength(1)
  })
})

// ─── Variations ─────────────────────────────────────────────────────────

describe('variations', () => {
  const v: Variation = {
    id: asId('VO-001'),
    ccId: CC1,
    desc: 'Extra',
    amount: 1200,
    status: 'Pending',
    date: '2026-02-01',
    reasonCategory: 'OwnerRequested',
    timeImpactDays: 0,
  }

  it('ADD_VARIATION appends', () => {
    const s = reducer(stateWithProject(), { type: 'ADD_VARIATION', projectId: P1, variation: v })
    expect(s.projects[0]!.variations).toHaveLength(1)
  })

  it('UPDATE_VARIATION patches status', () => {
    const s0 = reducer(stateWithProject(), { type: 'ADD_VARIATION', projectId: P1, variation: v })
    const s = reducer(s0, {
      type: 'UPDATE_VARIATION',
      projectId: P1,
      variationId: v.id,
      patch: { status: 'Approved' },
    })
    expect(s.projects[0]!.variations[0]!.status).toBe('Approved')
  })
})

// ─── Invoices ─────────────────────────────────────────────────────────────

describe('invoices', () => {
  const inv: Invoice = {
    id: asId('INV-001'),
    ccId: CC1,
    supplier: 'Acme',
    amount: 500,
    status: 'Pending',
    date: '2026-02-01',
    due: '2026-03-01',
    xero: false,
  }

  it('ADD_INVOICE appends', () => {
    const s = reducer(stateWithProject(), { type: 'ADD_INVOICE', projectId: P1, invoice: inv })
    expect(s.projects[0]!.invoices).toHaveLength(1)
  })

  it('UPDATE_INVOICE patches status', () => {
    const s0 = reducer(stateWithProject(), { type: 'ADD_INVOICE', projectId: P1, invoice: inv })
    const s = reducer(s0, {
      type: 'UPDATE_INVOICE',
      projectId: P1,
      invoiceId: inv.id,
      patch: { status: 'Paid' },
    })
    expect(s.projects[0]!.invoices[0]!.status).toBe('Paid')
  })
})

// ─── Purchases ────────────────────────────────────────────────────────────

describe('purchases', () => {
  const po: Purchase = {
    id: asId('PO-001'),
    ccId: CC1,
    supplier: 'Acme',
    desc: 'Materials',
    amount: 800,
    status: 'sent',
    date: '2026-02-01',
    dueDate: '2026-03-01',
    receivedDate: null,
    notes: '',
  }

  it('ADD_PURCHASE creates the project bucket', () => {
    const s = reducer(emptyState(), { type: 'ADD_PURCHASE', projectId: P1, purchase: po })
    expect(s.purchases[P1 as string]).toHaveLength(1)
  })

  it('RECEIVE_PURCHASE sets status + receivedDate', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_PURCHASE', projectId: P1, purchase: po })
    const s = reducer(s0, {
      type: 'RECEIVE_PURCHASE',
      projectId: P1,
      purchaseId: po.id,
      receivedDate: '2026-03-15',
    })
    expect(s.purchases[P1 as string]![0]!.status).toBe('received')
    expect(s.purchases[P1 as string]![0]!.receivedDate).toBe('2026-03-15')
  })
})

// ─── Progress claims ──────────────────────────────────────────────────────

describe('progress claims', () => {
  const claim = (n: number, id: string): ProgressClaim => ({
    id: asId(id),
    claimNo: n,
    desc: `Claim ${n}`,
    date: '2026-02-01',
    due: '2026-03-01',
    amount: 1000,
    status: 'Draft',
    notes: '',
    madeUnderSOPAct: false,
    sopActState: '',
  })

  it('ADD_CLAIM appends', () => {
    const s = reducer(emptyState(), {
      type: 'ADD_CLAIM',
      projectId: P1,
      claim: claim(1, 'CLM-001'),
    })
    expect(s.claims[P1 as string]).toHaveLength(1)
  })

  it('ADD_CLAIM auto-fills claimNo when 0/missing', () => {
    const c = { ...claim(0, 'CLM-001'), claimNo: 0 }
    const s = reducer(emptyState(), { type: 'ADD_CLAIM', projectId: P1, claim: c })
    expect(s.claims[P1 as string]![0]!.claimNo).toBe(1)
  })

  it('ADD_CLAIM increments claimNo against existing claims', () => {
    const s0 = reducer(emptyState(), {
      type: 'ADD_CLAIM',
      projectId: P1,
      claim: claim(1, 'CLM-001'),
    })
    const s = reducer(s0, {
      type: 'ADD_CLAIM',
      projectId: P1,
      claim: { ...claim(0, 'CLM-002'), claimNo: 0 },
    })
    expect(s.claims[P1 as string]![1]!.claimNo).toBe(2)
  })

  it('UPDATE_CLAIM patches status', () => {
    const s0 = reducer(emptyState(), {
      type: 'ADD_CLAIM',
      projectId: P1,
      claim: claim(1, 'CLM-001'),
    })
    const s = reducer(s0, {
      type: 'UPDATE_CLAIM',
      projectId: P1,
      claimId: asId('CLM-001'),
      patch: { status: 'Paid' },
    })
    expect(s.claims[P1 as string]![0]!.status).toBe('Paid')
  })
})

// ─── PC / PS items ────────────────────────────────────────────────────────

describe('PC / PS items', () => {
  const pc: PrimeCostItem = {
    id: asId('PC-001'),
    description: 'Tapware',
    allowance: 3000,
    marginRate: 0.2,
    actualCost: 0,
    status: 'Pending',
  }
  const ps: ProvisionalSum = {
    id: asId('PS-001'),
    description: 'Excavation',
    allowance: 15000,
    marginRate: 0.2,
    actualCost: 0,
    status: 'Pending',
  }

  it('ADD_PC_ITEM / UPDATE_PC_ITEM / DELETE_PC_ITEM', () => {
    const s1 = reducer(emptyState(), { type: 'ADD_PC_ITEM', projectId: P1, item: pc })
    expect(s1.primeCostItems[P1 as string]).toHaveLength(1)
    const s2 = reducer(s1, {
      type: 'UPDATE_PC_ITEM',
      projectId: P1,
      itemId: pc.id,
      patch: { actualCost: 4500, status: 'Reconciled' },
    })
    expect(s2.primeCostItems[P1 as string]![0]!.status).toBe('Reconciled')
    const s3 = reducer(s2, { type: 'DELETE_PC_ITEM', projectId: P1, itemId: pc.id })
    expect(s3.primeCostItems[P1 as string]).toHaveLength(0)
  })

  it('ADD_PS_ITEM / UPDATE_PS_ITEM / DELETE_PS_ITEM', () => {
    const s1 = reducer(emptyState(), { type: 'ADD_PS_ITEM', projectId: P1, item: ps })
    expect(s1.provisionalSums[P1 as string]).toHaveLength(1)
    const s2 = reducer(s1, {
      type: 'UPDATE_PS_ITEM',
      projectId: P1,
      itemId: ps.id,
      patch: { actualCost: 17500, status: 'Reconciled' },
    })
    expect(s2.provisionalSums[P1 as string]![0]!.actualCost).toBe(17500)
    const s3 = reducer(s2, { type: 'DELETE_PS_ITEM', projectId: P1, itemId: ps.id })
    expect(s3.provisionalSums[P1 as string]).toHaveLength(0)
  })
})

// ─── Retention ──────────────────────────────────────────────────────────

describe('UPDATE_RETENTION', () => {
  it('creates a retention record with defaults then merges', () => {
    const s = reducer(emptyState(), {
      type: 'UPDATE_RETENTION',
      projectId: P1,
      patch: { held: 5000 },
    })
    // rate is a PERCENT (legacy unit — PARITY gap 18), default 5.
    expect(s.retention[P1 as string]).toEqual({ rate: 5, held: 5000 })
  })

  it('merges into an existing record', () => {
    const s0 = emptyState({ retention: { [P1 as string]: { rate: 0.1, held: 100 } } })
    const s = reducer(s0, { type: 'UPDATE_RETENTION', projectId: P1, patch: { released: 50 } })
    expect(s.retention[P1 as string]).toEqual({ rate: 0.1, held: 100, released: 50 })
  })
})

// ─── Diary / Defects / Selections / Timesheets ────────────────────────────

describe('diary / defects / selections / timesheets', () => {
  it('ADD_DIARY_ENTRY appends', () => {
    const entry: DiaryEntry = {
      id: asId('DY-001'),
      date: '2026-02-01',
      weather: 'Sunny',
      workers: 5,
      subs: [],
      hours: 40,
      notes: '',
      incidents: false,
    }
    const s = reducer(emptyState(), { type: 'ADD_DIARY_ENTRY', projectId: P1, entry })
    expect(s.diary[P1 as string]).toHaveLength(1)
  })

  it('ADD_DEFECT / UPDATE_DEFECT', () => {
    const defect: Defect = {
      id: asId('DEF-001'),
      item: 'Crack',
      location: 'Wall',
      trade: 'Plastering',
      dateLogged: '2026-02-01',
      dateRectified: null,
      status: 'Open',
      notes: '',
    }
    const s0 = reducer(emptyState(), { type: 'ADD_DEFECT', projectId: P1, defect })
    const s = reducer(s0, {
      type: 'UPDATE_DEFECT',
      projectId: P1,
      defectId: defect.id,
      patch: { status: 'Rectified', dateRectified: '2026-02-10' },
    })
    expect(s.defects[P1 as string]![0]!.status).toBe('Rectified')
  })

  it('ADD_SELECTION / APPROVE_SELECTION', () => {
    const sel: Selection = {
      id: asId('SEL-001'),
      category: 'Kitchen',
      item: 'Benchtop',
      options: 'A / B',
      notes: '',
      status: 'pending',
      approvedOption: null,
      amount: 4200,
    }
    const s0 = reducer(emptyState(), { type: 'ADD_SELECTION', projectId: P1, selection: sel })
    const s = reducer(s0, {
      type: 'APPROVE_SELECTION',
      projectId: P1,
      selectionId: sel.id,
      approvedOption: 'A',
    })
    expect(s.selections[P1 as string]![0]!.status).toBe('approved')
    expect(s.selections[P1 as string]![0]!.approvedOption).toBe('A')
  })

  it('ADD_TIMESHEET / DELETE_TIMESHEET', () => {
    const ts: Timesheet = {
      id: asId('TS-001'),
      date: '2026-02-01',
      worker: 'Jake',
      role: 'Supervisor',
      ccId: CC1,
      hours: 8,
      rate: 95,
      notes: '',
    }
    const s0 = reducer(emptyState(), { type: 'ADD_TIMESHEET', projectId: P1, timesheet: ts })
    expect(s0.timesheets[P1 as string]).toHaveLength(1)
    const s = reducer(s0, { type: 'DELETE_TIMESHEET', projectId: P1, timesheetId: ts.id })
    expect(s.timesheets[P1 as string]).toHaveLength(0)
  })
})

// ─── Milestones (new) ─────────────────────────────────────────────────────

describe('milestones (new in Phase 4)', () => {
  const m: Milestone = {
    id: asId('MS-001'),
    name: 'Slab',
    date: '2026-03-01',
    status: 'upcoming',
    notes: '',
  }

  it('ADD_MILESTONE appends', () => {
    const s = reducer(emptyState(), { type: 'ADD_MILESTONE', projectId: P1, milestone: m })
    expect(s.milestones[P1 as string]).toHaveLength(1)
  })

  it('UPDATE_MILESTONE patches status', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_MILESTONE', projectId: P1, milestone: m })
    const s = reducer(s0, {
      type: 'UPDATE_MILESTONE',
      projectId: P1,
      milestoneId: m.id,
      patch: { status: 'complete' },
    })
    expect(s.milestones[P1 as string]![0]!.status).toBe('complete')
  })
})

// ─── RFIs (new) ─────────────────────────────────────────────────────────

describe('RFIs (new in Phase 4)', () => {
  const r = (n: number, id: string): Rfi => ({
    id: asId(id),
    rfiNo: n,
    subject: 'Window detail',
    addressee: 'Architect',
    dateIssued: '2026-02-01',
    dateRequired: '2026-02-08',
    dateResponded: null,
    response: '',
    status: 'Open',
  })

  it('ADD_RFI appends and auto-fills rfiNo', () => {
    const s = reducer(emptyState(), {
      type: 'ADD_RFI',
      projectId: P1,
      rfi: { ...r(0, 'RFI-001'), rfiNo: 0 },
    })
    expect(s.rfis[P1 as string]![0]!.rfiNo).toBe(1)
  })

  it('UPDATE_RFI patches status', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_RFI', projectId: P1, rfi: r(1, 'RFI-001') })
    const s = reducer(s0, {
      type: 'UPDATE_RFI',
      projectId: P1,
      rfiId: asId('RFI-001'),
      patch: { status: 'Closed' },
    })
    expect(s.rfis[P1 as string]![0]!.status).toBe('Closed')
  })
})

// ─── Subs / Clients / Leads ───────────────────────────────────────────────

describe('subs / clients / leads', () => {
  const sub: Subcontractor = {
    id: asId<SubcontractorId>('SUB-001'),
    name: 'Acme',
    trade: 'Carpentry',
    contact: 'Bob',
    phone: '',
    email: '',
    abn: '',
    licence: '',
    liabilityExp: '2027-01-01',
    liabilityAmt: 20000000,
    wcExp: '2027-01-01',
    swms: true,
    rating: 5,
    notes: '',
    projects: [],
  }
  const client: Client = {
    id: asId<ClientId>('CLI-001'),
    name: 'Owner',
    abn: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
  }
  const lead: Lead = {
    id: asId<LeadId>('LED-001'),
    name: 'New job',
    clientName: 'Prospect',
    value: 100000,
    stage: 'prospect',
    source: 'Referral',
    followUp: '2026-03-01',
    notes: '',
    created: '2026-02-01',
  }

  it('ADD_SUB / UPDATE_SUB', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_SUB', sub })
    const s = reducer(s0, { type: 'UPDATE_SUB', subId: sub.id, patch: { rating: 3 } })
    expect(s.subs[0]!.rating).toBe(3)
  })

  it('ADD_CLIENT / UPDATE_CLIENT', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_CLIENT', client })
    const s = reducer(s0, {
      type: 'UPDATE_CLIENT',
      clientId: client.id,
      patch: { name: 'Renamed' },
    })
    expect(s.clients[0]!.name).toBe('Renamed')
  })

  it('ADD_LEAD / UPDATE_LEAD', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_LEAD', lead })
    const s = reducer(s0, { type: 'UPDATE_LEAD', leadId: lead.id, patch: { stage: 'tendering' } })
    expect(s.leads[0]!.stage).toBe('tendering')
  })

  it('CONVERT_LEAD_TO_PROJECT marks lead won + adds project + optional client', () => {
    const s0 = emptyState({ leads: [lead] })
    const s = reducer(s0, {
      type: 'CONVERT_LEAD_TO_PROJECT',
      leadId: lead.id,
      project: makeProject({ id: asId<ProjectId>('PRJ-NEW') }),
      client,
    })
    expect(s.leads[0]!.stage).toBe('won')
    expect(s.projects).toHaveLength(1)
    expect(s.clients).toHaveLength(1)
  })

  it('CONVERT_LEAD_TO_PROJECT without client leaves clients untouched', () => {
    const s0 = emptyState({ leads: [lead] })
    const s = reducer(s0, {
      type: 'CONVERT_LEAD_TO_PROJECT',
      leadId: lead.id,
      project: makeProject({ id: asId<ProjectId>('PRJ-NEW') }),
    })
    expect(s.clients).toHaveLength(0)
  })
})

// ─── Materials / Suppliers (new) ──────────────────────────────────────────

describe('materials / suppliers (new in Phase 4)', () => {
  const material: Material = {
    id: asId<MaterialId>('MAT-001'),
    name: 'Cladding',
    cat: 'Cladding',
    unit: 'm²',
    price: 48.5,
    supId: asId<SupplierId>('SUP-001'),
    sku: 'X',
  }
  const supplier: Supplier = {
    id: asId<SupplierId>('SUP-001'),
    name: 'Supplier Co',
    abn: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
  }

  it('ADD_MATERIAL / UPDATE_MATERIAL', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_MATERIAL', material })
    const s = reducer(s0, {
      type: 'UPDATE_MATERIAL',
      materialId: material.id,
      patch: { price: 50 },
    })
    expect(s.materials[0]!.price).toBe(50)
  })

  it('ADD_SUPPLIER / UPDATE_SUPPLIER', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_SUPPLIER', supplier })
    const s = reducer(s0, {
      type: 'UPDATE_SUPPLIER',
      supplierId: supplier.id,
      patch: { name: 'Renamed' },
    })
    expect(s.suppliers[0]!.name).toBe('Renamed')
  })
})

// ─── Estimates ────────────────────────────────────────────────────────────

describe('estimates', () => {
  const est: Estimate = {
    id: asId<EstimateId>('EST-001'),
    name: 'Reno',
    clientId: asId<ClientId>('CLI-001'),
    address: '',
    status: 'draft',
    createdDate: '2026-01-01',
    margin: 20,
    codes: [{ id: asId('EC-001'), code: '001', desc: 'Prelims', budget: 1000 }],
  }
  const tpl = {
    id: asId<import('@/types').BoqTemplateId>('TPL-001'),
    name: 'Resi',
    desc: '',
    icon: 'new',
    type: 'residential' as const,
    codes: [{ code: '001', desc: 'Prelims', pct: 5 }],
  }

  it('ADD_ESTIMATE / UPDATE_ESTIMATE', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_ESTIMATE', estimate: est })
    const s = reducer(s0, {
      type: 'UPDATE_ESTIMATE',
      estimateId: est.id,
      patch: { status: 'sent' },
    })
    expect(s.estimates[0]!.status).toBe('sent')
  })

  it('ADD_EST_CODE appends a code to the estimate', () => {
    const s0 = reducer(emptyState(), { type: 'ADD_ESTIMATE', estimate: est })
    const s = reducer(s0, {
      type: 'ADD_EST_CODE',
      estimateId: est.id,
      code: { id: asId('EC-002'), code: '002', desc: 'Demo', budget: 500 },
    })
    expect(s.estimates[0]!.codes).toHaveLength(2)
  })

  it('CREATE_ESTIMATE_FROM_TEMPLATE computes budgets from pct', () => {
    const s0 = emptyState({ templates: [tpl] })
    const s = reducer(s0, {
      type: 'CREATE_ESTIMATE_FROM_TEMPLATE',
      templateId: tpl.id,
      name: 'New est',
      contractValue: 100000,
    })
    expect(s.estimates).toHaveLength(1)
    expect(s.estimates[0]!.codes[0]!.budget).toBe(5000) // 5% of 100k
  })

  it('PROMOTE_ESTIMATE creates a project with copied codes', () => {
    const s0 = emptyState({ estimates: [est] })
    const s = reducer(s0, {
      type: 'PROMOTE_ESTIMATE',
      estimateId: est.id,
      projectName: 'Promoted',
    })
    expect(s.projects).toHaveLength(1)
    expect(s.projects[0]!.name).toBe('Promoted')
    expect(s.projects[0]!.codes[0]!.budget).toBe(1000)
  })
})

// ─── Settings (new) ───────────────────────────────────────────────────────

describe('UPDATE_SETTINGS (new in Phase 4)', () => {
  it('merges patch into settings', () => {
    const s = reducer(emptyState({ settings: { businessName: 'Old' } }), {
      type: 'UPDATE_SETTINGS',
      patch: { businessName: 'New', abn: '123' },
    })
    expect(s.settings.businessName).toBe('New')
    expect(s.settings.abn).toBe('123')
  })
})

// ─── Backup restore (Phase 4.5-A) ──────────────────────────────────────────

describe('RESTORE_STATE', () => {
  it('replaces the entire state with the payload', () => {
    const current = emptyState({ settings: { businessName: 'Current' } })
    const backup = emptyState({ settings: { businessName: 'From backup' } })
    const s = reducer(current, { type: 'RESTORE_STATE', state: backup })
    expect(s).toBe(backup)
  })
})
