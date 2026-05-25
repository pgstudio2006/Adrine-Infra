import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

  const isDoctor = user?.role === 'doctor';
  const doctorName = user?.name ?? '';
  const department = user?.department ?? '';

  const patientByUhid = useMemo(() => {
    return new Map(store.patients.map((patient) => [patient.uhid, patient]));
  }, [store.patients]);

  const matchesDepartment = useCallback((value?: string) => {
    if (!department) {
      return true;
    }
    return !value || value === department;
  }, [department]);

  const patients = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.patients.filter((patient) => {
      return patient.assignedDoctor === doctorName && matchesDepartment(patient.department);
    });
  }, [doctorName, isDoctor, matchesDepartment, store.patients]);

  const patientUhidSet = useMemo(() => {
    return new Set(patients.map((patient) => patient.uhid));
  }, [patients]);

  const appointments = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.appointments.filter((appointment) => {
      if (appointment.doctor !== doctorName) {
        return false;
      }
      if (!matchesDepartment(appointment.department)) {
        return false;
      }
      if (patientUhidSet.size > 0 && !patientUhidSet.has(appointment.uhid)) {
        return false;
      }
      return true;
    });
  }, [doctorName, isDoctor, matchesDepartment, patientUhidSet, store.appointments]);

  const queue = useMemo(() => {
    if (!isDoctor) {
      return [];
    }

    return store.queue.filter((entry) => {
      if (entry.doctor !== doctorName) {
        return false;
      }
      if (!matchesDepartment(entry.department)) {
        return false;
      }
      if (patientUhidSet.size > 0 && !patientUhidSet.has(entry.uhid)) {
        return false;
      }
      return true;
    });
  }, [doctorName, isDoctor, matchesDepartment, patientUhidSet, store.queue]);

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

    return patient.assignedDoctor === doctorName && matchesDepartment(patient.department);
  }, [doctorName, matchesDepartment, patientByUhid, scopedUhids]);

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
    return patientByUhid.get(uhid);
  }, [matchesScopedPatient, patientByUhid]);

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
