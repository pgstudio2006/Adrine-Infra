export * from './opd-visit.js';
export * from './patient-identity.js';
export * from './clinical-consultation.js';
export * from './ipd-admission.js';
export type { AdmissionState } from './admission-ipd.js';
export * from './bed-occupancy.js';
export * from './nursing-task.js';
export * from './medication-administration.js';
export * from './discharge-orchestration.js';
export * from './insurance-tpa.js';
export * from './emergency.js';
export * from './lab-sample.js';
export * from './radiology-order.js';
export * from './pharmacy-fulfillment.js';
export * from './billing-payment.js';
export * from './ot-case.js';
export * from './inventory-stock-move.js';
export * from './dialysis-session.js';
export * from './navayu-msk-visit.js';

import { ipdAdmissionLifecycle } from './ipd-admission.js';
import { bedOccupancyLifecycle } from './bed-occupancy.js';
import { nursingTaskLifecycle } from './nursing-task.js';
import { medicationAdminLifecycle } from './medication-administration.js';
import { dischargeOrchestrationLifecycle } from './discharge-orchestration.js';
import { insuranceTpaLifecycle } from './insurance-tpa.js';
import { emergencyLifecycle } from './emergency.js';
import { invoiceLifecycle, insurancePreauthLifecycle } from './billing-payment.js';
import { labOrderLifecycle } from './lab-sample.js';
import { radiologyOrderLifecycle } from './radiology-order.js';
import { pharmacyFulfillmentLifecycle } from './pharmacy-fulfillment.js';
import { opdVisitLifecycle } from './opd-visit.js';
import { otCaseLifecycle } from './ot-case.js';
import { inventoryStockMoveLifecycle } from './inventory-stock-move.js';
import { dialysisSessionLifecycle } from './dialysis-session.js';
import { navayuMskVisitLifecycle } from './navayu-msk-visit.js';

export const ALL_LIFECYCLES = [
  opdVisitLifecycle,
  ipdAdmissionLifecycle,
  bedOccupancyLifecycle,
  nursingTaskLifecycle,
  medicationAdminLifecycle,
  dischargeOrchestrationLifecycle,
  insuranceTpaLifecycle,
  emergencyLifecycle,
  labOrderLifecycle,
  radiologyOrderLifecycle,
  pharmacyFulfillmentLifecycle,
  invoiceLifecycle,
  insurancePreauthLifecycle,
  otCaseLifecycle,
  inventoryStockMoveLifecycle,
  dialysisSessionLifecycle,
  navayuMskVisitLifecycle,
] as const;
