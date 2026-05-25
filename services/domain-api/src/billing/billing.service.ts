import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { BillingGatesService } from './billing-gates.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBusService,
    private readonly gates: BillingGatesService,
  ) {}

  async createInvoice(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      encounterId?: string;
      opdVisitId?: string;
      amountCents: number;
      lineItems?: { description: string; amountCents: number }[];
      currency?: string;
      gstRateBps?: number;
    },
  ) {
    if (body.encounterId) {
      await this.gates.assertEncounterClosed(tenantId, body.encounterId);
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        opdVisitId: body.opdVisitId,
        amountCents: body.amountCents,
        lineItems: (body.lineItems ?? []) as object,
        currency: body.currency ?? 'INR',
        gstRateBps: body.gstRateBps ?? 0,
        status: 'draft',
      },
    });
    this.events.emit('adrine.billing.invoice.generated', tenantId, { invoiceId: invoice.id });
    return invoice;
  }

  listForPatient(tenantId: string, patientId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
