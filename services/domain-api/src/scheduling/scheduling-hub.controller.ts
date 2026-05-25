import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { SchedulingService } from './scheduling.service';

@ApiTags('scheduling')
@ApiSecurity('tenant')
@Controller('scheduling')
export class SchedulingHubController {
  constructor(private readonly scheduling: SchedulingService) {}

  private tenant(req: Request) {
    return (req as RequestWithTenant).tenantId!;
  }

  private branch(req: Request, queryBranch?: string) {
    return queryBranch ?? req.header('x-branch-id') ?? 'branch_main';
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Book appointment (central scheduling)' })
  book(
    @Req() req: Request,
    @Body()
    body: {
      patientId: string;
      startAt: string;
      endAt: string;
      resourceLabel: string;
      status?: string;
    },
  ) {
    return this.scheduling.book(this.tenant(req), body);
  }

  @Get('appointments/range')
  listRange(
    @Req() req: Request,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const tenantId = this.tenant(req);
    const start = from ?? new Date().toISOString();
    const end =
      to ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return this.scheduling.listInRange(tenantId, start, end);
  }

  @Get('appointments/patient/:patientId')
  listForPatient(@Req() req: Request, @Param('patientId') patientId: string) {
    return this.scheduling.listForPatient(this.tenant(req), patientId);
  }

  @Post('appointments/:id/status')
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.scheduling.updateStatus(this.tenant(req), id, body.status);
  }

  @Get('resources')
  listResources(@Req() req: Request, @Query('branchId') branchId?: string) {
    return this.scheduling.listResources(this.tenant(req), this.branch(req, branchId));
  }

  @Post('resources')
  upsertResource(
    @Req() req: Request,
    @Query('branchId') branchId: string | undefined,
    @Body()
    body: {
      code: string;
      label: string;
      resourceType?: string;
      department?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const bid = this.branch(req, branchId);
    return this.scheduling.upsertResource(this.tenant(req), bid, body);
  }

  @Get('waitlist')
  listWaitlist(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
  ) {
    return this.scheduling.listWaitlist(this.tenant(req), this.branch(req, branchId), status);
  }

  @Post('waitlist')
  enqueue(
    @Req() req: Request,
    @Query('branchId') branchId: string | undefined,
    @Body()
    body: {
      patientId: string;
      resourceLabel: string;
      preferredStart?: string;
      priority?: string;
      notes?: string;
    },
  ) {
    return this.scheduling.enqueueWaitlist(this.tenant(req), this.branch(req, branchId), body);
  }

  @Post('waitlist/:id/promote')
  promote(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { appointmentId: string; status?: string },
  ) {
    return this.scheduling.promoteWaitlist(this.tenant(req), id, body);
  }
}
