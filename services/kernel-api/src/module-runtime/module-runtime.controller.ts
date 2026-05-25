import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ModuleRuntimeService } from './module-runtime.service';

@ApiTags('modules')
@Controller('modules')
export class ModuleRuntimeController {
  constructor(private readonly modules: ModuleRuntimeService) {}

  @Get('catalog')
  catalog() {
    return this.modules.listCatalog();
  }

  @Get('available')
  available() {
    return this.modules.listCatalog();
  }

  @Get('entitlements')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  entitlements(@Headers('x-tenant-id') tenantId: string) {
    return this.modules.listEntitlements(tenantId ?? 'tenant_dev');
  }

  @Post('enable')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  enable(@Headers('x-tenant-id') tenantId: string, @Body() body: { moduleCode: string }) {
    return this.modules.enable(tenantId ?? 'tenant_dev', body.moduleCode);
  }

  @Post('activate')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  activate(@Headers('x-tenant-id') tenantId: string, @Body() body: { moduleCode: string }) {
    return this.modules.enable(tenantId ?? 'tenant_dev', body.moduleCode);
  }

  @Post('disable')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  disable(@Headers('x-tenant-id') tenantId: string, @Body() body: { moduleCode: string }) {
    return this.modules.disable(tenantId ?? 'tenant_dev', body.moduleCode);
  }

  @Get('effective')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  effective(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.modules.effective(tenantId ?? 'tenant_dev', branchId);
  }

  @Post('branch-override')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  branchOverride(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { branchId: string; moduleCode: string; enabled: boolean },
  ) {
    return this.modules.setBranchOverride(
      tenantId ?? 'tenant_dev',
      body.branchId,
      body.moduleCode,
      body.enabled,
    );
  }
}
