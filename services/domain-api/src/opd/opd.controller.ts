import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { OpdService, type OpdTransitionBody } from './opd.service';

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

  @Get('visits/:id')
  get(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.opd.getVisit(tenantId ?? 'tenant_dev', id);
  }

  @Get('visits/patient/:patientId/active')
  active(@Headers('x-tenant-id') tenantId: string, @Param('patientId') patientId: string) {
    return this.opd.getActiveForPatient(tenantId ?? 'tenant_dev', patientId);
  }

  /** Queue / consultation board for a branch (Hospital OS hydration). */
  @Get('visits/board')
  board(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string | undefined,
    @Headers('x-branch-id') headerBranch: string | undefined,
  ) {
    const bid = branchId ?? headerBranch ?? 'branch_main';
    return this.opd.listBoardVisits(tenantId ?? 'tenant_dev', bid);
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
}
