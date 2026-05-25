import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { FinancialOperationsService } from './financial-operations.service';

@ApiTags('finance')
@Controller('finance')
@ApiHeader({ name: 'x-tenant-id', required: true })
export class FinanceController {
  constructor(private readonly finance: FinancialOperationsService) {}

  @Get('operations/live')
  live(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    return this.finance.getLiveOperations(tenantId ?? 'tenant_dev', branchId ?? headerBranchId ?? 'branch_main');
  }
}
