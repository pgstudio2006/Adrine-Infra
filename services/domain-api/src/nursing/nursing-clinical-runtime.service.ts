import { Injectable, NotFoundException } from '@nestjs/common';
import { HospitalPlatformEvents } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

@Injectable()
export class NursingClinicalRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  async recordVitals(
    tenantId: string,
    branchId: string,
    body: {
      admissionId: string;
      patientId: string;
      nurse: string;
      shift?: string;
      bp: string;
      pulse: number;
      temp: number;
      spo2: number;
      painScore: number;
      notes?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const admission = await this.prisma.ipdAdmission.findFirst({
      where: { id: body.admissionId, tenantId, patientId: body.patientId },
    });
    if (!admission) throw new NotFoundException('Admission not found for vitals');

    const round = await this.prisma.nursingVitalRound.create({
      data: {
        tenantId,
        branchId,
        admissionId: body.admissionId,
        patientId: body.patientId,
        nurse: body.nurse,
        shift: body.shift ?? 'Morning',
        bp: body.bp,
        pulse: body.pulse,
        temp: body.temp,
        spo2: body.spo2,
        painScore: body.painScore,
        notes: body.notes,
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.clinical.vitalsRecorded,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'nursing_vital_round',
      resourceId: round.id,
      payload: { admissionId: body.admissionId, painScore: body.painScore },
    });

    return round;
  }

  async listVitalsForAdmission(tenantId: string, admissionId: string, take = 100) {
    return this.prisma.nursingVitalRound.findMany({
      where: { tenantId, admissionId },
      orderBy: { recordedAt: 'desc' },
      take,
    });
  }

  async createNote(
    tenantId: string,
    branchId: string,
    body: {
      admissionId: string;
      patientId: string;
      nurse: string;
      noteType: string;
      body: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const admission = await this.prisma.ipdAdmission.findFirst({
      where: { id: body.admissionId, tenantId, patientId: body.patientId },
    });
    if (!admission) throw new NotFoundException('Admission not found for nursing note');

    const note = await this.prisma.nursingNote.create({
      data: {
        tenantId,
        branchId,
        admissionId: body.admissionId,
        patientId: body.patientId,
        nurse: body.nurse,
        noteType: body.noteType,
        body: body.body,
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.clinical.noteSigned,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'nursing_note',
      resourceId: note.id,
      payload: { admissionId: body.admissionId, noteType: body.noteType },
    });

    return note;
  }

  async listNotesForAdmission(tenantId: string, admissionId: string, take = 100) {
    return this.prisma.nursingNote.findMany({
      where: { tenantId, admissionId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async buildNurseReport(tenantId: string, admissionId: string) {
    const admission = await this.prisma.ipdAdmission.findFirst({
      where: { id: admissionId, tenantId },
      include: { patient: { select: { id: true, mrn: true, fullName: true } } },
    });
    if (!admission) throw new NotFoundException('Admission not found');

    const [vitals, notes, marRows, tasks] = await Promise.all([
      this.listVitalsForAdmission(tenantId, admissionId, 50),
      this.listNotesForAdmission(tenantId, admissionId, 50),
      this.prisma.medicationSchedule.findMany({
        where: { tenantId, admissionId },
        include: { transitions: { orderBy: { createdAt: 'desc' }, take: 5 } },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.nursingTask.findMany({
        where: { tenantId, admissionId },
        include: { transitions: { orderBy: { createdAt: 'desc' }, take: 3 } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const auditTrail = [
      ...vitals.map((v) => ({
        at: v.recordedAt,
        nurse: v.nurse,
        action: 'Recorded vitals',
        detail: `BP ${v.bp}, SpO2 ${v.spo2}%`,
      })),
      ...notes.map((n) => ({
        at: n.createdAt,
        nurse: n.nurse,
        action: `Nursing note (${n.noteType})`,
        detail: n.body.slice(0, 120),
      })),
      ...marRows.flatMap((m) =>
        m.transitions.map((t) => ({
          at: t.createdAt,
          nurse: t.actorRole ?? 'nurse',
          action: `MAR ${t.action}`,
          detail: `${m.drug} → ${t.toState}${t.reason ? `: ${t.reason}` : ''}`,
        })),
      ),
      ...tasks.flatMap((t) =>
        t.transitions.map((tr) => ({
          at: tr.createdAt,
          nurse: tr.actorRole ?? 'nurse',
          action: `Task ${tr.action}`,
          detail: t.description,
        })),
      ),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    return {
      admission: {
        id: admission.id,
        patientId: admission.patientId,
        uhid: admission.patient.mrn,
        patientName: admission.patient.fullName,
        ward: admission.ward,
      },
      vitals,
      notes,
      mar: marRows,
      auditTrail,
    };
  }
}
