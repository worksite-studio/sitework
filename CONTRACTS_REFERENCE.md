# CONTRACTS_REFERENCE.md — Australian Construction Contracts: Legal Administration

A working reference for SITEWORK. Maps the contract types Australian builders actually use, the statutory framework that controls how they must be administered, and the specific consequences of getting administration wrong. The audience is us — building the platform — so each section ends with implications for the software.

This is reference material, not legal advice. Where a feature touches a statutory obligation (deposit caps, mandatory clauses, retention rules, time bars), confirm against the current Act / regulation before shipping.

---

## 1. Executive summary

### The misconception in one paragraph

A widely-held belief in the Australian residential building industry is that a **cost plus contract** transfers all financial risk to the owner and leaves the builder free to bill whatever the project ends up costing. That belief is wrong in every Australian jurisdiction. Cost plus shifts **price risk** (the risk that the final price exceeds what was estimated), but it does **not** shift, eliminate, or reduce:

- The builder's statutory warranties (workmanship, fitness for purpose, materials, compliance with law)
- The builder's duty to make a fair and reasonable estimate, with cost methodology that can be defended
- The builder's contractual obligation to substantiate every dollar claimed (invoices, receipts, timesheets, subcontractor payments)
- The builder's variation administration obligations (written, signed, costed *before* work commences)
- The builder's responsibility for rework caused by its own defective work
- Security of Payment Act compliance for claims against principals or subcontractors
- State-specific consequences: in Queensland, cost plus contracts disqualify the owner from QBCC Home Warranty Scheme protection for non-completion; in Victoria, a builder who enters a cost plus contract outside the statutory exceptions **cannot enforce the contract** against the owner (s.13(3) DBCA); in WA, the contract must be expressly labelled "cost plus" and the owner expressly acknowledges most of the HBC Act will not apply

Several Australian states **restrict or prohibit** cost plus contracts in residential work outright. In Victoria, cost plus is only lawful for projects ≥ $1m or for renovation work where parts of the cost cannot be calculated without doing some work. In NSW, every cost plus progress claim must be supported by receipts or other verifying documentation. In Queensland, cost plus contracts carry an explicit statutory warning to homeowners about the loss of warranty scheme protection.

### Why this matters for SITEWORK

SITEWORK already has a `contractType` field on every project (Cost Plus / Fixed Price). That field is currently a label. To meet builders' actual legal administration needs, it needs to **drive behaviour**:

- Different progress-claim workflows (cost plus requires substantiating documentation per claim; fixed price requires milestone verification)
- Different variation rules (mandatory written-before-work approval in NSW under HBA; cost plus does *not* remove this)
- Different state-aware compliance checks (deposit caps, mandatory clauses, retention rates)
- Different audit-trail demands (cost plus needs immutable invoice/receipt linkage; fixed price needs variation-to-CV reconciliation)

The platform's job is to make legal administration the easy path. A builder running SITEWORK on a Victorian cost plus job over $1m should be physically unable to issue a non-compliant progress claim. That is the design target.

---

## 2. The Australian statutory landscape

Building contracts in Australia sit in an **eight-jurisdiction patchwork**. Federal law (Australian Consumer Law) sets a floor; each state and territory layers its own building Act, security of payment Act, licensing regime and consumer guides on top. There is no national construction contract code.

### Three layers always apply

1. **Contract law** — the contract itself, plus general law (misleading conduct, unconscionability, frustration, repudiation).
2. **State building legislation** — sets mandatory clauses, deposit caps, statutory warranties, cooling-off rights, insurance requirements, and the rules for specific contract types.
3. **Security of Payment legislation** — gives any party performing construction work a statutory right to make progress claims and obtain rapid adjudication, regardless of what the contract says.

### Two further layers apply in specific contexts

4. **NSW Design and Building Practitioners Act 2020** — applies a statutory duty of care for economic loss caused by defects, owed by anyone with "substantive control" over building work; applies retrospectively to defects apparent within 10 years before commencement. Originally Class 2 (apartment) buildings, extended to all classes. Imposes registration, compliance declarations, and insurance obligations.
5. **NSW Residential Apartment Buildings (Compliance and Enforcement Powers) Act 2020** — gives Building Commission NSW enter-and-inspect powers and the ability to issue stop work orders, prohibition orders and rectification orders on Class 2 buildings.

### Domestic vs commercial

The harshest consumer protections apply to **domestic building work** — building, altering, repairing or extending a dwelling for an owner-occupier. Each state defines "domestic" slightly differently and most exclude:

- Pure commercial buildings
- Buildings of more than three storeys (in some regimes) — though NSW DBP Act now bites here
- Work for trade or business purposes on commercial premises

Commercial contracts are governed by contract law and Security of Payment legislation but **not** the residential consumer protection regimes. The mandatory cost plus restrictions discussed below are residential rules.

### Implications for SITEWORK

- Every project needs a **state** field (default to the firm's home state from Settings, but per-project override). This drives compliance rules.
- Every project needs **domestic vs commercial** classification (already implicit in `contractType`, but should be explicit).
- The Settings module should hold the firm's home state, ABN, builder licence number(s) by state, and HBCF/QBCC/VBA registration numbers. These get auto-pulled into contracts, claims and consumer building guides.

---

## 3. Contract types in common use

### 3.1 Fixed Price / Lump Sum

A single price agreed up front for a defined scope. **Price risk sits with the builder.** Variations and prime-cost / provisional-sum adjustments are the only sanctioned routes to vary the contract sum. Banks strongly prefer fixed price for residential construction lending — most will not lend against a cost plus contract.

**Built-in mechanisms for cost adjustment:**

- **Variations** — scope changes initiated by either party
- **Prime Cost (PC) items** — fixtures/fittings selected after signing (e.g. tapware, oven)
- **Provisional Sums (PS)** — work whose cost cannot be definitely calculated at signing (e.g. excavation, demolition)
- **Cost escalation clauses** — restricted; in VIC only permitted on contracts ≥ $500k and only in approved form
- **Rise-and-fall clauses** — prohibited in some jurisdictions (WA s.13 HBCA) for domestic work below threshold

The builder's main exposure is mispricing the original work — under-allowing for site conditions, soil, finishes, programme.

### 3.2 Cost Plus

The owner pays the builder for actual costs incurred (materials, labour, subcontractor invoices, plant) plus an agreed fee (either a fixed lump sum, or a percentage of costs — typically 10%–25%). The final price is not known until completion.

Cost plus is most often used for:

- Complex renovations where unforeseen conditions are likely
- Heritage restoration
- High-end custom builds where finishes are still being designed
- Projects where the owner wants full transparency and to take cost risk

**Cost plus does not transfer to the owner:**

- The builder's statutory warranties
- The cost of rectifying the builder's defective work (rework caused by builder fault is at builder's expense — confirmed by ABA, VCAT and NCAT practice)
- The builder's duty to manage costs reasonably
- The builder's obligation to substantiate every dollar with documentation

Cost plus **is regulated or restricted in every state for residential work** — see §5 below.

### 3.3 Guaranteed Maximum Price (GMP)

A hybrid. The owner pays actual costs plus a fee, but a maximum total price is agreed. Costs above the cap are absorbed by the builder unless caused by owner-initiated variations. Used where flexibility is wanted but the owner needs a ceiling for finance.

GMP is increasingly recommended by Australian construction lawyers as a way to use cost plus without the open-ended risk. SITEWORK should treat GMP as a `contractType` of its own, not a sub-type of cost plus, because the budget logic differs (contract value = cap; cost-to-date tracked against cap; warnings as cap approaches).

### 3.4 Schedule of Rates / Measure and Value

The builder is paid based on quantities of work actually performed, priced against a pre-agreed schedule of unit rates. Common in civil and infrastructure work, less common in residential. The Property Council's PC-1 contract uses this approach.

### 3.5 Design and Construct (D&C)

The builder takes responsibility for both design and construction. A single point of accountability for the owner; the builder owes a fitness-for-purpose obligation in many forms. Common contract: **AS 4902**. Used for commercial and infrastructure work, occasionally for high-end residential.

### 3.6 Construction Management

The owner directly engages multiple trade contractors, advised by a construction manager (usually a licensed builder). The owner — not the construction manager — is the principal under each trade contract. Like cost plus in QLD, **disqualifies the owner from QBCC Home Warranty Scheme non-completion protection**.

### Implications for SITEWORK

Update `contractType` to support: `Fixed Price`, `Cost Plus`, `GMP`, `Schedule of Rates`, `Design & Construct`, `Construction Management`. The first three are the priority for residential builders (~95% of the residential market). The rest are stretch goals for when we move into commercial.

---

## 4. Standard form contracts

Builders rarely draft contracts from scratch. They use industry standard forms, often amended for the specific project. The form chosen matters because it determines default risk allocation, payment claim mechanics, variation procedures, and dispute resolution.

### 4.1 State regulator contracts

- **NSW Fair Trading Home Building Contracts** — published by Building Commission NSW, free to download. Two versions: contracts $5k–$20k (small jobs) and contracts over $20k. Consumer-friendly bias.
- **QBCC Level 1 / Level 2 Regulated Contracts** — QBCC publishes templates for renovations, extensions, new home construction, and minor works. Compliance with QBCC Act Schedule 1B is mandatory.
- **VBA / Consumer Affairs Victoria contracts** — Victoria publishes guidance and approved forms.

State regulator contracts tend to be more owner-friendly than HIA/MBA forms but include all mandatory statutory clauses.

### 4.2 HIA (Housing Industry Association)

HIA is a residential builder peak body. Its contract suite covers fixed price, cost plus, renovations, kitchens/bathrooms, small works, and is state-specific (separate NSW, VIC, QLD, WA forms reflecting each state's legislation). HIA contracts are widely used by smaller residential builders.

HIA contracts are drafted to favour HIA members (i.e. builders), but include all mandatory statutory clauses for their target jurisdiction.

### 4.3 MBA (Master Builders Association)

Similar position to HIA — a builder peak body with its own contract suite. MBA's residential cost plus contract is widely used in NSW and QLD. MBA contracts are sometimes considered more comprehensive than HIA's for complex residential projects.

### 4.4 ABIC (Australian Building Industry Contracts)

Jointly published by the Australian Institute of Architects and Master Builders Australia. Designed for architect-administered projects. Comes in:

- **ABIC MW** (Major Works) — projects with a contract administrator, typically commercial or larger residential
- **ABIC SW** (Simple Works) — smaller projects up to ~$2m
- **ABIC BW** (Basic Works) — small projects up to ~$50k
- **ABIC EW** (Early Works) — preliminary works

ABIC has QLD-specific variants to comply with the QBCC Act.

### 4.5 Australian Standards

Used predominantly in commercial and infrastructure work, rarely in residential.

- **AS 2124-1992** — Major works, construct-only. Adaptable to a wide range of project types. Despite its age, still widely used.
- **AS 4000-1997** — Modernised version of AS 2124. Most common construct-only contract for medium-to-large commercial projects.
- **AS 4902-2000** — Design and Construct version of AS 4000.
- **AS 4905-2002** — Minor works (similar to AS 4000 but streamlined).
- **AS 4901-1998** — Subcontract form companion to AS 4000.
- **AS 4122-2010** — Consultancy agreements.

Standards Australia attempted an update via AS 11000 but the project was abandoned in 2017 due to lack of industry consensus. A minimalist update to AS 4000 has been out for public consultation but does not change the 1997 risk allocation.

### 4.6 GC21 and PC-1

- **GC21** — NSW Government construction contract. Mandatory for NSW public sector projects.
- **PC-1** — Property Council of Australia. Alternative to ABIC and AS contracts for major commercial property work.

### Risk allocation spectrum (from "builder-friendly" to "owner-friendly")

```
Builder-friendly ─────────────────────────────────── Owner-friendly
   MBA BC4 │ HIA Plain English │ ABIC │ AS 4000/4902 │ NSW Fair Trading
```

### Implications for SITEWORK

- Add a `contractForm` field separate from `contractType`. Initially a free text or dropdown (HIA / MBA / Fair Trading NSW / QBCC L1 / QBCC L2 / ABIC SW / AS 4000 / Custom).
- Long-term, each form has slightly different default payment-claim mechanics. The platform should be able to ship pre-configured templates per form.

---

## 5. Cost Plus — state by state

This is the section that matters most for the misconception. **Cost plus is not "anything goes" in any Australian jurisdiction.**

### 5.1 New South Wales

Governed by **Home Building Act 1989 (NSW)** and **Fair Trading Act 1987 (NSW)**.

- **No outright prohibition** of cost plus for residential work, but heavy regulation.
- Contracts over $5,000 must be in writing under Fair Trading Act.
- Contracts over $20,000 trigger Home Building Act 1989 in full: cooling-off period (5 clear business days), Home Building Compensation Fund insurance, statutory warranties, mandatory clauses, written contract requirement.
- **Cost plus progress claims must be supported by receipts, invoices or other verifying documentation** (Building Commission NSW guidance, reflecting HBA s.7E and Schedule 2).
- Maximum deposit: 10% of contract price (NSW HBA Schedule 2).
- Variations must be in writing and signed by both parties **before** work commences (HBA Schedule 2 Part 1 Item 1(2)).
- Mandatory written contract must include: licence details, statutory warranties clauses, contract price clause with appropriate warnings, cooling-off notice, progress payment schedule, termination clause, HBCF insurance certificate.

**Cost plus consequence: builders MUST substantiate. NSW Fair Trading expressly requires "receipts or other verifying documents" for every cost plus progress claim.**

### 5.2 Victoria

Governed by **Domestic Building Contracts Act 1995 (Vic)** (DBCA).

Cost plus is **restricted by statute**. Section 13 DBCA says a builder must not enter into a cost plus contract unless either:

1. The contract is **reasonably estimated at $1 million or more** (raised from $500k in 2017), OR
2. The work involves **renovation, restoration or refurbishment of an existing building**, and it is **not possible to calculate the cost of a substantial part of the work without carrying out some of the domestic building work**.

If a cost plus contract is entered into outside these exceptions, **s.13(3) says the builder cannot enforce the contract against the owner**. VCAT may award the builder cost of works plus reasonable profit only if it considers that it would not be unfair to the owner to do so.

Additionally, s.13(2) requires every cost plus contract to contain a **fair and reasonable estimate by the builder of the total amount of money the builder is likely to receive under the contract**. Penalty for breach: 100 penalty units (~$19,000+).

The VCAT case **Charterarm Investments Pty Ltd v Roberts** sets out the factors VCAT uses to assess whether the estimate was reasonable:
- Was the costing methodology reasonable at the relevant time?
- Was all contract documentation finalised?
- Were prices for quantities provided by the owner?
- Did the builder rely on subcontractor prices?
- Any other extenuating factors

The pending **Domestic Building Contracts Amendment Bill 2025 (Vic)** signals further reform, including the possibility of moving cost escalation clauses into approved-form territory for contracts ≥ $1m. Watch this space.

**Cost plus consequence in Victoria: if you use cost plus outside the s.13 exceptions, you may not be able to recover anything from the owner except via VCAT's discretion. This is the strongest cost plus deterrent in Australia.**

### 5.3 Queensland

Governed by **Queensland Building and Construction Commission Act 1991 (Qld)** (QBCC Act), **Schedule 1B**.

- All domestic building work over $3,300 requires a written regulated contract (Level 1 for $3,301–$19,999; Level 2 for $20,000+).
- Cost plus is defined in QBCC Act Schedule 1B s.1 as a contract where the amount the contractor is to receive cannot be accurately calculated when the contract is entered into, **even if PC items and PS are ignored**.

**Critical QBCC warning** (from the QBCC consumer guidance, verbatim language as published): *"As a consequence of the uncertainty surrounding the final contract price for cost plus and construction management contracts, protection for non-completion under the Queensland Home Warranty Scheme is not available to home owners when these contracts are used."*

So in Queensland, choosing cost plus removes a major piece of the consumer protection regime. The QBCC actively warns homeowners against cost plus.

Other QBCC requirements that apply regardless of contract type:
- Consumer Building Guide must be given to owner before signing (Level 2 contracts only)
- Cooling-off period: 5 business days
- Signed copy of contract within 5 business days of entering it
- Commencement notice within 10 business days of work starting on site
- Variations in writing and signed before work commences (unless urgent)
- PC items and PS items: implied warranty that they have been calculated with reasonable care and skill

### 5.4 Western Australia

Governed by **Home Building Contracts Act 1991 (WA)** (HBCA). HBCA applies to contracts between $7,500 and $500,000.

WA's approach is unique and **directly contradicts the "cost plus = lighter touch" misconception**:

**HBCA s.14** requires a cost plus contract to:
- Be in writing
- Be **headed "cost plus contract"** at the beginning
- Contain a statement acknowledging it is a cost plus contract **and that the HBCA does not apply to it, except in relation to the requirement for the builder to take out home indemnity insurance**

So choosing cost plus in WA is effectively **opting out of the entire HBCA consumer protection regime** (except for indemnity insurance, which is mandatory above $20,000). The owner must expressly acknowledge this. The trade-off is total: the owner gives up most statutory protections to accept the cost plus structure.

The builder still has to take out home indemnity insurance for contracts over $20,000 and is still bound by general law (statutory warranties under ACL, negligence, misleading conduct).

WA HBCA also caps deposits at 6.5% of total contract value before work begins — among the lowest in the country.

### 5.5 South Australia

Governed by **Building Work Contractors Act 1995 (SA)**. The Act recognises three pricing structures:

1. **Fixed price lump sum** — most common
2. **Rise and fall clause** — lawful if there is a completion date; allows price adjustment for actual cost movements
3. **Cost plus** — recognised but with consumer protection requirements; prescribed notice (Form 1 — Your Building Contract: Your Rights and Obligations, Schedule 3 of the Regulations) must be given to the owner

SA's regime is generally less prescriptive than VIC, NSW or QLD but still applies statutory warranties (s.32 BWCA).

### 5.6 Tasmania

Governed by **Residential Building Work Contracts and Dispute Resolution Act 2016 (Tas)**. Reasonably modern legislation. Mandatory written contracts above threshold, statutory warranties, dispute resolution via Consumer Building and Occupational Services.

### 5.7 ACT

Governed by **Building Act 2004 (ACT)**. Statutory warranties for major defects up to 10 years (longest in Australia). Construction Occupations Registrar can issue rectification orders for up to 10 years after non-compliance occurred.

### 5.8 Northern Territory

Governed by **Building Act 1993 (NT)**. NT has the most non-uniform security of payment regime in the country (Construction Contracts (Security of Payments) Act 2004), with materially different procedures.

### State-by-state summary table

| State | Cost plus allowed for residential? | Key restriction | Cost plus consequence |
|---|---|---|---|
| **NSW** | Yes, with regulation | Receipts/verifying docs mandatory per claim; HBA mandatory clauses apply over $20k | Heavy admin burden; full statutory warranties still apply |
| **VIC** | Only ≥ $1m OR renovation where cost can't be calculated | s.13 DBCA — non-compliance = builder cannot enforce contract | Strongest deterrent in Australia |
| **QLD** | Yes, but with disclosure | Owner loses Home Warranty Scheme non-completion protection | QBCC actively warns against |
| **WA** | Yes, but as effective opt-out from HBCA | Must be expressly labelled "cost plus contract"; HBCA does not apply except for indemnity insurance | Owner loses most consumer protections |
| **SA** | Yes | Prescribed Form 1 notice required | Standard warranties still apply |
| **TAS** | Yes | Mandatory written contract above threshold | Standard warranties apply |
| **ACT** | Yes | Building Act 2004 applies | 10-year rectification window |
| **NT** | Yes | Building Act 1993 applies | Non-uniform SOP procedures |

### Implications for SITEWORK

- When a user creates a Cost Plus project in **VIC**, the platform should require an estimated value and refuse to proceed (or show a hard warning) if it is below $1m and the project is not flagged as a renovation/restoration. This is the single most consequential compliance check the platform can implement.
- When a user creates a Cost Plus project in **QLD**, the platform should surface the QBCC warning text and require acknowledgement on contract generation.
- When a user creates a Cost Plus project in **WA**, the platform should default the contract title to "Cost Plus Contract" and include the mandatory s.14 HBCA acknowledgement statement.
- When a user creates a Cost Plus project in **NSW**, every progress claim row must require linked supporting documentation (invoice / receipt / timesheet / subcontractor statement). Block claim submission without this.

---

## 6. The "cost plus eliminates builder liability" misconception, debunked

### The myth

> "I'm on a cost plus contract, so the owner pays whatever it costs. My margin is locked in. If the job blows out, that's not my problem."

### What cost plus actually transfers

Cost plus transfers **price risk** — the risk that the final price exceeds what was estimated at signing — from the builder to the owner. That is its entire commercial purpose. It does not transfer:

| Risk / obligation | Transferred by cost plus? |
|---|---|
| Price risk (estimate exceeded) | **Yes** (this is the point) |
| Quality of work | No — statutory warranties apply |
| Materials suitability | No — statutory warranties apply |
| Defects rectification | No — builder pays for rework caused by builder fault |
| Duty to substantiate every cost | No — builder must produce receipts/invoices |
| Variation administration | No — written, signed, before work commences (in most states) |
| PC/PS reasonable estimate warranty | No — implied warranty under QBCC Act, DBCA s.20, etc. |
| Security of Payment compliance | No — SOP Act overrides contract |
| HBCF / HBI insurance | No — mandatory above thresholds |
| Builder's licence requirements | No — must hold current licence in name on contract |
| Australian Consumer Law guarantees | No — apply regardless of contract type |
| NSW DBP Act duty of care | No — applies to anyone with substantive control |

### What goes wrong in practice

The way builders actually get caught out on cost plus jobs is rarely "the cost was too high" — it is **administrative non-compliance** that breaks the chain of recoverability. The most common failure modes seen in tribunal decisions:

1. **No documentary support for claimed costs.** The owner challenges an invoice, the builder cannot produce receipts to substantiate. The tribunal disallows the cost.
2. **Variation done without written approval.** The owner refuses to pay for it. The builder argues quantum meruit. Tribunal may allow recovery of the cost only, with no margin (or sometimes nothing at all).
3. **PC/PS estimates were unreasonably low at signing.** Owner argues breach of implied warranty (QBCC Act Schedule 1B s.34 / DBCA s.20). Tribunal may disallow the markup on the excess, or in some cases the entire excess.
4. **No fair and reasonable estimate in a Victorian cost plus contract.** Builder cannot enforce the contract (DBCA s.13(3)). The tribunal may, at its discretion, award cost plus reasonable profit — or may not.
5. **Builder did its own defective work; tried to bill rework as a project cost.** Tribunal disallows.
6. **Builder used cost plus in VIC for a $400k extension** that was not a renovation where cost could not be calculated. Contract unenforceable.

### The case law signal

In a NSW Supreme Court case widely cited (and a useful one to summarise — see *Cinnamon v Premier Building Solutions* / similar matters):

- A cost plus contract that complied with its own terms was held enforceable
- The owner's challenge for unconscionable conduct **failed** — the builder was "negligent or sloppy, but not deliberate or dishonest"
- BUT the builder's invoices were supported by spreadsheets showing the cost plus calculation, and the builder was billing in accordance with the contractually-required mechanics

The takeaway: courts will enforce a cost plus contract that has been administered properly, even where costs blow out significantly. The protection of the cost plus structure depends entirely on the builder having complied with the administration regime — the contract terms, the statutory disclosure obligations, the documentation requirements.

A cost plus contract administered badly is worse for the builder than a fixed price contract administered badly, because the documentation burden is higher.

### The administration trap

Cost plus has **more** administrative obligations than fixed price, not fewer. The misconception runs the wrong way. A builder choosing cost plus is accepting:

- Per-claim cost substantiation requirements
- Open-book record-keeping (the owner has audit rights)
- Subcontractor invoice management visible to the owner
- Time and material recording requirements
- Often a contractual budget reporting cadence (weekly or fortnightly cost reports)

Done well, this can build trust. Done poorly, it gives the owner grounds to challenge every claim.

### Implications for SITEWORK

The platform's contribution is **making the administration easy**. Specifically:

- **Cost plus mode** in SITEWORK must enforce: each invoice line links to a verifying document (supplier invoice, receipt, timesheet, subcontractor statement). No verification = no claim submission.
- **Open-book report**: at the project level, an owner-facing report that shows every cost incurred, every receipt, the running total against estimate. This is what owners are entitled to under most cost plus contracts. Producing it should be a one-click action.
- **Margin transparency**: SITEWORK should show the builder a real-time margin position separate from the owner-facing report (which only shows costs and fee).
- **Estimate-versus-actual tracking**: at the cost code level, flag overruns >X% so the builder can have the conversation with the owner before the next claim, not after.

---

## 7. Universal administrative obligations

These apply **regardless of contract type**. The cost plus misconception often bleeds into thinking that some of these can be relaxed. They cannot.

### 7.1 Statutory warranties

Every state imposes statutory warranties on residential building work, automatically incorporated into every contract. They **cannot be contracted out of** (NSW HBA s.18G is the model; equivalent in every state).

Typical warranties (NSW HBA s.18B, with state variants):

- The work will be done with **due care and skill** and in accordance with the plans and specifications.
- All materials supplied will be **suitable for purpose** and, unless the contract states otherwise, **new**.
- The work will be done in accordance with the relevant Act and any other law.
- The work will be done with **due diligence** within the time stipulated (or, if none, within a reasonable time).
- The dwelling will be **reasonably fit to be occupied**.
- The work will be **reasonably fit for the specified purpose** if any specified purpose was made known to the builder.

**Warranty periods** (proceedings must commence before expiry):

| State | Major defect | Other defect | Notes |
|---|---|---|---|
| NSW | 6 years | 2 years | +6 months extension if defect becomes apparent in last 6 months |
| VIC | 10 years (DBCA s.134) | 10 years | No distinction between major/minor |
| QLD | 6 years 3 months | 12 months | QBCC scheme has separate periods |
| WA | 6 years (HBCA) | 6 years | No major/minor distinction |
| SA | 5 years | 5 years | |
| ACT | 10 years | 6 years for non-structural | Longest major period |
| TAS, NT | Varies | Varies | |

The warranty period runs from **completion of the work** (or, for strata, from issue of Occupation Certificate).

### 7.2 Variations

Variations are the single most common cause of building disputes. **Every Australian jurisdiction requires residential variations to be in writing, signed by both parties, before the variation work commences** — with narrow exceptions for urgent work where danger or damage is imminent.

The variation document must contain:
- A description of the varied work
- The reason for the variation (council requirement, owner request, latent condition, etc.)
- The cost impact (calculation, not just dollar figure)
- The time impact (programme extension)
- Both parties' signatures

If the variation is required because of the builder's fault, the owner pays nothing for the rework.

**Cost plus contracts do not exempt builders from these requirements.** A cost-plus variation still needs the same paperwork — even though the cost will be passed through anyway, the **scope change** must be documented.

### 7.3 Progress claims and payment schedules

For domestic work:

- Maximum deposit (NSW): 10% of contract price or $20,000, whichever is less
- Maximum deposit (VIC): 10% if contract under $20k; 5% if $20k+ (DBCA)
- Maximum deposit (WA HBCA): 6.5% of contract value before work begins
- Maximum deposit (QLD QBCC): 5% for contracts ≥ $20k; 10% for contracts < $20k

Progress payments must:

- Match work actually performed (not "time on the job")
- Be of a specified amount or percentage of contract price (NSW HBA Schedule 2)
- Be supported by invoices/receipts where the payment is for costs incurred under a cost plus structure
- Comply with state-specific stages where prescribed (VIC has prescribed stages for new home builds: base, frame, lock-up, fixing, completion, with regulation-defined maximum percentages per stage)

For commercial work, payment claims are typically governed by the Security of Payment Act (see §8).

### 7.4 Prime Cost items and Provisional Sums

A **Prime Cost (PC) item** is an item that has not been selected at the time of the contract but will be selected by the owner (e.g. tapware, oven, vanity). An allowance for supply only is included in the contract sum.

A **Provisional Sum (PS)** is an estimated allowance for work whose scope and cost cannot be definitely calculated at signing (e.g. excavation, demolition, landscaping). Includes both labour and material.

**Implied statutory warranty in every state**: the builder warrants that the PC/PS has been **calculated with reasonable care and skill, having regard to all information reasonably available when the contract is entered into** (QBCC Act Schedule 1B s.34; DBCA s.20; equivalent elsewhere).

**Adjustment mechanics:**

- If actual cost is **less than** the allowance → builder credits the difference to the owner in the next progress claim (no need to refund the margin already included in the contract price).
- If actual cost is **more than** the allowance → builder claims the excess in the next progress claim, plus a margin **on the excess only** (typically 20% — set in the contract). NOT on the full actual cost.
- **Common mistake**: builders charging the margin on the entire actual cost instead of on the excess. This is incorrect and owners can refuse to pay it.

The builder's overall margin is already embedded in the contract price for the allowance itself — it is not paid again.

**A PC/PS is not a variation** unless the scope changes (e.g. owner asks to omit it, or substitutes an item that changes the scope, like changing an electric cooktop to a gas cooktop that requires gas line installation). The price adjustment alone is handled in the next progress claim, not via the variation procedure.

### 7.5 Retention

Most contracts allow the principal/owner to retain a percentage of each progress payment (typically 5%) as security against defects, capped at a percentage of the contract price (typically 5%).

Retention is usually:
- 5% deducted from each claim
- Capped at 5% of total contract price
- Half released at practical completion
- Half released at the end of the defects liability period (typically 12 months)

For domestic work, the prescribed retention mechanics vary by state. Some HIA contracts use a different "final claim" / "FFC" mechanism instead.

### 7.6 Defects Liability Period (DLP)

The contractual period (typically 12 months) after practical completion during which the builder must rectify defects notified by the owner. The DLP is **different** from the statutory warranty period — DLP is a contractual right to access and rectify; statutory warranty is the owner's right to sue.

### 7.7 Record-keeping

The NSW DBP Act requires design practitioners to retain **regulated designs and compliance declarations for a minimum of 10 years**. Comparable record-keeping obligations exist in every state for builders.

For SITEWORK, this means:

- Every change to any record (project, claim, variation, invoice) must be auditable
- Records cannot be hard-deleted — only soft-deleted with retention timestamps
- The 10-year retention horizon should drive backup and export policy

### 7.8 Insurance

Mandatory insurance per state:

| State | Scheme | Threshold | Period |
|---|---|---|---|
| NSW | Home Building Compensation Fund (HBCF) | Contracts > $20,000 | 6 years major / 2 years minor |
| VIC | Domestic Building Insurance (DBI) | Contracts > $16,000 | 6 years |
| QLD | Queensland Home Warranty Scheme | All domestic work > $3,300 | 6 years 6 months structural / 12 months non-structural |
| WA | Home Indemnity Insurance | Contracts > $20,000 | 6 years |
| SA | Builders Indemnity Insurance | Contracts > $12,000 | 5 years |
| ACT | Statutory warranty fidelity fund | Varies | Varies |
| TAS | No mandatory scheme | n/a | Statutory warranties only |

The insurance certificate must be provided to the owner **before** the contract is signed (or before any deposit is taken).

### Implications for SITEWORK

- **Variations module** — already exists. Needs to enforce: written description, calculated cost impact, time impact, two-party signature workflow. PDF export ready for signature. State currently has "Requested By" — add "Reason category" (owner-requested / latent condition / regulatory / design clarification), and "Time impact in days".
- **PC/PS handling** — currently absent from SITEWORK. Needs to be a first-class concept. Each contract has a list of PC items and PS items at signing with allowances. Actual costs as they come in are reconciled against allowances; margin on excess is calculated correctly (margin on excess, not on full cost).
- **Retention** — already partially implemented. Needs to support: standard 5% with cap at 5% of contract; half release at PC; half release at end of DLP. Different defaults per state.
- **Insurance certificate** — Settings should hold the builder's HBCF / VBA / QBCC registration. Project creation should include "insurance certificate provided to owner on [date]" with file upload.

---

## 8. Security of Payment Acts

The Security of Payment regime is parallel to and overrides the contract. Every Australian jurisdiction has one. Their core promise is **"pay now, argue later"** — anyone performing construction work can issue a payment claim that, if not responded to by a payment schedule within a tight statutory window, becomes a debt due.

### State-by-state SOP legislation

| Jurisdiction | Act | Key features |
|---|---|---|
| NSW | Building and Construction Industry Security of Payment Act 1999 (NSW) | First in Australia (1999). Most adjudications nationally. Payment claim must be endorsed as made under the Act for some claims. 12-month time bar from last work. |
| VIC | Building and Construction Industry Security of Payment Act 2002 (Vic) | Modelled on NSW. **3-month time bar from last work** — shortest in Australia. Major reforms foreshadowed by VIC government 2024. |
| QLD | Building Industry Fairness (Security of Payment) Act 2017 (Qld) | Replaced BCIPA 2004 in 2018. Payment claim does NOT need to specifically state it is under the Act. **6-month time bar.** Project bank accounts for some larger projects. Statutory debt arises automatically if respondent does not issue payment schedule within 15 business days. |
| WA | Building and Construction Industry (Security of Payment) Act 2021 (WA) | Replaced Construction Contracts Act 2004 (WA). |
| SA | Building and Construction Industry Security of Payment Act 2009 (SA) | |
| ACT | Building and Construction Industry (Security of Payment) Act 2009 (ACT) | Mirrors NSW. |
| TAS | Building and Construction Industry Security of Payment Act 2009 (Tas) | |
| NT | Construction Contracts (Security of Payments) Act 2004 (NT) | Most non-uniform regime. |

### Standard SOP mechanics

1. **Payment claim** issued by claimant to respondent (usually monthly or per contractual schedule). Must contain the work claimed, the amount, and (in most jurisdictions) be expressed to be made under the relevant Act.
2. **Payment schedule** issued by respondent within statutory window (NSW: 10 business days; QLD: 15 business days). Must specify the scheduled amount and, if less than claimed, the reasons.
3. **If no schedule** → claimed amount becomes due as a debt; claimant can sue or apply for adjudication.
4. **If schedule disputed** → claimant applies for adjudication (typically within 10 business days of receiving the schedule).
5. **Adjudication** → independent adjudicator decides on submissions within statutory window (typically 10 business days from acceptance).
6. **Determination** → enforceable as a court judgment.

### Important constraints

- **No contracting out** — parties cannot waive SOP rights.
- **Pay-when-paid clauses are void** under SOP Acts.
- **Time bars are strict** — VIC 3 months, QLD 6 months, NSW 12 months from last work.
- **Liquidation bars** in NSW and WA — companies in liquidation cannot serve or enforce a SOP claim (NSW s.32B). VIC bars only on case law grounds.
- **For residential work**, NSW SOP Act has specific exclusions — does not apply to homeowner contracts in most circumstances, but applies to contracts down the chain (builder-to-subcontractor).

### Implications for SITEWORK

- Every invoice / progress claim in SITEWORK should have a metadata field for **"Made under [State] Security of Payment Act"** — yes/no with state. This determines the statutory windows, time bars, and language requirements on the document.
- Add a **payment schedule** workflow — when an invoice received in (where SITEWORK is used by the principal) is being scheduled for less than the claimed amount, the platform should generate a compliant payment schedule with reasons fields.
- Watch the VIC 3-month time bar — surface a warning on any claim that is more than 2 months from the last recorded work on the project.
- Adjudication is out of scope for SITEWORK for now — that's a specialist process.

---

## 9. Recent and pending reform

### NSW Design and Building Practitioners Act 2020 (DBP Act)

The most significant building reform in NSW in decades. Came into full effect 1 July 2021.

- **Statutory duty of care** (s.37) — anyone carrying out "construction work" owes a duty to exercise reasonable care to avoid economic loss caused by defects. "Construction work" is defined broadly to include those who manufacture, supply, supervise, project-manage or otherwise have "substantive control" over the work.
- **Retrospective** — applies to defects apparent within 10 years before commencement (so back to ~2010).
- **Cannot be contracted out of** (s.40).
- **Cannot be delegated** (s.39).
- **Originally Class 2** (apartment buildings) but now extends to all classes.
- **Registration scheme** — designers, builders and engineers must be registered.
- **Compliance declarations** — for "regulated designs" and "building elements", design practitioners must provide compliance declarations confirming the design meets BCA. Builders must provide a building compliance declaration before applying for an occupation certificate.

The Pafburn / Goodwin Street decisions confirm the duty bites against developers if they had substantive control.

### NSW Residential Apartment Buildings Act 2020

Gives Building Commission NSW enter-and-inspect powers, stop-work order powers (up to 12 months), and prohibition order powers on Class 2 buildings.

### Strata Building Bond and Inspection Scheme (NSW)

For buildings ≥ 4 storeys: developers must lodge a bond of 2% of contract price (rising to 3% from July 2026). Provides a fund for rectification of defects identified by an independent inspector at 15-24 months after completion.

### VIC Domestic Building Contracts Amendment Bill 2025

Pending at time of writing. Key proposed changes:
- Cost escalation clauses permitted on contracts ≥ $1m with approved-form notice
- 5% ceiling on cost escalation increases
- 15% price rise or 50% time blowout entitles owner to terminate (unchanged)
- DBC Act no longer applies to preparation of plans/specs alone
- Deposit and progress payment limits to move from Act to regulation (more easily updated)

### VIC SOP reform

Major SOP reform foreshadowed by VIC government October 2024 in response to subcontractor non-payment inquiry. Expect changes to what can be claimed, payment timeframes, adjudication process.

### Implications for SITEWORK

- For NSW Class 2 projects, the platform needs to surface DBP Act obligations: regulated designs lodged on the NSW Planning Portal, compliance declarations, registered practitioners. This is mostly a Phase 4-5 feature.
- The "substantive control" definition means SITEWORK users who are construction managers may be exposed to DBP Act liability — worth surfacing in onboarding for NSW commercial users.
- VIC reform pipeline means we should not hard-code thresholds. Keep them in `Settings.statutoryThresholds` indexed by state and date so they can be updated when regulations change.

---

## 10. Implications for SITEWORK — software requirements

This section consolidates the design implications scattered through the document into a feature backlog. Tagged by phase.

### Now (Phase 0 / 1)

- **Per-project state field** — drives every compliance rule downstream. Currently absent.
- **Per-project contract form field** — separate from `contractType`. Dropdown: HIA / MBA / Fair Trading NSW / QBCC L1 / QBCC L2 / ABIC SW / ABIC MW / AS 4000 / AS 4902 / Custom.
- **Variation form additions** — Reason category, Time impact (days). Already has Requested By.
- **Cost plus invoice substantiation** — each invoice line in a cost plus project requires at least one linked supporting document. Block submission without.
- **State-aware deposit cap warning** — when creating a project, show the deposit cap for the selected state and warn if the user tries to enter a deposit above it.
- **VIC cost plus hard check** — if `state == 'VIC'` and `contractType == 'Cost Plus'` and `contractValue < 1000000` and `not isRenovationWithUnknownCost`, block contract generation with link to DBCA s.13.
- **QBCC cost plus warning** — if `state == 'QLD'` and `contractType == 'Cost Plus'`, surface QBCC home warranty scheme consequence as a mandatory acknowledgement.
- **WA cost plus label** — if `state == 'WA'` and `contractType == 'Cost Plus'`, default contract document title to "Cost Plus Contract" and inject s.14 HBCA acknowledgement clause.

### Phase 1.5 (between Phase 1 LocalStorage and Phase 2 Docs)

- **PC items and PS items as first-class entities.** Currently absent. Each contract has a list at signing with allowances. As actual costs come in, reconcile against allowance. Margin on excess only (not on full cost). PC/PS price changes adjust the next progress claim, NOT a variation.
- **Owner-facing open-book report** — for cost plus projects, generate an owner-readable report showing every cost, every receipt, the margin position, and the running total against estimate.
- **Statutory warranty calendar** — each project has a "completion date" field; warranty expiry dates auto-calculated per state and surfaced in a dashboard tab. Defect rectification is tracked against the right warranty (major vs minor).
- **Insurance certificate tracking** — Settings holds builder's HBCF/VBA/QBCC registration. Project creation includes "insurance certificate provided to owner on [date]" with file upload.

### Phase 2 (Architecture docs + Data model)

The `DATA_MODEL.md` should capture:

```
Project:
  state: enum [NSW, VIC, QLD, WA, SA, TAS, ACT, NT]
  contractType: enum [FixedPrice, CostPlus, GMP, ScheduleOfRates, DC, ConstructionManagement]
  contractForm: enum [HIA, MBA, FairTradingNSW, QBCCL1, QBCCL2, ABICMW, ABICSW, AS4000, AS4902, Custom]
  contractClassification: enum [Domestic, Commercial]
  contractValue: decimal (incl GST)
  estimatedValue: decimal (cost plus contracts)
  isRenovationWithUnknownCost: bool (for VIC s.13 exemption)
  completionDate: date (drives warranty calendar)
  practicalCompletionDate: date
  defectsLiabilityPeriod: int (months, default 12)
  retentionRate: decimal (default 0.05)
  retentionCap: decimal (default 0.05 of contractValue)
  hbcfCertificateNumber: string
  hbcfProvidedDate: date

PrimeCostItem:
  projectId: foreign key
  description: string
  allowance: decimal (ex GST)
  marginRate: decimal (typically 0.20)
  actualCost: decimal (updated as claims come in)
  status: enum [Pending, Selected, Procured, Reconciled]

ProvisionalSum:
  projectId: foreign key
  description: string
  allowance: decimal (ex GST)
  marginRate: decimal
  actualCost: decimal
  status: enum [Pending, InProgress, Complete, Reconciled]

Variation:
  ... existing fields ...
  reasonCategory: enum [OwnerRequested, LatentCondition, Regulatory, DesignClarification, BuilderFault]
  timeImpactDays: int
  signedByOwner: date | null
  signedByBuilder: date | null
  workCommencedBeforeSignature: bool (compliance flag)

Invoice / ProgressClaim:
  ... existing fields ...
  madeUnderSOPAct: bool
  sopActState: enum (where applicable)
  supportingDocs: array of file references (mandatory for cost plus projects)
  
StatutoryWarranty:
  projectId: foreign key
  type: enum [Major, Minor]
  warrantyPeriodMonths: int (driven by state)
  warrantyStart: date (= completion date)
  warrantyExpiry: date (calculated)
```

### Phase 5 (Backend)

- **Audit trail / immutable log.** Every change to a contract, variation, invoice, or PC/PS reconciliation must be recorded with timestamp, user, before-state, after-state. Cannot be deleted. This is the record-keeping evidence builders will rely on in disputes.
- **Owner portal** (separate from builder portal). For cost plus contracts, the owner needs a read-only view of the open-book report, every invoice with linked receipts, every variation with signatures, the PC/PS reconciliation. This is the platform's strongest answer to "how do I make cost plus easy for owners to accept?"
- **State threshold tables** — store deposit caps, mandatory clause sets, retention defaults, warranty periods in a `StatutoryRules` table keyed by `(state, effectiveDate)`. When regulations change, add a new row with a new effective date rather than mutating in place. Project compliance is checked against the rules in force at contract signing.

### Phase 6+ (Xero integration)

- Cost plus invoices push to Xero with the supporting receipts attached as line item attachments (Xero supports this).
- Variations push as separate invoices, not as line items on the main invoice, so they remain traceable.

---

## 11. References

State legislation (current versions at time of writing — verify before each release):

- **NSW** — Home Building Act 1989; Home Building Regulation 2014; Fair Trading Act 1987; Building and Construction Industry Security of Payment Act 1999; Design and Building Practitioners Act 2020; Residential Apartment Buildings (Compliance and Enforcement Powers) Act 2020.
- **VIC** — Domestic Building Contracts Act 1995 (esp. ss.13, 15, 20, 21, 31, 134); Domestic Building Contracts Regulations 2017; Building and Construction Industry Security of Payment Act 2002; Building Act 1993.
- **QLD** — Queensland Building and Construction Commission Act 1991 (esp. Schedule 1B); Building Industry Fairness (Security of Payment) Act 2017.
- **WA** — Home Building Contracts Act 1991 (esp. ss.13, 14); Building and Construction Industry (Security of Payment) Act 2021.
- **SA** — Building Work Contractors Act 1995; Building Work Contractors Regulations 2011.
- **TAS** — Residential Building Work Contracts and Dispute Resolution Act 2016.
- **ACT** — Building Act 2004.
- **NT** — Building Act 1993; Construction Contracts (Security of Payments) Act 2004.

Regulatory bodies and consumer guides:

- Building Commission NSW — Consumer Building Guide
- Consumer Affairs Victoria — Domestic Building Consumer Guide
- QBCC — Consumer Building Guide
- Building and Energy WA — Home Building Contracts Act fact sheets
- Master Builders Australia and state branches — member contract suites
- Housing Industry Association — member contract suites
- Standards Australia — AS 2124, AS 4000, AS 4902, AS 4905 contracts

Standard form contract publishers:

- HIA — `hia.com.au`
- Master Builders Australia / state MBAs — `masterbuilders.com.au`
- ABIC — joint publication of Australian Institute of Architects and Master Builders Australia
- Standards Australia — `standards.org.au`
- Property Council of Australia (PC-1) — `propertycouncil.com.au`

Case law signals worth tracking:

- *Charterarm Investments Pty Ltd v Roberts* (Domestic Building) — VCAT framework for assessing fair and reasonable estimate in cost plus
- *Owners – Strata Plan No 84674 v Pafburn Pty Ltd [2022] NSWSC 659* — DBP Act duty of care and developer liability
- *Roberts v Goodwin Street Developments Pty Ltd [2023] NSWCA 5* — DBP Act applies to all classes of buildings
- *University of Sydney v Multiplex [2023] NSWSC 383* — pleading requirements for DBP Act duty of care claims

---

*Last updated: 2026-05-17. Author: SITEWORK research — first revision. Verify all statutory thresholds and time bars against current Acts before each release. The cost plus restriction in VIC and the QBCC warranty consequence in QLD are the two most likely sources of builder liability that the platform can prevent through compliance enforcement.*
