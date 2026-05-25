import { BadRequestException, Injectable } from '@nestjs/common';
import type { InvoiceValidationContext, OpdVisitState } from '@adrine/hospital-operations';
import { BillingRuntimeService } from '../billing/billing-runtime.service';
import { BillingSyncService } from '../billing/billing-sync.service';

type LineItem = { description: string; amountCents: number };
import { BillingGatesService } from '../billing/billing-gates.service';
import { OpdService } from './opd.service';
import { PlatformEventService } from '../events/platform-event.service';

@Injectable()
export class OpdBillingService {
  constructor(
    private readonly opd: OpdService,
    private readonly billing: BillingRuntimeService,
    private readonly billingSync: BillingSyncService,
    private readonly gates: BillingGatesService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  /** Full OPD billing exit: invoice → payment → settlement → visit completion. */
  async completeBillingExit(
    tenantId: string,
    visitId: string,
    body: {
      actorRole: string;
      actorId?: string;
      lineItems: LineItem[];
      paymentAmountCents: number;
      paymentMethod: string;
      reference?: string;
      corporatePayer?: boolean;
      insuranceMode?: string;
      branchOverrides?: Record<string, boolean>;
      skipPayment?: boolean;
    },
  ) {
    const visit = await this.opd.getVisit(tenantId, visitId);
    let visitState = visit.state as OpdVisitState;

    if (visitState === 'orders_pending') {
      await this.opd.transition(tenantId, visitId, {
        action: 'fulfill_or_defer_orders',
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: {
          criticalResultsAcknowledged: true,
          pendingOrdersDeferredOrComplete: true,
        },
      });
      visitState = 'billing_pending';
    }

    if (visitState !== 'billing_pending') {
      throw new BadRequestException(
        `Visit must be in billing_pending (current: ${visitState})`,
      );
    }

    await this.opd.transition(tenantId, visitId, {
      action: 'generate_invoice',
      actorRole: body.actorRole,
      actorId: body.actorId,
      context: { encounterClosed: true, invoiceExists: true },
    });

    const syncedLines = await this.billingSync.getActiveLineItems(tenantId, visitId);
    const lineItems: LineItem[] =
      syncedLines.length > 0 ? syncedLines : body.lineItems;

    if (lineItems.length === 0) {
      throw new BadRequestException('No billable charges on live invoice');
    }

    if (syncedLines.length === 0 && body.lineItems.length > 0) {
      for (const line of body.lineItems) {
        await this.billingSync.syncCharge(tenantId, {
          opdVisitId: visitId,
          patientId: visit.patientId,
          branchId: visit.branchId,
          encounterId: visit.encounterId ?? undefined,
          idempotencyKey: `exit-reconcile:${line.description}`,
          description: line.description,
          amountCents: line.amountCents,
          sourceModule: 'billing',
          sourceAction: 'exit_reconcile',
          actorId: body.actorId,
          actorRole: body.actorRole,
          corporatePayer: body.corporatePayer,
          insuranceMode: body.insuranceMode,
        });
      }
    }

    const invoice = await this.billingSync.ensureOpdDraft(tenantId, {
      opdVisitId: visitId,
      patientId: visit.patientId,
      branchId: visit.branchId,
      encounterId: visit.encounterId ?? undefined,
      corporatePayer: body.corporatePayer,
      insuranceMode: body.insuranceMode,
      actorId: body.actorId,
      actorRole: body.actorRole,
    });

    const insurancePreauthOk = await this.gates.resolveInsurancePreauthOk(tenantId, {
      insuranceMode: body.insuranceMode,
      opdVisitId: visitId,
    });

    const invoiceCtx: InvoiceValidationContext = {
      lineItemsPresent: lineItems.length > 0,
      opdVisitInBillingPending: true,
      corporateCreditOk: body.corporatePayer ? true : undefined,
      insurancePreauthOk,
      partialPaymentAllowed: body.branchOverrides?.['billing.allow_partial_payment'] !== false,
    };

    let current = await this.billing.transition(tenantId, invoice.id, {
      action: 'issue_invoice',
      actorRole: body.actorRole,
      actorId: body.actorId,
      context: invoiceCtx,
      expectedVersion: invoice.version,
    });

    if (!body.skipPayment && body.paymentAmountCents > 0) {
      const balance = current.invoice.amountCents - current.invoice.paidCents;
      const pay = Math.min(balance, body.paymentAmountCents);
      const payAction = pay >= balance ? 'record_full_payment' : 'record_partial_payment';

      current = await this.billing.transition(tenantId, invoice.id, {
        action: payAction,
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: {
          ...invoiceCtx,
          paymentAmountValid: pay > 0,
          amountMatches: payAction === 'record_full_payment',
        },
        payload: {
          amountCents: pay,
          paymentMethod: body.paymentMethod,
          reference: body.reference,
        },
        expectedVersion: current.invoice.version,
      });
    }

    const outstanding = current.invoice.amountCents - current.invoice.paidCents;
    const paymentRequired = body.branchOverrides?.['billing.payment_required'] !== false;

    if (paymentRequired && outstanding > 0 && !body.corporatePayer) {
      throw new BadRequestException('Payment required before visit completion');
    }

    if (current.invoice.status !== 'settled') {
      current = await this.billing.transition(tenantId, invoice.id, {
        action: 'settle_invoice',
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: {
          ...invoiceCtx,
          amountMatches: current.invoice.paidCents >= current.invoice.amountCents || body.corporatePayer,
          duplicateSettlementBlocked: true,
        },
        expectedVersion: current.invoice.version,
      });
    }

    const opdResult = await this.opd.transition(tenantId, visitId, {
      action: 'settle_bill',
      actorRole: body.actorRole,
      actorId: body.actorId,
      context: {
        invoiceSettledOrCreditApproved: true,
        visitEscalated: visit.escalationLevel > 0,
        actorIsSupervisor: ['admin', 'medical_superintendent'].includes(body.actorRole),
      },
      payload: {
        invoiceId: invoice.id,
        receiptNumber: current.invoice.receiptNumber,
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId: visit.branchId,
      eventName: 'adrine.opd.visit.completed',
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'opd_visit',
      resourceId: visitId,
      payload: {
        invoiceId: invoice.id,
        receiptNumber: current.invoice.receiptNumber,
      },
    });

    return {
      visit: opdResult.visit,
      invoice: current.invoice,
      receiptNumber: current.invoice.receiptNumber,
    };
  }

  async getBillingContext(tenantId: string, visitId: string) {
    return this.billingSync.getLiveFinancialState(tenantId, visitId);
  }
}
