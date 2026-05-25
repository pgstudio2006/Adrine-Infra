import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async getHierarchy(tenantId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { tenantId },
      include: {
        branches: {
          where: { isActive: true },
          include: { configs: true },
        },
      },
    });
    return org;
  }

  async getBranchConfig(tenantId: string, branchId: string) {
    const rows = await this.prisma.branchConfig.findMany({
      where: { tenantId, branchId },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
}
