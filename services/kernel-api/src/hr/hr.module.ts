import { Module } from '@nestjs/common';
import { GovernanceModule } from '../governance/governance.module';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';

@Module({
  imports: [GovernanceModule],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
