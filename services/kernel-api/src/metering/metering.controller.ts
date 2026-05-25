import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { MeteringService } from './metering.service';

@ApiTags('metering')
@Controller('metering')
export class MeteringController {
  constructor(private readonly metering: MeteringService) {}

  @Post('usage')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  record(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      metric: string;
      quantity?: number;
      resourceId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.metering.record({
      tenantId: tenantId ?? 'tenant_dev',
      branchId,
      ...body,
    });
  }
}
