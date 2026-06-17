import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { resolveRequestBranchId } from '../tenant/branch.util';
import { CrmService } from './crm.service';

@ApiTags('crm')
@ApiSecurity('tenant')
@Controller('crm')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  private tenant(req: Request) {
    return (req as RequestWithTenant).tenantId!;
  }

  private branch(req: Request, queryBranch?: string) {
    return resolveRequestBranchId(req as RequestWithTenant, queryBranch);
  }

  @Get('summary')
  summary(@Req() req: Request, @Query('branchId') branchId?: string) {
    const tenantId = this.tenant(req);
    const bid = this.branch(req, branchId);
    return this.crm.summary(tenantId, bid);
  }

  @Get('leads')
  listLeads(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('stage') stage?: string,
    @Query('opdVisitId') opdVisitId?: string,
  ) {
    return this.crm.listLeads(this.tenant(req), this.branch(req, branchId), stage, opdVisitId);
  }

  @Post('leads')
  createLead(
    @Req() req: Request,
    @Query('branchId') branchId: string | undefined,
    @Body()
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
    return this.crm.createLead(this.tenant(req), this.branch(req, branchId), body);
  }

  @Patch('leads/:id')
  updateLead(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
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
    return this.crm.updateLead(this.tenant(req), id, body);
  }

  @Get('campaigns')
  listCampaigns(@Req() req: Request, @Query('branchId') branchId?: string) {
    return this.crm.listCampaigns(this.tenant(req), this.branch(req, branchId));
  }

  @Post('campaigns')
  createCampaign(
    @Req() req: Request,
    @Query('branchId') branchId: string | undefined,
    @Body()
    body: {
      name: string;
      segment?: string;
      channel?: string;
      status?: string;
      reachCount?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.crm.createCampaign(this.tenant(req), this.branch(req, branchId), body);
  }

  @Patch('campaigns/:id')
  updateCampaign(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: Partial<{ status: string; reachCount: number; segment: string; channel: string }>,
  ) {
    return this.crm.updateCampaign(this.tenant(req), id, body);
  }

  @Get('lifecycle')
  @ApiOperation({ summary: 'List patient lifecycle touchpoints' })
  listLifecycle(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.crm.listLifecycle(this.tenant(req), this.branch(req, branchId), patientId);
  }

  @Post('lifecycle')
  recordLifecycle(
    @Req() req: Request,
    @Query('branchId') branchId: string | undefined,
    @Body()
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
    return this.crm.recordLifecycle(this.tenant(req), this.branch(req, branchId), body);
  }

  // ── Follow-ups ──

  @Get('follow-ups')
  listFollowUps(@Req() req: Request, @Query('branchId') branchId?: string, @Query('status') status?: string) {
    return this.crm.listFollowUps(this.tenant(req), this.branch(req, branchId), status);
  }

  @Post('follow-ups')
  createFollowUp(
    @Req() req: Request, @Query('branchId') branchId: string | undefined,
    @Body() body: { leadId?: string; patientId?: string; patientName: string; phone?: string; assignedTo?: string; followUpType?: string; scheduledAt: string; notes?: string; priority?: string },
  ) {
    return this.crm.createFollowUp(this.tenant(req), this.branch(req, branchId), body);
  }

  @Patch('follow-ups/:id')
  updateFollowUp(
    @Req() req: Request, @Param('id') id: string,
    @Body() body: Partial<{ status: string; outcome: string; notes: string; completedAt: string; missedAt: string }>,
  ) {
    return this.crm.updateFollowUp(this.tenant(req), id, body);
  }

  // ── Packages ──

  @Get('packages')
  listPackages(@Req() req: Request, @Query('branchId') branchId?: string) {
    return this.crm.listPackages(this.tenant(req), this.branch(req, branchId));
  }

  @Post('packages')
  createPackage(
    @Req() req: Request, @Query('branchId') branchId: string | undefined,
    @Body() body: { name: string; category?: string; description?: string; basePriceCents?: number; components?: unknown },
  ) {
    return this.crm.createPackage(this.tenant(req), this.branch(req, branchId), body);
  }

  @Patch('packages/:id')
  updatePackage(
    @Req() req: Request, @Param('id') id: string,
    @Body() body: Partial<{ name: string; isActive: boolean; basePriceCents: number; description: string }>,
  ) {
    return this.crm.updatePackage(this.tenant(req), id, body);
  }

  @Get('proposals')
  listProposals(@Req() req: Request, @Query('branchId') branchId?: string, @Query('status') status?: string) {
    return this.crm.listProposals(this.tenant(req), this.branch(req, branchId), status);
  }

  @Post('proposals')
  createProposal(
    @Req() req: Request, @Query('branchId') branchId: string | undefined,
    @Body() body: { leadId?: string; patientId?: string; patientName: string; packageId?: string; packageName: string; proposedPriceCents?: number; counsellorLabel?: string; notes?: string },
  ) {
    return this.crm.createProposal(this.tenant(req), this.branch(req, branchId), body);
  }

  @Patch('proposals/:id')
  updateProposal(
    @Req() req: Request, @Param('id') id: string,
    @Body() body: Partial<{ status: string; notes: string; convertedAt: string }>,
  ) {
    return this.crm.updateProposal(this.tenant(req), id, body);
  }

  // ── Referrals ──

  @Get('referrals')
  listReferrals(@Req() req: Request, @Query('branchId') branchId?: string, @Query('referralType') referralType?: string) {
    return this.crm.listReferrals(this.tenant(req), this.branch(req, branchId), referralType);
  }

  @Post('referrals')
  createReferral(
    @Req() req: Request, @Query('branchId') branchId: string | undefined,
    @Body() body: { patientId?: string; patientName: string; referralType?: string; referringDoctor?: string; referringHospital?: string; referralSource?: string; specialty?: string; notes?: string },
  ) {
    return this.crm.createReferral(this.tenant(req), this.branch(req, branchId), body);
  }

  @Patch('referrals/:id')
  updateReferral(
    @Req() req: Request, @Param('id') id: string,
    @Body() body: Partial<{ status: string; convertedToLead: boolean; leadId: string; notes: string }>,
  ) {
    return this.crm.updateReferral(this.tenant(req), id, body);
  }

  // ── Tasks ──

  @Get('tasks')
  listTasks(@Req() req: Request, @Query('branchId') branchId?: string, @Query('status') status?: string, @Query('assignedTo') assignedTo?: string) {
    return this.crm.listTasks(this.tenant(req), this.branch(req, branchId), status, assignedTo);
  }

  @Post('tasks')
  createTask(
    @Req() req: Request, @Query('branchId') branchId: string | undefined,
    @Body() body: { leadId?: string; patientName?: string; assignedTo?: string; taskType?: string; title: string; description?: string; priority?: string; dueAt?: string },
  ) {
    return this.crm.createTask(this.tenant(req), this.branch(req, branchId), body);
  }

  @Patch('tasks/:id')
  updateTask(
    @Req() req: Request, @Param('id') id: string,
    @Body() body: Partial<{ status: string; completedAt: string; notes: string }>,
  ) {
    return this.crm.updateTask(this.tenant(req), id, body);
  }
}
