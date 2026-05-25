import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { MigrationService } from './migration.service';

@ApiTags('migration')
@Controller('migration')
export class MigrationController {
  constructor(private readonly migration: MigrationService) {}

  @Post('jobs')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  create(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: { type: string; branchId?: string; fileName?: string; csv?: string },
  ) {
    return this.migration.createJob(tenantId ?? 'tenant_dev', body);
  }

  @Post('jobs/:id/preview')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  preview(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.migration.preview(tenantId ?? 'tenant_dev', id);
  }

  @Post('jobs/:id/execute')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  execute(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.migration.execute(tenantId ?? 'tenant_dev', id);
  }

  @Post('jobs/:id/rollback')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  rollback(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.migration.rollback(tenantId ?? 'tenant_dev', id);
  }
}
