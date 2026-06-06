import { platformFetch } from './platform-client';

export type PortalBranch = {
  id: string;
  code: string;
  name: string;
  timezone: string | null;
};

export type HospitalGateResponse = {
  tenantId: string;
  organizationName: string;
  branches: PortalBranch[];
  canAccessAllBranches: boolean;
  userBranchId: string;
  verifiedEmail: string;
};

export type BranchPortalRole = {
  role: string;
  label: string;
  description: string;
};

function kernelUrl(): string {
  const url = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
  if (!url?.trim()) {
    throw new Error('VITE_KERNEL_API_URL is not configured');
  }
  return url;
}

function defaultTenantId(): string {
  return (import.meta.env.VITE_DEV_TENANT_ID as string | undefined)?.trim() || 'tenant_navayu';
}

export async function verifyHospitalGate(email: string, password: string): Promise<HospitalGateResponse> {
  return platformFetch<HospitalGateResponse>(
    kernelUrl(),
    '/auth/hospital-gate',
    {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password,
        tenantId: defaultTenantId(),
      }),
    },
    { unauthenticated: true },
  );
}

export async function fetchBranchPortalRoles(
  branchId: string,
  tenantId: string,
): Promise<BranchPortalRole[]> {
  const query = new URLSearchParams({ tenantId });
  const result = await platformFetch<{ roles: BranchPortalRole[] }>(
    kernelUrl(),
    `/auth/branches/${encodeURIComponent(branchId)}/portal-roles?${query}`,
    undefined,
    { unauthenticated: true },
  );
  return result.roles ?? [];
}
