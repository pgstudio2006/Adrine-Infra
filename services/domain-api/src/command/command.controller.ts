import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { resolveRequestBranchId, resolveRequestTenantId } from '../tenant/branch.util';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { OperationalCommandService } from './operational-command.service';

@ApiTags('command')
@Controller('command')
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-branch-id', required: true })
export class CommandController {
  constructor(private readonly command: OperationalCommandService) {}

  @Get('center/snapshot')
  snapshot(@Req() req: Request, @Query('branchId') branchId?: string, @Query('lite') lite?: string) {
    const tenantId = resolveRequestTenantId(req as RequestWithTenant);
    const bid = resolveRequestBranchId(req as RequestWithTenant, branchId);
    return this.command.buildSnapshot(tenantId, bid, lite === 'true');
  }
}
