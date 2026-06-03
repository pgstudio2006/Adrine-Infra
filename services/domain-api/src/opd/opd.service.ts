import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateOpdTransition,
  listAllowedOpdActions,
  type OpdValidationContext,
  type OpdVisitState,
} from '@adrine/hospital-operations';
import { BillingSyncService } from '../billing/billing-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';
import { PatientService } from '../patient/patient.service';
import { EncounterService } from '../encounter/encounter.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { LabRuntimeService } from '../lab/lab-runtime.service';
import { PharmacyRuntimeService } from '../pharmacy/pharmacy-runtime.service';
import { RadiologyRuntimeService } from '../radiology/radiology-runtime.service';

export type OpdTransitionBody = {
  action: string;
  actorId?: string;
  actorRole: string;
  reason?: string;
  context?: OpdValidationContext;
  payload?: Record<string, unknown>;
};

@Injectable()
export class OpdService {
  private tokenSeq = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly billingSync: BillingSyncService,
    private readonly patients: PatientService,
    private readonly encounters: EncounterService,
    private readonly scheduling: SchedulingService,
    private readonly lab: LabRuntimeService,
    private readonly pharmacy: PharmacyRuntimeService,
    private readonly radiology: RadiologyRuntimeService,
  ) {}

  async createVisit(
    tenantId: string,
    branchId: string,
    body: {
      patientId?: string;
      register?: { fullName: string; mrn?: string; dob?: string };
      department?: string;
      assignedDoctor?: string;
      actorRole?: string;
      actorId?: string;
    },
  ) {
    let patientId = body.patientId;
    if (!patientId && body.register) {
      const p = await this.patients.create(tenantId, body.register);
      patientId = p.id;
    }
    if (!patientId) {
      throw new BadRequestException('patientId or register payload required');
    }

    const visit = await this.prisma.opdVisit.create({
      data: {
        tenantId,
        branchId,
        patientId,
        state: 'intent',
        department: body.department,
        assignedDoctor: body.assignedDoctor,
      },
      include: { patient: true },
    });

    if (body.register) {
      return this.transition(tenantId, visit.id, {
        action: 'register_patient',
        actorRole: body.actorRole ?? 'receptionist',
        actorId: body.actorId,
        context: {
          demographicsComplete: true,
          consentCaptured: true,
        },
      });
    }

    return visit;
  }

  async getVisit(tenantId: string, id: string) {
    const visit = await this.prisma.opdVisit.findFirst({
      where: { id, tenantId },
      include: {
        patient: true,
        transitions: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });
    if (!visit) throw new NotFoundException('OPD visit not found');
    return visit;
  }

  async getActiveForPatient(tenantId: string, patientId: string) {
    return this.prisma.opdVisit.findFirst({
      where: {
        tenantId,
        patientId,
        state: { notIn: ['completed', 'cancelled', 'no_show'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { patient: true },
    });
  }

  async transition(tenantId: string, visitId: string, body: OpdTransitionBody) {
    const visit = await this.getVisit(tenantId, visitId);
    const fromState = visit.state as OpdVisitState;
    const ctx: OpdValidationContext = {
      ...body.context,
      visitEscalated: visit.escalationLevel > 0,
      actorIsSupervisor: ['admin', 'medical_superintendent'].includes(body.actorRole),
    };

    if (body.action === 'fulfill_or_defer_orders') {
      const labBlockers = await this.lab.getOpdLabBlockers(tenantId, visitId, fromState);
      if (ctx.pendingMandatoryLabsComplete === undefined) {
        ctx.pendingMandatoryLabsComplete = !labBlockers.some((b) => b.code === 'LAB_MANDATORY');
      }
      if (ctx.criticalLabsAcknowledged === undefined) {
        ctx.criticalLabsAcknowledged = !labBlockers.some((b) => b.code === 'LAB_CRITICAL_ACK');
      }
      if (ctx.criticalResultsAcknowledged === undefined) {
        ctx.criticalResultsAcknowledged = !labBlockers.some(
          (b) => b.code === 'LAB_CRITICAL' && b.severity === 'critical',
        );
      }

      const rxBlockers = await this.pharmacy.getOpdPharmacyBlockers(tenantId, visitId, fromState);
      if (ctx.pendingPharmacyFulfilledOrDeferred === undefined) {
        ctx.pendingPharmacyFulfilledOrDeferred = !rxBlockers.some(
          (b) => b.code === 'PHARMACY_URGENT',
        );
      }
      if (ctx.controlledMedsApproved === undefined) {
        ctx.controlledMedsApproved = !rxBlockers.some((b) => b.code === 'PHARMACY_CONTROLLED');
      }

      const radBlockers = await this.radiology.getOpdRadiologyBlockers(
        tenantId,
        visitId,
        fromState,
      );
      if (ctx.pendingOrdersDeferredOrComplete === undefined) {
        ctx.pendingOrdersDeferredOrComplete = !radBlockers.some(
          (b) => b.code === 'RADIOLOGY_PENDING' || b.code === 'RADIOLOGY_MANDATORY',
        );
      }
      if (ctx.criticalResultsAcknowledged === undefined) {
        ctx.criticalResultsAcknowledged = !radBlockers.some(
          (b) => b.code === 'RADIOLOGY_CRITICAL' || b.code === 'RADIOLOGY_CRITICAL_ACK',
        );
      }
    }

    const result = evaluateOpdTransition({
      visitState: fromState,
      action: body.action,
      actorRole: body.actorRole,
      validationContext: ctx,
    });

    if (!result.ok) {
      throw new BadRequestException({
        code: result.code,
        message: result.reason,
      });
    }

    const nextState = result.nextState;
    const patch: Record<string, unknown> = {
      state: nextState,
      previousState: fromState,
    };

    if (body.action === 'issue_token') {
      patch.tokenNumber = this.tokenSeq++;
    }
    if (body.action === 'route_to_department' && body.payload?.department) {
      patch.department = body.payload.department as string;
    }
    if (body.action === 'escalate_visit') {
      patch.escalationLevel = visit.escalationLevel + 1;
      patch.escalationReason = body.reason ?? (body.payload?.reason as string);
    }
    if (nextState === 'completed') {
      patch.completedAt = new Date();
    }
    if (body.payload?.complaint) {
      patch.complaint = body.payload.complaint;
    }
    if (body.payload?.assignedDoctor) {
      patch.assignedDoctor = body.payload.assignedDoctor;
    }

    let encounterId = visit.encounterId;
    if (
      (body.action === 'route_to_department' || body.action === 'call_patient') &&
      !encounterId
    ) {
      const enc = await this.encounters.create(tenantId, {
        patientId: visit.patientId,
        type: 'OPD',
      });
      encounterId = enc.id;
      patch.encounterId = encounterId;
    }

    if (body.action === 'schedule_or_walkin' && body.payload?.appointment) {
      const appt = body.payload.appointment as {
        startAt: string;
        endAt: string;
        resourceLabel: string;
      };
      const booked = await this.scheduling.book(tenantId, {
        patientId: visit.patientId,
        ...appt,
      });
      patch.appointmentId = booked.id;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.opdVisit.update({
        where: { id: visitId },
        data: patch,
        include: { patient: true },
      });
      await tx.opdVisitTransition.create({
        data: {
          tenantId,
          opdVisitId: visitId,
          action: body.action,
          fromState,
          toState: nextState,
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
        branchId: visit.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'opd_visit',
        resourceId: visitId,
        payload: {
          action: body.action,
          fromState,
          toState: nextState,
          patientId: visit.patientId,
          encounterId,
          metering: result.metering,
          notifications: result.notifications,
          aiHooks: result.aiHooks,
        },
      });
    }

    if (['register_patient', 'check_in', 'route_to_department'].includes(body.action)) {
      await this.billingSync.ensureOpdDraft(tenantId, {
        opdVisitId: visitId,
        patientId: visit.patientId,
        branchId: visit.branchId,
        encounterId: encounterId ?? undefined,
        actorId: body.actorId,
        actorRole: body.actorRole,
      });
    }

    return {
      visit: updated,
      transition: {
        action: body.action,
        fromState,
        toState: nextState,
        events: result.events,
        metering: result.metering,
        notifications: result.notifications,
        aiHooks: result.aiHooks,
      },
    };
  }

  async listAllowedActions(tenantId: string, visitId: string, actorRole: string) {
    const visit = await this.getVisit(tenantId, visitId);
    return {
      state: visit.state,
      allowed: listAllowedOpdActions(visit.state as OpdVisitState, actorRole),
    };
  }

  /** Active OPD visits for a branch (queue / consultation board). */
  async listBoardVisits(tenantId: string, branchId: string) {
    return this.prisma.opdVisit.findMany({
      where: {
        tenantId,
        branchId,
        state: { in: ['routed', 'queued', 'in_consultation', 'orders_pending'] },
      },
      include: { patient: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Deep-merge visit metadata (Navayu MSK registration, exams, lifecycle state). */
  async patchVisitMetadata(
    tenantId: string,
    visitId: string,
    patch: Record<string, unknown>,
  ) {
    const visit = await this.getVisit(tenantId, visitId);
    const existing =
      visit.metadata && typeof visit.metadata === 'object' && !Array.isArray(visit.metadata)
        ? (visit.metadata as Record<string, unknown>)
        : {};
    const merged = deepMergeMetadata(existing, patch);
    return this.prisma.opdVisit.update({
      where: { id: visitId },
      data: { metadata: merged as object },
      include: { patient: true },
    });
  }

  /** Patient tablet intake — persists answers under metadata.navayu.intake. */
  async submitIntake(
    tenantId: string,
    visitId: string,
    body: {
      formId: string;
      version: string;
      answers: Record<string, unknown>;
    },
  ) {
    const redFlags = Array.isArray(body.answers.redFlag)
      ? (body.answers.redFlag as string[])
      : Array.isArray(body.answers.redFlags)
        ? (body.answers.redFlags as string[])
        : [];
    const urgent =
      redFlags.length > 0 && !redFlags.every((flag) => flag === 'none');

    const visit = await this.patchVisitMetadata(tenantId, visitId, {
      navayu: {
        intake: {
          formId: body.formId,
          version: body.version,
          answers: body.answers,
          submittedAt: new Date().toISOString(),
          urgent,
        },
      },
      mskLifecycleState: 'intake_complete',
    });

    await this.platformEvents.record({
      tenantId,
      branchId: visit.branchId,
      eventName: 'navayu.intake_submitted',
      resourceType: 'opd_visit',
      resourceId: visitId,
      payload: {
        formId: body.formId,
        urgent,
        vas: body.answers.vas,
      },
    });

    return { ok: true, visit, urgent };
  }

  /** Chronological timeline for a patient (visits, transitions, Navayu MSK milestones). */
  async getPatientTimeline(tenantId: string, patientId: string) {
    const visits = await this.prisma.opdVisit.findMany({
      where: { tenantId, patientId },
      include: {
        transitions: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    const items: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: string;
      visitId?: string;
    }> = [];

    for (const visit of visits) {
      const meta =
        visit.metadata && typeof visit.metadata === 'object' && !Array.isArray(visit.metadata)
          ? (visit.metadata as Record<string, unknown>)
          : {};
      const navayu =
        meta.navayu && typeof meta.navayu === 'object' && !Array.isArray(meta.navayu)
          ? (meta.navayu as Record<string, unknown>)
          : {};
      const mskState = typeof meta.mskLifecycleState === 'string' ? meta.mskLifecycleState : undefined;

      items.push({
        id: `visit-${visit.id}`,
        type: 'visit',
        title: `OPD visit · ${visit.state}`,
        description: [visit.department, visit.assignedDoctor, mskState ? `MSK: ${mskState}` : null]
          .filter(Boolean)
          .join(' · '),
        timestamp: visit.createdAt.toISOString(),
        visitId: visit.id,
      });

      if (navayu.hearAboutNavayu || navayu.registeredAt) {
        items.push({
          id: `navayu-reg-${visit.id}`,
          type: 'navayu_registration',
          title: 'Navayu MSK registration',
          description: `Referral: ${String(navayu.hearAboutNavayu ?? '—')}`,
          timestamp: String(navayu.registeredAt ?? visit.createdAt.toISOString()),
          visitId: visit.id,
        });
      }

      const intake = navayu.intake as Record<string, unknown> | undefined;
      if (intake?.submittedAt) {
        const answers = intake.answers as Record<string, unknown> | undefined;
        items.push({
          id: `navayu-intake-${visit.id}`,
          type: 'navayu_intake',
          title: intake.urgent ? 'Patient intake · URGENT flags' : 'Patient intake completed',
          description: answers?.complaintText
            ? String(answers.complaintText)
            : `VAS ${answers?.vas ?? '—'}/10`,
          timestamp: String(intake.submittedAt),
          visitId: visit.id,
        });
      }

      const lumbar = navayu.lumbarExam as Record<string, unknown> | undefined;
      if (lumbar?.savedAt) {
        items.push({
          id: `navayu-exam-${visit.id}`,
          type: 'navayu_msk_exam',
          title: 'Junior MSK lumbar exam',
          description: `ODI ${lumbar.odi ?? '—'}% · VAS ${lumbar.vas ?? '—'}/10 · SLR ${lumbar.slrt ?? '—'}`,
          timestamp: String(lumbar.savedAt),
          visitId: visit.id,
        });
      }

      for (const tr of visit.transitions) {
        items.push({
          id: tr.id,
          type: 'opd_transition',
          title: `OPD · ${tr.action}`,
          description: `${tr.fromState} → ${tr.toState}`,
          timestamp: tr.createdAt.toISOString(),
          visitId: visit.id,
        });
      }
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { patientId, items };
  }
}

function deepMergeMetadata(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMergeMetadata(out[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}
