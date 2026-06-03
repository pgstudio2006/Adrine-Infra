import { Module } from '@nestjs/common';
import { NavayuController } from './navayu.controller';
import { NavayuService } from './navayu.service';

@Module({
  controllers: [NavayuController],
  providers: [NavayuService],
  exports: [NavayuService],
})
export class NavayuModule {}
