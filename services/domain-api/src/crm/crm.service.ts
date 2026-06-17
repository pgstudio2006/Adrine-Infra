import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { TwentyCrmSyncService } from './twenty-crm-sync.service';

type FollowUpBody = {
  leadId?: string;
  patientId?: string;
  patientName: string;
  phone?: string;
  assignedTo?: string;
  followUpType?: string;
  scheduledAt: string;
  status?: string;
  outcome?: string;
  notes?: string;
  priority?: string;
};

type PackageBody = {
  name: string;
  category?: string;
  description?: string;
  basePriceCents?: number;
  components?: unknown;
};

type ProposalBody = {
  leadId?: string;
  patientId?: string;
  patientName: string;
  packageId?: string;
  packageName: string;
  proposedPriceCents?: number;
  counsellorLabel?: string;
  notes?: string;
};

type ReferralBody = {
  patientId?: string;
  patientName: string;
  referralType?: string;
  referringDoctor?: string;
  referringHospital?: string;
  referralSource?: string;
  specialty?: string;
  notes?: string;
};

type TaskBody = {
  leadId?: string;
  patientName?: string;
  assignedTo?: string;
  taskType?: string;
  title: string;
  description?: string;
  priority?: string;
  dueAt?: string;
};

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
    const [leads, campaigns, lifecycle, followUps, proposals, referrals, tasks] = await Promise.all([
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
      this.prisma.crmFollowUp.count({
        where: { tenantId, branchId, status: 'scheduled' },
      }),
      this.prisma.crmPackageProposal.count({
        where: { tenantId, branchId },
      }),
      this.prisma.crmReferral.count({
        where: { tenantId, branchId },
      }),
      this.prisma.crmTask.count({
        where: { tenantId, branchId, status: 'pending' },
      }),
    ]);
    const openLeads = await this.prisma.crmLead.count({
      where: { tenantId, branchId, status: 'open' },
    });
    return {
      openLeads, leadsByStage: leads, activeCampaigns: campaigns, lifecycleEvents30d: lifecycle,
      pendingFollowUps: followUps, totalProposals: proposals, totalReferrals: referrals, pendingTasks: tasks,
    };
  }

  // ── Follow-ups ──

  listFollowUps(tenantId: string, branchId: string, status?: string) {
    return this.prisma.crmFollowUp.findMany({
      where: { tenantId, branchId, ...(status ? { status } : {}) },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
  }

  async createFollowUp(tenantId: string, branchId: string, body: FollowUpBody) {
    const fu = await this.prisma.crmFollowUp.create({
      data: {
        tenantId, branchId,
        leadId: body.leadId, patientId: body.patientId, patientName: body.patientName,
        phone: body.phone, assignedTo: body.assignedTo,
        followUpType: body.followUpType ?? 'call',
        scheduledAt: new Date(body.scheduledAt),
        status: body.status ?? 'scheduled',
        outcome: body.outcome, notes: body.notes,
        priority: body.priority ?? 'medium',
      },
    });
    this.events.emit('adrine.crm.followup.created', tenantId, { followUpId: fu.id });
    return fu;
  }

  async updateFollowUp(tenantId: string, id: string, body: Partial<{ status: string; outcome: string; notes: string; completedAt: string; missedAt: string }>) {
    const existing = await this.prisma.crmFollowUp.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Follow-up not found');
    const data: Record<string, unknown> = { ...body };
    if (body.completedAt) data.completedAt = new Date(body.completedAt);
    if (body.missedAt) data.missedAt = new Date(body.missedAt);
    return this.prisma.crmFollowUp.update({ where: { id }, data });
  }

  // ── Packages ──

  listPackages(tenantId: string, branchId: string) {
    return this.prisma.crmPackage.findMany({
      where: { tenantId, branchId, isActive: true },
      include: { proposals: { take: 5, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPackage(tenantId: string, branchId: string, body: PackageBody) {
    return this.prisma.crmPackage.create({
      data: {
        tenantId, branchId, name: body.name, category: body.category,
        description: body.description, basePriceCents: body.basePriceCents ?? 0,
        components: body.components as object | undefined,
      },
    });
  }

  async updatePackage(tenantId: string, id: string, body: Partial<{ name: string; isActive: boolean; basePriceCents: number; description: string }>) {
    const existing = await this.prisma.crmPackage.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Package not found');
    return this.prisma.crmPackage.update({ where: { id }, data: body });
  }

  listProposals(tenantId: string, branchId: string, status?: string) {
    return this.prisma.crmPackageProposal.findMany({
      where: { tenantId, branchId, ...(status ? { status } : {}) },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async createProposal(tenantId: string, branchId: string, body: ProposalBody) {
    const proposal = await this.prisma.crmPackageProposal.create({
      data: {
        tenantId, branchId, leadId: body.leadId, patientId: body.patientId,
        patientName: body.patientName, packageId: body.packageId,
        packageName: body.packageName, proposedPriceCents: body.proposedPriceCents ?? 0,
        counsellorLabel: body.counsellorLabel, notes: body.notes,
      },
      include: { package: true },
    });
    this.events.emit('adrine.crm.proposal.created', tenantId, { proposalId: proposal.id });
    return proposal;
  }

  async updateProposal(tenantId: string, id: string, body: Partial<{ status: string; notes: string; convertedAt: string }>) {
    const existing = await this.prisma.crmPackageProposal.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Proposal not found');
    const data: Record<string, unknown> = { ...body };
    if (body.convertedAt) data.convertedAt = new Date(body.convertedAt);
    return this.prisma.crmPackageProposal.update({ where: { id }, data });
  }

  // ── Referrals ──

  listReferrals(tenantId: string, branchId: string, referralType?: string) {
    return this.prisma.crmReferral.findMany({
      where: { tenantId, branchId, ...(referralType ? { referralType } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async createReferral(tenantId: string, branchId: string, body: ReferralBody) {
    return this.prisma.crmReferral.create({
      data: {
        tenantId, branchId, patientId: body.patientId, patientName: body.patientName,
        referralType: body.referralType ?? 'source',
        referringDoctor: body.referringDoctor, referringHospital: body.referringHospital,
        referralSource: body.referralSource, specialty: body.specialty, notes: body.notes,
      },
    });
  }

  async updateReferral(tenantId: string, id: string, body: Partial<{ status: string; convertedToLead: boolean; leadId: string; notes: string }>) {
    const existing = await this.prisma.crmReferral.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Referral not found');
    return this.prisma.crmReferral.update({ where: { id }, data: body });
  }

  // ── Tasks ──

  listTasks(tenantId: string, branchId: string, status?: string, assignedTo?: string) {
    return this.prisma.crmTask.findMany({
      where: {
        tenantId, branchId,
        ...(status ? { status } : {}),
        ...(assignedTo ? { assignedTo } : {}),
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
  }

  async createTask(tenantId: string, branchId: string, body: TaskBody) {
    return this.prisma.crmTask.create({
      data: {
        tenantId, branchId, leadId: body.leadId, patientName: body.patientName,
        assignedTo: body.assignedTo, taskType: body.taskType ?? 'follow_up',
        title: body.title, description: body.description,
        priority: body.priority ?? 'medium',
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      },
    });
  }

  async updateTask(tenantId: string, id: string, body: Partial<{ status: string; completedAt: string; notes: string }>) {
    const existing = await this.prisma.crmTask.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Task not found');
    const data: Record<string, unknown> = { ...body };
    if (body.completedAt) data.completedAt = new Date(body.completedAt);
    return this.prisma.crmTask.update({ where: { id }, data });
  }
}
