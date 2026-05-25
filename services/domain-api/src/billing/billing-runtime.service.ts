import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateInvoiceTransition,
  type InvoiceValidationContext,
  type InvoiceState,
} from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

export type LineItem = { description: string; amountCents: number };

@Injectable()
export class BillingRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  async getInvoice(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async findForOpdVisit(tenantId: string, opdVisitId: string) {
    return this.prisma.invoice.findFirst({
      where: { tenantId, opdVisitId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDraftForOpd(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      encounterId?: string;
      opdVisitId: string;
      lineItems: LineItem[];
      corporatePayer?: boolean;
      insuranceMode?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const existing = await this.findForOpdVisit(tenantId, body.opdVisitId);
    if (existing && existing.status !== 'void') {
      return existing;
    }

    const amountCents = body.lineItems.reduce((s, i) => s + i.amountCents, 0);
    return this.prisma.invoice.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        opdVisitId: body.opdVisitId,
        amountCents,
        lineItems: body.lineItems as object,
        corporatePayer: body.corporatePayer ?? false,
        insuranceMode: body.insuranceMode ?? 'self',
        status: 'draft',
      },
    });
  }

  async transition(
    tenantId: string,
    invoiceId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: InvoiceValidationContext;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    const invoice = await this.getInvoice(tenantId, invoiceId);
    if (
      body.expectedVersion !== undefined &&
      body.expectedVersion !== invoice.version
    ) {
      throw new ConflictException('Invoice was modified; refresh and retry');
    }

    const fromState = invoice.status as InvoiceState;
    const ctx: InvoiceValidationContext = {
      ...body.context,
      notVoid: fromState !== 'void',
      notAlreadySettled: fromState !== 'settled',
      duplicateSettlementBlocked: fromState !== 'settled',
    };

    const result = evaluateInvoiceTransition({
      state: fromState,
      action: body.action,
      actorRole: body.actorRole,
      validationContext: ctx,
    });

    if (!result.ok) {
      throw new BadRequestException({ code: result.code, message: result.reason });
    }

    const patch: Record<string, unknown> = {
      status: result.nextState,
      version: { increment: 1 },
    };

    if (body.action === 'issue_invoice') {
      await this.platformEvents.record({
        tenantId,
        branchId: invoice.branchId,
        eventName: 'adrine.billing.invoice.generated',
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'invoice',
        resourceId: invoiceId,
        payload: { opdVisitId: invoice.opdVisitId },
      });
    }

    if (body.action === 'record_partial_payment' || body.action === 'record_full_payment') {
      const amountCents = Number(body.payload?.amountCents ?? 0);
      const newPaid = invoice.paidCents + amountCents;
      patch.paidCents = newPaid;
      patch.paymentMethod = (body.payload?.paymentMethod as string) ?? invoice.paymentMethod;

      await this.prisma.paymentRecord.create({
        data: {
          tenantId,
          invoiceId,
          kind: 'payment',
          amountCents,
          method: patch.paymentMethod as string,
          reference: body.payload?.reference as string | undefined,
          actorId: body.actorId,
        },
      });
    }

    if (body.action === 'settle_invoice') {
      patch.settledAt = new Date();
      patch.receiptNumber =
        (body.payload?.receiptNumber as string) ??
        `RCP-${Date.now().toString(36).toUpperCase()}`;
      patch.paidCents = invoice.amountCents;
    }

    if (body.action === 'void_invoice') {
      patch.paidCents = 0;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.invoice.update({
        where: { id: invoiceId },
        data: patch,
      });
      await tx.invoiceTransition.create({
        data: {
          tenantId,
          invoiceId,
          action: body.action,
          fromState,
          toState: result.nextState,
          actorId: body.actorId,
          actorRole: body.actorRole,
          reason: body.reason,
          metadata: body.payload as object | undefined,
        },
      });
      return row;
    });

    for (const eventName of result.events) {
      await this.platformEvents.record({
        tenantId,
        branchId: invoice.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'invoice',
        resourceId: invoiceId,
        payload: {
          action: body.action,
          fromState,
          toState: result.nextState,
          opdVisitId: invoice.opdVisitId,
          receiptNumber: updated.receiptNumber,
          metering: result.metering,
        },
      });
    }

    return { invoice: updated, transition: result };
  }
}
