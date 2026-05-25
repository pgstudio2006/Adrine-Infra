import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantAdministrationService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantProfile(tenantId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { tenantId },
      include: {
        branches: { include: { departments: true }, where: { isActive: true } },
      },
    });
    const subscription = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!org) throw new NotFoundException('Tenant organization not found');
    return { organization: org, subscription };
  }

  async listBranches(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId, isActive: true },
      include: { departments: true },
    });
  }

  async createBranch(
    tenantId: string,
    body: { code: string; name: string; timezone?: string; parentBranchId?: string; moduleFlags?: Record<string, boolean> },
  ) {
    const org = await this.prisma.organization.findUnique({ where: { tenantId } });
    if (!org) throw new NotFoundException('Organization not found');
    return this.prisma.branch.create({
      data: {
        tenantId,
        organizationId: org.id,
        code: body.code,
        name: body.name,
        timezone: body.timezone ?? 'Asia/Kolkata',
        parentBranchId: body.parentBranchId,
        moduleFlags: (body.moduleFlags ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async listDepartments(tenantId: string, branchId: string) {
    return this.prisma.department.findMany({ where: { tenantId, branchId, isActive: true } });
  }

  async createDepartment(
    tenantId: string,
    body: { branchId: string; code: string; name: string },
  ) {
    return this.prisma.department.create({
      data: { tenantId, branchId: body.branchId, code: body.code, name: body.name },
    });
  }
}
