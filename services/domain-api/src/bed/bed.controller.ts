import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { BedRuntimeService } from './bed-runtime.service';

@ApiTags('beds')
@ApiSecurity('tenant')
@Controller('beds')
export class BedController {
  constructor(private readonly beds: BedRuntimeService) {}

  @Post('units')
  createUnit(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body() body: { name: string; wardType?: string },
  ) {
    return this.beds.ensureUnit(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body.name,
      body.wardType,
    );
  }

  @Post()
  create(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body() body: { bedUnitId: string; label: string },
  ) {
    return this.beds.createBed(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Get()
  list(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
  ) {
    return this.beds.listBeds(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
    );
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.beds.getBed((req as RequestWithTenant).tenantId!, id);
  }

  @Post(':id/transition')
  transition(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: Record<string, unknown>;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
      admissionId?: string;
    },
  ) {
    return this.beds.transition((req as RequestWithTenant).tenantId!, id, body);
  }
}
