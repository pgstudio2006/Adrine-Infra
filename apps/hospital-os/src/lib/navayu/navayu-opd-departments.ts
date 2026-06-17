import { readMasterDataFromStorage } from '@/lib/admin/master-data';
import {
  getClinicalDoctorsForDepartment,
  NAVAYU_MSK_DOCTORS,
  NAVAYU_MSK_JUNIOR,
  NAVAYU_MSK_SENIOR,
} from '@/lib/opd/branch-clinical-roster';
import type { NavayuOpdDepartment, TenantMasterData } from '@/config/tenantSettings';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';

export const NAVAYU_OPD_DEPARTMENT_DEFAULTS: NavayuOpdDepartment[] = [
  {
    id: 'spine_joint',
    label: 'Spine & Joint Care',
    clinicalDepartments: ['Spine & MSK', 'Joint/Knee', 'Sports Injury', 'Shoulder', 'Neck Pain', 'Back Pain'],
  },
  {
    id: 'wellness_metabolic',
    label: 'Wellness & Metabolic',
    clinicalDepartments: ['Physiotherapy'],
  },
];

export const NAVAYU_OPD_DEPARTMENT_DOCTOR_DEFAULTS: Record<string, string[]> = {
  spine_joint: [NAVAYU_MSK_SENIOR, NAVAYU_MSK_JUNIOR],
  wellness_metabolic: [NAVAYU_MSK_JUNIOR],
  'Spine & Joint Care': [NAVAYU_MSK_SENIOR, NAVAYU_MSK_JUNIOR],
  'Wellness & Metabolic': [NAVAYU_MSK_JUNIOR],
};

export function getNavayuOpdDepartments(masterData?: TenantMasterData): NavayuOpdDepartment[] {
  const data = masterData ?? readMasterDataFromStorage();
  if (Array.isArray(data.opdDepartments) && data.opdDepartments.length > 0) {
    return data.opdDepartments;
  }
  return NAVAYU_OPD_DEPARTMENT_DEFAULTS;
}

function resolveOpdDepartmentKey(dept: string, masterData?: TenantMasterData): string | null {
  if (!dept) return null;
  const departments = getNavayuOpdDepartments(masterData);
  const byId = departments.find((item) => item.id === dept);
  if (byId) return byId.id;
  const byLabel = departments.find((item) => item.label === dept);
  if (byLabel) return byLabel.id;
  return null;
}

export function getOpdDepartmentLabel(deptIdOrLabel: string, masterData?: TenantMasterData): string {
  const departments = getNavayuOpdDepartments(masterData);
  const match =
    departments.find((item) => item.id === deptIdOrLabel) ??
    departments.find((item) => item.label === deptIdOrLabel);
  return match?.label ?? deptIdOrLabel;
}

export function mapOpdDepartmentToClinical(deptIdOrLabel: string, masterData?: TenantMasterData): string {
  const departments = getNavayuOpdDepartments(masterData);
  const match =
    departments.find((item) => item.id === deptIdOrLabel) ??
    departments.find((item) => item.label === deptIdOrLabel);
  return match?.clinicalDepartments[0] ?? deptIdOrLabel;
}

export function getDoctorsForDepartment(dept: string, masterData?: TenantMasterData): string[] {
  if (!dept) return [];
  const data = masterData ?? readMasterDataFromStorage();
  const key = resolveOpdDepartmentKey(dept, data);
  const label = key ? getOpdDepartmentLabel(key, data) : dept;

  const fromMaster = data.opdDepartmentDoctors?.[key ?? ''] ?? data.opdDepartmentDoctors?.[label];
  if (fromMaster?.length) return fromMaster;

  const fromDefaults =
    NAVAYU_OPD_DEPARTMENT_DOCTOR_DEFAULTS[key ?? ''] ??
    NAVAYU_OPD_DEPARTMENT_DOCTOR_DEFAULTS[label];
  if (fromDefaults?.length) return fromDefaults;

  if (isNavayuTenant()) {
    const clinical = mapOpdDepartmentToClinical(dept, data);
    const roster = getClinicalDoctorsForDepartment(clinical);
    if (roster.length) return roster;
    return [...NAVAYU_MSK_DOCTORS];
  }

  return getClinicalDoctorsForDepartment(dept);
}

export function navayuOpdDepartmentOptions(masterData?: TenantMasterData): Array<{ value: string; label: string }> {
  return getNavayuOpdDepartments(masterData).map((item) => ({
    value: item.id,
    label: item.label,
  }));
}
