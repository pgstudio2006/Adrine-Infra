import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBusService,
  ) {}

  async book(
    tenantId: string,
    body: {
      patientId: string;
      startAt: string;
      endAt: string;
      resourceLabel: string;
      status?: string;
    },
  ) {
    const appt = await this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: body.patientId,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        resourceLabel: body.resourceLabel,
        status: body.status ?? 'scheduled',
      },
    });
    this.events.emit('adrine.appointment.booked', tenantId, { appointmentId: appt.id });
    return appt;
  }

  listForPatient(tenantId: string, patientId: string) {
    return this.prisma.appointment.findMany({
      where: { tenantId, patientId },
      include: { patient: true },
      orderBy: { startAt: 'asc' },
    });
  }

  /** Branch-agnostic tenant schedule window (reception appointment board hydration). */
  listInRange(tenantId: string, from: string, to: string) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        startAt: { gte: new Date(from), lte: new Date(to) },
      },
      include: { patient: true },
      orderBy: { startAt: 'asc' },
    });
  }

  listResources(tenantId: string, branchId: string) {
    return this.prisma.schedulingResource.findMany({
      where: { tenantId, branchId, isActive: true },
      orderBy: { label: 'asc' },
    });
  }

  async upsertResource(
    tenantId: string,
    branchId: string,
    body: {
      code: string;
      label: string;
      resourceType?: string;
      department?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.prisma.schedulingResource.upsert({
      where: { tenantId_branchId_code: { tenantId, branchId, code: body.code } },
      create: {
        tenantId,
        branchId,
        code: body.code,
        label: body.label,
        resourceType: body.resourceType ?? 'doctor',
        department: body.department,
        metadata: body.metadata as object | undefined,
      },
      update: {
        label: body.label,
        resourceType: body.resourceType,
        department: body.department,
        metadata: body.metadata as object | undefined,
        isActive: true,
      },
    });
  }

  listWaitlist(tenantId: string, branchId: string, status?: string) {
    return this.prisma.schedulingWaitlistEntry.findMany({
      where: {
        tenantId,
        branchId,
        ...(status ? { status } : {}),
      },
      include: { patient: true, appointment: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async enqueueWaitlist(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      resourceLabel: string;
      preferredStart?: string;
      priority?: string;
      notes?: string;
    },
  ) {
    const entry = await this.prisma.schedulingWaitlistEntry.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        resourceLabel: body.resourceLabel,
        preferredStart: body.preferredStart ? new Date(body.preferredStart) : undefined,
        priority: body.priority ?? 'routine',
        notes: body.notes,
      },
      include: { patient: true },
    });
    this.events.emit('adrine.scheduling.waitlist.enqueued', tenantId, { waitlistId: entry.id });
    return entry;
  }

  async promoteWaitlist(
    tenantId: string,
    id: string,
    body: { appointmentId: string; status?: string },
  ) {
    const entry = await this.prisma.schedulingWaitlistEntry.findFirst({
      where: { id, tenantId },
    });
    if (!entry) {
      throw new NotFoundException('Waitlist entry not found');
    }
    return this.prisma.schedulingWaitlistEntry.update({
      where: { id },
      data: {
        appointmentId: body.appointmentId,
        status: body.status ?? 'booked',
      },
      include: { patient: true, appointment: true },
    });
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });
    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: { patient: true },
    });
    if (status === 'cancelled') {
      this.events.emit('adrine.appointment.cancelled', tenantId, { appointmentId: id });
    } else if (status === 'completed') {
      this.events.emit('adrine.appointment.completed', tenantId, { appointmentId: id });
    } else if (status === 'no_show') {
      this.events.emit('adrine.appointment.noShow', tenantId, { appointmentId: id });
    }
    return updated;
  }
}
