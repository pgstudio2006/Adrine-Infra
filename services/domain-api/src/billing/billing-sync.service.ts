import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HospitalPlatformEvents } from '@adrine/hospital-operations';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';
import { BillingGatesService } from './billing-gates.service';
import { HIGH_COST_CHARGE_THRESHOLD_CENTS } from './billing-dept-catalog';

const MUTABLE_INVOICE_STATES = ['draft', 'pending_approval', 'issued', 'partial', 'overdue'];

export type SyncChargeInput = {
  opdVisitId: string;
  patientId: string;
  branchId: string;
  encounterId?: string;
  idempotencyKey: string;
  description: string;
  amountCents: number;
  chargeCode?: string;
  sourceModule: string;
  sourceAction: string;
  sourceRefId?: string;
  actorId?: string;
  actorRole?: string;
  expectedVersion?: number;
  corporatePayer?: boolean;
  insuranceMode?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class BillingSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly gates: BillingGatesService,
  ) {}

  /** Opens or returns the live OPD draft invoice (idempotent). */
  async ensureOpdDraft(
    tenantId: string,
    body: {
      opdVisitId: string;
      patientId: string;
      branchId: string;
      encounterId?: string;
      corporatePayer?: boolean;
      insuranceMode?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const existing = await this.prisma.invoice.findFirst({
      where: { tenantId, opdVisitId: body.opdVisitId, status: { notIn: ['void'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        branchId: body.branchId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        opdVisitId: body.opdVisitId,
        amountCents: 0,
        lineItems: [],
        corporatePayer: body.corporatePayer ?? false,
        insuranceMode: body.insuranceMode ?? 'self',
        status: 'draft',
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId: body.branchId,
      eventName: HospitalPlatformEvents.billing.draftOpened,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'invoice',
      resourceId: invoice.id,
      payload: { opdVisitId: body.opdVisitId },
    });

    return invoice;
  }

  /** Add or update charge line (idempotent key) and recalculate invoice. */
  async syncCharge(tenantId: string, input: SyncChargeInput) {
    if (input.amountCents < 0) {
      throw new BadRequestException('Charge amount cannot be negative');
    }

    const visit = await this.prisma.opdVisit.findFirst({
      where: { id: input.opdVisitId, tenantId },
    });
    if (!visit) throw new NotFoundException('OPD visit not found');
    if (visit.encounterId) {
      await this.gates.assertEncounterClosed(tenantId, visit.encounterId);
    } else if (!['billing_pending', 'completed'].includes(visit.state)) {
      throw new BadRequestException(
        'OPD visit must reach billing_pending before charges sync (encounter closure required)',
      );
    }

    if (
      input.amountCents >= HIGH_COST_CHARGE_THRESHOLD_CENTS &&
      input.insuranceMode &&
      ['insurance', 'tpa'].includes(input.insuranceMode.toLowerCase())
    ) {
      const ok = await this.gates.resolveInsurancePreauthOk(tenantId, {
        insuranceMode: input.insuranceMode,
        opdVisitId: input.opdVisitId,
      });
      if (ok === false) {
        throw new BadRequestException(
          'Insurance pre-authorization required for high-cost order',
        );
      }
    }

    const invoice = await this.ensureOpdDraft(tenantId, {
      opdVisitId: input.opdVisitId,
      patientId: input.patientId,
      branchId: input.branchId,
      encounterId: input.encounterId,
      corporatePayer: input.corporatePayer,
      insuranceMode: input.insuranceMode,
      actorId: input.actorId,
      actorRole: input.actorRole,
    });

    if (!MUTABLE_INVOICE_STATES.includes(invoice.status)) {
      throw new BadRequestException(
        `Cannot sync charges on invoice in status "${invoice.status}"`,
      );
    }

    if (
      input.expectedVersion !== undefined &&
      input.expectedVersion !== invoice.version
    ) {
      throw new ConflictException('Invoice version mismatch; refresh and retry');
    }

    const existing = await this.prisma.invoiceChargeLine.findUnique({
      where: { tenantId_idempotencyKey: { tenantId, idempotencyKey: input.idempotencyKey } },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      let eventName: string = HospitalPlatformEvents.billing.chargeAdded;
      let line;

      if (existing) {
        if (existing.status === 'reversed') {
          throw new ConflictException('Cannot update a reversed charge; post a new idempotency key');
        }
        if (existing.invoiceId !== invoice.id) {
          throw new ConflictException('Idempotency key belongs to another invoice');
        }
        if (existing.amountCents === input.amountCents && existing.description === input.description) {
          return { invoice, line: existing, duplicate: true };
        }
        line = await tx.invoiceChargeLine.update({
          where: { id: existing.id },
          data: {
            description: input.description,
            amountCents: input.amountCents,
            chargeCode: input.chargeCode,
            metadata: input.metadata as object | undefined,
          },
        });
        eventName = HospitalPlatformEvents.billing.chargeUpdated;
      } else {
        line = await tx.invoiceChargeLine.create({
          data: {
            tenantId,
            invoiceId: invoice.id,
            idempotencyKey: input.idempotencyKey,
            chargeCode: input.chargeCode,
            description: input.description,
            amountCents: input.amountCents,
            sourceModule: input.sourceModule,
            sourceAction: input.sourceAction,
            sourceRefId: input.sourceRefId,
            metadata: input.metadata as object | undefined,
          },
        });
      }

      const updatedInvoice = await this.recalculateInTx(tx, tenantId, invoice.id);
      return { invoice: updatedInvoice, line, duplicate: false, eventName };
    });

    if (!result.duplicate) {
      await this.platformEvents.record({
        tenantId,
        branchId: input.branchId,
        eventName: result.eventName!,
        actorId: input.actorId,
        actorRole: input.actorRole,
        resourceType: 'invoice_charge',
        resourceId: result.line.id,
        payload: {
          invoiceId: result.invoice.id,
          opdVisitId: input.opdVisitId,
          idempotencyKey: input.idempotencyKey,
          amountCents: input.amountCents,
        },
      });
      await this.platformEvents.record({
        tenantId,
        branchId: input.branchId,
        eventName: HospitalPlatformEvents.billing.invoiceRecalculated,
        resourceType: 'invoice',
        resourceId: result.invoice.id,
        payload: {
          amountCents: result.invoice.amountCents,
          lineCount: await this.prisma.invoiceChargeLine.count({
            where: { invoiceId: result.invoice.id, status: 'active' },
          }),
        },
      });
    }

    return result;
  }

  async reverseCharge(
    tenantId: string,
    body: {
      idempotencyKey: string;
      reason?: string;
      actorId?: string;
      actorRole?: string;
      expectedVersion?: number;
    },
  ) {
    const line = await this.prisma.invoiceChargeLine.findUnique({
      where: { tenantId_idempotencyKey: { tenantId, idempotencyKey: body.idempotencyKey } },
      include: { invoice: true },
    });
    if (!line) throw new NotFoundException('Charge line not found');
    if (line.status === 'reversed') {
      return { invoice: line.invoice, line, alreadyReversed: true };
    }

    if (
      body.expectedVersion !== undefined &&
      body.expectedVersion !== line.invoice.version
    ) {
      throw new ConflictException('Invoice version mismatch');
    }

    if (!MUTABLE_INVOICE_STATES.includes(line.invoice.status)) {
      throw new BadRequestException('Cannot reverse charges on a settled invoice');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const reversed = await tx.invoiceChargeLine.update({
        where: { id: line.id },
        data: { status: 'reversed', reversedAt: new Date() },
      });
      const invoice = await this.recalculateInTx(tx, tenantId, line.invoiceId);
      return { invoice, line: reversed };
    });

    await this.platformEvents.record({
      tenantId,
      branchId: line.invoice.branchId,
      eventName: HospitalPlatformEvents.billing.chargeReversed,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'invoice_charge',
      resourceId: line.id,
      payload: { reason: body.reason, invoiceId: line.invoiceId },
    });
    await this.platformEvents.record({
      tenantId,
      branchId: line.invoice.branchId,
      eventName: HospitalPlatformEvents.billing.invoiceRecalculated,
      resourceType: 'invoice',
      resourceId: line.invoiceId,
      payload: { amountCents: result.invoice.amountCents },
    });

    return result;
  }

  /** Opens or returns the live IPD draft invoice (idempotent). */
  async ensureIpdDraft(
    tenantId: string,
    body: {
      admissionId: string;
      patientId: string;
      branchId: string;
      encounterId?: string;
      corporatePayer?: boolean;
      insuranceMode?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const existing = await this.prisma.invoice.findFirst({
      where: { tenantId, ipdAdmissionId: body.admissionId, status: { notIn: ['void'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        branchId: body.branchId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        ipdAdmissionId: body.admissionId,
        amountCents: 0,
        lineItems: [],
        corporatePayer: body.corporatePayer ?? false,
        insuranceMode: body.insuranceMode ?? 'self',
        status: 'draft',
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId: body.branchId,
      eventName: HospitalPlatformEvents.billing.draftOpened,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'invoice',
      resourceId: invoice.id,
      payload: { ipdAdmissionId: body.admissionId },
    });

    return invoice;
  }

  /** Add or update IPD charge line (idempotent key). */
  async syncIpdCharge(
    tenantId: string,
    input: {
      admissionId: string;
      patientId: string;
      branchId: string;
      encounterId?: string;
      idempotencyKey: string;
      description: string;
      amountCents: number;
      chargeCode?: string;
      sourceModule: string;
      sourceAction: string;
      sourceRefId?: string;
      actorId?: string;
      actorRole?: string;
      expectedVersion?: number;
      corporatePayer?: boolean;
      insuranceMode?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (input.amountCents < 0) {
      throw new BadRequestException('Charge amount cannot be negative');
    }

    const admission = await this.prisma.ipdAdmission.findFirst({
      where: { id: input.admissionId, tenantId },
    });
    if (!admission) throw new NotFoundException('IPD admission not found');
    if (admission.encounterId) {
      await this.gates.assertEncounterClosed(tenantId, admission.encounterId);
    }

    await this.gates.assertInsurancePreauthForIpd(
      tenantId,
      input.admissionId,
      input.amountCents,
      input.insuranceMode ?? admission.insuranceMode,
    );

    const invoice = await this.ensureIpdDraft(tenantId, {
      admissionId: input.admissionId,
      patientId: input.patientId,
      branchId: input.branchId,
      encounterId: input.encounterId,
      corporatePayer: input.corporatePayer,
      insuranceMode: input.insuranceMode,
      actorId: input.actorId,
      actorRole: input.actorRole,
    });

    if (!MUTABLE_INVOICE_STATES.includes(invoice.status)) {
      throw new BadRequestException(
        `Cannot sync IPD charges on invoice in status "${invoice.status}"`,
      );
    }

    if (
      input.expectedVersion !== undefined &&
      input.expectedVersion !== invoice.version
    ) {
      throw new ConflictException('Invoice version mismatch; refresh and retry');
    }

    const existing = await this.prisma.invoiceChargeLine.findUnique({
      where: { tenantId_idempotencyKey: { tenantId, idempotencyKey: input.idempotencyKey } },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      let eventName: string = HospitalPlatformEvents.billing.chargeAdded;
      let line;

      if (existing) {
        if (existing.status === 'reversed') {
          throw new ConflictException('Cannot update a reversed charge');
        }
        if (existing.invoiceId !== invoice.id) {
          throw new ConflictException('Idempotency key belongs to another invoice');
        }
        if (
          existing.amountCents === input.amountCents &&
          existing.description === input.description
        ) {
          return { invoice, line: existing, duplicate: true };
        }
        line = await tx.invoiceChargeLine.update({
          where: { id: existing.id },
          data: {
            description: input.description,
            amountCents: input.amountCents,
            chargeCode: input.chargeCode,
            metadata: input.metadata as object | undefined,
          },
        });
        eventName = HospitalPlatformEvents.billing.chargeUpdated;
      } else {
        line = await tx.invoiceChargeLine.create({
          data: {
            tenantId,
            invoiceId: invoice.id,
            idempotencyKey: input.idempotencyKey,
            chargeCode: input.chargeCode,
            description: input.description,
            amountCents: input.amountCents,
            sourceModule: input.sourceModule,
            sourceAction: input.sourceAction,
            sourceRefId: input.sourceRefId,
            metadata: input.metadata as object | undefined,
          },
        });
      }

      const updatedInvoice = await this.recalculateInTx(tx, tenantId, invoice.id);
      return { invoice: updatedInvoice, line, duplicate: false, eventName };
    });

    if (!result.duplicate) {
      await this.platformEvents.record({
        tenantId,
        branchId: input.branchId,
        eventName: result.eventName!,
        actorId: input.actorId,
        actorRole: input.actorRole,
        resourceType: 'invoice_charge',
        resourceId: result.line.id,
        payload: {
          invoiceId: result.invoice.id,
          ipdAdmissionId: input.admissionId,
          idempotencyKey: input.idempotencyKey,
          amountCents: input.amountCents,
        },
      });
    }

    return result;
  }

  async reverseIpdCharge(
    tenantId: string,
    body: {
      idempotencyKey: string;
      reason?: string;
      actorId?: string;
      actorRole?: string;
      expectedVersion?: number;
    },
  ) {
    return this.reverseCharge(tenantId, body);
  }

  async getLiveIpdFinancialState(tenantId: string, admissionId: string) {
    const admission = await this.prisma.ipdAdmission.findFirst({
      where: { id: admissionId, tenantId },
      include: { patient: true },
    });
    if (!admission) throw new NotFoundException('IPD admission not found');

    const invoice = await this.prisma.invoice.findFirst({
      where: { tenantId, ipdAdmissionId: admissionId, status: { notIn: ['void'] } },
      include: {
        chargeLines: {
          where: { status: 'active' },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const blockers: string[] = [];
    if (!invoice) {
      blockers.push('No live IPD invoice draft yet');
    } else if (invoice.status === 'settled') {
      blockers.push('IPD invoice already settled');
    }

    const outstandingCents = invoice
      ? Math.max(0, invoice.amountCents - invoice.paidCents)
      : 0;

    if (outstandingCents > 0 && admission.state !== 'discharge_pending') {
      blockers.push('Outstanding IPD charges on account');
    }

    return {
      admission: {
        id: admission.id,
        state: admission.state,
        ward: admission.ward,
        insuranceMode: admission.insuranceMode,
      },
      invoice: invoice
        ? {
            id: invoice.id,
            status: invoice.status,
            version: invoice.version,
            amountCents: invoice.amountCents,
            paidCents: invoice.paidCents,
            outstandingCents,
            lineCount: invoice.chargeLines.length,
            lines: invoice.chargeLines.map((l) => ({
              id: l.id,
              description: l.description,
              amountCents: l.amountCents,
              chargeCode: l.chargeCode,
              sourceModule: l.sourceModule,
            })),
          }
        : null,
      blockers,
      warnings:
        outstandingCents > 0
          ? [`₹${(outstandingCents / 100).toFixed(2)} outstanding on IPD bill`]
          : [],
    };
  }

  async getLiveFinancialState(tenantId: string, opdVisitId: string) {
    const visit = await this.prisma.opdVisit.findFirst({
      where: { id: opdVisitId, tenantId },
      include: { patient: true },
    });
    if (!visit) throw new NotFoundException('OPD visit not found');

    const invoice = await this.prisma.invoice.findFirst({
      where: { tenantId, opdVisitId, status: { notIn: ['void'] } },
      include: {
        chargeLines: {
          where: { status: 'active' },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const blockers: string[] = [];
    if (!invoice) {
      blockers.push('No live invoice draft yet');
    } else if (invoice.status === 'settled') {
      blockers.push('Invoice already settled');
    } else if (visit.escalationLevel > 0) {
      blockers.push('Visit escalated — supervisor may be required at settlement');
    }
    if (invoice && invoice.amountCents > invoice.paidCents && visit.state !== 'billing_pending' && visit.state !== 'completed') {
      blockers.push('Outstanding charges — visit not yet in billing_pending');
    }

    if (!['completed', 'cancelled'].includes(visit.state)) {
      const [labOrders, rxRows, radOrders] = await Promise.all([
        this.prisma.labDiagnosticOrder.findMany({
          where: { tenantId, opdVisitId },
          select: { state: true, isCritical: true },
        }),
        this.prisma.pharmacyFulfillment.findMany({
          where: { tenantId, opdVisitId },
          select: { state: true, priority: true, isControlled: true, controlledApproved: true },
        }),
        this.prisma.radiologyStudyOrder.findMany({
          where: { tenantId, opdVisitId },
          select: { state: true, isCritical: true, priority: true },
        }),
      ]);

      const labPending = labOrders.filter(
        (o) => !['completed', 'cancelled', 'published'].includes(o.state),
      );
      if (labPending.length > 0 && ['orders_pending', 'billing_pending'].includes(visit.state)) {
        blockers.push(`${labPending.length} lab order(s) still in progress`);
      }
      const labCritical = labOrders.filter(
        (o) => o.isCritical && !['completed', 'cancelled', 'published'].includes(o.state),
      );
      if (labCritical.length > 0) {
        blockers.push('Critical lab results require acknowledgment before settlement');
      }

      const rxPending = rxRows.filter(
        (f) => !['completed', 'cancelled', 'returned'].includes(f.state),
      );
      if (rxPending.length > 0 && ['orders_pending', 'billing_pending'].includes(visit.state)) {
        blockers.push(`${rxPending.length} pharmacy fulfillment(s) outstanding`);
      }

      const radPending = radOrders.filter(
        (o) => !['completed', 'cancelled'].includes(o.state),
      );
      if (radPending.length > 0 && ['orders_pending', 'billing_pending'].includes(visit.state)) {
        blockers.push(`${radPending.length} radiology order(s) still in progress`);
      }
    }

    const outstandingCents = invoice
      ? Math.max(0, invoice.amountCents - invoice.paidCents)
      : 0;

    return {
      visit: {
        id: visit.id,
        state: visit.state,
        escalationLevel: visit.escalationLevel,
        department: visit.department,
      },
      invoice: invoice
        ? {
            id: invoice.id,
            status: invoice.status,
            version: invoice.version,
            amountCents: invoice.amountCents,
            paidCents: invoice.paidCents,
            outstandingCents,
            corporatePayer: invoice.corporatePayer,
            insuranceMode: invoice.insuranceMode,
            lineCount: invoice.chargeLines.length,
            lines: invoice.chargeLines.map((l) => ({
              id: l.id,
              description: l.description,
              amountCents: l.amountCents,
              chargeCode: l.chargeCode,
              sourceModule: l.sourceModule,
            })),
          }
        : null,
      blockers,
      warnings: outstandingCents > 0 ? [`₹${(outstandingCents / 100).toFixed(2)} outstanding`] : [],
    };
  }

  async getActiveLineItems(tenantId: string, opdVisitId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { tenantId, opdVisitId, status: { notIn: ['void'] } },
    });
    if (!invoice) return [];

    const lines = await this.prisma.invoiceChargeLine.findMany({
      where: { invoiceId: invoice.id, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    return lines.map((l) => ({
      description: l.description,
      amountCents: l.amountCents,
    }));
  }

  async getActiveIpdLineItems(tenantId: string, admissionId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { tenantId, ipdAdmissionId: admissionId, status: { notIn: ['void'] } },
    });
    if (!invoice) return [];

    const lines = await this.prisma.invoiceChargeLine.findMany({
      where: { invoiceId: invoice.id, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    return lines.map((l) => ({
      description: l.description,
      amountCents: l.amountCents,
    }));
  }

  private async recalculateInTx(
    tx: Prisma.TransactionClient,
    _tenantId: string,
    invoiceId: string,
  ) {
    const active = await tx.invoiceChargeLine.findMany({
      where: { invoiceId, status: 'active' },
    });
    const amountCents = active.reduce((s, l) => s + l.amountCents, 0);
    const lineItems = active.map((l) => ({
      id: l.id,
      description: l.description,
      amountCents: l.amountCents,
      chargeCode: l.chargeCode,
    }));

    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountCents,
        lineItems: lineItems as object,
        version: { increment: 1 },
      },
    });
  }
}
