import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BED_OCCUPIED_STATES,
  evaluateBedTransition,
  type BedOccupancyState,
  type BedValidationContext,
} from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

@Injectable()
export class BedRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  async ensureUnit(tenantId: string, branchId: string, name: string, wardType = 'general') {
    const existing = await this.prisma.bedUnit.findFirst({
      where: { tenantId, branchId, name },
    });
    if (existing) return existing;
    return this.prisma.bedUnit.create({
      data: { tenantId, branchId, name, wardType },
    });
  }

  async createBed(
    tenantId: string,
    branchId: string,
    body: { bedUnitId: string; label: string },
  ) {
    return this.prisma.bed.create({
      data: {
        tenantId,
        branchId,
        bedUnitId: body.bedUnitId,
        label: body.label,
        state: 'available',
      },
    });
  }

  async listBeds(tenantId: string, branchId: string, take = 500) {
    return this.prisma.bed.findMany({
      where: { tenantId, branchId },
      include: { bedUnit: true },
      orderBy: [{ bedUnit: { name: 'asc' } }, { label: 'asc' }],
      take,
    });
  }

  async getBed(tenantId: string, id: string) {
    const bed = await this.prisma.bed.findFirst({
      where: { id, tenantId },
      include: {
        bedUnit: true,
        transitions: { orderBy: { createdAt: 'desc' }, take: 15 },
      },
    });
    if (!bed) throw new NotFoundException('Bed not found');
    return bed;
  }

  async assertAvailable(tenantId: string, bedId: string) {
    const bed = await this.getBed(tenantId, bedId);
    if (BED_OCCUPIED_STATES.includes(bed.state as BedOccupancyState) || bed.state === 'blocked') {
      throw new ConflictException(`Bed ${bed.label} is not available (state: ${bed.state})`);
    }
    return bed;
  }

  async transition(
    tenantId: string,
    bedId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: BedValidationContext;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
      admissionId?: string;
    },
  ) {
    const bed = await this.getBed(tenantId, bedId);
    const fromState = bed.state as BedOccupancyState;

    if (body.expectedVersion !== undefined && body.expectedVersion !== bed.version) {
      throw new ConflictException('Bed version mismatch; refresh and retry');
    }

    const ctx: BedValidationContext = {
      ...body.context,
      bedNotDoubleBooked:
        body.context?.bedNotDoubleBooked ??
        (!BED_OCCUPIED_STATES.includes(fromState) || body.action === 'release_bed'),
      admissionLinked: body.context?.admissionLinked ?? !!body.admissionId,
    };

    const result = evaluateBedTransition({
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

    if (body.action === 'reserve_bed' || body.action === 'occupy_bed') {
      patch.currentAdmissionId = body.admissionId ?? body.payload?.admissionId;
    }
    if (body.action === 'release_bed' || body.action === 'cancel_reservation') {
      patch.currentAdmissionId = null;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.bed.update({ where: { id: bedId }, data: patch });
      await tx.bedTransition.create({
        data: {
          tenantId,
          bedId,
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
        branchId: bed.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'bed',
        resourceId: bedId,
        payload: { action: body.action, fromState, toState: result.nextState },
      });
    }

    return { bed: updated, transition: result };
  }

  async reserveForAdmission(
    tenantId: string,
    bedId: string,
    admissionId: string,
    actorRole: string,
    actorId?: string,
  ) {
    return this.transition(tenantId, bedId, {
      action: 'reserve_bed',
      actorRole,
      actorId,
      admissionId,
      context: { admissionLinked: true, bedNotDoubleBooked: true },
    });
  }

  async occupyForAdmission(
    tenantId: string,
    bedId: string,
    admissionId: string,
    actorRole: string,
    actorId?: string,
  ) {
    const bed = await this.getBed(tenantId, bedId);
    if (bed.state === 'reserved') {
      return this.transition(tenantId, bedId, {
        action: 'occupy_bed',
        actorRole,
        actorId,
        admissionId,
        expectedVersion: bed.version,
        context: { admissionConfirmed: true, patientIdentified: true },
      });
    }
    if (bed.state === 'available') {
      await this.reserveForAdmission(tenantId, bedId, admissionId, actorRole, actorId);
      const refreshed = await this.getBed(tenantId, bedId);
      return this.transition(tenantId, bedId, {
        action: 'occupy_bed',
        actorRole,
        actorId,
        admissionId,
        expectedVersion: refreshed.version,
        context: { admissionConfirmed: true, patientIdentified: true },
      });
    }
    throw new ConflictException(`Cannot occupy bed in state ${bed.state}`);
  }

  async releaseForAdmission(
    tenantId: string,
    bedId: string,
    actorRole: string,
    actorId?: string,
  ) {
    const bed = await this.getBed(tenantId, bedId);
    if (bed.state !== 'occupied' && bed.state !== 'reserved') return bed;
    return this.transition(tenantId, bedId, {
      action: bed.state === 'occupied' ? 'release_bed' : 'cancel_reservation',
      actorRole,
      actorId,
      expectedVersion: bed.version,
      context: { admissionDischargedOrTransferred: true },
    });
  }
}
