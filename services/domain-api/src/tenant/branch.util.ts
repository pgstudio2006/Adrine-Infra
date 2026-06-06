import { UnauthorizedException } from '@nestjs/common';
import type { RequestWithTenant } from './tenant.middleware';

/** Prefer middleware-validated branch; never fall back to a fake branch in production. */
export function resolveRequestBranchId(
  req: RequestWithTenant,
  queryBranch?: string,
): string {
  const branchId = req.branchId?.trim() || queryBranch?.trim();
  if (branchId) {
    return branchId;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new UnauthorizedException('Missing x-branch-id');
  }
  return 'branch_main';
}

/** Tenant from middleware — required in production (no dev default). */
export function resolveRequestTenantId(req: RequestWithTenant): string {
  const tenantId = req.tenantId?.trim();
  if (tenantId) {
    return tenantId;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new UnauthorizedException('Missing x-tenant-id');
  }
  return 'tenant_dev';
}
