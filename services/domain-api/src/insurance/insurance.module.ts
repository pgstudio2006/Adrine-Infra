import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { InsuranceController } from './insurance.controller';
import { InsuranceRuntimeService } from './insurance-runtime.service';

@Module({
  imports: [EventsModule],
  controllers: [InsuranceController],
  providers: [InsuranceRuntimeService],
  exports: [InsuranceRuntimeService],
})
export class InsuranceModule {}
