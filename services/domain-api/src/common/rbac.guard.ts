import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  normalizeActorRole,
  resolveAllowedRoles,
} from '@adrine/hospital-operations';
import { RBAC_ROLES_KEY } from './rbac.decorator';

@Injectable()
export class DomainRbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const enforce =
      process.env.DOMAIN_RBAC_ENFORCE === 'true' ||
      process.env.NODE_ENV === 'production';
    if (!enforce) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    const actorRole = normalizeActorRole(
      (req.headers['x-actor-role'] as string | undefined) ??
        (req.body as { actorRole?: string } | undefined)?.actorRole,
    );

    const handlerRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      RBAC_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const allowed =
      handlerRoles ??
      resolveAllowedRoles(req.path)?.map((r) => r.toLowerCase()) ??
      null;

    if (!allowed || allowed.length === 0) return true;

    if (!actorRole) {
      throw new ForbiddenException('Missing x-actor-role for RBAC enforcement');
    }

    if (allowed.includes('*') || allowed.includes(actorRole)) {
      return true;
    }

    if (actorRole === 'admin' && allowed.includes('admin')) {
      return true;
    }

    throw new ForbiddenException(
      `Role "${actorRole}" is not permitted for ${req.method} ${req.path}`,
    );
  }
}
