import { NAVAYU_MSK_SENIOR } from '@/lib/opd/branch-clinical-roster';
import { isNavayuTenant, NAVAYU_CLINICAL_DEPARTMENTS } from '@/lib/navayu/navayu-forms';

export type SeniorDoctor = {
  id: string;
  name: string;
  department: string;
  active: boolean;
};

export type DoctorLeaveEntry = {
  id: string;
  doctorId: string;
  doctorName: string;
  fromDate: string;
  toDate: string;
  reason: string;
};

const DOCTORS_KEY = 'adrine_senior_doctors';
const LEAVE_KEY = 'adrine_doctor_leave';

function defaultSeniorDoctors(): SeniorDoctor[] {
  if (isNavayuTenant()) {
    return [
      {
        id: 'sr_doc_navayu_senior',
        name: NAVAYU_MSK_SENIOR,
        department: NAVAYU_CLINICAL_DEPARTMENTS[0] ?? 'Spine & MSK',
        active: true,
      },
    ];
  }
  return [
    { id: 'sr_doc_1', name: 'Dr. R. Mehta', department: 'Cardiology', active: true },
    { id: 'sr_doc_2', name: 'Dr. K. Rao', department: 'Orthopedics', active: true },
  ];
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function listSeniorDoctors(): SeniorDoctor[] {
  const stored = readJson<SeniorDoctor[] | null>(DOCTORS_KEY, null);
  const doctors = stored?.length ? stored : defaultSeniorDoctors();
  return doctors.filter((doctor) => doctor.active);
}

export function listAllSeniorDoctors(): SeniorDoctor[] {
  const stored = readJson<SeniorDoctor[] | null>(DOCTORS_KEY, null);
  return stored?.length ? stored : defaultSeniorDoctors();
}

export function saveSeniorDoctors(doctors: SeniorDoctor[]): void {
  writeJson(DOCTORS_KEY, doctors);
}

export function upsertSeniorDoctor(doctor: Omit<SeniorDoctor, 'id'> & { id?: string }): SeniorDoctor {
  const doctors = listAllSeniorDoctors();
  const entry: SeniorDoctor = {
    id: doctor.id ?? `sr_doc_${Date.now()}`,
    name: doctor.name.trim(),
    department: doctor.department.trim(),
    active: doctor.active,
  };
  const index = doctors.findIndex((item) => item.id === entry.id);
  if (index >= 0) {
    doctors[index] = entry;
  } else {
    doctors.push(entry);
  }
  saveSeniorDoctors(doctors);
  return entry;
}

export function removeSeniorDoctor(doctorId: string): void {
  saveSeniorDoctors(listAllSeniorDoctors().filter((doctor) => doctor.id !== doctorId));
}

export function listDoctorLeave(): DoctorLeaveEntry[] {
  return readJson<DoctorLeaveEntry[]>(LEAVE_KEY, []);
}

export function saveDoctorLeave(entries: DoctorLeaveEntry[]): void {
  writeJson(LEAVE_KEY, entries);
}

export function addDoctorLeave(entry: Omit<DoctorLeaveEntry, 'id'>): DoctorLeaveEntry {
  const next: DoctorLeaveEntry = { ...entry, id: `leave_${Date.now()}` };
  const entries = listDoctorLeave();
  entries.push(next);
  saveDoctorLeave(entries);
  return next;
}

export function removeDoctorLeave(leaveId: string): void {
  saveDoctorLeave(listDoctorLeave().filter((entry) => entry.id !== leaveId));
}

export function isDoctorOnLeave(doctorName: string, dateYmd: string): boolean {
  const target = new Date(`${dateYmd}T12:00:00`).getTime();
  return listDoctorLeave().some((entry) => {
    if (entry.doctorName !== doctorName) return false;
    const from = new Date(`${entry.fromDate}T00:00:00`).getTime();
    const to = new Date(`${entry.toDate}T23:59:59`).getTime();
    return target >= from && target <= to;
  });
}
