import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { resolveTenantIdFromSlug } from '../public-booking/tenant-slugs';
import type { RequestWithTenant } from './tenant.middleware';

const DEV_DEFAULT_TENANT = 'tenant_dev';

/** Sets tenantId from slug on public booking routes (no x-tenant-id header). */
@Injectable()
export class PublicBookingTenantMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, _res: Response, next: NextFunction) {
    const match = req.path.match(/^\/public\/booking\/([^/]+)/);
    if (match) {
      const tenantId = resolveTenantIdFromSlug(match[1]);
      if (tenantId) {
        req.tenantId = tenantId;
        return next();
      }
    }
    next();
  }
}

export { DEV_DEFAULT_TENANT };
