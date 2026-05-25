import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function kernelBase(): string | undefined {
  return import.meta.env.VITE_KERNEL_API_URL as string | undefined;
}

export type PlatformStaffMember = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchId: string;
  assignments: Array<{
    id: string;
    roleTemplateId: string;
    departmentCode?: string | null;
    roleTemplate: { code: string; label: string };
  }>;
  createdAt: string;
};

export type PlatformDepartment = {
  id: string;
  code: string;
  name: string;
};

export type PlatformHrStaffResponse = {
  staff: PlatformStaffMember[];
  departments: PlatformDepartment[];
};

export function canUseHrRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!kernelBase() && !!getPlatformSession();
}

export async function platformListHrStaff(branchId?: string): Promise<PlatformHrStaffResponse> {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId ?? 'branch_main';
  return platformFetch<PlatformHrStaffResponse>(
    kernelBase()!,
    `/hr/staff?branchId=${encodeURIComponent(bid)}`,
  );
}

export async function platformListHrDepartments(branchId?: string): Promise<PlatformDepartment[]> {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId ?? 'branch_main';
  return platformFetch<PlatformDepartment[]>(
    kernelBase()!,
    `/hr/departments?branchId=${encodeURIComponent(bid)}`,
  );
}

export async function platformAssignStaff(input: {
  branchId: string;
  userId: string;
  roleTemplateId: string;
  departmentCode?: string;
}): Promise<unknown> {
  return platformFetch(kernelBase()!, '/hr/staff/assignments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
