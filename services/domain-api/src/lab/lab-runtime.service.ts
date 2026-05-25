import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateLabTransition,
  evaluateOpdLabBlockers,
  getRequiredLabActionForUiStage,
  guardLabUiStageAdvance,
  HospitalPlatformEvents,
  type LabOrderState,
  type LabValidationContext,
  preferredActionForUiStage,
} from '@adrine/hospital-operations';
import { BillingSyncService } from '../billing/billing-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';
import { PlatformNotificationService } from '../platform-notification/notification.service';

const DEFAULT_LAB_CHARGE_CENTS = 50_000;

@Injectable()
export class LabRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly billingSync: BillingSyncService,
    private readonly notifications: PlatformNotificationService,
  ) {}

  async createOrder(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      encounterId?: string;
      opdVisitId?: string;
      externalRef?: string;
      tests: string;
      category?: string;
      priority?: string;
      orderingDoctor: string;
      amountCents?: number;
      actorId?: string;
      actorRole?: string;
      syncBilling?: boolean;
    },
  ) {
    const billingChargeKey = body.externalRef
      ? `lab:${body.externalRef}`
      : `lab:${Date.now()}:${body.tests.slice(0, 32)}`;

    const order = await this.prisma.labDiagnosticOrder.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        opdVisitId: body.opdVisitId,
        externalRef: body.externalRef,
        tests: body.tests,
        category: body.category ?? 'General',
        priority: body.priority ?? 'Routine',
        orderingDoctor: body.orderingDoctor,
        amountCents: body.amountCents ?? DEFAULT_LAB_CHARGE_CENTS,
        billingChargeKey,
        state: 'ordered',
        sampleId: `S-${Date.now().toString().slice(-8)}`,
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.lab.ordered,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'lab_order',
      resourceId: order.id,
      payload: { tests: body.tests, opdVisitId: body.opdVisitId },
    });

    const transitioned = await this.transition(tenantId, order.id, {
      action: 'validate_order',
      actorRole: body.actorRole ?? 'doctor',
      actorId: body.actorId,
      context: { testsDefined: true, patientIdentified: true },
    });

    if (body.syncBilling !== false && body.opdVisitId) {
      await this.billingSync.syncCharge(tenantId, {
        opdVisitId: body.opdVisitId,
        patientId: body.patientId,
        branchId,
        encounterId: body.encounterId,
        idempotencyKey: billingChargeKey,
        description: `Lab — ${body.tests}`,
        amountCents: order.amountCents,
        chargeCode: 'LAB',
        sourceModule: 'lab',
        sourceAction: 'order_created',
        sourceRefId: order.id,
        actorId: body.actorId,
        actorRole: body.actorRole,
      });
    }

    return transitioned;
  }

  async getOrder(tenantId: string, id: string) {
    const order = await this.prisma.labDiagnosticOrder.findFirst({
      where: { id, tenantId },
      include: { transitions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!order) throw new NotFoundException('Lab order not found');
    return order;
  }

  async listForOpdVisit(tenantId: string, opdVisitId: string, take = 50, cursor?: string) {
    return this.prisma.labDiagnosticOrder.findMany({
      where: { tenantId, opdVisitId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  async getOpdLabBlockers(tenantId: string, opdVisitId: string, opdVisitState: string) {
    const orders = await this.listForOpdVisit(tenantId, opdVisitId);
    const criticalUnack = orders.some(
      (o) => o.isCritical && o.state === 'critical_review' && !o.criticalAckAt,
    );
    const mandatoryPending = orders.some(
      (o) => !['completed', 'cancelled'].includes(o.state) && o.priority !== 'Routine',
    );
    return evaluateOpdLabBlockers({
      opdVisitState,
      labOrders: orders.map((o) => ({
        state: o.state as LabOrderState,
        isCritical: o.isCritical,
        tests: o.tests,
      })),
      mandatoryTestsPending: mandatoryPending,
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
      context?: LabValidationContext;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    const order = await this.getOrder(tenantId, orderId);
    const fromState = order.state as LabOrderState;

    if (
      body.expectedVersion !== undefined &&
      body.expectedVersion !== order.version
    ) {
      throw new ConflictException('Lab order version mismatch; refresh and retry');
    }

    const ctx: LabValidationContext = {
      ...body.context,
      patientIdentified: body.context?.patientIdentified ?? true,
      testsDefined: body.context?.testsDefined ?? true,
    };

    if (body.action === 'collect_sample') {
      ctx.barcodeLinked =
        body.context?.barcodeLinked ??
        (!!order.sampleBarcode || !!body.payload?.sampleBarcode);
      ctx.consentForSample = body.context?.consentForSample ?? true;
    }

    const result = evaluateLabTransition({
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

    if (body.action === 'collect_sample' && body.payload?.sampleBarcode) {
      patch.sampleBarcode = body.payload.sampleBarcode;
    }
    if (body.action === 'flag_critical') {
      patch.isCritical = true;
    }
    if (body.action === 'approve_results' && order.isCritical) {
      patch.criticalAckAt = new Date();
    }
    if (body.payload?.results) {
      patch.results = body.payload.results;
    }
    if (result.nextState === 'completed') {
      patch.completedAt = new Date();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.labDiagnosticOrder.update({
        where: { id: orderId },
        data: patch,
      });
      await tx.labOrderTransition.create({
        data: {
          tenantId,
          labOrderId: orderId,
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
        reason: body.reason ?? 'Lab order cancelled',
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
        resourceType: 'lab_order',
        resourceId: orderId,
        payload: {
          action: body.action,
          fromState,
          toState: result.nextState,
          opdVisitId: order.opdVisitId,
          metering: result.metering,
        },
      });
    }

    const isCriticalEvent =
      body.action === 'flag_critical' ||
      result.events.includes(HospitalPlatformEvents.lab.resultCritical);
    if (isCriticalEvent) {
      await this.notifications
        .enqueueFromEvent(tenantId, {
          channel: 'sms',
          recipient: 'lab-oncall@tenant.local',
          templateCode: 'lab_critical',
          eventName: HospitalPlatformEvents.lab.resultCritical,
          payload: { orderId, branchId: order.branchId, tests: order.tests },
        })
        .catch(() => undefined);
    }

    return { order: updated, transition: result };
  }

  /** Advance toward a UI lab stage using governed transitions. */
  async applyUiStage(
    tenantId: string,
    orderId: string,
    uiStage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported',
    body: { actorRole: string; actorId?: string; critical?: boolean },
  ) {
    let orderRow = await this.getOrder(tenantId, orderId);

    const gate = guardLabUiStageAdvance(orderRow.state as LabOrderState, uiStage);
    if (!gate.ok) {
      throw new BadRequestException({ code: 'LAB_VERIFY_GATE', message: gate.reason });
    }

    const verifyGated = uiStage === 'Validated' || uiStage === 'Reported';
    let guard = 0;
    const maxSteps = verifyGated ? 1 : 8;

    const uiMap: Record<string, LabOrderState> = {
      'Pending Analysis': 'awaiting_collection',
      'In Analysis': 'in_processing',
      'Awaiting Validation': 'awaiting_review',
      Validated: 'approved',
      Reported: 'published',
    };

    while (guard++ < maxSteps) {
      const action =
        getRequiredLabActionForUiStage(orderRow.state as LabOrderState, uiStage)
        ?? preferredActionForUiStage(orderRow.state as LabOrderState, uiStage);
      if (!action) break;

      const ctx: LabValidationContext = {
        resultsComplete: uiStage !== 'Awaiting Validation' && uiStage !== 'Validated' ? undefined : true,
        criticalValuesPresent: body.critical ? true : undefined,
        criticalAcknowledgedIfRequired: true,
      };

      const payload: Record<string, unknown> = {};
      if (action === 'collect_sample') {
        payload.sampleBarcode = orderRow.sampleBarcode ?? `BC-${orderRow.id.slice(-8)}`;
      }
      if (action === 'enter_results') {
        payload.results = { summary: 'Entered via LIMS UI' };
      }
      if (action === 'verify_results' || action === 'approve_results') {
        ctx.resultsComplete = true;
      }
      if (action === 'flag_critical' || body.critical) {
        await this.transition(tenantId, orderId, {
          action: 'flag_critical',
          actorRole: body.actorRole,
          actorId: body.actorId,
          context: { criticalValuesPresent: true },
        });
        orderRow = await this.getOrder(tenantId, orderId);
        continue;
      }

      const res = await this.transition(tenantId, orderId, {
        action,
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: ctx,
        payload,
        expectedVersion: orderRow.version,
      });
      orderRow = { ...orderRow, ...res.order };

      if (
        orderRow.state === uiMap[uiStage] ||
        (uiStage === 'Reported' && orderRow.state === 'completed')
      ) {
        break;
      }
    }

    return this.getOrder(tenantId, orderId);
  }

  async getLiveLabState(tenantId: string, opdVisitId: string) {
    const orders = await this.listForOpdVisit(tenantId, opdVisitId);
    const blockers = await this.getOpdLabBlockers(
      tenantId,
      opdVisitId,
      'orders_pending',
    );
    const critical = orders.filter((o) => o.isCritical && o.state === 'critical_review');
    const pending = orders.filter((o) => !['completed', 'cancelled'].includes(o.state));

    return {
      orders: orders.map((o) => ({
        id: o.id,
        externalRef: o.externalRef,
        tests: o.tests,
        state: o.state,
        priority: o.priority,
        isCritical: o.isCritical,
      })),
      pendingCount: pending.length,
      criticalCount: critical.length,
      blockers,
    };
  }

  /** Patient portal — lab orders for a patient (reports list). */
  async listForPatient(tenantId: string, patientId: string, take = 50) {
    return this.prisma.labDiagnosticOrder.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Branch-scoped open worklist for lab department screens (Hospital OS). */
  async listBranchWorklist(tenantId: string, branchId: string, take = 100) {
    return this.prisma.labDiagnosticOrder.findMany({
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
