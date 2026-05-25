import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateOpdRadiologyBlockers,
  evaluateRadiologyTransition,
  HospitalPlatformEvents,
  preferredRadiologyActionForUiStatus,
  type RadiologyOrderState,
  type RadiologyValidationContext,
} from '@adrine/hospital-operations';
import { BillingSyncService } from '../billing/billing-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';
import { RealtimeService } from '../realtime/realtime.service';

const DEFAULT_RADIOLOGY_CHARGE_CENTS = 75_000;

@Injectable()
export class RadiologyRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly billingSync: BillingSyncService,
    private readonly realtime: RealtimeService,
  ) {}

  async createOrder(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      encounterId?: string;
      opdVisitId?: string;
      externalRef?: string;
      study: string;
      modality?: string;
      priority?: string;
      orderingDoctor: string;
      amountCents?: number;
      actorId?: string;
      actorRole?: string;
      syncBilling?: boolean;
    },
  ) {
    const billingChargeKey = body.externalRef
      ? `radiology:${body.externalRef}`
      : `radiology:${Date.now()}:${body.study.slice(0, 32)}`;

    const order = await this.prisma.radiologyStudyOrder.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        opdVisitId: body.opdVisitId,
        externalRef: body.externalRef,
        study: body.study,
        modality: body.modality ?? 'X-Ray',
        priority: body.priority ?? 'Routine',
        orderingDoctor: body.orderingDoctor,
        amountCents: body.amountCents ?? DEFAULT_RADIOLOGY_CHARGE_CENTS,
        billingChargeKey,
        state: 'ordered',
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.radiology.ordered,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'radiology_order',
      resourceId: order.id,
      payload: { study: body.study, opdVisitId: body.opdVisitId },
    });

    const transitioned = await this.transition(tenantId, order.id, {
      action: 'schedule_study',
      actorRole: body.actorRole ?? 'doctor',
      actorId: body.actorId,
      context: { studyDefined: true, patientIdentified: true, slotConfirmed: true },
    });

    if (body.syncBilling !== false && body.opdVisitId) {
      await this.billingSync.syncCharge(tenantId, {
        opdVisitId: body.opdVisitId,
        patientId: body.patientId,
        branchId,
        encounterId: body.encounterId,
        idempotencyKey: billingChargeKey,
        description: `Radiology — ${body.study}`,
        amountCents: order.amountCents,
        chargeCode: 'RADIOLOGY',
        sourceModule: 'radiology',
        sourceAction: 'order_created',
        sourceRefId: order.id,
        actorId: body.actorId,
        actorRole: body.actorRole,
      });
    }

    return transitioned;
  }

  async getOrder(tenantId: string, id: string) {
    const order = await this.prisma.radiologyStudyOrder.findFirst({
      where: { id, tenantId },
      include: { transitions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!order) throw new NotFoundException('Radiology order not found');
    return order;
  }

  async listForOpdVisit(tenantId: string, opdVisitId: string, take = 50, cursor?: string) {
    return this.prisma.radiologyStudyOrder.findMany({
      where: { tenantId, opdVisitId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  async getOpdRadiologyBlockers(tenantId: string, opdVisitId: string, opdVisitState: string) {
    const orders = await this.listForOpdVisit(tenantId, opdVisitId);
    const criticalUnack = orders.some(
      (o) => o.isCritical && o.state === 'critical_review' && !o.criticalAckAt,
    );
    const mandatoryPending = orders.some(
      (o) => !['completed', 'cancelled'].includes(o.state) && o.priority !== 'Routine',
    );
    return evaluateOpdRadiologyBlockers({
      opdVisitState,
      radiologyOrders: orders.map((o) => ({
        state: o.state as RadiologyOrderState,
        isCritical: o.isCritical,
        study: o.study,
      })),
      mandatoryStudiesPending: mandatoryPending,
      criticalUnacknowledged: criticalUnack,
    });
  }

  async transition(
    tenantId: string,
    orderId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: RadiologyValidationContext;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    const order = await this.getOrder(tenantId, orderId);
    const fromState = order.state as RadiologyOrderState;

    if (body.expectedVersion !== undefined && body.expectedVersion !== order.version) {
      throw new ConflictException('Radiology order version mismatch; refresh and retry');
    }

    const ctx: RadiologyValidationContext = {
      ...body.context,
      patientIdentified: body.context?.patientIdentified ?? true,
      studyDefined: body.context?.studyDefined ?? true,
    };

    const result = evaluateRadiologyTransition({
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

    if (body.action === 'flag_critical') patch.isCritical = true;
    if (body.action === 'approve_report' && order.isCritical) patch.criticalAckAt = new Date();
    if (body.payload?.report) patch.report = body.payload.report;
    if (result.nextState === 'completed') patch.completedAt = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.radiologyStudyOrder.update({
        where: { id: orderId },
        data: patch,
      });
      await tx.radiologyOrderTransition.create({
        data: {
          tenantId,
          radiologyOrderId: orderId,
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

    if (body.action === 'cancel_order' && order.billingChargeKey && order.opdVisitId) {
      await this.billingSync.reverseCharge(tenantId, {
        idempotencyKey: order.billingChargeKey,
        reason: body.reason ?? 'Radiology order cancelled',
        actorId: body.actorId,
        actorRole: body.actorRole,
      });
    }

    for (const eventName of result.events) {
      await this.platformEvents.record({
        tenantId,
        branchId: order.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'radiology_order',
        resourceId: orderId,
        payload: {
          action: body.action,
          fromState,
          toState: result.nextState,
          opdVisitId: order.opdVisitId,
        },
      });
    }

    this.realtime.emit(`${tenantId}:${order.branchId}`, {
      type: 'radiology.transition',
      orderId,
      state: result.nextState,
      opdVisitId: order.opdVisitId,
    });

    return { order: updated, transition: result };
  }

  async applyUiStatus(
    tenantId: string,
    orderId: string,
    uiStatus: 'Ordered' | 'Scheduled' | 'In Progress' | 'Completed' | 'Reported',
    body: { actorRole: string; actorId?: string; critical?: boolean },
  ) {
    let orderRow = await this.getOrder(tenantId, orderId);
    let guard = 0;

    while (guard++ < 8) {
      const action = preferredRadiologyActionForUiStatus(
        orderRow.state as RadiologyOrderState,
        uiStatus,
      );
      if (!action) break;

      if (action === 'flag_critical' || body.critical) {
        await this.transition(tenantId, orderId, {
          action: 'flag_critical',
          actorRole: body.actorRole,
          actorId: body.actorId,
          context: { criticalFindingDocumented: true },
        });
        orderRow = await this.getOrder(tenantId, orderId);
        continue;
      }

      const res = await this.transition(tenantId, orderId, {
        action,
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: {
          reportComplete: uiStatus === 'Completed' || uiStatus === 'Reported' ? true : undefined,
          criticalAcknowledgedIfRequired: true,
          imagesAcquired: action === 'complete_imaging' ? true : undefined,
          slotConfirmed: action === 'schedule_study' ? true : undefined,
        },
        payload:
          action === 'approve_report'
            ? { report: { summary: 'Entered via RIS UI' } }
            : undefined,
        expectedVersion: orderRow.version,
      });
      orderRow = { ...orderRow, ...res.order };
      if (uiStatus === 'Reported' && orderRow.state === 'published') break;
    }

    return this.getOrder(tenantId, orderId);
  }

  async getLiveRadiologyState(tenantId: string, opdVisitId: string) {
    const orders = await this.listForOpdVisit(tenantId, opdVisitId);
    const blockers = await this.getOpdRadiologyBlockers(tenantId, opdVisitId, 'orders_pending');
    const critical = orders.filter((o) => o.isCritical && o.state === 'critical_review');
    const pending = orders.filter((o) => !['completed', 'cancelled'].includes(o.state));

    return {
      orders: orders.map((o) => ({
        id: o.id,
        externalRef: o.externalRef,
        study: o.study,
        state: o.state,
        modality: o.modality,
        priority: o.priority,
        isCritical: o.isCritical,
      })),
      pendingCount: pending.length,
      criticalCount: critical.length,
      blockers,
    };
  }

  /** Branch-scoped open imaging orders for radiology department screens (Hospital OS). */
  async listBranchWorklist(tenantId: string, branchId: string, take = 100) {
    return this.prisma.radiologyStudyOrder.findMany({
      where: {
        tenantId,
        branchId,
        state: { notIn: ['completed', 'cancelled'] },
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
