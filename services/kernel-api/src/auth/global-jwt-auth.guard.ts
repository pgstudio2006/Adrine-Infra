import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { isJwtEnforced } from '@adrine/hospital-operations';
import { IS_PUBLIC_KEY } from '../common/public.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

const PUBLIC_ROUTE_PATTERNS: Array<{ method: string; pattern: RegExp }> = [
  { method: 'GET', pattern: /^\/healthz$/ },
  { method: 'POST', pattern: /^\/auth\/login$/ },
  { method: 'POST', pattern: /^\/auth\/hospital-gate$/ },
  { method: 'POST', pattern: /^\/auth\/dev-login$/ },
  { method: 'GET', pattern: /^\/auth\/branches$/ },
  { method: 'GET', pattern: /^\/auth\/branches\/[^/]+\/portal-roles$/ },
  { method: 'POST', pattern: /^\/auth\/mfa\/verify$/ },
  { method: 'POST', pattern: /^\/auth\/dev-token$/ },
  { method: 'GET', pattern: /^\/public\/tenants\/[^/]+\/branches$/ },
  { method: 'GET', pattern: /^\/public\/tenants\/[^/]+\/booking-config$/ },
  { method: 'POST', pattern: /^\/internal\/provision-navayu$/ },
];

function isPublicPath(req: Request): boolean {
  const path = req.path ?? req.url.split('?')[0];
  return PUBLIC_ROUTE_PATTERNS.some(
    (entry) => entry.method === req.method.toUpperCase() && entry.pattern.test(path),
  );
}

@Injectable()
export class GlobalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest<Request>();
    if (isPublic || isPublicPath(req)) {
      return true;
    }
    if (!isJwtEnforced()) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = JwtPayload>(
    err: Error | null,
    user: TUser | false,
  ): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Valid Bearer token required');
    }
    return user;
  }
}
