import { Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_POLICIES, type GovernancePolicyKey } from '@adrine/hospital-operations';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationGovernanceService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultPolicies(tenantId: string, organizationId: string) {
    for (const def of DEFAULT_POLICIES) {
      await this.prisma.policyDefinition.upsert({
        where: { organizationId_key: { organizationId, key: def.key } },
        create: {
          tenantId,
          organizationId,
          key: def.key,
          label: def.label,
          defaultValue: def.defaultValue as Prisma.InputJsonValue,
          schemaVersion: def.schemaVersion,
        },
        update: {},
      });
    }
  }

  async listPolicies(tenantId: string) {
    const org = await this.prisma.organization.findUnique({ where: { tenantId } });
    if (!org) return [];
    await this.ensureDefaultPolicies(tenantId, org.id);
    return this.prisma.policyDefinition.findMany({ where: { organizationId: org.id } });
  }

  async upsertPolicy(
    tenantId: string,
    body: { key: GovernancePolicyKey; label: string; defaultValue: Record<string, unknown> },
  ) {
    const org = await this.prisma.organization.findUnique({ where: { tenantId } });
    if (!org) throw new NotFoundException('Organization not found');
    return this.prisma.policyDefinition.upsert({
      where: { organizationId_key: { organizationId: org.id, key: body.key } },
      create: {
        tenantId,
        organizationId: org.id,
        key: body.key,
        label: body.label,
        defaultValue: body.defaultValue as Prisma.InputJsonValue,
      },
      update: {
        label: body.label,
        defaultValue: body.defaultValue as Prisma.InputJsonValue,
      },
    });
  }

  async getEffectivePolicies(tenantId: string, branchId: string) {
    const org = await this.prisma.organization.findUnique({ where: { tenantId } });
    if (!org) return {};
    await this.ensureDefaultPolicies(tenantId, org.id);
    const defs = await this.prisma.policyDefinition.findMany({ where: { organizationId: org.id } });
    const overrides = await this.prisma.policyOverride.findMany({ where: { tenantId, branchId } });
    const overrideMap = Object.fromEntries(overrides.map((o) => [o.policyKey, o.value]));

    return Object.fromEntries(
      defs.map((d) => [
        d.key,
        {
          ...(d.defaultValue as Record<string, unknown>),
          ...((overrideMap[d.key] as Record<string, unknown> | undefined) ?? {}),
        },
      ]),
    );
  }

  async setBranchOverride(tenantId: string, branchId: string, policyKey: string, value: Record<string, unknown>) {
    return this.prisma.policyOverride.upsert({
      where: { branchId_policyKey: { branchId, policyKey } },
      create: { tenantId, branchId, policyKey, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  }
}
