import { NAVAYU_CLINICAL_DEPARTMENTS } from '@/lib/navayu/navayu-forms';
import {
  NAVAYU_OPD_DEPARTMENT_DEFAULTS,
  NAVAYU_OPD_DEPARTMENT_DOCTOR_DEFAULTS,
} from '@/lib/navayu/navayu-opd-departments';
import type { NavayuOpdDepartment, TenantMasterData } from '@/config/tenantSettings';

export const ADMIN_DASHBOARD_SECTION_OPTIONS: Array<{ key: string; label: string; description: string }> = [
  { key: 'msk_pipeline', label: 'MSK Patient Pipeline', description: 'OPD queue, counselling and package conversion snapshot' },
  { key: 'expense_pulse', label: 'Expense Pulse', description: 'Outgoing spend summary and category trend' },
  { key: 'approval_queue', label: 'Approval Queue', description: 'Pending department bills and pharmacy supplier orders' },
  { key: 'staff_snapshot', label: 'Staff Snapshot', description: 'Active staff count and HR quick links' },
  { key: 'mis_quick_access', label: 'MIS Quick Access', description: 'One-click exportable operational reports' },
  { key: 'disease_mapping', label: 'Disease Mapping', description: 'MSK condition clusters and catchment alerts' },
];

export const NAVAYU_DEFAULT_ROLE_DEPARTMENTS: Record<string, string[]> = {
  doctor: [...NAVAYU_CLINICAL_DEPARTMENTS],
  jr_doctor: [...NAVAYU_CLINICAL_DEPARTMENTS],
  nurse: ['Spine & MSK', 'Physiotherapy', 'OPD', 'Procedure room'],
  receptionist: ['Front Desk', 'Counselling', 'Navayu', 'Pataudi'],
  billing: ['Front Desk', 'Counselling', 'Navayu', 'Pataudi'],
  lab_technician: ['Pataudi Laboratory'],
  pharmacist: ['Pharmacy'],
  radiologist: ['Radiology'],
  admin: ['Administration', 'Operations', 'Navayu'],
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Rent',
  'Electricity',
  'Water',
  'Medical Equipment',
  'Pharmacy Purchase',
  'Maintenance',
  'Staff Training',
  'IT Services',
  'Marketing',
  'Utilities',
  'Other',
];

export const DEFAULT_MASTER_DATA: TenantMasterData = {
  doctorDepartments: [...NAVAYU_CLINICAL_DEPARTMENTS],
  expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
  roleDepartments: { ...NAVAYU_DEFAULT_ROLE_DEPARTMENTS },
  adminDashboardSections: ADMIN_DASHBOARD_SECTION_OPTIONS.map((item) => item.key),
  opdDepartments: [...NAVAYU_OPD_DEPARTMENT_DEFAULTS],
  opdDepartmentDoctors: { ...NAVAYU_OPD_DEPARTMENT_DOCTOR_DEFAULTS },
};

function coerceOpdDepartments(input?: unknown): NavayuOpdDepartment[] {
  if (!Array.isArray(input) || input.length === 0) {
    return DEFAULT_MASTER_DATA.opdDepartments ?? [...NAVAYU_OPD_DEPARTMENT_DEFAULTS];
  }
  const parsed = input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === 'string' ? row.id.trim() : '';
      const label = typeof row.label === 'string' ? row.label.trim() : '';
      const clinicalDepartments = Array.isArray(row.clinicalDepartments)
        ? row.clinicalDepartments.filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
        : [];
      if (!id || !label) return null;
      return { id, label, clinicalDepartments };
    })
    .filter((item): item is NavayuOpdDepartment => item !== null);
  return parsed.length > 0 ? parsed : DEFAULT_MASTER_DATA.opdDepartments ?? [...NAVAYU_OPD_DEPARTMENT_DEFAULTS];
}

function coerceOpdDepartmentDoctors(input?: unknown): Record<string, string[]> {
  const defaults = DEFAULT_MASTER_DATA.opdDepartmentDoctors ?? NAVAYU_OPD_DEPARTMENT_DOCTOR_DEFAULTS;
  if (!input || typeof input !== 'object') return { ...defaults };
  const result: Record<string, string[]> = { ...defaults };
  Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      result[key] = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  });
  return result;
}

const STORAGE_KEY = 'adrine_tenant_settings';

export function readMasterDataFromStorage(): TenantMasterData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_MASTER_DATA;
    }
    const parsed = JSON.parse(raw) as { masterData?: Partial<TenantMasterData> };
    return coerceMasterData(parsed.masterData);
  } catch {
    return DEFAULT_MASTER_DATA;
  }
}

export function coerceMasterData(input?: Partial<TenantMasterData> | null): TenantMasterData {
  const roleDepartments = { ...DEFAULT_MASTER_DATA.roleDepartments };
  if (input?.roleDepartments) {
    Object.entries(input.roleDepartments).forEach(([role, departments]) => {
      if (Array.isArray(departments) && departments.length > 0) {
        roleDepartments[role] = departments.filter((item) => typeof item === 'string' && item.trim());
      }
    });
  }

  const doctorDepartments =
    Array.isArray(input?.doctorDepartments) && input.doctorDepartments.length > 0
      ? input.doctorDepartments.filter((item) => typeof item === 'string' && item.trim())
      : DEFAULT_MASTER_DATA.doctorDepartments;

  const expenseCategories =
    Array.isArray(input?.expenseCategories) && input.expenseCategories.length > 0
      ? input.expenseCategories.filter((item) => typeof item === 'string' && item.trim())
      : DEFAULT_MASTER_DATA.expenseCategories;

  const allowed = new Set(ADMIN_DASHBOARD_SECTION_OPTIONS.map((item) => item.key));
  const adminDashboardSections =
    Array.isArray(input?.adminDashboardSections) && input.adminDashboardSections.length > 0
      ? input.adminDashboardSections.filter((key) => allowed.has(key))
      : DEFAULT_MASTER_DATA.adminDashboardSections;

  return {
    doctorDepartments,
    expenseCategories,
    roleDepartments,
    adminDashboardSections,
    opdDepartments: coerceOpdDepartments(input?.opdDepartments),
    opdDepartmentDoctors: coerceOpdDepartmentDoctors(input?.opdDepartmentDoctors),
  };
}

export function departmentsForRoleFromMasterData(role: string, masterData?: TenantMasterData): string[] {
  const data = masterData ?? readMasterDataFromStorage();
  if (role === 'doctor' || role === 'jr_doctor') {
    return data.doctorDepartments.length > 0 ? data.doctorDepartments : DEFAULT_MASTER_DATA.doctorDepartments;
  }
  return data.roleDepartments[role] ?? [];
}

export function getClinicalDepartmentsFromMasterData(masterData?: TenantMasterData): string[] {
  const data = masterData ?? readMasterDataFromStorage();
  return data.doctorDepartments.length > 0 ? data.doctorDepartments : DEFAULT_MASTER_DATA.doctorDepartments;
}
