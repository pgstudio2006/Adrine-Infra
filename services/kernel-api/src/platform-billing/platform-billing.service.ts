import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { HospitalPlatformEvents } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_PLANS = [
  { code: 'free_trial', label: 'Free Trial', isMetered: false, taxRateBps: 1800, quotaLimits: { patients: 500, api_calls: 10000 } },
  { code: 'standard', label: 'Standard', isMetered: true, taxRateBps: 1800, quotaLimits: { patients: 5000, api_calls: 100000 } },
  { code: 'enterprise', label: 'Enterprise', isMetered: true, taxRateBps: 1800, quotaLimits: { patients: 100000, api_calls: 1000000 } },
] as const;

export type UsageDimension =
  | 'patients'
  | 'admissions'
  | 'workflows'
  | 'ai_tokens'
  | 'notifications'
  | 'storage_bytes'
  | 'api_calls'
  | 'operational_actions';

@Injectable()
export class PlatformBillingService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  listPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: { code: 'asc' } });
  }

  async upsertPlan(input: {
    code: string;
    label: string;
    isMetered?: boolean;
    taxRateBps?: number;
    quotaLimits?: Record<string, number>;
  }) {
    return this.prisma.subscriptionPlan.upsert({
      where: { code: input.code },
      create: {
        code: input.code,
        label: input.label,
        isMetered: input.isMetered ?? false,
        taxRateBps: input.taxRateBps ?? 1800,
        quotaLimits: input.quotaLimits,
      },
      update: {
        label: input.label,
        isMetered: input.isMetered,
        taxRateBps: input.taxRateBps,
        quotaLimits: input.quotaLimits,
      },
    });
  }

  async getSubscription(tenantId: string) {
    const sub = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    return sub ?? { tenantId, status: 'none', plan: null };
  }

  async onModuleInit() {
    for (const plan of DEFAULT_PLANS) {
      await this.prisma.subscriptionPlan.upsert({
        where: { code: plan.code },
        create: {
          code: plan.code,
          label: plan.label,
          isMetered: plan.isMetered,
          taxRateBps: plan.taxRateBps,
          quotaLimits: plan.quotaLimits,
        },
        update: { label: plan.label, quotaLimits: plan.quotaLimits },
      });
    }
  }

  async subscribe(tenantId: string, planCode: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
    if (!plan) throw new ForbiddenException('Unknown plan');
    const sub = await this.prisma.tenantSubscription.upsert({
      where: { tenantId },
      create: { tenantId, planId: plan.id, status: 'active' },
      update: { planId: plan.id, status: 'active' },
    });
    await this.prisma.platformEventOutbox.create({
      data: {
        tenantId,
        eventName: HospitalPlatformEvents.platformBilling.subscribed,
        payload: { planCode },
      },
    });
    return sub;
  }

  async recordUsage(input: {
    tenantId: string;
    branchId?: string;
    dimension: UsageDimension | string;
    quantity?: number;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const quantity = input.quantity ?? 1;
    await this.prisma.usageRecord.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        dimension: input.dimension,
        quantity,
        resourceId: input.resourceId,
        metadata: input.metadata as object | undefined,
      },
    });
    await this.prisma.usageMeter.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        metric: input.dimension,
        quantity,
        resourceId: input.resourceId,
        metadata: input.metadata as object | undefined,
      },
    });
    return { recorded: true, dimension: input.dimension, quantity };
  }

  async assertQuota(tenantId: string, dimension: string, increment = 1) {
    const sub = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    if (!sub?.plan?.quotaLimits) return { allowed: true };

    const limits = sub.plan.quotaLimits as Record<string, number>;
    const cap = limits[dimension];
    if (cap == null) return { allowed: true };

    const since = new Date();
    since.setDate(1);
    const used = await this.prisma.usageRecord.aggregate({
      where: { tenantId, dimension, recordedAt: { gte: since } },
      _sum: { quantity: true },
    });
    const total = (used._sum.quantity ?? 0) + increment;
    if (total > cap) {
      await this.prisma.platformEventOutbox.create({
        data: {
          tenantId,
          eventName: HospitalPlatformEvents.platformBilling.quotaExceeded,
          payload: { dimension, cap, total },
        },
      });
      throw new ForbiddenException(`Quota exceeded for ${dimension}`);
    }
    return { allowed: true, used: total, cap };
  }

  async getUsage(tenantId: string, since?: Date) {
    const from = since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.prisma.usageRecord.groupBy({
      by: ['dimension'],
      where: { tenantId, recordedAt: { gte: from } },
      _sum: { quantity: true },
    });
  }

  async listInvoices(tenantId: string) {
    return this.prisma.platformInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });
  }

  async generateInvoice(tenantId: string) {
    const sub = await this.prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 1);
    const usage = await this.getUsage(tenantId, periodStart);
    const lineItems = usage.map((u) => ({
      dimension: u.dimension,
      quantity: u._sum.quantity ?? 0,
      unitCents: 10,
    }));
    const subtotalCents = lineItems.reduce(
      (s, l) => s + l.quantity * l.unitCents,
      0,
    );
    const taxRateBps = sub?.plan?.taxRateBps ?? 1800;
    const taxCents = Math.round((subtotalCents * taxRateBps) / 10000);
    const invoice = await this.prisma.platformInvoice.create({
      data: {
        tenantId,
        periodStart,
        periodEnd,
        subtotalCents,
        taxCents,
        totalCents: subtotalCents + taxCents,
        lineItems,
        status: 'issued',
      },
    });
    return invoice;
  }
}
