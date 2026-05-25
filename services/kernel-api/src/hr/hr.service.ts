import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StaffGovernanceService } from '../governance/staff-governance.service';

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffGovernance: StaffGovernanceService,
  ) {}

  async listStaff(tenantId: string, branchId: string) {
    await this.staffGovernance.ensureRoleTemplates(tenantId);
    const users = await this.prisma.platformUser.findMany({
      where: { tenantId, branchId, isActive: true },
      orderBy: { fullName: 'asc' },
    });
    const assignments = await this.prisma.staffAssignment.findMany({
      where: { tenantId, branchId, isActive: true },
      include: { roleTemplate: true },
    });
    const departments = await this.prisma.department.findMany({
      where: { tenantId, branchId, isActive: true },
      orderBy: { name: 'asc' },
    });
    const byUser = new Map<string, typeof assignments>();
    for (const a of assignments) {
      const list = byUser.get(a.userId) ?? [];
      list.push(a);
      byUser.set(a.userId, list);
    }
    return {
      staff: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        branchId: u.branchId,
        assignments: byUser.get(u.id) ?? [],
        createdAt: u.createdAt,
      })),
      departments,
    };
  }

  listRoleTemplates(tenantId: string) {
    return this.prisma.roleTemplate.findMany({
      where: { tenantId },
      orderBy: { label: 'asc' },
    });
  }

  listDepartments(tenantId: string, branchId: string) {
    return this.prisma.department.findMany({
      where: { tenantId, branchId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  assignStaff(
    tenantId: string,
    body: { branchId: string; userId: string; roleTemplateId: string; departmentCode?: string },
  ) {
    return this.staffGovernance.assignStaff(tenantId, body);
  }

  effectiveRoles(tenantId: string, branchId: string, userId: string) {
    return this.staffGovernance.getEffectiveRoles(tenantId, branchId, userId);
  }
}
