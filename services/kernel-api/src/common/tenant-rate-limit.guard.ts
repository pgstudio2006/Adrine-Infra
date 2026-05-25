import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

const buckets = new Map<string, { count: number; resetAt: number }>();

/** In-memory per-tenant rate limit (MVP). Env: RATE_LIMIT_RPM default 120 */
@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const tenantId =
      (req.headers['x-tenant-id'] as string | undefined) ?? 'tenant_dev';
    const limit = Number(process.env.RATE_LIMIT_RPM ?? 120);
    const windowMs = 60_000;
    const now = Date.now();
    const bucket = buckets.get(tenantId);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(tenantId, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (bucket.count >= limit) {
      throw new HttpException('Tenant rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    bucket.count += 1;
    return true;
  }
}
