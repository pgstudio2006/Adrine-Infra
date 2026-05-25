import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { OrganizationGovernanceService } from './organization-governance.service';
import { StaffGovernanceService } from './staff-governance.service';

@Module({
  controllers: [GovernanceController],
  providers: [OrganizationGovernanceService, StaffGovernanceService],
  exports: [OrganizationGovernanceService, StaffGovernanceService],
})
export class GovernanceModule {}
