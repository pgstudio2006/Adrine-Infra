import { ForbiddenException, Injectable } from '@nestjs/common';
import { getAIAction, HospitalPlatformEvents } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { OperationalAnalyticsService } from '../analytics/operational-analytics.service';
import { OperationalCommandService } from '../command/operational-command.service';

@Injectable()
export class AIOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly command: OperationalCommandService,
    private readonly analytics: OperationalAnalyticsService,
  ) {}

  async buildOperationalContext(
    tenantId: string,
    input: { patientId?: string; admissionId?: string; opdVisitId?: string },
  ) {
    const ctx: Record<string, unknown> = { tenantId };

    if (input.patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId },
      });
      ctx.patient = patient;
    }

    if (input.opdVisitId) {
      const visit = await this.prisma.opdVisit.findFirst({
        where: { id: input.opdVisitId, tenantId },
        include: {
          transitions: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });
      const [labs, rads, rx] = await Promise.all([
        this.prisma.labDiagnosticOrder.findMany({
          where: { tenantId, opdVisitId: input.opdVisitId },
          take: 20,
        }),
        this.prisma.radiologyStudyOrder.findMany({
          where: { tenantId, opdVisitId: input.opdVisitId },
          take: 20,
        }),
        this.prisma.pharmacyFulfillment.findMany({
          where: { tenantId, opdVisitId: input.opdVisitId },
          take: 20,
        }),
      ]);
      ctx.opdVisit = visit;
      ctx.labOrders = labs;
      ctx.radiologyOrders = rads;
      ctx.pharmacyFulfillments = rx;
    }

    if (input.admissionId) {
      const admission = await this.prisma.ipdAdmission.findFirst({
        where: { id: input.admissionId, tenantId },
      });
      const [nursing, discharge] = await Promise.all([
        this.prisma.nursingTask.findMany({
          where: { tenantId, admissionId: input.admissionId },
          take: 30,
        }),
        this.prisma.dischargeOrchestration.findFirst({
          where: { tenantId, admissionId: input.admissionId },
        }),
      ]);
      ctx.admission = admission;
      ctx.nursingTasks = nursing;
      ctx.discharge = discharge;
    }

    return ctx;
  }

  private async runAction(
    actionType: string,
    tenantId: string,
    payload?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const ctx = await this.buildOperationalContext(tenantId, {
      patientId: payload?.patientId as string | undefined,
      admissionId: payload?.admissionId as string | undefined,
      opdVisitId: payload?.opdVisitId as string | undefined,
    });

    switch (actionType) {
      case 'summarize_patient_ops':
        return {
          summary: 'Operational snapshot for patient journey',
          opdState: (ctx.opdVisit as { state?: string } | undefined)?.state,
          pendingLabs: (ctx.labOrders as unknown[])?.length ?? 0,
          pendingRadiology: (ctx.radiologyOrders as unknown[])?.length ?? 0,
        };
      case 'explain_discharge_blockers':
        return {
          admissionState: (ctx.admission as { state?: string } | undefined)?.state,
          dischargeState: (ctx.discharge as { state?: string } | undefined)?.state,
          openNursingTasks: (ctx.nursingTasks as { state: string }[])?.filter(
            (t) => !['completed', 'cancelled'].includes(t.state),
          ).length,
        };
      case 'summarize_billing_anomalies':
        return {
          hint: 'Cross-check invoice charge lines vs completed modules',
          opdVisitId: payload?.opdVisitId,
        };
      case 'stuck_workflows': {
        const stuck: string[] = [];
        const labs = ctx.labOrders as { state: string }[] | undefined;
        if (labs?.some((l) => l.state === 'critical_review')) stuck.push('lab_critical_review');
        const rads = ctx.radiologyOrders as { state: string }[] | undefined;
        if (rads?.some((r) => r.state === 'critical_review')) stuck.push('radiology_critical_review');
        return { stuck, count: stuck.length };
      }
      case 'nursing_handover_summary':
        return {
          tasks: (ctx.nursingTasks as { taskType?: string; state: string }[])?.map((t) => ({
            type: t.taskType,
            state: t.state,
          })),
        };
      case 'admin_morning_briefing': {
        const branchId = (payload?.branchId as string) ?? 'branch_main';
        const [snapshot, opsAnalytics] = await Promise.all([
          this.command.buildSnapshot(tenantId, branchId, true),
          this.analytics.getOperational(tenantId, branchId, '24h'),
        ]);
        const c = snapshot.counts;
        const m = opsAnalytics.metrics;
        const advice: string[] = [];
        if (c.labCriticalUnacked > 0) {
          advice.push(`${c.labCriticalUnacked} critical lab result(s) awaiting acknowledgment.`);
        }
        if (c.openEscalations > 0) {
          advice.push(`${c.openEscalations} open operational escalation(s) need review.`);
        }
        if ((m.nursingMissed as number) > 0) {
          advice.push(`${m.nursingMissed} nursing task(s) missed in the last 24h.`);
        }
        if (c.billingDraftInvoices > 5) {
          advice.push(`${c.billingDraftInvoices} draft invoices — prioritize billing clearance.`);
        }
        return {
          healthStatus: snapshot.healthStatus,
          counts: c,
          metrics24h: m,
          escalations: snapshot.escalations.slice(0, 8),
          blockers: snapshot.blockers.slice(0, 6),
          advice,
          policyNote: 'Tenant AI policy stub: clinical outputs are advisory; verify against governed workflows.',
        };
      }
      case 'admin_clinical_query': {
        const query = String(payload?.query ?? '').trim();
        if (!query) {
          return { answer: 'No query provided.', policyNote: 'Tenant AI policy stub: queries are logged and quota-metered.' };
        }
        const stuck = await this.runAction('stuck_workflows', tenantId, payload);
        return {
          query,
          answer: `Policy-gated stub: received clinical/admin query (${query.length} chars). Cross-check stuck workflows and live command snapshot before acting.`,
          stuckWorkflows: stuck,
          policyNote: 'Tenant AI policy stub: not a substitute for licensed clinical judgment or local protocols.',
        };
      }
      default:
        return { summary: `Stub output for ${actionType}`, contextKeys: Object.keys(ctx) };
    }
  }

  async execute(
    tenantId: string,
    input: {
      actionType: string;
      userId: string;
      branchId?: string;
      permissions: string[];
      payload?: Record<string, unknown>;
    },
  ) {
    const def = getAIAction(input.actionType);
    if (!def) throw new ForbiddenException('Unknown AI action');

    const missing = def.requiredPermissions.filter((p) => !input.permissions.includes(p));
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permissions: ${missing.join(', ')}`);
    }

    const quota = await this.prisma.aITenantQuota.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
    if (quota.tokensUsed + def.estimatedTokens > quota.monthlyTokenCap) {
      await this.prisma.platformEvent.create({
        data: {
          tenantId,
          eventName: HospitalPlatformEvents.aiOrchestration.quotaExceeded,
          payload: { actionType: input.actionType },
        },
      });
      throw new ForbiddenException('AI token quota exceeded');
    }

    const output = {
      actionType: input.actionType,
      ...(await this.runAction(input.actionType, tenantId, input.payload)),
      generatedAt: new Date().toISOString(),
    };

    const log = await this.prisma.aIActionLog.create({
      data: {
        tenantId,
        branchId: input.branchId,
        userId: input.userId,
        actionType: input.actionType,
        input: input.payload as object | undefined,
        output: output as object,
        status: 'completed',
      },
    });

    await this.prisma.aITenantQuota.update({
      where: { tenantId },
      data: { tokensUsed: { increment: def.estimatedTokens } },
    });

    await this.prisma.platformEvent.create({
      data: {
        tenantId,
        eventName: HospitalPlatformEvents.aiOrchestration.actionExecuted,
        payload: { actionType: input.actionType, logId: log.id },
      },
    });

    return { logId: log.id, output, tokensUsed: def.estimatedTokens };
  }
}
