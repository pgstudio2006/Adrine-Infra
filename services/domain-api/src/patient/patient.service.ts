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
    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        fullName: body.fullName,
        mrn: body.mrn,
        dob: body.dob ? new Date(body.dob) : undefined,
      },
    });
    this.events.emit('adrine.patient.profile.created', tenantId, { patientId: patient.id });
    return patient;
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
