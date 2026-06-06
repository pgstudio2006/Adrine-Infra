import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const DEV_DEFAULT_TENANT = 'tenant_dev';

export type RequestWithTenant = Request & { tenantId?: string; branchId?: string };

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, _res: Response, next: NextFunction) {
    const path = (req.path ?? req.url?.split('?')[0] ?? '').replace(/\/$/, '');
    const isRealtimeStream = path === '/realtime/stream' || path.endsWith('/realtime/stream');

    const header = req.header('x-tenant-id');
    const queryTenant =
      typeof req.query.tenantId === 'string' ? req.query.tenantId.trim() : undefined;
    const tenantId =
      req.tenantId ??
      header ??
      (isRealtimeStream ? queryTenant : undefined) ??
      (process.env.NODE_ENV !== 'production' ? DEV_DEFAULT_TENANT : undefined);
    if (!tenantId) {
      throw new UnauthorizedException('Missing x-tenant-id');
    }
    req.tenantId = tenantId;

    const branchHeader = req.header('x-branch-id')?.trim();
    const queryBranch =
      typeof req.query.branchId === 'string' ? req.query.branchId.trim() : undefined;
    const branchFromQuery = isRealtimeStream ? queryBranch : undefined;

    if (process.env.NODE_ENV === 'production' && !branchHeader && !branchFromQuery) {
      throw new UnauthorizedException('Missing x-branch-id');
    }
    if (branchHeader) {
      req.branchId = branchHeader;
    } else if (branchFromQuery) {
      req.branchId = branchFromQuery;
    }

    next();
  }
}
