import { HospitalPlatformEvents, type PlatformEventName } from '@adrine/hospital-operations';
/** Legacy workflow module ids from Hospital OS store. */
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

/** Maps legacy store actions to canonical platform event names. */
export function mapWorkflowActionToPlatformEvent(
  module: WorkflowModule,
  action: string,
): PlatformEventName | undefined {
  const key = `${module}:${action}`.toLowerCase();

  const table: Record<string, PlatformEventName> = {
    'reception:patient_registered': HospitalPlatformEvents.patient.registered,
    'reception:front_desk_visit_started': HospitalPlatformEvents.appointment.booked,
    'scheduling:appointment_checked_in': HospitalPlatformEvents.appointment.checkedIn,
    'reception:appointment_checked_in': HospitalPlatformEvents.appointment.checkedIn,
    'doctor:doctor_round_completed': HospitalPlatformEvents.encounter.closed,
    'doctor:discharge_summary_saved': HospitalPlatformEvents.discharge.summaryDrafted,
    'pharmacy:prescription_created': HospitalPlatformEvents.clinical.prescriptionIssued,
    'pharmacy:ward_medicine_issued': HospitalPlatformEvents.pharmacy.dispensed,
    'lab:lab_order_created': HospitalPlatformEvents.lab.ordered,
    'lab:lab_stage_updated': HospitalPlatformEvents.lab.resultVerified,
    'lab:investigation_order_created': HospitalPlatformEvents.lab.ordered,
    'billing:invoice_created': HospitalPlatformEvents.billing.invoiceGenerated,
    'billing:invoice_created_manual': HospitalPlatformEvents.billing.invoiceGenerated,
    'billing:payment_collected': HospitalPlatformEvents.billing.paymentCollected,
    'billing:payment_refunded': HospitalPlatformEvents.billing.refundIssued,
    'nurse:admission_created': HospitalPlatformEvents.admission.admitted,
    'emergency:emergency_case_triaged': HospitalPlatformEvents.emergency.triaged,
    'emergency:emergency_case_created': HospitalPlatformEvents.emergency.registered,
  };

  return table[key];
}
