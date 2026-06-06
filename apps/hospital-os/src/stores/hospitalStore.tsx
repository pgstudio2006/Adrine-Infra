import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { formatPlatformErrorBody, PlatformApiError } from '@/runtime/platform-client';
import { HospitalPlatformEvents, type OpdValidationContext } from '@adrine/hospital-operations';
import { emitPlatformEvent } from '@/operations/platform-bridge';
import { mapWorkflowActionToPlatformEvent } from '@/operations/event-action-map';
import {
  getClientOpdState,
  guardLocalAdmissionStatusAgainstPlatform,
  guardOpdTransition,
  guardLabUiStage,
} from '@/operations/lifecycle-guards';
import {
  canUseOpdRuntime,
  platformEnsureActiveOpdVisit,
  platformKernelAudit,
  platformGetOpdVisit,
  platformListOpdBoard,
  platformOpdTransition,
  platformRecordMetering,
  platformRegisterOpdPatient,
} from '@/runtime/opd-runtime';
import { toAppointmentIso } from '@/lib/opd/appointment-datetime';
import { platformEnqueueOpdVisitToBoard } from '@/lib/opd/platform-opd-enqueue';
import { useAuth } from '@/contexts/AuthContext';
import { platformSaveNavayuRegistration } from '@/lib/navayu/navayu-runtime';
import { maybeCreateNavayuCrmLead } from '@/lib/navayu/navayu-crm';
import type { NavayuRegistrationMetadata } from '@/lib/navayu/navayu-forms';
import {
  canUseSchedulingRuntime,
  platformBookAppointment,
  platformUpdateAppointmentStatus,
} from '@/runtime/scheduling-runtime';
import {
  canUseBillingRuntime,
  canUseIpdBillingRuntime,
  platformCompleteIpdBillingExit,
  platformCompleteOpdBillingExit,
  platformGetLiveFinancialState,
  platformGetLiveIpdFinancialState,
  platformInvoiceTransition,
  platformSyncCharge,
  platformSyncIpdCharge,
} from '@/runtime/billing-runtime';
import { resolvePlatformBedId } from '@/runtime/bed-runtime';
import { buildChargeIdempotencyKey } from '@/runtime/charge-idempotency';
import {
  canUseLabRuntime,
  platformApplyLabUiStage,
  platformCreateLabOrder,
  platformGetLiveLabState,
} from '@/runtime/lab-runtime';
import {
  canUsePharmacyRuntime,
  isControlledDrug,
  platformCreatePrescription,
  platformDispensePrescription,
  platformGetLivePharmacyState,
  platformApplyRxUiStatus,
} from '@/runtime/pharmacy-runtime';
import {
  canUseIpdRuntime,
  platformAdvanceAdmissionTowardDischargePlanning,
  platformAssignBed,
  platformCompleteAdmissionDischargeChain,
  platformCreateAdmission,
  platformGetIpdAdmissionDetail,
  platformIpdTransition,
  platformListActiveIpdCensus,
  platformListIpdAllowedActions,
  type PlatformIpdAdmissionDetail,
} from '@/runtime/ipd-runtime';
import {
  canUseEmergencyRuntime,
  ensureEmergencyPlatformEncounter,
  fetchActivePlatformIpdAdmission,
  PlatformApiError as EmergencyPlatformApiError,
} from '@/runtime/emergency-runtime';
import {
  canUseDischargeRuntime,
  canMarkLocalDischarged,
  platformGetLiveDischargeState,
  platformStartDischarge,
} from '@/runtime/discharge-runtime';
import {
  canUseRadiologyRuntime,
  platformApplyRadiologyUiStatus,
  platformCreateRadiologyOrder,
  platformGetLiveRadiologyState,
} from '@/runtime/radiology-runtime';
import { getPlatformSession } from '@/runtime/platform-session';
import {
  fetchMappedAppointmentsInRange,
  fetchMappedLabBranchWorklist,
  fetchMappedPatientsFromPlatform,
  fetchMappedPharmacyBranchWorklist,
  fetchMappedRadiologyBranchWorklist,
  isPlatformAuthoritative,
  mergeAppointmentsFromPlatform,
  mergeLabDepartmentWorklist,
  mergePatientsFromPlatform,
  mergePharmacyDepartmentWorklist,
  mergeRadiologyDepartmentWorklist,
} from '@/runtime/platform-store-bridge';
import { getBranchConfigOverrides } from '@/runtime/branch-config';
import { guardInvoiceTransition } from '@/operations/billing-guards';
import type { InvoiceState } from '@adrine/hospital-operations';

// ── Shared Types ──
export interface HospitalPatient {
  uhid: string;
  /** domain-api patient id when platform runtime is active */
  platformPatientId?: string;
  /** Active OPD visit id on domain-api */
  platformOpdVisitId?: string;
  platformInvoiceId?: string;
  platformInvoiceVersion?: number;
  /** Authoritative OPD lifecycle state from platform */
  opdState?: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  photoUrl?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  bloodGroup?: string;
  abhaId?: string;
  aadhaar?: string;
  category: 'general' | 'corporate' | 'insurance' | 'government' | 'vip';
  patientType: 'OPD' | 'IPD' | 'Emergency' | 'Maternity' | 'Newborn' | 'ICU' | 'Surgery' | 'Dialysis' | 'Trauma';
  registrationPatientType?: string;
  department?: string;
  assignedDoctor?: string;
  allergies?: string;
  chronicDiseases?: string;
  registeredOn: string;
  lastVisit?: string;
  branch: string;
  insuranceProvider?: string;
  policyNo?: string;
  tpaProvider?: string;
  tpaPolicyNo?: string;
  tpaPreAuthStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  referralSource?: string;
  referralDoctor?: string;
  referralHospital?: string;
  referralClinic?: string;
  isMLC?: boolean;
  mlcPoliceCase?: string;
  mlcReportingAuthority?: string;
  mlcIncidentDescription?: string;
  welcomeSmsSentAt?: string;
  /** Tenant-specific visit metadata (Navayu MSK registration, etc.) */
  visitMetadata?: Record<string, unknown>;
}

export type PatientJourneyType = HospitalPatient['patientType'];
export type PaymentMode = 'cash' | 'card' | 'upi' | 'cheque' | 'bank-transfer';

export interface EmergencyCase {
  id: string;
  uhid?: string;
  patientName: string;
  age?: number;
  gender?: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  referralDoctor?: string;
  referralHospital?: string;
  mlcPoliceCase?: string;
  mlcReportingAuthority?: string;
  mlcIncidentDescription?: string;
  arrivalMode: 'Walk-in' | 'Ambulance' | 'Referral' | 'Transfer';
  complaint: string;
  vitals: string;
  triage: 'critical' | 'urgent' | 'semi-urgent' | 'non-urgent' | null;
  assignedNurse?: string;
  assignedDoctor?: string;
  mlcRequired: boolean;
  status:
    | 'triage-pending'
    | 'triaged'
    | 'in-treatment'
    | 'under-observation'
    | 'transferred-ipd'
    | 'discharged';
  location?: string;
  createdAt: string;
}

export type DoctorRoundStatus = 'pending' | 'seen' | 'follow-up-required';

export interface AdmissionCase {
  id: string;
  /** domain-api patient id when linked */
  platformPatientId?: string;
  /** domain-api IPD admission id when platform runtime is active */
  platformAdmissionId?: string;
  platformBedId?: string;
  platformInvoiceId?: string;
  platformInvoiceVersion?: number;
  uhid: string;
  patientName: string;
  journeyType: PatientJourneyType;
  admissionSource: 'OPD' | 'Emergency' | 'Direct' | 'Maternity' | 'Surgery';
  ward: string;
  department?: string;
  room?: string;
  bed: string;
  attendingDoctor: string;
  consultantDoctors?: string[];
  assignedNurse?: string;
  roundingDoctor?: string;
  nextDoctorRoundAt?: string;
  primaryDiagnosis: string;
  currentTreatmentPlan?: string;
  nursingPriority: 'high' | 'medium' | 'low';
  doctorRoundStatus: DoctorRoundStatus;
  lastDoctorRoundAt?: string;
  status: 'admitted' | 'icu' | 'ot' | 'discharge-ready' | 'discharged';
  billingStage?: 'estimate' | 'interim' | 'finalized';
  finalBillDiscountAmount?: number;
  finalBillDiscountReason?: string;
  admittedAt: string;
  dischargeSummary?: string;
  dischargeReadyAt?: string;
  isIpLocked?: boolean;
  ipLockedAt?: string;
  ipLockReason?: string;
  ipUnlockedAt?: string;
  ipUnlockReason?: string;
  linkedEmergencyId?: string;
  linkedMotherUhid?: string;
}

export interface NursingRound {
  id: string;
  admissionId: string;
  uhid: string;
  patientName: string;
  ward: string;
  bed: string;
  nurse: string;
  shift: 'Morning' | 'Evening' | 'Night';
  bp: string;
  pulse: number;
  temp: number;
  spo2: number;
  painScore: number;
  notes: string;
  recordedAt: string;
}

export interface DoctorProgressNote {
  id: string;
  admissionId: string;
  uhid: string;
  patientName: string;
  doctor: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpRequired: boolean;
  createdAt: string;
}

export interface AdmissionTask {
  id: string;
  admissionId: string;
  uhid: string;
  patientName: string;
  task: string;
  assignedTo: string;
  createdBy: string;
  status: 'Pending' | 'Completed';
  createdAt: string;
  completedAt?: string;
}

export interface InpatientCareOrder {
  id: string;
  admissionId: string;
  uhid: string;
  patientName: string;
  type: 'Procedure' | 'Diet';
  item: string;
  priority: 'Routine' | 'Urgent' | 'Emergency';
  orderedBy: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  orderedAt: string;
}

export interface WardMedicineIssue {
  id: string;
  admissionId: string;
  uhid: string;
  patientName: string;
  inventoryId: string;
  drug: string;
  batch: string;
  expiry: string;
  qty: number;
  issuedBy: string;
  issuedAt: string;
  administrationStatus: 'issued' | 'administered' | 'held';
}

export interface OTSurgeryRecord {
  id: string;
  admissionId: string;
  uhid: string;
  patientName: string;
  procedureName: string;
  surgeon: string;
  anesthetist?: string;
  preOperativeNotes?: string;
  postOperativeNotes?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  scheduledAt: string;
  updatedAt: string;
}

export interface RoomShiftRecord {
  id: string;
  admissionId: string;
  uhid: string;
  patientName: string;
  fromWard: string;
  fromRoom?: string;
  fromBed: string;
  toWard: string;
  toRoom?: string;
  toBed: string;
  reason: string;
  shiftedBy: string;
  shiftedAt: string;
}

export interface DepartmentTransferRecord {
  id: string;
  admissionId: string;
  uhid: string;
  patientName: string;
  fromDepartment: string;
  toDepartment: string;
  reason: string;
  transferredBy: string;
  transferredAt: string;
}

export interface NotificationLog {
  id: string;
  type: 'sms';
  recipientType: 'patient' | 'doctor';
  recipient: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'failed';
  uhid?: string;
  admissionId?: string;
}

export interface HospitalAppointment {
  id: string;
  platformAppointmentId?: string;
  uhid: string;
  patientName: string;
  phone: string;
  doctor: string;
  department: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'in-consultation' | 'completed' | 'cancelled' | 'no-show';
  type: 'new' | 'follow-up' | 'teleconsultation';
  notes: string;
}

export interface QueueEntry {
  tokenNo: number;
  uhid: string;
  patientName: string;
  doctor: string;
  department: string;
  status: 'waiting' | 'called' | 'in-consultation' | 'completed' | 'skipped';
  appointmentId?: string;
  checkedInAt: string;
  complaint?: string;
  /** Set when visit is synced from domain-api board / check-in */
  platformOpdVisitId?: string;
  /** ISO check-in / board createdAt for wait-time display */
  boardSinceAt?: string;
  waitMinutes?: number;
  /** Branch scope from domain-api OPD visit */
  branchId?: string;
  /** Navayu MSK lifecycle state from visit metadata */
  mskLifecycleState?: string;
}

export interface LabOrder {
  orderId: string;
  /** domain-api LabDiagnosticOrder id when platform runtime is active */
  platformLabOrderId?: string;
  /** Authoritative lab lifecycle state from domain-api when merged from branch worklist */
  platformLabState?: import('@adrine/hospital-operations').LabOrderState;
  uhid: string;
  patientName: string;
  tests: string;
  category: string;
  priority: 'Routine' | 'Urgent' | 'Emergency';
  doctor: string;
  orderTime: string;
  stage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported';
  sampleStatus: 'Ordered' | 'Collected' | 'Received' | 'Processing' | 'Analysis Complete';
  results?: string;
  validatedBy?: string;
  reportedAt?: string;
  sampleId?: string;
  specimenType?: string;
  methodName?: string;
  interpretation?: string;
  comments?: string;
  criticalAlert?: boolean;
  authorizedBy?: string;
}

export interface PrescriptionOrder {
  id: string;
  /** domain-api PharmacyFulfillment id when platform runtime is active */
  platformFulfillmentId?: string;
  uhid: string;
  patientName: string;
  doctor: string;
  department: string;
  date: string;
  priority: 'Routine' | 'Urgent' | 'Emergency';
  status: 'Pending' | 'Verified' | 'Dispensed' | 'Partially dispensed' | 'Cancelled';
  meds: {
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    qty: number;
    dispensed: number;
    status?: 'active' | 'stopped';
    startAt?: string;
    stopAt?: string;
  }[];
}

export interface RadiologyOrder {
  orderId: string;
  /** domain-api RadiologyStudyOrder id when platform runtime is active */
  platformRadiologyOrderId?: string;
  uhid: string;
  patientName: string;
  study: string;
  modality: string;
  priority: 'Routine' | 'Urgent' | 'Emergency' | 'STAT';
  doctor: string;
  orderTime: string;
  status: 'Ordered' | 'Scheduled' | 'In Progress' | 'Completed' | 'Reported';
  scheduledDate?: string;
  scheduledTime?: string;
  technician?: string;
  reportFindings?: string;
  reportImpression?: string;
  recommendation?: string;
  radiologist?: string;
  critical?: boolean;
  bodyPart?: string;
  clinicalHistory?: string;
  technique?: string;
  comparisonStudy?: string;
  contrastUsed?: string;
  reportedAt?: string;
}

export interface BillingInvoice {
  id: string;
  platformInvoiceId?: string;
  platformVersion?: number;
  uhid: string;
  patientName: string;
  date: string;
  category: 'OPD' | 'IPD' | 'Emergency' | 'Lab' | 'Pharmacy' | 'Radiology';
  items: { description: string; amount: number }[];
  total: number;
  paid: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  paymentMode?: PaymentMode;
  finalized?: boolean;
  discountAmount?: number;
  discountReason?: string;
}

export interface BillingEstimate {
  id: string;
  uhid: string;
  patientName: string;
  date: string;
  category: BillingInvoice['category'];
  items: { description: string; amount: number }[];
  total: number;
  status: 'draft' | 'converted';
}

export interface BillingTransaction {
  id: string;
  invoiceId: string;
  uhid: string;
  patientName: string;
  kind: 'payment' | 'refund';
  amount: number;
  mode: PaymentMode;
  reference?: string;
  reason?: string;
  createdAt: string;
}

export interface PharmacyInventoryItem {
  id: string;
  drug: string;
  generic: string;
  category: string;
  batch: string;
  expiry: string;
  qty: number;
  reorder: number;
  location: string;
  supplier: string;
  price: number;
}

export type WorkflowModule =
  | 'reception'
  | 'doctor'
  | 'nurse'
  | 'lab'
  | 'pharmacy'
  | 'billing'
  | 'radiology'
  | 'emergency'
  | 'ot'
  | 'inventory'
  | 'hr'
  | 'scheduling'
  | 'dialysis'
  | 'crm'
  | 'admin'
  | 'system';

export interface WorkflowEvent {
  id: string;
  timestamp: string;
  module: WorkflowModule;
  action: string;
  /** Canonical Adrine platform event (adrine.*). */
  platformEvent?: string;
  uhid?: string;
  patientName?: string;
  refId?: string;
  details: string;
}

interface ServiceChargeInput {
  uhid: string;
  patientName: string;
  description: string;
  amount: number;
  module: WorkflowModule;
  action: string;
  refId?: string;
  categoryOverride?: BillingInvoice['category'];
  chargeCode?: string;
  idempotencyKey?: string;
}

// ── Seed Data ──
const SEED_PATIENTS: HospitalPatient[] = [
  { uhid: 'UHID-240001', name: 'Rajesh Sharma', age: 45, gender: 'M', phone: '9876543210', abhaId: '91-1234-5678-9012', category: 'insurance', patientType: 'OPD', department: 'Cardiology', assignedDoctor: 'Dr. R. Mehta', bloodGroup: 'B+', registeredOn: '15 Jan 2025', lastVisit: '8 Mar 2026', branch: 'Main Hospital', allergies: 'Penicillin' },
  { uhid: 'UHID-240002', name: 'Priya Patel', age: 28, gender: 'F', phone: '9876543211', category: 'general', patientType: 'OPD', department: 'Gynecology', assignedDoctor: 'Dr. S. Iyer', registeredOn: '22 Aug 2024', lastVisit: '8 Mar 2026', branch: 'Main Hospital' },
  { uhid: 'UHID-240003', name: 'Amit Kumar', age: 62, gender: 'M', phone: '9876543212', abhaId: '91-2345-6789-0123', category: 'government', patientType: 'IPD', department: 'Cardiology', assignedDoctor: 'Dr. R. Mehta', bloodGroup: 'O+', registeredOn: '10 Jun 2024', lastVisit: '8 Mar 2026', branch: 'Main Hospital' },
  { uhid: 'UHID-240004', name: 'Sunita Devi', age: 55, gender: 'F', phone: '9876543213', category: 'general', patientType: 'OPD', department: 'Orthopedics', assignedDoctor: 'Dr. K. Rao', registeredOn: '3 Mar 2024', branch: 'City Branch' },
  { uhid: 'UHID-240005', name: 'Vikram Singh', age: 38, gender: 'M', phone: '9876543214', category: 'vip', patientType: 'OPD', department: 'ENT', assignedDoctor: 'Dr. P. Nair', bloodGroup: 'A+', registeredOn: '11 Oct 2024', lastVisit: '8 Mar 2026', branch: 'Main Hospital' },
  { uhid: 'UHID-240006', name: 'Neha Gupta', age: 32, gender: 'F', phone: '9876543215', category: 'corporate', patientType: 'OPD', department: 'Dermatology', assignedDoctor: 'Dr. D. Kapoor', bloodGroup: 'AB+', registeredOn: '20 Dec 2025', lastVisit: '8 Mar 2026', branch: 'Main Hospital' },
  { uhid: 'UHID-240007', name: 'Arjun Reddy', age: 50, gender: 'M', phone: '9876543216', category: 'insurance', patientType: 'IPD', department: 'Orthopedics', assignedDoctor: 'Dr. K. Rao', bloodGroup: 'O-', registeredOn: '5 Nov 2024', branch: 'Main Hospital' },
  { uhid: 'UHID-240008', name: 'Fatima Khan', age: 41, gender: 'F', phone: '9876543217', category: 'general', patientType: 'IPD', department: 'Pediatrics', assignedDoctor: 'Dr. P. Nair', registeredOn: '18 Feb 2026', lastVisit: '8 Mar 2026', branch: 'Main Hospital' },
];

const SEED_APPOINTMENTS: HospitalAppointment[] = [
  { id: 'APT-10001', uhid: 'UHID-240001', patientName: 'Rajesh Sharma', phone: '9876543210', doctor: 'Dr. R. Mehta', department: 'Cardiology', date: '2026-03-08', time: '09:00', duration: 30, status: 'confirmed', type: 'follow-up', notes: 'ECG review' },
  { id: 'APT-10002', uhid: 'UHID-240002', patientName: 'Priya Patel', phone: '9876543211', doctor: 'Dr. S. Iyer', department: 'Gynecology', date: '2026-03-08', time: '09:30', duration: 30, status: 'confirmed', type: 'new', notes: '' },
  { id: 'APT-10003', uhid: 'UHID-240003', patientName: 'Amit Kumar', phone: '9876543212', doctor: 'Dr. A. Shah', department: 'General Medicine', date: '2026-03-08', time: '10:00', duration: 45, status: 'scheduled', type: 'new', notes: 'Chest pain evaluation' },
  { id: 'APT-10004', uhid: 'UHID-240004', patientName: 'Sunita Devi', phone: '9876543213', doctor: 'Dr. K. Rao', department: 'Orthopedics', date: '2026-03-08', time: '10:30', duration: 30, status: 'scheduled', type: 'new', notes: 'Knee pain' },
  { id: 'APT-10005', uhid: 'UHID-240005', patientName: 'Vikram Singh', phone: '9876543214', doctor: 'Dr. P. Nair', department: 'ENT', date: '2026-03-08', time: '11:00', duration: 30, status: 'scheduled', type: 'new', notes: '' },
  { id: 'APT-10006', uhid: 'UHID-240006', patientName: 'Neha Gupta', phone: '9876543215', doctor: 'Dr. D. Kapoor', department: 'Dermatology', date: '2026-03-08', time: '11:30', duration: 30, status: 'scheduled', type: 'follow-up', notes: '' },
];

const SEED_QUEUE: QueueEntry[] = [
  { tokenNo: 101, uhid: 'UHID-240001', patientName: 'Rajesh Sharma', doctor: 'Dr. R. Mehta', department: 'Cardiology', status: 'in-consultation', appointmentId: 'APT-10001', checkedInAt: '08:45 AM', complaint: 'Follow-up ECG review' },
  { tokenNo: 102, uhid: 'UHID-240002', patientName: 'Priya Patel', doctor: 'Dr. S. Iyer', department: 'Gynecology', status: 'waiting', appointmentId: 'APT-10002', checkedInAt: '09:20 AM', complaint: 'New consultation' },
];

const SEED_LAB_ORDERS: LabOrder[] = [
  { orderId: 'LO-4521', uhid: 'UH-2024-0045', patientName: 'Anita Sharma', tests: 'CBC (Complete Blood Count)', category: 'Hematology', priority: 'Routine', doctor: 'Dr. R. Mehta', orderTime: '10:15 AM', stage: 'In Analysis', sampleStatus: 'Processing' },
  { orderId: 'LO-4580', uhid: 'UH-2024-0230', patientName: 'Rahul Verma', tests: 'RFT (Renal Function Test), LFT (Liver Function Test)', category: 'Biochemistry', priority: 'Urgent', doctor: 'Dr. S. Iyer', orderTime: '09:30 AM', stage: 'Pending Analysis', sampleStatus: 'Received' },
  { orderId: 'LO-4514', uhid: 'UH-2024-0155', patientName: 'Kiran Desai', tests: 'Lipid Profile', category: 'Biochemistry', priority: 'Routine', doctor: 'Dr. A. Shah', orderTime: '09:00 AM', stage: 'In Analysis', sampleStatus: 'Processing' },
  { orderId: 'LO-4591', uhid: 'UH-2024-0801', patientName: 'Meera Patel', tests: 'Fasting Blood Sugar (FBS), PPBS', category: 'Biochemistry', priority: 'Routine', doctor: 'Dr. R. Mehta', orderTime: '08:45 AM', stage: 'Pending Analysis', sampleStatus: 'Received' },
];

const SEED_PRESCRIPTIONS: PrescriptionOrder[] = [
  { id: 'RX-2401', uhid: 'UHID-240001', patientName: 'Rajesh Sharma', doctor: 'Dr. R. Mehta', department: 'Cardiology', date: '2026-03-08', priority: 'Routine', status: 'Pending', meds: [
    { drug: 'Atorvastatin 20mg', dosage: '20mg', frequency: 'OD', duration: '30 days', route: 'Oral', qty: 30, dispensed: 0 },
    { drug: 'Aspirin 75mg', dosage: '75mg', frequency: 'OD', duration: '30 days', route: 'Oral', qty: 30, dispensed: 0 },
  ]},
];

const SEED_RADIOLOGY: RadiologyOrder[] = [
  {
    orderId: 'RD-1001',
    uhid: 'UHID-240003',
    patientName: 'Amit Kumar',
    study: 'Chest X-Ray PA',
    modality: 'X-Ray',
    priority: 'Urgent',
    doctor: 'Dr. A. Shah',
    orderTime: '10:05 AM',
    status: 'Reported',
    scheduledDate: '2026-03-08',
    scheduledTime: '10:30',
    technician: 'Tech. Ramesh',
    radiologist: 'Dr. Iyer',
    reportFindings: 'Portable AP chest radiograph shows clear lungs with no focal consolidation or pleural effusion.',
    reportImpression: 'No acute cardiopulmonary abnormality on current study.',
    recommendation: 'Clinical correlation advised. Repeat imaging if respiratory symptoms progress.',
    critical: false,
  },
];

const SEED_INVOICES: BillingInvoice[] = [
  { id: 'INV-5001', uhid: 'UHID-240001', patientName: 'Rajesh Sharma', date: '8 Mar 2026', category: 'OPD', items: [{ description: 'Consultation - Cardiology', amount: 800 }, { description: 'ECG', amount: 500 }], total: 1300, paid: 1300, status: 'paid', paymentMode: 'upi' },
  { id: 'INV-5002', uhid: 'UHID-240002', patientName: 'Priya Patel', date: '8 Mar 2026', category: 'OPD', items: [{ description: 'Consultation - Gynecology', amount: 1000 }], total: 1000, paid: 0, status: 'pending' },
  {
    id: 'INV-5003',
    uhid: 'UHID-240003',
    patientName: 'Amit Kumar',
    date: '8 Mar 2026',
    category: 'IPD',
    items: [
      { description: 'ICU Bed Charges', amount: 7500 },
      { description: 'Critical Care Monitoring', amount: 3200 },
      { description: 'Inpatient Pharmacy', amount: 1800 },
    ],
    total: 12500,
    paid: 6500,
    status: 'partial',
    paymentMode: 'card',
  },
  {
    id: 'INV-5004',
    uhid: 'UHID-240008',
    patientName: 'Fatima Khan',
    date: '8 Mar 2026',
    category: 'IPD',
    items: [
      { description: 'Maternity Ward Charges', amount: 4200 },
      { description: 'Post-Delivery Nursing Care', amount: 2200 },
      { description: 'Newborn Observation', amount: 1200 },
    ],
    total: 7600,
    paid: 7600,
    status: 'paid',
    paymentMode: 'upi',
  },
];

const SEED_ESTIMATES: BillingEstimate[] = [];

const SEED_PHARMACY_INVENTORY: PharmacyInventoryItem[] = [
  { id: 'INV-001', drug: 'Amoxicillin 500mg', generic: 'Amoxicillin', category: 'Antibiotics', batch: 'B-4401', expiry: '2027-06-15', qty: 24, reorder: 100, location: 'Rack A-3', supplier: 'MedPharma Ltd', price: 8.5 },
  { id: 'INV-002', drug: 'Paracetamol 650mg', generic: 'Paracetamol', category: 'Analgesics', batch: 'B-4402', expiry: '2027-09-20', qty: 540, reorder: 200, location: 'Rack A-1', supplier: 'LifeCare Pharma', price: 2.0 },
  { id: 'INV-003', drug: 'Metformin 850mg', generic: 'Metformin', category: 'Diabetes', batch: 'B-4421', expiry: '2026-03-20', qty: 180, reorder: 100, location: 'Rack B-2', supplier: 'DiaCare Inc', price: 5.0 },
  { id: 'INV-004', drug: 'Atorvastatin 20mg', generic: 'Atorvastatin', category: 'Cardiovascular', batch: 'B-4430', expiry: '2027-12-01', qty: 320, reorder: 150, location: 'Rack B-4', supplier: 'HeartMed Corp', price: 12.0 },
  { id: 'INV-005', drug: 'Morphine 10mg Inj', generic: 'Morphine Sulphate', category: 'Controlled', batch: 'C-1101', expiry: '2026-08-30', qty: 15, reorder: 20, location: 'Safe-1', supplier: 'NarcoMed Ltd', price: 95.0 },
  { id: 'INV-006', drug: 'Cetirizine 10mg', generic: 'Cetirizine', category: 'Antihistamines', batch: 'B-4440', expiry: '2027-11-10', qty: 400, reorder: 200, location: 'Rack A-2', supplier: 'AllerFree Pharma', price: 3.0 },
  { id: 'INV-007', drug: 'Omeprazole 20mg', generic: 'Omeprazole', category: 'GI Drugs', batch: 'B-4450', expiry: '2026-04-05', qty: 60, reorder: 100, location: 'Rack C-1', supplier: 'GastroMed Inc', price: 6.5 },
  { id: 'INV-008', drug: 'Azithromycin 500mg', generic: 'Azithromycin', category: 'Antibiotics', batch: 'B-4460', expiry: '2027-07-22', qty: 110, reorder: 100, location: 'Rack A-3', supplier: 'MedPharma Ltd', price: 22.0 },
];

const SEED_EMERGENCY_CASES: EmergencyCase[] = [
  {
    id: 'ER-0891',
    patientName: 'Unknown Male (~45y)',
    age: 45,
    gender: 'M',
    arrivalMode: 'Ambulance',
    complaint: 'Chest pain, diaphoresis',
    vitals: 'BP 90/60, HR 120, SpO2 88%',
    triage: 'critical',
    assignedNurse: 'Nurse Priya',
    assignedDoctor: 'Dr. A. Shah',
    mlcRequired: false,
    status: 'in-treatment',
    createdAt: '10:42 AM',
  },
  {
    id: 'ER-0892',
    patientName: 'Sunita Verma',
    age: 37,
    gender: 'F',
    arrivalMode: 'Walk-in',
    complaint: 'Severe abdominal pain',
    vitals: 'BP 140/90, HR 98, SpO2 97%',
    triage: null,
    mlcRequired: false,
    status: 'triage-pending',
    createdAt: '10:45 AM',
  },
  {
    id: 'ER-0888',
    patientName: 'Amit Joshi',
    age: 29,
    gender: 'M',
    arrivalMode: 'Referral',
    complaint: 'Head injury, GCS 12',
    vitals: 'BP 110/70, HR 88, SpO2 96%',
    triage: 'urgent',
    assignedNurse: 'Nurse Rekha',
    assignedDoctor: 'Dr. R. Mehta',
    mlcRequired: true,
    status: 'triaged',
    createdAt: '10:20 AM',
  },
];

const SEED_ADMISSIONS: AdmissionCase[] = [
  {
    id: 'ADM-2401',
    uhid: 'UHID-240003',
    patientName: 'Amit Kumar',
    journeyType: 'IPD',
    admissionSource: 'OPD',
    ward: 'ICU',
    room: 'ICU Bay 1',
    bed: 'ICU-03',
    attendingDoctor: 'Dr. R. Mehta',
    assignedNurse: 'Nurse Priya',
    roundingDoctor: 'Dr. R. Mehta',
    nextDoctorRoundAt: '11:30 AM',
    primaryDiagnosis: 'Post-CABG monitoring',
    currentTreatmentPlan: 'Continue oxygen support, fluid balance, and telemetry monitoring.',
    nursingPriority: 'high',
    doctorRoundStatus: 'pending',
    lastDoctorRoundAt: '08 Mar 2026 09:45 AM',
    status: 'icu',
    admittedAt: '07 Mar 2026 09:10 AM',
  },
  {
    id: 'ADM-2402',
    uhid: 'UHID-240008',
    patientName: 'Fatima Khan',
    journeyType: 'Maternity',
    admissionSource: 'Maternity',
    ward: 'Maternity Ward',
    room: 'Room 203',
    bed: 'MW-03',
    attendingDoctor: 'Dr. S. Iyer',
    assignedNurse: 'Nurse Sunita',
    roundingDoctor: 'Dr. S. Iyer',
    nextDoctorRoundAt: '10:00 AM',
    primaryDiagnosis: 'Post-delivery recovery',
    currentTreatmentPlan: 'Post-partum monitoring, pain management, and lactation support.',
    nursingPriority: 'medium',
    doctorRoundStatus: 'seen',
    lastDoctorRoundAt: '08 Mar 2026 10:20 AM',
    status: 'admitted',
    admittedAt: '08 Mar 2026 06:30 AM',
  },
];

const SEED_NURSING_ROUNDS: NursingRound[] = [
  {
    id: 'NR-5001',
    admissionId: 'ADM-2401',
    uhid: 'UHID-240003',
    patientName: 'Amit Kumar',
    ward: 'ICU',
    bed: 'ICU-03',
    nurse: 'Nurse Priya',
    shift: 'Morning',
    bp: '126/82',
    pulse: 92,
    temp: 99.1,
    spo2: 95,
    painScore: 4,
    notes: 'Patient stable. Continue oxygen support and hourly monitoring.',
    recordedAt: '08:10 AM',
  },
  {
    id: 'NR-5002',
    admissionId: 'ADM-2402',
    uhid: 'UHID-240008',
    patientName: 'Fatima Khan',
    ward: 'Maternity Ward',
    bed: 'MW-03',
    nurse: 'Nurse Sunita',
    shift: 'Morning',
    bp: '118/76',
    pulse: 84,
    temp: 98.4,
    spo2: 98,
    painScore: 3,
    notes: 'Mother and newborn doing well. Lactation counseling provided.',
    recordedAt: '08:35 AM',
  },
];

const SEED_DOCTOR_PROGRESS_NOTES: DoctorProgressNote[] = [
  {
    id: 'DRN-9001',
    admissionId: 'ADM-2401',
    uhid: 'UHID-240003',
    patientName: 'Amit Kumar',
    doctor: 'Dr. R. Mehta',
    subjective: 'Patient reports mild chest discomfort on deep breathing, no active chest pain at rest.',
    objective: 'BP 126/82, Pulse 92, Temp 99.1F, SpO2 95% on oxygen support.',
    assessment: 'Post-CABG recovery with stable hemodynamics and mild pain.',
    plan: 'Continue oxygen support, incentive spirometry, and analgesics. Repeat CBC today.',
    followUpRequired: true,
    createdAt: '08 Mar 2026 09:45 AM',
  },
  {
    id: 'DRN-9002',
    admissionId: 'ADM-2402',
    uhid: 'UHID-240008',
    patientName: 'Fatima Khan',
    doctor: 'Dr. S. Iyer',
    subjective: 'No fever, pain reduced, able to ambulate with support.',
    objective: 'BP 118/76, Pulse 84, Temp 98.4F, SpO2 98% room air.',
    assessment: 'Post-delivery recovery progressing well.',
    plan: 'Continue routine postnatal monitoring and counseling.',
    followUpRequired: false,
    createdAt: '08 Mar 2026 10:20 AM',
  },
];

const SEED_ADMISSION_TASKS: AdmissionTask[] = [
  {
    id: 'TASK-3001',
    admissionId: 'ADM-2401',
    uhid: 'UHID-240003',
    patientName: 'Amit Kumar',
    task: 'Repeat ECG at 2 PM and update doctor.',
    assignedTo: 'Nurse Priya',
    createdBy: 'Dr. R. Mehta',
    status: 'Pending',
    createdAt: '08 Mar 2026 09:50 AM',
  },
  {
    id: 'TASK-3002',
    admissionId: 'ADM-2402',
    uhid: 'UHID-240008',
    patientName: 'Fatima Khan',
    task: 'Ensure breastfeeding counseling documented.',
    assignedTo: 'Nurse Sunita',
    createdBy: 'Dr. S. Iyer',
    status: 'Completed',
    createdAt: '08 Mar 2026 10:25 AM',
    completedAt: '08 Mar 2026 12:00 PM',
  },
];

const SEED_INPATIENT_CARE_ORDERS: InpatientCareOrder[] = [
  {
    id: 'CO-7001',
    admissionId: 'ADM-2401',
    uhid: 'UHID-240003',
    patientName: 'Amit Kumar',
    type: 'Procedure',
    item: '2D Echo follow-up',
    priority: 'Urgent',
    orderedBy: 'Dr. R. Mehta',
    status: 'Pending',
    orderedAt: '08 Mar 2026 09:55 AM',
  },
  {
    id: 'CO-7002',
    admissionId: 'ADM-2402',
    uhid: 'UHID-240008',
    patientName: 'Fatima Khan',
    type: 'Diet',
    item: 'High-protein postnatal diet with hydration chart',
    priority: 'Routine',
    orderedBy: 'Dr. S. Iyer',
    status: 'Pending',
    orderedAt: '08 Mar 2026 10:30 AM',
  },
];

const SEED_WARD_MEDICINE_ISSUES: WardMedicineIssue[] = [];
const SEED_OT_RECORDS: OTSurgeryRecord[] = [];
const SEED_ROOM_SHIFTS: RoomShiftRecord[] = [];
const SEED_DEPARTMENT_TRANSFERS: DepartmentTransferRecord[] = [];
const SEED_NOTIFICATION_LOGS: NotificationLog[] = [];
const SEED_BILLING_TRANSACTIONS: BillingTransaction[] = [];

const DISCHARGE_SUMMARY_TEMPLATES: Record<'general' | 'post-op' | 'maternity' | 'icu', string> = {
  general: 'Diagnosis: {{diagnosis}}\nHospital Course: Stable inpatient recovery.\nTreatment Given: Standard inpatient management.\nDischarge Advice: Continue medicines, hydration, and follow-up in 7 days.',
  'post-op': 'Diagnosis: {{diagnosis}}\nProcedure: Post-operative care documented.\nHospital Course: Recovery monitored with pain and wound assessment.\nDischarge Advice: Wound care, antibiotics, and surgical OPD follow-up.',
  maternity: 'Diagnosis: {{diagnosis}}\nHospital Course: Post-delivery mother and baby monitoring completed.\nCounselling: Breastfeeding and nutrition counselling provided.\nDischarge Advice: Follow-up in maternity OPD in 5-7 days.',
  icu: 'Diagnosis: {{diagnosis}}\nHospital Course: Critical care support with close monitoring.\nStabilization: Parameters optimized before transfer/discharge.\nDischarge Advice: Continue specialist follow-up and warning signs explained.',
};

// ── Counter helpers ──
let patientCounter = 240009;
let appointmentCounter = 10007;
let tokenCounter = 103;
let labOrderCounter = 4522;
let rxCounter = 2402;
let radiologyCounter = 1002;
let invoiceCounter = 5005;
let estimateCounter = 101;
let emergencyCaseCounter = 893;
let admissionCounter = 2403;
let nursingRoundCounter = 5003;
let doctorProgressNoteCounter = 9003;
let admissionTaskCounter = 3003;
let careOrderCounter = 7003;
let wardMedicineIssueCounter = 1;
let otRecordCounter = 1;
let roomShiftCounter = 1;
let departmentTransferCounter = 1;
let notificationCounter = 1;
let billingTransactionCounter = 1;
let workflowEventCounter = 1;

const AUTO_ADMIT_JOURNEYS: PatientJourneyType[] = ['IPD', 'Maternity', 'Newborn', 'ICU', 'Surgery', 'Dialysis', 'Trauma'];

const DEPARTMENT_WARDS: Record<string, { ward: string; bedPrefix: string; nurse: string; nextDoctorRoundAt: string }> = {
  Cardiology: { ward: 'Cardiac Ward', bedPrefix: 'CW', nurse: 'Nurse Priya', nextDoctorRoundAt: '11:30 AM' },
  Orthopedics: { ward: 'Orthopedic Ward', bedPrefix: 'OW', nurse: 'Nurse Rekha', nextDoctorRoundAt: '12:00 PM' },
  Gynecology: { ward: 'Women & Mother Care', bedPrefix: 'MW', nurse: 'Nurse Sunita', nextDoctorRoundAt: '10:00 AM' },
  Pediatrics: { ward: 'Pediatric Ward', bedPrefix: 'PW', nurse: 'Nurse Rekha', nextDoctorRoundAt: '09:30 AM' },
  'General Medicine': { ward: 'General Ward', bedPrefix: 'GW', nurse: 'Nurse Priya', nextDoctorRoundAt: '11:00 AM' },
  Neurology: { ward: 'Neuro Ward', bedPrefix: 'NW', nurse: 'Nurse Kavita', nextDoctorRoundAt: '12:30 PM' },
  Surgery: { ward: 'Surgical Ward', bedPrefix: 'SW', nurse: 'Nurse Rekha', nextDoctorRoundAt: '08:30 AM' },
  ENT: { ward: 'ENT Ward', bedPrefix: 'EW', nurse: 'Nurse Sunita', nextDoctorRoundAt: '11:15 AM' },
  Urology: { ward: 'Urology Ward', bedPrefix: 'UW', nurse: 'Nurse Priya', nextDoctorRoundAt: '11:45 AM' },
};

const ADMISSION_PLANS: Record<Exclude<PatientJourneyType, 'Emergency' | 'OPD'>, { ward: string; bedPrefix: string; assignedNurse: string; nextDoctorRoundAt: string; source: AdmissionCase['admissionSource'] }> = {
  IPD: { ward: 'General Ward', bedPrefix: 'GW', assignedNurse: 'Nurse Priya', nextDoctorRoundAt: '11:00 AM', source: 'Direct' },
  Maternity: { ward: 'Maternity Ward', bedPrefix: 'MW', assignedNurse: 'Nurse Sunita', nextDoctorRoundAt: '10:00 AM', source: 'Maternity' },
  Newborn: { ward: 'Newborn Care Unit', bedPrefix: 'NB', assignedNurse: 'Nurse Rekha', nextDoctorRoundAt: '09:30 AM', source: 'Maternity' },
  ICU: { ward: 'ICU', bedPrefix: 'ICU', assignedNurse: 'Nurse Priya', nextDoctorRoundAt: 'Every hour', source: 'Direct' },
  Surgery: { ward: 'Surgical Ward', bedPrefix: 'SW', assignedNurse: 'Nurse Rekha', nextDoctorRoundAt: '08:30 AM', source: 'Surgery' },
  Dialysis: { ward: 'Dialysis Unit', bedPrefix: 'DL', assignedNurse: 'Nurse Sunita', nextDoctorRoundAt: 'During session', source: 'Direct' },
  Trauma: { ward: 'Trauma Observation', bedPrefix: 'TR', assignedNurse: 'Nurse Kavita', nextDoctorRoundAt: 'Every 2 hours', source: 'Direct' },
};

function resolveAdmissionPlacement(patient: Omit<HospitalPatient, 'uhid' | 'registeredOn'>) {
  if (patient.patientType === 'IPD') {
    const deptPlan = DEPARTMENT_WARDS[patient.department || 'General Medicine'] ?? DEPARTMENT_WARDS['General Medicine'];
    return {
      ward: deptPlan.ward,
      bedPrefix: deptPlan.bedPrefix,
      assignedNurse: deptPlan.nurse,
      nextDoctorRoundAt: deptPlan.nextDoctorRoundAt,
      source: 'Direct' as AdmissionCase['admissionSource'],
      roundingDoctor: patient.assignedDoctor || 'Doctor On Call',
    };
  }

  const plan = ADMISSION_PLANS[patient.patientType as Exclude<PatientJourneyType, 'Emergency' | 'OPD'>];
  return {
    ward: plan.ward,
    bedPrefix: plan.bedPrefix,
    assignedNurse: plan.assignedNurse,
    nextDoctorRoundAt: plan.nextDoctorRoundAt,
    source: plan.source,
    roundingDoctor: patient.assignedDoctor || 'Doctor On Call',
  };
}

function isAutoAdmissionJourney(patientType: PatientJourneyType) {
  return AUTO_ADMIT_JOURNEYS.includes(patientType);
}

function nextBedNumber(admissions: AdmissionCase[], bedPrefix: string) {
  const values = admissions
    .filter((item) => item.bed.startsWith(`${bedPrefix}-`))
    .map((item) => Number.parseInt(item.bed.split('-').pop() || '0', 10))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return 1;
  }

  return Math.max(...values) + 1;
}

// ── Context ──
interface HospitalStore {
  patients: HospitalPatient[];
  appointments: HospitalAppointment[];
  queue: QueueEntry[];
  labOrders: LabOrder[];
  prescriptions: PrescriptionOrder[];
  pharmacyInventory: PharmacyInventoryItem[];
  radiologyOrders: RadiologyOrder[];
  invoices: BillingInvoice[];
  estimates: BillingEstimate[];
  emergencyCases: EmergencyCase[];
  admissions: AdmissionCase[];
  nursingRounds: NursingRound[];
  doctorProgressNotes: DoctorProgressNote[];
  admissionTasks: AdmissionTask[];
  inpatientCareOrders: InpatientCareOrder[];
  wardMedicineIssues: WardMedicineIssue[];
  otRecords: OTSurgeryRecord[];
  roomShiftHistory: RoomShiftRecord[];
  departmentTransfers: DepartmentTransferRecord[];
  notificationLogs: NotificationLog[];
  billingTransactions: BillingTransaction[];
  workflowEvents: WorkflowEvent[];

  // Actions
  registerPatient: (data: Omit<HospitalPatient, 'uhid' | 'registeredOn'>) => string;
  /** Hydrate / search patients from domain-api; merges and backfills `platformPatientId`. */
  refreshPatientsFromPlatform: (query?: string) => Promise<void>;
  /** Resolve domain patient id for a local UHID when platform runtime is on. */
  backfillPlatformPatientId: (uhid: string) => Promise<string | undefined>;
  startFrontDeskVisit: (data: {
    patient: Omit<HospitalPatient, 'uhid' | 'registeredOn'>;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentDuration?: number;
    appointmentType?: HospitalAppointment['type'];
    notes?: string;
    visitMetadata?: Record<string, unknown>;
    initialBillingItems?: { description: string; amount: number }[];
  }) => {
    uhid: string;
    appointmentId: string | null;
    tokenNo: number | null;
    invoiceId: string | null;
    admissionId: string | null;
  };
  admitPatient: (data: {
    uhid: string;
    patientName: string;
    journeyType: PatientJourneyType;
    admissionSource: AdmissionCase['admissionSource'];
    ward: string;
    room?: string;
    bed: string;
    attendingDoctor: string;
    assignedNurse?: string;
    roundingDoctor?: string;
    nextDoctorRoundAt?: string;
    primaryDiagnosis: string;
    nursingPriority?: AdmissionCase['nursingPriority'];
    linkedEmergencyId?: string;
    linkedMotherUhid?: string;
    platformPatientIdOverride?: string;
    platformOpdVisitIdOverride?: string;
    initialNursingRound?: {
      nurse: string;
      shift: NursingRound['shift'];
      bp: string;
      pulse: number;
      temp: number;
      spo2: number;
      painScore: number;
      notes: string;
    };
  }) => string;
  transferOpdToIPD: (data: {
    uhid: string;
    patientName: string;
    attendingDoctor: string;
    department?: string;
    reason?: string;
    bedType?: 'General' | 'Semi-Private' | 'Private' | 'ICU';
    priority?: 'Routine' | 'Urgent' | 'Emergency';
    journeyType?: Exclude<PatientJourneyType, 'OPD' | 'Emergency'>;
    requestedBy?: string;
  }) => { admissionId: string; ward: string; bed: string };
  convertOpdToIPDByUHID: (data: {
    uhid: string;
    attendingDoctor?: string;
    reason?: string;
    bedType?: 'General' | 'Semi-Private' | 'Private' | 'ICU';
    priority?: 'Routine' | 'Urgent' | 'Emergency';
    requestedBy?: string;
  }) => { admissionId: string; ward: string; bed: string };
  bookAppointment: (data: Omit<HospitalAppointment, 'id'>) => string;
  updateAppointmentStatus: (id: string, status: HospitalAppointment['status']) => void;
  checkInPatient: (appointmentId: string, complaint?: string) => number;
  updateQueueStatus: (tokenNo: number, status: QueueEntry['status']) => void;
  refreshQueueFromPlatform: () => Promise<void>;
  /** Hydrate appointment board from domain-api scheduling + OPD visit linkage. */
  refreshAppointmentsFromPlatform: (from?: string, to?: string) => Promise<void>;
  /** Refresh ward/bed from `GET /ipd/admissions/:id` for admissions with `platformAdmissionId`. */
  refreshPlatformIpdSnapshots: () => Promise<void>;
  /** Merge lab / radiology / pharmacy department lists from domain-api when `VITE_PLATFORM_RUNTIME`. */
  refreshDepartmentWorklistsFromPlatform: () => Promise<void>;
  nextQueuePatient: (doctor: string) => void;
  
  // Doctor consultation actions
  saveConsultation: (data: {
    uhid: string;
    patientName: string;
    doctor: string;
    department: string;
    labTests?: { tests: string; category: string; priority: 'Routine' | 'Urgent' | 'Emergency' }[];
    medications?: { drug: string; dosage: string; frequency: string; duration: string; route: string; qty: number }[];
    radiologyOrders?: { study: string; modality: string; priority: 'Routine' | 'Urgent' | 'Emergency' }[];
    consultationFee?: number;
  }) => Promise<boolean>;

  // Lab actions
  updateLabStage: (orderId: string, stage: LabOrder['stage']) => void;
  updateLabOrder: (orderId: string, patch: Partial<LabOrder>) => void;

  // Pharmacy actions
  updatePrescriptionStatus: (rxId: string, status: PrescriptionOrder['status']) => void;
  updateMedicationLineStatus: (rxId: string, lineIndex: number, status: 'active' | 'stopped') => void;
  dispensePrescription: (rxId: string, quantities: Record<number, number>) => void;

  // Radiology actions
  updateRadiologyOrder: (orderId: string, patch: Partial<RadiologyOrder>) => void;

  // IPD operational actions
  addDailyServiceCharge: (data: {
    admissionId: string;
    description: string;
    amount: number;
    chargedBy: string;
    module?: WorkflowModule;
  }) => void;
  issueWardMedicine: (data: {
    admissionId: string;
    inventoryId: string;
    qty: number;
    issuedBy: string;
  }) => string;
  updateWardMedicineIssueStatus: (issueId: string, status: WardMedicineIssue['administrationStatus']) => void;
  addInvestigationOrder: (data: {
    admissionId: string;
    tests: string;
    category: string;
    priority: 'Routine' | 'Urgent' | 'Emergency';
    doctor: string;
  }) => string;
  upsertOTRecord: (data: {
    admissionId: string;
    procedureName: string;
    surgeon: string;
    anesthetist?: string;
    preOperativeNotes?: string;
    postOperativeNotes?: string;
    status: OTSurgeryRecord['status'];
    scheduledAt?: string;
  }) => string;
  assignConsultantDoctor: (admissionId: string, consultantDoctor: string) => void;
  transferAdmissionDepartment: (data: {
    admissionId: string;
    toDepartment: string;
    reason: string;
    transferredBy: string;
    newAttendingDoctor?: string;
  }) => void;

  // Emergency and nursing workflow actions
  createEmergencyCase: (data: {
    patientName: string;
    age?: number;
    gender?: string;
    phone?: string;
    guardianName?: string;
    guardianPhone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    referralDoctor?: string;
    referralHospital?: string;
    mlcPoliceCase?: string;
    mlcReportingAuthority?: string;
    mlcIncidentDescription?: string;
    arrivalMode: EmergencyCase['arrivalMode'];
    complaint: string;
    vitals: string;
    mlcRequired?: boolean;
  }) => string;
  triageEmergencyCase: (emergencyId: string, data: {
    triage: NonNullable<EmergencyCase['triage']>;
    assignedNurse?: string;
    assignedDoctor?: string;
    status?: EmergencyCase['status'];
  }) => void;
  transferEmergencyToIPD: (emergencyId: string, data: {
    journeyType: PatientJourneyType;
    ward: string;
    bed: string;
    attendingDoctor: string;
    primaryDiagnosis: string;
    nursingPriority?: AdmissionCase['nursingPriority'];
  }) => Promise<{ uhid: string; admissionId: string }>;
  startEmergencyTreatment: (emergencyId: string, location?: string) => void;
  moveEmergencyToObservation: (emergencyId: string, location: string) => void;
  dischargeEmergencyCase: (emergencyId: string) => void;
  addNursingRound: (data: {
    admissionId: string;
    nurse: string;
    shift: NursingRound['shift'];
    bp: string;
    pulse: number;
    temp: number;
    spo2: number;
    painScore: number;
    notes: string;
  }) => string;
  addDoctorProgressNote: (data: {
    admissionId: string;
    doctor: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    followUpRequired?: boolean;
  }) => string;
  markDoctorRoundCompleted: (admissionId: string, doctor: string) => void;
  addAdmissionTask: (data: {
    admissionId: string;
    task: string;
    assignedTo: string;
    createdBy: string;
  }) => string;
  updateAdmissionTaskStatus: (taskId: string, status: AdmissionTask['status']) => void;
  addInpatientCareOrder: (data: {
    admissionId: string;
    type: InpatientCareOrder['type'];
    item: string;
    priority: InpatientCareOrder['priority'];
    orderedBy: string;
  }) => string;
  updateInpatientCareOrderStatus: (orderId: string, status: InpatientCareOrder['status']) => void;
  applyDischargeSummaryTemplate: (admissionId: string, templateKey: 'general' | 'post-op' | 'maternity' | 'icu', doctor: string) => void;
  saveAdmissionDischargeSummary: (admissionId: string, summary: string, doctor: string) => void;
  updateAdmissionStatus: (admissionId: string, status: AdmissionCase['status']) => void;
  unlockAdmissionEditLock: (admissionId: string, adminName: string, reason: string) => void;
  assignAdmissionBed: (
    admissionId: string,
    ward: string,
    bed: string,
    assignedNurse?: string,
    nextDoctorRoundAt?: string,
    reason?: string,
    shiftedBy?: string,
  ) => void;

  // Billing lifecycle actions
  generateInterimBill: (admissionId: string, note?: string) => string | null;
  finalizeAdmissionBill: (admissionId: string) => string | null;
  applyFinalBillDiscount: (admissionId: string, amount: number, reason: string) => string | null;

  // Billing actions
  collectPayment: (invoiceId: string, amount: number, mode: PaymentMode, reference?: string) => Promise<void>;
  refundPayment: (invoiceId: string, amount: number, mode: PaymentMode, reason?: string, reference?: string) => void;
  createInvoice: (data: Omit<BillingInvoice, 'id'>) => string;
  createEstimate: (data: Omit<BillingEstimate, 'id' | 'status'>) => string;
  convertEstimateToInvoice: (estimateId: string) => string | null;

  // Observability
  getPatientWorkflowTimeline: (uhid: string) => WorkflowEvent[];
}

const HospitalContext = createContext<HospitalStore | null>(null);

/** Demo seed is for offline dev only — production platform runtime starts empty. */
const USE_PLATFORM_EMPTY_SEED = import.meta.env.VITE_PLATFORM_RUNTIME === 'true';

export function HospitalProvider({ children }: { children: ReactNode }) {
  const { platformConnected, user } = useAuth();
  const [patients, setPatients] = useState<HospitalPatient[]>(() =>
    USE_PLATFORM_EMPTY_SEED ? [] : SEED_PATIENTS,
  );
  const [appointments, setAppointments] = useState<HospitalAppointment[]>(() =>
    USE_PLATFORM_EMPTY_SEED ? [] : SEED_APPOINTMENTS,
  );
  const [queue, setQueue] = useState<QueueEntry[]>(() => (USE_PLATFORM_EMPTY_SEED ? [] : SEED_QUEUE));
  const [labOrders, setLabOrders] = useState<LabOrder[]>(SEED_LAB_ORDERS);
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>(SEED_PRESCRIPTIONS);
  const [pharmacyInventory, setPharmacyInventory] = useState<PharmacyInventoryItem[]>(SEED_PHARMACY_INVENTORY);
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>(SEED_RADIOLOGY);
  const [invoices, setInvoices] = useState<BillingInvoice[]>(SEED_INVOICES);
  const [estimates, setEstimates] = useState<BillingEstimate[]>(SEED_ESTIMATES);
  const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>(SEED_EMERGENCY_CASES);
  const [admissions, setAdmissions] = useState<AdmissionCase[]>(SEED_ADMISSIONS);
  const [nursingRounds, setNursingRounds] = useState<NursingRound[]>(SEED_NURSING_ROUNDS);
  const [doctorProgressNotes, setDoctorProgressNotes] = useState<DoctorProgressNote[]>(SEED_DOCTOR_PROGRESS_NOTES);
  const [admissionTasks, setAdmissionTasks] = useState<AdmissionTask[]>(SEED_ADMISSION_TASKS);
  const [inpatientCareOrders, setInpatientCareOrders] = useState<InpatientCareOrder[]>(SEED_INPATIENT_CARE_ORDERS);
  const [wardMedicineIssues, setWardMedicineIssues] = useState<WardMedicineIssue[]>(SEED_WARD_MEDICINE_ISSUES);
  const [otRecords, setOtRecords] = useState<OTSurgeryRecord[]>(SEED_OT_RECORDS);
  const [roomShiftHistory, setRoomShiftHistory] = useState<RoomShiftRecord[]>(SEED_ROOM_SHIFTS);
  const [departmentTransfers, setDepartmentTransfers] = useState<DepartmentTransferRecord[]>(SEED_DEPARTMENT_TRANSFERS);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(SEED_NOTIFICATION_LOGS);
  const [billingTransactions, setBillingTransactions] = useState<BillingTransaction[]>(SEED_BILLING_TRANSACTIONS);
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([]);

  const admissionsRef = useRef(admissions);
  const patientsRef = useRef(patients);
  const refreshQueueFromPlatformRef = useRef<() => Promise<void>>(async () => {});
  const lastQueueSyncErrorAtRef = useRef(0);
  useEffect(() => {
    admissionsRef.current = admissions;
  }, [admissions]);
  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);

  const pushWorkflowEvent = useCallback((event: Omit<WorkflowEvent, 'id' | 'timestamp'>) => {
    const platformEvent =
      event.platformEvent ?? mapWorkflowActionToPlatformEvent(event.module, event.action);
    const next: WorkflowEvent = {
      id: `WF-${workflowEventCounter++}`,
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      ...event,
      platformEvent,
    };
    setWorkflowEvents(prev => [next, ...prev].slice(0, 1000));

    if (platformEvent) {
      void emitPlatformEvent({
        event: platformEvent,
        module: event.module,
        uhid: event.uhid,
        refId: event.refId,
        details: { action: event.action, summary: event.details, patientName: event.patientName },
      });
    }
  }, []);

  const nowStamp = useCallback(() => {
    return new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const sendSmsNotification = useCallback((data: {
    recipientType: 'patient' | 'doctor';
    recipient: string;
    message: string;
    uhid?: string;
    admissionId?: string;
  }) => {
    const sentAt = nowStamp();
    const log: NotificationLog = {
      id: `NTF-${notificationCounter++}`,
      type: 'sms',
      recipientType: data.recipientType,
      recipient: data.recipient,
      message: data.message,
      sentAt,
      status: 'sent',
      uhid: data.uhid,
      admissionId: data.admissionId,
    };

    setNotificationLogs(prev => [log, ...prev]);
  }, [nowStamp]);

  const isAdmissionLocked = useCallback((admissionId: string) => {
    const admission = admissions.find(item => item.id === admissionId);
    return !!admission?.isIpLocked;
  }, [admissions]);

  const postServiceCharge = useCallback((input: ServiceChargeInput) => {
    let didPost = false;
    let postedInvoiceId = '';

    setInvoices(prev => {
      const activeAdmission = admissions.find(item => item.uhid === input.uhid && item.status !== 'discharged');
      const category: BillingInvoice['category'] = input.categoryOverride ?? (activeAdmission ? 'IPD' : 'OPD');
      const invoiceIndex = prev.findIndex(item => item.uhid === input.uhid && item.category === category && item.status !== 'paid');

      if (invoiceIndex >= 0) {
        const invoice = prev[invoiceIndex];
        if (invoice.items.some(item => item.description === input.description)) {
          return prev;
        }

        didPost = true;
        postedInvoiceId = invoice.id;
        const items = [...invoice.items, { description: input.description, amount: input.amount }];
        const total = items.reduce((sum, item) => sum + item.amount, 0);
        const next = [...prev];
        next[invoiceIndex] = { ...invoice, items, total, status: invoice.paid >= total ? 'paid' : invoice.paid > 0 ? 'partial' : 'pending' };
        return next;
      }

      didPost = true;
      postedInvoiceId = `INV-${invoiceCounter++}`;
      const invoice: BillingInvoice = {
        id: postedInvoiceId,
        uhid: input.uhid,
        patientName: input.patientName,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        category,
        items: [{ description: input.description, amount: input.amount }],
        total: input.amount,
        paid: 0,
        status: 'pending',
      };
      return [invoice, ...prev];
    });

    if (didPost) {
      pushWorkflowEvent({
        module: input.module,
        action: input.action,
        uhid: input.uhid,
        patientName: input.patientName,
        refId: postedInvoiceId || input.refId,
        details: `Charge posted: ${input.description} (₹${input.amount.toLocaleString('en-IN')})`,
      });
    }

    const category: BillingInvoice['category'] =
      input.categoryOverride ?? (admissions.find(a => a.uhid === input.uhid && a.status !== 'discharged') ? 'IPD' : 'OPD');

    if (canUseBillingRuntime() && category === 'OPD') {
      const patient = patients.find(p => p.uhid === input.uhid);
      if (patient?.platformOpdVisitId && patient.platformPatientId) {
        void (async () => {
          try {
            const idempotencyKey =
              input.idempotencyKey ??
              buildChargeIdempotencyKey({
                module: input.module,
                action: input.action,
                refId: input.refId,
                description: input.description,
              });
            const { invoice, duplicate } = await platformSyncCharge({
              opdVisitId: patient.platformOpdVisitId!,
              patientId: patient.platformPatientId!,
              idempotencyKey,
              description: input.description,
              amountCents: Math.round(input.amount * 100),
              chargeCode: input.chargeCode,
              sourceModule: input.module,
              sourceAction: input.action,
              sourceRefId: input.refId ?? postedInvoiceId,
              expectedVersion: patient.platformInvoiceVersion,
              corporatePayer: patient.category === 'corporate',
              insuranceMode:
                patient.category === 'insurance'
                  ? 'insurance'
                  : patient.category === 'corporate'
                    ? 'corporate'
                    : 'self',
            });
            if (!duplicate) {
              setPatients(prev =>
                prev.map(p =>
                  p.uhid === input.uhid
                    ? {
                        ...p,
                        platformInvoiceId: invoice.id,
                        platformInvoiceVersion: invoice.version,
                      }
                    : p,
                ),
              );
              setInvoices(prev =>
                prev.map(inv =>
                  inv.id === postedInvoiceId
                    ? {
                        ...inv,
                        platformInvoiceId: invoice.id,
                        platformInvoiceVersion: invoice.version,
                        total: invoice.amountCents / 100,
                      }
                    : inv,
                ),
              );
            }
          } catch (err) {
            toast.error('Live invoice sync failed', {
              description: err instanceof Error ? err.message : undefined,
            });
          }
        })();
      }
    }

    if (canUseIpdBillingRuntime() && category === 'IPD') {
      const activeAdmission = admissions.find(
        (a) => a.uhid === input.uhid && a.status !== 'discharged',
      );
      const patient = patients.find((p) => p.uhid === input.uhid);
      if (activeAdmission?.platformAdmissionId && patient?.platformPatientId) {
        void (async () => {
          try {
            const idempotencyKey =
              input.idempotencyKey
              ?? buildChargeIdempotencyKey({
                module: input.module,
                action: input.action,
                refId: input.refId,
                description: input.description,
              });
            const { invoice, duplicate } = await platformSyncIpdCharge({
              admissionId: activeAdmission.platformAdmissionId!,
              patientId: patient.platformPatientId!,
              idempotencyKey,
              description: input.description,
              amountCents: Math.round(input.amount * 100),
              chargeCode: input.chargeCode,
              sourceModule: input.module,
              sourceAction: input.action,
              sourceRefId: input.refId ?? postedInvoiceId,
              expectedVersion: activeAdmission.platformInvoiceVersion,
              corporatePayer: patient.category === 'corporate',
              insuranceMode:
                patient.category === 'insurance'
                  ? 'insurance'
                  : patient.category === 'corporate'
                    ? 'corporate'
                    : 'self',
            });
            if (!duplicate) {
              setAdmissions((prev) =>
                prev.map((a) =>
                  a.id === activeAdmission.id
                    ? {
                        ...a,
                        platformInvoiceId: invoice.id,
                        platformInvoiceVersion: invoice.version,
                      }
                    : a,
                ),
              );
              setInvoices((prev) =>
                prev.map((inv) =>
                  inv.id === postedInvoiceId
                    ? {
                        ...inv,
                        platformInvoiceId: invoice.id,
                        platformInvoiceVersion: invoice.version,
                        total: invoice.amountCents / 100,
                      }
                    : inv,
                ),
              );
            }
          } catch (err) {
            const body = err instanceof PlatformApiError ? err.body : undefined;
            toast.error('Live IPD invoice sync failed', {
              description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
            });
          }
        })();
      }
    }
  }, [admissions, patients, pushWorkflowEvent]);

  const registerPatient = useCallback((data: Omit<HospitalPatient, 'uhid' | 'registeredOn'>) => {
    const uhid = `UHID-${patientCounter++}`;
    const patient: HospitalPatient = {
      ...data,
      uhid,
      registeredOn: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    setPatients(prev => [patient, ...prev]);
    pushWorkflowEvent({
      module: 'reception',
      action: 'patient_registered',
      uhid,
      patientName: patient.name,
      refId: uhid,
      details: `Patient ${patient.name} registered under ${patient.patientType}`,
    });
    toast.success(`Patient registered: ${patient.name}`, { description: `UHID: ${uhid}` });

    if (canUseOpdRuntime() && data.patientType === 'OPD') {
      void (async () => {
        try {
          const { visit, patientId } = await platformRegisterOpdPatient({
            fullName: patient.name,
            mrn: uhid,
            department: patient.department,
            assignedDoctor: patient.assignedDoctor,
            actorRole: 'receptionist',
          });
          setPatients(prev =>
            prev.map(p =>
              p.uhid === uhid
                ? {
                    ...p,
                    platformPatientId: patientId,
                    platformOpdVisitId: visit.id,
                    opdState: visit.state,
                  }
                : p,
            ),
          );
          await platformRecordMetering(['opd.registration'], visit.id);
          await platformKernelAudit('opd.register_patient', `opd_visit:${visit.id}`, { uhid });
        } catch (err) {
          toast.error('Platform registration failed', {
            description: err instanceof Error ? err.message : 'Using local context only',
          });
        }
      })();
    }

    return uhid;
  }, [pushWorkflowEvent]);

  const refreshPatientsFromPlatform = useCallback(async (query?: string) => {
    if (!isPlatformAuthoritative()) return;
    try {
      const mapped = await fetchMappedPatientsFromPlatform(query);
      if (mapped === null) return;
      setPatients(prev => mergePatientsFromPlatform(prev, mapped));
    } catch {
      /* keep last merged snapshot */
    }
  }, []);

  const backfillPlatformPatientId = useCallback(async (uhid: string): Promise<string | undefined> => {
    const patient = patients.find(p => p.uhid === uhid);
    if (!patient) return undefined;
    if (patient.platformPatientId) return patient.platformPatientId;
    if (!isPlatformAuthoritative()) return undefined;

    try {
      const mapped = await fetchMappedPatientsFromPlatform(patient.uhid);
      const match =
        mapped?.find(row => row.uhid === patient.uhid)
        ?? mapped?.find(
          row => row.name?.toLowerCase() === patient.name.toLowerCase(),
        );
      if (match?.platformPatientId) {
        setPatients(prev =>
          prev.map(p =>
            p.uhid === uhid ? { ...p, platformPatientId: match.platformPatientId } : p,
          ),
        );
        return match.platformPatientId;
      }
    } catch {
      /* fall through to register-on-use paths */
    }
    return undefined;
  }, [patients]);

  const startFrontDeskVisit = useCallback((data: {
    patient: Omit<HospitalPatient, 'uhid' | 'registeredOn'>;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentDuration?: number;
    appointmentType?: HospitalAppointment['type'];
    notes?: string;
    visitMetadata?: Record<string, unknown>;
    initialBillingItems?: { description: string; amount: number }[];
  }) => {
    const registeredOn = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const appointmentDate = data.appointmentDate ?? new Date().toISOString().split('T')[0];
    const appointmentTime = data.appointmentTime ?? new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const uhid = `UHID-${patientCounter++}`;
    const appointmentId = data.patient.department && data.patient.assignedDoctor ? `APT-${appointmentCounter++}` : null;
    const tokenNo = appointmentId ? tokenCounter++ : null;
    const invoiceId = data.initialBillingItems && data.initialBillingItems.length > 0 ? `INV-${invoiceCounter++}` : null;

    const patient: HospitalPatient = {
      ...data.patient,
      uhid,
      registeredOn,
      visitMetadata: data.visitMetadata ?? data.patient.visitMetadata,
    };

    setPatients(prev => [patient, ...prev]);
    pushWorkflowEvent({
      module: 'reception',
      action: 'front_desk_visit_started',
      uhid,
      patientName: patient.name,
      refId: appointmentId ?? uhid,
      details: `Front desk journey started for ${patient.patientType}`,
    });

    let admissionId: string | null = null;
    if (isAutoAdmissionJourney(patient.patientType)) {
      const placement = resolveAdmissionPlacement(patient);
      admissionId = admitPatient({
        uhid,
        patientName: patient.name,
        journeyType: patient.patientType,
        admissionSource: placement.source,
        ward: placement.ward,
        bed: `${placement.bedPrefix}-${String(admissionCounter).padStart(4, '0')}`,
        attendingDoctor: patient.assignedDoctor || 'Doctor On Call',
        assignedNurse: placement.assignedNurse,
        roundingDoctor: placement.roundingDoctor,
        nextDoctorRoundAt: placement.nextDoctorRoundAt,
        primaryDiagnosis: data.notes || `${patient.patientType} admission from reception`,
        nursingPriority: patient.patientType === 'ICU' || patient.patientType === 'Trauma'
          ? 'high'
          : patient.patientType === 'Maternity' || patient.patientType === 'Newborn'
            ? 'medium'
            : 'low',
        linkedMotherUhid: patient.patientType === 'Newborn' ? patient.abhaId : undefined,
        initialNursingRound: {
          nurse: placement.assignedNurse,
          shift: 'Morning',
          bp: '118/76',
          pulse: patient.patientType === 'ICU' ? 96 : 82,
          temp: patient.patientType === 'ICU' ? 99.2 : 98.4,
          spo2: patient.patientType === 'ICU' ? 94 : 98,
          painScore: patient.patientType === 'Trauma' ? 5 : 1,
          notes: `${patient.patientType} admission handoff from reception. ${placement.nextDoctorRoundAt ? `Doctor round planned at ${placement.nextDoctorRoundAt}.` : ''}`.trim(),
        },
      });
    }

    if (appointmentId) {
      const appointment: HospitalAppointment = {
        id: appointmentId,
        uhid,
        patientName: patient.name,
        phone: patient.phone,
        doctor: patient.assignedDoctor || 'Doctor On Call',
        department: patient.department || 'General Medicine',
        date: appointmentDate,
        time: appointmentTime,
        duration: data.appointmentDuration ?? 20,
        status: 'checked-in',
        type: data.appointmentType ?? 'new',
        notes: data.notes ?? 'Walk-in registration from reception',
      };

      const queueEntry: QueueEntry = {
        tokenNo: tokenNo || 0,
        uhid,
        patientName: patient.name,
        doctor: appointment.doctor,
        department: appointment.department,
        status: 'waiting',
        appointmentId,
        checkedInAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        complaint: appointment.notes,
      };

      setAppointments(prev => [appointment, ...prev]);
      if (!isPlatformAuthoritative()) {
        setQueue(prev => [...prev, queueEntry]);
      }
      pushWorkflowEvent({
        module: 'scheduling',
        action: 'appointment_checked_in',
        uhid,
        patientName: patient.name,
        refId: appointmentId,
        details: `Checked in with token #${tokenNo}`,
      });
    }

    if (invoiceId) {
      const items = data.initialBillingItems || [];
      const total = items.reduce((sum, item) => sum + item.amount, 0);
      const category: BillingInvoice['category'] =
        patient.patientType === 'Emergency' || patient.patientType === 'Trauma'
          ? 'Emergency'
          : patient.patientType === 'IPD' || patient.patientType === 'ICU' || patient.patientType === 'Maternity' || patient.patientType === 'Surgery' || patient.patientType === 'Newborn'
            ? 'IPD'
            : 'OPD';
      const invoice: BillingInvoice = {
        id: invoiceId,
        uhid,
        patientName: patient.name,
        date: registeredOn,
        category,
        items,
        total,
        paid: 0,
        status: 'pending',
      };

      setInvoices(prev => [invoice, ...prev]);
      pushWorkflowEvent({
        module: 'billing',
        action: 'invoice_created',
        uhid,
        patientName: patient.name,
        refId: invoiceId,
        details: `Initial ${category} invoice created at front desk`,
      });
    }

    if (admissionId) {
      pushWorkflowEvent({
        module: 'reception',
        action: 'auto_admitted',
        uhid,
        patientName: patient.name,
        refId: admissionId,
        details: `Auto-admission created from ${patient.patientType} registration`,
      });
    }

    if (patient.phone) {
      sendSmsNotification({
        recipientType: 'patient',
        recipient: patient.phone,
        message: `Welcome ${patient.name}. Your UHID is ${uhid}${admissionId ? ` and admission ID is ${admissionId}` : ''}.`,
        uhid,
        admissionId: admissionId ?? undefined,
      });
    }

    if (patient.assignedDoctor) {
      sendSmsNotification({
        recipientType: 'doctor',
        recipient: patient.assignedDoctor,
        message: `New patient ${patient.name} (${uhid}) registered${admissionId ? ` and admitted (${admissionId})` : ''}.`,
        uhid,
        admissionId: admissionId ?? undefined,
      });
    }

    toast.success('Front-desk visit started', {
      description: `${patient.name} is now registered${admissionId ? ' and admitted' : ''}${tokenNo ? ` and queued as token #${tokenNo}` : ''}.`,
    });

    if (canUseOpdRuntime() && patient.patientType === 'OPD') {
      void (async () => {
        try {
          const { visit, patientId } = await platformRegisterOpdPatient({
            fullName: patient.name,
            mrn: uhid,
            department: patient.department,
            assignedDoctor: patient.assignedDoctor,
            actorRole: 'receptionist',
          });
          setPatients((prev) =>
            prev.map((p) =>
              p.uhid === uhid
                ? {
                    ...p,
                    platformPatientId: patientId,
                    platformOpdVisitId: visit.id,
                    opdState: visit.state,
                  }
                : p,
            ),
          );

          let platformVisitId = visit.id;
          const shouldEnqueue =
            !!patient.department &&
            !!patient.assignedDoctor;

          if (shouldEnqueue) {
            const walkInStart = toAppointmentIso(appointmentDate, appointmentTime);
            const walkInEnd = new Date(
              Date.parse(walkInStart) + (data.appointmentDuration ?? 20) * 60_000,
            ).toISOString();
            const activeVisit = await platformEnqueueOpdVisitToBoard({
              visitId: visit.id,
              visitState: visit.state,
              department: patient.department || 'General Medicine',
              assignedDoctor: patient.assignedDoctor || 'Doctor On Call',
              complaint: data.notes,
              appointment: appointmentId
                ? {
                    startAt: walkInStart,
                    endAt: walkInEnd,
                    resourceLabel: `${patient.assignedDoctor || 'Doctor On Call'} — ${patient.department || 'General Medicine'}`,
                  }
                : undefined,
            });

            setPatients((prev) =>
              prev.map((p) =>
                p.uhid === uhid
                  ? { ...p, opdState: activeVisit.state, platformOpdVisitId: activeVisit.id }
                  : p,
              ),
            );

            if (activeVisit.appointmentId && appointmentId) {
              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === appointmentId
                    ? { ...a, platformAppointmentId: activeVisit.appointmentId! }
                    : a,
                ),
              );
            }

            if (activeVisit.tokenNumber && appointmentId && !isPlatformAuthoritative()) {
              setQueue((prev) =>
                prev.map((q) =>
                  q.appointmentId === appointmentId
                    ? {
                        ...q,
                        tokenNo: activeVisit.tokenNumber!,
                        platformOpdVisitId: activeVisit.id,
                      }
                    : q,
                ),
              );
            }

            platformVisitId = activeVisit.id;
            await refreshQueueFromPlatformRef.current();
            await refreshPatientsFromPlatform();
            if (activeVisit.tokenNumber) {
              toast.success('Added to live OPD queue', {
                description: `${patient.name} · token #${activeVisit.tokenNumber}`,
              });
            }
          } else {
            await platformRecordMetering(['opd.registration'], visit.id);
          }

          const navayuMeta = data.visitMetadata?.navayu as NavayuRegistrationMetadata | undefined;
          if (navayuMeta?.hearAboutNavayu) {
            try {
              await platformSaveNavayuRegistration(platformVisitId, navayuMeta);
              await maybeCreateNavayuCrmLead({
                fullName: patient.name,
                phone: patient.phone,
                platformPatientId: patientId,
                opdVisitId: platformVisitId,
                metadata: navayuMeta,
              });
            } catch {
              /* local visit metadata still available */
            }
          }
        } catch (err) {
          toast.error('Platform front-desk sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    }

    return {
      uhid,
      appointmentId,
      tokenNo,
      invoiceId,
      admissionId,
    };
  }, [pushWorkflowEvent, sendSmsNotification]);

  const admitPatient = useCallback((data: {
    uhid: string;
    patientName: string;
    journeyType: PatientJourneyType;
    admissionSource: AdmissionCase['admissionSource'];
    ward: string;
    room?: string;
    bed: string;
    attendingDoctor: string;
    assignedNurse?: string;
    roundingDoctor?: string;
    nextDoctorRoundAt?: string;
    primaryDiagnosis: string;
    nursingPriority?: AdmissionCase['nursingPriority'];
    linkedEmergencyId?: string;
    linkedMotherUhid?: string;
    platformPatientIdOverride?: string;
    platformOpdVisitIdOverride?: string;
    initialNursingRound?: {
      nurse: string;
      shift: NursingRound['shift'];
      bp: string;
      pulse: number;
      temp: number;
      spo2: number;
      painScore: number;
      notes: string;
    };
  }) => {
    const admissionId = `ADM-${admissionCounter++}`;
    const patientProfile = patients.find(item => item.uhid === data.uhid);
    const effectivePlatformPatientId = data.platformPatientIdOverride ?? patientProfile?.platformPatientId;
    const effectiveOpdVisitId = data.platformOpdVisitIdOverride ?? patientProfile?.platformOpdVisitId;
    const admission: AdmissionCase = {
      id: admissionId,
      uhid: data.uhid,
      patientName: data.patientName,
      journeyType: data.journeyType,
      admissionSource: data.admissionSource,
      ward: data.ward,
      department: patientProfile?.department || 'General Medicine',
      room: data.room,
      bed: data.bed,
      attendingDoctor: data.attendingDoctor,
      consultantDoctors: [data.attendingDoctor],
      assignedNurse: data.assignedNurse,
      roundingDoctor: data.roundingDoctor ?? data.attendingDoctor,
      nextDoctorRoundAt: data.nextDoctorRoundAt,
      primaryDiagnosis: data.primaryDiagnosis,
      currentTreatmentPlan: data.primaryDiagnosis,
      nursingPriority: data.nursingPriority ?? 'medium',
      doctorRoundStatus: 'pending',
      status: data.journeyType === 'ICU' ? 'icu' : data.journeyType === 'Surgery' ? 'ot' : 'admitted',
      billingStage: 'estimate',
      admittedAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      isIpLocked: false,
      linkedEmergencyId: data.linkedEmergencyId,
      linkedMotherUhid: data.linkedMotherUhid,
    };

    setAdmissions(prev => [admission, ...prev]);
    setPatients(prev => prev.map(p => p.uhid === data.uhid ? { ...p, patientType: data.journeyType } : p));
    pushWorkflowEvent({
      module: 'nurse',
      action: 'admission_created',
      uhid: data.uhid,
      patientName: data.patientName,
      refId: admissionId,
      details: `${data.journeyType} admitted to ${data.ward} · ${data.bed}`,
    });

    postServiceCharge({
      uhid: data.uhid,
      patientName: data.patientName,
      description: `Admission and bed allocation (${data.ward} · ${data.bed})`,
      amount: 1500,
      module: 'billing',
      action: 'admission_charge_posted',
      refId: admissionId,
      categoryOverride: 'IPD',
    });

    if (canUseIpdRuntime() && effectivePlatformPatientId) {
      void (async () => {
        try {
          const platform = await platformCreateAdmission({
            patientId: effectivePlatformPatientId,
            opdVisitId: effectiveOpdVisitId,
            ward: data.ward,
            attendingDoctor: data.attendingDoctor,
            admissionSource: data.admissionSource,
            primaryDiagnosis: data.primaryDiagnosis,
            externalRef: admissionId,
          });
          setAdmissions((prev) =>
            prev.map((a) =>
              a.id === admissionId
                ? { ...a, platformAdmissionId: platform.id, platformBedId: platform.bedId ?? undefined }
                : a,
            ),
          );
          await platformIpdTransition(platform.id, 'submit_for_approval', {
            patientIdentified: true,
            admissionReasonDocumented: true,
          });
          await platformIpdTransition(platform.id, 'approve_admission', {
            approvalGranted: true,
            depositOrPreauth: true,
          }, platform.version);
        } catch (err) {
          const body = err instanceof PlatformApiError ? err.body : undefined;
          toast.error('Platform admission sync failed', {
            description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
          });
        }
      })();
    }

    if (data.initialNursingRound) {
      const round: NursingRound = {
        id: `NR-${nursingRoundCounter++}`,
        admissionId,
        uhid: data.uhid,
        patientName: data.patientName,
        ward: data.ward,
        bed: data.bed,
        nurse: data.initialNursingRound.nurse,
        shift: data.initialNursingRound.shift,
        bp: data.initialNursingRound.bp,
        pulse: data.initialNursingRound.pulse,
        temp: data.initialNursingRound.temp,
        spo2: data.initialNursingRound.spo2,
        painScore: data.initialNursingRound.painScore,
        notes: data.initialNursingRound.notes,
        recordedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
      setNursingRounds(prev => [round, ...prev]);
      pushWorkflowEvent({
        module: 'nurse',
        action: 'initial_nursing_round_recorded',
        uhid: data.uhid,
        patientName: data.patientName,
        refId: round.id,
        details: `Initial round logged for admission ${admissionId}`,
      });
    }

    toast.success(`${data.patientName} admitted`, { description: `${data.ward} · ${data.bed}` });
    return admissionId;
  }, [patients, postServiceCharge, pushWorkflowEvent]);

  const transferOpdToIPD = useCallback((data: {
    uhid: string;
    patientName: string;
    attendingDoctor: string;
    department?: string;
    reason?: string;
    bedType?: 'General' | 'Semi-Private' | 'Private' | 'ICU';
    priority?: 'Routine' | 'Urgent' | 'Emergency';
    journeyType?: Exclude<PatientJourneyType, 'OPD' | 'Emergency'>;
    requestedBy?: string;
  }) => {
    const existingAdmission = admissions.find((item) => item.uhid === data.uhid && item.status !== 'discharged');
    if (existingAdmission) {
      toast.info(`${data.patientName} already has an active IPD admission`, {
        description: `${existingAdmission.ward} · ${existingAdmission.bed}`,
      });
      return {
        admissionId: existingAdmission.id,
        ward: existingAdmission.ward,
        bed: existingAdmission.bed,
      };
    }

    const patient = patients.find((item) => item.uhid === data.uhid);
    if (!patient) {
      throw new Error(`Patient not found: ${data.uhid}`);
    }

    const department = data.department || patient.department || 'General Medicine';
    const departmentPlan = DEPARTMENT_WARDS[department] ?? DEPARTMENT_WARDS['General Medicine'];

    const mappedJourneyType = data.journeyType ?? (
      data.bedType === 'ICU' || data.priority === 'Emergency' ? 'ICU' : 'IPD'
    );

    const ward = mappedJourneyType === 'ICU' ? 'ICU' : departmentPlan.ward;
    const bedPrefix = mappedJourneyType === 'ICU' ? 'ICU' : departmentPlan.bedPrefix;
    const bedNo = nextBedNumber(admissions, bedPrefix);
    const bed = `${bedPrefix}-${String(bedNo).padStart(2, '0')}`;
    const room = mappedJourneyType === 'ICU'
      ? `ICU Bay ${Math.max(1, Math.ceil(bedNo / 2))}`
      : `${ward} Room ${Math.max(1, Math.ceil(bedNo / 2))}`;

    const admissionId = admitPatient({
      uhid: data.uhid,
      patientName: data.patientName,
      journeyType: mappedJourneyType,
      admissionSource: 'OPD',
      ward,
      room,
      bed,
      attendingDoctor: data.attendingDoctor,
      assignedNurse: departmentPlan.nurse,
      roundingDoctor: data.attendingDoctor,
      nextDoctorRoundAt: departmentPlan.nextDoctorRoundAt,
      primaryDiagnosis: data.reason || 'Observation and inpatient care advised from OPD review',
      nursingPriority:
        data.priority === 'Emergency' ? 'high'
          : data.priority === 'Urgent' ? 'medium'
            : 'low',
      initialNursingRound: {
        nurse: departmentPlan.nurse,
        shift: 'Morning',
        bp: '120/80',
        pulse: 82,
        temp: 98.6,
        spo2: mappedJourneyType === 'ICU' ? 94 : 98,
        painScore: data.priority === 'Emergency' ? 5 : 2,
        notes: `OPD to IPD transfer initiated by ${data.requestedBy || data.attendingDoctor}. ${data.reason || 'Observation and inpatient monitoring required.'}`,
      },
    });

    setQueue(prev => prev.map((entry) => (
      entry.uhid === data.uhid && entry.status !== 'completed'
        ? { ...entry, status: 'completed' }
        : entry
    )));

    setAppointments(prev => prev.map((appointment) => (
      appointment.uhid === data.uhid && appointment.status !== 'completed' && appointment.status !== 'cancelled' && appointment.status !== 'no-show'
        ? { ...appointment, status: 'completed' }
        : appointment
    )));

    postServiceCharge({
      uhid: data.uhid,
      patientName: data.patientName,
      description: `OPD to IPD transfer coordination (${ward} · ${room} · ${bed})`,
      amount: 650,
      module: 'billing',
      action: 'opd_to_ipd_transfer_charge_posted',
      refId: admissionId,
      categoryOverride: 'IPD',
    });

    pushWorkflowEvent({
      module: 'doctor',
      action: 'opd_transferred_to_ipd',
      uhid: data.uhid,
      patientName: data.patientName,
      refId: admissionId,
      details: `OPD care escalated to IPD (${ward} · ${room} · ${bed}) by ${data.requestedBy || data.attendingDoctor}`,
    });

    toast.success('OPD patient transferred to IPD', {
      description: `${data.patientName} · ${ward} · ${bed}`,
    });

    if (patient.phone) {
      sendSmsNotification({
        recipientType: 'patient',
        recipient: patient.phone,
        message: `${data.patientName}, your care has been shifted from OPD to IPD (${ward}, ${bed}).`,
        uhid: data.uhid,
        admissionId,
      });
    }

    sendSmsNotification({
      recipientType: 'doctor',
      recipient: data.attendingDoctor,
      message: `IPD transfer alert: ${data.patientName} (${data.uhid}) admitted to ${ward} ${bed}.`,
      uhid: data.uhid,
      admissionId,
    });

    return { admissionId, ward, bed };
  }, [admissions, admitPatient, patients, postServiceCharge, pushWorkflowEvent, sendSmsNotification]);

  const convertOpdToIPDByUHID = useCallback((data: {
    uhid: string;
    attendingDoctor?: string;
    reason?: string;
    bedType?: 'General' | 'Semi-Private' | 'Private' | 'ICU';
    priority?: 'Routine' | 'Urgent' | 'Emergency';
    requestedBy?: string;
  }) => {
    const patient = patients.find(item => item.uhid === data.uhid);
    if (!patient) {
      throw new Error(`Patient not found: ${data.uhid}`);
    }

    return transferOpdToIPD({
      uhid: patient.uhid,
      patientName: patient.name,
      attendingDoctor: data.attendingDoctor || patient.assignedDoctor || 'Doctor On Call',
      department: patient.department,
      reason: data.reason,
      bedType: data.bedType,
      priority: data.priority,
      requestedBy: data.requestedBy,
    });
  }, [patients, transferOpdToIPD]);

  const bookAppointment = useCallback((data: Omit<HospitalAppointment, 'id'>) => {
    const id = `APT-${appointmentCounter++}`;
    setAppointments(prev => [{ ...data, id }, ...prev]);
    toast.success(`Appointment booked: ${data.patientName}`, { description: `${id} · ${data.doctor} · ${data.time}` });

    const patient = patients.find(p => p.uhid === data.uhid);
    const todayYmd = new Date().toISOString().split('T')[0];
    const isSameDay = data.date === todayYmd;

    const autoEnqueueSameDayVisit = async (
      visitId: string,
      visitState: string,
      platformAppointmentId?: string,
    ) => {
      if (!isSameDay || !canUseOpdRuntime() || !data.department || !data.doctor) return;

      const startAt = toAppointmentIso(data.date, data.time);
      const endAt = new Date(Date.parse(startAt) + data.duration * 60_000).toISOString();
      const activeVisit = await platformEnqueueOpdVisitToBoard({
        visitId,
        visitState,
        department: data.department,
        assignedDoctor: data.doctor,
        complaint: data.notes,
        appointment: {
          startAt,
          endAt,
          resourceLabel: `${data.doctor} — ${data.department}`,
          platformAppointmentId,
        },
      });

      setPatients(prev =>
        prev.map(p =>
          p.uhid === data.uhid
            ? { ...p, opdState: activeVisit.state, platformOpdVisitId: activeVisit.id }
            : p,
        ),
      );
      setAppointments(prev =>
        prev.map(a =>
          a.id === id
            ? {
                ...a,
                status: 'checked-in',
                platformAppointmentId: platformAppointmentId ?? activeVisit.appointmentId ?? a.platformAppointmentId,
              }
            : a,
        ),
      );
      await refreshQueueFromPlatformRef.current();
    };

    if (canUseSchedulingRuntime() && patient?.platformPatientId) {
      void (async () => {
        try {
          const startAt = toAppointmentIso(data.date, data.time);
          const endAt = new Date(Date.parse(startAt) + data.duration * 60_000).toISOString();
          const booked = await platformBookAppointment({
            patientId: patient.platformPatientId!,
            startAt,
            endAt,
            resourceLabel: `${data.doctor} — ${data.department}`,
            status: 'scheduled',
          });
          setAppointments(prev =>
            prev.map(a =>
              a.id === id ? { ...a, platformAppointmentId: booked.id } : a,
            ),
          );
          await platformRecordMetering(['opd.appointment_booked'], booked.id);

          if (canUseOpdRuntime() && isSameDay) {
            const visit = await platformEnsureActiveOpdVisit({
              platformPatientId: patient.platformPatientId!,
              department: data.department,
              assignedDoctor: data.doctor,
            });
            await autoEnqueueSameDayVisit(visit.id, visit.state, booked.id);
          }
        } catch (err) {
          toast.error('Platform appointment sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    } else if (canUseOpdRuntime() && patient?.platformOpdVisitId) {
      void (async () => {
        try {
          const from = getClientOpdState(patient.opdState, 'registered');
          guardOpdTransition(from, 'schedule_or_walkin', 'receptionist', {
            departmentSelected: !!data.department,
            doctorOrPoolAssigned: !!data.doctor,
          });
          const { visit } = await platformOpdTransition(
            patient.platformOpdVisitId!,
            'schedule_or_walkin',
            { departmentSelected: true, doctorOrPoolAssigned: true },
            {
              appointment: {
                startAt: toAppointmentIso(data.date, data.time),
                endAt: new Date(
                  Date.parse(toAppointmentIso(data.date, data.time)) + data.duration * 60_000,
                ).toISOString(),
                resourceLabel: `${data.doctor} — ${data.department}`,
              },
            },
          );
          setPatients(prev =>
            prev.map(p => (p.uhid === data.uhid ? { ...p, opdState: visit.state } : p)),
          );
          const platformApptId = visit.appointmentId ?? undefined;
          if (visit.appointmentId) {
            setAppointments(prev =>
              prev.map(a =>
                a.id === id ? { ...a, platformAppointmentId: visit.appointmentId! } : a,
              ),
            );
          }
          await platformRecordMetering(['opd.appointment_booked'], visit.id);
          await autoEnqueueSameDayVisit(visit.id, visit.state, platformApptId);
        } catch (err) {
          toast.error('Platform appointment sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    } else if (canUseOpdRuntime() && patient && isSameDay && data.department && data.doctor) {
      void (async () => {
        try {
          const { visit, patientId } = await platformRegisterOpdPatient({
            fullName: patient.name,
            mrn: patient.uhid,
            department: data.department,
            assignedDoctor: data.doctor,
            actorRole: 'receptionist',
          });
          setPatients(prev =>
            prev.map(p =>
              p.uhid === data.uhid
                ? {
                    ...p,
                    platformPatientId: patientId,
                    platformOpdVisitId: visit.id,
                    opdState: visit.state,
                  }
                : p,
            ),
          );
          await autoEnqueueSameDayVisit(visit.id, visit.state);
        } catch (err) {
          toast.error('Platform appointment sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    } else if (canUseSchedulingRuntime() && patient && !patient.platformPatientId) {
      void (async () => {
        const platformPatientId = await backfillPlatformPatientId(patient.uhid);
        if (!platformPatientId) return;
        try {
          const startAt = toAppointmentIso(data.date, data.time);
          const endAt = new Date(Date.parse(startAt) + data.duration * 60_000).toISOString();
          const booked = await platformBookAppointment({
            patientId: platformPatientId,
            startAt,
            endAt,
            resourceLabel: `${data.doctor} — ${data.department}`,
            status: 'scheduled',
          });
          setAppointments(prev =>
            prev.map(a =>
              a.id === id ? { ...a, platformAppointmentId: booked.id } : a,
            ),
          );

          if (canUseOpdRuntime() && isSameDay) {
            const visit = await platformEnsureActiveOpdVisit({
              platformPatientId,
              department: data.department,
              assignedDoctor: data.doctor,
            });
            await autoEnqueueSameDayVisit(visit.id, visit.state, booked.id);
          }
        } catch (err) {
          toast.error('Platform appointment sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    }

    return id;
  }, [backfillPlatformPatientId, patients]);

  const updateAppointmentStatus = useCallback((id: string, status: HospitalAppointment['status']) => {
    const appt = appointments.find(a => a.id === id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));

    if (!appt || (!canUseSchedulingRuntime() && !canUseOpdRuntime())) return;

    const platformStatusMap: Partial<Record<HospitalAppointment['status'], 'cancelled' | 'completed' | 'no_show'>> = {
      cancelled: 'cancelled',
      completed: 'completed',
      'no-show': 'no_show',
    };
    const platformStatus = platformStatusMap[status];
    if (!platformStatus && status !== 'checked-in') return;

    void (async () => {
      try {
        const platformAppointmentId = appt.platformAppointmentId;
        if (platformAppointmentId && platformStatus) {
          await platformUpdateAppointmentStatus(platformAppointmentId, platformStatus);
          await platformRecordMetering(
            [platformStatus === 'cancelled' ? 'opd.appointment_cancelled' : 'opd.appointment_completed'],
            platformAppointmentId,
          );
        }

        const patient = patients.find(p => p.uhid === appt.uhid);
        if (patient?.platformOpdVisitId && canUseOpdRuntime()) {
          if (status === 'no-show') {
            await platformOpdTransition(patient.platformOpdVisitId, 'mark_no_show', {
              cancelReasonProvided: true,
            });
          } else if (status === 'cancelled') {
            await platformOpdTransition(patient.platformOpdVisitId, 'cancel_visit', {
              cancelReasonProvided: true,
            });
          }
        }
      } catch (err) {
        toast.error('Platform appointment status sync failed', {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    })();
  }, [appointments, patients]);

  const checkInPatient = useCallback((appointmentId: string, complaint?: string) => {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) return 0;

    const actorRole = 'receptionist';
    const patient = patients.find(p => p.uhid === appt.uhid);
    const opdFrom = getClientOpdState(patient?.opdState, 'appointment_or_walkin');

    try {
      guardOpdTransition(opdFrom, 'check_in', actorRole, {
        appointmentExistsOrWalkinAllowed: true,
        patientBalanceOk: true,
      });
      guardOpdTransition('checked_in', 'route_to_department', actorRole, {
        departmentSelected: !!appt.department,
        doctorOrPoolAssigned: !!appt.doctor,
      });
      guardOpdTransition('routed', 'issue_token', actorRole, {
        tokenNotDuplicateToday: true,
      });
    } catch {
      return 0;
    }

    const token = tokenCounter++;
    const entry: QueueEntry = {
      tokenNo: token,
      uhid: appt.uhid,
      patientName: appt.patientName,
      doctor: appt.doctor,
      department: appt.department,
      status: 'waiting',
      appointmentId,
      checkedInAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      complaint: complaint || appt.notes,
      platformOpdVisitId: patient?.platformOpdVisitId,
    };
    const platformAuthoritative = isPlatformAuthoritative();
    if (!platformAuthoritative) {
      setQueue(prev => [...prev, entry]);
    }
    updateAppointmentStatus(appointmentId, 'checked-in');
    pushWorkflowEvent({
      module: 'scheduling',
      action: 'appointment_checked_in',
      platformEvent: HospitalPlatformEvents.appointment.checkedIn,
      uhid: appt.uhid,
      patientName: appt.patientName,
      refId: appointmentId,
      details: `Checked in for ${appt.doctor}; token #${token}`,
    });
    pushWorkflowEvent({
      module: 'reception',
      action: 'token_issued',
      platformEvent: HospitalPlatformEvents.queue.tokenIssued,
      uhid: appt.uhid,
      patientName: appt.patientName,
      refId: String(token),
      details: `Queue token #${token} — ${appt.department}`,
    });
    toast.success(`Checked in: ${appt.patientName}`, { description: `Token #${token}` });

    if (canUseOpdRuntime() && patient) {
      void (async () => {
        try {
          let visitId = patient.platformOpdVisitId;
          let platformPatientId = patient.platformPatientId;

          if (!platformPatientId) {
            const reg = await platformRegisterOpdPatient({
              fullName: patient.name,
              mrn: patient.uhid,
              department: appt.department,
              assignedDoctor: appt.doctor,
              actorRole: 'receptionist',
            });
            platformPatientId = reg.patientId;
            visitId = reg.visit.id;
          } else if (!visitId) {
            const visit = await platformEnsureActiveOpdVisit({
              platformPatientId,
              department: appt.department,
              assignedDoctor: appt.doctor,
            });
            visitId = visit.id;
          }

          if (!visitId) return;

          let { visit } = await platformOpdTransition(
            visitId,
            'check_in',
            {
              appointmentExistsOrWalkinAllowed: true,
              patientBalanceOk: true,
            },
            appt.platformAppointmentId
              ? { appointmentId: appt.platformAppointmentId }
              : undefined,
          );
          ({ visit } = await platformOpdTransition(visit.id, 'route_to_department', {
            departmentSelected: true,
            doctorOrPoolAssigned: true,
          }, { department: appt.department, assignedDoctor: appt.doctor }));
          ({ visit } = await platformOpdTransition(visit.id, 'issue_token', {
            tokenNotDuplicateToday: true,
          }, { complaint }));
          setPatients(prev =>
            prev.map(p =>
              p.uhid === appt.uhid
                ? {
                    ...p,
                    opdState: visit.state,
                    platformOpdVisitId: visit.id,
                    platformPatientId,
                  }
                : p,
            ),
          );
          if (platformAuthoritative) {
            await refreshQueueFromPlatformRef.current();
          } else {
            setQueue(prev =>
              prev.map(q =>
                q.appointmentId === appointmentId
                  ? {
                      ...q,
                      tokenNo: visit.tokenNumber ?? q.tokenNo,
                      platformOpdVisitId: visit.id,
                    }
                  : q,
              ),
            );
          }
          await platformRecordMetering(
            ['opd.check_in', 'opd.department_routed', 'opd.token_issued'],
            visit.id,
          );
        } catch (err) {
          toast.error('Platform check-in sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    }

    return token;
  }, [appointments, patients, pushWorkflowEvent, updateAppointmentStatus]);

  const refreshQueueFromPlatform = useCallback(async () => {
    if (!canUseOpdRuntime()) return;
    const branchId = getPlatformSession()?.branchId ?? 'branch_main';
    try {
      const visits = await platformListOpdBoard(branchId);
      const currentPatients = patientsRef.current;
      setPatients((prev) =>
        prev.map((patient) => {
          if (!patient.platformPatientId) return patient;
          const visit = visits.find((v) => v.patientId === patient.platformPatientId);
          if (!visit) return patient;
          return {
            ...patient,
            opdState: visit.state,
            platformOpdVisitId: visit.id,
            department: visit.department ?? patient.department,
            assignedDoctor: visit.assignedDoctor ?? patient.assignedDoctor,
          };
        }),
      );
      setQueue(prev => {
        const prevByVisit = new Map(
          prev.filter(q => q.platformOpdVisitId).map(q => [q.platformOpdVisitId!, q]),
        );
        const boardEntries: QueueEntry[] = visits.map(v => {
          const pt = currentPatients.find(p => p.platformPatientId === v.patientId);
          const uhid = pt?.uhid ?? v.patient?.mrn ?? v.patientId;
          const prior = prevByVisit.get(v.id);
          const st = v.state;
          const platformWaiting = st === 'routed' || st === 'queued';
          const localStatus: QueueEntry['status'] =
            st === 'in_consultation' || st === 'orders_pending'
              ? 'in-consultation'
              : prior?.status === 'called' && platformWaiting
                ? 'called'
                : 'waiting';
          const boardSinceAt = v.createdAt ?? prior?.boardSinceAt;
          const waitMinutes =
            platformWaiting && boardSinceAt
              ? Math.max(0, Math.round((Date.now() - Date.parse(boardSinceAt)) / 60_000))
              : prior?.waitMinutes;
          const visitMeta =
            v.metadata && typeof v.metadata === 'object' && !Array.isArray(v.metadata)
              ? (v.metadata as Record<string, unknown>)
              : {};
          const mskLifecycleState =
            typeof visitMeta.mskLifecycleState === 'string'
              ? visitMeta.mskLifecycleState
              : prior?.mskLifecycleState;
          return {
            tokenNo: v.tokenNumber ?? prior?.tokenNo ?? 0,
            uhid,
            patientName: pt?.name ?? v.patient?.fullName ?? 'Unknown',
            doctor: v.assignedDoctor ?? prior?.doctor ?? 'Unassigned',
            department: v.department ?? prior?.department ?? 'General Medicine',
            status: localStatus,
            checkedInAt:
              prior?.checkedInAt ??
              new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
            complaint: prior?.complaint,
            platformOpdVisitId: v.id,
            appointmentId: prior?.appointmentId,
            boardSinceAt,
            waitMinutes,
            branchId: v.branchId,
            mskLifecycleState,
          };
        });
        const noPlatformLocal = prev.filter(q => !q.platformOpdVisitId);
        const merged = isPlatformAuthoritative()
          ? boardEntries
          : [...noPlatformLocal, ...boardEntries];
        return merged.sort((a, b) => a.tokenNo - b.tokenNo);
      });
    } catch (err) {
      const now = Date.now();
      if (now - lastQueueSyncErrorAtRef.current > 8000) {
        lastQueueSyncErrorAtRef.current = now;
        const body = err instanceof PlatformApiError ? err.body : undefined;
        toast.error('Queue sync failed', {
          description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : 'Could not load OPD board'),
        });
      }
    }
  }, []);

  useEffect(() => {
    refreshQueueFromPlatformRef.current = refreshQueueFromPlatform;
  }, [refreshQueueFromPlatform]);

  const updateQueueStatus = useCallback((tokenNo: number, status: QueueEntry['status']) => {
    const entry = queue.find(q => q.tokenNo === tokenNo);
    if (!isPlatformAuthoritative()) {
      setQueue(prev => prev.map(q => (q.tokenNo === tokenNo ? { ...q, status } : q)));
    }

    if (status === 'in-consultation' && entry) {
      const patient = patients.find(p => p.uhid === entry.uhid);
      if (canUseOpdRuntime() && patient?.platformOpdVisitId) {
        void (async () => {
          try {
            const { visit } = await platformOpdTransition(patient.platformOpdVisitId!, 'call_patient');
            setPatients(prev =>
              prev.map(p => (p.uhid === patient.uhid ? { ...p, opdState: visit.state } : p)),
            );
            await platformRecordMetering(['opd.consultation_started'], visit.id);
            if (isPlatformAuthoritative()) {
              await refreshQueueFromPlatform();
            } else {
              setQueue(prev => prev.map(q => (q.tokenNo === tokenNo ? { ...q, status } : q)));
            }
          } catch (err) {
            const body = err instanceof PlatformApiError ? err.body : undefined;
            toast.error('Platform rejected queue update', {
              description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
            });
          }
        })();
      }
    } else if (!isPlatformAuthoritative()) {
      setQueue(prev => prev.map(q => (q.tokenNo === tokenNo ? { ...q, status } : q)));
    }
  }, [queue, patients, refreshQueueFromPlatform]);

  const refreshAppointmentsFromPlatform = useCallback(async (from?: string, to?: string) => {
    if (!canUseSchedulingRuntime() && !canUseOpdRuntime()) return;
    const branchId = getPlatformSession()?.branchId ?? 'branch_main';
    const fromIso = from ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const toIso = to ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const mapped = await fetchMappedAppointmentsInRange(fromIso, toIso, patients, branchId);
      if (mapped === null) return;
      setAppointments(prev => mergeAppointmentsFromPlatform(prev, mapped));
    } catch {
      /* keep last merged snapshot */
    }
  }, [patients]);

  const refreshPlatformIpdSnapshots = useCallback(async () => {
    if (!canUseIpdRuntime()) return;
    const targets = admissionsRef.current.filter(
      (a) => a.platformAdmissionId && a.status !== 'discharged',
    );
    await Promise.all(
      targets.map(async (a) => {
        try {
          const detail = await platformGetIpdAdmissionDetail(a.platformAdmissionId!);
          const bedLabel = detail.bed?.label;
          const ward = detail.ward ?? undefined;
          const bed = bedLabel ?? undefined;
          const platformBedId = detail.bedId ?? detail.bed?.id ?? undefined;
          setAdmissions((prev) =>
            prev.map((item) =>
              item.id === a.id
                ? {
                    ...item,
                    ...(ward ? { ward } : {}),
                    ...(bed ? { bed } : {}),
                    ...(platformBedId ? { platformBedId } : {}),
                  }
                : item,
            ),
          );
        } catch {
          /* ignore per admission */
        }
      }),
    );
  }, []);

  const refreshDepartmentWorklistsFromPlatform = useCallback(async () => {
    if (!isPlatformAuthoritative()) return;
    try {
      const [labs, rads, rx] = await Promise.all([
        fetchMappedLabBranchWorklist(),
        fetchMappedRadiologyBranchWorklist(),
        fetchMappedPharmacyBranchWorklist(),
      ]);
      if (labs !== null) {
        setLabOrders(prev => mergeLabDepartmentWorklist(prev, labs));
      }
      if (rads !== null) {
        setRadiologyOrders(prev => mergeRadiologyDepartmentWorklist(prev, rads));
      }
      if (rx !== null) {
        setPrescriptions(prev => mergePharmacyDepartmentWorklist(prev, rx));
      }
    } catch {
      /* keep last merged snapshot */
    }
  }, []);

  useEffect(() => {
    if (!platformConnected || !user || !isPlatformAuthoritative()) return;
    void refreshPatientsFromPlatform();
    void refreshAppointmentsFromPlatform();
    void refreshDepartmentWorklistsFromPlatform();
    void refreshPlatformIpdSnapshots();
    void refreshQueueFromPlatform();
  }, [
    platformConnected,
    user?.id,
    user?.role,
    refreshPatientsFromPlatform,
    refreshAppointmentsFromPlatform,
    refreshDepartmentWorklistsFromPlatform,
    refreshPlatformIpdSnapshots,
    refreshQueueFromPlatform,
  ]);

  const nextQueuePatient = useCallback((doctor: string) => {
    let nextUhid: string | undefined;
    setQueue(prev => {
      const updated = [...prev];
      const currentIdx = updated.findIndex(q => q.doctor === doctor && q.status === 'in-consultation');
      if (currentIdx >= 0) updated[currentIdx].status = 'completed';
      const nextIdx = updated.findIndex(q => q.doctor === doctor && q.status === 'waiting');
      if (nextIdx >= 0) {
        updated[nextIdx].status = 'in-consultation';
        nextUhid = updated[nextIdx].uhid;
      }
      return updated;
    });

    if (nextUhid && canUseOpdRuntime()) {
      const patient = patients.find(p => p.uhid === nextUhid);
      if (patient?.platformOpdVisitId) {
        void (async () => {
          try {
            guardOpdTransition(getClientOpdState(patient.opdState, 'queued'), 'call_patient', 'doctor');
            const { visit } = await platformOpdTransition(patient.platformOpdVisitId!, 'call_patient');
            setPatients(prev =>
              prev.map(p => (p.uhid === nextUhid ? { ...p, opdState: visit.state } : p)),
            );
            await platformRecordMetering(['opd.consultation_started'], visit.id);
            if (isPlatformAuthoritative()) {
              await refreshQueueFromPlatform();
            }
          } catch (err) {
            toast.error('Platform queue call failed', {
              description: err instanceof Error ? err.message : undefined,
            });
          }
        })();
      }
    }
  }, [patients, refreshQueueFromPlatform]);

  const saveConsultation = useCallback(async (data: {
    uhid: string; patientName: string; doctor: string; department: string;
    labTests?: { tests: string; category: string; priority: 'Routine' | 'Urgent' | 'Emergency' }[];
    medications?: { drug: string; dosage: string; frequency: string; duration: string; route: string; qty: number }[];
    radiologyOrders?: { study: string; modality: string; priority: 'Routine' | 'Urgent' | 'Emergency' }[];
    consultationFee?: number;
  }): Promise<boolean> => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    let platformOrderSyncFailed = false;
    const patientForVisit = patients.find(p => p.uhid === data.uhid);
    let platformVisitEncounterId: string | undefined;
    if (canUseOpdRuntime() && patientForVisit?.platformOpdVisitId) {
      try {
        const activeVisit = await platformGetOpdVisit(patientForVisit.platformOpdVisitId);
        platformVisitEncounterId = activeVisit.encounterId ?? undefined;
      } catch {
        /* encounter linkage optional; server resolves from visit */
      }
    }

    // Create lab orders
    if (data.labTests && data.labTests.length > 0) {
      const newLabOrders: LabOrder[] = data.labTests.map(t => ({
        orderId: `LO-${labOrderCounter++}`,
        sampleId: `S-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`,
        uhid: data.uhid,
        patientName: data.patientName,
        tests: t.tests,
        category: t.category,
        priority: t.priority,
        doctor: data.doctor,
        orderTime: now,
        stage: 'Pending Analysis' as const,
        sampleStatus: 'Ordered' as const,
        specimenType: 'Blood',
        methodName: 'Automated analyzer',
      }));
      setLabOrders(prev => [...newLabOrders, ...prev]);
      newLabOrders.forEach(order => {
        pushWorkflowEvent({
          module: 'lab',
          action: 'lab_order_created',
          uhid: order.uhid,
          patientName: order.patientName,
          refId: order.orderId,
          details: `${order.tests} ordered by ${order.doctor}`,
        });
      });

      const patientForLab = patients.find(p => p.uhid === data.uhid);
      if (
        canUseLabRuntime() &&
        patientForLab?.platformPatientId &&
        patientForLab.platformOpdVisitId
      ) {
        try {
          for (let i = 0; i < newLabOrders.length; i++) {
            const local = newLabOrders[i];
            const test = data.labTests![i];
            const { order } = await platformCreateLabOrder({
              patientId: patientForLab.platformPatientId!,
              opdVisitId: patientForLab.platformOpdVisitId,
              encounterId: platformVisitEncounterId,
              externalRef: local.orderId,
              tests: test.tests,
              category: test.category,
              priority: test.priority,
              orderingDoctor: data.doctor,
              amountCents: 50_000,
              syncBilling: true,
            });
            setLabOrders(prev =>
              prev.map(o =>
                o.orderId === local.orderId
                  ? { ...o, platformLabOrderId: order.id, sampleId: order.sampleId ?? o.sampleId }
                  : o,
              ),
            );
          }
        } catch (err) {
          platformOrderSyncFailed = true;
          toast.error('Platform lab order sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      }
    }

    // Create prescriptions
    if (data.medications && data.medications.length > 0) {
      const medicationStartAt = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const rx: PrescriptionOrder = {
        id: `RX-${rxCounter++}`,
        uhid: data.uhid,
        patientName: data.patientName,
        doctor: data.doctor,
        department: data.department,
        date: new Date().toISOString().split('T')[0],
        priority: 'Routine',
        status: 'Pending',
        meds: data.medications.map(m => ({
          ...m,
          dispensed: 0,
          status: 'active',
          startAt: medicationStartAt,
        })),
      };
      setPrescriptions(prev => [rx, ...prev]);
      pushWorkflowEvent({
        module: 'pharmacy',
        action: 'prescription_created',
        uhid: rx.uhid,
        patientName: rx.patientName,
        refId: rx.id,
        details: `${rx.meds.length} medication line(s) prescribed`,
      });

      const patientForRx = patients.find(p => p.uhid === data.uhid);
      if (
        canUsePharmacyRuntime() &&
        patientForRx?.platformPatientId &&
        patientForRx.platformOpdVisitId
      ) {
        try {
          const { fulfillment } = await platformCreatePrescription({
            patientId: patientForRx.platformPatientId!,
            opdVisitId: patientForRx.platformOpdVisitId,
            encounterId: platformVisitEncounterId,
            externalRef: rx.id,
            prescribingDoctor: data.doctor,
            department: data.department,
            priority: rx.priority,
            medications: rx.meds.map(m => ({
              drug: m.drug,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              route: m.route,
              qty: m.qty,
              isControlled: isControlledDrug(m.drug),
            })),
          });
          setPrescriptions(prev =>
            prev.map(p =>
              p.id === rx.id ? { ...p, platformFulfillmentId: fulfillment.id } : p,
            ),
          );
        } catch (err) {
          platformOrderSyncFailed = true;
          toast.error('Platform prescription sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      }
    }

    // Create radiology orders
    if (data.radiologyOrders && data.radiologyOrders.length > 0) {
      const newRads: RadiologyOrder[] = data.radiologyOrders.map(r => ({
        orderId: `RD-${radiologyCounter++}`,
        uhid: data.uhid,
        patientName: data.patientName,
        study: r.study,
        bodyPart: r.study,
        modality: r.modality,
        priority: r.priority,
        doctor: data.doctor,
        orderTime: now,
        status: 'Ordered' as const,
        clinicalHistory: `Ordered during consultation by ${data.doctor}`,
      }));
      setRadiologyOrders(prev => [...newRads, ...prev]);
      newRads.forEach(order => {
        pushWorkflowEvent({
          module: 'radiology',
          action: 'radiology_order_created',
          uhid: order.uhid,
          patientName: order.patientName,
          refId: order.orderId,
          details: `${order.study} requested`,
        });
      });

      const patientForRad = patients.find(p => p.uhid === data.uhid);
      if (
        canUseRadiologyRuntime() &&
        patientForRad?.platformPatientId &&
        patientForRad.platformOpdVisitId
      ) {
        for (const local of newRads) {
          try {
            const { order } = await platformCreateRadiologyOrder({
              patientId: patientForRad.platformPatientId!,
              opdVisitId: patientForRad.platformOpdVisitId,
              encounterId: platformVisitEncounterId,
              externalRef: local.orderId,
              study: local.study,
              modality: local.modality,
              priority: local.priority,
              orderingDoctor: data.doctor,
              amountCents: 75_000,
              syncBilling: true,
            });
            setRadiologyOrders(prev =>
              prev.map(o =>
                o.orderId === local.orderId
                  ? { ...o, platformRadiologyOrderId: order.id }
                  : o,
              ),
            );
          } catch (err) {
            platformOrderSyncFailed = true;
            toast.error('Platform radiology order sync failed', {
              description: err instanceof Error ? err.message : undefined,
            });
            break;
          }
        }
      }
    }

    if (platformOrderSyncFailed && isPlatformAuthoritative()) {
      return false;
    }

    // Post billing lines into running patient invoice (OPD/IPD decided automatically)
    if (data.consultationFee) {
      const patientForFee = patients.find(p => p.uhid === data.uhid);
      postServiceCharge({
        uhid: data.uhid,
        patientName: data.patientName,
        description: `Consultation - ${data.department} (${data.doctor})`,
        amount: data.consultationFee,
        module: 'billing',
        action: 'consultation_charge_posted',
        idempotencyKey: buildChargeIdempotencyKey({
          module: 'billing',
          action: 'consultation_charge_posted',
          refId: patientForFee?.platformOpdVisitId ?? data.uhid,
          description: `Consultation - ${data.department} (${data.doctor})`,
        }),
      });
    }

    const patientForCharges = patients.find(p => p.uhid === data.uhid);
    const labBillingOnPlatform =
      canUseLabRuntime() &&
      !!patientForCharges?.platformOpdVisitId &&
      !!patientForCharges?.platformPatientId;

    if (data.labTests && data.labTests.length > 0 && !labBillingOnPlatform) {
      data.labTests.forEach((test) => {
        postServiceCharge({
          uhid: data.uhid,
          patientName: data.patientName,
          description: `Lab order - ${test.tests}`,
          amount: 500,
          module: 'lab',
          action: 'lab_charge_posted',
          idempotencyKey: `lab:local:${test.tests}`,
        });
      });
    }

    const radiologyBillingOnPlatform =
      canUseRadiologyRuntime() &&
      !!patientForCharges?.platformOpdVisitId &&
      !!patientForCharges?.platformPatientId;

    if (data.radiologyOrders && data.radiologyOrders.length > 0 && !radiologyBillingOnPlatform) {
      data.radiologyOrders.forEach((order) => {
        postServiceCharge({
          uhid: data.uhid,
          patientName: data.patientName,
          description: `Radiology order - ${order.study}`,
          amount: 1000,
          module: 'radiology',
          action: 'radiology_charge_posted',
          idempotencyKey: `radiology:local:${order.study}`,
        });
      });
    }

    // Update patient's last visit
    setPatients(prev => prev.map(p => p.uhid === data.uhid ? { ...p, lastVisit: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } : p));

    const patient = patients.find(p => p.uhid === data.uhid);
    if (canUseOpdRuntime() && patient?.platformOpdVisitId) {
      try {
        const visitId = patient.platformOpdVisitId!;
        let { visit } = { visit: await platformGetOpdVisit(visitId) };

        if (visit.state === 'queued') {
          ({ visit } = await platformOpdTransition(visitId, 'call_patient'));
        }

        if (visit.state === 'in_consultation') {
          await platformOpdTransition(visitId, 'save_clinical_note', {
            clinicalNotePresent: true,
          });
          ({ visit } = await platformOpdTransition(visitId, 'complete_consultation', {
            clinicalNotePresent: true,
            diagnosisCoded: true,
          }));
        }

        const hasClinicalOrders =
          !!(data.labTests?.length || data.radiologyOrders?.length || data.medications?.length);
        if (hasClinicalOrders && visit.state === 'orders_pending') {
          ({ visit } = await platformOpdTransition(visit.id, 'place_orders', {
            encounterOpen: true,
          }));
        }

        const labCtx: OpdValidationContext = {};
        if (canUseLabRuntime()) {
          try {
            const live = await platformGetLiveLabState(visit.id);
            labCtx.criticalResultsAcknowledged = live.criticalCount === 0;
            labCtx.pendingMandatoryLabsComplete = !live.blockers.some(
              (b) => b.code === 'LAB_MANDATORY',
            );
            labCtx.criticalLabsAcknowledged = !live.blockers.some(
              (b) => b.code === 'LAB_CRITICAL_ACK',
            );
          } catch {
            /* server-side lab blocker enrichment when undefined */
          }
        }
        if (canUsePharmacyRuntime()) {
          try {
            const rxLive = await platformGetLivePharmacyState(visit.id);
            labCtx.pendingPharmacyFulfilledOrDeferred = !rxLive.blockers.some(
              (b) => b.code === 'PHARMACY_URGENT',
            );
            labCtx.controlledMedsApproved = rxLive.controlledPending === 0;
          } catch {
            /* server enriches pharmacy blockers */
          }
        }
        if (canUseRadiologyRuntime()) {
          try {
            const radLive = await platformGetLiveRadiologyState(visit.id);
            labCtx.pendingOrdersDeferredOrComplete = !radLive.blockers.some(
              (b) => b.code === 'RADIOLOGY_PENDING' || b.code === 'RADIOLOGY_MANDATORY',
            );
            if (labCtx.criticalResultsAcknowledged === undefined) {
              labCtx.criticalResultsAcknowledged = !radLive.blockers.some(
                (b) => b.code === 'RADIOLOGY_CRITICAL' || b.code === 'RADIOLOGY_CRITICAL_ACK',
              );
            } else {
              labCtx.criticalResultsAcknowledged =
                labCtx.criticalResultsAcknowledged &&
                !radLive.blockers.some(
                  (b) => b.code === 'RADIOLOGY_CRITICAL' || b.code === 'RADIOLOGY_CRITICAL_ACK',
                );
            }
          } catch {
            /* server enriches radiology blockers */
          }
        }

        const { visit: afterOrders } = await platformOpdTransition(
          visit.id,
          'fulfill_or_defer_orders',
          labCtx,
        );
        setPatients(prev =>
          prev.map(p =>
            p.uhid === data.uhid ? { ...p, opdState: afterOrders.state } : p,
          ),
        );
        await platformRecordMetering(['opd.consultation_completed', 'opd.orders_placed'], afterOrders.id);
      } catch (err) {
        const body = err instanceof PlatformApiError ? err.body : undefined;
        toast.error('OPD cannot advance — complete mandatory lab / pharmacy / billing steps', {
          description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
        });
        return false;
      }
    }

    // Complete queue entry (after governed platform transitions succeed when applicable)
    setQueue(prev => prev.map(q =>
      q.uhid === data.uhid && (q.status === 'waiting' || q.status === 'called' || q.status === 'in-consultation')
        ? { ...q, status: 'completed' as const }
        : q
    ));

    toast.success('Consultation saved', {
      description: `${data.labTests?.length || 0} lab orders, ${data.medications?.length || 0} medications, ${data.radiologyOrders?.length || 0} radiology orders created`,
    });
    return true;
  }, [patients, postServiceCharge, pushWorkflowEvent]);

  const updateLabStage = useCallback((orderId: string, stage: LabOrder['stage']) => {
    const current = labOrders.find(item => item.orderId === orderId);
    if (current?.platformLabState && isPlatformAuthoritative()) {
      const actorRole = getPlatformSession()?.role ?? 'lab_technician';
      guardLabUiStage(current.platformLabState, stage, actorRole);
    }
    setLabOrders(prev => prev.map(order => {
      if (order.orderId !== orderId) return order;

      const sampleStatus =
        stage === 'In Analysis' ? 'Processing'
        : stage === 'Awaiting Validation' ? 'Analysis Complete'
        : order.sampleStatus;

        const nextLabState =
          stage === 'Reported'
            ? 'published'
            : stage === 'Validated'
              ? 'approved'
              : stage === 'Awaiting Validation'
                ? 'awaiting_review'
                : stage === 'In Analysis'
                  ? 'in_processing'
                  : order.platformLabState;

        return {
        ...order,
        stage,
        platformLabState: nextLabState ?? order.platformLabState,
        sampleStatus,
        reportedAt: stage === 'Reported'
          ? new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : order.reportedAt,
      };
    }));
    if (current) {
      pushWorkflowEvent({
        module: 'lab',
        action: 'lab_stage_updated',
        uhid: current.uhid,
        patientName: current.patientName,
        refId: orderId,
        details: `Lab stage moved to ${stage}`,
      });
    }
    if (canUseLabRuntime() && current?.platformLabOrderId) {
      void (async () => {
        try {
          await platformApplyLabUiStage(
            current.platformLabOrderId!,
            stage,
            current.criticalAlert,
          );
          await refreshDepartmentWorklistsFromPlatform();
        } catch (err) {
          toast.error('Platform lab stage sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    }
    toast.success(`Lab order ${orderId} updated to ${stage}`);
  }, [labOrders, pushWorkflowEvent, refreshDepartmentWorklistsFromPlatform]);

  const updateLabOrder = useCallback((orderId: string, patch: Partial<LabOrder>) => {
    setLabOrders(prev => prev.map(order => order.orderId === orderId ? { ...order, ...patch } : order));
    const order = labOrders.find(item => item.orderId === orderId);
    if (order) {
      pushWorkflowEvent({
        module: 'lab',
        action: 'lab_order_updated',
        uhid: order.uhid,
        patientName: order.patientName,
        refId: orderId,
        details: `Lab metadata updated: ${Object.keys(patch).join(', ') || 'no fields'}`,
      });
    }
  }, [labOrders, pushWorkflowEvent]);

  const updateMedicationLineStatus = useCallback((rxId: string, lineIndex: number, status: 'active' | 'stopped') => {
    const changedAt = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setPrescriptions(prev => prev.map((rx) => {
      if (rx.id !== rxId) {
        return rx;
      }

      return {
        ...rx,
        meds: rx.meds.map((med, idx) => {
          if (idx !== lineIndex) {
            return med;
          }

          return {
            ...med,
            status,
            startAt: status === 'active' ? (med.startAt || changedAt) : med.startAt,
            stopAt: status === 'stopped' ? changedAt : undefined,
          };
        }),
      };
    }));

    const rx = prescriptions.find((item) => item.id === rxId);
    const med = rx?.meds[lineIndex];
    if (rx && med) {
      pushWorkflowEvent({
        module: 'doctor',
        action: 'medication_line_status_updated',
        uhid: rx.uhid,
        patientName: rx.patientName,
        refId: rxId,
        details: `${med.drug} marked as ${status}`,
      });
    }

    toast.success('Medication chart updated', {
      description: status === 'active' ? 'Medication restarted' : 'Medication stopped',
    });
  }, [prescriptions, pushWorkflowEvent]);

  const dispensePrescription = useCallback((rxId: string, quantities: Record<number, number>) => {
    const rxBefore = prescriptions.find(item => item.id === rxId);
    setPrescriptions(prev => prev.map(rx => {
      if (rx.id !== rxId) return rx;
      const updatedMeds = rx.meds.map((m, i) => ({
        ...m,
        dispensed: m.dispensed + (quantities[i] || 0),
      }));
      const allDispensed = updatedMeds.every(m => m.dispensed >= m.qty);
      const someDispensed = updatedMeds.some(m => m.dispensed > 0);
      return {
        ...rx,
        meds: updatedMeds,
        status: allDispensed ? 'Dispensed' as const : someDispensed ? 'Partially dispensed' as const : rx.status,
      };
    }));

    const pharmacyBillingOnPlatform =
      canUsePharmacyRuntime() && !!rxBefore?.platformFulfillmentId;

    if (rxBefore && !pharmacyBillingOnPlatform) {
      const billedAmount = rxBefore.meds.reduce((sum, med, idx) => sum + ((quantities[idx] || 0) * 120), 0);
      if (billedAmount > 0) {
        const batchSummary = Object.entries(quantities)
          .filter(([, qty]) => qty > 0)
          .map(([idx, qty]) => `${rxBefore.meds[Number(idx)]?.drug || 'Medication'} x${qty}`)
          .join(', ');
        postServiceCharge({
          uhid: rxBefore.uhid,
          patientName: rxBefore.patientName,
          description: `Pharmacy dispense - ${batchSummary || rxId}`,
          amount: billedAmount,
          module: 'pharmacy',
          action: 'pharmacy_charge_posted',
          refId: rxId,
          idempotencyKey: `rx:dispense:${rxId}`,
        });
      }
    }

    if (pharmacyBillingOnPlatform && rxBefore?.platformFulfillmentId) {
      void (async () => {
        try {
          await platformDispensePrescription(rxBefore.platformFulfillmentId!, quantities);
          await refreshDepartmentWorklistsFromPlatform();
        } catch (err) {
          toast.error('Platform dispense sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    }

    toast.success(`Prescription ${rxId} dispensed`);
  }, [postServiceCharge, prescriptions, refreshDepartmentWorklistsFromPlatform]);

  const updatePrescriptionStatus = useCallback((rxId: string, status: PrescriptionOrder['status']) => {
    const rx = prescriptions.find(item => item.id === rxId);
    setPrescriptions(prev => prev.map(r => r.id === rxId ? { ...r, status } : r));
    if (canUsePharmacyRuntime() && rx?.platformFulfillmentId) {
      void (async () => {
        try {
          await platformApplyRxUiStatus(rx.platformFulfillmentId!, status);
          await refreshDepartmentWorklistsFromPlatform();
        } catch (err) {
          toast.error('Platform prescription status sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    }
    toast.success(`Prescription ${rxId} updated to ${status}`);
  }, [prescriptions, refreshDepartmentWorklistsFromPlatform]);

  const updateRadiologyOrder = useCallback((orderId: string, patch: Partial<RadiologyOrder>) => {
    setRadiologyOrders(prev => prev.map(order => order.orderId === orderId ? { ...order, ...patch } : order));
    const order = radiologyOrders.find(item => item.orderId === orderId);
    if (order) {
      pushWorkflowEvent({
        module: 'radiology',
        action: patch.status ? 'radiology_stage_updated' : 'radiology_order_updated',
        uhid: order.uhid,
        patientName: order.patientName,
        refId: orderId,
        details: patch.status ? `Radiology status changed to ${patch.status}` : 'Radiology metadata updated',
      });
    }
    if (canUseRadiologyRuntime() && order?.platformRadiologyOrderId && patch.status) {
      void (async () => {
        try {
          await platformApplyRadiologyUiStatus(
            order.platformRadiologyOrderId!,
            patch.status!,
            patch.critical,
          );
          await refreshDepartmentWorklistsFromPlatform();
        } catch (err) {
          toast.error('Platform radiology status sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    }
    if (patch.status) {
      toast.success(`Radiology order ${orderId} updated to ${patch.status}`);
    }
  }, [pushWorkflowEvent, radiologyOrders, refreshDepartmentWorklistsFromPlatform]);

  const addDailyServiceCharge = useCallback((data: {
    admissionId: string;
    description: string;
    amount: number;
    chargedBy: string;
    module?: WorkflowModule;
  }) => {
    const admission = admissions.find(item => item.id === data.admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${data.admissionId}`);
    }

    if (isAdmissionLocked(data.admissionId)) {
      toast.error('Admission is locked after discharge. Admin unlock required.');
      return;
    }

    postServiceCharge({
      uhid: admission.uhid,
      patientName: admission.patientName,
      description: data.description,
      amount: data.amount,
      module: data.module || 'billing',
      action: 'daily_service_charge_posted',
      refId: data.admissionId,
      categoryOverride: 'IPD',
    });

    pushWorkflowEvent({
      module: data.module || 'billing',
      action: 'daily_service_charge_added',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: data.admissionId,
      details: `${data.description} by ${data.chargedBy}`,
    });
  }, [admissions, isAdmissionLocked, postServiceCharge, pushWorkflowEvent]);

  const issueWardMedicine = useCallback((data: {
    admissionId: string;
    inventoryId: string;
    qty: number;
    issuedBy: string;
  }) => {
    const admission = admissions.find(item => item.id === data.admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${data.admissionId}`);
    }

    if (isAdmissionLocked(data.admissionId)) {
      throw new Error('Admission is locked after discharge. Admin unlock required.');
    }

    const inventoryItem = pharmacyInventory.find(item => item.id === data.inventoryId);
    if (!inventoryItem) {
      throw new Error(`Inventory item not found: ${data.inventoryId}`);
    }

    if (data.qty <= 0 || data.qty > inventoryItem.qty) {
      throw new Error('Insufficient stock for ward issue');
    }

    setPharmacyInventory(prev => prev.map(item => item.id === data.inventoryId ? {
      ...item,
      qty: item.qty - data.qty,
    } : item));

    const issueId = `WMI-${wardMedicineIssueCounter++}`;
    const issuedAt = nowStamp();
    const issue: WardMedicineIssue = {
      id: issueId,
      admissionId: data.admissionId,
      uhid: admission.uhid,
      patientName: admission.patientName,
      inventoryId: inventoryItem.id,
      drug: inventoryItem.drug,
      batch: inventoryItem.batch,
      expiry: inventoryItem.expiry,
      qty: data.qty,
      issuedBy: data.issuedBy,
      issuedAt,
      administrationStatus: 'issued',
    };

    setWardMedicineIssues(prev => [issue, ...prev]);

    postServiceCharge({
      uhid: admission.uhid,
      patientName: admission.patientName,
      description: `Ward medicine - ${inventoryItem.drug} (Batch ${inventoryItem.batch})`,
      amount: Number((inventoryItem.price * data.qty).toFixed(2)),
      module: 'pharmacy',
      action: 'ward_medicine_charge_posted',
      refId: issueId,
      categoryOverride: 'IPD',
    });

    pushWorkflowEvent({
      module: 'pharmacy',
      action: 'ward_medicine_issued',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: issueId,
      details: `${inventoryItem.drug} x${data.qty} issued by ${data.issuedBy}`,
    });

    return issueId;
  }, [admissions, isAdmissionLocked, nowStamp, pharmacyInventory, postServiceCharge, pushWorkflowEvent]);

  const updateWardMedicineIssueStatus = useCallback((issueId: string, status: WardMedicineIssue['administrationStatus']) => {
    setWardMedicineIssues(prev => prev.map(item => item.id === issueId ? {
      ...item,
      administrationStatus: status,
    } : item));

    const issue = wardMedicineIssues.find(item => item.id === issueId);
    if (issue) {
      pushWorkflowEvent({
        module: 'nurse',
        action: 'ward_medicine_issue_status_updated',
        uhid: issue.uhid,
        patientName: issue.patientName,
        refId: issueId,
        details: `${issue.drug} status moved to ${status}`,
      });
    }
  }, [pushWorkflowEvent, wardMedicineIssues]);

  const addInvestigationOrder = useCallback((data: {
    admissionId: string;
    tests: string;
    category: string;
    priority: 'Routine' | 'Urgent' | 'Emergency';
    doctor: string;
  }) => {
    const admission = admissions.find(item => item.id === data.admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${data.admissionId}`);
    }

    if (isAdmissionLocked(data.admissionId)) {
      throw new Error('Admission is locked after discharge. Admin unlock required.');
    }

    const orderId = `LO-${labOrderCounter++}`;
    const orderTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const order: LabOrder = {
      orderId,
      sampleId: `S-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`,
      uhid: admission.uhid,
      patientName: admission.patientName,
      tests: data.tests,
      category: data.category,
      priority: data.priority,
      doctor: data.doctor,
      orderTime,
      stage: 'Pending Analysis',
      sampleStatus: 'Ordered',
      specimenType: 'Blood',
      methodName: 'Automated analyzer',
    };

    setLabOrders(prev => [order, ...prev]);

    postServiceCharge({
      uhid: admission.uhid,
      patientName: admission.patientName,
      description: `Investigation - ${data.tests}`,
      amount: 500,
      module: 'lab',
      action: 'investigation_charge_posted',
      refId: orderId,
      categoryOverride: 'IPD',
    });

    pushWorkflowEvent({
      module: 'lab',
      action: 'investigation_order_created',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: orderId,
      details: `${data.tests} ordered (${data.priority})`,
    });

    return orderId;
  }, [admissions, isAdmissionLocked, postServiceCharge, pushWorkflowEvent]);

  const upsertOTRecord = useCallback((data: {
    admissionId: string;
    procedureName: string;
    surgeon: string;
    anesthetist?: string;
    preOperativeNotes?: string;
    postOperativeNotes?: string;
    status: OTSurgeryRecord['status'];
    scheduledAt?: string;
  }) => {
    const admission = admissions.find(item => item.id === data.admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${data.admissionId}`);
    }

    if (isAdmissionLocked(data.admissionId)) {
      throw new Error('Admission is locked after discharge. Admin unlock required.');
    }

    const existing = otRecords.find(item => item.admissionId === data.admissionId);
    const timestamp = nowStamp();

    if (existing) {
      const updated: OTSurgeryRecord = {
        ...existing,
        procedureName: data.procedureName || existing.procedureName,
        surgeon: data.surgeon || existing.surgeon,
        anesthetist: data.anesthetist ?? existing.anesthetist,
        preOperativeNotes: data.preOperativeNotes ?? existing.preOperativeNotes,
        postOperativeNotes: data.postOperativeNotes ?? existing.postOperativeNotes,
        status: data.status,
        scheduledAt: data.scheduledAt || existing.scheduledAt,
        updatedAt: timestamp,
      };

      setOtRecords(prev => prev.map(item => item.id === existing.id ? updated : item));
      setAdmissions(prev => prev.map(item => item.id === data.admissionId ? {
        ...item,
        status: data.status === 'completed' ? 'admitted' : 'ot',
      } : item));

      pushWorkflowEvent({
        module: 'ot',
        action: 'ot_record_updated',
        uhid: admission.uhid,
        patientName: admission.patientName,
        refId: existing.id,
        details: `OT record updated (${data.status})`,
      });

      return existing.id;
    }

    const otId = `OTR-${otRecordCounter++}`;
    const record: OTSurgeryRecord = {
      id: otId,
      admissionId: data.admissionId,
      uhid: admission.uhid,
      patientName: admission.patientName,
      procedureName: data.procedureName,
      surgeon: data.surgeon,
      anesthetist: data.anesthetist,
      preOperativeNotes: data.preOperativeNotes,
      postOperativeNotes: data.postOperativeNotes,
      status: data.status,
      scheduledAt: data.scheduledAt || timestamp,
      updatedAt: timestamp,
    };

    setOtRecords(prev => [record, ...prev]);
    setAdmissions(prev => prev.map(item => item.id === data.admissionId ? {
      ...item,
      status: data.status === 'completed' ? 'admitted' : 'ot',
    } : item));

    postServiceCharge({
      uhid: admission.uhid,
      patientName: admission.patientName,
      description: `OT procedure - ${data.procedureName}`,
      amount: 2500,
      module: 'ot',
      action: 'ot_charge_posted',
      refId: otId,
      categoryOverride: 'IPD',
    });

    pushWorkflowEvent({
      module: 'ot',
      action: 'ot_record_created',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: otId,
      details: `OT record created for ${data.procedureName}`,
    });

    return otId;
  }, [admissions, isAdmissionLocked, nowStamp, otRecords, postServiceCharge, pushWorkflowEvent]);

  const assignConsultantDoctor = useCallback((admissionId: string, consultantDoctor: string) => {
    const admission = admissions.find(item => item.id === admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    if (isAdmissionLocked(admissionId)) {
      toast.error('Admission is locked after discharge. Admin unlock required.');
      return;
    }

    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      consultantDoctors: Array.from(new Set([...(item.consultantDoctors || []), consultantDoctor])),
    } : item));

    pushWorkflowEvent({
      module: 'doctor',
      action: 'consultant_assigned',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: admissionId,
      details: `Consultant assigned: ${consultantDoctor}`,
    });
  }, [admissions, isAdmissionLocked, pushWorkflowEvent]);

  const transferAdmissionDepartment = useCallback((data: {
    admissionId: string;
    toDepartment: string;
    reason: string;
    transferredBy: string;
    newAttendingDoctor?: string;
  }) => {
    const admission = admissions.find(item => item.id === data.admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${data.admissionId}`);
    }

    if (isAdmissionLocked(data.admissionId)) {
      toast.error('Admission is locked after discharge. Admin unlock required.');
      return;
    }

    const patient = patients.find(item => item.uhid === admission.uhid);
    const fromDepartment = admission.department || patient?.department || 'General Medicine';
    const transferredAt = nowStamp();
    const transferId = `DPT-${departmentTransferCounter++}`;

    const transferRecord: DepartmentTransferRecord = {
      id: transferId,
      admissionId: data.admissionId,
      uhid: admission.uhid,
      patientName: admission.patientName,
      fromDepartment,
      toDepartment: data.toDepartment,
      reason: data.reason,
      transferredBy: data.transferredBy,
      transferredAt,
    };

    setDepartmentTransfers(prev => [transferRecord, ...prev]);
    setAdmissions(prev => prev.map(item => item.id === data.admissionId ? {
      ...item,
      department: data.toDepartment,
      attendingDoctor: data.newAttendingDoctor || item.attendingDoctor,
      roundingDoctor: data.newAttendingDoctor || item.roundingDoctor,
    } : item));
    setPatients(prev => prev.map(item => item.uhid === admission.uhid ? {
      ...item,
      department: data.toDepartment,
      assignedDoctor: data.newAttendingDoctor || item.assignedDoctor,
    } : item));

    pushWorkflowEvent({
      module: 'reception',
      action: 'admission_department_transferred',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: transferId,
      details: `${fromDepartment} -> ${data.toDepartment} by ${data.transferredBy}`,
    });
  }, [admissions, isAdmissionLocked, nowStamp, patients, pushWorkflowEvent]);

  const createEmergencyCase = useCallback((data: {
    patientName: string;
    age?: number;
    gender?: string;
    phone?: string;
    guardianName?: string;
    guardianPhone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    referralDoctor?: string;
    referralHospital?: string;
    mlcPoliceCase?: string;
    mlcReportingAuthority?: string;
    mlcIncidentDescription?: string;
    arrivalMode: EmergencyCase['arrivalMode'];
    complaint: string;
    vitals: string;
    mlcRequired?: boolean;
  }) => {
    const emergencyId = `ER-${emergencyCaseCounter++}`;
    const uhid = registerPatient({
      name: data.patientName,
      age: data.age ?? 30,
      gender: data.gender ?? 'M',
      phone: data.phone ?? `900000${Math.floor(Math.random() * 9000 + 1000)}`,
      category: data.mlcRequired ? 'government' : 'general',
      patientType: 'Emergency',
      department: 'Emergency',
      assignedDoctor: data.referralDoctor,
      branch: 'Main Hospital',
      isMLC: data.mlcRequired,
    });

    const emergencyCase: EmergencyCase = {
      id: emergencyId,
      uhid,
      patientName: data.patientName,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      emergencyContactRelation: data.emergencyContactRelation,
      referralDoctor: data.referralDoctor,
      referralHospital: data.referralHospital,
      mlcPoliceCase: data.mlcPoliceCase,
      mlcReportingAuthority: data.mlcReportingAuthority,
      mlcIncidentDescription: data.mlcIncidentDescription,
      arrivalMode: data.arrivalMode,
      complaint: data.complaint,
      vitals: data.vitals,
      triage: null,
      mlcRequired: data.mlcRequired ?? false,
      status: 'triage-pending',
      createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setEmergencyCases(prev => [emergencyCase, ...prev]);
    pushWorkflowEvent({
      module: 'emergency',
      action: 'emergency_case_created',
      uhid,
      patientName: data.patientName,
      refId: emergencyId,
      details: `${data.arrivalMode} arrival logged with complaint: ${data.complaint}${data.mlcRequired ? ' (MLC)' : ''}`,
    });

    if (canUseEmergencyRuntime()) {
      void (async () => {
        try {
          const encounter = await ensureEmergencyPlatformEncounter({
            uhid,
            patientName: data.patientName,
            assignedDoctor: data.referralDoctor,
          });
          if (!encounter) return;
          setPatients((prev) =>
            prev.map((p) =>
              p.uhid === uhid
                ? {
                    ...p,
                    platformPatientId: encounter.platformPatientId,
                    platformOpdVisitId: encounter.platformOpdVisitId,
                    opdState: encounter.opdState,
                  }
                : p,
            ),
          );
        } catch (err) {
          const body = err instanceof EmergencyPlatformApiError ? err.body : undefined;
          toast.error('Emergency platform registration failed', {
            description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
          });
        }
      })();
    }

    if (data.phone) {
      sendSmsNotification({
        recipientType: 'patient',
        recipient: data.phone,
        message: `Emergency case ${emergencyId} created for ${data.patientName}. ER team has been notified.`,
        uhid,
      });
    }

    toast.success('Emergency case created', { description: emergencyId });
    return emergencyId;
  }, [pushWorkflowEvent, registerPatient, sendSmsNotification]);

  const triageEmergencyCase = useCallback((emergencyId: string, data: {
    triage: NonNullable<EmergencyCase['triage']>;
    assignedNurse?: string;
    assignedDoctor?: string;
    status?: EmergencyCase['status'];
  }) => {
    setEmergencyCases(prev => prev.map(item => item.id === emergencyId ? {
      ...item,
      triage: data.triage,
      assignedNurse: data.assignedNurse ?? item.assignedNurse,
      assignedDoctor: data.assignedDoctor ?? item.assignedDoctor,
      status: data.status ?? 'triaged',
    } : item));
    const emergency = emergencyCases.find(item => item.id === emergencyId);
    pushWorkflowEvent({
      module: 'emergency',
      action: 'emergency_case_triaged',
      uhid: emergency?.uhid,
      patientName: emergency?.patientName,
      refId: emergencyId,
      details: `Triage set to ${data.triage}`,
    });
    toast.success(`Triage updated for ${emergencyId}`);

    if (emergency && canUseEmergencyRuntime()) {
      const patientRow = emergency.uhid
        ? patients.find((p) => p.uhid === emergency.uhid)
        : undefined;
      void (async () => {
        try {
          const uhid =
            emergency.uhid ??
            registerPatient({
              name: emergency.patientName,
              age: emergency.age ?? 30,
              gender: emergency.gender ?? 'M',
              phone: emergency.phone ?? `900000${Math.floor(Math.random() * 9000 + 1000)}`,
              category: emergency.mlcRequired ? 'government' : 'general',
              patientType: 'Emergency',
              department: 'Emergency',
              assignedDoctor: data.assignedDoctor ?? emergency.assignedDoctor,
              branch: 'Main Hospital',
              isMLC: emergency.mlcRequired,
            });
          if (!emergency.uhid) {
            setEmergencyCases((prev) =>
              prev.map((item) => (item.id === emergencyId ? { ...item, uhid } : item)),
            );
          }
          const encounter = await ensureEmergencyPlatformEncounter({
            uhid,
            patientName: emergency.patientName,
            assignedDoctor: data.assignedDoctor ?? emergency.assignedDoctor,
            platformPatientId: patientRow?.platformPatientId,
            platformOpdVisitId: patientRow?.platformOpdVisitId,
          });
          if (!encounter) return;
          setPatients((prev) =>
            prev.map((p) =>
              p.uhid === uhid
                ? {
                    ...p,
                    platformPatientId: encounter.platformPatientId,
                    platformOpdVisitId: encounter.platformOpdVisitId,
                    opdState: encounter.opdState,
                  }
                : p,
            ),
          );
        } catch (err) {
          const body = err instanceof EmergencyPlatformApiError ? err.body : undefined;
          toast.error('Emergency triage platform sync failed', {
            description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
          });
        }
      })();
    }
  }, [emergencyCases, patients, pushWorkflowEvent, registerPatient]);

  const transferEmergencyToIPD = useCallback(async (emergencyId: string, data: {
    journeyType: PatientJourneyType;
    ward: string;
    bed: string;
    attendingDoctor: string;
    primaryDiagnosis: string;
    nursingPriority?: AdmissionCase['nursingPriority'];
  }): Promise<{ uhid: string; admissionId: string }> => {
    const emergency = emergencyCases.find(item => item.id === emergencyId);
    if (!emergency) {
      throw new Error(`Emergency case not found: ${emergencyId}`);
    }

    const placement = resolveAdmissionPlacement({
      name: emergency.patientName,
      age: emergency.age ?? 30,
      gender: emergency.gender ?? 'M',
      phone: `900000${Math.floor(Math.random() * 9000 + 1000)}`,
      category: emergency.mlcRequired ? 'government' : 'general',
      patientType: data.journeyType,
      department: 'Emergency',
      assignedDoctor: data.attendingDoctor,
      branch: 'Main Hospital',
      isMLC: emergency.mlcRequired,
    });

    const uhid =
      emergency.uhid && patients.some(p => p.uhid === emergency.uhid)
        ? emergency.uhid
        : registerPatient({
            name: emergency.patientName,
            age: emergency.age ?? 30,
            gender: emergency.gender ?? 'M',
            phone: `900000${Math.floor(Math.random() * 9000 + 1000)}`,
            category: emergency.mlcRequired ? 'government' : 'general',
            patientType: data.journeyType,
            department: 'Emergency',
            assignedDoctor: data.attendingDoctor,
            branch: 'Main Hospital',
            isMLC: emergency.mlcRequired,
          });

    const existingLocalAdmission = admissions.find(
      (item) => item.uhid === uhid && item.status !== 'discharged',
    );
    if (existingLocalAdmission) {
      toast.info(`${emergency.patientName} already has an active inpatient admission`, {
        description: `${existingLocalAdmission.ward} · ${existingLocalAdmission.bed}`,
      });
      setEmergencyCases((prev) =>
        prev.map((item) =>
          item.id === emergencyId
            ? {
                ...item,
                uhid,
                status: 'transferred-ipd',
                assignedDoctor: data.attendingDoctor,
              }
            : item,
        ),
      );
      return { uhid, admissionId: existingLocalAdmission.id };
    }

    let platformPatientIdOverride: string | undefined;
    let platformOpdVisitIdOverride: string | undefined;
    const patientRow = patients.find((p) => p.uhid === uhid);

    if (canUseEmergencyRuntime()) {
      try {
        const encounter = await ensureEmergencyPlatformEncounter({
          uhid,
          patientName: emergency.patientName,
          assignedDoctor: data.attendingDoctor,
          platformPatientId: patientRow?.platformPatientId,
          platformOpdVisitId: patientRow?.platformOpdVisitId,
        });
        if (encounter) {
          platformPatientIdOverride = encounter.platformPatientId;
          platformOpdVisitIdOverride = encounter.platformOpdVisitId;
          setPatients((prev) =>
            prev.map((p) =>
              p.uhid === uhid
                ? {
                    ...p,
                    platformPatientId: encounter.platformPatientId,
                    platformOpdVisitId: encounter.platformOpdVisitId,
                    opdState: encounter.opdState,
                  }
                : p,
            ),
          );
        }
      } catch (err) {
        const body = err instanceof EmergencyPlatformApiError ? err.body : undefined;
        toast.error('Platform registration failed', {
          description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
        });
      }

      if (platformPatientIdOverride) {
        const active = await fetchActivePlatformIpdAdmission(platformPatientIdOverride);
        if (active) {
          const existingLinked = admissions.find(
            (a) =>
              (a.platformAdmissionId && a.platformAdmissionId === active.id) ||
              (a.uhid === uhid && a.status !== 'discharged'),
          );
          if (existingLinked) {
            setEmergencyCases((prev) =>
              prev.map((item) =>
                item.id === emergencyId
                  ? {
                      ...item,
                      uhid,
                      status: 'transferred-ipd',
                      assignedDoctor: data.attendingDoctor,
                    }
                  : item,
              ),
            );
            toast.info('Linked to existing platform IPD admission', {
              description: `${existingLinked.id} · ${existingLinked.ward}`,
            });
            return { uhid, admissionId: existingLinked.id };
          }

          const localId = `ADM-${admissionCounter++}`;
          const bedLabel = active.bed?.label ?? data.bed;
          const admissionCase: AdmissionCase = {
            id: localId,
            uhid,
            patientName: emergency.patientName,
            journeyType: data.journeyType,
            admissionSource: 'Emergency',
            ward: active.ward ?? data.ward,
            department: 'Emergency',
            room: data.ward === 'ICU' ? 'ICU Bay 1' : `${data.ward} Room 1`,
            bed: bedLabel,
            attendingDoctor: data.attendingDoctor,
            consultantDoctors: [data.attendingDoctor],
            assignedNurse: placement.assignedNurse,
            roundingDoctor: data.attendingDoctor,
            nextDoctorRoundAt: placement.nextDoctorRoundAt,
            primaryDiagnosis: data.primaryDiagnosis,
            currentTreatmentPlan: data.primaryDiagnosis,
            nursingPriority: data.nursingPriority ?? 'medium',
            doctorRoundStatus: 'pending',
            status:
              data.journeyType === 'ICU'
                ? 'icu'
                : data.journeyType === 'Surgery'
                  ? 'ot'
                  : 'admitted',
            billingStage: 'estimate',
            admittedAt: new Date().toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            isIpLocked: false,
            linkedEmergencyId: emergencyId,
            platformAdmissionId: active.id,
            platformBedId: active.bedId ?? undefined,
          };
          setAdmissions((prev) => [admissionCase, ...prev]);
          setPatients((prev) =>
            prev.map((p) => (p.uhid === uhid ? { ...p, patientType: data.journeyType } : p)),
          );
          setEmergencyCases((prev) =>
            prev.map((item) =>
              item.id === emergencyId
                ? {
                    ...item,
                    uhid,
                    status: 'transferred-ipd',
                    assignedDoctor: data.attendingDoctor,
                  }
                : item,
            ),
          );
          pushWorkflowEvent({
            module: 'emergency',
            action: 'emergency_transferred_to_ipd',
            uhid,
            patientName: emergency.patientName,
            refId: localId,
            details: `Linked ER ${emergencyId} to existing platform admission ${active.id}`,
          });
          toast.success(`${emergency.patientName} linked to active IPD admission`);
          return { uhid, admissionId: localId };
        }
      }
    }

    const admissionId = admitPatient({
      uhid,
      patientName: emergency.patientName,
      journeyType: data.journeyType,
      admissionSource: 'Emergency',
      ward: data.ward,
      room: data.ward === 'ICU' ? 'ICU Bay 1' : `${data.ward} Room 1`,
      bed: data.bed,
      attendingDoctor: data.attendingDoctor,
      assignedNurse: placement.assignedNurse,
      roundingDoctor: data.attendingDoctor,
      nextDoctorRoundAt: placement.nextDoctorRoundAt,
      primaryDiagnosis: data.primaryDiagnosis,
      nursingPriority: data.nursingPriority,
      linkedEmergencyId: emergencyId,
      platformPatientIdOverride,
      platformOpdVisitIdOverride,
      initialNursingRound: {
        nurse: placement.assignedNurse,
        shift: 'Morning',
        bp: '122/78',
        pulse: 90,
        temp: 98.8,
        spo2: 97,
        painScore: 3,
        notes: `Emergency transfer from ${emergencyId}. Doctor round planned at ${placement.nextDoctorRoundAt}.`,
      },
    });

    setEmergencyCases((prev) =>
      prev.map((item) =>
        item.id === emergencyId
          ? {
              ...item,
              uhid,
              status: 'transferred-ipd',
              assignedDoctor: data.attendingDoctor,
            }
          : item,
      ),
    );

    const invoice: BillingInvoice = {
      id: `INV-${invoiceCounter++}`,
      uhid,
      patientName: emergency.patientName,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      category: 'Emergency',
      items: [
        { description: 'Emergency triage and stabilization', amount: 2200 },
        { description: `Transfer to ${data.ward} (${data.bed})`, amount: 850 },
      ],
      total: 3050,
      paid: 0,
      status: 'pending',
    };
    setInvoices((prev) => [invoice, ...prev]);

    pushWorkflowEvent({
      module: 'emergency',
      action: 'emergency_transferred_to_ipd',
      uhid,
      patientName: emergency.patientName,
      refId: admissionId,
      details: `Transferred from ER ${emergencyId} to ${data.ward} · ${data.bed}`,
    });

    pushWorkflowEvent({
      module: 'billing',
      action: 'emergency_invoice_created',
      uhid,
      patientName: emergency.patientName,
      refId: invoice.id,
      details: 'Emergency stabilization and transfer charges generated',
    });

    if (emergency.phone) {
      sendSmsNotification({
        recipientType: 'patient',
        recipient: emergency.phone,
        message: `${emergency.patientName}, your emergency case has been shifted to inpatient care (${data.ward} ${data.bed}).`,
        uhid,
        admissionId,
      });
    }

    sendSmsNotification({
      recipientType: 'doctor',
      recipient: data.attendingDoctor,
      message: `Emergency-to-IPD handoff: ${emergency.patientName} (${uhid}) shifted to ${data.ward} ${data.bed}.`,
      uhid,
      admissionId,
    });

    return { uhid, admissionId };
  }, [admissions, admitPatient, emergencyCases, patients, pushWorkflowEvent, registerPatient, sendSmsNotification]);

  const startEmergencyTreatment = useCallback((emergencyId: string, location?: string) => {
    const emergency = emergencyCases.find((item) => item.id === emergencyId);
    if (!emergency) return;
    setEmergencyCases((prev) =>
      prev.map((item) =>
        item.id === emergencyId
          ? {
              ...item,
              status: 'in-treatment',
              location: location ?? item.location ?? 'Treatment Bay',
            }
          : item,
      ),
    );
    pushWorkflowEvent({
      module: 'emergency',
      action: 'emergency_treatment_started',
      uhid: emergency.uhid,
      patientName: emergency.patientName,
      refId: emergencyId,
      details: location ? `Treatment started at ${location}` : 'Emergency treatment started',
    });
  }, [emergencyCases, pushWorkflowEvent]);

  const moveEmergencyToObservation = useCallback((emergencyId: string, location: string) => {
    const emergency = emergencyCases.find((item) => item.id === emergencyId);
    if (!emergency) return;
    setEmergencyCases((prev) =>
      prev.map((item) =>
        item.id === emergencyId
          ? { ...item, status: 'under-observation', location }
          : item,
      ),
    );
    pushWorkflowEvent({
      module: 'emergency',
      action: 'emergency_observation_started',
      uhid: emergency.uhid,
      patientName: emergency.patientName,
      refId: emergencyId,
      details: `Moved to observation bed ${location}`,
    });
  }, [emergencyCases, pushWorkflowEvent]);

  const dischargeEmergencyCase = useCallback((emergencyId: string) => {
    const emergency = emergencyCases.find((item) => item.id === emergencyId);
    if (!emergency) return;
    setEmergencyCases((prev) =>
      prev.map((item) =>
        item.id === emergencyId ? { ...item, status: 'discharged' } : item,
      ),
    );
    pushWorkflowEvent({
      module: 'emergency',
      action: 'emergency_discharged',
      uhid: emergency.uhid,
      patientName: emergency.patientName,
      refId: emergencyId,
      details: 'Discharged from emergency department',
    });
    toast.success(`${emergency.patientName} discharged from ER`);
  }, [emergencyCases, pushWorkflowEvent]);

  const addNursingRound = useCallback((data: {
    admissionId: string;
    nurse: string;
    shift: NursingRound['shift'];
    bp: string;
    pulse: number;
    temp: number;
    spo2: number;
    painScore: number;
    notes: string;
  }) => {
    const admission = admissions.find(item => item.id === data.admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${data.admissionId}`);
    }

    if (isAdmissionLocked(data.admissionId)) {
      throw new Error('Admission is locked after discharge. Admin unlock required.');
    }

    const roundId = `NR-${nursingRoundCounter++}`;
    const round: NursingRound = {
      id: roundId,
      admissionId: data.admissionId,
      uhid: admission.uhid,
      patientName: admission.patientName,
      ward: admission.ward,
      bed: admission.bed,
      nurse: data.nurse,
      shift: data.shift,
      bp: data.bp,
      pulse: data.pulse,
      temp: data.temp,
      spo2: data.spo2,
      painScore: data.painScore,
      notes: data.notes,
      recordedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setNursingRounds(prev => [round, ...prev]);

    const roundCharge = admission.ward.includes('ICU') ? 600 : 350;
    postServiceCharge({
      uhid: admission.uhid,
      patientName: admission.patientName,
      description: `Nursing round (${data.shift}) - ${admission.ward}`,
      amount: roundCharge,
      module: 'nurse',
      action: 'nursing_charge_posted',
      refId: roundId,
      categoryOverride: 'IPD',
    });

    pushWorkflowEvent({
      module: 'nurse',
      action: 'nursing_round_recorded',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: roundId,
      details: `Round recorded for ${admission.ward} · ${admission.bed}`,
    });
    toast.success('Nursing round recorded', { description: `${admission.patientName} · ${admission.bed}` });
    return roundId;
  }, [admissions, isAdmissionLocked, postServiceCharge, pushWorkflowEvent]);

  const addDoctorProgressNote = useCallback((data: {
    admissionId: string;
    doctor: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    followUpRequired?: boolean;
  }) => {
    const admission = admissions.find(item => item.id === data.admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${data.admissionId}`);
    }

    if (isAdmissionLocked(data.admissionId)) {
      throw new Error('Admission is locked after discharge. Admin unlock required.');
    }

    const createdAt = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const noteId = `DRN-${doctorProgressNoteCounter++}`;
    const note: DoctorProgressNote = {
      id: noteId,
      admissionId: data.admissionId,
      uhid: admission.uhid,
      patientName: admission.patientName,
      doctor: data.doctor,
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment,
      plan: data.plan,
      followUpRequired: !!data.followUpRequired,
      createdAt,
    };

    setDoctorProgressNotes(prev => [note, ...prev]);
    setAdmissions(prev => prev.map(item => item.id === data.admissionId ? {
      ...item,
      currentTreatmentPlan: data.plan || item.currentTreatmentPlan,
      doctorRoundStatus: data.followUpRequired ? 'follow-up-required' : 'seen',
      lastDoctorRoundAt: createdAt,
    } : item));

    pushWorkflowEvent({
      module: 'doctor',
      action: 'doctor_progress_note_added',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: noteId,
      details: `SOAP progress note saved by ${data.doctor}`,
    });

    toast.success('Doctor progress note added', {
      description: data.followUpRequired ? 'Follow-up marked as required' : 'Round status updated to seen',
    });

    return noteId;
  }, [admissions, isAdmissionLocked, pushWorkflowEvent]);

  const markDoctorRoundCompleted = useCallback((admissionId: string, doctor: string) => {
    const admission = admissions.find(item => item.id === admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    if (isAdmissionLocked(admissionId)) {
      throw new Error('Admission is locked after discharge. Admin unlock required.');
    }

    const completedAt = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      doctorRoundStatus: 'seen',
      lastDoctorRoundAt: completedAt,
    } : item));

    pushWorkflowEvent({
      module: 'doctor',
      action: 'doctor_round_completed',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: admissionId,
      details: `Doctor round completed by ${doctor}`,
    });

    toast.success('Round marked as completed', {
      description: `${admission.patientName} · ${completedAt}`,
    });
  }, [admissions, isAdmissionLocked, pushWorkflowEvent]);

  const addAdmissionTask = useCallback((data: {
    admissionId: string;
    task: string;
    assignedTo: string;
    createdBy: string;
  }) => {
    const admission = admissions.find(item => item.id === data.admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${data.admissionId}`);
    }

    if (isAdmissionLocked(data.admissionId)) {
      throw new Error('Admission is locked after discharge. Admin unlock required.');
    }

    const createdAt = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const taskId = `TASK-${admissionTaskCounter++}`;
    const task: AdmissionTask = {
      id: taskId,
      admissionId: data.admissionId,
      uhid: admission.uhid,
      patientName: admission.patientName,
      task: data.task,
      assignedTo: data.assignedTo,
      createdBy: data.createdBy,
      status: 'Pending',
      createdAt,
    };

    setAdmissionTasks(prev => [task, ...prev]);
    setAdmissions(prev => prev.map(item => item.id === data.admissionId ? {
      ...item,
      doctorRoundStatus: 'follow-up-required',
    } : item));

    pushWorkflowEvent({
      module: 'doctor',
      action: 'admission_task_created',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: taskId,
      details: `Task assigned to ${data.assignedTo}: ${data.task}`,
    });

    toast.success('Task assigned to nursing', {
      description: `${data.assignedTo} · ${admission.patientName}`,
    });

    return taskId;
  }, [admissions, isAdmissionLocked, pushWorkflowEvent]);

  const updateAdmissionTaskStatus = useCallback((taskId: string, status: AdmissionTask['status']) => {
    const updatedAt = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setAdmissionTasks(prev => prev.map(item => item.id === taskId ? {
      ...item,
      status,
      completedAt: status === 'Completed' ? updatedAt : undefined,
    } : item));

    const task = admissionTasks.find(item => item.id === taskId);
    if (task) {
      pushWorkflowEvent({
        module: 'nurse',
        action: 'admission_task_status_updated',
        uhid: task.uhid,
        patientName: task.patientName,
        refId: taskId,
        details: `Task moved to ${status}`,
      });
    }

    toast.success('Task status updated', { description: `${taskId} · ${status}` });
  }, [admissionTasks, pushWorkflowEvent]);

  const addInpatientCareOrder = useCallback((data: {
    admissionId: string;
    type: InpatientCareOrder['type'];
    item: string;
    priority: InpatientCareOrder['priority'];
    orderedBy: string;
  }) => {
    const admission = admissions.find(item => item.id === data.admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${data.admissionId}`);
    }

    const orderedAt = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const orderId = `CO-${careOrderCounter++}`;
    const order: InpatientCareOrder = {
      id: orderId,
      admissionId: data.admissionId,
      uhid: admission.uhid,
      patientName: admission.patientName,
      type: data.type,
      item: data.item,
      priority: data.priority,
      orderedBy: data.orderedBy,
      status: 'Pending',
      orderedAt,
    };

    setInpatientCareOrders(prev => [order, ...prev]);

    if (data.type === 'Procedure') {
      postServiceCharge({
        uhid: admission.uhid,
        patientName: admission.patientName,
        description: `Procedure order - ${data.item}`,
        amount: 900,
        module: 'doctor',
        action: 'procedure_charge_posted',
        refId: orderId,
        categoryOverride: 'IPD',
      });
    }

    if (data.type === 'Diet') {
      pushWorkflowEvent({
        module: 'nurse',
        action: 'diet_instruction_recorded',
        uhid: admission.uhid,
        patientName: admission.patientName,
        refId: orderId,
        details: `Diet instruction: ${data.item}`,
      });
    }

    pushWorkflowEvent({
      module: 'doctor',
      action: 'inpatient_care_order_created',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: orderId,
      details: `${data.type} order placed by ${data.orderedBy}`,
    });

    toast.success(`${data.type} order added`, { description: `${admission.patientName}` });
    return orderId;
  }, [admissions, postServiceCharge, pushWorkflowEvent]);

  const updateInpatientCareOrderStatus = useCallback((orderId: string, status: InpatientCareOrder['status']) => {
    setInpatientCareOrders(prev => prev.map(item => item.id === orderId ? { ...item, status } : item));
    const order = inpatientCareOrders.find(item => item.id === orderId);
    if (order) {
      pushWorkflowEvent({
        module: order.type === 'Diet' ? 'nurse' : 'doctor',
        action: 'inpatient_care_order_status_updated',
        uhid: order.uhid,
        patientName: order.patientName,
        refId: orderId,
        details: `${order.type} order moved to ${status}`,
      });
    }
    toast.success('Order status updated', { description: `${orderId} · ${status}` });
  }, [inpatientCareOrders, pushWorkflowEvent]);

  const applyDischargeSummaryTemplate = useCallback((
    admissionId: string,
    templateKey: 'general' | 'post-op' | 'maternity' | 'icu',
    doctor: string,
  ) => {
    const admission = admissions.find(item => item.id === admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    if (isAdmissionLocked(admissionId)) {
      throw new Error('Admission is locked after discharge. Admin unlock required.');
    }

    const baseTemplate = DISCHARGE_SUMMARY_TEMPLATES[templateKey];
    const summary = baseTemplate
      .replace('{{diagnosis}}', admission.primaryDiagnosis || 'Inpatient management');

    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      dischargeSummary: summary,
    } : item));

    pushWorkflowEvent({
      module: 'doctor',
      action: 'discharge_template_applied',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: admissionId,
      details: `${templateKey} template applied by ${doctor}`,
    });
  }, [admissions, isAdmissionLocked, pushWorkflowEvent]);

  const saveAdmissionDischargeSummary = useCallback((admissionId: string, summary: string, doctor: string) => {
    const admission = admissions.find(item => item.id === admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    if (isAdmissionLocked(admissionId)) {
      throw new Error('Admission is locked after discharge. Admin unlock required.');
    }

    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      dischargeSummary: summary,
    } : item));

    pushWorkflowEvent({
      module: 'doctor',
      action: 'discharge_summary_saved',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: admissionId,
      details: `Discharge summary draft saved by ${doctor}`,
    });

    toast.success('Discharge summary saved');
  }, [admissions, isAdmissionLocked, pushWorkflowEvent]);

  const updateAdmissionStatus = useCallback((admissionId: string, status: AdmissionCase['status']) => {
    void (async () => {
    const statusChangedAt = nowStamp();
    const admission = admissions.find(item => item.id === admissionId);

    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    if (admission.isIpLocked && status !== 'discharged') {
      toast.error('Admission is locked after discharge. Admin unlock required.');
      return;
    }

    if (
      canUseIpdRuntime()
      && admission.platformAdmissionId
      && (status === 'discharge-ready' || status === 'discharged')
    ) {
      try {
        const lifecycle = await platformListIpdAllowedActions(admission.platformAdmissionId);
        guardLocalAdmissionStatusAgainstPlatform(
          status,
          lifecycle.allowed,
          lifecycle.state,
        );
      } catch {
        return;
      }
    }

    if (
      status === 'discharged'
      && canUseDischargeRuntime()
      && admission.platformAdmissionId
    ) {
      try {
        const live = await platformGetLiveDischargeState(admission.platformAdmissionId);
        if (!canMarkLocalDischarged(live)) {
          toast.error('Complete discharge on platform before marking discharged locally', {
            description: live.discharge
              ? `Orchestration state: ${live.discharge.state.replace(/_/g, ' ')}`
              : 'Start discharge orchestration from discharge planning first.',
          });
          return;
        }
      } catch (err) {
        const body = err instanceof PlatformApiError ? err.body : undefined;
        toast.error('Could not verify platform discharge state', {
          description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
        });
        return;
      }
    }

    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      status,
      dischargeReadyAt: status === 'discharge-ready' ? statusChangedAt : item.dischargeReadyAt,
      doctorRoundStatus: status === 'discharged' ? 'seen' : item.doctorRoundStatus,
      lastDoctorRoundAt: status === 'discharged' ? (item.lastDoctorRoundAt || statusChangedAt) : item.lastDoctorRoundAt,
      billingStage: status === 'discharge-ready' ? (item.billingStage === 'finalized' ? item.billingStage : 'interim') : item.billingStage,
      isIpLocked: status === 'discharged' ? true : item.isIpLocked,
      ipLockedAt: status === 'discharged' ? statusChangedAt : item.ipLockedAt,
      ipLockReason: status === 'discharged' ? 'Auto lock after discharge' : item.ipLockReason,
    } : item));

    if (admission && status === 'discharge-ready') {
      postServiceCharge({
        uhid: admission.uhid,
        patientName: admission.patientName,
        description: `Discharge planning and summary (${admissionId})`,
        amount: 950,
        module: 'doctor',
        action: 'discharge_planning_charge_posted',
        refId: admissionId,
        categoryOverride: 'IPD',
      });
    }

    if (admission && status === 'discharged') {
      postServiceCharge({
        uhid: admission.uhid,
        patientName: admission.patientName,
        description: `Nursing discharge handover (${admissionId})`,
        amount: 500,
        module: 'nurse',
        action: 'nursing_discharge_charge_posted',
        refId: admissionId,
        categoryOverride: 'IPD',
      });
    }

    pushWorkflowEvent({
      module: 'doctor',
      action: 'admission_status_updated',
      uhid: admission?.uhid,
      patientName: admission?.patientName,
      refId: admissionId,
      details: `Admission status moved to ${status}`,
    });

    const patient = patients.find(item => item.uhid === admission.uhid);
    if (status === 'discharge-ready' && patient?.phone) {
      sendSmsNotification({
        recipientType: 'patient',
        recipient: patient.phone,
        message: `${admission.patientName}, your discharge process has started. Please connect with billing desk for final settlement.`,
        uhid: admission.uhid,
        admissionId,
      });
    }

    if (status === 'discharged' && patient?.phone) {
      sendSmsNotification({
        recipientType: 'patient',
        recipient: patient.phone,
        message: `${admission.patientName}, you are discharged. We wish you a healthy recovery.`,
        uhid: admission.uhid,
        admissionId,
      });
    }

    if (canUseIpdRuntime() && admission.platformAdmissionId) {
      const platformId = admission.platformAdmissionId;
      const platformPatientId = patient?.platformPatientId;
      void (async () => {
        try {
          if (status === 'discharge-ready' && platformPatientId && canUseDischargeRuntime()) {
            await platformStartDischarge({
              admissionId: platformId,
              patientId: platformPatientId,
            });
          }
          if (status === 'discharge-ready') {
            await platformAdvanceAdmissionTowardDischargePlanning(platformId);
          }
          if (status === 'discharged') {
            await platformCompleteAdmissionDischargeChain(platformId);
          }
        } catch (err) {
          const body = err instanceof PlatformApiError ? err.body : undefined;
          toast.error('Platform IPD lifecycle sync failed', {
            description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
          });
        }
      })();
    }

    toast.success(`Admission ${admissionId} updated to ${status}`);
    })();
  }, [admissions, nowStamp, patients, postServiceCharge, pushWorkflowEvent, sendSmsNotification]);

  const unlockAdmissionEditLock = useCallback((admissionId: string, adminName: string, reason: string) => {
    const admission = admissions.find(item => item.id === admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    if (!admission.isIpLocked) {
      toast.info('Admission is already editable.');
      return;
    }

    const unlockedAt = nowStamp();
    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      isIpLocked: false,
      ipUnlockedAt: unlockedAt,
      ipUnlockReason: reason,
    } : item));

    pushWorkflowEvent({
      module: 'admin',
      action: 'admission_lock_released',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: admissionId,
      details: `Unlock by ${adminName}: ${reason}`,
    });

    toast.success(`Admission ${admissionId} unlocked for edits`);
  }, [admissions, nowStamp, pushWorkflowEvent]);

  const assignAdmissionBed = useCallback((
    admissionId: string,
    ward: string,
    bed: string,
    assignedNurse?: string,
    nextDoctorRoundAt?: string,
    reason?: string,
    shiftedBy?: string,
  ) => {
    const admission = admissions.find(item => item.id === admissionId);

    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    if (isAdmissionLocked(admissionId)) {
      toast.error('Admission is locked after discharge. Admin unlock required.');
      return;
    }

    const bedNo = Number.parseInt(bed.split('-').pop() || '1', 10);
    const roomNo = Number.isNaN(bedNo) ? 1 : Math.max(1, Math.ceil(bedNo / 2));
    const room = ward === 'ICU' ? `ICU Bay ${roomNo}` : `${ward} Room ${roomNo}`;

    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      ward,
      room,
      bed,
      assignedNurse: assignedNurse ?? item.assignedNurse,
      nextDoctorRoundAt: nextDoctorRoundAt ?? item.nextDoctorRoundAt,
    } : item));

    if (admission.ward !== ward || admission.bed !== bed) {
      const shiftedAt = nowStamp();
      const shiftId = `RSH-${roomShiftCounter++}`;
      const shiftRecord: RoomShiftRecord = {
        id: shiftId,
        admissionId,
        uhid: admission.uhid,
        patientName: admission.patientName,
        fromWard: admission.ward,
        fromRoom: admission.room,
        fromBed: admission.bed,
        toWard: ward,
        toRoom: room,
        toBed: bed,
        reason: reason || 'Bed reassignment',
        shiftedBy: shiftedBy || assignedNurse || 'Ward Desk',
        shiftedAt,
      };
      setRoomShiftHistory(prev => [shiftRecord, ...prev]);
    }

    pushWorkflowEvent({
      module: 'nurse',
      action: 'admission_bed_reassigned',
      uhid: admission?.uhid,
      patientName: admission?.patientName,
      refId: admissionId,
      details: `Moved to ${ward} · ${room} · ${bed}${assignedNurse ? ` (nurse: ${assignedNurse})` : ''}${reason ? ` · reason: ${reason}` : ''}`,
    });

    if (canUseIpdRuntime() && admission.platformAdmissionId) {
      void (async () => {
        try {
          const bedId =
            admission.platformBedId && admission.bed === bed && admission.ward === ward
              ? admission.platformBedId
              : await resolvePlatformBedId(ward, bed);
          const updated = await platformAssignBed(admission.platformAdmissionId!, bedId);
          setAdmissions((prev) =>
            prev.map((item) =>
              item.id === admissionId
                ? {
                    ...item,
                    platformBedId: updated.bedId ?? bedId,
                    ...(updated.ward ? { ward: updated.ward } : {}),
                  }
                : item,
            ),
          );
          if (updated.state === 'bed_assignment_pending') {
            await platformIpdTransition(
              updated.id,
              'confirm_admission',
              {
                bedAssigned: true,
                patientIdentified: true,
                depositOrPreauth: true,
              },
              updated.version,
            );
          }
        } catch (err) {
          const body = err instanceof PlatformApiError ? err.body : undefined;
          toast.error('Platform bed assignment failed', {
            description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
          });
        }
      })();
    }

    toast.success(`Bed assigned: ${ward} · ${bed}`);
  }, [admissions, isAdmissionLocked, nowStamp, pushWorkflowEvent]);

  const generateInterimBill = useCallback((admissionId: string, note?: string) => {
    const admission = admissions.find(item => item.id === admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    const openInvoice = invoices.find(
      item => item.uhid === admission.uhid
        && item.category === 'IPD'
        && (item.status === 'pending' || item.status === 'partial'),
    );
    if (!openInvoice) {
      toast.info('No open IPD invoice found to create interim bill.');
      return null;
    }

    const balance = Math.max(0, openInvoice.total - openInvoice.paid);
    if (balance <= 0) {
      toast.info('No outstanding amount available for interim bill.');
      return null;
    }

    const interimId = `INV-${invoiceCounter++}`;
    const interimInvoice: BillingInvoice = {
      id: interimId,
      uhid: admission.uhid,
      patientName: admission.patientName,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      category: 'IPD',
      items: [{ description: note || `Interim billing snapshot from ${openInvoice.id}`, amount: balance }],
      total: balance,
      paid: 0,
      status: 'pending',
    };

    setInvoices(prev => [interimInvoice, ...prev]);
    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      billingStage: 'interim',
    } : item));

    pushWorkflowEvent({
      module: 'billing',
      action: 'interim_bill_generated',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: interimId,
      details: `Interim invoice generated from ${openInvoice.id}`,
    });

    toast.success('Interim bill generated', { description: interimId });
    return interimId;
  }, [admissions, invoices, pushWorkflowEvent]);

  const applyFinalBillDiscount = useCallback((admissionId: string, amount: number, reason: string) => {
    const admission = admissions.find(item => item.id === admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    if (amount <= 0) {
      toast.error('Discount amount must be greater than zero.');
      return null;
    }

    const activeInvoice = invoices.find(
      item => item.uhid === admission.uhid
        && item.category === 'IPD'
        && (item.status === 'pending' || item.status === 'partial'),
    );

    if (!activeInvoice) {
      toast.error('No active IPD invoice found for discount.');
      return null;
    }

    const cappedDiscount = Math.min(amount, activeInvoice.total);
    setInvoices(prev => prev.map(item => {
      if (item.id !== activeInvoice.id) {
        return item;
      }

      const nextItems = [...item.items, {
        description: `Final bill discount${reason ? ` (${reason})` : ''}`,
        amount: -cappedDiscount,
      }];
      const nextTotal = Math.max(0, item.total - cappedDiscount);
      return {
        ...item,
        items: nextItems,
        total: nextTotal,
        discountAmount: (item.discountAmount || 0) + cappedDiscount,
        discountReason: reason,
        status: item.paid >= nextTotal ? 'paid' : item.paid > 0 ? 'partial' : 'pending',
      };
    }));

    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      finalBillDiscountAmount: (item.finalBillDiscountAmount || 0) + cappedDiscount,
      finalBillDiscountReason: reason,
    } : item));

    pushWorkflowEvent({
      module: 'billing',
      action: 'final_bill_discount_applied',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: activeInvoice.id,
      details: `Discount ₹${cappedDiscount.toLocaleString('en-IN')} applied${reason ? ` · ${reason}` : ''}`,
    });

    toast.success('Final bill discount applied');
    return activeInvoice.id;
  }, [admissions, invoices, pushWorkflowEvent]);

  const finalizeAdmissionBill = useCallback((admissionId: string) => {
    const admission = admissions.find(item => item.id === admissionId);
    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    const activeInvoice = invoices.find(
      item => item.uhid === admission.uhid
        && item.category === 'IPD'
        && (item.status === 'pending' || item.status === 'partial' || item.status === 'paid'),
    );

    if (!activeInvoice) {
      toast.error('No IPD invoice available to finalize.');
      return null;
    }

    setInvoices(prev => prev.map(item => item.id === activeInvoice.id ? {
      ...item,
      finalized: true,
      status: item.paid >= item.total ? 'paid' : item.paid > 0 ? 'partial' : 'pending',
    } : item));

    setAdmissions(prev => prev.map(item => item.id === admissionId ? {
      ...item,
      billingStage: 'finalized',
    } : item));

    pushWorkflowEvent({
      module: 'billing',
      action: 'final_bill_generated',
      uhid: admission.uhid,
      patientName: admission.patientName,
      refId: activeInvoice.id,
      details: `Final IPD bill generated for ${admissionId}`,
    });

    toast.success('Final bill generated', { description: activeInvoice.id });
    return activeInvoice.id;
  }, [admissions, invoices, pushWorkflowEvent]);

  const collectPayment = useCallback(async (invoiceId: string, amount: number, mode: PaymentMode, reference?: string) => {
    const invoice = invoices.find(item => item.id === invoiceId);
    if (!invoice) return;

    if (canUseBillingRuntime()) {
      const patient = patients.find(p => p.uhid === invoice.uhid);
      if (invoice.category === 'OPD' && patient?.platformOpdVisitId) {
        try {
          const live = await platformGetLiveFinancialState(patient.platformOpdVisitId);
          if (live.blockers.length > 0) {
            toast.error('Billing blocked — resolve operational prerequisites first', {
              description: live.blockers.join(' · '),
            });
            return;
          }
        } catch {
          /* allow local collection if live financial read fails */
        }
      }
      if (invoice.category === 'IPD') {
        const admission = admissions.find(
          (a) => a.uhid === invoice.uhid && a.platformAdmissionId,
        );
        if (admission?.platformAdmissionId) {
          try {
            const live = await platformGetLiveIpdFinancialState(admission.platformAdmissionId);
            if (live.blockers.length > 0) {
              toast.error('IPD billing blocked', {
                description: live.blockers.join(' · '),
              });
              return;
            }
          } catch {
            /* allow local collection if live read fails */
          }
        }
      }
    }

    const balance = Math.max(0, invoice.total - invoice.paid);
    const collected = Math.min(balance, Math.max(0, amount));
    const newPaid = invoice.paid + collected;
    const newStatus: BillingInvoice['status'] =
      newPaid === 0 ? 'pending' : newPaid >= invoice.total ? 'paid' : 'partial';

    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      return { ...inv, paid: newPaid, status: newStatus, paymentMode: mode };
    }));

    const transaction: BillingTransaction = {
      id: `TXN-${billingTransactionCounter++}`,
      invoiceId,
      uhid: invoice.uhid,
      patientName: invoice.patientName,
      kind: 'payment',
      amount: collected,
      mode,
      reference,
      createdAt: nowStamp(),
    };
    setBillingTransactions(prev => [transaction, ...prev]);

    pushWorkflowEvent({
      module: 'billing',
      action: 'payment_collected',
      platformEvent: HospitalPlatformEvents.billing.paymentCollected,
      uhid: invoice.uhid,
      patientName: invoice.patientName,
      refId: invoiceId,
      details: `Received ₹${collected.toLocaleString('en-IN')} via ${mode}${reference ? ` · ref ${reference}` : ''}`,
    });
    toast.success(`Payment ₹${collected.toLocaleString('en-IN')} collected`, { description: `Invoice: ${invoiceId}` });

    if (canUseBillingRuntime() && invoice.category === 'OPD') {
      void (async () => {
        try {
          const patient = patients.find(p => p.uhid === invoice.uhid);
          const visitId = patient?.platformOpdVisitId;
          const amountCents = Math.round(collected * 100);
          const lineItems = invoice.items.map(i => ({
            description: i.description,
            amountCents: Math.round(i.amount * 100),
          }));

          if (visitId && newStatus === 'paid') {
            if (patient?.opdState === 'completed') {
              return;
            }
            await platformCompleteOpdBillingExit({
              visitId,
              lineItems: [],
              paymentAmountCents: amountCents,
              paymentMethod: mode,
              reference,
              insuranceMode:
                invoice.category === 'OPD' && patient?.category === 'insurance'
                  ? 'insurance'
                  : patient?.category === 'corporate'
                    ? 'corporate'
                    : 'self',
              corporatePayer: patient?.category === 'corporate',
            });
            setPatients(prev =>
              prev.map(p =>
                p.uhid === invoice.uhid ? { ...p, opdState: 'completed' } : p,
              ),
            );
            return;
          }

          if (invoice.platformInvoiceId) {
            const mapStatus: Record<BillingInvoice['status'], InvoiceState> = {
              pending: 'issued',
              partial: 'partial',
              paid: 'paid',
              overdue: 'overdue',
            };
            const from = (newStatus === 'partial' ? 'issued' : mapStatus[newStatus]) ?? 'issued';
            const action = newStatus === 'paid' ? 'record_full_payment' : 'record_partial_payment';
            guardInvoiceTransition(from, action, 'receptionist', {
              paymentAmountValid: collected > 0,
              amountMatches: newStatus === 'paid',
              partialPaymentAllowed: getBranchConfigOverrides()['billing.allow_partial_payment'] !== false,
            });
            const { invoice: platformInv } = await platformInvoiceTransition(
              invoice.platformInvoiceId,
              action,
              {
                paymentAmountValid: true,
                amountMatches: newStatus === 'paid',
              },
              { amountCents, paymentMethod: mode, reference },
              invoice.platformVersion,
            );
            setInvoices(prev =>
              prev.map(inv =>
                inv.id === invoiceId
                  ? { ...inv, platformVersion: platformInv.version }
                  : inv,
              ),
            );
            if (newStatus === 'paid') {
              guardInvoiceTransition('paid', 'settle_invoice', 'receptionist', {
                duplicateSettlementBlocked: true,
                amountMatches: true,
              });
              await platformInvoiceTransition(
                invoice.platformInvoiceId,
                'settle_invoice',
                { duplicateSettlementBlocked: true, amountMatches: true },
                undefined,
                platformInv.version,
              );
            }
          }
        } catch (err) {
          toast.error('Platform billing sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    }

    if (canUseIpdBillingRuntime() && invoice.category === 'IPD') {
      void (async () => {
        try {
          const admission = admissions.find(
            (a) => a.uhid === invoice.uhid && a.platformAdmissionId,
          );
          const patient = patients.find((p) => p.uhid === invoice.uhid);
          const admissionId = admission?.platformAdmissionId;
          if (!admissionId) return;

          const amountCents = Math.round(collected * 100);
          const lineItems = invoice.items.map((i) => ({
            description: i.description,
            amountCents: Math.round(i.amount * 100),
          }));

          if (newStatus === 'paid') {
            await platformCompleteIpdBillingExit({
              admissionId,
              lineItems,
              paymentAmountCents: amountCents,
              paymentMethod: mode,
              reference,
              insuranceMode:
                patient?.category === 'insurance'
                  ? 'insurance'
                  : patient?.category === 'corporate'
                    ? 'corporate'
                    : 'self',
              corporatePayer: patient?.category === 'corporate',
            });
            setAdmissions((prev) =>
              prev.map((a) =>
                a.id === admission?.id ? { ...a, billingStage: 'finalized' } : a,
              ),
            );
            return;
          }

          if (invoice.platformInvoiceId && newStatus === 'partial') {
            const from = 'issued' as InvoiceState;
            const action = 'record_partial_payment';
            guardInvoiceTransition(from, action, 'receptionist', {
              paymentAmountValid: collected > 0,
              amountMatches: false,
              partialPaymentAllowed:
                getBranchConfigOverrides()['billing.allow_partial_payment'] !== false,
            });
            const { invoice: platformInv } = await platformInvoiceTransition(
              invoice.platformInvoiceId,
              action,
              {
                paymentAmountValid: true,
                amountMatches: false,
              },
              { amountCents, paymentMethod: mode, reference },
              invoice.platformVersion,
            );
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === invoiceId
                  ? { ...inv, platformVersion: platformInv.version }
                  : inv,
              ),
            );
          }
        } catch (err) {
          toast.error('Platform IPD billing sync failed', {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      })();
    }
  }, [admissions, invoices, patients, nowStamp, pushWorkflowEvent]);

  const refundPayment = useCallback((invoiceId: string, amount: number, mode: PaymentMode, reason?: string, reference?: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const refundable = Math.min(inv.paid, Math.max(0, amount));
      const newPaid = inv.paid - refundable;
      return {
        ...inv,
        paid: newPaid,
        status: newPaid === 0 ? 'pending' as const : newPaid >= inv.total ? 'paid' as const : 'partial' as const,
        paymentMode: mode,
      };
    }));

    const invoice = invoices.find(item => item.id === invoiceId);
    if (invoice) {
      const transaction: BillingTransaction = {
        id: `TXN-${billingTransactionCounter++}`,
        invoiceId,
        uhid: invoice.uhid,
        patientName: invoice.patientName,
        kind: 'refund',
        amount,
        mode,
        reason,
        reference,
        createdAt: nowStamp(),
      };
      setBillingTransactions(prev => [transaction, ...prev]);
    }

    pushWorkflowEvent({
      module: 'billing',
      action: 'payment_refunded',
      uhid: invoice?.uhid,
      patientName: invoice?.patientName,
      refId: invoiceId,
      details: `Refunded ₹${amount.toLocaleString('en-IN')} via ${mode}${reference ? ` · ref ${reference}` : ''}${reason ? ` · ${reason}` : ''}`,
    });
    toast.success(`Refund ₹${amount.toLocaleString('en-IN')} processed`, { description: `Invoice: ${invoiceId}` });
  }, [invoices, nowStamp, pushWorkflowEvent]);

  const createInvoice = useCallback((data: Omit<BillingInvoice, 'id'>) => {
    const id = `INV-${invoiceCounter++}`;
    setInvoices(prev => [{ ...data, id }, ...prev]);
    pushWorkflowEvent({
      module: 'billing',
      action: 'invoice_created_manual',
      uhid: data.uhid,
      patientName: data.patientName,
      refId: id,
      details: `Manual ${data.category} invoice generated`,
    });
    return id;
  }, [pushWorkflowEvent]);

  const createEstimate = useCallback((data: Omit<BillingEstimate, 'id' | 'status'>) => {
    const id = `EST-${estimateCounter++}`;
    setEstimates(prev => [{ ...data, id, status: 'draft' }, ...prev]);
    pushWorkflowEvent({
      module: 'billing',
      action: 'estimate_created',
      uhid: data.uhid,
      patientName: data.patientName,
      refId: id,
      details: `Estimate generated for ${data.category} with ${data.items.length} item(s)`,
    });
    return id;
  }, [pushWorkflowEvent]);

  const convertEstimateToInvoice = useCallback((estimateId: string) => {
    const estimate = estimates.find(item => item.id === estimateId && item.status === 'draft');
    if (!estimate) {
      return null;
    }

    const invoiceId = `INV-${invoiceCounter++}`;
    setInvoices(prev => [{
      id: invoiceId,
      uhid: estimate.uhid,
      patientName: estimate.patientName,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      category: estimate.category,
      items: estimate.items,
      total: estimate.total,
      paid: 0,
      status: 'pending',
    }, ...prev]);

    setEstimates(prev => prev.map(item => item.id === estimateId ? { ...item, status: 'converted' } : item));

    pushWorkflowEvent({
      module: 'billing',
      action: 'estimate_converted_to_invoice',
      uhid: estimate.uhid,
      patientName: estimate.patientName,
      refId: invoiceId,
      details: `Estimate ${estimateId} converted to invoice ${invoiceId}`,
    });

    toast.success(`Estimate ${estimateId} converted`, { description: `Invoice: ${invoiceId}` });
    return invoiceId;
  }, [estimates, pushWorkflowEvent]);

  const getPatientWorkflowTimeline = useCallback((uhid: string) => {
    return workflowEvents.filter(event => event.uhid === uhid);
  }, [workflowEvents]);

  return (
    <HospitalContext.Provider value={{
      patients, appointments, queue, labOrders, prescriptions, pharmacyInventory, radiologyOrders, invoices,
      estimates,
      emergencyCases, admissions, nursingRounds, doctorProgressNotes, admissionTasks, inpatientCareOrders,
      wardMedicineIssues, otRecords, roomShiftHistory, departmentTransfers, notificationLogs, billingTransactions,
      workflowEvents,
      registerPatient, refreshPatientsFromPlatform, backfillPlatformPatientId, startFrontDeskVisit, admitPatient, transferOpdToIPD, convertOpdToIPDByUHID, bookAppointment, updateAppointmentStatus, checkInPatient,
      updateQueueStatus, refreshQueueFromPlatform, refreshAppointmentsFromPlatform, refreshPlatformIpdSnapshots, refreshDepartmentWorklistsFromPlatform, nextQueuePatient, saveConsultation, updateLabStage, updateLabOrder,
      updatePrescriptionStatus, updateMedicationLineStatus, dispensePrescription, updateRadiologyOrder,
      addDailyServiceCharge, issueWardMedicine, updateWardMedicineIssueStatus,
      addInvestigationOrder, upsertOTRecord, assignConsultantDoctor, transferAdmissionDepartment,
      createEmergencyCase, triageEmergencyCase, transferEmergencyToIPD,
      startEmergencyTreatment, moveEmergencyToObservation, dischargeEmergencyCase,
      addNursingRound, addDoctorProgressNote, markDoctorRoundCompleted,
      addAdmissionTask, updateAdmissionTaskStatus,
      addInpatientCareOrder, updateInpatientCareOrderStatus,
      applyDischargeSummaryTemplate, saveAdmissionDischargeSummary,
      updateAdmissionStatus, unlockAdmissionEditLock, assignAdmissionBed,
      generateInterimBill, finalizeAdmissionBill, applyFinalBillDiscount,
      collectPayment, refundPayment, createInvoice, createEstimate, convertEstimateToInvoice, getPatientWorkflowTimeline,
    }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error('useHospital must be used within HospitalProvider');
  return ctx;
}
