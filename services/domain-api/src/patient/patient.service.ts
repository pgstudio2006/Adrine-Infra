import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';

@Injectable()
export class PatientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBusService,
  ) {}

  async create(
    tenantId: string,
    body: { fullName: string; mrn?: string; dob?: string },
  ) {
    let mrn = body.mrn?.trim() || undefined;
    if (mrn) {
      const duplicate = await this.prisma.patient.findFirst({
        where: { tenantId, mrn },
        select: { id: true },
      });
      if (duplicate) mrn = undefined;
    }
    if (!mrn) {
      mrn = await this.allocateMrn(tenantId);
    }

    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        fullName: body.fullName,
        mrn,
        dob: body.dob ? new Date(body.dob) : undefined,
      },
    });
    this.events.emit('adrine.patient.profile.created', tenantId, { patientId: patient.id });
    return patient;
  }

  /** Server-authoritative UHID sequence — avoids client reload collisions. */
  private async allocateMrn(tenantId: string): Promise<string> {
    const floor = 240_008;
    const recent = await this.prisma.patient.findMany({
      where: { tenantId, mrn: { startsWith: 'UHID-' } },
      select: { mrn: true },
      orderBy: { createdAt: 'desc' },
      take: 250,
    });
    let max = floor;
    for (const row of recent) {
      const match = /^UHID-(\d+)$/.exec(row.mrn ?? '');
      if (match) max = Math.max(max, Number.parseInt(match[1], 10));
    }
    const total = await this.prisma.patient.count({ where: { tenantId } });
    max = Math.max(max, floor + total);
    return `UHID-${max + 1}`;
  }

  list(tenantId: string) {
    return this.prisma.patient.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  search(tenantId: string, query: string) {
    const q = query.trim();
    if (!q) {
      return this.list(tenantId);
    }
    return this.prisma.patient.findMany({
      where: {
        tenantId,
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { mrn: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async get(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }
}
