import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { OperationalCommandService } from './operational-command.service';

@ApiTags('command')
@Controller('command')
@ApiHeader({ name: 'x-tenant-id', required: true })
export class CommandController {
  constructor(private readonly command: OperationalCommandService) {}

  @Get('center/snapshot')
  snapshot(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Query('lite') lite?: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    const bid = branchId ?? headerBranchId ?? 'branch_main';
    return this.command.buildSnapshot(tenantId ?? 'tenant_dev', bid, lite === 'true');
  }
}
