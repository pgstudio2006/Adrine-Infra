import type { PlatformOtCase, PlatformOtRoom } from '@/runtime/ot-runtime';

export type OtRoomUiStatus = 'in_progress' | 'preparing' | 'available' | 'cleaning';

export function mapOtRoomState(room: PlatformOtRoom): OtRoomUiStatus {
  if (room.state === 'occupied') return 'in_progress';
  if (room.state === 'reserved' || room.state === 'preparing') return 'preparing';
  if (room.state === 'cleaning') return 'cleaning';
  return 'available';
}

export function mapOtCaseToRoomCard(
  room: PlatformOtRoom,
  activeCase?: PlatformOtCase,
) {
  const status = activeCase ? mapOtCaseStateToRoomStatus(activeCase.state) : mapOtRoomState(room);
  return {
    room: room.code,
    label: room.label,
    status,
    surgery: activeCase?.procedureName ?? '—',
    surgeon: activeCase?.surgeonName ?? '—',
    patient: activeCase?.patient
      ? `${activeCase.patient.fullName} (${activeCase.patient.mrn ?? activeCase.id})`
      : '—',
    startedAt: activeCase?.scheduledAt
      ? new Date(activeCase.scheduledAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—',
    elapsed: activeCase?.state === 'in_progress' ? 'Active' : '—',
    progress: activeCase?.state === 'in_progress' ? 50 : activeCase ? 15 : 0,
    team: activeCase ? 4 : 0,
  };
}

function mapOtCaseStateToRoomStatus(state: string): OtRoomUiStatus {
  if (state === 'in_progress') return 'in_progress';
  if (state === 'preop_ready' || state === 'confirmed') return 'preparing';
  if (state === 'postop_recovery') return 'cleaning';
  return 'available';
}

export function mapOtCaseToScheduleRow(c: PlatformOtCase) {
  const time = c.scheduledAt
    ? new Date(c.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—';
  return {
    id: c.id,
    time,
    endTime: time,
    surgery: c.procedureName,
    patient: c.patient?.fullName ?? '—',
    uhid: c.patient?.mrn ?? c.id,
    surgeon: c.surgeonName ?? '—',
    room: c.otRoom?.code ?? 'TBD',
    priority: (c.priority as 'elective' | 'urgent' | 'emergency') ?? 'elective',
    status: mapOtStateToScheduleStatus(c.state),
    anesthesia: '—',
    duration: '—',
  };
}

function mapOtStateToScheduleStatus(
  state: string,
): 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' {
  if (state === 'in_progress' || state === 'postop_recovery') return 'in_progress';
  if (state === 'confirmed' || state === 'preop_ready') return 'confirmed';
  if (state === 'completed') return 'completed';
  if (state === 'cancelled') return 'cancelled';
  return 'scheduled';
}
