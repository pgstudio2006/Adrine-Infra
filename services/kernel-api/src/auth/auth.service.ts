import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password.util';
import { loadPublicBookingConfig } from './public-booking-config';
import { resolveTenantIdFromSlug } from './tenant-slugs';

export type DevLoginInput = {
  email: string;
  fullName: string;
  role: string;
  tenantId?: string;
  branchId?: string;
};

export type LoginInput = {
  email: string;
  password: string;
  tenantId?: string;
  branchId?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();
    const tenantId = input.tenantId ?? process.env.NAVAYU_DEFAULT_TENANT_ID ?? 'tenant_navayu';

    const user = await this.prisma.platformUser.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let branchId = user.branchId;
    if (input.branchId && input.branchId !== user.branchId) {
      if (user.role !== 'admin') {
        throw new UnauthorizedException('You are not assigned to this branch');
      }
      const branch = await this.prisma.branch.findFirst({
        where: { tenantId, id: input.branchId, isActive: true },
      });
      if (!branch) {
        throw new UnauthorizedException('Invalid branch for tenant');
      }
      branchId = branch.id;
    }

    return this.issueSession(user, tenantId, branchId);
  }

  async devLogin(input: DevLoginInput) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_LOGIN !== 'true') {
      throw new ForbiddenException('dev-login is disabled in production');
    }

    const tenantId = input.tenantId ?? 'tenant_dev';
    let branchId = input.branchId;

    if (!branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { tenantId, isActive: true },
      });
      branchId = branch?.id;
    }

    if (!branchId) {
      await this.seedTenant(tenantId);
      const branch = await this.prisma.branch.findFirst({
        where: { tenantId, isActive: true },
      });
      branchId = branch!.id;
    }

    const user = await this.prisma.platformUser.upsert({
      where: { tenantId_email: { tenantId, email: input.email } },
      create: {
        tenantId,
        branchId: branchId!,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
      },
      update: {
        fullName: input.fullName,
        role: input.role,
        branchId: branchId!,
      },
    });

    return this.issueSession(user, tenantId, user.branchId);
  }

  listBranchesForTenant(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, code: true, name: true, timezone: true },
      orderBy: { name: 'asc' },
    });
  }

  listBranchesForSlug(slug: string) {
    const tenantId = resolveTenantIdFromSlug(slug);
    if (!tenantId) {
      throw new UnauthorizedException('Unknown tenant slug');
    }
    return this.listBranchesForTenant(tenantId).then((branches) => ({
      tenantId,
      slug: slug.toLowerCase(),
      branches,
    }));
  }

  getPublicBookingConfig(slug: string) {
    const config = loadPublicBookingConfig(slug);
    if (!config) {
      throw new UnauthorizedException('Unknown tenant slug or booking config');
    }
    return config;
  }

  resolveTenantSlug(slug: string): string | undefined {
    return resolveTenantIdFromSlug(slug);
  }

  async revokeSession(user: { sub: string; tenantId?: string }, sessionId?: string) {
    if (sessionId) {
      await this.prisma.userSession.updateMany({
        where: { id: sessionId, userId: user.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { revoked: sessionId };
    }
    await this.prisma.userSession.updateMany({
      where: { userId: user.sub, tenantId: user.tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: 'all_active' };
  }

  private async issueSession(
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      branchId: string;
      departmentCode?: string | null;
    },
    tenantId: string,
    branchId: string,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      tenantId,
      branchId,
      ...(user.departmentCode ? { department: user.departmentCode } : {}),
    };

    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        tenantId,
        branchId,
      },
    });

    const accessToken = await this.jwt.signAsync({ ...payload, sessionId: session.id });

    return { accessToken, user: payload, sessionId: session.id };
  }

  private async seedTenant(tenantId: string) {
    const org = await this.prisma.organization.upsert({
      where: { tenantId },
      create: { tenantId, name: 'Adrine Demo Hospital' },
      update: {},
    });
    const branch = await this.prisma.branch.upsert({
      where: { tenantId_code: { tenantId, code: 'main' } },
      create: {
        tenantId,
        organizationId: org.id,
        code: 'main',
        name: 'Main Campus',
      },
      update: {},
    });
    await this.prisma.subscription.upsert({
      where: { tenantId },
      create: { tenantId, plan: 'design_partner', status: 'active' },
      update: {},
    });
    const defaults: Record<string, unknown> = {
      'opd.require_consent': true,
      'opd.require_abha': false,
      'scheduling.walk_in_enabled': true,
      'billing.allow_partial_payment': true,
    };
    for (const [key, value] of Object.entries(defaults)) {
      await this.prisma.branchConfig.upsert({
        where: { branchId_key: { branchId: branch.id, key } },
        create: { tenantId, branchId: branch.id, key, value: value as object },
        update: { value: value as object },
      });
    }
  }
}

export { hashPassword };
