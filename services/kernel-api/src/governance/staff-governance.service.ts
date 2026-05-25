import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_ROLE_TEMPLATES = [
  { code: 'receptionist', label: 'Receptionist', permissions: ['opd:*', 'queue:*'] },
  { code: 'doctor', label: 'Doctor', permissions: ['clinical:*', 'emr:*'] },
  { code: 'nurse', label: 'Nurse', permissions: ['nursing:*', 'vitals:*'] },
  { code: 'admin', label: 'Administrator', permissions: ['*'] },
];

@Injectable()
export class StaffGovernanceService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureRoleTemplates(tenantId: string) {
    for (const t of DEFAULT_ROLE_TEMPLATES) {
      await this.prisma.roleTemplate.upsert({
        where: { tenantId_code: { tenantId, code: t.code } },
        create: {
          tenantId,
          code: t.code,
          label: t.label,
          permissions: t.permissions as object,
        },
        update: {},
      });
    }
  }

  async getEffectiveRoles(tenantId: string, branchId: string, userId?: string) {
    await this.ensureRoleTemplates(tenantId);
    const templates = await this.prisma.roleTemplate.findMany({ where: { tenantId } });
    if (!userId) {
      return { templates, assignments: [], effectivePermissions: [] as string[] };
    }

    const user = await this.prisma.platformUser.findFirst({ where: { tenantId, id: userId } });
    const assignments = await this.prisma.staffAssignment.findMany({
      where: { tenantId, branchId, userId, isActive: true },
      include: { roleTemplate: true },
    });

    const delegations = await this.prisma.delegationGrant.findMany({
      where: {
        tenantId,
        toUserId: userId,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });

    const approvalChains = await this.prisma.approvalChain.findMany({ where: { tenantId } });

    const perms = new Set<string>();
    if (user?.role) perms.add(`role:${user.role}`);
    for (const a of assignments) {
      const p = a.roleTemplate.permissions as string[];
      if (Array.isArray(p)) p.forEach((x) => perms.add(x));
    }
    for (const d of delegations) {
      const p = d.permissions as string[];
      if (Array.isArray(p)) p.forEach((x) => perms.add(x));
    }

    return {
      templates,
      assignments,
      delegations,
      approvalChains,
      platformRole: user?.role,
      effectivePermissions: [...perms],
    };
  }

  async assignStaff(
    tenantId: string,
    body: { branchId: string; userId: string; roleTemplateId: string; departmentCode?: string },
  ) {
    const template = await this.prisma.roleTemplate.findFirst({
      where: { id: body.roleTemplateId, tenantId },
    });
    if (!template) throw new NotFoundException('Role template not found');

    return this.prisma.staffAssignment.create({
      data: {
        tenantId,
        branchId: body.branchId,
        userId: body.userId,
        roleTemplateId: body.roleTemplateId,
        departmentCode: body.departmentCode,
      },
    });
  }
}
