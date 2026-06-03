import { forwardRef, Module } from '@nestjs/common';
import { OpdModule } from '../opd/opd.module';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

@Module({
  imports: [forwardRef(() => OpdModule)],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
