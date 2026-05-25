import { useEffect } from 'react';
import { isPlatformAuthoritative } from '@/runtime/platform-store-bridge';
import { useHospital } from '@/stores/hospitalStore';

export type ClinicalListSyncOptions = {
  /** Refresh lab + radiology + pharmacy branch worklists (use useDepartmentWorklistSync for SSE) */
  departmentWorklists?: boolean;
  /** Refresh active IPD admissions from domain-api */
  ipd?: boolean;
  /** Refresh OPD queue board */
  queue?: boolean;
  /** Refresh patient search index */
  patients?: boolean;
  /** Refresh appointment calendar */
  appointments?: boolean;
};

/**
 * Platform-first list hydration for clinical P0 screens.
 * Pair with useDepartmentWorklistSync on lab/radiology/pharmacy list routes for SSE.
 */
export function useClinicalPlatformListSync(options: ClinicalListSyncOptions = {}): void {
  const {
    refreshDepartmentWorklistsFromPlatform,
    refreshPlatformIpdSnapshots,
    refreshQueueFromPlatform,
    refreshPatientsFromPlatform,
    refreshAppointmentsFromPlatform,
  } = useHospital();

  useEffect(() => {
    if (!isPlatformAuthoritative()) return;
    const tasks: Promise<void>[] = [];
    if (options.departmentWorklists ?? true) {
      tasks.push(refreshDepartmentWorklistsFromPlatform());
    }
    if (options.ipd) tasks.push(refreshPlatformIpdSnapshots());
    if (options.queue) tasks.push(refreshQueueFromPlatform());
    if (options.patients) tasks.push(refreshPatientsFromPlatform());
    if (options.appointments) tasks.push(refreshAppointmentsFromPlatform());
    void Promise.all(tasks);
  }, [
    options.departmentWorklists,
    options.ipd,
    options.queue,
    options.patients,
    options.appointments,
    refreshDepartmentWorklistsFromPlatform,
    refreshPlatformIpdSnapshots,
    refreshQueueFromPlatform,
    refreshPatientsFromPlatform,
    refreshAppointmentsFromPlatform,
  ]);
}
