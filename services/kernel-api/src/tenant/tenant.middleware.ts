import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const DEV_DEFAULT_TENANT = 'tenant_dev';

export type RequestWithTenant = Request & { tenantId?: string };

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, _res: Response, next: NextFunction) {
    const header = req.header('x-tenant-id');
    const tenantId =
      header ?? (process.env.NODE_ENV !== 'production' ? DEV_DEFAULT_TENANT : undefined);
    if (!tenantId) {
      throw new UnauthorizedException('Missing x-tenant-id');
    }
    req.tenantId = tenantId;
    next();
  }
}
