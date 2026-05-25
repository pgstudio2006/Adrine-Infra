import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export type JwtPayload = {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string;
  branchId?: string;
  sessionId?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_DEV_SECRET') ?? 'dev-insecure-change-me',
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    const mode = process.env.AUTH_MODE ?? 'dev';
    if (mode === 'disabled') {
      throw new UnauthorizedException('Auth disabled');
    }

    if (payload.sessionId) {
      const session = await this.prisma.userSession.findFirst({
        where: { id: payload.sessionId, userId: payload.sub, revokedAt: null },
      });
      if (!session) {
        throw new UnauthorizedException('Session revoked or invalid');
      }
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      });
    }

    return payload;
  }
}
