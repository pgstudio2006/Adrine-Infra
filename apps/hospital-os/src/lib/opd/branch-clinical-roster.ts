import { NAVAYU_CLINICAL_DEPARTMENTS, isNavayuTenant } from '@/lib/navayu/navayu-forms';

export const NAVAYU_MSK_JUNIOR = 'Dr. Junior MSK Associate';
export const NAVAYU_MSK_SENIOR = 'Dr. Senior MSK Consultant';

export const NAVAYU_MSK_DOCTORS = [NAVAYU_MSK_JUNIOR, NAVAYU_MSK_SENIOR] as const;

const DEFAULT_DEPARTMENT_DOCTORS: Record<string, string[]> = {
  'General Medicine': ['Dr. A. Shah', 'Dr. V. Reddy'],
  Cardiology: ['Dr. R. Mehta'],
  Orthopedics: ['Dr. K. Rao'],
  Gynecology: ['Dr. S. Iyer'],
  Pediatrics: ['Dr. P. Nair'],
  Dermatology: ['Dr. D. Kapoor'],
  ENT: ['Dr. L. Mohan'],
  Neurology: ['Dr. N. Joshi'],
};

const NAVAYU_DEPARTMENT_DOCTORS: Record<string, string[]> = Object.fromEntries(
  NAVAYU_CLINICAL_DEPARTMENTS.map((dept) => [dept, [...NAVAYU_MSK_DOCTORS]]),
);

export function isNavayuMskClinicalDepartment(dept?: string): boolean {
  if (!dept) return false;
  if (dept === 'MSK') return true;
  return NAVAYU_CLINICAL_DEPARTMENTS.includes(dept);
}

/** Match user login department (e.g. MSK) to visit routing department (e.g. Spine & MSK). */
export function departmentMatchesClinicalScope(userDept: string, entryDept?: string): boolean {
  if (!userDept) return true;
  if (!entryDept) return true;
  if (entryDept === userDept) return true;
  if (userDept === 'MSK' && isNavayuMskClinicalDepartment(entryDept)) return true;
  if (isNavayuMskClinicalDepartment(userDept) && entryDept === 'MSK') return true;
  return false;
}

export function getClinicalDoctorsForDepartment(dept: string): string[] {
  if (!dept) return [];
  if (isNavayuTenant()) {
    return NAVAYU_DEPARTMENT_DOCTORS[dept] ?? [...NAVAYU_MSK_DOCTORS];
  }
  return DEFAULT_DEPARTMENT_DOCTORS[dept] ?? ['Dr. A. Shah', 'Dr. V. Reddy'];
}

export function getDefaultAssignedDoctor(dept?: string): string {
  if (isNavayuTenant()) {
    return NAVAYU_MSK_JUNIOR;
  }
  if (dept) {
    const doctors = getClinicalDoctorsForDepartment(dept);
    if (doctors.length > 0) return doctors[0];
  }
  return 'Dr. A. Shah';
}

export function getClinicalDepartments(): string[] {
  if (isNavayuTenant()) {
    return [...NAVAYU_CLINICAL_DEPARTMENTS];
  }
  return Object.keys(DEFAULT_DEPARTMENT_DOCTORS);
}

export function isUnassignedDoctorName(name?: string | null): boolean {
  if (!name) return true;
  const normalized = name.trim().toLowerCase();
  return normalized === 'unassigned' || normalized === 'doctor on call';
}

export function shouldUseNavayuMskPoolQueue(): boolean {
  return isNavayuTenant();
}
