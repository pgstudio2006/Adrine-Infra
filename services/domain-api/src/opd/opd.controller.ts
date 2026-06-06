import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { OpdService, type MskTransitionBody, type OpdTransitionBody } from './opd.service';

@ApiTags('opd')
@Controller('opd')
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-branch-id', required: false })
export class OpdController {
  constructor(private readonly opd: OpdService) {}

  @Post('visits')
  create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-branch-id') branchId: string | undefined,
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
    return this.opd.createVisit(tenantId ?? 'tenant_dev', branchId ?? 'branch_main', body);
  }

  /** Alias path — never shadowed by visits/:id (legacy bug treated id=board). */
  @Get('board/visits')
  boardAlias(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string | undefined,
    @Headers('x-branch-id') headerBranch: string | undefined,
  ) {
    const bid = branchId ?? headerBranch ?? 'branch_main';
    return this.opd.listBoardVisits(tenantId ?? 'tenant_dev', bid);
  }

  /** Queue / consultation board for a branch (Hospital OS hydration). Must be before visits/:id. */
  @Get('visits/board')
  board(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string | undefined,
    @Headers('x-branch-id') headerBranch: string | undefined,
  ) {
    const bid = branchId ?? headerBranch ?? 'branch_main';
    return this.opd.listBoardVisits(tenantId ?? 'tenant_dev', bid);
  }

  @Get('visits/patient/:patientId/active')
  active(@Headers('x-tenant-id') tenantId: string, @Param('patientId') patientId: string) {
    return this.opd.getActiveForPatient(tenantId ?? 'tenant_dev', patientId);
  }

  /** Patient timeline — visits, MSK milestones, OPD transitions. */
  @Get('visits/patient/:patientId/timeline')
  patientTimeline(
    @Headers('x-tenant-id') tenantId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.opd.getPatientTimeline(tenantId ?? 'tenant_dev', patientId);
  }

  @Get('visits/:id')
  get(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.opd.getVisit(tenantId ?? 'tenant_dev', id);
  }

  @Get('visits/:id/allowed-actions')
  allowed(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Headers('x-actor-role') actorRole: string | undefined,
  ) {
    return this.opd.listAllowedActions(tenantId ?? 'tenant_dev', id, actorRole ?? 'receptionist');
  }

  @Post('visits/:id/transition')
  transition(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: OpdTransitionBody,
  ) {
    return this.opd.transition(tenantId ?? 'tenant_dev', id, body);
  }

  /** Navayu patient intake (tablet) — merges answers into visit metadata. */
  @Post('visits/:id/intake')
  intake(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      formId: string;
      version: string;
      answers: Record<string, unknown>;
    },
  ) {
    return this.opd.submitIntake(tenantId ?? 'tenant_dev', id, body);
  }

  /** Merge Navayu / visit-specific metadata without a full OPD transition. */
  @Patch('visits/:id/metadata')
  patchMetadata(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.opd.patchVisitMetadata(tenantId ?? 'tenant_dev', id, body);
  }

  @Post('visits/:id/investigations/upload')
  uploadInvestigation(
    @Headers('x-tenant-id') tenantId: string,
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
    return this.opd.uploadInvestigation(tenantId ?? 'tenant_dev', id, body);
  }

  @Post('visits/:id/ai-summary')
  aiSummary(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.opd.generateNavayuAiSummary(tenantId ?? 'tenant_dev', id, body);
  }

  /** Navayu MSK workflow — governed transitions (navayu_msk_visit lifecycle). */
  @Post('visits/:id/msk/transition')
  mskTransition(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: MskTransitionBody,
  ) {
    return this.opd.transitionMsk(tenantId ?? 'tenant_dev', id, body);
  }

  @Get('visits/:id/msk/allowed-actions')
  mskAllowed(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Headers('x-actor-role') actorRole: string | undefined,
  ) {
    return this.opd.listMskAllowedActions(tenantId ?? 'tenant_dev', id, actorRole ?? 'receptionist');
  }
}
