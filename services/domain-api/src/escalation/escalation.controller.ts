import { Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { OperationalEscalationService } from './operational-escalation.service';

@ApiTags('escalations')
@Controller('escalations')
@ApiHeader({ name: 'x-tenant-id', required: true })
export class EscalationController {
  constructor(private readonly escalations: OperationalEscalationService) {}

  @Get()
  list(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    return this.escalations.listOpen(tenantId ?? 'tenant_dev', branchId ?? headerBranchId ?? 'branch_main');
  }

  @Post('evaluate')
  evaluate(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    const bid = branchId ?? headerBranchId ?? 'branch_main';
    return this.escalations.evaluateFromBranch(tenantId ?? 'tenant_dev', bid);
  }

  @Post(':id/acknowledge')
  acknowledge(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.escalations.acknowledge(tenantId ?? 'tenant_dev', id);
  }

  @Post(':id/resolve')
  resolve(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.escalations.resolve(tenantId ?? 'tenant_dev', id);
  }
}
