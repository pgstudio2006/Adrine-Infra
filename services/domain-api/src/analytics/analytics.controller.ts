import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { OperationalAnalyticsService } from './operational-analytics.service';

@ApiTags('analytics')
@Controller('analytics')
@ApiHeader({ name: 'x-tenant-id', required: true })
export class AnalyticsController {
  constructor(private readonly analytics: OperationalAnalyticsService) {}

  @Get('operational')
  operational(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Query('period') period: '24h' | '7d' | undefined,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    return this.analytics.getOperational(
      tenantId ?? 'tenant_dev',
      branchId ?? headerBranchId ?? 'branch_main',
      period ?? '24h',
    );
  }

  @Get('events')
  events(
    @Headers('x-tenant-id') tenantId: string,
    @Query('branchId') branchId: string,
    @Query('period') period: '24h' | '7d' | undefined,
    @Query('limit') limit?: string,
    @Headers('x-branch-id') headerBranchId?: string,
  ) {
    const bid = branchId ?? headerBranchId ?? 'branch_main';
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 200;
    return this.analytics.listPlatformEvents(
      tenantId ?? 'tenant_dev',
      bid,
      period ?? '24h',
      Number.isFinite(parsedLimit) ? parsedLimit : 200,
    );
  }
}
