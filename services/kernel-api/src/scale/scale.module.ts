import { Module } from '@nestjs/common';
import { ScaleController } from './scale.controller';
import { ScaleReadinessService } from './scale-readiness.service';

@Module({
  controllers: [ScaleController],
  providers: [ScaleReadinessService],
  exports: [ScaleReadinessService],
})
export class ScaleModule {}
