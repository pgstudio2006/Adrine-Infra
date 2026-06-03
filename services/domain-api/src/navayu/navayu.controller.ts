import { Controller, Get, Headers, Query, Req } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { NavayuService } from './navayu.service';

@ApiTags('navayu')
@ApiSecurity('tenant')
@Controller('navayu')
@ApiHeader({ name: 'x-tenant-id', required: true })
export class NavayuController {
  constructor(private readonly navayu: NavayuService) {}

  @Get('protocols')
  protocols() {
    return this.navayu.getProtocols();
  }

  @Get('counsellor-queue')
  counsellorQueue(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId ?? 'tenant_dev';
    return this.navayu.listCounsellorQueue(
      tenantId,
      queryBranchId ?? branchId ?? 'branch_main',
    );
  }
}
