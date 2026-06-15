import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { TwentyCrmSyncService } from './twenty-crm-sync.service';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBusService,
    private readonly twentySync: TwentyCrmSyncService,
  ) {}

  listLeads(tenantId: string, branchId: string, stage?: string, opdVisitId?: string) {
    return this.prisma.crmLead.findMany({
      where: {
        tenantId,
        branchId,
        ...(stage ? { stage } : {}),
        ...(opdVisitId ? { opdVisitId } : {}),
      },
      include: { patient: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createLead(
    tenantId: string,
    branchId: string,
    body: {
      patientId?: string;
      opdVisitId?: string;
      fullName: string;
      phone?: string;
      email?: string;
      stage?: string;
      specialty?: string;
      packageName?: string;
      ownerLabel?: string;
      channel?: string;
      valueCents?: number;
      priority?: string;
      status?: string;
      notes?: string;
    },
  ) {
    const lead = await this.prisma.crmLead.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        opdVisitId: body.opdVisitId,
        fullName: body.fullName,
        phone: body.phone,
        email: body.email,
        stage: body.stage ?? 'new_inquiry',
        specialty: body.specialty,
        packageName: body.packageName,
        ownerLabel: body.ownerLabel,
        channel: body.channel,
        valueCents: body.valueCents,
        priority: body.priority ?? 'medium',
        status: body.status ?? 'open',
        notes: body.notes,
      },
      include: { patient: true },
    });
    this.events.emit('adrine.crm.lead.created', tenantId, { leadId: lead.id });
    void this.twentySync.syncLead({
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      channel: body.channel,
      specialty: body.specialty,
      stage: body.stage,
      notes: body.notes,
      opdVisitId: body.opdVisitId,
      patientId: body.patientId,
    });
    return lead;
  }

  async updateLead(
    tenantId: string,
    id: string,
    body: Partial<{
      stage: string;
      status: string;
      ownerLabel: string;
      priority: string;
      notes: string;
      patientId: string;
      opdVisitId: string;
    }>,
  ) {
    const existing = await this.prisma.crmLead.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Lead not found');
    return this.prisma.crmLead.update({
      where: { id },
      data: body,
      include: { patient: true },
    });
  }

  listCampaigns(tenantId: string, branchId: string) {
    return this.prisma.crmCampaign.findMany({
      where: { tenantId, branchId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createCampaign(
    tenantId: string,
    branchId: string,
    body: {
      name: string;
      segment?: string;
      channel?: string;
      status?: string;
      reachCount?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    const campaign = await this.prisma.crmCampaign.create({
      data: {
        tenantId,
        branchId,
        name: body.name,
        segment: body.segment,
        channel: body.channel,
        status: body.status ?? 'active',
        reachCount: body.reachCount ?? 0,
        metadata: body.metadata as object | undefined,
      },
    });
    this.events.emit('adrine.crm.campaign.created', tenantId, { campaignId: campaign.id });
    return campaign;
  }

  async updateCampaign(
    tenantId: string,
    id: string,
    body: Partial<{ status: string; reachCount: number; segment: string; channel: string }>,
  ) {
    const existing = await this.prisma.crmCampaign.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Campaign not found');
    return this.prisma.crmCampaign.update({ where: { id }, data: body });
  }

  listLifecycle(tenantId: string, branchId: string, patientId?: string) {
    return this.prisma.crmLifecycleEvent.findMany({
      where: {
        tenantId,
        branchId,
        ...(patientId ? { patientId } : {}),
      },
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async recordLifecycle(
    tenantId: string,
    branchId: string,
    body: {
      patientId: string;
      eventType: string;
      journey?: string;
      ownerLabel?: string;
      riskLevel?: string;
      nextStep?: string;
      detail?: string;
    },
  ) {
    const event = await this.prisma.crmLifecycleEvent.create({
      data: {
        tenantId,
        branchId,
        patientId: body.patientId,
        eventType: body.eventType,
        journey: body.journey,
        ownerLabel: body.ownerLabel,
        riskLevel: body.riskLevel,
        nextStep: body.nextStep,
        detail: body.detail,
      },
      include: { patient: true },
    });
    this.events.emit('adrine.crm.lifecycle.recorded', tenantId, {
      lifecycleId: event.id,
      patientId: body.patientId,
    });
    return event;
  }

  async summary(tenantId: string, branchId: string) {
    const [leads, campaigns, lifecycle] = await Promise.all([
      this.prisma.crmLead.groupBy({
        by: ['stage'],
        where: { tenantId, branchId, status: 'open' },
        _count: { _all: true },
      }),
      this.prisma.crmCampaign.findMany({
        where: { tenantId, branchId, status: 'active' },
        take: 5,
        orderBy: { reachCount: 'desc' },
      }),
      this.prisma.crmLifecycleEvent.count({
        where: { tenantId, branchId, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      }),
    ]);
    const openLeads = await this.prisma.crmLead.count({
      where: { tenantId, branchId, status: 'open' },
    });
    return { openLeads, leadsByStage: leads, activeCampaigns: campaigns, lifecycleEvents30d: lifecycle };
  }
}
