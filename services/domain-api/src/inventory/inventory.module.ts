import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryRuntimeService } from './inventory-runtime.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryRuntimeService],
  exports: [InventoryRuntimeService],
})
export class InventoryModule {}
