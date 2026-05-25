import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateDialysisTransition,
  HospitalPlatformEvents,
  type DialysisSessionState,
  type DialysisValidationContext,
} from '@adrine/hospital-operations';
import { BillingSyncService } from '../billing/billing-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

const DEFAULT_DIALYSIS_CHARGE_CENTS = 150_000;

@Injectable()
export class DialysisRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly billingSync: BillingSyncService,
  ) {}

  async listMachines(tenantId: string, branchId: string) {
    return this.prisma.dialysisMachine.findMany({
      where: { tenantId, branchId },
      orderBy: { code: 'asc' },
    });
  }

  async upsertMachine(
    tenantId: string,
    branchId: string,
    body: { code: string; model?: string; state?: string },
  ) {
    return this.prisma.dialysisMachine.upsert({
      where: { tenantId_branchId_code: { tenantId, branchId, code: body.code } },
      create: {
        tenantId,
        branchId,
        code: body.code,
        model: body.model ?? '',
        state: body.state ?? 'available',
      },
      update: { model: body.model, state: body.state },
    });
  }

  async createSession(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      ipdAdmissionId?: string;
      machineId?: string;
      scheduledAt?: string;
      packageCode?: string;
      externalRef?: string;
      amountCents?: number;
      actorId?: string;
      actorRole?: string;
      syncBilling?: boolean;
    },
  ) {
    const billingChargeKey = body.externalRef
      ? `dialysis:${body.externalRef}`
      : `dialysis:${Date.now()}`;

    const row = await this.prisma.dialysisSession.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        ipdAdmissionId: body.ipdAdmissionId,
        machineId: body.machineId,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
        packageCode: body.packageCode,
        externalRef: body.externalRef,
        amountCents: body.amountCents ?? DEFAULT_DIALYSIS_CHARGE_CENTS,
        billingChargeKey,
        state: 'scheduled',
      },
      include: { patient: true, machine: true, admission: true },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.dialysis.sessionScheduled,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'dialysis_session',
      resourceId: row.id,
      payload: { packageCode: body.packageCode },
    });

    return row;
  }

  async getSession(tenantId: string, id: string) {
    const row = await this.prisma.dialysisSession.findFirst({
      where: { id, tenantId },
      include: {
        patient: true,
        machine: true,
        admission: true,
        transitions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!row) throw new NotFoundException('Dialysis session not found');
    return row;
  }

  async listBranchWorklist(tenantId: string, branchId: string, take = 100) {
    return this.prisma.dialysisSession.findMany({
      where: {
        tenantId,
        branchId,
        state: { notIn: ['completed', 'cancelled', 'no_show'] },
      },
      include: { patient: true, machine: true },
      orderBy: { scheduledAt: 'asc' },
      take,
    });
  }

  async listForAdmission(tenantId: string, admissionId: string) {
    return this.prisma.dialysisSession.findMany({
      where: { tenantId, ipdAdmissionId: admissionId },
      include: { machine: true },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async transition(
    tenantId: string,
    sessionId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: DialysisValidationContext;
      expectedVersion?: number;
    },
  ) {
    const row = await this.getSession(tenantId, sessionId);
    const fromState = row.state as DialysisSessionState;

    if (body.expectedVersion !== undefined && body.expectedVersion !== row.version) {
      throw new ConflictException('Dialysis session version mismatch; refresh and retry');
    }

    const ctx: DialysisValidationContext = {
      patientIdentified: true,
      machineAssigned: !!row.machineId || !!body.context?.machineAssigned,
      vitalsBaselineRecorded: body.context?.vitalsBaselineRecorded ?? true,
      ipdAdmissionLinkedIfInpatient:
        body.context?.ipdAdmissionLinkedIfInpatient ??
        (!!(row.metadata as Record<string, unknown> | null)?.inpatient
          ? !!row.ipdAdmissionId
          : true),
      sessionNotesComplete: body.context?.sessionNotesComplete ?? true,
      consumablesLogged: body.context?.consumablesLogged ?? true,
      cancelReasonProvided: body.context?.cancelReasonProvided ?? !!body.reason,
      ...body.context,
    };

    const result = evaluateDialysisTransition({
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
    if (result.nextState === 'completed') {
      patch.completedAt = new Date();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.dialysisSession.update({
        where: { id: sessionId },
        data: patch,
        include: { patient: true, machine: true },
      });
      await tx.dialysisSessionTransition.create({
        data: {
          tenantId,
          sessionId,
          action: body.action,
          fromState,
          toState: result.nextState,
          actorId: body.actorId,
          actorRole: body.actorRole,
          reason: body.reason,
        },
      });
      return next;
    });

    if (body.action === 'complete_session' && row.ipdAdmissionId) {
      await this.syncDialysisIpdCharge(tenantId, updated, body.actorId, body.actorRole);
    }

    for (const eventName of result.events) {
      await this.platformEvents.record({
        tenantId,
        branchId: row.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'dialysis_session',
        resourceId: sessionId,
        payload: { action: body.action, fromState, toState: result.nextState },
      });
    }

    return { session: updated, transition: result };
  }

  private async syncDialysisIpdCharge(
    tenantId: string,
    row: {
      id: string;
      ipdAdmissionId: string | null;
      patientId: string;
      branchId: string;
      packageCode: string | null;
      amountCents: number;
      billingChargeKey: string | null;
    },
    actorId?: string,
    actorRole?: string,
  ) {
    if (!row.ipdAdmissionId || !row.billingChargeKey) return;
    await this.billingSync.syncIpdCharge(tenantId, {
      admissionId: row.ipdAdmissionId,
      patientId: row.patientId,
      branchId: row.branchId,
      idempotencyKey: row.billingChargeKey,
      description: `Dialysis — ${row.packageCode ?? 'session'}`,
      amountCents: row.amountCents,
      chargeCode: 'DIALYSIS',
      sourceModule: 'dialysis',
      sourceAction: 'session_billed',
      sourceRefId: row.id,
      actorId,
      actorRole,
    });
  }
}
