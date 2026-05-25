# Integrated Hospital Operating System Architecture

## Objective
Deliver a tightly coupled hospital workflow where every module participates in a traceable, role-governed care lifecycle.

## Integration Backbone
- Single source of truth: `HospitalProvider` in `src/stores/hospitalStore.tsx`.
- Event ledger: `workflowEvents` captures cross-module state transitions (`WorkflowEvent`).
- Event provenance: each event records module, action, patient reference (`uhid`), and object reference (`refId`).
- Timeline API: `getPatientWorkflowTimeline(uhid)` returns end-to-end patient journey trace.

## Core Cross-Module Journeys

### 1. Front Desk to Clinical
1. Reception registers patient (`registerPatient` / `startFrontDeskVisit`).
2. Scheduling creates check-in token.
3. Billing creates initial invoice.
4. Auto-admission runs for IPD-style pathways.
5. Nurse module receives admission and initial handoff round.

### 2. OPD Consultation to Diagnostics and Revenue
1. Doctor completes consultation (`saveConsultation`).
2. Lab orders, prescriptions, and radiology orders are generated atomically.
3. Billing charge lines are generated from consultation actions.
4. Queue status transitions to completed.

### 3. Emergency to IPD
1. ER creates and triages emergency case.
2. Emergency transfer creates/adopts patient identity and IPD admission.
3. Nursing handoff is seeded with first round.
4. Emergency financial package is generated.

### 4. Inpatient Continuity
1. Admission status updates (doctor).
2. Bed reassignment and nurse handoff (nurse).
3. Nursing rounds feed doctor IPD and nurse modules.
4. Billing remains synchronized with admission lifecycle.

## Role Responsibility Map
- Administrator: governance, audit, and global monitoring.
- Receptionist: patient registration, check-in, initial billing.
- Doctor: consultation, IPD care decisions, admission status.
- Nurse: rounds, ward movement, ongoing handoff documentation.
- Lab Technician: sample/analysis/report stage transitions.
- Radiologist: study lifecycle (ordered -> reported).
- Pharmacist: prescription verification and dispensing transitions.
- Billing & Finance: invoice generation and payment collection.
- Emergency / ER: emergency intake, triage, transfer orchestration.
- Scheduling: appointment and token coordination.
- OT Coordinator / Inventory / HR / Dialysis / CRM: role modules consume the same patient and billing foundations and can extend event coverage through the same ledger pattern.

## State Transition Guarantees (Implemented)
- Every critical action in the central store emits a workflow event.
- Event classes include registration, admission, queue transitions, consultation orders, diagnostics stage transitions, emergency triage/transfer, nursing rounds, invoice creation, and payment collection.
- Event volume capped to latest 1000 entries to keep UI performance stable.

## Observability
- `AdminAudit` is wired to live `workflowEvents` and now displays real integration events (with severity inference), not only static demo rows.
- Module filtering dynamically reflects active producing modules.

## Data Integrity Rules
- IDs are generated centrally and used across modules (`UHID`, `APT`, `INV`, `ADM`, `ER`, `NR`).
- Admission and nursing references are linked by immutable IDs.
- Billing line items are generated from concrete workflow actions.
- Queue and appointment synchronization is handled in shared actions.

## Production Readiness Notes
- This repository now has integrated workflow orchestration and traceability at application-state level.
- To move to full production deployment, mirror the same event and transition model in backend services with:
  - transactional persistence,
  - optimistic concurrency controls,
  - idempotent command handlers,
  - outbox/event-bus delivery,
  - role-scoped API authorization.

## 3-Hour Deep Demo Runbook (IPD-Centric)

### Demo Goal
Present one continuous patient journey where every role contributes to care progression and financial closure, while proving cross-module synchronization through live state and audit traces.

### Golden Rule for the Session
- Keep one anchor patient visible across all modules.
- At each transition, show the triggering action and then immediately show the receiving module.
- Use Admin Audit as live proof that transitions were recorded.

### Recommended Anchor Patient Narrative
- Journey type: IPD (high clinical complexity).
- Source: Reception registration.
- Clinical path: OPD assessment -> diagnostics -> admission -> nursing rounds -> treatment updates -> discharge-ready -> billing closure.

## Pre-Demo Setup (15 minutes before audience)

### Data Readiness Checklist
1. Open Reception Registration, Doctor Queue, Doctor Consultation, Doctor IPD, Nurse Ward, Nurse Vitals, Lab Worklist, Lab Reports, Pharmacy Prescriptions, Pharmacy Billing, Billing IPD, Admin Audit in separate tabs.
2. Confirm build is clean and app runs without console errors.
3. Confirm Admin Audit displays live workflow events.
4. Keep one emergency fallback case ready in Emergency Triage.

### Runtime Readiness Checklist
1. Login credentials for each role are prepared.
2. Browser autofill is disabled for cleaner forms.
3. Screen zoom set so KPI cards and IDs are readable.
4. Keep a short list of key IDs during the demo: UHID, Admission ID, Invoice ID, Lab Order ID, Prescription ID.

## Full 180-Minute Agenda

### Block 1: Platform and integration context (0-20 min)
1. Explain role architecture and shared orchestration model.
2. Show that all roles are route-access controlled.
3. Open Admin Audit and explain that every critical transition is evented.
4. Set audience expectation: one patient will be traced end-to-end.

### Block 2: Registration to clinical intake (20-50 min)
1. Module: Reception Registration.
2. Action: Start Live Visit for IPD pathway.
3. Explain output artifacts created by one action:
  - patient identity (UHID),
  - queue token,
  - initial billing invoice,
  - admission record for IPD journey.
4. Module transition proof:
  - Reception Queue shows token,
  - Reception Billing shows invoice,
  - Reception IPD shows admission.
5. Open Admin Audit and show event sequence for this step.

### Block 3: Doctor intake and consultation orchestration (50-85 min)
1. Module: Doctor Queue.
2. Action: Move patient from waiting to in-consultation.
3. Module: Doctor Consultation.
4. Action: Save consultation with:
  - lab orders,
  - radiology order,
  - medications,
  - consultation charges.
5. Explain atomic workflow effect:
  - diagnostics orders generated,
  - pharmacy prescription generated,
  - financial line items generated,
  - queue state completed.
6. Show receiving modules immediately:
  - Lab Worklist,
  - Radiology Orders,
  - Pharmacy Prescriptions,
  - Billing views.
7. Open Admin Audit and show corresponding events.

### Block 4: Inpatient care continuity (85-120 min)
1. Module: Doctor IPD.
2. Explain rounds due logic and critical flagging.
3. Open patient from IPD list.
4. Module: Doctor IPD Patient Profile.
5. Action: add clinical note, review meds/labs, move to discharge planning tab.
6. Module: Nurse Ward.
7. Action: transfer/reassign bed and nurse to demonstrate ward governance.
8. Module: Nurse Vitals.
9. Action: record a nursing round and show derived risk/monitoring updates.
10. Return to Doctor IPD and show updated patient state.
11. Show Admin Audit event trail for nursing and doctor actions.

### Block 5: Diagnostics lifecycle and release (120-145 min)
1. Module: Lab Worklist.
2. Action: progress an order through analysis -> awaiting validation -> validated.
3. Module: Lab Reports.
4. Action: finalize/release report.
5. Module: Radiology Orders.
6. Action: schedule/start/complete procedure.
7. Module: Radiology Reports.
8. Action: save and release radiology report.
9. Explain handoff significance: provider decisions now include released diagnostics.
10. Confirm events in Admin Audit.

### Block 6: Pharmacy and billing closure (145-170 min)
1. Module: Pharmacy Prescriptions.
2. Action: verify and dispense.
3. Module: Pharmacy Billing.
4. Action: generate medicine bill and collect payment.
5. Module: Doctor IPD Patient Profile.
6. Action: Finalize and Generate Summary (moves to discharge-ready).
7. Module: Billing IPD.
8. Show status change to discharge context and outstanding balance.
9. Action: collect final payment/deposit.
10. Explain closure state: clinical readiness + financial readiness aligned.

### Block 7: Governance, continuity defense, and Q&A (170-180 min)
1. Module: Admin Audit.
2. Walk timeline from registration to payment closure for same patient.
3. Highlight no dead transitions in demonstrated path.
4. Take evaluator questions with direct module evidence.

## Role-to-Role Handoff Matrix

| Triggering Role | Triggering Module | Trigger | Receiving Role | Receiving Module | Outcome |
|---|---|---|---|---|---|
| Receptionist | Reception Registration | Start Live Visit | Doctor | Doctor Queue | Tokenized clinical intake |
| Receptionist | Reception Registration | Start Live Visit | Billing | Reception Billing / Billing IPD | Initial invoice generated |
| Receptionist | Reception Registration | IPD journey selected | Nurse | Nurse Ward / Admissions | Admission + nursing handoff seeded |
| Doctor | Doctor Consultation | Save consultation | Lab Technician | Lab Worklist | Lab order created |
| Doctor | Doctor Consultation | Save consultation | Radiologist | Radiology Orders | Radiology order created |
| Doctor | Doctor Consultation | Save consultation | Pharmacist | Pharmacy Prescriptions | Prescription created |
| Doctor | Doctor Consultation | Save consultation | Billing | Billing module | Charge lines generated |
| Nurse | Nurse Vitals | Save vitals round | Doctor | Doctor IPD | Updated inpatient clinical signal |
| Doctor | Doctor IPD Profile | Finalize discharge planning | Billing | Billing IPD | Discharge-ready financial review |
| Billing | Billing IPD / Pharmacy Billing | Collect payment | Admin | Admin Audit | Financial transition recorded |

## High-Rigor Questions and Strong Answers

### Q1: How do you prove inter-module coupling is real?
- Show one patient ID across Reception, Doctor, Nurse, Lab, Pharmacy, Billing.
- Open Admin Audit to show matching sequential workflow events.

### Q2: What ensures continuity if multiple teams act simultaneously?
- Explain central state orchestration and deterministic ID linking.
- Show latest state reflected in downstream module views immediately.

### Q3: How do you avoid ghost actions and dead buttons?
- Demonstrate each major button leading to a real state change in a receiving module.
- Validate by checking resulting records and audit events.

### Q4: How do you close the IPD loop?
- Show discharge-ready transition from doctor profile.
- Show billing IPD status and final collection.
- Show audit completion trail.

## Live Demo Safety Protocol (if a screen misbehaves)
1. Do not refresh the whole session immediately.
2. Pivot to Admin Audit to prove action was persisted.
3. Re-open target module and filter by patient UHID or reference ID.
4. Continue storyline with next module; return to failed screen after continuity is re-established.

## Presenter Script Prompts (Reusable)
1. "This action creates three downstream artifacts: clinical, financial, and operational."
2. "Now we verify receipt in the next role module, not just in the source module."
3. "I will now prove continuity in the audit trail for the exact same patient reference."
4. "Clinical readiness and billing readiness converge here before closure."

## Demo Completion Criteria
1. One anchor patient traverses registration -> consultation -> diagnostics -> inpatient care -> discharge-ready -> billing closure.
2. Every stage is visible in at least two connected modules.
3. Audit timeline shows traceable transitions for the same patient.
4. Audience can challenge any step and receive live evidence from the system.
