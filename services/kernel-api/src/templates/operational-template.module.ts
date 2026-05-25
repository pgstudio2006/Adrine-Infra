import { Module } from '@nestjs/common';
import { OperationalTemplateController } from './operational-template.controller';
import { OperationalTemplateService } from './operational-template.service';

@Module({
  controllers: [OperationalTemplateController],
  providers: [OperationalTemplateService],
  exports: [OperationalTemplateService],
})
export class OperationalTemplateModule {}
