import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  actorRolePermitted,
  isDomainPhiReadPath,
  isJwtEnforced,
  normalizeActorRole,
  resolveAllowedRoles,
} from '@adrine/hospital-operations';
import { RBAC_ROLES_KEY } from './rbac.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class DomainRbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const enforce =
      process.env.DOMAIN_RBAC_ENFORCE === 'true' ||
      process.env.NODE_ENV === 'production';
    if (!enforce) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const method = req.method.toUpperCase();
    if (method === 'OPTIONS') return true;

    const jwtRole = normalizeActorRole(req.user?.role);
    const headerRole = normalizeActorRole(
      (req.headers['x-actor-role'] as string | undefined) ??
        (req.body as { actorRole?: string } | undefined)?.actorRole,
    );
    const actorRole = jwtRole ?? headerRole;

    if (isJwtEnforced() && !jwtRole) {
      throw new ForbiddenException('Authenticated actor role required for RBAC');
    }

    const handlerRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      RBAC_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const allowed =
      handlerRoles ??
      resolveAllowedRoles(req.path)?.map((r) => r.toLowerCase()) ??
      null;

    const requiresRoleCheck =
      method !== 'GET' && method !== 'HEAD'
        ? true
        : isDomainPhiReadPath(req.path, method);

    if (!requiresRoleCheck) {
      return true;
    }

    if (!allowed || allowed.length === 0) {
      throw new ForbiddenException(`Route not authorized: ${req.method} ${req.path}`);
    }

    if (!actorRole) {
      throw new ForbiddenException('Missing actor role for RBAC enforcement');
    }

    if (!actorRolePermitted(actorRole, allowed as never)) {
      throw new ForbiddenException(
        `Role "${actorRole}" is not permitted for ${req.method} ${req.path}`,
      );
    }

    return true;
  }
}
