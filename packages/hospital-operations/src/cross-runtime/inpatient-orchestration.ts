import type { LabOrderState } from '../lifecycles/lab-sample.js';
import type { PharmacyFulfillmentState } from '../lifecycles/pharmacy-fulfillment.js';
import { LAB_BLOCKING_STATES, LAB_TERMINAL_STATES } from '../engine/lab-runtime-engine.js';
import { NURSING_OPEN_STATES } from '../engine/nursing-runtime-engine.js';
import type { NursingTaskState } from '../lifecycles/nursing-task.js';
import { INSURANCE_APPROVED_STATES } from '../engine/insurance-runtime-engine.js';
import type { InsuranceAuthorizationState } from '../lifecycles/insurance-tpa.js';
import type { DischargeOrchestrationState } from '../lifecycles/discharge-orchestration.js';
import type { IpdAdmissionState } from '../lifecycles/ipd-admission.js';

export type InpatientBlocker = {
  code: string;
  message: string;
  severity: 'warning' | 'critical';
  domain: 'lab' | 'pharmacy' | 'billing' | 'nursing' | 'insurance' | 'bed' | 'clinical';
};

export type DischargeBlockerInput = {
  dischargeState: DischargeOrchestrationState;
  admissionState?: IpdAdmissionState;
  labOrders?: readonly { state: LabOrderState; isCritical?: boolean }[];
  pharmacyFulfillments?: readonly { state: PharmacyFulfillmentState; isControlled?: boolean }[];
  nursingTasks?: readonly { state: NursingTaskState }[];
  insuranceState?: InsuranceAuthorizationState;
  insuranceMode?: 'self' | 'corporate' | 'tpa';
  billingOutstandingCents?: number;
  billingBlockers?: readonly string[];
  clinicalClearanceGranted?: boolean;
  pharmacyClearanceGranted?: boolean;
  nursingClearanceGranted?: boolean;
  insuranceClearanceGranted?: boolean;
};

/** Aggregate cross-runtime blockers before ready_for_discharge. */
export function evaluateDischargeBlockers(input: DischargeBlockerInput): InpatientBlocker[] {
  const blockers: InpatientBlocker[] = [];

  const pendingLabs =
    input.labOrders?.filter((o) => LAB_BLOCKING_STATES.includes(o.state)) ?? [];
  if (pendingLabs.length > 0) {
    blockers.push({
      code: 'IPD_LAB_PENDING',
      message: `${pendingLabs.length} inpatient lab order(s) still in progress`,
      severity: 'warning',
      domain: 'lab',
    });
  }

  const criticalLabs =
    input.labOrders?.filter(
      (o) => o.isCritical && !LAB_TERMINAL_STATES.includes(o.state),
    ) ?? [];
  if (criticalLabs.length > 0) {
    blockers.push({
      code: 'IPD_LAB_CRITICAL',
      message: 'Critical lab results require clinician acknowledgment',
      severity: 'critical',
      domain: 'lab',
    });
  }

  const pendingRx =
    input.pharmacyFulfillments?.filter(
      (p) => !['completed', 'cancelled', 'returned'].includes(p.state),
    ) ?? [];
  if (pendingRx.length > 0 && !input.pharmacyClearanceGranted) {
    blockers.push({
      code: 'IPD_PHARMACY_PENDING',
      message: `${pendingRx.length} pharmacy fulfillment(s) outstanding`,
      severity: 'warning',
      domain: 'pharmacy',
    });
  }

  const openNursing =
    input.nursingTasks?.filter((t) => NURSING_OPEN_STATES.includes(t.state)) ?? [];
  if (openNursing.length > 0 && !input.nursingClearanceGranted) {
    blockers.push({
      code: 'IPD_NURSING_PENDING',
      message: `${openNursing.length} nursing task(s) still open`,
      severity: openNursing.some((t) => t.state === 'escalated') ? 'critical' : 'warning',
      domain: 'nursing',
    });
  }

  if (
    input.insuranceMode &&
    input.insuranceMode !== 'self' &&
    input.insuranceState &&
    !INSURANCE_APPROVED_STATES.includes(input.insuranceState) &&
    !input.insuranceClearanceGranted
  ) {
    blockers.push({
      code: 'IPD_INSURANCE_PENDING',
      message: `Insurance authorization in state "${input.insuranceState}"`,
      severity: 'critical',
      domain: 'insurance',
    });
  }

  if ((input.billingOutstandingCents ?? 0) > 0) {
    blockers.push({
      code: 'IPD_BILLING_OUTSTANDING',
      message: 'Outstanding IPD charges must be reviewed before discharge',
      severity: 'warning',
      domain: 'billing',
    });
  }

  for (const msg of input.billingBlockers ?? []) {
    blockers.push({
      code: 'IPD_BILLING_BLOCKER',
      message: msg,
      severity: 'critical',
      domain: 'billing',
    });
  }

  if (!input.clinicalClearanceGranted && input.dischargeState === 'clinical_clearance_pending') {
    blockers.push({
      code: 'IPD_CLINICAL_PENDING',
      message: 'Clinical discharge clearance pending',
      severity: 'warning',
      domain: 'clinical',
    });
  }

  if (
    input.dischargeState !== 'ready_for_discharge' &&
    input.dischargeState !== 'discharged' &&
    blockers.some((b) => b.severity === 'critical')
  ) {
    return blockers;
  }

  if (input.dischargeState === 'insurance_clearance_pending') {
    const criticalRemaining = blockers.filter((b) => b.severity === 'critical');
    if (criticalRemaining.length > 0) return blockers;
  }

  return blockers;
}

export type AdmissionBlockerInput = {
  admissionState: IpdAdmissionState;
  bedAssigned?: boolean;
  bedState?: string;
  depositPaid?: boolean;
  insurancePreauthApproved?: boolean;
  insuranceMode?: 'self' | 'corporate' | 'tpa';
  opdVisitOpen?: boolean;
  duplicateActiveAdmission?: boolean;
};

/** Cross-runtime gates before bed assignment / admission confirmation. */
export function evaluateAdmissionBlockers(input: AdmissionBlockerInput): InpatientBlocker[] {
  const blockers: InpatientBlocker[] = [];

  if (input.duplicateActiveAdmission) {
    blockers.push({
      code: 'IPD_DUPLICATE_ADMISSION',
      message: 'Patient already has an active IPD admission',
      severity: 'critical',
      domain: 'clinical',
    });
  }

  if (
    ['bed_assignment_pending', 'admitted'].includes(input.admissionState) &&
    input.bedAssigned === false
  ) {
    blockers.push({
      code: 'IPD_BED_UNASSIGNED',
      message: 'Bed must be assigned before admission',
      severity: 'critical',
      domain: 'bed',
    });
  }

  if (input.bedState === 'occupied' || input.bedState === 'blocked') {
    blockers.push({
      code: 'IPD_BED_UNAVAILABLE',
      message: `Selected bed is ${input.bedState}`,
      severity: 'critical',
      domain: 'bed',
    });
  }

  if (
    input.insuranceMode &&
    input.insuranceMode !== 'self' &&
    !input.depositPaid &&
    !input.insurancePreauthApproved
  ) {
    blockers.push({
      code: 'IPD_FINANCIAL_GATE',
      message: 'Deposit or insurance pre-authorization required',
      severity: 'critical',
      domain: 'billing',
    });
  }

  if (input.opdVisitOpen && input.admissionState === 'admission_requested') {
    blockers.push({
      code: 'IPD_OPD_OPEN',
      message: 'Active OPD visit should be closed or linked before IPD admission',
      severity: 'warning',
      domain: 'clinical',
    });
  }

  return blockers;
}

/** True when no critical blockers remain for ready_for_discharge transition. */
export function canMarkReadyForDischarge(blockers: readonly InpatientBlocker[]): boolean {
  return !blockers.some((b) => b.severity === 'critical');
}
