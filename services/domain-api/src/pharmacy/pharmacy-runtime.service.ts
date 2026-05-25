import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateOpdPharmacyBlockers,
  evaluatePharmacyTransition,
  HospitalPlatformEvents,
  preferredActionForUiRxStatus,
  type PharmacyFulfillmentState,
  type PharmacyValidationContext,
  type UiPrescriptionStatus,
} from '@adrine/hospital-operations';
import { BillingSyncService } from '../billing/billing-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

export type MedicationLine = {
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  qty: number;
  dispensed?: number;
  isControlled?: boolean;
};

const DEFAULT_UNIT_PRICE_CENTS = 12_000;

@Injectable()
export class PharmacyRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly billingSync: BillingSyncService,
  ) {}

  async createPrescription(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      encounterId?: string;
      opdVisitId?: string;
      externalRef?: string;
      prescribingDoctor: string;
      department?: string;
      priority?: string;
      medications: MedicationLine[];
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const isControlled = body.medications.some((m) => m.isControlled);
    const fulfillment = await this.prisma.pharmacyFulfillment.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        opdVisitId: body.opdVisitId,
        externalRef: body.externalRef,
        prescribingDoctor: body.prescribingDoctor,
        department: body.department ?? '',
        priority: body.priority ?? 'Routine',
        medications: body.medications,
        isControlled,
        controlledApproved: !isControlled,
        state: 'prescribed',
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.pharmacy.prescriptionCreated,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'pharmacy_fulfillment',
      resourceId: fulfillment.id,
      payload: { opdVisitId: body.opdVisitId, lineCount: body.medications.length },
    });

    return this.transition(tenantId, fulfillment.id, {
      action: 'validate_prescription',
      actorRole: body.actorRole ?? 'doctor',
      actorId: body.actorId,
      context: {
        medicationsDefined: body.medications.length > 0,
        patientIdentified: true,
      },
    });
  }

  async getFulfillment(tenantId: string, id: string) {
    const row = await this.prisma.pharmacyFulfillment.findFirst({
      where: { id, tenantId },
      include: {
        transitions: { orderBy: { createdAt: 'desc' }, take: 25 },
        reservations: { include: { stockItem: true } },
      },
    });
    if (!row) throw new NotFoundException('Pharmacy fulfillment not found');
    return row;
  }

  async listForOpdVisit(tenantId: string, opdVisitId: string) {
    return this.prisma.pharmacyFulfillment.findMany({
      where: { tenantId, opdVisitId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOpdPharmacyBlockers(tenantId: string, opdVisitId: string, opdVisitState: string) {
    const fulfillments = await this.listForOpdVisit(tenantId, opdVisitId);
    return evaluateOpdPharmacyBlockers({
      opdVisitState,
      fulfillments: fulfillments.map((f) => ({
        state: f.state as PharmacyFulfillmentState,
        isControlled: f.isControlled,
        controlledApproved: f.controlledApproved,
        priority: f.priority,
      })),
    });
  }

  async getLivePharmacyState(tenantId: string, opdVisitId: string) {
    const fulfillments = await this.listForOpdVisit(tenantId, opdVisitId);
    const blockers = await this.getOpdPharmacyBlockers(tenantId, opdVisitId, 'orders_pending');
    const pending = fulfillments.filter(
      (f) => !['completed', 'cancelled', 'returned'].includes(f.state),
    );
    const stockWarnings = await this.prisma.pharmacyStockItem.findMany({
      where: {
        tenantId,
        qtyOnHand: { lte: 10 },
      },
      take: 5,
    });

    return {
      fulfillments: fulfillments.map((f) => ({
        id: f.id,
        externalRef: f.externalRef,
        state: f.state,
        priority: f.priority,
        isControlled: f.isControlled,
        controlledApproved: f.controlledApproved,
      })),
      pendingCount: pending.length,
      controlledPending: fulfillments.filter(
        (f) => f.isControlled && !f.controlledApproved && f.state !== 'cancelled',
      ).length,
      blockers,
      stockWarnings: stockWarnings.map((s) => ({
        drug: s.drug,
        available: s.qtyOnHand - s.qtyReserved,
        batch: s.batch,
      })),
    };
  }

  private async ensureStockForDrug(
    tenantId: string,
    branchId: string,
    line: MedicationLine,
  ) {
    const existing = await this.prisma.pharmacyStockItem.findFirst({
      where: { tenantId, branchId, drug: line.drug, qtyOnHand: { gt: 0 } },
      orderBy: { expiry: 'asc' },
    });
    if (existing) return existing;

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return this.prisma.pharmacyStockItem.create({
      data: {
        tenantId,
        branchId,
        drug: line.drug,
        generic: line.drug,
        batch: `AUTO-${Date.now().toString().slice(-6)}`,
        expiry,
        qtyOnHand: Math.max(line.qty * 2, 100),
        isControlled: !!line.isControlled,
        unitPriceCents: DEFAULT_UNIT_PRICE_CENTS,
      },
    });
  }

  private async reserveInventoryForFulfillment(
    tenantId: string,
    fulfillmentId: string,
    branchId: string,
    medications: MedicationLine[],
  ) {
    for (const line of medications) {
      const stock = await this.ensureStockForDrug(tenantId, branchId, line);
      const available = stock.qtyOnHand - stock.qtyReserved;
      const need = line.qty - (line.dispensed ?? 0);
      if (need <= 0) continue;
      if (available < need) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for ${line.drug} (need ${need}, available ${available})`,
        });
      }
      if (stock.expiry < new Date()) {
        throw new BadRequestException({
          code: 'BATCH_EXPIRED',
          message: `Batch expired for ${line.drug}`,
        });
      }

      await this.prisma.$transaction([
        this.prisma.pharmacyStockItem.update({
          where: { id: stock.id },
          data: { qtyReserved: { increment: need } },
        }),
        this.prisma.pharmacyInventoryReservation.create({
          data: {
            tenantId,
            fulfillmentId,
            stockItemId: stock.id,
            qtyReserved: need,
            status: 'active',
          },
        }),
      ]);
    }
  }

  private async releaseReservations(tenantId: string, fulfillmentId: string) {
    const active = await this.prisma.pharmacyInventoryReservation.findMany({
      where: { tenantId, fulfillmentId, status: 'active' },
    });
    for (const res of active) {
      await this.prisma.$transaction([
        this.prisma.pharmacyStockItem.update({
          where: { id: res.stockItemId },
          data: { qtyReserved: { decrement: res.qtyReserved } },
        }),
        this.prisma.pharmacyInventoryReservation.update({
          where: { id: res.id },
          data: { status: 'released', releasedAt: new Date() },
        }),
      ]);
    }
  }

  private async consumeReservations(
    tenantId: string,
    fulfillmentId: string,
    quantities?: Record<number, number>,
  ) {
    const fulfillment = await this.getFulfillment(tenantId, fulfillmentId);
    const meds = fulfillment.medications as MedicationLine[];
    const active = await this.prisma.pharmacyInventoryReservation.findMany({
      where: { tenantId, fulfillmentId, status: 'active' },
      include: { stockItem: true },
    });

    let totalCents = 0;
    const dispensed: MedicationLine[] = meds.map((m, i) => {
      const add = quantities?.[i] ?? m.qty - (m.dispensed ?? 0);
      return { ...m, dispensed: (m.dispensed ?? 0) + add };
    });

    for (const res of active) {
      const stock = res.stockItem;
      await this.prisma.$transaction([
        this.prisma.pharmacyStockItem.update({
          where: { id: stock.id },
          data: {
            qtyOnHand: { decrement: res.qtyReserved },
            qtyReserved: { decrement: res.qtyReserved },
          },
        }),
        this.prisma.pharmacyInventoryReservation.update({
          where: { id: res.id },
          data: { status: 'consumed' },
        }),
      ]);
      totalCents += res.qtyReserved * stock.unitPriceCents;
    }

    return { dispensed, totalCents };
  }

  async transition(
    tenantId: string,
    fulfillmentId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: PharmacyValidationContext;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    const fulfillment = await this.getFulfillment(tenantId, fulfillmentId);
    const fromState = fulfillment.state as PharmacyFulfillmentState;

    if (
      body.expectedVersion !== undefined &&
      body.expectedVersion !== fulfillment.version
    ) {
      throw new ConflictException('Pharmacy fulfillment version mismatch');
    }

    const meds = fulfillment.medications as MedicationLine[];
    const ctx: PharmacyValidationContext = {
      patientIdentified: true,
      medicationsDefined: meds.length > 0,
      ...body.context,
    };

    if (body.action === 'reserve_inventory') {
      try {
        await this.reserveInventoryForFulfillment(
          tenantId,
          fulfillmentId,
          fulfillment.branchId,
          meds,
        );
        ctx.stockAvailable = true;
        ctx.batchNotExpired = true;
        ctx.controlledSubstanceApproved =
          !fulfillment.isControlled || fulfillment.controlledApproved;
      } catch (e) {
        ctx.stockAvailable = false;
        if (e instanceof BadRequestException) throw e;
      }
    }

    if (body.action === 'approve_controlled') {
      ctx.controlledSubstanceApproved = true;
    }

    if (['dispense_full', 'dispense_partial', 'complete_dispense'].includes(body.action)) {
      const quantities = body.payload?.quantities as Record<number, number> | undefined;
      ctx.dispenseQuantitiesValid = true;
      ctx.partialDispenseAllowed = body.action !== 'dispense_full';
      if (quantities) {
        for (const [idx, qty] of Object.entries(quantities)) {
          const line = meds[Number(idx)];
          if (!line || qty < 0 || (line.dispensed ?? 0) + qty > line.qty) {
            ctx.dispenseQuantitiesValid = false;
          }
        }
      }
    }

    if (body.action === 'cancel_prescription') {
      ctx.cancelReasonProvided = body.context?.cancelReasonProvided ?? !!body.reason;
    }
    if (body.action === 'process_return') {
      ctx.returnReasonProvided = body.context?.returnReasonProvided ?? !!body.reason;
    }

    const result = evaluatePharmacyTransition({
      state: fromState,
      action: body.action,
      actorRole: body.actorRole,
      validationContext: ctx,
    });

    if (!result.ok) {
      throw new BadRequestException({ code: result.code, message: result.reason });
    }

    const patch: Record<string, unknown> = {
      state: result.nextState,
      version: { increment: 1 },
    };

    if (body.action === 'approve_controlled') {
      patch.controlledApproved = true;
    }

    let billingCents = 0;
    if (['dispense_full', 'dispense_partial', 'complete_dispense'].includes(body.action)) {
      const { dispensed, totalCents } = await this.consumeReservations(
        tenantId,
        fulfillmentId,
        body.payload?.quantities as Record<number, number> | undefined,
      );
      patch.medications = dispensed;
      patch.dispensedSnapshot = dispensed;
      patch.amountCents = fulfillment.amountCents + totalCents;
      billingCents = totalCents;
    }

    if (body.action === 'cancel_prescription' || body.action === 'process_return') {
      await this.releaseReservations(tenantId, fulfillmentId);
      if (fulfillment.billingChargeKey && fulfillment.opdVisitId) {
        await this.billingSync.reverseCharge(tenantId, {
          idempotencyKey: fulfillment.billingChargeKey,
          reason: body.reason ?? body.action,
          actorId: body.actorId,
          actorRole: body.actorRole,
        });
      }
    }

    if (result.nextState === 'completed') {
      patch.completedAt = new Date();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.pharmacyFulfillment.update({
        where: { id: fulfillmentId },
        data: patch,
      });
      await tx.pharmacyFulfillmentTransition.create({
        data: {
          tenantId,
          fulfillmentId,
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

    if (
      billingCents > 0 &&
      fulfillment.opdVisitId &&
      ['dispense_full', 'dispense_partial', 'complete_dispense'].includes(body.action)
    ) {
      const chargeKey =
        fulfillment.billingChargeKey ??
        `rx:${fulfillment.externalRef ?? fulfillment.id}:${Date.now()}`;
      await this.billingSync.syncCharge(tenantId, {
        opdVisitId: fulfillment.opdVisitId,
        patientId: fulfillment.patientId,
        branchId: fulfillment.branchId,
        encounterId: fulfillment.encounterId ?? undefined,
        idempotencyKey: chargeKey,
        description: `Pharmacy dispense — ${meds.map((m) => m.drug).join(', ').slice(0, 80)}`,
        amountCents: billingCents,
        chargeCode: 'PHARM',
        sourceModule: 'pharmacy',
        sourceAction: body.action,
        sourceRefId: fulfillment.id,
        actorId: body.actorId,
        actorRole: body.actorRole,
      });
      if (!fulfillment.billingChargeKey) {
        await this.prisma.pharmacyFulfillment.update({
          where: { id: fulfillmentId },
          data: { billingChargeKey: chargeKey },
        });
      }
    }

    for (const eventName of result.events) {
      await this.platformEvents.record({
        tenantId,
        branchId: fulfillment.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'pharmacy_fulfillment',
        resourceId: fulfillmentId,
        payload: {
          action: body.action,
          fromState,
          toState: result.nextState,
          metering: result.metering,
        },
      });
    }

    return { fulfillment: updated, transition: result };
  }

  async applyUiRxStatus(
    tenantId: string,
    fulfillmentId: string,
    uiStatus: UiPrescriptionStatus,
    body: { actorRole: string; actorId?: string; quantities?: Record<number, number> },
  ) {
    let row = await this.getFulfillment(tenantId, fulfillmentId);
    let guard = 0;

    while (guard++ < 10) {
      if (uiStatus === 'Cancelled') {
        await this.transition(tenantId, fulfillmentId, {
          action: 'cancel_prescription',
          actorRole: body.actorRole,
          actorId: body.actorId,
          reason: 'Cancelled via UI',
          context: { cancelReasonProvided: true },
        });
        break;
      }

      const action = preferredActionForUiRxStatus(row.state as PharmacyFulfillmentState, uiStatus);
      if (!action) break;

      const payload: Record<string, unknown> = {};
      if (['dispense_full', 'dispense_partial', 'complete_dispense'].includes(action)) {
        payload.quantities = body.quantities;
      }

      const ctx: PharmacyValidationContext = {
        pharmacistSignOff: action === 'approve_dispense' ? true : undefined,
        partialDispenseAllowed: true,
        controlledSubstanceApproved: row.isControlled ? row.controlledApproved : true,
      };

      if (row.isControlled && !row.controlledApproved && action === 'reserve_inventory') {
        await this.transition(tenantId, fulfillmentId, {
          action: 'approve_controlled',
          actorRole: body.actorRole,
          actorId: body.actorId,
          context: { controlledSubstanceApproved: true },
        });
        row = await this.getFulfillment(tenantId, fulfillmentId);
        continue;
      }

      await this.transition(tenantId, fulfillmentId, {
        action,
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: ctx,
        payload,
        expectedVersion: row.version,
      });
      row = await this.getFulfillment(tenantId, fulfillmentId);

      if (row.state === mapUiRxStatusToState(uiStatus) || uiStatus === 'Dispensed' && row.state === 'completed') {
        break;
      }
    }

    return this.getFulfillment(tenantId, fulfillmentId);
  }

  async dispense(
    tenantId: string,
    fulfillmentId: string,
    body: {
      quantities: Record<number, number>;
      actorRole: string;
      actorId?: string;
    },
  ) {
    let row = await this.getFulfillment(tenantId, fulfillmentId);
    const meds = row.medications as MedicationLine[];

    const allAfter = meds.every((m, i) => (m.dispensed ?? 0) + (body.quantities[i] ?? 0) >= m.qty);
    const uiStatus: UiPrescriptionStatus = allAfter ? 'Dispensed' : 'Partially dispensed';

    if (!['ready_to_dispense', 'partially_dispensed'].includes(row.state)) {
      await this.applyUiRxStatus(tenantId, fulfillmentId, 'Verified', body);
      row = await this.getFulfillment(tenantId, fulfillmentId);
    }

    const action = allAfter
      ? row.state === 'partially_dispensed'
        ? 'complete_dispense'
        : 'dispense_full'
      : 'dispense_partial';

    await this.transition(tenantId, fulfillmentId, {
      action,
      actorRole: body.actorRole,
      actorId: body.actorId,
      context: { dispenseQuantitiesValid: true, partialDispenseAllowed: true },
      payload: { quantities: body.quantities },
      expectedVersion: row.version,
    });

    row = await this.getFulfillment(tenantId, fulfillmentId);
    if (uiStatus === 'Dispensed' && row.state === 'dispensed') {
      await this.transition(tenantId, fulfillmentId, {
        action: 'complete_fulfillment',
        actorRole: body.actorRole,
        actorId: body.actorId,
        expectedVersion: row.version,
      });
    }

    return this.getFulfillment(tenantId, fulfillmentId);
  }

  /** Patient portal — prescriptions / fulfillments for a patient. */
  async listForPatient(tenantId: string, patientId: string, take = 50) {
    return this.prisma.pharmacyFulfillment.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Authoritative branch stock for pharmacy inventory screens. */
  async listBranchStock(tenantId: string, branchId: string, take = 200) {
    return this.prisma.pharmacyStockItem.findMany({
      where: { tenantId, branchId },
      orderBy: [{ drug: 'asc' }, { expiry: 'asc' }],
      take,
    });
  }

  /** Branch-scoped open fulfillments for pharmacy department screens (Hospital OS). */
  async listBranchWorklist(tenantId: string, branchId: string, take = 100) {
    return this.prisma.pharmacyFulfillment.findMany({
      where: {
        tenantId,
        branchId,
        state: { notIn: ['cancelled', 'returned'] },
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}

function mapUiRxStatusToState(status: UiPrescriptionStatus): PharmacyFulfillmentState {
  const map: Record<UiPrescriptionStatus, PharmacyFulfillmentState> = {
    Pending: 'awaiting_review',
    Verified: 'ready_to_dispense',
    'Partially dispensed': 'partially_dispensed',
    Dispensed: 'dispensed',
    Cancelled: 'cancelled',
  };
  return map[status];
}
