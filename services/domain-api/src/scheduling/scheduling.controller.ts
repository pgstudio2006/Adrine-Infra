import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { SchedulingService } from './scheduling.service';

@ApiTags('scheduling')
@ApiSecurity('tenant')
@Controller('appointments')
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Post()
  @ApiOperation({ summary: 'Book appointment' })
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
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.scheduling.book(tenantId, body);
  }

  @Get('range')
  @ApiOperation({ summary: 'List appointments in date range (tenant schedule board)' })
  listRange(
    @Req() req: Request,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    const start = from ?? new Date().toISOString();
    const end =
      to ??
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return this.scheduling.listInRange(tenantId, start, end);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'List appointments for patient' })
  list(@Req() req: Request, @Param('patientId') patientId: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.scheduling.listForPatient(tenantId, patientId);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update appointment status (cancel / complete / no-show)' })
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.scheduling.updateStatus(tenantId, id, body.status);
  }
}
