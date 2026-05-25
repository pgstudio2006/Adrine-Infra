import { Controller, Get, Headers, Param } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { OrgService } from './org.service';

@ApiTags('org')
@Controller('org')
export class OrgController {
  constructor(private readonly org: OrgService) {}

  @Get('hierarchy')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  hierarchy(@Headers('x-tenant-id') tenantId: string) {
    return this.org.getHierarchy(tenantId ?? 'tenant_dev');
  }

  @Get('branches/:branchId/config')
  branchConfig(
    @Headers('x-tenant-id') tenantId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.org.getBranchConfig(tenantId ?? 'tenant_dev', branchId);
  }
}
