import type { PlatformDialysisMachine, PlatformDialysisSession } from '@/runtime/dialysis-runtime';

export function mapDialysisSessionRow(s: PlatformDialysisSession) {
  const time = s.scheduledAt
    ? new Date(s.scheduledAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '—';
  const status =
    s.state === 'in_progress' || s.state === 'monitoring'
      ? 'In Progress'
      : s.state === 'checked_in'
        ? 'Checked In'
        : s.state === 'completed'
          ? 'Completed'
          : 'Scheduled';
  const progress =
    s.state === 'in_progress' ? 65 : s.state === 'monitoring' ? 80 : s.state === 'checked_in' ? 20 : 0;
  return {
    id: s.id,
    patient: s.patient?.fullName ?? '—',
    uhid: s.patient?.mrn ?? s.id,
    time,
    machine: s.machine?.code ?? '—',
    tech: '—',
    status,
    progress,
  };
}

export function mapDialysisMachineRow(m: PlatformDialysisMachine, active?: PlatformDialysisSession) {
  const status =
    m.state === 'maintenance'
      ? 'Maintenance'
      : active
        ? 'In Use'
        : 'Available';
  return {
    id: m.code,
    model: m.model || 'Dialysis unit',
    status,
    patient: active?.patient?.fullName ?? null,
    hours: m.hoursRun,
  };
}
