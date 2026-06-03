import { UnauthorizedException } from '@nestjs/common';
import type { RequestWithTenant } from './tenant.middleware';

/** Prefer JWT/session branch header; never fall back to a fake branch in production. */
export function resolveRequestBranchId(
  req: RequestWithTenant,
  headerBranch?: string,
): string {
  const branchId = headerBranch?.trim() || req.branchId?.trim();
  if (branchId) {
    return branchId;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new UnauthorizedException('Missing x-branch-id');
  }
  return 'branch_main';
}
