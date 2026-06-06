import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { resolveRequestBranchId, resolveRequestTenantId } from '../tenant/branch.util';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { OpdService, type MskTransitionBody, type OpdTransitionBody } from './opd.service';

@ApiTags('opd')
@Controller('opd')
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-branch-id', required: true })
export class OpdController {
  constructor(private readonly opd: OpdService) {}

  private tenant(req: Request) {
    return resolveRequestTenantId(req as RequestWithTenant);
  }

  private branch(req: Request, queryBranch?: string) {
    return resolveRequestBranchId(req as RequestWithTenant, queryBranch);
  }

  @Post('visits')
  create(
    @Req() req: Request,
    @Body()
    body: {
      patientId?: string;
      register?: { fullName: string; mrn?: string; dob?: string };
      department?: string;
      assignedDoctor?: string;
      actorRole?: string;
      actorId?: string;
    },
  ) {
    return this.opd.createVisit(this.tenant(req), this.branch(req), body);
  }

  /** Alias path — never shadowed by visits/:id (legacy bug treated id=board). */
  @Get('board/visits')
  boardAlias(@Req() req: Request, @Query('branchId') branchId?: string) {
    return this.opd.listBoardVisits(this.tenant(req), this.branch(req, branchId));
  }

  /** Queue / consultation board for a branch (Hospital OS hydration). Must be before visits/:id. */
  @Get('visits/board')
  board(@Req() req: Request, @Query('branchId') branchId?: string) {
    return this.opd.listBoardVisits(this.tenant(req), this.branch(req, branchId));
  }

  @Get('visits/patient/:patientId/active')
  active(@Req() req: Request, @Param('patientId') patientId: string) {
    return this.opd.getActiveForPatient(this.tenant(req), patientId);
  }

  /** Patient timeline — visits, MSK milestones, OPD transitions. */
  @Get('visits/patient/:patientId/timeline')
  patientTimeline(@Req() req: Request, @Param('patientId') patientId: string) {
    return this.opd.getPatientTimeline(this.tenant(req), patientId);
  }

  @Get('visits/:id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.opd.getVisit(this.tenant(req), id);
  }

  @Get('visits/:id/allowed-actions')
  allowed(
    @Req() req: Request,
    @Param('id') id: string,
    @Headers('x-actor-role') actorRole: string | undefined,
  ) {
    return this.opd.listAllowedActions(this.tenant(req), id, actorRole ?? 'receptionist');
  }

  @Post('visits/:id/transition')
  transition(@Req() req: Request, @Param('id') id: string, @Body() body: OpdTransitionBody) {
    return this.opd.transition(this.tenant(req), id, body);
  }

  /** Navayu patient intake (tablet) — merges answers into visit metadata. */
  @Post('visits/:id/intake')
  intake(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      formId: string;
      version: string;
      answers: Record<string, unknown>;
    },
  ) {
    return this.opd.submitIntake(this.tenant(req), id, body);
  }

  /** Merge Navayu / visit-specific metadata without a full OPD transition. */
  @Patch('visits/:id/metadata')
  patchMetadata(@Req() req: Request, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.opd.patchVisitMetadata(this.tenant(req), id, body);
  }

  @Post('visits/:id/investigations/upload')
  uploadInvestigation(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      fieldId: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataBase64?: string;
    },
  ) {
    return this.opd.uploadInvestigation(this.tenant(req), id, body);
  }

  @Post('visits/:id/ai-summary')
  aiSummary(@Req() req: Request, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.opd.generateNavayuAiSummary(this.tenant(req), id, body);
  }

  /** Navayu MSK workflow — governed transitions (navayu_msk_visit lifecycle). */
  @Post('visits/:id/msk/transition')
  mskTransition(@Req() req: Request, @Param('id') id: string, @Body() body: MskTransitionBody) {
    return this.opd.transitionMsk(this.tenant(req), id, body);
  }

  @Get('visits/:id/msk/allowed-actions')
  mskAllowed(
    @Req() req: Request,
    @Param('id') id: string,
    @Headers('x-actor-role') actorRole: string | undefined,
  ) {
    return this.opd.listMskAllowedActions(this.tenant(req), id, actorRole ?? 'receptionist');
  }

  /** Navayu counsellor billing — close encounter and advance OPD to billing_pending. */
  @Post('visits/:id/navayu/billing-handoff')
  navayuBillingHandoff(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { actorRole?: string; actorId?: string },
  ) {
    return this.opd.ensureNavayuBillingHandoff(
      this.tenant(req),
      id,
      body.actorRole ?? 'billing',
      body.actorId,
    );
  }
}
