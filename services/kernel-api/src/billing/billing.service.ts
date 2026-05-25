import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscription(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    return (
      sub ?? {
        tenantId,
        plan: 'starter',
        status: 'active',
        limits: { opdVisitsPerMonth: 10_000 },
      }
    );
  }
}
