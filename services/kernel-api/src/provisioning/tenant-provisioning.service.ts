import { Injectable, NotFoundException } from '@nestjs/common';
import {
  getOnboardingTemplate,
  HospitalPlatformEvents,
  ONBOARDING_TEMPLATE_PACKS,
} from '@adrine/hospital-operations';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { OperationalTemplateService } from '../templates/operational-template.service';

function moduleFlagsJson(modules: readonly string[]): Prisma.InputJsonValue {
  return Object.fromEntries(modules.map((m: string) => [m, true])) as Prisma.InputJsonValue;
}

@Injectable()
export class TenantProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: OperationalTemplateService,
  ) {}

  listTemplates() {
    return ONBOARDING_TEMPLATE_PACKS;
  }

  async signup(input: {
    orgName: string;
    adminEmail: string;
    adminName?: string;
  }) {
    const tenantId = `tenant_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const signup = await this.prisma.tenantSignup.create({
      data: {
        tenantId,
        orgName: input.orgName,
        adminEmail: input.adminEmail,
        adminName: input.adminName,
        status: 'pending',
      },
    });
    const session = await this.prisma.onboardingSession.create({
      data: { tenantId, signupId: signup.id, progressJson: { step: 'signup' } },
    });
    await this.enqueueEvent(tenantId, HospitalPlatformEvents.provisioning.signupCreated, {
      signupId: signup.id,
      sessionId: session.id,
    });
    return { tenantId, signupId: signup.id, sessionId: session.id };
  }

  async completeStep(
    tenantId: string,
    sessionId: string,
    stepKey: string,
    payload: Record<string, unknown>,
  ) {
    const session = await this.prisma.onboardingSession.findFirst({
      where: { id: sessionId, tenantId },
    });
    if (!session) throw new NotFoundException('Onboarding session not found');

    await this.prisma.onboardingStep.upsert({
      where: { sessionId_stepKey: { sessionId, stepKey } },
      create: { sessionId, stepKey, payload: payload as object },
      update: { payload: payload as object },
    });

    const progress = {
      ...(session.progressJson as Record<string, unknown>),
      [stepKey]: payload,
      lastStep: stepKey,
    };
    await this.prisma.onboardingSession.update({
      where: { id: sessionId },
      data: { progressJson: progress as object },
    });

    if (stepKey === 'hospital' && payload.orgName) {
      await this.prisma.organization.upsert({
        where: { tenantId },
        create: {
          tenantId,
          name: String(payload.orgName),
          legalName: String(payload.orgName),
        },
        update: { name: String(payload.orgName) },
      });
    }

    if (stepKey === 'branches' && Array.isArray(payload.branches)) {
      const org = await this.prisma.organization.findUnique({ where: { tenantId } });
      if (org) {
        for (const b of payload.branches as { code: string; name: string }[]) {
          await this.prisma.branch.upsert({
            where: { tenantId_code: { tenantId, code: b.code } },
            create: {
              tenantId,
              organizationId: org.id,
              code: b.code,
              name: b.name,
            },
            update: { name: b.name },
          });
        }
      }
    }

    await this.enqueueEvent(
      tenantId,
      HospitalPlatformEvents.provisioning.onboardingStepCompleted,
      { sessionId, stepKey },
    );
    return { sessionId, stepKey, progress };
  }

  async completeOnboarding(tenantId: string, sessionId: string) {
    const session = await this.prisma.onboardingSession.findFirst({
      where: { id: sessionId, tenantId },
    });
    if (!session) throw new NotFoundException('Onboarding session not found');

    const progress = session.progressJson as Record<string, unknown>;
    const packCode =
      (progress.template_pack as string | undefined) ??
      session.templatePack ??
      'opd_clinic';
    const template = getOnboardingTemplate(packCode) ?? getOnboardingTemplate('opd_clinic')!;

    const org = await this.prisma.organization.findUnique({ where: { tenantId } });
    let branches = org
      ? await this.prisma.branch.findMany({ where: { tenantId, organizationId: org.id } })
      : [];

    if (branches.length === 0 && org) {
      const created = await this.prisma.branch.create({
        data: {
          tenantId,
          organizationId: org.id,
          code: 'main',
          name: 'Main Branch',
          moduleFlags: moduleFlagsJson(template.defaultModules),
        },
      });
      branches = [created];
    } else {
      for (const branch of branches) {
        await this.prisma.branch.update({
          where: { id: branch.id },
          data: {
            moduleFlags: moduleFlagsJson(template.defaultModules),
          },
        });
      }
    }

    const primaryBranch = branches[0];
    if (primaryBranch) {
      await this.templates.instantiate(tenantId, primaryBranch.id, packCode).catch(() => undefined);
    }

    const starterPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: 'free_trial' },
    });
    if (starterPlan) {
      await this.prisma.tenantSubscription.upsert({
        where: { tenantId },
        create: { tenantId, planId: starterPlan.id, status: 'active' },
        update: { status: 'active' },
      });
    }

    await this.prisma.tenantSignup.update({
      where: { tenantId },
      data: { status: 'active' },
    });
    await this.prisma.onboardingSession.update({
      where: { id: sessionId },
      data: { status: 'completed', completedAt: new Date(), templatePack: packCode },
    });

    await this.enqueueEvent(tenantId, HospitalPlatformEvents.provisioning.tenantActivated, {
      sessionId,
      templatePack: packCode,
    });
    return { tenantId, status: 'active', templatePack: packCode };
  }

  private async enqueueEvent(tenantId: string, eventName: string, payload: object) {
    await this.prisma.platformEventOutbox.create({
      data: { tenantId, eventName, payload },
    });
  }
}
