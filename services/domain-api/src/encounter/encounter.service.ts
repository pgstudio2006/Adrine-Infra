import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';

@Injectable()
export class EncounterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBusService,
  ) {}

  async create(
    tenantId: string,
    body: { patientId: string; type: string; status?: string },
  ) {
    const encounter = await this.prisma.encounter.create({
      data: {
        tenantId,
        patientId: body.patientId,
        type: body.type,
        status: body.status ?? 'open',
      },
    });
    this.events.emit('adrine.encounter.created', tenantId, {
      encounterId: encounter.id,
      patientId: body.patientId,
      type: body.type,
    });
    return encounter;
  }

  listForPatient(tenantId: string, patientId: string) {
    return this.prisma.encounter.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(tenantId: string, id: string) {
    const encounter = await this.prisma.encounter.findFirst({
      where: { id, tenantId },
      include: { notes: true },
    });
    if (!encounter) {
      throw new NotFoundException('Encounter not found');
    }
    return encounter;
  }

  async close(tenantId: string, id: string) {
    const encounter = await this.get(tenantId, id);
    if (encounter.status === 'closed') {
      return encounter;
    }
    const updated = await this.prisma.encounter.update({
      where: { id },
      data: { status: 'closed' },
    });
    this.events.emit('adrine.encounter.closed', tenantId, {
      encounterId: updated.id,
      patientId: updated.patientId,
    });
    return updated;
  }
}
