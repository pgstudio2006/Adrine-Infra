# Hospital OS — Product Backlog

**Last updated:** 2026-05-24 · Receptionist + Doctor + Nurse + Lab + Pharmacist + Billing + Radiologist + OT module plans

**Role module plans:** [docs/ROLE_MODULES/README.md](../docs/ROLE_MODULES/README.md) · [Receptionist](../docs/ROLE_MODULES/RECEPTIONIST_MODULE.md) · [Doctor](../docs/ROLE_MODULES/DOCTOR_MODULE.md) · [Nurse](../docs/ROLE_MODULES/NURSE_MODULE.md) · [Lab Technician](../docs/ROLE_MODULES/LAB_TECHNICIAN_MODULE.md) · [Pharmacist](../docs/ROLE_MODULES/PHARMACIST_MODULE.md) · [Billing & Finance](../docs/ROLE_MODULES/BILLING_FINANCE_MODULE.md) · [Radiologist](../docs/ROLE_MODULES/RADIOLOGIST_MODULE.md) · [OT Coordinator](../docs/ROLE_MODULES/OT_COORDINATOR_MODULE.md)

---

## P0 — Reception + doctor OPD spine (Track 2–3)

**Goal:** Front desk and clinical OPD journeys are guided, platform-hydrated, and blocker-aware without touching `patient-app`.

| ID | Item | Status | Notes |
|----|------|--------|-------|
| P0-OPD-01 | `WorkflowStepStrip` on reception + doctor OPD routes | **Done** | Maps `frontDeskSpine` / `clinicalOpdSpine` from `@adrine/hospital-operations` |
| P0-OPD-02 | `PatientContextBar` on doctor consultation | **Done** | Token, department, wait, OPD state |
| P0-OPD-03 | `ConsultationBlockerStrip` (lab / rad / pharmacy / billing) | **Done** | Disables save when critical blockers present |
| P0-OPD-04 | `InlinePlatformError` on queue, check-in, registration | **Done** | SSE / refresh failures surfaced in-page |
| P0-OPD-05 | Reception dashboard wired to store + hydration | **Done** | Replaces static demo KPIs |
| P0-OPD-06 | Queue: called-patient highlight + board wait times | **Done** | `createdAt` from `GET /opd/visits/board` |
| P0-OPD-07 | Walk-in fast path tab on registration | **Done** | `startFrontDeskVisit` one-step → queue |
| P0-OPD-08 | One primary CTA per queue / check-in row | **Done** | Secondary actions demoted to outline/ghost |
| P0-OPD-09 | `useClinicalPlatformListSync` on P0 list routes | **Done** | Queue, appointments, patients where applicable |
| P0-OPD-10 | Close C2 on `/reception`, `/reception/queue`, `/reception/checkin`, `/doctor`, `/doctor/queue` | **Done** | See matrix UX notes |

### Routes touched (hospital-os only)

- `/reception` — dashboard
- `/reception/registration` — full + walk-in fast path
- `/reception/checkin`
- `/reception/queue`
- `/doctor` — dashboard
- `/doctor/queue`
- `/doctor/consultation/:id` — context bar + blocker strip

### New shared components

- `apps/hospital-os/src/components/opd/WorkflowStepStrip.tsx`
- `apps/hospital-os/src/components/opd/PatientContextBar.tsx`
- `apps/hospital-os/src/components/opd/InlinePlatformError.tsx`
- `apps/hospital-os/src/components/opd/ConsultationBlockerStrip.tsx`

### Hooks / utilities

- `hooks/useOpdJourneyStep.ts`
- `hooks/useConsultationBlockers.ts`
- `lib/opd/queue-presenters.ts`

### Out of scope (this program)

- `patient-app` — no changes
- Full rebrand — layout/spacing/copy only, shadcn/ui preserved

### Reception / CRM hygiene (2026-05-21)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| REC-01 | Receptionist module plan (`docs/ROLE_MODULES/RECEPTIONIST_MODULE.md`) | **Done** | Screen inventory, P0–P2, workflows, out-of-scope |
| REC-02 | Move drip marketing off reception → CRM | **Done** | `/crm/drip-campaigns`; redirect `/reception/drip-marketing` |

### Doctor module (2026-05-21)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| DOC-01 | Doctor module plan (`docs/ROLE_MODULES/DOCTOR_MODULE.md`) | **Done** | EMR-centric inventory, P0–P2, IPD/OPD workflows, waves W0–W9 |
| DOC-02 | EMR v1 in consultation (structured note + ICD + allergy Rx check) | **Backlog** | Doctor P0 DoD — see module §9, wave W1 |
| DOC-03 | Longitudinal EMR chart route `/doctor/emr/:id` | **Backlog** | Problem list, meds, vitals timeline — wave W2 |
| DOC-04 | Clinical inbox + critical result ack | **Backlog** | Wave W3 |
| DOC-05 | IPD discharge summary authoring (structured) | **Backlog** | Coordinates nurse/billing; wave W4 |

### Nurse module (2026-05-21)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| NURSE-01 | Nurse module plan (`docs/ROLE_MODULES/NURSE_MODULE.md`) | **Done** | Bedside-centric inventory, P0–P2, IPD workflows, waves W0–W9 |
| NURSE-02 | Bedside P0 honesty (live dashboard + platform vitals on intake) | **Backlog** | Nurse P0 DoD — see module §9, wave W1 |
| NURSE-03 | Nursing assessments route (`/nurse/assessments`) | **Backlog** | Braden, fall risk, pain — wave W2 |
| NURSE-04 | eMAR barcode + controlled-drug witness | **Backlog** | Five-rights — wave W3 |
| NURSE-05 | SBAR shift handoff + care plan v1 | **Backlog** | Wave W4 |
| NURSE-06 | Discharge education structured + reception handoff | **Backlog** | Wave W5 |

### Lab Technician module (2026-05-21)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| LAB-01 | Lab Technician module plan (`docs/ROLE_MODULES/LAB_TECHNICIAN_MODULE.md`) | **Done** | LIMS-centric inventory, P0–P2, sample flow, `LabWorkflowStepStrip`, waves W0–W9 |
| LAB-02 | LIMS P0 honesty (live dashboard + `InlinePlatformError` on lab pages) | **Backlog** | Lab P0 DoD — see module §9, wave W1 |
| LAB-03 | Test catalog + LOINC/panels (`/lab/catalog`) | **Backlog** | Replace free-text `tests` — wave W2 |
| LAB-04 | Critical value callback log + doctor ack bridge | **Backlog** | Coordinates `/doctor/critical` — wave W1/W3 |
| LAB-05 | Accession + barcode print + phlebotomy queue | **Backlog** | Sample chain — wave W3 |
| LAB-06 | Analyzer HL7 + QC module | **Backlog** | P2 — waves W8/W9 |

### Pharmacist module (2026-05-24)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| PHARM-01 | Pharmacist module plan (`docs/ROLE_MODULES/PHARMACIST_MODULE.md`) | **Done** | Pharmacy ops-centric inventory, P0–P2, dispense workflow, waves W0–W9 |
| PHARM-02 | Pharmacy P0 honesty (live dashboard + `InlinePlatformError` on pharmacy pages) | **Backlog** | Pharmacist P0 DoD — see module §8, wave W1 |
| PHARM-03 | Formulary + generic substitution audit | **Backlog** | Drugs/formulary — wave W2 |
| PHARM-04 | Platform-backed Schedule H / narcotics register | **Backlog** | Controlled substance compliance — wave W3 |
| PHARM-05 | IPD indent + returns workflow | **Backlog** | Ward stock handoff with nurse — wave W4 |
| PHARM-06 | Barcode dispense + drug interaction CDS | **Backlog** | P2 — waves W8/W9 |

### Billing & Finance module (2026-05-24)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| BILL-01 | Billing & Finance module plan (`docs/ROLE_MODULES/BILLING_FINANCE_MODULE.md`) | **Done** | Revenue cycle-centric inventory, P0–P2, GAP-006/007, waves W0–W9 |
| BILL-02 | RCM P0 honesty (platform-only invoice/payment lists + gate copy on failures) | **Backlog** | Billing P0 DoD — see module §8, wave W1 |
| BILL-03 | Charge master + HSN/SAC tariff (`/billing-dept/charge-master`) | **Backlog** | Audit LB-12 — wave W2 |
| BILL-04 | GST tax invoice PDF + e-invoice IRN prep | **Backlog** | India P1 — wave W3 |
| BILL-05 | IPD deposits + platform-backed packages | **Backlog** | Wave W4 |
| BILL-06 | Insurance claims + denial management | **Backlog** | P2 — wave W9 |

### Radiologist module (2026-05-24)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| RAD-01 | Radiologist module plan (`docs/ROLE_MODULES/RADIOLOGIST_MODULE.md`) | **Done** | RIS-centric inventory, P0–P2, imaging workflow, waves W0–W9 |
| RAD-02 | RIS P0 honesty (`RadGovernedActions`, platform scheduling, `InlinePlatformError`) | **Backlog** | Radiologist P0 DoD — see module §9, wave W1 |
| RAD-03 | `RadiologyWorkflowStepStrip` + structured report templates | **Backlog** | Mirror lab journey chrome — wave W2 |
| RAD-04 | Critical imaging callback log + doctor ack bridge | **Backlog** | Coordinates `/doctor/critical` — wave W1/W3 |
| RAD-05 | Modality slot board + contrast/nurse prep handoff | **Backlog** | `/radiology/schedule` — wave W3 |
| RAD-06 | PACS/DICOM bridge + teleradiology queue | **Backlog** | P2 — waves W8/W9 |

### OT Coordinator module (2026-05-24)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| OT-01 | OT Coordinator module plan (`docs/ROLE_MODULES/OT_COORDINATOR_MODULE.md`) | **Done** | Peri-op-centric inventory, P0–P2, case lifecycle, waves W0–W9 |
| OT-02 | OT P0 honesty (remove demo fallback, platform PreOp → `complete_preop`) | **Backlog** | OT P0 DoD — see module §9, wave W1 |
| OT-03 | Intra/post-op platform bind (`start_surgery` / `complete_case`) | **Backlog** | Waves W2 |
| OT-04 | WHO checklist persisted + surgery request inbox | **Backlog** | Doctor handoff — waves W3/W4 |
| OT-05 | Block scheduling + emergency bump audit | **Backlog** | Wave W7 |
| OT-06 | Implant trace + CSSD / anesthesia slice | **Backlog** | P2 — waves W8/W9 |

### Inventory Manager module (2026-05-24)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| INV-01 | Inventory Manager module plan (`docs/ROLE_MODULES/INVENTORY_MANAGER_MODULE.md`) | **Done** | Supply-chain-centric inventory, P0–P2, waves W0–W9 |
| INV-02 | Inventory P0 honesty (remove demo fallback on dashboard/catalog) | **Backlog** | Issue/GRN live; tighten Preview badges — wave W1 |
| INV-03 | Requisition → approve → issue platform workflow | **Backlog** | Nurse/OT handoffs — waves W3/W5 |
| INV-04 | Vendor master + PO domain + GRN link | **Backlog** | Procurement spine — wave W4 |
| INV-05 | Stock entry + adjustments via `/inventory/moves` | **Backlog** | Wave W2 |
| INV-06 | Batch/expiry, inter-store transfer, three-way match, CSSD | **Backlog** | P2 — waves W6–W9 |

### Emergency module (2026-05-24)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| ER-01 | Emergency module plan (`docs/ROLE_MODULES/EMERGENCY_MODULE.md`) | **Done** | ER ops-centric; mandatory Reception ↔ ER section; waves W0–W9 |
| ER-02 | **Reception ↔ ER P0 handoff** (redirect to `/emergency/triage`, shared registration spine) | **Backlog** | Reception emergency mode → triage queue; `caseId`/`uhid` params — wave W1 |
| ER-03 | Registration spine enforcement (ER case requires patient identity; platform sync honesty) | **Backlog** | Block disposition without encounter when runtime on — wave W2 |
| ER-04 | Structured triage (ESI/Manchester) + fast-track lane | **Backlog** | Wave W3 |
| ER-05 | ER→IPD admit polish + observation bed pre-alert | **Backlog** | Wave W4/W5 |
| ER-06 | Ambulance domain, MLC register, disaster/mass casualty mode | **Backlog** | P2 — waves W7/W9 |

### Next P0 candidates (backlog)

- Promote `/reception/flow` to receptionist role tab (see Receptionist module W1)
- Handoff screen linking reception queue → doctor consult with explicit `call_patient` audit
- Reception billing exit inline financial blockers (mirror consultation strip)
- Department TV board: per-doctor wait from board API metadata
