import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { WorkflowDefinitionDraft } from '@adrine/hospital-operations';
import { HospitalPlatformEvents } from '@adrine/hospital-operations';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

@Injectable()
export class WorkflowDefinitionRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  async listDefinitions(tenantId: string) {
    return this.prisma.workflowDefinition.findMany({
      where: { tenantId },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 3 },
      },
    });
  }

  async upsertDraft(
    tenantId: string,
    body: {
      lifecycleId: string;
      name: string;
      description?: string;
      draft: WorkflowDefinitionDraft;
    },
  ) {
    let def = await this.prisma.workflowDefinition.findUnique({
      where: { tenantId_lifecycleId: { tenantId, lifecycleId: body.lifecycleId } },
    });
    if (!def) {
      def = await this.prisma.workflowDefinition.create({
        data: {
          tenantId,
          lifecycleId: body.lifecycleId,
          name: body.name,
          description: body.description,
        },
      });
    }

    const latest = await this.prisma.workflowVersion.findFirst({
      where: { definitionId: def.id, state: 'draft' },
      orderBy: { version: 'desc' },
    });

    if (latest) {
      return this.prisma.workflowVersion.update({
        where: { id: latest.id },
        data: { draftJson: body.draft as unknown as Prisma.InputJsonValue },
      });
    }

    const maxVersion = await this.prisma.workflowVersion.aggregate({
      where: { definitionId: def.id },
      _max: { version: true },
    });
    const nextVersion = (maxVersion._max.version ?? 0) + 1;

    return this.prisma.workflowVersion.create({
      data: {
        tenantId,
        definitionId: def.id,
        version: nextVersion,
        state: 'draft',
        draftJson: body.draft as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async publish(tenantId: string, definitionId: string, body: { versionId: string; expectedVersion: number; actorId?: string }) {
    const version = await this.prisma.workflowVersion.findFirst({
      where: { id: body.versionId, tenantId, definitionId },
    });
    if (!version) throw new NotFoundException('Workflow version not found');
    if (version.expectedVersion !== body.expectedVersion) {
      throw new ConflictException('Version conflict — refresh and retry publish');
    }

    const fromVersion = version.version;
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.workflowVersion.updateMany({
        where: { definitionId, state: 'published' },
        data: { state: 'archived' },
      });
      const pub = await tx.workflowVersion.update({
        where: { id: version.id },
        data: {
          state: 'published',
          publishedAt: new Date(),
          publishedBy: body.actorId,
          expectedVersion: body.expectedVersion + 1,
        },
      });
      await tx.workflowPublishLog.create({
        data: {
          tenantId,
          definitionId,
          versionId: version.id,
          fromVersion,
          toVersion: fromVersion,
          action: 'publish',
          actorId: body.actorId,
        },
      });
      return pub;
    });

    await this.platformEvents.record({
      tenantId,
      eventName: HospitalPlatformEvents.workflowConfig.published,
      actorId: body.actorId,
      resourceType: 'workflow_version',
      resourceId: updated.id,
      payload: { definitionId, version: updated.version },
    });

    return updated;
  }

  async rollback(tenantId: string, definitionId: string, body: { toVersion: number; actorId?: string }) {
    const target = await this.prisma.workflowVersion.findFirst({
      where: { tenantId, definitionId, version: body.toVersion },
    });
    if (!target) throw new NotFoundException('Target version not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.workflowVersion.updateMany({
        where: { definitionId, state: 'published' },
        data: { state: 'archived' },
      });
      const pub = await tx.workflowVersion.update({
        where: { id: target.id },
        data: { state: 'published', publishedAt: new Date(), publishedBy: body.actorId },
      });
      await tx.workflowPublishLog.create({
        data: {
          tenantId,
          definitionId,
          versionId: target.id,
          fromVersion: body.toVersion,
          toVersion: body.toVersion,
          action: 'rollback',
          actorId: body.actorId,
        },
      });
      return pub;
    });

    await this.platformEvents.record({
      tenantId,
      eventName: HospitalPlatformEvents.workflowConfig.rolledBack,
      actorId: body.actorId,
      resourceType: 'workflow_version',
      resourceId: updated.id,
      payload: { definitionId, version: body.toVersion },
    });

    return updated;
  }

  async setBranchOverride(
    tenantId: string,
    branchId: string,
    lifecycleId: string,
    workflowVersionId: string,
    overrideJson: Record<string, unknown>,
  ) {
    return this.prisma.workflowBranchOverride.upsert({
      where: { tenantId_branchId_lifecycleId: { tenantId, branchId, lifecycleId } },
      create: {
        tenantId,
        branchId,
        lifecycleId,
        workflowVersionId,
        overrideJson: overrideJson as Prisma.InputJsonValue,
      },
      update: { workflowVersionId, overrideJson: overrideJson as Prisma.InputJsonValue },
    });
  }

  async getBranchOverrideMerge(tenantId: string, branchId: string, lifecycleId: string) {
    const row = await this.prisma.workflowBranchOverride.findUnique({
      where: { tenantId_branchId_lifecycleId: { tenantId, branchId, lifecycleId } },
    });
    if (!row) return null;
    return row.overrideJson as Record<string, unknown>;
  }

  async cloneTemplate(tenantId: string, sourceLifecycleId: string, targetLifecycleId: string, name: string) {
    const source = await this.prisma.workflowDefinition.findUnique({
      where: { tenantId_lifecycleId: { tenantId, lifecycleId: sourceLifecycleId } },
      include: { versions: { where: { state: 'published' }, orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!source?.versions[0]) throw new NotFoundException('No published source workflow');
    return this.upsertDraft(tenantId, {
      lifecycleId: targetLifecycleId,
      name,
      draft: source.versions[0].draftJson as WorkflowDefinitionDraft,
    });
  }
}
