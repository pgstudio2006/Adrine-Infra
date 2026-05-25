import { Controller, Get, Headers, Query, Req } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { BillingDeptService } from './billing-dept.service';

@ApiTags('billing-dept')
@ApiSecurity('tenant')
@Controller('billing/dept')
@ApiHeader({ name: 'x-tenant-id', required: true })
export class BillingDeptController {
  constructor(private readonly dept: BillingDeptService) {}

  @Get('dashboard')
  dashboard(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.dept.getDashboard(tenantId, queryBranchId ?? branchId ?? 'branch_main');
  }

  @Get('packages')
  packages() {
    return this.dept.getPackages();
  }

  @Get('health-plans')
  healthPlans() {
    return this.dept.getHealthPlans();
  }

  @Get('tpa-charges')
  tpaCharges() {
    return this.dept.getTpaCharges();
  }

  @Get('revenue')
  revenue(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
    @Query('days') days?: string,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.dept.getRevenue(
      tenantId,
      queryBranchId ?? branchId ?? 'branch_main',
      days ? Number(days) : 30,
    );
  }

  @Get('gst')
  gst(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
    @Query('days') days?: string,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.dept.getGstReport(
      tenantId,
      queryBranchId ?? branchId ?? 'branch_main',
      days ? Number(days) : 90,
    );
  }

  @Get('insurance')
  insurance(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.dept.getInsuranceDesk(tenantId, queryBranchId ?? branchId ?? 'branch_main');
  }

  @Get('finance')
  finance(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.dept.getFinanceDesk(tenantId, queryBranchId ?? branchId ?? 'branch_main');
  }
}
