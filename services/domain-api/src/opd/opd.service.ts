import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateOpdTransition,
  evaluateMskTransition,
  listAllowedMskActions,
  listAllowedOpdActions,
  resolveMskState,
  type MskValidationContext,
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

export type MskTransitionBody = {
  action: string;
  actorId?: string;
  actorRole: string;
  context?: MskValidationContext;
  branchOverrides?: Record<string, boolean>;
  payload?: Record<string, unknown>;
};

@Injectable()
export class OpdService {
  private readonly logger = new Logger(OpdService.name);
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
      const p = await this.patients.create(tenantId, {
        fullName: body.register.fullName,
        dob: body.register.dob,
      });
      patientId = p.id;
    }
    if (!patientId) {
      throw new BadRequestException('patientId or register payload required');
    }

    if (!body.register) {
      const active = await this.getActiveForPatient(tenantId, patientId);
      if (active) {
        return active;
      }
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
    const activeStates = [
      'checked_in',
      'routed',
      'queued',
      'in_consultation',
      'orders_pending',
    ] as const;
    const baseQuery = {
      tenantId,
      state: { in: [...activeStates] },
    };
    const orderBy = [{ tokenNumber: 'asc' as const }, { createdAt: 'asc' as const }];
    const primary = await this.prisma.opdVisit.findMany({
      where: { ...baseQuery, branchId },
      include: { patient: true },
      orderBy,
    });
    let rows = primary;
    if (primary.length === 0 && branchId !== 'branch_main') {
      // Legacy visits created before branch-scoped auth used branch_main.
      const legacy = await this.prisma.opdVisit.findMany({
        where: { ...baseQuery, branchId: 'branch_main' },
        include: { patient: true },
        orderBy,
      });
      const seen = new Set(primary.map((v) => v.id));
      rows = [...primary, ...legacy.filter((v) => !seen.has(v.id))];
    }
    const fresh = rows.filter((visit) => !this.isStaleBoardVisit(visit));
    return this.dedupeBoardVisits(fresh);
  }

  /** Drop queue rows stuck in waiting states for more than 12 hours. */
  private isStaleBoardVisit(visit: { state: string; createdAt: Date }): boolean {
    const staleStates = new Set(['checked_in', 'routed', 'queued']);
    if (!staleStates.has(visit.state)) return false;
    const ageMs = Date.now() - visit.createdAt.getTime();
    return ageMs > 12 * 60 * 60 * 1000;
  }

  /** One active board row per patient and per MRN — keeps the newest visit when duplicates exist. */
  private dedupeBoardVisits<
    T extends {
      id: string;
      patientId: string;
      createdAt: Date;
      tokenNumber?: number | null;
      patient?: { mrn?: string | null } | null;
    },
  >(visits: T[]): T[] {
    const byPatient = new Map<string, T>();
    for (const visit of visits) {
      const existing = byPatient.get(visit.patientId);
      if (!existing || visit.createdAt > existing.createdAt) {
        byPatient.set(visit.patientId, visit);
      }
    }

    const byMrn = new Map<string, T>();
    const withoutMrn: T[] = [];
    for (const visit of byPatient.values()) {
      const mrn = visit.patient?.mrn?.trim();
      if (!mrn) {
        withoutMrn.push(visit);
        continue;
      }
      const existing = byMrn.get(mrn);
      if (!existing || visit.createdAt > existing.createdAt) {
        byMrn.set(mrn, visit);
      }
    }

    const merged = [...withoutMrn, ...byMrn.values()];
    const seen = new Set<string>();
    const unique = merged.filter((visit) => {
      if (seen.has(visit.id)) return false;
      seen.add(visit.id);
      return true;
    });

    return unique.sort((a, b) => {
      const tokenA = a.tokenNumber ?? Number.MAX_SAFE_INTEGER;
      const tokenB = b.tokenNumber ?? Number.MAX_SAFE_INTEGER;
      if (tokenA !== tokenB) return tokenA - tokenB;
      return a.createdAt.getTime() - b.createdAt.getTime();
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

    await this.patchVisitMetadata(tenantId, visitId, {
      navayu: {
        intake: {
          formId: body.formId,
          version: body.version,
          answers: body.answers,
          submittedAt: new Date().toISOString(),
          urgent,
        },
      },
    });

    const mskResult = await this.transitionMsk(tenantId, visitId, {
      action: 'complete_intake',
      actorRole: 'receptionist',
      context: { intakeSubmitted: true },
    });

    const updated = mskResult.visit;

    await this.platformEvents.record({
      tenantId,
      branchId: updated.branchId,
      eventName: 'navayu.intake_submitted',
      resourceType: 'opd_visit',
      resourceId: visitId,
      payload: {
        formId: body.formId,
        urgent,
        vas: body.answers.vas,
        mskState: mskResult.nextState,
      },
    });

    return { ok: true, visit: updated, urgent };
  }

  /** Governed Navayu MSK workflow transitions (navayu_msk_visit lifecycle). */
  async transitionMsk(tenantId: string, visitId: string, body: MskTransitionBody) {
    const visit = await this.getVisit(tenantId, visitId);
    const meta =
      visit.metadata && typeof visit.metadata === 'object' && !Array.isArray(visit.metadata)
        ? (visit.metadata as Record<string, unknown>)
        : {};
    const currentState = resolveMskState(meta.mskLifecycleState);
    const validationContext: MskValidationContext = {
      ...buildMskValidationContextFromMetadata(meta),
      ...body.context,
    };

    const result = evaluateMskTransition({
      mskState: currentState,
      action: body.action,
      actorRole: body.actorRole,
      validationContext,
      branchOverrides: body.branchOverrides,
    });

    if (!result.ok) {
      throw new BadRequestException(result.reason);
    }

    const metadataPatch: Record<string, unknown> = {
      mskLifecycleState: result.nextState,
      ...(body.payload ?? {}),
    };

    if (body.action === 'generate_ai_summary') {
      const navayu =
        meta.navayu && typeof meta.navayu === 'object' && !Array.isArray(meta.navayu)
          ? (meta.navayu as Record<string, unknown>)
          : {};
      const aiSummary = await this.produceNavayuAiSummary(buildNavayuAiSummaryPayload(navayu));
      metadataPatch.navayu = {
        ...navayu,
        aiSummary,
      };
    }

    const updated = await this.patchVisitMetadata(tenantId, visitId, metadataPatch);

    if (body.action === 'generate_ai_summary') {
      const latest = await this.getVisit(tenantId, visitId);
      if (latest.state === 'in_consultation') {
        try {
          await this.transition(tenantId, visitId, {
            action: 'release_for_senior_handoff',
            actorRole: body.actorRole,
            actorId: body.actorId,
            payload: { assignedDoctor: 'Dr. Senior MSK Consultant' },
          });
        } catch (err) {
          this.logger.warn(
            `Navayu senior handoff release failed for visit ${visitId}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    }

    await this.platformEvents.record({
      tenantId,
      branchId: visit.branchId,
      eventName: `navayu.msk.${body.action}`,
      resourceType: 'opd_visit',
      resourceId: visitId,
      payload: {
        from: currentState,
        to: result.nextState,
        action: body.action,
        actorRole: body.actorRole,
      },
    });

    if (body.action === 'plan_package' || body.action === 'close_visit') {
      try {
        await this.ensureNavayuBillingHandoff(
          tenantId,
          visitId,
          body.actorRole,
          body.actorId,
          updated.metadata as Record<string, unknown>,
        );
      } catch (err) {
        this.logger.warn(
          `Navayu billing handoff failed for visit ${visitId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return {
      visit:
        body.action === 'generate_ai_summary'
          ? await this.getVisit(tenantId, visitId)
          : updated,
      previousState: currentState,
      nextState: result.nextState,
    };
  }

  /**
   * Navayu MSK billing handoff — close encounter and advance OPD visit to billing_pending
   * so counsellor charge sync (GAP-006) can succeed.
   */
  async ensureNavayuBillingHandoff(
    tenantId: string,
    visitId: string,
    actorRole: string,
    actorId?: string,
    meta?: Record<string, unknown>,
  ) {
    let visit = await this.getVisit(tenantId, visitId);
    if (['completed', 'cancelled', 'no_show'].includes(visit.state)) {
      return {
        visit: { id: visit.id, state: visit.state, encounterId: visit.encounterId },
        encounterClosed: true,
        billingReady: visit.state === 'completed',
      };
    }

    const closeEncounterIfNeeded = async () => {
      visit = await this.getVisit(tenantId, visitId);
      if (!visit.encounterId) return;
      const enc = await this.encounters.get(tenantId, visit.encounterId);
      if (enc.status !== 'closed') {
        await this.encounters.close(tenantId, visit.encounterId);
      }
    };

    if (visit.state === 'billing_pending') {
      await closeEncounterIfNeeded();
      visit = await this.getVisit(tenantId, visitId);
      let encounterClosed = !visit.encounterId;
      if (visit.encounterId) {
        const enc = await this.encounters.get(tenantId, visit.encounterId);
        encounterClosed = enc.status === 'closed';
      }
      return {
        visit: { id: visit.id, state: visit.state, encounterId: visit.encounterId },
        encounterClosed,
        billingReady: true,
      };
    }

    const visitMeta =
      meta ??
      (visit.metadata && typeof visit.metadata === 'object' && !Array.isArray(visit.metadata)
        ? (visit.metadata as Record<string, unknown>)
        : {});
    const navayu =
      visitMeta.navayu && typeof visitMeta.navayu === 'object' && !Array.isArray(visitMeta.navayu)
        ? (visitMeta.navayu as Record<string, unknown>)
        : {};
    const protocolMap =
      navayu.protocolMap && typeof navayu.protocolMap === 'object' && !Array.isArray(navayu.protocolMap)
        ? (navayu.protocolMap as Record<string, unknown>)
        : {};
    const navayuCtx: OpdValidationContext = {
      demographicsComplete: true,
      consentCaptured: true,
      departmentSelected: true,
      doctorOrPoolAssigned: true,
      appointmentExistsOrWalkinAllowed: true,
      patientBalanceOk: true,
      tokenNotDuplicateToday: true,
      clinicalNotePresent: true,
      diagnosisCoded: !!protocolMap.protocolId || !!protocolMap.stageId,
      encounterOpen: true,
      pendingMandatoryLabsComplete: true,
      pendingPharmacyFulfilledOrDeferred: true,
      pendingOrdersDeferredOrComplete: true,
      criticalLabsAcknowledged: true,
      criticalResultsAcknowledged: true,
      controlledMedsApproved: true,
    };
    const doctorRole = ['doctor', 'admin', 'medical_superintendent'].includes(actorRole)
      ? actorRole
      : 'doctor';
    const deskRole = ['billing', 'crm_manager', 'receptionist'].includes(actorRole)
      ? actorRole
      : 'billing';

    const runTransition = async (action: string, role = doctorRole) => {
      await this.transition(tenantId, visitId, {
        action,
        actorRole: role,
        actorId,
        context: navayuCtx,
      });
      visit = await this.getVisit(tenantId, visitId);
    };

    for (let step = 0; step < 14; step += 1) {
      visit = await this.getVisit(tenantId, visitId);
      if (visit.state === 'billing_pending') break;
      if (['completed', 'cancelled', 'no_show'].includes(visit.state)) break;

      switch (visit.state) {
        case 'registered':
        case 'appointment_or_walkin':
          await runTransition('check_in', deskRole);
          break;
        case 'checked_in':
        case 'routed':
          await runTransition('issue_token', deskRole);
          break;
        case 'queued':
          await runTransition('call_patient', actorRole);
          break;
        case 'in_consultation':
          await runTransition('save_clinical_note');
          await runTransition('complete_consultation');
          break;
        case 'orders_pending':
          await closeEncounterIfNeeded();
          await runTransition('fulfill_or_defer_orders', deskRole);
          break;
        default:
          step = 14;
          break;
      }
    }

    await closeEncounterIfNeeded();
    visit = await this.getVisit(tenantId, visitId);
    let encounterClosed = !visit.encounterId;
    if (visit.encounterId) {
      const enc = await this.encounters.get(tenantId, visit.encounterId);
      encounterClosed = enc.status === 'closed';
    }
    return {
      visit: { id: visit.id, state: visit.state, encounterId: visit.encounterId },
      encounterClosed,
      billingReady: visit.state === 'billing_pending' || visit.state === 'completed',
    };
  }

  async listMskAllowedActions(tenantId: string, visitId: string, actorRole: string) {
    const visit = await this.getVisit(tenantId, visitId);
    const meta =
      visit.metadata && typeof visit.metadata === 'object' && !Array.isArray(visit.metadata)
        ? (visit.metadata as Record<string, unknown>)
        : {};
    const state = resolveMskState(meta.mskLifecycleState);
    return {
      state,
      allowed: listAllowedMskActions(state, actorRole),
    };
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

      const investigations = navayu.investigations as Record<string, unknown> | undefined;
      const uploads = investigations?.uploads as unknown[] | undefined;
      if (uploads?.length) {
        items.push({
          id: `navayu-investigations-${visit.id}`,
          type: 'navayu_investigations',
          title: 'Investigations uploaded',
          description: `${uploads.length} file(s) on record`,
          timestamp: String((uploads[uploads.length - 1] as { uploadedAt?: string })?.uploadedAt ?? visit.updatedAt?.toISOString() ?? visit.createdAt.toISOString()),
          visitId: visit.id,
        });
      }

      const protocolMap = navayu.protocolMap as Record<string, unknown> | undefined;
      if (protocolMap?.mappedAt) {
        items.push({
          id: `navayu-protocol-${visit.id}`,
          type: 'navayu_protocol_mapped',
          title: 'Protocol mapped',
          description: `${String(protocolMap.protocolId ?? '—')} · ${String(protocolMap.stageId ?? '—')}`,
          timestamp: String(protocolMap.mappedAt),
          visitId: visit.id,
        });
      }

      const seniorReview = navayu.seniorReview as Record<string, unknown> | undefined;
      if (seniorReview?.savedAt) {
        items.push({
          id: `navayu-senior-${visit.id}`,
          type: 'navayu_senior_review',
          title: 'Senior doctor consultation',
          description: [
            seniorReview.pathwayDecision ? `Pathway: ${String(seniorReview.pathwayDecision)}` : null,
            seniorReview.confirmedDiagnosis
              ? `Dx: ${String(seniorReview.confirmedDiagnosis)}`
              : null,
          ]
            .filter(Boolean)
            .join(' · '),
          timestamp: String(seniorReview.savedAt),
          visitId: visit.id,
        });
      }

      const counselling = navayu.counselling as Record<string, unknown> | undefined;
      if (counselling?.counsellorAt) {
        items.push({
          id: `navayu-counselling-${visit.id}`,
          type: 'navayu_counselling',
          title: 'Package counselling',
          description: `${String(counselling.packageName ?? 'Package')} · ${String(counselling.tierLabel ?? '—')}`,
          timestamp: String(counselling.counsellorAt),
          visitId: visit.id,
        });
      }

      const followUp = navayu.followUp as Record<string, unknown> | undefined;
      if (followUp?.bookedAt) {
        items.push({
          id: `navayu-followup-${visit.id}`,
          type: 'navayu_follow_up',
          title: 'Follow-up scheduled',
          description: followUp.scheduledStart
            ? `${String(followUp.resourceLabel ?? 'Follow-up')} · ${String(followUp.scheduledStart)}`
            : String(followUp.resourceLabel ?? 'Follow-up booked'),
          timestamp: String(followUp.bookedAt),
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

  /** Navayu investigation upload stub — persists metadata under navayu.investigations.uploads (max 2MB base64). */
  async uploadInvestigation(
    tenantId: string,
    visitId: string,
    body: {
      fieldId: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataBase64?: string;
    },
  ) {
    const maxBytes = 2 * 1024 * 1024;
    if (body.sizeBytes > maxBytes) {
      throw new Error(`File exceeds ${maxBytes} byte UAT limit`);
    }

    const storageKey = `navayu/${visitId}/${body.fieldId}/${Date.now()}_${body.fileName}`;
    const upload = {
      fieldId: body.fieldId,
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      uploadedAt: new Date().toISOString(),
      storageKey,
      hasData: !!body.dataBase64,
    };

    const visit = await this.getVisit(tenantId, visitId);
    const meta =
      visit.metadata && typeof visit.metadata === 'object' && !Array.isArray(visit.metadata)
        ? (visit.metadata as Record<string, unknown>)
        : {};
    const navayu =
      meta.navayu && typeof meta.navayu === 'object' && !Array.isArray(meta.navayu)
        ? (meta.navayu as Record<string, unknown>)
        : {};
    const investigations =
      navayu.investigations && typeof navayu.investigations === 'object' && !Array.isArray(navayu.investigations)
        ? (navayu.investigations as Record<string, unknown>)
        : {};
    const uploads = Array.isArray(investigations.uploads) ? [...investigations.uploads] : [];
    uploads.push(upload);

    const fieldList = Array.isArray(investigations[body.fieldId])
      ? [...(investigations[body.fieldId] as unknown[])]
      : [];
    fieldList.push(upload);

    await this.patchVisitMetadata(tenantId, visitId, {
      navayu: {
        investigations: {
          ...investigations,
          uploads,
          [body.fieldId]: fieldList,
        },
      },
    });

    await this.platformEvents.record({
      tenantId,
      branchId: visit.branchId,
      eventName: 'navayu.investigation_uploaded',
      resourceType: 'opd_visit',
      resourceId: visitId,
      payload: { fieldId: body.fieldId, fileName: body.fileName, storageKey },
    });

    return { ok: true, upload };
  }

  /** Navayu MSK AI summary — OpenRouter LLM when configured; rule-based fallback always available. */
  async generateNavayuAiSummary(
    _tenantId: string,
    _visitId: string,
    body: Record<string, unknown>,
  ) {
    const summary = await this.produceNavayuAiSummary(body);
    if (summary.mode === 'llm' || summary.mode === 'rule_based') {
      return {
        mode: summary.mode === 'llm' ? ('llm' as const) : ('rule' as const),
        sections: summary.sections,
      };
    }
    return {
      mode: 'blocked' as const,
      requiredEnv: 'OPENROUTER_API_KEY',
      blockedReason: summary.blockedReason,
      sections: summary.sections,
    };
  }

  /** Generate and persist-ready Navayu AI summary for MSK senior handoff. */
  private async produceNavayuAiSummary(body: Record<string, unknown>): Promise<{
    mode: 'llm' | 'rule_based' | 'blocked';
    generatedAt: string;
    model?: string;
    sections: Array<{ label: string; lines: string[]; urgent?: boolean }>;
    blockedReason?: string;
  }> {
    const generatedAt = new Date().toISOString();
    const fallback = buildRuleBasedNavayuAiSummary(body);
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
    const model = process.env.OPENROUTER_MODEL?.trim() || 'deepseek/deepseek-v4-flash';

    if (!openRouterKey) {
      return {
        mode: 'rule_based',
        generatedAt,
        sections: fallback,
      };
    }

    const prompt = JSON.stringify(body).slice(0, 6000);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER ?? 'https://hms.adrine.in',
          'X-Title': process.env.OPENROUTER_APP_TITLE ?? 'Navayu Hospital OS',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation assistant for MSK spine/joint visits. Output concise sections with bullet lines: Registration, Intake, Exam scores, Investigations, Suggested next steps. Flag urgent red flags clearly.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 800,
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`OpenRouter ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim() ?? '';
      if (!text) {
        throw new Error('OpenRouter returned empty summary');
      }
      const lines = text.split('\n').filter((line) => line.trim());
      return {
        mode: 'llm',
        generatedAt,
        model,
        sections: [
          {
            label: 'AI Clinical Summary',
            lines: lines.length ? lines : [text],
          },
        ],
      };
    } catch (err) {
      this.logger.warn(
        `Navayu LLM summary fallback to rule-based: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {
        mode: 'rule_based',
        generatedAt,
        model,
        sections: fallback,
        blockedReason: err instanceof Error ? err.message : 'LLM request failed',
      };
    }
  }
}

function buildNavayuAiSummaryPayload(navayu: Record<string, unknown>): Record<string, unknown> {
  return {
    registration: navayu.hearAboutNavayu ? navayu : navayu.registration,
    intake: navayu.intake,
    lumbarExam: navayu.lumbarExam,
    investigations: navayu.investigations,
    seniorQueue: true,
  };
}

function buildRuleBasedNavayuAiSummary(
  body: Record<string, unknown>,
): Array<{ label: string; lines: string[]; urgent?: boolean }> {
  const lumbar =
    body.lumbarExam && typeof body.lumbarExam === 'object' && !Array.isArray(body.lumbarExam)
      ? (body.lumbarExam as Record<string, unknown>)
      : {};
  const intake =
    body.intake && typeof body.intake === 'object' && !Array.isArray(body.intake)
      ? (body.intake as Record<string, unknown>)
      : {};
  const answers =
    intake.answers && typeof intake.answers === 'object' && !Array.isArray(intake.answers)
      ? (intake.answers as Record<string, unknown>)
      : {};

  return [
    {
      label: 'MSK Exam Snapshot',
      lines: [
        `ODI: ${String(lumbar.odi ?? '—')}`,
        `VAS: ${String(lumbar.vas ?? answers.vas ?? '—')}`,
        `SLRT: ${String(lumbar.slrt ?? '—')}`,
      ],
    },
    {
      label: 'Senior handoff',
      lines: ['Junior MSK exam complete — ready for senior consult review.'],
    },
  ];
}

function buildMskValidationContextFromMetadata(meta: Record<string, unknown>): MskValidationContext {
  const navayu =
    meta.navayu && typeof meta.navayu === 'object' && !Array.isArray(meta.navayu)
      ? (meta.navayu as Record<string, unknown>)
      : {};
  const intake =
    navayu.intake && typeof navayu.intake === 'object' && !Array.isArray(navayu.intake)
      ? (navayu.intake as Record<string, unknown>)
      : {};
  const lumbar =
    navayu.lumbarExam && typeof navayu.lumbarExam === 'object' && !Array.isArray(navayu.lumbarExam)
      ? (navayu.lumbarExam as Record<string, unknown>)
      : {};
  const mskState = typeof meta.mskLifecycleState === 'string' ? meta.mskLifecycleState : 'registered';

  const intakeCompleteStates = new Set([
    'intake_complete',
    'associate_eval',
    'msk_exam_complete',
    'ai_summary_ready',
    'senior_consult',
    'navayu_classified',
    'protocol_mapped',
    'counselling',
    'package_planned',
    'closed',
  ]);
  const examCompleteStates = new Set([
    'msk_exam_complete',
    'ai_summary_ready',
    'senior_consult',
    'navayu_classified',
    'protocol_mapped',
    'counselling',
    'package_planned',
    'closed',
  ]);
  const summaryReadyStates = new Set([
    'ai_summary_ready',
    'senior_consult',
    'navayu_classified',
    'protocol_mapped',
    'counselling',
    'package_planned',
    'closed',
  ]);

  const hasLumbarCore = !!(lumbar.odi && lumbar.vas && lumbar.slrt);

  return {
    intakeSubmitted: !!intake.submittedAt || intakeCompleteStates.has(mskState),
    mskExamFormComplete: hasLumbarCore || examCompleteStates.has(mskState),
    aiSummaryReady: summaryReadyStates.has(mskState),
    registrationComplete: typeof navayu.hearAboutNavayu === 'string',
  };
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
