import { getClientOpdState } from '@/operations/lifecycle-guards';
import {
  platformOpdTransition,
  platformRecordMetering,
  type PlatformOpdVisit,
} from '@/runtime/opd-runtime';

export type PlatformEnqueueInput = {
  visitId: string;
  visitState: string;
  department: string;
  assignedDoctor: string;
  complaint?: string;
  appointment?: {
    startAt: string;
    endAt: string;
    resourceLabel: string;
    platformAppointmentId?: string;
  };
};

/** Run schedule (if needed) → check_in → route_to_department → issue_token on domain-api. */
export async function platformEnqueueOpdVisitToBoard(
  input: PlatformEnqueueInput,
): Promise<PlatformOpdVisit> {
  let activeVisit: PlatformOpdVisit = {
    id: input.visitId,
    state: input.visitState,
    patientId: '',
    branchId: '',
  };

  const from = getClientOpdState(input.visitState, 'registered');
  if (from === 'registered' && input.appointment) {
    ({ visit: activeVisit } = await platformOpdTransition(
      input.visitId,
      'schedule_or_walkin',
      { departmentSelected: true, doctorOrPoolAssigned: true },
      {
        appointment: {
          startAt: input.appointment.startAt,
          endAt: input.appointment.endAt,
          resourceLabel: input.appointment.resourceLabel,
        },
      },
    ));
  }

  ({ visit: activeVisit } = await platformOpdTransition(
    activeVisit.id,
    'check_in',
    {
      appointmentExistsOrWalkinAllowed: true,
      patientBalanceOk: true,
    },
    input.appointment?.platformAppointmentId
      ? { appointmentId: input.appointment.platformAppointmentId }
      : undefined,
  ));

  ({ visit: activeVisit } = await platformOpdTransition(
    activeVisit.id,
    'route_to_department',
    { departmentSelected: true, doctorOrPoolAssigned: true },
    {
      department: input.department,
      assignedDoctor: input.assignedDoctor,
    },
  ));

  ({ visit: activeVisit } = await platformOpdTransition(
    activeVisit.id,
    'issue_token',
    { tokenNotDuplicateToday: true },
    input.complaint ? { complaint: input.complaint } : undefined,
  ));

  await platformRecordMetering(
    ['opd.registration', 'opd.check_in', 'opd.department_routed', 'opd.token_issued'],
    activeVisit.id,
  );

  return activeVisit;
}
