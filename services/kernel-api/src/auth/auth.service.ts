import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export type DevLoginInput = {
  email: string;
  fullName: string;
  role: string;
  tenantId?: string;
  branchId?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async devLogin(input: DevLoginInput) {
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

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      tenantId,
      branchId: user.branchId,
    };

    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        tenantId,
        branchId: user.branchId,
      },
    });

    const accessToken = await this.jwt.signAsync({ ...payload, sessionId: session.id });

    return { accessToken, user: payload, sessionId: session.id };
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
