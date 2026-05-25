import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { HospitalPlatformEvents } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
const CATALOG = [
  { code: 'OPD', label: 'Outpatient' },
  { code: 'IPD', label: 'Inpatient' },
  { code: 'LIMS', label: 'Laboratory' },
  { code: 'Pharmacy', label: 'Pharmacy' },
  { code: 'Insurance', label: 'Insurance / TPA' },
  { code: 'Telemedicine', label: 'Telemedicine' },
  { code: 'AI_Copilot', label: 'AI Copilot' },
  { code: 'Analytics', label: 'Analytics' },
  { code: 'Corporate_Billing', label: 'Corporate Billing' },
] as const;

@Injectable()
export class ModuleRuntimeService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const m of CATALOG) {
      await this.prisma.moduleCatalog.upsert({
        where: { code: m.code },
        create: m,
        update: { label: m.label },
      });
    }
  }

  listCatalog() {
    return this.prisma.moduleCatalog.findMany({ orderBy: { code: 'asc' } });
  }

  listEntitlements(tenantId: string) {
    return this.prisma.tenantModuleEntitlement.findMany({
      where: { tenantId },
      include: { module: true },
    });
  }

  async setBranchOverride(
    tenantId: string,
    branchId: string,
    moduleCode: string,
    enabled: boolean,
  ) {
    return this.prisma.branchModuleOverride.upsert({
      where: {
        tenantId_branchId_moduleCode: { tenantId, branchId, moduleCode },
      },
      create: { tenantId, branchId, moduleCode, enabled },
      update: { enabled },
    });
  }

  private async assertSubscription(tenantId: string) {
    const sub = await this.prisma.tenantSubscription.findUnique({ where: { tenantId } });
    if (!sub || sub.status !== 'active') {
      throw new ForbiddenException('Active subscription required to manage modules');
    }
  }

  async enable(tenantId: string, moduleCode: string) {
    await this.assertSubscription(tenantId);
    const mod = await this.prisma.moduleCatalog.findUnique({
      where: { code: moduleCode.toUpperCase() },
    });
    if (!mod) throw new ForbiddenException('Unknown module');
    const row = await this.prisma.tenantModuleEntitlement.upsert({
      where: { tenantId_moduleId: { tenantId, moduleId: mod.id } },
      create: { tenantId, moduleId: mod.id, enabled: true },
      update: { enabled: true },
    });
    await this.prisma.platformEventOutbox.create({
      data: {
        tenantId,
        eventName: HospitalPlatformEvents.modules.enabled,
        payload: { moduleCode: mod.code },
      },
    });
    return row;
  }

  async disable(tenantId: string, moduleCode: string) {
    const mod = await this.prisma.moduleCatalog.findUnique({
      where: { code: moduleCode.toUpperCase() },
    });
    if (!mod) throw new ForbiddenException('Unknown module');
    const row = await this.prisma.tenantModuleEntitlement.update({
      where: { tenantId_moduleId: { tenantId, moduleId: mod.id } },
      data: { enabled: false },
    });
    await this.prisma.platformEventOutbox.create({
      data: {
        tenantId,
        eventName: HospitalPlatformEvents.modules.disabled,
        payload: { moduleCode: mod.code },
      },
    });
    return row;
  }

  async effective(tenantId: string, branchId?: string) {
    const entitlements = await this.prisma.tenantModuleEntitlement.findMany({
      where: { tenantId, enabled: true },
      include: { module: true },
    });
    const base = Object.fromEntries(
      entitlements.map((e) => [e.module.code.toLowerCase(), true]),
    );
    if (!branchId) return base;

    const overrides = await this.prisma.branchModuleOverride.findMany({
      where: { tenantId, branchId },
    });
    for (const o of overrides) {
      base[o.moduleCode.toLowerCase()] = o.enabled;
    }
    return base;
  }
}
