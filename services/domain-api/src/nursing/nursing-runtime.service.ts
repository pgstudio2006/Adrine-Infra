import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateNursingTransition,
  HospitalPlatformEvents,
  NURSING_OPEN_STATES,
  type NursingTaskState,
  type NursingValidationContext,
} from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

@Injectable()
export class NursingRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  async createTask(
    tenantId: string,
    branchId: string,
    body: {
      admissionId: string;
      patientId: string;
      taskType: string;
      description: string;
      assignedTo?: string;
      priority?: string;
      dueAt?: string;
      actorRole?: string;
      actorId?: string;
    },
  ) {
    const task = await this.prisma.nursingTask.create({
      data: {
        tenantId,
        branchId,
        admissionId: body.admissionId,
        patientId: body.patientId,
        taskType: body.taskType,
        description: body.description,
        assignedTo: body.assignedTo,
        priority: body.priority ?? 'medium',
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
        state: 'scheduled',
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId,
      eventName: HospitalPlatformEvents.nursing.taskAcknowledged,
      actorId: body.actorId,
      actorRole: body.actorRole,
      resourceType: 'nursing_task',
      resourceId: task.id,
      payload: { admissionId: body.admissionId },
    });

    return task;
  }

  async getTask(tenantId: string, id: string) {
    const task = await this.prisma.nursingTask.findFirst({
      where: { id, tenantId },
      include: { transitions: { orderBy: { createdAt: 'desc' }, take: 15 } },
    });
    if (!task) throw new NotFoundException('Nursing task not found');
    return task;
  }

  async listForAdmission(tenantId: string, admissionId: string) {
    return this.prisma.nursingTask.findMany({
      where: { tenantId, admissionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdmissionNursingBlockers(tenantId: string, admissionId: string) {
    const tasks = await this.listForAdmission(tenantId, admissionId);
    const open = tasks.filter((t) => NURSING_OPEN_STATES.includes(t.state as NursingTaskState));
    return open.map((t) => ({
      code: 'NURSING_TASK_OPEN',
      message: `Task "${t.description}" is ${t.state}`,
      severity: t.state === 'escalated' ? ('critical' as const) : ('warning' as const),
    }));
  }

  async transition(
    tenantId: string,
    taskId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: NursingValidationContext;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    const task = await this.getTask(tenantId, taskId);
    const fromState = task.state as NursingTaskState;

    if (body.expectedVersion !== undefined && body.expectedVersion !== task.version) {
      throw new ConflictException('Nursing task version mismatch');
    }

    const result = evaluateNursingTransition({
      state: fromState,
      action: body.action,
      actorRole: body.actorRole,
      validationContext: body.context ?? {},
    });

    if (!result.ok) {
      throw new BadRequestException({ code: result.code, message: result.reason });
    }

    const patch: Record<string, unknown> = {
      state: result.nextState,
      version: { increment: 1 },
    };
    if (result.nextState === 'completed') {
      patch.completedAt = new Date();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.nursingTask.update({ where: { id: taskId }, data: patch });
      await tx.nursingTaskTransition.create({
        data: {
          tenantId,
          nursingTaskId: taskId,
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
        branchId: task.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'nursing_task',
        resourceId: taskId,
        payload: { admissionId: task.admissionId },
      });
    }

    return { task: updated, transition: result };
  }
}
