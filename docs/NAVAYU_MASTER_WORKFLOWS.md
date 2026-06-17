# Navayu Health — Master Workflow Document

> **Document Type:** Definitive Operational & Product Blueprint  
> **Audience:** Hospital Administrators, Operations Heads, Doctors, Nurses, Receptionists, Billing Staff, Finance Managers, Compliance Officers, HIS Product Managers, Enterprise Architects  
> **Scope:** Complete end-to-end workflows for Navayu Health Hospital OS — both hospital branches  
> **Perspective:** Real hospital operations + software implementation

---

## TABLE OF CONTENTS

1. Patient Registration
2. Appointment Management
3. OPD (Outpatient Department)
4. IPD (Inpatient Department)
5. Emergency / Trauma
6. Nursing Workflows
7. Doctor Workbench & EMR/EHR
8. Billing & Financial Operations
9. Insurance / TPA
10. Pharmacy
11. Laboratory
12. Radiology
13. OT (Operation Theatre) Management
14. ICU/Critical Care
15. Dialysis
16. Blood Bank
17. Inventory & Store Management
18. Purchase & Procurement
19. HR & Payroll
20. Duty Roster
21. Housekeeping
22. Maintenance
23. MIS Reports & Analytics
24. Finance & Administration
25. Queue Management
26. Telemedicine
27. Patient Portal
28. Mobile Applications
29. CRM & Patient Engagement
30. Navayu-Specific Modules
31. Integrations
32. Missing Workflows

---

## 1. PATIENT REGISTRATION

### Purpose
Create and maintain the master patient record that serves as the foundation for all downstream clinical, financial, and operational workflows.

### Actors
- **Receptionist** — Primary registration operator
- **Patient** — Consumer of healthcare services
- **Self-Registration (Portal)** — Via patient portal or kiosk
- **Admin** — Record merging, deduplication, corrections

### End-to-End Workflow

#### A. New Patient Registration

```
[START] → Patient arrives at reception (walk-in / referred / emergency)
         ↓
    Identity Verification
    ├── Government ID (Aadhaar, PAN, Passport, DL)
    ├── Insurance card (if applicable)
    └── Previous records (if follow-up from other hospital)
         ↓
    Demographic Data Collection
    ├── Full Name (as per ID)
    ├── Date of Birth / Age
    ├── Gender
    ├── Blood Group (optional initially)
    ├── Marital Status
    ├── Occupation
    ├── Nationality / Religion
    ├── Address (Permanent & Current)
    └── Contact Information (Primary & Secondary Phone, Email)
         ↓
    Emergency Contact Details
    ├── Name
    ├── Relationship
    └── Phone Number
         ↓
    Insurance / TPA Details (if applicable)
    ├── Insurance Provider
    ├── Policy Number
    ├── Group/Employer Details
    ├── Validity Period
    ├── Coverage Details & Sum Insured
    └── TPA Name & Contact
         ↓
    MRN (Medical Record Number) Generation
    ├── Auto-generated unique identifier
    ├── Branch prefix for multi-site identification
    └── QR-coded patient ID card printed
         ↓
    Consent & Acknowledgment
    ├── Patient consent for treatment
    ├── HIPAA/Privacy policy acknowledgment
    ├── Financial consent & deposit agreement
    └── Organ donation consent (optional)
         ↓
[END] → Registration Complete → Route to OPD / Emergency / Admission as applicable
```

#### B. Follow-up / Returning Patient
```
[START] → Patient provides MRN / Phone / Name search
         ↓
    System retrieves existing record
         ↓
    Verify & Update
    ├── Contact details (if changed)
    ├── Insurance/TPA (if changed)
    └── Emergency contact
         ↓
[END] → Continue to appointment / OPD / IPD
```

### Decision Points
1. **Duplicate detection:** If phone/name/DOB matches existing record, flag for review
2. **Walk-in vs Scheduled:** Walk-ins go through OPD triage; scheduled go directly to OPD
3. **Insurance vs Self-Pay:** Different registration and deposit flows
4. **Emergency walk-in:** Fast-track registration (minimal fields, complete later)

### Exception Handling
| Scenario | Action |
|----------|--------|
| Patient cannot provide ID | Register as "Unknown" with photo, police notification |
| Child/Infant registration | Register under parent/guardian's ID with relationship link |
| Unconscious emergency patient | Register as "Unknown Male/Female", complete details later |
| Duplicate found after registration | Initiate MRN merge workflow (requires admin) |
| Aadhaar eKYC failure | Fall back to manual verification |
| International patient | Passport-based verification, handle foreign insurance/currency |

### Dependencies
- **EMR/Encounter:** Registration triggers encounter creation
- **Billing:** Registration required for invoice generation
- **Appointments:** Registration links to appointment records
- **Insurance:** Registration triggers insurance eligibility check

### Notifications
- SMS/WhatsApp welcome message to patient
- Registration confirmation to patient's email
- Admin alert for incomplete registrations > 24 hours

### Audit & Compliance
- Full registration history tracked (who created/modified, when)
- ID verification method recorded
- Consent documents stored with timestamp
- GDPR right-to-erasure capability required

---

## 2. APPOINTMENT MANAGEMENT

### Purpose
Enable patients to schedule consultations with healthcare providers efficiently, optimize provider utilization, and minimize patient wait times.

### Actors
- **Patient** — Seeks appointment
- **Receptionist** — Books appointments on behalf of patients
- **Doctor** — Manages own availability/schedule
- **Call Center Agent** — Remote booking via phone
- **System** — Auto-assign, reminders, waitlist management

### End-to-End Workflow

#### A. Appointment Booking
```
[START] → Patient requests appointment (walk-in, phone, online, in-person)
         ↓
    Patient Identification
    ├── Existing patient → verify from system
    └── New patient → initiate quick registration
         ↓
    Select Department & Doctor
    ├── Browse available departments
    ├── View doctor profiles (specialty, experience, languages)
    ├── Check doctor availability (calendar view)
    └── Consider patient preferences (gender preference, past visits)
         ↓
    Select Date & Time Slot
    ├── View available slots (15/30/60 min intervals)
    ├── Consider doctor's consultation type (first visit vs follow-up)
    └── Special consideration for urgent cases
         ↓
    Select Appointment Type
    ├── New Consultation
    ├── Follow-up
    ├── Telemedicine (video)
    ├── Health Checkup Package
    ├── Procedure/Surgery Consultation
    └── Emergency (routed to Emergency module)
         ↓
    Confirm & Book
    ├── Capture reason for visit / chief complaint
    ├── Note any special requirements
    ├── Generate appointment reference number
    └── Send confirmation via SMS/Email/WhatsApp with calendar link
         ↓
[END] → Added to doctor's schedule & patient's upcoming appointments
```

#### B. Appointment Management & Modifications
```
Rescheduling:
[START] → Request reschedule → Check availability → Offer alternatives
         → Confirm new slot → Release old slot → Notify all parties

Cancellation:
[START] → Cancel appointment → Apply cancellation policy
         → Free slot → Notify waitlisted patients → Trigger refund if prepaid

No-Show:
[START] → Patient misses appointment → Mark as no-show after 15 min
         → Record in patient history → Apply no-show fee policy
         → Offer to reschedule
```

### Decision Points
1. **Provider preference:** Honor patient request vs system-optimized assignment
2. **Slot type:** Regular vs urgent vs follow-up
3. **Overbooking policy:** Allow or block when full
4. **Cancellation window:** Fee vs no-fee based on timing
5. **Waitlist trigger:** Auto-promote from waitlist when slot opens

### Exception Handling
| Scenario | Action |
|----------|--------|
| Doctor on leave suddenly | Auto-notify all booked patients, offer alternatives |
| Patient arrives late | Priority downgrade if >15 min, reschedule if >30 min |
| Emergency slot needed | Override booking, notify existing patient |
| Double booking | Detect conflict at booking, block with error |
| System crash during booking | Transaction rollback, audit log for recovery |

### Dependencies
- **Scheduling Resources:** Doctors, rooms, equipment availability
- **Patient Registration:** Patient must exist
- **Billing:** Pre-payment for paid consultations
- **OPD:** Creates OPD intent/visit record
- **CRM:** Creates lifecycle event for appointment
- **Notifications:** Confirmation and reminder triggers
- **Queue Management:** Feeds into OPD queue

### Notifications & Alerts
- **Booking Confirmation:** Patient receives instant confirmation
- **24-hour Reminder:** Automated reminder with instructions
- **2-hour Reminder:** Pre-appointment reminder
- **Doctor Alert:** New patient assigned notification
- **Reception Alert:** Daily appointment list (morning)
- **Waitlist Update:** When slot becomes available
- **Cancellation Notice:** All affected parties notified
- **No-Show Alert:** Doctor and admin notified

### Audit & Compliance
- Full booking audit history
- Cancellation reason tracking
- No-show documentation for insurance/billing
- Patient consent for teleconsultation
- Data retention compliance

---

## 3. OPD (OUTPATIENT DEPARTMENT)

### Purpose
Manage the complete outpatient journey from check-in to consultation completion, including diagnostics and pharmacy fulfillment.

### Actors
- **Receptionist** — Check-in, collect payments
- **Patient** — Receives consultation
- **Doctor** — Conducts consultation, prescribes treatment
- **Nurse** — Triage, vitals measurement
- **Billing Staff** — Collect OPD fees
- **Lab Technician** — Sample collection
- **Pharmacist** — Dispense prescribed medication

### End-to-End Workflow

#### A. OPD Flow — Patient Journey
```
[START] → Patient arrives
         ↓
    Check-in at Reception
    ├── Confirm appointment or register as walk-in
    ├── Verify patient identity
    ├── Collect/verify OPD consultation fee
    ├── Issue token number
    └── Direct to waiting area
         ↓
    Triage & Vitals (by Nurse)
    ├── Weight, Height, BMI
    ├── Blood Pressure, Pulse
    ├── Temperature
    ├── SpO2 (if applicable)
    ├── Allergies (ask & verify)
    └── Chief complaint & history of present illness (HPI)
         ↓
    Wait in OPD Queue
    ├── Displayed on OPD TV/board
    ├── Estimated wait time shown
    ├── Priority cases moved ahead
    └── SMS alert when doctor is ready
         ↓
    Doctor Consultation (see Doctor Workbench §7)
    ├── History taking & physical examination
    ├── Review previous records
    ├── Diagnosis / Provisional Diagnosis
    ├── Order investigations (lab, radiology)
    ├── Prescribe medications
    ├── Recommend procedures or referrals
    └── Document encounter notes (SOAP)
         ↓
    Investigations (if ordered)
    ├── Lab: Sample collection → Testing → Results → Doctor review
    ├── Radiology: Order → Perform → Report → Doctor review
    └── Return to doctor for results discussion
         ↓
    Prescription & Advice
    ├── Medication prescribed
    ├── Follow-up instructions
    ├── Diet & lifestyle advice
    ├── When to return / red flags
    └── Print prescription (paper or digital)
         ↓
    Billing & Payment
    ├── Collect all charges (consultation, diagnostics, pharmacy)
    ├── Apply discounts if applicable
    ├── Generate invoice
    ├── Process payment (cash, card, UPI, insurance)
    └── Provide payment receipt
         ↓
    Pharmacy (if medications prescribed)
    ├── Submit prescription to pharmacy
    ├── Queue for dispensing
    ├── Receive medications with usage instructions
    └── Counsel on medication usage
         ↓
[END] → OPD Completed → Follow-up appointment scheduled if needed
```

### OPD State Machine (Formal)
```
                    ┌──────────────────┐
                    │     INTENT       │ (Appointment booked / Registered)
                    └────────┬─────────┘
                             │ check_in
                    ┌────────▼─────────┐
                    │    CHECKED_IN     │ (Arrived at reception)
                    └────────┬─────────┘
                             │ triage_complete
                    ┌────────▼─────────┐
                    │     WAITING       │ (In waiting area, token issued)
                    └────────┬─────────┘
                             │ consultation_start
                    ┌────────▼──────────┐
                    │ IN_CONSULTATION   │ (With doctor)
                    └────────┬──────────┘
                             │
                    ┌────────┴──────────────┐
                    │                       │
              investigations       no_investigations
              ordered               needed
                    │                       │
            ┌───────▼────────┐     ┌───────▼──────────┐
            │ AWAITING       │     │   COMPLETED      │
            │ DIAGNOSTICS    │     │ (Prescribed +     │
            └───────┬────────┘     │  Follow-up set)   │
                    │              └───────────────────┘
              results_received
                    │
            ┌───────▼────────┐
            │ RETURN_TO      │
            │ DOCTOR         │
            └───────┬────────┘
                    │ consultation_resume
                    └─────► IN_CONSULTATION (loop)
```

### Decision Points
1. **Walk-in vs Appointment:** Different queuing priority
2. **Triage urgency:** Emergency → redirect to ER; Urgent → priority; Routine → normal queue
3. **Diagnostics needed:** Lab vs Radiology vs Both vs None
4. **Admission needed:** Direct IPD admission from OPD
5. **Referral:** To other specialist / higher center
6. **Follow-up period:** Days vs weeks vs months

### Exception Handling
| Scenario | Action |
|----------|--------|
| Patient with critical vitals | Immediate redirect to Emergency |
| Doctor not available | Reassign to available doctor or reschedule |
| Diagnostic results delayed | Notify doctor and patient, reschedule if needed |
| Payment failure | Partial payment / deposit against undertaking |
| Lost token number | Re-issue at reception (verify identity) |
| No-show after 30 min in queue | Mark as no-show, offer reschedule |
| Patient leaves during wait | Contact attempt, log as "left without consultation" |

### Dependencies
- **Patient Registration:** Must exist
- **Appointment:** Links to appointment (may be walk-in)
- **Billing:** Consultation fee, investigation fees, pharmacy charges
- **Lab:** Lab order placement from OPD
- **Radiology:** Radiology order placement from OPD
- **Pharmacy:** Prescription fulfillment
- **EMR/Encounter:** Clinical documentation
- **Queue Management:** TV display and token system
- **IPD:** If admission needed
- **Insurance/TPA:** If insurance coverage applies

### Notifications
- Patient updated on queue position (SMS/TV/WhatsApp)
- Doctor notified of next patient
- Billing notified of charges from doctor orders
- Pharmacy notified of prescription pending
- Follow-up reminder (auto-scheduled)

### Audit & Compliance
- Complete OPD visit audit trail
- Prescription audit (who prescribed what, when)
- Investigation order audit trail
- Consent for procedures/investigations documented
- NABH/JCI compliance-ready tracking

---

## 4. IPD (INPATIENT DEPARTMENT)

### Purpose
Manage the complete inpatient journey from admission to discharge, including bed management, nursing care, medication administration, and discharge planning.

### Actors
- **Admission Officer** — Process admission
- **Patient/Attendant** — Admitted for treatment
- **Doctor** — Primary consultant, rounds, treatment planning
- **Nurse** — Round-the-clock care, medication administration
- **Billing Staff** — Deposit management, billing throughout stay
- **Pharmacist** — IPD medication dispensing
- **Lab Technician** — IPD sample collection
- **Housekeeping** — Room/bed maintenance
- **Dietitian** — Meal planning
- **Physiotherapist** — Rehabilitation
- **Social Worker** — Discharge planning and support

### End-to-End Workflow

#### A. Admission Process
```
[START] → Admission recommended (OPD/ER/Referral)
         ↓
    Doctor's Admission Order
    ├── Primary diagnosis
    ├── Diagnosis codes (ICD-10)
    ├── Admission type (Elective / Emergency / Urgent)
    ├── Admission preference (Room type: General, Semi-Private, Private, ICU)
    ├── Expected duration of stay
    └── Special instructions
         ↓
    Bed Assignment
    ├── Check bed availability (by ward/room type)
    ├── Block bed for incoming patient
    ├── Coordinate with nursing station
    └── Confirm bed assignment
         ↓
    Financial Counseling
    ├── Estimate treatment costs
    ├── Discuss payment options
    ├── Collect advance deposit (varies by procedure/room type)
    ├── Insurance verification and pre-authorization
    └── Payment plan agreement
         ↓
    Admission Processing
    ├── Verify patient identity on admission
    ├── Collect admission documents (ID, insurance card, referral)
    ├── Patient & attendant wristbands printed
    ├── Assign MRN if new / verify if existing
    ├── Floor/room orientation provided
    └── Admission consent form signed
         ↓
    Nursing Handover
    ├── Patient introduced to nursing team
    ├── Initial nursing assessment
    ├── Vitals recorded baseline
    ├── Allergies verified
    ├── Fall risk assessment
    ├── Pressure ulcer risk assessment
    └── Initial care plan created
         ↓
    Doctor's Initial Orders
    ├── Diet order (regular, diabetic, liquid, NBM)
    ├── Activity order (bed rest, ambulatory, wheelchair)
    ├── Medication orders
    ├── Investigation orders (lab, radiology)
    ├── Consults (if multiple specialties involved)
    └── Advanced directives (if any)
         ↓
[END] → Admitted → Treatment Phase Begins
```

#### B. Daily Inpatient Care (Treatment Phase)
```
Daily Rounds (Morning)
├── Consultant-led rounds (daily or as scheduled)
├── Review patient progress, vitals trends
├── Review investigation results
├── Adjust treatment plan
├── Document progress notes
└── Discuss discharge plan (if appropriate)

Nursing Care (Ongoing)
├── Vital signs monitoring - frequency by acuity
├── Medication administration per MAR
├── Wound care / dressing changes
├── IV line management
├── Catheter / drain care
├── Input-Output charting
├── Fall prevention measures
├── Bedside handover at shift change
└── Patient hygiene assistance

Investigations (As ordered)
├── Blood draws (morning rounds / STAT)
├── Imaging (portable X-ray, USG, CT, MRI)
├── ECG / Echo
├── Special tests
└── Results reviewed by treating doctor

Consults (As needed)
├── Specialist consultations arranged
├── Multi-disciplinary team meetings
├── Physiotherapy sessions
├── Dietitian visits
├── Social work / Case management
└── Palliative care (if appropriate)
```

#### C. Discharge Process
```
[START] → Doctor decides discharge is appropriate
         ↓
    Discharge Clearance Workflow (Multi-department)
    ├── Clinical Clearance: 
    │   ├── Patient medically fit for discharge
    │   ├── Discharge summary drafted
    │   ├── Follow-up appointment scheduled
    │   └── Discharge medications prescribed
    ├── Nursing Clearance:
    │   ├── All nursing tasks completed
    │   ├── Nursing discharge summary
    │   └── Patient education completed
    ├── Billing Clearance:
    │   ├── Final bill generated
    │   ├── All charges reconciled
    │   ├── Insurance settled (if applicable)
    │   └── Balance collected / refund processed
    ├── Pharmacy Clearance:
    │   ├── Discharge medications dispensed
    │   ├── Medication counseling done
    │   └── Take-home medications ready
    └── Insurance Clearance (if applicable):
        ├── Final insurance claim prepared
        ├── Documentation complete
        └── TPA sign-off obtained
         ↓
    Discharge Education
    ├── Discharge instructions explained
    ├── Medication schedule explained
    ├── Diet & activity restrictions
    ├── Warning signs / when to return
    ├── Follow-up appointment confirmed
    └── Emergency contact information
         ↓
    Bed Cleaning & Turnover
    ├── Patient room/bed vacated → flagged for cleaning
    ├── Housekeeping notified
    ├── Linen exchange initiated
    ├── Surface disinfection
    └── Bed marked available in system
         ↓
[END] → Patient Discharged → Feedback collection → Follow-up schedule activated
```

### IPD State Machine
```
admission_requested → deposit_pending → bed_assigned → 
admitted → treatment_in_progress → 
    ├── transfer_requested → transfer_approved → transferred (to ICU/other ward)
    ├── discharge_initiated → 
    │   ├── clinical_clearance_pending
    │   ├── billing_clearance_pending
    │   ├── nursing_clearance_pending
    │   ├── pharmacy_clearance_pending
    │   └── insurance_clearance_pending
    ├── discharge_ready → discharged
    ├── escalated → resolved → discharged
    ├── absconded (patient left without notice)
    ├── death → death_summary_completed
    └── readmission → linked to new admission record
```

### Decision Points
1. **Admission type:** Elective vs Emergency — affects bed priority and deposit
2. **Room upgrade/downgrade:** Patient request, clinical need, or bed availability
3. **ICU step-down:** Clinical readiness, bed availability
4. **Discharge timing:** Morning vs evening discharge affects bed turnover
5. **LAMA (Leave Against Medical Advice):** Documentation and liability waiver
6. **Transfer:** To another facility or within-facility transfer

### Exception Handling
| Scenario | Action |
|----------|--------|
| No bed available | Waitlist, "bed on hold" status, daily check |
| Patient refuses admission | Document refusal, offer OPD management |
| Insurance pre-auth rejected | Escalate to financial counselor, discuss self-pay |
| Patient absconds | Security notification, police report, patient tracking |
| Patient death | Death summary, mortuary workflow, legal documentation |
| Readmission within 30 days | Flag in system, link to previous admission |
| Billing dispute during discharge | Escalate to admin, partial discharge if necessary |

### Dependencies
- **Bed Management:** Core dependency for admission
- **Nursing:** All inpatient care delivery
- **Billing:** Deposit, daily charges, final bill
- **Doctor/EMR:** Treatment orders and documentation
- **Lab/Radiology:** Investigation processing
- **Pharmacy:** IPD medication dispensing
- **Insurance:** Pre-auth, claims processing
- **Housekeeping:** Bed turnover
- **Dietary:** Meal planning and delivery
- **Discharge Orchestration:** Multi-department clearance workflow

### Notifications
- Admission confirmation to patient/attendant and family
- Bed assignment notification to nursing station
- Doctor notified on investigation results availability
- Daily bill summary to patient/attendant
- Discharge clearance status to all departments
- Bed ready for cleaning notification to housekeeping
- Follow-up reminder scheduled automatically

### Audit & Compliance
- Complete admission-discharge audit trail
- All clinical orders time-stamped and attributed
- Medication administration record (MAR) fully auditable
- Discharge summary compliance (NABH/JCI standards)
- Consent documentation for all procedures
- Death audit for mortality review

---

## 5. EMERGENCY / TRAUMA

### Purpose
Provide immediate life-saving care through a fast-track triage and treatment system with minimal administrative friction.

### Actors
- **Triage Nurse** — First assessment, priority assignment
- **ER Doctor** — Emergency physician
- **Specialist On-Call** — Trauma surgeon, cardiologist, neurologist, etc.
- **ER Nurse** — Procedure assistance, monitoring
- **Receptionist** — Emergency registration
- **Lab Technician** — STAT lab processing
- **Radiology Technician** — Portable X-ray, CT, USG
- **Security** — Crowd control, patient transport
- **Ambulance Crew** — Pre-hospital care, handoff
- **Billing Staff** — Emergency billing (post-stabilization)

### End-to-End Workflow

#### A. Emergency Triage & Treatment
```
[START] → Patient arrives (walk-in / ambulance / referral)
         ↓
    Immediate Triage Assessment (within 2 minutes)
    ├── Primary survey (A-B-C-D-E approach)
    │   A - Airway patency
    │   B - Breathing / Respiratory rate
    │   C - Circulation / Pulse / BP / Bleeding control
    │   D - Disability / GCS / Pupils
    │   E - Exposure / Environment / Temperature
    ├── Vital signs (BP, HR, RR, SpO2, Temp, GCS)
    ├── Chief complaint / Mechanism of injury
    └── Triage category assignment
         ↓
    Triage Category Assignment
    ├── Category 1 (Red) - Immediate: Life-threatening, resuscitation needed
    │   → Direct to resuscitation bay
    │   → Team activation (trauma/code)
    │   → Immediate intervention
    ├── Category 2 (Orange) - Emergency: High risk, unstable
    │   → Within 10 minutes
    │   → Rapid assessment and treatment
    ├── Category 3 (Yellow) - Urgent: Stable but needs treatment
    │   → Within 30 minutes
    │   → Doctor evaluation
    ├── Category 4 (Green) - Semi-urgent: Minor condition
    │   → Within 60 minutes
    │   → Fast-track to minor treatment area
    └── Category 5 (Blue) - Non-urgent: Minor complaints
        → Can be redirected to OPD
        → Advised accordingly
         ↓
    Emergency Registration (parallel to treatment)
    ├── Minimal registration (name, age, gender, contact)
    ├── "Unknown" registration for unconscious/unidentified
    ├── MRN generated (may be temporary)
    ├── Wristband with barcode + triage color
    └── Full registration completed after stabilization
         ↓
    Emergency Treatment
    ├── Category 1: Immediate life-saving interventions
    │   ├── Airway management (intubation, cricothyroidotomy)
    │   ├── Breathing support (ventilation, chest tube)
    │   ├── Circulation (IV access, fluids, blood products)
    │   ├── Cardiac monitoring / defibrillation
    │   └── Emergency procedures (thoracotomy, pericardiocentesis)
    ├── Category 2-3: Targeted treatment
    │   ├── IV access, labs (STAT), ECG
    │   ├── Imaging (X-ray, FAST USG, CT)
    │   ├── Medications (analgesics, antibiotics, etc.)
    │   └── Monitoring
    └── Category 4-5: Minor procedures
        ├── Wound care, suturing
        ├── Splinting, casting
        ├── Prescription for follow-up
        └── Discharge instructions
         ↓
    Disposition Decision
    ├── Admit to IPD/ICU → Bed coordination, admission processing
    ├── Admit to Observation/Short Stay Unit → 24hr monitoring
    ├── Transfer to OT → Emergency OT activation
    ├── Transfer to another facility → Referral coordination
    └── Discharge home → Instructions, follow-up, prescriptions
         ↓
[END] → Emergency episode concluded → Follow-up / Admission / Transfer
```

### Decision Points
1. **Triage color change:** Patient can deteriorate → reassess and recategorize
2. **Mass casualty:** Activate disaster protocol, tag patients, mobilize resources
3. **Transfer decision:** Lack of resources / specialty at current facility
4. **Observation vs Admission:** Based on expected length of stay and clinical stability
5. **Police case:** Medico-legal case documentation
6. **Organ donation:** Potential organ donor identification and protocol activation

### Exception Handling
| Scenario | Action |
|----------|--------|
| Mass casualty event | Disaster protocol, additional staff called in |
| Unknown/unidentified patient | Temporary ID, photo, police notification |
| Violent/aggressive patient | Security intervention, sedation protocol |
| Medico-legal case | Evidence preservation, police notification, separate documentation |
| Patient leaves without being seen | Documentation, contact attempt, risk flagging |
| Pediatric emergency | Pediatric resuscitation team, age-appropriate equipment |
| Psychiatric emergency | De-escalation, psychiatric consultation, safety measures |
| Refuses treatment | Document refusal, risk explanation, sign against medical advice |

### Dependencies
- **Patient Registration:** Minimal emergency registration
- **IPD/Bed Management:** For admissions from ER
- **OT:** For emergency surgeries
- **Lab:** STAT lab processing capability
- **Radiology:** 24/7 imaging availability
- **Blood Bank:** Emergency blood release
- **Pharmacy:** Emergency drug access
- **Billing:** Post-stabilization billing
- **Security:** 24/7 security presence

### Notifications & Alerts
- Trauma team activation (pager/SMS/call)
- Specialist on-call notification
- Blood bank emergency release request
- OT team activation for emergency surgery
- ICU bed request notification
- Police notification for medico-legal cases
- Family notification (when identified)

### Audit & Compliance
- Triage times documented and monitored (<2 min target)
- Door-to-doctor time tracked
- Door-to-ECG time for ACS (target <10 min)
- Door-to-needle time for thrombolysis (target <30 min)
- Door-to-balloon time (target <90 min)
- Medico-legal documentation requirements
- Emergency equipment checklists
- Code documentation and review

---

## 6. NURSING WORKFLOWS

### Purpose
Coordinate all nursing activities including task management, vital signs documentation, medication administration, and patient care documentation.

### Actors
- **Nurse** — Primary caregiver, documentation
- **Nursing Supervisor** — Shift management, task oversight
- **Doctor** — Orders that trigger nursing tasks
- **Patient** — Recipient of nursing care

### End-to-End Workflow: Nursing Task Lifecycle
```
[START] → Task Created (auto-generated from doctor orders OR manually assigned)
         ↓
    Task Assignment
    ├── Auto-assigned based on nurse-patient ratio
    ├── Manual assignment by nursing supervisor
    ├── Shift-based task distribution
    └── Consider skill matching (ICU nurse for complex tasks)
         ↓
    Task Acknowledgment
    ├── Nurse reviews assigned tasks
    ├── Prioritize based on urgency
    ├── Acknowledge receipt of task
    └── Request clarification if needed
         ↓
    Task Execution
    ├── Perform clinical intervention
    ├── Document completion details
    ├── Record patient response
    └── Flag any complications/concerns
         ↓
    Task Verification
    ├── Second-nurse verification (for controlled/IV meds)
    ├── Supervisor verification (for high-risk tasks)
    └── Auto-verified for routine tasks
         ↓
    Documentation Complete
    ├── Time-stamped completion record
    ├── Outcome documented
    ├── Any follow-up tasks created if needed
    └── [END]
```

### Nursing Vitals Documentation
```
[START] → Shift begins → Review patient assignment
         ↓
    Planned Vital Schedule
    ├── ICU: q1h (every 1 hour)
    ├── Step-down: q2-4h
    ├── Ward: q4-8h (twice or thrice daily)
    ├── Pre-operative: q4h
    └── Post-procedure: Per protocol
         ↓
    Vital Measurement
    ├── Blood Pressure (Systolic/Diastolic)
    ├── Pulse Rate
    ├── Temperature
    ├── Respiratory Rate
    ├── SpO2
    ├── Pain Score (0-10 scale)
    ├── GCS (if neurological)
    ├── RBS (if diabetic)
    ├── Input-Output (if applicable)
    └── Additional per patient condition
         ↓
    Critical Value Alert
    ├── Auto-flag out-of-range values
    ├── Immediate notification to doctor
    ├── Repeat measurement if required
    └── Document escalation
         ↓
    Documentation
    ├── All values recorded in EMR
    ├── Trend graphs generated automatically
    ├── Shift summary created
    └── [END]
```

### Nursing Notes & Handover
```
Shift Change Handover (ISBAR Protocol)
├── I - Identify: Patient identity and bed
├── S - Situation: Current condition and concerns
├── B - Background: Relevant history and events
├── A - Assessment: Current vitals, observations
└── R - Recommendation: Pending tasks, doctor orders

Types of Nursing Notes:
├── Progress Notes: Routine patient status updates
├── Incident Notes: Falls, medication errors, adverse events
├── Handover Notes: Shift-to-shift communication
├── Admission Assessment Note: Initial nursing evaluation
├── Discharge Summary Note: Nursing perspective
└── Transfer Note: Inter-ward/inter-facility transfer
```

### Nursing Task State Machine
```
scheduled → acknowledged → in_progress → 
    ├── completed → verified
    ├── held → rescheduled
    ├── deferred → rescheduled
    ├── delegated → acknowledged (by delegate)
    └── cancelled → resolved
```

### Exception Handling
| Scenario | Action |
|----------|--------|
| Medication error | Immediate reporting, patient monitoring, incident report |
| Patient fall | Emergency assessment, documentation, fall prevention update |
| Missed medication dose | Documentation, variance report, reschedule |
| Equipment malfunction | Alternative equipment, maintenance notification |
| Staff shortage | Reassign tasks, escalate to supervisor, overtime/temp staff |
| Violent patient | Security, sedation protocol, incident documentation |
| IV line complications | Re-site IV, document, monitor site |

### Dependencies
- **IPD Admission:** Nursing is tied to inpatient stay
- **Doctor Orders:** Generate nursing tasks and MAR
- **Pharmacy:** Medication availability
- **Lab:** Sample collection tasks
- **MAR (Medication Administration Record):** Core medication workflow
- **Patient:** Patient context and vitals

### Notifications
- Task assignment notification to nurse
- Overdue task alert to nurse and supervisor
- Critical vital sign alert to doctor
- Handover reminder at shift change
- Missed medication alert
- Doctor order notification

### Audit & Compliance
- Complete task audit trail
- Vital sign documentation compliance
- MAR compliance (right patient, right drug, right dose, right route, right time)
- Incident reporting and root cause analysis
- Nursing note review mechanism

---

## 7. DOCTOR WORKBENCH & EMR

### Purpose
Provide the primary clinical interface for doctors to document patient encounters, review history, order investigations, prescribe medications, and manage treatment plans.

### Actors
- **Doctor** (Consultant, Resident, Intern) — Primary user
- **Medical Student** — View-only learning mode
- **Nurse** — Receives doctor orders
- **Patient** — Recipient of clinical care

### End-to-End Workflow: OPD Consultation
```
[START] → Doctor opens patient list (waiting queue)
         ↓
    Select Patient from Queue
    ├── See patient demographics and vitals (pre-filled by triage nurse)
    ├── Review reason for visit
    ├── Check previous visit history (problem list, medications, allergies)
    ├── Review investigation results (pending and completed)
    └── View clinical timeline (chronological encounter view)
         ↓
    History Taking
    ├── Chief Complaint (CC)
    ├── History of Present Illness (HPI)
    │   ├── Onset, Duration, Severity
    │   ├── Progression
    │   ├── Relieving/Aggravating factors
    │   └── Associated symptoms
    ├── Past Medical History
    │   ├── Chronic conditions (DM, HTN, CAD, etc.)
    │   ├── Surgeries
    │   └── Hospitalizations
    ├── Medication History
    │   ├── Current medications with dosages
    │   ├── Allergies (drug, food, environmental)
    │   └── Adverse drug reactions
    ├── Family History
    ├── Social History
    │   ├── Smoking, Alcohol, Substance use
    │   └── Occupation, Living situation
    └── Review of Systems (ROS)
         ↓
    Physical Examination
    ├── Vitals (already recorded by triage nurse)
    ├── General Examination
    ├── Systemic Examination
    │   ├── CVS, RS, Abdomen, CNS
    │   ├── Musculoskeletal (Navayu-specific MSK forms)
    │   └── Per specialty (Ophthalmic, ENT, etc.)
    └── Measurement/Scoring
        ├── BMI, Pain Score
        ├── GCS, NIHSS (neuro)
        ├── CURB-65 (respiratory)
        └── Calculated risk scores
         ↓
    Diagnosis
    ├── Provisional Diagnosis
    ├── Differential Diagnosis
    ├── ICD-10 Code Assignment (auto-suggest)
    ├── Confirmed Diagnosis (after investigations)
    └── Problem List Update
         ↓
    Investigations Ordered
    ├── Lab Tests (individual or panel)
    │   ├── CBC, LFT, KFT, Lipid Profile, etc.
    │   ├── Microbiology (culture, sensitivity)
    │   └── Pathology (biopsy, histopathology)
    ├── Radiology/Imaging
    │   ├── X-Ray, USG, CT, MRI
    │   └── Specialized (echo, mammo, DEXA)
    ├── Other Diagnostics
    │   ├── ECG, Echo, PFT
    │   ├── Endoscopy, Colonoscopy
    │   └── Special Tests
    └── Pre-authorization for high-cost tests (insurance)
         ↓
    Treatment Plan
    ├── Medications Prescribed
    │   ├── Drug, Dose, Route, Frequency, Duration
    │   ├── Brand name vs Generic preference
    │   └── Drug interaction check (auto)
    ├── Procedures Advised
    ├── Lifestyle Modifications
    ├── Diet Advice
    ├── Exercise/Physiotherapy
    ├── Referral (to other specialty)
    ├── Follow-up Plan
    │   ├── When to return
    │   └── Red flags to watch for
    └── Patient Education Materials
         ↓
    Documentation Complete
    ├── SOAP Note auto-structured
    ├── EMR updated with structured data
    ├── Prescription printed/digitally signed
    ├── Investigation slips printed/sent
    ├── Follow-up appointment auto-scheduled
    └── [END] → Next patient
```

### Doctor Workbench Features

| Feature | Description |
|---------|-------------|
| **Patient Queue** | Real-time OPD/inpatient list with vitals preview |
| **Clinical Timeline** | Chronological patient history view |
| **SOAP Notes** | Structured encounter documentation |
| **Order Sets** | Pre-built investigation/treatment bundles |
| **Prescription Writer** | Digital prescribing with drug DB integration |
| **Investigation Viewer** | Lab/radiology results with trend graphs |
| **Growth Charts** | Pediatric percentile charts |
| **Immunization Tracker** | Vaccination schedule and history |
| **Clinical Decision Support** | Drug interaction, allergy, dosing alerts |
| **Voice Dictation** | Speech-to-text for clinical notes |
| **Template Manager** | Custom examination and note templates |
| **Referral Manager** | Inter-specialty and external referrals |
| **E-Prescription** | Digital signature, QR-coded prescriptions |

### Decision Points
1. **Provisional vs Confirmed diagnosis:** Update after investigation results
2. **Admit or treat as OPD:** Based on severity and clinical judgment
3. **Refer vs Manage:** Based on specialty scope
4. **Generic vs Brand medication:** Hospital policy, availability, patient preference
5. **Investigation urgency:** STAT vs Routine vs Scheduled
6. **Follow-up timeframe:** Based on clinical stability

### Exception Handling
| Scenario | Action |
|----------|--------|
| Drug-allergy interaction detected | Block prescription, suggest alternatives |
| Drug-drug interaction | Alert with severity grading, alternative suggestion |
| Investigation cost exceeds limit | Insurance pre-auth or patient consent |
| Patient refuses treatment | Document refusal, discuss alternatives |
| Controlled substance prescription | Digital DEA/Narcotic license verification |
| Telemedicine consultation | Additional documentation, video consent |

### Dependencies
- **Patient Registration:** Patient must exist
- **OPD/IPD Module:** Encounter context
- **Lab/Radiology:** Investigation ordering and results
- **Pharmacy:** Prescription fulfillment
- **Billing:** Order-based charge generation
- **Scheduling:** Follow-up appointments
- **Clinical Decision Support:** For CDS alerts
- **EMR:** Document storage and retrieval

### Notifications
- Patient enters consultation room
- Investigation results available
- Critical result alert (red flag)
- Follow-up due reminder
- Referral request received
- Patient medication refill due

### Audit & Compliance
- Full clinical note audit trail
- Prescription audit (controlled substances)
- Modification history with previous versions preserved
- Time-stamped all clinical actions
- ICD-10 coding compliance
- NABH/JCI medical record standards
- E&M coding level documentation

---

## 8. BILLING & FINANCIAL OPERATIONS

### Purpose
Manage the complete financial lifecycle of patient encounters — charge capture, invoicing, payment collection, insurance coordination, and financial reporting.

### Actors
- **Billing Staff** — Day-to-day billing operations
- **Cashier** — Payment collection
- **Insurance Coordinator** — TPA/insurance billing
- **Finance Manager** — Reconciliation, reporting
- **Patient/Attendant** — Payment responsibility
- **Doctor** — Service orders that generate charges

### End-to-End Workflow

#### A. Charge Capture & Invoice Generation
```
[START] → Clinical service ordered or rendered
         ↓
    Charge Line Generation (Automated / Manual)
    ├── Consultation Fee → Auto-generated on OPD visit start
    ├── Investigation Charges → On lab/radiology order placement
    ├── Pharmacy Charges → On prescription/dispensation
    ├── Procedure Charges → On OT/procedure scheduling
    ├── Bed Charges → Daily automatic accrual from admission
    ├── Nursing Charges → Per procedure/category
    ├── Consumables → As used (inventory deduction)
    └── Miscellaneous → Manual entry for non-standard items
         ↓
    Charge Accumulation
    ├── Real-time charge aggregation for active encounters
    ├── Running bill available to patient/attendant
    ├── Pre-bill check for discrepancies
    └── Zero-charge flag for welfare/discount cases
         ↓
    Invoice Generation
    ├── Invoice number auto-generated
    ├── All charge lines consolidated
    ├── Discounts applied (if authorized)
    ├── GST/MRP calculation
    ├── Insurance share & patient share split
    └── Invoice printed/digitally sent
         ↓
    Payment Processing
    ├── Cash → Verify currency, provide change, generate receipt
    ├── Card → POS terminal integration, authorization
    ├── UPI → QR code generation, payment confirmation
    ├── Insurance → Verify eligibility, apply TPA approval
    ├── Credit/Deposit → Apply existing credit balance
    ├── Mix → Split payment across multiple methods
    └── Partial payment → Record balance as "due"
         ↓
    Settlement & Reconciliation
    ├── Day-end reconciliation (cash, card, UPI totals)
    ├── Insurance claims batch submission
    ├── Daily settlement report generated
    ├── Discrepancy investigation
    └── End-of-day billing close
         ↓
[END] → Invoice fully settled → Closed financial transaction
```

### Billing State Machine
```
draft → due → 
    ├── partial → paid → settled
    ├── paid → settled
    ├── overdue → collections → written_off
    ├── cancelled → refunded
    └── disputed → under_review → resolved → ...
```

### Pricing & Discount Management
```
Price Master Management
├── Service price list by branch
├── Package pricing (health checkups, surgical packages)
├── Insurance package rates (pre-negotiated)
├── Corporate rates
└── Seasonal/promotional pricing

Discount Types
├── Staff discount (pre-defined percentage)
├── Corporate discount (pre-negotiated)
├── Senior citizen discount
├── Early payment discount
├── Package discount (bundled services)
├── Charity/welfare discount (admin approval required)
└── Prompt payment discount
```

### Exception Handling
| Scenario | Action |
|----------|--------|
| Payment declined | Alternate payment method, hold invoice |
| Insurance claim rejected | Patient notification, payment follow-up, re-submission |
| Billing dispute | Escalate to billing supervisor, hold collection |
| Deposit refund due | Verify deductions, process refund (cash or bank) |
| Wrong charge applied | Credit note, reverse entry, re-invoice |
| Emergency patient unable to pay | Welfare approval, partial deposit |
| GST input credit mismatch | Reconcile with purchase records, correct |

### Dependencies
- **OPD/IPD:** Services rendered
- **Lab/Radiology/Pharmacy:** Investigation and medication charges
- **OT:** Procedure charges
- **Insurance:** TPA claim processing
- **Inventory:** Consumable costing
- **Finance:** GL integration, revenue reporting
- **Discharge:** Billing clearance required before discharge

### Notifications
- Invoice generated notification to patient
- Payment receipt via SMS/Email
- Balance due reminder (daily for inpatients)
- Insurance pre-auth pending alert
- Bill ready for discharge notification
- Overdue account alert
- Daily billing summary to finance manager

### Audit & Compliance
- Complete charge line audit trail (who added what, when)
- Discount authorization tracking
- Cashier accountability (shortage/overage)
- Tax compliance (GST invoice format)
- Revenue reconciliation reports
- Insurance claim audit trail
- Refund authorization documentation

---

## 9. INSURANCE / TPA

### Purpose
Manage insurance verification, pre-authorization, claim submission, and settlement for patients with insurance coverage or Third Party Administrator (TPA) arrangements.

### Actors
- **Insurance Coordinator** — Dedicated insurance processing
- **Patient** — Insurance card holder
- **TPA Representative** — External authorization
- **Billing Staff** — Insurance payment coordination
- **Doctor** — Clinical documentation for claims

### End-to-End Workflow

#### A. Pre-Authorization
```
[START] → Patient with insurance identified
         ↓
    Insurance Verification
    ├── Collect insurance card / details
    ├── Verify policy status (active, lapsed, expired)
    ├── Check coverage details (sum insured, exclusions, deductibles)
    ├── Verify pre-existing disease waiting period
    ├── Check room rent limits
    └── Determine co-pay requirements
         ↓
    Pre-Authorization Request
    ├── Clinical documents required:
    │   ├── Admission notes / Doctor's recommendation
    │   ├── Investigation reports
    │   ├── Treatment plan with cost estimate
    │   └── ICD-10 diagnosis codes
    ├── Cost estimate prepared
    ├── Pre-auth request submitted (online/portal/email)
    └── Reference number obtained
         ↓
    Authorization Response
    ├── Approved → Record approval details, amount, validity
    ├── Partially Approved → Note exclusions, communicate to patient
    ├── Conditional Approval → Additional documents needed
    ├── Rejected → Inform patient, discuss self-pay
    └── Pending → Follow-up schedule established
         ↓
[END] → Treatment initiated / patient informed of coverage
```

#### B. Claim Processing
```
[START] → Treatment completed → Final bill prepared
         ↓
    Document Collection
    ├── Final bill / invoice
    ├── All investigation reports
    ├── Discharge summary
    ├── Doctor's notes
    ├── Prescription records
    ├── OT notes (if applicable)
    └── Pre-auth approval letter
         ↓
    Claim Submission
    ├── Claim form completed
    ├── All documents scanned and attached
    ├── Claim submitted (portal/email/physical)
    ├── Claim acknowledgment received
    └── Tracking ID recorded
         ↓
    Claim Tracking & Follow-up
    ├── Regular status checks (weekly)
    ├── Query resolution (if documents rejected)
    ├── Additional documents on request
    └── Escalation for delayed claims
         ↓
    Settlement
    ├── Claim Approved → Payment received from TPA/Insurer
    │   ├── Verify payment amount
    │   ├── Reconcile with billed amount
    │   ├── Adjust patient balance
    │   └── Process refund/additional charge
    ├── Claim Short Paid → Review reason, appeal if applicable
    │   ├── Accept short payment
    │   └── Recover balance from patient
    └── Claim Denied → Appeal process or patient liability
         ↓
[END] → Insurance claim concluded
```

### Insurance State Machine
```
initiated → verifying → 
    ├── pre_auth_requested → 
    │   ├── pre_authorized → treatment_ongoing → claims_submitted →
    │   │   ├── approved → settled
    │   │   ├── partially_paid → patient_liability_raised
    │   │   └── denied → appeal → ...
    │   └── partially_authorized → admitted → ...
    └── rejected → patient_informed → self_pay
```

### Exception Handling
| Scenario | Action |
|----------|--------|
| Policy expired during treatment | Pro-rata coverage calculation |
| Cashless denied | Convert to reimbursement, collect deposit |
| Claim queries unresolved | Escalate to TPA manager, ombudsman |
| Multiple policies | Coordination of benefits determination |
| Portability case | Verify new insurer, waiting period status |
| Maternity waiting period | Verify pregnancy dating against policy date |

### Dependencies
- **Patient Registration:** Insurance details at registration
- **IPD Admission:** Admission linked to insurance authorization
- **Billing:** Final bill for claim submission
- **EMR/Doctor:** Clinical documentation for claims
- **Discharge:** Insurance clearance as discharge checkpoint
- **Finance:** Payment reconciliation

---

## 10. PHARMACY

### Purpose
Manage the complete pharmacy lifecycle — from prescription fulfillment and drug dispensing to inventory management, batch tracking, and controlled substance compliance.

### Actors
- **Pharmacist** — Dispensing, verification, counseling
- **Pharmacy Technician** — Inventory, stock management
- **Doctor** — Prescription originator
- **Nurse** — IPD medication requestor
- **Patient** — Medication recipient
- **Store Manager** — Procurement, supplier management

### End-to-End Workflow

#### A. Prescription Fulfillment (OPD)
```
[START] → Doctor prescribes medication(s)
         ↓
    Prescription Received at Pharmacy
    ├── Digital prescription (auto-routed from doctor) OR
    ├── Physical prescription (scanned/entered)
    └── Verify prescription completeness
         ↓
    Prescription Validation
    ├── Doctor's digital signature verified
    ├── Drug availability check
    ├── Expiry date check
    ├── Drug interaction check (cross-ref with patient profile)
    ├── Allergy check (cross-ref with patient allergies)
    ├── Dosage validation (pediatric, renal, hepatic adjustments)
    └── Controlled substance regulations check
         ↓
    Inventory Reservation
    ├── Check batch availability
    ├── First-Expiry-First-Out (FEFO) selection
    ├── Reserve stock for this prescription
    ├── Check minimum stock levels (reorder trigger)
    └── Alternative brand suggestion (if primary out of stock)
         ↓
    Dispensing
    ├── Pick medications from shelf (batch verified)
    ├── Pharmacist verification (5 Rights check)
    │   ├── Right Patient
    │   ├── Right Drug
    │   ├── Right Dose
    │   ├── Right Route
    │   └── Right Time
    ├── Label generation (patient name, drug, dose, instructions)
    ├── Leaflet/package insert attached
    ├── Controlled substance: double-verification required
    └── Dispensing recorded in system
         ↓
    Patient Counseling
    ├── Medication name and purpose
    ├── Dosage and administration instructions
    ├── Timing (before/after food, with water, etc.)
    ├── Duration of treatment
    ├── Side effects to watch for
    ├── Drug interactions (food, alcohol, other meds)
    ├── Storage instructions
    └── Missed dose instructions
         ↓
    Collection & Payment
    ├── Patient prescribed items received
    ├── Payment processed (or linked to bill)
    ├── Digital/printed dispensing receipt
    └── Follow-up refill reminder (if applicable)
         ↓
[END] → Prescription fulfilled → Inventory updated → Revenue recorded
```

#### B. IPD Medication Management
```
[START] → Doctor orders medication for IPD patient
         ↓
    Medication Order Types
    ├── STAT (single dose, immediate)
    ├── Standing (regular scheduled doses)
    ├── PRN (as needed, with parameters)
    ├── Taper (changing doses over time)
    └── Protocol-based (order sets)
         ↓
    Medication Administration Record (MAR) Setup
    ├── Doses scheduled per frequency
    ├── Administered by nursing team
    ├── First dose dispensed immediately
    ├── Subsequent doses from floor stock / pharmacy
    └── Controlled substances: locked cabinet, dual sign-out
         ↓
    Administration (Nursing) → See MAR §12
    ├── 5 Rights check before administration
    ├── Document administration time and route
    ├── Document patient response
    └── Missed dose protocol if applicable
         ↓
    IPD Discharge Medication
    ├── Take-home medications prescribed
    ├── Discharge medication counseling
    ├── 30-day supply (or as prescribed)
    └── Follow-up prescription if needed
         ↓
[END]
```

### Pharmacy Fulfillment State Machine
```
prescribed → verified → 
    ├── partially_dispensed → dispensed
    ├── dispensed → collected
    ├── cancelled (by doctor)
    ├── substituted (generic/brand change)
    └── held (awaiting clarification)
```

### Controlled Substance Workflow
```
Prescribed → Doctor verification → 
    ├── Narcotic license verified
    ├── Daily dosage limit checked
    └── Abuse potential flagged → 
         ↓
    Double Verification Required
    ├── Two pharmacists verify
    ├── Transaction logged separately
    ├── Narcotic register updated
    └── CCTV recording (if applicable)
         ↓
    Dispensed → Patient signs receipt → 
    ├── Inventory deducted from controlled stock
    └── End-of-day narcotic count verification required
```

### Decision Points
1. **Generic vs Brand substitution:** Hospital policy, insurance formulary, availability
2. **Therapeutic substitution:** Pharmacist-initiated with doctor approval
3. **Partial fill:** When full quantity not available
4. **Controlled substance release:** Frequency and quantity limits
5. **Emergency release for ICU/ER:** Fast-track without full verification

### Exception Handling
| Scenario | Action |
|----------|--------|
| Drug out of stock | Suggest therapeutic alternative to doctor |
| Expired batch detected | Quarantine batch, return to supplier |
| Allergic reaction to dispensed drug | Stop dispensing, notify doctor, document adverse event |
| Prescription illegible | Contact doctor for clarification |
| Controlled substance discrepancy | Immediate supervisor notification, investigation |
| Patient returns medication | Quality check, restock policy, waste disposal if needed |
| Narcotic theft | Security, police report, regulatory notification |

### Dependencies
- **Doctor/EMR:** Prescription source
- **Inventory:** Stock availability and batch management
- **Billing:** Medication charges linked to patient invoice
- **OPD/IPD:** Patient encounter context
- **MAR (Nursing):** Medication administration documentation
- **Purchase/Procurement:** Stock replenishment
- **Supplier Management:** Vendor performance tracking

### Notifications
- New prescription alert to pharmacy
- Low stock / reorder alert
- Expiry date alert (within 30 days)
- Overdue MAR administration alert
- Controlled substance transaction alert
- Drug recall notification
- Adverse drug reaction report alert

### Audit & Compliance
- Complete dispensing audit trail
- Controlled substance log (statutory requirement)
- Narcotic register maintained per regulations
- Batch/lot tracking for recall capability
- Expired drug disposal records
- Prescription validity period tracking
- Pharmacist licensure verification
- Schedule H1 and X drug compliance

---

## 11. LABORATORY

### Purpose
Manage the complete laboratory workflow — order placement, sample collection, processing, result verification, critical value notification, and report generation.

### Actors
- **Lab Technician** — Sample processing, testing
- **Phlebotomist** — Sample collection from patients
- **Lab Supervisor** — Result verification, quality control
- **Pathologist** — Complex interpretation, sign-off
- **Doctor** — Testing ordered, results review
- **Nurse** — Sample collection for inpatients
- **Patient** — Sample provider

### End-to-End Workflow

#### A. Lab Order → Result (Complete)
```
[START] → Doctor orders lab test(s)
         ↓
    Order Entry & Validation
    ├── Test(s) selected from lab catalog
    ├── Panel ordering (CBC, LFT, KFT, Lipid Profile, etc.)
    ├── Special instructions noted (fasting, timing, precautions)
    ├── Priority assigned (Routine, Urgent, STAT)
    ├── ICD-10 diagnosis code attached
    ├── Insurance pre-auth check (if needed)
    └── Billing charge line auto-generated
         ↓
    Sample Collection
    ├── Patient identification (2-factor: name + MRN/DOB)
    ├── Collection details:
    │   ├── Collection site (OPD collection room / IPD bedside / Home)
    │   ├── Collection time recorded
    │   ├── Sample type (blood, urine, stool, sputum, CSF, etc.)
    │   ├── Tube type (plain, EDTA, citrate, heparin, fluoride)
    │   ├── Volume collected
    │   └── Special handling (cold chain, light-sensitive, etc.)
    ├── Barcode label generated and affixed
    ├── Patient instructions verified (fasting, etc.)
    └── Sample condition checked (hemolyzed, clotted, insufficient)
         ↓
    Sample Transport
    ├── Pneumatic tube / manual transport to lab
    ├── Temperature monitoring (cold chain samples)
    ├── Transport time logged
    └── Chain of custody documentation (if required)
         ↓
    Sample Receipt in Lab
    ├── Scan barcode for receipt logging
    ├── Verify sample condition (reject if compromised)
    ├── Centrifugation / processing (as required)
    ├── Aliquot preparation
    └── Sample distribution to testing area
         ↓
    Sample Processing
    ├── Chemistry: Autoanalyzer run, quality control validation
    ├── Hematology: CBC analyzer, peripheral smear (if abnormal)
    ├── Microbiology: Culture inoculation, gram stain, sensitivity
    ├── Serology: ELISA, rapid tests
    ├── Coagulation: PT/INR, APTT
    ├── Immunology: Autoantibody panels
    ├── Histopathology: Fixation, processing, embedding, sectioning, staining
    └── Molecular: PCR, genetic testing
         ↓
    Result Entry & Validation
    ├── Automated analyzer → Direct LIS integration
    ├── Manual test → Technician enters results
    ├── Quality control checks (internal QC)
    ├── Delta check (compare with previous results for same patient)
    ├── Critical value auto-detection
    └── Supervisor review & verification
         ↓
    Result Verification
    ├── Routine results → Auto-verified (within normal range + QC passed)
    ├── Abnormal results → Lab Supervisor reviews
    ├── Critical results → Immediate notification protocol
    ├── Complex results → Pathologist review & sign-off
    └── Historical comparison → Validate against previous trends
         ↓
    Results Published
    ├── Results available in EMR / Doctor's workbench
    ├── Critical results: Phone call to doctor documented
    ├── Report generated with reference ranges
    ├── Patient access via portal (after doctor review)
    └── Historical trending graphs available
         ↓
[END] → Lab order complete → Billable service finalized
```

### Lab Order State Machine
```
ordered → sample_collection_scheduled → 
    ├── sample_collected → sample_received → processing →
    │   ├── verified → reported
    │   ├── critical → acknowledged → reported
    │   └── needs_repeat → re_collection_requested → ...
    ├── sample_rejected → re_collection_ordered → ...
    └── cancelled → archived
```

### Critical Value Protocol (Mandatory)
```
Critical Value Detected
├── Immediate Lab Technician verification (repeat test)
├── Confirm result is accurate
├── Immediate phone call to ordering doctor/nurse (document time)
├── Record: who called, who received, time of notification
├── Read-back verification by receiver
├── Alert escalated if no response in 15 minutes
└── Documentation of entire process in system

Critical Value Types:
├── Glucose < 40 or > 500 mg/dL
├── Potassium < 2.5 or > 6.5 mEq/L
├── Sodium < 120 or > 160 mEq/L
├── Hemoglobin < 5 or > 20 g/dL
├── Platelet count < 20,000 or > 1,000,000
├── INR > 5.0
├── Positive blood culture
├── Cardiac troponin > upper reference limit
├── ABG: pH < 7.2 or > 7.6
└── Etc. (customizable per hospital policy)
```

### Decision Points
1. **STAT vs Routine:** Determines processing queue position
2. **Auto-verify vs Supervisor review:** Based on reference range deviation
3. **Sample rejection criteria:** Hemolysis, clotting, insufficient quantity, wrong container
4. **Repeat testing:** Confirmation of critical values, unexpected results
5. **Send-out vs In-house:** Tests not available in-lab sent to reference lab
6. **Reflex testing:** Auto-trigger when initial result meets criteria (e.g., TSH abnormal → T3/T4)

### Exception Handling
| Scenario | Action |
|----------|--------|
| Hemolyzed sample | Reject, request recollection |
| Insufficient sample | Request additional sample |
| Wrong patient collection | Discard sample, incident report, recollect |
| Results inconsistent with clinical picture | Repeat testing, escalate to pathologist |
| Instrument malfunction | QC check, backup instrument, vendor notification |
| Q.C. failure | Re-run QC, instrument maintenance, hold patient results |
| Lost sample | Trace through chain of custody, escalate |
| Power outage | UPS/battery backup, manual processes |

### Dependencies
- **Doctor/EMR:** Lab order source
- **OPD/IPD/Emergency:** Patient encounter context
- **Billing:** Lab charges linked to patient invoice
- **Nursing:** IPD sample collection coordination
- **Pharmacy:** Microbiology sensitivity results for antibiotic guidance
- **Inventory:** Reagent and consumable management
- **Quality Control:** Daily QC validation
- **External Labs:** Send-out test management

### Notifications
- Sample ready for collection alert
- Sample received in lab confirmation
- Test in progress status update
- Result available notification to doctor
- Critical value alert (phone + system notification)
- Escalation for unacknowledged critical result
- Quality control failure alert (system downtime)
- Sample rejection notification for recollection

### Audit & Compliance
- Complete chain of custody for samples
- Quality control records (daily/monthly)
- External quality assurance (EQA) participation
- Instrument calibration and maintenance records
- Critical value notification compliance (CAP requirement)
- Sample rejection rate monitoring (quality indicator)
- Turnaround time tracking per test type
- NABL/ISO 15189 compliance documentation

---

## 12. RADIOLOGY

### Purpose
Manage the complete radiology workflow — order placement, study scheduling, image acquisition, reporting, and result distribution.

### Actors
- **Radiology Technician** — Image acquisition
- **Radiologist** — Image interpretation and reporting
- **Doctor (Referring)** — Ordering provider
- **Nurse** — Preparation of inpatients
- **Patient** — Undergoes imaging procedure
- **Report Transcriptionist** — Dictation support

### End-to-End Workflow

#### A. Radiology Order → Report (Complete)
```
[START] → Doctor orders radiology study
         ↓
    Order Entry
    ├── Study type (X-Ray, USG, CT, MRI, Mammo, DEXA, PET-CT)
    ├── Specific region/anatomy
    ├── Contrast required? (CT/MRI contrast)
    ├── Clinical indication / ICD-10 code
    ├── Priority (Routine, Urgent, STAT)
    ├── Special instructions (preparation, contraindications)
    ├── Pregnancy check for female patients (mandatory for X-ray/CT)
    └── Pre-authorization check for high-cost studies
         ↓
    Scheduling
    ├── OPD: Scheduled to specific time slot
    ├── IPD: Portable or scheduled per room schedule
    ├── ER: Immediate or as soon as stable
    ├── Preparation instructions communicated:
    │   ├── CT Abdomen: NBM 4-6 hours
    │   ├── MRI: Metallic implant screening
    │   ├── Contrast study: Renal function test required
    │   └── USG Abdomen: Full bladder required
    └── Waiting list for urgent add-ons
         ↓
    Patient Preparation & Verification
    ├── 2-factor patient identification
    ├── Pre-procedure checklist
    ├── Consent for contrast administration (if applicable)
    ├── Pregnancy test confirmation (if applicable)
    ├── Safety screening (MRI: implant, claustrophobia)
    └── IV cannulation (for contrast studies)
         ↓
    Image Acquisition
    ├── Positioning per protocol
    ├── Radiation safety measures (shielding, ALARA principle)
    ├── Image quality check (immediate review)
    ├── Repeat if technically inadequate
    └── Additional views as needed (radiologist may request)
         ↓
    Image Transfer & Storage
    ├── DICOM images transferred to PACS
    ├── Image quality verified
    ├── Images linked to study order
    └── Available for radiologist interpretation
         ↓
    Reporting (Radiologist)
    ├── Structured reporting template
    ├── Findings documented (measurements, comparison with prior)
    ├── Impression/Conclusion with differential diagnosis
    ├── Critical findings flagged
    ├── Recommendations (follow-up, additional imaging)
    ├── Urgent/critical finding → Immediate call to referring doctor
    └── Report signed digitally
         ↓
    Report Distribution
    ├── Report available in EMR/Doctor workbench
    ├── Critical findings: Phone call + read-back documented
    ├── Patient notification (via portal, if clinically appropriate)
    ├── Images accessible via viewer
    └── Historical comparison available
         ↓
[END] → Study complete → Billable service finalized
```

### Radiology Study State Machine
```
ordered → scheduled → 
    ├── arrived → in_progress → completed →
    │   ├── reported → verified → published
    │   └── critical_finding → acknowledgement_pending → published
    ├── no_show → rescheduled → ...
    ├── cancelled → archived
    └── patient_unprepared → rescheduled
```

### Modality-Specific Workflows

| Modality | Safety | Prep | Turnaround |
|----------|--------|------|------------|
| **X-Ray** | Lead shielding, pregnancy check | None | 1-2 hours |
| **USG** | None | Region-specific (full bladder/NBM) | 1-2 hours |
| **CT** | Contrast allergy, renal function | NBM, IV access | 2-4 hours |
| **MRI** | Ferromagnetic screening, claustrophobia | NBM, metal removal | 4-24 hours |
| **Mammo** | Compression tolerance | No deodorant/cream | 2-4 hours |
| **DEXA** | None | No calcium supplements prior | 2-4 hours |

### Exception Handling
| Scenario | Action |
|----------|--------|
| Contrast reaction | Emergency protocol, resuscitation team activation |
| Claustrophobia (MRI) | Oral sedation, open MRI consideration |
| Patient movement artifact | Repeat acquisition, sedation if needed |
| Equipment downtime | Reschedule, referral to other facility |
| Incorrect protocol ordered | Radiologist verification / modification |
| Pregnant patient (unexpected) | Risk assessment, alternative non-radiation study |
| Implant contraindication (MRI) | Check compatibility, alternative modality |
| Critical finding after-hours | Radiologist calls referring/covering physician |

### Dependencies
- **Doctor/EMR:** Study ordering
- **PACS:** Image storage and viewing
- **OPD/IPD/ER:** Patient encounter context
- **Billing:** Study charges
- **Nursing:** Patient preparation (IPD)
- **Inventory:** Contrast media, consumables
- **Lab:** Contrast renal function clearance

### Notifications
- Study order alert to radiology department
- Patient arrived for study notification
- Study completed (images available for reporting)
- Report available to referring doctor
- Critical finding alert (phone + system notification)
- Equipment maintenance reminder
- Contrast reaction protocol alert

### Audit & Compliance
- Radiation dose tracking (CTDI, DLP)
- Contrast adverse event documentation
- Safety screening documentation
- Report turnaround time monitoring
- ACR/NABH accreditation compliance
- Quality assurance program documentation
- Peer review process
- Critical findings communication documentation

---

## 13. OT (OPERATION THEATRE) MANAGEMENT

### Purpose
Manage the complete surgical journey — from pre-operative planning through intra-operative care to post-operative recovery and billing.

### Actors
- **Surgeon** — Operating surgeon
- **Anesthesiologist** — Anesthesia management
- **OT Nurse** — Scrub and circulating nurse
- **OT Coordinator** — Scheduling, resource management
- **Patient** — Surgical patient
- **Surgical Team** — Assistants, perfusionist, etc.
- **CSSD** — Sterilization team

### End-to-End Workflow

#### A. Surgical Journey (Complete)
```
[START] → Surgery Decision Made (Elective / Emergency)
         ↓
    Pre-Operative Phase
    ├── Surgical consent obtained and documented
    ├── Pre-anesthesia checkup (PAC) completed
    ├── Investigations reviewed (CBC, KFT, LFT, coagulation, ECG, etc.)
    ├── Medication adjustments (anticoagulants, anti-diabetics)
    ├── NBM status verified (≥6 hours solids, ≥2 hours clear fluids)
    ├── Blood type and cross-match (if needed)
    ├── Pre-operative marking (site marking by surgeon)
    ├── Pre-operative checklist completed (WHO)
    ├── Pre-operative antibiotics administered (within 60 min of incision)
    └── Prophylaxis (DVT, antibiotic) ordered
         ↓
    OT Scheduling
    ├── OT room assigned (based on specialty, equipment needs)
    ├── Surgery date and time slot confirmed
    ├── Surgeon, assistant(s), anesthesiologist assigned
    ├── OT nursing team assigned
    ├── Estimated duration booked
    ├── Equipment list prepared (laparoscopic set, microscope, C-arm, etc.)
    ├── Implants/consumables verified in stock
    └── Blood products reserved (if needed)
         ↓
    Day of Surgery
    ├── Patient arrives at pre-operative holding area
    ├── Identity verified (2-factor)
    ├── Surgical site verified
    ├── Consent re-verified
    ├── Markings verified
    ├── Pre-op vitals recorded
    ├── Anesthesia induction in OT
    ├── WHO Surgical Safety Checklist:
    │   ├── Sign In (before induction)
    │   │   ├── Patient identity, site, procedure confirmed
    │   │   ├── Consent confirmed
    │   │   ├── Site marked (if applicable)
    │   │   ├── Anesthesia safety check complete
    │   │   ├── Pulse oximeter on and functioning
    │   │   ├── Known allergies checked
    │   │   ├── Difficult airway/aspiration risk assessed
    │   │   └── Blood loss risk assessed
    │   ├── Time Out (before skin incision)
    │   │   ├── Team members introduced by name and role
    │   │   ├── Correct patient, site, procedure confirmed
    │   │   ├── Prophylactic antibiotics given (within 60 min)
    │   │   ├── Essential imaging displayed
    │   │   ├── Anticipated critical events reviewed
    │   │   └── Sterility confirmed
    │   └── Sign Out (before patient leaves OT)
    │       ├── Instrument, sponge, needle counts complete
    │       ├── Specimens labeled (including patient ID)
    │       ├── Equipment issues addressed
    │       ├── Key concerns for recovery reviewed
    │       └── Post-op plan confirmed
         ↓
    Intra-Operative Phase
    ├── Surgery performed
    ├── Anesthesia monitoring (continuous)
    ├── Intra-op vitals documented
    ├── Medications administered documented
    ├── Fluids/blood products documented
    ├── Specimens collected and labeled
    ├── Implants used documented (serial numbers)
    ├── Counts performed (sponges, needles, instruments)
    └── Complications documented (if any)
         ↓
    Post-Operative Phase
    ├── Patient transferred to PACU (Post-Anesthesia Care Unit)
    ├── Handover to PACU nurse (ISBAR)
    ├── Vital signs monitoring (q15min initially)
    ├── Pain assessment and management
    ├── Nausea/vomiting management
    ├── Fluid management
    ├── Post-op investigations ordered (if needed)
    ├── Discharge criteria assessment (Aldrete score)
    ├── Step-down to ward/ICU as appropriate
    └── Post-op instructions documented
         ↓
    OT Turnover & Cleaning
    ├── Soiled instruments to CSSD
    ├── OT room cleaning (between cases)
    │   ├── Surface disinfection
    │   ├── Floor cleaning
    │   ├── Equipment wiped down
    │   └── Terminal cleaning (end of day)
    ├── Next case setup
    └── Waste segregation (biohazard, sharp, general)
         ↓
    Post-Operative Follow-up
    ├── Daily progress notes (surgeon + nursing)
    ├── Wound assessment and dressing
    ├── Drain removal (when appropriate)
    ├── Suture/staple removal
    ├── Histopathology results reviewed
    ├── Follow-up appointment scheduled
    └── Surgical outcome documented
         ↓
[END] → Surgical case closed → Billing finalized → Surgery audit complete
```

### OT Case State Machine
```
scheduled → pre_op_preparation → 
    ├── in_progress → 
    │   ├── completed → recovery → post_op_care → closed
    │   └── interrupted (complication) → resolved → completed
    ├── cancelled → rescheduled
    └── postponed → rescheduled
```

### OT Utilization & Scheduling Optimization
```
Scheduling Rules:
├── Elective cases: Weekdays 8AM-4PM
├── Emergency cases: 24x7 on-call team
├── Turnover time: 30-45 min between cases
├── Slot allocation by specialty (block scheduling)
├── Weekly OT schedule published in advance
└── Add-on/urgent case slot reservation

Key Metrics Tracked:
├── OT utilization rate (target > 75%)
├── First case on-time start (target > 90%)
├── Turnaround time between cases
├── Cancellation rate (target < 5%)
├── Emergency case response time
└── Surgical site infection rate
```

### Exception Handling
| Scenario | Action |
|----------|--------|
| Emergency case during elective slot | Elective shifted, emergency prioritized |
| Equipment failure during surgery | Backup equipment, repair team notified |
| Implant not available | Alternative implant, surgeon notified |
| Surgical complication (uncontrolled bleeding) | Blood transfusion, extended surgery, ICU post-op |
| Wrong-site near-miss | STOP, Time Out re-check, protocol review |
| Instrument count discrepancy | X-ray for retained item, incident report |
| Patient not available (NBM violation) | Case postponed |
| Anesthesia complication | Resuscitation protocol, case may be cancelled |

### Dependencies
- **IPD/OPD:** Patient admission source
- **Bed Management:** Post-op bed allocation (ICU/ward)
- **Inventory:** Implants, sutures, consumables
- **CSSD:** Sterile instrument sets
- **Blood Bank:** Blood product availability
- **Lab:** Pre-op and post-op investigations
- **Radiology:** Intra-op imaging (C-arm)
- **Billing:** Surgery package billing
- **Pharmacy:** Anesthetic drugs, antibiotics
- **Nursing:** Pre-op, intra-op, and post-op nursing

### Notifications
- Surgery scheduled notification to surgical team
- Pre-op preparation checklist reminder
- Day-before surgery confirmation
- Team assembly notification
- Blood bank reservation alert
- OT room ready status
- Post-op recovery handover notification
- CSSD instrument set request

### Audit & Compliance
- WHO Surgical Safety Checklist compliance
- Surgical site infection tracking
- Implant traceability (manufacturer, lot, serial number)
- Anesthesia record documentation
- Pathology specimen tracking
- OT utilization reporting
- Surgical audit and mortality-morbidity (M&M) review
- NABH/JCI surgical standards compliance

---

## 14. ICU / CRITICAL CARE

### Purpose
Provide intensive monitoring and life-support for critically ill patients with continuous nursing, advanced life support, and rapid intervention capability.

### Actors
- **Intensivist** — ICU consultant
- **ICU Nurse** — 1:1 or 1:2 nursing ratio
- **Respiratory Therapist** — Ventilator management
- **Clinical Pharmacist** — ICU medication management
- **Physiotherapist** — Chest physiotherapy, mobilization
- **Nutritionist** — Enteral/parenteral nutrition

### ICU-Specific Workflows

#### A. ICU Admission Protocol
```
Criteria for ICU Admission:
├── Respiratory failure requiring ventilation
├── Hemodynamic instability requiring vasopressors
├── Severe sepsis / septic shock
├── Multi-organ dysfunction
├── Post-major surgery (high-risk)
├── Neurological emergencies (stroke, seizures, GCS < 8)
├── Cardiac monitoring (MI, arrhythmias)
└── Poisoning/overdose requiring monitoring

Admission Process:
├── Bed allocation (medical ICU, surgical ICU, cardiac ICU, neuro ICU)
├── Initial assessment by intensivist within 1 hour
├── Full monitoring setup (ECG, SpO2, NIBP/ABP, CVP)
├── Central line / arterial line insertion (if needed)
├── Ventilator setup and settings
├── Baseline investigations (ABG, labs, cultures)
├── APACHE II / SOFA score calculation
└── ICU care plan established
```

#### B. Daily ICU Round Protocol
```
Multi-Disciplinary Round (Daily, typically morning)
├── Review overnight events
├── Ventilator settings and weaning parameters
├── Hemodynamic status and vasopressor trends
├── Infection status and culture results
├── Antibiotic review and de-escalation
├── Fluid balance and renal function
├── Nutrition status (enteral/parenteral)
├── Sedation vacation protocol
├── Spontaneous breathing trial assessment
├── Line removal assessment
├── Mobilization readiness
└── Family communication plan

Nursing Documentation (q1h minimum)
├── Vital signs (HR, BP, RR, SpO2, Temp, CVP)
├── Ventilator settings (mode, FiO2, PEEP, TV, RR)
├── ABG results and interpretation
├── Input-Output (hourly)
├── Sedation scores (RASS / SAS)
├── Pain scores (CPOT / BPS)
├── Delirium assessment (CAM-ICU)
├── Pressure injury assessment
├── DVT prophylaxis measures
└── Vasopressor infusion rates
```

### Exception Handling
| Scenario | Action |
|----------|--------|
| Cardiac arrest | Code Blue team activation, ACLS protocol |
| Ventilator disconnection | Alarm response, reconnection, bag-valve-mask |
| Central line infection | Line removal, culture, antibiotic protocol |
| Unplanned extubation | Immediate re-intubation or BVM support |
| Family distress | Social worker, chaplain, family support protocol |
| DNR/DNI order changes | Documentation update, code status communication |

### Dependencies
- **IPD:** ICU is sub-type of inpatient admission
- **Nursing:** Continuous monitoring and care
- **Lab:** Frequent (q4-6h) lab testing
- **Radiology:** Portable X-ray, CT capability
- **Pharmacy:** Critical care medications
- **Blood Bank:** Emergency blood product release
- **Respiratory Therapy:** Ventilator management

---

## 15. DIALYSIS

### Purpose
Manage chronic and acute dialysis sessions — scheduling, machine assignment, treatment delivery, and billing.

### Actors
- **Nephrologist** — Dialysis orders
- **Dialysis Nurse** — Session management
- **Patient** — Chronic or acute dialysis
- **Billing Staff** — Per-session billing

### End-to-End Workflow
```
[START] → Dialysis order by nephrologist
         ↓
    Patient Registration (Dialysis-Specific)
    ├── Chronic kidney disease staging
    ├── Vascular access type (AV fistula, graft, catheter)
    ├── Dry weight, ultrafiltration target
    ├── Dialysis prescription (frequency, duration, dialyzer, dialysate)
    └── Medication protocol (heparin, EPO, iron)
         ↓
    Session Scheduling
    ├── Fixed slots (Mon-Wed-Fri or Tue-Thu-Sat)
    ├── Machine assignment (HDF, online HDF, SLED)
    ├── Duration: 3-4 hours (routine), longer (acute/SLED)
    └── Waitlist management for add-on patients
         ↓
    Pre-Dialysis Assessment
    ├── Weight check (pre-dialysis weight)
    ├── Blood pressure, pulse
    ├── Temperature
    ├── Access assessment (on buttonhole, thrill/murmur)
    ├── Review recent labs (Hb, K+, PO4, PTH, Albumin)
    └── Symptom review (cramps, itching, fatigue)
         ↓
    Dialysis Session
    ├── Machine setup and priming
    ├── Access cannulation (fistula/graft) or catheter connection
    ├── Pre-dialysis blood sample (if ordered)
    ├── Session parameters recorded:
    │   ├── Blood flow rate, dialysate flow rate
    │   ├── UF rate and total UF volume
    │   ├── Kt/V monitoring
    │   ├── Dialysate composition (K+, Ca++, HCO3)
    │   └── Heparin infusion rate
    ├── Intra-dialysis monitoring (q30-60min):
    │   ├── BP, pulse
    │   ├── Symptoms (hypotension, cramps, nausea)
    │   └── Machine alarms
    ├── Medications during session (EPO, iron, Vit D)
    └── Post-dialysis:
        ├── Post-weight, access decannulation/heparin lock
        ├── Post-BP
        └── Post-dialysis blood sample (if ordered)
         ↓
    Post-Dialysis & Billing
    ├── Session documentation complete
    ├── Patient status assessed for discharge
    ├── Next session confirmed
    ├── Per-session billing generated
    └── Monthly summary prepared (for chronic patients)
         ↓
[END] → Session complete → Follow-up tests scheduled
```

### Dialysis State Machine
```
scheduled → arrived → pre_assessment → in_progress → 
    ├── completed → discharged
    ├── interrupted (complication) → resumed → completed
    └── no_show → rescheduled
```

### Exception Handling
| Scenario | Action |
|----------|--------|
| Hypotension during dialysis | Trendelenburg position, saline bolus, reduce UF |
| Access complication (bleeding/clotting) | Apply pressure, monitor, vascular consult |
| Machine malfunction | Switch to backup machine, maintenance call |
| Missed session (chronic) | Reschedule same day if possible, adjust next session |
| Catheter-related infection | Blood cultures, antibiotic, line removal consideration |

### Dependencies
- **Patient Registration:** CKD patient registry
- **IPD/OPD:** Acute dialysis for inpatients
- **Billing:** Per-session charges
- **Lab:** Monthly/bi-monthly lab monitoring
- **Inventory:** Dialyzers, lines, dialysate, heparin

---

## 16. BLOOD BANK

### Purpose
Manage blood product inventory, donor management, compatibility testing, and issue tracking for transfusion safety.

### Actors
- **Blood Bank Technician** — Testing, storage, issue
- **Transfusion Officer** — Supervision, complex cases
- **Doctor** — Blood product orders
- **Donor** — Blood donation
- **Nurse** — Transfusion administration

### End-to-End Workflow: Blood Issue (Cross-Match & Transfusion)

```
[START] → Doctor orders blood product
         ↓
    Order Entry
    ├── Product type (Packed RBC, FFP, Platelets, Cryoprecipitate, Whole Blood)
    ├── Quantity (units)
    ├── Cross-match type (Type & Screen vs Type & Cross-match)
    ├── Urgency (Routine, Urgent, Emergency/Immediate)
    ├── Special requirements (irradiated, CMV-negative, leuko-reduced)
    └── Diagnosis / indication documented
         ↓
    Sample Collection (Pre-Transfusion)
    ├── Patient identification (2-factor)
    ├── Blood sample collected (EDTA tube, properly labeled)
    ├── Sample label includes: Patient Name, MRN, DOB, Date/Time, Collector initials
    └── Previous transfusion records checked
         ↓
    Compatibility Testing
    ├── ABO/Rh typing (patient sample)
    ├── Antibody screening (indirect Coombs)
    ├── Cross-match (patient serum vs donor cells)
    ├── Emergency release (uncross-matched O-negative for life-threatening)
    └── Compatibility label generated upon match
         ↓
    Product Issuance
    ├── Donor unit selected (same ABO/Rh, antigen-matched if needed)
    ├── Visual inspection of unit (discoloration, clots, leaks)
    ├── Check expiry date
    ├── Documentation in issue register
    └── Product handed to nursing team (with compatibility form)
         ↓
    Transfusion Administration (Nursing)
    ├── 2-factor patient identification at bedside
    ├── Verify product against compatibility form
    ├── Pre-transfusion vitals
    ├── Start transfusion slowly (15 min observation)
    ├── Monitor for reactions (q15min × first hour, then q30min)
    ├── Post-transfusion vitals
    ├── Dispose of bag appropriately
    └── Transfusion reaction → STOP transfusion → emergency protocol
         ↓
[END] → Transfusion complete → Documentation → Inventory deducted
```

### Blood Bank State Machine
```
order_placed → sample_collected → compatibility_testing → 
    ├── cross_match_compatible → unit_issued → transfusion_in_progress →
    │   ├── transfusion_completed
    │   └── transfusion_reaction → investigated → resolved
    ├── cross_match_incompatible → further_testing → alternate_units
    └── cancelled → unused_unit_returned_to_inventory
```

### Emergency Release Protocol
```
Life-Threatening Hemorrhage (Massive Transfusion Protocol)
├── Activate MTP (Massive Transfusion Protocol)
├── Uncross-matched O-negative RBCs released immediately
├── Type-specific blood as soon as patient typed
├── Massive transfusion pack: 6 RBC + 4 FFP + 1 Platelets
├── Ongoing lab monitoring (CBC, coagulation, ABG, ionized Ca)
├── Transfusion officer coordinates blood product supply
└── Full documentation completed after stabilization
```

### Exception Handling
| Scenario | Action |
|----------|--------|
| Transfusion reaction | STOP transfusion, maintain IV access, notify doctor |
| Unit near expiry | Priority usage, redistribute to anticipated need |
| Insufficient stock | Contact other blood banks/centers, donor recruitment |
| Wrong blood issued (near miss) | Incident investigation, immediate correction |
| Unused unit returned | Time limit check (>30 min outside → discard) |
| Positive antibody screen | Extended phenotyping, antigen-negative unit selection |

### Dependencies
- **Patient Registration:** Blood type documentation
- **IPD/ER/OT:** Major consumers of blood products
- **Lab:** Cross-match and compatibility testing
- **Inventory:** Blood product inventory management
- **Nursing:** Transfusion administration
- **Donor Management:** Volunteer donor system

---

## 17. INVENTORY & STORE MANAGEMENT

### Purpose
Manage hospital-wide inventory — medical consumables, surgical supplies, implants, and general stores through procurement, receipt, storage, and issue.

### Actors
- **Store Keeper** — Inventory management
- **Purchase Officer** — Procurement
- **Department Head** — Requisition initiator
- **Nurse** — Consumable issue requests
- **Finance** — Cost tracking
- **Admin** — Stock audits

### End-to-End Workflow

#### A. Inventory Lifecycle
```
[START] → Inventory planning & reorder
         ↓
    Reorder Trigger
    ├── Auto-trigger: Stock below reorder level
    ├── Manual: Department requisition
    ├── Seasonal adjust: Known high-demand periods
    └── Emergency: Critical shortage flag
         ↓
    Purchase Requisition → Approval → Purchase Order → Purchase
         ↓
    Goods Receipt
    ├── Verify against PO (quantity, quality, expiry)
    ├── GRN (Goods Received Note) generated
    ├── QC check (temperature, packaging, expiry > 6 months)
    ├── Batch/Lot/SKU recorded
    ├── Location assignment (store room, shelf, bin)
    └── Inventory updated
         ↓
    Storage Management
    ├── FIFO/FEFO arrangement (First Expiry First Out)
    ├── Temperature monitoring (cold chain: 2-8°C, -20°C)
    ├── Expired stock identification and segregation
    ├── Location tracking (store → shelf → bin)
    └── Physical cycle counting
         ↓
    Issue/Dispensing
    ├── Department requisition → Verify → Issue
    ├── Patient-specific consumption (linked to billing)
    ├── Inter-department transfer
    ├── Staff consumption (PPE, etc.)
    └── Issue documented, inventory reduced
         ↓
    Stock Adjustment
    ├── Physical count variance → Adjustment with reason
    ├── Damaged expiry → Write-off with approval
    ├── Theft/loss → Investigation + write-off
    └── Return to supplier → Credit note
         ↓
[END] → Periodic physical inventory → Reconciliation → Reporting
```

### Inventory State Machine (Stock Move)
```
draft → requested → approved → issued → received → 
    ├── completed
    └── returned → restocked
```

### Item Categories
```
├── Medical/Surgical Consumables (syringes, gloves, dressings, sutures)
├── Implants & Prosthetics (joints, stents, pacemakers, cages)
├── Pharmaceuticals (hospital formulary)
├── Laboratory Reagents & Consumables
├── Radiology Consumables (contrast, films)
├── General Stores (stationery, cleaning supplies)
├── Linens & Textiles (bed sheets, gowns, towels)
├── Kitchen Supplies (dietary)
├── Engineering & Maintenance Supplies
└── IT & Office Supplies
```

### Exception Handling
| Scenario | Action |
|----------|--------|
| Stockout of critical item | Emergency procurement, alternative sourcing |
| Expired stock found | Segregate, write-off, supplier return |
| Receiving damaged goods | Rejection, debit note, replacement request |
| Theft/loss suspected | Security investigation, insurance claim |
| Physical count variance | Investigation, adjustment approval |

### Dependencies
- **Purchase/Procurement:** Replenishment
- **Pharmacy:** Medication inventory sub-set
- **Lab/Radiology/OT:** Major consumers
- **Finance:** Cost accounting
- **Nursing:** Daily consumption
- **Billing:** Patient-specific consumption billing

---

## 18. PURCHASE & PROCUREMENT

### Purpose
Manage the complete procurement lifecycle — from indent to PO, goods receipt, vendor management, and payment.

### Actors
- **Store/Department** — Indent initiator
- **Purchase Officer** — Procurement execution
- **Finance Manager** — Budget approval, payment
- **Hospital Admin** — High-value approval
- **Vendor** — Supplier

### End-to-End Workflow
```
[START] → Indent/Requisition from department
         ↓
    Indent Approval
    ├── Department head approves indent
    ├── Budget check
    └── Admin approval for high-value (>₹1L) / CAPEX items
         ↓
    Vendor Selection
    ├── Empaneled vendor list
    ├── Rate contract comparison
    ├── Get quotations (≥3 for high-value)
    ├── Technical evaluation (if applicable)
    └── Purchase committee recommendation
         ↓
    Purchase Order Generation
    ├── PO terms defined (price, delivery, payment terms)
    ├── GST calculation
    ├── Delivery schedule agreed
    ├── PO approved (digitally signed)
    └── PO sent to vendor (email/portal)
         ↓
    Goods Receipt → Quality Check (see Inventory)
         ↓
    Vendor Invoice Processing
    ├── Match invoice against PO + GRN (3-way matching)
    ├── GST input credit validation
    └── Payment processing as per terms
         ↓
    Vendor Performance Tracking
    ├── On-time delivery
    ├── Quality compliance
    ├── Pricing adherence
    └── Contract renewal decisions
         ↓
[END] → Purchase lifecycle complete
```

---

## 19. HR & PAYROLL

### Purpose
Manage hospital workforce — recruitment, employee records, attendance, leave, payroll, and compliance.

### Actors
- **HR Manager** — Full HR lifecycle
- **Employee** — Hospital staff
- **Department Head** — Team management
- **Finance** — Payroll processing

### Key Modules
```
Workforce Management:
├── Employee Database (personal, professional, qualifications)
├── Recruitment & Onboarding
├── License & Certification Tracking (medical license, NMC registration)
├── Credentialing & Privileging (doctors: procedure privileges)
├── Training & Development
├── Performance Appraisal
├── Disciplinary Management
└── Separation/Exit Management

Attendance & Time Tracking:
├── Biometric/face recognition integration
├── Shift-wise attendance
├── Overtime calculation
├── Late/early/absent tracking
└── Duty roster integration

Leave Management:
├── Leave types (CL, SL, PL/EL, maternity, paternity, LWP)
├── Leave application & approval workflow
├── Leave balance tracking
├── Encashment rules
└── Attendance regularization

Payroll:
├── Salary structure (basic, HRA, DA, allowances, deductions)
├── Monthly payroll processing
├── Tax calculation (TDS, Form 16)
├── PF/ESI/Professional tax deduction
├── Bonus & incentives
├── Payslip generation
└── Bank transfer file generation
```

---

## 20. DUTY ROSTER

### Purpose
Create and manage staff duty schedules across all departments, ensuring adequate coverage while respecting labor regulations and staff preferences.

### Actors
- **Roster Manager** (Nursing Supervisor / Admin) — Schedule creation
- **Staff** (Nurses, Doctors, Technicians) — Schedule recipients
- **Department Head** — Approval authority

### Workflow
```
[START] → Shift patterns defined per department
         ↓
    Staff Preferences Collected
    ├── Preferred shifts (morning, evening, night)
    ├── Day-off requests
    ├── Leave requests
    └── Training/meeting commitments
         ↓
    Roster Generation
    ├── Auto-roster: Algorithm-based optimization
    ├── Manual adjustments by roster manager
    ├── Rules enforced:
    │   ├── Max consecutive night shifts (≤3)
    │   ├── Min rest between shifts (≥12 hours)
    │   ├── Fair shift distribution
    │   ├── Skill mix per shift (senior + junior)
    │   └── Staff coverage ratio (nurse:patient)
    └── Final roster published → Staff notified
         ↓
    Shift Swap / Change Management
    ├── Staff request swap → Approval workflow
    ├── Emergency absence → Replacement allocation
    └── Overtime approval for extra shifts
         ↓
    Attendance & Compliance
    ├── Actual vs rostered comparison
    ├── Overtime tracking
    └── Labor law compliance reporting
         ↓
[END]
```

---

## 21. HOUSEKEEPING

### Purpose
Maintain hospital hygiene, cleanliness, and infection control standards across all areas.

### Actors
- **Housekeeping Staff** — Cleaning tasks
- **Housekeeping Supervisor** — Task assignment, quality check
- **Infection Control Nurse** — Standards monitoring

### Workflow
```
[START] → Daily cleaning schedule generated
         ↓
    Area Categorization (Based on infection risk):
    ├── Critical areas (OT, ICU, CSSD, Isolation rooms) → High-frequency
    ├── Semi-critical (Wards, Labs, Corridors) → Medium-frequency
    └── Non-critical (Offices, Lobby, Cafeteria) → Standard-frequency
         ↓
    Task Assignment
    ├── Room cleaning (occupied, discharge, vacant)
    ├── Floor mopping/disinfection
    ├── Bathroom cleaning
    ├── Bio-waste collection & disposal (segregated)
    ├── Linen exchange
    └── Deep cleaning schedule
         ↓
    Quality Check
    ├── Supervisor rounds & checklist
    ├── Infection control audit
    ├── Patient feedback on cleanliness
    └── Remedial action for non-compliance
         ↓
[END] → Cleaning logs maintained
```

---

## 22. MAINTENANCE (EQUIPMENT & FACILITY)

### Purpose
Ensure all medical equipment and hospital infrastructure is maintained, calibrated, and compliant with safety standards.

### Actors
- **Biomedical Engineer** — Medical equipment
- **Maintenance Technician** — Facility, HVAC, electrical
- **Department User** — Equipment user
- **Vendor** — AMC service provider

### Workflow
```
Equipment Lifecycle:
├── Asset Registration (make, model, serial, location, warranty)
├── Preventive Maintenance Schedule (daily/weekly/monthly/quarterly/annual)
├── Breakdown Maintenance (reactive)
├── Calibration Schedule (medical equipment, weighing scales, pumps)
├── AMC Management (Annual Maintenance Contracts)
├── Spare Parts Management
└── Equipment Replacement Planning

Facility Management:
├── HVAC maintenance (temperature/humidity control)
├── Electrical & UPS maintenance
├── Plumbing & Water supply
├── Fire safety equipment inspection
├── Medical gas pipeline maintenance
├── Elevator maintenance
└── Building & civil maintenance
```

---

## 23. MIS REPORTS & ANALYTICS

### Purpose
Provide actionable insights for operational, clinical, and financial decision-making through dashboards, reports, and analytics.

### Actors
- **Hospital Administrator** — Operational oversight
- **Medical Superintendent** — Clinical quality
- **Finance Manager** — Revenue/cost analysis
- **Department Heads** — Departmental performance

### Report Categories

#### A. Operational Reports
```
Patient Volume Reports:
├── OPD census (daily/weekly/monthly — by department, doctor)
├── IPD census (bed occupancy rate, ALOS, admission/discharge rate)
├── ER census (patient volume, triage distribution, admission rate)
├── OT utilization (cases, duration, utilization %)
└── Lab/Radiology volume (tests per day, TAT compliance)

Efficiency Metrics:
├── Bed Occupancy Rate (target: 70-85%)
├── Average Length of Stay (ALOS)
├── Bed Turnover Interval
├── OT First Case On-Time Start %
├── Lab/Radiology Turnaround Time
├── Emergency Door-to-Doctor Time
└── Appointment Wait Times
```

#### B. Clinical Reports
```
Quality Metrics:
├── Infection Rates (SSI, CLABSI, CAUTI, VAP)
├── Readmission Rate (30-day)
├── Mortality Rate (crude, adjusted)
├── Medication Error Rate
├── Patient Fall Rate
├── Pressure Ulcer Incidence
└── Blood Transfusion Reaction Rate

Clinical Activity:
├── Diagnosis distribution (ICD-10 code frequency)
├── Procedure distribution
├── High-cost procedure analysis
├── Referral patterns
└── Telemedicine utilization
```

#### C. Financial Reports
```
Revenue Reports:
├── Daily Revenue Summary (by department, by payer category)
├── Monthly Revenue Trend
├── Payer Mix Analysis (self-pay, insurance, corporate, govt)
├── Package vs Non-package revenue
├── Discount Analysis
└── Bad Debt/Writ-Off Analysis

Cost Reports:
├── Departmental Cost Analysis
├── Drug/Consumable Cost per Patient
├── Inventory Turnover & Wastage
├── OT Cost per Case
└── Lab Cost per Test

Receivables:
├── AR Aging Report
├── Insurance Claim Pending Analysis
├── Collection Efficiency
├── Deposit Utilization Report
└── Refund Pending Report
```

---

## 24. QUEUE MANAGEMENT

### Purpose
Optimize patient flow by managing queues intelligently — reducing wait times, improving patient experience, and maximizing resource utilization.

### Actors
- **Patient** — In queue
- **Receptionist** — Token generation
- **Nurse** — Triage queue
- **Doctor** — Consultation queue
- **System** — Queue orchestration

### Workflow
```
[START] → Patient arrives → Token/Queue Number Generated
         ↓
    Queue Type Assignment
    ├── OPD Queue (by doctor/department)
    ├── Pharmacy Queue (by prescription status)
    ├── Lab Queue (by test type)
    ├── Radiology Queue (by modality)
    ├── Billing Queue (by service type)
    ├── Emergency Queue (by triage priority)
    └── Admission Queue (by bed availability)
         ↓
    Queue Management Logic
    ├── FIFO (First In, First Out) — standard
    ├── Priority (Emergency > Urgent > Follow-up > New)
    ├── Appointment slot-based (pre-scheduled vs walk-in)
    ├── Doctor-specific vs pooled
    ├── VIP/VVIP override (configurable)
    └── Estimated wait time display
         ↓
    Patient Flow Orchestration
    ├── Digital display in waiting areas
    ├── SMS/WhatsApp updates (X more patients before you)
    ├── Token grouping (by batch time slots)
    ├── Real-time schedule adjustments
    └── Capacity-based flow control
         ↓
[END] → Patient served → Queue metrics updated
```

---

## 25. TELEMEDICINE

### Purpose
Enable remote consultations through video visits, expanding access to care and enabling follow-up without travel.

### Actors
- **Patient** — Remote participant
- **Doctor** — Remote provider
- **Platform** — Video infrastructure

### Workflow
```
[START] → Telemedicine Appointment Scheduled
         ↓
    Pre-Consultation
    ├── Patient receives video link (SMS/Email)
    ├── System requirements verified (camera, mic, internet)
    ├── Consent for teleconsultation obtained
    ├── Medical history uploaded (if new patient)
    ├── Vitals self-reported (if applicable)
    ├── E-prescription consent confirmed
    └── Virtual waiting room queued
         ↓
    Video Consultation
    ├── Secure, HIPAA-compliant video platform
    ├── History taking and remote examination
    ├── Screen sharing for lab/reports review
    ├── Physical examination guidance (self or attendant-assisted)
    ├── Diagnosis / Assessment
    └── Treatment plan discussed
         ↓
    Post-Consultation
    ├── E-prescription generated (digitally signed, QR-coded)
    ├── Lab/radiology orders placed
    ├── Follow-up scheduled (video or in-person)
    ├── Patient education materials shared
    └── Recording (with consent) stored in EMR
         ↓
[END]
```

---

## 26. PATIENT PORTAL

### Purpose
Empower patients with self-service access to their health information, appointments, billing, and communication with providers.

### Features
```
Appointment Management:
├── Book appointments (by doctor, specialty, time)
├── View upcoming appointments
├── Cancel/reschedule appointments
└── View appointment history

Health Records:
├── View lab results (after doctor release)
├── Download radiology reports & images
├── Access discharge summary
├── View immunization record
├── Medication history
└── Visit history / clinical timeline

Billing & Payments:
├── View outstanding bills
├── Make online payments (cards, UPI, net banking)
├── Download payment receipts
├── View insurance claim status
└── Download tax invoices

Communications:
├── Secure messaging with provider
├── Appointment reminders (push, email, SMS)
├── Health tips & educational content
├── Prescription refill requests
└── Feedback & satisfaction surveys

Health Tracking:
├── Vitals logging (BP, glucose, weight)
├── Medication adherence tracking
├── Symptom journaling
└── Care plan adherence
```

---

## 27. CRM & PATIENT ENGAGEMENT

### Purpose
Manage the complete patient lifecycle — from lead generation through conversion, active care, to retention and loyalty.

### Lifecycle Stages
```
Lead Generation
├── Inquiries (calls, website, walk-in, referral)
├── Campaign response (health camps, email, social media)
├── Corporate tie-ups (annual health checkups)
└── Doctor referrals

Lead → Patient Conversion
├── Qualification (needs, budget, decision timeline)
├── Appointment scheduling
├── Visit and consultation
├── Treatment acceptance
└── Registration

Active Care
├── Appointment adherence monitoring
├── Treatment compliance tracking
├── Follow-up management
├── Patient satisfaction measurement
└── Issue resolution

Retention & Loyalty
├── Annual health check-up reminders
├── Chronic disease management program
├── Patient feedback & NPS
├── Referral program management
└── Health education & wellness content
```

---

## 28. NAVAYU-SPECIFIC MODULES

### Navayu MSK (Musculoskeletal) Workflow
Navayu has specialized MSK consultation workflow with structured forms:

```
Patient Registration (Navayu-specific fields)
├── Occupation history
├── MSK-specific history (pain location, duration, aggravating factors)
├── Previous MSK treatments
├── Functional limitation assessment
└── Baseline disability score

Navayu MSK Exam (Structured Examination Form)
├── Region-specific exam templates:
│   ├── Lumbar Spine (flexion, extension, SLR, neurological)
│   ├── Cervical Spine (range of motion, Spurling's, neurology)
│   ├── Shoulder (ROM, impingement tests, instability tests)
│   ├── Knee (ROM, ligament tests, meniscal tests)
│   ├── Hip (ROM, FABER, FADIR, Trendelenburg)
│   └── Ankle/Foot, Elbow/Wrist, Hand
└── Pain mapping (body diagram overlay)

Navayu Investigations Panel
├── X-ray views (by region)
├── MRI sequences
├── CT indications
├── Blood work (inflammatory markers: ESR, CRP)
└── Nerve conduction studies (when indicated)

Navayu Protocol Maps
├── Non-operative treatment pathways
├── Injection protocols (steroid, PRP, viscosupplementation)
├── Surgical referral criteria
├── Rehab protocols (phased)
└── Follow-up timelines

Navayu Follow-up Handoff
├── Treatment adherence tracking
├── Response to treatment assessment
├── Rehabilitation progress
├── Functional outcome scores
└── Next treatment decision point
```

---

## 29. INTEGRATIONS

### Current Integration Architecture
```
Internal Integrations (Between Modules):
├── Event Bus (PlatformEvent) — Cross-module event propagation
├── Billing Charge Lines — All modules push charges to billing
├── Patient Context — Shared patient/encounter data across modules
├── Notification Outbox — Unified notification dispatch
└── Platform Events — Audit, metering, and workflow triggers

External Integration Points:
├── SMS Provider (Twilio)
├── Email Provider (SendGrid)
├── WhatsApp Business API (planned)
├── Payment Gateway — For online payments
└── Vercel — Deployment platform
```

### Required Integrations (Not Yet Implemented)
```
HL7/FHIR Interface:
├── ADT (Admission, Discharge, Transfer) messages
├── ORM (Order) / ORU (Result) messages for lab
├── SCH (Schedule) messages
├── MDM (Document) messages for clinical documents
└── FHIR R4 API for interoperability

PACS Integration:
├── DICOM image transfer
├── WADO (Web Access to DICOM Objects)
├── Worklist management (MWL)
└── Report integration

Payment Gateways:
├── Razorpay / Paytm / PhonePe / Stripe
├── Recurring billing for subscription/EMI
└── Insurance payment gateway integration

External Lab Interfaces:
├── Direct LIS integration
├── HL7 ORU for result ingestion
└── API-based result retrieval

Government Interfaces:
├── Ayushman Bharat PM-JAY
├── CGHS (Central Govt Health Scheme)
├── State health insurance schemes
├── NDHM (National Digital Health Mission) — ABDM integration
└── RTPCR/COVID reporting portals
```

---

## 30. MISSING WORKFLOWS

The following workflows are expected in a modern HIS but are **not yet implemented** in Navayu Health:

| Missing Workflow | Module | Criticality | Notes |
|-----------------|--------|-------------|-------|
| CSSD Sterilization Tracking | OT/Infection Control | 🔴 Critical | Instrument tracking, sterilization cycles, pack expiry |
| Diet Kitchen Management | IPD/Operations | 🟡 High | Meal planning, diet prescriptions, dietary restrictions |
| Ambulance Management | Emergency/Transport | 🟡 High | Fleet management, GPS tracking, billing |
| Mortuary Management | Operations | 🟡 High | Body storage tracking, release workflow, death certificate |
| Medical Records (Physical) | EMR | 🟡 High | File tracking, issuance, retrieval, archival |
| Patient Transport/ Porter | Operations | 🟠 Medium | Inter-department patient transport requests |
| Linen Management | Housekeeping | 🟠 Medium | Laundry cycle, linen inventory, tracking |
| Biomedical Waste Management | Operations | 🟠 Medium | Segregation, collection, disposal, regulatory reporting |
| EHS (Environment, Health, Safety) | Admin | 🟠 Medium | Safety inspections, incident reporting, fire drills |
| Vendor Portal | Purchase | 🟢 Low | PO acknowledgment, invoice submission, delivery updates |
| Physician Directory/Referral | CRM | 🟢 Low | External doctor referral network, commission tracking |
| Continuing Medical Education (CME) | HR | 🟢 Low | CME tracking, credit hours, conferences |
| Patient Feedback & Grievance | CRM/Admin | 🟢 Low | Structured feedback, complaint resolution, NPS tracking |
| Corporate/Business Intelligence | MIS | 🟢 Low | Enterprise dashboards, data warehouse, OLAP |
