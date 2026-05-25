# Adrine Hospital OS — Enterprise-Grade Platform Audit

**Audit date:** 2026-05-20
**Auditor lens:** Hospital owner · Hospital administrator · HMS company founder · Healthcare operations consultant · Hospital workflow auditor
**Scope:** Full monorepo — `apps/` (hospital-os, patient-app, control-plane), `services/` (kernel-api, domain-api, ai-gateway, event-router, workflow-runtime), `packages/`, `infra/`
**Method:** Source-level inspection of Prisma data models (83 models), 174 domain API endpoints, ~180 UI routes, auth/RLS/RBAC enforcement paths, IaC, CI, and the project's own `MASTER_OPERATIONAL_CONNECTIVITY_MATRIX.md`.

> **One-line verdict:** This is an **architecturally ambitious, genuinely well-modeled clinical operations platform sitting on an unsecured, undeployable, untested foundation.** The data architecture and workflow engine are top-quartile for a solo build; the security, deployment, clinical-depth, and integration layers are pre-MVP. **It is not safe to handle real patient data today.**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Readiness Scorecard](#2-readiness-scorecard)
3. [System & Data Architecture](#3-system--data-architecture)
4. [Module-by-Module Audit](#4-module-by-module-audit)
5. [Cross-Cutting Audit (Security, Compliance, Performance, UX)](#5-cross-cutting-audit)
6. [End-to-End Workflow Maps](#6-end-to-end-workflow-maps)
7. [Department Interaction Analysis](#7-department-interaction-analysis)
8. [Feature Dependency Analysis](#8-feature-dependency-analysis)
9. [Technical Debt Analysis](#9-technical-debt-analysis)
10. [Persona-Based Findings](#10-persona-based-findings)
11. [Adoption & Funding Blockers](#11-adoption--funding-blockers)
12. [Competitive Analysis](#12-competitive-analysis)
13. [Priority Matrix](#13-priority-matrix)
14. [Roadmaps](#14-roadmaps)
15. [Launch Blocker Report](#15-launch-blocker-report)
16. [Production Deployment Checklist](#16-production-deployment-checklist)
17. [Scoring Methodology & Evidence Index](#17-scoring-methodology--evidence-index)

---

## 1. Executive Summary

### What Adrine is
A multi-tenant, multi-branch "Hospital OS" targeting Indian hospitals (timezone `Asia/Kolkata`, INR, GST/HSN-SAC billing, ABHA/DPDP references). Split cleanly into:

- **kernel-api** (NestJS, 38 models) — tenancy, org hierarchy, RBAC data model, policy engine, metering, SaaS billing, module entitlements, onboarding, integrations, auth.
- **domain-api** (NestJS, 45 models, 174 endpoints) — the clinical/operational runtime: OPD, IPD, EMR, lab, radiology, pharmacy, billing, bed, nursing, MAR, discharge, insurance, OT, dialysis, inventory, CRM, scheduling, escalation, AI orchestration.
- **hospital-os** (Vite/React, ~180 routes, 25+ modules) — the staff-facing UI.
- **patient-app** (Next.js, ~6 pages) — thin patient portal shell.
- **control-plane** (Next.js, ~2 files) — effectively a stub.
- **ai-gateway** (FastAPI, ~25 lines) and **event-router** (Go, ~25 lines) — **stubs**.

### The core tension
The platform was built **breadth-first**: ~180 UI routes and 83 data models exist before the foundation (authentication, tenant isolation, tests, deployable infrastructure) is in place. The result is a system that **looks** far more complete than it is operationally safe.

The project's own `MASTER_OPERATIONAL_CONNECTIVITY_MATRIX.md` is unusually honest — it self-classifies most modules as "Preview" (demo/local-only) and refuses to claim "C1 / fully connected." That engineering culture is a real asset. This audit extends that honesty one layer down: **the foundation beneath the connectivity matrix is not production-grade.**

### Top 5 findings (ranked)

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 1 | **PHI tier has no authentication.** domain-api trusts the raw `x-tenant-id` header; no JWT/guard on patient data. | 🔴 Critical | `services/domain-api/src/tenant/tenant.middleware.ts`; no `JwtAuthGuard` anywhere in domain-api |
| 2 | **Tenant isolation is not enforced at the DB.** RLS interceptor sets `app.tenant_id`, but there are **zero RLS policies and zero migrations**. Isolation = app-level `WHERE` filters only. | 🔴 Critical | `services/domain-api/src/rls/rls.interceptor.ts`; empty `prisma/migrations` |
| 3 | **Auth is a credential-less stub.** Only login path is `devLogin` (no password); JWT secret falls back to `dev-insecure-change-me`. RBAC role is self-asserted via header / localStorage. | 🔴 Critical | `services/kernel-api/src/auth/auth.service.ts`, `jwt.strategy.ts`, `common/rbac.guard.ts` |
| 4 | **~Zero automated tests** (1 example test in the whole repo) and **stub IaC** (not deployable). | 🔴 Critical | 1× `*.test.ts`; `infra/terraform` ~87 lines (vpc + `rds_stub`) |
| 5 | **Clinical depth is thin.** EMR = free-text note; no ICD/SNOMED, no drug formulary/interactions, no lab test master/reference ranges, thin Patient demographics, no consent model. Notifications/integrations have data models but **no delivery wired**. | 🟠 High | `ClinicalNote.body`, `Patient` model; no provider SDKs in `notification`/`integration` |

### What's genuinely strong (don't rebuild these)
- **Event-sourced lifecycle**: every operational entity (OPD, lab, rad, pharmacy, bed, IPD, nursing, MAR, discharge, insurance, OT, dialysis, inventory) has a paired `*Transition` table capturing `action / fromState / toState / actorId / actorRole / reason`. This is a best-practice auditable state machine foundation.
- **Concurrency & idempotency**: optimistic `version` fields, `InvoiceChargeLine.idempotencyKey`, `IdempotencyRecord`, `billingChargeKey`.
- **Outbox + DLQ**: `PlatformEvent`, `PlatformEventOutbox`, `NotificationOutbox`, `DeadLetterEvent`, `JobQueue`.
- **Multi-tenant + multi-branch + org hierarchy** with policy overrides and per-branch module entitlements.
- **Discharge orchestration** with multi-department clearance gates (clinical/nursing/pharmacy/billing/insurance) — a feature most HMS products do poorly.

---

## 2. Readiness Scorecard

> Scores are 0–100. Methodology in §17. These reflect **production-with-real-PHI** readiness, not demo readiness.

### Headline scores

| Dimension | Score | Grade | One-line |
|-----------|------:|:-----:|----------|
| **Production Readiness** | **22 / 100** | F | Unsecured PHI tier, no tests, undeployable infra. |
| **Enterprise Readiness** | **34 / 100** | D | Excellent data/governance model; enforcement, SSO, audit, SLAs absent. |
| **AI Readiness** | **27 / 100** | D- | Strong governance harness; **zero real model integration**. |
| **Clinical Depth** | **30 / 100** | D | Lifecycle engine real; EMR/coding/master-data shallow. |
| **Overall (weighted)** | **28 / 100** | F+ | Strong skeleton, missing organs and skin. |

### Production Readiness sub-scores

| Sub-dimension | Score | Notes |
|---|--:|---|
| Authentication & session | 8 | Credential-less devLogin; dev JWT secret fallback; sessions modeled but not enforced. |
| Authorization (RBAC) | 15 | Rich RBAC *data model*; enforcement via unverified header / client localStorage. |
| Tenant isolation | 10 | RLS scaffolding present, **no policies/migrations**; app-filter dependent. |
| Test coverage | 3 | 1 test file repo-wide; CI runs nothing meaningful. |
| CI/CD | 30 | Build/lint/typecheck/test gates exist; no SAST, secret scan, image scan, deploy stage. |
| Infrastructure (IaC) | 12 | VPC + `rds_stub` only; no ECS/Redis/KMS/S3/SG/secrets. |
| Observability | 25 | `otel-bootstrap` package exists; no deployed tracing/metrics/log pipeline. |
| Data migrations | 5 | No migration history; `db push` implied — unsafe for prod schema evolution. |
| Backup / DR | 0 | None defined. |
| Secrets management | 10 | `.env` only; hardcoded dev secret fallback in code. |

### Enterprise Readiness sub-scores

| Sub-dimension | Score | Notes |
|---|--:|---|
| Multi-tenancy model | 70 | tenant + branch + org hierarchy, entitlements, policy overrides — strong. |
| Multi-branch / chain support | 60 | Org hierarchy + branch overrides modeled; cross-branch reporting/roll-up not built. |
| RBAC depth | 40 | RoleTemplate/StaffAssignment/Delegation/ApprovalChain modeled; not wired to enforcement. |
| Audit & compliance | 30 | State-transition audit excellent; **no PHI read-access audit**; RLS claim unfulfilled. |
| SSO / directory | 0 | No SAML/OIDC/AD/Okta. |
| SLA / HA / scale | 20 | Outbox/queue primitives exist; no HA topology, no load testing. |
| Integrations (HL7/FHIR/ABDM) | 5 | Webhook/API-key models exist; no HL7v2, FHIR, ABDM, PACS/DICOM, lab analyzer, payment gateway. |
| Configurability | 65 | Workflow definitions, policy engine, module flags — genuinely enterprise-grade intent. |

### AI Readiness sub-scores

| Sub-dimension | Score | Notes |
|---|--:|---|
| Governance harness | 70 | Permission checks, per-tenant token quota, action logging, event emission — solid. |
| Model integration | 5 | `ai-gateway` is a stub; domain `runAction` returns hardcoded strings. No LLM/ML calls. |
| Clinical data readiness for AI | 25 | Event logs are AI-friendly; but no coded data (ICD/LOINC), so model quality is capped. |
| Safety / guardrails | 40 | "Advisory only" policy notes present; no PHI redaction, no eval harness, no human-in-loop UI. |

---

## 3. System & Data Architecture

### 3.1 Topology

```
                       ┌─────────────────────────────────────────────┐
                       │                 Clients                       │
   hospital-os (Vite)  │  patient-app (Next)   control-plane (stub)    │
        ~180 routes    │      ~6 pages              ~2 files           │
                       └───────┬───────────────────────┬──────────────┘
                               │  x-tenant-id header    │
              ┌────────────────▼─────────┐   ┌──────────▼───────────────┐
              │   kernel-api (NestJS)     │   │   domain-api (NestJS)     │
              │   tenancy/auth/governance │   │   clinical runtimes       │
              │   metering/billing/integr │   │   174 endpoints, 45 models│
              │   38 models               │   │   ⚠ NO AUTH GUARD on PHI  │
              └───────────┬───────────────┘   └──────────┬───────────────┘
                          │                               │
                          └───────────┬───────────────────┘
                                      ▼
                          PostgreSQL (single DB, no RLS policies)
                                      │
        ┌─────────────────┬──────────┴───────────┬──────────────────┐
   ai-gateway (stub)  event-router (stub)   workflow-runtime    Redis/Temporal/NATS
   FastAPI ~25L        Go ~25L              (Temporal worker)    (compose only)
```

**Architectural observations**
- Clean **kernel/domain split** (platform concerns vs clinical concerns) — correct instinct.
- **Single shared Postgres** for both services. Acceptable early, but kernel (auth/billing) and domain (PHI) sharing a DB with no RLS increases blast radius.
- **No API gateway / BFF** in front; clients call kernel and domain directly with a client-set tenant header.
- **ai-gateway / event-router** are placeholders; the "event-driven" and "AI routing" stories are aspirational.

### 3.2 Data model strengths

| Pattern | Where | Why it matters |
|---|---|---|
| Event-sourced transitions | `*Transition` tables on ~14 entities | Full who/what/when audit of every state change; replayable history. |
| Optimistic concurrency | `version Int` on Bed, IpdAdmission, Invoice, orders, etc. | Prevents lost updates under concurrent staff edits. |
| Idempotency | `InvoiceChargeLine.idempotencyKey`, `IdempotencyRecord` | Safe retries; no double-charging. |
| Outbox / DLQ | `PlatformEvent(Outbox)`, `NotificationOutbox`, `DeadLetterEvent` | Reliable eventing foundation. |
| Tenancy | `tenantId` + `branchId` on nearly every model | Multi-tenant + multi-branch native. |
| Entitlements | `ModuleCatalog`, `TenantModuleEntitlement`, `BranchModuleOverride` | Per-tenant/branch feature gating (SaaS packaging). |
| Policy engine | `PolicyDefinition` + `PolicyOverride` | Org defaults + branch overrides without code changes. |

### 3.3 Data model gaps (critical for a real HMS)

| Gap | Impact | Priority |
|---|---|---|
| **Patient model is thin** — only `mrn?, fullName, dob?`. No phone, gender, address, ABHA ID, Aadhaar (masked), blood group, allergies, emergency contact, marital status, photo. | Cannot register patients to Indian standards; no duplicate detection; ABDM-incompatible. | 🔴 Critical |
| **No patient de-duplication / merge** | Real hospitals generate duplicate MRNs daily; no merge = corrupted longitudinal record. | 🔴 Critical |
| **EMR is a free-text `ClinicalNote.body`** | No structured diagnoses, problem list, allergy list, vitals, history, templates, ICD-10/SNOMED coding. | 🔴 Critical |
| **No clinical master data** — no lab test catalog (LOINC, reference ranges, units), no drug formulary (interactions, allergy contraindications, schedule classification beyond a boolean), no ICD/CPT/procedure master, no service/tariff price list. | Charges are ad-hoc cents; no decision support; no claim coding. | 🔴 Critical |
| **No consent model** despite `opd.require_consent` policy and ABHA references. | DPDP/ABDM consent artifacts cannot be stored or proven. | 🟠 High |
| **No PHI read-access audit** — `*Transition` logs writes, not reads. | "Who viewed this record?" is unanswerable — a core healthcare compliance requirement. | 🟠 High |
| **No first-class ICU model** (ICU = ward label only; 44 UI refs, 0 models). | No ICU charting, scoring (APACHE/SOFA), ventilator/infusion tracking. | 🟠 High |
| **No ambulance/fleet model** (UI exists, no domain model). | Ambulance dispatch is demo-only. | 🟡 Medium |
| **No HR/payroll domain models** | HR module is UI-only Preview. | 🟡 Medium |
| **No document/attachment model in domain** (file handling is in kernel only). | Scanned reports, consent forms, discharge summaries have no clinical home. | 🟠 High |
| `Money` as `Int` cents, no currency-precision audit, no rounding policy table. | Acceptable for INR but formalize before scale. | 🟢 Low |

---

## 4. Module-by-Module Audit

> Format per module: **Current** · **Missing** · **Workflow issues** · **UX issues** · **Improvements** · **Enterprise recommendation** · **Priority** · **Complexity** (S ≤1wk · M 1–3wk · L 3–8wk · XL >8wk).

### 4.1 Patient Registration
- **Current:** `Patient` model + `patient.controller`; OPD registration UI (`/reception/registration`, classed C1/C2); platform patient create/search/hydrate (`platformRegisterOpdPatient`).
- **Missing:** Full demographics (phone/gender/address/ABHA/Aadhaar/blood group/allergies/kin), photo capture (UI marked C4 demo), duplicate detection & merge, KYC/ID verification, family/relationship linking, patient portal self-registration tie-in.
- **Workflow issues:** No dedup → duplicate MRNs; no mandatory-field policy enforcement server-side; `mrn` is optional and unstructured (no per-branch MRN sequence generator).
- **UX issues:** Registration depth unknown to patient app; photo flow is placeholder.
- **Improvements:** Structured demographics; MRN generator (branch-prefixed, gapless); fuzzy dedup (name+phone+dob); ABHA create/link.
- **Enterprise rec:** ABDM M1/M2 milestone compliance; Aadhaar masking + tokenization; consent capture at registration.
- **Priority:** 🔴 Critical · **Complexity:** L

### 4.2 Appointment Management & Scheduling
- **Current:** `Appointment`, `SchedulingResource`, `SchedulingWaitlistEntry`; scheduling + scheduling-hub controllers; `/reception/appointments` (C1-leaning, SSE-backed); waitlist + priority.
- **Missing:** Doctor calendars/slot templates (appointment links to a `resourceLabel` string, not a resource FK), recurring/series appointments, online booking from patient app, reminders (no delivery wired), no-show tracking & overbooking rules, resource conflict detection, multi-resource (doctor+room+equipment) booking.
- **Workflow issues:** Appointment ↔ doctor is a loose string, not a calendar; double-booking not prevented at DB level.
- **UX issues:** No drag-drop calendar evident; scheduling pages mostly Preview/C3.
- **Improvements:** Slot engine with capacity rules; ICS/calendar export; reminder pipeline.
- **Enterprise rec:** Tele-consult slots, panel-doctor sharing, queue-time SLAs.
- **Priority:** 🟠 High · **Complexity:** L

### 4.3 OPD (Outpatient)
- **Current:** **Strongest spine.** `OpdVisit` state machine + transitions; `opd.service` (324 LOC), `opd-billing.service`; governed flow registration → check-in → queue → consultation → orders → billing → completion; consultation page is the most-connected route (C1-leaning).
- **Missing:** Token/queue display board (TV screen), per-doctor queue analytics, OPD package/visit-type catalog, follow-up visit linking, vitals capture at OPD (nurse station).
- **Workflow issues:** Queue updates "mostly local" (`updateQueueStatus` C3/C7) — queue not authoritative under load; charges idempotent only "when platform on."
- **UX issues:** Dashboard/photos/drip routes are Preview; clinicians may confuse demo vs live (mitigated by Preview banners).
- **Improvements:** Server-authoritative queue with SSE; visit-type/package master; vitals step.
- **Enterprise rec:** Multi-doctor, multi-department OPD with central token system + display integration.
- **Priority:** 🟠 High · **Complexity:** M

### 4.4 IPD (Inpatient)
- **Current:** **Sophisticated.** `IpdAdmission` lifecycle + transitions; bed assignment via `resolvePlatformBedId`/`platformAssignBed`; admission-billing; ward census; `admission_requested → confirm_admission` gated on bed assignment.
- **Missing:** Ward/room-type tariff & per-diem auto-charging, bed transfer history UI, attending-doctor rounds module, daily care plan, inter-ward transfer workflow, deposit/advance ledger.
- **Workflow issues:** `confirm_admission` blocked until domain bed exists (correct, but UI must surface clearly); IPD snapshots merge via cache (C2/C7) — risk of stale ward/bed display.
- **UX issues:** Reception IPD/beds C2/C3; offline template fallback can diverge from server.
- **Improvements:** Automated bed/per-diem charge accrual; transfer workflow; advance/deposit tracking.
- **Enterprise rec:** Real-time bed board across branches; occupancy forecasting.
- **Priority:** 🟠 High · **Complexity:** L

### 4.5 EMR / EHR
- **Current:** `Encounter` + `ClinicalNote` (free text); EMR controller; notes attach to encounter.
- **Missing:** **Almost everything a real EMR needs** — structured problem list, diagnoses with ICD-10, allergy list (hard-stop on prescribing), medication history, vitals trends, clinical templates/order sets, growth charts, immunization, family/social history, clinical document versioning, e-signatures, addendums, clinician attribution lock.
- **Workflow issues:** Free-text notes are not queryable, not codeable, not safe for decision support.
- **UX issues:** No structured charting UI evident.
- **Improvements:** Structured encounter model; SOAP templates; problem/allergy/med lists; ICD-10 picker.
- **Enterprise rec:** FHIR R4 resource mapping (Patient, Encounter, Condition, Observation, MedicationRequest); ABDM health record linking.
- **Priority:** 🔴 Critical · **Complexity:** XL

### 4.6 Billing (Patient)
- **Current:** **Strong financial core.** `Invoice` + `InvoiceChargeLine` (idempotent) + `InvoiceTransition` + `PaymentRecord`; `billing-sync.service` (685 LOC — largest service); GST rate, receipt numbers (unique), partial payments, corporate/insurance modes, `guardInvoiceTransition`.
- **Missing:** Service/tariff master & price lists, package/bundle billing, discount approval workflow (ApprovalChain exists in kernel but not wired), credit notes/refunds UI, day-end cashier reconciliation & cash drawer, tax invoice PDF (GST-compliant format), TPA/corporate ledgers, write-offs.
- **Workflow issues:** Charges idempotent "when platform on"; settlement "partial" (C2/C3); revenue/GST/TPA pages are C4 demo.
- **UX issues:** Many billing-dept routes (packages, revenue, insurance, finance, health-plans, gst, tpa-charges) are pure Preview — risk of looking complete.
- **Improvements:** Charge master; GST tax-invoice generation; refund/credit-note lifecycle; cashier shift reconciliation.
- **Enterprise rec:** Multi-payer ledgers, corporate contracts, package profitability, revenue-cycle KPIs.
- **Priority:** 🔴 Critical (charge master + tax invoice) · **Complexity:** L

### 4.7 Insurance / TPA
- **Current:** `InsuranceAuthorization` lifecycle + transitions (initiated → approved → settled); insurance-runtime service; discharge insurance-clearance gate.
- **Missing:** Pre-auth request/response documents, query-response loop with TPA, claim submission & tracking, denial management, e-claim formats (e.g., NHCX/ABDM claims), coverage/eligibility check, co-pay/deductible computation.
- **Workflow issues:** Authorization is a state machine but not connected to any payer/clearinghouse; settlement is manual.
- **UX issues:** Billing insurance pages are C4 demo.
- **Improvements:** Document attachments on authorization; query loop; claim export.
- **Enterprise rec:** NHCX / payer integration; cashless workflow; denial analytics.
- **Priority:** 🟠 High · **Complexity:** L

### 4.8 Pharmacy
- **Current:** **Deep.** `PharmacyFulfillment` lifecycle + transitions; `PharmacyStockItem` with batch/expiry/reservation; `pharmacy-runtime.service` (644 LOC); controlled-drug flag + approval; inventory reservation model; dispense → billing charge.
- **Missing:** Drug master/formulary (generic mapping is a string), drug-drug & drug-allergy interaction checks, dosage/route validation, expiry/FEFO auto-picking, purchase orders & GRN (procurement is Preview), supplier ledger, Schedule-H/H1 register compliance, barcode dispensing, return-to-stock.
- **Workflow issues:** Stock authoritative only "when platform on" (C2/C3); procurement/suppliers/drugs/purchase routes are Preview.
- **UX issues:** Most pharmacy sub-routes Preview; risk of demo confusion.
- **Improvements:** Formulary + interaction engine; FEFO; PO/GRN lifecycle; Schedule-H register.
- **Enterprise rec:** Multi-store pharmacy, narcotic register, e-prescription standards.
- **Priority:** 🟠 High (formulary + interactions) · **Complexity:** L

### 4.9 Laboratory / LIMS
- **Current:** `LabDiagnosticOrder` lifecycle + transitions; critical-result flag + ack; sample barcode field; lab-runtime service (383 LOC); branch worklist + SSE; stage governance.
- **Missing:** Test catalog/master (LOINC, specimen type, container, reference ranges by age/sex, units), result entry with validation/flags, analyzer interfacing (HL7/ASTM), QC/calibration, accession numbering, report templates & authorization (pathologist sign-off), delta checks, panel/profile definitions.
- **Workflow issues:** `tests` is a free string (no catalog); no realtime hydration on some lists (C7); reports lack structured results.
- **UX issues:** Worklist C2/C5/C7 — drift risk flagged in matrix.
- **Improvements:** Test master; structured results + reference ranges; analyzer HL7 inbound.
- **Enterprise rec:** Full LIMS with QC, NABL-compliant reports, machine interfacing.
- **Priority:** 🔴 Critical (test master + results) · **Complexity:** XL

### 4.10 Radiology / PACS
- **Current:** `RadiologyStudyOrder` lifecycle + transitions; modality field; critical flag; radiology-runtime (340 LOC); worklist + SSE; status governance.
- **Missing:** **DICOM/PACS integration** (no image storage/viewer), modality worklist (DICOM MWL), structured report templates + radiologist sign-off, dose tracking, CD/film tracking, comparison priors.
- **Workflow issues:** Scheduling fields local; report is a JSON blob, not structured.
- **UX issues:** Settings route Preview; no image viewing.
- **Improvements:** PACS/DICOM bridge (Orthanc/dcm4chee), structured RIS reports.
- **Enterprise rec:** Full RIS-PACS; teleradiology routing.
- **Priority:** 🟠 High · **Complexity:** XL

### 4.11 Bed Management
- **Current:** **Excellent model.** `BedUnit` + `Bed` (state machine + version + transitions); unique bed labels; `currentAdmissionId`; bed board from `GET /beds` + census.
- **Missing:** Bed-type tariff linkage, housekeeping/turnaround state (cleaning), bed-block/maintenance reasons, inter-branch bed visibility, occupancy analytics & forecasting, isolation/infection-control flags.
- **Workflow issues:** Board falls back to local template offline — divergence risk.
- **UX issues:** C2/C3; offline vs live ambiguity.
- **Improvements:** Housekeeping lifecycle; tariff link; live cross-branch board.
- **Enterprise rec:** Capacity command center across chain.
- **Priority:** 🟡 Medium · **Complexity:** M

### 4.12 OT (Operating Theatre)
- **Current:** `OtRoom` + `OtCase` lifecycle + transitions; surgeon, priority, scheduling, billing charge key; UI 10 routes.
- **Missing:** OT scheduling board with conflict detection, surgical team & anesthesia, consumables/implant tracking, pre-op checklist (WHO surgical safety), post-op notes, sterilization (CSSD) linkage, OT utilization analytics.
- **Workflow issues:** Matrix classes OT as Preview (entitlement read only) — backend model exists but UI not connected.
- **UX issues:** Preview only.
- **Improvements:** Connect OT UI to `OtCase` runtime; scheduling board; safety checklist.
- **Enterprise rec:** Implant traceability, anesthesia record, OT costing.
- **Priority:** 🟡 Medium · **Complexity:** L

### 4.13 ICU / Critical Care
- **Current:** **Not a first-class module.** ICU referenced as a ward type/label in 44 files; no ICU domain model.
- **Missing:** ICU flowsheet (hourly vitals/IO), ventilator & infusion pump charting, severity scoring (APACHE II/SOFA), nurse-patient ratio, critical alerts, ICU-specific orders.
- **Workflow issues:** ICU patients ride the generic IPD/MAR/nursing path — insufficient for critical care.
- **UX issues:** No ICU-specific UI.
- **Improvements:** Dedicated ICU flowsheet + scoring; device data ingestion.
- **Enterprise rec:** Tele-ICU readiness, eICU dashboards.
- **Priority:** 🟠 High (for hospitals with ICUs) · **Complexity:** XL

### 4.14 Emergency / Ambulance
- **Current:** Emergency is **C1-leaning** — strongest after OPD. ER board, triage, orders, observation, IPD transfer via `transferEmergencyToIPD`; `useEmergencyOperationalStream` SSE; MLC flag. Ambulance UI exists.
- **Missing:** Triage scales (ESI/MTS) as structured data, ED tracking board timers, ambulance dispatch/fleet model, MLC register & medico-legal documents, mass-casualty mode, ED-specific order sets.
- **Workflow issues:** Cases/treatment store-based (C2); ambulance has no domain model (demo).
- **UX issues:** Reports charts Preview.
- **Improvements:** Structured triage; ambulance domain model; MLC register.
- **Enterprise rec:** 108/emergency integration, bed pre-alert, trauma workflows.
- **Priority:** 🟠 High · **Complexity:** L

### 4.15 Nursing & MAR
- **Current:** `NursingTask`, `NursingVitalRound`, `NursingNote`, `MedicationSchedule` (MAR) + transitions; nursing & nursing-clinical controllers; discharge nursing-clearance; "MAR medications when runtime on."
- **Missing:** Five-rights barcode med admin, eMAR scan workflow, shift handover (SBAR) structured, care plans, nurse rostering linkage, fall/pressure-ulcer assessments, IV/fluid balance.
- **Workflow issues:** Nurse vitals/meds/reports routes Preview; blockers flagged C8 (missing operational blockers) in matrix.
- **UX issues:** Vitals shell only; task board C3/C8.
- **Improvements:** Barcode eMAR; SBAR handover; structured assessments.
- **Enterprise rec:** Nurse mobile app; alarm management.
- **Priority:** 🟠 High · **Complexity:** L

### 4.16 Discharge Management
- **Current:** **Best-in-class intent.** `DischargeOrchestration` with clinical/nursing/pharmacy/billing/insurance clearance timestamps + transitions; unified `OperationalDischargePanel` across roles; `complete_discharge` gated.
- **Missing:** Discharge summary document generation (clinical), discharge medication reconciliation, follow-up scheduling, patient instructions/education, TAT analytics (admission→discharge), death/DAMA/LAMA/transfer disposition variants.
- **Workflow issues:** Strong gating, but discharge summary artifact not produced; depends on EMR depth (which is thin).
- **UX issues:** Multi-role panel is a strength; ensure consistency.
- **Improvements:** Summary generator; med reconciliation; disposition types.
- **Enterprise rec:** Discharge TAT SLAs; readmission tracking.
- **Priority:** 🟠 High · **Complexity:** M

### 4.17 HR / Payroll
- **Current:** UI only (9 routes, Preview); kernel `PlatformUser` + `StaffAssignment` for access, not HR.
- **Missing:** Employee master, attendance/biometric, shift rostering, leave, payroll (PF/ESI/TDS for India), appraisals, credentialing/license expiry, duty roster ↔ scheduling link.
- **Workflow issues:** No domain models; entirely demo.
- **Improvements:** Defer or integrate a dedicated HRMS rather than build from scratch.
- **Enterprise rec:** Integrate with existing HRMS/payroll; focus build on clinical credentialing.
- **Priority:** 🟡 Medium (consider buy-vs-build) · **Complexity:** XL

### 4.18 Inventory / Supply Chain
- **Current:** `InventoryCatalogItem` + `InventoryStockMove` lifecycle + transitions; reorder level; unit cost; UI 9 routes (Preview).
- **Missing:** Purchase requisition → PO → GRN → invoice 3-way match, supplier master & ledger, batch/expiry for general (not just pharmacy), asset register & biomedical equipment maintenance, consumption by department, min-max auto-reorder.
- **Workflow issues:** Backend model exists; UI Preview (not connected).
- **Improvements:** Connect inventory UI to stock-move runtime; PO/GRN; supplier ledger.
- **Enterprise rec:** Central warehouse + branch indents; vendor portal.
- **Priority:** 🟡 Medium · **Complexity:** L

### 4.19 CRM / Patient Engagement
- **Current:** `CrmLead`, `CrmCampaign`, `CrmLifecycleEvent` (persisted, not local-only); crm controller; UI 6 routes.
- **Missing:** Real campaign execution (no delivery wired), feedback/NRS/NPS capture, loyalty/membership, referral tracking & doctor commissions, recall/follow-up automation.
- **Workflow issues:** Campaign `reachCount` but no send pipeline; lifecycle events not triggered automatically.
- **Improvements:** Wire notification delivery; feedback capture; recall automation.
- **Enterprise rec:** Omnichannel engagement; referral economics.
- **Priority:** 🟢 Low–Medium · **Complexity:** M

### 4.20 Dialysis
- **Current:** `DialysisMachine` + `DialysisSession` lifecycle + transitions; package code; billing charge key; UI 8 routes (Preview).
- **Missing:** Dialysis flowsheet (pre/intra/post weights, UF, vitals), reuse tracking, HCV/HBV station segregation, nephrologist orders, EPO/drug protocols.
- **Workflow issues:** Backend model exists; UI Preview.
- **Improvements:** Connect UI; dialysis flowsheet.
- **Priority:** 🟢 Low–Medium · **Complexity:** M

### 4.21 Analytics / Dashboards
- **Current:** `analytics.controller`, `operational-analytics.service`, command snapshot (`buildSnapshot`), `TenantMetricsSnapshot`; admin command-center C1-leaning; AI morning-briefing aggregates counts/escalations.
- **Missing:** Configurable dashboards, scheduled reports/exports, drill-down, financial/clinical KPI library, cohort/quality metrics (LOS, mortality, infection), data warehouse/BI export, real charts on most "reports" routes (Preview/C4).
- **Workflow issues:** Most reports pages are demo charts; analytics not warehoused.
- **Improvements:** KPI library; export pipeline; BI connector.
- **Enterprise rec:** Chain-level executive dashboards; benchmarking.
- **Priority:** 🟡 Medium · **Complexity:** L

### 4.22 Notifications
- **Current:** `NotificationTemplate`, `NotificationOutbox`, `NotificationDelivery` (outbox + retry); notification controllers in both services.
- **Missing:** **No actual delivery provider wired** (no Twilio/SendGrid/SES/MSG91/WhatsApp Business). Templates exist; nothing sends. No preference center, no DND/opt-out, no delivery analytics.
- **Workflow issues:** Outbox accumulates; deliveries never fire → reminders, OTPs, results-ready all silent.
- **Improvements:** Wire SMS/email/WhatsApp providers; DLT template registration (India SMS compliance); retry worker.
- **Enterprise rec:** Multi-provider failover; consent-aware comms.
- **Priority:** 🟠 High · **Complexity:** M

### 4.23 RBAC / Permissions
- **Current:** Rich kernel model (`RoleTemplate`, `StaffAssignment`, `DelegationGrant`, `ApprovalChain`); domain `DomainRbacGuard` wired as APP_GUARD; frontend `AuthContext.canAccess`/`ProtectedRoute`.
- **Missing:** **Enforcement bound to identity.** Domain RBAC reads role from unverified `x-actor-role` header/body and allows all GET reads; frontend gates on localStorage role; RoleTemplate permissions never reach enforcement. No field-level/record-level permissions; no break-glass; no segregation-of-duties.
- **Workflow issues:** Role is self-asserted → privilege escalation trivial.
- **Improvements:** Derive role/permissions from verified JWT + StaffAssignment; enforce on reads; map RoleTemplate → guard.
- **Enterprise rec:** ABAC for PHI; break-glass with audit; SoD policies.
- **Priority:** 🔴 Critical · **Complexity:** M

### 4.24 Audit Logs
- **Current:** `AuditLog` (kernel, append-only intent) + `PlatformEvent` (domain) + per-entity `*Transition` chains. Excellent **write/state** auditability.
- **Missing:** **PHI read-access audit** (who viewed which record), tamper-evidence (hash chaining/WORM), audit search/export UI, retention policy, RLS on audit tables (comment claims it; not implemented).
- **Workflow issues:** Cannot answer "who accessed patient X's record" — a baseline compliance question.
- **Improvements:** Read-access interceptor logging; immutable storage; audit explorer.
- **Enterprise rec:** SIEM export; tamper-evident logs; retention by jurisdiction.
- **Priority:** 🟠 High · **Complexity:** M

### 4.25 AI Features
- **Current:** Governance harness is solid — `AIOrchestrationService.execute` checks permissions, enforces per-tenant token quota (`AITenantQuota`), logs (`AIActionLog`), emits events; action catalog (`getAIAction`); context builder pulls patient/visit/admission graphs.
- **Missing:** **Any real intelligence.** `runAction` returns hardcoded strings ("Stub output for…"); `ai-gateway` is a 25-line stub; no LLM/ML calls, no embeddings, no RAG, no PHI redaction, no eval/guardrail harness, no human-in-loop review UI.
- **Workflow issues:** AI "features" are plumbing; outputs are templates.
- **Improvements:** Wire a provider via ai-gateway with prompt-caching + cost controls; start with low-risk summarization (discharge summary draft, OPD note draft) with human sign-off; PHI minimization before egress.
- **Enterprise rec:** On-prem/India-region model option for data residency; clinical eval suite; audit of AI suggestions accepted/rejected.
- **Priority:** 🟡 Medium (differentiator, not a blocker) · **Complexity:** L

### 4.26 Multi-Tenant Architecture
- **Current:** Strong: tenant+branch on all models, org hierarchy, entitlements, policy overrides, per-branch module flags, tenant provisioning + onboarding.
- **Missing:** **Enforced isolation** (RLS), tenant lifecycle (suspend/offboard/data-export-on-exit), noisy-neighbor controls, per-tenant encryption keys, tenant-scoped backups.
- **Workflow issues:** Isolation depends on app filters; one missing `WHERE` = cross-tenant leak.
- **Improvements:** RLS policies + migration; tenant offboarding/export; key-per-tenant (KMS).
- **Priority:** 🔴 Critical · **Complexity:** M (RLS) / L (full lifecycle)

### 4.27 Integrations & API
- **Current:** 174 domain endpoints; kernel `ApiKey` (hashed, rate-limit), `WebhookSubscription`/`Delivery`, `IntegrationConnection`; Swagger (`/api/docs`).
- **Missing:** **Healthcare interop** — HL7v2, FHIR R4, ABDM (ABHA/HIP/HIU), DICOM/PACS, lab analyzer interfaces, payment gateway, accounting (Tally), SMS-DLT. Webhook **delivery not wired** (model only). No public API versioning/SDK/docs portal. No rate-limit enforcement evidence.
- **Workflow issues:** Integration models exist but no outbound delivery; no inbound adapters.
- **Improvements:** FHIR facade; ABDM milestones; payment gateway; webhook delivery worker.
- **Enterprise rec:** Integration engine (Mirth-style) or managed iPaaS.
- **Priority:** 🟠 High (FHIR/ABDM/payments) · **Complexity:** XL

### 4.28 Patient App
- **Current:** Next.js shell — login, dashboard, appointments, prescriptions, reports (~6 pages).
- **Missing:** Self-registration, online booking & payment, report/Rx download, teleconsult, feedback, ABHA linking, notifications, family profiles.
- **Workflow issues:** Thin; depends on unsecured domain-api.
- **Improvements:** Build booking+payment+reports against secured APIs.
- **Priority:** 🟡 Medium · **Complexity:** L

### 4.29 Control Plane
- **Current:** ~2 files — effectively a stub (intended super-admin/SaaS ops console).
- **Missing:** Tenant management, billing/usage dashboards, feature-flag console, support tooling, platform health.
- **Priority:** 🟡 Medium (needed before multi-tenant GA) · **Complexity:** L

---

## 5. Cross-Cutting Audit

### 5.1 Security & Compliance (the blocker tier)

| Issue | Detail | Severity |
|---|---|---|
| No authn on PHI tier | domain-api has no JWT guard; trusts `x-tenant-id`. | 🔴 Critical |
| Tenant isolation not enforced | No RLS policies/migrations; `set_config` is dead. | 🔴 Critical |
| Credential-less login | `devLogin` issues tokens with no password; dev secret fallback. | 🔴 Critical |
| Self-asserted RBAC | Role from `x-actor-role` header / localStorage. | 🔴 Critical |
| No PHI read audit | Cannot prove who viewed records. | 🟠 High |
| No consent management | DPDP/ABDM consent not captured/stored. | 🟠 High |
| No encryption strategy | No KMS, no field-level encryption for sensitive PHI, no at-rest config (IaC stub). | 🟠 High |
| No secrets management | `.env` + hardcoded fallback. | 🟠 High |
| No DR/backup | None. | 🟠 High |
| MFA not enforced | `MfaChallenge` model + service exist; not in login path. | 🟡 Medium |

**Compliance posture:** Not ready for **DPDP Act (India)**, **ABDM**, or **HIPAA-equivalent** controls. The README's "scaffolding only / not for production PHI" disclaimer is currently accurate and load-bearing — keep it until the blocker tier is closed.

### 5.2 Data Architecture Concerns
- No migration history (schema evolution unsafe).
- Single DB for kernel + domain (blast radius).
- Thin clinical models (see §3.3) cap product quality.
- No data retention/archival/purge policy.
- JSON blobs for results/reports (`labOrder.results`, `radiologyOrder.report`) — flexible but unqueryable and unvalidated.

### 5.3 Performance & Scalability
- **Indexing:** Generally good — composite indexes on `(tenantId, …)` across models.
- **Risks:** 5,560-line client store (`hospitalStore.tsx`) → re-render & maintainability issues; "store as cache" pattern with partial SSE → drift; queue ops local → contention under load; no pagination strategy verified on 174 endpoints; no load testing; no caching layer usage evident (Redis in compose, usage unverified).
- **No autoscaling/HA** (IaC stub); single Postgres without read replicas.

### 5.4 Mobile & Responsive
- Viewport meta present; **517 responsive utility usages** → responsive intent is real. **49 fixed-width/overflow** spots → dense tables will overflow on phones. Desktop/tablet-first is appropriate for staff OS; **nurse/doctor mobile workflows and patient app need dedicated mobile UX**.

### 5.5 UX System
- Component library (`components/ui`), Preview banners, Live/Preview navbar — good honesty cues. Risk: ~half of routes are Preview/demo; without the banners, staff could mistake demo for live. Consistency of the multi-role discharge panel is a UX strength.

---

## 6. End-to-End Workflow Maps

### 6.1 OPD (registration → completion) — *most complete*
```
Patient arrives
  → [Reception] Register/search  (C1/C2; no dedup)               ⚠ duplicate MRN risk
  → Book/confirm appointment      (C1-leaning, SSE)
  → Check-in                      (C2→C1; OpdVisit transition)
  → Queue / token                 (C3/C7 local)                  ⚠ not authoritative under load
  → [Doctor] Consultation         (C1-leaning; orders+notes)     ⚠ note is free text (no coding)
  → Orders: lab / rad / Rx        (created with opdVisitId)
  → fulfill_or_defer_orders       (live hydration)
  → [Billing] Charges (idempotent when platform on) → Payment    ⚠ no charge master / tax invoice
  → complete_consultation → OPD completion
```
**Breakpoints:** dedup, authoritative queue, structured note/coding, charge master, receipt/GST invoice.

### 6.2 IPD + Discharge — *sophisticated, gated*
```
Admission request → confirm_admission (BLOCKED until bed assigned ✅)
  → Bed assign (resolvePlatformBedId + platformAssignBed; version-guarded ✅)
  → Nursing: tasks / vitals / MAR (MAR live when runtime on)     ⚠ no barcode 5-rights
  → Orders/diagnostics/Rx (shared spines)
  → DISCHARGE ORCHESTRATION (multi-clearance ✅):
      clinical → nursing → pharmacy → billing → insurance
      → complete_discharge (gated on all clearances ✅)
  → updateAdmissionStatus('discharged') requires platform 'discharged' ✅
```
**Breakpoints:** no discharge **summary document**, no med reconciliation, no per-diem auto-charge, ICU rides generic path.

### 6.3 Emergency → IPD — *C1-leaning*
```
ER register/triage (SSE board) → orders/observation
  → transferEmergencyToIPD (reuse platform IPD, opdVisitId on admit ✅, no duplicate ✅)
```
**Breakpoints:** structured triage scale, ambulance domain model, MLC register.

### 6.4 Diagnostics (lab/rad)
```
Order (opdVisitId/encounterId) → sample/accession → in-process → result/report → critical ack → billed
```
**Breakpoints:** no test master/reference ranges, no analyzer/PACS interface, results as JSON blob.

### 6.5 Revenue Cycle
```
Charge capture (idempotent lines) → invoice → payment/partial → insurance auth → settlement → (GST invoice ❌) → reconciliation ❌
```
**Breakpoints:** charge master, tax-invoice generation, TPA claim loop, day-end reconciliation.

---

## 7. Department Interaction Analysis

| From ↓ / To → | Reception | Doctor | Nursing | Lab | Radiology | Pharmacy | Billing | Insurance | Discharge |
|---|---|---|---|---|---|---|---|---|---|
| **Reception** | — | visit/queue ✅ | — | — | — | — | charges ⚠ | — | — |
| **Doctor** | queue ✅ | — | orders ⚠ | order ✅ | order ✅ | Rx ✅ | charge keys ✅ | — | clinical clearance ✅ |
| **Nursing** | — | tasks ⚠ | — | sample ⚠ | — | MAR ✅ | — | — | nursing clearance ✅ |
| **Lab** | — | results ⚠C7 | sample ⚠ | — | — | — | charge ✅ | — | — |
| **Radiology** | — | report ⚠C7 | — | — | — | — | charge ✅ | — | — |
| **Pharmacy** | — | — | MAR ✅ | — | — | — | charge ✅ | — | pharmacy clearance ✅ |
| **Billing** | invoice ⚠ | — | — | — | — | — | — | mode ✅ | billing clearance ✅ |
| **Insurance** | — | — | — | — | — | — | settle ⚠ | — | insurance clearance ✅ |
| **Discharge** | handoff ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ | — |

✅ = governed path exists · ⚠ = partial / local / realtime gap (C7) · — = none.
**Insight:** vertical clinical→billing and the discharge clearance fan-in are well-connected; **realtime hydration (C7)** and **nursing/orders** edges are the weak seams.

---

## 8. Feature Dependency Analysis

```
SECURITY FOUNDATION (authn + RLS + identity-bound RBAC)   ← blocks EVERYTHING with real data
        │
        ├── Patient master (demographics + dedup + ABHA)
        │        └── EMR (structured + ICD) ── Clinical decision support ── AI clinical features
        │        └── Consent ── ABDM/DPDP compliance
        │
        ├── Clinical master data (test catalog / drug formulary / charge master / ICD)
        │        ├── LIMS results + reference ranges
        │        ├── Pharmacy interactions + Schedule-H
        │        └── Billing charge master + GST tax invoice ── Revenue cycle ── Insurance/NHCX
        │
        ├── Notification delivery (provider) ── reminders / OTP / results-ready / CRM campaigns
        │
        └── Deployable IaC + observability + backups ── any production pilot
                 └── Control plane ── multi-tenant GA / onboarding at scale
```
**Critical path to a safe pilot:** Security foundation → Patient master + consent → Charge master + tax invoice → Notification delivery → Deployable IaC. EMR depth, LIMS, PACS, AI build *after* the pilot is safe.

---

## 9. Technical Debt Analysis

| Debt | Severity | Interest (cost of delay) |
|---|---|---|
| `hospitalStore.tsx` = 5,560 lines (god object) | 🟠 High | Slows every UI change; re-render perf; merge conflicts. |
| "Store-as-truth, platform-as-partial" dual sources | 🟠 High | Drift between UI and server (matrix's own C5/C7 warnings). |
| No migrations (`db push`) | 🔴 Critical | Cannot evolve prod schema safely; no rollback. |
| ~Zero tests | 🔴 Critical | Every change risks silent regression in clinical/billing logic. |
| Stub services presented in topology (ai-gateway, event-router) | 🟡 Medium | Implies capability not present; diligence risk. |
| Generated Prisma client committed (147k+ LOC) | 🟢 Low | Repo bloat; should be build-time. |
| Free-text/JSON clinical data (notes, results, reports) | 🟠 High | Blocks coding, analytics, AI, interop. |
| Dev backdoors (`devLogin`, `tenant_dev`, dev secret) | 🔴 Critical | Must be compiled out / guarded for prod. |
| Kernel schema formatting inconsistency (double-spaced top) | 🟢 Low | Cosmetic. |

---

## 10. Persona-Based Findings

| Persona | Biggest win today | Biggest blocker / pain |
|---|---|---|
| **Doctor** | Governed consultation + orders + discharge clearance | Free-text EMR (no templates/coding), no decision support, no mobile rounds |
| **Nurse** | MAR + nursing tasks/vitals models | No barcode 5-rights, vitals/handover are Preview, blockers not surfaced (C8) |
| **Receptionist** | OPD register/queue/appointments connected | No dedup, queue not authoritative, photos demo |
| **Hospital admin** | Command center + morning briefing aggregates | Most dashboards Preview; no configurable reports/exports |
| **Billing staff** | Idempotent charge lines, partial payments, receipts | No charge master, no GST tax invoice, no day-end reconciliation |
| **Lab technician** | Worklist + critical flags + SSE | No test master/reference ranges, no analyzer interface |
| **Radiologist** | Order lifecycle + critical flag | **No PACS/image viewing**, unstructured report |
| **Pharmacist** | Batch/expiry stock + controlled-drug gate | No formulary/interactions, procurement Preview, no Schedule-H register |
| **Patient** | App shell (appointments/Rx/reports) | No booking/payment, no report download, depends on unsecured API |
| **Super admin** | Provisioning + onboarding + entitlements | Control-plane is a stub; no platform ops console |
| **Multi-branch owner** | Org hierarchy + per-branch overrides | No cross-branch roll-up reporting, no chain command center |
| **Investor** | Breadth + architecture quality + honesty culture | Unsafe for PHI, undeployable, untested → not fundable as "production" |
| **Enterprise chain** | Configurability (policy/workflow/entitlement) | No SSO, no interop (HL7/FHIR/ABDM/PACS), no SLA/HA, no compliance evidence |

---

## 11. Adoption & Funding Blockers

### What prevents production readiness
1. No authentication on the PHI tier.
2. No enforced tenant isolation (RLS).
3. No real auth/identity-bound RBAC.
4. No tests, no migrations, no deployable infra, no backups/DR.
5. No notification delivery; no charge master/tax invoice.

### What prevents large-hospital adoption
1. No interoperability (HL7/FHIR/ABDM/DICOM/lab analyzers).
2. No SSO/AD/Okta; no break-glass; no SoD.
3. Thin EMR/LIMS/PACS clinical depth.
4. No compliance evidence (DPDP/ABDM/audit/read-access logs/consent).
5. No HA/SLA/DR; no published security posture.

### What prevents investor funding (as "production")
1. "Demo that can leak PHI" is a legal/existential risk, not a moat.
2. Breadth ≠ depth: ~half of routes are Preview; AI is stubbed.
3. No proof of scale, no design-partner data running safely.
4. *However:* the data/workflow architecture + honesty culture are a credible **team-quality** signal — fundable as a **pre-seed/seed eng team**, not as a finished product.

### Must-build immediately before any launch
See [§15 Launch Blocker Report](#15-launch-blocker-report).

---

## 12. Competitive Analysis

| Competitor class | Where they'd outperform Adrine today | Where Adrine could win |
|---|---|---|
| **Epic / Cerner (Oracle Health)** | Depth, interop, certification, scale, EMR/CPOE | Cost, India-fit, configurability, modern UX |
| **Birlamedisoft / Medixcel / Insta (Practo) / KareXpert (India HMS)** | Live deployments, ABDM/NABH compliance, billing/GST maturity, support | Cleaner architecture, workflow governance, multi-branch model |
| **eHospital/NIC** | Govt adoption, compliance | UX, speed, configurability |
| **Best-of-breed LIMS/PACS/Pharmacy** | Deep single-domain features (analyzers, DICOM, formulary) | Unified operational spine + discharge orchestration |

**Honest competitive read:** Adrine's **differentiators-in-waiting** are (a) the governed, event-sourced operational spine, (b) discharge orchestration, (c) per-tenant/branch configurability, and (d) an AI governance harness. None of these are defensible until the security/clinical-depth/interop gaps close. Today, any established India HMS would outperform on *deployability, compliance, billing, and interop* — the things hospitals actually buy on.

---

## 13. Priority Matrix

### 🔴 Critical (do before any real-data pilot)
| Item | Module | Complexity |
|---|---|---|
| Authn guard on domain-api, identity-bound tenant | Security | M |
| RLS policies + migration; move `set_config` into tx | Multi-tenant | M |
| Real login (password/SSO), kill devLogin in prod, required JWT secret | Auth | M |
| Identity-bound RBAC (JWT + StaffAssignment), enforce on reads | RBAC | M |
| Migration history (stop `db push`) | Data | S |
| Patient master expansion + dedup | Registration | L |
| Charge master + GST tax invoice | Billing | L |
| Test suite for isolation + billing/discharge guards | Quality | M |
| Deployable IaC (RDS/ECS/Redis/KMS/SG/secrets) + backups | Infra | L |

### 🟠 High (pilot → early customers)
| Item | Module | Complexity |
|---|---|---|
| Structured EMR (problem/allergy/med lists, ICD-10, templates) | EMR | XL |
| Lab test master + structured results + reference ranges | LIMS | XL |
| Drug formulary + interaction/allergy checks | Pharmacy | L |
| Notification delivery (SMS-DLT/email/WhatsApp) | Notifications | M |
| PHI read-access audit + consent model | Compliance | M |
| Insurance claim loop; payment gateway | Insurance/Billing | L |
| FHIR facade + ABDM milestone 1 | Integrations | XL |
| Discharge summary + med reconciliation | Discharge | M |
| PACS/DICOM bridge | Radiology | XL |
| ICU flowsheet + scoring | ICU | XL |

### 🟡 Medium
OT UI↔runtime, Inventory PO/GRN, Analytics KPI library + exports, Control plane, Patient app booking/payment, Emergency triage scales + ambulance model, Bed housekeeping/tariff, eMAR barcode.

### 🟢 Low
CRM campaign execution, Dialysis flowsheet, repo hygiene (uncommit generated Prisma), schema formatting, money-precision policy.

---

## 14. Roadmaps

### 14.1 Structured Phased Roadmap

**Phase 0 — Make it safe & deployable (Weeks 1–6) — "Foundation"**
- [ ] domain-api JWT guard; tenant from token, not header
- [ ] RLS policies + first migration; `set_config` in `$transaction`
- [ ] Real auth (password + optional OIDC), enforce MFA for admin; remove dev backdoors in prod
- [ ] Identity-bound RBAC; enforce on reads; map RoleTemplate→guard
- [ ] Migration baseline; CI adds SAST + secret scan + dependency audit
- [ ] Tests: tenant-isolation, RBAC, billing math, discharge gates (target: the 30 that matter)
- [ ] Terraform: RDS(KMS-encrypted)+ECS+Redis+SG+secrets+backups; one environment stands up
- [ ] Secrets manager; remove `.env`/hardcoded fallback

**Phase 1 — Make it sellable for a single hospital (Weeks 7–16) — "Operational MVP"**
- [ ] Patient master + dedup + MRN generator
- [ ] Charge master + GST tax-invoice PDF + day-end reconciliation
- [ ] Notification delivery (SMS-DLT, email, WhatsApp) + reminders/OTP/results-ready
- [ ] Lab test master + structured results + reference ranges
- [ ] Drug formulary + interaction/allergy checks; Schedule-H register
- [ ] Structured EMR v1 (problem/allergy/med lists, ICD-10, SOAP templates)
- [ ] Discharge summary generator + med reconciliation
- [ ] PHI read-access audit + consent capture
- [ ] Connect OT/Inventory/Dialysis UIs to existing runtimes
- [ ] Refactor `hospitalStore` into domain slices; platform-first reads

**Phase 2 — Make it adoptable by chains (Weeks 17–32) — "Enterprise"**
- [ ] SSO (SAML/OIDC), break-glass, SoD, full RBAC depth
- [ ] FHIR R4 facade + ABDM milestones; payment gateway; HL7 lab inbound
- [ ] PACS/DICOM bridge; structured RIS reports
- [ ] ICU flowsheet + scoring; eMAR barcode
- [ ] Cross-branch reporting + chain command center; control plane
- [ ] Analytics KPI library + scheduled exports + BI connector
- [ ] HA topology, read replicas, load testing, DR drills, SLA monitoring

**Phase 3 — Differentiate (Weeks 33+) — "Intelligence & scale"**
- [ ] Wire ai-gateway to a model (India-region/on-prem option); start with summarization + human sign-off
- [ ] Clinical decision support on coded data; AI eval/guardrail harness
- [ ] Insurance NHCX; denial analytics; revenue intelligence
- [ ] Patient app: booking, payment, teleconsult, ABHA, reports

### 14.2 Missing-Features Roadmap (by domain)

| Domain | Must-add (P0/P1) | Later (P2/P3) |
|---|---|---|
| Patient/EMR | Demographics, dedup, consent, structured EMR, ICD-10 | FHIR resources, growth charts, immunization |
| Billing | Charge master, GST invoice, reconciliation, refunds | Package profitability, corporate ledgers |
| Insurance | Pre-auth docs, claim loop | NHCX, denial analytics |
| Pharmacy | Formulary, interactions, Schedule-H, PO/GRN | Narcotic register, barcode dispense |
| Lab | Test master, results, reference ranges | Analyzer HL7, QC, NABL reports |
| Radiology | Structured reports, sign-off | PACS/DICOM, teleradiology |
| Nursing/ICU | eMAR barcode, ICU flowsheet, SBAR handover | Tele-ICU, device ingestion |
| Notifications | SMS-DLT/email/WhatsApp delivery | Preference center, failover |
| Integrations | FHIR, ABDM, payment gateway | iPaaS/integration engine |
| Platform | Control plane, SSO, audit explorer | Benchmarking, marketplace |

---

## 15. Launch Blocker Report

> **A launch handling real patient data MUST NOT proceed until every item below is closed.**

| # | Blocker | Owner area | Status |
|---|---|---|---|
| LB-1 | Authentication enforced on domain-api (PHI) | Security | ❌ Open |
| LB-2 | Tenant from verified JWT, not client header | Security | ❌ Open |
| LB-3 | RLS policies + migration enforcing tenant isolation | Data | ❌ Open |
| LB-4 | Real credentials (password/SSO); remove `devLogin` + dev secret in prod | Auth | ❌ Open |
| LB-5 | Identity-bound RBAC enforced on read & write | Auth | ❌ Open |
| LB-6 | Migration history established (no `db push` in prod) | Data | ❌ Open |
| LB-7 | Encryption at rest (KMS) + secrets manager | Infra | ❌ Open |
| LB-8 | Automated backups + tested restore (DR) | Infra | ❌ Open |
| LB-9 | PHI read-access audit logging | Compliance | ❌ Open |
| LB-10 | Consent capture (DPDP/ABDM) | Compliance | ❌ Open |
| LB-11 | Patient demographics + dedup (data integrity) | Registration | ❌ Open |
| LB-12 | GST-compliant tax invoice + charge master | Billing | ❌ Open |
| LB-13 | Notification delivery (at least OTP + results-ready) | Notifications | ❌ Open |
| LB-14 | Core test suite green in CI (isolation, billing, discharge) | Quality | ❌ Open |
| LB-15 | Deployable, monitored environment (IaC + OTel + alerts) | Infra | ❌ Open |
| LB-16 | Remove stub services from prod topology or label clearly | Architecture | ❌ Open |

---

## 16. Production Deployment Checklist

### Security
- [ ] All PHI endpoints require verified JWT; tenant + role derived from token
- [ ] RLS enabled + policies on every tenant-scoped table; verified by a cross-tenant test
- [ ] MFA enforced for admin/privileged roles
- [ ] Secrets in a manager (no `.env`, no hardcoded fallback); JWT secret rotated
- [ ] TLS everywhere; HSTS; secure cookies; CORS locked to known origins
- [ ] Rate limiting + WAF; API-key hashing verified; webhook signature verification
- [ ] PHI read-access audit + tamper-evident audit storage + retention policy
- [ ] Pen test / threat model completed; dependency & container scanning in CI

### Data
- [ ] Migration history; forward/rollback tested
- [ ] Automated encrypted backups; restore drill passed; PITR enabled
- [ ] Data retention/purge + tenant export/offboarding
- [ ] PII/PHI field encryption where required; key management (KMS, per-tenant if feasible)

### Reliability & Ops
- [ ] IaC provisions RDS(Multi-AZ)+ECS/Fargate+Redis+S3+KMS+SG+secrets
- [ ] Health checks (`/healthz`, deep-health) wired to LB + alerts
- [ ] OTel traces/metrics/logs shipped; dashboards + on-call alerts (SLOs in `ops/slos`)
- [ ] Autoscaling + load test at target concurrency; DB connection pooling sized
- [ ] Outbox/queue workers running with DLQ monitoring
- [ ] Runbooks: incident, data-breach, restore, rollback

### Application
- [ ] Dev backdoors (`devLogin`, `tenant_dev`, demo data) disabled in prod builds
- [ ] Preview/demo routes hidden or gated by entitlement in prod
- [ ] Notification providers configured (SMS-DLT templates approved)
- [ ] Patient consent + privacy policy surfaces live
- [ ] Error tracking (Sentry-class) + PHI-safe logging verified

### Compliance
- [ ] DPDP data-processing records; consent artifacts
- [ ] ABDM readiness (if claiming) — milestone evidence
- [ ] DPA/BAA templates for customers; sub-processor list
- [ ] Audit/access review process documented

---

## 17. Scoring Methodology & Evidence Index

### Methodology
Each dimension scored 0–100 against a production-with-real-PHI bar. Weights for overall: Production 40%, Enterprise 30%, Clinical depth 20%, AI 10%. A dimension with a **Critical open blocker is capped** (e.g., Production cannot exceed ~25 while authn/RLS are absent). Scores reflect *current code*, not roadmap intent.

### Key evidence (file references)
- Auth absent on PHI: `services/domain-api/src/app.module.ts` (only RlsInterceptor + RbacGuard), no `JwtAuthGuard` in domain-api.
- Header-trust tenant: `services/domain-api/src/tenant/tenant.middleware.ts`.
- Decorative RLS: `services/domain-api/src/rls/rls.interceptor.ts`; no `CREATE POLICY`/migrations repo-wide.
- Credential-less login + dev secret: `services/kernel-api/src/auth/auth.service.ts`, `services/kernel-api/src/auth/jwt.strategy.ts`.
- Self-asserted RBAC: `services/domain-api/src/common/rbac.guard.ts` (reads `x-actor-role`), frontend `apps/hospital-os/src/contexts/AuthContext.tsx` (`canAccess` on localStorage role).
- Stub AI: `services/domain-api/src/ai/ai-orchestration.service.ts` (`runAction` returns strings), `services/ai-gateway/app/main.py` (25 lines).
- Stub event router: `services/event-router/main.go` (25 lines).
- Data models: `services/domain-api/prisma/schema.prisma` (45 models), `services/kernel-api/prisma/schema.prisma` (38 models).
- Thin EMR/patient: `Patient`, `Encounter`, `ClinicalNote` models.
- Tests: single `apps/hospital-os/src/test/example.test.ts`.
- IaC stub: `infra/terraform/environments/dev/main.tf` (vpc + `rds_stub`).
- Notifications/integration: no provider SDK/HTTP client in `kernel-api/src/notification`, `domain-api/src/platform-notification`, `kernel-api/src/integration`.
- God store: `apps/hospital-os/src/stores/hospitalStore.tsx` (5,560 lines).
- API surface: 174 `@Get/@Post/@Put/@Patch/@Delete` across 37 domain controllers.
- Self-audit: `MASTER_OPERATIONAL_CONNECTIVITY_MATRIX.md` (project's own honest classification).

---

### Final note to the founder
The hardest parts of an HMS to get right — a **governed, auditable, multi-tenant operational spine** — you have largely gotten right. The parts that remain are *known, bounded, and well-understood* engineering: secure the tier, deepen the clinical data, wire delivery and interop, and make it deployable. **One focused engineer-month on Phase 0 converts this from "impressive demo that can leak PHI" into "a system a design-partner hospital can safely pilot."** That is the single highest-leverage investment available right now.

*End of report.*
