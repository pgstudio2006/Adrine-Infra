import { Controller, Get, Headers } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ScaleReadinessService } from './scale-readiness.service';

@ApiTags('scale')
@Controller('scale')
export class ScaleController {
  constructor(private readonly scale: ScaleReadinessService) {}

  @Get('tenant-metrics')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  tenantMetrics(@Headers('x-tenant-id') tenantId: string) {
    return this.scale.tenantMetrics(tenantId ?? 'tenant_dev');
  }

  @Get('health')
  health() {
    return this.scale.health();
  }
}
