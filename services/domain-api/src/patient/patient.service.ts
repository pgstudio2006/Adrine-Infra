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
    // Server-authoritative MRN — ignore client preview UHIDs to prevent collisions.
    const mrn = await this.allocateMrn(tenantId);

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

  /** Server-authoritative UHID sequence — scans all tenant MRNs and retries on collision. */
  private async allocateMrn(tenantId: string): Promise<string> {
    const floor = 240_008;
    const rows = await this.prisma.patient.findMany({
      where: { tenantId, mrn: { startsWith: 'UHID-' } },
      select: { mrn: true },
    });
    let max = floor;
    for (const row of rows) {
      const match = /^UHID-(\d+)$/.exec(row.mrn ?? '');
      if (match) max = Math.max(max, Number.parseInt(match[1], 10));
    }
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = `UHID-${max + 1 + attempt}`;
      const duplicate = await this.prisma.patient.findFirst({
        where: { tenantId, mrn: candidate },
        select: { id: true },
      });
      if (!duplicate) return candidate;
    }
    throw new Error('Could not allocate a unique MRN for tenant');
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
