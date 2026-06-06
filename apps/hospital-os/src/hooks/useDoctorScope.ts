import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPlatformSession } from '@/runtime/platform-session';
import { isPlatformAuthoritative } from '@/runtime/platform-store-bridge';
import { scopeQueueToBranch } from '@/lib/navayu/navayu-queue';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';
import {
  departmentMatchesClinicalScope,
  isUnassignedDoctorName,
  matchesNavayuMskPoolDoctorAssignment,
  shouldUseNavayuMskPoolQueue,
} from '@/lib/opd/branch-clinical-roster';
import {
  useHospital,
  type HospitalPatient,
  type HospitalAppointment,
  type QueueEntry,
  type LabOrder,
  type RadiologyOrder,
  type AdmissionCase,
  type BillingInvoice,
  type PrescriptionOrder,
} from '@/stores/hospitalStore';

interface DoctorScope {
  isDoctor: boolean;
  doctorName: string;
  department: string;
  patients: HospitalPatient[];
  appointments: HospitalAppointment[];
  queue: QueueEntry[];
  labOrders: LabOrder[];
  radiologyOrders: RadiologyOrder[];
  admissions: AdmissionCase[];
  invoices: BillingInvoice[];
  prescriptions: PrescriptionOrder[];
  scopedUhids: Set<string>;
  canAccessPatient: (uhid: string) => boolean;
  getPatient: (uhid: string) => HospitalPatient | undefined;
}

export function useDoctorScope(): DoctorScope {
  const { user } = useAuth();
  const store = useHospital();

  const isDoctor = user?.role === 'doctor' || user?.role === 'jr_doctor';
  const doctorName = user?.name ?? '';
  const department = user?.department ?? '';
  const navayuPoolQueue = shouldUseNavayuMskPoolQueue() && isPlatformAuthoritative();

  const patientByUhid = useMemo(() => {
    return new Map(store.patients.map((patient) => [patient.uhid, patient]));
  }, [store.patients]);

  const matchesDepartment = useCallback((value?: string) => {
    if (!department) {
      return true;
    }
    if (isNavayuTenant()) {
      return departmentMatchesClinicalScope(department, value);
    }
    return !value || value === department;
  }, [department]);

  const poolViewer = useMemo(
    () => ({ name: doctorName, role: user?.role, department }),
    [department, doctorName, user?.role],
  );

  const matchesQueueDoctor = useCallback((entry: QueueEntry) => {
    if (!matchesDepartment(entry.department)) {
      return false;
    }
    if (!navayuPoolQueue) {
      return entry.doctor === doctorName;
    }
    return matchesNavayuMskPoolDoctorAssignment(entry.doctor, poolViewer, entry.department);
  }, [doctorName, matchesDepartment, navayuPoolQueue, poolViewer]);

  const patients = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.patients.filter((patient) => {
      if (navayuPoolQueue && matchesDepartment(patient.department)) {
        const onBranchBoard = store.queue.some(
          (entry) =>
            entry.uhid === patient.uhid &&
            matchesDepartment(entry.department) &&
            matchesNavayuMskPoolDoctorAssignment(entry.doctor, poolViewer, entry.department),
        );
        if (onBranchBoard) {
          return true;
        }
        return (
          patient.assignedDoctor === doctorName ||
          isUnassignedDoctorName(patient.assignedDoctor) ||
          matchesNavayuMskPoolDoctorAssignment(
            patient.assignedDoctor,
            poolViewer,
            patient.department,
          )
        );
      }
      return patient.assignedDoctor === doctorName && matchesDepartment(patient.department);
    });
  }, [doctorName, isDoctor, matchesDepartment, navayuPoolQueue, poolViewer, store.patients, store.queue]);

  const patientUhidSet = useMemo(() => {
    return new Set(patients.map((patient) => patient.uhid));
  }, [patients]);

  const appointments = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.appointments.filter((appointment) => {
      if (appointment.doctor !== doctorName && !(navayuPoolQueue && matchesDepartment(appointment.department))) {
        return false;
      }
      if (!matchesDepartment(appointment.department)) {
        return false;
      }
      if (!navayuPoolQueue && patientUhidSet.size > 0 && !patientUhidSet.has(appointment.uhid)) {
        return false;
      }
      return true;
    });
  }, [doctorName, isDoctor, matchesDepartment, navayuPoolQueue, patientUhidSet, store.appointments]);

  const queue = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    const branchScoped = isPlatformAuthoritative()
      ? scopeQueueToBranch(store.queue)
      : store.queue;

    return branchScoped.filter((entry) => {
      if (!matchesQueueDoctor(entry)) {
        return false;
      }
      if (!matchesDepartment(entry.department)) {
        return false;
      }
      if (!navayuPoolQueue && patientUhidSet.size > 0 && !patientUhidSet.has(entry.uhid)) {
        return false;
      }
      if (isPlatformAuthoritative()) {
        const branchId = getPlatformSession()?.branchId;
        if (branchId && entry.branchId && entry.branchId !== branchId) {
          return false;
        }
      }
      return true;
    });
  }, [doctorName, isDoctor, matchesDepartment, matchesQueueDoctor, navayuPoolQueue, patientUhidSet, store.queue]);

  const admissions = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.admissions.filter((admission) => {
      const managesAdmission = admission.attendingDoctor === doctorName || admission.roundingDoctor === doctorName;
      if (!managesAdmission) {
        return false;
      }

      const patient = patientByUhid.get(admission.uhid);
      if (!matchesDepartment(patient?.department)) {
        return false;
      }

      if (patientUhidSet.size > 0 && !patientUhidSet.has(admission.uhid)) {
        return false;
      }

      return true;
    });
  }, [doctorName, isDoctor, matchesDepartment, patientByUhid, patientUhidSet, store.admissions]);

  const scopedUhids = useMemo(() => {
    const next = new Set<string>();
    patients.forEach((patient) => next.add(patient.uhid));
    appointments.forEach((appointment) => next.add(appointment.uhid));
    queue.forEach((entry) => next.add(entry.uhid));
    admissions.forEach((admission) => next.add(admission.uhid));
    return next;
  }, [patients, appointments, queue, admissions]);

  const canAccessPatient = useCallback((uhid: string) => scopedUhids.has(uhid), [scopedUhids]);

  const matchesScopedPatient = useCallback((uhid: string) => {
    if (!uhid) {
      return false;
    }

    if (scopedUhids.has(uhid)) {
      return true;
    }

    const patient = patientByUhid.get(uhid);
    if (!patient) {
      return false;
    }

    if (navayuPoolQueue && matchesDepartment(patient.department)) {
      return (
        patient.assignedDoctor === doctorName ||
        isUnassignedDoctorName(patient.assignedDoctor) ||
        matchesNavayuMskPoolDoctorAssignment(
          patient.assignedDoctor,
          poolViewer,
          patient.department,
        )
      );
    }

    return patient.assignedDoctor === doctorName && matchesDepartment(patient.department);
  }, [doctorName, matchesDepartment, navayuPoolQueue, patientByUhid, poolViewer, scopedUhids]);

  const labOrders = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.labOrders.filter((order) => {
      if (order.doctor !== doctorName) {
        return false;
      }
      return matchesScopedPatient(order.uhid);
    });
  }, [doctorName, isDoctor, matchesScopedPatient, store.labOrders]);

  const radiologyOrders = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.radiologyOrders.filter((order) => {
      if (order.doctor !== doctorName) {
        return false;
      }
      return matchesScopedPatient(order.uhid);
    });
  }, [doctorName, isDoctor, matchesScopedPatient, store.radiologyOrders]);

  const prescriptions = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.prescriptions.filter((prescription) => {
      if (prescription.doctor !== doctorName) {
        return false;
      }
      return matchesScopedPatient(prescription.uhid);
    });
  }, [doctorName, isDoctor, matchesScopedPatient, store.prescriptions]);

  const invoices = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.invoices.filter((invoice) => matchesScopedPatient(invoice.uhid));
  }, [isDoctor, matchesScopedPatient, store.invoices]);

  const getPatient = useCallback((uhid: string) => {
    if (!matchesScopedPatient(uhid)) {
      return undefined;
    }
    const fromStore = patientByUhid.get(uhid);
    if (fromStore) {
      return fromStore;
    }
    const queueEntry = store.queue.find((entry) => entry.uhid === uhid);
    if (!queueEntry) {
      return undefined;
    }
    return {
      uhid,
      name: queueEntry.patientName,
      age: 0,
      gender: '',
      phone: '',
      category: 'general' as const,
      patientType: 'OPD' as const,
      registeredOn: '',
      department: queueEntry.department,
      assignedDoctor: queueEntry.doctor,
      platformOpdVisitId: queueEntry.platformOpdVisitId,
    };
  }, [matchesScopedPatient, patientByUhid, store.queue]);

  return {
    isDoctor,
    doctorName,
    department,
    patients,
    appointments,
    queue,
    labOrders,
    radiologyOrders,
    admissions,
    invoices,
    prescriptions,
    scopedUhids,
    canAccessPatient,
    getPatient,
  };
}
