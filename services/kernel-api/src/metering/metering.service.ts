import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformBillingService } from '../platform-billing/platform-billing.service';

@Injectable()
export class MeteringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformBilling: PlatformBillingService,
  ) {}

  record(input: {
    tenantId: string;
    branchId?: string;
    metric: string;
    quantity?: number;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.platformBilling.recordUsage({
      tenantId: input.tenantId,
      branchId: input.branchId,
      dimension: input.metric,
      quantity: input.quantity,
      resourceId: input.resourceId,
      metadata: input.metadata,
    });
  }

  summary(tenantId: string, since: Date) {
    return this.prisma.usageMeter.groupBy({
      by: ['metric'],
      where: { tenantId, recordedAt: { gte: since } },
      _sum: { quantity: true },
    });
  }
}
