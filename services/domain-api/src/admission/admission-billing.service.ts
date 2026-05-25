import { BadRequestException, Injectable } from '@nestjs/common';
import type { InvoiceValidationContext } from '@adrine/hospital-operations';
import { BillingRuntimeService } from '../billing/billing-runtime.service';
import { BillingSyncService } from '../billing/billing-sync.service';
import { DischargeRuntimeService } from '../discharge/discharge-runtime.service';
import { PlatformEventService } from '../events/platform-event.service';
import { BillingGatesService } from '../billing/billing-gates.service';
import { AdmissionRuntimeService } from './admission-runtime.service';

type LineItem = { description: string; amountCents: number };

@Injectable()
export class AdmissionBillingService {
  constructor(
    private readonly admissions: AdmissionRuntimeService,
    private readonly billing: BillingRuntimeService,
    private readonly billingSync: BillingSyncService,
    private readonly discharge: DischargeRuntimeService,
    private readonly gates: BillingGatesService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  /** Atomic IPD billing exit: invoice issue → payment → settlement (+ billing clearance when orchestration allows). */
  async completeBillingExit(
    tenantId: string,
    admissionId: string,
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
    const admission = await this.admissions.getAdmission(tenantId, admissionId);
    const billableStates = ['active_care', 'transferred', 'discharge_pending'];
    if (!billableStates.includes(admission.state)) {
      throw new BadRequestException(
        `Admission must be in active_care, transferred, or discharge_pending (current: ${admission.state})`,
      );
    }

    const syncedLines = await this.billingSync.getActiveIpdLineItems(tenantId, admissionId);
    const lineItems: LineItem[] =
      syncedLines.length > 0 ? syncedLines : body.lineItems;

    if (lineItems.length === 0) {
      throw new BadRequestException('No billable charges on live IPD invoice');
    }

    if (syncedLines.length === 0 && body.lineItems.length > 0) {
      for (const line of body.lineItems) {
        await this.billingSync.syncIpdCharge(tenantId, {
          admissionId,
          patientId: admission.patientId,
          branchId: admission.branchId,
          encounterId: admission.encounterId ?? undefined,
          idempotencyKey: `ipd-exit-reconcile:${line.description}`,
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

    const invoice = await this.billingSync.ensureIpdDraft(tenantId, {
      admissionId,
      patientId: admission.patientId,
      branchId: admission.branchId,
      encounterId: admission.encounterId ?? undefined,
      corporatePayer: body.corporatePayer,
      insuranceMode: body.insuranceMode,
      actorId: body.actorId,
      actorRole: body.actorRole,
    });

    const insurancePreauthOk = await this.gates.resolveInsurancePreauthOk(tenantId, {
      insuranceMode: body.insuranceMode ?? admission.insuranceMode,
      admissionId,
    });

    const invoiceCtx: InvoiceValidationContext = {
      lineItemsPresent: lineItems.length > 0,
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
      throw new BadRequestException('Payment required before IPD bill settlement');
    }

    if (current.invoice.status !== 'settled') {
      current = await this.billing.transition(tenantId, invoice.id, {
        action: 'settle_invoice',
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: {
          ...invoiceCtx,
          amountMatches:
            current.invoice.paidCents >= current.invoice.amountCents || body.corporatePayer,
          duplicateSettlementBlocked: true,
        },
        expectedVersion: current.invoice.version,
      });
    }

    const dischargeRow = await this.discharge.getByAdmission(tenantId, admissionId);
    if (dischargeRow?.state === 'billing_clearance_pending') {
      await this.discharge.transition(tenantId, dischargeRow.id, {
        action: 'grant_billing_clearance',
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: {
          interimBillReviewed: true,
          noBillingBlockers: true,
        },
        expectedVersion: dischargeRow.version,
      });
    }

    await this.platformEvents.record({
      tenantId,
      branchId: admission.branchId,
      eventName: 'adrine.ipd.billing.settled',
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'ipd_admission',
      resourceId: admissionId,
      payload: {
        invoiceId: invoice.id,
        receiptNumber: current.invoice.receiptNumber,
      },
    });

    return {
      admission: { id: admission.id, state: admission.state },
      invoice: current.invoice,
      receiptNumber: current.invoice.receiptNumber,
    };
  }
}
