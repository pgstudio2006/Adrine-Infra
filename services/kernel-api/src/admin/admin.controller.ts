import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { TenantAdministrationService } from './tenant-administration.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: TenantAdministrationService) {}

  @Get('tenant/profile')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  profile(@Headers('x-tenant-id') tenantId: string) {
    return this.admin.getTenantProfile(tenantId ?? 'tenant_dev');
  }

  @Get('branches')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  branches(@Headers('x-tenant-id') tenantId: string) {
    return this.admin.listBranches(tenantId ?? 'tenant_dev');
  }

  @Post('branches')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  createBranch(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      code: string;
      name: string;
      timezone?: string;
      parentBranchId?: string;
      moduleFlags?: Record<string, boolean>;
    },
  ) {
    return this.admin.createBranch(tenantId ?? 'tenant_dev', body);
  }

  @Get('departments')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  departments(@Headers('x-tenant-id') tenantId: string, @Query('branchId') branchId: string) {
    return this.admin.listDepartments(tenantId ?? 'tenant_dev', branchId);
  }

  @Post('departments')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  createDepartment(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { branchId: string; code: string; name: string },
  ) {
    return this.admin.createDepartment(tenantId ?? 'tenant_dev', body);
  }
}
