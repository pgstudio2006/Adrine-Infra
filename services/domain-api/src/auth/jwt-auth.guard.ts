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
import type { JwtPayload } from './jwt.strategy';

function isPublicPath(req: Request): boolean {
  const path = req.path ?? req.url.split('?')[0];
  if (path === '/healthz' || path === '/readyz') return true;
  if (path.startsWith('/public/booking')) return true;
  return false;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
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
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Valid Bearer token required');
    }

    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const jwtUser = user as unknown as JwtPayload;
    req.user = jwtUser;
    if (jwtUser.role) {
      req.headers['x-actor-role'] = jwtUser.role;
    }
    if (jwtUser.sub) {
      req.headers['x-actor-id'] = jwtUser.sub;
    }
    return user;
  }
}
