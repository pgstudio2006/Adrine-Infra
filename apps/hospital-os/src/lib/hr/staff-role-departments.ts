import { departmentsForRoleFromMasterData } from '@/lib/admin/master-data';

export const STAFF_REGISTER_ROLES: Record<string, string> = {
  doctor: 'Doctor',
  jr_doctor: 'Junior Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  lab_technician: 'Lab Technician',
  pharmacist: 'Pharmacist',
  billing: 'Counsellor',
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
  jr_doctor: ['Spine & MSK', 'Orthopedics', 'Neurology'],
  nurse: ['Spine & MSK', 'ICU', 'Emergency', 'Ward', 'OT', 'Maternity'],
  lab_technician: ['Pathology', 'Laboratory', 'Microbiology', 'Biochemistry'],
  pharmacist: ['Pharmacy'],
  receptionist: ['Front Desk', 'OPD Reception'],
  billing: ['Finance', 'Billing', 'Insurance'],
  radiologist: ['Radiology'],
  admin: ['Administration', 'IT', 'Operations', 'HR'],
};

export function departmentsForStaffRole(role: string): string[] {
  const fromMaster = departmentsForRoleFromMasterData(role);
  if (fromMaster.length > 0) {
    return fromMaster;
  }
  return ROLE_DEPARTMENTS[role] ?? [];
}
