import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateInsuranceTransition,
  HospitalPlatformEvents,
  type InsuranceAuthorizationState,
  type InsuranceValidationContext,
} from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

@Injectable()
export class InsuranceRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  async startForAdmission(
    tenantId: string,
    branchId: string,
    body: {
      admissionId: string;
      patientId: string;
      payerName?: string;
      policyNumber?: string;
      actorRole?: string;
      actorId?: string;
    },
  ) {
    const existing = await this.prisma.insuranceAuthorization.findUnique({
      where: { admissionId: body.admissionId },
    });
    if (existing) return existing;

    const auth = await this.prisma.insuranceAuthorization.create({
      data: {
        tenantId,
        branchId,
        admissionId: body.admissionId,
        patientId: body.patientId,
        payerName: body.payerName,
        policyNumber: body.policyNumber,
        state: 'initiated',
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.insurance.authorizationInitiated,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'insurance_authorization',
      resourceId: auth.id,
      payload: { admissionId: body.admissionId },
    });

    return auth;
  }

  async getAuthorization(tenantId: string, id: string) {
    const row = await this.prisma.insuranceAuthorization.findFirst({
      where: { id, tenantId },
      include: { transitions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!row) throw new NotFoundException('Insurance authorization not found');
    return row;
  }

  async getByAdmission(tenantId: string, admissionId: string) {
    return this.prisma.insuranceAuthorization.findFirst({
      where: { tenantId, admissionId },
      include: { patient: { select: { fullName: true, mrn: true } } },
    });
  }

  async listForBranch(tenantId: string, branchId: string) {
    return this.prisma.insuranceAuthorization.findMany({
      where: { tenantId, branchId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        patient: { select: { fullName: true, mrn: true } },
        admission: { select: { id: true, ward: true, state: true } },
      },
    });
  }

  async transition(
    tenantId: string,
    insuranceId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: InsuranceValidationContext;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    const auth = await this.getAuthorization(tenantId, insuranceId);
    const fromState = auth.state as InsuranceAuthorizationState;

    if (body.expectedVersion !== undefined && body.expectedVersion !== auth.version) {
      throw new ConflictException('Insurance authorization version mismatch');
    }

    const result = evaluateInsuranceTransition({
      state: fromState,
      action: body.action,
      actorRole: body.actorRole,
      validationContext: body.context ?? {},
    });

    if (!result.ok) {
      throw new BadRequestException({ code: result.code, message: result.reason });
    }

    const patch: Record<string, unknown> = {
      state: result.nextState,
      version: { increment: 1 },
    };

    if (body.payload?.approvedCents !== undefined) {
      patch.approvedCents = body.payload.approvedCents;
    }
    if (body.payload?.settledCents !== undefined) {
      patch.settledCents = body.payload.settledCents;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.insuranceAuthorization.update({
        where: { id: insuranceId },
        data: patch,
      });
      await tx.insuranceTransition.create({
        data: {
          tenantId,
          insuranceId,
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
        branchId: auth.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'insurance_authorization',
        resourceId: insuranceId,
        payload: { admissionId: auth.admissionId },
      });
    }

    return { authorization: updated, transition: result };
  }
}
