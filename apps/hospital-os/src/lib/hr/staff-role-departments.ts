import { isNavayuTenant, NAVAYU_CLINICAL_DEPARTMENTS } from '@/lib/navayu/navayu-forms';

export const STAFF_REGISTER_ROLES: Record<string, string> = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  lab_technician: 'Lab Technician',
  pharmacist: 'Pharmacist',
  billing: 'Billing & Finance',
  radiologist: 'Radiologist',
  admin: 'Administrator',
};

const ROLE_DEPARTMENTS: Record<string, string[]> = {
  doctor: [
    'Spine & MSK',
    'Orthopedics',
    'Neurology',
    'General Medicine',
    'Cardiology',
    'Pediatrics',
  ],
  nurse: ['Spine & MSK', 'ICU', 'Emergency', 'Ward', 'OT', 'Maternity'],
  lab_technician: ['Pathology', 'Laboratory', 'Microbiology', 'Biochemistry'],
  pharmacist: ['Pharmacy'],
  receptionist: ['Front Desk', 'OPD Reception'],
  billing: ['Finance', 'Billing', 'Insurance'],
  radiologist: ['Radiology'],
  admin: ['Administration', 'IT', 'Operations', 'HR'],
};

export function departmentsForStaffRole(role: string): string[] {
  if (isNavayuTenant()) {
    if (role === 'doctor' || role === 'jr_doctor') {
      return [...NAVAYU_CLINICAL_DEPARTMENTS];
    }
    if (role === 'nurse') {
      return ['Spine & MSK', 'Physiotherapy', 'OPD', 'Procedure room'];
    }
    if (role === 'receptionist' || role === 'billing') {
      return ['Front Desk', 'Counselling', 'Navayu', 'Pataudi'];
    }
    if (role === 'lab_technician') {
      return ['Pataudi Laboratory'];
    }
  }
  return ROLE_DEPARTMENTS[role] ?? [];
}
