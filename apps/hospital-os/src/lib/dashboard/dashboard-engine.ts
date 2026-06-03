import type { OperationalSnapshot, OperationalSnapshotCounts } from '@adrine/hospital-operations';
import type { OperationalAnalyticsPayload } from '@/runtime/analytics-runtime';
import { canUseAnalyticsRuntime } from '@/runtime/analytics-runtime';
import { canUseCommandRuntime } from '@/runtime/command-runtime';
import { getPlatformSession } from '@/runtime/platform-session';

export type DashboardKpi = {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
};

export type DashboardEngineBundle = {
  branchId: string | null;
  snapshot: OperationalSnapshot | null;
  analytics: OperationalAnalyticsPayload | null;
  error: string | null;
};

export function canUseDashboardRuntime(): boolean {
  return canUseCommandRuntime() && canUseAnalyticsRuntime();
}

export function resolveDashboardBranchId(branchId?: string): string | null {
  return branchId ?? getPlatformSession()?.branchId ?? null;
}

export function buildAdminHomeKpis(
  counts: OperationalSnapshotCounts | undefined,
  analytics: OperationalAnalyticsPayload | null,
): DashboardKpi[] {
  if (!counts) return [];
  const m = analytics?.metrics ?? {};
  const visitsToday = typeof m.opdVisitsCreated === 'number' ? m.opdVisitsCreated : counts.opdActiveVisits;
  const bedsTotal = counts.bedsOccupied + counts.bedsAvailable;
  const occupancy =
    bedsTotal > 0 ? `${Math.round((counts.bedsOccupied / bedsTotal) * 100)}%` : '—';

  return [
    {
      id: 'opd-active',
      label: 'OPD active / queue',
      value: `${counts.opdActiveVisits} / ${counts.opdWaitingQueue}`,
      hint: `${visitsToday} visits (${analytics?.period ?? '24h'})`,
    },
    {
      id: 'ipd-active',
      label: 'IPD active',
      value: counts.ipdActiveAdmissions,
      hint: `${typeof m.admissionsCreated === 'number' ? m.admissionsCreated : 0} admits (${analytics?.period ?? '24h'})`,
    },
    {
      id: 'bed-occupancy',
      label: 'Bed occupancy',
      value: occupancy,
      hint: `${counts.bedsOccupied}/${bedsTotal || '—'} occupied`,
    },
    {
      id: 'lab-pending',
      label: 'Lab pending',
      value: counts.labPending,
      hint: counts.labCriticalUnacked > 0 ? `${counts.labCriticalUnacked} critical unacked` : undefined,
    },
    {
      id: 'rx-pending',
      label: 'Pharmacy pending',
      value: counts.pharmacyPending,
    },
    {
      id: 'discharge',
      label: 'Discharge in progress',
      value: counts.dischargeInProgress,
      hint: counts.openEscalations > 0 ? `${counts.openEscalations} escalations` : undefined,
    },
  ];
}

export function buildDoctorKpis(
  counts: OperationalSnapshotCounts | undefined,
  local: { patients: number; pendingReports: number; roundsDue: number },
): DashboardKpi[] {
  if (counts) {
    return [
      {
        id: 'opd-queue',
        label: 'OPD queue',
        value: counts.opdWaitingQueue,
        hint: `${counts.opdActiveVisits} active visits`,
      },
      {
        id: 'ipd',
        label: 'IPD census',
        value: counts.ipdActiveAdmissions,
        hint: `${local.roundsDue} rounds due (local)`,
      },
      {
        id: 'lab',
        label: 'Lab pending (branch)',
        value: counts.labPending,
        hint: `${local.pendingReports} in your worklist`,
      },
      {
        id: 'nursing',
        label: 'Nursing tasks',
        value: counts.nursingOpenTasks,
        hint: counts.nursingMissed > 0 ? `${counts.nursingMissed} missed` : undefined,
      },
    ];
  }

  return [
    { id: 'patients', label: 'Assigned patients', value: local.patients },
    { id: 'reports', label: 'Pending reports', value: local.pendingReports },
    { id: 'rounds', label: 'IPD rounds due', value: local.roundsDue },
  ];
}

export function buildMisHeaderKpis(
  counts: OperationalSnapshotCounts | undefined,
  analytics: OperationalAnalyticsPayload | null,
): DashboardKpi[] {
  if (!counts && !analytics) return [];
  const m = analytics?.metrics ?? {};
  return [
    {
      id: 'opd-visits',
      label: 'OPD visits',
      value: typeof m.opdVisitsCreated === 'number' ? m.opdVisitsCreated : (counts?.opdActiveVisits ?? '—'),
      hint: `Queue now: ${counts?.opdWaitingQueue ?? m.opdWaitProxy ?? '—'}`,
    },
    {
      id: 'ipd',
      label: 'IPD active',
      value: counts?.ipdActiveAdmissions ?? '—',
      hint: `${typeof m.admissionsCreated === 'number' ? m.admissionsCreated : '—'} admits (${analytics?.period ?? '7d'})`,
    },
    {
      id: 'discharges',
      label: 'Discharges',
      value: typeof m.dischargeTurnaround === 'number' ? m.dischargeTurnaround : (counts?.dischargeInProgress ?? '—'),
      hint: 'Period completions / in-progress',
    },
    {
      id: 'lab-rx',
      label: 'Lab / Rx pending',
      value: `${counts?.labPending ?? m.labPending ?? '—'} / ${counts?.pharmacyPending ?? m.pharmacyPending ?? '—'}`,
    },
  ];
}

export const API_BACKED_DASHBOARD_ROUTES = new Set([
  '/admin',
  '/admin/command-center',
  '/admin/mis',
  '/doctor',
]);

export function routeRequiresApiForLiveBadge(pathname: string): boolean {
  if (API_BACKED_DASHBOARD_ROUTES.has(pathname)) return true;
  return false;
}
