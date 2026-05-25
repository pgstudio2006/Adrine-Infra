import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import type { GovernancePolicyKey } from '@adrine/hospital-operations';
import { OrganizationGovernanceService } from './organization-governance.service';
import { StaffGovernanceService } from './staff-governance.service';

@ApiTags('governance')
@Controller('governance')
export class GovernanceController {
  constructor(
    private readonly governance: OrganizationGovernanceService,
    private readonly staff: StaffGovernanceService,
  ) {}

  @Get('policies')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  listPolicies(@Headers('x-tenant-id') tenantId: string) {
    return this.governance.listPolicies(tenantId ?? 'tenant_dev');
  }

  @Post('policies')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  upsertPolicy(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { key: GovernancePolicyKey; label: string; defaultValue: Record<string, unknown> },
  ) {
    return this.governance.upsertPolicy(tenantId ?? 'tenant_dev', body);
  }

  @Get('policies/effective')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  effective(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    return this.governance.getEffectivePolicies(
      tenantId ?? 'tenant_dev',
      branchId ?? headerBranchId ?? 'branch_main',
    );
  }

  @Get('roles/effective')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  effectiveRoles(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Query('userId') userId: string,
  ) {
    return this.staff.getEffectiveRoles(tenantId ?? 'tenant_dev', branchId, userId);
  }

  @Post('staff/assignments')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  assignStaff(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { branchId: string; userId: string; roleTemplateId: string; departmentCode?: string },
  ) {
    return this.staff.assignStaff(tenantId ?? 'tenant_dev', body);
  }
}
