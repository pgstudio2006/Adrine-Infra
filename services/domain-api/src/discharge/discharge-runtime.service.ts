import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  canMarkReadyForDischarge,
  evaluateDischargeBlockers,
  evaluateDischargeTransition,
  HospitalPlatformEvents,
  type DischargeOrchestrationState,
  type DischargeValidationContext,
} from '@adrine/hospital-operations';
import { BillingSyncService } from '../billing/billing-sync.service';
import { NursingRuntimeService } from '../nursing/nursing-runtime.service';
import { AdmissionRuntimeService } from '../admission/admission-runtime.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

@Injectable()
export class DischargeRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly billingSync: BillingSyncService,
    private readonly nursing: NursingRuntimeService,
    @Inject(forwardRef(() => AdmissionRuntimeService))
    private readonly admissions: AdmissionRuntimeService,
  ) {}

  async startForAdmission(
    tenantId: string,
    branchId: string,
    body: {
      admissionId: string;
      patientId: string;
      actorRole: string;
      actorId?: string;
    },
  ) {
    const existing = await this.prisma.dischargeOrchestration.findUnique({
      where: { admissionId: body.admissionId },
    });
    if (existing) return existing;

    const discharge = await this.prisma.dischargeOrchestration.create({
      data: {
        tenantId,
        branchId,
        admissionId: body.admissionId,
        patientId: body.patientId,
        state: 'initiated',
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.discharge.initiated,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'discharge_orchestration',
      resourceId: discharge.id,
      payload: { admissionId: body.admissionId },
    });

    return discharge;
  }

  async getDischarge(tenantId: string, id: string) {
    const row = await this.prisma.dischargeOrchestration.findFirst({
      where: { id, tenantId },
      include: {
        admission: { include: { insurance: true, bed: true } },
        transitions: { orderBy: { createdAt: 'desc' }, take: 25 },
      },
    });
    if (!row) throw new NotFoundException('Discharge orchestration not found');
    return row;
  }

  async getByAdmission(tenantId: string, admissionId: string) {
    return this.prisma.dischargeOrchestration.findFirst({
      where: { tenantId, admissionId },
      include: { transitions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
  }

  async getBlockers(tenantId: string, dischargeId: string) {
    const discharge = await this.getDischarge(tenantId, dischargeId);
    const admission = discharge.admission;

    const nursingTasks = await this.nursing.listForAdmission(tenantId, discharge.admissionId);
    const financial = await this.billingSync.getLiveIpdFinancialState(
      tenantId,
      discharge.admissionId,
    );

    const [labOrders, pharmacyFulfillments] = await Promise.all([
      this.prisma.labDiagnosticOrder.findMany({
        where: { tenantId, patientId: discharge.patientId },
        select: { state: true, isCritical: true },
        take: 50,
      }),
      this.prisma.pharmacyFulfillment.findMany({
        where: { tenantId, patientId: discharge.patientId },
        select: { state: true, isControlled: true },
        take: 50,
      }),
    ]);

    return evaluateDischargeBlockers({
      dischargeState: discharge.state as DischargeOrchestrationState,
      admissionState: admission.state as never,
      labOrders: labOrders.map((o) => ({
        state: o.state as never,
        isCritical: o.isCritical,
      })),
      pharmacyFulfillments: pharmacyFulfillments.map((f) => ({
        state: f.state as never,
        isControlled: f.isControlled,
      })),
      nursingTasks: nursingTasks.map((t) => ({ state: t.state as never })),
      insuranceState: admission.insurance?.state as never,
      insuranceMode: admission.insuranceMode as 'self' | 'corporate' | 'tpa',
      billingOutstandingCents: financial.invoice?.outstandingCents,
      billingBlockers: financial.blockers,
      clinicalClearanceGranted: !!discharge.clinicalClearedAt,
      pharmacyClearanceGranted: !!discharge.pharmacyClearedAt,
      nursingClearanceGranted: !!discharge.nursingClearedAt,
      insuranceClearanceGranted: !!discharge.insuranceClearedAt,
    });
  }

  async transition(
    tenantId: string,
    dischargeId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: DischargeValidationContext;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    const discharge = await this.getDischarge(tenantId, dischargeId);
    const fromState = discharge.state as DischargeOrchestrationState;

    if (
      body.expectedVersion !== undefined &&
      body.expectedVersion !== discharge.version
    ) {
      throw new ConflictException('Discharge version mismatch');
    }

    const blockers = await this.getBlockers(tenantId, dischargeId);
    const ctx: DischargeValidationContext = {
      ...body.context,
      noDischargeBlockers:
        body.context?.noDischargeBlockers ??
        (body.action !== 'grant_insurance_clearance' || canMarkReadyForDischarge(blockers)),
    };

    if (body.action === 'grant_insurance_clearance' && !canMarkReadyForDischarge(blockers)) {
      throw new BadRequestException({
        code: 'DISCHARGE_BLOCKERS',
        message: 'Cross-runtime blockers prevent ready_for_discharge',
        blockers,
      });
    }

    const result = evaluateDischargeTransition({
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

    if (body.action === 'grant_clinical_clearance') patch.clinicalClearedAt = new Date();
    if (body.action === 'grant_billing_clearance') patch.billingClearedAt = new Date();
    if (body.action === 'grant_pharmacy_clearance') patch.pharmacyClearedAt = new Date();
    if (body.action === 'grant_nursing_clearance') patch.nursingClearedAt = new Date();
    if (body.action === 'grant_insurance_clearance') {
      patch.insuranceClearedAt = new Date();
      patch.readyAt = new Date();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.dischargeOrchestration.update({
        where: { id: dischargeId },
        data: patch,
      });
      await tx.dischargeTransition.create({
        data: {
          tenantId,
          dischargeId,
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

    if (result.nextState === 'ready_for_discharge') {
      await this.admissions.transition(tenantId, discharge.admissionId, {
        action: 'initiate_discharge',
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: { dischargeOrchestrationStarted: true },
      });
    }

    if (result.nextState === 'discharged') {
      await this.admissions.transition(tenantId, discharge.admissionId, {
        action: 'complete_discharge',
        actorRole: body.actorRole,
        actorId: body.actorId,
        context: {
          dischargeClearancesComplete: true,
          finalBillSettled: body.context?.finalBillSettled ?? true,
        },
      });
    }

    for (const eventName of result.events) {
      await this.platformEvents.record({
        tenantId,
        branchId: discharge.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'discharge_orchestration',
        resourceId: dischargeId,
        payload: {
          action: body.action,
          blockers: blockers.length,
          admissionId: discharge.admissionId,
        },
      });
    }

    return { discharge: updated, transition: result, blockers };
  }
}
