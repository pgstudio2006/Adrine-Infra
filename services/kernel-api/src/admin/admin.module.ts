import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { TenantAdministrationService } from './tenant-administration.service';

@Module({
  controllers: [AdminController],
  providers: [TenantAdministrationService],
  exports: [TenantAdministrationService],
})
export class AdminModule {}
