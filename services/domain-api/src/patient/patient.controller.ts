import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { OpdService } from '../opd/opd.service';
import { PatientService } from './patient.service';

@ApiTags('patients')
@ApiSecurity('tenant')
@Controller('patients')
export class PatientController {
  constructor(
    private readonly patients: PatientService,
    private readonly opd: OpdService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create patient' })
  create(@Req() req: Request, @Body() body: { fullName: string; mrn?: string; dob?: string }) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.patients.create(tenantId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List patients' })
  list(@Req() req: Request) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.patients.list(tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search patients by name or MRN' })
  search(@Req() req: Request, @Query('q') q?: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.patients.search(tenantId, q ?? '');
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Patient clinical timeline (visits, intake, transitions)' })
  timeline(@Req() req: Request, @Param('id') id: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.opd.getPatientTimeline(tenantId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient' })
  get(@Req() req: Request, @Param('id') id: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.patients.get(tenantId, id);
  }
}
