import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { EventBusService } from './event-bus.service';

@Injectable()
export class PlatformEventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBusService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  async record(input: {
    tenantId: string;
    branchId?: string;
    eventName: string;
    payload: Record<string, unknown>;
    actorId?: string;
    actorRole?: string;
    resourceType?: string;
    resourceId?: string;
  }) {
    const row = await this.prisma.platformEvent.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        eventName: input.eventName,
        payload: input.payload as object,
        actorId: input.actorId,
        actorRole: input.actorRole,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      },
    });
    this.bus.emit(input.eventName, input.tenantId, {
      ...input.payload,
      platformEventId: row.id,
      branchId: input.branchId,
    });
    if (input.branchId && this.realtime) {
      const p = (input.payload ?? {}) as Record<string, unknown>;
      const opdVisitId = typeof p.opdVisitId === 'string' ? p.opdVisitId : undefined;
      const admissionId = typeof p.admissionId === 'string' ? p.admissionId : undefined;
      const encounterId = typeof p.encounterId === 'string' ? p.encounterId : undefined;
      this.realtime.emit(this.realtime.channelKey(input.tenantId, input.branchId), {
        type: 'platform.event',
        eventName: input.eventName,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        ...(opdVisitId ? { opdVisitId } : {}),
        ...(admissionId ? { admissionId } : {}),
        ...(encounterId ? { encounterId } : {}),
      });
    }
    return row;
  }

  listRecent(tenantId: string, limit = 50) {
    return this.prisma.platformEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
