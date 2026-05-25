import { Module } from '@nestjs/common';
import { ModuleRuntimeController } from './module-runtime.controller';
import { ModuleRuntimeService } from './module-runtime.service';

@Module({
  controllers: [ModuleRuntimeController],
  providers: [ModuleRuntimeService],
  exports: [ModuleRuntimeService],
})
export class ModuleRuntimeModule {}
