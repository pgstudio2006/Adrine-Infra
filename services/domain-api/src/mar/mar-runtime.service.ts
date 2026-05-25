import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateMarTransition,
  HospitalPlatformEvents,
  type MarValidationContext,
  type MedicationAdminState,
} from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';
import { NursingRuntimeService } from '../nursing/nursing-runtime.service';

function isMedicationNursingTask(taskType: string) {
  const type = taskType.toLowerCase();
  return type.includes('med') || type.includes('drug') || type.includes('iv ');
}

function parseDrugFromDescription(description: string) {
  const parts = description.split('·').map((p) => p.trim());
  return parts[0] || description;
}

@Injectable()
export class MarRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly nursing: NursingRuntimeService,
  ) {}

  async createSchedule(
    tenantId: string,
    branchId: string,
    body: {
      admissionId: string;
      patientId: string;
      drug: string;
      dosage?: string;
      route?: string;
      frequency?: string;
      scheduledAt?: string;
      orderedBy?: string;
      nursingTaskId?: string;
      notes?: string;
      actorRole?: string;
      actorId?: string;
    },
  ) {
    const schedule = await this.prisma.medicationSchedule.create({
      data: {
        tenantId,
        branchId,
        admissionId: body.admissionId,
        patientId: body.patientId,
        drug: body.drug,
        dosage: body.dosage ?? '',
        route: body.route ?? 'PO',
        frequency: body.frequency ?? '',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        orderedBy: body.orderedBy,
        nursingTaskId: body.nursingTaskId,
        notes: body.notes,
        state: 'scheduled',
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.mar.scheduleCreated,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'medication_schedule',
      resourceId: schedule.id,
      payload: { admissionId: body.admissionId, drug: body.drug },
    });

    return schedule;
  }

  async getSchedule(tenantId: string, id: string) {
    const row = await this.prisma.medicationSchedule.findFirst({
      where: { id, tenantId },
      include: { transitions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!row) throw new NotFoundException('Medication schedule not found');
    return row;
  }

  async listForAdmission(tenantId: string, admissionId: string, syncNursing = true) {
    if (syncNursing) {
      await this.syncFromNursingTasks(tenantId, admissionId);
    }
    return this.prisma.medicationSchedule.findMany({
      where: { tenantId, admissionId },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async listAuditForAdmission(tenantId: string, admissionId: string) {
    await this.syncFromNursingTasks(tenantId, admissionId);
    const schedules = await this.prisma.medicationSchedule.findMany({
      where: { tenantId, admissionId },
      include: { transitions: { orderBy: { createdAt: 'desc' } } },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });
    return {
      schedules,
      summary: {
        total: schedules.length,
        administered: schedules.filter((s) => s.state === 'administered').length,
        missed: schedules.filter((s) => s.state === 'missed').length,
        refused: schedules.filter((s) => s.state === 'refused').length,
        held: schedules.filter((s) => s.state === 'held').length,
        pending: schedules.filter((s) => s.state === 'scheduled').length,
      },
    };
  }

  private async syncFromNursingTasks(tenantId: string, admissionId: string) {
    const tasks = await this.prisma.nursingTask.findMany({
      where: { tenantId, admissionId },
    });
    const medTasks = tasks.filter((t) => isMedicationNursingTask(t.taskType));
    for (const task of medTasks) {
      const existing = await this.prisma.medicationSchedule.findFirst({
        where: { tenantId, nursingTaskId: task.id },
      });
      if (existing) continue;

      const admission = await this.prisma.ipdAdmission.findFirst({
        where: { id: admissionId, tenantId },
      });
      if (!admission) continue;

      await this.prisma.medicationSchedule.create({
        data: {
          tenantId,
          branchId: task.branchId,
          admissionId,
          patientId: task.patientId,
          drug: parseDrugFromDescription(task.description),
          route: task.taskType,
          scheduledAt: task.dueAt ?? undefined,
          orderedBy: task.assignedTo ?? admission.attendingDoctor ?? undefined,
          nursingTaskId: task.id,
          state:
            task.state === 'completed'
              ? 'administered'
              : task.state === 'missed'
                ? 'missed'
                : 'scheduled',
          administeredAt: task.completedAt ?? undefined,
        },
      });
    }
  }

  async transition(
    tenantId: string,
    scheduleId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: MarValidationContext;
      expectedVersion?: number;
    },
  ) {
    const schedule = await this.getSchedule(tenantId, scheduleId);
    const fromState = schedule.state as MedicationAdminState;

    if (body.expectedVersion !== undefined && body.expectedVersion !== schedule.version) {
      throw new ConflictException('Medication schedule version mismatch');
    }

    const result = evaluateMarTransition({
      state: fromState,
      action: body.action,
      actorRole: body.actorRole,
      validationContext: body.context ?? { nurseAssigned: true },
    });

    if (!result.ok) {
      throw new BadRequestException({ code: result.code, message: result.reason });
    }

    const patch: Record<string, unknown> = {
      state: result.nextState,
      version: { increment: 1 },
    };
    if (result.nextState === 'administered') {
      patch.administeredAt = new Date();
    }
    if (result.nextState === 'held') {
      patch.heldAt = new Date();
    }
    if (result.nextState === 'scheduled' && fromState === 'held') {
      patch.heldAt = null;
    }
    if (body.reason) {
      patch.notes = body.reason;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.medicationSchedule.update({
        where: { id: scheduleId },
        data: patch,
      });
      await tx.medicationAdminTransition.create({
        data: {
          tenantId,
          medicationScheduleId: scheduleId,
          action: body.action,
          fromState,
          toState: result.nextState,
          actorId: body.actorId,
          actorRole: body.actorRole,
          reason: body.reason,
        },
      });
      return row;
    });

    for (const eventName of result.events) {
      await this.platformEvents.record({
        tenantId,
        branchId: schedule.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'medication_schedule',
        resourceId: scheduleId,
        payload: { admissionId: schedule.admissionId, drug: schedule.drug },
      });
    }

    if (result.nextState === 'administered' && schedule.nursingTaskId) {
      await this.completeLinkedNursingTask(tenantId, schedule.nursingTaskId, body);
    }

    return { schedule: updated, transition: result };
  }

  private async completeLinkedNursingTask(
    tenantId: string,
    nursingTaskId: string,
    body: { actorRole: string; actorId?: string },
  ) {
    const task = await this.nursing.getTask(tenantId, nursingTaskId);
    if (task.state === 'completed' || task.state === 'missed') return;

    const ctx = { nurseAssigned: true, taskDocumentationComplete: true };
    const steps: string[] = [];
    if (task.state === 'scheduled') steps.push('acknowledge_task', 'start_task', 'complete_task');
    else if (task.state === 'acknowledged') steps.push('start_task', 'complete_task');
    else if (task.state === 'in_progress') steps.push('complete_task');
    else if (task.state === 'escalated') steps.push('resolve_escalation');

    let version = task.version;
    for (const action of steps) {
      try {
        const { task: updated } = await this.nursing.transition(tenantId, nursingTaskId, {
          action,
          actorRole: body.actorRole,
          actorId: body.actorId,
          context: ctx,
          expectedVersion: version,
        });
        version = updated.version;
      } catch {
        break;
      }
    }
  }
}
