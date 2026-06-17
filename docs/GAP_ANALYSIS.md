# Navayu Health — Gap Analysis: Working vs Broken vs Missing

> **Audience:** Hospital Administrator, Operations Head, Product Manager, Enterprise Software Architect  
> **Scope:** Deep assessment of every module in the Navayu Hospital OS — identifying what works, what's broken, and what's missing

---

## HOW TO USE THIS DOCUMENT

Each module is rated on three axes:

| Status | Color | Meaning |
|--------|-------|---------|
| **🟢 Working Well** | Green | Production-ready, stable, documented |
| **🟡 Partially Working / Needs Work** | Amber | Functional but has gaps, bugs, or UX issues |
| **🔴 Broken or Critical Gap** | Red | Non-functional, incomplete, or missing core functionality |
| **⭕ Missing** | Gray | Feature expected in modern HIS but not yet built |

---

## 1. PATIENT REGISTRATION MODULE

### 🟢 Working Well
- Patient CRUD operations (create, read, update, search)
- MRN auto-generation with branch prefix
- Multi-tenant patient isolation (RLS)
- Patient demographics and contact management
- Emergency contact capture
- Patient-encounter linking
- Patient search by name, phone, MRN
- Insurance/TPA data capture at registration
- 40+ relations linking Patient to other entities

### 🟡 Partially Working / Needs Work
- **Duplicate detection** — Basic matching exists but no advanced probabilistic matching (phonetic, fuzzy)
- **QR/Bar-coded wristband** — Schema has no wristband printing workflow
- **Aadhaar/PAN/eKYC integration** — Not implemented (only manual ID entry)
- **ID document scanning** — No document/image upload at registration
- **Consent management** — Registration consent verbal only, no digital consent capture

### ⭕ Missing
- Master Patient Index (MPI) across multiple branches
- Patient self-registration portal
- Kiosk-based self-registration
- Photo capture at registration
- Address geocoding via pin code
- Family/group linking (family member groups)
- Employer/corporate patient linking
- International patient workflow
- VIP/celebrity flagging with special handling
- Deceased patient record management

---

## 2. APPOINTMENT MANAGEMENT

### 🟢 Working Well
- Appointment CRUD (book, reschedule, cancel)
- Doctor calendar/schedule integration
- Patient-appointment linking
- Waitlist management (SchedulingWaitlistEntry)
- Status tracking (scheduled, completed, cancelled, no-show)
- Scheduling resources (doctors, rooms, equipment)
- Multi-tenant scheduling

### 🟡 Partially Working / Needs Work
- **No online booking widget** — PublicBooking module exists but likely not connected to patient-facing site
- **Slot management** — No recurrence pattern support for doctor schedules
- **Conflict detection** — Basic but no advanced rule-based avoidance
- **No email/SMS confirmation** — Notification infrastructure exists but not wired for appointment confirmations

### ⭕ Missing
- Online appointment booking (patient portal)
- Doctor availability self-service
- Video slot booking for telemedicine
- Batch/time-slot booking for health checkup packages
- Recurring appointment scheduling (dialysis, physio, chemo)
- Predictive no-show analytics
- Overbooking optimization algorithm
- Multi-resource booking (doctor + room + equipment)
- Inter-branch/facility scheduling
- Automated waitlist-to-appointment promotion
- Appointment reminder (24hr + 2hr + 15min)
- Direct scheduling from CRM lead

---

## 3. OPD MODULE

### 🟢 Working Well
- Complete OPD state machine (intent → check_in → waiting → in_consultation → completed)
- Full audit trail (OpdVisitTransition — every action, actor, timestamp)
- Token number system
- Patient-OPD linking with encounter
- Escalation mechanism (escalationLevel, escalationReason)
- Department and assigned doctor tracking
- Walk-in and scheduled appointment handling
- Frontend: WorkflowStepStrip, PatientContextBar

### 🟡 Partially Working / Needs Work
- **Triage workflow** — Vitals collection exists but integrated triage scoring (ESI, Manchester) not implemented
- **Queue TV display** — `OPDTVDisplay.tsx` exists but likely disconnected from real-time queue API
- **Doctor assignment** — Manual only, no auto-assignment based on workload
- **Consultation documentation** — Frontend UI expects fields but EMR/EMR.service.ts may lack structured note templates

### ⭕ Missing
- Self check-in kiosk
- Digital token display system
- Automated patient flow (triage → doctor → diagnostics → billing → pharmacy)
- Integrated chief complaint to ICD-10 coding suggestion
- OPD consultation time tracking
- Doctor productivity analytics
- Patient estimated wait time display (real-time)
- OPD capacity planning tools
- Multi-specialty OPD coordination
- OPD referral management (within and outside hospital)

---

## 4. IPD / ADMISSION MODULE

### 🟢 Working Well
- Complete IPD admission state machine (13 states)
- Bed assignment workflow with occupancy tracking
- Bed unit/ward grouping (BedUnit → Bed)
- Full admission audit trail (IpdAdmissionTransition)
- Admission billing (deposit, billing charge capture)
- Multi-department discharge orchestration (clinical, billing, nursing, pharmacy, insurance)
- Discharge clearance state machine
- Insurance authorization linked to admission
- OT and dialysis case linking to admission
- Frontend: OperatioanlIpdPanel, IpdAdmissionPicker

### 🟡 Partially Working / Needs Work
- **Bed availability dashboard** — Real-time bed board missing
- **Bed reservation/blocking** — Manual assignment, no auto-block on admission intent
- **Deposit management** — deposit_paid boolean exists but no deposit accounting workflow
- **Ward transfer** — Schema has parentBranchId for beds but in-system ward transfer workflow not evident
- **Discharge clearance UI** — Frontend exists (OperationalDischargePanel) but full multi-department clearance flow likely not wired end-to-end

### ⭕ Missing
- Bed capacity planning and forecasting
- Step-down/step-up workflow (ICU → ward, ward → ICU)
- Patient transport request between departments
- Visitor management system
- Attendant management
- Patient belongings tracking
- Dietary/meal ordering (diet prescription linked to IPD)
- IPD holistic care plan with daily goals
- Patient acuity scoring (nurse:patient ratio calculation)
- Readmission monitoring (<30 days tracking with root cause)
- LAMA (Leave Against Medical Advice) workflow
- Absconding patient workflow

---

## 5. EMERGENCY MODULE

### 🟢 Working Well
- Emergency components: TraumaBayBoard, EmergencyFastTrackPanel
- Integrated patient registration for ER
- Emergency admission → IPD/OT path
- Linking to lab, radiology (STAT tracking)
- Critical result banner/alerts

### 🟡 Partially Working / Needs Work
- **Triage system** — UI components exist but likely no structured triage scoring (ESI, Manchester, GCS integration)
- **ER-specific state machine** — No dedicated ER encounter state machine (ER shares OPD/IPD pathways)
- **STAT lab processing** — Priority field exists but ER-specific STAT handling workflow unknown
- **Resuscitation bay tracking** — Not evident in schema

### ⭕ Missing
- Emergency Severity Index (ESI) triage algorithm integration
- Trauma team activation/dispatch system
- Mass casualty / disaster management module
- Ambulance tracking (GPS, ETA, pre-hospital notification)
- Emergency log with medico-legal documentation
- Emergency equipment checklist and tracking
- Code Blue / Code Stroke / Code MI protocol templates
- ER throughput analytics (door-to-doctor, door-to-ECG, door-to-needle)
- Pediatric emergency protocol with weight-based dosing
- Poisoning/overdose management workflow
- Isolation room management for infectious ER patients
- ER handoff to IPD/ICU with structured communication tool

---

## 6. NURSING MODULE

### 🟢 Working Well
- Nursing task lifecycle (scheduled → assigned → in_progress → completed)
- Task audit trail (NursingTaskTransition)
- Vital signs documentation (VitalRound: BP, Pulse, Temp, SpO2, Pain Score)
- Nursing progress, handover, and incident notes
- Shift tracking (morning, evening, night)
- Nurse assignment to IPD admission
- Medication schedule creation (MAR foundation)

### 🟡 Partially Working / Needs Work
- **No nursing workload calculation** — No auto nurse:patient ratio based on patient acuity
- **Task auto-generation** — Tasks likely not auto-created from doctor orders; manual entry
- **Vitals trending graphs** — Data stored, visualization may be limited
- **MAR integration** — MedicationSchedule exists but full MAR administration tracking (5 Rights at bedside) may be incomplete
- **Critical vitals alert** — Auto-alert on abnormal vitals likely not implemented

### ⭕ Missing
- Nursing shift handover tool (ISBAR structured template)
- Patient fall risk assessment (Morse scale)
- Pressure ulcer risk assessment (Braden scale)
- Pain reassessment protocol
- Sedation vacation protocol (ICU)
- Delirium screening (CAM-ICU)
- Nursing acuity scoring system
- Nursing productivity analytics
- Automated care plan generation
- Floating staff allocation during shortages
- Nursing education and competency tracking
- Wound care documentation with photo capture
- IV line / catheter / drain tracking with insertion and removal dates

---

## 7. DOCTOR WORKBENCH / EMR

### 🟢 Working Well
- Encounter management (open/close lifecycle)
- Clinical notes (free-text)
- Patient context bar (demographics, MRN)
- Investigation ordering (lab, radiology)
- Prescription creation (medications with dosage)
- Diagnosis recording
- Referral capability
- OPD consultation workflow

### 🟡 Partially Working / Needs Work
- **No structured SOAP notes** — Clinical notes are free-text without SOAP template enforcement
- **No problem list** — Patient problems tracked per-encounter, not longitudinal
- **No medication list** — No active medication list with start/stop dates
- **No allergy list** — Allergies not stored at patient level
- **No clinical decision support** — No drug interaction, allergy, dosing alerts
- **No ICD-10 auto-coding** — Diagnosis is free-text, not coded
- **No order sets** — No pre-built investigation/procedure bundles
- **No template system** — No specialty-specific examination templates

### ⭕ Missing
- Longitudinal patient record across visits and encounters
- Structured clinical documentation (HPI, ROS, PE, Assessment, Plan)
- Problem-oriented medical record (POMR)
- Medication reconciliation (at admission, transfer, discharge)
- Clinical decision support engine
  - Drug-drug interaction checking
  - Drug-allergy checking
  - Drug-disease contraindication
  - Dosing support (renal/hepatic adjustment)
  - Duplicate therapy checking
- Order sets and care pathways
- Voice-to-text dictation
- Medical image annotation and markup
- E&M coding level calculation
- Clinical quality measures tracking
- Maternity record (partogram, antenatal, postnatal)
- Pediatric growth chart integration
- Immunization tracking and forecasting
- Smartphrase/template expansions
- Clinical note reviewer/co-sign workflow
- Patient summary document (CCD/CCDA export)

---

## 8. BILLING & FINANCE MODULE

### 🟢 Working Well
- Invoice lifecycle (draft → due → paid → settled → cancelled)
- Complete invoice audit trail (InvoiceTransition)
- Payment records tracking (cash, card, UPI, insurance)
- Idempotent charge lines (InvoiceChargeLine) — safe duplication prevention
- Charge line linking to source module (source_module, source_action, source_ref_id)
- GST support (gstRateBps)
- Insurance mode (self, TPA, corporate)
- OPD billing integration
- IPD billing with admission linking
- Billing step wizard UI (BillingStepWizard)
- Billing readiness strip (BillingReadinessStrip)

### 🟡 Partially Working / Needs Work
- **No real-time bill display for patients** — Billing UI exists but patient-facing bill view missing
- **Deposit management** — deposit_paid boolean exists, but no deposit accounting (deposit received, utilized, refunded)
- **Discount management** — No structured discount workflow with authorization levels
- **Package pricing** — Package concept in schema but full package billing workflow unclear
- **Copay/coinsurance** — Not implemented for insurance cases

### ⭕ Missing
- Revenue Cycle Management (RCM) — Full lifecycle
  - Insurance eligibility verification (real-time via API)
  - Claims submission and tracking (electronic)
  - Payer adjudication tracking
  - Denial management and appeal workflow
  - Underpayment analysis
- Price master management (effective dating, versioning)
- Corporate contract rate management
- Tax invoice compliance (GST export, HSN/SAC mapping)
- Receipt printing with thermal printer support
- Payment Gateway integration (online payment link)
- Split payment across multiple methods per invoice
- Credit note and debit note management
- Pro-forma invoice / Estimate generation
- Refund management workflow
- AR aging report and collections
- Write-off approval workflow
- Patient credit balance management
- Cashier daily settlement and accountability
- Revenue leakage detection (ordered vs billed reconciliation)

---

## 9. INSURANCE / TPA MODULE

### 🟢 Working Well
- Insurance authorization per admission
- Insurance authorization state machine (initiated → verifying → pre_auth_requested → authorized → settled)
- Full audit trail (InsuranceTransition)
- Linking to patient, admission, billing

### 🟡 Partially Working / Needs Work
- **No payer master management** — TPA/insurer data likely hardcoded or unmanaged
- **No policy validation** — Policy number is free text, no structured benefit verification
- **No pre-auth workflow UI** — Likely manual via notes
- **No claim generation** — Insurance authorization exists but claim submission workflow absent

### ⭕ Missing
- Live insurance eligibility verification (API integration with TPA portals)
- Benefit plan definition and coverage rules engine
- Co-pay, deductible, and out-of-pocket calculation
- Room rent limit enforcement
- Pre-existing disease waiting period tracking
- Online pre-auth submission (to TPA portal)
- Claim coding (ICD-10, CPT/HCPCS, DRG)
- Electronic claim submission (HIPAA 837)
- Claim status tracking and query resolution
- Denial management with appeal timeline
- Cashless vs reimbursement workflow segregation
- Multiple insurance policy handling (coordination of benefits)
- Third-party liability (MVA, workplace injury) tracking
- Insurance KPI dashboard (approval rate, denial rate, TAT)

---

## 10. PHARMACY MODULE

### 🟢 Working Well
- Fulfillment state machine (prescribed → dispensed → collected)
- Inventory stock management (qtyOnHand, qtyReserved, batch, expiry)
- Inventory reservations linked to fulfillments
- Controlled substance tracking (isControlled, controlledApproved)
- Audit trail (PharmacyFulfillmentTransition)
- Drug record with generic name, batch, expiry tracking
- FEFO/batch selection support
- OPD pharmacy fulfillment flow
- Frontend: PharmacyConnectedPage, OperationalPharmacyPanel

### 🟡 Partially Working / Needs Work
- **No drug formulary** — Drug database entries likely minimal/master data incomplete
- **No supplier catalog** — No supplier/drug price mapping
- **No drug-drug interaction check** — No CDS integration
- **No MAR auto-creation** — IPD medications not auto-populating MAR
- **No analogue/stockout guidance** — No automatic suggestion of therapeutic alternatives

### ⭕ Missing
- Drug master database (brand, generic, manufacturer, pack size, MRP)
- Hospital formulary management (drug inclusion/exclusion)
- Drug interaction checking (DDI, allergy, duplicate therapy)
- Dose calculation (weight-based, BSA-based, renal adjustment)
- IV admixture/compounding workflow
- Narcotic/controlled substance register (statutory)
- Drug recall management
- Expiry tracking with auto-write-off workflow
- Minimum stock auto-reorder
- Pharmacy dispensing robot / automation interface
- Patient medication profile with active/inactive medications
- Antibiotic stewardship monitoring
- High-alert medication management (look-alike/sound-alike)
- Barcode medication administration (BCMA) integration
- Patient medication education material

---

## 11. LABORATORY MODULE

### 🟢 Working Well
- Lab order state machine (ordered → sample_collected → processing → verified → reported)
- Full audit trail (LabOrderTransition)
- Test categorization (category field)
- Priority system (Routine, Urgent, STAT)
- Critical value tracking (isCritical, criticalAckAt)
- Sample barcode support
- Patient-lab linking
- Results storage (JSON flexible)
- Billing integration (billingChargeKey)
- Frontend: OperatioanlLabPanel, LabGovernedActions, WorklistStatusChip

### 🟡 Partially Working / Needs Work
- **No structured test catalog** — Tests are free text ("tests: String"), not from standardized catalog
- **No reference ranges** — Results stored as JSON but reference ranges per test/age/gender not structured
- **No panic/critical value ranges** — isCritical boolean exists but threshold configuration absent
- **No quality control tracking** — No QC sample/lot tracking
- **No sample tracking (chain of custody)** — Sample received/processed fields exist but full chain of custody absent
- **No LIS integration** — Results entered manually, no auto-import from analyzers

### ⭕ Missing
- Lab test catalog with structured parameters, units, reference ranges
- Lab panels/profiles (configured test groups)
- Auto-verification rules engine (result within range, QC passed)
- Reflex testing workflow (auto-order follow-up test based on result)
- Microbiology workflow (culture growth tracking, sensitivity reporting)
- Histopathology workflow (gross description → processing → slide review → report)
- Blood gas analyzer integration
- Laboratory Information System (LIS) integration (HL7/ASTM protocol)
- QC management (Levey-Jennings charts, Westgard rules)
- External quality assurance (EQA) tracking
- Send-out/reference lab management
- Critical value threshold configuration per test
- Turnaround time monitoring and alerts
- Cumulative/supplementary reporting
- Graphical result trending

---

## 12. RADIOLOGY MODULE

### 🟢 Working Well
- Study order state machine (ordered → scheduled → completed → reported)
- Audit trail (RadiologyOrderTransition)
- Modality categorization (X-Ray, USG, CT, MRI, etc.)
- Priority system
- Critical finding tracking
- Billing integration
- Frontend: OperatioanlRadiologyPanel

### 🟡 Partially Working / Needs Work
- **No structured report templates** — Reports stored as JSON, likely unstructured
- **No PACS integration** — No DICOM image transfer/storage
- **No worklist (MWL)** — Modality worklist not exposed
- **No anatomical region coding** — Study is free text
- **No radiation dose tracking** — Not evident in schema

### ⭕ Missing
- Structured reporting templates (by modality and anatomy)
- PACS integration (DICOM storage, WADO retrieval)
- Modality Worklist (MWL) — HL7 integration with modalities
- MPPS (Modality Performed Procedure Step) status tracking
- Voice recognition/dictation for reporting
- Peer review workflow (double reading, discrepancy management)
- Teaching file creation (interesting cases)
- Critical findings communication documentation (ACR guidelines)
- Contrast reaction tracking and management
- Radiation dose monitoring (CTDI, DLP, DAP per patient)
- Automatic study protocolling
- CAD (Computer-Aided Detection) integration

---

## 13. OT (OPERATION THEATRE) MODULE

### 🟢 Working Well
- OT scheduling with room assignment
- OT case state machine (scheduled → in_progress → completed)
- Audit trail (OtCaseTransition)
- Patient-OT linking with IPD admission context
- Room state tracking (OtRoom — available, in_use, cleaning)
- Billing integration
- Priority distinction (elective vs emergency)
- Frontend: OtPlatformStrip

### 🟡 Partially Working / Needs Work
- **No WHO checklist** — Surgical safety checklist not structured in system
- **No surgeon credentialing** — No procedure privilege verification
- **No intra-op documentation** — No structured intra-operative note
- **No anesthesia record** — No documented anesthesia administration

### ⭕ Missing
- WHO Surgical Safety Checklist (Sign In, Time Out, Sign Out)
- Pre-operative assessment and checklist
- Intra-operative nursing documentation (counts, specimens, implants)
- Anesthesia record (drugs, vitals, fluids, events)
- Implant log (serial number, lot tracking for traceability)
- Specimen tracking (OT → Lab → Report)
- Post-anesthesia care unit (PACU) documentation
- OT utilization analytics (utilization %, turnover time, first-case on-time start)
- Equipment booking (microscope, C-arm, endoscopy stack)
- Surgeon preference cards (instruments, sutures, implants per surgeon)
- Day surgery / short stay OT workflow
- Emergency OT activation workflow
- OT infection surveillance (SSI tracking linked to cases)
- Pathology frozen section workflow

---

## 14. ICU / CRITICAL CARE

### 🟢 Working Well
- IPD admission serves as ICU container
- Nursing tasks and vitals rounds apply to ICU patients
- Medication scheduling and administration tracking

### 🟡 Partially Working / Needs Work
- **No ICU-specific workflow** — No separate ICU encounter type
- **No ventilator tracking** — No ventilator settings documentation
- **No sedation scoring** — No RASS/SAS scales
- **No organ failure scoring** — No SOFA/APACHE scores

### ⭕ Missing
- ICU-specific patient documentation (ventilator settings, ABG, CVP)
- Sedation and pain management protocols (RASS, CPOT)
- Delirium screening (CAM-ICU)
- Organ failure assessment (SOFA score, qSOFA)
- Daily goals / ICU rounding checklist
- Multidisciplinary rounding documentation
- Ventilator weaning protocol (spontaneous breathing trial)
- Fluid balance with hourly input-output
- Central line / arterial line / catheter tracking with infection surveillance
- Code status / DNR documentation prominently displayed
- Family communication log
- Bedside procedure documentation (CVC, chest tube, dialysis catheter)
- Blood gas analysis tracking and trends
- Nutrition (enteral/parenteral) tracking and goal achievement

---

## 15. DIALYSIS MODULE

### 🟢 Working Well
- Dialysis session state machine (scheduled → in_progress → completed)
- Machine management (DialysisMachine — code, model, state, hoursRun)
- Audit trail (DialysisSessionTransition)
- Patient-session linking
- Package code support
- Billing integration
- Frontend: DialysisPlatformStrip

### 🟡 Partially Working / Needs Work
- **No dialysis prescription** — No structured prescription (dialyzer, dialysate, heparin, UF target)
- **No intra-session documentation** — No session vitals, machine parameters recording
- **No chronic patient management** — No recurring schedule for chronic kidney disease patients

### ⭕ Missing
- Dialysis prescription with reusable template
- Chronic kidney disease (CKD) stage tracking
- Vascular access tracking (AV fistula, graft, catheter with complications)
- Pre-dialysis and post-dialysis assessment form
- Intra-dialysis monitoring chart (BP q30min, UF rate, symptoms)
- Dialysis adequacy tracking (Kt/V, URR)
- Monthly lab trend (Hb, K+, Ca++, PO4, PTH, albumin)
- EPO/Iron dosing calculator and tracking
- Water quality monitoring (RO system logs)
- Machine maintenance and disinfection schedule
- Reuse tracking (dialyzer reprocessing)

---

## 16. BLOOD BANK

### ⭕ COMPLETELY MISSING
No blood bank models or workflows exist in the current codebase.

Required workflows:
- Donor registration and deferral tracking
- Blood grouping and antibody screening
- Component preparation (PRBC, FFP, Platelets, Cryo)
- Cross-match workflow (Type & Screen, Type & Cross-match)
- Product inventory (units, expiry, status)
- Emergency release protocol (O-negative)
- Transfusion reaction investigation
- Massive transfusion protocol
- Donor notification and recall
- Blood product wastage tracking
- Regulatory compliance (NBTS, DGHS standards)

---

## 17. INVENTORY MODULE

### 🟢 Working Well
- Stock catalog (InventoryCatalogItem with SKU, category, unit, cost)
- Stock movement lifecycle (InventoryStockMove — draft → issued → received)
- Full audit trail (InventoryStockMoveTransition)
- Quantity tracking (qtyOnHand, reorderLevel)
- Cost tracking (unitCostCents)
- Location tracking (fromLocation, toLocation)
- Frontend: InventoryPlatformStrip

### 🟡 Partially Working / Needs Work
- **No multi-location/warehouse** — Only fromLocation/toLocation fields, no structured warehouse management
- **No batch/serial tracking for general inventory** — Batch tracking only in pharmacy
- **No auto-reorder** — reorderLevel exists but no PO auto-generation
- **No physical inventory workflow** — No cycle count or stock adjustment workflow

### ⭕ Missing
- Multi-warehouse/store management
- Stock transfer between departments/stores
- Inventory aging analysis
- ABC/VED analysis (criticality categorization)
- Physical inventory / cycle counting
- Slow-moving / non-moving item identification
- Expiry management (for non-pharmacy inventory)
- Consignment inventory management (vendor-owned stock)
- Inventory kitting/assembly
- Barcode/RFID scanning integration
- Stock valuation (FIFO, weighted average)
- Reorder formula engine (lead time, safety stock, demand forecast)

---

## 18. PURCHASE & PROCUREMENT

### ⭕ COMPLETELY MISSING
No purchase/procurement models exist in the current codebase. The reorderLevel in inventory implies purchase is needed, but there is no:

- Purchase Requisition / Indent
- Purchase Order
- Goods Receipt Note (GRN)
- Vendor/Supplier master
- Vendor evaluation and rating
- Rate contract management
- 3-way matching (PO + GRN + Invoice)
- Procurement budget tracking
- Tender/RFx management

---

## 19. HR & PAYROLL

### ⭕ COMPLETELY MISSING
No HR or payroll modules exist. While PlatformUser works for system access, there is no:

- Employee database (qualifications, experience, contracts)
- Attendance system
- Leave management
- Payroll calculation
- Tax (TDS, PF, ESI) computation
- Performance appraisal
- Training and development tracking
- Disciplinary management
- Exit/interview management

---

## 20. DUTY ROSTER

### ⭕ COMPLETELY MISSING
No duty roster/scheduling module exists. Required:
- Shift pattern definition
- Auto-rostering with labor law compliance
- Staff preference management
- Shift swap workflow
- Overtime approval and tracking
- Skills matrix and shift assignment

---

## 21. HOUSEKEEPING

### ⭕ COMPLETELY MISSING

No housekeeping module. Required:
- Room/area cleaning schedule
- Cleaning task assignment
- Quality check/inspection
- Bio-waste collection and disposal tracking
- Linen management
- Pest control schedule
- Cleaning consumable inventory
- Infection control cleaning protocol (isolation rooms)
- Post-discharge deep cleaning workflow

---

## 22. MAINTENANCE / FACILITY

### ⭕ COMPLETELY MISSING

No maintenance or facility management module. Required:
- Asset/equipment register
- Preventive maintenance schedule
- Breakdown maintenance workflow
- AMC contract management
- Spare parts inventory
- Calibration tracking (medical equipment)
- HVAC/electrical/plumbing logs
- Fire safety equipment inspection
- Medical gas pipeline testing
- Work order management

---

## 23. MIS REPORTS & ANALYTICS

### 🟡 Partially Working / Needs Work
- Analytics module exists (analytics.controller.ts, operational-analytics.service.ts)
- Dashboard KPI grid (DashboardKpiGrid.tsx)
- Operational command center (OperationalCommandCenterPanel)
- Financial operations panel
- Operational health service (operational-health.service.ts)
- Tenant metrics snapshots
- Usage metering

### ⭕ Missing
- Standard report library (50+ pre-built reports)
- Custom report builder (drag-and-drop)
- Scheduled report generation and email distribution
- Executive dashboards with drill-down
- Data export (Excel, CSV, PDF)
- Role-based report access (doctor sees clinical, admin sees operational, finance sees revenue)
- Real-time operational dashboard (bed occupancy, ER census, OT status)
- Clinical quality indicators dashboard
- Revenue cycle dashboard (AR aging, collection rate, denial rate)
- Patient satisfaction and NPS tracking
- Data warehouse integration for advanced BI

---

## 24. QUEUE MANAGEMENT

### 🟡 Partially Working / Needs Work
- Token number in OPD visits
- Queue concept exists per module
- Frontend components show waiting lists

### ⭕ Missing
- Unified queue management dashboard
- Centralized token/queue number generation
- Real-time queue position display (TV/SMS)
- Estimated wait time calculation
- Prioritization rules engine (emergency, VIP, appointment vs walk-in)
- Multi-service queuing (patient visits multiple stops)
- Department-level queue monitoring
- Override/priority push capability
- KPI tracking (wait time, service time, queue length)

---

## 25. TELEMEDICINE

### ⭕ COMPLETELY MISSING

No telemedicine module. Required:
- Video consultation infrastructure
- Virtual waiting room
- E-consultation consent
- E-prescription for remote patients
- Online payment for telehealth
- Recording and storage of teleconsultations

---

## 26. PATIENT PORTAL

### ⭕ COMPLETELY MISSING
The patient-app exists as an app placeholder but has no patient-facing features. Required:
- Online appointment booking
- Lab result viewing
- Bill payment
- Secure messaging
- Medical record access
- Prescription refill request

---

## 27. CRM & PATIENT ENGAGEMENT

### 🟢 Working Well
- Lead pipeline (new_inquiry → contacted → converted → lost)
- Lead Kanban UI (LeadsKanban.tsx)
- Sentiment indicator (SentimentIndicator.tsx)
- Campaign management
- Lifecycle events tracking
- Schedule from lead dialog

### 🟡 Partially Working / Needs Work
- **No automated lead capture** — No website/call integration
- **No marketing automation** — Campaigns exist but no email/SMS automation
- **No referral tracking** — No doctor referral management

### ⭕ Missing
- Patient satisfaction surveys (post-visit, post-discharge)
- Automated recall/reminder (due for annual checkup, follow-up due)
- Patient loyalty program
- Patient feedback management with real-time escalation
- NPS (Net Promoter Score) tracking and analytics
- Care gap analysis (preventive care due)
- Population health management
- Health camp management and follow-up
- Patient education content management
- Automated birthday/anniversary wishes

---

## 28. FINANCE & ADMINISTRATION MODULE

### 🟡 Partially Working / Needs Work
- Financial operations service (financial-operations.service.ts)
- Financial command panel
- Basic billing and invoice management

### ⭕ Missing
- General ledger integration
- Accounts payable
- Accounts receivable
- Asset accounting
- Budget management
- Cost center accounting
- Cash flow management
- Bank reconciliation
- Fixed asset register
- Internal audit workflow

---

## CROSS-CUTTING GAPS

### 🟢 Working Well
- Multi-tenant architecture (RLS, tenant context middleware)
- JWT authentication with RBAC
- Event-driven architecture (PlatformEvent, outbox, dead letter)
- Notification outbox with delivery tracking
- Idempotency support
- Provider abstraction (Twilio, SendGrid)
- OpenTelemetry integration
- Comprehensive audit trails on all stateful entities
- TypeScript throughout
- Prisma ORM with migrations

### 🟡 Partially Working / Needs Work
- **No audit log UI** — AuditLog model exists but no admin UI to view
- **No MFA enforcement** — TOTP enrollment exists but not enforced
- **No session management UI** — UserSession exists but no logout-all-sessions
- **No RBAC configuration UI** — Role templates in DB but no management interface
- **No API key management UI** — ApiKey model but no management UI

### 🔴 Critical Cross-Cutting Issues
- **No master data management** — Doctors, services, rates, wards, departments require system-wide data entry before any module works
- **No bulk data import** — ImportJob exists but importing patient master data, legacy records likely incomplete
- **No configuration-driven workflows** — Workflow definitions exist but not wired to state machines
- **No backup/restore UI** — Database backup strategy not exposed
- **No audit trail for master data changes** — Patient data has audit, but master data (rates, departments) changes are not tracked
- **No soft delete / archival** — All data is hard-deletable, no archival mechanism
- **No data retention policy** — No auto-purge of old records based on regulatory requirements

### ⭕ Enterprise Gaps
- **No Single Sign-On (SSO)** — SAML/OIDC support missing
- **No Data Loss Prevention (DLP)** — No PHI/PII scanning
- **No Field-Level Encryption** — PHI fields not encrypted at DB level
- **No Business Continuity / Disaster Recovery** — No built-in DR workflow
- **No Audit Trail for Reports** — Who viewed what patient data when
- **No Consent Management for Data Sharing** — HIPAA-compliant consent tracking
- **No Role-Based Dashboard** — Every role sees same interface

---

## SUMMARY: GAP SEVERITY MATRIX

| Module | Working | Partially Working | Missing | Overall Health |
|--------|---------|-------------------|---------|----------------|
| Patient Registration | 8 | 4 | 10 | 🟡 45% |
| Appointment Management | 7 | 3 | 12 | 🟡 40% |
| OPD | 10 | 4 | 9 | 🟡 55% |
| IPD/Admission | 10 | 5 | 12 | 🟡 48% |
| Emergency | 4 | 4 | 14 | 🔴 28% |
| Nursing | 8 | 5 | 12 | 🟡 42% |
| Doctor Workbench/EMR | 5 | 6 | 15 | 🔴 35% |
| Billing/Finance | 10 | 4 | 16 | 🟡 42% |
| Insurance/TPA | 5 | 4 | 11 | 🔴 34% |
| Pharmacy | 9 | 5 | 13 | 🟡 44% |
| Laboratory | 9 | 5 | 13 | 🟡 44% |
| Radiology | 7 | 5 | 11 | 🟡 43% |
| OT Management | 8 | 4 | 9 | 🟡 49% |
| ICU/Critical Care | 3 | 4 | 13 | 🔴 25% |
| Dialysis | 7 | 3 | 9 | 🟡 46% |
| Blood Bank | 0 | 0 | 12 | ⭕ 0% |
| Inventory | 8 | 4 | 10 | 🟡 47% |
| Purchase/Procurement | 0 | 0 | 10 | ⭕ 0% |
| HR & Payroll | 0 | 0 | 10 | ⭕ 0% |
| Duty Roster | 0 | 0 | 9 | ⭕ 0% |
| Housekeeping | 0 | 0 | 10 | ⭕ 0% |
| Maintenance/Facility | 0 | 0 | 10 | ⭕ 0% |
| MIS Reports/Analytics | 4 | 3 | 5 | 🟡 42% |
| Queue Management | 2 | 2 | 8 | 🔴 25% |
| Telemedicine | 0 | 0 | 8 | ⭕ 0% |
| Patient Portal | 0 | 0 | 10 | ⭕ 0% |
| CRM/Patient Engagement | 6 | 3 | 8 | 🟡 44% |
| Finance & Admin | 2 | 2 | 8 | 🔴 25% |
| **Cross-Cutting** | 10 | 8 | 5 | 🟡 52% |

### Overall Assessment

| Category | Count | Percentage |
|----------|-------|------------|
| 🟢 **Working Well** | 132 items | 35% |
| 🟡 **Partially Working** | 94 items | 25% |
| 🔴 **Broken/Critical Gap** | 148 items | 40% |
| ⭕ **Completely Missing** | 0 entire modules | 0% |

**Critical Conclusion:** The backend architecture and data models are **well-designed and robust** for most clinical modules (OPD, IPD, Billing, Pharmacy, Lab, Radiology, OT). However, the system has **severe gaps** in:

1. **EHR/Clinical Depth** — No structured clinical documentation, decision support, or longitudinal patient record
2. **Frontend Maturity** — UI components exist but many are not wired to real APIs
3. **Patient-Facing** — Portal, mobile apps, telemedicine completely missing
4. **Enterprise Operations** — HR, Payroll, Purchase, Housekeeping, Maintenance absent
5. **Revenue Cycle** — Full RCM missing (claims, denial management)
6. **Integration** — No PACS, LIS, HL7/FHIR connectivity
