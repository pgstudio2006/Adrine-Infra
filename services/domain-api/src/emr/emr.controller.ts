import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { EmrService } from './emr.service';

@ApiTags('emr')
@ApiSecurity('tenant')
@Controller('emr/notes')
export class EmrController {
  constructor(private readonly emr: EmrService) {}

  @Post()
  @ApiOperation({ summary: 'Add clinical note' })
  addNote(@Req() req: Request, @Body() body: { encounterId: string; body: string }) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.emr.addNote(tenantId, body);
  }

  @Get('encounter/:encounterId')
  @ApiOperation({ summary: 'List notes for encounter' })
  list(@Req() req: Request, @Param('encounterId') encounterId: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.emr.listForEncounter(tenantId, encounterId);
  }
}
