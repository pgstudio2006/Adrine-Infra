import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HrService } from './hr.service';

@ApiTags('hr')
@Controller('hr')
export class HrController {
  constructor(private readonly hr: HrService) {}

  @Get('staff')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  @ApiOperation({ summary: 'List branch staff with role assignments' })
  listStaff(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    const bid = branchId ?? headerBranchId ?? 'branch_main';
    return this.hr.listStaff(tenantId ?? 'tenant_dev', bid);
  }

  @Get('departments')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  listDepartments(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    const bid = branchId ?? headerBranchId ?? 'branch_main';
    return this.hr.listDepartments(tenantId ?? 'tenant_dev', bid);
  }

  @Get('role-templates')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  roleTemplates(@Headers('x-tenant-id') tenantId: string) {
    return this.hr.listRoleTemplates(tenantId ?? 'tenant_dev');
  }

  @Get('roles/effective')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  effectiveRoles(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Query('userId') userId: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    const bid = branchId ?? headerBranchId ?? 'branch_main';
    return this.hr.effectiveRoles(tenantId ?? 'tenant_dev', bid, userId);
  }

  @Post('staff/assignments')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  assignStaff(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { branchId: string; userId: string; roleTemplateId: string; departmentCode?: string },
  ) {
    return this.hr.assignStaff(tenantId ?? 'tenant_dev', body);
  }
}
