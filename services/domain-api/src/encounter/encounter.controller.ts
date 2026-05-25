import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { EncounterService } from './encounter.service';

@ApiTags('encounters')
@ApiSecurity('tenant')
@Controller('encounters')
export class EncounterController {
  constructor(private readonly encounters: EncounterService) {}

  @Post()
  @ApiOperation({ summary: 'Create encounter' })
  create(
    @Req() req: Request,
    @Body() body: { patientId: string; type: string; status?: string },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.encounters.create(tenantId, body);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'List encounters for patient' })
  listForPatient(@Req() req: Request, @Param('patientId') patientId: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.encounters.listForPatient(tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get encounter' })
  get(@Req() req: Request, @Param('id') id: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.encounters.get(tenantId, id);
  }
}
