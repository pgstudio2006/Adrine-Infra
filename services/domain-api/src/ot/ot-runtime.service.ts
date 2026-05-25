import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateOtTransition,
  HospitalPlatformEvents,
  type OtCaseState,
  type OtValidationContext,
} from '@adrine/hospital-operations';
import { BillingSyncService } from '../billing/billing-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

const DEFAULT_OT_CHARGE_CENTS = 500_000;

@Injectable()
export class OtRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly billingSync: BillingSyncService,
  ) {}

  async listRooms(tenantId: string, branchId: string) {
    return this.prisma.otRoom.findMany({
      where: { tenantId, branchId },
      orderBy: { code: 'asc' },
    });
  }

  async upsertRoom(
    tenantId: string,
    branchId: string,
    body: { code: string; label: string; state?: string },
  ) {
    return this.prisma.otRoom.upsert({
      where: { tenantId_branchId_code: { tenantId, branchId, code: body.code } },
      create: {
        tenantId,
        branchId,
        code: body.code,
        label: body.label,
        state: body.state ?? 'available',
      },
      update: { label: body.label, state: body.state },
    });
  }

  async createCase(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      ipdAdmissionId?: string;
      otRoomId?: string;
      procedureName: string;
      surgeonName?: string;
      priority?: string;
      scheduledAt?: string;
      externalRef?: string;
      amountCents?: number;
      actorId?: string;
      actorRole?: string;
      syncBilling?: boolean;
    },
  ) {
    const billingChargeKey = body.externalRef
      ? `ot:${body.externalRef}`
      : `ot:${Date.now()}:${body.procedureName.slice(0, 24)}`;

    const row = await this.prisma.otCase.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        ipdAdmissionId: body.ipdAdmissionId,
        otRoomId: body.otRoomId,
        procedureName: body.procedureName,
        surgeonName: body.surgeonName,
        priority: body.priority ?? 'elective',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
        externalRef: body.externalRef,
        amountCents: body.amountCents ?? DEFAULT_OT_CHARGE_CENTS,
        billingChargeKey,
        state: 'scheduled',
      },
      include: { patient: true, otRoom: true, admission: true },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.ot.caseScheduled,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'ot_case',
      resourceId: row.id,
      payload: { procedureName: body.procedureName },
    });

    if (body.syncBilling !== false && body.ipdAdmissionId) {
      await this.syncOtIpdCharge(tenantId, row, body.actorId, body.actorRole);
    }

    return row;
  }

  async getCase(tenantId: string, id: string) {
    const row = await this.prisma.otCase.findFirst({
      where: { id, tenantId },
      include: {
        patient: true,
        otRoom: true,
        admission: true,
        transitions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!row) throw new NotFoundException('OT case not found');
    return row;
  }

  async listBranchWorklist(tenantId: string, branchId: string, take = 100) {
    return this.prisma.otCase.findMany({
      where: {
        tenantId,
        branchId,
        state: { notIn: ['completed', 'cancelled'] },
      },
      include: { patient: true, otRoom: true },
      orderBy: { scheduledAt: 'asc' },
      take,
    });
  }

  async listForAdmission(tenantId: string, admissionId: string) {
    return this.prisma.otCase.findMany({
      where: { tenantId, ipdAdmissionId: admissionId },
      include: { otRoom: true },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async transition(
    tenantId: string,
    caseId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: OtValidationContext;
      expectedVersion?: number;
    },
  ) {
    const row = await this.getCase(tenantId, caseId);
    const fromState = row.state as OtCaseState;

    if (body.expectedVersion !== undefined && body.expectedVersion !== row.version) {
      throw new ConflictException('OT case version mismatch; refresh and retry');
    }

    const ctx: OtValidationContext = {
      patientIdentified: true,
      procedureDocumented: true,
      otRoomAssigned: !!row.otRoomId || !!body.context?.otRoomAssigned,
      preopChecklistComplete: body.context?.preopChecklistComplete ?? true,
      consentOnFile: body.context?.consentOnFile ?? true,
      teamAssigned: body.context?.teamAssigned ?? true,
      ipdAdmissionLinkedIfRequired:
        body.context?.ipdAdmissionLinkedIfRequired ??
        (!row.metadata ||
          !(row.metadata as Record<string, unknown>).requiresIpd ||
          !!row.ipdAdmissionId),
      intraopDocumented: body.context?.intraopDocumented ?? true,
      postopHandoverComplete: body.context?.postopHandoverComplete ?? true,
      cancelReasonProvided: body.context?.cancelReasonProvided ?? !!body.reason,
      ...body.context,
    };

    const result = evaluateOtTransition({
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
      const next = await tx.otCase.update({
        where: { id: caseId },
        data: patch,
        include: { patient: true, otRoom: true },
      });
      await tx.otCaseTransition.create({
        data: {
          tenantId,
          otCaseId: caseId,
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

    if (body.action === 'complete_case' && row.ipdAdmissionId) {
      await this.syncOtIpdCharge(tenantId, updated, body.actorId, body.actorRole);
    }

    for (const eventName of result.events) {
      await this.platformEvents.record({
        tenantId,
        branchId: row.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'ot_case',
        resourceId: caseId,
        payload: { action: body.action, fromState, toState: result.nextState },
      });
    }

    return { case: updated, transition: result };
  }

  private async syncOtIpdCharge(
    tenantId: string,
    row: { id: string; ipdAdmissionId: string | null; patientId: string; branchId: string; procedureName: string; amountCents: number; billingChargeKey: string | null },
    actorId?: string,
    actorRole?: string,
  ) {
    if (!row.ipdAdmissionId || !row.billingChargeKey) return;
    await this.billingSync.syncIpdCharge(tenantId, {
      admissionId: row.ipdAdmissionId,
      patientId: row.patientId,
      branchId: row.branchId,
      idempotencyKey: row.billingChargeKey,
      description: `OT — ${row.procedureName}`,
      amountCents: row.amountCents,
      chargeCode: 'OT',
      sourceModule: 'ot',
      sourceAction: 'case_billed',
      sourceRefId: row.id,
      actorId,
      actorRole,
    });
  }
}
