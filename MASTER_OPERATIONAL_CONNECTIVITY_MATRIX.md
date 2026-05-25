# Master Operational Connectivity Matrix

**Adrine Hospital OS — Core Completion Phase Execution Map**

This document is the **single source of truth** for operational connectivity between:

- **Hospital OS** (`apps/hospital-os`) — UI + `hospitalStore`
- **domain-api** — clinical / operational runtimes
- **kernel-api** — tenant, auth, governance, metering, provisioning

**Last audited:** 2026-05-20 — Phase 8 Program 1 P0 OPD UX (reception + doctor spine): workflow strips, patient context, consultation blockers, board wait times, walk-in fast path. hospital-os typecheck green. Prior: Program 5 HR/scheduling/CRM; Wave B consultation orders + `fulfill_or_defer_orders` enrich.

---

## How to read this matrix

### Platform mode

Unless noted, classifications assume **`VITE_PLATFORM_RUNTIME=true`** and APIs reachable. When platform is **off**, almost all operational truth is **local-only** (demo).

### Column semantics

| Column | Meaning |
|--------|--------|
| **Local store** | `hospitalStore` / React state — primary data source for the screen today |
| **Read (P)** | Authoritative reads from domain/kernel (lists, snapshots, live state) |
| **Write (P)** | Mutations via runtime services (transitions, creates, sync) |
| **LC** | Client `lifecycle-guards` + server `evaluate*Transition` on critical paths |
| **RT** | SSE / live stream vs polling vs none |
| **Bill** | `BillingSyncService` / invoice charge lines vs local invoice only |
| **Audit** | `PlatformEvent` / audit trail vs `workflowEvents` local only |
| **Blk** | Cross-runtime blockers (OPD / discharge / etc.) enforced |
| **Cust** | Policy / workflow override UI or API-ready (not full form builder) |

### Status codes (use in “Class” column)

| Code | Label | Definition |
|------|--------|------------|
| **C1** | Fully connected | Read + write path to platform for core actions; lifecycle aligned |
| **C2** | Partial platform sync | Some actions API-backed; others still `hospitalStore` |
| **C3** | Local-only operational truth | Works offline demo; no persistence to domain-api for core ops |
| **C4** | Demo-only behavior | Analytics/placeholder; not production workflow |
| **C5** | Broken / risky workflow | Journeys documented but platform + UI disagree (drift risk) |
| **C6** | Missing lifecycle enforcement | Screen allows flow that `OpdService` / etc. would reject |
| **C7** | Missing realtime hydration | Lists/state not refreshed from live API / SSE |
| **C8** | Missing operational blockers | discharge / lab / pharmacy blockers not surfaced or enforced in UI |

**Note:** A screen can be **C2 + C7** (partial writes, lists still local).

---

## Executive summary

**Phase status (honest):** Core Hospital OS engineering phases are **complete for staging smoke** (`pnpm --filter hospital-os typecheck` + `build` pass). No area is labeled blanket **C1** unless read **and** write paths are platform-backed for core actions. Use **C1-leaning** for partial platform authority; use **Preview** for demo/local-only UI.

| Area | Routes (approx.) | Class (2026-05-20) | Production note |
|------|------------------|---------------------|-----------------|
| Reception + OPD entry | ~10 | **C1-leaning** (registration, appointments, check-in, queue, flow, billing, IPD, beds) · **Preview** (dashboard, photos) | Drip marketing → CRM `/crm/drip-campaigns` |
| Doctor (incl. consultation) | ~9 + 3 dynamic | **C1-leaning** (queue, consultation, IPD, labs, radiology) · **Preview** (analytics) | Governed order + exit spine |
| Lab | 6 | **C1-leaning** | Branch worklist SSE + `guardLabUiStage` on stage buttons |
| Pharmacy | 11 | **C1-leaning** · **Preview** (procurement) | Prescriptions/inventory platform reads |
| Radiology | 5 | **C1-leaning** | Branch worklist SSE on P0 routes |
| Billing (dept) | 12 | **C1-leaning** (invoices/payments/IPD sync) · **Preview** (revenue/GST demo) | `guardInvoiceTransition` |
| Nurse | 11 | **C1-leaning** (tasks, task-board, ward, vitals, MAR, admissions, **discharge**) · **Preview** (dashboard KPIs, reports) | MAR + vitals APIs when runtime on |
| Reception IPD / beds | 3 | **C1-leaning** | Bed board + `platformAssignBed` |
| Emergency | 9 | **C1-leaning** (board, triage, orders, observation, IPD transfer) · **Preview** (`/emergency/reports` charts) | SSE when runtime on |
| OT | 10 | **C1-leaning** | `OtModule` cases/rooms/transitions; IPD `syncIpdCharge` on complete |
| Inventory | 9 | **C1-leaning** | `InventoryModule` catalog + stock move lifecycle |
| HR / Scheduling / CRM | ~23 | **C1-leaning** (staff, appointments, leads/campaigns/lifecycle) · **Preview** (attendance/leave/training, scheduling reports, CRM analytics) | |
| Dialysis | ~8 | **C1-leaning** | `DialysisModule` sessions/machines; IPD billing on complete |
| Admin | 23 + geo | **C1-leaning** (platform, onboarding, command-center, mortality/revenue/MIS/audit KPIs, AI workflow, morning briefing) · **Preview** (dashboard, geo, kaizen, disease-mapping, …) | |

**Latest shipped:** Program 5 (Phase 8) — HR/scheduling/CRM UX: central week calendar from `GET /scheduling/appointments/range`, HR staff cards/table + kernel roster, CRM leads kanban by stage, campaign→appointment via `POST /scheduling/appointments`, preview wire on attendance/teleconsult/experience. No patient-app changes.

**Prior:** Program 4 — OT/inventory/dialysis lifecycles (`hospital-operations`), domain-api `OtModule`/`InventoryModule`/`DialysisModule`, hospital-os platform runtimes + **Live** route readiness; IPD charge sync on OT/dialysis completion.

**Strategic conclusion:** **C1-leaning** is the honest ceiling for P0 today — not **C1**. **Preview** modules are non-production. True **C1** per route still needs governed writes, live blocker enforcement, and unified realtime — not connectivity badges alone.

---

## Spine 1 — OPD complete flow (route map)

**Target chain:** registration → appointments → check-in → queue → consultation → diagnostics → Rx → billing → payment → OPD completion.

| Step | Primary screens | Class today | Gaps (→ Part 2 work) |
|------|-------------------|-------------|----------------------|
| Registration | `/reception/registration` | **C1/C2** | P: patient create + domain search/hydrate; `platformPatientId` backfill on select |
| Appointments | `/reception/appointments` | **C1-leaning** | `platformBookAppointment` / cancel / complete; SSE + `refreshAppointmentsFromPlatform` |
| Check-in | `/reception/checkin` | **C2→C1** | Tie to `OpdService` transitions + appointment id |
| Queue | `/reception/queue` | **C1/C2** | Server queue authoritative when runtime on; SSE refresh |
| Consultation | `/doctor/consultation/:patientId` | **C1-leaning** | Lab/rx/rad create with `opdVisitId` + `encounterId`; governed transition order; live `fulfill_or_defer` |
| Billing / payment | `/reception/billing`, `/billing-dept/*` | C2/C3 | All charges idempotent; settlement via `BillingSyncService` |
| OPD completion | `saveConsultation` + OPD transitions | **C1-leaning** | `call_patient` → note → `complete_consultation` → `place_orders` → `fulfill_or_defer_orders` |

**Operational panels (always on when platform):** `/reception/flow` — command center, financial strip, lab, pharmacy, radiology, IPD, discharge (`Operational*` components). **Class:** C2/C7 (panels poll or partial SSE — unify RT).

---

## Spine 2 — Diagnostics (lab + radiology)

| Module | Key routes | Read (P) | Write (P) | Class | Notes |
|--------|------------|----------|-------------|-------|-------|
| Lab | `/lab/*` (worklist, entry, samples, verification, reports, dashboard) | Y — `fetchMappedLabBranchWorklist` + SSE | `updateLabStage` / sample receive → `platformApplyLabUiStage` / `collect_sample` | C2/C5/C7 | Branch merge in `platform-store-bridge`; no direct bypass on stage buttons |
| Radiology | `/radiology/*` (orders, worklist, reports, dashboard) | Y — branch worklist + SSE | `updateRadiologyOrder` status → `platformApplyRadiologyUiStatus` | C2/C7 | Scheduling fields local; status governed on platform |

**Blockers:** Consultation `fulfill_or_defer_orders` hydrates lab/rx/rad live state. IPD discharge: unified **`OperationalDischargePanel`** across doctor/billing/pharmacy/nurse/reception (GAP-012).

---

## Spine 3 — Pharmacy

| Route | Class | Notes |
|-------|-------|-------|
| `/pharmacy/prescriptions` | C2/C7 | Branch worklist merge; dispense → `platformDispensePrescription`; status → `platformApplyRxUiStatus` |
| `/pharmacy/inventory` | C2/C3 | `platformListPharmacyStock` when authoritative; else local `pharmacyInventory` |
| `/pharmacy/reports` | C2/C4 | Dispensing rows from store + SSE; stock/supplier charts Preview (local) |
| `/pharmacy/drugs` | C2/C3 | Read-only pharmacy SKUs from **`/inventory/catalog`** when runtime on; demo formulary + link to Inventory catalog offline |
| `/pharmacy/suppliers` | C3/C4 | Honest preview banner; static list; PO path via **`/inventory/procurement`** |
| Other pharmacy (`purchase`, `queries`, …) | C3/C4 | Preview banner; local until procurement APIs |

---

## Spine 4 — IPD (highest remaining spine)

| Route | Class | Notes |
|-------|-------|-------|
| `/reception/ipd`, `/reception/beds` | C2/C3 | **`/reception/beds`:** when runtime on, board from **`GET /beds`** + branch census **`GET /ipd/admissions/branch/active`**; falls back to local template offline. **`assignAdmissionBed` → `resolvePlatformBedId` + `platformAssignBed`**. |
| `/doctor/ipd`, `/doctor/ipd/:patientId` | C1/C2 | **List:** polls **`GET …/allowed-actions`**. **Profile Discharge tab:** **`OperationalDischargePanel`** — **`start_clinical_clearance`** / **`grant_clinical_clearance`**; local discharge-ready guarded by IPD lifecycle. |
| `/nurse/*` | C1/C2 | **`/nurse/discharge`:** unified panel — live blockers, **`grant_nursing_clearance`**; local Mark Discharged gated on platform **`discharged`**. |
| `/billing-dept/ipd-billing` | C1/C2 | Panel — **`grant_billing_clearance`**, **`grant_insurance_clearance`**, **`complete_discharge`**; billing exit + IPD charge sync; local discharged blocked until platform complete. |
| `/pharmacy/prescriptions` | C1/C2 | IPD discharge strip — **`grant_pharmacy_clearance`** when Rx fulfilled; live pharmacy blockers from **`DischargeRuntimeService`**. |
| `/reception/flow`, `/reception/ipd` | C1/C2 | **`OperationalDischargePanel`** — insurance clearance + platform **`complete_discharge`** handoff. |
| Discharge orchestration (platform) | C1/C2 | Single checklist via **`OperationalDischargePanel`** → **`DischargeRuntimeService.transition`**; **`updateAdmissionStatus('discharged')`** requires orchestration **`discharged`**. |

---

## Spine 5 — Emergency (single governed path)

| Route | Class | Notes |
|-------|-------|-------|
| `/emergency` | C1-leaning | Live board from `emergencyCases`; SSE refreshes cross-dept worklists; quick register → domain patient spine |
| `/emergency/triage` | C1-leaning | Triage + **transfer to IPD** via `transferEmergencyToIPD`; SSE + IPD census poll |
| `/emergency/cases` | C2 | Full case list from store; UHID + status spine visible; SSE hydration |
| `/emergency/treatment` | C2 | Treatment / observation / discharge on store cases; SSE hydration |
| `/emergency/orders` | C1-leaning | Linked orders from platform worklists; **Create Orders → Consultation** + dept paths |
| `/emergency/observation` | C1-leaning | Observation beds + **IPD transfer** spine; SSE + IPD census |
| `/emergency/mlc` | C2 | MLC-flagged cases; create via `createEmergencyCase` + platform register |
| `/emergency/ambulance` | C2 | Ambulance arrivals create governed ER cases; SSE hydration |
| `/emergency/reports` | C2/C4 | Live KPI + disposition from store; weekly/wait charts + export **Preview** |

**Store spine (platform):** `createEmergencyCase` → local UHID + `ensureEmergencyPlatformEncounter`; `triageEmergencyCase` backfills encounter; `transferEmergencyToIPD` → `opdVisitId` on admit, no duplicate platform IPD.

**Reception handoff (P0 gap):** `/reception/registration` emergency mode calls `createEmergencyCase` but does **not** redirect to `/emergency/triage` — see [EMERGENCY_MODULE.md](./docs/ROLE_MODULES/EMERGENCY_MODULE.md) §4.

**Realtime:** All ER routes use **`useEmergencyOperationalStream`** (`apps/hospital-os/src/hooks/useEmergencyOperationalStream.ts`) — mirrors lab worklist SSE + 15s fallback poll. `normalizeOperationalDelta()` maps **`emergency.transition`** / **`opd.transition`** from `platform.event` fan-out.

---

## Part 3 — Full screen inventory by module

Legend row template: `Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class`

### Admin

| Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class |
|-------|-----------|-------|---|---|----|----|------|-------|-----|------|-------|
| `/admin` | AdminDashboard | Y | N | N | N | N | N | L | N | N | Preview |
| `/admin/command-center` | AdminCommandCenter | Y | P | N | N | P | N | L | N | N | C1-leaning |
| `/admin/platform` | PlatformAdminHub | N | Y | Y | N | P | Y | Y | N | Y | C1-leaning |
| `/admin/onboarding` | OnboardingWizard | N | Y | Y | N | N | N | Y | N | Y | C1-leaning |
| `/admin/geo-intelligence` | AdminGeoIntelligence | Y | N | N | N | N | N | L | N | N | Preview |
| Other `/admin/*` | Various | Y | N | N | N | N | N | L | N | N | Preview |

### Doctor

| Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class |
|-------|-----------|-------|---|---|----|----|------|-------|-----|------|-------|
| `/doctor` | DoctorDashboard | Y | P | N | N | P | N | L | N | N | C1-leaning |
| `/doctor/patients` | DoctorPatients | Y | P | N | N | N | N | L | P | N | C1-leaning |
| `/doctor/queue` | DoctorQueue | Y | P | P | P | SSE | P | L | P | N | C1-leaning |
| `/doctor/schedule` | DoctorSchedule | Y | P | N | N | N | N | L | N | N | C1-leaning |
| `/doctor/ipd` | DoctorIPD | Y | P | N | N | P | N | L | P | N | C1-leaning |
| `/doctor/consultation/:id` | DoctorConsultation | Y | P | P | P | SSE | P | P | P | N | **C1-leaning** |
| `/doctor/ipd/:id` | DoctorIPDPatientProfile | Y | P | P | P | N | P | L | P | N | C1-leaning |
| `/doctor/labs`, `radiology` | … | Y | P | N | N | C7 | P | L | P | N | C1-leaning |
| `/doctor/analytics` | DoctorAnalytics | Y | N | N | N | N | N | L | N | N | Preview |
| `/doctor/patients/:id` | DoctorPatientProfile | Y | P | N | N | N | P | L | P | N | C1-leaning |

### Reception

| Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class |
|-------|-----------|-------|---|---|----|----|------|-------|-----|------|-------|
| `/reception/flow` | ReceptionFlowHub | Y | Y | N | P | P | P | Y | P | N | C1-leaning |
| `/reception` | ReceptionDashboard | Y | P | N | P | SSE | P | L | P | N | C1-leaning |
| `/reception/registration` | ReceptionRegistration | Y | P | P | P | SSE | P | L | P | N | C1-leaning |
| `/reception/checkin` | ReceptionCheckIn | Y | P | P | P | SSE | P | L | P | N | C1-leaning |
| `/reception/queue` | ReceptionQueue | Y | P | P | P | SSE | P | L | P | N | C1-leaning |
| `/reception/appointments` | ReceptionAppointments | Y | P | P | P | SSE | P | L | P | N | **C1-leaning** |
| `/reception/billing` | ReceptionBilling | Y | P | P | P | N | P | L | P | N | **C1/C2** |
| `/reception/ipd` | ReceptionIPD | Y | P | P | P | N | P | L | P | N | C2/C3 |
| `/reception/beds` | ReceptionBeds | Y | P | N | N | P | N | L | P | N | C2/C3 |
| `/reception/photos` | ReceptionPatientPhotos | Y | N | N | N | N | N | L | N | N | C3/C4 |
| `/crm/drip-campaigns` | CrmDripCampaigns | Y | N | N | N | N | N | L | N | N | C4 (CRM preview) |

**UX notes (Phase 8 Program 1 — P0 OPD spine):** Reception dashboard/registration/check-in/queue use `WorkflowStepStrip` (`frontDeskSpine`), `useClinicalPlatformListSync`, and `InlinePlatformError`. Queue highlights **called** patients and **wait minutes** from board `createdAt`. Registration adds **walk-in fast path** tab (`startFrontDeskVisit` → queue). Doctor dashboard/queue use `useClinicalPlatformListSync` and queue CTAs (no `WorkflowStepStrip` on doctor routes); consultation adds `PatientContextBar` + `ConsultationBlockerStrip` (lab/rad/pharmacy/billing live blockers; save disabled when critical). C2 gaps on listed reception/doctor routes closed to **C1-leaning** for platform-on builds.

### Lab

| Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class |
|-------|-----------|-------|---|---|----|----|------|-------|-----|------|-------|
| `/lab/worklist` | LabWorklist | Y | Y | Y | Y | SSE | P | L | P | N | C1-leaning |
| `/lab/entry` | LabEntry | Y | Y | Y | Y | SSE | P | L | P | N | C1-leaning |
| `/lab/samples` | LabSamples | Y | Y | Y | Y | SSE | P | L | P | N | C1-leaning |
| `/lab/verification` | LabVerification | Y | Y | Y | Y | SSE | P | Y | P | N | **C1** |
| `/lab/reports` | LabReports | Y | Y | Y | Y | SSE | P | Y | P | N | **C1** |
| `/lab` (dashboard) | LabDashboard | Y | Y | N | Y | SSE | P | L | P | N | **Preview** |

\*GAP-005 (Phase 8): verify (`verify_results`) and release (`publish_report`) hard gates; UI shows disabled reasons on worklist/verification; critical-result banner when `isCritical` / `critical_review`; **`LabWorkflowStepStrip`** (Sample→Verify→Report) on lab worklist/entry/verification — not generic `WorkflowStepStrip`.

\*`/lab` dashboard: KPI tiles aggregate local `labOrders`; operational truth on `/lab/worklist`+ — aligns with `routeReadiness.ts` (Preview for `/lab` exact path).

### Pharmacy

| Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class |
|-------|-----------|-------|---|---|----|----|------|-------|-----|------|-------|
| `/pharmacy/prescriptions` | PharmacyPrescriptions | Y | Y | Y | Y | SSE | P | L | P | N | C1-leaning |
| `/pharmacy/inventory` | PharmacyInventory | Y | Y | N | N | SSE | N | L | N | N | C1-leaning |
| `/pharmacy/reports` | PharmacyReports | Y | Y | N | Y | SSE | P | L | N | N | C1-leaning |
| `/pharmacy/drugs` | PharmacyDrugs | Y | P | N | N | N | N | L | N | N | C2/C3 |
| `/pharmacy/suppliers` | PharmacySuppliers | Y | N | N | N | N | N | L | N | N | C3/C4 Preview |
| `/pharmacy/*` (purchase, queries, …) | … | Y | N | N | N | N | N | L | N | N | C3/C4 Preview |

### Radiology

| Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class |
|-------|-----------|-------|---|---|----|----|------|-------|-----|------|-------|
| `/radiology/orders` | RadiologyOrders | Y | Y | Y | Y | SSE | P | L | P | N | C1-leaning |
| `/radiology/worklist` | RadiologyWorklist | Y | Y | Y | Y | SSE | P | L | P | N | C1-leaning |
| `/radiology/reports` | RadiologyReports | Y | Y | Y | Y | SSE | P | L | P | N | C1-leaning |
| `/radiology` (dashboard) | RadiologyDashboard | Y | Y | N | Y | SSE | P | L | P | N | C1-leaning · **`routeReadiness` Live badge gap** (W1) |
| `/radiology/settings` | RadiologySettings | Y | N | N | N | N | N | L | N | N | C3 Preview |

### Billing department

| Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class |
|-------|-----------|-------|---|---|----|----|------|-------|-----|------|-------|
| `/billing-dept` | BillingDashboard | Y | P | N | N | N | P | L | P | N | C1/C2 |
| `/billing-dept/invoices` | BillingInvoices | Y | P | P | N | N | P | L | P | N | C1/C2 |
| `/billing-dept/payments` | BillingPayments | Y | P | P | N | N | P | L | P | N | C1/C2 |
| `/billing-dept/ipd-billing` | BillingIPD | Y | P | P | N | P | P | L | P | N | C1/C2 |
| `/billing-dept/reports` | BillingReports | Y | P | N | N | N | P | L | N | N | C1/C2 |
| `/billing-dept/packages` | BillingPackages | Y | P | N | N | N | P | L | N | N | C1/C2 |
| `/billing-dept/revenue` | BillingRevenue | Y | P | N | N | N | P | L | N | N | C1/C2 |
| `/billing-dept/insurance` | BillingInsurance | Y | P | P | N | N | P | L | P | N | C1/C2 |
| `/billing-dept/finance` | BillingFinance | Y | P | N | N | N | P | L | P | N | C1/C2 |
| `/billing-dept/health-plans` | BillingHealthPlans | Y | P | N | N | N | P | L | N | N | C1/C2 |
| `/billing-dept/gst` | BillingGST | Y | P | N | N | N | P | L | N | N | C1/C2 |
| `/billing-dept/tpa-charges` | BillingTPACharges | Y | P | N | N | N | P | L | N | N | C1/C2 |
| `/billing-dept/pre-auth` | BillingPreAuth | Y | P | P | Y | N | P | L | P | N | C1/C2 |
| `/billing-dept/reconciliation` | BillingReconciliation | Y | P | N | N | N | P | L | P | N | C1/C2 |

When `VITE_PLATFORM_RUNTIME`: all billing-dept screens read via **`GET /billing/dept/*`** (catalog, revenue, GST, insurance desk, finance desk) and **`BillingSyncService`** / billing exit for transactional routes. **GAP-006** encounter-close gate on charge sync; **GAP-007** insurance pre-auth on IPD/high-cost charges. **BillingDeptShell** surfaces inline GAP-006/007 rejection copy on every `/billing-dept/*` page; invoice/payment step wizards; **`/billing-dept/pre-auth`** (insurance transitions); **`/billing-dept/reconciliation`** (`GET /finance/operations/live`). Dashboard KPI cards render from platform store only when runtime on. No Preview strip when runtime on (`routeReadiness` live set).

### Nurse

| Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class |
|-------|-----------|-------|---|---|----|----|------|-------|-----|------|-------|
| `/nurse/tasks` | NurseTasks | Y | P | P | P | P | N | L | P | N | C1-leaning |
| `/nurse/task-board` | NurseTaskBoard | Y | P | P | P | P | N | L | P | N | C1-leaning |
| `/nurse/ward` | NurseWard | Y | P | P | P | P | N | L | P | N | C1-leaning |
| `/nurse` | NurseDashboard | Y | P | N | N | P | N | L | P | N | Preview KPIs · census C1-leaning |
| `/nurse/admissions` | NurseAdmissions | Y | P | N | N | P | N | L | P | N | C1-leaning |
| `/nurse/medications` | NurseMedications | Y | P | P | P | P | N | Y | P | N | **C1** |
| `/nurse/vitals` | NurseVitals | Y | P | P | P | P | N | Y | P | N | **C1** |
| `/nurse/vitals/chart/:admissionId` | NurseVitalsChart | Y | P | P | P | P | N | Y | P | N | C1-leaning |
| `/nurse/notes/:admissionId` | NurseNotesEditor | Y | P | P | P | P | N | Y | P | N | C1-leaning |
| `/nurse/reports` | NurseReports | Y | P | P | P | P | N | Y | P | N | Preview |
| `/nurse/discharge` | NurseDischarge | Y | P | P | P | P | N | L | P | N | C1-leaning |

### Emergency

| Route | Component | Store | R | W | LC | RT | Bill | Audit | Blk | Cust | Class |
|-------|-----------|-------|---|---|----|----|------|-------|-----|------|-------|
| `/emergency` | EmergencyDashboard | Y | P | P | P | P | P | L | P | N | C1-leaning |
| `/emergency/triage` | EmergencyTriage | Y | P | P | P | P | P | L | P | N | C1-leaning |
| `/emergency/cases` | EmergencyCases | Y | P | P | P | P | P | L | P | N | C1-leaning |
| `/emergency/treatment` | EmergencyTreatment | Y | P | P | P | P | P | L | P | N | C1-leaning |
| `/emergency/orders` | EmergencyOrders | Y | P | P | P | P | P | L | P | N | C1-leaning |
| `/emergency/observation` | EmergencyObservation | Y | P | P | P | P | P | L | P | N | C1-leaning |
| `/emergency/mlc` | EmergencyMLC | Y | P | P | P | P | P | L | P | N | C1-leaning |
| `/emergency/ambulance` | EmergencyAmbulance | Y | P | P | P | P | P | L | P | N | C1-leaning |
| `/emergency/reports` | EmergencyReports | Y | P | N | N | P | N | L | N | N | C2/C4 |

### OT, Inventory, HR, Scheduling, Dialysis, CRM

| Module | Routes | Typical class |
|--------|--------|---------------|
| OT | 10 | C1-leaning · **Board/Schedule platform-capable; dashboard/pre/intra/post demo-heavy** (see OT_COORDINATOR_MODULE.md W1) |
| Inventory | 9 | C1-leaning |
| HR | 9 | Preview |
| Scheduling | 9 | Preview |
| Dialysis | 8 | C1-leaning |
| CRM | 6+ | Preview |

---

## Operational actions (store-level) — spine priority

Critical actions live in **`hospitalStore.tsx`**. Connectivity is **not** per-button in this v1 matrix; track the following as **work items**:

| Action | Spine | Platform today | Class |
|--------|-------|------------------|-------|
| `registerPatient` / `startFrontDeskVisit` | OPD | Partial (`platformRegisterOpdPatient`) | C2 |
| `checkInPatient` | OPD | Partial | C2/C7 |
| `saveConsultation` | OPD+Dx+Rx | Partial (lab/pharmacy/rad create) | C2/C5 |
| `postServiceCharge` | Billing | Partial (skip duplicate when platform) | C2 |
| `collectPayment` / billing exit | Billing | Partial | C2/C3 |
| `admitPatient` | IPD | Partial (platform sync errors **surfaced**; **`confirm_admission` still blocked** until domain bed assignment exists) | C2/C3 |
| `updateAdmissionStatus` | IPD+Discharge | Partial (**governed chain** + **`discharged`** blocked until platform orchestration **`discharged`**) | C1/C2 |
| `refreshPlatformIpdSnapshots` | IPD | Read **`GET /ipd/admissions/:id`** → merge ward/bed cache | C2/C7 |
| `updateLabStage` / `updateRadiologyOrder` | Diagnostics | Partial | C2/C7 |
| `dispensePrescription` | Pharmacy | Partial | C2/C7 |
| `updateQueueStatus` / `nextQueuePatient` | OPD | Mostly local | C3/C7 |
| `createEmergencyCase` / `triageEmergencyCase` | Emergency | **`ensureEmergencyPlatformEncounter`** on create + triage backfill | C2 |
| `transferEmergencyToIPD` | Emergency+IPD | Domain patient, **`opdVisitId`**, reuse active platform IPD | C2 |
| `startEmergencyTreatment` / observation / discharge | Emergency | Local store lifecycle; IPD path shares transfer spine | C2 |

---

## Parts 4–8 mapping (execution alignment)

| Part | This matrix section | Next engineering outputs |
|------|---------------------|----------------------------|
| **4 Remove drift** | Store + Action table | Refactor: platform-first read, store as cache only for spines 1–5 |
| **5 Realtime** | RT column | SSE subscription on all `Operational*` panels + queue + IPD board |
| **6 Timeline / search** | New routes/API | Single `GET /patient/:id/operational-journey` aggregating domain |
| **7 Customization** | Cust column | Policy UI → discharge UI → workflow UI (after C1 on spines) |

---

## Maintenance protocol

1. After each spine milestone, **update** this file (or regenerate from script).  
2. Optional follow-up: add `scripts/generate-connectivity-matrix.mjs` that greps `canUse*Runtime` / `platformFetch` per page.  
3. **Definition of done** for “Hospital OS Completion Phase”: all **P0** routes/actions **C1** on R/W/LC/Bill for `VITE_PLATFORM_RUNTIME=true`.

---

## References

- `packages/hospital-operations/src/analysis/gaps.ts` — GAP-001 … GAP-026  
- `apps/hospital-os/src/runtime/platform-store-bridge.ts` — hydration helpers  
- `apps/hospital-os/src/stores/hospitalStore.tsx` — local operational surface area  
- `services/domain-api/src/` — authoritative runtimes  

**Document owner:** Engineering — Core Hospital OS Completion Phase.

---

## Appendix A — Complete route register (from `App.tsx`)

*Class column = default aggregate for that route until per-action audit is updated.*

### Admin (23 + geo)

| Route | Default class |
|-------|----------------|
| `/admin` | C4 |
| `/admin/command-center` | C4 |
| `/admin/mortality` | C4 |
| `/admin/ai-workflow` | C4 |
| `/admin/disease-mapping` | C4 |
| `/admin/data-mining` | C4 |
| `/admin/kaizen` | C4 |
| `/admin/revenue-cycle` | C4 |
| `/admin/treatment-success` | C4 |
| `/admin/morning-briefing` | C4 |
| `/admin/staff` | C4 |
| `/admin/departments` | C4 |
| `/admin/finance` | C4 |
| `/admin/expenses` | C4 |
| `/admin/approvals` | C4 |
| `/admin/claims` | C4 |
| `/admin/mrd` | C4 |
| `/admin/mis` | C4 |
| `/admin/audit` | C4 |
| `/admin/settings` | C4 |
| `/admin/platform` | C2 |
| `/admin/onboarding` | C2 |
| `/admin/doctor-sharing` | C4 |
| `/admin/phonebook` | C4 |
| `/admin/geo-intelligence` | C4 |

### Doctor

| Route | Default class |
|-------|----------------|
| `/doctor` | C3 |
| `/doctor/patients` | C3 |
| `/doctor/queue` | C2/C7 |
| `/doctor/schedule` | C3 |
| `/doctor/labs` | C2/C7 |
| `/doctor/radiology` | C2/C7 |
| `/doctor/ipd` | C2/C3 |
| `/doctor/analytics` | C4 |
| `/doctor/patients/:patientId` | C3/C2 |
| `/doctor/ipd/:patientId` | C2/C3 |
| `/doctor/consultation/:patientId` | **C1-leaning** |

### Nurse (11)

| Route | Default class |
|-------|----------------|
| `/nurse` | C3 (demo KPIs) / census C2 |
| `/nurse/task-board` | C1-leaning / C8 blockers |
| `/nurse/ward` | C1-leaning / C8 blockers |
| `/nurse/admissions` | C1-leaning |
| `/nurse/tasks` | C1-leaning |
| `/nurse/medications` | C1 / C8 |
| `/nurse/vitals` | C1 |
| `/nurse/vitals/chart/:admissionId` | C1-leaning |
| `/nurse/notes/:admissionId` | C1-leaning |
| `/nurse/discharge` | C1/C2 |
| `/nurse/reports` | C4 |

### Reception (11)

| Route | Default class |
|-------|----------------|
| `/reception` | C3 |
| `/reception/flow` | C2 |
| `/reception/registration` | C2/C3 |
| `/reception/appointments` | **C1-leaning** |
| `/reception/checkin` | C2/C3 |
| `/reception/queue` | C2/C7 |
| `/reception/billing` | C2/C3 |
| `/reception/beds` | C3 |
| `/reception/ipd` | C2/C3 |
| `/reception/photos` | C4 |
| `/crm/drip-campaigns` | C4 (CRM) |

### Lab (6)

| Route | Default class |
|-------|----------------|
| `/lab` | Preview (dashboard KPIs local; see routeReadiness) |
| `/lab/worklist` | C2/C5/C7 |
| `/lab/samples` | C2/C7 |
| `/lab/entry` | C2/C7 |
| `/lab/verification` | C2/C7 |
| `/lab/reports` | C2/C7 |
| *(all lab routes)* | Branch worklist + `useDepartmentWorklistSync('lab')` |

### Pharmacy (11)

| Route | Default class |
|-------|----------------|
| `/pharmacy` | C3 |
| `/pharmacy/prescriptions` | C2/C7 |
| `/pharmacy/inventory` | C2/C3 |
| `/pharmacy/drugs` | C3 Preview |
| `/pharmacy/reports` | C2/C4 |
| `/pharmacy/billing` | C3 Preview |
| `/pharmacy/suppliers` | C3 Preview |
| `/pharmacy/purchase` | C3 Preview |
| `/pharmacy/queries` | C4 Preview |
| `/pharmacy/schedule-h` | C3 Preview |

### Radiology (5)

| Route | Default class |
|-------|----------------|
| `/radiology` | C2/C7 · dashboard KPIs from store; add to `routeReadiness` Live set in RAD-02 |
| `/radiology/orders` | C2/C7 |
| `/radiology/worklist` | C2/C7 |
| `/radiology/reports` | C2/C7 |
| `/radiology/settings` | C3 Preview |

### Billing department (12)

| Route | Default class |
|-------|----------------|
| `/billing-dept` | C1/C2 |
| `/billing-dept/invoices` | C1/C2 |
| `/billing-dept/payments` | C1/C2 |
| `/billing-dept/ipd-billing` | C1/C2 |
| `/billing-dept/reports` | C1/C2 |
| `/billing-dept/packages` | C1/C2 |
| `/billing-dept/revenue` | C1/C2 |
| `/billing-dept/insurance` | C1/C2 |
| `/billing-dept/finance` | C1/C2 |
| `/billing-dept/health-plans` | C1/C2 |
| `/billing-dept/gst` | C1/C2 |
| `/billing-dept/tpa-charges` | C1/C2 |
| `/billing-dept/pre-auth` | C1/C2 |
| `/billing-dept/reconciliation` | C1/C2 |

### OT (10)

| Route | Default class |
|-------|----------------|
| `/ot` … `/ot/analytics` | C1-leaning · tighten Preview badges on pre/intra/post/inventory/reports/analytics until OT-02/03 |

### Inventory (11)

| Route | Default class |
|-------|----------------|
| `/inventory`, `/inventory/issue`, `/inventory/grn`, `/inventory/catalog` | **C1-leaning** — catalog + stock-move runtime when platform on; dashboard/catalog demo fallback |
| `/inventory/stock-entry`, `/inventory/distribution`, `/inventory/requisitions`, `/inventory/procurement`, `/inventory/adjustments`, `/inventory/equipment`, `/inventory/reports` | **Preview (C4)** until INV-02/03 — honest demo arrays |

See [INVENTORY_MANAGER_MODULE.md](./docs/ROLE_MODULES/INVENTORY_MANAGER_MODULE.md).

### Emergency (9)

| Route | Default class |
|-------|----------------|
| `/emergency`, `/emergency/triage`, `/emergency/orders`, `/emergency/observation` | C1-leaning |
| `/emergency/cases`, `/emergency/treatment`, `/emergency/mlc`, `/emergency/ambulance` | C2 |
| `/emergency/reports` | C2/C4 (Preview charts + templates) |

### HR (9)

| Route | Default class |
|-------|----------------|
| `/hr`, `/hr/staff` | **C1-leaning** — `GET /hr/staff` kernel |
| `/hr/scheduling` … `/hr/reports` | C3/C4 (demo HR ops) |

### Scheduling (8)

| Route | Default class |
|-------|----------------|
| `/scheduling`, `/scheduling/book`, `/scheduling/calendar`, `/scheduling/resources`, `/scheduling/waitlist` | **C1-leaning** — `/scheduling/*` domain-api |
| `/scheduling/doctors`, `/scheduling/teleconsult`, `/scheduling/reports` | C3/C4 |

### Dialysis (8)

| Route | Default class |
|-------|----------------|
| `/dialysis` … `/dialysis/reports` | C1-leaning |

### CRM (6)

| Route | Default class |
|-------|----------------|
| `/crm`, `/crm/leads`, `/crm/lifecycle`, `/crm/campaigns`, `/admin/crm` | **C1-leaning** — `/crm/*` domain-api writes |
| `/crm/experience`, `/crm/reports` | C3/C4 |

### Dynamic / other

| Route | Notes |
|-------|--------|
| `RolePlaceholder` tabs | C4 — placeholder until module built |

**Total enumerated routes:** 180+ including parameterized paths and duplicates; **~169** static module routes + placeholders.

---

## Appendix B — Per-form audit (next iteration)

Operational actions inside `hospitalStore` and page-level forms will be extracted in a **spreadsheet or generated JSON** (`npm run audit:connectivity` — TBD). This markdown is **v1** covering **module + route + spine** level. Form-level rows should reference:

- `screen/component`
- `handler` name
- `platformFetch` / runtime call sites
