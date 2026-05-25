import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DeepHealthController } from './deep-health.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, DeepHealthController],
})
export class HealthModule {}
