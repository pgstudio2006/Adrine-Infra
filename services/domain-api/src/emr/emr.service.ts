import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';

@Injectable()
export class EmrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBusService,
  ) {}

  async addNote(tenantId: string, body: { encounterId: string; body: string }) {
    const note = await this.prisma.clinicalNote.create({
      data: {
        tenantId,
        encounterId: body.encounterId,
        body: body.body,
      },
    });
    this.events.emit('adrine.emr.note.created', tenantId, {
      noteId: note.id,
      encounterId: body.encounterId,
    });
    return note;
  }

  listForEncounter(tenantId: string, encounterId: string) {
    return this.prisma.clinicalNote.findMany({
      where: { tenantId, encounterId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
