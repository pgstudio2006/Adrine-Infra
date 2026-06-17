# Navayu Health — Module Dependency & Data Flow Map

> **Purpose:** Visualize inter-module relationships, data flows, and shared dependencies  
> **Audience:** Enterprise Architects, Engineering Leads, System Integrators  
> **Legend:** `→` = data flow direction | `⟷` = bidirectional | `•` = optional dependency

---

## 1. CORE DATA FLOW OVERVIEW

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                     TENANT CONTEXT                           │
                    │     (tenantId + branchId on every record, RLS enforced)       │
                    └─────────────────────────────────────────────────────────────┘
                                         │
     ┌───────────────────────────────────┼─────────────────────────────────────┐
     ▼                                   ▼                                     ▼
┌──────────┐                      ┌────────────┐                      ┌──────────────┐
│  KERNEL  │                      │   DOMAIN   │                      │  EVENT BUS   │
│   API    │                      │    API     │                      │  (Platform   │
│ (Auth,   │                      │ (Clinical, │                      │   Events)    │
│  Tenant) │                      │  Ops, Fin) │                      │              │
└────┬─────┘                      └─────┬──────┘                      └──────┬───────┘
     │                                   │                                   │
     ▼                                   ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              POSTGRESQL DATABASES                                 │
│     ┌─────────────────────┐     ┌─────────────────────┐                          │
│     │    kernel-db         │     │    domain-db         │                          │
│     │  (users, tenants,    │     │  (patients, visits,  │                          │
│     │   subscriptions,     │     │   invoices, orders,  │                          │
│     │   audit, policies)   │     │   tasks, events)     │                          │
│     └─────────────────────┘     └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MODULE DEPENDENCY MAP (Directed Graph)

### Patient Registration
```
Patient Module ← (no dependencies on other modules — root entity)
    │
    ├──→ Encounter Module       (Patient creates Encounter)
    ├──→ Appointment Module     (Patient links to Appointment)
    ├──→ OPD Module             (Patient → OpdVisit)
    ├──→ IPD Module             (Patient → IpdAdmission)
    ├──→ Billing Module         (Patient → Invoice)
    ├──→ Lab Module             (Patient → LabDiagnosticOrder)
    ├──→ Radiology Module       (Patient → RadiologyStudyOrder)
    ├──→ Pharmacy Module        (Patient → PharmacyFulfillment)
    ├──→ Nursing Module         (Patient → NursingTask/NursingVitalRound)
    ├──→ OT Module              (Patient → OtCase)
    ├──→ Dialysis Module        (Patient → DialysisSession)
    ├──→ CRM Module             (Patient → CrmLead/CrmLifecycleEvent)
    └──→ Insurance Module       (Patient → InsuranceAuthorization)
```

### Scheduling & Appointments
```
Appointment Module
    ├──• Patient Module          (appointment.patientId)
    ├── Scheduling Resource      (doctor/room availability)
    └──→ OPD Module              (creates OPD intent → OpdVisit)

Waitlist Module
    ├──• Patient Module
    ├──• Appointment Module
    └──→ Appointment Module      (promotion from waitlist)
```

### OPD (Outpatient)
```
OPD Module
    ├── Patient Module           (opd_visits.patientId)
    ├──• Appointment Module      (opd_visits.appointmentId)
    ├──• Encounter Module        (opd_visits.encounterId)
    ├──→ Billing Module          (consultation fee charge line)
    ├──→ Lab Module              (investigation orders from OPD consult)
    ├──→ Radiology Module        (imaging orders from OPD consult)
    ├──→ Pharmacy Module         (prescriptions from OPD consult)
    ├──→ IPD Module              (admission from OPD)
    ├── Events → PlatformEvent   (OPD state changes)
    └──→ Queue Management        (token → queue position feed)
```

### IPD (Inpatient Admission)
```
IPD Module
    ├── Patient Module           (ipd_admissions.patientId)
    ├──• Encounter Module        (ipd_admissions.encounterId)
    ├──• OPD Module              (ipd_admissions.opdVisitId — admission from OPD)
    ├── Bed Module               (ipd_admissions.bedId)
    ├──→ Billing Module          (bed charges daily, deposit tracking)
    ├──→ Nursing Module          (nursing tasks, vitals, notes created)
    ├──→ MAR Module              (medication schedules created)
    ├──→ Discharge Module        (discharge orchestration created)
    ├──→ Insurance Module        (insurance authorization created)
    ├──→ OT Module               (surgical cases linked)
    ├──→ Dialysis Module         (dialysis sessions linked)
    ├──• Lab Module              (IPD-specific lab orders)
    ├──• Radiology Module        (IPD-specific imaging orders)
    └── Events → PlatformEvent   (admission state changes)
```

### Emergency
```
Emergency Module
    ├── Patient Module           (new or existing patient)
    ├──→ Lab Module              (STAT lab orders)
    ├──→ Radiology Module        (STAT imaging)
    ├──→ IPD Module              (admission from ER)
    ├──→ OT Module               (emergency surgery)
    ├──→ Blood Bank              (emergency blood release)
    └──→ Billing Module          (ER charges)
```

### Nursing
```
Nursing Module
    ├── IPD Module               (nursing_tasks/notes/vitals.admissionId)
    ├── Patient Module           (nursing_tasks/notes/vitals.patientId)
    ├──→ MAR Module              (medication administration tasks)
    ├──→ Discharge Module        (nursing clearance for discharge)
    └── Events → PlatformEvent   (task status changes)
```

### Doctor Workbench / EMR
```
Doctor / EMR Module
    ├── Patient Module           (patient context)
    ├── Encounter Module         (encounter lifecycle)
    ├── OPD Module               (OPD consultation)
    ├── IPD Module               (IPD treatment)
    ├──→ Lab Module              (ordering investigations)
    ├──→ Radiology Module        (ordering imaging)
    ├──→ Pharmacy Module         (prescribing medications)
    ├──→ OT Module               (scheduling surgery)
    ├──→ IPD Module              (admission orders)
    ├──← Lab Module              (receiving lab results)
    ├──← Radiology Module        (receiving radiology reports)
    └── Events → PlatformEvent   (clinical documentation events)
```

### Billing
```
Billing Module                        ← RECEIVES charges from ALL modules
    ├── Patient Module               (invoice.patientId)
    ├──• OPD Module                  (invoice.opdVisitId)
    ├──• IPD Module                  (invoice.ipdAdmissionId)
    │
    ├──← OPD Module                  (consultation charge line)
    ├──← Lab Module                  (lab test charge line)
    ├──← Radiology Module            (imaging charge line)
    ├──← Pharmacy Module             (medication charge line)
    ├──← OT Module                   (surgical procedure charge line)
    ├──← Dialysis Module             (dialysis session charge line)
    ├──← Inventory Module            (consumable charge line)
    ├──← IPD Module                  (bed charge line — daily accrual)
    │
    ├──→ Insurance Module            (invoice data for claim submission)
    ├──→ Finance Module              (revenue data for GL)
    └── Events → PlatformEvent       (payment events)
```

### Insurance / TPA
```
Insurance Module
    ├── Patient Module               (insurance_authorizations.patientId)
    ├── IPD Module                   (insurance_authorizations.admissionId)
    ├──• Billing Module              (insurance claim from invoice)
    └──→ Discharge Module            (insurance clearance checkpoint)
```

### Lab
```
Lab Module
    ├── Patient Module               (lab_diagnostic_orders.patientId)
    ├──• Encounter Module            (lab_diagnostic_orders.encounterId)
    ├──• OPD Module                  (lab_diagnostic_orders.opdVisitId)
    ├──← Doctor Module               (lab orders placed)
    ├──→ Billing Module              (test charge lines)
    ├──→ Inventory Module            (reagent/consumable consumption)
    └──→ Doctor Module               (results delivered to doctor's workbench)
```

### Radiology
```
Radiology Module
    ├── Patient Module               (radiology_study_orders.patientId)
    ├──• Encounter Module            (radiology_study_orders.encounterId)
    ├──• OPD Module                  (radiology_study_orders.opdVisitId)
    ├──← Doctor Module               (imaging orders placed)
    ├──→ Billing Module              (study charge lines)
    ├──→ Inventory Module            (contrast/consumable consumption)
    └──→ Doctor Module               (reports delivered to doctor's workbench)
```

### Pharmacy
```
Pharmacy Module
    ├── Patient Module               (pharmacy_fulfillments.patientId)
    ├──• Encounter Module            (pharmacy_fulfillments.encounterId)
    ├──• OPD Module                  (pharmacy_fulfillments.opdVisitId)
    ├── Pharmacy Stock (self)       (inventory of drugs)
    ├──← Doctor Module               (prescriptions)
    ├──→ Billing Module              (medication charge lines)
    ├──→ Inventory Module            (drug stock consumption)
    ├──→ Nursing/MAR Module          (IPD medication to MAR)
    └── Events → PlatformEvent       (dispensing events)
```

### OT (Operation Theatre)
```
OT Module
    ├── Patient Module               (ot_cases.patientId)
    ├──• IPD Module                  (ot_cases.ipdAdmissionId)
    ├── OT Room (self)              (ot_rooms — scheduling resource)
    ├──← Doctor/Surgeon Module       (surgery orders)
    ├──→ Billing Module              (surgical package/charge lines)
    ├──→ Inventory Module            (implants/consumables consumption)
    ├──→ Lab Module                  (frozen section / specimen tracking)
    └── Events → PlatformEvent       (OT case status changes)
```

### Discharge Orchestration
```
Discharge Module — RECEIVES clearance from multiple departments
    ├── IPD Module                   (discharge_orchestrations.admissionId)
    ├── Patient Module               (discharge_orchestrations.patientId)
    │
    ├──← Nursing Module              (nursing clearance flag)
    ├──← Billing Module              (billing clearance flag)
    ├──← Pharmacy Module             (pharmacy clearance flag)
    ├──← Insurance Module            (insurance clearance flag)
    ├──← Clinical/Doctor Module      (clinical clearance flag)
    │
    └──→ IPD Module                  (patient discharged notification)
    └──→ Housekeeping Module         (bed cleaning request)
    └──→ Bed Module                  (bed made available)
```

### Inventory
```
Inventory Module (Central)
    ├──• Purchase Module             (stock receipt from PO)
    ├──← Lab Module                  (reagent consumption)
    ├──← Radiology Module            (contrast/consumable consumption)
    ├──← Pharmacy Module             (drug stock deduction)
    ├──← OT Module                   (implant/consumable consumption)
    ├──← Nursing Module              (consumable usage)
    ├──→ Billing Module              (consumable charge for patient-specific items)
    └──→ Purchase Module             (auto-reorder trigger on low stock)
```

### CRM
```
CRM Module
    ├── Patient Module               (crm_leads.patientId, lifecycle events)
    ├──• OPD Module                  (crm_leads.opdVisitId)
    ├──→ Appointment Module          (schedule from lead)
    ├──→ Patient Engagement          (campaign execution)
    └── Events → PlatformEvent       (lead stage changes)
```

### Dialysis
```
Dialysis Module
    ├── Patient Module               (dialysis_sessions.patientId)
    ├──• IPD Module                  (dialysis_sessions.ipdAdmissionId for inpatients)
    ├── Dialysis Machine (self)     (dialysis_machines)
    ├──→ Billing Module              (session charge lines)
    └── Events → PlatformEvent       (session state changes)
```

### Navayu-Specific
```
Navayu Module
    ├── Patient Module               (Navayu exam forms linked to patient)
    ├── OPD Module                   (Navayu MSK workflow during OPD)
    ├──→ Lab / Radiology Module      (MSK-specific investigations)
    ├──→ Pharmacy Module             (MSK-specific prescriptions)
    └──→ Follow-up Module            (treatment outcome tracking)
```

### Notifications
```
Notification Module (Central Dispatcher)
    ├──← ALL Modules                 (notification requests via event bus)
    ├──→ SMS Provider                (Twilio)
    ├──→ Email Provider              (SendGrid)
    └──→ WhatsApp Provider           (planned)
```

---

## 3. DATA FLOW SEQUENCE — PATIENT JOURNEY

### Standard OPD Visit (Data Flow Sequence)
```
1. Patient arrives → Reception verifies/create record
   └─ Patient Module: CREATE Patient
   └─ Billing Module: CREATE Invoice (consultation fee)
   └─ OPD Module: CREATE OpdVisit (state=check_in)

2. Nurse takes vitals
   └─ Nurse Module (via OPD): UPDATE OpdVisit with vitals
   └─ OPD Module: UPDATE state=waiting, token_number assigned

3. Doctor consultation
   └─ OPD Module: UPDATE state=in_consultation
   └─ Encounter Module: CREATE Encounter (type=OPD)
   └─ EMR Module: CREATE ClinicalNote
   └─ Lab Module: CREATE LabDiagnosticOrder (if tests ordered)
   └─ Radiology Module: CREATE RadiologyStudyOrder (if imaging ordered)
   └─ Pharmacy Module: CREATE PharmacyFulfillment (if meds prescribed)

4. Lab tests performed
   └─ Lab Module: UPDATE state=processing → verified → reported
   └─ Billing Module: CREATE InvoiceChargeLine (lab charges)
   └─ PlatformEvent: lab.result_available

5. Doctor reviews results
   └─ OPD Module: UPDATE state=in_consultation (resume after diagnostics)
   └─ Doctor updates treatment plan
   └─ OPD Module: UPDATE state=completed

6. Billing settlement
   └─ Billing Module: UPDATE Invoice state → paid, settled
   └─ PaymentRecord: CREATE (payment details)

7. Pharmacy dispensing
   └─ Pharmacy Module: UPDATE state=dispensed
   └─ Stock: Inventory deduction (qtyOnHand - qtyDispensed)
   └─ Billing: CREATE InvoiceChargeLine (pharmacy charges)
```

### IPD Admission (Data Flow Sequence)
```
1. Admission recommended → Bed assignment
   └─ IPD Module: CREATE IpdAdmission (state=admission_requested)
   └─ Bed Module: UPDATE bed state=reserved, currentAdmissionId set

2. Deposit collection
   └─ Billing Module: CREATE Invoice (deposit)
   └─ IPD Module: UPDATE state=deposit_paid → bed_assigned

3. Nursing intake
   └─ Nursing Module: CREATE NursingTask (initial assessment)
   └─ MAR Module: CREATE MedicationSchedule (recurring meds)

4. Daily care (loop)
   └─ Nursing Module: CREATE NursingVitalRound × frequency
   └─ Nursing Module: UPDATE NursingTask (as completed)
   └─ Doctor Module: Daily progress note, orders
   └─ Billing Module: Daily bed charge accrual (InvoiceChargeLine)
   └─ Lab/Radiology: As ordered
   └─ Pharmacy: IPD medication dispensed

5. Discharge process → multi-clearance
   └─ Discharge Module: CREATE DischargeOrchestration
   └─ Clinical clearance ← Doctor
   └─ Billing clearance ← Billing Module (all charges reconciled)
   └─ Nursing clearance ← Nursing Module (tasks complete)
   └─ Pharmacy clearance ← Pharmacy Module (take-home dispensed)
   └─ Insurance clearance ← Insurance Module (claim ready)
   └─ Discharge Module: UPDATE state=discharge_ready

6. Discharge
   └─ IPD Module: UPDATE state=discharged
   └─ Bed Module: UPDATE bed state=available, clear currentAdmissionId
   └─ Discharge Module: Patient education, follow-up scheduled
   └─ Housekeeping: Bed cleaning request
```

---

## 4. SHARED ENTITIES (Used by Multiple Modules)

| Entity | Used By | Purpose |
|--------|---------|---------|
| **Patient** | ALL clinical + billing + CRM + nursing | Universal patient identity |
| **Encounter** | OPD, IPD, ER, EMR, Lab, Radiology, Pharmacy, Billing | Patient visit container |
| **PlatformEvent** | ALL modules | Event-driven communication, audit, metering |
| **Invoice** | Billing, OPD, IPD, Lab, Radiology, Pharmacy, OT, Dialysis | Financial consolidation |
| **InvoiceChargeLine** | Same as Invoice + source modules | Idempotent charge capture |
| **NotificationOutbox** | ALL modules | Unified notification dispatch |
| **PlatformUser** | ALL modules (via JWT) | Actor identification, RBAC |
| **Branch** | Tenant module, ALL domain data (via tenantId) | Multi-branch isolation |
| **WorkflowDefinition** | OPD, IPD, Lab, Pharmacy (configurable) | State machine override |
| **OperationalEscalation** | OPD, IPD, Nursing, Lab | Cross-module escalation |

---

## 5. CRITICAL DEPENDENCY PATHS

### Path A: OPD Billing
```
Doctor Orders → Lab/Radiology/Pharmacy → Charge Line → Invoice → Payment
```
**Where it breaks if:**
- Doctor order doesn't auto-create charge line (revenue leakage)
- Lab/Pharmacy doesn't push charges to billing (manual entry needed)
- Invoice doesn't link to OPD visit (orphan charges)

### Path B: IPD Discharge
```
Doctor clearance + Billing clearance + Nursing clearance + Pharmacy clearance
                            ↓
                    Discharge Orchestration
                            ↓
                  Bed marked available → Housekeeping
                            ↓
                        Patient discharged
```
**Where it breaks if:**
- Any clearance not completed → discharge blocked
- No real-time visibility of clearance status → frustration
- Bed not released after discharge → bed shortage

### Path C: Insurance Claim
```
Registration (capture insurance) → Pre-auth → Treatment → Billing → Claim → Settlement
```
**Where it breaks if:**
- Insurance not captured at registration → retroactive correction hassle
- Pre-auth not done before treatment → claim denial risk
- No structured claim data → manual claim preparation

---

## 6. FUTURE DEPENDENCY RESOLUTION

| Missing Module | Current Workaround | Blocks |
|----------------|-------------------|--------|
| **Purchase/Procurement** | Manual purchase outside system | Inventory auto-reorder, cost tracking |
| **HR/Payroll** | Manual HR processes | Employee master for duty roster, credentialing |
| **Housekeeping** | Verbal/paper scheduling | Bed turnover tracking, discharge workflow |
| **Maintenance** | Manual/paper logs | Equipment uptime, PM compliance |
| **Blood Bank** | Manual blood bank system | Transfusion safety, inventory tracking |
| **Patient Portal** | Phone call for appointments | Patient self-service, engagement |
| **Telemedicine** | No telemed capability | Remote consultations, revenue |
| **PACS Integration** | Manual image review | Radiology workflow, report turnaround |
