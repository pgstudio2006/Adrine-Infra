import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { normalizeActorRole } from '@adrine/hospital-operations';
import { resolveJwtSecret } from './jwt-secret';

export type JwtPayload = {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string;
  branchId?: string;
  department?: string;
  sessionId?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(config),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtPayload {
    if (process.env.AUTH_MODE === 'disabled') {
      throw new UnauthorizedException('Auth disabled');
    }

    if (!payload?.sub || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const tenantHeader = (req.headers['x-tenant-id'] as string | undefined)?.trim();
    if (payload.tenantId && tenantHeader && payload.tenantId !== tenantHeader) {
      throw new ForbiddenException('Tenant scope mismatch');
    }

    const branchHeader = (req.headers['x-branch-id'] as string | undefined)?.trim();
    const branchQuery =
      typeof req.query?.branchId === 'string' ? req.query.branchId.trim() : undefined;
    const effectiveBranch = branchHeader || branchQuery;
    if (
      payload.branchId &&
      effectiveBranch &&
      payload.role !== 'admin' &&
      payload.branchId !== effectiveBranch
    ) {
      throw new ForbiddenException('Branch scope mismatch');
    }

    const headerRole = normalizeActorRole(req.headers['x-actor-role'] as string | undefined);
    const tokenRole = normalizeActorRole(payload.role);
    if (headerRole && tokenRole && headerRole !== tokenRole) {
      throw new ForbiddenException('Actor role mismatch');
    }

    return payload;
  }
}
