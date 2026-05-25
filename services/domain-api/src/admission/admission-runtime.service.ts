import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateAdmissionBlockers,
  evaluateIpdTransition,
  HospitalPlatformEvents,
  listAllowedIpdActions,
  type IpdAdmissionState,
  type IpdValidationContext,
} from '@adrine/hospital-operations';
import { BillingSyncService } from '../billing/billing-sync.service';
import { BedRuntimeService } from '../bed/bed-runtime.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

@Injectable()
export class AdmissionRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly billingSync: BillingSyncService,
    private readonly beds: BedRuntimeService,
  ) {}

  async createAdmission(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      opdVisitId?: string;
      encounterId?: string;
      ward?: string;
      attendingDoctor?: string;
      admissionSource?: string;
      primaryDiagnosis?: string;
      insuranceMode?: string;
      externalRef?: string;
      actorRole?: string;
      actorId?: string;
    },
  ) {
    const active = await this.prisma.ipdAdmission.findFirst({
      where: {
        tenantId,
        patientId: body.patientId,
        state: { notIn: ['discharged', 'cancelled'] },
      },
    });
    if (active) {
      throw new ConflictException('Patient already has an active IPD admission');
    }

    const admission = await this.prisma.ipdAdmission.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        opdVisitId: body.opdVisitId,
        encounterId: body.encounterId,
        ward: body.ward,
        attendingDoctor: body.attendingDoctor,
        admissionSource: body.admissionSource,
        primaryDiagnosis: body.primaryDiagnosis,
        insuranceMode: body.insuranceMode ?? 'self',
        externalRef: body.externalRef,
        state: 'admission_requested',
      },
      include: { patient: true },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.ipd.admissionRequested,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'ipd_admission',
      resourceId: admission.id,
      payload: { patientId: body.patientId },
    });

    await this.billingSync.ensureIpdDraft(tenantId, {
      admissionId: admission.id,
      patientId: body.patientId,
      branchId,
      encounterId: body.encounterId,
      insuranceMode: body.insuranceMode,
      actorId: body.actorId,
      actorRole: body.actorRole,
    });

    return admission;
  }

  async getAdmission(tenantId: string, id: string) {
    const admission = await this.prisma.ipdAdmission.findFirst({
      where: { id, tenantId },
      include: {
        patient: true,
        bed: { include: { bedUnit: true } },
        discharge: true,
        insurance: true,
        transitions: { orderBy: { createdAt: 'desc' }, take: 25 },
      },
    });
    if (!admission) throw new NotFoundException('IPD admission not found');
    return admission;
  }

  async getActiveForPatient(tenantId: string, patientId: string) {
    return this.prisma.ipdAdmission.findFirst({
      where: {
        tenantId,
        patientId,
        state: { notIn: ['discharged', 'cancelled'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { patient: true, bed: true },
    });
  }

  /** Branch-wide active IPD census for bed boards and operational dashboards. */
  async listActiveAdmissions(tenantId: string, branchId: string, take = 200) {
    return this.prisma.ipdAdmission.findMany({
      where: {
        tenantId,
        branchId,
        state: { notIn: ['discharged', 'cancelled'] },
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        patient: true,
        bed: { include: { bedUnit: true } },
      },
    });
  }

  async getAdmissionBlockers(tenantId: string, admissionId: string) {
    const admission = await this.getAdmission(tenantId, admissionId);
    let bedState: string | undefined;
    if (admission.bedId) {
      const bed = await this.beds.getBed(tenantId, admission.bedId);
      bedState = bed.state;
    }
    return evaluateAdmissionBlockers({
      admissionState: admission.state as IpdAdmissionState,
      bedAssigned: !!admission.bedId,
      bedState,
      depositPaid: admission.depositPaid,
      insuranceMode: admission.insuranceMode as 'self' | 'corporate' | 'tpa',
      insurancePreauthApproved:
        admission.insurance?.state === 'approved' ||
        admission.insurance?.state === 'partially_approved',
    });
  }

  async assignBed(
    tenantId: string,
    admissionId: string,
    body: { bedId: string; actorRole: string; actorId?: string },
  ) {
    const admission = await this.getAdmission(tenantId, admissionId);
    await this.beds.assertAvailable(tenantId, body.bedId);

    if (admission.bedId && admission.bedId !== body.bedId) {
      await this.beds.releaseForAdmission(
        tenantId,
        admission.bedId,
        body.actorRole,
        body.actorId,
      );
    }

    await this.beds.reserveForAdmission(
      tenantId,
      body.bedId,
      admissionId,
      body.actorRole,
      body.actorId,
    );

    return this.prisma.ipdAdmission.update({
      where: { id: admissionId },
      data: { bedId: body.bedId, version: { increment: 1 } },
      include: { bed: true, patient: true },
    });
  }

  async transition(
    tenantId: string,
    admissionId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: IpdValidationContext;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    const admission = await this.getAdmission(tenantId, admissionId);
    const fromState = admission.state as IpdAdmissionState;

    if (
      body.expectedVersion !== undefined &&
      body.expectedVersion !== admission.version
    ) {
      throw new ConflictException('Admission version mismatch; refresh and retry');
    }

    const ctx: IpdValidationContext = {
      ...body.context,
      patientIdentified: body.context?.patientIdentified ?? true,
      bedAssigned: body.context?.bedAssigned ?? !!admission.bedId,
    };

    if (body.action === 'confirm_admission' && admission.bedId) {
      await this.beds.occupyForAdmission(
        tenantId,
        admission.bedId,
        admissionId,
        body.actorRole,
        body.actorId,
      );
      ctx.bedAssigned = true;
    }

    const result = evaluateIpdTransition({
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
      previousState: fromState,
      version: { increment: 1 },
    };

    if (result.nextState === 'admitted' || result.nextState === 'active_care') {
      patch.admittedAt = admission.admittedAt ?? new Date();
    }
    if (result.nextState === 'discharged') {
      patch.dischargedAt = new Date();
      if (admission.bedId) {
        await this.beds.releaseForAdmission(
          tenantId,
          admission.bedId,
          body.actorRole,
          body.actorId,
        );
      }
    }
    if (body.action === 'cancel_admission' && admission.bedId) {
      await this.beds.releaseForAdmission(
        tenantId,
        admission.bedId,
        body.actorRole,
        body.actorId,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.ipdAdmission.update({
        where: { id: admissionId },
        data: patch,
        include: { patient: true, bed: true },
      });
      await tx.ipdAdmissionTransition.create({
        data: {
          tenantId,
          admissionId,
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
        branchId: admission.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'ipd_admission',
        resourceId: admissionId,
        payload: {
          action: body.action,
          fromState,
          toState: result.nextState,
          metering: result.metering,
        },
      });
    }

    if (body.action === 'confirm_admission') {
      await this.billingSync.syncIpdCharge(tenantId, {
        admissionId,
        patientId: admission.patientId,
        branchId: admission.branchId,
        idempotencyKey: `ipd:admission:${admissionId}`,
        description: 'IPD admission charge',
        amountCents: 0,
        chargeCode: 'IPD_ADMISSION',
        sourceModule: 'ipd',
        sourceAction: 'admission_confirmed',
        actorId: body.actorId,
        actorRole: body.actorRole,
      });
    }

    return { admission: updated, transition: result };
  }

  async listAllowedActions(tenantId: string, admissionId: string, actorRole: string) {
    const admission = await this.getAdmission(tenantId, admissionId);
    return {
      state: admission.state,
      allowed: listAllowedIpdActions(admission.state as IpdAdmissionState, actorRole),
    };
  }
}
