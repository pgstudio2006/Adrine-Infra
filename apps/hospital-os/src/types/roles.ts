export type UserRole = 
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'lab_technician'
  | 'pharmacist'
  | 'billing'
  | 'radiologist'
  | 'ot_coordinator'
  | 'inventory_manager'
  | 'emergency'
  | 'hr_manager'
  | 'scheduler'
  | 'dialysis_tech'
  | 'crm_manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  lab_technician: 'Lab Technician',
  pharmacist: 'Pharmacist',
  billing: 'Billing & Finance',
  radiologist: 'Radiologist',
  ot_coordinator: 'OT Coordinator',
  inventory_manager: 'Inventory Manager',
  emergency: 'Emergency / ER',
  hr_manager: 'HR & Staff',
  scheduler: 'Scheduling',
  dialysis_tech: 'Dialysis Unit',
  crm_manager: 'CRM & Patient Relations',
};

export type ModuleKey =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'opd'
  | 'ipd'
  | 'bed_management'
  | 'nursing'
  | 'laboratory'
  | 'radiology'
  | 'pharmacy'
  | 'billing'
  | 'revenue'
  | 'insurance'
  | 'ot_management'
  | 'inventory'
  | 'reports'
  | 'settings'
  | 'crm';

// Which roles can access which modules
export const ROLE_PERMISSIONS: Record<UserRole, ModuleKey[]> = {
  admin: [
    'dashboard', 'patients', 'appointments', 'opd', 'ipd', 'bed_management',
    'nursing', 'laboratory', 'radiology', 'pharmacy', 'billing', 'revenue',
    'insurance', 'ot_management', 'inventory', 'reports', 'settings', 'crm',
  ],
  doctor: [
    'dashboard', 'patients', 'appointments', 'opd', 'ipd', 'bed_management',
    'laboratory', 'radiology', 'ot_management', 'reports',
  ],
  nurse: [
    'dashboard', 'patients', 'ipd', 'bed_management', 'nursing', 'ot_management',
  ],
  receptionist: [
    'dashboard', 'patients', 'appointments', 'opd', 'bed_management', 'billing',
  ],
  lab_technician: [
    'dashboard', 'laboratory', 'reports',
  ],
  pharmacist: [
    'dashboard', 'pharmacy', 'inventory', 'reports',
  ],
  billing: [
    'dashboard', 'patients', 'billing', 'revenue', 'insurance', 'reports',
  ],
  radiologist: [
    'dashboard', 'radiology', 'reports',
  ],
  ot_coordinator: [
    'dashboard', 'ot_management', 'reports',
  ],
  inventory_manager: [
    'dashboard', 'inventory', 'reports',
  ],
  emergency: [
    'dashboard', 'patients', 'opd', 'ipd', 'laboratory', 'radiology', 'pharmacy', 'billing', 'reports',
  ],
  hr_manager: [
    'dashboard', 'reports', 'settings',
  ],
  scheduler: [
    'dashboard', 'appointments', 'patients', 'reports',
  ],
  dialysis_tech: [
    'dashboard', 'patients', 'billing', 'inventory', 'reports',
  ],
  crm_manager: [
    'dashboard', 'patients', 'appointments', 'crm', 'reports',
  ],
};

export function hasAccess(role: UserRole, module: ModuleKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}
